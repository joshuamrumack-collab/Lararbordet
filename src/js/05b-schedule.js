/* ---------- schema: veckoschema, en vecka i taget, inställda lektioner och kalendarium ---------- */
const DAYS5=[1,2,3,4,5];
const slotsOnDay=day=>(state.schedule||[]).filter(x=>+x.day===day&&course(x.courseId)).sort((a,b)=>a.start<b.start?-1:1);
/* Pass en viss dag, med planerad lektion och eventuell inställning */
function dayOccurrences(date){const d=parseD(date);if(date<state.year.start||date>state.year.end)return [];
 return slotsOnDay(d.getDay()).filter(sl=>slotRunsInWeek(sl,d)&&!(state.removed||{})[sl.id+"|"+date]).map(sl=>{const c=course(sl.courseId);const unitIds=new Set(state.units.filter(u=>u.courseId===c.id).map(u=>u.id));
  const ls=(state.lessons||[]).filter(l=>l.date===date&&(unitIds.has(l.unitId)||(!l.unitId&&l.courseId===c.id)));const first=slotsOnDay(d.getDay()).filter(x=>x.courseId===c.id&&slotRunsInWeek(x,d)).sort((x,y)=>x.start<y.start?-1:1)[0];const lesson=ls.find(l=>l.time===sl.start)||(first===sl?ls.find(l=>!l.time):null)||null;
  const active=state.units.find(u=>u.courseId===c.id&&u.start<=date&&u.end>=date)||null;
  return {slot:sl,course:c,date,cancel:cancellation(state,sl,date),lesson,unit:active}})}
const occCard=(o,compact)=>`<button class="occ ${o.cancel?"cancelled":""}" data-a="occ" data-slot="${o.slot.id}" data-date="${o.date}" style="--cc:${o.course.color}">
  <span class="occ-t num">${esc(o.slot.start)}–${esc(o.slot.end)}${o.slot.room&&!compact?` · ${esc(o.slot.room)}`:""}</span><b>${esc(o.course.name)}</b>${o.cancel?"":adaptTag(o.course)}
  ${o.cancel?`<span class="occ-x">Inställd: ${esc(o.cancel.reason)}</span>`:o.lesson?`<span class="occ-l">${o.lesson.done?"✓ ":""}${esc(o.lesson.title)}</span>${o.lesson.plan?`<span class="occ-p">${esc(o.lesson.plan)}</span>`:""}${o.slot.note?`<span class="occ-p">${esc(o.slot.note)}</span>`:""}`:o.unit?`<span class="occ-l muted">${esc(o.unit.title)}</span>${o.slot.note?`<span class="occ-p">${esc(o.slot.note)}</span>`:""}`:o.slot.note?`<span class="occ-p">${esc(o.slot.note)}</span>`:""}</button>`;

