# 📚 Study Board バックエンド API ドキュメント（最新）

## 🏗️ プロジェクト概要

Study Board は学習コミュニティ向けの総合プラットフォームで、投稿作成、リアルタイムチャット、チャンネル購読、通知システムなど多様な機能を提供する NestJS ベースのバックエンドサーバーです。

### 🎯 主な特徴

- 📝 投稿システム: CRUD、検索、推薦/非推薦、画像/動画添付
- 🏢 チャンネルシステム: チャンネル作成/管理、購読、チャンネル別投稿、スラッグベースルーティング
- 💬 リアルタイムチャット: WebSocket ベースのチャンネル内リアルタイム通信
- 🔔 通知システム: 投稿、コメント、メッセージ、チャンネル等のリアルタイム通知
- 👤 ユーザー管理: 会員登録/ログイン、プロフィール管理、プロフィール画像
- 📨 ダイレクトメッセージ: 1:1 個人メッセージ、既読管理
- 🛡️ コンテンツ管理: 通報、ブラインド処理
- 📌 スクラップ機能: 投稿ブックマーク
- 💡 提案（サジェスト）: チャンネル別のサイト改善フィードバック
- 📢 お知らせ: 管理者お知らせシステム

---

## 🔧 技術スタック

### 🏛️ フレームワーク & 言語

- NestJS 10.0.0 - Node.js バックエンドフレームワーク
- TypeScript 5.1.3 - 静的型付け言語
- Node.js 20+

### 🗄️ データベース

- MySQL 8.0+ - リレーショナルデータベース
- TypeORM 0.3.20 - ORM（Object-Relational Mapping）
- mysql2 3.11.3 - MySQL ドライバ

### 🔌 リアルタイム通信

- Socket.IO 4.8.1 - WebSocket ベースのリアルタイム通信
- @nestjs/websockets 10.4.19 - NestJS WebSocket モジュール
- @nestjs/platform-socket.io 10.4.19 - Socket.IO アダプタ

### 🔐 認証 & セキュリティ

- Passport 0.7.0 - 認証ミドルウェア
- passport-jwt 4.0.1 - JWT 認証戦略
- bcryptjs 2.4.3 - パスワードハッシュ
- cookie-parser 1.4.7 - Cookie 解析

### 📁 ファイル処理

- Multer - ファイルアップロード
- @nestjs/serve-static 4.0.2 - 静的ファイル配信
- uuid 9.0.1 - 一意 ID 生成

### 📖 API ドキュメント

- Swagger（@nestjs/swagger）7.4.2 - API 自動ドキュメント化

### ✅ 検証 & 変換

- class-validator 0.14.1 - DTO 検証
- class-transformer 0.5.1 - オブジェクト変換

---

## 🏛️ システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js)                   │
│                    http://localhost:3000                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                   Backend (NestJS)                         │
│                 http://localhost:9999                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Controllers │  │  Services   │  │  Guards &   │        │
│  │   (API)     │  │ (Business)  │  │ Middleware  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   TypeORM   │  │  Socket.IO  │  │   Static    │        │
│  │  (Database) │  │ (Real-time) │  │ File Server │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   MySQL Database                           │
│                 board-study (DB名)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 プロジェクト構成

