---
title: 'Intersection Observer과 무한 스크롤'
date: '2025-11-18 19:30'
description: 'IntersectionObserver API를 활용한 무한 스크롤 구현 방법을 다룬다. 사용자가 페이지 끝에 도달하기 전에 데이터를 미리 로딩하여 끊김 없는 자연스러운 스크롤 경험을 제공하는 방법을 알아보자.'
section: 'React'
category: 'React'
slug: 'Intersection-Observer'
tags: ['IntersectionObserver', '무한스크롤', '리액트']
image: '/images/posts/post19/image.jpeg'
---

# 시작하기

무한 스크롤이란 스크롤이 바닥에 가까워지면 자동으로 다음 데이터 불러오는 방식을 말한다.

전통적인 방식으로는 Scroll Event가 있는데 스크롤이 하단에 도달했는 지를 계속 감시를 해야하기 때문에 성능 저하가 일어날 수 있다는 문제가 생긴다.

그래서 요즘 자주 쓰는 방법은 Intersection Observer를 사용하는 것이다. Intersection Observer는 비유를 하자면 경비원이 매번 누가 왔는지 확인하고 있지 않고 센서를 달아서 경비원은 다른 일을 하고 있고 센서가 감지를 해서 누가 왔을 때 확인을 할 수 있는 방식을 말한다.

그래서 경비원은 계속 확인을 안해도 되니 다른 일을 하면서 기다릴 수 있어서 효율적이다.

## Intersection Observer API

브라우저가 제공하는 내장 기능이라서 설치할 필요 없이 바로 가져다 쓸 수 있다.

### 동작 과정

1. 관찰자(Observer)를 먼저 생성한다

   어떤 요소를 감시할 건지, 언제 알려줄 건지, 어떻게 반응할 것인지 브라우저에게 전달해준다.

2. 관찰자가 감시를 시작한다.

   브라우저가 어떤 요소를 감시할 것인지 눈여겨 보기 시작한다. 이때 계속 확인하지 않고 브라우저가 알아서 효율적으로 체크를 한다.

3. 교차 발생(Intersection)

   관찰하고 있던 요소가 화면에 딱 들어오는 순간 보고 브라우저가 관찰자에게 알려준다. 브라우저는 렌더링을 하기 위해 어떤 요소가 어디에 있는지 이미 알고 있다. 그렇기 때문에 이미 계산을 하고 있어서 코드로 확인할 필요없이 관찰자에게 바로 알려 줄 수 있는 것이다.

4. 콜백 실행

   미리 지정해둔 함수가 자동으로 실행되고 데이터를 더 불러오게 된다.

과정은 살펴봤고 이제 코드로 알아보자!

```tsx
function InfiniteScroll() {
// 관찰할 대상을 미리 준비
    const observerRef = useRef<HTMLDivElement>(null);

    useEffect(()=> {

        // 관찰자 생성하기
        const observer = new IntersectionObserver(
            (entries) => {console.log('보임');},
            { threshold: 0.5 }
        );

        if (observerRef.current) {
        // 감시 시작하기
            observer.observe(observerRef.current);
        }
        // 정리: 컴포넌트가 사라질 때 실행됨 (메모리 누수 방지)
        return () => observer.disconnect();
    }, []);


    return (
        <div ref={observerRef}>감시할 대상</div>;
    );

}
```

entries는 배열로 감시중인 요소의 정보가 들어있다.

<img src="/images/posts/post19/result2.png" alt="entries 이미지">

여기서 객체 전체의 요소를 살펴보면 다음과 같다.

- target : 어떤 요소인가
- isIntersecting : 화면에 보이는지 유무 (boolean)
- intersectionRatio : 요소가 화면에 몇% 보이는지 (number)
- intersectionRect : 화면에 실제로 보이는 영역의 크기와 위치
- boundingClientRect : 요소 전체 크기와 위치
- rootBounds : 화면 (root) 크기

<br>

그래서 정리를 하자면,

마운트시 Observer를 생성하고 브라우저가 계속 감시하고 있다가, 보이게 되면 브라우저가 콜백을 호출해서 자동으로 알려준다. 그리고 마지막엔 언마운트시 disconnect() 를 쓰게 되면 메모리에서 정리가 되는 과정으로 진행된다.

**적용한 코드**

```tsx
import { usePaginatedQuery } from 'convex/react';
import BowlCard from '../components/BowlCard';
import { api } from '../../convex/_generated/api';
import { useEffect, useRef } from 'react';

function BowlCardListPage() {
  const observerRef = useRef<HTMLDivElement>(null);
  const { results, status, loadMore } = usePaginatedQuery(
    api.files.listFiles,
    {},
    { initialNumItems: 2 }
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && status === 'CanLoadMore') {
          // 데이터 로드
          loadMore(3);
        }
      },
      {
        threshold: 0.1, // 10% 보이면
        rootMargin: '0px 0px 300px 0px', //하단영역  300px 전에 미리 로드
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    // cleanup
    return () => observer.disconnect();
  });

  if (results.length === 0) {
    return (
      <div className="col-span-2 text-center py-10 text-gray-500">
        저장된 요거트볼이 없습니다
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto max-w-md mx-auto bg-amber-50">
      <div className="flex justify-center items-center py-8">
        <h2 className="text-xl font-medium">My YogurtBowl</h2>
      </div>
      <div className="grid grid-cols-2 gap-7 p-20 pt-10">
        {results?.map((bowl) => {
          return (
            <BowlCard
              key={bowl._id}
              id={bowl._id}
              image={bowl.url}
              date={new Date(bowl.createdAt).toLocaleString()}
            />
          );
        })}
        {status === 'LoadingMore' && (
          <div className="col-span-2 text-center py-10">로딩 중...</div>
        )}
      </div>
      <div ref={observerRef} className="h-1 " />
    </div>
  );
}

export default BowlCardListPage;
```

개인 프로젝트에 적용한 코드인데 참고로 React와 Convex를 사용하고 있다.

감시 대상을 마지막 아이템 보다 조금 위에 둬서 스크롤을 끝까지 내리기 전에 미리 데이터를 로딩할 수 있도록 UX를 개선하려 했다. `rootMargin: "0px 0px 300px 0px"`를 사용해 화면(Viewport) 하단에서 300px \*\*\*\*전에 감시 대상이 감지되도록 설정했고, `threshold: 0.1`로 감시 대상의 10%가 보이면 트리거되도록 했다.

<br>

**결과 화면**

<img src="/images/posts/post19/result.gif" alt="결과" width="400">

<br>
<br>

**참고 자료**

- [https://developer.mozilla.org/ko/docs/Web/API/Intersection_Observer_API](https://developer.mozilla.org/ko/docs/Web/API/Intersection_Observer_API)