function vSchedule(){
 const has=(state.schedule||[]).length;
 const week=addDays(mondayOf(TODAY),7*(ui.schedWeek||0));const wn=isoWeek(week);
 const grid=`<div class="sgrid">${DAYS5.map(d=>`<div class="scol"><div class="sday">${cap(DAY[d])}</div>${slotsOnDay(d).map(sl=>{const c=course(sl.courseId);return `<button class="slot" data-a="edit-slot" data-id="${sl.id}" style="--cc:${c.color}"><span class="num occ-t">${esc(sl.start)}–${esc(sl.end)}</span><b>${esc(c.name)}</b><span class="small muted">${esc(sl.room||"")}${sl.weeks&&sl.weeks!=="alla"?(sl.room?" · ":"")+WEEKS_LABEL[sl.weeks]:""}</span>${sl.note?`<span class="occ-p">${esc(sl.note)}</span>`:""}</button>`}).join("")||'<span class="small muted">–</span>'}</div>`).join("")}</div>`;
 const weekView=`<div class="sgrid">${DAYS5.map(d=>{const date=fmtD(addDays(week,d-1));const occ=dayOccurrences(date);const ev=eventsIn(parseD(date),parseD(date));
   return `<div class="scol ${date===fmtD(TODAY)?"today":""}"><div class="sday">${cap(DAY[d]).slice(0,3)} <span class="muted small">${parseD(date).getDate()}/${parseD(date).getMonth()+1}</span></div>${ev.length?`<div class="mev" style="margin:0 0 6px">${ev.map(evTag).join("")}</div>`:""}${occ.map(o=>occCard(o,true)).join("")||'<span class="small muted">Inga lektioner</span>'}</div>`}).join("")}</div>`;
 const withSched=state.courses.filter(c=>hasSchedule(state,c.id));
 const stats=withSched.map(c=>{const all=courseStats(state,c.id);const t=fmtD(TODAY);const cancelled=all.list.filter(x=>x.cancel);if(!cancelled.length)return "";const ahead=cancelled.filter(x=>x.date>=t);const past=cancelled.length-ahead.length;
  return `<div class="cstat"><div class="cstat-h"><span class="dot" style="background:${c.color}"></span><b>${esc(c.name)}</b><span class="sp"></span><span class="small num lowtag">${cancelled.length} av ${all.total} pass inställda</span></div>
   ${ahead.length?`<div class="list">${ahead.slice(0,8).map(x=>`<div class="li" style="padding:6px 0"><span class="when num">${DAY[parseD(x.date).getDay()].slice(0,3)} ${shortD(x.date)}<br><span class="small">${esc(x.slot.start)}</span></span><span class="what small">${esc(x.cancel.reason)}</span></div>`).join("")}${ahead.length>8?`<span class="small muted">och ${ahead.length-8} till</span>`:""}</div>`:""}
   ${past?`<p class="small muted" style="margin:6px 0 0">${past} inställda tidigare i läsåret.</p>`:""}</div>`}).join("");
 const ev=[...state.events].sort((a,b)=>a.start<b.start?-1:1);
 const affects=e=>{const tid=e.from&&e.to?`${e.from}–${e.to}`:"hela dagen";return !CANCELS[e.type]?`Påverkar inte lektioner${e.from&&e.to?" · "+tid:""}`:e.type!=="aktivitet"?`Alla lektioner ställs in, ${tid}`:`${(e.groups||[]).length?e.groups.map(g=>(group(g)||{}).name).filter(Boolean).join(", "):"Alla grupper"}, ${tid}`};
 return `${has?`<section class="panel"><div class="panel-h"><button class="btn ghost" data-a="sched-week" data-v="-1" aria-label="Föregående vecka">‹</button><h2>Vecka ${wn}</h2><button class="btn ghost" data-a="sched-week" data-v="1" aria-label="Nästa vecka">›</button>${ui.schedWeek?`<button class="btn ghost" data-a="sched-week" data-v="0">Den här veckan</button>`:""}<span class="sp"></span><span class="small muted">Tryck på en lektion för att skriva planen eller ställa in den.</span><button class="btn" data-a="weekplan">Veckoplanering till elever</button></div>${weekView}</section>`:""}
 <section class="panel"><div class="panel-h"><h2>Mitt veckoschema</h2><span class="sp"></span><button class="btn" data-a="import-ics">Importera schema</button>${has?`<button class="btn" data-a="export-ics">Exportera till kalender</button>`:""}<button class="btn pri" data-a="new-slot">+ Lektion i schemat</button></div>
  ${has?grid:`<div class="empty"><p>Lägg in dina lektioner en gång, till exempel <b>Svenska 8B, måndag 08:20–09:20</b>. Sedan räknar Lärarbordet ut vilka lektioner som blir inställda av lov, studiedagar och aktiviteter i kalendariet, och hur många lektioner varje arbetsområde faktiskt får.</p><button class="btn pri" data-a="new-slot">Lägg in första lektionen</button> <button class="btn" data-a="import-ics">Importera från PDF, Skola24, Google eller Outlook</button></div>`}</section>
 ${has?`<div class="grid2"><section class="panel"><div class="panel-h"><h2>Inställda lektioner</h2></div>${stats}</section>`:'<div class="grid2">'}
 <section class="panel"><div class="panel-h"><h2>Kalendarium</h2><span class="sp"></span><button class="btn" data-a="import-cal">Importera från Excel</button><button class="btn pri" data-a="new-event">+ Händelse</button></div>
  <p class="small muted" style="margin:-4px 0 10px">Lov och studiedagar ställer in alla lektioner. Aktiviteter som friluftsdag och prao ställer in lektionerna för de grupper du väljer.</p>
  ${ev.length?`<div class="list">${ev.map(e=>`<div class="li" style="cursor:pointer" data-a="edit-event" data-id="${e.id}"><span class="when num">${wkRange(e.start,e.end)}</span><span class="what"><b>${esc(e.title)}</b><br><span class="small muted">${shortD(e.start)}${e.end!==e.start?" – "+shortD(e.end):""} · ${esc(affects(e))}</span></span><span class="pill ${e.type==="lov"||e.type==="studiedag"?"p-planerad":e.type==="deadline"?"p-gap":e.type==="aktivitet"?"p-pagar":"p-warn"}">${EVENT_TYPES[e.type]||"Händelse"}</span></div>`).join("")}</div>`:`<div class="empty">Kalendariet är tomt.</div>`}</section></div>`}

