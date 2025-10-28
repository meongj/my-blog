---
title: '[React] useEffect와 생명 주기'
date: '2025-10-28 17:10'
description: 'React의 useEffect Hook의 개념과 사용법을 알아보자. 순수 함수와 Side Effect의 차이, 의존성 배열에 따른 동작 방식, 그리고 컴포넌트 생명주기에 따른 cleanup 함수의 역할까지 정리'
section: 'React'
category: 'React'
slug: 'useEffect-생명주기'
tags: ['useEffect', '마운트', '생명주기', 'React']
image: '/images/posts/post17/useEffect.jpeg'
---

# **1. useEffect란?**

- React 컴포넌트의 side effect를 처리하는 Hook

**왜 필요한가?**

React에서 흔히 쓰이는 useEffect는 side effect(부수 효과)를 처리하기 위한 Hook이다. 근데 여기서 말하는 side effect가 과연 무엇일까?

쉽게 말하자면, 컴포넌트 렌더링 이외의 작업을 의미한다.

useEffect의 effect는 “**side effect”** 라는 함수형 프로그래밍 용어를 말한다.

side effect를 이해하기 위해서는 순수 함수를 먼저 이해해야 한다.

## 순수 함수

순수 함수는 같은 입력을 넣으면 항상 같은 결과가 나오는 함수를 말하고 다른 것에 영향을 주지 않는 함수이다.

- 자기 일에만 신경을 쓴다. 호출되기 전에 존재했던 객체나 변수를 변경하지 않는다
- 동일한 입력이 주어지면 순수 함수는 항상 동일한 결과를 반환해야한다.

```tsx
function double(number) {
  return 2 * number;
}
```

`y = 2x` 수학 공식을 생각한다면 double함수에 3가 들어가면 반환값은 항상 6이 나와야 한다. 이런 개념은 React에 기반으로 설계 되었는데 React는 작성하는 모든 컴포넌트가 순수 함수라고 가정하고, React 컴포넌트는 동일한 입력에 대해 항상 동일한 JSX를 반환해야 한다.

## Side Effect

순수 함수 조건 중 하나라도 충족하지 못한다면 Side Effect가 있는 함수이고, 함수가 외부 세계와 상호작용하는 것을 말한다.

대표적인 Side Effect 예시는 다음과 같다.

### 1. Data fetching

가장 흔한 side effect가 바로 데이터를 가져오는 fetching 예시이다.

함수 내부가 아닌, 네트워크, 파일시스템, 데이터베이스와 같은 외부 시스템에 접근해서 데이터를 요청하고 응답을 받고 같은 요펑을 여러 번 하더라도, 외부 서버나 데이터 베이스 상태가 그 사이에 변경될 수 있기 때문에 항상 동일한 결과가 보장되지 않는다.

그렇기 때문에 순수 함수의 동일한 입력에 동일한 출력 조건을 위반한다.

### 2. DOM 조작

`document.getElementById('id').innerText = '새로운 내용';`

DOM은 함수 밖에 있는 전역 상태이면서 외부 화면을 변경할 수 있기 때문에 “함수 외부의 상태를 변경”하는 Side effect가 발생한다.

### 3. 타이머 설정

자바스크립트의 `setTimeout`, `setInterval` 함수 처럼 시간에 따라 결과가 달라지고 예측 불가능해진다. 순수 함수는 “같은 입력의 항상 같은 출력”을 보장해야 하지만 타이머 설정은 함수 외부의 ‘시간’의 상태에 따라 결과에 영향을 받기 때문에 결과가 달라지게 된다.

# **2. 기본 사용법**

### 빈 배열 `[]` - 마운트 시 1번만

```tsx
useEffect(() => {
  console.log('컴포넌트 마운트');

  return () => {
    console.log('컴포넌트 언마운트');
  };
}, []); // 빈배열
```

마운트시 1번만 실행이 되고 리렌더링이 되지 않는다.

언제 쓰는가?

- 초기화 작업 : API 호출, 데이터 로딩
  - 화면에 나타날때 한 번만 데이터를 가져오고 싶을 경우
- 이벤트 등록 및 구독 : 윈도우 이벤트, Websocket, pub/sub
  - 마운트시 이벤트 등록 → 언마운트 시 제거
- 외부 라이브러리 초기화
  - 차트 라이브러리, 지도 API, 슬라이더 등
- 타이머 설정

## 의존성 있음 `[dep]` - 값 변경 시마다

```tsx
const [count, setCount] = useState(0);

useEffect(() => {
  console.log('count 변경되면 실행됨');
}, [count]); //count 의존성
```

의존성 배열의 값이 바뀔 때 마다 실행되는 작업에 많이 사용된다.

언제 쓰는가?

- 상태 변화에 따른 API 호출
- 로컬 스토리지 저장
- 상태 변화에 따른 부가 작업

## 의존성 배열 없음 - 매 렌더링마다

```tsx
useEffect(() => {
  console.log('매번 실행됨');
});
```

의존성 배열이 없는 경우 마운트시 실행되고 모든 렌더링시에도 실행이 된다

언제 쓰는가?

