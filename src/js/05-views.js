/* ---------- rendering ---------- */
function route(){const h=(location.hash||"").slice(1);return TABS.some(t=>t[0]===h)?h:"oversikt"}
function renderTabs(){const r=route();$("#tabs").innerHTML=TABS.map(([id,l])=>`<a href="#${id}" class="tab-${id}" ${r===id?'aria-current="page"':""}>${ICON[id]}<span>${l==="Centralt innehåll"?"Innehåll":l}</span></a>`).join("");const g=document.getElementById("hdrgear");if(g){g.setAttribute("href","#installningar");g.setAttribute("aria-label","Inställningar");g.setAttribute("aria-current",r==="installningar"?"page":"false")}}
function roBanner(){return READONLY?`<div class="example" style="background:var(--info-bg);color:var(--info)"><span class="sp"><b>Läsläge</b>${RO_NAME?" · "+esc(RO_NAME):""}. Du kan titta men inte ändra. Ändringar gör du på datorn.</span><button class="btn" data-a="open-ro">Öppna en nyare fil</button>${window.matchMedia("(max-width: 700px)").matches?'<button class="btn" data-a="p-phone">Telefonvy</button>':""}<button class="btn" data-a="close-ro">Stäng</button></div>`:""}
function exampleBanner(){return state.example&&!READONLY?`<div class="example"><span class="sp"><b>Exempeldata.</b> Kurserna, eleverna och omdömena här är påhittade så att du ser hur allt hänger ihop.</span><button class="btn" data-a="clear-example">Börja med tomt bord</button></div>`:""}
function render(){if(isPhone()){renderPhone();return}document.body.classList.remove("phone");renderTabs();const r=route();const m=$("#main");
 const v={oversikt:vOverview,planering:vPlanning,schema:vSchedule,arshjul:vWheel,innehall:vContent,bedomning:vAssess,installningar:vSettings}[r];
 m.innerHTML=roBanner()+(READONLY?"":updateBanner())+exampleBanner()+v();}

function weekPanel(){const mon=mondayOf(TODAY);
 if((state.schedule||[]).length){const all=[];const days=DAYS5.map(i=>{const ds=fmtD(addDays(mon,i-1));const occ=dayOccurrences(ds);all.push(...occ);const d=parseD(ds);
   return `<div class="day ${ds===fmtD(TODAY)?"today":""}"><div class="dh"><b>${DAY[i].slice(0,3)}</b> <span class="muted small">${d.getDate()}/${d.getMonth()+1}</span></div>${occ.map(o=>occCard(o,true)).join("")||'<span class="small muted">–</span>'}</div>`}).join("");
  const nc=all.filter(o=>o.cancel).length;
  return `<section class="panel"><div class="panel-h"><h2>Den här veckan</h2><span class="muted small">v.${isoWeek(TODAY)}</span><span class="sp"></span><span class="small muted">${all.length} lektioner${nc?` · <span class="lowtag">${nc} inställda</span>`:""}</span><a class="btn ghost" href="#schema">Schema</a></div><div class="week">${days}</div></section>`}
 const ls=lessonsInWeek(state,mon);
 const days=[1,2,3,4,5].map(i=>{const d=addDays(mon,i-1);const ds=fmtD(d);const l=ls.filter(x=>x.date===ds);
  return `<div class="day ${ds===fmtD(TODAY)?"today":""}"><div class="dh"><b>${DAY[d.getDay()].slice(0,3)}</b> <span class="muted small">${d.getDate()}/${d.getMonth()+1}</span></div>${l.map(x=>{const u=unit(x.unitId)||{};const c=course(u.courseId)||{};return `<button class="lesson ${x.done?"done":""}" data-a="edit-lesson" data-id="${x.id}" style="border-left-color:${c.color||"var(--line)"}"><span class="small muted">${esc(c.name||"")}</span><b>${esc(x.title||"Lektion")}</b>${x.plan?`<span class="occ-p">${esc(x.plan)}</span>`:""}${x.done?'<span class="small" style="color:var(--ok)">Genomförd</span>':""}</button>`}).join("")||'<span class="small muted">–</span>'}</div>`}).join("");
 return `<section class="panel"><div class="panel-h"><h2>Den här veckan</h2><span class="muted small">v.${isoWeek(TODAY)}</span><span class="sp"></span>${ls.length?`<span class="small muted">${ls.filter(x=>x.done).length} av ${ls.length} lektioner genomförda</span>`:""}</div>
  ${ls.length?`<div class="week">${days}</div>`:`<div class="empty">Inga lektioner planerade den här veckan. Öppna ett arbetsområde under Planering och lägg till lektioner.</div>`}</section>`}
function updateBanner(){return UPDATE?`<div class="example" style="background:var(--info-bg);color:var(--info)"><span class="sp"><b>Version ${esc(UPDATE.version)} finns.</b> Du har ${esc(APP_VERSION)}. Din data följer med när du uppdaterar.</span><button class="btn pri" data-a="download-latest">${DESKTOP?"Ladda ner":"Uppdatera nu"}</button><button class="btn" data-a="open-update">Visa hur</button><span id="dlstatus" class="small" style="flex-basis:100%"></span></div>`:""}
function vOverview(){
 const ys=parseD(state.year.start),ye=parseD(state.year.end);const pct=Math.max(0,Math.min(100,Math.round((TODAY-ys)/(ye-ys)*100)));
 const active=state.units.filter(u=>parseD(u.start)<=TODAY&&parseD(u.end)>=TODAY||u.status==="pagar").filter((u,i,a)=>a.indexOf(u)===i);
 const nowHtml=active.length?active.map(u=>{const c=course(u.courseId)||{};const s=parseD(u.start),e=parseD(u.end);const p=Math.max(0,Math.min(100,Math.round((TODAY-s)/(e-s||1)*100)));
   return `<button class="now" data-a="edit-unit" data-id="${u.id}"><span class="bar" style="background:${c.color}"></span><span class="t"><span class="small muted">${esc(c.name||"")} · ${wkRange(u.start,u.end)}</span><b>${esc(u.title)}</b><span class="prog" style="color:${c.color}"><i style="width:${p}%"></i></span></span><span class="pill p-${u.status}">${STATUS[u.status]}</span></button>`}).join(""):`<div class="empty">Inget arbetsområde pågår just nu. <a href="#planering">Planera ett</a>.</div>`;
 const cov=(usedSubjects().length?"":`<div class="empty">Du har inte valt några ämnen än. <button class="btn pri" data-a="picker">Välj dina ämnen</button></div>`)+usedSubjects().map(sid=>{const s=covSummary(sid,"all");const n=s.n||1;return `<button class="cov-row" data-a="goto-subject" data-id="${sid}"><b>${esc(subj(sid).name)} <span class="muted small">${esc(subj(sid).stage||"")}</span><br><span class="muted small" style="font-weight:400">${esc(FORM_LABEL[formOf(sid)])}</span></b><span class="stack" role="img" aria-label="${s.covered} av ${s.n} täckta"><i class="s-c" style="width:${s.covered/n*100}%"></i><i class="s-o" style="width:${s.ongoing/n*100}%"></i><i class="s-p" style="width:${s.planned/n*100}%"></i></span><span class="num small">${s.pct} % ${s.gap?`<span class="pill p-gap">${s.gap} luckor</span>`:""}</span></button>`}).join("");
 const horizon=addDays(TODAY,35);
 const up=[...state.events.filter(e=>parseD(e.end)>=TODAY&&parseD(e.start)<=horizon).map(e=>({d:e.start,t:e.title,k:e.type==="lov"?"Lov":e.type==="deadline"?"Deadline":"Händelse",c:"var(--muted)"})),
  ...state.units.filter(u=>parseD(u.start)>TODAY&&parseD(u.start)<=horizon).map(u=>({d:u.start,t:u.title,k:"Startar · "+((course(u.courseId)||{}).name||""),c:(course(u.courseId)||{}).color})),
  ...state.assessments.filter(a=>parseD(a.date)>=TODAY&&parseD(a.date)<=horizon).map(a=>({d:a.date,t:a.title,k:"Bedömning · "+((course(a.courseId)||{}).name||""),c:(course(a.courseId)||{}).color}))].sort((a,b)=>a.d<b.d?-1:1);
 const upHtml=up.length?`<div class="list">${up.map(x=>`<div class="li"><span class="when num">v.${isoWeek(parseD(x.d))}<br><span class="small">${shortD(x.d)}</span></span><span class="what"><b>${esc(x.t)}</b><br><span class="small muted"><span class="dot" style="background:${x.c}"></span> ${esc(x.k)}</span></span></div>`).join("")}</div>`:`<div class="empty">Inget inplanerat de närmaste fem veckorna.</div>`;
 const flags=[];state.groups.forEach(g=>g.students.forEach(s=>{const sm=studentSummary(g.id,s.id,"all");if(sm.low>=2)flags.push({g,s,sm})}));
 let ungraded=0,cells=0;state.assessments.filter(a=>parseD(a.date)<=TODAY).forEach(a=>{const g=group(a.groupId);if(!g)return;g.students.forEach(s=>{cells++;if(!((state.grades[a.id]||{})[s.id]))ungraded++})});
 const flagHtml=flags.length?flags.map(f=>`<button class="flag" data-a="student" data-g="${f.g.id}" data-id="${f.s.id}"><span class="pill p-gap">${f.sm.low} låga</span><b style="flex:1">${esc(f.s.name)}</b><span class="small muted">${esc(f.g.name)}</span></button>`).join(""):`<p class="muted small">Ingen elev har två eller fler omdömen under godtagbar nivå.</p>`;
 return `<section class="panel hero">
  <div><div class="weekno num"><small>v.</small>${isoWeek(TODAY)}</div>
   <p style="margin:10px 0 0"><b>${DAY[TODAY.getDay()][0].toUpperCase()+DAY[TODAY.getDay()].slice(1)} ${TODAY.getDate()} ${MON[TODAY.getMonth()]}</b> <span class="muted">· läsår ${state.year.start.slice(2,4)}/${state.year.end.slice(2,4)}</span></p>
   <div class="yearbar" aria-label="${pct} procent av läsåret"><i style="width:${pct}%"></i></div><span class="small muted num">${pct} % av läsåret har gått</span>
   <h2 style="margin-top:18px">Just nu</h2><div class="now-list">${nowHtml}</div></div>
  <div><a href="#arshjul" aria-label="Öppna årshjulet" style="display:block">${wheelSVG("all",true)}</a><div class="wheel-leg">${state.courses.map(c=>`<span><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</span>`).join("")}</div></div>
 </section>
 <div class="grid2">
  <section class="panel"><div class="panel-h"><h2>Täckning av centralt innehåll</h2><span class="sp"></span><a class="btn ghost" href="#innehall">Visa luckor</a></div>${cov}
   <div class="legend"><span><i class="s-c"></i>Genomfört</span><span><i class="s-o"></i>Pågår</span><span><i class="s-p"></i>Planerat</span><span><i style="background:var(--bad-bg)"></i>Lucka</span></div></section>
  <section class="panel"><div class="panel-h"><h2>Kommande fem veckor</h2></div>${upHtml}</section>
 </div>
 ${weekPanel()}
 <section class="panel"><div class="panel-h"><h2>Bedömning</h2><span class="sp"></span><a class="btn ghost" href="#bedomning">Öppna matrisen</a></div>
  <div class="kpis" style="margin-bottom:12px"><div class="kpi"><b class="num">${state.assessments.length}</b><span>bedömningar</span></div><div class="kpi"><b class="num">${state.groups.reduce((n,g)=>n+g.students.length,0)}</b><span>elever</span></div><div class="kpi"><b class="num" style="color:${ungraded?"var(--warn)":"inherit"}">${ungraded}</b><span>saknade omdömen av ${cells}</span></div><div class="kpi"><b class="num" style="color:${flags.length?"var(--bad)":"inherit"}">${flags.length}</b><span>elever att uppmärksamma</span></div></div>
  ${flagHtml}</section>`;
}