```
back/
├── src/
│   ├── auth/                    # 🔐 認証/認可モジュール
│   │   ├── dto/                 # DTO クラス
│   │   ├── auth.controller.ts   # 認証コントローラ（716行）
│   │   ├── auth.service.ts      # 認証サービス（703行）
│   │   ├── auth.module.ts       # 認証モジュール設定
│   │   ├── admin.guard.ts       # 管理者権限ガード
│   │   ├── logged-in-guard.ts   # ログイン検証ガード
│   │   └── jwt.strategy.ts      # JWT 認証戦略
│   ├── users/                   # 👤 ユーザー管理モジュール
│   ├── story/                   # 📝 投稿モジュール
│   │   ├── dto/                 # DTO クラス
│   │   ├── story.controller.ts  # 投稿コントローラ（684行）
│   │   ├── story.service.ts     # 投稿サービス（2190行）
│   │   ├── story.module.ts      # 投稿モジュール設定
│   │   ├── storysql.ts          # SQL クエリ集（1055行）
│   │   └── storyTransaction.ts  # トランザクション処理（712行）
│   ├── comment/                 # 💬 コメントモジュール
│   ├── channels/                # 🏢 チャンネル管理モジュール
│   │   ├── channels.controller.ts # チャンネルコントローラ（244行）
│   │   ├── channels.service.ts    # チャンネルサービス（359行）
│   │   └── channels.module.ts     # チャンネルモジュール設定
│   ├── channel-chat/            # 💬 リアルタイムチャットモジュール
│   ├── channel-notification/    # 🔔 チャンネル通知モジュール
│   ├── notification/            # 🔔 通知モジュール
│   ├── messages/                # 📨 ダイレクトメッセージモジュール
│   ├── scrap/                   # 📌 スクラップモジュール
│   ├── blind/                   # 🛡️ 通報/ブラインドモジュール
│   ├── suggestion/              # 💡 提案（サジェスト）モジュール
│   ├── entities/                # 🗄️ データベースエンティティ（20ファイル）
│   │   ├── user.entity.ts       # ユーザーエンティティ（440行）
│   │   ├── Story.entity.ts      # 投稿エンティティ
│   │   ├── Channels.entity.ts   # チャンネルエンティティ
│   │   ├── Comments.entity.ts   # コメントエンティティ
│   │   ├── Notification.entity.ts # 通知エンティティ
│   │   ├── Message.entity.ts    # メッセージエンティティ
│   │   ├── ChannelChatMessage.entity.ts # チャットメッセージ
│   │   ├── ChannelNotificationSubscription.entity.ts # チャンネル通知購読
│   │   ├── Suggestion.entity.ts # 提案エンティティ
│   │   ├── Scrap.entity.ts      # スクラップエンティティ
│   │   ├── Blind.entity.ts      # ブラインドエンティティ
│   │   ├── Report.entity.ts     # 通報エンティティ
│   │   ├── Likes.entity.ts      # 推薦/非推薦エンティティ
│   │   ├── Subscription.entity.ts # チャンネル購読エンティティ
│   │   ├── StoryImage.entity.ts # 投稿画像エンティティ
│   │   ├── StoryVideo.entity.ts # 投稿動画エンティティ
│   │   ├── SuggestionImage.entity.ts # 提案件画像
│   │   ├── UserImage.entity.ts  # ユーザープロフィール画像
│   │   ├── ChannelImage.entity.ts # チャンネル画像
│   │   └── RecommendRanking.entity.ts # 推薦ランキング
│   ├── common/                  # 🔧 共通ユーティリティ
│   │   ├── decorators/          # カスタムデコレータ
│   │   │   ├── admin.decorator.ts
│   │   │   ├── get-user.decorator.ts
│   │   │   └── token.decorator.ts
│   │   ├── helper/              # ヘルパー関数
│   │   │   └── today.ts
│   │   └── intercepters/        # インターセプター
│   ├── constants/               # 📋 定数定義
│   │   └── tokenTime.ts
│   ├── app.module.ts            # 🏗️ ルートモジュール（197行）
│   ├── main.ts                  # 🚀 アプリケーションエントリ（142行）
│   ├── app.controller.ts        # ベースコントローラ
│   ├── app.service.ts           # ベースサービス
│   └── httpException.Filter.ts  # ⚠️ グローバル例外フィルタ
├── upload/                      # 📁 投稿画像アップロード
├── userUpload/                  # 📁 ユーザープロフィール画像
├── channelUpload/               # 📁 チャンネル画像
├── suggestionUpload/            # 📁 提案件画像
├── videoUpload/                 # 📁 投稿動画アップロード
├── test/                        # 🧪 テスト
├── dist/                        # 📦 ビルド成果物
├── node_modules/                # 📦 依存パッケージ
├── package.json                 # 📋 プロジェクト設定
├── tsconfig.json                # ⚙️ TypeScript 設定
├── nest-cli.json                # 🔧 NestJS CLI 設定
├── .eslintrc.js                 # 📏 ESLint 設定
├── .prettierrc                  # 🎨 Prettier 設定
└── README.md                    # 📖 プロジェクト説明
```

---

## 📋 モジュール別機能詳細

### 🔐 Auth Module（認証/認可）

