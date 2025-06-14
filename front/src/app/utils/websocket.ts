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
  private reconnectInterval = 3000;
  private status: WebSocketStatus = "disconnected";
  private userInfo?: { id: string; nickname: string };
  private heartbeatTimer?: NodeJS.Timeout;
  private lastPongTime = 0;

  constructor(channelId: number, callbacks: Partial<WebSocketCallbacks>, userInfo?: { id: string; nickname: string }) {
    this.channelId = channelId;
    this.callbacks = callbacks;
    this.userInfo = userInfo;
  }

  // 웹소켓 연결
  connect(): void {
    if (this.socket && this.socket.connected) {
      console.warn("Socket.IO is already connected");
      return;
    }

    this.setStatus("connecting");

    // Socket.IO 서버 URL
    const serverUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3001";

    console.log("🔌 Socket.IO 연결 시도:", serverUrl);

    try {
      // Socket.IO 클라이언트 설정
      this.socket = io(serverUrl, {
        // 자동 재연결 설정
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
        reconnectionDelayMax: 10000,

        // 연결 타임아웃 설정
        timeout: 10000,

        // 전송 방식 설정 (WebSocket 우선)
        transports: ["websocket", "polling"],

        // 업그레이드 허용
        upgrade: true,

        // 쿠키 및 헤더 설정
        withCredentials: false,

        // 연결 상태 체크 설정
        forceNew: false,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error("Socket.IO 연결 실패:", error);
      this.setStatus("error");
      this.callbacks.onError?.("웹소켓 연결에 실패했습니다.");
      this.scheduleReconnect();
    }
  }

  // 웹소켓 이벤트 리스너 설정
  private setupEventListeners(): void {
    if (!this.socket) return;

    // 연결 성공
    this.socket.on("connect", () => {
      console.log("✅ Socket.IO 연결 성공 - Socket ID:", this.socket?.id);
      this.setStatus("connected");
      this.reconnectAttempts = 0;
      this.startHeartbeat();

      // 채널 입장 메시지 전송
      this.joinChannel();
    });

    // 연결 해제
    this.socket.on("disconnect", (reason: string) => {
      console.log("❌ Socket.IO 연결 해제:", reason);
      this.setStatus("disconnected");
      this.stopHeartbeat();

      // 서버에서 연결을 끊은 경우가 아니라면 재연결 시도
      if (reason === "io server disconnect") {
        // 서버에서 강제 연결 해제 - 재연결하지 않음
        this.callbacks.onError?.("서버에서 연결을 해제했습니다.");
      } else {
        // 네트워크 등의 이유로 끊어진 경우 - 자동 재연결
        console.log("🔄 자동 재연결 시도...");
      }
    });

    // 재연결 시도
    this.socket.on("reconnect_attempt", (attemptNumber: number) => {
      console.log(`🔄 재연결 시도 ${attemptNumber}/${this.maxReconnectAttempts}`);
      this.setStatus("connecting");
    });

    // 재연결 성공
    this.socket.on("reconnect", (attemptNumber: number) => {
      console.log(`✅ 재연결 성공 (시도 ${attemptNumber}회)`);
      this.setStatus("connected");
      this.reconnectAttempts = 0;
      this.joinChannel();
    });

    // 재연결 실패
    this.socket.on("reconnect_failed", () => {
      console.error("❌ 재연결 실패");
      this.setStatus("error");
      this.callbacks.onError?.("연결을 복구할 수 없습니다. 페이지를 새로고침해주세요.");
    });

    // 연결 오류
    this.socket.on("connect_error", (error: Error) => {
      console.error("❌ 연결 오류:", error);
      this.setStatus("error");
      this.callbacks.onError?.(`연결 오류: ${error.message}`);
    });

    // 채팅 메시지 수신
    this.socket.on("new_message", (data: any) => {
      console.log("📨 새 메시지 수신:", data);
      if (data.message) {
        this.callbacks.onMessage?.(data.message);
      }
    });

    // 사용자 입장
    this.socket.on("user_joined", (data: any) => {
      console.log("👋 사용자 입장:", data);
      if (data.user) {
        this.callbacks.onUserJoined?.(data.user);
      }
    });

    // 사용자 퇴장
    this.socket.on("user_left", (data: any) => {
      console.log("👋 사용자 퇴장:", data);
      if (data.user) {
        this.callbacks.onUserLeft?.(data.user);
      }
    });

    // 타이핑 상태
    this.socket.on("typing", (data: any) => {
      if (data.user) {
        this.callbacks.onTyping?.(data.user);
      }
    });

    // 연결 확인
    this.socket.on("connection_ack", (data: any) => {
      console.log("✅ 연결 확인:", data);
    });

    // 에러 메시지
    this.socket.on("error", (data: any) => {
      console.error("❌ 서버 에러:", data);
      this.callbacks.onError?.(data.data || "서버에서 오류가 발생했습니다.");
    });

    // Ping-Pong 응답
    this.socket.on("pong", () => {
      this.lastPongTime = Date.now();
      console.log("🏓 Pong 응답 수신");
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

  // 재연결 스케줄링
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("최대 재연결 시도 횟수 초과");
      this.callbacks.onError?.("연결을 복구할 수 없습니다. 페이지를 새로고침해주세요.");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `🔄 ${this.reconnectInterval}ms 후 재연결 시도 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
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
}
