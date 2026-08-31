const bcrypt = require("bcryptjs");
const { loadEnv } = require("../src/server/config/env");
const { createPool } = require("../src/server/database/pool");
const { UserRepository } = require("../src/server/repositories/user-repository");

async function seed() {
  const config = loadEnv();
  if (!config.initialAdminPassword || config.initialAdminPassword.length < 6) {
    throw new Error("Defina INITIAL_ADMIN_PASSWORD com pelo menos 6 caracteres antes de executar o seed.");
  }
  const pool = createPool(config.databaseUrl);
  try {
    const passwordHash = await bcrypt.hash(config.initialAdminPassword, 12);
    await new UserRepository(pool).upsertInitial({ email: config.initialAdminEmail, passwordHash });
    console.log(`Usuário administrador preparado: ${config.initialAdminEmail}`);
  } finally { await pool.end(); }
}

seed().catch((error) => { console.error(error.message); process.exit(1); });
