---
title: '개인 프로젝트 : Github actions 자동 배포 도입기'
date: '2026-02-04 17:43'
description: '현재 실제로 운영되고 있던 개인 프로젝트가 있었는데, 배포 절차를 수동으로 진행하고 있었다. 배포 할때마다 SSH로 서버에 접속해 github 소스를 pull 받고 빌드하는 과정이 번거로울 때가 많았다. 이렇게 수동으로 진행했던 배포를 자동화시켜서 실제 서비스에 적용하는 과정을 담았다.'
section: 'DevOps'
category: 'DevOps'
slug: 'Github-Actions'
tags: ['Github Actions', 'CI/CD', '자동배포']
image: '/images/posts/post25/image1.jpg'
---

# 시작 하기

현재 실제로 운영되고 있던 개인 프로젝트가 있었는데, 배포 절차를 수동으로 진행하고 있었다. 배포 할때마다 SSH로 서버에 접속해 github 소스를 pull 받고 빌드하는 과정이 번거로울 때가 많았다. 이렇게 수동으로 진행했던 배포를 자동화시켜서 실제 서비스에 적용하는 과정을 담았다.

## ☠️ **현재 문제점**

현재 배포 방식 (수동)

- 프로젝트가 끝난 후 버그라든지, 보완할 기능들을 업데이트해야할 일들이 잦아졌다.
- 이때 변경사항이 생길때 마다 매번 직접 SSH 접속 후 git pull 받아서 서버를 재시작 해줘야 했다. 처음 몇번은 할 만했지만, 이 후엔 아주 번거롭고 귀찮은 작업이었다.

그래서 github main 브랜치에 변경사항이 생길 경우 자동화 프로세스가 필요했다.

자동화 도구는 Jenkins, CircleCI, GitHub Actions 등 여러 가지가 있었는데,

예전에 네이버 부캠에서 해봤던 github action 자동화 도구가 생각났고, 프로젝트 규모도 크지 않아서 가볍게 배포할 것이라 github action으로 적용하기로 했다.

<br>

# ✍🏻 Github Action 설정 과정

이전에 github actions 배포 스크립트 만들어 본적이 있었는데 서버에서 빌드해서 배포를 했었다. 하지만 서버에서 하게되면 서버 리소스가 더 들어서 비효율적이고 더 느리다는게 흠이 었다.

그래서 GitHub Actions에서 먼저 빌드 후 서버에 전송하기로 정했다.

> 배포 과정
>
> - main 브랜치 push → GitHub Actions에서 빌드 → 빌드 결과물을 서버로 rsync → 자동 배포완료

<br>

## **Step 1: SSH 키 준비**

```tsx
# 새 SSH 키 생성 (GitHub Actions 전용)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
```

AWS 서버에 ssh-keygen 명령어로 공개키와 개인키를 키 쌍을 새로 만든다. 실행시키면 다음과 같은 키들이 생긴다.

<img src="/images/posts/post25/image.png">

```tsx
# 공개키를 authorized_keys에 추가
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# 개인키 내용 확인 (이걸 GitHub에 등록할 거예요)
cat ~/.ssh/github_actions
```

만든 공개키를 가진 사람의 접속을 허용하도록 서버에 등록해놓는다. 개인키를 cat 명령어로 출력해서 복사해둔다. GitHub에 등록할 수 있도록 준비한다.

## Step 2: GitHub Secrets 등록

셋팅하고 싶은 Github 레포지토리에 들어가서

**Settings → Secrets and variables → Actions** → **New repository secret**

<img src="/images/posts/post25/image3.png">

- LIGHTSAIL_HOST : 서버 IP 주소
- LIGHTSAIL_USER : 접속 유저명
- LIGHTSAIL_SSH_KEY : 위에서 복사한 개인키 전체(`-----BEGIN...` 부터 `-----END...` 까지)

<img src="/images/posts/post25/image4.png">

시크릿 키를 이렇게 등록해둔다.

## Step 3: 워크플로우 파일 생성

내 프로젝트 루트경로에서 `.github/workflows/deploy.yml` 파일을 만들고 다음과 같이 코드를 추가한다.

```tsx
name: Deploy to AWS Lightsail

# 언제 실행할지
on:
  push:
    branches: [main] # main 브랜치에 push 시 실행

# 작업 목록
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # 코드 가져오기
      - name: Checkout code
        uses: actions/checkout@v4
        # Node.js 설치
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      # 의존성 설치
      - name: Install dependencies
        run: npm ci
      # React 빌드
      - name: Build
        run: npm run build
      # SSH 설정
      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_KEY" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H ${{ secrets.LIGHTSAIL_HOST }} >> ~/.ssh/known_hosts
        env:
          SSH_KEY: ${{ secrets.LIGHTSAIL_SSH_KEY }}
      # 배포
      - name: Deploy to server
        run: |
          rsync -avz --delete \
            -e "ssh -i ~/.ssh/id_ed25519" \
            ./dist/ \
            ${{ secrets.LIGHTSAIL_USER }}@${{ secrets.LIGHTSAIL_HOST }}:/var/www/html/

```

