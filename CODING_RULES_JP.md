# 📋 Study Board コーディングルール ガイド（最新）

## 🎯 概要

本ドキュメントは、Study Board プロジェクトにおいて一貫したコード品質とスタイルを維持するための「コーディングスタイルガイド」と「プロジェクト構造ルール」を定義します。

**プロジェクト規模**: 経験 3〜4 年相当のシニア級プロジェクト  
**技術スタック**: Next.js 14 + NestJS 10.0.0 + TypeScript 5.1.3  
**データベース**: MySQL（20 エンティティ）  
**リアルタイム通信**: Socket.IO 4.8.1  
**状態管理**: Zustand + TanStack React Query  
**認証**: NextAuth.js（JWT + Session）

---

## 🏗️ プロジェクト構造ルール

### 📁 実ディレクトリ構成

```
Study-Board/
├── front/                          # フロントエンド（Next.js 14）
│   ├── src/
│   │   ├── app/
│   │   │   ├── (beforeLogin)/       # ログイン前ページ
│   │   │   │   ├── login/
│   │   │   │   └── signup/
│   │   │   ├── (afterLogin)/        # ログイン後ページ
│   │   │   │   ├── blinds/          # ブラインド管理
│   │   │   │   ├── messages/        # メッセージ管理
│   │   │   │   ├── notifications/   # 通知管理
│   │   │   │   ├── reports/         # 管理者レポート
│   │   │   │   ├── scraps/          # スクラップ管理
│   │   │   │   ├── setting/         # 設定ページ
│   │   │   │   └── write/           # 投稿ページ
│   │   │   ├── (noLogin)/           # ログイン不要ページ
│   │   │   │   ├── channels/        # チャンネルページ
│   │   │   │   │   ├── [slug]/      # 動的チャンネル
│   │   │   │   │   │   ├── ChannelsDetailClient.tsx
│   │   │   │   │   │   └── detail/
│   │   │   │   │   ├── ChannelsClient.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── channel-notifications/
│   │   │   │   ├── notice/
│   │   │   │   └── profile/
│   │   │   ├── components/          # 共通コンポーネント
│   │   │   │   ├── Provider/        # プロバイダーコンポーネント
│   │   │   │   │   ├── AuthSessionCom.tsx
│   │   │   │   │   ├── BrowserNotification.tsx
│   │   │   │   │   ├── RQProvider.tsx
│   │   │   │   │   ├── SitePasswordGate.tsx
│   │   │   │   │   ├── SubscriptionProvider.tsx
│   │   │   │   │   └── ThemeProvider.tsx
│   │   │   │   ├── common/          # 汎用コンポーネント
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
│   │   │   │   ├── table/           # テーブルコンポーネント
│   │   │   │   │   ├── CustomizedCardView.tsx
│   │   │   │   │   ├── CustomizedSuggestionTable.tsx
│   │   │   │   │   ├── CustomizedTables.tsx
│   │   │   │   │   ├── CustomizedUserCommentsTables.tsx
│   │   │   │   │   └── CustomizedUserStoryTables.tsx
│   │   │   │   ├── chat/            # チャットコンポーネント
│   │   │   │   │   └── ChannelChat.tsx
│   │   │   │   ├── api/             # API 関連フック
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
│   │   │   ├── store/               # Zustand ストア
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
│   │   │   ├── api/                 # API 関数
│   │   │   │   ├── adminApi.ts
│   │   │   │   ├── axios.ts
│   │   │   │   ├── blind.ts
│   │   │   │   ├── channelChatApi.ts
│   │   │   │   ├── channelNotificationApi.ts
│   │   │   │   ├── channelsApi.ts
│   │   │   │   ├── messagesApi.ts
│   │   │   │   └── notification.ts
│   │   │   ├── types/               # TypeScript 型
│   │   │   │   ├── blind.ts
│   │   │   │   ├── imageTypes.ts
│   │   │   │   ├── message.ts
│   │   │   │   ├── next-auth.d.ts
│   │   │   │   ├── notification.ts
│   │   │   │   ├── storyDetailType.ts
│   │   │   │   ├── tableType.ts
│   │   │   │   └── userType.ts
│   │   │   ├── utils/               # ユーティリティ関数
│   │   │   │   └── websocket.ts
│   │   │   ├── const/               # 定数定義
│   │   │   │   ├── VIEW_COUNT.ts
│   │   │   │   └── WRITE_CONST.tsx
│   │   │   ├── hooks/               # カスタムフック
│   │   │   │   ├── useAdmin.ts
│   │   │   │   └── useBlind.ts
│   │   │   └── theme/               # テーマ設定
│   │   │       └── theme.ts
│   │   └── pages/                   # NextAuth ページ
│   │       └── api/auth/
│   │           └── [...nextauth].ts
└── back/                           # バックエンド（NestJS 10.0.0）
    ├── src/
    │   ├── auth/                   # 認証モジュール
    │   │   ├── auth.controller.ts  # 716行
    │   │   ├── auth.service.ts
    │   │   ├── admin.guard.ts
    │   │   ├── jwt.strategy.ts
    │   │   ├── logged-in-guard.ts
    │   │   └── dto/
    │   ├── users/                  # ユーザーモジュール
    │   ├── story/                  # 投稿モジュール（2190行）
    │   ├── blind/                  # ブラインドモジュール
    │   ├── channel-chat/           # チャンネルチャットモジュール
    │   │   ├── channel-chat.controller.ts
    │   │   ├── channel-chat.gateway.ts
    │   │   └── channel-chat.service.ts
    │   ├── channel-notification/   # チャンネル通知モジュール
    │   ├── channels/               # チャンネルモジュール
    │   ├── comment/                # コメントモジュール
    │   ├── messages/               # メッセージモジュール
    │   ├── notification/           # 通知モジュール
    │   ├── scrap/                  # スクラップモジュール
    │   ├── suggestion/             # 提案モジュール
    │   ├── entities/               # データベースエンティティ（20個）
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
    │   ├── common/                 # 共通ユーティリティ
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
    └── upload/                     # 5つのアップロードディレクトリ
        ├── imageUpload/
        ├── userUpload/
        ├── channelUpload/
        ├── suggestionUpload/
        └── videoUpload/
```

