window.Lorah = window.Lorah || {}; Lorah.Pages=Lorah.Pages||{};
Lorah.Pages.overview = {
  title:"Visão Geral",
  render(records,dataset){
    const F=Lorah.Finance,U=Lorah.UI,m=F.metrics(records);
    const years=F.years(records),year=years[0]||new Date().getFullYear(),monthly=F.byMonth(records,year);
    const channels=F.revenueByAccount(records).map(x=>({...x,value:Math.max(0,x.value)}));
    const expenses=F.topExpenses(records,7);
    const parties=F.partyRanking(records,6);
    const latest=F.latest(records,7);
    return `
      <div class="dashboard-stack">
        <div class="kpi-grid">
          ${U.kpi("Receita",U.money(m.revenue),`${m.count} lançamentos considerados`,"revenue")}
          ${U.kpi("Despesas",U.money(Math.abs(m.expenses)),"Custos diretos + indiretos","expense")}
          ${U.kpi("Resultado",U.money(m.result),m.result>=0?"Resultado positivo":"Resultado negativo",m.result>=0?"positive":"negative")}
          ${U.kpi("Margem",U.pct(m.margin),"Resultado ÷ Receita","")}
        </div>

        <div class="overview-grid">
          <article class="card span-2">
            ${U.sectionTitle(`Evolução financeira • ${year}`,"Receitas e despesas por mês")}
            ${U.lineChart(monthly)}
          </article>
          <article class="card">
            ${U.sectionTitle("Receita por canal","Origem das receitas da base")}
            ${U.donut(channels,"Receitas")}
          </article>
          <article class="card">
            ${U.sectionTitle("Despesas por natureza","Maiores concentrações no período")}
            ${U.bars(expenses)}
          </article>
          <article class="card">
            ${U.sectionTitle("Maiores fornecedores","Por volume de despesas")}
            <div class="ranking-list">${parties.map((x,i)=>`<div><span class="rank">${String(i+1).padStart(2,"0")}</span><span class="rank-name">${U.esc(x.key)}</span><b>${U.money(x.value)}</b></div>`).join("")||'<div class="empty-row">Sem dados</div>'}</div>
          </article>
          <article class="card">
            ${U.sectionTitle("Últimos lançamentos","Movimentos econômicos mais recentes")}
            <div class="transaction-list">${latest.map(r=>`<div><span class="transaction-icon ${r.value>=0?"in":"out"}">${r.value>=0?"↗":"↘"}</span><span class="transaction-main"><b>${U.esc(r.party||r.nature)}</b><small>${U.date(r.date)} • ${U.esc(r.nature)}</small></span><strong class="${r.value>=0?"amount-in":"amount-out"}">${U.money(r.value)}</strong></div>`).join("")}</div>
          </article>
        </div>
      </div>`;
  }
,
  bind(root){
    Lorah.UI.bindLineCharts(root);
  }
};