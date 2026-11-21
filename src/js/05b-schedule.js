/* ---------- schema: veckoschema, en vecka i taget, inställda lektioner och kalendarium ---------- */
const DAYS5=[1,2,3,4,5];
const slotsOnDay=day=>(state.schedule||[]).filter(x=>+x.day===day&&course(x.courseId)).sort((a,b)=>a.start<b.start?-1:1);
/* Pass en viss dag, med planerad lektion och eventuell inställning */
function dayOccurrences(date){const d=parseD(date);if(date<state.year.start||date>state.year.end)return [];
 return slotsOnDay(d.getDay()).filter(sl=>slotRunsInWeek(sl,d)).map(sl=>{const c=course(sl.courseId);const unitIds=new Set(state.units.filter(u=>u.courseId===c.id).map(u=>u.id));
  const ls=(state.lessons||[]).filter(l=>l.date===date&&unitIds.has(l.unitId));const lesson=ls.find(l=>l.time===sl.start)||ls.find(l=>!l.time)||null;
  const active=state.units.find(u=>u.courseId===c.id&&u.start<=date&&u.end>=date)||null;
  return {slot:sl,course:c,date,cancel:cancellation(state,sl,date),lesson,unit:active}})}
const occCard=(o,compact)=>`<button class="occ ${o.cancel?"cancelled":""}" data-a="occ" data-slot="${o.slot.id}" data-date="${o.date}" style="--cc:${o.course.color}">
  <span class="occ-t num">${esc(o.slot.start)}–${esc(o.slot.end)}${o.slot.room&&!compact?` · ${esc(o.slot.room)}`:""}</span><b>${esc(o.course.name)}</b>
  ${o.cancel?`<span class="occ-x">Inställd: ${esc(o.cancel.reason)}</span>`:o.lesson?`<span class="occ-l">${o.lesson.done?"✓ ":""}${esc(o.lesson.title)}</span>${o.lesson.plan?`<span class="occ-p">${esc(o.lesson.plan)}</span>`:""}`:o.unit?`<span class="occ-l muted">${esc(o.unit.title)}</span>`:""}</button>`;