パス: `/src/auth/`  
主な機能:

- 会員登録/ログイン（セッションベース）
- パスワード暗号化（bcrypt）
- 認証ガード
- セッション管理
- 自動ログイン処理

主な API:

- `POST /auth/signup` - 会員登録
- `POST /auth/signin` - ログイン
- `POST /auth/logout` - ログアウト
- `GET /auth/me` - 現在のユーザー情報
- `PUT /auth/updatePassword` - パスワード変更

---

### 👤 Users Module（ユーザー管理）

パス: `/src/users/`  
主な機能:

- ユーザープロフィール管理
- プロフィール画像アップロード
- ユーザー情報の更新
- ユーザー検索
- ユーザー別の投稿/コメント取得

主な API:

- `GET /users/profile/:username` - ユーザープロフィール取得
- `PUT /users/profile` - プロフィール更新
- `POST /users/upload-avatar` - プロフィール画像アップロード
- `GET /users/:userId/stories` - ユーザー投稿一覧
- `GET /users/:userId/comments` - ユーザーコメント一覧

---

### 📝 Story Module（投稿）

パス: `/src/story/`  
主な機能:

- 投稿 CRUD（作成、参照、更新、削除）
- 複数画像/動画アップロード
- 検索（タイトル、本文、作成者）
- 推薦/非推薦システム
- カテゴリ分類（雑談、質問、情報、レビュー、スクショ、その他）
- チャンネル別フィルタ
- お知らせ管理
- 閲覧数カウント
- 推薦ランキング

主な API:

- `GET /api/story/pageTableData` - テーブル形式の投稿一覧
- `GET /api/story/cardPageTableData` - カード形式の投稿一覧
- `GET /api/story/search` - 投稿検索
- `GET /api/story/cardSearch` - カード形式の投稿検索
- `GET /api/story/detail/:id` - 投稿詳細
- `GET /api/story/detail/edit/:id` - 編集用データ取得
- `POST /api/story/create` - 投稿作成
- `POST /api/story/update/:id` - 投稿更新
- `DELETE /api/story/:id` - 投稿削除
- `PUT /api/story/likeOrUnlike/:id` - 推薦/非推薦
- `GET /api/story/notices` - お知らせ一覧

---

### 💬 Comment Module（コメント）

パス: `/src/comment/`  
主な機能:

- コメント CRUD
- 返信（最大 4 階層）
- コメントの推薦/非推薦
- ソフトデリート
- ページネーション
- コメント数カウント

主な API:

- `GET /api/comment/:storyId` - 投稿のコメント一覧
- `POST /api/comment` - コメント作成
- `PUT /api/comment/:id` - コメント更新
- `DELETE /api/comment/:id` - コメント削除
- `PUT /api/comment/likeOrUnlike/:id` - コメント推薦/非推薦

---

### 🏢 Channels Module（チャンネル管理）

パス: `/src/channels/`  
主な機能:

- ユーザーによるチャンネル作成/管理（スラッグベース URL）
- 購読/購読解除システム
- チャンネル別投稿の統計自動集計
- スラッグベース URL ルーティングと重複チェック
- チャンネル画像のアップロード/編集/削除
- チャンネル検索とカテゴリフィルタ
- チャンネルの非表示/表示権限管理（作成者/管理者）
- チャンネル作成者情報管理

主な API:

- `GET /api/channels` - チャンネル一覧
- `POST /api/channels/create` - 新規チャンネル作成（スラッグベース）
- `GET /api/channels/slug/:slug` - スラッグで取得
- `GET /api/channels/:id` - チャンネル詳細
- `POST /api/channels/:id/subscribe` - 購読
- `DELETE /api/channels/:id/subscribe` - 購読解除
- `POST /api/channels/:id/upload-image` - 画像アップロード
- `DELETE /api/channels/:id/image` - 画像削除
- `PATCH /api/channels/:id/hide` - 非表示
- `PATCH /api/channels/:id/show` - 表示

---

### 💬 Channel Chat Module（リアルタイムチャット）

パス: `/src/channel-chat/`  
主な機能:

- WebSocket ベースのリアルタイムチャット
- チャンネル別チャットルーム
- オンラインユーザー表示
- タイピングインジケータ
- チャットメッセージ保存/参照
- チャット履歴管理

