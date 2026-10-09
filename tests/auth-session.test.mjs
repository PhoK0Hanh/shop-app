// Kiểm tra ranh giới xác thực bằng Admin SDK giả, không tạo tài khoản hoặc gọi Firebase thật.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const loadDependency = createRequire(import.meta.url);
const { NextRequest } = loadDependency("next/server");

function load(file, mocks) {
  const source = fs.readFileSync(path.join(import.meta.dirname, "..", file), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleStub = { exports: {} };
  new Function("require", "module", "exports", js)(
    (name) => name in mocks ? mocks[name] : loadDependency(name), moduleStub, moduleStub.exports,
  );
  return moduleStub.exports;
}

function setup({ claims, error, cookie, sessionError, profileError, missingProfile = false, role = "customer" } = {}) {
  const calls = [];
  class FirebaseAdminConfigError extends Error {}
  class UserProfileError extends Error {
    constructor(code, status, message) { super(message); this.code = code; this.status = status; }
  }
  const users = {
    UserProfileError,
    syncFirebaseUser: async () => {
      calls.push(["profile"]);
      if (profileError) throw new UserProfileError(profileError, profileError === "USER_DISABLED" ? 403 : 409, "Profile rejected");
      return { id: "database-user", role };
    },
    getUserByFirebaseUid: async (uid) => missingProfile ? null : ({ id: "database-user", uid, name: "Test", email: "test@example.com", role: "customer" }),
  };
  const sdk = {
    async verifyIdToken(token, revoked) {
      calls.push(["verify", token, revoked]);
      if (error) throw error;
      return claims ?? { uid: "test-user", auth_time: Math.floor(Date.now() / 1000) };
    },
    async createSessionCookie(token, options) {
      calls.push(["create", token, options]);
      return "signed-test-session";
    },
    async verifySessionCookie(token, revoked) {
      calls.push(["session", token, revoked]);
      if (sessionError) throw sessionError;
      return { uid: "test-user", email: "test@example.com", email_verified: true };
    },
  };
  const admin = { FirebaseAdminConfigError, getAdminAuth: () => sdk };
  const session = load("lib/firebase/session.ts", {
    "server-only": {},
    "next/headers": { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined }) },
    "@/lib/firebase/admin": admin,
    "@/lib/users": users,
  });
  const route = load("app/api/auth/session/route.ts", {
    "@/lib/firebase/admin": admin,
    "@/lib/firebase/session": session,
    "@/lib/users": users,
  });
  return { route, session, calls, FirebaseAdminConfigError };
}

function request({ origin = "http://localhost:3000", type = "application/json", body = '{"idToken":"test-token"}', method = "POST" } = {}) {
  return new NextRequest("http://localhost:3000/api/auth/session", {
    method, headers: { origin, "content-type": type }, ...(method === "POST" ? { body } : {}),
  });
}

test("POST verifies token and recent login before setting an HttpOnly cookie", async () => {
  const { route, calls } = setup();
  const response = await route.POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual(calls[0], ["verify", "test-token", true]);
  assert.deepEqual(calls[1], ["profile"]);
  assert.deepEqual(calls[2], ["create", "test-token", { expiresIn: 432000000 }]);
  const cookie = response.cookies.get("shop_session");
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.sameSite, "lax");
  assert.equal(cookie.path, "/");
  assert.equal(cookie.maxAge, 432000);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { success: true, role: "customer" });
});

test("POST rejects cross origin and invalid bodies before calling Firebase", async () => {
  for (const [options, expected] of [
    [{ origin: "https://evil.example" }, 403],
    [{ origin: "" }, 403],
    [{ type: "text/plain" }, 415],
    [{ body: "{" }, 400],
    [{ body: "null" }, 400],
    [{ body: '{"idToken":1}' }, 400],
    [{ body: "a".repeat(16385) }, 413],
  ]) {
    const { route, calls } = setup();
    const response = await route.POST(request(options));
    assert.equal(response.status, expected);
    assert.equal(response.cookies.get("shop_session"), undefined);
    assert.equal(calls.length, 0);
  }
});

test("POST rejects stale, revoked and future-dated tokens without creating cookies", async () => {
  const now = Math.floor(Date.now() / 1000);
  for (const options of [
    { claims: { auth_time: now - 301 } },
    { claims: { auth_time: now + 60 } },
    { claims: {} },
    { error: { code: "auth/id-token-revoked" } },
  ]) {
    const { route, calls } = setup(options);
    const response = await route.POST(request());
    assert.equal(response.status, 401);
    assert.equal(calls.length, 1);
    assert.equal(response.cookies.get("shop_session"), undefined);
  }
});

