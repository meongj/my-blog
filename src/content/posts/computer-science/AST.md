---
title: '컴파일러와 AST - 코드가 실행되는 과정'
date: '2025-06-29 21:29'
description: '우리가 작성한 코드는 컴퓨터에서 어떻게 실행하고 있을까?  개발자가 작성한 코드 한 줄이 어떤 과정을 거쳐서 컴퓨터가 읽고 실행할 수 있는지 컴파일러와 AST에 대해 자세히 알아보자.'
section: 'Computer Science'
category: 'Language'
slug: 'ast'
tags: ['AST', '추상구문트리', '컴파일러', '코드실행과정', '프로그래밍언어처리']
image: '/images/posts/post9/image.png'
---

## 시작하기

우리가 작성한 코드는 컴퓨터에서 어떻게 실행하고 있을까?  
개발자가 작성한 코드 한 줄이 어떤 과정을 거쳐서 컴퓨터가 읽고 실행할 수 있는지 **컴파일러와 AST**에 대해 자세히 알아보자.

## 컴파일러란?

<img src="/images/posts/post9/1.png" />

AST에 대해 알아보기 전에 우선 **컴파일러**가 무엇인지 알아보자.  
컴파일러란 일반적으로 **한 언어를 다른 언어로 변환**하는 역할을 한다.

개발자가 작성하는 Python, Java, C#, JavaScript 등과 같은 **고급 언어**는 사람이 이해하기 쉬운 언어이지만, 컴퓨터는 **0과 1로 이루어진 기계어만 이해**를 한다.  
이때 고급언어를 저급언어(기계어)로 번역해주는 도구가 필요한데, 그것이 바로 **컴파일러**이다.

> 고급언어 → 컴파일러(번역) → 기계어

예를 들면, 한글을 파파고 번역기로 영어로 번역하는 것처럼, **파파고가 바로 컴파일러의 역할**을 한다고 생각하면 된다.

## 인터프리터와 컴파일러 비교

