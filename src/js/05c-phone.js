/* ---------- telefonvy ----------
   En egen, avskalad vy för telefonen: bara läsning, en kolumn, stora tryckytor.
   Används i Android-appen, och i webbversionen på smala skärmar när en fil öppnats i läsläge. */
const IS_MOBILE_APP=!!(window.__TAURI__&&/Android|iPhone|iPad/i.test(navigator.userAgent||""));
const PTABS=[["idag","Idag"],["vecka","Vecka"],["kurser","Kurser"],["elever","Elever"],["fil","Fil"]];
const PICON={idag:ICON.oversikt,vecka:ICON.schema,kurser:ICON.planering,elever:ICON.bedomning,fil:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>'};
let FIRST_PHONE=false;
let PH={course:null,student:null,group:null,week:0,open:{},nav:[],tab:"idag"};
const isPhone=()=>!ui.fullApp&&(IS_MOBILE_APP||((READONLY||FIRST_PHONE)&&window.matchMedia("(max-width: 700px)").matches));
const proute=()=>{const h=(location.hash||"").slice(1);return PTABS.some(t=>t[0]===h)?h:"idag"};
function renderPhone(){document.body.classList.add("phone");const h=(location.hash||"").slice(1);const m=h.match(/^v(\d+)$/);
 if(m){const n=+m[1];if(n>PH.nav.length||n<1){location.hash=PH.tab||"idag";return}PH.nav.length=n}else{PH.tab=proute();PH.nav=[]}
 const r=PH.tab||"idag";
 $("#tabs").innerHTML=PTABS.filter(t=>t[0]!=="fil").map(([id,l])=>`<a href="#${id}" ${r===id?'aria-current="page"':""}>${PICON[id]}<span>${l}</span></a>`).join("");
 const gr=document.getElementById("hdrgear");if(gr){gr.setAttribute("href","#fil");gr.setAttribute("aria-label","Inställningar och fil");gr.setAttribute("aria-current",r==="fil"&&!PH.nav.length?"page":"false")}
 $("#main").innerHTML=PH.nav.length?pDetail(PH.nav[PH.nav.length-1]):({idag:pToday,vecka:pWeek,kurser:pCourses,elever:pStudents,fil:pFile}[r])()}
function pOcc(o){return goBtn("occ",o.slot.id+"|"+o.date,`<span class="p-time num">${esc(o.slot.start)}<small>${esc(o.slot.end)}</small></span>
  <span class="p-what"><b>${esc(o.course.name)}</b>${o.slot.room?`<span class="p-room">${esc(o.slot.room)}</span>`:""}
  ${o.cancel?`<span class="p-cancel">Inställd · ${esc(o.cancel.reason)}</span>`:o.lesson?`<span class="p-title">${o.lesson.done?"✓ ":""}${esc(o.lesson.title)}</span>${o.lesson.plan?`<span class="p-sub" style="white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(o.lesson.plan)}</span>`:""}`:o.unit?`<span class="p-sub">${esc(o.unit.title)}</span>`:""}${o.cancel?"":adaptTag(o.course)}</span>`,"p-row p-occrow"+(o.cancel?" x":""),`--cc:${o.course.color}`)}
function pDay(date,emptyText){const occ=(state.schedule||[]).length?dayOccurrences(date):[];const ev=eventsIn(parseD(date),parseD(date));
 const lessonsNoSched=(state.schedule||[]).length?[]:(state.lessons||[]).filter(l=>l.date===date);
 return `${ev.length?`<div class="p-events">${ev.map(e=>`<button class="evtag ${e.type}" data-a="p-go" data-t="event" data-id="${e.id}">${esc(e.title)}</button>`).join("")}</div>`:""}
  ${occ.length?occ.map(pOcc).join(""):lessonsNoSched.length?lessonsNoSched.map(lessonRow).join(""):`<p class="p-empty">${emptyText}</p>`}`}
function pToday(){const t=fmtD(TODAY);const tm=fmtD(addDays(TODAY,TODAY.getDay()===5?3:TODAY.getDay()===6?2:1));
 const now=new Date();const hm=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");
 const occ=(state.schedule||[]).length?dayOccurrences(t).filter(o=>!o.cancel):[];const next=occ.find(o=>o.slot.end>hm);
 return `${UPDATE?pUpdateCard():""}<header class="p-hero"><span class="p-date">${cap(DAY[TODAY.getDay()])} ${TODAY.getDate()} ${MONTH_FULL[TODAY.getMonth()]}</span><span class="p-week">Vecka ${isoWeek(TODAY)}</span></header>
 ${next?`<div class="p-next" style="--cc:${next.course.color}"><span class="p-label">${next.slot.start<=hm?"Pågår nu":"Nästa lektion"}</span><b>${esc(next.course.name)}</b><span>${esc(next.slot.start)}–${esc(next.slot.end)}${next.slot.room?" · "+esc(next.slot.room):""}</span>${next.lesson?`<span class="p-title">${esc(next.lesson.title)}</span>`:""}</div>`:""}
 <h2 class="p-h">Idag</h2>${pDay(t,TODAY.getDay()===0||TODAY.getDay()===6?"Helg. Inga lektioner.":"Inga lektioner idag.")}
 <h2 class="p-h">${parseD(tm).getDay()===1&&TODAY.getDay()>=5?"Måndag":"Imorgon"} <span class="p-muted">${parseD(tm).getDate()}/${parseD(tm).getMonth()+1}</span></h2>${pDay(tm,"Inga lektioner.")}`}

function pWeek(){const mon=addDays(mondayOf(TODAY),7*PH.week);
 return `<div class="p-weeknav"><button class="p-btn" data-a="p-week" data-v="-1" aria-label="Föregående vecka">‹</button><b>Vecka ${isoWeek(mon)}</b><button class="p-btn" data-a="p-week" data-v="1" aria-label="Nästa vecka">›</button></div>
 ${PH.week?`<button class="p-link" data-a="p-week" data-v="0">Till den här veckan</button>`:""}
 ${DAYS5.map(i=>{const d=addDays(mon,i-1);const ds=fmtD(d);return `<h2 class="p-h ${ds===fmtD(TODAY)?"p-today":""}">${cap(DAY[i])} <span class="p-muted">${d.getDate()}/${d.getMonth()+1}</span></h2>${pDay(ds,"Inga lektioner.")}`}).join("")}
 ${pSec("Mer",goBtn("events","",`<span class="p-what"><b>Kalendarium</b><span class="p-sub">Lov, studiedagar och aktiviteter</span></span>`))}`}

function pCourses(){if(!state.courses.length)return `<p class="p-empty">Inga kurser i filen.</p>`;
 return `<h2 class="p-h">Kurser</h2>${state.courses.map(c=>{const t=fmtD(TODAY);const u=state.units.find(x=>x.courseId===c.id&&x.start<=t&&x.end>=t)||state.units.find(x=>x.courseId===c.id&&x.status==="pagar");
  return goBtn("course",c.id,`<span class="p-what"><b>${esc(c.name)}</b><span class="p-sub">${u?"Nu: "+esc(u.title):"Inget arbetsområde pågår"}</span></span>`,"p-row",`--cc:${c.color}`)}).join("")}`}
function pCourse(c){const t=fmtD(TODAY);const us=state.units.filter(u=>u.courseId===c.id).sort((a,b)=>a.start<b.start?-1:1);
 const cur=us.find(u=>u.start<=t&&u.end>=t);const nexts=us.filter(u=>u.start>t).slice(0,3);
 const upcoming=(state.lessons||[]).filter(l=>{const u=unit(l.unitId);return u&&u.courseId===c.id&&l.date>=t}).sort((a,b)=>a.date<b.date?-1:1).slice(0,5);
 const cov=covSummary(c.subjectId,c.id);const st=hasSchedule(state,c.id)?courseStats(state,c.id,t,state.year.end):null;const g=group(c.groupId);
 const as=state.assessments.filter(a=>a.courseId===c.id).sort((a,b)=>a.date<b.date?1:-1);const slots=(state.schedule||[]).filter(x=>x.courseId===c.id).sort((a,b)=>a.day-b.day||(a.start<b.start?-1:1));
 return `<header class="p-hero" style="--cc:${c.color}"><span class="p-date">${esc(c.name)}</span><span class="p-week">${esc(subjTitle(c.subjectId))}${g?" · "+esc(g.name):""}</span></header>
 ${cur?goBtn("unit",cur.id,`<span class="p-what"><span class="p-label">Pågår nu · ${wkRange(cur.start,cur.end)}</span><b class="p-big-t">${esc(cur.title)}</b>${(()=>{const k=unitCapacity(state,cur);return k?`<span class="p-sub">${k.available} lektioner${k.cancelled?`, ${k.cancelled} inställda`:""}</span>`:""})()}</span>`,"p-row p-feature",`--cc:${c.color}`):""}
 ${pSec("Kommande lektioner",upcoming.map(lessonRow).join(""))}
 ${pSec("Sedan",nexts.map(unitRow).join(""))}
 <h2 class="p-h">Läget</h2><div class="p-stats">${goBtn("subject",c.id,`<b>${cov.pct} %</b><span>centralt innehåll genomfört</span>`,"p-stat")}${goBtn("subject",c.id,`<b>${cov.gap}</b><span>luckor i centralt innehåll</span>`,"p-stat")}${st?`<div><b>${st.held}</b><span>lektioner kvar i läsåret</span></div><div><b>${st.cancelled}</b><span>inställda framåt</span></div>`:""}</div>
 ${pSec("Mer",goBtn("units",c.id,`<span class="p-what"><b>Alla arbetsområden</b><span class="p-sub">${us.length} st</span></span>`)+goBtn("subject",c.id,`<span class="p-what"><b>Centralt innehåll</b><span class="p-sub">Vad som är genomfört, planerat och saknas</span></span>`))}
 ${pSec(`Bedömningar (${as.length})`,as.map(assessRow).join(""))}
 ${slots.length?pSec("Schema",`<div class="p-card">${slots.map(x=>`<div class="p-slot"><b>${cap(DAY[x.day])}</b><span class="num">${esc(x.start)}–${esc(x.end)}</span><span class="p-muted">${esc(x.room||"")}${x.weeks&&x.weeks!=="alla"?" · "+weeksLabel(x.weeks):""}</span></div>`).join("")}</div>`):""}`}
function pStudents(){if(!state.groups.length)return `<p class="p-empty">Inga elevgrupper i filen.</p>`;
 if(!group(PH.group))PH.group=state.groups[0].id;const g=group(PH.group);
 return `${state.groups.length>1?`<div class="p-seg">${state.groups.map(x=>`<button aria-pressed="${x.id===g.id}" data-a="p-group" data-id="${x.id}">${esc(x.name)}</button>`).join("")}</div>`:`<h2 class="p-h">${esc(g.name)}</h2>`}
 ${g.students.map(s=>{const sm=studentSummary(g.id,s.id,"all");const mk=sm.m==null?null:scale().levels[sm.m];
  return goBtn("student",g.id+"|"+s.id,`<span class="p-what"><b>${esc(s.name)}</b><span class="p-sub">${sm.count} omdömen${sm.low?` · <span class="p-cancel" style="display:inline">${sm.low} under godtagbar</span>`:""}</span></span>${mk?gradeChip(mk.k):""}`)}).join("")}
 ${pSec("Uppgifter",state.assessments.filter(a=>a.groupId===g.id).sort((a,b)=>a.date<b.date?1:-1).map(assessRow).join(""))}`}
function pStudent(g,s){const as=state.assessments.filter(a=>a.groupId===g.id).sort((a,b)=>a.date<b.date?1:-1);const cs=[...new Set(as.map(a=>a.courseId))].map(course).filter(Boolean);const sc=scale();
 const per=cs.map(c=>{const sm=studentSummary(g.id,s.id,c.id);const mk=sm.m==null?null:sc.levels[sm.m];const cr=critFor(c.subjectId);const ev=aspectEvidence(state,c.id,s.id);const ks=Object.keys(ev).sort((a,b)=>a-b);
  return `<div class="p-card" style="border-left:6px solid ${c.color}"><div class="p-slot"><b>${esc(c.name)}</b><span class="p-muted">Typnivå</span>${mk?gradeChip(mk.k):`<span class="p-muted">–</span>`}</div>
   ${cr&&ks.length?`<details class="p-det"><summary>Underlag per kriterium (${ks.length})</summary>${ks.map(i=>`<div class="p-slot"><span>${critHtml(aspectLabel(cr.aspects[i]||{}))}</span>${gradeChip(ev[i].k)}<span class="p-muted">${ev[i].n} st</span></div>`).join("")}</details>`:""}</div>`}).join("");
 return `<header class="p-hero"><span class="p-date">${esc(s.name)}</span><span class="p-week">${esc(g.name)}</span></header>
 ${per?pSec("Per kurs",per):""}
 ${pSec("Alla omdömen",as.length?as.map(a=>{const v=(state.grades[a.id]||{})[s.id];const c=course(a.courseId)||{};
  return goBtn("grade",a.id+"|"+s.id,`<span class="p-what"><b>${esc(a.title)}</b><span class="p-sub">${esc(c.name||"")} · ${shortD(a.date)}</span>${v&&v.note?`<span class="p-note">${esc(v.note.length>70?v.note.slice(0,70)+"…":v.note)}</span>`:""}</span>${v?gradeChip(v.k):`<span class="p-muted">–</span>`}`,"p-row",`--cc:${c.color||"var(--line)"}`)}).join(""):`<p class="p-empty">Inga bedömningar ännu.</p>`)}`}
/* uppdateringar i telefonen */
let PUPD={state:"",msg:""};
function pUpdateCard(compact){if(!UPDATE)return "";return `<div class="p-card p-upd"><span class="p-label">Ny version</span><b>Lärarbordet ${esc(UPDATE.version)} finns</b><span class="p-sub">Du har ${esc(APP_VERSION)}.${IS_MOBILE_APP?" Telefonen läser bara din fil, så ingenting försvinner när du uppdaterar.":""}</span><button class="p-big" data-a="p-update-go">${IS_MOBILE_APP?"Ladda ner och installera":"Uppdatera nu"}</button></div>`}
async function pCheckUpdate(){PUPD={state:"busy",msg:"Söker efter uppdatering…"};render();
 if(IS_MOBILE_APP){UPDATE=null;await checkUpdate(true);PUPD=UPDATE?{state:"",msg:""}:{state:"ok",msg:"Du har den senaste versionen."};render();return}
 try{const r=await fetch(WEB_URL+"?v="+Date.now(),{cache:"no-store"});const t=await r.text();const m=t.match(/APP_VERSION="([^"]+)"/);const v=m?m[1]:null;
  if(v&&verGt(v,APP_VERSION)){UPDATE={version:v,url:WEB_URL};PUPD={state:"",msg:""}}else PUPD={state:"ok",msg:"Du har den senaste versionen."}}
 catch(e){PUPD={state:"err",msg:"Kunde inte nå internet. Försök igen senare."}}render()}
