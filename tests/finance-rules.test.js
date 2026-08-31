const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function finance() {
  const context = { window: {}, Intl, Date, Set, Map };
  context.window.Lorah = { Filters: { get: () => ({ event: context.event || "" }) } };
  context.Lorah = context.window.Lorah;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../src/client/js/analytics/finance-engine.js"), "utf8"), context);
  return { engine: context.Lorah.Finance, selectEvent: (event) => { context.event = event; } };
}

test("DRE exclui MOVIMENTAÇÃO e receita de Eventos (V) sem filtro", () => {
  const { engine } = finance();
  const metrics = engine.metrics([
    { section: "revenue", value: 100 },
    { section: "movement", value: 900 },
    { section: "eventRevenue", value: 500 }
  ]);
  assert.equal(metrics.revenue, 100);
  assert.equal(metrics.result, 100);
  assert.equal(metrics.count, 1);
});

test("filtro de evento usa Eventos (V) como receita", () => {
  const { engine, selectEvent } = finance();
  selectEvent("Evento Fictício");
  const filtered = engine.filtered([
    { event: "Evento Fictício", section: "eventRevenue", value: 500, date: "2026-01-01", party: "", history: "", description: "" },
    { event: "Evento Fictício", section: "revenue", value: 700, date: "2026-01-01", party: "", history: "", description: "" },
    { event: "Evento Fictício", section: "direct", value: -200, date: "2026-01-02", party: "", history: "", description: "" },
    { event: "Outro", section: "eventRevenue", value: 900, date: "2026-01-01", party: "", history: "", description: "" }
  ], { event: "Evento Fictício" });
  const metrics = engine.metrics(filtered);
  assert.equal(metrics.revenue, 500);
  assert.equal(metrics.expenses, -200);
  assert.equal(metrics.result, 300);
});
