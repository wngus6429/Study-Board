# 📋 Study Board 코딩 룰 가이드 (최신화)

## 🎯 개요

이 문서는 Study Board 프로젝트에서 일관된 코드 품질과 스타일을 유지하기 위한 **코딩 스타일 가이드**와 **프로젝트 구조 규칙**을 정의합니다.

**프로젝트 규모**: 3-4년차 시니어급 프로젝트  
**기술 스택**: Next.js 14 + NestJS 10.0.0 + TypeScript 5.1.3  
**데이터베이스**: MySQL (20개 엔티티)  
**실시간 통신**: Socket.IO 4.8.1  
**상태 관리**: Zustand + TanStack React Query  
**인증**: NextAuth.js (JWT + Session)

---

## 🏗️ 프로젝트 구조 규칙

### 📁 실제 디렉토리 구조

```
Study-Board/
├── front/                          # 프론트엔드 (Next.js 14)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (beforeLogin)/       # 로그인 전 페이지
│   │   │   │   ├── login/
│   │   │   │   └── signup/
│   │   │   ├── (afterLogin)/        # 로그인 후 페이지
│   │   │   │   ├── blinds/          # 블라인드 관리
│   │   │   │   ├── messages/        # 메시지 관리
│   │   │   │   ├── notifications/   # 알림 관리
│   │   │   │   ├── reports/         # 관리자 리포트
│   │   │   │   ├── scraps/          # 스크랩 관리
│   │   │   │   ├── setting/         # 설정 페이지
│   │   │   │   └── write/           # 글쓰기 페이지
│   │   │   ├── (noLogin)/           # 로그인 상관없는 페이지
│   │   │   │   ├── channels/        # 채널 페이지
│   │   │   │   │   ├── [slug]/      # 동적 채널
│   │   │   │   │   │   ├── ChannelsDetailClient.tsx
│   │   │   │   │   │   └── detail/
│   │   │   │   │   ├── ChannelsClient.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── channel-notifications/
│   │   │   │   ├── notice/
│   │   │   │   └── profile/
│   │   │   ├── components/          # 공통 컴포넌트
│   │   │   │   ├── Provider/        # 프로바이더 컴포넌트
│   │   │   │   │   ├── AuthSessionCom.tsx
│   │   │   │   │   ├── BrowserNotification.tsx
│   │   │   │   │   ├── RQProvider.tsx
│   │   │   │   │   ├── SitePasswordGate.tsx
│   │   │   │   │   ├── SubscriptionProvider.tsx
│   │   │   │   │   └── ThemeProvider.tsx
│   │   │   │   ├── common/          # 범용 컴포넌트
│   │   │   │   │   ├── ChannelDialog/
│   │   │   │   │   │   ├── CreateChannelDialog.tsx
│   │   │   │   │   │   └── EditChannelImageDialog.tsx
│   │   │   │   │   ├── Advertisement.tsx
│   │   │   │   │   ├── ChannelNoticeModal.tsx
│   │   │   │   │   ├── ConfirmDialog.tsx
│   │   │   │   │   ├── Loading.tsx
│   │   │   │   │   ├── Pagination.tsx
│   │   │   │   │   ├── ReportModal.tsx
│   │   │   │   │   ├── RichTextEditor.tsx
│   │   │   │   │   ├── SearchBar.tsx
│   │   │   │   │   └── SendMessageModal.tsx
│   │   │   │   ├── table/           # 테이블 컴포넌트
│   │   │   │   │   ├── CustomizedCardView.tsx
│   │   │   │   │   ├── CustomizedSuggestionTable.tsx
│   │   │   │   │   ├── CustomizedTables.tsx
│   │   │   │   │   ├── CustomizedUserCommentsTables.tsx
│   │   │   │   │   └── CustomizedUserStoryTables.tsx
│   │   │   │   ├── chat/            # 채팅 컴포넌트
│   │   │   │   │   └── ChannelChat.tsx
│   │   │   │   ├── api/             # API 관련 훅
│   │   │   │   │   ├── useCardStories.ts
│   │   │   │   │   └── useStories.ts
│   │   │   │   ├── BlindedContent.tsx
│   │   │   │   ├── BlindWrapper.tsx
│   │   │   │   ├── ChannelNotificationDropdown.tsx
│   │   │   │   ├── DarkModeToggle.tsx
│   │   │   │   ├── ImageCard.tsx
│   │   │   │   ├── MainView.tsx
│   │   │   │   ├── NavBar.tsx
│   │   │   │   ├── NotificationDropdown.tsx
│   │   │   │   ├── TopBar.tsx
│   │   │   │   └── VideoCard.tsx
│   │   │   ├── store/               # Zustand 스토어
│   │   │   │   ├── blindStore.ts
│   │   │   │   ├── channelNotificationStore.ts
│   │   │   │   ├── channelPageStore.ts
│   │   │   │   ├── commentStore.ts
│   │   │   │   ├── messageStore.ts
│   │   │   │   ├── pageStore.ts
│   │   │   │   ├── recentViewsStore.ts
│   │   │   │   ├── scrapStore.ts
│   │   │   │   ├── subscriptionStore.ts
│   │   │   │   ├── themeStore.ts
│   │   │   │   ├── userImageStore.ts
│   │   │   │   └── userInfoStore.ts
│   │   │   ├── api/                 # API 함수
│   │   │   │   ├── adminApi.ts
│   │   │   │   ├── axios.ts
│   │   │   │   ├── blind.ts
│   │   │   │   ├── channelChatApi.ts
│   │   │   │   ├── channelNotificationApi.ts
│   │   │   │   ├── channelsApi.ts
│   │   │   │   ├── messagesApi.ts
│   │   │   │   └── notification.ts
│   │   │   ├── types/               # TypeScript 타입
│   │   │   │   ├── blind.ts
│   │   │   │   ├── imageTypes.ts
│   │   │   │   ├── message.ts
│   │   │   │   ├── next-auth.d.ts
│   │   │   │   ├── notification.ts
│   │   │   │   ├── storyDetailType.ts
│   │   │   │   ├── tableType.ts
│   │   │   │   └── userType.ts
│   │   │   ├── utils/               # 유틸리티 함수
│   │   │   │   └── websocket.ts
│   │   │   ├── const/               # 상수 정의
│   │   │   │   ├── VIEW_COUNT.ts
│   │   │   │   └── WRITE_CONST.tsx
│   │   │   ├── hooks/               # 커스텀 훅
│   │   │   │   ├── useAdmin.ts
│   │   │   │   └── useBlind.ts
│   │   │   └── theme/               # 테마 설정
│   │   │       └── theme.ts
│   │   └── pages/                   # NextAuth 페이지
│   │       └── api/auth/
│   │           └── [...nextauth].ts
└── back/                           # 백엔드 (NestJS 10.0.0)
    ├── src/
    │   ├── auth/                   # 인증 모듈
    │   │   ├── auth.controller.ts  # 716줄
    │   │   ├── auth.service.ts
    │   │   ├── admin.guard.ts
    │   │   ├── jwt.strategy.ts
    │   │   ├── logged-in-guard.ts
    │   │   └── dto/
    │   ├── users/                  # 사용자 모듈
    │   ├── board/                  # 클린 아키텍처 학습용 게시판 모듈
    │   ├── story/                  # 게시글 모듈 (2190줄)
    │   ├── blind/                  # 블라인드 모듈
    │   ├── channel-chat/           # 채널 채팅 모듈
    │   │   ├── channel-chat.controller.ts
    │   │   ├── channel-chat.gateway.ts
    │   │   └── channel-chat.service.ts
    │   ├── channel-notification/   # 채널 알림 모듈
    │   ├── channels/               # 채널 모듈
    │   ├── comment/                # 댓글 모듈
    │   ├── messages/               # 메시지 모듈
    │   ├── notification/           # 알림 모듈
    │   ├── scrap/                  # 스크랩 모듈
    │   ├── suggestion/             # 건의 모듈
    │   ├── entities/               # 데이터베이스 엔티티 (20개)
    │   │   ├── Blind.entity.ts
    │   │   ├── ChannelChatMessage.entity.ts
    │   │   ├── ChannelImage.entity.ts
    │   │   ├── ChannelNotificationSubscription.entity.ts
    │   │   ├── Channels.entity.ts
    │   │   ├── Comments.entity.ts
    │   │   ├── Likes.entity.ts
    │   │   ├── Message.entity.ts
    │   │   ├── Notification.entity.ts
    │   │   ├── RecommendRanking.entity.ts
    │   │   ├── Report.entity.ts
    │   │   ├── Scrap.entity.ts
    │   │   ├── Story.entity.ts
    │   │   ├── StoryImage.entity.ts
    │   │   ├── StoryVideo.entity.ts
    │   │   ├── Subscription.entity.ts
    │   │   ├── Suggestion.entity.ts
    │   │   ├── SuggestionImage.entity.ts
    │   │   ├── user.entity.ts
    │   │   └── UserImage.entity.ts
    │   ├── common/                 # 공통 유틸리티
    │   │   ├── decorators/
    │   │   │   ├── admin.decorator.ts
    │   │   │   ├── get-user.decorator.ts
    │   │   │   └── token.decorator.ts
    │   │   ├── helper/
    │   │   │   └── today.ts
    │   │   └── intercepters/
    │   │       └── undefinedToNull.interceptor.ts
    │   ├── constants/
    │   │   └── tokenTime.ts
    │   ├── httpException.FIlter.ts
    │   └── main.ts
    └── upload/                     # 5개 업로드 디렉토리
        ├── imageUpload/
        ├── userUpload/
        ├── channelUpload/
        ├── suggestionUpload/
        └── videoUpload/
```

