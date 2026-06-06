# Backend API Performance Review

작성일: 2026-06-06

이 문서는 실제 부하 테스트가 아니라 `back/src` 코드 정적 분석 기준이다. 아래 항목은 트래픽/데이터가 늘 때 느려질 가능성이 높은 API와 개선 방향이다.

## 요약

가장 먼저 손볼 곳은 댓글 상세 API다. 현재 댓글 페이지네이션이 DB에서 되는 게 아니라, 게시글의 모든 댓글/대댓글을 통째로 가져온 뒤 서버 메모리에서 트리 구성과 slice를 한다. 다음 우선순위는 게시글 상세에서 모든 Like 관계를 로드하는 부분, 검색 API의 `%keyword%` 검색과 댓글 검색 방식, 알림/쪽지/채팅의 offset 페이지네이션 및 인덱스 부족이다.

## 우선순위별 이슈

### P0. 댓글 상세/댓글 위치 찾기 API가 전체 댓글을 매번 로드함

대상:
- `back/src/comment/comment.service.ts:247` `findStoryOneComment`
- `back/src/comment/comment.service.ts:395` `findCommentPage`

문제:
- `Story` 하나를 조회하면서 `Comments`, `Comments.User`, `Comments.User.UserImage`, `Comments.parent`, `Comments.children` 등을 모두 relation으로 로드한다.
- 이후 전체 댓글을 `Map`으로 트리화하고, 다시 flat list로 만든 뒤 `slice`로 페이지네이션한다.
- 특정 댓글의 페이지를 찾는 `findCommentPage`도 같은 전체 로드/트리화/평탄화를 반복한다.

영향:
- 댓글이 많은 게시글에서 댓글 10개를 보기 위해 수백/수천 개 댓글과 유저/이미지 관계를 로드한다.
- 댓글 클릭 이동 시 `/page/:commentId` 요청과 댓글 목록 요청이 각각 전체 댓글 트리를 만들 수 있어 같은 비용이 중복된다.
- DB 부하뿐 아니라 Nest 프로세스 메모리와 CPU도 같이 증가한다.

개선 방향:
- 단기: `limit` 상한을 강제하고, `findCommentPage`와 `findStoryOneComment`의 중복 트리 로직을 공통화한다.
- 중기: 댓글에 `rootId`, `depth`, `sortPath` 또는 materialized path를 저장해서 DB에서 정렬/페이지네이션 가능하게 만든다.
- 중기: `findStoryOneComment`는 `Comments` 기준 QueryBuilder로 필요한 컬럼만 select하고, `Story` 전체 relation 로드를 제거한다.
- 장기: `findCommentPage`는 전체 목록을 만들지 말고 정렬 기준상 target comment 앞에 몇 개가 있는지 `COUNT`로 계산한다.

### P1. 게시글 상세가 모든 Like와 Like.User를 로드함

대상:
- `back/src/story/story.service.ts:774` `findStoryOne`

문제:
- 상세 조회에서 `Likes`, `Likes.User` relation까지 로드한 뒤 JS에서 `filter`로 좋아요/싫어요 수를 계산한다.
- `Story.like_count` 컬럼을 이미 유지하고 있는데도 상세 조회에서 전체 Like row를 다시 가져온다.
- 읽기 조회와 조회수 증가를 위해 명시 트랜잭션을 열고 있다.

영향:
- 추천/비추천이 많은 게시글일수록 상세 API 응답 시간이 증가한다.
- `Likes.User`까지 로드하므로 응답에 쓰지 않는 유저 데이터까지 join/load된다.
- 단순 조회 API가 트랜잭션을 잡아 DB 커넥션 점유 시간이 길어진다.

개선 방향:
- `Likes`, `Likes.User` relation 제거.
- `like_count`를 추천 점수로 그대로 쓰고, 필요하면 dislike count는 별도 컬럼으로 denormalize하거나 aggregate query로 가져온다.
- 조회수 증가는 `increment` 단독 실행으로 분리하고, 상세 데이터 조회는 일반 read query로 처리한다.

### P1. 검색 API가 wildcard 검색과 대량 IN 쿼리에 취약함

