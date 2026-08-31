const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");

function createDatasetRoutes(controller, upload) {
  const router = express.Router();
  router.use(requireAuth);
  router.get("/active", controller.active);
  router.post("/import", requireAdmin, upload.single("file"), controller.upload);
  return router;
}

module.exports = { createDatasetRoutes };
