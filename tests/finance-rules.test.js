const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function finance() {
  const context = { window: {}, Intl, Date, Set, Map };
  context.window.Lorah = {};
  context.Lorah = context.window.Lorah;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../src/client/js/analytics/finance-engine.js"), "utf8"), context);
  return context.Lorah.Finance;
}

function events() {
  const context = { window: {}, Map };
  context.window.Lorah = {};
  context.Lorah = context.window.Lorah;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../src/client/js/analytics/event-engine.js"), "utf8"), context);
  return context.Lorah.Events;
}

test("DRE exclui MOVIMENTAÇÃO e receita de Eventos (V) sem filtro", () => {
  const engine = finance();
  const metrics = engine.metrics([
    { section: "revenue", value: 100 },
    { section: "movement", value: 900 },
    { section: "eventRevenue", value: 500 }
  ]);
  assert.equal(metrics.revenue, 100);
  assert.equal(metrics.result, 100);
  assert.equal(metrics.count, 1);
});

test("Visão Geral e DRE ignoram completamente registros das abas de eventos", () => {
  const engine = finance();
  const filtered = engine.filtered([
    { event: "Evento Fictício", section: "eventRevenue", value: 500, date: "2026-01-01", party: "", history: "", description: "" },
    { event: "Evento Fictício", section: "eventExpense", value: -200, date: "2026-01-02", party: "", history: "", description: "" },
    { section: "revenue", value: 700, date: "2026-01-01", party: "", history: "", description: "" },
    { section: "direct", value: -100, date: "2026-01-02", party: "", history: "", description: "" }
  ], { event: "Evento Fictício" });
  const metrics = engine.metrics(filtered);
  assert.equal(metrics.revenue, 700);
  assert.equal(metrics.expenses, -100);
  assert.equal(metrics.result, 600);
});

test("página Eventos considera somente Todos ou um evento individual", () => {
  const engine = finance();
  const records = [
    { event: "Evento A", section: "eventRevenue" },
    { event: "Evento A", section: "eventExpense" },
    { event: "Evento B", section: "eventRevenue" },
    { event: null, section: "revenue" }
  ];
  assert.equal(engine.filteredEvents(records).length, 3);
  assert.equal(engine.filteredEvents(records, "Evento A").length, 2);
});

test("consolidado de Eventos soma somente Eventos (V) e Eventos (D)", () => {
  const engine = events();
  const summary = engine.summarize([
    { event: "Evento A", section: "eventRevenue", value: 1000 },
    { event: "Evento A", section: "eventExpense", value: -250 },
    { event: "Evento B", section: "eventRevenue", value: 500 },
    { event: "Evento A", section: "direct", value: -999 }
  ]);
  assert.equal(summary.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(engine.totals(summary))), {
    events: 2, revenue: 1500, expenses: -250, result: 1250
  });
});