function vSchedule(){
 const has=(state.schedule||[]).length;
 const week=addDays(mondayOf(TODAY),7*(ui.schedWeek||0));const wn=isoWeek(week);
 const grid=`<div class="sgrid">${DAYS5.map(d=>`<div class="scol"><div class="sday">${cap(DAY[d])}</div>${slotsOnDay(d).map(sl=>{const c=course(sl.courseId);return `<button class="slot" data-a="edit-slot" data-id="${sl.id}" style="--cc:${c.color}"><span class="num occ-t">${esc(sl.start)}–${esc(sl.end)}</span><b>${esc(c.name)}</b><span class="small muted">${esc(sl.room||"")}${sl.weeks&&sl.weeks!=="alla"?(sl.room?" · ":"")+WEEKS_LABEL[sl.weeks]:""}</span></button>`}).join("")||'<span class="small muted">–</span>'}</div>`).join("")}</div>`;
 const weekView=`<div class="sgrid">${DAYS5.map(d=>{const date=fmtD(addDays(week,d-1));const occ=dayOccurrences(date);const ev=eventsIn(parseD(date),parseD(date));
   return `<div class="scol ${date===fmtD(TODAY)?"today":""}"><div class="sday">${cap(DAY[d]).slice(0,3)} <span class="muted small">${parseD(date).getDate()}/${parseD(date).getMonth()+1}</span></div>${ev.length?`<div class="mev" style="margin:0 0 6px">${ev.map(evTag).join("")}</div>`:""}${occ.map(o=>occCard(o,true)).join("")||'<span class="small muted">Inga lektioner</span>'}</div>`}).join("")}</div>`;
 const withSched=state.courses.filter(c=>hasSchedule(state,c.id));
 const stats=withSched.map(c=>{const all=courseStats(state,c.id);const t=fmtD(TODAY);const ahead=all.list.filter(x=>x.date>=t);const past=all.list.length-ahead.length;
  const units=state.units.filter(u=>u.courseId===c.id&&u.end>=t).sort((a,b)=>a.start<b.start?-1:1).map(u=>{const k=unitCapacity(state,u);return k?`<div class="small"><span class="muted">${esc(u.title)}:</span> ${k.available} lektioner${k.cancelled?` <span class="lowtag">(${k.cancelled} inställda)</span>`:""}${k.planned?`, ${k.planned} planerade`:""}</div>`:""}).join("");
  return `<div class="cstat"><div class="cstat-h"><span class="dot" style="background:${c.color}"></span><b>${esc(c.name)}</b><span class="sp"></span><span class="small num">${all.held} av ${all.total} pass blir av${all.total-all.held?` · <span class="lowtag">${all.total-all.held} inställda</span>`:""}</span></div>
   <div class="stack" style="height:8px;margin:6px 0"><i class="s-c" style="width:${all.total?all.held/all.total*100:0}%"></i></div>
   ${ahead.length?`<div class="small"><b>Inställda framåt (${ahead.length})</b></div><div class="list">${ahead.slice(0,8).map(x=>`<div class="li" style="padding:6px 0"><span class="when num">${DAY[parseD(x.date).getDay()].slice(0,3)} ${shortD(x.date)}<br><span class="small">${esc(x.slot.start)}</span></span><span class="what small">${esc(x.cancel.reason)}</span></div>`).join("")}${ahead.length>8?`<span class="small muted">och ${ahead.length-8} till</span>`:""}</div>`:`<p class="small muted" style="margin:0">Alla lektioner framåt blir av.</p>`}
   ${past?`<p class="small muted" style="margin:6px 0 0">${past} inställda tidigare i läsåret.</p>`:""}
   ${units?`<div style="margin-top:8px;display:grid;gap:2px"><b class="small">Arbetsområden framåt</b>${units}</div>`:""}</div>`}).join("");
 const ev=[...state.events].sort((a,b)=>a.start<b.start?-1:1);
 const affects=e=>!CANCELS[e.type]?"Påverkar inte lektioner":e.type!=="aktivitet"?"Alla lektioner ställs in":`${(e.groups||[]).length?e.groups.map(g=>(group(g)||{}).name).filter(Boolean).join(", "):"Alla grupper"}${e.from&&e.to?`, ${e.from}–${e.to}`:", hela dagen"}`;
 return `${has?`<section class="panel"><div class="panel-h"><button class="btn ghost" data-a="sched-week" data-v="-1" aria-label="Föregående vecka">‹</button><h2>Vecka ${wn}</h2><button class="btn ghost" data-a="sched-week" data-v="1" aria-label="Nästa vecka">›</button>${ui.schedWeek?`<button class="btn ghost" data-a="sched-week" data-v="0">Den här veckan</button>`:""}<span class="sp"></span><span class="small muted">Tryck på en lektion för att skriva planen eller ställa in den.</span></div>${weekView}</section>`:""}
 <section class="panel"><div class="panel-h"><h2>Mitt veckoschema</h2><span class="sp"></span><button class="btn pri" data-a="new-slot">+ Lektion i schemat</button></div>
  ${has?grid:`<div class="empty"><p>Lägg in dina lektioner en gång, till exempel <b>Svenska 8B, måndag 08:20–09:20</b>. Sedan räknar Lärarbordet ut vilka lektioner som blir inställda av lov, studiedagar och aktiviteter i kalendariet, och hur många lektioner varje arbetsområde faktiskt får.</p><button class="btn pri" data-a="new-slot">Lägg in första lektionen</button></div>`}</section>
 ${has?`<div class="grid2"><section class="panel"><div class="panel-h"><h2>Lektioner som blir av</h2></div>${stats||'<p class="muted">Ingen kurs har schema än.</p>'}</section>`:'<div class="grid2">'}
 <section class="panel"><div class="panel-h"><h2>Kalendarium</h2><span class="sp"></span><button class="btn" data-a="import-cal">Importera från Excel</button><button class="btn pri" data-a="new-event">+ Händelse</button></div>
  <p class="small muted" style="margin:-4px 0 10px">Lov och studiedagar ställer in alla lektioner. Aktiviteter som friluftsdag och prao ställer in lektionerna för de grupper du väljer.</p>
  ${ev.length?`<div class="list">${ev.map(e=>`<div class="li" style="cursor:pointer" data-a="edit-event" data-id="${e.id}"><span class="when num">${wkRange(e.start,e.end)}</span><span class="what"><b>${esc(e.title)}</b><br><span class="small muted">${shortD(e.start)}${e.end!==e.start?" – "+shortD(e.end):""} · ${esc(affects(e))}</span></span><span class="pill ${e.type==="lov"||e.type==="studiedag"?"p-planerad":e.type==="deadline"?"p-gap":e.type==="aktivitet"?"p-pagar":"p-warn"}">${EVENT_TYPES[e.type]||"Händelse"}</span></div>`).join("")}</div>`:`<div class="empty">Kalendariet är tomt.</div>`}</section></div>`}