WebSocket イベント:

- `join-channel` - チャンネル入室
- `leave-channel` - チャンネル退室
- `send-message` - メッセージ送信
- `typing-start` - タイピング開始
- `typing-stop` - タイピング終了
- `user-joined` - 入室通知
- `user-left` - 退室通知

主な API:

- `GET /api/channel-chat/:channelId/messages` - メッセージ一覧
- `POST /api/channel-chat/:channelId/messages` - メッセージ送信（HTTP）

---

### 🔔 Channel Notification Module（チャンネル通知）

パス: `/src/channel-notification/`  
主な機能:

- チャンネル別の通知購読管理
- 新規投稿通知
- 通知設定 on/off
- 未読通知カウント

主な API:

- `POST /api/channel-notifications/subscribe` - 通知購読
- `DELETE /api/channel-notifications/unsubscribe` - 購読解除
- `GET /api/channel-notifications/unread` - 未読通知

---

### 🔔 Notification Module（通知システム）

パス: `/src/notification/`  
主な機能:

- リアルタイム通知の生成/参照
- チャンネル新規投稿通知
- コメント/返信通知
- メッセージ通知
- 既読管理
- 通知ページネーション

主な API:

- `GET /api/notifications` - 通知一覧
- `PUT /api/notifications/:id/read` - 既読化
- `PUT /api/notifications/mark-all-read` - 全件既読化
- `DELETE /api/notifications/:id` - 通知削除

---

### 📨 Messages Module（ダイレクトメッセージ）

パス: `/src/messages/`  
主な機能:

- 1:1 個人メッセージ
- 既読管理
- 受信箱/送信箱
- メッセージ削除
- ページネーション

主な API:

- `GET /api/messages` - メッセージ一覧
- `POST /api/messages` - メッセージ送信
- `GET /api/messages/:id` - メッセージ詳細
- `PUT /api/messages/:id/read` - 既読化
- `DELETE /api/messages/:id` - メッセージ削除

---

### 📌 Scrap Module（スクラップ）

パス: `/src/scrap/`  
主な機能:

- 投稿のスクラップ/ブックマーク
- 個人スクラップ一覧
- スクラップ解除
- ページネーション

主な API:

- `GET /api/scrap` - スクラップ一覧
- `POST /api/scrap/:storyId` - スクラップ追加
- `DELETE /api/scrap/:storyId` - スクラップ削除
- `GET /api/scrap/check/:storyId` - スクラップ有無

---

### 🛡️ Blind Module（通報/ブラインド）

パス: `/src/blind/`  
主な機能:

- 投稿/コメントの通報
- 管理者によるブラインド処理
- 通報理由の分類
- 通報履歴管理

主な API:

- `POST /api/blind/report` - 通報受付
- `GET /api/blind/reports` - 通報一覧（管理者）
- `PUT /api/blind/:id/process` - 通報処理（管理者）

---

### 💡 Suggestion Module（提案/サジェスト）

パス: `/src/suggestion/`  
主な機能:

- チャンネル別のサイト改善提案
- ユーザー別提案管理
- 画像添付対応
- カテゴリ分類（提案/問い合わせ/通報）
- CRUD 機能

主な API:

- `GET /api/suggestion/pageTableData` - 提案一覧（チャンネル別 + ユーザー別）
- `POST /api/suggestion/create` - 提案作成
- `GET /api/suggestion/detail/:id` - 提案詳細
- `GET /api/suggestion/detail/edit/:id` - 編集用データ
- `POST /api/suggestion/update/:id` - 提案更新
- `DELETE /api/suggestion/:id` - 提案削除

---

## 🗄️ データベーススキーマ

### 📊 主なエンティティ関係（20 エンティティ）

