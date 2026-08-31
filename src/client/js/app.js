window.Lorah = window.Lorah || {};
(async function(){
  const pages=[
    {id:"overview",label:"Visão Geral",icon:"grid"},
    {id:"dre",label:"DRE",icon:"chart"},
    {id:"events",label:"Eventos",icon:"event"}
  ];
  const icons={
    grid:'<svg viewBox="0 0 24 24"><path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z"/></svg>',
    chart:'<svg viewBox="0 0 24 24"><path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm2 4v8h2V8H7Zm4 3v5h2v-5h-2Zm4-4v9h2V7h-2Z"/></svg>',
    event:'<svg viewBox="0 0 24 24"><path d="M7 2h2v2h6V2h2v2h3v17H4V4h3V2Zm11 8H6v9h12v-9ZM6 6v2h12V6H6Z"/></svg>'
  };
  const loaded=await Lorah.Storage.load();
  let dataset=loaded.dataset||{version:1,records:[],natureSections:{},natureOrder:[]};
  let datasetMetadata=loaded.metadata||null;
  let currentPage=(location.hash.match(/#\/([^?]+)/)||[])[1]||"overview";
  if(!pages.some(p=>p.id===currentPage)) currentPage="overview";

  const $=id=>document.getElementById(id);
  const root=$("pageRoot"),toast=$("toast"),filterPanel=$("filterPanel");
  function notify(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(notify.t);notify.t=setTimeout(()=>toast.classList.remove("show"),2400)}
  function navMarkup(compact=false){return pages.map(p=>compact?
    `<button class="rail-btn ${p.id===currentPage?"active":""}" data-page="${p.id}" title="${p.label}">${icons[p.icon]}</button>`:
    `<button class="${innerWidth<=760?"mobile-menu-item":"panel-item"} ${p.id===currentPage?"active":""}" data-page="${p.id}">${icons[p.icon]}<span>${p.label}</span></button>`).join("")}
  function buildNav(){
    $("railNav").innerHTML=navMarkup(true); $("panelNav").innerHTML=navMarkup(false);
    $("mobileMenuPopover").innerHTML=pages.map(p=>`<button class="mobile-menu-item ${p.id===currentPage?"active":""}" data-page="${p.id}">${icons[p.icon]}<span>${p.label}</span></button>`).join("");
    document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>setPage(b.dataset.page));
  }
  function setPage(id){
    currentPage=id; location.hash=`#/${id}`; closeMobile();
    buildNav(); render();
  }
  function filteredRecords(){
    const filters=Lorah.Filters.get();
    return currentPage==="events"
      ?Lorah.Finance.filteredEvents(dataset.records,filters.event)
      :Lorah.Finance.filtered(dataset.records,filters);
  }
  function renderStatus(records){
    if(!dataset.records.length){
      $("dataStatus").innerHTML='<span class="status-dot empty"></span><span>Nenhuma base financeira importada</span>';
      return;
    }
    const max=dataset.records.reduce((m,r)=>r.date>m?r.date:m,""),min=dataset.records.reduce((m,r)=>!m||r.date<m?r.date:m,"");
    const f=Lorah.Filters.get(),filtered=Boolean(f.start||f.end||f.nature||f.account||f.event||f.party);
    const eventLabel=f.event||"";
    const updated=datasetMetadata?.importedAt?new Date(datasetMetadata.importedAt).toLocaleString("pt-BR"):"";
    $("dataStatus").innerHTML=`<span class="status-dot"></span><span><b>${filtered?records.length:dataset.records.length}</b> registros • ${Lorah.UI.date(f.start||min)} — ${Lorah.UI.date(f.end||max)}</span>${eventLabel?`<span class="status-filter-chip">Evento: ${Lorah.UI.esc(eventLabel)}</span>`:""}<span class="status-source">${Lorah.UI.esc(dataset.sourceFile||"Base financeira")}${updated?` • atualizada em ${Lorah.UI.esc(updated)}`:""}</span>`;
  }
  function render(){
    const page=Lorah.Pages[currentPage]||Lorah.Pages.overview, records=filteredRecords();
    filterPanel.classList.toggle("events-only",currentPage==="events");
    $("breadcrumbPage").textContent=page.title.toLowerCase();
    document.title=`Lorah • ${page.title}`;
    renderStatus(records);
    root.innerHTML=dataset.records.length?page.render(records,dataset):`<article class="card empty-state"><div class="empty-state-icon">⇩</div><h1>Nenhuma base importada</h1><p>Use <b>Importar dados</b> no menu lateral para carregar a primeira planilha financeira.</p></article>`;
    if(!dataset.records.length)return;
    page.bind?.(root,records,dataset);
  }
  function setupFilters(){
    const opts=Lorah.Finance.available(dataset.records);
    $("natureFilter").innerHTML='<option value="">Todas</option>'+opts.natures.map(x=>`<option>${Lorah.UI.esc(x)}</option>`).join("");
    $("accountFilter").innerHTML='<option value="">Todas</option>'+opts.accounts.map(x=>`<option>${Lorah.UI.esc(x)}</option>`).join("");
    $("eventFilter").innerHTML='<option value="">Todos os eventos</option>'+opts.events.map(x=>`<option value="${Lorah.UI.esc(x)}">${Lorah.UI.esc(x)}</option>`).join("");
  }
  function toggleFilter(open){
    const should=open??!filterPanel.classList.contains("open");filterPanel.classList.toggle("open",should);$("filterButton").setAttribute("aria-expanded",should);
  }
  $("filterButton").onclick=e=>{e.stopPropagation();toggleFilter();}; $("closeFilter").onclick=()=>toggleFilter(false);

  document.addEventListener("click",e=>{
    if(filterPanel.classList.contains("open") &&
       !e.target.closest("#filterPanel") &&
       !e.target.closest("#filterButton")){
      toggleFilter(false);
    }
  });
  $("periodPreset").onchange=()=>{
    const custom=$("periodPreset").value==="custom";
    document.querySelectorAll(".custom-date").forEach(x=>x.classList.toggle("visible",custom));
    if(!custom){const d=Lorah.Filters.resolve($("periodPreset").value,dataset.records);$("startDate").value=d.start;$("endDate").value=d.end;}
  };
  $("applyFilters").onclick=()=>{
    Lorah.Filters.set({preset:$("periodPreset").value,start:$("startDate").value,end:$("endDate").value,nature:$("natureFilter").value,account:$("accountFilter").value,event:$("eventFilter").value,party:$("partyFilter").value});
    toggleFilter(false);render();
  };
  $("clearFilters").onclick=()=>{
    ["startDate","endDate","partyFilter"].forEach(id=>$(id).value="");["natureFilter","accountFilter","eventFilter"].forEach(id=>$(id).value="");$("periodPreset").value="all";
    document.querySelectorAll(".custom-date").forEach(x=>x.classList.remove("visible"));
    Lorah.Filters.set({preset:"all",start:"",end:"",nature:"",account:"",event:"",party:""});render();
  };

  function applyTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("lorah-theme",theme);$("themeLabel").textContent=theme==="dark"?"Tema Escuro":"Tema Claro";$("mobileThemeLabel").textContent=$("themeLabel").textContent}
  const themeDefaultVersion="light-v1";
  const savedTheme=localStorage.getItem("lorah-theme");
  const initialTheme=localStorage.getItem("lorah-theme-default-version")===themeDefaultVersion?(savedTheme||"light"):"light";
  applyTheme(initialTheme);
  localStorage.setItem("lorah-theme-default-version",themeDefaultVersion);
  $("themeToggle").onclick=()=>{applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");$("themeToggle").blur()};
  $("mobileThemeToggle").onclick=()=>{applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");closeMobile()};
  async function logout(){
    try{await Lorah.Storage.request("/api/auth/logout",{method:"POST"});}finally{location.assign("/login");}
  }
  $("logoutButton").onclick=logout;
  $("mobileLogoutButton").onclick=logout;

  $("importButton").onclick=()=>{$("fileInput").click();$("importButton").blur()};
  $("fileInput").onchange=async e=>{
    const file=e.target.files?.[0]; if(!file)return;
    try{
      notify("Lendo base financeira…");
      const result=await Lorah.Storage.upload(file);
      dataset=result.dataset;
      datasetMetadata=result.metadata;
      setupFilters(); Lorah.Filters.set({preset:"all",start:"",end:"",nature:"",account:"",event:"",party:""});render();
      notify(`Base atualizada: ${dataset.records.length} registros.`);
    }catch(err){console.error(err);notify(err.message||"Não foi possível importar o arquivo.");}
    e.target.value="";
  };

  const profile=$("mobileProfilePopover"),menu=$("mobileMenuPopover");
  function closeMobile(){profile.classList.remove("open");menu.classList.remove("open")}
  $("mobileProfileBtn").onclick=e=>{e.stopPropagation();const o=!profile.classList.contains("open");closeMobile();if(o)profile.classList.add("open")};
  $("mobileMenuBtn").onclick=e=>{e.stopPropagation();const o=!menu.classList.contains("open");closeMobile();if(o)menu.classList.add("open")};
  document.addEventListener("click",e=>{if(!e.target.closest(".mobile-popover")&&!e.target.closest(".mobile-profile-btn")&&!e.target.closest(".mobile-menu-btn"))closeMobile()});
  window.addEventListener("hashchange",()=>{const p=(location.hash.match(/#\/([^?]+)/)||[])[1];if(p&&pages.some(x=>x.id===p)){currentPage=p;buildNav();render()}});
  window.addEventListener("resize",()=>{if(innerWidth>760)closeMobile()});

  setupFilters(); buildNav(); render();
})();
