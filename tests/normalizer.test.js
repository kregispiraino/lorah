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
      "Eventos (V)": [{ Pedido: 123, "Data do pedido": "10/01/2026", "Nome do evento": "Evento Fictício", Total: "R$ 2.100,00", Desconto: "R$ 100,00", "Valor final": "R$ 2.000,00" }],
      "Eventos (D)": [{ Evento: "Fictício", Liquidação: "11/01/2026", "Fornecedor/Cliente": "Fornecedor", Histórico: "Montagem", Valor: "500,00", "Origem/Meio": "Itaú PJ - PIX" }],
      "Eventos (V)X": [{ Data: "10/01/2026", Evento: "Modelo antigo", "Total geral": "999999" }]
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
  assert.equal(dataset.records.some((record) => record.event === "Modelo antigo"), false);
  const revenue = dataset.records.find((record) => record.source === "Eventos (V)");
  const expense = dataset.records.find((record) => record.source === "Eventos (D)");
  assert.deepEqual({ section: revenue.section, value: revenue.value, order: revenue.order }, { section: "eventRevenue", value: 2000, order: "123" });
  assert.deepEqual({ section: expense.section, value: expense.value, origin: expense.origin }, { section: "eventExpense", value: -500, origin: "Itaú PJ - PIX" });
  assert.equal(expense.event, "Evento Fictício");
  assert.equal(dataset.records.filter((record) => record.event).length, 2);
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
  const itau = XLSX.utils.json_to_sheet([
    { Liquidação: "01/01/2026", Natureza: "Receita de vendas", Valor: 10 },
    { Liquidação: "02/01/2026", Natureza: null, Valor: 128726.25 }
  ]);
  itau.C3.z = "#,##0.00;[Red]-#,##0.00";
  XLSX.utils.book_append_sheet(workbook, itau, "Itaú");
  XLSX.writeFile(workbook, validPath);
  const invalid = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(invalid, XLSX.utils.json_to_sheet([{ Teste: 1 }]), "Outra");
  XLSX.writeFile(invalid, invalidPath);
  const result = new ExcelParser().parseFile(validPath, "ficticio.xlsx");
  assert.equal(result.records.length, 2);
  assert.equal(result.records.find((record) => record.nature === "Receita sem natureza").value, 128726.25);
  assert.throws(() => new ExcelParser().parseFile(invalidPath, "invalido.xlsx"), /abas mínimas/);
});
