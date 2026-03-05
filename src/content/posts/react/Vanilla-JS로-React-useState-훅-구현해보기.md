---
title: 'Vanilla JS로 React useState 훅 구현해보기'
date: '2026-03-05 15:57'
description: 'useState는 어떻게 상태를 유지할까? 클로저로 직접 구현해보고, Hook의 규칙이 왜 필요한지 알아본다.실무에서 마주치는 Stale Closure 문제와 해결법까지 다룬다.'
section: 'React'
category: 'React'
slug: 'react-useState'
tags: ['useState', 'React', 'Hook', '클로저']
image: '/images/posts/post28/image1.jpg'
---

# 시작하기

리액트의 useState hook을 사용하다가 내부 구조가 어떻게 되어 있는지 궁금해져서 블로그 글로 정리를 하게됐다. 직접 바닐라 JS로 간단하게 구현해보고, 리액트 내부에서 어떻게 동작하는 지 알아보자.

## useState hook

useState의 역할은 무엇인가?

- 컴포넌트가 기억력을 갖게 해주는 것이다.

가장 궁금했던 것이 리렌더링이 일어나도 useState는 값을 그대로 가지고 있다. 도대체 어떻게 이렇게 값을 유지할 수 있는 것일까?

<br>

정답은 **클로저**이다!

### 클로저란?

함수가 끝나도, 리턴된 함수가 바깥 변수를 참조하고 있으면 그 변수가 메모리에서 사라지지 않는 현상이다.

함수가 끝나면 보통 변수가 사라진다. 실행컨텍스트가 끝나면 그 안의 변수도 메모리에서 정리되는 것이 정상이다. 하지만 참조를 하고 있다면 gc는 메모리를 지우지 않는다.

만약 클로저가 없게 된다면, 함수가 끝나면 모든 저장된 변수가 사라지기 때문에 직접 전역변수에 때려박을 수 밖에 없어서 관리가 더 힘들어지게 되는 단점이 생긴다.

이런 특징을 활용해 useState는 클로저를 사용해서 함수가 끝나도 그 안의 변수가 유지되도록 했다.

<br>

실제로 JS로 useState 훅을 구현하면 다음과 같다.

```tsx
const MyReact = (() => {
  let hooks = []; // 모든 state 값을 저장하고 있는 리액트 내부 배열
  let currentIndex = 0; // 지금 몇번째 useState인지 추적하는 인덱스

  function useState(initialValue) {
    const index = currentIndex;

    // 초기값 저장
    if (hooks[index] === undefined) {
      hooks[index] = initialValue;
    }

    function setState(newValue) {
      if (typeof newValue === 'function') {
        hooks[index] = newValue(hooks[index]);
      } else {
        hooks[index] = newValue;
      }
      render();
    }
    currentIndex++;

    return [hooks[index], setState];
  }

  // 렌더링 시작해주는 함수
  function render() {
    currentIndex = 0;
    console.log('── 렌더링 시작 ──');
    const result = App();
    console.log('── 렌더링 끝 ──\n');
    return result;
  }

  return { useState, render };
})();

function App() {
  const [count, setCount] = MyReact.useState(0);
  const [name, setName] = MyReact.useState('철수');

  // 화면이 아닌 콘솔에 출력해보자
  console.log(`  count: ${count}, name: ${name}`);

  return { setCount, setName };
}

// 실행
const { setCount, setName } = MyReact.render();
setCount(1);
setName('영희');
```

- 리액트는 즉시실행함수로 감싸서 내부 변수를 숨기고 `useState()`로만 접근이 가능하도록 만든다. (클로저)
- 리액트가 `App()`을 호출하고 `setState()`를 하고나서 `render()`가 `App()` 다시 호출 한다.

<br>

<img src="/images/posts/post28/image.png">

### Hook 구조

- **hooks 배열 + 클로저** 구조
- useState 훅 뿐만 아니라 다른 hook 들도 모두 마찬가지다
- 모든 훅들은 하나의 hooks 배열에서 순서대로 저장되고 관리된다
- 훅의 몇번째로 호출됐냐에 따라서 배열의 인덱스로 구분이 된다

그렇기 때문에 주의 할점이

