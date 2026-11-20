/* ---------- telefonvy ----------
   En egen, avskalad vy för telefonen: bara läsning, en kolumn, stora tryckytor.
   Används i Android-appen, och i webbversionen på smala skärmar när en fil öppnats i läsläge. */
const IS_MOBILE_APP=!!(window.__TAURI__&&/Android|iPhone|iPad/i.test(navigator.userAgent||""));
const PTABS=[["idag","Idag"],["vecka","Vecka"],["kurser","Kurser"],["elever","Elever"],["fil","Fil"]];
const PICON={idag:ICON.oversikt,vecka:ICON.schema,kurser:ICON.planering,elever:ICON.bedomning,fil:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>'};
let FIRST_PHONE=false;
let PH={course:null,student:null,group:null,week:0,open:{}};
const isPhone=()=>!ui.fullApp&&(IS_MOBILE_APP||((READONLY||FIRST_PHONE)&&window.matchMedia("(max-width: 700px)").matches));
const proute=()=>{const h=(location.hash||"").slice(1);return PTABS.some(t=>t[0]===h)?h:"idag"};
function renderPhone(){document.body.classList.add("phone");const r=proute();
 $("#tabs").innerHTML=PTABS.map(([id,l])=>`<a href="#${id}" ${r===id?'aria-current="page"':""}>${PICON[id]}<span>${l}</span></a>`).join("");
 const v={idag:pToday,vecka:pWeek,kurser:pCourses,elever:pStudents,fil:pFile}[r];
 $("#main").innerHTML=(READONLY||state.example?"":"")+v()}

/* en lektion i telefonvyn: tid, kurs, sal, lektionens rubrik och upplägg */
function pOcc(o){const key=o.slot.id+"|"+o.date;const open=PH.open[key];const plan=o.lesson&&o.lesson.plan;
 return `<div class="p-occ ${o.cancel?"x":""}" style="--cc:${o.course.color}">
  <button class="p-occ-h" data-a="p-toggle" data-k="${esc(key)}" ${plan?"":"tabindex=\"-1\""}>
   <span class="p-time num">${esc(o.slot.start)}<small>${esc(o.slot.end)}</small></span>
   <span class="p-what"><b>${esc(o.course.name)}</b>${o.slot.room?`<span class="p-room">${esc(o.slot.room)}</span>`:""}
    ${o.cancel?`<span class="p-cancel">Inställd · ${esc(o.cancel.reason)}</span>`:o.lesson?`<span class="p-title">${o.lesson.done?"✓ ":""}${esc(o.lesson.title)}</span>`:o.unit?`<span class="p-sub">${esc(o.unit.title)}</span>`:""}</span>
   ${plan&&!o.cancel?`<span class="p-chev" aria-hidden="true">${open?"−":"+"}</span>`:""}</button>
  ${plan&&open&&!o.cancel?`<div class="p-plan">${esc(plan).replace(/\n/g,"<br>")}</div>`:""}</div>`}
function pDay(date,emptyText){const occ=(state.schedule||[]).length?dayOccurrences(date):[];const ev=eventsIn(parseD(date),parseD(date));
 const lessonsNoSched=(state.schedule||[]).length?[]:(state.lessons||[]).filter(l=>l.date===date);
 return `${ev.length?`<div class="p-events">${ev.map(e=>`<span class="evtag ${e.type}">${esc(e.title)}</span>`).join("")}</div>`:""}
  ${occ.length?occ.map(pOcc).join(""):lessonsNoSched.length?lessonsNoSched.map(l=>{const u=unit(l.unitId)||{};const c=course(u.courseId)||{};return `<div class="p-occ" style="--cc:${c.color}"><div class="p-occ-h"><span class="p-time num">${esc(l.time||"")}</span><span class="p-what"><b>${esc(c.name||"")}</b><span class="p-title">${esc(l.title)}</span></span></div>${l.plan?`<div class="p-plan">${esc(l.plan)}</div>`:""}</div>`}).join(""):`<p class="p-empty">${emptyText}</p>`}`}

function pToday(){const t=fmtD(TODAY);const tm=fmtD(addDays(TODAY,TODAY.getDay()===5?3:TODAY.getDay()===6?2:1));
 const now=new Date();const hm=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");
 const occ=(state.schedule||[]).length?dayOccurrences(t).filter(o=>!o.cancel):[];const next=occ.find(o=>o.slot.end>hm);
 return `<header class="p-hero"><span class="p-date">${cap(DAY[TODAY.getDay()])} ${TODAY.getDate()} ${MONTH_FULL[TODAY.getMonth()]}</span><span class="p-week">Vecka ${isoWeek(TODAY)}</span></header>
 ${next?`<div class="p-next" style="--cc:${next.course.color}"><span class="p-label">${next.slot.start<=hm?"Pågår nu":"Nästa lektion"}</span><b>${esc(next.course.name)}</b><span>${esc(next.slot.start)}–${esc(next.slot.end)}${next.slot.room?" · "+esc(next.slot.room):""}</span>${next.lesson?`<span class="p-title">${esc(next.lesson.title)}</span>`:""}</div>`:""}
 <h2 class="p-h">Idag</h2>${pDay(t,TODAY.getDay()===0||TODAY.getDay()===6?"Helg. Inga lektioner.":"Inga lektioner idag.")}
 <h2 class="p-h">${parseD(tm).getDay()===1&&TODAY.getDay()>=5?"Måndag":"Imorgon"} <span class="p-muted">${parseD(tm).getDate()}/${parseD(tm).getMonth()+1}</span></h2>${pDay(tm,"Inga lektioner.")}`}

function pWeek(){const mon=addDays(mondayOf(TODAY),7*PH.week);
 return `<div class="p-weeknav"><button class="p-btn" data-a="p-week" data-v="-1" aria-label="Föregående vecka">‹</button><b>Vecka ${isoWeek(mon)}</b><button class="p-btn" data-a="p-week" data-v="1" aria-label="Nästa vecka">›</button></div>
 ${PH.week?`<button class="p-link" data-a="p-week" data-v="0">Till den här veckan</button>`:""}
 ${DAYS5.map(i=>{const d=addDays(mon,i-1);const ds=fmtD(d);return `<h2 class="p-h ${ds===fmtD(TODAY)?"p-today":""}">${cap(DAY[i])} <span class="p-muted">${d.getDate()}/${d.getMonth()+1}</span></h2>${pDay(ds,"Inga lektioner.")}`}).join("")}`}

function pCourses(){if(PH.course&&course(PH.course))return pCourse(course(PH.course));
 if(!state.courses.length)return `<p class="p-empty">Inga kurser i filen.</p>`;
 return `<h2 class="p-h">Kurser</h2>${state.courses.map(c=>{const u=state.units.find(x=>x.courseId===c.id&&x.start<=fmtD(TODAY)&&x.end>=fmtD(TODAY))||state.units.find(x=>x.courseId===c.id&&x.status==="pagar");
  return `<button class="p-row" data-a="p-course" data-id="${c.id}" style="--cc:${c.color}"><span class="p-what"><b>${esc(c.name)}</b><span class="p-sub">${u?"Nu: "+esc(u.title):"Inget arbetsområde pågår"}</span></span><span class="p-chev" aria-hidden="true">›</span></button>`}).join("")}`}
function pCourse(c){const t=fmtD(TODAY);const us=state.units.filter(u=>u.courseId===c.id).sort((a,b)=>a.start<b.start?-1:1);
 const cur=us.find(u=>u.start<=t&&u.end>=t);const nexts=us.filter(u=>u.start>t).slice(0,3);
 const upcoming=(state.lessons||[]).filter(l=>{const u=unit(l.unitId);return u&&u.courseId===c.id&&l.date>=t}).sort((a,b)=>a.date<b.date?-1:1).slice(0,6);
 const cov=covSummary(c.subjectId,c.id);const st=hasSchedule(state,c.id)?courseStats(state,c.id,t,state.year.end):null;
 return `<button class="p-back" data-a="p-course" data-id="">‹ Kurser</button>
 <header class="p-hero" style="--cc:${c.color}"><span class="p-date">${esc(c.name)}</span><span class="p-week">${esc(subjTitle(c.subjectId))}</span></header>
 ${cur?`<div class="p-card"><span class="p-label">Pågår nu · ${wkRange(cur.start,cur.end)}</span><b>${esc(cur.title)}</b>${cur.desc?`<p>${esc(cur.desc)}</p>`:""}${(()=>{const k=unitCapacity(state,cur);return k?`<span class="p-sub">${k.available} lektioner i arbetsområdet${k.cancelled?`, ${k.cancelled} inställda`:""}</span>`:""})()}</div>`:""}
 ${upcoming.length?`<h2 class="p-h">Kommande lektioner</h2>${upcoming.map(l=>`<div class="p-row static"><span class="p-time num">${parseD(l.date).getDate()}/${parseD(l.date).getMonth()+1}<small>${DAY[parseD(l.date).getDay()].slice(0,3)}</small></span><span class="p-what"><b>${esc(l.title)}</b>${lessonCancel(state,l)?`<span class="p-cancel">Inställd · ${esc(lessonCancel(state,l).reason)}</span>`:l.plan?`<span class="p-sub">${esc(l.plan.length>90?l.plan.slice(0,90)+"…":l.plan)}</span>`:""}</span></div>`).join("")}`:""}
 ${nexts.length?`<h2 class="p-h">Sedan</h2>${nexts.map(u=>`<div class="p-row static"><span class="p-time num">v.${isoWeek(parseD(u.start))}</span><span class="p-what"><b>${esc(u.title)}</b><span class="p-sub">${wkRange(u.start,u.end)}</span></span></div>`).join("")}`:""}
 <h2 class="p-h">Läget</h2><div class="p-stats"><div><b>${cov.pct} %</b><span>centralt innehåll genomfört</span></div><div><b>${cov.gap}</b><span>luckor</span></div>${st?`<div><b>${st.held}</b><span>lektioner kvar i läsåret</span></div><div><b>${st.cancelled}</b><span>inställda framåt</span></div>`:""}</div>`}

function pStudents(){if(PH.student){const g=group(PH.group);const s=g&&g.students.find(x=>x.id===PH.student);if(s)return pStudent(g,s)}
 if(!state.groups.length)return `<p class="p-empty">Inga elevgrupper i filen.</p>`;
 if(!group(PH.group))PH.group=state.groups[0].id;const g=group(PH.group);
 return `${state.groups.length>1?`<div class="p-seg">${state.groups.map(x=>`<button aria-pressed="${x.id===g.id}" data-a="p-group" data-id="${x.id}">${esc(x.name)}</button>`).join("")}</div>`:`<h2 class="p-h">${esc(g.name)}</h2>`}
 ${g.students.map(s=>{const sm=studentSummary(g.id,s.id,"all");const mk=sm.m==null?null:scale().levels[sm.m];
  return `<button class="p-row" data-a="p-student" data-id="${s.id}"><span class="p-what"><b>${esc(s.name)}</b><span class="p-sub">${sm.count} omdömen${sm.low?` · <span class="p-cancel" style="display:inline">${sm.low} under godtagbar</span>`:""}</span></span>${mk?`<span class="p-grade" style="--h:${hueT(lvIdx(mk.k)/(scale().levels.length-1))}">${esc(mk.k)}</span>`:""}<span class="p-chev" aria-hidden="true">›</span></button>`}).join("")}`}
function pStudent(g,s){const as=state.assessments.filter(a=>a.groupId===g.id).sort((a,b)=>a.date<b.date?1:-1);
 return `<button class="p-back" data-a="p-student" data-id="">‹ ${esc(g.name)}</button>
 <header class="p-hero"><span class="p-date">${esc(s.name)}</span><span class="p-week">${esc(g.name)}</span></header>
 ${as.length?as.map(a=>{const v=(state.grades[a.id]||{})[s.id];const c=course(a.courseId)||{};const t=v?lvT(v.k):null;
  return `<div class="p-row static" style="--cc:${c.color||"var(--line)"}"><span class="p-what"><b>${esc(a.title)}</b><span class="p-sub">${esc(c.name||"")} · ${shortD(a.date)}</span>${v&&v.note?`<span class="p-note">${esc(v.note)}</span>`:""}</span>${t!=null?`<span class="p-grade" style="--h:${hueT(t)}">${esc(v.k)}</span>`:`<span class="p-muted">–</span>`}</div>`}).join(""):`<p class="p-empty">Inga bedömningar ännu.</p>`}`}

function pFile(){return `<h2 class="p-h">Fil</h2>
 <div class="p-card">${READONLY?`<span class="p-label">Öppen i läsläge</span><b>${esc(RO_NAME||"Fil")}</b><span class="p-sub">Läsår ${esc(yearLabel(state.year))} · ${state.courses.length} kurser</span>`:`<span class="p-label">Ingen fil öppen</span><b>${state.example?"Exempeldata":"Lärarbordet"}</b>`}</div>
 <button class="p-big" data-a="open-ro">${READONLY?"Öppna en nyare fil":"Öppna min fil"}</button>
 <p class="p-muted">Välj din <b>lararbordet.json</b> eller <b>lararbordet.html</b>, till exempel från skolans Google Drive eller OneDrive. Telefonen kan bara läsa. Ingenting ändras eller skrivs över, så filen på datorn är alltid den som gäller.</p>
 ${!READONLY?`<button class="p-big secondary" data-a="p-example">Titta på exempeldata</button>`:""}
 <button class="p-link" data-a="sync-guide">Så får du filen till telefonen</button>
 ${IS_MOBILE_APP?"":`<button class="p-link" data-a="p-full">Visa hela appen i stället</button>`}
 <p class="p-muted" style="margin-top:24px">Lärarbordet ${esc(APP_VERSION)} · DorkTeach</p>`}
