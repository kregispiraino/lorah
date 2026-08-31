window.Lorah = window.Lorah || {};
Lorah.Finance = (() => {
  const money=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});
  const monthFmt=new Intl.DateTimeFormat("pt-BR",{month:"short"});
  const monthLong=new Intl.DateTimeFormat("pt-BR",{month:"long"});
  const absExpense=r=>sectionOf(r)==="direct"||sectionOf(r)==="indirect";
  function sectionOf(r){
    const eventSelected=Boolean(Lorah.Filters?.get?.().event);
    if(eventSelected && r.section==="eventRevenue") return "revenue";
    if(eventSelected && r.section==="revenue") return "eventExcluded";
    return r.section;
  }
  const isDRE=r=>["revenue","direct","indirect"].includes(sectionOf(r));

  function filtered(records,f={}){
    const party=(f.party||"").trim().toLowerCase();
    return records.filter(r=>{
      if(f.start&&r.date<f.start) return false;
      if(f.end&&r.date>f.end) return false;
      if(f.nature&&r.nature!==f.nature) return false;
      if(f.account&&r.account!==f.account) return false;
      if(f.event&&r.event!==f.event) return false;
      if(party&&!`${r.party} ${r.history} ${r.description}`.toLowerCase().includes(party)) return false;
      return true;
    });
  }
  function metrics(records){
    const dre=records.filter(isDRE);
    const revenue=dre.filter(r=>sectionOf(r)==="revenue").reduce((s,r)=>s+r.value,0);
    const direct=dre.filter(r=>sectionOf(r)==="direct").reduce((s,r)=>s+r.value,0);
    const indirect=dre.filter(r=>sectionOf(r)==="indirect").reduce((s,r)=>s+r.value,0);
    const expenses=direct+indirect;
    const result=revenue+expenses;
    return {revenue,direct,indirect,expenses,result,margin:revenue?result/revenue:0,count:dre.length};
  }
  function group(records,keyFn,predicate=()=>true){
    const m=new Map();
    records.filter(predicate).forEach(r=>{
      const k=keyFn(r); if(!k) return;
      m.set(k,(m.get(k)||0)+r.value);
    });
    return [...m.entries()].map(([key,value])=>({key,value}));
  }
  function byMonth(records,year){
    const out=Array.from({length:12},(_,m)=>({month:m,revenue:0,direct:0,indirect:0,result:0}));
    records.filter(isDRE).forEach(r=>{
      const d=new Date(r.date+"T12:00:00"); if(d.getFullYear()!==year) return;
      const row=out[d.getMonth()]; const sec=sectionOf(r); row[sec]+=r.value; row.result+=r.value;
    });
    return out;
  }
  function years(records){
    return [...new Set(records.map(r=>Number(r.date.slice(0,4))).filter(Boolean))].sort((a,b)=>b-a);
  }
  function natureMatrix(records,year,natureOrder=[]){
    const byNature=new Map();
    records.filter(isDRE).forEach(r=>{
      const d=new Date(r.date+"T12:00:00"); if(d.getFullYear()!==year) return;
      if(!byNature.has(r.nature)) byNature.set(r.nature,Array(12).fill(0));
      byNature.get(r.nature)[d.getMonth()]+=r.value;
    });
    const all=[...byNature.keys()];
    all.sort((a,b)=>{
      const ia=natureOrder.indexOf(a),ib=natureOrder.indexOf(b);
      return (ia<0?999:ia)-(ib<0?999:ib)||a.localeCompare(b);
    });
    return all.map(n=>({nature:n,months:byNature.get(n),total:byNature.get(n).reduce((a,b)=>a+b,0)}));
  }
  function topExpenses(records,limit=7){
    return group(records,r=>r.nature,absExpense).map(x=>({...x,value:Math.abs(x.value)})).sort((a,b)=>b.value-a.value).slice(0,limit);
  }
  function revenueByAccount(records){
    return group(records,r=>r.account,r=>sectionOf(r)==="revenue").filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
  }
  function partyRanking(records,limit=6){
    return group(records,r=>r.party,r=>absExpense(r)&&r.party).map(x=>({...x,value:Math.abs(x.value)})).sort((a,b)=>b.value-a.value).slice(0,limit);
  }
  function latest(records,limit=8){
    return records.filter(isDRE).slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,limit);
  }
  function available(records){
    return {
      natures:[...new Set(records.map(r=>r.nature).filter(Boolean))].sort(),
      accounts:[...new Set(records.map(r=>r.account).filter(Boolean))].sort(),
      events:[...new Set(records.map(r=>r.event).filter(Boolean).map(x=>String(x).trim()))].sort((a,b)=>a.localeCompare(b,"pt-BR"))
    };
  }
  return {money,monthFmt,monthLong,filtered,metrics,group,byMonth,years,natureMatrix,topExpenses,revenueByAccount,partyRanking,latest,available,isDRE,sectionOf};
})();