function stripFor(c){const weeks=yearWeeks();const CW=34;const us=state.units.filter(u=>u.courseId===c.id).sort((a,b)=>a.start<b.start?-1:1);
 const lanes=[];const placed=us.map(u=>{const si=Math.max(0,weeks.findIndex(w=>addDays(w,6)>=parseD(u.start)));let ei=weeks.findIndex(w=>addDays(w,6)>=parseD(u.end));if(ei<0)ei=weeks.length-1;let lane=lanes.findIndex(l=>l<si);if(lane<0){lane=lanes.length;lanes.push(ei)}else lanes[lane]=ei;return {u,si,ei,lane}});
 const ti=weeks.findIndex(w=>w<=TODAY&&addDays(w,7)>TODAY);
 return `<div class="strip-wrap"><div class="strip" style="width:${weeks.length*CW}px"><div class="wkhead">${weeks.map((w,i)=>`<div class="wk ${inLov(w)?"lov":""} ${i===ti?"today":""}">${isoWeek(w)}</div>`).join("")}</div>
  <div class="lanes" style="height:${Math.max(1,lanes.length)*34+8}px">${placed.map(p=>`<button class="ubar ${p.u.status}" data-a="edit-unit" data-id="${p.u.id}" style="left:${p.si*CW+2}px;width:${(p.ei-p.si+1)*CW-4}px;top:${p.lane*34+4}px;background:${c.color};color:${p.u.status==="planerad"?c.color:"#fff"}" title="${esc(p.u.title)}">${esc(p.u.title)}</button>`).join("")}${ti>=0?`<span class="todayline" style="left:${ti*CW+CW/2}px"></span>`:""}</div></div></div>`}
/* Lodrät veckoplanering: en rad per vecka, en kolumn per dag, plus inlämningar och övrigt */
function weekTable(cs){const ids=new Set(cs.map(c=>c.id));const weeks=yearWeeks();const tw=fmtD(mondayOf(TODAY));const sched=(state.schedule||[]).some(x=>ids.has(x.courseId));
 const rows=weeks.map(w=>{const ws=fmtD(w);const we=fmtD(addDays(w,6));
  const days=[1,2,3,4,5].map(i=>{const ds=fmtD(addDays(w,i-1));let items;
   if(sched)items=dayOccurrences(ds).filter(o=>ids.has(o.course.id)).map(o=>`<button class="wt-i ${o.cancel?"x":""}" data-a="occ" data-slot="${o.slot.id}" data-date="${ds}" style="--cc:${o.course.color}"><span class="wt-t num">${esc(o.slot.start)}${cs.length>1?" · "+esc(o.course.name):""}</span>${o.cancel?`<span>Inställd: ${esc(o.cancel.reason)}</span>`:o.lesson?`<b>${esc(o.lesson.title)}</b>${o.lesson.plan?`<span class="wt-p">${esc(o.lesson.plan)}</span>`:""}`:o.unit?`<span class="muted">${esc(o.unit.title)}</span>`:""}</button>`);
   else items=(state.lessons||[]).filter(l=>l.date===ds).filter(l=>{const u=unit(l.unitId);return ids.has(u?u.courseId:l.courseId)}).map(l=>{const c=course((unit(l.unitId)||{}).courseId||l.courseId)||{};return `<button class="wt-i" data-a="edit-lesson" data-id="${l.id}" style="--cc:${c.color}"><span class="wt-t">${esc(cs.length>1?c.name:"")}</span><b>${esc(l.title||"Lektion")}</b>${l.plan?`<span class="wt-p">${esc(l.plan)}</span>`:""}</button>`});
   return `<td>${items.join("")}</td>`}).join("");
  const due=state.assessments.filter(a=>ids.has(a.courseId)&&a.date>=ws&&a.date<=we).map(a=>`<button class="wt-i" data-a="edit-assess" data-id="${a.id}" style="--cc:${(course(a.courseId)||{}).color}"><b>${esc(a.title)}</b><span class="wt-t">${shortD(a.date)}${a.type?" · "+esc(ATYPES[a.type]||""):""}</span></button>`).join("");
  const ev=eventsIn(w,addDays(w,6)).map(evTag).join("");
  return `<tr class="${ws===tw?"cur":""} ${inLov(w)?"lov":""}" ${ws===tw?'id="wtnow"':""}><th class="num">v.${isoWeek(w)}<span class="small muted">${w.getDate()}/${w.getMonth()+1}</span></th>${days}<td>${due}</td><td>${ev}</td></tr>`}).join("");
 setTimeout(()=>{const el=document.getElementById("wtnow"),box=document.getElementById("wtbox");if(el&&box)box.scrollTop=el.offsetTop-60},0);
 return `${sched?"":`<p class="small muted" style="margin:0 0 8px">Lägg in ditt veckoschema under Schema så fylls dagarna med dina lektioner. Tryck på en lektion för att skriva planen.</p>`}<div class="wt-wrap" id="wtbox"><table class="wt"><thead><tr><th>Vecka</th><th>Måndag</th><th>Tisdag</th><th>Onsdag</th><th>Torsdag</th><th>Fredag</th><th>Inlämningar</th><th>Övrigt</th></tr></thead><tbody>${rows}</tbody></table></div>`}
function vPlanning(){
 if(!state.courses.length)return `<section class="panel"><div class="empty"><p>Du har inga kurser ännu.</p><button class="btn pri" data-a="new-course">Skapa första kursen</button></div></section>`;
 const all=ui.course==="all";if(!all&&!course(ui.course))ui.course=state.courses[0].id;const c=all?null:course(ui.course);const pv=ui.planView==="veckor"?"veckor":"tidslinje";
 const chips=`<button class="chip" aria-pressed="${all}" data-a="sel-course" data-id="all">Alla kurser</button>`+state.courses.map(x=>`<button class="chip" aria-pressed="${!all&&x.id===c.id}" data-a="sel-course" data-id="${x.id}"><span class="dot" style="background:${x.color}"></span>${esc(x.name)}</button>`).join("");
 const seg=`<div class="seg" role="group" aria-label="Visa planeringen som"><button aria-pressed="${pv==="tidslinje"}" data-a="planview" data-v="tidslinje">Tidslinje</button><button aria-pressed="${pv==="veckor"}" data-a="planview" data-v="veckor">Veckor</button></div>`;
 const top=`<section class="panel"><div class="toolbar">${seg}<div class="chips">${chips}</div><span class="sp"></span><button class="btn ghost" data-a="how">Så hänger det ihop</button><button class="btn" data-a="import-course">Importera kurs</button><button class="btn" data-a="new-course">+ Ny kurs</button></div></section>`;
 if(pv==="veckor"){const cs=all?state.courses:[c];return top+`<section class="panel"><div class="panel-h"><h1>${all?"Alla kurser":esc(c.name)}</h1><span class="sp"></span>${all?`<button class="btn" data-a="new-task">+ Uppgift</button>`:`<button class="btn" data-a="new-task" data-id="${c.id}">+ Uppgift</button><button class="btn pri" data-a="new-unit">+ Arbetsområde</button>`}</div>${weekTable(cs)}</section>`}
 if(all)return top+state.courses.map(x=>{const sm=covSummary(x.subjectId,x.id);return `<section class="panel"><div class="panel-h"><span class="dot" style="background:${x.color};width:14px;height:14px"></span><h2>${esc(x.name)}</h2><span class="small muted">${sm.pct} % genomfört · ${sm.gap} luckor</span><span class="sp"></span><button class="btn" data-a="new-task" data-id="${x.id}">+ Uppgift</button><button class="btn" data-a="sel-course" data-id="${x.id}">Öppna</button></div>${stripFor(x)}</section>`}).join("")+`<p class="small muted">Veckonummer. Randiga veckor är lov. Streckade staplar är planerade. Tryck på ett arbetsområde för att öppna det.</p>`;
 const us=state.units.filter(u=>u.courseId===c.id).sort((a,b)=>a.start<b.start?-1:1);const g=group(c.groupId);
 const cards=us.length?`<div class="units">${us.map(u=>{const na=state.assessments.filter(a=>a.unitId===u.id).length;const ls=lessonsOf(u.id);return `<button class="ucard" data-a="edit-unit" data-id="${u.id}" style="border-left-color:${c.color}"><span class="meta"><span class="pill p-${u.status}">${STATUS[u.status]}</span><span class="num">${wkRange(u.start,u.end)}</span></span><b>${esc(u.title)}</b>${u.desc?`<span class="small muted">${esc(u.desc)}</span>`:""}<span class="meta"><span>${(u.contentIds||[]).length} delar av centralt innehåll</span>${na?`<span>· ${na} uppgift${na>1?"er":""}</span>`:""}${ls.length?`<span>· ${ls.filter(l=>l.done).length}/${ls.length} lektioner</span>`:""}${(()=>{const k=unitCapacity(state,u);return k?`<span>· ${k.available} pass i schemat${k.cancelled?` <span class="lowtag">(${k.cancelled} inställda)</span>`:""}</span>`:""})()}</span></button>`}).join("")}</div>`:`<div class="empty">Inga arbetsområden ännu.</div>`;
 const tasks=state.assessments.filter(a=>a.courseId===c.id).sort((x,y)=>x.date<y.date?-1:1);
 const tlist=`<div class="panel-h" style="margin-top:18px"><h2>Uppgifter</h2><span class="sp"></span><button class="btn" data-a="new-task" data-id="${c.id}">+ Uppgift</button></div>${tasks.length?`<div class="list">${tasks.map(a=>`<div class="li" style="cursor:pointer" data-a="edit-assess" data-id="${a.id}"><span class="when num">${shortD(a.date)}</span><span class="what"><b>${esc(a.title)}</b> ${a.type?`<span class="tag">${esc(ATYPES[a.type]||"")}</span>`:""}<br><span class="small muted">${esc((unit(a.unitId)||{}).title||"Inget arbetsområde")}</span></span></div>`).join("")}</div>`:`<p class="small muted" style="margin:0">Inga uppgifter ännu. En uppgift kan vara ett prov, en inlämning, ett seminarium eller annat som du bedömer under Bedömning.</p>`}`;
 const sum=covSummary(c.subjectId,c.id);
 return top+`<section class="panel"><div class="panel-h"><span class="dot" style="background:${c.color};width:14px;height:14px"></span><h1>${esc(c.name)}</h1><span class="sp"></span><button class="btn" data-a="share-course" data-id="${c.id}">Dela kurs</button><button class="btn" data-a="edit-course" data-id="${c.id}">Redigera kurs</button><button class="btn" data-a="new-task" data-id="${c.id}">+ Uppgift</button><button class="btn pri" data-a="new-unit">+ Arbetsområde</button></div>
  <p class="muted small" style="margin:-4px 0 14px">${esc((subj(c.subjectId)||{}).name||"Inget ämne")} ${esc((subj(c.subjectId)||{}).stage||"")} · ${g?esc(g.name)+", "+g.students.length+" elever":"ingen elevgrupp"} · <b>${sum.pct} %</b> av centralt innehåll genomfört, ${sum.gap} luckor</p>
  ${stripFor(c)}<p class="small muted" style="margin:6px 0 16px">Veckonummer. Randiga veckor är lov. Streckade staplar är planerade.</p>${cards}${tlist}</section>`;
}

function arcPath(r1,r2,a1,a2){const p=(r,a)=>[(r*Math.cos(a)).toFixed(2),(r*Math.sin(a)).toFixed(2)];const large=a2-a1>Math.PI?1:0;const [x1,y1]=p(r2,a1),[x2,y2]=p(r2,a2),[x3,y3]=p(r1,a2),[x4,y4]=p(r1,a1);return `M${x1} ${y1}A${r2} ${r2} 0 ${large} 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 ${large} 0 ${x4} ${y4}Z`}
function wheelSVG(filter,mini){
 const y0=parseD(state.year.start).getFullYear();const anchor=new Date(y0,7,1);const span=new Date(y0+1,7,1)-anchor;
 const ang=d=>((parseD(typeof d==="string"?d:fmtD(d))-anchor)/span)*Math.PI*2-Math.PI/2;
 const cs=state.courses.filter(c=>filter==="all"||c.id===filter);const R0=78,R1=196;const n=Math.max(cs.length,1);const rw=(R1-R0)/n;
 let s=`<svg class="wheel" viewBox="-250 -250 500 500" role="img" aria-label="Årshjul för läsåret">`;
 for(let m=0;m<12;m++){const a=((new Date(y0,7+m,1)-anchor)/span)*Math.PI*2-Math.PI/2;const am=((new Date(y0,7+m,15)-anchor)/span)*Math.PI*2-Math.PI/2;
  s+=`<line x1="${(R0-6)*Math.cos(a)}" y1="${(R0-6)*Math.sin(a)}" x2="${222*Math.cos(a)}" y2="${222*Math.sin(a)}" stroke="var(--line)"/>`;
  s+=`<text class="mlabel" x="${(234*Math.cos(am)).toFixed(1)}" y="${(234*Math.sin(am)).toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${MON[(7+m)%12]}</text>`}
 cs.forEach((c,i)=>{const r1=R0+i*rw+2,r2=R0+(i+1)*rw-2;s+=`<circle class="ring" r="${(r1+r2)/2}" stroke-width="${r2-r1}" style="stroke:var(--soft)"/>`;

  state.units.filter(u=>u.courseId===c.id).forEach(u=>{const a1=ang(u.start),a2=ang(fmtD(addDays(parseD(u.end),1)));if(a2<=a1)return;
   const op=u.status==="planerad"?.45:u.status==="pagar"?.85:1;s+=`<path class="arc" ${mini?"":`data-a="edit-unit" data-id="${u.id}" tabindex="0"`} d="${arcPath(r1,r2,a1,a2-0.004)}" fill="${c.color}" opacity="${op}"><title>${esc(c.name)}: ${esc(u.title)} (${wkRange(u.start,u.end)})</title></path>`})});
 if(!mini)cs.forEach((c,i)=>{const r=R0+(i+.5)*rw;s+=`<text class="rlabel" x="0" y="${(-r).toFixed(1)}" text-anchor="middle" dominant-baseline="central" style="font-size:${Math.max(10,Math.min(13,rw*.5)).toFixed(0)}px">${esc(c.name)}</text>`});
 state.events.forEach(e=>{const a1=ang(e.start),a2=ang(fmtD(addDays(parseD(e.end),1)));const col=e.type==="lov"?"var(--muted)":e.type==="deadline"?"var(--bad)":"var(--warn)";
  if(a2-a1>0.03)s+=`<path d="${arcPath(201,211,a1,a2)}" fill="${col}" opacity=".7"><title>${esc(e.title)}</title></path>`;else s+=`<circle cx="${206*Math.cos(a1)}" cy="${206*Math.sin(a1)}" r="5" fill="${col}"><title>${esc(e.title)} ${shortD(e.start)}</title></circle>`});
 const at=ang(TODAY);s+=`<line x1="${(R0-10)*Math.cos(at)}" y1="${(R0-10)*Math.sin(at)}" x2="${216*Math.cos(at)}" y2="${216*Math.sin(at)}" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round"/><circle cx="${216*Math.cos(at)}" cy="${216*Math.sin(at)}" r="5" fill="var(--ink)"/>`;
 s+=`<text x="0" y="-8" text-anchor="middle" style="font-family:var(--display);font-weight:800;font-size:30px">v.${isoWeek(TODAY)}</text>${mini?"":(()=>{const n=activeUnits(cs,TODAY,TODAY).length;return `<text x="0" y="36" text-anchor="middle" style="font-size:12px;fill:var(--muted)">${n?"nu: "+n+" område"+(n>1?"n":""):"inget pågår nu"}</text>`})()}<text x="0" y="18" text-anchor="middle" style="font-size:12px;fill:var(--muted)">läsår ${state.year.start.slice(2,4)}/${state.year.end.slice(2,4)}</text></svg>`;
 return s}
/* ---------- läsåret: fyra visningar ---------- */
const MONTH_FULL=["januari","februari","mars","april","maj","juni","juli","augusti","september","oktober","november","december"];
const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);
function activeUnits(cs,a,b){const ids=new Set(cs.map(c=>c.id));return state.units.filter(u=>ids.has(u.courseId)&&parseD(u.start)<=b&&parseD(u.end)>=a)}
const unitBtn=(u,extra="")=>{const c=course(u.courseId)||{};return `<button class="uchip ${u.status}" data-a="edit-unit" data-id="${u.id}" style="--cc:${c.color}"><span class="dot" style="background:${c.color}"></span>${esc(u.title)}${extra}</button>`};
function eventsIn(a,b){return state.events.filter(e=>parseD(e.start)<=b&&parseD(e.end)>=a).sort((x,y)=>x.start<y.start?-1:1)}
const evTag=e=>`<span class="evtag ${e.type}" data-a="edit-event" data-id="${e.id}">${esc(e.title)}${e.from&&e.to?` <span class="num">${esc(e.from)}–${esc(e.to)}</span>`:""}</span>`;

