---
title: '[React] 리액트 컴포넌트의 생명주기 (Lifecycle)'
date: '2025-12-23 14:51'
description: '리액트 컴포넌트에는 라이프사이클(Lifecycle)이 있다. 이것은 컴포넌트가 생성되고, 업데이트 되고 사라지는 일련의 과정을 말한다. 이러한 라이프 사이클은 2019년 이전 레거시한 방식이었던 클래스 컴포넌트에서 사용할 수 있었고, 최근에는 함수형 Hooks로 자동으로 다 할 수 있게 됐다.'
section: 'React'
category: 'React'
slug: 'react-lifecycle'
tags: ['클래스컴포넌트라이프사이클', 'ReactLifeCycle', 'mount', 'React']
image: '/images/posts/post20/image.png'
---

# 시작하기

리액트 컴포넌트에는 라이프사이클(Lifecycle)이 있다. 이것은 컴포넌트가 생성되고, 업데이트 되고 사라지는 일련의 과정을 말한다. 이러한 라이프 사이클은 2019년 이전 레거시한 방식이었던 클래스 컴포넌트에서 사용할 수 있었고, 최근에는 함수형 Hooks로 자동으로 다 할 수 있게 됐다.

React 컴포넌트의 라이프 사이클을 이해하기 위해서 리액트 공식문서를 참고해 다음과 같이 정리해보았다.

<img src="/images/posts/post20/image2.png" alt="리액트 라이프사이클">

# Mount 생성 단계

컴포넌트가 처음으로 생성이 되고 실행되는 단계가 마운트 단계이다.

> **리액트 내부 동작 방식**

    1. 컴포넌트 생성 요청
    2. React가 알아서 constructer() 호출
    3. React가 알아서 render() 호출
    4. React가 알아서 componentDidMount() 호출

<br>

## **constructor()**

- 클래스 컴포넌트가 화면에 추가되기 전에 처음 생성될 때 constructor가 실행됨
- 이 메소드를 통해서 컴포넌트의 **상태(state)를 초기화**
- 컴포넌트 인스턴스에 메서드를 바인딩
- `super(props)` 를 호출해야 this를 사용 가능함

```tsx
import React, { Component } from 'react';

class Counter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0
    };
    this.handleClick = this.handleClick.bind(this);
  }
  ...
}

export default Counter;
```

- 최근 자바스크립트 문법을 사용한다면 constructor는 거의 필요하지 않음
- 매개변수 : 컴포넌트 초기props
- 반환값은 없다

<br>

## **getDerivedStateFromProps()**

- props를 받아서 state를 업데이트하는 함수
- render 직전(마운트, 업데이트)에 매번 호출된다

```tsx
 static getDerivedStateFromProps(props, state) {
    if (props.userID !== state.prevUserID) {
      return {
        prevUserID: props.userID,
        email: props.defaultEmail
      };
    }
    return null;
  }
```

<br>

## **render()**

- 화면에 뭘 보여줄지 정의하는 함수
- 클래스 컴포넌트에서 유일하게 **필수**인 메소드

```tsx
class Greeting extends Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

- React는 언제든지 render를 호출할 수 있다
- 순수함수로 작성해야 한다. 그렇기 때문에 브라우저 API와 상호작용하면 안된다. 이러한 부수효과들은 `componentDidMount` 와 같은 메서드에서 발생해야함
- 반환값: 유효한 모든 React 노드, 앨리먼트 들

→ 쉽게 말해 함수형 컴포넌트에서 return 이랑 같은 개념이다

<br>

## **componentDidMount()**

- 컴포넌트가 화면에 나타난 직후(마운트될때) 실행되는 함수
  - 화면엔 이미 다 그려졌으니 할 일들을 하는 것이다
- API 호출
- 이벤트 리스너 등록
- 타이머 설정
- DOM 직접 조작

➡️ 즉, 데이터 가져오거나 구독을 설정하거나 DOM 노드를 조작할때 사용

- 일부 state나 props를 읽는 경우 변경 사항을 처리하기 위해 `componentDidUpdate` 를 구현하고 작업을 정리하기 위해 `componentWillUnmount`도 구현해줘야 한다

```tsx
class ChatRoom extends Component {
  state = {
    serverUrl: 'https://localhost:1234',
  };

