/* ---------- modaler ---------- */
let onClose=null;
function modal(title,body,mount){$("#modalroot").innerHTML=`<div class="ov" data-a="ov"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-h"><h2>${esc(title)}</h2><button class="x" data-a="close" aria-label="Stäng">×</button></div>${body}</div></div>`;const f=$("#modalroot .modal input, #modalroot .modal select, #modalroot .modal textarea");if(f&&window.innerWidth>700)f.focus();mount&&mount($("#modalroot .modal"))}
function closeModal(){$("#modalroot").innerHTML=""}
function confirmBox(text,yes,label="Ta bort"){modal("Är du säker?",`<p style="margin:0">${text}</p><div class="actions"><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="cy" style="background:var(--bad);border-color:var(--bad)">${esc(label)}</button></div>`,m=>m.querySelector("#cy").onclick=()=>{closeModal();yes()})}
const val=id=>($("#"+id)||{}).value||"";

function contentChecklist(sid,selected){const s=subj(sid);if(!s)return `<p class="small muted">Kursen saknar ämne.</p>`;const cov=coverage(sid,"all");
 return `<div class="cl">${s.areas.map(a=>`<h4>${esc(a.name)}</h4>${a.items.map(i=>`<label><input type="checkbox" value="${i.id}" ${selected.includes(i.id)?"checked":""}><span>${esc(i.text)} ${cov[i.id].state==="gap"&&!selected.includes(i.id)?'<span class="pill p-gap">lucka</span>':""}</span></label>`).join("")}`).join("")}</div>`}

function unitModal(id){const u=id?unit(id):null;const c=course(u?u.courseId:ui.course);if(!c)return;
 const ws=fmtD(mondayOf(TODAY));
 const d=u||{title:"",start:ws,end:fmtD(addDays(parseD(ws),25)),status:"planerad",contentIds:[],desc:""};
 const asl=u?state.assessments.filter(a=>a.unitId===u.id):[];
 modal(u?"Arbetsområde":"Nytt arbetsområde",`<p class="small muted" style="margin:-8px 0 0"><span class="dot" style="background:${c.color}"></span> ${esc(c.name)}</p>
 <div class="f"><label for="ut">Namn</label><input id="ut" value="${esc(d.title)}" placeholder="t.ex. Novellen"></div>
 <div class="row"><div class="f"><label for="us">Start</label><input type="date" id="us" value="${d.start}"></div><div class="f"><label for="ue">Slut</label><input type="date" id="ue" value="${d.end}"></div></div>
 <div class="f"><label for="ust">Status</label><select id="ust">${Object.entries(STATUS).map(([k,l])=>`<option value="${k}" ${d.status===k?"selected":""}>${l}</option>`).join("")}</select></div>
 <div class="f"><label for="ud">Beskrivning, syfte och arbetssätt</label><textarea id="ud">${esc(d.desc||"")}</textarea></div>
 <div class="f"><label>Centralt innehåll som arbetsområdet täcker</label>${contentChecklist(c.subjectId,d.contentIds||[])}</div>
 ${asl.length?`<p class="small">Bedömningar: ${asl.map(a=>esc(a.title)).join(", ")}</p>`:""}
 <div class="actions">${u?'<button class="btn danger" id="udel">Ta bort</button><button class="btn" id="ules">Lektioner ('+lessonsOf(u.id).length+')</button>':""}<span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="usave">Spara</button></div>`,m=>{
  m.querySelector("#usave").onclick=()=>{const t=val("ut").trim();if(!t){$("#ut").focus();return}let s=val("us"),e=val("ue");if(e<s)[s,e]=[e,s];
   const ids=[...m.querySelectorAll(".cl input:checked")].map(x=>x.value);const o={title:t,start:s,end:e,status:val("ust"),desc:val("ud"),contentIds:ids};
   if(u)Object.assign(u,o);else state.units.push(Object.assign({id:uid(),courseId:c.id},o));closeModal();commit()};
  const del=m.querySelector("#udel");if(del)del.onclick=()=>confirmBox(`Ta bort “${esc(u.title)}” och dess lektioner? Kopplade bedömningar finns kvar.`,()=>{state.units=state.units.filter(x=>x!==u);state.lessons=state.lessons.filter(l=>l.unitId!==u.id);commit()});
  const ul=m.querySelector("#ules");if(ul)ul.onclick=()=>lessonsModal(u.id)})}

/* ---------- lektioner ---------- */
function lessonsModal(unitId){const u=unit(unitId);if(!u)return;const c=course(u.courseId)||{};const ls=lessonsOf(unitId);
 const cap=unitCapacity(state,u);const nCancel=ls.filter(l=>!l.done&&lessonCancel(state,l)).length;
 modal("Lektioner",`<p class="small muted" style="margin:-8px 0 0"><span class="dot" style="background:${c.color}"></span> ${esc(c.name||"")} · ${esc(u.title)} · ${wkRange(u.start,u.end)}</p>
 ${cap?`<p class="small" style="margin:0">Enligt ditt schema: <b>${cap.total} pass</b> under arbetsområdet, varav <b>${cap.cancelled} inställda</b>. Det ger <b>${cap.available} lektioner</b>, och du har planerat ${cap.planned}.</p>`:""}
 ${nCancel?`<p class="example" style="background:var(--bad-bg);color:var(--bad);margin:0"><span>${nCancel} planerad${nCancel>1?"e":""} lektion${nCancel>1?"er":""} blir inställd${nCancel>1?"a":""}.</span><button class="btn" id="lflow">Flytta fram inställda</button></p>`:""}
 ${ls.length?`<div class="list">${ls.map(l=>`<div class="li"><button class="check" role="checkbox" aria-checked="${!!l.done}" aria-label="Genomförd" data-a="toggle-lesson" data-id="${l.id}">${l.done?CHECK:""}</button><span class="when num">${DAY[parseD(l.date).getDay()].slice(0,3)} ${shortD(l.date)}${l.time?`<br><span class="small">${esc(l.time)}</span>`:""}${!l.done&&lessonCancel(state,l)?`<br><span class="pill p-gap">Inställd</span>`:""}</span><button class="what" style="background:none;border:0;text-align:left;cursor:pointer;padding:0" data-a="edit-lesson" data-id="${l.id}"><b>${esc(l.title||"Lektion")}</b>${l.plan?`<br><span class="small muted">${esc(l.plan.length>90?l.plan.slice(0,90)+"…":l.plan)}</span>`:""}${l.note?`<br><span class="small" style="color:var(--info)">Anteckning: ${esc(l.note.length>70?l.note.slice(0,70)+"…":l.note)}</span>`:""}</button></div>`).join("")}</div>`:`<div class="empty">Inga lektioner ännu. Lägg till en i taget eller en hel serie, till exempel varje måndag och torsdag.</div>`}
 <div class="actions"><button class="btn" data-a="edit-unit" data-id="${u.id}">Tillbaka</button><span class="sp"></span><button class="btn" id="lser">+ Lektionsserie</button><button class="btn pri" id="lnew">+ Lektion</button></div>`,m=>{
  m.querySelector("#lnew").onclick=()=>lessonModal(null,unitId);m.querySelector("#lser").onclick=()=>seriesModal(unitId);
  const fl=m.querySelector("#lflow");if(fl)fl.onclick=()=>{const n=reflowLessons(state,unitId);commit();lessonsModal(unitId);toast(n?`${n} lektion${n>1?"er":""} flyttades till nästa pass som blir av. Ordningen är densamma.`:"Inga lektioner behövde flyttas.")}})}
