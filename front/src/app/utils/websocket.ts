import { io, Socket } from "socket.io-client";
import axios from "../api/axios";
import type { ChannelChatMessage } from "../api/channelChatApi";

export interface WebSocketMessage {
  type:
    | "new_message"
    | "user_joined"
    | "user_left"
    | "typing"
    | "error"
    | "connection_ack";
  data?: any;
  channel_id?: number;
  user?: { id: string; nickname: string };
  message?: ChannelChatMessage;
}

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

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
  private status: WebSocketStatus = "disconnected";
  private isClosed = false;
  private hasRefreshed = false;
  private refreshPromise?: Promise<void>;
  private pendingConnection?: Promise<Socket>;
  private resolveConnection?: (socket: Socket) => void;
  private rejectConnection?: (error: Error) => void;

  constructor(
    private channelId: number,
    private callbacks: Partial<WebSocketCallbacks>,
  ) {}

  connect(): Promise<Socket> {
    if (this.isClosed)
      return Promise.reject(new Error("종료된 채팅 연결입니다."));
    if (this.isConnected()) return Promise.resolve(this.socket!);
    if (this.pendingConnection) return this.pendingConnection;

    const pending = new Promise<Socket>((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;
    });
    this.pendingConnection = pending;
    this.setStatus("connecting");
    if (!this.socket) this.createSocket();
    this.socket!.connect();
    return pending;
  }

  private createSocket(): void {
    const socket = io(
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8888",
      {
        transports: ["polling", "websocket"],
        withCredentials: true,
        autoConnect: false,
        forceNew: true,
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      },
    );
    this.socket = socket;

    socket.on("connect", () => {
      if (this.isClosed) return;
      this.setStatus("connecting");
      // Sender identity comes exclusively from the server's verified JWT.
      socket.emit("join_channel", { channel_id: this.channelId });
    });
    socket.on("connection_ack", (data) => {
      if (this.isClosed || data.channel_id !== this.channelId) return;
      this.hasRefreshed = false;
      this.setStatus("connected");
      this.resolveConnection?.(socket);
      this.clearPendingConnection();
    });
    socket.on("new_message", (data) => {
      if (data.message) this.callbacks.onMessage?.(data.message);
    });
    socket.on("user_joined", (data) => {
      if (data.user) this.callbacks.onUserJoined?.(data.user);
    });
    socket.on("user_left", (data) => {
      if (data.user) this.callbacks.onUserLeft?.(data.user);
    });
    socket.on("typing", (data) => {
      if (data.user) this.callbacks.onTyping?.(data.user);
    });
    socket.on("connect_error", (error) => {
      if (this.isClosed) return;
      if (
        (error as Error & { data?: { code?: string } }).data?.code ===
        "UNAUTHORIZED"
      ) {
        void this.refreshAuthentication();
        return;
      }
      this.fail(error.message);
    });
    socket.on("error", (error) => {
      if (this.isClosed) return;
      if (error?.code === "UNAUTHORIZED") {
        void this.refreshAuthentication();
        return;
      }
      const message =
        typeof error?.data === "string"
          ? error.data
          : "채팅 요청에 실패했습니다.";
      if (this.status === "connecting") this.fail(message);
      else this.callbacks.onError?.(message);
    });
    socket.on("disconnect", () => {
      if (!this.isClosed) this.setStatus("disconnected");
    });
    socket.io.on("reconnect_attempt", () => {
      if (!this.isClosed) this.setStatus("connecting");
    });
    socket.io.on("reconnect_failed", () =>
      this.fail("채팅 서버에 다시 연결하지 못했습니다."),
    );
  }

  private refreshAuthentication(): Promise<void> {
    if (this.refreshPromise) return this.refreshPromise;
    if (this.isClosed) return Promise.resolve();
    if (this.hasRefreshed) {
      this.socket?.disconnect();
      this.fail("채팅을 사용하려면 다시 로그인해주세요.");
      return Promise.resolve();
    }

    this.hasRefreshed = true;
    // Force a fresh handshake even if the server's disconnect packet is pending.
    this.socket?.disconnect();
    this.setStatus("connecting");
    this.refreshPromise = (async () => {
      try {
        await axios.post("/api/auth/refresh", {}, { skipAuthRedirect: true });
        if (!this.isClosed) {
          this.setStatus("connecting");
          this.socket?.connect();
        }
      } catch {
        if (!this.isClosed) {
          this.socket?.disconnect();
          this.fail("채팅을 사용하려면 다시 로그인해주세요.");
        }
      } finally {
        this.refreshPromise = undefined;
      }
    })();
    return this.refreshPromise;
  }

  private fail(message: string): void {
    if (this.isClosed) return;
    this.setStatus("error");
    this.callbacks.onError?.(message);
    this.rejectConnection?.(new Error(message));
    this.clearPendingConnection();
  }

  private clearPendingConnection(): void {
    this.pendingConnection = undefined;
    this.resolveConnection = undefined;
    this.rejectConnection = undefined;
  }

  send(event: string, data: any): void {
    if (this.isConnected()) this.socket!.emit(event, data);
    else this.callbacks.onError?.("채팅 서버에 연결된 후 다시 시도해주세요.");
  }

  sendMessage(message: string): void {
    this.send("send_message", { channel_id: this.channelId, message });
  }

  sendTyping(): void {
    this.send("typing", { channel_id: this.channelId });
  }

  disconnect(): void {
    this.isClosed = true;
    this.rejectConnection?.(new Error("채팅 연결이 종료되었습니다."));
    this.clearPendingConnection();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.io.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.setStatus("disconnected");
  }

  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  getStatus(): WebSocketStatus {
    return this.status;
  }

  isConnected(): boolean {
    return (
      !this.isClosed && !!this.socket?.connected && this.status === "connected"
    );
  }

  testConnection(): void {
    this.send("ping", {});
  }
}

// Legacy manager shares the same authenticated connection implementation.
class WebSocketManager {
  private connection: ChannelChatWebSocket | null = null;
  private onMessageCallback?: (data: any) => void;

  connect(channelId: number): Promise<Socket> {
    this.connection?.disconnect();
    this.connection = new ChannelChatWebSocket(channelId, {
      onMessage: (message) =>
        this.onMessageCallback?.({
          type: "new_message",
          channel_id: channelId,
          message,
        }),
    });
    return this.connection.connect();
  }

  sendMessage(_channelId: number, message: string): void {
    this.connection?.sendMessage(message);
  }

  onMessage(callback: (data: any) => void): void {
    this.onMessageCallback = callback;
  }

  disconnect(): void {
    this.connection?.disconnect();
    this.connection = null;
  }

  isConnected(): boolean {
    return this.connection?.isConnected() ?? false;
  }
}

export const webSocketManager = new WebSocketManager();
