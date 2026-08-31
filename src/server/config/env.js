const path = require("node:path");
require("dotenv").config({ quiet: true });

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function loadEnv(overrides = {}) {
  const env = { ...process.env, ...overrides };
  const isProduction = env.NODE_ENV === "production";
  const sessionSecret = env.SESSION_SECRET || (isProduction ? "" : "development-only-change-this-secret-32-chars");

  if (isProduction && sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET deve ter pelo menos 32 caracteres em produção.");
  }

  return {
    nodeEnv: env.NODE_ENV || "development",
    isProduction,
    port: positiveNumber(env.PORT, 3000),
    databaseUrl: env.DATABASE_URL || "",
    sessionSecret,
    storagePath: path.resolve(env.DATA_STORAGE_PATH || "./storage"),
    trustProxy: positiveNumber(env.TRUST_PROXY, 1),
    maxUploadBytes: positiveNumber(env.MAX_UPLOAD_MB, 25) * 1024 * 1024,
    initialAdminEmail: (env.INITIAL_ADMIN_EMAIL || "financeiro@plexholding.com.br").trim().toLowerCase(),
    initialAdminPassword: env.INITIAL_ADMIN_PASSWORD || ""
  };
}

module.exports = { loadEnv };