function lessonModal(id,unitId,preset){const l=id?state.lessons.find(x=>x.id===id):null;unitId=l?l.unitId:unitId;const u=unit(unitId);if(!u)return;
 const prev=lessonsOf(unitId);const d=l||Object.assign({date:(()=>{const last=prev.length?prev[prev.length-1].date:null;const t=fmtD(TODAY);return last&&last>=t?fmtD(addDays(parseD(last),1)):(t>=u.start&&t<=u.end?t:u.start)})(),title:"Lektion "+(prev.length+1),plan:"",note:"",done:false},preset||{});
 modal(l?"Lektion":"Ny lektion",`<p class="small muted" style="margin:-8px 0 0">${esc(u.title)}</p>
 <div class="row"><div class="f"><label for="lt">Rubrik</label><input id="lt" value="${esc(d.title)}"></div><div class="f"><label for="ld">Datum${d.time?" · "+esc(d.time):""}</label><input type="date" id="ld" value="${d.date}"></div></div>
 ${l&&lessonCancel(state,l)?`<p class="example" style="background:var(--bad-bg);color:var(--bad);margin:0"><span>Den här lektionen blir inställd: <b>${esc(lessonCancel(state,l).reason)}</b>. Flytta den, eller använd Flytta fram inställda i listan över lektioner.</span></p>`:""}
 <div class="f"><label for="lp">Upplägg och material</label><textarea id="lp" placeholder="Mål för lektionen, aktiviteter, material, läxa…">${esc(d.plan||"")}</textarea></div>
 <div class="f"><label for="ln">Anteckning efter lektionen</label><textarea id="ln" placeholder="Hur gick det? Vad behöver följas upp?">${esc(d.note||"")}</textarea></div>
 <label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="ldone" ${d.done?"checked":""}> Genomförd</label>
 <div class="actions">${l?'<button class="btn danger" id="ldel">Ta bort</button>':""}<button class="btn" id="lback">Alla lektioner</button><span class="sp"></span><button class="btn pri" id="lsave">Spara</button></div>`,m=>{
  const save=()=>{const o={title:val("lt").trim()||"Lektion",date:val("ld")||d.date,time:val("ld")===d.date?(d.time||""):"",plan:val("lp"),note:val("ln"),done:m.querySelector("#ldone").checked};if(l)Object.assign(l,o);else state.lessons.push(Object.assign({id:uid(),unitId},o));commit()};
  m.querySelector("#lsave").onclick=()=>{save();lessonsModal(unitId)};
  m.querySelector("#lback").onclick=()=>lessonsModal(unitId);
  const del=m.querySelector("#ldel");if(del)del.onclick=()=>{state.lessons=state.lessons.filter(x=>x!==l);commit();lessonsModal(unitId)}})}
function seriesModal(unitId){const u=unit(unitId);if(!u)return;
 modal("Lektionsserie",`<p class="small muted" style="margin:-8px 0 0">${esc(u.title)} · ${shortD(u.start)} – ${shortD(u.end)}. Lov hoppas över.</p>
 ${hasSchedule(state,u.courseId)?`<div class="example" style="background:var(--info-bg);color:var(--info);margin:0"><span>Kursen har ett schema. Lektionerna kan läggas på varje pass som blir av, med inställda pass överhoppade.</span><button class="btn pri" id="ssched">Följ mitt schema</button></div><p class="small muted" style="margin:0">Eller välj veckodagar själv:</p>`:""}
 <div class="f"><label>Veckodagar</label><div class="chips" id="wd">${[1,2,3,4,5].map(i=>`<button class="chip" aria-pressed="false" data-wd="${i}">${DAY[i]}</button>`).join("")}</div></div>
 <div class="row"><div class="f"><label for="sfrom">Från</label><input type="date" id="sfrom" value="${u.start}"></div><div class="f"><label for="sto">Till</label><input type="date" id="sto" value="${u.end}"></div></div>
 <p class="small muted" id="scount" style="margin:0">Välj minst en veckodag.</p>
 <div class="actions"><button class="btn" id="sback">Tillbaka</button><span class="sp"></span><button class="btn pri" id="sok" disabled>Skapa lektioner</button></div>`,m=>{
  const wd=new Set();const dates=()=>seriesDates(state,val("sfrom"),val("sto"),[...wd]);
  const upd=()=>{const n=wd.size?dates().length:0;m.querySelector("#scount").textContent=wd.size?n+" lektioner skapas.":"Välj minst en veckodag.";m.querySelector("#sok").disabled=!n};
  m.querySelectorAll("[data-wd]").forEach(b=>b.onclick=()=>{const i=+b.dataset.wd;wd.has(i)?wd.delete(i):wd.add(i);b.setAttribute("aria-pressed",wd.has(i));upd()});
  m.querySelector("#sfrom").onchange=upd;m.querySelector("#sto").onchange=upd;
  m.querySelector("#sback").onclick=()=>lessonsModal(unitId);
  const sch=m.querySelector("#ssched");if(sch)sch.onclick=()=>{const n0=lessonsOf(unitId).length;const have=new Set(lessonsOf(unitId).map(l=>l.date+"|"+(l.time||"")));const ds=scheduleDates(state,u.courseId,val("sfrom"),val("sto")).filter(x=>!have.has(x.date+"|"+x.time));ds.forEach((x,i)=>state.lessons.push({id:uid(),unitId,date:x.date,time:x.time,title:"Lektion "+(n0+i+1),plan:"",note:"",done:false}));commit();lessonsModal(unitId);toast(ds.length+" lektioner skapades enligt schemat.")};
  m.querySelector("#sok").onclick=()=>{const n0=lessonsOf(unitId).length;dates().forEach((dt,i)=>state.lessons.push({id:uid(),unitId,date:dt,title:"Lektion "+(n0+i+1),plan:"",note:"",done:false}));commit();lessonsModal(unitId)}})}

