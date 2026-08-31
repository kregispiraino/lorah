class UserRepository {
  constructor(pool) { this.pool = pool; }

  async findByEmail(email) {
    const [rows] = await this.pool.execute(
      "SELECT id, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    return rows[0] || null;
  }

  async findPublicById(id) {
    const [rows] = await this.pool.execute(
      "SELECT id, email, role, created_at, updated_at FROM users WHERE id = ? AND is_active = 1 LIMIT 1",
      [id]
    );
    return rows[0] || null;
  }

  async upsertInitial({ email, passwordHash }) {
    await this.pool.execute(
      `INSERT INTO users (email, password_hash, role, is_active)
       VALUES (?, ?, 'admin', 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin', is_active = 1`,
      [email, passwordHash]
    );
  }
}

module.exports = { UserRepository };