test("GET requires a valid cookie and checks revoked sessions", async () => {
  assert.equal((await setup().route.GET()).status, 401);
  const { route, calls } = setup({ cookie: "signed-test-session" });
  const response = await route.GET();
  assert.equal(response.status, 200);
  assert.deepEqual(calls[0], ["session", "signed-test-session", true]);
  assert.equal((await response.json()).user.uid, "test-user");
  assert.equal((await setup({ cookie: "bad", sessionError: { code: "auth/session-cookie-revoked" } }).route.GET()).status, 401);
});

test("GET distinguishes infrastructure errors from an anonymous session", async () => {
  const { route } = setup({ cookie: "signed-test-session", sessionError: new Error("private server detail") });
  const response = await route.GET();
  assert.equal(response.status, 500);
  assert.ok(!(await response.text()).includes("private server detail"));
});

test("POST refuses disabled or conflicting profiles without setting cookies", async () => {
  for (const [profileError, status] of [["USER_DISABLED", 403], ["EMAIL_CONFLICT", 409]]) {
    const { route, calls } = setup({ profileError });
    const response = await route.POST(request());
    assert.equal(response.status, status);
    assert.equal(response.cookies.get("shop_session"), undefined);
    assert.equal(calls.some(call => call[0] === "create"), false);
  }
});

test("GET rejects a valid Firebase cookie when the database profile is missing or disabled", async () => {
  const response = await setup({ cookie: "signed-test-session", missingProfile: true }).route.GET();
  assert.equal(response.status, 401);
});

test("DELETE enforces same origin and expires the cookie without calling Firebase", async () => {
  const { route, calls } = setup();
  assert.equal((await route.DELETE(request({ method: "DELETE", origin: "https://evil.example" }))).status, 403);
  const response = await route.DELETE(request({ method: "DELETE" }));
  assert.equal(response.status, 200);
  assert.equal(response.cookies.get("shop_session").maxAge, 0);
  assert.equal(calls.length, 0);
});

// Mock Axios để kiểm tra client không gửi mật khẩu và không coi HTTP lỗi là thành công.
test("Axios client refreshes token and submits JSON to session API", async () => {
  const events = [];
  const client = load("lib/firebase/session-client.ts", {"@/lib/api": {api: {request: async (config) => {
    events.push("request");
    assert.equal(config.url, "/auth/session");
    assert.equal(config.method, "POST");
    assert.deepEqual(config.data, {idToken: "fresh-token"});
    assert.equal(config.validateStatus(503), true);
    return {status: 200, data: {success: true, role: "customer"}};
  }}}});
  const role = await client.createServerSession({getIdToken: async (force) => {
    assert.equal(force, true); events.push("token"); return "fresh-token";
  }});
  assert.deepEqual(events, ["token", "request"]);
  assert.equal(role, "customer");
});

// Quyền dùng để điều hướng phải đến từ hồ sơ server đã xác thực.
test("session POST returns the database admin role and the client exposes it", async () => {
  const response = await setup({ role: "admin" }).route.POST(request());
  assert.equal((await response.json()).role, "admin");
  const client = load("lib/firebase/session-client.ts", { "@/lib/api": { api: { request: async () => ({ status: 200, data: { success: true, role: "admin" } }) } } });
  assert.equal(await client.createServerSession({ getIdToken: async () => "token" }), "admin");
});

test("Axios client rejects failed cookie creation and reports profile errors", async () => {
  let response = {status: 503, data: {error: "private server details"}};
  const client = load("lib/firebase/session-client.ts", {"@/lib/api": {api: {request: async () => response}}});
  await assert.rejects(client.createServerSession({getIdToken: async () => "token"}), (error) => {
    assert.ok(error instanceof client.SessionRequestError);
    assert.ok(!error.message.includes("private server details"));
    return true;
  });
  response = {status: 403, data: {code: "USER_DISABLED"}};
  await assert.rejects(client.createServerSession({getIdToken: async () => "token"}), client.SessionRequestError);
});

test("Axios client deletes the backend session and propagates network failure", async () => {
  let fail = false;
  const client = load("lib/firebase/session-client.ts", {"@/lib/api": {api: {request: async (config) => {
    assert.equal(config.method, "DELETE"); assert.equal(config.data, undefined);
    if (fail) throw new TypeError("network failure");
    return {status: 200, data: {success: true}};
  }}}});
  await client.clearServerSession();
  fail = true;
  await assert.rejects(client.clearServerSession(), client.SessionRequestError);
});
