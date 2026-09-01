window.Lorah = window.Lorah || {}; Lorah.Pages=Lorah.Pages||{};

function eventDetailsMarkup(records,kind){
  const U=Lorah.UI,section=kind==="revenue"?"eventRevenue":"eventExpense";
  const list=records.filter(r=>r.section===section).sort((a,b)=>b.date.localeCompare(a.date)||a.event.localeCompare(b.event));
  const rows=list.map(r=>{
    const detail=kind==="revenue"?`${r.order?`Pedido ${r.order} • `:""}${r.history||"—"}`:`${r.party||"—"} • ${r.history||"—"}`;
    const secondary=kind==="revenue"?U.money(r.discount||0):(r.origin||"—");
    const value=U.money(kind==="expense"?Math.abs(r.value):r.value);
    return `<tr><td>${U.date(r.date)}</td><td><b class="event-cell-clamp" title="${U.esc(r.event)}">${U.esc(r.event)}</b></td><td><span class="event-cell-clamp" title="${U.esc(detail)}">${U.esc(detail)}</span></td><td><span class="event-cell-clamp" title="${U.esc(secondary)}">${U.esc(secondary)}</span></td><td class="${r.value<0?"negative-value":""}"><b>${value}</b></td></tr>`;
  }).join("");
  const mobile=list.map(r=>{
    const detail=kind==="revenue"?`${r.order?`Pedido ${r.order} • `:""}${r.history||"—"}`:`${r.party||"—"} • ${r.history||"—"}`;
    return `<div class="event-detail-mobile-row"><div><span>${U.date(r.date)}</span><strong>${U.money(kind==="expense"?Math.abs(r.value):r.value)}</strong></div><b>${U.esc(r.event)}</b><span>${U.esc(detail)}</span><small>${kind==="revenue"?`Desconto: ${U.money(r.discount||0)}`:U.esc(r.origin||"—")}</small></div>`;
  }).join("");
  return `<div class="event-detail-head"><b>${kind==="revenue"?"Registros de receita":"Registros de despesa"}</b><span>${list.length} registro(s)</span></div>
    <div class="event-detail-desktop"><table class="detail-table event-detail-table">
      <colgroup><col class="event-col-date"><col class="event-col-name"><col class="event-col-detail"><col class="event-col-origin"><col class="event-col-value"></colgroup>
      <thead><tr><th>Data</th><th>Evento</th><th>${kind==="revenue"?"Pedido / observação":"Fornecedor / histórico"}</th><th>${kind==="revenue"?"Desconto":"Origem / meio"}</th><th>Valor</th></tr></thead>
      <tbody>${rows||`<tr><td colspan="5" class="empty-cell">Nenhum registro encontrado.</td></tr>`}</tbody>
    </table></div>
    <div class="event-detail-mobile">${mobile||`<div class="empty-cell">Nenhum registro encontrado.</div>`}</div>`;
}

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
    return `<div class="dashboard-stack"><div class="events-layout">
      <aside class="events-summary">
        <article class="card">${U.sectionTitle("Faturamento por evento","Participação de cada evento nas receitas")}${revenueChart.length?U.donut(revenueChart,"Faturamento"):`<div class="empty-chart"><span>Sem receitas de eventos</span></div>`}</article>
        <article class="card">${U.sectionTitle("Despesas por evento","Participação de cada evento nas despesas")}${expenseChart.length?U.donut(expenseChart,"Despesas"):`<div class="empty-chart"><span>Sem despesas de eventos</span></div>`}</article>
      </aside>
      <article class="card events-result-card">
        ${U.sectionTitle(selected||"Resultado de todos os eventos",selected?"Resultado do evento selecionado":"Consolidado das abas Eventos (V) e Eventos (D)")}
        <div class="event-totals">
          <div><span>Receita</span><strong>${U.money(totals.revenue)}</strong><small>${revenueCount} registro(s)</small></div>
          <div><span>Despesas</span><strong>${U.money(Math.abs(totals.expenses))}</strong><small>${expenseCount} registro(s)</small></div>
          <div class="${resultTone}"><span>Resultado</span><strong>${U.money(totals.result)}</strong><small>Receita − despesas</small></div>
        </div>
        <div class="event-composition-head"><b>Composição</b><span>Clique para alternar os registros</span></div>
        <div class="event-composition-list">
          <button class="event-composition-row active" data-kind="revenue" type="button"><span><b>Receitas</b><small>Eventos (V) • ${revenueCount} registro(s)</small></span><strong>${U.money(totals.revenue)}</strong><i aria-hidden="true">›</i></button>
          <button class="event-composition-row" data-kind="expense" type="button"><span><b>Despesas</b><small>Eventos (D) • ${expenseCount} registro(s)</small></span><strong>${U.money(Math.abs(totals.expenses))}</strong><i aria-hidden="true">›</i></button>
        </div>
        <div class="event-details" id="eventDetails" data-open="revenue">${eventDetailsMarkup(records,"revenue")}</div>
      </article>
    </div></div>`;
  },
  bind(root,records){
    const box=root.querySelector("#eventDetails");
    root.querySelectorAll(".event-composition-row").forEach(btn=>btn.addEventListener("click",()=>{
      const kind=btn.dataset.kind;
      if(box.dataset.open===kind)return;
      root.querySelectorAll(".event-composition-row").forEach(row=>row.classList.toggle("active",row===btn));
      box.dataset.open=kind;
      box.innerHTML=eventDetailsMarkup(records,kind);
    }));
  }
};
