const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createRequire } = require("node:module");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const backRequire = createRequire(path.join(root, "back/package.json"));
const frontRequire = createRequire(path.join(root, "front/package.json"));
backRequire("ts-node").register({
  project: path.join(root, "back/tsconfig.json"),
  transpileOnly: true,
});
backRequire("reflect-metadata");
const { Test } = backRequire("@nestjs/testing");
const { JwtModule, JwtService } = backRequire("@nestjs/jwt");
const { getRepositoryToken } = backRequire("@nestjs/typeorm");
const { ThrottlerModule, ThrottlerGuard } = backRequire("@nestjs/throttler");
const { APP_GUARD, APP_INTERCEPTOR } = backRequire("@nestjs/core");
const { ClassSerializerInterceptor } = backRequire("@nestjs/common");
const { ChannelChatGateway } = backRequire(
  "./src/channel-chat/channel-chat.gateway.ts",
);
const { ChannelChatService } = backRequire(
  "./src/channel-chat/channel-chat.service.ts",
);
const { SocketAuthService } = backRequire(
  "./src/channel-chat/socket-auth.service.ts",
);
const { User } = backRequire("./src/entities/User.entity.ts");
const { io } = frontRequire("socket.io-client");

function event(socket, name, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(name, handler);
      reject(new Error("Timed out: " + name));
    }, 4000);
    function handler(value) {
      if (!predicate(value)) return;
      clearTimeout(timer);
      socket.off(name, handler);
      resolve(value);
    }
    socket.on(name, handler);
  });
}

