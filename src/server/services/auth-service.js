const bcrypt = require("bcryptjs");

class AuthService {
  constructor(userRepository) { this.users = userRepository; }

  async authenticate(email, password) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = await this.users.findByEmail(normalizedEmail);
    if (!user || !user.is_active) return null;
    const valid = await bcrypt.compare(String(password || ""), user.password_hash);
    if (!valid) return null;
    return { id: user.id, email: user.email, role: user.role };
  }
}

module.exports = { AuthService };
