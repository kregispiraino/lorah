const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs/promises");
const session = require("express-session");
const request = require("supertest");
const { createApp } = require("../src/server/app");

async function testApp() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "lorah-test-"));
  const storage = { uploadsPath: directory, initialize: async () => {} };
  const pool = { query: async () => [[{ ok: 1 }]] };
  const authService = {
    authenticate: async (email, password) => email === "financeiro@plexholding.com.br" && password === "correct-password"
      ? { id: 1, email, role: "admin" } : null
  };
  const datasetService = { getActive: async () => ({ dataset: null, metadata: null }) };
  const config = { sessionSecret: "test-secret-that-is-at-least-32-characters", isProduction: false, trustProxy: 1, maxUploadBytes: 1024 * 1024 };
  const app = await createApp(config, { pool, storage, authService, datasetService, sessionStore: new session.MemoryStore() });
  return { app, directory };
}

test("login válido cria sessão persistente e libera o dashboard", async (t) => {
  const { app, directory } = await testApp();
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const agent = request.agent(app);
  const login = await agent.post("/api/auth/login").send({ email: "financeiro@plexholding.com.br", password: "correct-password" });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.email, "financeiro@plexholding.com.br");
  assert.match(login.headers["set-cookie"][0], /HttpOnly/);
  assert.match(login.headers["set-cookie"][0], /SameSite=Lax/);
  assert.equal((await agent.get("/")).status, 200);
});

test("login inválido usa mensagem genérica", async (t) => {
  const { app, directory } = await testApp();
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const response = await request(app).post("/api/auth/login").send({ email: "financeiro@plexholding.com.br", password: "wrong" });
  assert.equal(response.status, 401);
  assert.equal(response.body.error, "E-mail ou senha inválidos.");
});

test("dashboard e rota financeira exigem autenticação", async (t) => {
  const { app, directory } = await testApp();
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  assert.equal((await request(app).get("/")).status, 302);
  assert.equal((await request(app).get("/api/datasets/active")).status, 401);
});

test("importação sem autenticação é recusada antes do upload", async (t) => {
  const { app, directory } = await testApp();
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const response = await request(app).post("/api/datasets/import");
  assert.equal(response.status, 401);
});