hook을 사용할 때는 최상단에 둬야하고, hook을 조건문 안이나, 반복문, 중첩함수 등과 같이 문안에 둬서는 안된다. 왜냐하면 배열의 인덱스 값이 조건에 따라 달라질 수 있기 때문에 인덱스가 밀리는 등의 꼬일 수 있는 문제점이 생긴다.

**권장 패턴)**

- hook을 전부 위로 몰아두고 조건부 return 문은 그 아래 배치한다
- 조건부 return이나 조건문/반복문보다 Hook을 먼저 호출해서, 매 렌더링마다 Hook 호출 순서를 동일하게 유지해야한다

## **실무에서 자주 마두치는 문제들! (주의할 점)**

### **오래된 클로저(Stale Closure) 문제**

리액트에서는 렌더링마다 변수가 새로 생긴다.

왜 달라지냐면, 위에서 본 코드에서 보면 리렌더링은 `App()` 함수를 다시 호출하는 것이고,
함수를 다시 호출하면 새로운 실행 컨텍스트가 생기면서 count 변수도 매번 새로 만들어지기 때문이다.

그렇기 때문에 렌더링마다 변수이름은 같지만, 매번 다른 변수로 인식된다.

```tsx
function App() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);

    setTimeout(() => {
      alert(count);
    }, 3000);
  }

  return <button onClick={handleClick}>클릭 ({count})</button>;
}
```

다음과 같은 코드에서 버튼을 빠르게 5번 클릭한다면 어떤일이 벌어질까?

- 화면에서는 count가 5가 나오지만
- 3초뒤 alert에서는 0, 1, 2, 3, 4가 뜨게 된다

왜냐하면 렌더링마다 참조하고 있는 변수가 달라지기 때문이다.

클릭 1: 렌더링 1 (count=0)에서 클릭 → setTimeout이 0을 참조

클릭 2: 렌더링 2 (count=1)에서 클릭 → setTimeout이 1을 참조

클릭 3: 렌더링 3 (count=2)에서 클릭 → setTimeout이 2를 참조

클릭 4: 렌더링 4 (count=3)에서 클릭 → setTimeout이 3을 참조

클릭 5: 렌더링 5 (count=4)에서 클릭 → setTimeout이 4를 참조

<br>

각 콜백이 자기가 태어난 렌더링의 count를 참조하고 있어서 최종값이 5가 아닌 예전 값을 보여주는 것이다. React는 렌더링마다 새 변수가 생기는데 옛날 콜백은 옛날 변수에 갇혀서 옛날 값만 보인다.

이러한 현상을 Stale Closure 문제라고 부른다.

## Stale Closure 해결 방법

### 1. **함수형 업데이트**

함수형 업데이트 방식이 `useState` 를 사용할 때 가장 쉽고 확실하게 Stale Closure 를 해결하는 방법이다.

상태를 업데이트할 때 값을 직접 넣지 않고, 함수를 전달한다.

리액트가 가장 최신의 상태값(prev)을 인자로 넣어주기 때문에, 클로저가 어떤 과거의 값을 잡고 있든지 상관없이 항상 최신값을 가지고 있다.

```tsx
function App() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount((prev) => {
      const next = prev + 1;

      setTimeout(() => {
        alert(next);
      }, 3000);

      return next;
    });
  }

  return <button onClick={handleClick}>클릭 ({count})</button>;
}
```

3초 뒤에 1, 2, 3, 4, 5가 순서대로 alert창에 출력된다

### 2. **useRef 사용**

렌더링과 상관없이 항상 동일한 메모리 주소를 참조하는 `useRef`를 사용하면 Stale Closure 문제를 해결할 수 있다. count값이 변하고 리렌더링 이후에 countRef에 저장하면 최신 count값을 알 수 있다.

리액트는 렌더링시 ref 변경을 막기 때문에 useEffect훅으로 감싸주었고, countRef의 current 를 alert에서 출력되도록 변경했다.

```tsx
function App() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  // 리렌더링 이후에 countRef에 저장
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  function handleClick() {
    setCount(count + 1);

    setTimeout(() => {
      alert(countRef.current);
    }, 3000);
  }

  return <button onClick={handleClick}>클릭 ({count})</button>;
}
```

3초 뒤 → 5, 5, 5, 5, 5가 출력되는 걸 볼 수 있다.

<br>

### 참고 자료

- https://dmitripavlutin.com/react-hooks-stale-closures/
