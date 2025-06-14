const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.IO 서버 설정 - sticky session 문제 해결을 위한 설정
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
  // XHR Polling 문제 해결을 위한 설정
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  // sticky session 관련 설정
  cookie: false,
  // 핸드셰이크 타임아웃 증가
  pingTimeout: 60000,
  pingInterval: 25000,
  // 연결 상태 확인
  upgradeTimeout: 30000,
  // 폴링 관련 설정
  httpCompression: false,
  perMessageDeflate: false,
});

// CORS 설정
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 기본 라우트
app.get('/', (req, res) => {
  res.send(`
    <h1>Socket.IO 서버 실행 중</h1>
    <p>포트: 9999</p>
    <p>Socket.IO 엔드포인트: /socket.io/</p>
    <p>현재 시간: ${new Date().toISOString()}</p>
  `);
});

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log('✅ 새로운 클라이언트 연결:', socket.id);
  console.log('🔗 연결 방식:', socket.conn.transport.name);

  // 즉시 연결 확인 메시지 전송
  socket.emit('connection_ack', {
    type: 'connection_ack',
    message: '서버 연결 성공!',
    socketId: socket.id,
    transport: socket.conn.transport.name,
    timestamp: new Date().toISOString(),
  });

  // 전송 방식 변경 감지
  socket.conn.on('upgrade', () => {
    console.log('🔄 전송 방식 업그레이드:', socket.conn.transport.name);
  });

  // 채널 입장 처리
  socket.on('join_channel', (data) => {
    console.log('🚪 채널 입장:', data);
    const channelRoom = `channel_${data.channel_id}`;
    socket.join(channelRoom);

    socket.emit('connection_ack', {
      type: 'connection_ack',
      message: `채널 ${data.channel_id} 입장 완료`,
      channel_id: data.channel_id,
      timestamp: new Date().toISOString(),
    });
  });

  // 메시지 전송 처리
  socket.on('send_message', (data) => {
    console.log('📨 메시지:', data);

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

    // 채널의 모든 사용자에게 메시지 브로드캐스트
    io.to(`channel_${data.channel_id}`).emit('new_message', {
      type: 'new_message',
      channel_id: data.channel_id,
      message: messageData,
      timestamp: new Date().toISOString(),
    });
  });

  // Ping 처리
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // 연결 해제 처리
  socket.on('disconnect', (reason) => {
    console.log('❌ 클라이언트 연결 해제:', socket.id, '이유:', reason);
  });

  // 오류 처리
  socket.on('error', (error) => {
    console.error('🚨 Socket 오류:', error);
  });
});

// 서버 시작
const PORT = 9999;
server.listen(PORT, () => {
  console.log('🚀 Socket.IO 서버 시작됨');
  console.log(`📡 포트: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO: http://localhost:${PORT}/socket.io/`);
  console.log('⏰ 시작 시간:', new Date().toISOString());
});

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.log('\n🛑 서버 종료 중...');
  server.close(() => {
    console.log('✅ 서버 종료 완료');
    process.exit(0);
  });
});