async function pUpdateGo(){if(IS_MOBILE_APP){PUPD={state:"busy",msg:"Öppnar nedladdningen… Tryck sedan på filen och välj Installera. Första gången kan Android fråga om du tillåter installation från den här källan."};render();await downloadInstaller();return}
 try{const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(reg)await reg.update();if(window.caches){for(const k of await caches.keys())await caches.delete(k)}}catch(e){}
 location.reload()}
function pFile(){return `<h2 class="p-h">Inställningar och fil</h2>
 <div class="p-card"><span class="p-label">Utseende</span>${themeSeg()}</div>
 <div class="p-card">${READONLY?`<span class="p-label">Öppen i läsläge</span><b>${esc(RO_NAME||"Fil")}</b><span class="p-sub">Läsår ${esc(yearLabel(state.year))} · ${state.courses.length} kurser</span>`:`<span class="p-label">Ingen fil öppen</span><b>${state.example?"Exempeldata":"Lärarbordet"}</b>`}</div>
 <button class="p-big" data-a="open-ro">${READONLY?"Öppna en nyare fil":"Öppna min fil"}</button>
 <p class="p-muted">Välj din <b>lararbordet.json</b> eller <b>lararbordet.html</b>, till exempel från skolans Google Drive eller OneDrive. Telefonen kan bara läsa. Ingenting ändras eller skrivs över, så filen på datorn är alltid den som gäller.</p>
 ${!READONLY?`<button class="p-big secondary" data-a="p-example">Titta på exempeldata</button>`:""}
 <button class="p-link" data-a="sync-guide">Så får du filen till telefonen</button>
 ${IS_MOBILE_APP?"":`<button class="p-link" data-a="p-full">Visa hela appen i stället</button>`}
 <h2 class="p-h">Uppdateringar</h2>
 ${pUpdateCard()||`<div class="p-card"><span class="p-label">Version</span><b>Lärarbordet ${esc(APP_VERSION)}</b>${PUPD.msg?`<span class="p-sub ${PUPD.state==="err"?"p-cancel":""}">${esc(PUPD.msg)}</span>`:""}</div>
 <button class="p-big secondary" data-a="p-update-check" ${PUPD.state==="busy"?"disabled":""}>${PUPD.state==="busy"?"Söker…":"Sök efter uppdatering"}</button>`}
 ${IS_MOBILE_APP&&PUPD.state==="busy"&&UPDATE?`<p class="p-muted">${esc(PUPD.msg)}</p>`:""}
 <p class="p-muted" style="margin-top:24px">Lärarbordet ${esc(APP_VERSION)} · © 2026 DorkTeach · AGPL-3.0 · <a href="https://github.com/joshuamrumack-collab/Lararbordet" target="_blank" rel="noopener">Källkod</a></p>`}
