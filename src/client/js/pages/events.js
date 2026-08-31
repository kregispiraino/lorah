window.Lorah = window.Lorah || {}; Lorah.Pages=Lorah.Pages||{};
Lorah.Pages.events = {
  title:"Eventos",
  render(records){
    const U=Lorah.UI,events=Lorah.Events.summarize(records),totals=Lorah.Events.totals(events);
    const selected=Lorah.Filters.get().event;
    const expenseChart=events.map(e=>({key:e.name,value:Math.abs(e.expenses)})).filter(x=>x.value>0);
    const revenueChart=events.map(e=>({key:e.name,value:e.revenue})).filter(x=>x.value>0);
    const revenueRecords=records.filter(r=>r.section==="eventRevenue");
    const expenseRecords=records.filter(r=>r.section==="eventExpense");
    const scope=selected||"Todos os eventos";
    return `<div class="dashboard-stack">
      <div class="page-inline-title"><div><h1>Eventos</h1><p>Análise exclusiva das receitas de Eventos (V) e despesas de Eventos (D).</p></div></div>
      <div class="events-layout">
        <aside class="events-summary">
          <article class="card">
            ${U.sectionTitle("Faturamento por evento","Receitas informadas na aba Eventos (V)")}
            ${revenueChart.length?U.donut(revenueChart,"Faturamento"):`<div class="empty-chart"><span>Sem receitas de eventos</span></div>`}
          </article>
          <article class="card">
            ${U.sectionTitle("Despesas por evento","Despesas informadas na aba Eventos (D)")}
            ${expenseChart.length?U.donut(expenseChart,"Despesas"):`<div class="empty-chart"><span>Sem despesas de eventos</span></div>`}
          </article>
        </aside>
        <section class="event-cards">
          <article class="event-card event-consolidated-card">
            <div class="event-head consolidated-head">
              <div><span class="event-index">VISÃO CONSOLIDADA</span><h3>${U.esc(scope)}</h3></div>
              <span class="event-scope">${totals.events} evento(s)</span>
            </div>
            <div class="event-numbers">
              <div class="event-metric"><span>Receita</span><strong>${U.money(totals.revenue)}</strong><small>Eventos (V)</small></div>
              <div class="event-metric"><span>Despesas</span><strong>${U.money(Math.abs(totals.expenses))}</strong><small>Eventos (D)</small></div>
              <div class="event-metric result"><span>Resultado</span><strong>${U.money(totals.result)}</strong><small>receita − despesas</small></div>
            </div>
            <div class="event-composition">
              <div class="event-composition-title"><b>Composição do resultado</b><span>Clique em uma linha para conferir os registros</span></div>
              <button class="event-composition-row" data-kind="revenue" type="button">
                <span><b>Receitas</b><small>${revenueRecords.length} registro(s) • Eventos (V)</small></span>
                <strong>${U.money(totals.revenue)}</strong><i aria-hidden="true">›</i>
              </button>
              <button class="event-composition-row" data-kind="expense" type="button">
                <span><b>Despesas</b><small>${expenseRecords.length} registro(s) • Eventos (D)</small></span>
                <strong>${U.money(Math.abs(totals.expenses))}</strong><i aria-hidden="true">›</i>
              </button>
            </div>
            <div class="event-details" id="eventDetails"></div>
          </article>
        </section>
      </div>
    </div>`;
  },
  bind(root,records){
    const U=Lorah.UI,box=root.querySelector("#eventDetails");
    root.querySelectorAll(".event-composition-row").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const kind=btn.dataset.kind;
        const section=kind==="revenue"?"eventRevenue":"eventExpense";
        const open=box.dataset.open===kind;
        root.querySelectorAll(".event-composition-row").forEach(row=>row.classList.remove("active"));
        if(open){box.innerHTML="";box.dataset.open="";return;}
        btn.classList.add("active");box.dataset.open=kind;
        const list=records.filter(r=>r.section===section).sort((a,b)=>b.date.localeCompare(a.date)||a.event.localeCompare(b.event));
        box.innerHTML=`<div class="detail-head"><b>${kind==="revenue"?"Registros de receita":"Registros de despesa"}</b><span>${list.length} lançamento(s)</span></div>
          ${list.length?`<div class="event-detail-table-wrap"><table class="detail-table event-detail-table">
            <thead><tr><th>Data</th><th>Evento</th><th>${kind==="revenue"?"Pedido / observação":"Fornecedor / histórico"}</th><th>${kind==="revenue"?"Desconto":"Origem / meio"}</th><th>Valor</th></tr></thead>
            <tbody>${list.map(r=>`<tr><td>${U.date(r.date)}</td><td><b>${U.esc(r.event)}</b></td><td>${kind==="revenue"?`${r.order?`Pedido ${U.esc(r.order)} • `:""}${U.esc(r.history||"—")}`:`${U.esc(r.party||"—")}<small>${U.esc(r.history||"—")}</small>`}</td><td>${kind==="revenue"?U.money(r.discount||0):U.esc(r.origin||"—")}</td><td class="${r.value<0?"negative-value":""}"><b>${U.money(kind==="expense"?Math.abs(r.value):r.value)}</b></td></tr>`).join("")}</tbody>
          </table></div>`:`<div class="data-note compact"><span>Nenhum registro encontrado.</span></div>`}`;
      });
    });
  }
};
