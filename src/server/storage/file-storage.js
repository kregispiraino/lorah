const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { promisify } = require("node:util");
const { gzip: gzipCallback, gunzip: gunzipCallback } = require("node:zlib");

const gzip = promisify(gzipCallback);
const gunzip = promisify(gunzipCallback);

class FileStorage {
  constructor(rootPath) {
    this.rootPath = path.resolve(rootPath);
    this.importsPath = path.join(this.rootPath, "imports");
    this.uploadsPath = path.join(this.rootPath, ".uploads");
  }

  async initialize() {
    await fs.mkdir(this.importsPath, { recursive: true });
    await fs.mkdir(this.uploadsPath, { recursive: true });
  }

  resolveStored(relativeName) {
    const resolved = path.resolve(this.importsPath, relativeName);
    if (!resolved.startsWith(`${this.importsPath}${path.sep}`)) throw new Error("Caminho de storage inválido.");
    return resolved;
  }

  async persist(tempPath, originalName, dataset) {
    await this.initialize();
    const id = crypto.randomUUID();
    const extension = path.extname(originalName).toLowerCase() === ".xls" ? ".xls" : ".xlsx";
    const storedFileName = `${id}${extension}`;
    const jsonFileName = `${id}.json.gz`;
    const excelTarget = this.resolveStored(storedFileName);
    const jsonTarget = this.resolveStored(jsonFileName);
    const excelPart = `${excelTarget}.part`;
    const jsonPart = `${jsonTarget}.part`;
    const content = await fs.readFile(tempPath);
    const json = await gzip(Buffer.from(JSON.stringify(dataset)));
    const sha256 = crypto.createHash("sha256").update(content).digest("hex");

    try {
      await fs.writeFile(excelPart, content, { flag: "wx", mode: 0o600 });
      await fs.writeFile(jsonPart, json, { flag: "wx", mode: 0o600 });
      await fs.rename(excelPart, excelTarget);
      await fs.rename(jsonPart, jsonTarget);
    } catch (error) {
      await Promise.allSettled([fs.unlink(excelPart), fs.unlink(jsonPart), fs.unlink(excelTarget), fs.unlink(jsonTarget)]);
      throw error;
    }
    return { id, originalFileName: originalName, storedFileName, jsonFileName, sha256, recordCount: dataset.records.length };
  }

  async readDataset(jsonFileName) {
    const content = await fs.readFile(this.resolveStored(jsonFileName));
    const json = jsonFileName.endsWith(".gz") ? await gunzip(content) : content;
    return JSON.parse(json.toString("utf8"));
  }

  async replaceDataset(jsonFileName, dataset) {
    const target = this.resolveStored(jsonFileName);
    const temporary = `${target}.${crypto.randomUUID()}.part`;
    try {
      const json = Buffer.from(JSON.stringify(dataset));
      await fs.writeFile(temporary, jsonFileName.endsWith(".gz") ? await gzip(json) : json, { flag: "wx", mode: 0o600 });
      await fs.rename(temporary, target);
    } catch (error) {
      await fs.unlink(temporary).catch(() => {});
      throw error;
    }
  }

  async remove(metadata) {
    await Promise.all([metadata.storedFileName, metadata.jsonFileName].map(async (name) => {
      try { await fs.unlink(this.resolveStored(name)); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
    }));
  }

}

module.exports = { FileStorage };