### 🏷️ ファイル命名規則

#### 📄 フロントエンドのファイル名

| ファイルタイプ              | 命名規則                    | 実例                                             |
| --------------------------- | --------------------------- | ------------------------------------------------ |
| **React コンポーネント**    | PascalCase + `.tsx`         | `ChannelChat.tsx`, `BlindWrapper.tsx`            |
| **Client コンポーネント**   | PascalCase + `Client.tsx`   | `ChannelsClient.tsx`, `ChannelsDetailClient.tsx` |
| **ページコンポーネント**    | `page.tsx`（Next.js 規則）  | `page.tsx`, `layout.tsx`                         |
| **Zustand ストア**          | camelCase + `Store.ts`      | `blindStore.ts`, `channelNotificationStore.ts`   |
| **API 関数**                | camelCase + `Api.ts`        | `channelChatApi.ts`, `adminApi.ts`               |
| **カスタムフック**          | camelCase + `use` 接頭辞    | `useAdmin.ts`, `useBlind.ts`                     |
| **ユーティリティ関数**      | camelCase + `Utils.ts`      | `websocket.ts`, `dateUtils.ts`                   |
| **型定義**                  | camelCase + `Type.ts`       | `storyDetailType.ts`, `imageTypes.ts`            |
| **定数ファイル**            | UPPER_SNAKE_CASE            | `VIEW_COUNT.ts`, `WRITE_CONST.tsx`               |
| **Provider コンポーネント** | PascalCase + `Provider.tsx` | `ThemeProvider.tsx`, `SubscriptionProvider.tsx`  |
| **Dialog コンポーネント**   | PascalCase + `Dialog.tsx`   | `CreateChannelDialog.tsx`, `ConfirmDialog.tsx`   |
| **CSS モジュール**          | kebab-case + `.module.css`  | `Pagination.module.css`, `TopBar.module.css`     |

#### 📄 バックエンドのファイル名

| ファイルタイプ     | 命名規則                      | 実例                                               |
| ------------------ | ----------------------------- | -------------------------------------------------- |
| **コントローラ**   | kebab-case + `.controller.ts` | `channel-chat.controller.ts`, `auth.controller.ts` |
| **サービス**       | kebab-case + `.service.ts`    | `channel-chat.service.ts`, `auth.service.ts`       |
| **ゲートウェイ**   | kebab-case + `.gateway.ts`    | `channel-chat.gateway.ts`                          |
| **エンティティ**   | PascalCase + `.entity.ts`     | `ChannelChatMessage.entity.ts`, `Blind.entity.ts`  |
| **DTO**            | kebab-case + `.dto.ts`        | `create-blind.dto.ts`, `signin.user.dto.ts`        |
| **モジュール**     | kebab-case + `.module.ts`     | `channel-chat.module.ts`, `auth.module.ts`         |
| **ガード**         | kebab-case + `.guard.ts`      | `admin.guard.ts`, `logged-in-guard.ts`             |
| **デコレータ**     | kebab-case + `.decorator.ts`  | `admin.decorator.ts`, `get-user.decorator.ts`      |
| **インターセプタ** | camelCase + `.interceptor.ts` | `undefinedToNull.interceptor.ts`                   |

