---
title: 'TanStack Query로 낙관적 업데이트 구현하기'
date: '2026-03-30 18:23'
description: '사용자가 버튼을 누르는 즉시 반응하는 낙관적 업데이트의 핵심 원리와 실무 적용법을 다룹니다. useState를 이용한 기초 구현부터 TanStack Query를 활용한 전문적인 캐시 제어 및 실패 시 롤백(Rollback) 처리까지 단계별로 알아보았습니다.'
section: 'React'
category: 'TanStack Query'
slug: 'how-to-build-optimistic-updates-using-tanstack-query'
tags: ['낙관적 업데이트', 'Tanstack Query']
image: '/images/posts/post29/image.png'
---

## 낙관적 업데이트가 필요한 계기

낙관적 업데이트가 필요한 상황은 북마크 기능을 구현할 때였다. 북마크 저장을 누르면 서버에 아직 반영이 안되더라도 바로 UI적으로 반영이 필요한 상황이 필요했다. 우리가 인스타그램에서 좋아요 버튼을 누를 때도 누르자 마자 바로 빨간색 하트가 칠해져있는 것을 볼 수 있다. 만약 서버 DB에 반영이 되고 나서 좋아요 표시가 되면 어떨까? 사용자는 반영이 안된 거라고 느껴 다시 좋아요 버튼을 눌러 중복처리가 될 수도 있고, 오류라고 생각해서 사용자 경험이 좋지 않을 수도 있다.

## 낙관적 업데이트가 뭔가요?

낙관적 업데이트는 바로 서버에서 반영이 성공적으로 될 거라고 낙관적으로 바라보며 서버의 결과와 상관없이 UI를 바로 반영시키는 것을 말한다.

이로 인해 사용자는 즉각적인 UI 피드백을 받을 수 있고, 어떤 네트워크 환경과 상관없이 결과를 바로 볼 수 있다는 것이 장점이 될 수 있다.

## 실제 코드로 어떻게 적용했는지

현재 구현하고 있는 프로젝트에서 TanStack Query를 쓰고 있었다. 서버 상태와 에러, 로딩, 자동 캐싱을 자동으로 관리해주고 있기 때문에 사용하게 됐다.

### 상태관리 라이브러리 없이 낙관적 업데이트 구현하기

개념 이해를 위해 TanStack Query 라이브러리 쓰지 않고, `useState` 만으로 북마크 기능의 낙관적 업데이트를 구현해보았다.

```tsx
export function RecommendPhotos() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set());

  // 커뮤니티 포스트 + 북마크 데이터 로딩
  useEffect(() => {
    fetchPosts().then(setPosts);
    fetchPostBookmarks().then((ids) => setBookmarkedIds(new Set(ids)));
  }, []);

  const handleBookmark = async (postId: string) => {
    let previous: Set<string> | undefined;

    //이전 북마크 이어서 저장
    setBookmarkedIds((prev) => {
      previous = new Set(prev);
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });

    try {
      await togglePostBookmark(postId); // 북마크 추가 or 삭제 API 요청
    } catch {
      if (previous) setBookmarkedIds(previous);
    }
  };

  return (
    <div className="container-ohou py-6">
    ...
      {/* 사진 그리드 */}
      <SectionCarousel
        items={[
          ...posts.map((post) => (
            <div key={post.id} className="group cursor-pointer relative">
              <div className="aspect-3/4 rounded-sm overflow-hidden">
                <img
                  src={post.image_url}
                  alt={post.nickname}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2 absolute bottom-2 left-2 right-2">
                <div className="flex justify-between w-full">
                  <div className="flex gap-1  items-center">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={post.avatar_url ?? undefined} />
                      <AvatarFallback>{post.nickname[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-white font-bold text-xs">{post.nickname}</span>
                  </div>

                  <div className="flex">
                    <button type="button" onClick={() => handleBookmark(post.id)} className="cursor-pointer">
                      <BookmarkIcon
                        className={bookmarkedIds.has(post.id) ? "text-primary fill-primary" : "text-white"}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )),
        ...
    </div>
  );
}

```

오늘의집 사이트를 클론 코딩으로 구현하고 있었는데, 캐러셀 안에 있는 북마크 아이콘을 누르면 북마크가 되는 간단한 기능이다.

위의 코드로 구현한 결과 화면은 다음과 같다.

  <img src="/images/posts/post29/image1.gif">

## **TanStack Query로 구현하기**

TanStack Query로 북마크 기능을 낙관적 업데이트로 바꿔보자

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPostBookmarks, togglePostBookmark } from './api';
import { useMemo } from 'react';

