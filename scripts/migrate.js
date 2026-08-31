const fs = require("node:fs/promises");
const path = require("node:path");
const mysql = require("mysql2/promise");
const { loadEnv } = require("../src/server/config/env");

async function migrate() {
  const config = loadEnv();
  if (!config.databaseUrl) throw new Error("DATABASE_URL não foi configurada.");
  const connection = await mysql.createConnection({ uri: config.databaseUrl, multipleStatements: true, timezone: "Z" });
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(191) NOT NULL PRIMARY KEY,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    const directory = path.resolve(__dirname, "../migrations");
    const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
    for (const file of files) {
      const [rows] = await connection.execute("SELECT name FROM schema_migrations WHERE name = ?", [file]);
      if (rows.length) continue;
      const sql = await fs.readFile(path.join(directory, file), "utf8");
      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.execute("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
        await connection.commit();
        console.log(`Migration aplicada: ${file}`);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
  } finally { await connection.end(); }
}

migrate().catch((error) => { console.error(error.message); process.exit(1); });