function yearBand(cs){
 const t0=mondayOf(parseD(state.year.start)),t1=addDays(parseD(state.year.end),1);const span=t1-t0;const pct=d=>Math.max(0,Math.min(100,(d-t0)/span*100));
 const months=[];for(let d=new Date(t0.getFullYear(),t0.getMonth(),1);d<t1;d=new Date(d.getFullYear(),d.getMonth()+1,1)){const a=d<t0?t0:d;const b=new Date(d.getFullYear(),d.getMonth()+1,1);months.push({l:MON[d.getMonth()],x:pct(a),w:pct(b>t1?t1:b)-pct(a)})}
 const lov=state.events.filter(e=>e.type==="lov").map(e=>`<span class="band-lov" style="left:${pct(parseD(e.start))}%;width:${pct(addDays(parseD(e.end),1))-pct(parseD(e.start))}%" title="${esc(e.title)}"></span>`).join("");
 const today=TODAY>=t0&&TODAY<t1?`<span class="band-today" style="left:${pct(TODAY)}%"></span>`:"";
 const rows=cs.map(c=>{const us=state.units.filter(u=>u.courseId===c.id).sort((a,b)=>a.start<b.start?-1:1);const lanes=[];
  const bars=us.map(u=>{const a=parseD(u.start),b=addDays(parseD(u.end),1);let l=lanes.findIndex(x=>x<=a);if(l<0){l=lanes.length;lanes.push(b)}else lanes[l]=b;
   return `<button class="band-bar ${u.status}" data-a="edit-unit" data-id="${u.id}" style="left:${pct(a)}%;width:calc(${pct(b)-pct(a)}% - 3px);top:${l*30+4}px;--cc:${c.color}" title="${esc(u.title)} (${wkRange(u.start,u.end)})">${esc(u.title)}</button>`}).join("");
  return `<div class="band-row"><div class="band-name"><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</div><div class="band-track" style="height:${Math.max(1,lanes.length)*30+8}px">${lov}${bars||'<span class="small muted" style="position:absolute;left:8px;top:9px">Inga arbetsområden</span>'}${today}</div></div>`}).join("");
 const evs=state.events.filter(e=>e.type!=="lov").map(e=>`<button class="band-ev ${e.type}" data-a="edit-event" data-id="${e.id}" style="left:${pct(parseD(e.start))}%" title="${esc(e.title)} ${shortD(e.start)}"></button>`).join("");
 return `<div class="band-wrap"><div class="band">
  <div class="band-row band-head"><div class="band-name"></div><div class="band-track band-months">${months.map(m=>`<span style="left:${m.x}%;width:${m.w}%">${m.l}</span>`).join("")}</div></div>
  ${rows||`<div class="empty">Inga kurser att visa.</div>`}
  <div class="band-row"><div class="band-name small muted">Händelser</div><div class="band-track" style="height:26px">${lov}${evs}${today}</div></div>
 </div></div>
 <div class="legend"><span><i style="background:var(--accent)"></i>Genomförd eller pågår</span><span><i style="border:2px dashed var(--muted);background:none"></i>Planerad</span><span><i class="s-p"></i>Lov</span><span><i style="background:var(--ink);width:3px"></i>Idag</span></div>`}

