const mysql = require("mysql2/promise");

function createPool(databaseUrl) {
  if (!databaseUrl) throw new Error("DATABASE_URL não foi configurada.");
  return mysql.createPool({
    uri: databaseUrl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    timezone: "Z"
  });
}

module.exports = { createPool };