// Loopback-only server, synthetic repository, real Nest + Socket.IO + signed JWTs.
for (const mode of ["development", "production"]) {
  test(
    "authenticated Socket.IO integration: " + mode,
    { timeout: 20000 },
    async (t) => {
      const oldMode = process.env.NODE_ENV;
      const oldOrigins = process.env.CORS_ORIGINS;
      process.env.NODE_ENV = mode;
      const origin =
        mode === "production"
          ? "https://board.example.invalid"
          : "http://localhost:3000";
      process.env.CORS_ORIGINS = " " + origin + ", http://127.0.0.1:3000 ";
      const writes = [];
      let failSave = false;
      const repository = {
        async findOne({ where }) {
          return where.id === "sender" &&
            where.user_email === "sender@example.invalid"
            ? { id: "sender", nickname: "Verified Sender" }
            : null;
        },
      };
      const moduleRef = await Test.createTestingModule({
        imports: [
          JwtModule.register({
            secret: "integration-test-key-no-production-secrets",
          }),
          ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
        ],
        providers: [
          ChannelChatGateway,
          SocketAuthService,
          { provide: APP_GUARD, useClass: ThrottlerGuard },
          { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
          { provide: getRepositoryToken(User), useValue: repository },
          {
            provide: ChannelChatService,
            useValue: {
              async joinChannelChat(channelId, userId) {
                assert.equal(userId, "sender");
                if (channelId !== 7) throw new Error("channel unavailable");
              },
              async sendChannelChatMessage(channelId, userId, message) {
                if (failSave) throw new Error("synthetic DB failure");
                writes.push({ channelId, userId, message });
                return {
                  chatMessage: {
                    id: writes.length,
                    message,
                    user: { id: userId, nickname: "Verified Sender" },
                  },
                };
              },
            },
          },
        ],
      }).compile();
      const app = moduleRef.createNestApplication({ logger: false });
      const clients = [];
      try {
        await app.listen(0, "127.0.0.1");
        const url = "http://127.0.0.1:" + app.getHttpServer().address().port;
        const jwt = moduleRef.get(JwtService);
        const claims = { id: "sender", user_email: "sender@example.invalid" };
        const access = jwt.sign(claims, { expiresIn: "1h" });
        const connect = async (token, options = {}) => {
          const socket = io(url, {
            autoConnect: false,
            reconnection: false,
            forceNew: true,
            transports: options.transports ?? ["websocket"],
            extraHeaders: {
              Origin: options.origin ?? origin,
              ...(token ? { Cookie: "access_token=" + token } : {}),
            },
            auth: { user_id: "victim", user_nickname: "Forged" },
          });
          clients.push(socket);
          const outcome = new Promise((resolve, reject) => {
            const timer = setTimeout(
              () => reject(new Error("Connection timed out")),
              4000,
            );
            socket.once("connect", () => {
              clearTimeout(timer);
              resolve({ socket });
            });
            socket.once("connect_error", (error) => {
              clearTimeout(timer);
              resolve({ socket, error });
            });
          });
          socket.connect();
          return outcome;
        };

        await t.test(
          "rejects missing, forged, expired, refresh, and deleted-user tokens",
          async () => {
            for (const token of [
              undefined,
              "forged",
              jwt.sign(claims, { expiresIn: -1 }),
              jwt.sign({ id: "sender" }, { expiresIn: "7d" }),
              jwt.sign(
                { id: "deleted", user_email: "deleted@example.invalid" },
                { expiresIn: "1h" },
              ),
            ]) {
              const result = await connect(token);
              assert.equal(result.error?.data.code, "UNAUTHORIZED");
              assert.equal(result.socket.connected, false);
            }
          },
        );

        await t.test(
          "rejects a foreign browser origin even with a valid cookie",
          async () => {
            const result = await connect(access, {
              origin: "https://foreign.example.invalid",
            });
            assert.equal(result.error?.data.code, "FORBIDDEN");
          },
        );

        for (const transport of ["polling", "websocket"]) {
          await t.test(
            "authenticates " + transport + " and ignores forged join identity",
            async () => {
              const { socket, error } = await connect(access, {
                transports: [transport],
              });
              assert.equal(error, undefined);
              const joined = event(
                socket,
                "connection_ack",
                (data) => data.channel_id === 7,
              );
              socket.emit("join_channel", {
                channel_id: 7,
                user_id: "victim",
                user_nickname: "Forged",
              });
              await joined;
              const message = event(socket, "new_message");
              socket.emit("send_message", {
                channel_id: 7,
                message: "hello",
                user_id: "victim",
              });
              const received = await message;
              assert.equal(received.message.user.id, "sender");
              assert.equal(writes.at(-1).userId, "sender");

              const count = writes.length;
              const denied = event(socket, "error");
              socket.emit("send_message", {
                channel_id: 8,
                message: "wrong room",
              });
              await denied;
              assert.equal(writes.length, count);

              let broadcast = false;
              socket.once("new_message", () => {
                broadcast = true;
              });
              failSave = true;
              const failed = event(socket, "error");
              socket.emit("send_message", {
                channel_id: 7,
                message: "must not broadcast",
              });
              await failed;
              failSave = false;
              assert.equal(broadcast, false);
              assert.equal(writes.length, count);
              socket.disconnect();
            },
          );
        }

        await t.test(
          "denies sending before joining and to a nonexistent room",
          async () => {
            const { socket } = await connect(access);
            const denied = event(socket, "error");
            socket.emit("send_message", {
              channel_id: 7,
              message: "not joined",
            });
            await denied;
            const joinDenied = event(socket, "error");
            socket.emit("join_channel", { channel_id: 999 });
            await joinDenied;
            assert.equal(
              moduleRef.get(ChannelChatGateway).getChannelOnlineUsers(999),
              0,
            );
            socket.disconnect();
          },
        );

        await t.test(
          "disconnects an already-open socket when its token expires",
          async () => {
            const token = jwt.sign(claims, { expiresIn: 2 });
            const { socket, error } = await connect(token);
            assert.equal(error, undefined);
            const disconnected = event(socket, "disconnect");
            await disconnected;
            assert.equal(socket.connected, false);
          },
        );
      } finally {
        for (const client of clients) client.disconnect();
        await app.close();
        if (oldMode === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = oldMode;
        if (oldOrigins === undefined) delete process.env.CORS_ORIGINS;
        else process.env.CORS_ORIGINS = oldOrigins;
      }
    },
  );
}
