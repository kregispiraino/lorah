const XLSX = require("xlsx");
const schema = require("../config/data-schema");
const { normalize } = require("./normalizer");

const knownFinancialSheets = Object.values(schema.sheets)
  .filter((sheet) => sheet !== schema.sheets.nature)
  .flatMap((sheet) => sheet.names);

class ExcelParser {
  parseFile(filePath, originalName) {
    let workbook;
    try {
      workbook = XLSX.readFile(filePath, { cellDates: true });
    } catch (_error) {
      const error = new Error("Não foi possível ler a planilha. Verifique se o arquivo é um Excel válido.");
      error.status = 422;
      throw error;
    }
    const hasNatureSheet = schema.sheets.nature.names.some((name) => workbook.SheetNames.includes(name));
    const hasFinancialSheet = knownFinancialSheets.some((name) => workbook.SheetNames.includes(name));
    if (!hasNatureSheet || !hasFinancialSheet) {
      const error = new Error("A planilha não possui as abas mínimas esperadas (# e ao menos uma aba financeira).");
      error.status = 422;
      throw error;
    }
    const sheets = {};
    for (const name of workbook.SheetNames) {
      if (schema.ignoredSheets.includes(name)) continue;
      // Numeric cells must stay numeric. Formatted text such as "128,726.25"
      // is locale-dependent and can otherwise be interpreted as 128.72625.
      sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: null, raw: true });
    }
    const dataset = normalize({ fileName: originalName, sheets });
    if (!dataset.records.length) {
      const error = new Error("Nenhum lançamento financeiro válido foi encontrado na planilha.");
      error.status = 422;
      throw error;
    }
    return dataset;
  }
}

module.exports = { ExcelParser };
