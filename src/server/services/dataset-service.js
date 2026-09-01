const path = require("node:path");

class DatasetService {
  constructor({ datasetRepository, storage, parser }) {
    this.datasets = datasetRepository;
    this.storage = storage;
    this.parser = parser;
  }

  async getActive() {
    const metadata = await this.datasets.findActive();
    if (!metadata) return { dataset: null, metadata: null };
    let dataset = await this.storage.readDataset(metadata.jsonFileName);
    if (dataset.version !== 2) {
      dataset = this.parser.parseFile(this.storage.resolveStored(metadata.storedFileName), metadata.originalFileName);
      await this.storage.replaceDataset(metadata.jsonFileName, dataset);
      await this.datasets.updateRecordCount(metadata.id, dataset.records.length);
      metadata.recordCount = dataset.records.length;
    }
    return { dataset, metadata };
  }

  async import({ file, userId }) {
    const safeOriginalName = path.basename(file.originalname).slice(0, 255);
    const dataset = this.parser.parseFile(file.path, safeOriginalName);
    const stored = await this.storage.persist(file.path, safeOriginalName, dataset);
    try {
      const metadata = await this.datasets.activate({ ...stored, importedBy: userId });
      return { dataset, metadata };
    } catch (error) {
      await this.storage.remove(stored);
      throw error;
    }
  }
}

module.exports = { DatasetService };