### 🏷️ 파일 명명 규칙

#### 📄 프론트엔드 파일명

| 파일 타입             | 명명 규칙                   | 실제 예시                                        |
| --------------------- | --------------------------- | ------------------------------------------------ |
| **React 컴포넌트**    | PascalCase + `.tsx`         | `ChannelChat.tsx`, `BlindWrapper.tsx`            |
| **Client 컴포넌트**   | PascalCase + `Client.tsx`   | `ChannelsClient.tsx`, `ChannelsDetailClient.tsx` |
| **페이지 컴포넌트**   | `page.tsx` (Next.js 규칙)   | `page.tsx`, `layout.tsx`                         |
| **Zustand 스토어**    | camelCase + `Store.ts`      | `blindStore.ts`, `channelNotificationStore.ts`   |
| **API 함수**          | camelCase + `Api.ts`        | `channelChatApi.ts`, `adminApi.ts`               |
| **커스텀 훅**         | camelCase + `use` 접두사    | `useAdmin.ts`, `useBlind.ts`                     |
| **유틸리티 함수**     | camelCase + `Utils.ts`      | `websocket.ts`, `dateUtils.ts`                   |
| **타입 정의**         | camelCase + `Type.ts`       | `storyDetailType.ts`, `imageTypes.ts`            |
| **상수 파일**         | UPPER_SNAKE_CASE            | `VIEW_COUNT.ts`, `WRITE_CONST.tsx`               |
| **Provider 컴포넌트** | PascalCase + `Provider.tsx` | `ThemeProvider.tsx`, `SubscriptionProvider.tsx`  |
| **Dialog 컴포넌트**   | PascalCase + `Dialog.tsx`   | `CreateChannelDialog.tsx`, `ConfirmDialog.tsx`   |
| **CSS 모듈**          | kebab-case + `.module.css`  | `Pagination.module.css`, `TopBar.module.css`     |