export function usePostBookmarks() {
  const queryClient = useQueryClient();

  const { data: postBookmarks } = useQuery<string[]>({
    queryKey: ['postBookmarks'],
    queryFn: fetchPostBookmarks,
  });

  const bookmarkedIds = useMemo(
    () => new Set(postBookmarks ?? []),
    [postBookmarks]
  );

  const { mutate: toggleBookmark, isPending } = useMutation({
    // 서버에 북마크 토클 요청 보내는 함수
    mutationFn: (postId: string) => togglePostBookmark(postId),

    // 낙관적 업데이트 시작
    // - 버튼을 누르면 서버 응답 오기전에 UI(캐시)를 먼저 바꾼다
    onMutate: async (postId: string) => {
      // 진행 중인 postBookmarks 쿼리를 중단/대기시켜서
      // 낙관적 변경과 충돌하는 응답이 덮어쓰는 걸 방지
      await queryClient.cancelQueries({ queryKey: ['postBookmarks'] });

      // rollback을 위한 변경 전 값을 스냅샷으로 저장
      const previous =
        queryClient.getQueryData<string[]>(['postBookmarks']) ?? [];

      // 배열 -> Set 변경
      const prevSet = new Set(previous);
      if (prevSet.has(postId)) prevSet.delete(postId);
      else prevSet.add(postId);

      // 낙관적으로 캐시를 먼저 갱신(바로 UI 변경)
      queryClient.setQueryData<string[]>(['postBookmarks'], [...prevSet]);
      // onError에서 받을 context로 previous 스냅샷 저장
      return { previous };
    },
    // 서버 요청이 실패했을 때 호출
    // - onMutate에서 저장해둔 previous 캐시로 되돌림(롤백)
    onError: (_err, _postId, context) => {
      if (!context?.previous) return;
      queryClient.setQueryData<string[]>(['postBookmarks'], context.previous);
    },
    // 요청이 성공/실패 상관없이 끝나면 호출
    // - 서버 기준 상태로 다시 동기화하기 위해 재요청(invalidate)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['postBookmarks'] });
    },
  });

  return { bookmarkedIds, toggleBookmark, isPending };
}
```

```tsx
export function RecommendPhotos() {

  // 커뮤니티 포스트 + 북마크 데이터 로딩
  const {data: posts} = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  const {bookmarkedIds, toggleBookmark}=usePostBookmarks();
  ...
 >
```

커스텀 훅(`usePostBookmarks`)으로 낙관적 + 롤백 하는 코드만 따로 분리했다.

낙관적 업데이트를 직접 useState로 하던 것보다, Query로 옮기니 서버 상태 관리가 더 명확해졌고, 캐싱을 통해 서버 응답을 기다리지 않고 화면을 먼저 업데이트시 구현하기가 더 쉬워졌다.

### 실패 시 롤백 처리

TanStack Query의 `useMutation` 은 롤백을 구현할 수 있는 생명주기 함수를 제공해준다.

1. `onMutate` : 서버로 요청 보내기 전에 실행된다. 현재 상태를 백업하고 화면을 바로 업데이트 한다
2. `onError` : 서버 요청이 실패했을 때 실행된다. 여기서 이전에 백업해둔 캐시 데이터로 롤백한다
3. `onSettled` : 성공하든 실패하든 마지막에 무조건 실행된다. 마치 `try...catch의 finally` 와 비슷하다. 이때 서버 데이터와 클라이언트 데이터의 동기화를 위해 refetch를 한다.
   - invalidateQueries : 해당 데이터는 상했으니(stale) 다시 가져오자

## 써보고 느낀 점

사용자는 네트워크가 느린 환경에서도 즉각적으로 UI가 변하는 것을 볼 수 있다. 서버 상태를 UI에 즉시 반영해야 할 때 정말 효율적으로 사용할 수 있고, 직접 캐시관리, 상태관리를 하지 않아도 TanStack Query가 알아서 대신 관리를 해준다는 것도 개발자 친화적이다.

하지만 반대로 UI 전용 상태까지 억지로 끌어온다면, 오히려 복잡도만 올라간다.

### 쓰기에 적합할 때

1. **서버가 진실(source of truth)이고, 클라이언트에서 즉시 반응이 필요할 때**
   - 예: 북마크처럼 버튼 누르는 즉시 하트 상태가 바뀌어야 할 경우
2. **같은 데이터가 여러 화면/컴포넌트에서 공유될 때**
   - posts 목록, postBookmarks 같은 캐시가 여러 곳에서 재사용됨
3. **롤백/동기화가 깔끔하게 필요한 경우**
   - onMutate 스냅샷 저장 + onError에서 되돌리기 + onSettled에서 invalidate로 정합성 확보가 패턴화됨
4. **동시 요청/경쟁(race) 상황을 최소화하고 싶을 때**
   - cancelQueries로 충돌 가능성을 줄이고, 캐시 단위로 제어할 수 있음

### **언제 안 쓰는 게 좋은가 (또는 과할 수 있는가)**

1. **로컬 UI 상태만 바꾸면 되는 경우**
   - 모달 열기/닫기, 입력값, 드롭다운 같은 것까지 Query로 빼면 오히려 보일러플레이트가 늘어남
2. **요청이 한 컴포넌트 내부에만 있고 캐시/공유 가치가 없을 때**
   - 단발성 fetch는 useEffect + state가 더 단순한 경우가 많다

## 마무리

TanStack Query의 낙관적 업데이트는 서버 상태를 캐시로 관리하면서 UX를 즉시 개선하고, 실패 시 롤백/동기화를 패턴으로 해결할 때 가장 좋고, 로컬 전용 상태에는 굳이 쓰지 않는 것을 권장한다.

<br>
<br>

---

**참고 자료**

- https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates
