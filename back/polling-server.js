const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// XHR Polling 문제 해결을 위한 Socket.IO 설정
const io = socketIo(server, {
  // CORS 설정
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },

  // 전송 방식 설정 - polling 우선, websocket 업그레이드 허용
  transports: ['polling', 'websocket'],

  // 업그레이드 설정
  allowUpgrades: true,
  upgradeTimeout: 30000,

  // 핸드셰이크 설정
  pingTimeout: 60000,
  pingInterval: 25000,

  // 세션 관리 설정 (sticky session 대안)
  cookie: {
    name: 'io',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  },

  // 연결 설정
  connectTimeout: 45000,

  // 압축 비활성화 (안정성 향상)
  compression: false,
  httpCompression: false,

  // 엔진 설정
  allowEIO3: true,

  // 세션 ID 고정을 위한 설정
  serveClient: true,
  path: '/socket.io/',
});

// Express 미들웨어 설정
app.use((req, res, next) => {
  // CORS 헤더 설정
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  res.header('Access-Control-Allow-Credentials', 'false');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 정적 파일 제공
app.use(express.static('public'));

// 기본 라우트
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Socket.IO 서버 상태</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .status { padding: 20px; background: #f0f8ff; border-radius: 8px; }
            .info { margin: 10px 0; }
            .success { color: #28a745; }
            .warning { color: #ffc107; }
        </style>
    </head>
    <body>
        <div class="status">
            <h1 class="success">✅ Socket.IO 서버 실행 중</h1>
            <div class="info"><strong>포트:</strong> 9999</div>
            <div class="info"><strong>Socket.IO 경로:</strong> /socket.io/</div>
            <div class="info"><strong>전송 방식:</strong> polling → websocket</div>
            <div class="info"><strong>CORS:</strong> 모든 도메인 허용</div>
            <div class="info"><strong>현재 시간:</strong> ${new Date().toISOString()}</div>
            <div class="info warning"><strong>주의:</strong> XHR Polling 최적화 적용됨</div>
        </div>
        
        <script>
            // 간단한 연결 테스트
            console.log('Socket.IO 서버 페이지 로드됨');
        </script>
    </body>
    </html>
  `);
});

// 서버 상태 API
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    port: 9999,
    transport: ['polling', 'websocket'],
    cors: 'enabled',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount || 0,
  });
});

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log(`✅ 새로운 클라이언트 연결: ${socket.id}`);
  console.log(`🔗 전송 방식: ${socket.conn.transport.name}`);
  console.log(`📊 총 연결 수: ${io.engine.clientsCount}`);

  // 연결 확인 메시지 즉시 전송
  socket.emit('connection_ack', {
    type: 'connection_ack',
    message: '서버 연결 성공!',
    socketId: socket.id,
    transport: socket.conn.transport.name,
    timestamp: new Date().toISOString(),
    serverInfo: {
      version: '1.0.0',
      optimized: 'xhr-polling-fix',
    },
  });

  // 전송 방식 업그레이드 감지
  socket.conn.on('upgrade', () => {
    console.log(
      `🔄 ${socket.id} 전송 방식 업그레이드: ${socket.conn.transport.name}`,
    );

    socket.emit('transport_upgraded', {
      type: 'transport_upgraded',
      transport: socket.conn.transport.name,
      timestamp: new Date().toISOString(),
    });
  });

  // 채널 입장 처리
  socket.on('join_channel', (data) => {
    console.log(`🚪 ${socket.id} 채널 입장:`, data);

    if (data && data.channel_id) {
      const channelRoom = `channel_${data.channel_id}`;
      socket.join(channelRoom);

      console.log(`✅ ${socket.id} 채널 ${data.channel_id} 입장 완료`);

      // 입장 확인 메시지
      socket.emit('channel_joined', {
        type: 'channel_joined',
        message: `채널 ${data.channel_id} 입장 완료`,
        channel_id: data.channel_id,
        timestamp: new Date().toISOString(),
      });

      // 채널의 다른 사용자들에게 알림
      socket.to(channelRoom).emit('user_joined', {
        type: 'user_joined',
        channel_id: data.channel_id,
        user: {
          id: socket.id,
          nickname: data.nickname || '익명 사용자',
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 메시지 전송 처리
  socket.on('send_message', (data) => {
    console.log(`📨 ${socket.id} 메시지 전송:`, data);

    if (data && data.channel_id && data.message) {
      const messageData = {
        id: Date.now(),
        channel_id: data.channel_id,
        message: data.message,
        user: {
          id: socket.id,
          nickname: data.nickname || '익명 사용자',
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

      console.log(`✅ 채널 ${data.channel_id}에 메시지 브로드캐스트 완료`);
    }
  });

  // 타이핑 상태 처리
  socket.on('typing', (data) => {
    if (data && data.channel_id) {
      socket.to(`channel_${data.channel_id}`).emit('user_typing', {
        type: 'user_typing',
        channel_id: data.channel_id,
        user: {
          id: socket.id,
          nickname: data.nickname || '익명 사용자',
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Ping 처리
  socket.on('ping', () => {
    console.log(`🏓 ${socket.id} Ping 수신`);
    socket.emit('pong', {
      timestamp: Date.now(),
      socketId: socket.id,
    });
  });

  // 연결 상태 확인
  socket.on('connection_test', () => {
    socket.emit('connection_test_response', {
      status: 'ok',
      socketId: socket.id,
      transport: socket.conn.transport.name,
      timestamp: new Date().toISOString(),
    });
  });

  // 연결 해제 처리
  socket.on('disconnect', (reason) => {
    console.log(`❌ ${socket.id} 연결 해제: ${reason}`);
    console.log(`📊 남은 연결 수: ${io.engine.clientsCount - 1}`);

    // 모든 채널에서 사용자 퇴장 알림
    socket.rooms.forEach((room) => {
      if (room.startsWith('channel_')) {
        const channelId = room.replace('channel_', '');
        socket.to(room).emit('user_left', {
          type: 'user_left',
          channel_id: parseInt(channelId),
          user: {
            id: socket.id,
            nickname: '익명 사용자',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });
  });

  // 오류 처리
  socket.on('error', (error) => {
    console.error(`🚨 ${socket.id} Socket 오류:`, error);

    socket.emit('error_response', {
      type: 'error',
      message: '서버에서 오류가 발생했습니다.',
      timestamp: new Date().toISOString(),
    });
  });
});

// 서버 시작
const PORT = 9999;
server.listen(PORT, () => {
  console.log('🚀 XHR Polling 최적화 Socket.IO 서버 시작됨');
  console.log(`📡 포트: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO: http://localhost:${PORT}/socket.io/`);
  console.log(`📋 상태 API: http://localhost:${PORT}/status`);
  console.log('⚡ 전송 방식: polling → websocket (자동 업그레이드)');
  console.log('🔧 XHR Polling 문제 해결 설정 적용됨');
  console.log('⏰ 시작 시간:', new Date().toISOString());
  console.log('');
  console.log('📝 주요 기능:');
  console.log('  - XHR Polling 오류 해결');
  console.log('  - 자동 전송 방식 업그레이드');
  console.log('  - 채널 기반 메시징');
  console.log('  - 실시간 연결 상태 모니터링');
  console.log('  - CORS 완전 지원');
});

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.log('\n🛑 서버 종료 중...');
  console.log(`📊 마지막 연결 수: ${io.engine.clientsCount}`);

  server.close(() => {
    console.log('✅ 서버 종료 완료');
    process.exit(0);
  });
});

// 예외 처리
process.on('uncaughtException', (error) => {
  console.error('🚨 예상치 못한 오류:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 처리되지 않은 Promise 거부:', reason);
});