#### 📄 백엔드 파일명

| 파일 타입      | 명명 규칙                     | 실제 예시                                          |
| -------------- | ----------------------------- | -------------------------------------------------- |
| **컨트롤러**   | kebab-case + `.controller.ts` | `channel-chat.controller.ts`, `auth.controller.ts` |
| **서비스**     | kebab-case + `.service.ts`    | `channel-chat.service.ts`, `auth.service.ts`       |
| **게이트웨이** | kebab-case + `.gateway.ts`    | `channel-chat.gateway.ts`                          |
| **엔티티**     | PascalCase + `.entity.ts`     | `ChannelChatMessage.entity.ts`, `Blind.entity.ts`  |
| **DTO**        | kebab-case + `.dto.ts`        | `create-blind.dto.ts`, `signin.user.dto.ts`        |
| **모듈**       | kebab-case + `.module.ts`     | `channel-chat.module.ts`, `auth.module.ts`         |
| **가드**       | kebab-case + `.guard.ts`      | `admin.guard.ts`, `logged-in-guard.ts`             |
| **데코레이터** | kebab-case + `.decorator.ts`  | `admin.decorator.ts`, `get-user.decorator.ts`      |
| **인터셉터**   | camelCase + `.interceptor.ts` | `undefinedToNull.interceptor.ts`                   |

