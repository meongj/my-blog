---
title: '이미지 로딩 UX 개선기 - 스켈레톤 UI'
date: '2026-02-12 19:57'
description: '앨범 페이지에서 이미지가 하나씩 랜덤하게 나타나며 화면이 불안정해지는 문제를 발견했다. 단순히 스켈레톤 UI를 적용하는 것만으로는 부족했고, 배치 단위 일괄 공개라는 패턴을 조합해야 했다. 브라우저의 이미지 로딩 원리부터 해결까지의 과정을 기록한다.'
section: 'React'
category: 'React'
slug: 'skeleton'
tags: ['skeleton', '스켈레톤UI', '사용자경험']
image: '/images/posts/post26/image.png'
---

# 시작하기

요즘 포트폴리오를 만들면서 예전에 개인 프로젝트로 만들었던 기능을 개선하는 시간을 가졌다. 그 중 앨범페이지에서 여러 사진을 로드해서 가져오는데 이미지가 늦게 로드되면서 부자연스러워 보이는 현상을 발견했다. 어떻게 이 문제를 해결했고 어떻게 개선했는지를 포스팅으로 다루려고 한다.

<br>

## 문제 상황

앨범 페이지에 들어가면 다음과 같이 이미지들이 하나씩 느리게 나타나는 것을 확인할 수 있었다.

<img src="/images/posts/post26/1.gif">

성능이 좋지 않은 환경에서는 이미지가 안나오는 일시적 오류인건지, 로딩중인 상태인건지 사용자 입장에서는 구분할 수 없는 상태였다. 개선이 필요하다고 판단했다.

## 원인 분석

이렇게 보이는 이유는 브라우저에서는 이미지를 **비동기**로 가져오기 때문이다. 만약 이미지가 다 로드될 때까지 화면을 멈추고 기다린다면 사용자는 빈 화면만 보게 되므로, 브라우저는 이미지 로딩을 기다리지 않고 먼저 화면을 렌더링한다.

<br>

### **브라우저가 이미지를 화면에 보여주기까지의 과정**

이미지가 어떻게 화면에 보여지는지 알아보기 위해 간단히 브라우저의 렌더링 순서에 대해 알아보자.

<br>

**1단계. 발견**

렌더링 엔진이 HTML을 파싱을 하다가 다음과 같은 `<img>` 태그를 만나면,

`<img src="[https://example.com/photo.jpg](https://example.com/photo.jpg)" width="400" height="300">`

**2단계. 네트워크 요청**

브라우저 엔진이 네트워크 모듈에게 해당 이미지를 가져오라고 조율을 하고, 네트워크 모듈이 DNS, TCP, HTTP로 실제로 요청해서 이미지 파일을 다운로드한다.

**3단계. 디코딩**

받은 파일은 JPEG, PNG, WebP 등으로 압축된 포맷형태이기 때문에, 이것을 GPU가 그릴 수 있는 픽셀 배열의 비트맵으로 변환하는 디코딩 과정을 거친다.

**4단계. 렌더링 파이프라인**

그 다음에 렌더링 엔진이 DOM 트리와 CSSOM 트리를 결합하여 렌더 트리를 만들고, Layout → Paint → Composite 과정을 거쳐 화면에 이미지가 출력된다.

이 과정에서 핵심은, 브라우저가 여러 스레드를 활용하여 작업을 **병렬로 처리**한다는 점이다. 메인 스레드가 HTML을 파싱하고 DOM을 만드는 동안, 네트워크 스레드는 이미 리소스를 다운로드하고 있다.

그래서 우리가 웹페이지를 볼 때 텍스트가 이미지보다 먼저 나타나는 현상을 볼 수 있다. 텍스트는 HTML을 받는 순간 바로 렌더링할 수 있지만, 이미지는 네트워크 요청 → 다운로드 → 디코딩이라는 추가 단계를 거쳐야 하기 때문이다.

이미 단계 수 자체부터 더 많은 과정을 거치기 때문에 이미지가 더 늦게 뜨는건 당연하다.

이제 이렇게 늦게 뜨는 이미지들을 어떻게 사용자에게 자연스럽게 보여줄 수 있을지 해결해보자

<br>

## 해결 방안

이미지가 로드되는 동안 사용자에게 시각적 피드백을 주고 싶었다. 떠오른 방안은 두 가지였다.

- 로딩스피너 두기
  - 화면 전체나 이미지 영역에 스피너를 표시하는 방식이다. 하지만 로딩 스피너는 보통 배경을 흐리게 처리하기 때문에 이미지가 보이지 않고, 앨범처럼 여러 이미지가 나열되는 UI에서는 스피너가 반복적으로 보여 오히려 산만해질 수도 있었다.
- 스켈레톤 UI
  - 실제 콘텐츠의 레이아웃과 동일한 형태의 플레이스홀더를 보여주는 방식이다. 앨범 페이지 특성상 이미지가 격자로 배치되는 구조이므로, 스켈레톤으로 "곧 이미지가 나타날 것"이라는 예상을 줄 수 있다. 또한 레이아웃을 미리 잡아두기 때문에 이미지가 나타날 때 화면이 밀리는 현상도 방지할 수 있다.

그래서 스켈레톤 UI를 적용하기로 했다.

<br>

### 스켈레톤 적용하기

처음에는 각 이미지가 로드되는 대로 하나씩 스켈레톤을 해제하는 방식으로 구현했다. 하지만 막상 적용해보니, 가장 먼저 로드된 이미지가 하단에서 나타나고, 그 다음은 상단에서 나타나는 식으로 중구난방이어서 오히려 더 어색했다.

