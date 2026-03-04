# 프론트엔드 성능 및 반응속도 최적화 가이드

이 문서는 프로젝트의 스크롤 속도, 렌더링 성능, 그리고 전반적인 사용자 반응 속도를 향상시키기 위한 최적화 전략을 다룹니다.

## 1. 리스트 렌더링 최적화 (가장 중요)

현재 `MainView.tsx`와 `ChannelTopStories.tsx` 등에서 배열을 `.map()`으로 순회하며 컴포넌트를 렌더링하고 있습니다. 데이터가 많아지거나 각 항목의 DOM이 복잡하면 스크롤 버벅임(Jank)의 주원인이 됩니다.

### ✅ Virtualization (가상화) 도입
화면에 보이는 요소만 렌더링하고, 스크롤되지 않은 영역의 요소는 메모리에만 유지하는 기술입니다.

*   **라이브러리 추천:** `react-virtuoso` 또는 `react-window`
*   **적용 대상:** 게시글 리스트(`CustomizedTables`), 카드 뷰(`CustomizedCardView`)
*   **기대 효과:** DOM 노드 개수를 획기적으로 줄여 스크롤 프레임 드랍 방지.

```tsx
// 예시: react-virtuoso 사용
import { Virtuoso } from 'react-virtuoso'

export default function OptimizedList({ data }) {
  return (
    <Virtuoso
      style={{ height: '800px' }}
      totalCount={data.length}
      itemContent={(index) => <div>{data[index].title}</div>}
    />
  )
}
```

### ✅ CSS `contain` 속성 활용
브라우저에게 해당 요소의 레이아웃 변경이 외부에 영향을 주지 않음을 알려주어 리플로우(Reflow) 연산을 줄입니다. 리스트 아이템 컴포넌트에 적용하세요.

```css
.list-item {
  contain: content; /* 또는 strict */
}
```

## 2. 이미지 최적화

이미지 로딩은 스크롤 성능에 직접적인 영향을 줍니다.

### ✅ Next.js `<Image>` 컴포넌트 사용
HTML `<img>` 태그 대신 Next.js의 `Image`를 사용하여 자동 리사이징, Lazy Loading, WebP 변환을 적용하세요.

```tsx
import Image from 'next/image';

<Image
  src={imageUrl}
  alt="설명"
  width={300}
  height={200}
  placeholder="blur" // 로딩 중 흐릿한 이미지 표시
  loading="lazy" // 뷰포트에 들어올 때 로드
/>
```

## 3. 데이터 패칭 및 상태 관리 최적화

### ✅ React Query (TanStack Query) 설정 튜닝
`useStories` 훅 등에서 React Query를 사용 중이라면, 다음 옵션을 점검하여 "깜빡임"과 불필요한 네트워크 요청을 줄이세요.

*   **`keepPreviousData: true` (v4) / `placeholderData: keepPreviousData` (v5):** 페이지네이션 이동 시 새 데이터를 불러오는 동안 이전 데이터를 유지하여 UI가 사라지는 것을 방지합니다.
*   **`staleTime` 증가:** 데이터가 자주 변하지 않는다면(예: 공지사항, 랭킹), `staleTime`을 늘려 불필요한 백그라운드 재요청을 막습니다.

### ✅ 프리페칭 (Prefetching)
사용자가 다음 페이지로 이동할 가능성이 높을 때(예: 페이지네이션 버튼에 마우스를 올렸을 때) 다음 페이지 데이터를 미리 받아옵니다.

```tsx
const queryClient = useQueryClient();

const onHoverNextPage = () => {
  queryClient.prefetchQuery(['stories', nextPage], fetchStories);
};
```

## 4. 컴포넌트 렌더링 최적화

### ✅ 불필요한 리렌더링 방지
`MainView`는 여러 상태(`categoryValue`, `currentPage` 등)를 가지고 있습니다. 하위 컴포넌트가 불필요하게 리렌더링되지 않도록 `React.memo`를 적절히 사용하세요.

*   특히 데이터 테이블이나 리스트 아이템 컴포넌트는 `props`가 변하지 않으면 리렌더링되지 않도록 감싸주세요.

```tsx
const StoryItem = React.memo(({ story }) => {
  return <div>...</div>;
});
```

### ✅ 동적 임포트 (Dynamic Import)
초기 로딩에 필요 없는 무거운 컴포넌트(예: 글쓰기 에디터, 복잡한 모달, 차트 등)는 나중에 로드하도록 변경합니다.

```tsx
import dynamic from 'next/dynamic';

const HeavyModal = dynamic(() => import('./HeavyModal'), {
  loading: () => <p>Loading...</p>,
  ssr: false // 클라이언트 사이드 전용인 경우
});
```

## 5. 기타 UX/UI 반응성 향상

### ✅ 스켈레톤 UI (Skeleton Loading)
데이터가 로딩되는 동안 빈 화면이나 단순한 스피너 대신, 콘텐츠의 뼈대(Skeleton)를 보여주어 체감 로딩 속도를 높입니다. MUI의 `Skeleton` 컴포넌트를 활용하세요.

### ✅ `will-change` 속성 (주의해서 사용)
애니메이션이 있거나 변형이 일어나는 요소(예: 호버 효과가 있는 카드)에 `will-change`를 미리 선언하면 브라우저가 최적화 준비를 합니다. 단, 과도하게 사용하면 메모리를 많이 차지하므로 정말 필요한 곳에만 사용하세요.

```css
.card-hover-effect {
  will-change: transform, opacity;
}
```

---

**요약: 당장 효과를 볼 수 있는 순서**

1.  **이미지 최적화:** 모든 `img` 태그를 `next/image`로 교체.
2.  **데이터 유지:** React Query의 `keepPreviousData` 옵션 적용 (페이지네이션 깜빡임 제거).
3.  **가상화 (선택적):** 리스트가 50개 이상으로 길어진다면 `react-virtuoso` 도입.
