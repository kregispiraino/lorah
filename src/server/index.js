const { loadEnv } = require("./config/env");
const { createApp } = require("./app");

async function start() {
  const config = loadEnv();
  const app = await createApp(config);
  app.listen(config.port, "0.0.0.0", () => {
    console.log(`Lorah disponível em http://0.0.0.0:${config.port}`);
  });
}

start().catch((error) => {
  console.error("Falha ao iniciar a aplicação:", error.message);
  process.exit(1);
});
