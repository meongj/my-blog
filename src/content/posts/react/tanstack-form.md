---
title: 'TanStack Form 시작하기'
date: '2026-01-18 17:49'
description: 'TanStack Form으로 회원가입 폼 만들어보기. 기본 사용법부터 createFormHookContexts로 재사용 컴포넌트 만드는 법까지 정리했습니다.'
section: 'React'
category: 'React'
slug: 'tanStack-form'
tags: ['tanStack form', 'React', 'form']
image: '/images/posts/post21/image.png'
---

## 💡TanStack Form 이란 무엇일까?

> Headless, performant, and type-safe form state management for TS/JS, React, Vue, Angular, Solid, Lit and Svelte.
> UI 없이 로직만 제공하고, 필요한 부분만 리렌더링하고 TypeScript로 타입 추론이 강력하며, 여러 프레임워크(React,Vue, Angular, Svelte 등))에서 쓸 수 있는 라이브러리이다.

<br>

### TanStack Form을 사용하는 이유는?

프로젝트를 진행하면서 TanStack Form을 사용했었는데, 왜 사용하고 어떤 구조로 이루어져 있는지 궁금해져서 블로그 포스팅을 하게 됐다.

- 타입스크립트로 작성되어 타입에 안정적이다
- 폼 검증을 유연하게 검증한다 → 유효성 검사
- 제어된 입력만 허용하고 폼 상태 직접 관리한다
- 대규모 애플리케이션 염두해두고 개발시 유리하다

<br>

## Philosophy

**Controlled is Cool 😎**

제어 컴포넌트 방식이 더 낫다.

폼 값을 React 상태로 직접 관리한다.

<br>

**🎮 제어 컴포넌트 (Controlled)란?**

리액트 공식 문서에 따르면,