그렇다면 컴파일러와 다른 번역기들은 어떤 차이점이 있을까? 간략하게 알아보자. 아래는 개념 이해에 도움이 되었던 [유튜브 영상](https://www.youtube.com/watch?v=Dx2tSsd3aFc)도 함께 소개한다.

### 인터프리터

- 인터프리터(interpreter)는 이름 그대로 중간(inter)에 있다는 뜻을 가진다. 코드를 한 줄씩 읽고 즉시 번역해서 실행한다.
- 지시를 한 줄씩 듣고 바로 실행하는 것과 같다.
- 파이썬처럼 웹 프론트엔드의 자바스크립트처럼 빠른 개발에 유리하다

### 컴파일러

- 컴파일러(complie)은 차곡 차곡 쌓는다(pile together)의 의미를 가지고 있다. 전체 프로그램을 차곡 차곡 쌓아서 전체를 한 번에 번역한다. 로봇이 모든 수리 지시를 한꺼번에 받은 후 전체 계획을 세워 작업을 시작하는 것과 같다.
- 실행 속도가 빠르고 하드웨어 제어나 높은 성능이 필요한 경우에 적합하다
- C, C++ 처럼 운영체제나 게임 개발에 주로 사용된다

## 하이브리드 방식 언어

컴파일러와 인터프리터가 어떤 녀석인지 개념적으로 큰 틀이 잡혔다면, 우리가 사용하는 개발 언어들은 어떻게 실행되고 있을까? 예를 들어 자바스크립트는 인터프리터와 컴파일어의 특징을 모두 가지고 있다. 초기에는 순수한 인터프리터 방식으로 동작했지만, 웹 규모가 점점 커짐에 따라 실행 속도가 빨라져야했다. 그래서 지금의 자바스크립트는 JIT(Just-In-Time) 컴파일러 방식을 사용하고 있다.

# AST 정의

그렇다면 컴파일러가 이러한 번역과정을 어떻게 처리하고 있을까? 단순히 문자열인 코드를 곧바로 기계어로 바꾸는 건 쉽지 않다. 이때 중요한 역할을 하는 녀석이 바로 AST(Abstract Syntax Tree, 추상 구문 트리)이다.

<img src="/images/posts/post9/2.png" />

AST란 프로그래밍 언어로 작성된 소스 코드를 컴퓨터가 이해하기 쉽도록 트리(Tree) 형태로 표현한 자료구조이다. 코드의 구조와 의미를 추상화 시켜서 계층적으로 보여준다.

### AST가 있기 전에는 어떻게 처리했을까?

단순히 코드를 문자열 그대로 해석하거나, 파싱 과정에서 생성되는 파스 트리(Parse Tree)를 그대로 사용하는 경우가 많았다. 하지만 이 방법들은 코드의 의미를 파악하고 처리하는 데 있어서 비효율적이고 복잡하다는 단점이 있었다.

### 파스 트리(Parse Tree)와 AST의 차이점

AST와 파스 트리 모두 코드의 구조를 나타내지만 표현하는 방식에서 차이가 있다.
`a + b * c;` 라는 코드를 예시로 살펴보자

**파스 트리 (Concrete Syntax Tree)**

문법 규칙을 모든 레벨에서 다 표현하는 특징이 있다. 코드의 모든 문법적인 요소를 그대로 다 담고있고, 심지어 불필요한 중간 노드나 괄호 ,연산자 우선순위와 관련된 세부적인 규칙까지 전부 포함하고 있다.
구조가 복잡해서 가독성이 낮다

```
expr
├── expr
│ └── id(a)
├── +
└── term
├── id(b)
└── *
└── id(c)

```

**AST (Abstract Syntax Tree)**

반면에 AST는 의미상 중요한 것만 추려내서 간결하게 표현한다. 코드의 논리적인 의미를 반영해서 핵심적인 구조만 나타낸다.
컴파일러 내부에서 주로 사용되고 구조가 단순해서 가독성이 훨씬 높다

```
     +
     / \
    a   *
       / \
      b   c
```

## 예시 코드

다음과 같은 코드가 있으면, 이 코드를 간단하게 표현한 AST 구조는 다음과 같다.
`let x = 5 + 3;`

### AST 구조

```
VariableDeclaration
├── kind: "let"
└── declarations:
    └── VariableDeclarator
        ├── id: Identifier("x")
        └── init:
            BinaryExpression
            ├── operator: "+"
            ├── left: Literal(5)
            └── right: Literal(3)
```

- **VariableDeclaration** : 변수 선언 전체를 나타내는 노드
- **kind: "let"** : 선언 종류
- **VariableDeclarator** : 변수 하나에 대한 선언
- **init** : 초기화 값
- **BinaryExpression** : 덧셈 연산
- **Literal(5), Literal(3)** : 피연산자

## AST의 역할

### 1. 의미 분석 (Semantic Analysis)

- 문법적으로는 맞지만 의미적으로 틀린 코드를 찾아낸다. 예를 들면 선언되지 않은 변수를 사용하거나 숫자와 문자열을 곱셈 연산을 하는 등 언어의 규칙을 어긋나는 부분을 검사한다
- 예: 선언되지 않은 변수, 타입 오류

### 2. 최적화 (Optimization)

- 코드를 더 효율적으로 실행되도록 개선하는 단계이다. 불필요한 코드를 제거 하거나 더 빠른 방식으로 코드를 재구성한다
  예를 들어, 5 + 3과 같은 상수를 미리 계산하여 8 로 바꾼다

### 3. 코드 생성 (Code Generation)

- 최적화된 AST를 바탕으로 실제 기계어나 중간 코드를 생성한다
- 이때 컴파일러는 AST의 노드를 순회하면서 해당 노드에 맞는 기계어 명령어를 만든다

## 실제 사용 예시

AST 는 컴파일러 내부에서만 사용되지 않고 우리가 사용하는 개발 도구에서도 사용되고 있다.

### Babel : 자바스크립트 트랜스파일링

<img src="/images/posts/post9/3.png" />

Babel은 최신 버전 자바스크립트(ES6+) 코드를 구형 브라우저에서도 동작할 수 있도록 이전 자바스크립트 코드로 변환해주는 트랜스파일러이다

### JSX → React 코드로의 변환 과정

JSX는 JavaScript의 확장 문법이지만 브라우저가 직접 이해하지 못하기 때문에 Babel이 AST를 활용해 변환한다.

```js
const element = <h1>Hello</h1>;
```

이 JSX 코드는 실제 브라우저에서 실행되기 위해서 다음과 같이 자바스크립트 코드로 변환된다.

```
const element = React.createElement("h1", null, "Hello");
```

**1. JSX 코드 → AST로 파싱 (Parsing)**
Babel은 먼저 입력된 JSX 코드를 읽어서 AST로 변환하고 이때 JSX 문법에 해당하는 JSXElement, JSXText 등의 노드가 생성된다.

```
{
  "type": "VariableDeclaration",
  "declarations": [
    {
      "type": "VariableDeclarator",
      "id": { "type": "Identifier", "name": "element" },
      "init": {
        "type": "JSXElement",
        "openingElement": {
          "type": "JSXOpeningElement",
          "name": { "type": "JSXIdentifier", "name": "h1" },
          "attributes": []
        },
        "children": [
          {
            "type": "JSXText",
            "value": "Hello"
          }
        ]
      }
    }
  ]
}
```

**2. JSX 관련 노드를 CallExpression (React.createElement) 형태로 변환**

Babel의 JSX 플러그인 (@babel/plugin-transform-react-jsx)이 이 AST를 순회하며 변환(Transform) 작업을 수행합니다. 이 플러그인은 JSXElement와 같은 JSX 관련 노드를 CallExpression 노드, 즉 React.createElement 함수 호출 형태로 변경한다.

```
{
  "type": "CallExpression",
  "callee": {
    "type": "MemberExpression",
    "object": { "type": "Identifier", "name": "React" },
    "property": { "type": "Identifier", "name": "createElement" }
  },
  "arguments": [
    { "type": "StringLiteral", "value": "h1" },
    { "type": "NullLiteral" },
    { "type": "StringLiteral", "value": "Hello" }
  ]
}
```

**3. AST → 새 코드로 출력 (Code Generation)**

수정된 AST를 바탕으로 코드 생성기(Code Generator)가 실제 브라우저가 이해할 수 있는 자바스크립트 코드로 생성해서 출력한다.
Babel 뿐만 아니라 ESLint는 자바스크립트 코딩 규칙을 잘 지니는지, 실수한 코드가 없는지 검사하면서 AST를 사용하고, Prettier 포매터도 AST를 사용해서 코드를 재정렬을 시켜준다.

# 요약

- AST는 컴파일러가 코드를 이해하고 오류를 찾아내고 성능을 향상시키기 위해 최종적으로 컴퓨터가 실행할 수 있는 언어로 변환하는 다리 역할을 한다
- 단순한 파싱을 넘어 의미 분석, 최적화, 코드 생성까지 모든 단계를 거친다
- Babel, ESLint, Prettier와 같은 다양한 개발 도구들도 AST를 기반으로 동작하여 개발자의 생산성을 높여준다

## Reference

- [추상 구문 트리](https://ko.wikipedia.org/wiki/추상_구문_트리)
