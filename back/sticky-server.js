const cluster = require('cluster');
const http = require('http');
const socketIo = require('socket.io');
const sticky = require('sticky-session');

// HTTP 서버 생성
const server = http.createServer((req, res) => {
  // 기본 응답
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <h1>Sticky Session Socket.IO 서버</h1>
      <p>Worker ID: ${cluster.worker ? cluster.worker.id : 'Master'}</p>
      <p>포트: 9999</p>
      <p>현재 시간: ${new Date().toISOString()}</p>
    `);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Socket.IO 서버를 HTTP 서버에 연결
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  cookie: false,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// sticky-session을 사용하여 서버 시작
const isWorker = sticky.listen(server, 9999);

// Worker 프로세스에서만 Socket.IO 이벤트 처리
if (isWorker) {
  console.log(`🔧 Worker ${cluster.worker.id} 시작됨`);

  io.on('connection', (socket) => {
    console.log(
      `✅ 새로운 클라이언트 연결 (Worker ${cluster.worker.id}):`,
      socket.id,
    );
    console.log('🔗 연결 방식:', socket.conn.transport.name);

    // 연결 확인 메시지
    socket.emit('connection_ack', {
      type: 'connection_ack',
      message: '서버 연결 성공!',
      socketId: socket.id,
      workerId: cluster.worker.id,
      transport: socket.conn.transport.name,
      timestamp: new Date().toISOString(),
    });

    // 전송 방식 변경 감지
    socket.conn.on('upgrade', () => {
      console.log(
        `🔄 전송 방식 업그레이드 (Worker ${cluster.worker.id}):`,
        socket.conn.transport.name,
      );
    });

    // 채널 입장 처리
    socket.on('join_channel', (data) => {
      console.log(`🚪 채널 입장 (Worker ${cluster.worker.id}):`, data);
      const channelRoom = `channel_${data.channel_id}`;
      socket.join(channelRoom);

      socket.emit('connection_ack', {
        type: 'connection_ack',
        message: `채널 ${data.channel_id} 입장 완료`,
        channel_id: data.channel_id,
        workerId: cluster.worker.id,
        timestamp: new Date().toISOString(),
      });
    });

    // 메시지 전송 처리
    socket.on('send_message', (data) => {
      console.log(`📨 메시지 (Worker ${cluster.worker.id}):`, data);

      const messageData = {
        id: Date.now(),
        channel_id: data.channel_id,
        message: data.message,
        user: {
          id: 'test_user',
          nickname: '테스트 사용자',
        },
        created_at: new Date().toISOString(),
        workerId: cluster.worker.id,
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
      socket.emit('pong', {
        timestamp: Date.now(),
        workerId: cluster.worker.id,
      });
    });

    // 연결 해제 처리
    socket.on('disconnect', (reason) => {
      console.log(
        `❌ 클라이언트 연결 해제 (Worker ${cluster.worker.id}):`,
        socket.id,
        '이유:',
        reason,
      );
    });

    // 오류 처리
    socket.on('error', (error) => {
      console.error(`🚨 Socket 오류 (Worker ${cluster.worker.id}):`, error);
    });
  });

  console.log(`🚀 Socket.IO Worker ${cluster.worker.id} 준비 완료`);
} else {
  console.log('🎯 Master 프로세스 시작됨');
  console.log(`📡 포트: 9999`);
  console.log(`🌐 URL: http://localhost:9999`);
  console.log(`🔌 Socket.IO: http://localhost:9999/socket.io/`);
  console.log('⏰ 시작 시간:', new Date().toISOString());
}

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.log('\n🛑 서버 종료 중...');
  if (isWorker) {
    console.log(`Worker ${cluster.worker.id} 종료`);
  } else {
    console.log('Master 프로세스 종료');
  }
  process.exit(0);
});