function courseModal(id){const c=id?course(id):null;const opts=usedSubjects();if(!c&&!opts.length){modal("Välj dina ämnen först",`<p style="margin:0">En kurs hör till ett ämne. Välj först vilka ämnen du undervisar i.</p><div class="actions"><button class="btn pri" data-a="picker">Välj ämnen</button></div>`);return}
 const d=c||{name:"",subjectId:opts[0],groupId:(state.groups[0]||{}).id||"",color:COLORS[state.courses.length%COLORS.length]};let color=d.color;
 modal(c?"Redigera kurs":"Ny kurs",`<div class="f"><label for="cn">Kursnamn</label><input id="cn" value="${esc(d.name)}" placeholder="t.ex. Svenska 8B"></div>
 <div class="row"><div class="f"><label for="cs">Ämne</label><select id="cs">${Object.keys(FORM_LABEL).map(fk=>{const l=opts.filter(id=>formOf(id)===fk);return l.length?`<optgroup label="${esc(FORM_LABEL[fk])}">${l.map(id=>`<option value="${esc(id)}" ${d.subjectId===id?"selected":""}>${esc(subjTitle(id))}</option>`).join("")}</optgroup>`:""}).join("")}</select><button class="btn ghost small" data-a="picker" style="align-self:flex-start;margin-top:4px">Fler ämnen…</button></div>
 <div class="f"><label for="cg">Elevgrupp</label><select id="cg"><option value="">Ingen</option>${state.groups.map(g=>`<option value="${g.id}" ${d.groupId===g.id?"selected":""}>${esc(g.name)}</option>`).join("")}<option value="__new">+ Ny grupp…</option></select></div></div>
 <div class="f" id="cgnw" hidden><label for="cgn">Namn på ny grupp</label><input id="cgn" placeholder="t.ex. 9A"></div>
 <div class="f"><label>Färg</label><div class="swatches">${COLORS.map(x=>`<button class="sw" style="background:${x}" aria-pressed="${x===color}" data-c="${x}" aria-label="Färg ${x}"></button>`).join("")}</div></div>
 <div class="actions">${c?'<button class="btn danger" id="cdel">Ta bort kurs</button>':""}<span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="csave">Spara</button></div>`,m=>{
  m.querySelectorAll(".sw").forEach(b=>b.onclick=()=>{color=b.dataset.c;m.querySelectorAll(".sw").forEach(x=>x.setAttribute("aria-pressed",x===b))});
  m.querySelector("#cg").onchange=e=>{m.querySelector("#cgnw").hidden=e.target.value!=="__new"};
  m.querySelector("#csave").onclick=()=>{const n=val("cn").trim();if(!n){$("#cn").focus();return}let gid=val("cg");
   if(gid==="__new"){const gn=val("cgn").trim()||"Ny grupp";gid=uid();state.groups.push({id:gid,name:gn,students:[]})}
   const o={name:n,subjectId:val("cs"),groupId:gid,color};if(c)Object.assign(c,o);else{const nc=Object.assign({id:uid()},o);state.courses.push(nc);ui.course=nc.id;saveUI()}closeModal();commit()};
  const del=m.querySelector("#cdel");if(del)del.onclick=()=>confirmBox(`Ta bort kursen “${esc(c.name)}” med alla dess arbetsområden och bedömningar?`,()=>{const aids=state.assessments.filter(a=>a.courseId===c.id).map(a=>a.id);aids.forEach(a=>delete state.grades[a]);state.assessments=state.assessments.filter(a=>a.courseId!==c.id);state.units=state.units.filter(u=>u.courseId!==c.id);state.courses=state.courses.filter(x=>x!==c);ui.course=null;commit()})})}

