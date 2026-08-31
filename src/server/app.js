const path = require("node:path");
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const { createPool } = require("./database/pool");
const { MySqlSessionStore } = require("./auth/mysql-session-store");
const { UserRepository } = require("./repositories/user-repository");
const { DatasetRepository } = require("./repositories/dataset-repository");
const { AuthService } = require("./services/auth-service");
const { DatasetService } = require("./services/dataset-service");
const { ExcelParser } = require("./services/excel-parser");
const { FileStorage } = require("./storage/file-storage");
const { createAuthController } = require("./controllers/auth-controller");
const { createDatasetController } = require("./controllers/dataset-controller");
const { createAuthRoutes } = require("./routes/auth-routes");
const { createDatasetRoutes } = require("./routes/dataset-routes");
const { createUpload } = require("./middleware/upload");
const { requireAuth } = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/error-handler");

async function createApp(config, overrides = {}) {
  const app = express();
  const clientPath = path.resolve(__dirname, "../client");
  const pool = overrides.pool || createPool(config.databaseUrl);
  const storage = overrides.storage || new FileStorage(config.storagePath);
  await storage.initialize();
  const userRepository = overrides.userRepository || new UserRepository(pool);
  const datasetRepository = overrides.datasetRepository || new DatasetRepository(pool);
  const authService = overrides.authService || new AuthService(userRepository);
  const datasetService = overrides.datasetService || new DatasetService({ datasetRepository, storage, parser: new ExcelParser() });
  const sessionStore = overrides.sessionStore || new MySqlSessionStore(pool);

  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);
  app.use(helmet({
    contentSecurityPolicy: { directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"], connectSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"]
    } },
    crossOriginResourcePolicy: { policy: "same-origin" }
  }));
  app.use(express.json({ limit: "32kb" }));
  app.use(session({
    name: "lorah.sid",
    secret: config.sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { httpOnly: true, secure: config.isProduction, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 }
  }));

  app.get("/health", async (_req, res) => {
    try {
      if (pool?.query) await pool.query("SELECT 1");
      res.json({ status: "ok" });
    } catch (_error) { res.status(503).json({ status: "unavailable" }); }
  });

  app.use("/assets", express.static(path.join(clientPath, "assets"), { immutable: true, maxAge: "1d" }));
  app.get("/login.css", (_req, res) => res.sendFile(path.join(clientPath, "login.css")));
  app.get("/js/login.js", (_req, res) => res.sendFile(path.join(clientPath, "js/login.js")));
  app.get("/login", (req, res) => req.session?.user ? res.redirect("/") : res.sendFile(path.join(clientPath, "login.html")));

  app.use("/api/auth", createAuthRoutes(createAuthController(authService)));
  const upload = createUpload({ destination: storage.uploadsPath, maxUploadBytes: config.maxUploadBytes });
  app.use("/api/datasets", createDatasetRoutes(createDatasetController(datasetService), upload));

  app.use(requireAuth);
  app.use(express.static(clientPath, { index: false, etag: true }));
  app.get("/", (_req, res) => res.sendFile(path.join(clientPath, "index.html")));
  app.get("/{*path}", (req, res, next) => req.accepts("html") ? res.sendFile(path.join(clientPath, "index.html")) : next());

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
