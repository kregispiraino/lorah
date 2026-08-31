window.Lorah = window.Lorah || {};
Lorah.Events = {
  summarize(records){
    const map=new Map();
    records.filter(r=>r.event&&(r.section==="eventRevenue"||r.section==="eventExpense")).forEach(r=>{
      if(!map.has(r.event)) map.set(r.event,{name:r.event,revenue:0,expenses:0,result:0,records:[],hasRevenue:false});
      const e=map.get(r.event); e.records.push(r);
      if(r.section==="eventRevenue"){e.revenue+=r.value;e.hasRevenue=true;}
      else if(r.section==="eventExpense") e.expenses+=r.value;
      e.result=e.revenue+e.expenses;
    });
    return [...map.values()].sort((a,b)=>Math.abs(b.expenses)-Math.abs(a.expenses)||b.revenue-a.revenue);
  },
  totals(events){
    return {
      events:events.length,
      revenue:events.reduce((s,e)=>s+e.revenue,0),
      expenses:events.reduce((s,e)=>s+e.expenses,0),
      result:events.reduce((s,e)=>s+e.result,0)
    };
  }
};
