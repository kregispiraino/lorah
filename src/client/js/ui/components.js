window.Lorah = window.Lorah || {};
Lorah.UI = (() => {
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  function money(v){return Lorah.Finance.money.format(v||0)}
  function pct(v){return `${(v*100).toLocaleString("pt-BR",{maximumFractionDigits:1})}%`}
  function date(v){if(!v)return "—"; return new Date(v+"T12:00:00").toLocaleDateString("pt-BR")}
  function kpi(label,value,meta="",tone=""){
    return `<article class="kpi-card ${tone}"><span class="kpi-label">${esc(label)}</span><strong>${value}</strong>${meta?`<small>${meta}</small>`:""}</article>`;
  }
  function sectionTitle(title,sub=""){return `<div class="section-title"><div><h2>${esc(title)}</h2>${sub?`<p>${esc(sub)}</p>`:""}</div></div>`}
  function donut(items,centerLabel="Total"){
    const total=items.reduce((s,x)=>s+Math.max(0,x.value),0);
    if(!total) return `<div class="empty-chart"><span>Sem dados</span></div>`;
    let cursor=0;
    const palette=["#9d68d7","#e4a4c8","#a9d8ec","#d8b36b","#73b9a1","#8f98bd"];
    const stops=items.map((x,i)=>{const start=cursor;cursor+=x.value/total*360;return `${palette[i%palette.length]} ${start}deg ${cursor}deg`});
    return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${stops.join(",")})"><div class="donut-hole"><strong>${money(total)}</strong><span>${esc(centerLabel)}</span></div></div>
      <div class="legend">${items.map((x,i)=>`<div><i style="background:${palette[i%palette.length]}"></i><span>${esc(x.key)}</span><b>${money(x.value)}</b></div>`).join("")}</div></div>`;
  }
  function bars(items){
    const max=Math.max(...items.map(x=>x.value),1);
    if(!items.length)return `<div class="empty-chart"><span>Sem dados</span></div>`;
    return `<div class="bar-list">${items.map(x=>`<div class="bar-row"><div class="bar-head"><span>${esc(x.key)}</span><b>${money(x.value)}</b></div><div class="bar-track"><i style="width:${Math.max(2,x.value/max*100)}%"></i></div></div>`).join("")}</div>`;
  }
  function lineChart(rows){
    if(!rows.length)return `<div class="empty-chart">Sem dados</div>`;
    const W=760,H=220,pad=24;
    const vals=rows.flatMap(r=>[Math.max(0,r.revenue),Math.abs(Math.min(0,r.direct+r.indirect))]);
    const max=Math.max(...vals,1);
    const x=i=>pad+i*(W-pad*2)/(Math.max(1,rows.length-1));
    const y=v=>H-pad-(v/max)*(H-pad*2);
    const pts=(key)=>rows.map((r,i)=>`${x(i)},${y(r[key])}`).join(" ");
    const expensePts=rows.map((r,i)=>`${x(i)},${y(Math.abs(r.direct+r.indirect))}`).join(" ");
    const months=rows.map(r=>Lorah.Finance.monthFmt.format(new Date(2026,r.month,1)).replace(".",""));
    const hoverZones=rows.map((r,i)=>{
      const prev=i===0?pad:(x(i-1)+x(i))/2;
      const next=i===rows.length-1?W-pad:(x(i)+x(i+1))/2;
      return `<rect class="chart-hover-zone" x="${prev}" y="0" width="${next-prev}" height="${H}" data-month-index="${i}"></rect>`;
    }).join("");
    const points=rows.map((r,i)=>`
      <circle class="chart-point revenue-point" cx="${x(i)}" cy="${y(Math.max(0,r.revenue))}" r="3"></circle>
      <circle class="chart-point expense-point" cx="${x(i)}" cy="${y(Math.abs(r.direct+r.indirect))}" r="3"></circle>
    `).join("");
    const payload=encodeURIComponent(JSON.stringify(rows.map((r,i)=>({
      month:months[i],
      revenue:r.revenue,
      expenses:Math.abs(r.direct+r.indirect)
    }))));
    return `<div class="line-chart interactive-line-chart" data-chart='${payload}'>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <line x1="${pad}" y1="${H-pad}" x2="${W-pad}" y2="${H-pad}" class="chart-axis"/>
        <polyline points="${pts("revenue")}" class="line revenue-line"/>
        <polyline points="${expensePts}" class="line expense-line"/>
        ${points}
        <g class="chart-hover-layer">${hoverZones}</g>
      </svg>
      <div class="chart-months">${months.map(m=>`<span>${m}</span>`).join("")}</div>
      <div class="chart-legend-inline"><span><i class="dot revenue-dot"></i>Receitas</span><span><i class="dot expense-dot"></i>Despesas</span></div>
      <div class="chart-tooltip" hidden>
        <strong class="chart-tooltip-month"></strong>
        <div><span>Receitas</span><b class="chart-tooltip-revenue"></b></div>
        <div><span>Despesas</span><b class="chart-tooltip-expense"></b></div>
      </div>
    </div>`;
  }
  function bindLineCharts(root){
    root.querySelectorAll(".interactive-line-chart").forEach(chart=>{
      let data=[];
      try{data=JSON.parse(decodeURIComponent(chart.dataset.chart||""));}catch(_){}
      const tooltip=chart.querySelector(".chart-tooltip");
      const monthEl=chart.querySelector(".chart-tooltip-month");
      const revEl=chart.querySelector(".chart-tooltip-revenue");
      const expEl=chart.querySelector(".chart-tooltip-expense");
      chart.querySelectorAll(".chart-hover-zone").forEach(zone=>{
        zone.addEventListener("mouseenter",e=>{
          const i=Number(zone.dataset.monthIndex),row=data[i];
          if(!row)return;
          monthEl.textContent=row.month.charAt(0).toUpperCase()+row.month.slice(1);
          revEl.textContent=money(row.revenue);
          expEl.textContent=money(row.expenses);
          tooltip.hidden=false;
        });
        zone.addEventListener("mousemove",e=>{
          const rect=chart.getBoundingClientRect();
          const x=e.clientX-rect.left;
          const y=e.clientY-rect.top;
          const tw=tooltip.offsetWidth||150;
          const th=tooltip.offsetHeight||80;
          let left=x+12, top=y+12;
          if(left+tw>rect.width) left=x-tw-12;
          if(top+th>rect.height) top=y-th-12;
          tooltip.style.left=`${Math.max(6,left)}px`;
          tooltip.style.top=`${Math.max(6,top)}px`;
        });
        zone.addEventListener("mouseleave",()=>{tooltip.hidden=true;});
      });
    });
  }
  return {esc,money,pct,date,kpi,sectionTitle,donut,bars,lineChart,bindLineCharts};
})();