window.Lorah = window.Lorah || {}; Lorah.Pages=Lorah.Pages||{};
Lorah.Pages.events = {
  title:"Eventos",
  render(records){
    const U=Lorah.UI,events=Lorah.Events.summarize(records),t=Lorah.Events.totals(events);
    const expenseChart=events.map(e=>({key:e.name,value:Math.abs(e.expenses)})).filter(x=>x.value>0);
    const revenueChart=events.map(e=>({key:e.name,value:e.revenue})).filter(x=>x.value>0);
    return `<div class="dashboard-stack">
      <div class="page-inline-title"><div><h1>Eventos</h1><p>Resultado financeiro por evento: faturamento de Eventos (V) e despesas dos lançamentos vinculados.</p></div></div>
      <div class="events-layout">
        <aside class="events-summary">
          <div class="kpi-grid event-kpis">
            ${U.kpi("Eventos",String(t.events),`${t.complete} com receita vinculada`)}
            ${U.kpi("Resultado",U.money(t.revenue+t.expenses),"Faturamento − despesas",(t.revenue+t.expenses)>=0?"positive":"negative")}
          </div>
          <article class="card">
            ${U.sectionTitle("Faturamento por evento","Receitas informadas na aba Eventos (V)")}
            ${revenueChart.length?U.donut(revenueChart,"Faturamento"):`<div class="data-note"><b>Receitas ainda sem vínculo</b><span>A aba Eventos (V) não possui receitas válidas vinculadas aos eventos encontrados no período.</span></div>`}
          </article>
          <article class="card">
            ${U.sectionTitle("Despesas por evento","Participação de cada evento nas despesas atribuídas")}
            ${U.donut(expenseChart,"Despesas")}
          </article>
        </aside>
        <section class="event-cards">
          ${events.map((e,i)=>`
          <article class="event-card">
            <div class="event-head">
              <div><span class="event-index">${String(i+1).padStart(2,"0")}</span><h3>${U.esc(e.name)}</h3></div>
              <span class="event-status ${e.hasRevenue?"complete":"pending"}">${e.hasRevenue?"Resultado completo":"Receita não vinculada"}</span>
            </div>
            <div class="event-numbers">
              <button class="event-metric" data-event="${U.esc(e.name)}" data-kind="revenue"><span>Receita</span><strong>${e.hasRevenue?U.money(e.revenue):"—"}</strong><small>ver lançamentos</small></button>
              <button class="event-metric" data-event="${U.esc(e.name)}" data-kind="expense"><span>Despesas</span><strong>${U.money(Math.abs(e.expenses))}</strong><small>ver lançamentos</small></button>
              <div class="event-metric result"><span>Resultado</span><strong>${e.hasRevenue?U.money(e.result):"—"}</strong><small>${e.hasRevenue?"receita − despesas":"aguardando receita"}</small></div>
            </div>
            <div class="event-natures">
              <div class="event-nature-title">Despesas por natureza</div>
              ${e.nature.slice(0,6).map(n=>`<div><span>${U.esc(n.key)}</span><b>${U.money(Math.abs(n.value))}</b></div>`).join("")}
            </div>
            <div class="event-details" id="event-details-${i}"></div>
          </article>`).join("")||`<article class="card"><div class="empty-chart">Nenhum lançamento com Evento encontrado no período.</div></article>`}
        </section>
      </div>
    </div>`;
  },
  bind(root,records){
    root.querySelectorAll(".event-metric[data-event]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const name=btn.dataset.event,kind=btn.dataset.kind,card=btn.closest(".event-card"),box=card.querySelector(".event-details");
        const list=records.filter(r=>r.event===name&&(kind==="revenue"?r.section==="eventRevenue":(r.section==="direct"||r.section==="indirect")));
        const open=box.dataset.open===`${name}-${kind}`;
        if(open){box.innerHTML="";box.dataset.open="";return;}
        box.dataset.open=`${name}-${kind}`;
        box.innerHTML=`<div class="detail-head"><b>${kind==="revenue"?"Receitas":"Despesas"} • ${Lorah.UI.esc(name)}</b><span>${list.length} lançamento(s)</span></div>
          ${list.length?`<div class="detail-list">${list.sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<div><span><b>${Lorah.UI.esc(r.party||r.nature)}</b><small>${Lorah.UI.date(r.date)} • ${Lorah.UI.esc(r.nature)}</small></span><strong>${Lorah.UI.money(r.value)}</strong></div>`).join("")}</div>`:`<div class="data-note compact"><span>Nenhum lançamento encontrado.</span></div>`}`;
      });
    });
  }
};
