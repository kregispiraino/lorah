function notFound(req, res) {
  if (req.originalUrl.startsWith("/api/")) return res.status(404).json({ error: "Rota não encontrada." });
  return res.status(404).send("Página não encontrada.");
}

function errorHandler(error, req, res, _next) {
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "O arquivo excede o limite permitido." });
  }
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ error: status >= 500 ? "Ocorreu um erro interno. Tente novamente." : error.message });
}

module.exports = { notFound, errorHandler };