function yearMonths(cs){const out=[];const t0=parseD(state.year.start),t1=parseD(state.year.end);
 for(let d=new Date(t0.getFullYear(),t0.getMonth(),1);d<=t1;d=new Date(d.getFullYear(),d.getMonth()+1,1)){const a=d,b=new Date(d.getFullYear(),d.getMonth()+1,0);
  const now=TODAY>=a&&TODAY<=b;const us=activeUnits(cs,a,b);
  const lines=cs.map(c=>{const u=us.filter(x=>x.courseId===c.id);return u.length?`<div class="mrow"><span class="small muted mcourse">${esc(c.name)}</span><div class="chips">${u.map(x=>unitBtn(x)).join("")}</div></div>`:""}).join("");
  const ev=eventsIn(a,b);
  out.push(`<div class="mcell ${now?"cur":""}"><div class="mhead"><b>${cap(MONTH_FULL[d.getMonth()])}</b>${now?'<span class="pill p-pagar">Nu</span>':""}<span class="sp"></span><span class="small muted">v.${isoWeek(a<t0?t0:a)}–${isoWeek(b>t1?t1:b)}</span></div>${lines||'<span class="small muted">Inget planerat</span>'}${ev.length?`<div class="mev">${ev.map(evTag).join("")}</div>`:""}</div>`)}
 return `<div class="mgrid">${out.join("")}</div>`}

function yearWeekList(cs){const rows=yearWeeks().map(w=>{const e=addDays(w,4);const now=w<=TODAY&&addDays(w,7)>TODAY;const us=activeUnits(cs,w,e);
  const starts=us.filter(u=>parseD(u.start)>=w),ends=us.filter(u=>parseD(u.end)<=addDays(w,6));const ev=eventsIn(w,addDays(w,6));const lov=inLov(w);
  return `<div class="wrow ${now?"cur":""} ${lov?"lov":""}" ${now?'id="thisweek"':""}><div class="wnum"><b>v.${isoWeek(w)}</b><span class="small muted">${w.getDate()} ${MON[w.getMonth()]}</span></div>
   <div class="wbody">${us.length?`<div class="chips">${us.map(u=>unitBtn(u,starts.includes(u)?' <span class="wflag">startar</span>':ends.includes(u)?' <span class="wflag">slutar</span>':"")).join("")}</div>`:`<span class="small muted">${lov?"":"Inget planerat"}</span>`}${ev.length?`<div class="mev">${ev.map(evTag).join("")}</div>`:""}</div></div>`}).join("");
 return `<div class="wlist" id="weekbox">${rows}</div>`}

