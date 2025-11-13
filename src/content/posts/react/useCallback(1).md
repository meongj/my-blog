---
title: '[React] useCallback은 무엇일까?'
date: '2025-11-13 16:01'
description: 'React의 useCallback Hook이 무엇인지, 왜 필요한지 기초부터 알아보자. 함수 메모이제이션의 개념과 기본 사용법을 이해하고 불필요한 리렌더링을 방지하는 useCallback의 동작 원리 설명'
section: 'React'
category: 'React'
slug: 'useCallback'
tags: ['useCallback', '리렌더링', '메모이제이션', 'React']
image: '/images/posts/post17/useEffect.jpeg'
---

## useCallback의 정의

```tsx
useCallback은 리렌더링 간 함수 정의를 캐싱해주는 React hook이다

출처 :  react.dev/reference
```

react 공식문서에서 가져온 설명이다. 쉽게 말해서 함수를 저장하는 도구라고 생각하면 된다.React 컴포넌트는 state나 props가 바뀔 때마다 함수 전체가 다시 실행된다. 이때 컴포넌트 안에 있는 함수들도 매번 새로 만들어진다.

**함수형 컴포넌트**

```tsx
function Component() {
  const [item, setItem] = useState(10);

  const calculate = useCallback(
    (num) => {
      return num + 1;
    },
    [item]
  );
  return <div>{value}</div>;
}
```

component 가 렌더링이 되면 Component 함수 호출하면서 Memoize된 함수를 재사용하고

새로운 함수 객체를 다시 할당받는게 아니라 이전에 할당받은 함수 객체를 계속해서 갖고 있으면서 재사용할 수 있게 된다.

메모이제이션된 함수를 사용하면 불필요한 자식 컴포넌트의 리렌더링이나 useEffect의 재실행을 방지할 수 있다.

## 왜 필요할까?

만약 useCallback이 없다면 어떻게 될까? 다음 코드를 보자.

```tsx
function MyComponent() {
  const [item, setItem] = useState(10);
  const [count, setCount] = useState(0);

  const calculate = (num) => {
    return num + item;
  };
}
```

여기서 count만 바뀌어도 calculate 함수가 새로 만들어지고 item이 바뀌어도 마찬가지로 calculate 함수가 새로 생성된다. 렌더링될 때 마다 함수가 새로 생성된다는 불필요한 리렌더링 문제가 생긴다.

```tsx
import { useEffect, useState, useCallback } from 'react';

function App() {
  const [number, setNumber] = useState<number>(0);

  const someFunction = () => {
    console.log(`someFunc: number: ${number}`);
    return;
  };

  useEffect(() => {
    console.log('someFunction이 변경되었습니다');
  }, [someFunction]);

  return (
    <div>
      <input
        type="number"
        value={number}
        onChange={(e) => setNumber(Number(e.target.value))}
      />
      <br />
      <button onClick={someFunction}>Call someFuc</button>
    </div>
  );
}

export default App;
```

여기서 만약 input 값을 계속 바꾸게 된다면 어떻게 될까? number가 변경이 되면 컴포넌트 리렌더링이 되면서 someFunction를 새로 생성한다.

someFunction 함수도 객체이기 때문에 someFunction의 주소값은 다르다. 이때 렌더링이 되면 주소가 계속 바뀐게 된다.그래서 이전 렌더링과 다음 렌더링때 주소가 바뀌니 useEffect가 변화를 감지해서 리렌더링이 계속해서 일어나게 되는 문제가 생긴다.

<img src="/images/posts/post18/image.png" />

<img src="/images/posts/post18/image2.png" />

```tsx
const someFunction = useCallback(() => {
  console.log(`someFunc: number: ${number}`);
  return;
}, []);
```

그래서 useCallback을 사용하면 함수가 이제 메모이제이션이 되서 메모이제이션된 함수의 주소가 들어있게 된다. 같은 주소니 리렌더링이 일어나지 않는다.

## 기본 사용법

**`useCallback(fn, dependencies)`**

매개변수

- `fn` : 캐싱할 함수값 , 어떤 인자나 반환값도 가질 수 있다. 첫 렌더링시 이 함수를 반환한다. 다음 렌더링에서 `dependencies` 값이 이전과 같다면 React는 같은 함수를 다시 반환한다. `dependencies` 값이 변경되었다면 이번 렌더링에서 전달한 함수를 반환하고 나중에 재사용할 수 있도록 저장한다.
- `dependencies` : `fn` 안에서 참조되는 모든 반응형 값의 목록이다.

```tsx
useCallback(() => {
  return value;
}, [item]);
```

첫번째 인자는 메모이제이션 해줄 콜백 함수가 있고 `() => { return value;}`

두번째 인자는 의존성 배열을 받는다 `[item]`

```tsx
const calculate = useCallback(
  (num) => {
    return num + 1;
  },
  [item]
);
```

이렇게 함수를 useCallback으로 감싸주면 의존성 배열이 변경되지 않는 이상 다시 초기화되지 않는다.

컴포넌트가 처음 렌더링될 때, calculate 함수를 만들어서 메모리에 저장해두고 item의 현재 값도 함께 기억해둔다. 컴포넌트가 다시 렌더링 될 때, 만약 item이 바뀌지 않았다면 저장해둔 기존 calculate 함수를 그대로 재사용하고 item이 바뀌었다면 저장해둔 기존 calculate 함수를 그대로 재사용한다. item이 바뀌었다면 어떨까? calculate 함수를 새로 만들어서 다시 저장한다.

### 의존성 배열을 아예 안 넣게 된다면 어떻게 될까?

```tsx
const handleClick = useCallback(() => {
  console.log('클릭했당');
});
```

이렇게 의존성 배열을 없이 useCallback을 사용한다면 useCallback 없이 사용하는 것과 동일하다. useCallback 내부로직에서는 의존성 배열이 없으면 그냥 새 함수를 반환하라고 되어 있기 때문에 렌더링될때마다 새로 만들어지게 된다.

**올바른 사용법들**

1. 빈 배열 - 처음 한번만 생성

```tsx
const handleClick = useCallback(() => {
  console.log('clicked!');
}, []);
```

빈 배열을 넣게되면 처음 한 번만 생성하고 계속 재사용한다

2. 값 있는 배열 - 조건부 생성

```tsx
const handleClick = useCallback(() => {
  console.log(`Count: ${count}`);
}, [count]);
```

count가 바뀔 때만 새로 생성한다

## 마무리

- useCallback은 함수를 메모이제이션해서 불필요한 리렌더링을 방지하는 React Hook이다.
- 컴포넌트가 리렌더링되어도 의존성 배열의 값이 변하지 않으면 같은 함수를 사용
- 의존성 배열을 반드시 넣어야 최적화 효과를 볼 수 있음

<br>
<br>

**참고 자료**

- https://www.youtube.com/watch?v=XfUF9qLa3mU
- [https://ko.react.dev/reference/react/useCallback](https://ko.react.dev/reference/react/useCallback)
