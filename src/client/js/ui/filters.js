window.Lorah = window.Lorah || {};
Lorah.Filters = (() => {
  let active={preset:"all",start:"",end:"",nature:"",account:"",event:"",party:""};
  function get(){return {...active}}
  function set(v){active={...active,...v}}
  function resolve(preset,records){
    if(preset==="all") return {start:"",end:""};
    const max=records.reduce((m,r)=>r.date>m?r.date:m,"");
    const end=max||new Date().toISOString().slice(0,10);
    const e=new Date(end+"T12:00:00"); let s=new Date(e);
    if(["7","15","30"].includes(preset)) s.setDate(e.getDate()-Number(preset)+1);
    else if(preset==="quarter") s=new Date(e.getFullYear(),Math.floor(e.getMonth()/3)*3,1,12);
    return {start:s.toISOString().slice(0,10),end};
  }
  return {get,set,resolve};
})();