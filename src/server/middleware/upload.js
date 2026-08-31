const path = require("node:path");
const crypto = require("node:crypto");
const multer = require("multer");

const allowedExtensions = new Set([".xlsx", ".xls"]);
const allowedMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/octet-stream"
]);

function createUpload({ destination, maxUploadBytes }) {
  return multer({
    storage: multer.diskStorage({
      destination,
      filename: (_req, _file, callback) => callback(null, `${crypto.randomUUID()}.upload`)
    }),
    limits: { fileSize: maxUploadBytes, files: 1, fields: 0 },
    fileFilter: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
        const error = new Error("Somente arquivos Excel .xlsx ou .xls são permitidos.");
        error.status = 415;
        return callback(error);
      }
      callback(null, true);
    }
  });
}

module.exports = { createUpload };