```
User（ユーザー）
├── has many Stories（投稿）
├── has many Comments（コメント）
├── has many Likes（推薦/非推薦）
├── has many Messages（sent/received）
├── has many Notifications（通知）
├── has many Scraps（スクラップ）
├── has many Subscriptions（チャンネル購読）
├── has many Suggestions（提案）
├── has many ChannelNotificationSubscriptions（チャンネル通知購読）
├── has many ChannelChatMessages（チャットメッセージ）
├── has many Reports（通報）
├── has many Blinds（ブラインド）
├── has many RecommendRankings（推薦ランキング）
└── has one UserImage（プロフィール画像）

Story（投稿）
├── belongs to User（作成者）
├── belongs to Channel（チャンネル）
├── has many Comments（コメント）
├── has many Likes（推薦/非推薦）
├── has many StoryImages（添付画像）
├── has many StoryVideos（添付動画）
├── has many Scraps（スクラップ）
├── has many Reports（通報）
├── has many Notifications（関連通知）
└── has many RecommendRankings（推薦ランキング）

Channel（チャンネル）
├── belongs to User（作成者）
├── has many Stories（投稿）
├── has many Subscriptions（購読者）
├── has many Suggestions（提案）
├── has many ChannelChatMessages（チャットメッセージ）
├── has many ChannelNotificationSubscriptions（通知購読）
└── has one ChannelImage（チャンネル画像）

Comment（コメント）
├── belongs to Story（投稿）
├── belongs to User（作成者）
├── has many Likes（推薦/非推薦）
├── has many Reports（通報）
├── has many Notifications（関連通知）
└── self-referencing（返信）

Suggestion（提案）
├── belongs to User（作成者）
├── belongs to Channel（チャンネル, nullable）
└── has many SuggestionImages（添付画像）

Notification（通知）
├── belongs to User（受信者）
├── belongs to Story（関連投稿）
└── belongs to Comment（関連コメント）

ChannelChatMessage（チャットメッセージ）
├── belongs to User（作成者）
└── belongs to Channel（チャンネル）

Report（通報）
├── belongs to User（通報者）
├── belongs to Story（対象投稿, nullable）
└── belongs to Comment（対象コメント, nullable）

Blind（ブラインド）
├── belongs to User（処理者）
├── belongs to Story（ブラインド投稿, nullable）
└── belongs to Comment（ブラインドコメント, nullable）
```

### 🔑 主なテーブル構造

#### User（ユーザー）

```sql
- id: Primary Key (VARCHAR)
- user_email: メール（ログイン ID）
- password: ハッシュ化パスワード
- nickname: ニックネーム
- name: 氏名
- created_at: 作成日時
- updated_at: 更新日時
```

#### Story（投稿）

```sql
- id: Primary Key (INT)
- title: タイトル
- content: 本文 (TEXT)
- category: カテゴリ
- like_count: 推薦数
- dislike_count: 非推薦数
- read_count: 閲覧数
- comments_count: コメント数
- imageFlag: 画像添付有無
- videoFlag: 動画添付有無
- isNotice: お知らせフラグ
- channelId: チャンネル ID (FK)
- userId: 作成者 ID (FK)
- created_at: 作成日時
- updated_at: 更新日時
```

#### Channel（チャンネル）

```sql
- id: Primary Key (INT)
- channel_name: チャンネル名
- slug: URL スラッグ (UNIQUE)
- story_count: 投稿数
- subscriber_count: 購読者数
- creatorId: 作成者 ID (FK)
- created_at: 作成日時
- updated_at: 更新日時
```

#### Suggestion（提案）

```sql
- id: Primary Key (INT)
- category: カテゴリ（提案/問い合わせ/通報）
- title: タイトル
- content: 本文 (TEXT)
- userId: 作成者 ID (FK)
- channelId: チャンネル ID (FK, nullable)
- created_at: 作成日時
- updated_at: 更新日時
- deleted_at: 削除日時 (nullable)
```

#### ChannelChatMessage（チャンネルチャットメッセージ）

```sql
- id: Primary Key (INT)
- message: メッセージ内容
- channelId: チャンネル ID (FK)
- userId: 作成者 ID (FK)
- created_at: 作成日時
```

---

## 🚀 インストール & 実行

### 📋 事前要件

- Node.js 20+
- MySQL 8.0+
- npm または yarn

### 🔧 インストール手順

1. 依存関係のインストール

```bash
cd back
npm install
```

2. データベース作成