### 📂 ディレクトリ命名規則

- **ハイフンケース**: kebab-case を使用（例: `channel-chat/`, `channel-notification/`）
- **Next.js ルート**: 小文字 + ハイフン（例: `(beforeLogin)/`, `(afterLogin)/`, `[slug]/`）
- **NestJS モジュール**: 小文字 + ハイフン（例: `channel-chat/`, `channel-notification/`）
- **Provider グループ**: 先頭は大文字（例: `Provider/`, `BackUp/`）

---

## 🎨 コーディングスタイルガイド

### 🏷️ 命名規則（Naming Conventions）

#### 🔧 変数・関数

```typescript
// ✅ 正しい例
const channelId = "channel_123";
const isBlinded = true;
const isAdminUser = false;
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

function getChannelInfo() {}
function handleBlindUser() {}
function createChannelChat() {}
function sendNotification() {}

// ❌ 悪い例
const channel_id = "channel_123"; // snake_case は使用しない
const IsBlinded = true; // PascalCase は使用しない
const maxUploadSize = 5 * 1024 * 1024; // 定数は UPPER_SNAKE_CASE
```

#### ⚛️ React コンポーネント

```typescript
// ✅ 正しい例
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

// ❌ 悪い例
function channelChat() {} // camelCase を使用しない
function Channel_Chat() {} // snake_case を使用しない
```

#### 🎯 Boolean 変数命名

```typescript
// ✅ 正しい例
const isBlinded = true;
const hasAdminPermission = false;
const canEditChannel = true;
const shouldSendNotification = false;
const isRealtimeConnected = true;

// ❌ 悪い例
const blinded = true; // 意味が不明瞭
const adminPermission = false; // Boolean か不明瞭
const realtimeConnected = true; // Boolean か不明瞭
```

### 📦 Import/Export ルール

#### 📥 Import 順序

```typescript
// ✅ 正しい例
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

#### 📤 Export ルール

```typescript
// ✅ 正しい例 - Named Export を優先
export const formatChannelName = (name: string) => { };
export const validateChannelAccess = (userId: string) => { };
export const sendChannelNotification = (channelId: string) => { };

// ✅ Default Export はコンポーネントにのみ使用
export default function ChannelDetail() { }

// ❌ 悪い例
export default const formatChannelName = (name: string) => { }; // 関数は named export
```

### 🎨 コードフォーマット規則

#### 🔤 文字列リテラル

```typescript
// ✅ 正しい例 - ダブルクォートを使用
const message = "チャンネルに新しいメッセージがあります";
const apiUrl = "/api/channels";
const socketEvent = "channel:message";
import styles from "./ChannelChat.module.css";

// ❌ 悪い例
const message = "チャンネルに新しいメッセージがあります"; // シングルクォートは使用しない
```

#### 🔧 関数宣言

```typescript
// ✅ 正しい例 - アロー関数を優先
const getChannelMessages = async (channelId: string): Promise<ChatMessage[]> => {
  // ロジック
};

const handleBlindUser = (userId: string) => {
  // ロジック
};

const sendRealtimeMessage = (channelId: string, message: string) => {
  // ロジック
};

// ✅ コンポーネントは function 宣言を使用
export default function ChannelChat() {
  return <div>チャンネルチャット</div>;
}
```

## 🧩 コンポーネント作成ルール

### 📋 Client コンポーネント構成

```typescript
"use client"; // クライアントコンポーネントの明示

import React from "react";
import { useState, useEffect } from "react";
import { useChannelStore } from "@/store/channelStore";
import { useBlindStore } from "@/store/blindStore";
// ... その他 imports

interface ChannelsClientProps {
  initialChannels: ChannelType[];
  userId?: string;
  isAdmin?: boolean;
}