그래서 원래 무한 스크롤로 구현이 되어있던 한 페이지를 batch로 묶어서 , 해당 batch에 있는 이미지를 다 로드되면 한 번에 스켈레톤을 해지하는 방식으로 변경했다.

**동작 과정**

- 무한스크롤로 한 페이지당 기본 10개씩 로드
- 10개의 이미지가 모두 로드되면 스켈레톤을 동시에 해제
- 스크롤하여 추가 로드될 때마다 같은 방식 반복

로딩 중일때 실제 아이템대신 스켈레톤 카드 4개를 렌더링한다

```tsx
...
const PAGE_SIZE = 4;
const INITIAL_SIZE = 10;

function BowlCardListPage() {
  const { results, status, loadMore } = usePaginatedQuery(api.files.listFiles, {}, { initialNumItems: INITIAL_SIZE });

  ...

  // 이미지 로딩 상태 추적
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const [revealIds, setRevealedIds] = useState<Set<string>>(new Set());

  // 함수를 캐싱(리렌더링 방지)
  const handleImageLoad = useCallback((id: string) => {
    setLoadedIds((prev) => new Set(prev).add(id));
  }, []);

  ...

  // 스켈레톤 한 페이지씩 보여주기 위함
  useEffect(() => {
    // 공개 안된 이미지들
    const unrevealed = results.filter((b) => b.url && !revealIds.has(b._id));

    // 그 중 전부 로드가 되면
    if (unrevealed.length > 0 && unrevealed.every((b) => loadedIds.has(b._id))) {
      setRevealedIds((prev) => {
        const next = new Set(prev);
        unrevealed.forEach((b) => next.add(b._id));
        return next;
      });
    }
  }, [results, loadedIds, revealIds]);

  ...

  return (
    <div className="mx-auto h-screen max-w-md overflow-y-auto bg-amber-50">
      <div className="flex items-center justify-center py-8">
        <h2 className="mt-10 text-3xl font-medium">My YogurtBowl</h2>
      </div>

      {results.length === 0 && <div className="col-span-2 py-10 text-center text-gray-500">저장된 요거트볼이 없습니다</div>}

      <div className="grid grid-cols-2 gap-4 p-4 pt-4">
        {results?.map((bowl) => (
          <BowlCard
            key={bowl._id}
            id={bowl._id}
            image={bowl.url}
            date={new Date(bowl.createdAt).toLocaleString()}
            onClick={() => navigate(`/detail/${bowl._id}`)}
            isRevealed={revealIds.has(bowl._id)}
            onImageLoad={() => handleImageLoad(bowl._id)}
          />
        ))}
        {status === "LoadingMore" && <LoadingOverlay text="로딩 중..." />}
      </div>
      <div ref={observerRef} aria-hidden="true" />

      <BottomNav isActive="Album" />
    </div>
  );
}

```

이미 무한 스크롤로 데이터를 배치 단위로 로드하고 있었기 때문에, useEffect에서 "아직 공개되지 않은 이미지가 모두 로드 완료되었는지"를 확인하고, 조건을 만족하면 한 번에 공개하는 방식으로 변경했다.

```tsx
...
function BowlCard({ image, onClick, isRevealed = true, onImageLoad }: BowlCardProps) {
  return (
   ...
      {image ? (
        <>
          {!isRevealed && (
            // 스켈레톤
            <div className="relative h-full w-full overflow-hidden bg-gray-200">
              <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </div>
          )}
          <img src={image} alt="생성된 요거트볼" className={`h-full w-full object-cover ${isRevealed ? "" : "hidden"}`} onLoad={onImageLoad} />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-200">
          <span className="text-gray-400">이미지 없음</span>
        </div>
      )}
    </div>
  );
}

```

`isRevealed`가 false인 동안 이미지는 `hidden`으로 숨기고 스켈레톤을 표시한다. 이미지는 숨겨져 있어도 브라우저가 다운로드하므로, 로드가 완료되면 `onLoad` 콜백이 호출된다.

<br>

### **Shimmer 애니메이션 Tailwind CSS**

Shimmer는 빛이 흐르는 효과를 주는 애니메이션으로 현재 대부분의 서비스에서 많이 쓰고 있는 스켈레톤 UI 패턴이다.

Tailwind CSS v4에서 커스텀 애니메이션을 추가하려면 `src/index.css`에 다음과 같이 설정한다

```tsx
@theme {
  --animate-shimmer: shimmer 1.5s infinite;
  @keyframes shimmer {
    0% {
    // 시작 : 왼쪽 바깥부터 시작
      transform: translateX(-100%);
    }
    100% {
    // 끝 : 오른쪽 바깥으로 향함
      transform: translateX(100%);
    }
  }
}
```

1.5초마다 빛이 왼쪽에서 오른쪽으로 스스륵 지나가는 반짝이는 효과를 만들어준다.

**결과 화면**

  <img src="/images/posts/post26/2.gif">

<br>

## **배운점**

- 브라우저의 이미지 로딩은 **비동기**이며, 완료 순서가 보장되지 않는다. `onLoad` 콜백으로 로드 완료 시점을 추적하지 않으면 사용자에게 불안정한 경험을 줄 수 있다.
- 스켈레톤 UI는 단순히 로딩 표시 역할만 하는 것이 아니라, 레이아웃을 미리 잡아줌으로써 콘텐츠가 나타날 때의 레이아웃 밀림(Layout Shift)도 방지한다.
- 사용자는 빈 화면 2초보다 스켈레톤이 있는 3초가 더 짧게 느낀다. UX는 "기능이 되느냐"가 아니라 "기다리는 동안 무엇을 보여주느냐"가 중요하다