매번 배포때마다 node.js를 설치하면 쓸 데 없으니, `cache: ‘npm’` 를 하게되면 캐싱 처리를 해서 시간을 줄여줄 수 있다.

<br>

**보안문제 대비**

ssh 설정시 `echo "${{ secrets.LIGHTSAIL_SSH_KEY }}" > ~/.ssh/id_ed25519` 이렇게 출력해버리면 시크릿 키가 로그에 찍혀버릴 수 도 있기 때문에 보안상 좋지 않다는 것을 claude code가 알려줬다;

```tsx
   # SSH 설정
      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_KEY" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H ${{ secrets.LIGHTSAIL_HOST }} >> ~/.ssh/known_hosts
        env:
          SSH_KEY: ${{ secrets.LIGHTSAIL_SSH_KEY }}
```

그래서 이렇게 `secrets.LIGHTSAIL_SSH_KEY` 를 SSH_KEY라는 환경 변수로 만들어서 secrets에서 가져온 값을 담아 전달하는 것으로 수정했고,

커밋하고 push 하면 Github가 알아서 인식해서 워크플로우를 실행시킨다.

## Step 4 : 서버 경로 확인

서버에서 Nginx가 서빙하는 경로를 확인해서 `/var/www/html`이 아니라면 워크플로우의 배포 경로를 수정해야 한다.

`cat /etc/nginx/sites-available/default | grep root`

<br>

## 진짜 deploy가 되는지 확인 해보자

<img src="/images/posts/post25/image5.png">

하지만 빌드가 실패 뜨는 현상 확인..🥲

### 원인 1

1. Convex 자동 생성 파일 없음

   `convex/\_generated/api`

   `convex/\_generated/dataModel`

   이 파일들은 npx convex dev 또는 npx convex generate 실행 시 자동 생성되는데, CI 환경에서는 이 명령이 실행되지 않아 파일이 없어서 문제가 된 던 것이다.
   현재 프로젝트에서 백엔드는 Convex를 사용하고 있는데, 자동화 스크립트에 Convex에 관련한 명령어가 없어서 생긴 오류 였다.

### **해결 방법 1**

그래서 추가적으로 Convex Deploy Key를 발급해야 했다.

  <img src="/images/posts/post25/image6.png">

Convex Dashboard에 들어가서 **Settings** → **Deploy Keys** 생성해 복사

마찬가지로 GitHub Secrets에 복사한 키를 등록해주었다.

### 원인 2

2. Sentry 패키지 미설치

   @sentry/react 가 package.json에 없거나 설치가 안 된 상태.
   에러 모니터링으로 추가한 sentry의 의존성 추가를 깜빡한 것이었다. 정상적으로 package.json에 의존성을 추가해서 커밋했다.

<img src="/images/posts/post25/image7.png">

이번엔 되야 되는데 또 실패한 것을 확인..😓

로그를 보니 SSH 키 인증이 실패한 오류 였다.

알고보니 github 인증키가 제대로 등록이 안됐던것 ㅎ user 키를 Ubuntu로 했는데 사실 ubuntu였던것 대소문자도 구분하니 주의해서 등록해야겠다고 깨달았다..

제대로 등록 한 후 다시 돌려보자 ^&^

<img src="/images/posts/post25/image8.png">

아까 SSH 에러는 사라졌고! 이번엔 폴더 권한 문제다

**문제 원인**

/var/www/html/ 폴더 소유자 = root
배포하는 유저 = ubuntu

ubuntu가 root 소유 폴더에 쓰기 → 권한 없음!

**해결: 서버에서 폴더 권한 변경**

Lightsail 서버에 SSH 접속해서:

`*# /var/www/html 소유자를 ubuntu로 변경*`

<img src="/images/posts/post25/image9.png">

이제 정말 되야한다…!

## 결과

<img src="/images/posts/post25/image10.png">

기다렸다 이 초록 체크 표시를 ..🙏 다행히 성공적으로 배포가 완료됐다.

이제 코드를 수정하고 나서 main 브랜체에 push만 하면 자동으로 배포된다. 처음 세팅이 오래 걸렸지만, 앞으로 배포할 때마다 코드를 직접 배포 안해줘도 되니깐 시간을 아낄 수 있어서 후련했다.
