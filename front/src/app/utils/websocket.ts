import { ChannelChatMessage } from "../api/channelChatApi";
import { io, Socket } from "socket.io-client";

// 웹소켓 메시지 타입
export interface WebSocketMessage {
  type: "new_message" | "user_joined" | "user_left" | "typing" | "error" | "connection_ack";
  data?: any;
  channel_id?: number;
  user?: {
    id: string;
    nickname: string;
  };
  message?: ChannelChatMessage;
}

// 웹소켓 연결 상태
export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

// 웹소켓 이벤트 콜백 타입
export interface WebSocketCallbacks {
  onMessage: (message: ChannelChatMessage) => void;
  onUserJoined: (user: { id: string; nickname: string }) => void;
  onUserLeft: (user: { id: string; nickname: string }) => void;
  onTyping: (user: { id: string; nickname: string }) => void;
  onStatusChange: (status: WebSocketStatus) => void;
  onError: (error: string) => void;
}

export class ChannelChatWebSocket {
  private socket: Socket | null = null;
  private channelId: number;
  private callbacks: Partial<WebSocketCallbacks>;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private status: WebSocketStatus = "disconnected";
  private userInfo?: { id: string; nickname: string };
  private heartbeatTimer?: NodeJS.Timeout;
  private lastPongTime = 0;
  private isConnecting = false;

  constructor(channelId: number, callbacks: Partial<WebSocketCallbacks>, userInfo?: { id: string; nickname: string }) {
    this.channelId = channelId;
    this.callbacks = callbacks;
    this.userInfo = userInfo;
  }

  // 웹소켓 연결
  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        console.log("✅ 이미 연결된 소켓 재사용");
        this.joinChannel();
        resolve(this.socket);
        return;
      }

      if (this.isConnecting) {
        console.log("⏳ 연결 시도 중...");
        return;
      }

      this.isConnecting = true;
      this.setStatus("connecting");
      console.log("🔌 WebSocket 연결 시도 중...");

      // XHR Polling 문제 해결을 위한 설정
      this.socket = io(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8888", {
        // 전송 방식 설정 - polling을 먼저 시도하고 websocket으로 업그레이드
        transports: ["polling", "websocket"],

        // 업그레이드 관련 설정
        upgrade: true,
        rememberUpgrade: true,

        // 타임아웃 설정 (더 안정적으로)
        timeout: 30000, // 30초로 증가

        // 재연결 설정 (더 보수적으로)
        reconnection: true,
        reconnectionAttempts: 3, // 3번으로 줄임
        reconnectionDelay: 3000, // 3초로 증가
        reconnectionDelayMax: 10000, // 10초로 증가
        randomizationFactor: 0.3, // 랜덤 요소 줄임

        // CORS 설정
        withCredentials: false,

        // 추가 설정
        forceNew: false,
        multiplex: true,

        // 안정성 향상 설정
        autoConnect: true,

        // 쿼리 파라미터
        query: {
          channel_id: this.channelId.toString(),
          timestamp: Date.now().toString(),
        },
      });

      // 연결 성공
      this.socket.on("connect", () => {
        console.log("✅ WebSocket 연결 성공!");
        console.log("🆔 Socket ID:", this.socket?.id);
        console.log("🔗 전송 방식:", (this.socket as any)?.io?.engine?.transport?.name);

        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.setStatus("connected");
        this.startHeartbeat();

        // 채널 입장
        this.joinChannel();
        resolve(this.socket!);
      });

      // 연결 확인 메시지 수신
      this.socket.on("connection_ack", (data) => {
        console.log("📨 서버 연결 확인:", data);
      });

      // 새 메시지 수신
      this.socket.on("new_message", (data) => {
        console.log("📨 새 메시지 수신:", data);
        if (data.message) {
          this.callbacks.onMessage?.(data.message);
        }
      });

      // 사용자 입장
      this.socket.on("user_joined", (data) => {
        console.log("👋 사용자 입장:", data);
        if (data.user) {
          this.callbacks.onUserJoined?.(data.user);
        }
      });

      // 사용자 퇴장
      this.socket.on("user_left", (data) => {
        console.log("👋 사용자 퇴장:", data);
        if (data.user) {
          this.callbacks.onUserLeft?.(data.user);
        }
      });

      // 타이핑 상태
      this.socket.on("user_typing", (data) => {
        if (data.user) {
          this.callbacks.onTyping?.(data.user);
        }
      });

      // 연결 오류
      this.socket.on("connect_error", (error) => {
        console.error("❌ WebSocket 연결 오류:", error);
        this.isConnecting = false;
        this.setStatus("error");
        this.callbacks.onError?.(`연결 오류: ${error.message}`);

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

          setTimeout(() => {
            this.connect().then(resolve).catch(reject);
          }, this.reconnectDelay * this.reconnectAttempts);
        } else {
          reject(new Error(`연결 실패: ${error.message}`));
        }
      });

      // 연결 해제
      this.socket.on("disconnect", (reason) => {
        console.log("🔌 WebSocket 연결 해제:", reason);
        this.isConnecting = false;
        this.setStatus("disconnected");
        this.stopHeartbeat();

        // 의도적인 연결 해제가 아닌 경우에만 재연결 시도
        // transport close, ping timeout 등은 자동 재연결 허용
        if (reason !== "io client disconnect" && reason !== "io server disconnect") {
          console.log(`🔄 네트워크 문제로 인한 연결 해제 (${reason}) - 5초 후 재연결 시도`);
          setTimeout(() => {
            if (!this.socket?.connected && !this.isConnecting) {
              this.connect();
            }
          }, 5000); // 5초 후 재연결
        } else {
          console.log(`🛑 의도적인 연결 해제 (${reason}) - 재연결하지 않음`);
        }
      });

      // 재연결 시도
      this.socket.on("reconnect_attempt", (attemptNumber) => {
        console.log(`🔄 재연결 시도 ${attemptNumber}번째`);
      });

      // 재연결 성공
      this.socket.on("reconnect", (attemptNumber) => {
        console.log(`✅ 재연결 성공 (${attemptNumber}번째 시도)`);
        this.joinChannel();
      });

      // 재연결 실패
      this.socket.on("reconnect_failed", () => {
        console.error("❌ 재연결 실패");
        this.isConnecting = false;
        reject(new Error("재연결 실패"));
      });

      // 일반 오류
      this.socket.on("error", (error) => {
        console.error("🚨 Socket 오류:", error);
      });

      // Ping/Pong 처리
      this.socket.on("ping", () => {
        console.log("🏓 Ping 수신");
      });

      this.socket.on("pong", (data) => {
        console.log("🏓 Pong 수신:", data);
      });
    });
  }

  // 채널 입장
  private joinChannel(): void {
    if (!this.socket || !this.socket.connected) return;

    console.log("🚪 채널 입장 요청:", this.channelId);

    this.socket.emit("join_channel", {
      channel_id: this.channelId,
      user_id: this.userInfo?.id,
      user_nickname: this.userInfo?.nickname,
    });
  }

  // 하트비트 시작
  private startHeartbeat(): void {
    this.stopHeartbeat(); // 기존 타이머 정리

    this.lastPongTime = Date.now();

    // 30초마다 ping 전송
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit("ping");
        console.log("🏓 Ping 전송");

        // 60초 동안 pong 응답이 없으면 연결 상태 의심
        setTimeout(() => {
          const timeSinceLastPong = Date.now() - this.lastPongTime;
          if (timeSinceLastPong > 60000) {
            console.warn("⚠️ Pong 응답이 없습니다. 연결 상태를 확인합니다.");
            this.checkConnection();
          }
        }, 60000);
      }
    }, 30000);
  }

  // 하트비트 중지
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  // 연결 상태 확인
  private checkConnection(): void {
    if (!this.socket || !this.socket.connected) {
      console.log("🔄 연결이 끊어져 재연결을 시도합니다.");
      this.setStatus("connecting");
      this.socket?.connect();
    }
  }

  // 메시지 전송
  send(event: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Socket.IO가 연결되지 않음. 메시지 전송 실패:", event, data);
      this.callbacks.onError?.("연결이 끊어졌습니다. 재연결을 시도합니다.");
      this.connect();
    }
  }

  // 채팅 메시지 전송
  sendMessage(message: string): void {
    this.send("send_message", {
      channel_id: this.channelId,
      message: message,
    });
  }

  // 타이핑 알림 전송
  sendTyping(): void {
    this.send("typing", {
      channel_id: this.channelId,
    });
  }

  // 웹소켓 연결 해제
  disconnect(): void {
    this.stopHeartbeat();

    if (this.socket) {
      // 채널 나가기 알림
      this.send("leave_channel", {
        channel_id: this.channelId,
      });

      this.socket.disconnect();
      this.socket = null;
    }
    this.setStatus("disconnected");
  }

  // 상태 변경
  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  // 현재 상태 반환
  getStatus(): WebSocketStatus {
    return this.status;
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // 연결 상태 테스트
  testConnection() {
    if (this.socket?.connected) {
      console.log("🧪 연결 테스트 시작");
      this.socket.emit("ping");
    }
  }
}

