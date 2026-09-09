const assert = require("node:assert/strict");
const { test } = require("node:test");
const { EventEmitter } = require("node:events");
const { createRequire } = require("node:module");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const front = path.resolve(__dirname, "../../front");
const frontRequire = createRequire(path.join(front, "package.json"));
const ts = frontRequire("typescript");
const React = frontRequire("react");
const { renderToStaticMarkup } = frontRequire("react-dom/server");

function loadTs(relativePath, mocks = {}, globals = {}) {
  const filename = path.join(front, relativePath);
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2021,
    },
  });
  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    console,
    process: { env: { NEXT_PUBLIC_BASE_URL: "http://example.invalid" } },
    require(name) {
      if (name in mocks) return mocks[name];
      if (name === "react" || name === "react/jsx-runtime")
        return frontRequire(name);
      if (name === "@/app/utils/jsonLd")
        return loadTs("src/app/utils/jsonLd.ts");
      throw new Error("Unexpected import: " + name);
    },
    ...globals,
  };
  vm.runInNewContext(outputText, sandbox, { filename });
  return module.exports;
}

const emptyComponent = { __esModule: true, default: () => null };
const payload = "</ScRiPt><script>globalThis.reviewMarker=1</script><!--";

test("JSON-LD serializer preserves data and prevents script termination", () => {
  const { serializeJsonLd } = loadTs("src/app/utils/jsonLd.ts");
  const value = { name: payload, text: '한국어 日本語 < > & " \\ \u2028' };
  const serialized = serializeJsonLd(value);
  assert.equal(serialized.includes("<"), false);
  assert.deepEqual(JSON.parse(serialized), value);
});

for (const isList of [true, false]) {
  test(
    "actual channel " +
      (isList ? "list" : "detail") +
      " SSR escapes hostile stored data",
    async () => {
      const data = {
        id: 1,
        channel_name: payload,
        description: payload,
        slug: "channel",
        creator: { nickname: payload },
      };
      const page = loadTs(
        isList
          ? "src/app/(noLogin)/channels/page.tsx"
          : "src/app/(noLogin)/channels/[slug]/page.tsx",
        {
          "./ChannelsClient": emptyComponent,
          "./ChannelsDetailClient": emptyComponent,
          "@/app/components/common/Loading": emptyComponent,
          "next/navigation": {
            notFound() {
              throw new Error("Unexpected 404");
            },
          },
        },
        {
          fetch: async () => ({
            ok: true,
            json: async () => (isList ? [data] : data),
          }),
        },
      );
      const html = renderToStaticMarkup(
        await page.default({ params: { slug: "channel" } }),
      );
      assert.equal((html.match(/<script\b/gi) ?? []).length, 1);
      assert.equal((html.match(/<\/script>/gi) ?? []).length, 1);
      assert.equal(html.includes(payload), false);
      const json = JSON.parse(html.match(/<script[^>]*>(.*?)<\/script>/s)[1]);
      assert.equal(
        isList ? json.mainEntity.itemListElement[0].item.name : json.name,
        payload,
      );
    },
  );
}

function createClient(refresh = async () => {}) {
  class FakeSocket extends EventEmitter {
    constructor() {
      super();
      this.io = new EventEmitter();
      this.connected = false;
      this.sent = [];
      this.connectCalls = 0;
    }
    emit(event, data) {
      this.sent.push({ event, data });
      return true;
    }
    fromServer(event, data) {
      return super.emit(event, data);
    }
    connect() {
      this.connectCalls++;
      return this;
    }
    disconnect() {
      this.connected = false;
      this.fromServer("disconnect", "io client disconnect");
      return this;
    }
  }
  const socket = new FakeSocket();
  let options;
  const { ChannelChatWebSocket } = loadTs("src/app/utils/websocket.ts", {
    "socket.io-client": {
      io(_url, opts) {
        options = opts;
        return socket;
      },
    },
    "../api/axios": { __esModule: true, default: { post: refresh } },
  });
  return {
    client: new ChannelChatWebSocket(7, {}),
    socket,
    options: () => options,
  };
}

test("browser sends cookies, sends no identity, and waits for room acknowledgement", async () => {
  const { client, socket, options } = createClient();
  const connecting = client.connect();
  assert.equal(options().withCredentials, true);
  assert.equal(options().autoConnect, false);
  socket.connected = true;
  socket.fromServer("connect");
  assert.deepEqual(JSON.parse(JSON.stringify(socket.sent[0])), {
    event: "join_channel",
    data: { channel_id: 7 },
  });
  assert.equal(client.isConnected(), false);
  socket.fromServer("connection_ack", { channel_id: 7 });
  await connecting;
  assert.equal(client.isConnected(), true);
  client.sendMessage("hello");
  assert.deepEqual(JSON.parse(JSON.stringify(socket.sent.at(-1))), {
    event: "send_message",
    data: { channel_id: 7, message: "hello" },
  });
  client.disconnect();
  await assert.rejects(client.connect());
});

test("logout during token refresh cannot resurrect the old socket", async () => {
  let finishRefresh;
  const refresh = new Promise((resolve) => {
    finishRefresh = resolve;
  });
  const { client, socket } = createClient(() => refresh);
  const connecting = client.connect();
  const rejected = assert.rejects(connecting);
  socket.fromServer(
    "connect_error",
    Object.assign(new Error("expired"), { data: { code: "UNAUTHORIZED" } }),
  );
  client.disconnect();
  finishRefresh();
  await rejected;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(socket.connectCalls, 1);
  assert.equal(socket.listenerCount("connect"), 0);
  assert.equal(client.isConnected(), false);
});

test("expired authentication refreshes once and reconnects with cookies", async () => {
  let refreshes = 0;
  const { client, socket } = createClient(async () => {
    refreshes++;
  });
  const connecting = client.connect();
  socket.fromServer(
    "connect_error",
    Object.assign(new Error("expired"), { data: { code: "UNAUTHORIZED" } }),
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(refreshes, 1);
  assert.equal(socket.connectCalls, 2);
  socket.connected = true;
  socket.fromServer("connect");
  socket.fromServer("connection_ack", { channel_id: 7 });
  await connecting;
  client.disconnect();
});