### 📂 디렉토리 명명 규칙

- **하이픈 케이스**: kebab-case 사용 (예: `channel-chat/`, `channel-notification/`)
- **Next.js 라우트**: 소문자 + 하이픈 (예: `(beforeLogin)/`, `(afterLogin)/`, `[slug]/`)
- **NestJS 모듈**: 소문자 + 하이픈 (예: `channel-chat/`, `channel-notification/`)
- **Provider 그룹**: 대문자 시작 (예: `Provider/`, `BackUp/`)

---

## 🎨 코딩 스타일 가이드

### 🏷️ 명명 규칙 (Naming Conventions)

#### 🔧 변수 및 함수

```typescript
// ✅ 올바른 예시
const channelId = "channel_123";
const isBlinded = true;
const isAdminUser = false;
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

function getChannelInfo() {}
function handleBlindUser() {}
function createChannelChat() {}
function sendNotification() {}

// ❌ 잘못된 예시
const channel_id = "channel_123"; // snake_case 사용 금지
const IsBlinded = true; // PascalCase 사용 금지
const maxUploadSize = 5 * 1024 * 1024; // 상수는 UPPER_SNAKE_CASE
```

#### ⚛️ React 컴포넌트

```typescript
// ✅ 올바른 예시
interface ChannelChatProps {
  channelId: string;
  userId: string;
  onMessageSend: (message: string) => void;
  isBlinded?: boolean;
}

export default function ChannelChat({ channelId, userId, onMessageSend, isBlinded = false }: ChannelChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleMessageSend = (message: string) => {
    if (isBlinded) return;
    onMessageSend(message);
  };

  return <div>{/* JSX */}</div>;
}

// ❌ 잘못된 예시
function channelChat() {} // camelCase 사용 금지
function Channel_Chat() {} // snake_case 사용 금지
```

#### 🎯 Boolean 변수 명명

```typescript
// ✅ 올바른 예시
const isBlinded = true;
const hasAdminPermission = false;
const canEditChannel = true;
const shouldSendNotification = false;
const isRealtimeConnected = true;

// ❌ 잘못된 예시
const blinded = true; // 의미 불분명
const adminPermission = false; // Boolean 타입 불분명
const realtimeConnected = true; // Boolean 타입 불분명
```

### 📦 Import/Export 규칙

#### 📥 Import 순서

```typescript
// ✅ 올바른 예시
import React from "react";
import { useState, useEffect } from "react";
import { Button, TextField, Dialog } from "@mui/material";
import { useQuery, useMutation } from "@tanstack/react-query";
import { io } from "socket.io-client";

import { ChannelChat } from "@/components/chat/ChannelChat";
import { BlindWrapper } from "@/components/BlindWrapper";
import { formatDate } from "@/utils/dateUtils";
import { getChannelInfo } from "@/api/channelsApi";

import type { ChannelType } from "@/types/channelType";
import type { BlindType } from "@/types/blind";
import type { ApiResponse } from "@/types/apiType";

import styles from "./ChannelDetail.module.css";
```

#### 📤 Export 규칙

```typescript
// ✅ 올바른 예시 - Named Export 우선
export const formatChannelName = (name: string) => { };
export const validateChannelAccess = (userId: string) => { };
export const sendChannelNotification = (channelId: string) => { };

// ✅ Default Export는 컴포넌트에만 사용
export default function ChannelDetail() { }

// ❌ 잘못된 예시
export default const formatChannelName = (name: string) => { }; // 함수는 named export
```

### 🎨 코드 포맷팅 규칙

#### 🔤 문자열 리터럴

```typescript
// ✅ 올바른 예시 - 더블 쿼트 사용
const message = "채널에 새로운 메시지가 있습니다";
const apiUrl = "/api/channels";
const socketEvent = "channel:message";
import styles from "./ChannelChat.module.css";

// ❌ 잘못된 예시
const message = "채널에 새로운 메시지가 있습니다"; // 싱글 쿼트 사용 금지
```

