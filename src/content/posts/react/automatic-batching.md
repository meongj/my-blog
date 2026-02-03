---
title: 'React 18부터 추가된 React 상태 업데이트 배칭 (Automatic Batching)'
date: '2026-02-03 22:13'
description: 'React 18 부터 추가된 Automatic Batching에 대해 소개하려고 합니다. 무엇이 달라졌는지 알아보고 직접 코드로 구현하는 내용을 담고 있습니다.'
section: 'React'
category: 'React'
slug: 'automatic-batching'
tags: ['Automatic Batching', 'React', '배칭']
image: '/images/posts/post24/image.png'
---

> https://ko.react.dev/learn/queueing-a-series-of-state-updates#react-batches-state-updates <br>
> 공식문서를 참고하여 작성한 글입니다.

# 시작하기

2022년 리액트 18버전이 출시되면서 자동 배칭 (Automatic Batching) 기능이 새롭게 추가되었다.

setState 함수를 쓰면 리렌더링이 일어나는데, 여러 개의 setState를 써도 한 번만 리렌더링되는 것을 볼 수 있다. 이것이 배칭(Batching)이다.

배칭 자체는 이전 버전에도 있었지만, 이벤트 핸들러 안에서만 동작했다. React 18의 Automatic Batching은 어떤 차이가 있는지 알아보자

<br>

# 🤖 Automatic Batching

- 배칭(Batching)이란 상태(state) 업데이트를 모아서 한 번에 렌더링하는 것을 말한다.

**왜 배칭이 필요한가?**

바로 성능 최적화를 위해서다.

상태가 바뀔 때마다 React는 내부적으로 이런 동작 과정을 거친다.

> 상태 변경 → Virtual DOM 생성 → 비교(Diffing) → 실제 DOM 업데이트

이렇게 내부적으로 많은 과정을 거치는데 상태가 바뀔 때마다 이 과정을 계속 거치게 되면 느려질 수 밖에 없다. 그렇기 때문에 업데이트 작업을 모아 한번에 업데이트해서 불필요한 리렌더링 작업을 방지한다.

```tsx
export default function Counter() {
  const [number, setNumber] = useState(0);

  return (
    <>
      <h1>{number}</h1>
      <button
        onClick={() => {
          setNumber(number + 1); // 0 + 1 = 1로 교체
          setNumber(number + 1); // 0 + 1 = 1로 교체
          setNumber(number + 1); // 0 + 1 = 1로 교체
        }}
      >
        +3
      </button>
    </>
  );
}
```

- 버튼 클릭을 클릭하면 3씩 증가할 것 같지만, 1씩 증가하는 것을 볼 수 있다. setNumber 함수를 세 번 실행하지만 실제로는 렌더링은 한 번만 된다.
- number 초기값이 0으로 시작해 1을 더해 1로만 상태가 교체된다.
  <img src="/images/posts/post24/record1.gif">

React는 state 업데이트 하기 전에 이벤트 핸들러의 모든 코드가 실행될 때까지 기다린다. 그래서 리렌더링은 모든 `setNumber()` 호출이 끝나고 나서 이후에 업데이트를 하게 된다.

하지만 클릭과 같은 의도적인 여러 이벤트에 대해선 batch를 수행하진 않고, 클릭은 개별적으로 각각 처리된다.

```tsx
<button
  onClick={() => {
    setNumber((n) => n + 1); // 0 -> 1
    setNumber((n) => n + 1); // 1 -> 2
    setNumber((n) => n + 1); // 2 -> 3
  }}
>
  +3
</button>
```

이렇게 함수를 전달하면, 이전 계산 결과를 다음 함수의 인자 n으로 넘겨준다. 그래서 3씩 증가하는 것을 볼 수 있다. `n => n + 1` 는 업데이터 함수로 부른다.

| 순서 | n (이전 결과) | 반환값 |
| ---- | ------------- | ------ |
| 1    | 0             | 1      |
| 2    | 1             | 2      |
| 3    | 2             | 3      |

  <img src="/images/posts/post24/record2.gif">

state 설정자 함수에 전달할때

1. React는 이벤트 핸들러의 다른 코드가 모두 실행된 후에 이 함수가 처리되도록 큐에 넣는다
2. 다음 렌더링 중에 React는 큐를 순회해서 최종 업데이터된 state를 제공한다

```tsx
<button onClick={() => {
  setNumber(number + 5); // 0 + 5 = 5로 교체
  setNumber(n => n + 1); // 5 → 6
}}>
```

이 코드를 보면, number 0이 5를 더해서 큐에 5로 교체되고 업데이트 함수가 5+1로 6으로 최종 결과를 저장한다.

> React 17과 18 버전의 배칭 차이를 다루는 글으로 참고해서 보면 좋다. <br>
> https://github.com/reactwg/react-18/discussions/21

<br>

## React 18 배칭 변경사항

React 18 이전에는 이벤트 핸들러만 배칭이 되고, promise, setTimeout, native event handler 등 안에서는 배칭이 되지 않았다.

하지만 React 18에서의 createRoot부터는 모든 업데이트가 어디서 발생하든 자동으로 배칭이 된다. 이것을 Automatic Batching 이라고 한다.

https://github.com/reactwg/react-18/discussions/21

```tsx
// React 17
ReactDOM.render(<App />, document.getElementById('root'));

// React 18 (automatic batching 활성화)
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

<br>

## **☀️ 배칭을 피하고 싶을 때 : flushSync**

- flushSync란 배칭을 강제로 해제시키고, 상태 업데이트를 즉시 DOM에 반영시키는 함수이다.
- 대부분의 경우 배칭은 좋지만, 가끔 상태변경이 바로 DOM에 반영시켜야 할 때가 있다.
- 단, flushSync는 성능에 영향을 주기 때문에 꼭 필요한 경우에만 사용해야한다.

```tsx
import { useState } from 'react';
import { flushSync } from 'react-dom';

function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    flushSync(() => {
      setCount(1);
    });
    // 여기서 이미 DOM에 1이 반영됨

    flushSync(() => {
      setCount(2);
    });
    // 여기서 이미 DOM에 2가 반영됨
  };

  console.log('렌더링:', count);
  //결과
  // 렌더링 : 1
  // 렌더링 : 2

  return <button onClick={handleClick}>{count}</button>;
}
```
