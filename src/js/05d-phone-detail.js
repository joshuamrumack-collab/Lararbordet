/* ---------- telefonvy: klicka djupare ----------
   Detaljsidor läggs på en stack (PH.nav). Varje steg får en egen hash (#v1, #v2 …) så att
   telefonens bakåtknapp och webbläsarens bakåt fungerar. */
const goBtn=(t,id,inner,cls="p-row",style="")=>`<button class="${cls}" data-a="p-go" data-t="${t}" data-id="${esc(id)}" ${style?`style="${style}"`:""}>${inner}<span class="p-chev" aria-hidden="true">›</span></button>`;
function pGo(t,id){PH.nav.push({t,id});location.hash="v"+PH.nav.length}
function pDetail(n){const f={lesson:dLesson,occ:dOcc,unit:dUnit,course:pCourseD,assess:dAssess,student:dStudentD,grade:dGrade,subject:dSubject,item:dItem,event:dEvent,events:dEvents,units:dUnits}[n.t];
 const body=f?f(n.id):"";return `<button class="p-back" data-a="p-back">‹ Tillbaka</button>${body||'<p class="p-empty">Hittades inte. Filen kan ha ändrats.</p>'}`}
const pSec=(t,inner)=>inner?`<h2 class="p-h">${t}</h2>${inner}`:"";
const pKV=rows=>`<dl class="p-kv">${rows.filter(r=>r&&r[1]).map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
const lessonRow=l=>{const u=unit(l.unitId)||{};const c=course(u.courseId||l.courseId)||{};const lc=lessonCancel(state,l);
 return goBtn("lesson",l.id,`<span class="p-time num">${parseD(l.date).getDate()}/${parseD(l.date).getMonth()+1}<small>${DAY[parseD(l.date).getDay()].slice(0,3)}${l.time?" "+esc(l.time):""}</small></span><span class="p-what"><b>${l.done?"✓ ":""}${esc(l.title)}</b>${lc?`<span class="p-cancel">Inställd · ${esc(lc.reason)}</span>`:l.plan?`<span class="p-sub">${esc(l.plan.length>80?l.plan.slice(0,80)+"…":l.plan)}</span>`:""}</span>`,"p-row",`--cc:${c.color||"var(--line)"}`)};
const unitRow=u=>{const c=course(u.courseId)||{};return goBtn("unit",u.id,`<span class="p-what"><b>${esc(u.title)}</b><span class="p-sub">${wkRange(u.start,u.end)} · ${STATUS[u.status]}</span></span>`,"p-row",`--cc:${c.color}`)};
const assessRow=a=>{const c=course(a.courseId)||{};const g=group(a.groupId);const n=g?g.students.filter(s=>(state.grades[a.id]||{})[s.id]).length:0;
 return goBtn("assess",a.id,`<span class="p-what"><b>${esc(a.title)}</b><span class="p-sub">${esc(c.name||"")} · ${shortD(a.date)} · ${n}/${g?g.students.length:0} bedömda</span></span>`,"p-row",`--cc:${c.color}`)};
const gradeChip=k=>{const t=lvT(k);return t!=null?`<span class="p-grade" style="--h:${hueT(t)}">${esc(k)}</span>`:`<span class="p-muted">–</span>`};
const critHtml=t=>esc(t).replace(/\*([^*]+)\*/g,"<b>$1</b>");

/* ett pass i schemat (från Idag och Vecka) */
function dOcc(key){const [slotId,date]=key.split("|");const o=dayOccurrences(date).find(x=>x.slot.id===slotId);if(!o)return "";
 if(o.lesson&&!o.cancel)return dLesson(o.lesson.id,o);
 return `<header class="p-hero" style="--cc:${o.course.color}"><span class="p-date">${esc(o.course.name)}</span><span class="p-week">${cap(DAY[parseD(date).getDay()])} ${shortD(date)} · ${esc(o.slot.start)}–${esc(o.slot.end)}</span></header>
 ${o.cancel?`<div class="p-card x"><span class="p-label">Inställd</span><b>${esc(o.cancel.reason)}</b><span class="p-sub">${o.cancel.type==="manuell"?"Inställd för hand":"Enligt kalendariet"}</span></div>`:`<div class="p-card"><span class="p-label">Ingen lektion planerad</span><span class="p-sub">${o.slot.note?esc(o.slot.note):"Planera den på datorn."}</span></div>${adaptReminder(o.course)}`}
 ${pKV([["Sal",esc(o.slot.room||"")],["Veckor",o.slot.weeks&&o.slot.weeks!=="alla"?weeksLabel(o.slot.weeks):""]])}
 ${o.unit?pSec("Arbetsområde",unitRow(o.unit)):""}${o.lesson?pSec("Planerad lektion",lessonRow(o.lesson)):""}`}

function dLesson0(id,occ){const l=(state.lessons||[]).find(x=>x.id===id);if(!l)return "";const u=unit(l.unitId)||{};const c=course(u.courseId||l.courseId)||{};const lc=lessonCancel(state,l);
 const slot=occ?occ.slot:(state.schedule||[]).find(x=>x.courseId===c.id&&+x.day===parseD(l.date).getDay()&&(!l.time||x.start===l.time));
 const all=lessonsOf(l.unitId);const i=all.findIndex(x=>x.id===l.id);
 return `<header class="p-hero" style="--cc:${c.color}"><span class="p-label">${esc(c.name||"")}</span><span class="p-date">${esc(l.title)}</span><span class="p-week">${cap(DAY[parseD(l.date).getDay()])} ${shortD(l.date)}${slot?` · ${esc(slot.start)}–${esc(slot.end)}${slot.room?" · "+esc(slot.room):""}`:l.time?" · "+esc(l.time):""}</span></header>
 ${lc?`<div class="p-card x"><span class="p-label">Inställd</span><b>${esc(lc.reason)}</b></div>`:""}
 ${l.done?`<div class="p-pill ok">Genomförd</div>`:""}
 ${pSec("Upplägg",l.plan?`<div class="p-card"><p>${esc(l.plan).replace(/\n/g,"<br>")}</p></div>`:`<p class="p-empty">Inget upplägg skrivet.</p>`)}
 ${l.note?pSec("Anteckning efteråt",`<div class="p-card"><p>${esc(l.note).replace(/\n/g,"<br>")}</p></div>`):""}
 ${pSec("Arbetsområde",unitRow(u))}
 ${all.length>1?pSec(`Lektion ${i+1} av ${all.length}`,`<div class="p-pager">${i>0?goBtn("lesson",all[i-1].id,`<span class="p-what"><span class="p-sub">Föregående</span><b>${esc(all[i-1].title)}</b></span>`,"p-row half"):""}${i<all.length-1?goBtn("lesson",all[i+1].id,`<span class="p-what"><span class="p-sub">Nästa</span><b>${esc(all[i+1].title)}</b></span>`,"p-row half"):""}</div>`):""}`}

function dUnit(id){const u=unit(id);if(!u)return "";const c=course(u.courseId)||{};const k=unitCapacity(state,u);const ls=lessonsOf(u.id);const as=state.assessments.filter(a=>a.unitId===u.id);
 const s=subj(c.subjectId);const items=s?s.areas.flatMap(a=>a.items.filter(i=>(u.contentIds||[]).includes(i.id)).map(i=>({i,a}))):[];
 return `<header class="p-hero" style="--cc:${c.color}"><span class="p-label">${esc(c.name||"")}</span><span class="p-date">${esc(u.title)}</span><span class="p-week">${wkRange(u.start,u.end)} · ${shortD(u.start)} – ${shortD(u.end)}</span></header>
 <div class="p-pill ${(u.status==="klar"||u.status==="bedomd")?"ok":u.status==="pagar"?"info":""}">${STATUS[u.status]}</div>
 ${u.desc?`<div class="p-card"><p>${esc(u.desc).replace(/\n/g,"<br>")}</p></div>`:""}
 ${k?`<div class="p-stats"><div><b>${k.available}</b><span>lektioner enligt schemat</span></div><div><b>${k.cancelled}</b><span>inställda</span></div><div><b>${ls.length}</b><span>planerade</span></div><div><b>${ls.filter(l=>l.done).length}</b><span>genomförda</span></div></div>`:""}
 ${pSec(`Lektioner (${ls.length})`,ls.length?ls.map(lessonRow).join(""):`<p class="p-empty">Inga lektioner planerade.</p>`)}
 ${pSec(`Centralt innehåll (${items.length})`,items.map(({i,a})=>goBtn("item",i.id,`<span class="p-what"><span class="p-sub">${esc(a.name)}</span><span>${esc(i.text.length>110?i.text.slice(0,110)+"…":i.text)}</span></span>`)).join(""))}
 ${pSec(`Bedömningar (${as.length})`,as.map(assessRow).join(""))}`}

function pCourseD(id){const c=course(id);return c?pCourse(c):""}

function dAssess(id){const a=state.assessments.find(x=>x.id===id);if(!a)return "";const c=course(a.courseId)||{};const g=group(a.groupId);const u=unit(a.unitId);const sc=scale();
 const cr=(a.aspects||[]).length&&c.subjectId?critFor(c.subjectId):null;
 const counts=sc.levels.map(l=>g?g.students.filter(s=>((state.grades[a.id]||{})[s.id]||{}).k===l.k).length:0);const mx=Math.max(1,...counts);
 return `<header class="p-hero" style="--cc:${c.color}"><span class="p-label">${esc(c.name||"")} · ${esc(g?g.name:"")}</span><span class="p-date">${esc(a.title)}</span><span class="p-week">${cap(DAY[parseD(a.date).getDay()])} ${shortD(a.date)}</span></header>
 ${a.desc?`<div class="p-card"><p>${esc(a.desc).replace(/\n/g,"<br>")}</p></div>`:""}
 ${u?pSec("Arbetsområde",unitRow(u)):""}
 ${pSec("Fördelning",`<div class="p-dist">${counts.map((n,i)=>`<div><span class="p-bar" style="height:${Math.max(4,n/mx*64)}px;--h:${hueT(i/(sc.levels.length-1))}"></span><b>${n}</b><small>${esc(sc.levels[i].k)}</small></div>`).join("")}</div>`)}
 ${cr?pSec("Betygskriterier som bedöms",a.aspects.filter(i=>cr.aspects[i]).map(i=>`<details class="p-card p-det"><summary>${critHtml(aspectLabel(cr.aspects[i]))}</summary>${cr.levels.map(k=>cr.aspects[i][k]?`<p><b>${esc(cr.names[k])}:</b> ${critHtml(cr.aspects[i][k])}</p>`:"").join("")}</details>`).join("")):""}
 ${g?pSec("Elever",g.students.map(s=>{const v=(state.grades[a.id]||{})[s.id];return goBtn("grade",a.id+"|"+s.id,`<span class="p-what"><b>${esc(s.name)}</b>${v&&v.note?`<span class="p-note">${esc(v.note.length>70?v.note.slice(0,70)+"…":v.note)}</span>`:""}</span>${v?gradeChip(v.k):`<span class="p-muted">Ej bedömd</span>`}`)}).join("")):""}`}

function dStudentD(key){const [gid,sid]=key.split("|");const g=group(gid);const s=g&&g.students.find(x=>x.id===sid);if(!s)return "";const al=adaptList(s);return pStudent(g,s)+(al.length||s.note?`<div class="p-card"><span class="p-label">Om eleven</span>${al.length?`<b>${esc(al.join(", "))}</b>`:""}${s.note?`<span class="p-sub">${esc(s.note)}</span>`:""}</div>`:"")}

/* en elevs omdöme på en uppgift, med kriterier */
function dGrade(key){const [aid,sid]=key.split("|");const a=state.assessments.find(x=>x.id===aid);if(!a)return "";const g=group(a.groupId);const s=g&&g.students.find(x=>x.id===sid);if(!s)return "";
 const v=(state.grades[aid]||{})[sid];const c=course(a.courseId)||{};const cr=(a.aspects||[]).length&&c.subjectId?critFor(c.subjectId):null;
 return `<header class="p-hero" style="--cc:${c.color}"><span class="p-label">${esc(a.title)} · ${shortD(a.date)}</span><span class="p-date">${esc(s.name)}</span><span class="p-week">${esc(c.name||"")}</span></header>
 <div class="p-card p-gradebig"><span class="p-label">Samlat omdöme</span>${v&&v.k?gradeChip(v.k):`<b>Ej bedömd</b>`}</div>
 ${v&&v.note?pSec("Anteckning",`<div class="p-card"><p>${esc(v.note).replace(/\n/g,"<br>")}</p></div>`):""}
 ${cr?pSec("Per kriterium",a.aspects.filter(i=>cr.aspects[i]).map(i=>{const k=v&&v.asp?v.asp[i]:null;return `<details class="p-card p-det"><summary><span>${critHtml(aspectLabel(cr.aspects[i]))}</span>${k?gradeChip(k):`<span class="p-muted">–</span>`}</summary>${cr.levels.map(L=>cr.aspects[i][L]?`<p><b>${esc(cr.names[L])}:</b> ${critHtml(cr.aspects[i][L])}</p>`:"").join("")}</details>`}).join("")):""}
 ${pSec("Mer",goBtn("assess",a.id,`<span class="p-what"><b>Hela uppgiften</b><span class="p-sub">Alla elever och fördelning</span></span>`)+goBtn("student",g.id+"|"+s.id,`<span class="p-what"><b>Alla omdömen för ${esc(s.name)}</b></span>`))}`}

/* centralt innehåll för en kurs ämne */
function dSubject(courseId){const c=course(courseId);if(!c)return "";const s=subj(c.subjectId);if(!s)return "";const cov=coverage(s.id,c.id);const sum=covSummary(s.id,c.id);
 const lab={covered:"Genomfört",ongoing:"Pågår",planned:"Planerat",gap:"Lucka"};
 return `<header class="p-hero"><span class="p-label">${esc(c.name)}</span><span class="p-date">Centralt innehåll</span><span class="p-week">${esc(subjTitle(s.id))}</span></header>
 <div class="p-stats"><div><b>${sum.pct} %</b><span>genomfört</span></div><div><b>${sum.gap}</b><span>luckor</span></div></div>
 ${s.areas.map(a=>pSec(esc(a.name),a.items.map(i=>{const r=cov[i.id];return goBtn("item",i.id,`<span class="p-what"><span class="p-state ${r.state}">${lab[r.state]}${r.assessed?" · bedömt":""}</span><span>${esc(i.text.length>120?i.text.slice(0,120)+"…":i.text)}</span></span>`)}).join(""))).join("")}`}
function dItem(id){const sid=id.split("~")[0];const s=subj(sid)||Object.values(state.custom||{}).find(x=>x.areas.some(a=>a.items.some(i=>i.id===id)));if(!s)return "";
 let item=null,area=null;s.areas.forEach(a=>a.items.forEach(i=>{if(i.id===id){item=i;area=a}}));if(!item)return "";
 const r=coverage(s.id,"all")[id]||{units:[]};const lab={covered:"Genomfört",ongoing:"Pågår",planned:"Planerat",gap:"Lucka"};
 return `<header class="p-hero"><span class="p-label">${esc(subjTitle(s.id))}</span><span class="p-week">${esc(area.name)}</span></header>
 <div class="p-card"><span class="p-state ${r.state}">${lab[r.state]||""}${r.manual?" · avbockat för hand":""}${r.assessed?" · bedömt":""}</span><p style="font-size:1.05rem">${esc(item.text)}</p></div>
 ${pSec("Arbetsområden",r.units.length?r.units.map(unitRow).join(""):`<p class="p-empty">Inget arbetsområde täcker det här ännu.</p>`)}`}

/* kalendarium */
function dEvents(){const t=fmtD(TODAY);const ev=[...state.events].sort((a,b)=>a.start<b.start?-1:1);const up=ev.filter(e=>e.end>=t),past=ev.filter(e=>e.end<t);
 const row=e=>goBtn("event",e.id,`<span class="p-time num">v.${isoWeek(parseD(e.start))}</span><span class="p-what"><b>${esc(e.title)}</b><span class="p-sub">${shortD(e.start)}${e.end!==e.start?" – "+shortD(e.end):""} · ${EVENT_TYPES[e.type]||""}</span></span>`);
 return `<header class="p-hero"><span class="p-date">Kalendarium</span><span class="p-week">Läsår ${esc(yearLabel(state.year))}</span></header>${pSec("Kommande",up.map(row).join("")||`<p class="p-empty">Inget kommande.</p>`)}${pSec("Tidigare",past.map(row).join(""))}`}
function dEvent(id){const e=state.events.find(x=>x.id===id);if(!e)return "";
 const lost=[];if(CANCELS[e.type])state.courses.forEach(c=>courseSlots(state,c.id,e.start,e.end).forEach(o=>{if(o.cancel&&o.cancel.reason===e.title)lost.push(Object.assign({course:c},o))}));lost.sort((a,b)=>a.date<b.date?-1:1);
 return `<header class="p-hero"><span class="p-label">${EVENT_TYPES[e.type]||"Händelse"}</span><span class="p-date">${esc(e.title)}</span><span class="p-week">${shortD(e.start)}${e.end!==e.start?" – "+shortD(e.end):""} · ${wkRange(e.start,e.end)}</span></header>
 ${pKV([["Berör",!CANCELS[e.type]?"Påverkar inte lektioner":e.type!=="aktivitet"?"Alla lektioner":((e.groups||[]).length?e.groups.map(g=>esc((group(g)||{}).name||"")).join(", "):"Alla grupper")],["Tid",e.from&&e.to?esc(e.from)+"–"+esc(e.to):CANCELS[e.type]?"Hela dagen":""]])}
 ${CANCELS[e.type]?pSec(`Inställda lektioner (${lost.length})`,lost.map(o=>goBtn("occ",o.slot.id+"|"+o.date,`<span class="p-time num">${parseD(o.date).getDate()}/${parseD(o.date).getMonth()+1}<small>${esc(o.slot.start)}</small></span><span class="p-what"><b>${esc(o.course.name)}</b></span>`,"p-row",`--cc:${o.course.color}`)).join("")||`<p class="p-empty">Inga lektioner i schemat berörs.</p>`):""}`}
function dUnits(courseId){const c=course(courseId);if(!c)return "";const us=state.units.filter(u=>u.courseId===c.id).sort((a,b)=>a.start<b.start?-1:1);
 return `<header class="p-hero" style="--cc:${c.color}"><span class="p-label">${esc(c.name)}</span><span class="p-date">Alla arbetsområden</span></header>${us.map(unitRow).join("")||`<p class="p-empty">Inga arbetsområden.</p>`}`}

function dLesson(id,occ){const h=dLesson0(id,occ);if(!h)return h;const l=(state.lessons||[]).find(x=>x.id===id);const c=course((unit(l.unitId)||{}).courseId||l.courseId);return h+(c?`<div style="margin-top:12px">${adaptReminder(c)}</div>`:"")}