대상:
- `back/src/story/story.service.ts:271` `searchStory`
- `back/src/story/story.service.ts:510` `cardSearchStory`

문제:
- 제목/내용/작성자 검색이 `%${query}%` 형태다. 일반 B-tree 인덱스로는 앞 wildcard 검색을 효율적으로 처리하기 어렵다.
- 댓글 검색은 먼저 `comment.content LIKE :query`로 매칭되는 모든 `storyId`를 `DISTINCT`로 가져온 뒤 `id: In(storyIds)`로 게시글을 조회한다.
- 댓글 검색 결과가 많으면 `storyIds` 배열과 `IN (...)` 조건이 커진다.
- `searchStory`와 `cardSearchStory`에 거의 같은 로직이 중복되어 개선 누락 가능성이 높다.

영향:
- 데이터가 많아질수록 검색 API가 테이블 스캔에 가까워질 수 있다.
- 댓글 검색은 검색어가 흔할수록 메모리 사용량과 SQL 길이가 커진다.

개선 방향:
- MySQL 기준 `FULLTEXT(title, content)` 및 댓글 `FULLTEXT(content)` 검색으로 전환 검토.
- 댓글 검색은 `comment -> story` join QueryBuilder에서 바로 필터/정렬/페이지네이션한다.
- 검색 공통 함수를 하나로 합치고, table/card 차이는 select/response mapper만 나눈다.

### P1. 카드 게시글 목록이 첫 이미지만 필요한데 모든 이미지를 로드함

대상:
- `back/src/story/story.service.ts:142` `findCardStory`
- `back/src/story/story.service.ts:510` `cardSearchStory`

문제:
- 카드 목록에서 `firstImage: StoryImage[0]`만 쓰지만 relation으로 `StoryImage` 전체를 로드한다.

영향:
- 이미지가 많은 게시글이 목록에 섞이면 목록 API 응답 크기와 join 비용이 커진다.

개선 방향:
- `Story`에 `thumbnailImageId` 또는 `thumbnailUrl`을 denormalize한다.
- 대안으로 QueryBuilder subquery/window function으로 첫 이미지 1개만 join한다.

### P2. 알림 unread API가 페이지네이션 없이 전체 unread를 로드함

대상:
- `back/src/notification/notification.service.ts:74` `findUnread`

문제:
- unread 알림 전체를 relation 다수와 함께 모두 가져온다.
- dropdown 용도라면 보통 최근 N개와 unread count만 필요하다.

영향:
- 알림을 오래 읽지 않은 사용자는 한 번의 요청에서 많은 알림과 관련 댓글/게시글/채널 데이터를 로드한다.

개선 방향:
- `findUnread(userId, limit = 20)` 형태로 제한한다.
- unread 개수는 이미 `getUnreadCount`가 있으므로 목록은 최근 일부만 반환한다.
- 관계 전체 로드 대신 필요한 컬럼만 select한다.

### P2. 쪽지/채팅/알림 목록이 offset pagination에 의존함

대상:
- `back/src/messages/messages.service.ts:71` `getReceivedMessages`
- `back/src/messages/messages.service.ts:109` `getSentMessages`
- `back/src/channel-chat/channel-chat.service.ts:24` `getChannelChatMessages`
- `back/src/notification/notification.service.ts:134` `findAll`
- `back/src/story/story.service.ts:66` `findStory`
- `back/src/story/story.service.ts:142` `findCardStory`
- `back/src/auth/auth.service.ts:243` `userFindStory`
- `back/src/auth/auth.service.ts:292` `userFindComments`

문제:
- 대부분 `skip/take` 또는 `offset/limit` 방식이다.
- offset이 커질수록 DB는 앞쪽 row를 많이 건너뛰어야 한다.

영향:
- 깊은 페이지로 갈수록 느려진다.
- 채팅처럼 계속 쌓이는 데이터는 특히 cursor 방식이 더 적합하다.