  componentDidMount() {
    this.setupConnection();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.roomId !== prevProps.roomId ||
      this.state.serverUrl !== prevState.serverUrl
    ) {
      this.destroyConnection();
      this.setupConnection();
    }
  }

  componentWillUnmount() {
    this.destroyConnection();
  }

  // ...
}
```

<br>

# Update (업데이트 단계)

> ⭐️업데이트가 발생하는 조건 (=리렌더링)
>
> 1. state가 변경될 때 (`setState` 호출)
> 2. props가 변경될 때 (부모가 새로운 props 전달함)
> 3. 부모 컴포넌트가 리렌더링 될때

<br>

## **shouldComponentUpdate(nextProps, nextState, nextContext)**

- 업데이트를 할지 말지 결정하는 함수,
  - 즉 리렌더링을 해야할지 말지를 결정한다
- `this.props`를 `nextProps`와, `this.state`를 `nextState`와 비교하면서 변화가 있는지 확인
- 반환값이 true면 업데이트를 하고, false면 업데이트 하지 않는다

```tsx
class Rectangle extends Component {
  state = {
    isHovered: false,
  };

  shouldComponentUpdate(nextProps, nextState) {
    if (
      nextProps.position.x === this.props.position.x &&
      nextProps.position.y === this.props.position.y &&
      nextProps.size.width === this.props.size.width &&
      nextProps.size.height === this.props.size.height &&
      nextState.isHovered === this.state.isHovered
    ) {
      // 변경된 사항이 없으므로 다시 렌더링할 필요가 없습니다.
      return false;
    }
    return true;
  }

  // ...
}
```

- 이 메서드는 오로지 성능 최적화만을 위해서 존재한다.
- 이렇게 `shouldComponentUpdate` 클래스 컴포넌트를 최적화하는 것은 useMemo를 사용해서 최적화할 수도 있다

<br>

## **componentDidUpdate()**

- 컴포넌트가 업데이트 끝난 후 다시 렌더링 될때 실행됨
- 업데이트된 props 혹은 state로 다시 렌더링 될때 실행되고 초기 렌더링될때는 실행되지 않는다

```tsx
class ChatRoom extends Component {
  state = {
    serverUrl: 'https://localhost:1234',
  };

  componentDidMount() {
    this.setupConnection();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.roomId !== prevProps.roomId ||
      this.state.serverUrl !== prevState.serverUrl
    ) {
      this.destroyConnection();
      this.setupConnection();
    }
  }

  componentWillUnmount() {
    this.destroyConnection();
  }

  // ...
}
```

이때 componentDidUpdate과 shouldComponentUpdate 무슨 차이점이 있을까?

- 결론부터 말하자면, 실행 시점이 다르다
- 과정 : 업데이트 요청 (state/props 변경) → 업데이트 전 shouldComponentUpdate()로 업데이트할지 말지 결정 → render()로 화면 업데이트 → 업데이트 끝난 후 componentDidUpdate()로 정리작업
- 이때 만약 shouldComponentUpdate()가 false로 업데이트를 안해도 된다면 이후 작업은 실행되지 않는다

<br>

# **Unmount (제거 단계)**

## **componentWillUnmount()**

- 컴포넌트가 DOM에서 제거되기 직전(화면에서 제거되기 전)에 실행
- componentDidMount()에서 설정한 것을 unmount에서 정리한다
- 만약 이 unmount 단계가 없다면, 컴포넌트가 사라져도 설정해둔 것들은 자동으로 사라지지 않기 때문에 메모리 누수가 발생하게 된다

<br>
그래서 앞서 배운 내용대로,

`componentDidMount()`, `componentDidUpdate()`, `componentWillUnmount()` 를 다 합친 것이 바로 useEffect를 호출하는 것과 같다.

```tsx
// 함수형: useEffect 하나로 다 처리
useEffect(() => {
  // componentDidMount + componentDidUpdate

  return () => {
    // componentWillUnmount
  };
}, [deps]);
```

<br>

# 요약

- 컴포넌트는 Mount(생성) → Update(업데이트) → Unmount(제거) 3단계를 거친다.
- Mount에서 초기화하고, Update에서 변경사항을 반영하고, Unmount에서 정리한다.
- 함수형에서는 이 모든 걸 useEffect 하나로 처리한다.

<br>

**참고 자료**

- https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/
- https://www.freecodecamp.org/news/react-component-lifecycle-methods/
- https://ko.react.dev/reference/react/Component

<br>
