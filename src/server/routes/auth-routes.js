const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth } = require("../middleware/auth");

function createAuthRoutes(controller) {
  const router = express.Router();
  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false,
    message: { error: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." } });
  router.post("/login", loginLimiter, controller.login);
  router.get("/me", requireAuth, controller.me);
  router.post("/logout", requireAuth, controller.logout);
  return router;
}

module.exports = { createAuthRoutes };