#### 🔧 함수 선언

```typescript
// ✅ 올바른 예시 - 화살표 함수 우선
const getChannelMessages = async (channelId: string): Promise<ChatMessage[]> => {
  // 로직
};

const handleBlindUser = (userId: string) => {
  // 로직
};

const sendRealtimeMessage = (channelId: string, message: string) => {
  // 로직
};

// ✅ 컴포넌트는 function 선언 사용
export default function ChannelChat() {
  return <div>채널 채팅</div>;
}
```

### 🧩 컴포넌트 작성 규칙

#### 📋 Client 컴포넌트 구조

```typescript
"use client"; // 클라이언트 컴포넌트 명시

import React from "react";
import { useState, useEffect } from "react";
import { useChannelStore } from "@/store/channelStore";
import { useBlindStore } from "@/store/blindStore";
// ... 기타 imports

interface ChannelsClientProps {
  initialChannels: ChannelType[];
  userId?: string;
  isAdmin?: boolean;
}

export default function ChannelsClient({ initialChannels, userId, isAdmin = false }: ChannelsClientProps) {
  // 1. 상태 관리
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState(initialChannels);

  // 2. 스토어 사용
  const { blindedUsers } = useBlindStore();
  const { setCurrentChannel } = useChannelStore();

  // 3. 커스텀 훅
  const { data: channelData, refetch } = useQuery({
    queryKey: ["channels", userId],
    queryFn: () => getChannelList(userId),
  });

  // 4. 실시간 연결 (WebSocket)
  useEffect(() => {
    if (userId) {
      const socket = io("/channels");
      socket.emit("join-channel", { userId });

      socket.on("channel-update", (data) => {
        setChannels((prev) => updateChannelList(prev, data));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [userId]);

  // 5. 이벤트 핸들러
  const handleChannelSelect = (channelId: string) => {
    setCurrentChannel(channelId);
    // 블라인드 사용자 체크
    if (blindedUsers.includes(channelId)) {
      return;
    }
    // 채널 이동 로직
  };

  // 6. 관리자 권한 체크
  const canManageChannel = isAdmin || userId === channel.ownerId;

  // 7. 조건부 렌더링
  if (loading) return <div>채널 로딩 중...</div>;

  // 8. 메인 렌더링
  return (
    <div className={styles.channelsContainer}>
      {channels.map((channel) => (
        <BlindWrapper key={channel.id} targetUserId={channel.ownerId} fallback={<div>블라인드된 채널</div>}>
          <ChannelCard channel={channel} onSelect={handleChannelSelect} canManage={canManageChannel} />
        </BlindWrapper>
      ))}
    </div>
  );
}
```

### 🚫 블라인드 시스템 코딩 패턴

#### 📋 블라인드 래퍼 컴포넌트

```typescript
// ✅ 블라인드 래퍼 사용 패턴
import { BlindWrapper } from "@/components/BlindWrapper";

<BlindWrapper targetUserId={story.userId} fallback={<div>블라인드된 게시글입니다</div>}>
  <StoryCard story={story} />
</BlindWrapper>;
```

#### 📋 블라인드 상태 관리

```typescript
// ✅ 블라인드 스토어 사용 패턴
import { useBlindStore } from "@/store/blindStore";

const { blindedUsers, addBlindUser, removeBlindUser } = useBlindStore();

const handleBlindUser = (userId: string) => {
  addBlindUser(userId);
};

const handleUnblindUser = (userId: string) => {
  removeBlindUser(userId);
};
```

### 🔐 관리자 권한 체크 패턴

#### 📋 관리자 권한 확인

```typescript
// ✅ 관리자 권한 체크 패턴
import { useAdmin } from "@/hooks/useAdmin";

const { isAdmin, hasPermission } = useAdmin();

const canDeletePost = isAdmin || hasPermission("DELETE_POST");
const canManageUsers = isAdmin || hasPermission("MANAGE_USERS");

// 조건부 렌더링
{
  canDeletePost && <Button onClick={handleDeletePost}>게시글 삭제</Button>;
}
```