// 간단한 사용을 위한 매니저 인스턴스
class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  connect(channelId: number): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        console.log("✅ 이미 연결된 소켓 재사용");
        this.joinChannel(channelId);
        resolve(this.socket);
        return;
      }

      if (this.isConnecting) {
        console.log("⏳ 연결 시도 중...");
        return;
      }

      this.isConnecting = true;
      console.log("🔌 WebSocket 연결 시도 중...");

      this.socket = io(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8888", {
        transports: ["polling", "websocket"],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        withCredentials: false,
        forceNew: false,
        query: {
          channel_id: channelId.toString(),
          timestamp: Date.now().toString(),
        },
      });

      this.socket.on("connect", () => {
        console.log("✅ WebSocket 연결 성공!");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.joinChannel(channelId);
        resolve(this.socket!);
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ WebSocket 연결 오류:", error);
        this.isConnecting = false;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            this.connect(channelId).then(resolve).catch(reject);
          }, this.reconnectDelay * this.reconnectAttempts);
        } else {
          reject(new Error(`연결 실패: ${error.message}`));
        }
      });

      this.socket.on("disconnect", (reason) => {
        console.log("🔌 WebSocket 연결 해제:", reason);
        this.isConnecting = false;
      });
    });
  }

  private joinChannel(channelId: number) {
    if (this.socket?.connected) {
      this.socket.emit("join_channel", {
        channel_id: channelId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  sendMessage(channelId: number, message: string) {
    if (this.socket?.connected) {
      this.socket.emit("send_message", {
        channel_id: channelId,
        message: message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  onMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const webSocketManager = new WebSocketManager();