function vWheel(){
 if(ui.wheel!=="all"&&!course(ui.wheel))ui.wheel="all";
 const mode=["hjul","band","manader","veckor"].includes(ui.wheelMode)?ui.wheelMode:"hjul";
 const cs=state.courses.filter(c=>ui.wheel==="all"||c.id===ui.wheel);
 const chips=`<button class="chip" aria-pressed="${ui.wheel==="all"}" data-a="wheel" data-id="all">Alla kurser</button>`+state.courses.map(c=>`<button class="chip" aria-pressed="${ui.wheel===c.id}" data-a="wheel" data-id="${c.id}"><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</button>`).join("");
 const modes=[["hjul","Hjul","arshjul"],["band","Band",""],["manader","Månader",""],["veckor","Veckor",""]];
 const seg=`<div class="seg" role="group" aria-label="Visa läsåret som">${modes.map(([k,l])=>`<button aria-pressed="${mode===k}" data-a="wheelmode" data-v="${k}">${l}</button>`).join("")}</div>`;
 const ev=[...state.events].sort((a,b)=>a.start<b.start?-1:1);
 const tl=EVENT_TYPES;
 const evPanel=`<section class="panel"><div class="panel-h"><h2>Händelser och lov</h2><span class="sp"></span><button class="btn" data-a="import-cal">Importera</button><button class="btn pri" data-a="new-event">+ Händelse</button></div>
  ${ev.length?`<div class="list">${ev.map(e=>`<div class="li" style="cursor:pointer" data-a="edit-event" data-id="${e.id}"><span class="when num">${wkRange(e.start,e.end)}</span><span class="what"><b>${esc(e.title)}</b><br><span class="small muted">${shortD(e.start)}${e.end!==e.start?" – "+shortD(e.end):""}</span></span><span class="pill ${e.type==="lov"?"p-planerad":e.type==="deadline"?"p-gap":"p-warn"}">${tl[e.type]||"Händelse"}</span></div>`).join("")}</div>`:`<div class="empty">Inga händelser ännu.</div>`}</section>`;
 const head=`<section class="panel"><div class="toolbar">${seg}<span class="sp"></span><div class="chips">${chips}</div></div></section>`;
 if(mode==="hjul")return head+`<div class="grid2 wide-l"><section class="panel">${wheelSVG(ui.wheel,false)}
  <div class="wheel-leg">${cs.map(c=>`<span><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</span>`).join("")}</div>
  <div class="legend" style="justify-content:center"><span><i style="background:var(--muted)"></i>Lov (yttersta ringen)</span><span><i style="background:var(--bad)"></i>Deadline</span><span><i style="background:var(--warn)"></i>Händelse</span></div>
  <p class="small muted" style="text-align:center;margin:8px 0 0">Kursens namn står vid ringen. Starka färger är genomförda, ljusa är planerade. Tryck på en båge för att öppna arbetsområdet.</p></section>${evPanel}</div>`;
 const body=mode==="band"?yearBand(cs):mode==="manader"?yearMonths(cs):yearWeekList(cs);
 const hint={band:"En rad per kurs. Tryck på ett arbetsområde för att öppna det.",manader:"Vad som pågår varje månad, som en väggkalender.",veckor:"Läsåret vecka för vecka. Den här veckan är markerad."}[mode];
 if(mode==="veckor")setTimeout(()=>{const el=document.getElementById("thisweek"),box=document.getElementById("weekbox");if(el&&box)box.scrollTop=el.offsetTop-box.offsetTop-60},0);
 return head+`<section class="panel"><p class="small muted" style="margin:0 0 12px">${hint}</p>${body}</section>${evPanel}`}

/* betygskriterierna för ämnet, uppdelade i delar, med hur ofta varje del bedömts */
function critView(s,cs){const cr=s.official?critFor(s.id):null;
 if(!cr)return `<div class="empty">Det finns inga betygskriterier från Skolverket för ${esc(s.name)} ${esc(s.stage||"")} i Lärarbordet.</div>`;
 const ids=cs.map(c=>c.id);const used={};state.assessments.filter(a=>ids.includes(a.courseId)).forEach(a=>(a.aspects||[]).forEach(i=>(used[i]=used[i]||[]).push(a)));
 return `<p class="small muted" style="margin:0 0 10px">Betygskriterierna${cr.year?" för slutet av åk "+esc(cr.year):""}, Varje ruta med tjock kant är ett helt kriterium, uppdelat i sina delar. Siffran visar hur många uppgifter som bedömer delen, så att du ser om någon del får för lite eller för mycket fokus.</p>
 <div class="crit-list">${cr.aspects.map((A,i)=>{const lv=cr.levels.filter(k=>A[k]);const n=(used[i]||[]).length;
  const P=critParts(A,cr.levels);return `<div class="cm"><div class="cm-h"><span>Kriterium ${i+1}${P.length>1?` <span class="small muted" style="font-weight:500">· ${P.length} delar</span>`:""}</span><span class="sp"></span><span class="pill ${n?"p-warn":"p-gap"}" title="${esc((used[i]||[]).map(a=>a.title).join(", "))}">${n?"bedömt i "+n+" uppgift"+(n>1?"er":""):"inte bedömt än"}</span></div>${P.map((pt,j)=>`${P.length>1?`<div class="cm-part">Del ${j+1}</div>`:""}<div class="cm-g" style="--n:${lv.length}">${lv.map(k=>`<div class="cm-c" style="cursor:default"><span class="lvn">${esc(cr.names[k])}</span><span>${critText(pt[k]||"")}</span></div>`).join("")}</div>`).join("")}</div>`}).join("")}</div>
 <p class="small muted" style="margin-top:12px">Ordagrant från Skolverkets betygskriterier.</p>`}