#### 📋 관리자 전용 컴포넌트

```typescript
// ✅ 관리자 전용 컴포넌트 패턴
import { AdminOnly } from "@/components/AdminOnly";

<AdminOnly>
  <ReportManagementPanel />
  <UserManagementPanel />
  <SystemSettingsPanel />
</AdminOnly>;
```

### 🌐 실시간 채팅 코딩 패턴

#### 📋 Socket.IO 연결 관리

```typescript
// ✅ Socket.IO 연결 패턴
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const useChannelSocket = (channelId: string, userId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (channelId && userId) {
      const newSocket = io("/channel-chat");

      newSocket.emit("join-channel", { channelId, userId });

      newSocket.on("connect", () => {
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [channelId, userId]);

  return { socket, isConnected };
};
```

#### 📋 실시간 메시지 처리

```typescript
// ✅ 실시간 메시지 처리 패턴
const handleRealtimeMessage = (message: ChatMessage) => {
  // 블라인드 사용자 체크
  if (blindedUsers.includes(message.userId)) {
    return;
  }

  // 메시지 상태 업데이트
  setMessages((prev) => [...prev, message]);

  // 알림 전송
  if (message.userId !== currentUserId) {
    sendNotification({
      type: "CHANNEL_MESSAGE",
      channelId: message.channelId,
      message: `${message.username}님이 메시지를 보냈습니다`,
    });
  }
};
```

### 🔄 상태 관리 규칙

#### 🏪 Zustand 스토어 (실제 구조)

```typescript
// ✅ 올바른 예시 - channelNotificationStore.ts
import { create } from "zustand";
import type { ChannelNotification } from "@/types/notification";

interface ChannelNotificationState {
  notifications: ChannelNotification[];
  unreadCount: number;
  isLoading: boolean;
  subscribedChannels: string[];

  // Actions
  addNotification: (notification: ChannelNotification) => void;
  markAsRead: (notificationId: string) => void;
  subscribeToChannel: (channelId: string) => void;
  unsubscribeFromChannel: (channelId: string) => void;
  clearNotifications: () => void;
  setLoading: (loading: boolean) => void;
}

export const useChannelNotificationStore = create<ChannelNotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  subscribedChannels: [],

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  subscribeToChannel: (channelId) =>
    set((state) => ({
      subscribedChannels: [...new Set([...state.subscribedChannels, channelId])],
    })),

  unsubscribeFromChannel: (channelId) =>
    set((state) => ({
      subscribedChannels: state.subscribedChannels.filter((id) => id !== channelId),
    })),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

  setLoading: (isLoading) => set({ isLoading }),
}));
```

### 📊 API 함수 규칙

#### 🌐 API 함수 명명 및 구조 (실제 구조)

```typescript
// ✅ 올바른 예시 - channelChatApi.ts
import { apiClient } from "./axios";
import type { ChatMessage, CreateMessageDto } from "@/types/message";

// 채널 채팅 메시지 조회
export const getChannelMessages = async (
  channelId: string,
  page: number = 1,
  limit: number = 50
): Promise<ChatMessage[]> => {
  const response = await apiClient.get(`/channel-chat/${channelId}/messages`, { params: { page, limit } });
  return response.data.data;
};

// 채널 채팅 메시지 전송
export const sendChannelMessage = async (channelId: string, messageData: CreateMessageDto): Promise<ChatMessage> => {
  const response = await apiClient.post(`/channel-chat/${channelId}/messages`, messageData);
  return response.data.data;
};

// 채널 채팅 메시지 삭제 (관리자 전용)
export const deleteChannelMessage = async (messageId: string): Promise<void> => {
  await apiClient.delete(`/channel-chat/messages/${messageId}`);
};

// 채널 채팅 사용자 목록 조회
export const getChannelUsers = async (channelId: string): Promise<ChannelUser[]> => {
  const response = await apiClient.get(`/channel-chat/${channelId}/users`);
  return response.data.data;
};
```

### 🚨 에러 처리 규칙

