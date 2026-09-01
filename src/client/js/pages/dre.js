window.Lorah = window.Lorah || {}; Lorah.Pages=Lorah.Pages||{};
Lorah.Pages.dre = {
  title:"DRE",
  render(records,dataset){
    const F=Lorah.Finance,U=Lorah.UI,years=F.years(records),year=years[0]||new Date().getFullYear();
    const m=F.metrics(records),monthly=F.byMonth(records,year),matrix=F.natureMatrix(records,year,dataset.natureOrder||[]);
    const sections=[
      {key:"revenue",label:"RECEITAS"},
      {key:"direct",label:"CUSTOS DIRETOS"},
      {key:"indirect",label:"CUSTOS INDIRETOS"}
    ];
    const rowsBySection={revenue:[],direct:[],indirect:[]};
    matrix.forEach(row=>{
      const sample=records.find(r=>r.nature===row.nature); const sec=dataset.natureSections?.[row.nature] || (sample?F.sectionOf(sample):null);
      if(rowsBySection[sec]) rowsBySection[sec].push(row);
    });
    const monthHead=Array.from({length:12},(_,i)=>new Intl.DateTimeFormat("pt-BR",{month:"short"}).format(new Date(year,i,1)).replace(".",""));
    function tr(row,klass="",clickable=true){
      const rowAttr=clickable?` data-nature="${U.esc(row.nature)}"`:"";
      return `<tr class="${klass}${clickable?" dre-clickable-row":""}"${rowAttr}>
        <th class="${clickable?"dre-drill":""}" ${clickable?'data-drill="nature"':""}>${U.esc(row.nature)}</th>
        ${row.months.map((v,i)=>`<td class="${v<0?"negative-value":""}${clickable?" dre-drill":""}" ${clickable?`data-drill="month" data-month="${i}"`:""}>${v?U.money(v):"—"}</td>`).join("")}
        <td class="${row.total<0?"negative-value":""}${clickable?" dre-drill":""}" ${clickable?'data-drill="nature"':""}><b>${U.money(row.total)}</b></td>
      </tr>`;
    }
    let body="";
    sections.forEach(sec=>{
      const rows=rowsBySection[sec.key], totals=Array(12).fill(0);
      rows.forEach(r=>r.months.forEach((v,i)=>totals[i]+=v));
      const total=totals.reduce((a,b)=>a+b,0);
      body+=`<tr class="dre-section"><th colspan="14">${sec.label}</th></tr>`;
      body+=rows.map(r=>tr(r)).join("");
      body+=tr({nature:`Total ${sec.label.toLowerCase()}`,months:totals,total},"dre-subtotal",false);
      if(sec.key==="direct"){
        const rev=monthly.map(x=>x.revenue),gross=rev.map((v,i)=>v+totals[i]);
        body+=tr({nature:"Resultado bruto",months:gross,total:gross.reduce((a,b)=>a+b,0)},"dre-result",false);
      }
    });
    body+=tr({nature:"RESULTADO LÍQUIDO",months:monthly.map(x=>x.result),total:monthly.reduce((s,x)=>s+x.result,0)},"dre-net",false);

    return `<div class="dashboard-stack">
      <div class="kpi-grid">
        ${U.kpi("Receita",U.money(m.revenue),"Receitas reconhecidas no período","revenue")}
        ${U.kpi("Custos diretos",U.money(Math.abs(m.direct)),"Ligados à operação/venda","expense")}
        ${U.kpi("Custos indiretos",U.money(Math.abs(m.indirect)),"Estrutura e despesas gerais","expense")}
        ${U.kpi("Resultado líquido",U.money(m.result),`Margem ${U.pct(m.margin)}`,m.result>=0?"positive":"negative")}
      </div>
      <article class="card dre-card">
        ${U.sectionTitle(`Demonstrativo mensal • ${year}`,"Valores organizados pelas naturezas definidas na base")}
        <div class="table-scroll">
          <table class="dre-table"><thead><tr><th>Natureza</th>${monthHead.map(m=>`<th>${m}</th>`).join("")}<th>Total</th></tr></thead><tbody>${body}</tbody></table>
        </div>
      </article>
      <article class="card dre-detail-card" id="dreDetailCard" hidden>
        <div class="dre-detail-head">
          <div><h2 id="dreDetailTitle">Lançamentos</h2><p id="dreDetailMeta"></p></div>
          <button class="icon-button" id="dreDetailClose" aria-label="Fechar">×</button>
        </div>
        <div class="table-scroll">
          <table class="detail-table">
            <thead><tr><th>Data</th><th>Histórico</th><th>Fornecedor / Cliente</th><th>Conta</th><th>Natureza</th><th>Valor</th></tr></thead>
            <tbody id="dreDetailBody"></tbody>
          </table>
        </div>
      </article>
    </div>`;
  },
  bind(root,records){
    const U=Lorah.UI, years=Lorah.Finance.years(records),year=years[0]||new Date().getFullYear();
    const card=root.querySelector("#dreDetailCard"),body=root.querySelector("#dreDetailBody");
    const title=root.querySelector("#dreDetailTitle"),meta=root.querySelector("#dreDetailMeta");

    function openDetail(nature,month=null){
      let list=records.filter(r=>r.nature===nature && Lorah.Finance.isDRE(r));
      let label="Todos os lançamentos desta natureza";
      if(month!==null){
        list=list.filter(r=>{
          const d=new Date(r.date+"T12:00:00");
          return d.getFullYear()===year && d.getMonth()===month;
        });
        let mn=new Intl.DateTimeFormat("pt-BR",{month:"long"}).format(new Date(year,month,1));
        mn=mn.charAt(0).toUpperCase()+mn.slice(1);
        label=`${mn} de ${year}`;
      }
      list.sort((a,b)=>b.date.localeCompare(a.date));
      title.textContent=nature;
      meta.textContent=`${label} • ${list.length} registro(s)`;
      body.innerHTML=list.length?list.map(r=>`
        <tr>
          <td>${U.date(r.date)}</td>
          <td>${U.esc(r.history||r.description||"—")}</td>
          <td>${U.esc(r.party||"—")}</td>
          <td>${U.esc(r.account||r.source||"—")}</td>
          <td>${U.esc(r.nature||"—")}</td>
          <td class="${r.value<0?"negative-value":""}"><b>${U.money(r.value)}</b></td>
        </tr>`).join(""):`<tr><td colspan="6" class="empty-cell">Nenhum registro encontrado.</td></tr>`;
      card.hidden=false;
      card.scrollIntoView({behavior:"smooth",block:"start"});
    }

    root.querySelectorAll(".dre-clickable-row").forEach(row=>{
      const nature=row.dataset.nature;
      row.querySelectorAll(".dre-drill").forEach(cell=>{
        cell.addEventListener("click",()=>openDetail(nature,cell.dataset.drill==="month"?Number(cell.dataset.month):null));
      });
    });
    root.querySelector("#dreDetailClose")?.addEventListener("click",()=>card.hidden=true);
  }
};