function vContent(){
 const subs=usedSubjects().map(subj);
 if(!subs.length)return `<section class="panel"><div class="empty"><h2 style="margin-bottom:8px">Välj vilka ämnen du undervisar i</h2><p>Allt centralt innehåll för grundskolan, anpassade grundskolan, ämnesområden och gymnasieskolan finns inbyggt, hämtat från Skolverket. Välj de ämnen och årskurser eller nivåer du har.</p><button class="btn pri" data-a="picker">Välj ämnen</button> <button class="btn" data-a="new-subject">+ Eget ämne</button></div></section>`;
 if(!subs.some(x=>x.id===ui.subject))ui.subject=subs[0].id;const s=subj(ui.subject);
 const cs=state.courses.filter(c=>c.subjectId===s.id);if(ui.subjFilter!=="all"&&!cs.some(c=>c.id===ui.subjFilter))ui.subjFilter="all";
 const cov=coverage(s.id,ui.subjFilter);const sum=covSummary(s.id,ui.subjFilter);
 const chips=subs.map(x=>{const g=covSummary(x.id,"all").gap;return `<button class="chip" aria-pressed="${x.id===s.id}" data-a="sel-subject" data-id="${x.id}">${esc(x.name)} ${esc(x.stage||"")}${g?` <span class="pill p-gap" style="padding:0 6px">${g}</span>`:""}</button>`}).join("");
 const notAssessed=Object.values(cov).filter(r=>r.state==="covered"&&!r.assessed&&!r.manual).length;
 const areas=s.areas.map(a=>{const items=a.items.filter(i=>!ui.gapsOnly||cov[i.id].state==="gap");const ac=a.items.filter(i=>cov[i.id].state==="covered").length;
  if(ui.gapsOnly&&!items.length)return "";
  return `<div class="area"><div class="area-h"><h3>${esc(a.name)}</h3><span class="small muted num">${ac}/${a.items.length} genomförda${(()=>{const n=new Set(a.items.flatMap(i=>cov[i.id].tests)).size;return n?` · bedömt i ${n} uppgift${n>1?"er":""}`:""})()}</span><span class="sp" style="flex:1"></span><button class="btn ghost small" data-a="add-item" data-area="${a.id}">+ Eget innehåll</button></div>
  ${items.map(i=>{const r=cov[i.id];const lab={covered:"Genomfört",ongoing:"Pågår",planned:"Planerat",gap:"Lucka"}[r.state];
   return `<div class="item ${r.state==="gap"?"gap":""}"><button class="check" role="checkbox" aria-checked="${r.manual}" aria-label="Markera som täckt utanför planeringen" title="Markera som täckt utanför planeringen" data-a="toggle-manual" data-id="${i.id}">${r.manual?CHECK:""}</button>
   <div class="txt">${esc(i.text)}${i.custom?' <span class="small muted">(eget)</span>':""}<div class="links"><span class="pill p-${r.state}">${lab}</span>${r.manual?'<span class="pill p-covered">Manuellt avbockat</span>':""}${r.assessed?`<span class="pill p-warn" title="${esc(r.tests.map(a=>a.title).join(", "))}">Bedömt${r.tests.length>1?" "+r.tests.length+" gånger":r.tests.length?" 1 gång":""}</span>`:""}${r.units.map(u=>`<button class="ulink" data-a="edit-unit" data-id="${u.id}"><span class="dot" style="background:${(course(u.courseId)||{}).color};width:7px;height:7px"></span> ${esc(u.title)}</button>`).join("")}${i.custom?`<button class="ulink" data-a="del-item" data-id="${i.id}">Ta bort</button>`:""}</div></div></div>`}).join("")}</div>`}).join("");
 return `<section class="panel"><div class="toolbar"><div class="chips">${chips}</div><span class="sp"></span><button class="btn" data-a="picker">Välj ämnen</button></div></section>
 <section class="panel"><div class="panel-h"><div><h1>${esc(s.name)} <span class="muted" style="font-weight:500">${esc(s.stage||"")}</span></h1><span class="small muted">${esc(FORM_LABEL[s.form||"X"])}</span></div><span class="sp"></span>
  ${cs.length>1?`<select class="inline" id="subjfilter" aria-label="Filtrera på kurs"><option value="all">Alla kurser i ämnet</option>${cs.map(c=>`<option value="${c.id}" ${ui.subjFilter===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select>`:""}
  <div class="seg"><button aria-pressed="${ui.cview!=="krit"}" data-a="cview" data-v="ci">Centralt innehåll</button><button aria-pressed="${ui.cview==="krit"}" data-a="cview" data-v="krit">Betygskriterier</button></div>
  ${ui.cview==="krit"?"":`<div class="seg"><button aria-pressed="${!ui.gapsOnly}" data-a="gaps" data-v="0">Allt</button><button aria-pressed="${ui.gapsOnly}" data-a="gaps" data-v="1">Bara luckor</button></div>`}</div>
  <div class="kpis" style="margin-bottom:10px"><div class="kpi"><b class="num">${sum.pct} %</b><span>genomfört</span></div><div class="kpi"><b class="num">${sum.ongoing+sum.planned}</b><span>pågår eller planerat</span></div><div class="kpi"><b class="num" style="color:${sum.gap?"var(--bad)":"inherit"}">${sum.gap}</b><span>luckor</span></div><div class="kpi"><b class="num">${notAssessed}</b><span>genomfört men ej bedömt</span></div></div>
  <span class="stack" style="margin-bottom:16px"><i class="s-c" style="width:${sum.covered/(sum.n||1)*100}%"></i><i class="s-o" style="width:${sum.ongoing/(sum.n||1)*100}%"></i><i class="s-p" style="width:${sum.planned/(sum.n||1)*100}%"></i></span>
  ${cs.length?"":`<p class="example" style="margin-bottom:12px">Ingen kurs är kopplad till ${esc(s.name)} ännu, så allt räknas som lucka. Skapa en kurs under Planering.</p>`}
  ${ui.cview==="krit"?critView(s,cs):(areas||'<div class="empty">Inga luckor. Allt centralt innehåll är planerat eller genomfört.</div>')}
  <p class="small muted" style="margin-top:16px">${s.official?`Centralt innehåll ordagrant från Skolverkets kurs- och ämnesplaner (hämtat ${esc(CAT.fetched)}). `:""}Bocka i rutan när innehållet täckts utanför planeringen, t.ex. i ett ämnesövergripande projekt.</p></section>`;
}

/* fördelning för en bedömning: antal och procent per steg (eller genomfört/ej), samt snittpoäng */
function howModal(){modal("Så hänger det ihop",`<div class="helpbox"><b>Kurs</b> är ett ämne med en elevgrupp, t.ex. Svenska 8B eller Engelska 5 med gruppen TE22a. Den har en färg som syns i årshjulet och schemat.</div>
 <div class="helpbox"><b>Arbetsområde</b> är en period i kursen, t.ex. Novellen v.45–49. Du bockar i vilket <b>centralt innehåll</b> det täcker. Status Planerad, Pågår, Genomförd och Bedömd syns under Centralt innehåll, så att du ser luckor.</div>
 <div class="helpbox"><b>Lektioner</b> hör till ett arbetsområde. Lägger du in ditt schema räknar Lärarbordet ut vilka lektioner som blir inställda av lov och aktiviteter. Tryck på en lektion i veckovyn för att skriva planen direkt.</div>
 <div class="helpbox"><b>Uppgifter och bedömningar</b> skapar du i ett arbetsområde eller under Bedömning. De <b>behöver inte</b> finnas: ett arbetsområde kan vara genomfört utan att något bedöms. Kopplar du en bedömning till ett arbetsområde räknas dess innehåll som bedömt.</div>
 <div class="helpbox"><b>Bedömning</b> görs per elev mot de betygskriterier du väljer för uppgiften. Tryck på kriterietexterna (gult delvis, grönt visat, rött inte visat), sätt ett betygssteg direkt, eller välj Genomfört / ej genomfört. Poäng kan läggas till.</div>
 <div class="actions"><span class="sp"></span><button class="btn pri" data-a="close">Klart</button></div>`)}
function resultOf(a,g){const gs=state.grades[a.id]||{};const sc=scale();
 const lv=a.mode==="gk"?[{k:"G",l:"Genomfört",t:1},{k:"EG",l:"Ej genomfört",t:0}]:sc.levels.map((l,i)=>({k:l.k,l:l.l,t:i/(sc.levels.length-1)}));
 const ks=g.students.map(s=>(gs[s.id]||{}).k).filter(k=>k&&lv.some(x=>x.k===k));const done=ks.length;
 const rows=lv.map(x=>{const n=ks.filter(k=>k===x.k).length;return Object.assign({},x,{n,pct:done?Math.round(n/done*100):0})});
 const ps=g.students.map(s=>(gs[s.id]||{}).p).filter(p=>p!=null);const avg=ps.length?Math.round(ps.reduce((x,y)=>x+y,0)/ps.length*10)/10:null;
 return {rows,done,avg,np:ps.length}}
function resultsModal(){const g=group(ui.group);if(!g)return;const as=state.assessments.filter(a=>a.groupId===g.id&&(ui.acourse==="all"||a.courseId===ui.acourse)).sort((x,y)=>x.date<y.date?-1:1);
 let f=ui.resType||"alla";const types=[...new Set(as.map(a=>a.type).filter(Boolean))];
 const draw=()=>{const list=as.filter(a=>f==="alla"||(f==="np"?["np","diagnos","halvkurs"].includes(a.type):a.type===f));
  return `<div class="chips" style="margin-bottom:10px"><button class="chip" aria-pressed="${f==="alla"}" data-rf="alla">Alla</button><button class="chip" aria-pressed="${f==="np"}" data-rf="np">NP, diagnoser, halvkursprov</button>${types.filter(t=>!["np","diagnos","halvkurs"].includes(t)).map(t=>`<button class="chip" aria-pressed="${f===t}" data-rf="${t}">${esc(ATYPES[t]||t)}</button>`).join("")}</div>
  ${list.length?`<div class="mx-wrap"><table class="res-t"><thead><tr><th>Uppgift</th><th>Fördelning</th><th>Andel per steg</th><th>Poäng</th></tr></thead><tbody>${list.map(a=>{const r=resultOf(a,g);
   return `<tr><td><b>${esc(a.title)}</b><br><span class="small muted">${shortD(a.date)}${a.type?" · "+esc(ATYPES[a.type]||""):""} · ${r.done}/${g.students.length} bedömda</span></td><td><div class="res-bar">${r.rows.map(x=>x.n?`<i style="width:${x.pct}%;background:hsl(${hueT(x.t)} 55% 55%)" title="${esc(x.l)}: ${x.pct} %"></i>`:"").join("")}</div></td>
    <td class="small" style="text-align:left">${r.done?r.rows.filter(x=>x.n).map(x=>`<span style="white-space:nowrap"><b>${esc(x.l)}</b> ${x.pct}&nbsp;%</span>`).join(" · "):"–"}</td><td class="small num">${r.avg!=null?`snitt ${r.avg}${a.max?" av "+a.max:""}`:"–"}</td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty">Inga uppgifter av den typen. Välj typ, t.ex. Nationellt prov, när du skapar en bedömning.</div>`}`};
 modal("Resultat för "+g.name,`<div id="resb">${draw()}</div><div class="actions"><span class="sp"></span><button class="btn pri" data-a="close">Klart</button></div>`,m=>{const bind=()=>m.querySelectorAll("[data-rf]").forEach(b=>b.onclick=()=>{f=ui.resType=b.dataset.rf;m.querySelector("#resb").innerHTML=draw();bind()});bind()})}

function vAssess(){
 if(!state.groups.length)return `<section class="panel"><div class="empty"><p>Lägg till en elevgrupp för att börja bedöma.</p><button class="btn pri" data-a="edit-group">+ Elevgrupp</button></div></section>`;
 if(!group(ui.group))ui.group=state.groups[0].id;const g=group(ui.group);
 const gcourses=state.courses.filter(c=>c.groupId===g.id||state.assessments.some(a=>a.groupId===g.id&&a.courseId===c.id));
 if(ui.acourse!=="all"&&!gcourses.some(c=>c.id===ui.acourse))ui.acourse="all";
 const as=state.assessments.filter(a=>a.groupId===g.id&&(ui.acourse==="all"||a.courseId===ui.acourse)).sort((a,b)=>(a.courseId+a.date)<(b.courseId+b.date)?-1:1);
 const sc=scale();
 const head=as.map(a=>{const c=course(a.courseId)||{};return `<th data-a="edit-assess" data-id="${a.id}" style="box-shadow:inset 0 3px 0 ${c.color||"transparent"}" title="${esc(c.name||"")}">${esc(a.title)}<span class="d">${shortD(a.date)}${a.type?" · "+esc(ATYPES[a.type]||""):""}${ui.acourse==="all"?" · "+esc((c.name||"").split(" ")[0]):""}</span></th>`}).join("");
 const rows=g.students.map(s=>{const sm=studentSummary(g.id,s.id,ui.acourse);const mk=sm.m==null?null:sc.levels[sm.m];
  return `<tr><td class="name"><button data-a="student" data-g="${g.id}" data-id="${s.id}">${esc(s.name)}</button></td>${as.map(a=>{const v=(state.grades[a.id]||{})[s.id];const t=v?gradeT(v.k):null;
   return `<td><button class="cell ${t!=null?"g":""}" style="${t!=null?`--h:${hueT(t)}`:""}" data-a="grade" data-as="${a.id}" data-st="${s.id}" aria-label="${esc(s.name)}, ${esc(a.title)}: ${v&&v.k?esc(v.k):"ej bedömt"}">${v&&v.k?esc(v.k):v&&v.p!=null?"":'<span class="muted">·</span>'}${v&&v.p!=null?`<span class="small num" style="display:block;font-weight:500;font-size:.7rem">${v.p}p</span>`:""}${v&&v.note?'<span class="n" title="Anteckning"></span>':""}</button></td>`}).join("")}
   <td class="sum ${mk&&mk.low?"lowtag":""}">${mk?esc(mk.k):"–"}</td></tr>`}).join("");
 const foot=as.map(a=>{const r=resultOf(a,g);const mx=Math.max(1,...r.rows.map(x=>x.n));
  return `<td><div class="dist" title="${r.rows.map(x=>x.l+": "+x.n+" ("+x.pct+" %)").join(", ")}">${r.rows.map(x=>`<i style="height:${Math.max(2,x.n/mx*22)}px;--h:${hueT(x.t)}"></i>`).join("")}</div><span class="small muted num">${r.done}/${g.students.length}</span></td>`}).join("");
 const total=as.length*g.students.length;const done=as.reduce((n,a)=>n+g.students.filter(s=>(state.grades[a.id]||{})[s.id]).length,0);
 return `<section class="panel"><div class="toolbar"><div class="chips">${state.groups.map(x=>`<button class="chip" aria-pressed="${x.id===g.id}" data-a="sel-group" data-id="${x.id}">${esc(x.name)}</button>`).join("")}</div><button class="btn" data-a="edit-group">+ Elevgrupp</button><span class="sp"></span>
  <select class="inline" id="acourse" aria-label="Filtrera på kurs"><option value="all">Alla kurser</option>${gcourses.map(c=>`<option value="${c.id}" ${ui.acourse===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div></section>
 <section class="panel"><div class="panel-h"><h1>${esc(g.name)}</h1><span class="muted small num">${g.students.length} elever · ${done}/${total} omdömen · skala: ${esc(sc.name)}</span><span class="sp"></span>
  <button class="btn" data-a="edit-group" data-id="${g.id}">Elever</button><button class="btn ghost" data-a="how">Så hänger det ihop</button><button class="btn" data-a="results">Resultat</button><button class="btn" data-a="export-csv">Exportera CSV</button></div>
  ${!g.students.length?`<div class="empty">Gruppen har inga elever. Tryck på Elever och klistra in namnen.</div>`:!as.length?`<div class="empty">Inga uppgifter ännu för det här urvalet. Lägg till en uppgift under <a href="#planering">Planering</a>, med knappen + Uppgift.</div>`:
  `<div class="mx-wrap"><table class="mx"><thead><tr><th class="name">Elev</th>${head}<th title="Medianen av elevens omdömen">Typnivå</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td class="name small muted" style="padding:8px 10px">Fördelning</td>${foot}<td></td></tr></tfoot></table></div>
  <p class="small muted" style="margin:8px 0 0">Tryck på en ruta för att sätta omdöme och anteckning. Typnivå är medianen av elevens omdömen och ersätter inte en samlad bedömning mot betygskriterierna. En prick betyder att det finns en anteckning. Nya uppgifter lägger du till under Planering. Tryck på en elev för elevens kunskapsmatris.</p>`}</section>`;
}

/* Var ligger filen? Gissning utifrån sökvägen (OneDrive för jobb heter "OneDrive - Organisation") */
function syncPlace(p){if(!p)return null;const s=String(p);
 const od=s.match(/OneDrive( - ([^\\/]+))?/i);if(od)return od[2]?{name:"OneDrive",work:true,org:od[2]}:{name:"OneDrive",work:false};
 if(/Google ?Drive|My Drive|Min enhet|GoogleDrive|Delade enheter|Shared drives/i.test(s))return {name:"Google Drive",work:null};
 if(/Dropbox/i.test(s))return {name:"Dropbox",work:false};if(/iCloud|Mobile Documents/i.test(s))return {name:"iCloud",work:false};return null}
function phonePanel(){if(DESKTOP)return "";return `<section class="panel"><div class="panel-h"><h2>I telefonen</h2></div>
  <p class="small" style="margin-top:0">Öppna webbversionen i telefonen och lägg till den på hemskärmen (Dela → Lägg till på hemskärmen på iPhone, menyn → Installera app på Android). Välj sedan <b>Öppna min fil i läsläge</b> och din fil från skolans Drive eller OneDrive. I läsläget kan du titta på schema, planering och omdömen, men ingenting kan ändras eller skrivas över.</p>
  <div class="actions" style="justify-content:flex-start"><button class="btn" data-a="open-ro">Öppna en fil i läsläge</button>${isWebCopy()?"":`<a class="btn" href="${WEB_URL}" target="_blank" rel="noopener">Webbversionen</a>`}</div></section>`}
function syncPanel(){const where=DESKTOP?syncPlace(filePath):null;
 const status=DESKTOP?(where?(where.work?`<p class="example" style="background:var(--ok-bg);color:var(--ok);margin:0"><span>Filen ligger i <b>OneDrive för ${esc(where.org)}</b>, som ser ut att vara ett jobbkonto.</span></p>`
   :where.work===false?`<p class="example" style="margin:0"><span>Filen ligger i <b>${esc(where.name)}</b>, som ser ut att vara ett privat konto. Flytta den hellre till skolans lagring.</span></p>`
   :`<p class="example" style="background:var(--info-bg);color:var(--info);margin:0"><span>Filen ligger i <b>${esc(where.name)}</b>. Kontrollera att det är ditt jobbkonto och inte ett privat.</span></p>`)
  :`<p class="small muted" style="margin:0">Filen ligger just nu bara på den här datorn.</p>`):"";
 return `<section class="panel"><div class="panel-h"><h2>Använda Lärarbordet på flera datorer</h2></div>
  <ol style="margin:0 0 12px;padding-left:20px;display:grid;gap:8px">
   <li>Lägg ${DESKTOP?"datafilen":"filen"} i en mapp som synkas med <b>skolans</b> Google Drive eller OneDrive, alltså med ditt jobbkonto. Fråga skolans dataskyddsombud om den lagringen är godkänd för elevuppgifter som omdömen. Använd inte ett privat konto.</li>
   <li><b>Stäng Lärarbordet</b> innan du byter dator, och vänta tills synkningen är klar. Annars kan ändringar från den ena datorn skrivas över av den andra.</li>
   <li>Lärarbordet varnar om filen har ändrats på en annan dator sedan du öppnade den${DESKTOP?", och om den verkar vara öppen på en annan dator just nu":""}. Då får du välja vad som ska gälla.</li>
  </ol>
  ${status}
  <div class="actions" style="justify-content:flex-start;margin-top:12px"><button class="btn pri" data-a="sync-guide">Steg-för-steg-guide</button></div>
  ${DESKTOP?`<div class="actions" style="justify-content:flex-start;margin-top:8px"><button class="btn" data-a="save-as">Flytta filen till en synkad mapp…</button></div><p class="small muted" style="margin:6px 0 0">Välj en mapp i Drive eller OneDrive. Lärarbordet använder sedan filen där på den här datorn. På den andra datorn väljer du Öppna annan fil och samma fil.</p>`
   :canPick?`<div class="actions" style="justify-content:flex-start"><button class="btn" data-a="save-as">Spara filen i en synkad mapp…</button></div><p class="small muted" style="margin:6px 0 0">Öppna sedan alltid filen därifrån, på varje dator.</p>`
   :`<p class="small muted" style="margin:0">I den här webbläsaren laddas en ny fil ner varje gång du sparar, och då fungerar inte synkning. Använd Chrome, Edge eller skrivbordsappen om du vill synka.</p>`}</section>`}
function vSettings(){
 return `<section class="panel"><div class="panel-h"><h2>Utseende</h2><span class="sp"></span>${themeSeg()}</div><p class="small muted" style="margin:0">Ljust eller mörkt läge. Som datorn följer inställningen i datorn eller telefonen.</p></section>
 <div class="grid2"><section class="panel"><div class="panel-h"><h2>Läsår</h2></div>
  <div class="row"><div class="f"><label for="ys">Första skoldag</label><input type="date" id="ys" value="${state.year.start}"></div><div class="f"><label for="ye">Sista skoldag</label><input type="date" id="ye" value="${state.year.end}"></div></div>
  <div class="actions" style="margin-top:12px"><button class="btn" data-a="save-year">Ändra datum</button><button class="btn pri" data-a="new-year">Starta nytt läsår…</button></div>
  ${(state.archive||[]).length?`<h3 style="margin-top:16px">Tidigare läsår</h3><div class="list">${state.archive.map(a=>`<div class="li"><span class="what"><b>Läsår ${esc(a.label)}</b><br><span class="small muted">${a.courses.length} kurser · ${a.assessments.length} bedömningar · arkiverat ${esc(a.archivedAt)}</span></span><button class="btn" data-a="switch-year" data-id="${a.id}">Öppna</button><button class="btn danger" data-a="del-year" data-id="${a.id}">Ta bort</button></div>`).join("")}</div>`:""}</section>
 <section class="panel"><div class="panel-h"><h2>Bedömningsskala</h2></div>
  ${Object.entries(SCALES).map(([k,v])=>`<label style="display:flex;gap:10px;align-items:flex-start;padding:6px 0;cursor:pointer"><input type="radio" name="scale" value="${k}" ${state.scale===k?"checked":""} data-a="scale" style="margin-top:5px"><span><b>${esc(v.name)}</b><br><span class="small muted">${v.levels.map(l=>esc(l.l)).join(" · ")}</span></span></label>`).join("")}
  <p class="small muted">Byter du skala räknas befintliga omdömen om till närmaste steg på den nya skalan.</p></section></div>
 <section class="panel"><div class="panel-h"><h2>Mina ämnen</h2><span class="sp"></span><button class="btn" data-a="new-subject">+ Eget ämne</button><button class="btn pri" data-a="picker">Välj ämnen</button></div>
  ${usedSubjects().length?`<div class="list">${usedSubjects().map(id=>{const x=subj(id);const n=x.areas.reduce((k,a)=>k+a.items.length,0);const inUse=state.courses.some(c=>c.subjectId===id);return `<div class="li"><span class="what"><b>${esc(x.name)} ${esc(x.stage||"")}</b><br><span class="small muted">${esc(FORM_LABEL[x.form||"X"])} · ${n} punkter${inUse?" · används i en kurs":""}</span></span>${x.official?(inUse?"":`<button class="btn" data-a="unmine" data-id="${x.id}">Ta bort</button>`):`<button class="btn danger" data-a="del-subject" data-id="${x.id}">Radera</button>`}</div>`}).join("")}</div>`:`<p class="muted">Inga ämnen valda.</p>`}
  <p class="small muted">Katalogen innehåller ${FORMS.reduce((n,f)=>n+f.subjects.length,0)} ämnen och ämnesområden från Skolverket (hämtat ${esc(CAT.fetched)}).</p></section>
 <section class="panel"><div class="panel-h"><h2>Din data</h2></div>
  ${DESKTOP?`<p class="small" style="margin-top:0">All planering, alla elever och omdömen sparas automatiskt i en fil på din dator. Inget skickas till någon server.</p>
  <p class="small" style="word-break:break-all"><b>Fil:</b> ${esc(filePath||"")}</p>
  <div class="actions" style="justify-content:flex-start"><button class="btn pri" data-a="save">Spara nu</button><button class="btn" data-a="save-as">Spara som…</button><button class="btn" data-a="open-file">Öppna annan fil…</button>`
  :`<p class="small" style="margin-top:0">All planering, alla elever och omdömen sparas <b>inuti den här HTML-filen</b> (${esc(FILENAME)}) på din dator. Inget skickas till någon server och inget sparas i webbläsaren.</p>
  <p class="small">${canPick?`<b>Chrome och Edge:</b> första gången du trycker Spara väljer du den här filen för att skriva över den. Därefter sparas ändringar automatiskt tills du stänger fliken.`:`<b>Den här webbläsaren</b> kan inte skriva direkt till filen. Spara laddar ner en uppdaterad kopia. Ersätt den gamla filen med den nya. Chrome eller Edge gör det smidigare.`} Spara också med Ctrl/Cmd+S.</p>
  <div class="actions" style="justify-content:flex-start"><button class="btn pri" data-a="save">Spara</button>${canPick?'<button class="btn" data-a="save-as">Spara som ny fil</button>':""}<button class="btn" data-a="export-json">Exportera data (JSON)</button><button class="btn" data-a="import-json">Importera data</button>`}
  ${state.example?"":'<button class="btn" data-a="load-example">Visa exempeldata</button>'}</div></section>
 ${syncPanel()}
 ${phonePanel()}
 <section class="panel" style="border-color:color-mix(in srgb,var(--bad) 35%,var(--line))"><div class="panel-h"><h2>Rensa allt</h2></div>
  <p class="small" style="margin-top:0">Tar bort alla kurser, arbetsområden, händelser, elever, omdömen och valda ämnen, så att du får ett helt tomt Lärarbordet att börja med. ${DESKTOP?"":"Spara filen efteråt så blir den tom även nästa gång du öppnar den."}</p>
  <div class="actions" style="justify-content:flex-start"><button class="btn danger" data-a="wipe">Rensa allt</button></div>
  <p class="small muted" style="margin-bottom:0">${DESKTOP?"Flyttar du från HTML-versionen: välj Öppna annan fil och sedan din sparade lararbordet.html. ":""}Elevnamn och omdömen är personuppgifter. Spara filen där skolan tillåter, t.ex. på en krypterad dator eller i skolans godkända lagring.</p></section>
 <section class="panel"><div class="panel-h"><h2>Om Lärarbordet</h2></div>
  <p class="small" style="margin-top:0">Version <b>${esc(APP_VERSION)}</b>. ${UPDATE?`Version ${esc(UPDATE.version)} finns att ladda ner.`:""}</p>
  <label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="chkupd" ${state.checkUpdates!==false?"checked":""} style="margin-top:4px"><span class="small">Sök efter nya versioner när appen startar. Appen frågar GitHub vilken version som är senast. Inga uppgifter om dig eller dina elever skickas.</span></label>
  ${isWebCopy()?`<p class="small muted">Det här är webbversionen, som alltid är senaste versionen. Vill du spara på riktigt: ladda ner Lärarbordet nedan.</p><div class="actions" style="justify-content:flex-start"><button class="btn pri" data-a="open-update">Ladda ner Lärarbordet</button></div>`
  :`<div class="actions" style="justify-content:flex-start;margin-top:10px"><button class="btn pri" data-a="download-latest">${DESKTOP?"Ladda ner senaste versionen":"Uppdatera till senaste versionen"}</button><button class="btn" data-a="open-update">Nedladdningssidan</button></div>
  <p class="small muted" id="dlstatus" style="margin:8px 0 0">${DESKTOP?(OS==="windows"?"Laddar ner installationsfilen för Windows.":OS==="mac"?"Laddar ner installationsfilen för Mac.":"Öppnar nedladdningssidan."):"Hämtar den nya versionen och sparar den med all din data i den här filen."}</p>`}</section>
 <p class="small muted" style="text-align:center">© 2026 DorkTeach · Fri programvara under <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener">AGPL-3.0</a> · <a href="https://github.com/joshuamrumack-collab/Lararbordet" target="_blank" rel="noopener">Källkod</a><br>Centralt innehåll och betygskriterier från Skolverket</p>`;
}