function slotModal(id){const sl=id?(state.schedule||[]).find(x=>x.id===id):null;
 if(!state.courses.length){modal("Skapa en kurs först",`<p style="margin:0">En lektion i schemat hör till en kurs.</p><div class="actions"><a class="btn pri" href="#planering" data-a="close">Till planeringen</a></div>`);return}
 const d=sl||{courseId:state.courses[0].id,day:1,start:"08:20",end:"09:20",room:"",weeks:"alla"};
 modal(sl?"Lektion i schemat":"Ny lektion i schemat",`<div class="f"><label for="slc">Kurs</label><select id="slc">${state.courses.map(c=>`<option value="${c.id}" ${d.courseId===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div>
 <div class="f"><label>Dag</label><div class="chips" id="sld">${DAYS5.map(i=>`<button class="chip" aria-pressed="${+d.day===i}" data-d="${i}">${cap(DAY[i])}</button>`).join("")}</div></div>
 <div class="row"><div class="f"><label for="sls">Börjar</label><input type="text" class="tm" inputmode="numeric" maxlength="5" placeholder="tt:mm" autocomplete="off" id="sls" value="${d.start}"></div><div class="f"><label for="sle">Slutar</label><input type="text" class="tm" inputmode="numeric" maxlength="5" placeholder="tt:mm" autocomplete="off" id="sle" value="${d.end}"></div></div>
 <div class="row"><div class="f"><label for="slr">Sal</label><input id="slr" value="${esc(d.room||"")}" placeholder="t.ex. B12"></div><div class="f"><label for="slw">Veckor</label><select id="slw">${Object.entries(WEEKS_LABEL).map(([k,l])=>`<option value="${k}" ${d.weeks===k?"selected":""}>${l}</option>`).join("")}</select></div></div>
 <div class="f"><label for="sln">Kommentarer till alla schemalagda lektioner</label><textarea id="sln" style="min-height:60px" placeholder="Kommentarer som påverkar alla lektionerna. Till exempel: Halvklass, klassanpassningar, rutiner">${esc(d.note||"")}</textarea><span class="small muted">Syns på lektionen varje vecka. Planen för en enskild lektion skriver du genom att trycka på lektionen i veckovyn.</span></div>
 ${sl&&Object.keys(state.removed||{}).some(k=>k.startsWith(sl.id+"|"))?`<div class="f"><label>Borttagna enstaka lektioner</label><div class="chips">${Object.keys(state.removed).filter(k=>k.startsWith(sl.id+"|")).sort().map(k=>`<button class="chip" data-rest="${esc(k)}" title="Ta tillbaka">${shortD(k.split("|")[1])} ↺</button>`).join("")}</div><span class="small muted">Tryck på ett datum för att ta tillbaka lektionen.</span></div>`:""}
 <div class="actions">${sl?'<button class="btn danger" id="sldel">Ta bort från schemat</button>':""}<span class="sp"></span><button class="btn" data-a="close">Avbryt</button>${sl?"":'<button class="btn" id="slmore">Spara och lägg till fler</button>'}<button class="btn pri" id="slok">Spara</button></div>`,m=>{
  let day=+d.day;m.querySelector("#sld").onclick=e=>{const b=e.target.closest("[data-d]");if(!b)return;day=+b.dataset.d;m.querySelectorAll("#sld [data-d]").forEach(x=>x.setAttribute("aria-pressed",+x.dataset.d===day))};
  const save=()=>{let s=normTime(val("sls")),e=normTime(val("sle"));const okT=x=>/^\d\d:\d\d$/.test(x);if(!okT(s)){m.querySelector("#sls").focus();toast("Skriv tiden som t.ex. 08:20.");return false}if(!okT(e)){m.querySelector("#sle").focus();toast("Skriv tiden som t.ex. 09:20.");return false}if(e<=s){m.querySelector("#sle").focus();return false}
   const o={courseId:val("slc"),day,start:s,end:e,room:val("slr").trim(),weeks:val("slw"),note:val("sln").trim()};if(sl)Object.assign(sl,o);else state.schedule.push(Object.assign({id:uid()},o));commit();return true};
  m.querySelector("#slok").onclick=()=>{if(save())closeModal()};
  const more=m.querySelector("#slmore");if(more)more.onclick=()=>{if(save())slotModal()};
  m.querySelectorAll("[data-rest]").forEach(b=>b.onclick=()=>{delete state.removed[b.dataset.rest];b.remove();commit();toast("Lektionen är tillbaka.")});
  const del=m.querySelector("#sldel");if(del)del.onclick=()=>{const c=course(sl.courseId)||{};confirmBox(`Är du säker på att du vill ta bort <b>${esc(c.name||"lektionen")}, ${esc(DAY[sl.day])} ${esc(sl.start)}–${esc(sl.end)}</b> från veckoschemat? Lektionen försvinner alla veckor.`,()=>{state.schedule=state.schedule.filter(x=>x!==sl);Object.keys(state.cancel).forEach(k=>{if(k.startsWith(sl.id+"|"))delete state.cancel[k]});commit()})}})}

function occModal(slotId,date){const o=dayOccurrences(date).find(x=>x.slot.id===slotId);if(!o)return;const key=slotId+"|"+date;const manual=state.cancel[key]!=null;const byEvent=o.cancel&&!manual;const L=o.lesson;
 const canPlan=!o.cancel;
 modal(o.course.name,`<p class="small muted" style="margin:-8px 0 0">${cap(DAY[parseD(date).getDay()])} ${shortD(date)} · ${esc(o.slot.start)}–${esc(o.slot.end)}${o.slot.room?" · "+esc(o.slot.room):""}${o.unit?" · "+esc(o.unit.title):""}</p>
 ${byEvent?`<p class="example" style="background:var(--bad-bg);color:var(--bad);margin:0"><span>Inställd enligt kalendariet: <b>${esc(o.cancel.reason)}</b>.</span></p>`:""}
 ${manual?`<p class="example" style="background:var(--bad-bg);color:var(--bad);margin:0"><span>Du har ställt in lektionen: <b>${esc(state.cancel[key])}</b>.</span></p>`:""}
 ${o.slot.note?`<p class="small" style="margin:0"><b>Kommentar i schemat:</b> ${esc(o.slot.note)}</p>`:""}
 ${adaptReminder(o.course)}
 ${canPlan?`<div class="f"><label for="opl">Planen för lektionen</label><textarea id="opl" placeholder="Mål, aktiviteter, material, läxa…">${esc(L?L.plan||"":"")}</textarea><span class="small muted">Visas direkt i veckovyn.</span></div>
  <div class="f"><label for="ono">Anteckning efter lektionen</label><textarea id="ono" style="min-height:60px" placeholder="Hur gick det? Vad behöver följas upp?">${esc(L?L.note||"":"")}</textarea></div>
  <label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="odone" ${L&&L.done?"checked":""}> Genomförd</label>`
  :""}
 ${byEvent?"":`<details ${manual?"open":""}><summary class="small" style="cursor:pointer">${manual?"Ändra inställningen":"Ställ in lektionen"}</summary><div class="f" style="margin-top:8px"><label for="ocr">Orsak</label><input id="ocr" value="${esc(manual?state.cancel[key]:"")}" placeholder="t.ex. Sjuk, fortbildning, nationella prov"></div>
  <div class="actions" style="justify-content:flex-start">${manual?`<button class="btn" id="ocun">Lektionen blir av ändå</button><button class="btn" id="ocok">Spara orsak</button>`:`<button class="btn" id="ocok">Ställ in lektionen</button>`}</div></details>`}
 <div class="actions"><button class="btn danger" id="ocrm">Ta bort lektionen</button>${L&&L.unitId?`<button class="btn" id="ocl">Alla detaljer</button>`:""}<span class="sp"></span><button class="btn" data-a="close">Stäng</button>${canPlan?`<button class="btn pri" id="osave">Spara</button>`:""}</div>`,m=>{
  const ok=m.querySelector("#ocok");if(ok)ok.onclick=()=>{state.cancel[key]=val("ocr").trim()||"Inställd";closeModal();commit()};
  const un=m.querySelector("#ocun");if(un)un.onclick=()=>{delete state.cancel[key];closeModal();commit()};
  const ol=m.querySelector("#ocl");if(ol)ol.onclick=()=>lessonModal(L.id);
  m.querySelector("#ocrm").onclick=()=>confirmBox(`Är du säker på att du vill ta bort <b>${esc(o.course.name)}, ${esc(DAY[parseD(date).getDay()])} ${shortD(date)} ${esc(o.slot.start)}–${esc(o.slot.end)}</b>? Bara den här lektionen tas bort. Den räknas inte heller som en lektion i planeringen. Du kan ta tillbaka den under lektionen i veckoschemat.`,()=>{state.removed=state.removed||{};state.removed[key]=true;delete state.cancel[key];commit();toast("Lektionen är borttagen.")});
  const sv=m.querySelector("#osave");if(sv)sv.onclick=()=>{const plan=val("opl").trim(),note=val("ono").trim(),done=m.querySelector("#odone").checked;
   if(L)Object.assign(L,{plan,note,done});else if(plan||note||done)state.lessons.push(o.unit?{id:uid(),unitId:o.unit.id,date,time:o.slot.start,title:"Lektion "+(lessonsOf(o.unit.id).length+1),plan,note,done}:{id:uid(),unitId:"",courseId:o.course.id,date,time:o.slot.start,title:"Lektion",plan,note,done});
   closeModal();commit()}})}

/* ---------- importera schema: PDF från schemavisaren eller .ics från en kalender ---------- */
function unpackText(id){const t=document.getElementById(id+"-gz").textContent.trim();const bin=atob(t);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new TextDecoder().decode(fflate.gunzipSync(u))}
let PDFJS=null;
async function loadPdfjs(){if(PDFJS)return PDFJS;const js=URL.createObjectURL(new Blob([unpackText("pdfjs")],{type:"text/javascript"}));const mod=await import(js);
 mod.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob([unpackText("pdfjsw")],{type:"text/javascript"}));return PDFJS=mod}
async function pdfItems(buf){const pdfjs=await loadPdfjs();const doc=await pdfjs.getDocument({data:new Uint8Array(buf),isEvalSupported:false}).promise;const out=[];
 for(let p=1;p<=Math.min(doc.numPages,10);p++){const page=await doc.getPage(p);const vp=page.getViewport({scale:1});const tc=await page.getTextContent();
  tc.items.forEach(it=>{if(it.str&&it.str.trim())out.push({str:it.str,x:it.transform[4],y:vp.height-it.transform[5],w:it.width||0,page:p})})}
 return out}
function icsModal(){let rows=[];let evs=[];let src="";
 const subjOpts=()=>usedSubjects().map(id=>`<option value="${esc(id)}">${esc(subjTitle(id))}</option>`).join("");
 const cOpts=(r)=>`<option value="">Hoppa över</option>${src==="ics"?`<option value="__event" ${r.c==="__event"?"selected":""}>Händelse i kalendariet</option>`:""}<optgroup label="Lektion i kursen">${state.courses.map(x=>`<option value="${x.id}" ${r.c===x.id?"selected":""}>${esc(x.name)}</option>`).join("")}</optgroup><option value="__new" ${r.c==="__new"?"selected":""}>+ Ny kurs…</option>`;
 const newC=(r,i)=>r.c!=="__new"?"":`<div class="imp-new"><div class="f"><label>Kursnamn</label><input data-nn="${i}" value="${esc(r.nn!=null?r.nn:r.text)}"></div>
  <div class="f"><label>Ämne</label><select data-ns="${i}">${subjOpts()||'<option value="">Välj ämnen under Inställningar först</option>'}</select></div>
  <div class="f"><label>Elevgrupp</label><select data-ng="${i}"><option value="">Ingen</option>${state.groups.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("")}<option value="__new">+ Ny grupp…</option></select><input data-ngn="${i}" placeholder="Namn på gruppen" hidden></div></div>`;
 const dayOpts=d=>[1,2,3,4,5].map(k=>`<option value="${k}" ${+d===k?"selected":""}>${cap(DAY[k])}</option>`).join("");
 const draw=()=>{if(!src)return "";
  if(!rows.length&&!evs.length)return `<p class="small" style="color:var(--bad)">${src==="pdf"?"Hittade inga lektioner i PDF:en. Den behöver ha text (inte en inskannad bild) och rubrikerna Måndag–Fredag. Du kan lägga till lektionerna för hand nedan.":"Hittade inga händelser i filen."}</p>${src==="pdf"?`<button class="btn small" id="imadd">+ Lägg till rad</button>`:""}`;
  return `${rows.length||src==="pdf"?`<h3 style="margin:0">${src==="pdf"?"Lektioner i PDF:en":"Händelser med klockslag"} (${rows.length})</h3><p class="small muted" style="margin:0">${src==="pdf"?"Kontrollera dag och tider och välj kurs för varje lektion. Du kan rätta det som blev fel.":"Välj om varje händelse är en lektion i en kurs (blir ditt veckoschema) eller en händelse i kalendariet."}</p>
   <div class="imp-rows">${rows.map((r,i)=>`<div class="imp-row ${src}" data-i="${i}">
    ${src==="pdf"?`<select data-f="day">${dayOpts(r.day)}</select><input type="text" class="tm" inputmode="numeric" maxlength="5" placeholder="tt:mm" autocomplete="off" data-f="start" value="${esc(r.start)}"><input type="text" class="tm" inputmode="numeric" maxlength="5" placeholder="tt:mm" autocomplete="off" data-f="end" value="${esc(r.end)}">`:`<span class="num small"><b>${cap(DAY[r.day]).slice(0,3)} ${esc(r.start)}–${esc(r.end)}</b>${r.n>1?`<br>${r.n} gånger`:""}</span>`}
    <span class="imp-t">${src==="pdf"?`<input data-f="text" value="${esc(r.text)}" placeholder="Text i schemat">`:`<b>${esc(r.text)}</b>`}${r.room?`<span class="small muted"> ${esc(r.room)}</span>`:""}</span>
    <select data-f="c">${cOpts(r)}</select>${src==="pdf"?`<button class="btn ghost small" data-del="${i}" aria-label="Ta bort raden">×</button>`:""}
    ${newC(r,i)}</div>`).join("")}</div>${src==="pdf"?`<button class="btn small" id="imadd" style="justify-self:start">+ Lägg till rad</button>`:""}`:""}
  ${evs.length?`<label class="chk" style="margin-top:6px"><input type="checkbox" id="icsev" checked><span>Lägg ${evs.length} heldagshändelser (t.ex. lov) i kalendariet</span></label>`:""}`};
 modal("Importera schema",`<p class="small" style="margin:0">Välj en <b>PDF</b> av ditt schema, t.ex. sparad eller utskriven från Skola24 eller en annan schemavisare, eller en <b>kalenderfil (.ics)</b> från Google Kalender eller Outlook.</p>
 <ul class="small" style="margin:0;padding-left:18px;display:grid;gap:4px"><li><b>Skola24 och andra schemavisare:</b> visa en vecka och välj Skriv ut → Spara som PDF.</li><li><b>Google Kalender:</b> Inställningar → Importera och exportera → Exportera.</li><li><b>Outlook:</b> Arkiv → Spara kalender.</li></ul>
 <div class="actions" style="justify-content:flex-start;margin:0"><label class="btn pri" style="cursor:pointer">Välj PDF eller .ics…<input type="file" id="icsf" accept=".pdf,application/pdf,.ics,text/calendar" hidden></label><span class="small muted" id="imst"></span></div>
 <div id="icsb" style="display:grid;gap:10px"></div>
 <div class="actions"><span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="icsok" disabled>Importera</button></div>`,m=>{
  m.classList.add("wide");
  const paint=()=>{m.querySelector("#icsb").innerHTML=draw();m.querySelector("#icsok").disabled=!rows.some(r=>r.c)&&!evs.length;bind()};
  const bind=()=>{m.querySelectorAll(".imp-row").forEach(el=>{const r=rows[+el.dataset.i];el.querySelectorAll("[data-f]").forEach(f=>f.onchange=()=>{const k=f.dataset.f;r[k]=k==="day"?+f.value:(k==="start"||k==="end")?normTime(f.value):f.value;if(k==="c"){if(f.value==="__new"&&!usedSubjects().length){toast("Välj först dina ämnen under Inställningar.")}paint()}else if(k==="text"&&!r.c){r.c=guessCourse(state,r.text);paint()}});
    const nn=el.querySelector("[data-nn]");if(nn)nn.oninput=()=>{r.nn=nn.value};const ns=el.querySelector("[data-ns]");if(ns){if(!r.ns){const tl=(r.text||"").toLowerCase();r.ns=usedSubjects().find(id=>tl.includes(((subj(id)||{}).name||"").toLowerCase()))||ns.value}ns.value=r.ns;ns.onchange=()=>{r.ns=ns.value}}
    const ng=el.querySelector("[data-ng]"),ngn=el.querySelector("[data-ngn]");if(ng){if(r.ng)ng.value=r.ng;ngn.hidden=ng.value!=="__new";ngn.value=r.ngn||"";ng.onchange=()=>{r.ng=ng.value;ngn.hidden=ng.value!=="__new";if(!ngn.hidden)ngn.focus()};ngn.oninput=()=>{r.ngn=ngn.value}}});
   m.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{rows.splice(+b.dataset.del,1);paint()});
   const ad=m.querySelector("#imadd");if(ad)ad.onclick=()=>{rows.push({day:1,start:"08:00",end:"09:00",text:"",room:"",c:""});paint()}};
  m.querySelector("#icsf").onchange=async e=>{const f=e.target.files[0];if(!f)return;const st=m.querySelector("#imst");
   try{if(/\.pdf$/i.test(f.name)||f.type==="application/pdf"){st.textContent="Läser PDF:en…";src="pdf";evs=[];rows=parsePdfSchedule(await pdfItems(await f.arrayBuffer())).map(r=>Object.assign(r,{c:guessCourse(state,r.text)}))}
    else{src="ics";const all=parseICS(await f.text());const map={};evs=[];
     all.forEach(e=>{const day=parseD(e.date).getDay();if(e.start&&e.end&&e.date===e.endDate&&day>=1&&day<=5){const k=[day,e.start,e.end,e.summary].join("|");(map[k]=map[k]||{day,start:e.start,end:e.end,text:e.summary,room:e.location||"",n:0,weekly:false,list:[]});map[k].n++;map[k].list.push(e);if(/FREQ=WEEKLY/i.test(e.rrule))map[k].weekly=true}
      else evs.push({title:e.summary,start:e.date,end:e.endDate||e.date,type:guessType(e.summary,""),from:e.start||"",to:e.end||""})});
     rows=Object.values(map).sort((a,b)=>a.day-b.day||(a.start<b.start?-1:1)).map(r=>Object.assign(r,{c:guessCourse(state,r.text)||(r.n<2&&!r.weekly?"__event":"")}))}
    st.textContent=f.name}catch(err){st.textContent="";src="pdf";rows=[];toast("Kunde inte läsa filen: "+(err&&err.message||err))}
   paint()};
  m.querySelector("#icsok").onclick=()=>{let ns=0,nc=0,ne=0;const made={};
   rows.forEach(r=>{let cid=r.c;if(!cid)return;
    if(cid==="__event"){(r.list||[]).forEach(e=>{if(!state.events.some(x=>x.title===e.summary&&x.start===e.date)){state.events.push({id:uid(),title:e.summary,start:e.date,end:e.date,type:guessType(e.summary,""),groups:[],from:e.start,to:e.end});ne++}});return}
    if(cid==="__new"){const name=(r.nn!=null?r.nn:r.text).trim()||"Ny kurs";const key=name+"|"+(r.ns||"")+"|"+(r.ng||"")+"|"+(r.ngn||"");
     if(!made[key]){let gid=r.ng||"";if(gid==="__new"){const gn=(r.ngn||"").trim()||"Ny grupp";const ex=state.groups.find(g=>g.name===gn);if(ex)gid=ex.id;else{gid=uid();state.groups.push({id:gid,name:gn,students:[]})}}
      const ncs={id:uid(),name,subjectId:r.ns||usedSubjects()[0]||"",groupId:gid,color:COLORS[state.courses.length%COLORS.length]};state.courses.push(ncs);made[key]=ncs.id;nc++}cid=made[key]}
    if(!r.start||!r.end||r.end<=r.start)return;
    if(state.schedule.some(x=>x.courseId===cid&&+x.day===+r.day&&x.start===r.start))return;state.schedule.push({id:uid(),courseId:cid,day:+r.day,start:r.start,end:r.end,room:r.room||"",weeks:"alla"});ns++});
   let res={added:0,updated:0};const evb=m.querySelector("#icsev");if(evb&&evb.checked)res=mergeEvents(state,evs.map(e=>({title:e.title,start:e.start,end:e.end,type:e.type})));
   closeModal();commit();toast(`${ns} lektioner i veckoschemat${nc?`, ${nc} nya kurser`:""}${ne+res.added?`, ${ne+res.added} nya händelser`:""}${res.updated?`, ${res.updated} uppdaterade`:""}.`)}})}