HTML에서 `<input>`, `<textarea>`, `<select>`와 같은 폼 엘리먼트는 일반적으로 사용자의 입력을 기반으로 자신의 state를 관리하고 업데이트합니다. React에서는 변경할 수 있는 state가 일반적으로 컴포넌트의 state 속성에 유지되며 [`setState()`](https://ko.legacy.reactjs.org/docs/react-component.html#setstate)에 의해 업데이트됩니다.

[https://ko.legacy.reactjs.org/docs/forms.html#controlled-components](https://ko.legacy.reactjs.org/docs/forms.html#controlled-components)

```tsx
import { useState } from 'react';

function ControlledForm() {
  const [name, setName] = useState(''); // React가 값을 들고 있음

  const handleSubmit = (e) => {
    e.preventDefault();
    // 이미 state에 값이 있음
    console.log(name);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name} // input 값이 React의 state값이다
        onChange={(e) => setName(e.target.value)} // 타이핑하면 state 업데이트
      />
      <button type="submit">제출</button>
    </form>
  );
}
```

React 컴포넌트가 폼 데이터를 관리한다는 것이다. input 자체가 자기 마음대로 값을 바꿀 수 없고, 무조건 `name` 의 state에 있는 값만 보여준다. React가 알아서 너는 이 name의 state만 보여달라고 **제어**를 하는 것이다.

그래서 만약 `onChange` 없이 value만 있다면 state가 바뀌지 않아 타이핑이 되지 않는다.

<br>
<br>

**그렇다면 비제어 컴포넌트(Uncontrolled)란 무엇일까?**

제어 컴포넌트와 반대로 DOM이 직접 폼 데이터를 관리한다.

대부분 경우에 폼을 구현하는데 제어 컴포넌트를 사용하는 것이 좋습니다. 제어 컴포넌트에서 폼 데이터는 React 컴포넌트에서 다루어집니다. 대안인 비제어 컴포넌트는 DOM 자체에서 폼 데이터가 다루어집니다.

모든 state 업데이트에 대한 이벤트 핸들러를 작성하는 대신 비제어 컴포넌트를 만들려면 ref를 사용하여 DOM에서 폼 값을 가져올 수 있습니다.

[https://ko.legacy.reactjs.org/docs/uncontrolled-components.html](https://ko.legacy.reactjs.org/docs/uncontrolled-components.html)

```tsx
import { useRef } from 'react';

function UncontrolledForm() {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // 제출할 때 DOM에서 값을 꺼내옴
    console.log(inputRef.current.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" ref={inputRef} />
      <button type="submit">제출</button>
    </form>
  );
}
```

input에 value 속성이 없어 React를 거치지 않고 input DOM 요소를 inputRef로 연결시킨다. 사용자가 타이핑하면 DOM이 직접 처리해서 input안에 타이핑한 값을 표시한다. submit시 `inputRef.current.value` 로 값을 꺼내와서 이제서야 React가 값을 알게된다.

비제어를 사용하는 라이브러리는 대표적으로 React Hook Form이 비제어 방식으로 사용하고 있다.

<br>

> 결국 핵심은
> React가 관여하면, **제어**
> React가 관여하지 않으면, **비제어**
> 이다.

<br>

## 사용법

**1. 패키지 설치하기**

npm, pnpm, yarn 등 설치되어 있는 패키지 도구로 tanstack form을 설치할 수 있다

`npm i @tanstack/react-form`

`pnpm add @tanstack/react-form`

`yarn add @tanstack/react-form`

<br>

**2. 간단하게 폼 만들려면 `useForm` API import 필요하다**

```tsx
import { useForm } from '@tanstack/react-form';

const form = useForm({
  defaultValues: {
    email: '',
    password: '',
  },
  onSubmit: ({ value }) => {
    console.log('제출된 값:', value);
  },
});
```

<br>

**3. TanStack Form Field 생성하기**

```tsx
function RegisterForm() {
	...

	return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      {/* 이메일 필드 */}
      <form.Field name="email">
        {(field) => (
          <div>
            <label>이메일</label>
            <input
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      {/* 비밀번호 필드 */}
      <form.Field name="password">
        {(field) => (
          <div>
            <label>비밀번호</label>
            <input
              type="password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <button type="submit">가입하기</button>
    </form>
  )
}

```

`<form.Field ..>`

- 폼 인스턴스로부터 가져오는 리액트 컴포넌트
- 단일 폼 입력 관리
- 필드는 name, validators 등의 프로퍼티 받는다

<br>

**내부 children의 field , 어떻게 field를 사용할 수 있는 것일까?**

Field 컴포넌트 내부 구조를 간략화하면 다음과 같이 되어 있다.

```tsx
// 간략화한 Field 컴포넌트 내부 구조
function Field({ name, validators, children }) {
  // 필드 상태 관리 로직
  const field = {
    name,
    state: { value: '...', meta: { errors: [], isValid: true } },
    handleChange: (value) => {
      /* 값 업데이트 */
    },
    handleBlur: () => {
      /* 터치 상태 업데이트 */
    },
  };

  // children이 함수니까 호출하면서 field를 넘겨줌
  return children(field);
}
```

- 이 Field 컴포넌트가 폼 상태를 묶어서 관리해서 제어 컴포넌트로 사용할 수 있는 것이다.

<br>

**4. 유효성 검사 추가하기**

```tsx
<form.Field
	name="email
	validators={{
    onChange: ({ value }) =>
      !value.includes('@') ? '올바른 이메일을 입력하세요' : undefined,
  }}
  >
  ...
```

validators 옵션으로 필드에 대한 검증 로직도 작성할 수 있고

```tsx
const form = useForm({
  //...
  validators: ({ value }) => {
    /**/
  },
});
```

useForm 훅에 validators 옵션을 추가해 폼 전체에 대한 검증 로직도 작성이 가능하다.

<br>

**5. Zod로 스키마 검증 (선택)**

```tsx
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(8, '8자 이상 입력하세요'),
});

const form = useForm({
  defaultValues: { email: '', password: '' },
  validators: {
    onSubmit: registerSchema,
  },
  onSubmit: ({ value }) => {
    console.log(value);
  },
});
```

zod로 스키마를 따로 만들어서 사용자가 제출할때만 검증이 실행된다.

<br>

## ➡️ 반복되는 코드가 많아진다면, createFormHookContexts를 써라

폼이 점점 커지면 다음과 같은 boilerplate가 계속 반복된다

```tsx
<form.Field name="username">
  {(field) => (
    <input
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  )}
</form.Field>
```

tanstack form이 재사용 가능하도록 컴포넌트를 생성할 수 있도록 돕는다. createFormHookContexts이 바로 재사용 가능한 커스텀 폼 컴포넌트를 만들기 위한 Context를 생성하는 함수이다.

<br>

**어떻게 쓰는가?**

```tsx
// 1. Context 생성
import { createFormHookContexts, createFormHook } from '@tanstack/react-form'

export const { fieldContext, formContext, useFieldContext } = createFormHookContexts(
```

```tsx
// 2. 위에서 계속 중복적으로 만들었던 코드를 재사용 가능한 TextField로 만들어버린다
function TextField({label}: {label: string}) {
	const field = useFieldContext<string>(); // Context에서 field를 가져와서

	return (
		<label>
			<span>{label}</span>
			<input
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}>
		</label>
	)

}
```

```tsx
const { useAppForm } = createFormHook({
  fieldContext, // 아까 만든 Context
  formContext, // 아까 만든 Context
  fieldComponents: {
    // 필드용 컴포넌트 등록
    TextField,
    NumberField,
    SelectField,
  },
  formComponents: {
    // 폼 전체용 컴포넌트 등록
    SubmitButton,
  },
});
```

`createFormHook`으로 내가 만든 컴포넌트를 폼에 등록한다.

<br>

**사용법**

```tsx
<form.AppField
  name="username"
  children={(field) => <field.TextField label="이름" />}
/>
```

이렇게 `<form.AppField>` 는 등록한 커스텀 컴포넌트를 쓸 수 있게 해주는 Field로 내가 등록한 `<field.TextField>` 를 쓸 수 있게 한다.

<br>

## 전체 코드 및 결과 화면

```tsx
import './App.css';
import { useAppForm } from './utils/formContext';

function App() {
  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
    },
    onSubmit: ({ value }) => {
      alert(JSON.stringify(value, null, 2));
    },
  });
  return (
    <div className="form-container">
      <h1 className="form-title">회원가입</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.AppField
          name="email"
          validators={{
            onChange: ({ value }) =>
              !value.includes('@') ? '올바른 이메일을 입력하세요' : undefined,
          }}
        >
          {(field) => <field.TextField label="이메일" />}
        </form.AppField>

        <form.AppField
          name="password"
          validators={{
            onChange: ({ value }) =>
              value.length < 8 ? '8자 이상 입력하세요' : undefined,
          }}
        >
          {(field) => <field.TextField label="비밀번호" type="password" />}
        </form.AppField>

        <form.AppField
          name="passwordConfirm"
          validators={{
            onChangeListenTo: ['password'],
            onChange: ({ value, fieldApi }) => {
              const password = fieldApi.form.getFieldValue('password');
              return value !== password
                ? '비밀번호가 일치하지 않습니다'
                : undefined;
            },
          }}
        >
          {(field) => <field.TextField label="비밀번호 확인" type="password" />}
        </form.AppField>

        <form.AppForm>
          <form.SubmitButton label="가입하기" />
        </form.AppForm>
      </form>
    </div>
  );
}

export default App;
```

<br>

<img src="/images/posts/post21/result.gif" alt="결과 화면" width="300" height="200">

<br>

**참고 자료**

- https://tanstack.com/form/latest
- https://ykss.netlify.app/translation/tanstack_form_vs_react_hook_form/
