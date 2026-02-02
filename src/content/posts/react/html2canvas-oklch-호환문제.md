---
title: 'html2canvas + oklch() 호환 문제 해결하기'
date: '2026-02-02 17:27'
description: 'html2canvas가 동작하지 않는 문제를 다루고 있습니다. 원인을 알아보고 oklch()와 hsl()의 차이점, 그리고 해결 방법을 정리했습니다.'
section: 'React'
category: 'React'
slug: 'html2canvas-oklch-호환-문제-해결하기'
tags: ['html2canvas', 'oklch', '색상모델']
image: '/images/posts/post23/image.png'
---

# 시작하기

외주 프로젝트가 끝나고 오랜만에 예전에 했던 플젝이 생각나서 들어가서 테스트 해봤는데, 갑자기 되던 기능이 오류가 나는 것을 확인..💦
요거트 볼을 저장하는 아주 핵심적인 기능이었는데 안되고 있으니 당황스러웠다.
다음과 같은 오류가 뜨면서 에러 메시지가 toast되었다.

<img src="/images/posts/post23/image2.png">
<img src="/images/posts/post23/image3.png">

## 원인

**html2canvas 라이브러리가 oklch() CSS 색상 함수를 지원하지 않음**

src/index.css에서 Tailwind CSS v4의 새로운 색상 시스템인 oklch() 형식을 사용하고 있는데, 요거트볼 저장 시 html2canvas가 DOM을 캡처하려고 할 때 이 색상 형식을 파싱하지 못해서 에러가 발생한다.

예전에 shadcn/ui 관련 의존성을 추가하고 oklch() 로 변경한 적이 있었는데 이게 문제가 됐던 것 같다. shadcn/ui의 기본 테마는 oklch() 색상 형식을 사용한다.

문제가 됐던 코드 `src/index.css`

```tsx
 --background: oklch(1 0 0);
 --foreground: oklch(0.145 0 0);
```

그래서 변경전에는 잘 작동했던 기능이 의존성 하나 추가로 안 돌아갔던 것이었다.

이래서 테스트의 중요성을 실감하게 된다..

## 해결 방법

**oklch()를 rgb()/hsl()로 변환**

```tsx
oklch(1 0 0) ->  hsl(0 0% 100%)
```

- 직관적인 밝기를 수정하는게 어렵긴 했지만 시각적으로는 별로 차이가 없다.

### `hsl() / rgb()` 와 `oklch()` 차이점

<img src="/images/posts/post23/image4.png">

https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch

RGB는 많이 들어봤을 것이다. 예전부터 많이 사용되었던 색상 모델로 빛의 삼원색인 빨강, 초록, 파랑의 혼합해서 색상을 나타낸다. 레거시한 코드를 유지보수 할때 많이 쓰였다.

<img src="/images/posts/post23/image5.png">

HSL는 RGB 이후에 등장했는데, 색조(Hue), 채도(Saturation), 밝기(Lightness)로 수학적으로 색상을 표현한다.

하지만 인간의 눈이 색상에 따라 밝기를 다르게 인지하는 차이가 있다.

그래서 최근에 나온 OKLCH는 CSS Color Level 4에서 도입된 색상 함수로, 이전에 정확하지 않았던 색상을 인간의 색상 인지에 더 가깝게 설계된 색공간이다.

<br>

**브라우저 지원**

2023년 이후 지원이 중단된 인터넷 익스플로러를 제외한 모든 주요 브라우저(Chrome, Firefox, Safari, Edge)에서 사용할 수 있다고 한다.

## 색상 피커 도구 : Color Picker

<img src="/images/posts/post23/image6.png">

[https://www.hslpicker.com/#002703](https://www.hslpicker.com/#002703)

원하던 색을 OKLCH와 HSL, RGB 등의 다양한 색상으로 변경해주는 사이트도 있다. 급하게 복사해서 붙여넣기할 때 유용하게 잘 쓰일 듯?!

<br>