```sql
-- MySQL でデータベース作成
CREATE DATABASE `board-study` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

3. 環境設定  
   `src/app.module.ts` の DB 接続情報を修正:

```typescript
TypeOrmModule.forRoot({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root', // 現在の設定値
  password: '6429', // 実際のパスワードに変更
  database: 'board-study',
  entities: [__dirname + '/entities/*.entity{.ts,.js}'],
  logging: true, // 開発時にクエリログ出力
  synchronize: true, // ⚠️ 開発環境のみ true
  keepConnectionAlive: true,
  charset: 'utf8mb4_general_ci', // 絵文字対応
});
```

4. アップロードディレクトリ作成

```bash
mkdir upload userUpload channelUpload suggestionUpload videoUpload
```

5. アプリケーション起動

```bash
# 開発モード（自動再起動）
npm run start:dev

# 通常起動
npm run start

# プロダクションモード
npm run start:prod
```

### 🌐 接続情報

- バックエンドサーバー: http://localhost:9999
- API ドキュメント（Swagger）: http://localhost:9999/api
- Socket.IO エンドポイント: http://localhost:9999/socket.io/
- 静的ファイル:
  - 投稿画像: http://localhost:9999/upload/
  - ユーザープロフィール: http://localhost:9999/userUpload/
  - チャンネル画像: http://localhost:9999/channelUpload/
  - 提案画像: http://localhost:9999/suggestionUpload/
  - 投稿動画: http://localhost:9999/videoUpload/
- CORS 許可ドメイン: http://localhost:3000, http://127.0.0.1:3000

---

## 🧪 テスト

### テスト実行

```bash
# 単体テスト
npm run test

# E2E テスト
npm run test:e2e

# テストカバレッジ
npm run test:cov

# ウォッチモード
npm run test:watch
```

---

## 🛠️ 開発ツール

### コード品質

```bash
# ESLint（リンティング/自動修正）
npm run lint

# Prettier（コード整形）
npm run format
```

### NestJS CLI 活用

```bash
# 新規モジュール
nest g module feature-name

# コントローラ
nest g controller feature-name

# サービス
nest g service feature-name

# CRUD リソース自動生成
nest g resource feature-name

# WebSocket ゲートウェイ
nest g gateway feature-name
```

---

## 📡 API ドキュメント

### Swagger UI

開発サーバー起動後、`http://localhost:9999/api` で詳細な API ドキュメントを確認できます。

### 主な API エンドポイント

#### 認証

- `POST /auth/signup` - 会員登録
- `POST /auth/signin` - ログイン
- `POST /auth/logout` - ログアウト
- `PUT /auth/updatePassword` - パスワード変更

#### 投稿

- `GET /api/story/pageTableData` - 投稿一覧（テーブル）
- `GET /api/story/cardPageTableData` - 投稿一覧（カード）
- `POST /api/story/create` - 投稿作成
- `GET /api/story/detail/:id` - 投稿詳細
- `PUT /api/story/likeOrUnlike/:id` - 推薦/非推薦
- `GET /api/story/search` - 投稿検索

#### チャンネル

- `GET /api/channels` - チャンネル一覧
- `POST /api/channels/create` - 新規チャンネル作成
- `GET /api/channels/slug/:slug` - スラッグで取得
- `POST /api/channels/:id/subscribe` - 購読
- `POST /api/channels/:id/upload-image` - 画像アップロード
- `PATCH /api/channels/:id/hide` - 非表示/表示

#### 提案（サジェスト）

- `GET /api/suggestion/pageTableData` - 提案一覧（チャンネル別 + ユーザー別）
- `POST /api/suggestion/create` - 提案作成
- `GET /api/suggestion/detail/:id` - 提案詳細

#### リアルタイムチャット（WebSocket）

- `join-channel` - 入室
- `send-message` - メッセージ送信
- `typing-start/stop` - タイピング表示

#### 通知

- `GET /api/notifications` - 通知一覧
- `PUT /api/notifications/:id/read` - 既読化
- `GET /api/channel-notifications/unread` - 未読チャンネル通知

#### メッセージ

- `GET /api/messages` - メッセージ一覧
- `POST /api/messages` - メッセージ送信
- `PUT /api/messages/:id/read` - 既読化

---

## 🔒 セキュリティ考慮事項

### 認証 & 認可

- セッションベース認証（express-session）
- bcrypt によるパスワードハッシュ
- CORS 設定で許可ドメインのみ許可
- 認証ガードによる API 保護

### データ検証

