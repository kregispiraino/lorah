window.Lorah = window.Lorah || {};
Lorah.Events = {
  summarize(records){
    const map=new Map();
    records.filter(r=>r.event&&r.section!=="movement"&&r.section!=="unclassified").forEach(r=>{
      if(!map.has(r.event)) map.set(r.event,{name:r.event,revenue:0,expenses:0,result:0,records:[],nature:new Map(),hasRevenue:false});
      const e=map.get(r.event); e.records.push(r);
      if(r.section==="eventRevenue"){e.revenue+=r.value;e.hasRevenue=true;}
      else if(r.section==="direct"||r.section==="indirect"){
        e.expenses+=r.value; e.nature.set(r.nature,(e.nature.get(r.nature)||0)+r.value);
      }
      e.result=e.revenue+e.expenses;
    });
    return [...map.values()].map(e=>({...e,nature:[...e.nature.entries()].map(([key,value])=>({key,value})).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value))}))
      .sort((a,b)=>Math.abs(b.expenses)-Math.abs(a.expenses));
  },
  totals(events){
    return {
      events:events.length,
      revenue:events.reduce((s,e)=>s+e.revenue,0),
      expenses:events.reduce((s,e)=>s+e.expenses,0),
      complete:events.filter(e=>e.hasRevenue).length
    };
  }
};