- 렌더링 후마다 반복적으로 화면 상태를 업데이트 할때
- 매 렌더링마다 외부 스토어나 라이브러리와 동기화 할 때

주의 할 점

- 렌더링마다 effect가 실행이 되기 때문에, API 호출이나 무거운 계산을 넣으면 성능 문제가 발생할 수 있다. 대부분의 경우 의존성 배열에 넣는 패턴을 많이 사용한다.

# 3. 생명 주기

effects는 컴포넌트와 다른 생명주기를 가지고 있다. 동기화를 시작하고 나중에 동기화를 중지하는 두가지 작업만 할 수 있다. 이게 무슨 말인가 하면, `useEffect` 는 단순히 마운트 시 실행되고 언마운트 시 정리된다가 아니라, 데이터나 props, state 변화에 맞춰 동기화를 시작하고 중지하는 역할을 한다.

```tsx
useEffect(() => {
  const connection = createConnection(serverUrl, roomId);
  connection.connect();

  return () => connection.disconnect();
}, [roomId]);
```

React 공식문서에서 가져온 코드인데 useEffect의 생명주기를 가장 잘 보여주는 예시이다. roomId가 바뀔 때마다 React가 cleanup 후 재실행 과정을 거친다는 것을 단계별로 보여주고 있다.

## React에서 일어나는 단계 (cleanup → 재실행)

<img src="/images/posts/post17/image.png" />

### 1. **컴포넌트 마운트**

컴포넌트가 처음 렌더링이 시작되면서 useEffect가 실행이 된다.

- `createConnection` → 서버 연결 객체 생성
- `connection.connect()` → 서버와 연결 시작

**cleanup 함수 준비**

`return () => connection.disconnect();`

- 나중에 roomId가 바뀌거나 컴포넌트가 언마운트 된다면 실행된다

화면엔 컴포넌트가 보이면서 서버 연결이 활성화된다.

**그렇다면 여기서 궁금해지는게 마운트와 렌더링의 차이는 무엇일까?**

쉽게 비유를 들어 설명하면, 렌더링은 설계도를 그리는 것이고 마운트는 설계도를 가지고 실제 건물을 짓는 것이다. 만약 설계도만 그리고 건물을 안 지으면 화면에 아무것도 안나오게 된다.

**렌더링 (Render)**

```tsx
function MyComponent() {
  const [count, setCount] = useState(0);

  return <div>{count}</div>;
}
```

여기서 렌더링은 그냥 `MyComponent()` 함수를 실행하는 것으로 메모리에서만 일어나며 화면에 그려지는 것과는 상관이 없는 단계이다.

렌더링시 다음과 같은 과정이 일어난다.

1.  `MyComponent()` 함수 실행
2.  `useState(0)` 실행
3.  JSX `(<div>{count}</div>)` 생성
4.  이것을 “Virtual DOM” 이라는 가상 메모리에 저장

**마운트 (Mount)**

```tsx
const div = document.createElement('div');
div.textContent = '0';

document.body.appendChild(div); // 마운트 완료
```

리액트에서 마운트는 컴포넌트가 화면에 처음으로 그려지는 시점을 말한다. 렌더링만 하고 마운트를 안한다면 화면에 아무 것도 안나오게 된다.

`const div = document.createElement('div');` : div 컴포넌트 함수가 호출되면서 Virtual DOM이 생성이 되고

`div.textContent = ‘0’` : Virtual DOM에 내용이 반영된 후

`document.body.appendChild(div);` : DOM에 실제로 반영이 되면서 화면에 표시된다 (마운트 완료)

이렇게 마운트와 렌더링을 구분한 것은 성능적으로 관련이 있다. 렌더링을 먼저 해서 메모리에 작업한 부분만 마운트를 하면 전체를 다시 그리지 않아도 되니까 속도면에서 빠르다.

### 2. **roomId 변경**

useEffect의 의존성 배열인 [roomId] 덕분에 roomId가 바뀌면 다음과 같은 과정이 일어난다.

`return () => connection.disconnect();` : cleanup 함수

React는 useEffect가 다시 실행되기 전에 이전의 effect를 정리해야지 안전하다고 판단이 되면 cleanup 함수를 먼저 실행시킨다. 그래서 기존 서버 연결을 종료하기 되고 이 후 새로운 roomId 로 createConnection → connect() 가 실행되면서 새 연결이 만들어지게 된다

만약 연결을 종료하지 않으면, 서버에 불필요한 연결이 계속 남아있게 되기 때문에 문제가 발생할 수 있다. 그래서 cleanup 함수가 이전 연결을 정리하는 역할을 해준다.

### 3. **컴포넌트 언마운트**

컴포넌트가 이제 화면에서 사라지게 된다면, React가 effect의 cleanup 함수를 호출한다.

`connection.disconnect();`

화면에서 컴포넌트는 사라지게 되고 서버 연결도 안전하게 종료된다.

<br>

---

**참고 자료**

- [https://react.dev/learn/keeping-components-pure](https://react.dev/learn/keeping-components-pure)
- [https://ko.react.dev/learn/lifecycle-of-reactive-effects](https://ko.react.dev/learn/lifecycle-of-reactive-effects)