export default function ChannelsClient({ initialChannels, userId, isAdmin = false }: ChannelsClientProps) {
  // 1. 状態管理
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState(initialChannels);

  // 2. ストア利用
  const { blindedUsers } = useBlindStore();
  const { setCurrentChannel } = useChannelStore();

  // 3. カスタムフック
  const { data: channelData, refetch } = useQuery({
    queryKey: ["channels", userId],
    queryFn: () => getChannelList(userId),
  });

  // 4. リアルタイム接続（WebSocket）
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

  // 5. イベントハンドラ
  const handleChannelSelect = (channelId: string) => {
    setCurrentChannel(channelId);
    // ブラインドユーザーのチェック
    if (blindedUsers.includes(channelId)) {
      return;
    }
    // チャンネル遷移ロジック
  };

  // 6. 管理者権限チェック
  const canManageChannel = isAdmin || userId === channel.ownerId;

  // 7. 条件付きレンダリング
  if (loading) return <div>チャンネル読み込み中...</div>;

  // 8. メインレンダリング
  return (
    <div className={styles.channelsContainer}>
      {channels.map((channel) => (
        <BlindWrapper key={channel.id} targetUserId={channel.ownerId} fallback={<div>ブラインドされたチャンネル</div>}>
          <ChannelCard channel={channel} onSelect={handleChannelSelect} canManage={canManageChannel} />
        </BlindWrapper>
      ))}
    </div>
  );
}
```

### 🚫 ブラインドシステム コーディングパターン

#### 📋 ブラインド ラッパーコンポーネント

```typescript
// ✅ ブラインドラッパーの使用パターン
import { BlindWrapper } from "@/components/BlindWrapper";

<BlindWrapper targetUserId={story.userId} fallback={<div>ブラインドされた投稿です</div>}>
  <StoryCard story={story} />
</BlindWrapper>;
```

#### 📋 ブラインド状態管理

```typescript
// ✅ ブラインドストアの使用パターン
import { useBlindStore } from "@/store/blindStore";

const { blindedUsers, addBlindUser, removeBlindUser } = useBlindStore();

const handleBlindUser = (userId: string) => {
  addBlindUser(userId);
};

const handleUnblindUser = (userId: string) => {
  removeBlindUser(userId);
};
```

### 🔐 管理者権限チェックパターン

#### 📋 管理者権限の確認

```typescript
// ✅ 管理者権限チェックパターン
import { useAdmin } from "@/hooks/useAdmin";

const { isAdmin, hasPermission } = useAdmin();

const canDeletePost = isAdmin || hasPermission("DELETE_POST");
const canManageUsers = isAdmin || hasPermission("MANAGE_USERS");

// 条件付きレンダリング
{
  canDeletePost && <Button onClick={handleDeletePost}>投稿を削除</Button>;
}
```

#### 📋 管理者専用コンポーネント

```typescript
// ✅ 管理者専用コンポーネントパターン
import { AdminOnly } from "@/components/AdminOnly";

<AdminOnly>
  <ReportManagementPanel />
  <UserManagementPanel />
  <SystemSettingsPanel />
</AdminOnly>;
```

### 🌐 リアルタイムチャット コーディングパターン

#### 📋 Socket.IO 接続管理

```typescript
// ✅ Socket.IO 接続パターン
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

#### 📋 リアルタイムメッセージ処理

```typescript
// ✅ リアルタイムメッセージ処理パターン
const handleRealtimeMessage = (message: ChatMessage) => {
  // ブラインドユーザーのチェック
  if (blindedUsers.includes(message.userId)) {
    return;
  }

  // メッセージ状態更新
  setMessages((prev) => [...prev, message]);

  // 通知送信
  if (message.userId !== currentUserId) {
    sendNotification({
      type: "CHANNEL_MESSAGE",
      channelId: message.channelId,
      message: `${message.username}さんがメッセージを送信しました`,
    });
  }
};
```

### 🔄 状態管理ルール

#### 🏪 Zustand ストア（実構成）

```typescript
// ✅ 正しい例 - channelNotificationStore.ts
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

### 📊 API 関数ルール

#### 🌐 API 関数の命名と構成（実構成）

```typescript
// ✅ 正しい例 - channelChatApi.ts
import { apiClient } from "./axios";
import type { ChatMessage, CreateMessageDto } from "@/types/message";

// チャンネルチャットのメッセージ取得
export const getChannelMessages = async (
  channelId: string,
  page: number = 1,
  limit: number = 50
): Promise<ChatMessage[]> => {
  const response = await apiClient.get(`/channel-chat/${channelId}/messages`, { params: { page, limit } });
  return response.data.data;
};

// チャンネルチャットのメッセージ送信
export const sendChannelMessage = async (channelId: string, messageData: CreateMessageDto): Promise<ChatMessage> => {
  const response = await apiClient.post(`/channel-chat/${channelId}/messages`, messageData);
  return response.data.data;
};

