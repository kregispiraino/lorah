function requireAuth(req, res, next) {
  if (req.session?.user?.id) return next();
  if (req.path.startsWith("/api/") || req.originalUrl.startsWith("/api/")) {
    return res.status(401).json({ error: "Autenticação necessária." });
  }
  return res.redirect("/login");
}

function requireAdmin(req, res, next) {
  if (req.session?.user?.role === "admin") return next();
  return res.status(403).json({ error: "Você não tem permissão para realizar esta ação." });
}

module.exports = { requireAuth, requireAdmin };
