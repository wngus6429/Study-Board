# 채널 채팅 백엔드 구현 가이드

실시간 채널 채팅 기능을 위한 백엔드 API와 웹소켓 서버 구현 가이드입니다.

## 🚀 구현 완료된 프론트엔드 기능

### ✅ API 클라이언트

- `/app/api/channelChatApi.ts` - REST API 호출 함수들
- `/app/utils/websocket.ts` - 웹소켓 연결 관리 클래스

### ✅ 채팅 UI 컴포넌트

- 실시간 메시지 표시
- 메시지 입력 및 전송
- 연결 상태 표시
- 온라인 사용자 수 표시
- 타이핑 인디케이터

## 🎯 필요한 백엔드 구현

### 1. REST API 엔드포인트

#### 📥 메시지 조회

```
GET /api/channel-chat/{channelId}/messages?page=1&limit=50
```

#### 📤 메시지 전송

```
POST /api/channel-chat/{channelId}/send
Body: { "message": "메시지 내용" }
```

#### 👋 채널 입장/퇴장

```
POST /api/channel-chat/{channelId}/join
POST /api/channel-chat/{channelId}/leave
```

#### 👥 참여자 목록

```
GET /api/channel-chat/{channelId}/participants
```

#### 🗑️ 메시지 삭제

```
DELETE /api/channel-chat/{channelId}/messages/{messageId}
```

### 2. 데이터베이스 스키마

#### channel_chat_messages 테이블

```sql
CREATE TABLE channel_chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  channel_id INT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_channel_created (channel_id, created_at),
  INDEX idx_user_created (user_id, created_at)
);
```

#### channel_chat_participants 테이블 (선택사항 - 온라인 사용자 추적)

```sql
CREATE TABLE channel_chat_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  channel_id INT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  UNIQUE KEY unique_channel_user (channel_id, user_id),
  INDEX idx_channel_active (channel_id, last_seen)
);
```

### 3. 웹소켓 서버

#### 웹소켓 연결 URL

```
ws://localhost:3000/channel-chat/{channelId}
```

#### 메시지 타입

```typescript
// 클라이언트 → 서버
{
  type: 'join_channel' | 'leave_channel' | 'send_message' | 'typing',
  channel_id: number,
  message?: string
}

// 서버 → 클라이언트
{
  type: 'new_message' | 'user_joined' | 'user_left' | 'typing' | 'error' | 'connection_ack',
  data?: any,
  channel_id?: number,
  user?: { id: string, nickname: string },
  message?: ChannelChatMessage
}
```

### 4. 보안 고려사항

#### 🔐 인증

- 웹소켓 연결 시 JWT 토큰 검증
- REST API 요청 시 세션/토큰 확인

#### 🛡️ 권한 관리

- 채널 구독자만 채팅 참여 가능
- 본인 메시지만 삭제 가능
- 채널 관리자는 모든 메시지 삭제 가능

#### 🚫 스팸 방지

- 메시지 길이 제한 (예: 1000자)
- 연속 전송 제한 (예: 1초당 3개)
- 도배 감지 및 임시 차단

### 5. 성능 최적화

#### 📊 캐싱

- Redis를 활용한 온라인 사용자 캐싱
- 최근 메시지 캐싱

#### 🔄 페이지네이션

- 메시지 무한 스크롤 지원
- 오래된 메시지 자동 정리

#### ⚡ 실시간 성능

- 웹소켓 연결 풀 관리
- 채널별 룸 분리

## 🛠️ 구현 예시 (Node.js + Socket.io)

### 웹소켓 서버 예시

```javascript
const io = require("socket.io")(3001, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("사용자 연결:", socket.id);

  socket.on("join_channel", async (data) => {
    const { channel_id } = data;
    const user = await authenticateUser(socket.handshake.auth.token);

    socket.join(`channel_${channel_id}`);
    socket.to(`channel_${channel_id}`).emit("user_joined", {
      id: user.id,
      nickname: user.nickname,
    });
  });

  socket.on("send_message", async (data) => {
    const { channel_id, message } = data;
    const user = await authenticateUser(socket.handshake.auth.token);

    // DB에 메시지 저장
    const savedMessage = await saveMessageToDB(channel_id, user.id, message);

    // 채널의 모든 사용자에게 브로드캐스트
    io.to(`channel_${channel_id}`).emit("new_message", savedMessage);
  });
});
```

## 🌍 환경변수 설정

### 프론트엔드 (.env.local)

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001
```

### 백엔드

```env
DATABASE_URL=mysql://user:password@localhost:3306/database
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
WEBSOCKET_PORT=3001
```

## 🧪 테스트 방법

1. **더미 데이터로 테스트**: 백엔드 없이도 프론트엔드에서 더미 데이터로 UI 테스트 가능
2. **API 우선 구현**: REST API를 먼저 구현하여 기본 채팅 기능 테스트
3. **웹소켓 추가**: 실시간 기능을 위한 웹소켓 서버 구현

## 🚀 다음 단계

1. ✅ 프론트엔드 구현 완료
2. ⏳ 백엔드 REST API 구현
3. ⏳ 웹소켓 서버 구현
4. ⏳ 데이터베이스 스키마 생성
5. ⏳ 보안 및 권한 관리 구현
6. ⏳ 성능 최적화 및 테스트

---

> 💡 **팁**: 개발 초기에는 REST API만으로도 기본적인 채팅 기능을 구현할 수 있습니다. 웹소켓은 실시간 기능이 필요할 때 추가하면 됩니다!
