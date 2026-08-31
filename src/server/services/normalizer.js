const schema = require("../config/data-schema");

const norm = (value) => String(value ?? "").trim();
const keyMap = (row) => Object.fromEntries(Object.keys(row).map((key) => [norm(key).toLowerCase(), key]));

function pick(row, aliases = []) {
  const map = keyMap(row);
  for (const alias of aliases) {
    const key = map[norm(alias).toLowerCase()];
    if (key !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  return null;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "" || value === "-") return null;
  if (typeof value === "number") return value;
  let string = String(value).replace(/R\$/g, "").trim().replace(/\s/g, "");
  if (string.includes(",")) string = string.replace(/\./g, "").replace(",", ".");
  const parsed = Number(string);
  return Number.isFinite(parsed) ? parsed : null;
}

function isoDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  const string = String(value).trim();
  const brazilian = string.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brazilian) return `${brazilian[3]}-${brazilian[2].padStart(2, "0")}-${brazilian[1].padStart(2, "0")}`;
  const iso = string.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const date = new Date(string);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString().slice(0, 10);
}

function findSheet(sheets, names) { return names.map((name) => sheets[name]).find(Boolean) || null; }

function buildNatureMap(rows) {
  const map = {}, order = [];
  let section = null;
  for (const row of rows || []) {
    const raw = pick(row, ["Naturezas"]);
    if (!raw) continue;
    const value = String(raw);
    if (value.includes("RECEITA")) section = "revenue";
    else if (value.includes("MOVIMENT")) section = "movement";
    else if (value.includes("CUSTO DIRETO")) section = "direct";
    else if (value.includes("CUSTO INDIRETO")) section = "indirect";
    else { map[value] = section || "unclassified"; order.push(value); }
  }
  return { map, order };
}

function normalize(parsed, generatedAt = new Date().toISOString()) {
  const sheets = parsed.sheets;
  const nature = buildNatureMap(findSheet(sheets, schema.sheets.nature.names) || []);
  const movementFallback = new Set(schema.defaults.movementNatures);
  const records = [];

  function addLedger(schemaKey, sourceName) {
    const spec = schema.sheets[schemaKey];
    (findSheet(sheets, spec.names) || []).forEach((row, index) => {
      const value = parseNumber(pick(row, spec.columns.value));
      const date = isoDate(pick(row, spec.columns.date));
      let natureName = norm(pick(row, spec.columns.nature));
      if (value === null || !date) return;
      let section;
      if (!natureName) {
        natureName = value >= 0 ? "Receita sem natureza" : "Despesa sem natureza";
        section = value >= 0 ? "revenue" : "indirect";
      } else {
        section = nature.map[natureName] || (movementFallback.has(natureName) ? "movement" : "unclassified");
      }
      records.push({ id: `${sourceName}-${index + 2}`, date, emissionDate: isoDate(pick(row, spec.columns.emission)), source: sourceName,
        account: spec.account, party: norm(pick(row, spec.columns.party)), history: norm(pick(row, spec.columns.history)),
        description: norm(pick(row, spec.columns.description)), nature: natureName, section, value,
        event: norm(pick(row, spec.columns.event)) || null, kind: "ledger" });
    });
  }

  addLedger("itau", "Itaú");
  addLedger("card", "Cartão");
  addLedger("cash", "Caixa (PF)");

  const redeSales = schema.sheets.redeSales;
  (findSheet(sheets, redeSales.names) || []).forEach((row, index) => {
    if (norm(pick(row, redeSales.columns.status)).toLowerCase() !== "aprovada") return;
    const date = isoDate(pick(row, redeSales.columns.date));
    const gross = parseNumber(pick(row, redeSales.columns.gross));
    if (!date || gross === null) return;
    const event = norm(pick(row, redeSales.columns.event)) || null;
    records.push({ id: `RedeV-${index + 2}`, date, emissionDate: date, source: "Rede (V)", account: "Rede", party: "Cliente Rede",
      history: [pick(row, redeSales.columns.modality), pick(row, redeSales.columns.brand)].filter(Boolean).join(" • "),
      description: "Venda Rede", nature: "Receita de vendas", section: "revenue", value: gross, event, kind: "sale",
      netValue: parseNumber(pick(row, redeSales.columns.net)), mdr: parseNumber(pick(row, redeSales.columns.mdr)), machine: pick(row, redeSales.columns.machine) });
    const mdr = parseNumber(pick(row, redeSales.columns.mdr));
    if (mdr && mdr > 0) records.push({ id: `RedeV-MDR-${index + 2}`, date, source: "Rede (V)", account: "Rede", party: "Rede",
      history: "MDR sobre venda", description: "Taxa MDR", nature: "Tarifas bancárias", section: nature.map["Tarifas bancárias"] || "indirect",
      value: -Math.abs(mdr), event, kind: "fee" });
  });

  const receipts = schema.sheets.redeReceipts;
  (findSheet(sheets, receipts.names) || []).forEach((row, index) => {
    const date = isoDate(pick(row, receipts.columns.date));
    const value = parseNumber(pick(row, receipts.columns.value));
    if (!date || value === null) return;
    records.push({ id: `RedeR-${index + 2}`, date, source: "Rede (R)", account: "Rede", party: "Rede", history: "Recebimento de venda via Rede",
      description: "Liquidação Rede", nature: "Transferência entre contas", section: "movement", value,
      event: norm(pick(row, receipts.columns.event)) || null, kind: "settlement" });
  });

  const eventSales = schema.sheets.eventSales;
  (findSheet(sheets, eventSales.names) || []).forEach((row, index) => {
    const date = isoDate(pick(row, eventSales.columns.date));
    const value = parseNumber(pick(row, eventSales.columns.value));
    const event = norm(pick(row, eventSales.columns.event));
    if (!date || value === null || !event) return;
    records.push({ id: `EventosV-${index + 2}`, date, emissionDate: date, source: "Eventos (V)", account: "Eventos",
      party: norm(pick(row, eventSales.columns.party)) || "Evento", history: norm(pick(row, eventSales.columns.history)) || `Receita do evento ${event}`,
      description: "Receita por evento", nature: "Receita de eventos", section: "eventRevenue", value, event, kind: "event-sale" });
  });

  const pagarme = schema.sheets.pagarme;
  (findSheet(sheets, pagarme.names) || []).forEach((row, index) => {
    const date = isoDate(pick(row, pagarme.columns.date));
    const value = parseNumber(pick(row, pagarme.columns.value));
    if (!date || value === null) return;
    records.push({ id: `Pagarme-${index + 2}`, date, source: "Pagarme", account: "Pagarme", party: norm(pick(row, pagarme.columns.party)) || "Pagarme",
      history: norm(pick(row, pagarme.columns.history)) || "Receita Pagarme", description: "", nature: "Receita de vendas", section: "revenue", value,
      event: norm(pick(row, pagarme.columns.event)) || null, kind: "sale" });
  });

  records.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return { version: 1, generatedAt, sourceFile: parsed.fileName, ignoredSheets: schema.ignoredSheets,
    natureSections: nature.map, natureOrder: nature.order, records };
}

module.exports = { normalize, parseNumber, isoDate };
