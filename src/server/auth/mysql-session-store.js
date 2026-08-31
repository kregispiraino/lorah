const session = require("express-session");

class MySqlSessionStore extends session.Store {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async get(sid, callback) {
    try {
      const [rows] = await this.pool.execute(
        "SELECT data FROM sessions WHERE sid = ? AND expires_at > UTC_TIMESTAMP(3) LIMIT 1",
        [sid]
      );
      if (!rows[0]) return callback(null, null);
      const value = typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
      callback(null, value);
    } catch (error) { callback(error); }
  }

  async set(sid, value, callback = () => {}) {
    try {
      const expires = value.cookie?.expires
        ? new Date(value.cookie.expires)
        : new Date(Date.now() + (value.cookie?.maxAge || 8 * 60 * 60 * 1000));
      await this.pool.execute(
        `INSERT INTO sessions (sid, data, expires_at) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE data = VALUES(data), expires_at = VALUES(expires_at)`,
        [sid, JSON.stringify(value), expires]
      );
      callback(null);
    } catch (error) { callback(error); }
  }

  async destroy(sid, callback = () => {}) {
    try {
      await this.pool.execute("DELETE FROM sessions WHERE sid = ?", [sid]);
      callback(null);
    } catch (error) { callback(error); }
  }

  touch(sid, value, callback = () => {}) { this.set(sid, value, callback); }
}

module.exports = { MySqlSessionStore };
