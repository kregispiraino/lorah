const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs/promises");
const XLSX = require("xlsx");
const { normalize } = require("../src/server/services/normalizer");
const { ExcelParser } = require("../src/server/services/excel-parser");

function parsed(rows) {
  return {
    fileName: "base-ficticia.xlsx",
    sheets: {
      "#": [
        { Naturezas: "***___RECEITA___***" }, { Naturezas: "Receita de vendas" },
        { Naturezas: "***___MOVIMENTAÇÃO___***" }, { Naturezas: "Transferência entre contas" },
        { Naturezas: "***___CUSTO DIRETO___***" }, { Naturezas: "Insumos" },
        { Naturezas: "***___CUSTO INDIRETO___***" }, { Naturezas: "Aluguel" }
      ],
      "Itaú": rows,
      "Eventos (V)": [{ Data: "10/01/2026", Evento: "Evento Fictício", "Total geral": "R$ 2.000,00" }],
      "Eventos (D)": [{ Data: "10/01/2026", Evento: "Ignorado", Valor: "999999" }]
    }
  };
}

function normalizedRules() {
  return normalize(parsed([
    { Liquidação: "01/01/2026", Natureza: "Transferência entre contas", Valor: "500,00" },
    { Liquidação: "02/01/2026", Natureza: "", Valor: "150,00" },
    { Liquidação: "03/01/2026", Natureza: "", Valor: "-80,00" }
  ]), "2026-01-10T00:00:00.000Z");
}

test("normalizador classifica MOVIMENTAÇÃO para exclusão da DRE", () => {
  const dataset = normalizedRules();
  assert.equal(dataset.records.find((record) => record.id === "Itaú-2").section, "movement");
  assert.equal(dataset.records.some((record) => record.event === "Ignorado"), false);
  assert.equal(dataset.records.find((record) => record.source === "Eventos (V)").section, "eventRevenue");
});

test("lançamento positivo sem natureza vira Receita sem natureza", () => {
  const record = normalizedRules().records.find((item) => item.id === "Itaú-3");
  assert.deepEqual({ nature: record.nature, section: record.section }, { nature: "Receita sem natureza", section: "revenue" });
});

test("lançamento negativo sem natureza vira Despesa sem natureza indireta", () => {
  const record = normalizedRules().records.find((item) => item.id === "Itaú-4");
  assert.deepEqual({ nature: record.nature, section: record.section }, { nature: "Despesa sem natureza", section: "indirect" });
});

test("parser lê XLSX válido e rejeita estrutura sem abas mínimas", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "lorah-parser-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const validPath = path.join(directory, "valid.xlsx");
  const invalidPath = path.join(directory, "invalid.xlsx");
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(parsed([]).sheets["#"]), "#");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ Liquidação: "01/01/2026", Natureza: "Receita de vendas", Valor: "10,00" }]), "Itaú");
  XLSX.writeFile(workbook, validPath);
  const invalid = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(invalid, XLSX.utils.json_to_sheet([{ Teste: 1 }]), "Outra");
  XLSX.writeFile(invalid, invalidPath);
  assert.equal(new ExcelParser().parseFile(validPath, "ficticio.xlsx").records.length, 1);
  assert.throws(() => new ExcelParser().parseFile(invalidPath, "invalido.xlsx"), /abas mínimas/);
});