// チャンネルチャットのメッセージ削除（管理者専用）
export const deleteChannelMessage = async (messageId: string): Promise<void> => {
  await apiClient.delete(`/channel-chat/messages/${messageId}`);
};

// チャンネルチャットのユーザー一覧取得
export const getChannelUsers = async (channelId: string): Promise<ChannelUser[]> => {
  const response = await apiClient.get(`/channel-chat/${channelId}/users`);
  return response.data.data;
};
```

### 🚨 エラーハンドリング規則

```typescript
// ✅ 正しい例 - 高度なエラーハンドリング
const handleChannelAction = async (action: string, channelId: string) => {
  try {
    setLoading(true);

    switch (action) {
      case "JOIN":
        await joinChannel(channelId);
        showSuccess("チャンネルに参加しました");
        break;
      case "LEAVE":
        await leaveChannel(channelId);
        showSuccess("チャンネルから退出しました");
        break;
      case "DELETE":
        if (!isAdmin) {
          throw new Error("管理者権限が必要です");
        }
        await deleteChannel(channelId);
        showSuccess("チャンネルを削除しました");
        break;
      default:
        throw new Error("不明なアクションです");
    }
  } catch (error) {
    console.error(`Channel ${action} failed:`, error);

    if (error.response?.status === 403) {
      showError("権限がありません");
    } else if (error.response?.status === 404) {
      showError("チャンネルが見つかりません");
    } else {
      showError(`チャンネル ${action} 中にエラーが発生しました`);
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 📚 ドキュメント化ルール

### 📝 コメント記述

```typescript
/**
 * チャンネルチャットのメッセージをリアルタイム送信する関数
 * @param channelId - チャンネル ID
 * @param message - 送信するメッセージ
 * @param userId - ユーザー ID
 * @returns Promise<ChatMessage> - 送信されたメッセージオブジェクト
 */
export const sendRealtimeMessage = async (channelId: string, message: string, userId: string): Promise<ChatMessage> => {
  // ブラインドユーザーのチェック
  if (blindedUsers.includes(userId)) {
    throw new Error("ブラインドされたユーザーはメッセージを送信できません");
  }

  // TODO: メッセージフィルタリング機能を今後追加予定
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

## 🔍 コードレビュー チェックリスト

### ✅ 必須確認事項

- [ ] ファイル名は命名規則に従っているか？
- [ ] 変数/関数名は camelCase を使用しているか？
- [ ] コンポーネント名は PascalCase を使用しているか？
- [ ] Client コンポーネントに "use client" ディレクティブがあるか？
- [ ] Import の順序は正しいか？
- [ ] ダブルクォートを使用しているか？
- [ ] 型定義は明確か？
- [ ] エラーハンドリングが実装されているか？
- [ ] ブラインドシステムが適用されているか？
- [ ] 管理者権限チェックが実装されているか？

### 🎯 推奨事項

- [ ] コンポーネント構成は一貫しているか？
- [ ] Props の型は明確に定義されているか？
- [ ] リアルタイム機能は適切に実装されているか？
- [ ] 状態管理は効率的か？
- [ ] コメントは適切に記述されているか？
- [ ] コードの再利用性を考慮しているか？
- [ ] パフォーマンス最適化が適用されているか？

### 🚫 ブラインドシステム チェックリスト

- [ ] ユーザー生成コンテンツに BlindWrapper が適用されているか？
- [ ] ブラインド状態がリアルタイムに反映されるか？
- [ ] ブラインド解除機能が実装されているか？

### 🔐 管理者機能 チェックリスト

- [ ] 管理者権限チェックがサーバーとクライアント双方で行われているか？
- [ ] 管理者専用機能は適切に保護されているか？
- [ ] 管理者アクションのロギングが実装されているか？

### 🌐 リアルタイム機能 チェックリスト

- [ ] Socket.IO の切断処理が適切に実装されているか？
- [ ] リアルタイムイベント処理は効率的か？
- [ ] ネットワーク再接続ロジックが実装されているか？

---

## 📞 お問い合わせ・改善

本ルールに関する質問や改善提案がありましたら、開発チームまでご連絡ください。

**最終更新**: 2025 年 8 月 24 日  
**バージョン**: 2.1.0  
**プロジェクト規模**: 経験 3〜4 年相当（日本企業基準）

---

_本ドキュメントはプロジェクトの進化に合わせて継続的に更新されます。_