```typescript
// ✅ 올바른 예시 - 고급 에러 처리
const handleChannelAction = async (action: string, channelId: string) => {
  try {
    setLoading(true);

    switch (action) {
      case "JOIN":
        await joinChannel(channelId);
        showSuccess("채널에 참가했습니다");
        break;
      case "LEAVE":
        await leaveChannel(channelId);
        showSuccess("채널에서 나갔습니다");
        break;
      case "DELETE":
        if (!isAdmin) {
          throw new Error("관리자 권한이 필요합니다");
        }
        await deleteChannel(channelId);
        showSuccess("채널이 삭제되었습니다");
        break;
      default:
        throw new Error("알 수 없는 액션입니다");
    }
  } catch (error) {
    console.error(`Channel ${action} failed:`, error);

    if (error.response?.status === 403) {
      showError("권한이 없습니다");
    } else if (error.response?.status === 404) {
      showError("채널을 찾을 수 없습니다");
    } else {
      showError(`채널 ${action} 중 오류가 발생했습니다`);
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 📚 문서화 규칙

### 📝 주석 작성

```typescript
/**
 * 채널 채팅 메시지를 실시간으로 전송하는 함수
 * @param channelId - 채널 ID
 * @param message - 전송할 메시지
 * @param userId - 사용자 ID
 * @returns Promise<ChatMessage> - 전송된 메시지 객체
 */
export const sendRealtimeMessage = async (channelId: string, message: string, userId: string): Promise<ChatMessage> => {
  // 블라인드 사용자 체크
  if (blindedUsers.includes(userId)) {
    throw new Error("블라인드된 사용자는 메시지를 전송할 수 없습니다");
  }

  // TODO: 메시지 필터링 기능 추가 예정
  const messageData = {
    channelId,
    content: message,
    userId,
    timestamp: new Date().toISOString(),
  };

  const response = await apiClient.post("/channel-chat/messages", messageData);
  return response.data;
};
```

---

## 🔍 코드 리뷰 체크리스트

### ✅ 필수 확인 사항

- [ ] 파일명이 명명 규칙을 따르는가?
- [ ] 변수/함수명이 camelCase를 사용하는가?
- [ ] 컴포넌트명이 PascalCase를 사용하는가?
- [ ] Client 컴포넌트에 "use client" 지시어가 있는가?
- [ ] Import 순서가 올바른가?
- [ ] 더블 쿼트를 사용하는가?
- [ ] 타입 정의가 명확한가?
- [ ] 에러 처리가 구현되어 있는가?
- [ ] 블라인드 시스템이 적용되어 있는가?
- [ ] 관리자 권한 체크가 구현되어 있는가?

### 🎯 권장 사항

- [ ] 컴포넌트 구조가 일관적인가?
- [ ] Props 타입이 명확히 정의되어 있는가?
- [ ] 실시간 기능이 적절히 구현되어 있는가?
- [ ] 상태 관리가 효율적인가?
- [ ] 주석이 적절히 작성되어 있는가?
- [ ] 코드 재사용성을 고려했는가?
- [ ] 성능 최적화가 적용되어 있는가?

### 🚫 블라인드 시스템 체크리스트

- [ ] 사용자 생성 컨텐츠에 BlindWrapper가 적용되어 있는가?
- [ ] 블라인드 상태가 실시간으로 반영되는가?
- [ ] 블라인드 해제 기능이 구현되어 있는가?

### 🔐 관리자 기능 체크리스트

- [ ] 관리자 권한 체크가 서버와 클라이언트 모두에서 이루어지는가?
- [ ] 관리자 전용 기능이 적절히 보호되어 있는가?
- [ ] 관리자 액션에 대한 로깅이 구현되어 있는가?

### 🌐 실시간 기능 체크리스트

- [ ] Socket.IO 연결 해제가 적절히 구현되어 있는가?
- [ ] 실시간 이벤트 처리가 효율적인가?
- [ ] 네트워크 재연결 로직이 구현되어 있는가?

---

## 📞 문의 및 개선

이 룰에 대한 문의사항이나 개선 제안이 있으시면 개발팀에 문의해 주세요.

**마지막 업데이트**: 2025년 8월 24일  
**버전**: 2.1.0  
**프로젝트 규모**: 3-4년차 시니어급 (일본 기업 기준)

---

_이 문서는 프로젝트의 발전에 따라 지속적으로 업데이트됩니다._