- class-validator による DTO 検証
- TypeORM による SQL インジェクション防止
- ファイルアップロード時の拡張子/サイズ制限
- 入力データのサニタイズ

### エラー処理

- グローバル例外フィルタで一貫したエラーレスポンス
- 機微情報の露出防止
- 適切な HTTP ステータスコードの使用

---

## 🚀 デプロイ考慮事項

### 環境変数管理

本番環境では以下を環境変数で管理します:

- データベース接続情報
- セッションシークレット
- JWT シークレット（使用時）
- ファイルアップロードパス
- CORS 許可ドメイン

### パフォーマンス最適化

- データベースインデックス最適化
- 画像圧縮と CDN 利用
- キャッシュ戦略（Redis など）
- ロードバランシング
- 静的ファイル配信の最適化

### モニタリング

- アプリケーションログ管理
- パフォーマンスモニタリング（APM）
- エラー追跡（Sentry など）
- WebSocket 接続モニタリング

---

## 🔄 最新アップデート（2025年1月）

### 📊 現在のシステム規模

- 20 のデータベースエンティティ: 複合的なコミュニティ機能を支援
- 12 の機能モジュール: 機能別に細分化されたモジュール構造
- 2,190 行の投稿サービス: 大規模な投稿処理ロジック
- 716 行の認証コントローラ: 緻密なユーザー管理
- 5 つのアップロードディレクトリ: 多様なメディアファイル対応
- 396 行のチャンネルサービス: 完全なチャンネル作成/管理
- 260 行のチャンネルコントローラ: チャンネル CRUD と画像管理

### 新規追加機能

- ✅ ユーザーによるチャンネル作成: ログインユーザーが直接作成（スラッグベース）
- ✅ チャンネル画像管理: 画像のアップロード/編集/削除を完全実装
- ✅ チャンネル購読システム: DB 連携の購読/解除を完全実装
- ✅ チャンネル非表示/表示: 管理者または作成者権限による制御
- ✅ 提案のチャンネル別フィルタ: 各チャンネルで独立管理
- ✅ リアルタイムチャンネルチャット: Socket.IO 4.8.1 ベース
- ✅ チャンネル通知システム: 新規投稿通知の購読/解除
- ✅ ダイレクトメッセージ: ユーザー間 1:1 メッセージ
- ✅ スクラップ機能: 投稿のブックマークと管理
- ✅ 動画アップロード: 投稿への動画添付（videoUpload）
- ✅ プロフィール画像: ユーザープロフィール画像アップロード
- ✅ 通報システム: Report エンティティベース
- ✅ ブラインド処理: Blind エンティティベース
- ✅ 推薦ランキング: RecommendRanking エンティティベース

### 技術スタックアップデート

- 🔧 NestJS 10.0.0
- 🔧 TypeORM 0.3.20
- 🔧 Socket.IO 4.8.1
- 🔧 MySQL2 3.11.3
- 🔧 TypeScript 5.1.3

### アーキテクチャ改善

- 🏗️ モジュール化構造: 12 の独立モジュール
- 🏗️ 詳細なファイル管理: 5 つのアップロードディレクトリ
- 🏗️ カスタムデコレータ: admin, get-user, token デコレータ
- 🏗️ トランザクション処理: storyTransaction.ts による複雑な処理
- 🏗️ SQL クエリ最適化: storysql.ts（1055 行）の最適化クエリ
- 🏗️ リアルタイム通信: カスタム Socket.IO アダプタと CORS 設定
- 🏗️ チャンネルシステム完成: 作成から管理まで完全実装
- 🏗️ 権限ベース管理: 作成者/管理者の権限体系
- 🏗️ スラッグベースルーティング: SEO に優しい URL 構造

---

## 📞 サポートおよび問い合わせ

本ドキュメントに関する質問や改善提案があれば、開発チームまでご連絡ください。

**開発チーム**: StudyBoard Team  
**プロジェクト**: Study Board Backend API  
**バージョン**: 2.2.0  
**最終更新**: 2025年1月21日  
**NestJS バージョン**: 10.0.0  
**データベース**: MySQL 8.0+（board-study）

---

_本ドキュメントは Study Board バックエンドシステムの全体的な構造と機能を説明します。開発過程に応じて継続的に更新されます。_
