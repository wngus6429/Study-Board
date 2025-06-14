const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const httpServer = createServer(app);

// CORS 설정
app.use(
  cors({
    origin: '*',
    credentials: false,
  }),
);

// Socket.IO 서버 설정
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
});

// 기본 라우트
app.get('/', (req, res) => {
  res.send('Socket.IO 테스트 서버가 실행 중입니다!');
});

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log('✅ 클라이언트 연결:', socket.id);

  // 연결 확인 메시지 전송
  socket.emit('connection_ack', {
    type: 'connection_ack',
    message: '테스트 서버 연결 성공',
    socketId: socket.id,
    timestamp: new Date().toISOString(),
  });

  // 채널 입장 처리
  socket.on('join_channel', (data) => {
    console.log('🚪 채널 입장 요청:', data);
    socket.join(`channel_${data.channel_id}`);

    socket.emit('connection_ack', {
      type: 'connection_ack',
      message: `채널 ${data.channel_id}에 입장했습니다.`,
      channel_id: data.channel_id,
      timestamp: new Date().toISOString(),
    });
  });

  // 메시지 전송 처리
  socket.on('send_message', (data) => {
    console.log('📨 메시지 수신:', data);

    const messageData = {
      id: Date.now(),
      channel_id: data.channel_id,
      message: data.message,
      user: {
        id: 'test_user',
        nickname: '테스트 사용자',
      },
      created_at: new Date().toISOString(),
    };

    io.to(`channel_${data.channel_id}`).emit('new_message', {
      type: 'new_message',
      channel_id: data.channel_id,
      message: messageData,
      timestamp: new Date().toISOString(),
    });
  });

  // 연결 해제 처리
  socket.on('disconnect', () => {
    console.log('❌ 클라이언트 연결 해제:', socket.id);
  });
});

// 서버 시작
const PORT = 9999;
httpServer.listen(PORT, () => {
  console.log('🚀 Socket.IO 테스트 서버가 포트', PORT, '에서 실행 중입니다.');
  console.log(
    '📡 Socket.IO 엔드포인트: http://localhost:' + PORT + '/socket.io/',
  );
  console.log('🌐 테스트 페이지: http://localhost:' + PORT);
});
