const fs = require("node:fs/promises");

function createDatasetController(datasetService) {
  return {
    async active(_req, res, next) {
      try { res.json(await datasetService.getActive()); } catch (error) { next(error); }
    },
    async upload(req, res, next) {
      if (!req.file) return res.status(400).json({ error: "Selecione um arquivo .xlsx ou .xls." });
      try {
        const result = await datasetService.import({ file: req.file, userId: req.session.user.id });
        res.status(201).json(result);
      } catch (error) { next(error); }
      finally { await fs.unlink(req.file.path).catch(() => {}); }
    }
  };
}

module.exports = { createDatasetController };