개선 방향:
- 최신순 목록은 `created_at` 또는 `id` 기반 cursor pagination으로 전환한다.
- 예: `WHERE id < :cursorId ORDER BY id DESC LIMIT :limit`.
- 기존 페이지 번호 UI가 꼭 필요하면 앞쪽 페이지는 offset 유지, 무한 스크롤/채팅/알림은 cursor로 분리한다.

### P2. Message 엔티티에 조회 패턴용 인덱스가 없음

대상:
- `back/src/entities/Message.entity.ts`
- `back/src/messages/messages.service.ts:71`
- `back/src/messages/messages.service.ts:109`

문제:
- 받은 쪽지: `receiver.id`, `createdAt DESC`
- 보낸 쪽지: `sender.id`, `createdAt DESC`
- 미읽음 개수: `receiver.id`, `isRead`
- 그런데 `Message` 엔티티에는 `@Index`가 없다.

영향:
- 쪽지가 누적되면 목록/미읽음 count가 느려질 가능성이 높다.

개선 방향:
- `@Index(['receiver', 'createdAt'])`
- `@Index(['sender', 'createdAt'])`
- `@Index(['receiver', 'isRead'])`

### P2. 채널 전체 목록은 모든 채널과 relation을 한 번에 반환함

대상:
- `back/src/channels/channels.service.ts:24` `findAll`

문제:
- 모든 채널을 `creator`, `ChannelImage` relation과 함께 반환한다.
- 현재 채널 수가 적으면 문제 없지만, 채널이 많아지면 홈/채널 목록 진입 비용이 계속 증가한다.

개선 방향:
- `page/limit` 또는 cursor 추가.
- 목록에서는 creator 전체 대신 nickname/id 등 필요한 컬럼만 select한다.
- 구독자 수/게시글 수는 이미 denormalized count 컬럼을 쓰는 방향이 좋다.

### P2. 파일 삭제가 요청 처리 중 동기 I/O로 실행됨

대상:
- `back/src/story/story.service.ts` `updateStory`, `deleteStory`

문제:
- `fs.existsSync`, `fs.unlinkSync`가 request path 안에서 실행된다.
- 로컬 파일 시스템 기준으로도 event loop를 막고, 파일 수가 많으면 API 응답이 느려진다.

개선 방향:
- `fs.promises.unlink`로 비동기화한다.
- 더 좋게는 DB 삭제와 응답을 우선 처리하고, 파일 삭제는 background job/queue로 넘긴다.
- S3 운영 환경에서는 S3 delete도 batch/background 처리한다.

## 이미 좋아진 부분

- `Story`에는 `category/isNotice/created_at`, `Channel/isNotice/created_at`, `User/created_at` 계열 인덱스가 있다.
- `Comments`에는 `Story/created_at`, `User/created_at`, `Story/parent` 인덱스가 있다.
- `Likes`에는 `User + Story` unique와 `Story/vote` 인덱스가 있다.
- `Notification`과 `ChannelChatMessage`에도 주요 목록 조회용 인덱스가 일부 있다.
- 게시글 추천 수는 `Story.like_count`로 denormalize되어 있어, relation 로드만 제거하면 상세/목록 성능을 더 쉽게 개선할 수 있다.

## 추천 작업 순서

1. `findStoryOne`에서 `Likes`, `Likes.User` relation 제거.
2. `findStoryOneComment`와 `findCommentPage`의 전체 댓글 로드 제거 설계.
3. `Message` 인덱스 추가.
4. `findUnread`에 limit 추가.
5. 카드 목록의 전체 `StoryImage` relation 로드 제거.
6. 검색 API를 FULLTEXT 또는 join 기반 페이지네이션으로 재작성.
7. 채팅/알림/쪽지의 cursor pagination 도입.

## 확인 방법

개선 전후에는 다음을 측정하는 것이 좋다.

- 같은 게시글에 댓글 10개, 100개, 1,000개가 있을 때 `/api/story/detail/comment/:id` 응답 시간.
- 같은 게시글에 추천 10개, 1,000개가 있을 때 `/api/story/detail/:id` 응답 시간.
- 쪽지/알림 10,000건 사용자 기준 목록 첫 페이지와 깊은 페이지 응답 시간.
- DB slow query log 또는 `EXPLAIN` 결과.