function eventModal(id,preset){const e=id?state.events.find(x=>x.id===id):null;const d=e||Object.assign({title:"",start:fmtD(TODAY),end:fmtD(TODAY),type:"annat",groups:[],from:"",to:""},preset||{});
 const hint={lov:"Alla lektioner ställs in.",studiedag:"Alla lektioner ställs in den dagen.",aktivitet:"Lektioner för de valda grupperna ställs in, hela dagen eller under den tid du anger.",annat:"Påverkar inte lektionerna, t.ex. utvecklingssamtal eller ett prov.",deadline:"Påverkar inte lektionerna. Visas i rött i årshjulet."};
 modal(e?"Händelse i kalendariet":"Ny händelse i kalendariet",`<div class="f"><label for="et">Namn</label><input id="et" value="${esc(d.title)}" placeholder="t.ex. Friluftsdag, Prao, Studiedag"></div>
 <div class="row"><div class="f"><label for="es">Från</label><input type="date" id="es" value="${d.start}"></div><div class="f"><label for="ee">Till</label><input type="date" id="ee" value="${d.end}"></div></div>
 <div class="f"><label for="ety">Typ</label><select id="ety">${Object.entries(EVENT_TYPES).map(([k,l])=>`<option value="${k}" ${d.type===k?"selected":""}>${l}</option>`).join("")}</select><span class="small muted" id="ehint">${hint[d.type]||""}</span></div>
 <div id="eakt" ${d.type==="aktivitet"?"":"hidden"} style="display:grid;gap:12px">
  <div class="f"><label>Vilka grupper berörs?</label><div class="chips" id="egr"><button class="chip" aria-pressed="${!(d.groups||[]).length}" data-g="">Alla</button>${state.groups.map(g=>`<button class="chip" aria-pressed="${(d.groups||[]).includes(g.id)}" data-g="${g.id}">${esc(g.name)}</button>`).join("")}</div></div>
  <div class="row"><div class="f"><label for="efr">Från klockan</label><input type="time" id="efr" value="${d.from||""}"></div><div class="f"><label for="eto">Till klockan</label><input type="time" id="eto" value="${d.to||""}"></div></div>
  <span class="small muted" style="margin-top:-6px">Lämna tiderna tomma om aktiviteten pågår hela dagen.</span></div>
 <p class="small" id="eaff" style="margin:0"></p>
 <div class="actions">${e?'<button class="btn danger" id="edel">Ta bort</button>':""}<span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="esave">Spara</button></div>`,m=>{
  let groups=[...(d.groups||[])];
  const draft=()=>{let s=val("es"),en=val("ee")||s;if(en<s)[s,en]=[en,s];return {title:val("et").trim(),start:s,end:en,type:val("ety"),groups:val("ety")==="aktivitet"?groups:[],from:val("ety")==="aktivitet"?val("efr"):"",to:val("ety")==="aktivitet"?val("eto"):""}};
  const affected=()=>{const o=draft();if(!CANCELS[o.type]||!(state.schedule||[]).length){m.querySelector("#eaff").textContent="";return}
   const tmp=Object.assign({},state,{events:[Object.assign({id:"tmp"},o)],cancel:{}});let n=0;state.courses.forEach(c=>{n+=courseSlots(tmp,c.id,o.start,o.end).filter(x=>x.cancel).length});
   m.querySelector("#eaff").innerHTML=n?`<b>${n} lektion${n>1?"er":""}</b> i ditt schema ställs in.`:"Inga lektioner i ditt schema berörs."};
  const paintG=()=>m.querySelectorAll("#egr [data-g]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.g?groups.includes(b.dataset.g):!groups.length));
  m.querySelector("#egr").onclick=ev=>{const b=ev.target.closest("[data-g]");if(!b)return;const g=b.dataset.g;if(!g)groups=[];else groups=groups.includes(g)?groups.filter(x=>x!==g):groups.concat([g]);paintG();affected()};
  m.querySelector("#ety").onchange=()=>{const t=val("ety");m.querySelector("#eakt").hidden=t!=="aktivitet";m.querySelector("#ehint").textContent=hint[t]||"";affected()};
  ["es","ee","efr","eto"].forEach(x=>m.querySelector("#"+x).addEventListener("change",affected));affected();
  m.querySelector("#esave").onclick=()=>{const o=draft();if(!o.title){$("#et").focus();return}if(e)Object.assign(e,o);else state.events.push(Object.assign({id:uid()},o));closeModal();commit()};
  const del=m.querySelector("#edel");if(del)del.onclick=()=>{state.events=state.events.filter(x=>x!==e);closeModal();commit()}})}

function groupModal(id){const g=id?group(id):null;
 modal(g?"Elever i "+g.name:"Ny elevgrupp",`<div class="f"><label for="gn">Gruppens namn</label><input id="gn" value="${esc(g?g.name:"")}" placeholder="t.ex. 8B"></div>
 <div class="f"><label for="gs">Elever, en per rad</label><textarea id="gs" style="min-height:200px" placeholder="Klistra in från klasslistan">${g?esc(g.students.map(s=>s.name).join("\n")):""}</textarea></div>
 <p class="small muted" style="margin:0">Tar du bort ett namn försvinner elevens rad ur matrisen.</p>
 <div class="actions">${g?'<button class="btn danger" id="gdel">Ta bort grupp</button>':""}<span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="gsave">Spara</button></div>`,m=>{
  m.querySelector("#gsave").onclick=()=>{const n=val("gn").trim()||"Grupp";const names=val("gs").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
   const old=g?g.students:[];const used=new Set();const students=names.map(nm=>{const ex=old.find(s=>s.name===nm&&!used.has(s.id));if(ex){used.add(ex.id);return ex}return {id:uid(),name:nm}});
   if(g){g.name=n;g.students=students}else{const ng={id:uid(),name:n,students};state.groups.push(ng);ui.group=ng.id;saveUI()}closeModal();commit()};
  const del=m.querySelector("#gdel");if(del)del.onclick=()=>confirmBox(`Ta bort gruppen “${esc(g.name)}” och alla dess omdömen?`,()=>{state.assessments.filter(a=>a.groupId===g.id).forEach(a=>delete state.grades[a.id]);state.assessments=state.assessments.filter(a=>a.groupId!==g.id);state.groups=state.groups.filter(x=>x!==g);state.courses.forEach(c=>{if(c.groupId===g.id)c.groupId=""});ui.group=null;commit()})})}

const critText=t=>esc(t).replace(/\*([^*]+)\*/g,"<b>$1</b>");
function critChecklist(courseId,sel){const c=course(courseId);const cr=c&&critFor(c.subjectId);
 if(!cr)return `<p class="small muted" style="margin:0">Det finns inga betygskriterier från Skolverket för det här ämnet och stadiet. Beskriv bedömningen i rutan nedan.</p>`;
 return `<div class="cl">${cr.aspects.map((a,i)=>`<label><input type="checkbox" value="${i}" ${sel.includes(i)?"checked":""}><span>${critText(aspectLabel(a))}</span></label>`).join("")}</div><span class="small muted">Från Skolverkets betygskriterier${cr.year?" för slutet av åk "+esc(cr.year):""}. Varje vald del bedöms för sig.</span>`}
function assessModal(id){const a=id?state.assessments.find(x=>x.id===id):null;const g=group(ui.group);
 const cs=state.courses;const d=a||{title:"",date:fmtD(TODAY),courseId:ui.acourse!=="all"?ui.acourse:((cs.find(c=>c.groupId===(g||{}).id)||cs[0]||{}).id||""),unitId:"",desc:""};
 const unitOpts=cid=>`<option value="">Inget</option>`+state.units.filter(u=>u.courseId===cid).map(u=>`<option value="${u.id}" ${d.unitId===u.id?"selected":""}>${esc(u.title)}</option>`).join("");
 modal(a?"Bedömning":"Ny bedömning",`<div class="f"><label for="at">Namn</label><input id="at" value="${esc(d.title)}" placeholder="t.ex. Skriftligt prov algebra"></div>
 <div class="row"><div class="f"><label for="ad">Datum</label><input type="date" id="ad" value="${d.date}"></div><div class="f"><label for="ac">Kurs</label><select id="ac">${cs.map(c=>`<option value="${c.id}" ${d.courseId===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div></div>
 <div class="f"><label for="au">Arbetsområde</label><select id="au">${unitOpts(d.courseId)}</select><span class="small muted">Kopplingen gör att innehållet räknas som bedömt.</span></div>
 <div class="f"><label>Betygskriterier som uppgiften bedömer</label><div id="acrit">${critChecklist(d.courseId,d.aspects||[])}</div></div>
 <div class="f"><label for="ade">Uppgift och instruktioner</label><textarea id="ade" placeholder="Vad ska eleverna göra?">${esc(d.desc||"")}</textarea></div>
 <div class="actions">${a?'<button class="btn danger" id="adel">Ta bort</button>':""}<span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="asave">Spara</button></div>`,m=>{
  m.querySelector("#ac").onchange=e=>{d.unitId="";m.querySelector("#au").innerHTML=unitOpts(e.target.value);m.querySelector("#acrit").innerHTML=critChecklist(e.target.value,[])};
  m.querySelector("#asave").onclick=()=>{const t=val("at").trim();if(!t){$("#at").focus();return}if(!val("ac"))return;const o={title:t,date:val("ad"),courseId:val("ac"),unitId:val("au"),desc:val("ade"),aspects:[...m.querySelectorAll("#acrit input:checked")].map(x=>+x.value)};
   if(a)Object.assign(a,o);else state.assessments.push(Object.assign({id:uid(),groupId:g.id},o));closeModal();commit()};
  const del=m.querySelector("#adel");if(del)del.onclick=()=>confirmBox(`Ta bort “${esc(a.title)}” och alla omdömen på den?`,()=>{delete state.grades[a.id];state.assessments=state.assessments.filter(x=>x!==a);commit()})})}

function gradeModal(aid,sid){const a=state.assessments.find(x=>x.id===aid);const g=group(a.groupId);const s=g.students.find(x=>x.id===sid);if(!a||!s)return;
 const cur=(state.grades[aid]||{})[sid]||{k:"",note:""};let pick=cur.k;const asp=Object.assign({},cur.asp||{});let manual=!!cur.manual;const sc=scale();const idx=g.students.indexOf(s);const next=g.students[idx+1];
 const c=course(a.courseId);const cr=(a.aspects||[]).length&&c?critFor(c.subjectId):null;
 const btns=(sel,attr)=>`<div class="levels">${sc.levels.map((l,i)=>`<button class="lv" style="--h:${hueT(i/(sc.levels.length-1))}" aria-pressed="${sel===l.k}" ${attr} data-k="${l.k}">${esc(l.l)}</button>`).join("")}</div>`;
 const aspHtml=cr?a.aspects.filter(i=>cr.aspects[i]).map(i=>{const A=cr.aspects[i];return `<div class="asp"><details><summary>${critText(aspectLabel(A))}</summary>${cr.levels.map(k=>A[k]?`<p class="small"><b>${esc(cr.names[k])}:</b> ${critText(A[k])}</p>`:"").join("")}</details>${btns(asp[i],`data-asp="${i}"`)}</div>`}).join(""):"";
 modal(s.name,`<p class="small muted" style="margin:-8px 0 0">${esc(a.title)} · ${shortD(a.date)} · ${esc((c||{}).name||"")}</p>
 ${cr?`<h3 style="margin:0">Per kriterium</h3>${aspHtml}<h3 style="margin:0">Samlat omdöme <span class="small muted" id="gsug" style="font-weight:400"></span></h3>`:""}
 <div id="gmain">${btns(pick,'data-main="1"')}</div>
 <div class="f"><label for="gnote">Anteckning till eleven eller dig själv</label><textarea id="gnote" placeholder="Styrkor, nästa steg, anpassningar…">${esc(cur.note||"")}</textarea></div>
 <div class="actions">${cur.k||Object.keys(asp).length?'<button class="btn danger" id="gclr">Rensa</button>':""}<span class="sp"></span>${next?'<button class="btn" id="gnext">Spara och nästa elev</button>':""}<button class="btn pri" id="gsave">Spara</button></div>`,m=>{
  const paint=()=>{m.querySelectorAll("[data-main]").forEach(x=>x.setAttribute("aria-pressed",x.dataset.k===pick));m.querySelectorAll("[data-asp]").forEach(x=>x.setAttribute("aria-pressed",asp[x.dataset.asp]===x.dataset.k));
   const sg=m.querySelector("#gsug");if(sg){const ag=aggregateAspects(asp);sg.textContent=ag?(manual?"(förslag utifrån kriterierna: "+ag+")":"(förslag utifrån kriterierna)"):""}};
  m.querySelectorAll("[data-main]").forEach(b=>b.onclick=()=>{pick=pick===b.dataset.k?"":b.dataset.k;manual=!!pick;if(!pick&&cr){pick=aggregateAspects(asp)||"";manual=false}paint()});
  m.querySelectorAll("[data-asp]").forEach(b=>b.onclick=()=>{const i=b.dataset.asp;asp[i]=asp[i]===b.dataset.k?undefined:b.dataset.k;if(asp[i]===undefined)delete asp[i];if(!manual)pick=aggregateAspects(asp)||"";paint()});
  paint();
  const save=()=>{state.grades[aid]=state.grades[aid]||{};const note=val("gnote").trim();if(pick||note||Object.keys(asp).length)state.grades[aid][sid]=Object.assign({k:pick,note},Object.keys(asp).length?{asp,manual}:{});else delete state.grades[aid][sid];commit()};
  m.querySelector("#gsave").onclick=()=>{closeModal();save()};
  const nx=m.querySelector("#gnext");if(nx)nx.onclick=()=>{save();gradeModal(aid,next.id)};
  const cl=m.querySelector("#gclr");if(cl)cl.onclick=()=>{delete state.grades[aid][sid];closeModal();commit()}})}

function studentModal(gid,sid){const g=group(gid);const s=g&&g.students.find(x=>x.id===sid);if(!s)return;
 const as=state.assessments.filter(a=>a.groupId===gid).sort((a,b)=>a.date<b.date?-1:1);const byC={};as.forEach(a=>(byC[a.courseId]=byC[a.courseId]||[]).push(a));const sc=scale();
 const body=Object.entries(byC).map(([cid,list])=>{const c=course(cid)||{name:"Okänd kurs"};const sm=studentSummary(gid,sid,cid);const mk=sm.m==null?null:sc.levels[sm.m];
  return `<div><div class="area-h"><span class="dot" style="background:${c.color}"></span><h3>${esc(c.name)}</h3><span class="sp" style="flex:1"></span><span class="small">Typnivå <b class="${mk&&mk.low?"lowtag":""}">${mk?esc(mk.l):"–"}</b></span></div>
  ${(()=>{const cr=critFor((course(cid)||{}).subjectId);const ev=aspectEvidence(state,cid,sid);const ks=Object.keys(ev);if(!cr||!ks.length)return "";
    return `<div class="evid"><b class="small">Underlag per kriterium</b>${ks.sort((x,y)=>x-y).map(i=>{const e=ev[i];const t=lvT(e.k);return `<div class="evrow"><span class="small">${critText(aspectLabel(cr.aspects[i]||{}))}</span><span class="cell g" style="width:auto;min-width:44px;border-radius:8px;--h:${hueT(t)}">${esc(e.k)}</span><span class="small muted">${e.n} st</span></div>`}).join("")}</div>`})()}
  <div class="list">${list.map(a=>{const v=(state.grades[a.id]||{})[sid];const t=v?lvT(v.k):null;return `<div class="li"><span class="when num">${shortD(a.date)}</span><span class="what"><b>${esc(a.title)}</b>${v&&v.note?`<br><span class="small muted">${esc(v.note)}</span>`:""}</span><button class="cell ${t!=null?"g":""}" style="width:auto;min-width:52px;border-radius:8px;${t!=null?`--h:${hueT(t)}`:""}" data-a="grade" data-as="${a.id}" data-st="${sid}">${v&&v.k?esc(v.k):'<span class="muted small">Ej bedömt</span>'}</button></div>`}).join("")}</div></div>`}).join("");
 const all=studentSummary(gid,sid,"all");
 modal(s.name,`<p class="small muted" style="margin:-8px 0 0">${esc(g.name)} · ${all.count} omdömen · ${all.low} under godtagbar nivå · ${all.missing} saknas</p>${body||'<div class="empty">Inga bedömningar ännu.</div>'}`)}

function subjectModal(){modal("Eget ämne",`<div class="row"><div class="f"><label for="sn">Ämne</label><input id="sn" placeholder="t.ex. Bild"></div><div class="f"><label for="sst">Stadium</label><input id="sst" placeholder="t.ex. åk 7–9"></div></div>
 <div class="f"><label for="sc">Centralt innehåll</label><textarea id="sc" style="min-height:220px" placeholder="# Bildframställning&#10;Framställning av berättande och informativa bilder&#10;Tekniker för teckning och måleri&#10;# Redskap för bildframställning&#10;..."></textarea><span class="small muted">Rader som börjar med # blir kunskapsområden. Övriga rader blir punkter. Kopiera gärna från kursplanen på skolverket.se.</span></div>
 <div class="actions"><span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="ssave">Spara</button></div>`,m=>m.querySelector("#ssave").onclick=()=>{const n=val("sn").trim();if(!n){$("#sn").focus();return}const sid="x"+uid();const areas=[];let cur=null;
  val("sc").split(/\r?\n/).map(l=>l.trim().replace(/^[-•*]\s*/,"")).filter(Boolean).forEach(l=>{if(l.startsWith("#")){cur={id:sid+"-"+(areas.length+1),name:l.replace(/^#+\s*/,""),items:[]};areas.push(cur)}else{if(!cur){cur={id:sid+"-1",name:"Centralt innehåll",items:[]};areas.push(cur)}cur.items.push({id:cur.id+"-"+(cur.items.length+1),text:l})}});
  state.custom[sid]={id:sid,name:n,stage:val("sst"),form:"X",areas};ui.subject=sid;saveUI();closeModal();commit()})}

function addItemModal(areaId){const s=subj(ui.subject);const a=s.areas.find(x=>x.id===areaId);modal("Eget innehåll",`<p class="small muted" style="margin:-8px 0 0">${esc(subjTitle(s.id))} · ${esc(a.name)}</p><div class="f"><label for="it">Formulering</label><textarea id="it" placeholder="t.ex. Lokalt mål: digital kompetens i skrivprocessen"></textarea></div><div class="actions"><span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="isave">Lägg till</button></div>`,m=>m.querySelector("#isave").onclick=()=>{const t=val("it").trim();if(!t)return;
 if(s.official){(state.extra[s.id]=state.extra[s.id]||[]).push({id:s.id+"~c"+uid(),area:a.id,text:t})}else{state.custom[s.id].areas.find(x=>x.id===areaId).items.push({id:a.id+"-c"+uid(),text:t,custom:true})}closeModal();commit()})}

/* ---------- välj ämnen ---------- */
function pickerModal(after){
 const sel=new Set(state.mine);let form=ui.pickForm||"GR",q="";
 const norm=t=>t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
 const list=()=>{const f=FORMS.find(x=>x.id===form);const nq=norm(q.trim());let subs=f.subjects;
  if(nq)subs=subs.filter(x=>norm(x.name).includes(nq)||x.plans.some(p=>norm(p.name).includes(nq)));
  const chosenHere=f.subjects.filter(x=>x.plans.some(p=>sel.has(p.id)));
  const big=subs.length>80&&!nq;const shown=big?[...new Set([...chosenHere,...subs.slice(0,60)])]:subs;
  return (shown.length?shown.map(x=>`<div class="pk-row"><b>${esc(x.name)}</b><div class="chips">${x.plans.map(p=>`<button class="chip pk" aria-pressed="${sel.has(p.id)}" data-pid="${esc(p.id)}">${esc(form==="GYOLD"?p.name:p.name.replace(/^Åk /,"åk ").replace(/^Nivå /,"nivå "))}</button>`).join("")}</div></div>`).join(""):`<p class="muted">Inget ämne matchar ”${esc(q)}”.</p>`)
   +(big?`<p class="small muted">Visar ${shown.length} av ${subs.length} ämnen. Sök för att hitta resten.</p>`:"")};
 const counts=()=>FORMS.map(f=>{const n=f.subjects.reduce((k,x)=>k+x.plans.filter(p=>sel.has(p.id)).length,0);return `<button class="chip" aria-pressed="${f.id===form}" data-form="${f.id}">${esc(f.name)}${n?` <span class="pill p-covered" style="padding:0 6px">${n}</span>`:""}</button>`}).join("");
 modal("Välj dina ämnen",`<p class="small muted" style="margin:-8px 0 0">Tryck på årskurser, nivåer eller kurser du undervisar i. Centralt innehåll kommer ordagrant från Skolverket.</p>
  <div class="chips" id="pk-forms">${counts()}</div>
  <div class="f"><label for="pk-q">Sök ämne</label><input id="pk-q" type="search" placeholder="t.ex. svenska, programmering, vård" autocomplete="off"></div>
  <div id="pk-list" class="pk-list">${list()}</div>
  <div class="actions"><span class="small muted" id="pk-n" style="align-self:center">${sel.size} valda</span><span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="pk-ok">Klar</button></div>`,m=>{
  const L=m.querySelector("#pk-list"),Fm=m.querySelector("#pk-forms"),N=m.querySelector("#pk-n");
  const upd=()=>{L.innerHTML=list();Fm.innerHTML=counts();N.textContent=sel.size+" valda"};
  m.querySelector("#pk-q").addEventListener("input",e=>{q=e.target.value;L.innerHTML=list()});
  Fm.addEventListener("click",e=>{const b=e.target.closest("[data-form]");if(!b)return;form=b.dataset.form;ui.pickForm=form;upd();L.scrollTop=0});
  L.addEventListener("click",e=>{const b=e.target.closest(".pk");if(!b)return;const id=b.dataset.pid;if(sel.has(id))sel.delete(id);else sel.add(id);b.setAttribute("aria-pressed",sel.has(id));Fm.innerHTML=counts();N.textContent=sel.size+" valda"});
  m.querySelector("#pk-ok").onclick=()=>{state.mine=[...sel];if(!state.mine.includes(ui.subject))ui.subject=state.mine[0]||ui.subject;closeModal();commit();after&&after()};
 })}

function roInfo(){modal("Läsläge",`<p style="margin:0">Du tittar på <b>${esc(RO_NAME||"en fil")}</b> i läsläge. Ingenting sparas här, så filen kan aldrig skrivas över från telefonen.</p><p class="small muted" style="margin:0">När du har ändrat något på datorn och filen har synkats: öppna den igen här för att se det senaste.</p><div class="actions"><button class="btn" data-a="close">Stäng</button><span class="sp"></span><button class="btn pri" data-a="open-ro">Öppna nyare fil</button></div>`)}
function welcomeModal(){modal("Välkommen till Lärarbordet",`<p style="margin:0">Här planerar du kurser, håller koll på årshjulet, ser vilket centralt innehåll du har täckt och bedömer elevernas arbeten. Allt på ett ställe, och allt sparas på din egen dator.</p>
 <div style="display:grid;gap:10px">
  <button class="btn pri" id="w-blank" style="justify-content:center;padding:12px">Börja med ett tomt Lärarbordet</button>
  <button class="btn" id="w-ex" style="justify-content:center;padding:12px">Titta runt med exempeldata först</button>
  ${DESKTOP?"":`<button class="btn" data-a="open-ro" style="justify-content:center;padding:12px">Öppna min fil i läsläge</button><span class="small muted" style="margin-top:-4px">För telefonen: välj din lararbordet.json eller lararbordet.html, till exempel från skolans Drive. Inget kan ändras eller skrivas över.</span>`}</div>
 <p class="small muted" style="margin:0">Exempeldatan kan du ta bort när som helst under Inställningar → Rensa allt.</p>`,m=>{
  m.querySelector("#w-blank").onclick=()=>{const y=state.year;state=emptyState();state.year=y;closeModal();commit();pickerModal()};
  m.querySelector("#w-ex").onclick=()=>closeModal()})}

/* ---------- nytt läsår ---------- */
function newYearModal(){const ys=parseD(state.year.start),ye=parseD(state.year.end);
 const ns=fmtD(addDays(mondayOf(new Date(ys.getFullYear()+1,ys.getMonth(),ys.getDate())),0)),ne=fmtD(new Date(ye.getFullYear()+1,ye.getMonth(),ye.getDate()));
 const ck=(id,l,on,help)=>`<label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="${id}" ${on?"checked":""} style="margin-top:4px"><span>${l}${help?`<br><span class="small muted">${help}</span>`:""}</span></label>`;
 modal("Starta nytt läsår",`<p style="margin:0">Läsår ${esc(yearLabel(state.year))} sparas under Tidigare läsår. Där kan du öppna det igen när du vill.</p>
 <div class="row"><div class="f"><label for="nys">Första skoldag</label><input type="date" id="nys" value="${ns}"></div><div class="f"><label for="nye">Sista skoldag</label><input type="date" id="nye" value="${ne}"></div></div>
 <div style="display:grid;gap:10px">
  ${ck("ny-c","Kopiera kurser och arbetsområden",true,"Datumen flyttas till samma veckor nästa läsår. Alla arbetsområden blir planerade.")}
  ${ck("ny-l","Kopiera lektioner",true,"Upplägget följer med, anteckningar och bockar tas bort.")}
  ${ck("ny-g","Behåll elevgrupper och elever",false,"Byt gärna namn på grupperna efteråt, t.ex. 8B till 9B. Omdömen följer aldrig med.")}
  ${ck("ny-a","Kopiera bedömningsuppgifter",false,"Kräver att elevgrupperna behålls.")}
  ${ck("ny-e","Kopiera lov och händelser",false,"Kontrollera datumen efteråt. Lov flyttar sig mellan åren.")}
 </div>
 <div class="actions"><span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="nyok">Starta nytt läsår</button></div>`,m=>{
  m.querySelector("#nyok").onclick=()=>{const s=val("nys"),e=val("nye");if(!s||!e||e<=s){m.querySelector("#nye").focus();return}
   const on=id=>m.querySelector("#"+id).checked;const ny=rollover(state,{start:s,end:e,courses:on("ny-c"),lessons:on("ny-l"),groups:on("ny-g"),assessments:on("ny-a"),events:on("ny-e")});
   applyNewYear(state,ny);state.example=false;ui=Object.assign(ui,{course:null,group:null,acourse:"all",wheel:"all"});closeModal();commit();location.hash="planering"}})}

/* ---------- dela kurs ---------- */
function shareCourse(id){const pkg=exportCourse(state,id);if(!pkg)return;const c=course(id);
 offerFile("kurs-"+c.name.replace(/[^\wåäöÅÄÖ-]+/g,"-").toLowerCase()+".lararbordet.json",JSON.stringify(pkg,null,1),"application/json");
 modal("Dela kurs",`<p style="margin:0">Kursen <b>${esc(c.name)}</b> sparas som en fil med ${pkg.units.length} arbetsområden, ${pkg.lessons.length} lektioner och ${pkg.assessments.length} bedömningsuppgifter.</p><p class="small" style="margin:0"><b>Inga elever, omdömen eller anteckningar om elever följer med.</b> Skicka filen till en kollega, som väljer Importera kurs under Planering.</p><div class="actions"><button class="btn pri" data-a="close">Klar</button></div>`)}
function importCourseModal(text){let pkg;try{pkg=JSON.parse(text)}catch(e){pkg=null}
 if(!pkg||pkg.type!=="lararbordet-kurs"){modal("Kunde inte importera",`<p style="margin:0">Filen är ingen delad kurs från Lärarbordet. Den ska sluta på <b>.lararbordet.json</b>.</p><div class="actions"><button class="btn pri" data-a="close">OK</button></div>`);return}
 modal("Importera kurs",`<p style="margin:0"><b>${esc(pkg.course.name)}</b> · ${esc(subjTitle(pkg.course.subjectId)||"")}<br><span class="small muted">${pkg.units.length} arbetsområden · ${(pkg.lessons||[]).length} lektioner · ${(pkg.assessments||[]).length} bedömningsuppgifter. Datumen flyttas till samma veckor i ditt läsår.</span></p>
 <div class="f"><label for="icg">Elevgrupp</label><select id="icg"><option value="">Ingen just nu</option>${state.groups.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("")}</select><span class="small muted">Bedömningsuppgifter följer bara med om du väljer en elevgrupp.</span></div>
 <div class="actions"><span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="icok">Importera</button></div>`,m=>{
  m.querySelector("#icok").onclick=()=>{const c=importCourse(state,pkg,val("icg"));ui.course=c.id;closeModal();commit();location.hash="planering"}})}

/* ---------- export / import ---------- */
async function offerFile(filename,data,mime){
 if(DESKTOP){try{const ext=filename.split(".").pop();const p=await T.dialog.save({defaultPath:await T.path.join(await T.path.documentDir(),filename),filters:[{name:ext.toUpperCase(),extensions:[ext]}]});if(p)await T.fs.writeTextFile(p,data)}catch(e){modal("Kunde inte spara",`<p style="margin:0">Filen kunde inte skrivas. Välj en annan mapp och försök igen.</p><div class="actions"><button class="btn pri" data-a="close">OK</button></div>`)}return}
 try{downloadBlob(filename,data,mime)}catch(e){modal("Kopiera data",`<p class="small" style="margin:0">Nedladdning gick inte. Kopiera texten och spara den som <b>${esc(filename)}</b>.</p><div class="f"><textarea id="cp" style="min-height:220px" readonly>${esc(data)}</textarea></div>`)}}
function csv(){const g=group(ui.group);const as=state.assessments.filter(a=>a.groupId===g.id&&(ui.acourse==="all"||a.courseId===ui.acourse));const q=s=>'"'+String(s).replace(/"/g,'""')+'"';
 return [["Elev",...as.map(a=>a.title+" ("+a.date+")")].map(q).join(";"),...g.students.map(s=>[s.name,...as.map(a=>((state.grades[a.id]||{})[s.id]||{}).k||"")].map(q).join(";"))].join("\r\n")}
