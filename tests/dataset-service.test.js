const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs/promises");
const XLSX = require("xlsx");
const { DatasetService } = require("../src/server/services/dataset-service");
const { ExcelParser } = require("../src/server/services/excel-parser");
const { FileStorage } = require("../src/server/storage/file-storage");

test("base ativa antiga é renormalizada automaticamente a partir do Excel armazenado", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "lorah-dataset-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const storage = new FileStorage(directory);
  await storage.initialize();
  const storedFileName = "base.xlsx", jsonFileName = "base.json";
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
    { Naturezas: "***___RECEITA___***" }, { Naturezas: "Receita de vendas" }
  ]), "#");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
    { Liquidação: "01/01/2026", Natureza: "Receita de vendas", Valor: 100 }
  ]), "Itaú");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
    { Pedido: 1, "Data do pedido": "02/01/2026", "Nome do evento": "FESTA TESTE", "Valor final": 500 }
  ]), "Eventos (V)");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
    { Evento: "TESTE", Liquidação: "03/01/2026", Valor: -125 }
  ]), "Eventos (D)");
  XLSX.writeFile(workbook, storage.resolveStored(storedFileName));
  await fs.writeFile(storage.resolveStored(jsonFileName), JSON.stringify({ version: 1, records: [] }));
  let updated = null;
  const repository = {
    findActive: async () => ({ id: "dataset-1", originalFileName: "base.xlsx", storedFileName, jsonFileName, recordCount: 0 }),
    updateRecordCount: async (id, count) => { updated = { id, count }; }
  };
  const service = new DatasetService({ datasetRepository: repository, storage, parser: new ExcelParser() });
  const result = await service.getActive();
  assert.equal(result.dataset.version, 2);
  assert.equal(result.dataset.records.find((record) => record.section === "eventExpense").value, -125);
  assert.deepEqual(updated, { id: "dataset-1", count: 3 });
  assert.equal((await storage.readDataset(jsonFileName)).version, 2);
});
