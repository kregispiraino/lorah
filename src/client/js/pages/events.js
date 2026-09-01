window.Lorah = window.Lorah || {}; Lorah.Pages=Lorah.Pages||{};
Lorah.Pages.events = {
  title:"Eventos",
  render(records){
    const U=Lorah.UI,events=Lorah.Events.summarize(records),totals=Lorah.Events.totals(events);
    const selected=Lorah.Filters.get().event;
    const expenseChart=events.map(e=>({key:e.name,value:Math.abs(e.expenses)})).filter(x=>x.value>0);
    const revenueChart=events.map(e=>({key:e.name,value:e.revenue})).filter(x=>x.value>0);
    const revenueCount=records.filter(r=>r.section==="eventRevenue").length;
    const expenseCount=records.filter(r=>r.section==="eventExpense").length;
    const resultTone=totals.result>=0?"positive":"negative";
    return `<div class="dashboard-stack">
      <div class="page-inline-title"><div><h1>Eventos</h1><p>Receitas de Eventos (V) e despesas de Eventos (D).</p></div></div>
      <div class="events-layout">
        <aside class="events-summary">
          <article class="card">
            ${U.sectionTitle("Faturamento por evento","Participação de cada evento nas receitas")}
            ${revenueChart.length?U.donut(revenueChart,"Faturamento"):`<div class="empty-chart"><span>Sem receitas de eventos</span></div>`}
          </article>
          <article class="card">
            ${U.sectionTitle("Despesas por evento","Participação de cada evento nas despesas")}
            ${expenseChart.length?U.donut(expenseChart,"Despesas"):`<div class="empty-chart"><span>Sem despesas de eventos</span></div>`}
          </article>
        </aside>
        <article class="card events-result-card">
          ${U.sectionTitle(selected||"Resultado de todos os eventos",selected?"Resultado do evento selecionado":"Consolidado das abas Eventos (V) e Eventos (D)")}
          <div class="event-totals">
            <div><span>Receita</span><strong>${U.money(totals.revenue)}</strong><small>${revenueCount} registro(s)</small></div>
            <div><span>Despesas</span><strong>${U.money(Math.abs(totals.expenses))}</strong><small>${expenseCount} registro(s)</small></div>
            <div class="${resultTone}"><span>Resultado</span><strong>${U.money(totals.result)}</strong><small>Receita − despesas</small></div>
          </div>
          <div class="event-composition-head"><b>Composição</b><span>Clique para visualizar os registros</span></div>
          <div class="event-composition-list">
            <button class="event-composition-row" data-kind="revenue" type="button">
              <span><b>Receitas</b><small>Eventos (V) • ${revenueCount} registro(s)</small></span>
              <strong>${U.money(totals.revenue)}</strong><i aria-hidden="true">›</i>
            </button>
            <button class="event-composition-row" data-kind="expense" type="button">
              <span><b>Despesas</b><small>Eventos (D) • ${expenseCount} registro(s)</small></span>
              <strong>${U.money(Math.abs(totals.expenses))}</strong><i aria-hidden="true">›</i>
            </button>
          </div>
          <div class="event-details" id="eventDetails"></div>
        </article>
      </div>
    </div>`;
  },
  bind(root,records){
    const U=Lorah.UI,box=root.querySelector("#eventDetails");
    root.querySelectorAll(".event-composition-row").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const kind=btn.dataset.kind,section=kind==="revenue"?"eventRevenue":"eventExpense";
        const isOpen=box.dataset.open===kind;
        root.querySelectorAll(".event-composition-row").forEach(row=>row.classList.remove("active"));
        if(isOpen){box.replaceChildren();box.dataset.open="";return;}
        btn.classList.add("active");box.dataset.open=kind;
        const list=records.filter(r=>r.section===section).sort((a,b)=>b.date.localeCompare(a.date)||a.event.localeCompare(b.event));
        box.innerHTML=`<div class="event-detail-head"><b>${kind==="revenue"?"Registros de receita":"Registros de despesa"}</b><span>${list.length} registro(s)</span></div>
          <div class="table-scroll event-detail-scroll"><table class="detail-table event-detail-table">
            <thead><tr><th>Data</th><th>Evento</th><th>${kind==="revenue"?"Pedido / observação":"Fornecedor / histórico"}</th><th>${kind==="revenue"?"Desconto":"Origem / meio"}</th><th>Valor</th></tr></thead>
            <tbody>${list.length?list.map(r=>`<tr><td>${U.date(r.date)}</td><td><b>${U.esc(r.event)}</b></td><td>${kind==="revenue"?`${r.order?`Pedido ${U.esc(r.order)} • `:""}${U.esc(r.history||"—")}`:`${U.esc(r.party||"—")}<small>${U.esc(r.history||"—")}</small>`}</td><td>${kind==="revenue"?U.money(r.discount||0):U.esc(r.origin||"—")}</td><td class="${r.value<0?"negative-value":""}"><b>${U.money(kind==="expense"?Math.abs(r.value):r.value)}</b></td></tr>`).join(""):`<tr><td colspan="5" class="empty-cell">Nenhum registro encontrado.</td></tr>`}</tbody>
          </table></div>
          <div class="event-detail-mobile">${list.length?list.map(r=>`<div class="event-detail-mobile-row">
            <div><span>${U.date(r.date)}</span><strong>${U.money(kind==="expense"?Math.abs(r.value):r.value)}</strong></div>
            <b>${U.esc(r.event)}</b>
            <span>${kind==="revenue"?`${r.order?`Pedido ${U.esc(r.order)} • `:""}${U.esc(r.history||"—")}`:`${U.esc(r.party||"—")} • ${U.esc(r.history||"—")}`}</span>
            <small>${kind==="revenue"?`Desconto: ${U.money(r.discount||0)}`:U.esc(r.origin||"—")}</small>
          </div>`).join(""):`<div class="empty-cell">Nenhum registro encontrado.</div>`}</div>`;
      });
    });
  }
};