function slotModal(id){const sl=id?(state.schedule||[]).find(x=>x.id===id):null;
 if(!state.courses.length){modal("Skapa en kurs först",`<p style="margin:0">En lektion i schemat hör till en kurs.</p><div class="actions"><a class="btn pri" href="#planering" data-a="close">Till planeringen</a></div>`);return}
 const d=sl||{courseId:state.courses[0].id,day:1,start:"08:20",end:"09:20",room:"",weeks:"alla"};
 modal(sl?"Lektion i schemat":"Ny lektion i schemat",`<div class="f"><label for="slc">Kurs</label><select id="slc">${state.courses.map(c=>`<option value="${c.id}" ${d.courseId===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div>
 <div class="f"><label>Dag</label><div class="chips" id="sld">${DAYS5.map(i=>`<button class="chip" aria-pressed="${+d.day===i}" data-d="${i}">${cap(DAY[i])}</button>`).join("")}</div></div>
 <div class="row"><div class="f"><label for="sls">Börjar</label><input type="time" id="sls" value="${d.start}"></div><div class="f"><label for="sle">Slutar</label><input type="time" id="sle" value="${d.end}"></div></div>
 <div class="row"><div class="f"><label for="slr">Sal</label><input id="slr" value="${esc(d.room||"")}" placeholder="t.ex. B12"></div><div class="f"><label for="slw">Veckor</label><select id="slw">${Object.entries(WEEKS_LABEL).map(([k,l])=>`<option value="${k}" ${d.weeks===k?"selected":""}>${l}</option>`).join("")}</select></div></div>
 <div class="actions">${sl?'<button class="btn danger" id="sldel">Ta bort</button>':""}<span class="sp"></span><button class="btn" data-a="close">Avbryt</button>${sl?"":'<button class="btn" id="slmore">Spara och lägg till fler</button>'}<button class="btn pri" id="slok">Spara</button></div>`,m=>{
  let day=+d.day;m.querySelector("#sld").onclick=e=>{const b=e.target.closest("[data-d]");if(!b)return;day=+b.dataset.d;m.querySelectorAll("#sld [data-d]").forEach(x=>x.setAttribute("aria-pressed",+x.dataset.d===day))};
  const save=()=>{let s=val("sls"),e=val("sle");if(!s||!e){m.querySelector("#sls").focus();return false}if(e<=s){m.querySelector("#sle").focus();return false}
   const o={courseId:val("slc"),day,start:s,end:e,room:val("slr").trim(),weeks:val("slw")};if(sl)Object.assign(sl,o);else state.schedule.push(Object.assign({id:uid()},o));commit();return true};
  m.querySelector("#slok").onclick=()=>{if(save())closeModal()};
  const more=m.querySelector("#slmore");if(more)more.onclick=()=>{if(save())slotModal()};
  const del=m.querySelector("#sldel");if(del)del.onclick=()=>{state.schedule=state.schedule.filter(x=>x!==sl);Object.keys(state.cancel).forEach(k=>{if(k.startsWith(sl.id+"|"))delete state.cancel[k]});closeModal();commit()}})}

function occModal(slotId,date){const o=dayOccurrences(date).find(x=>x.slot.id===slotId);if(!o)return;const key=slotId+"|"+date;const manual=state.cancel[key]!=null;const byEvent=o.cancel&&!manual;const L=o.lesson;
 const canPlan=!o.cancel&&(L||o.unit);
 modal(o.course.name,`<p class="small muted" style="margin:-8px 0 0">${cap(DAY[parseD(date).getDay()])} ${shortD(date)} · ${esc(o.slot.start)}–${esc(o.slot.end)}${o.slot.room?" · "+esc(o.slot.room):""}${o.unit?" · "+esc(o.unit.title):""}</p>
 ${byEvent?`<p class="example" style="background:var(--bad-bg);color:var(--bad);margin:0"><span>Inställd enligt kalendariet: <b>${esc(o.cancel.reason)}</b>.</span></p>`:""}
 ${manual?`<p class="example" style="background:var(--bad-bg);color:var(--bad);margin:0"><span>Du har ställt in lektionen: <b>${esc(state.cancel[key])}</b>.</span></p>`:""}
 ${canPlan?`<div class="f"><label for="opl">Planen för lektionen</label><textarea id="opl" placeholder="Mål, aktiviteter, material, läxa…">${esc(L?L.plan||"":"")}</textarea><span class="small muted">Visas direkt i veckovyn.</span></div>
  <div class="f"><label for="ono">Anteckning efter lektionen</label><textarea id="ono" style="min-height:60px" placeholder="Hur gick det? Vad behöver följas upp?">${esc(L?L.note||"":"")}</textarea></div>
  <label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="odone" ${L&&L.done?"checked":""}> Genomförd</label>`
  :!o.cancel?`<p class="small muted" style="margin:0">Det finns inget arbetsområde för ${esc(o.course.name)} den här dagen. Lägg till ett under Planering så kan du skriva planen för lektionen här.</p>`:""}
 ${byEvent?"":`<details ${manual?"open":""}><summary class="small" style="cursor:pointer">${manual?"Ändra inställningen":"Ställ in lektionen"}</summary><div class="f" style="margin-top:8px"><label for="ocr">Orsak</label><input id="ocr" value="${esc(manual?state.cancel[key]:"")}" placeholder="t.ex. Sjuk, fortbildning, nationella prov"></div>
  <div class="actions" style="justify-content:flex-start">${manual?`<button class="btn" id="ocun">Lektionen blir av ändå</button><button class="btn" id="ocok">Spara orsak</button>`:`<button class="btn" id="ocok">Ställ in lektionen</button>`}</div></details>`}
 <div class="actions">${L?`<button class="btn" id="ocl">Alla detaljer</button>`:""}<span class="sp"></span><button class="btn" data-a="close">Stäng</button>${canPlan?`<button class="btn pri" id="osave">Spara</button>`:""}</div>`,m=>{
  const ok=m.querySelector("#ocok");if(ok)ok.onclick=()=>{state.cancel[key]=val("ocr").trim()||"Inställd";closeModal();commit()};
  const un=m.querySelector("#ocun");if(un)un.onclick=()=>{delete state.cancel[key];closeModal();commit()};
  const ol=m.querySelector("#ocl");if(ol)ol.onclick=()=>lessonModal(L.id);
  const sv=m.querySelector("#osave");if(sv)sv.onclick=()=>{const plan=val("opl").trim(),note=val("ono").trim(),done=m.querySelector("#odone").checked;
   if(L)Object.assign(L,{plan,note,done});else if(plan||note||done)state.lessons.push({id:uid(),unitId:o.unit.id,date,time:o.slot.start,title:"Lektion "+(lessonsOf(o.unit.id).length+1),plan,note,done});
   closeModal();commit()}})}
