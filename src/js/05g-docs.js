/* ---------- dokument att skriva ut eller dela: LPP och veckoplanering ---------- */
const DOC_CSS=`body{font-family:Georgia,"Times New Roman",serif;color:#1b1f24;max-width:760px;margin:32px auto;padding:0 24px;line-height:1.5;font-size:15px}
h1{font-family:Arial,Helvetica,sans-serif;font-size:26px;margin:0 0 4px}h2{font-family:Arial,Helvetica,sans-serif;font-size:17px;margin:26px 0 8px;padding-bottom:4px;border-bottom:2px solid #1f3550;color:#1f3550}
h3{font-family:Arial,Helvetica,sans-serif;font-size:14px;margin:14px 0 4px}.meta{color:#555;font-family:Arial,Helvetica,sans-serif;font-size:13px}
ul{padding-left:20px;margin:6px 0}li{margin:2px 0}table{border-collapse:collapse;width:100%;font-size:13px;margin:6px 0}th,td{border:1px solid #c9ced6;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#eef1f5;font-family:Arial,Helvetica,sans-serif}.day{page-break-inside:avoid}.small{font-size:12px;color:#555}.pre{white-space:pre-line}.x{text-decoration:line-through;color:#888}
footer{margin-top:36px;font-size:11px;color:#888;font-family:Arial,Helvetica,sans-serif}@media print{body{margin:0 auto}a{color:inherit;text-decoration:none}}`;
const docWrap=(title,body)=>`<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${DOC_CSS}</style></head><body>${body}<footer>Skapad med Lärarbordet</footer></body></html>`;
const fileSafe=t=>String(t||"dokument").replace(/[^\wåäöÅÄÖ-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").toLowerCase();
/* förhandsvisning med Skriv ut / Spara som PDF och Spara som fil */
function docPreview(title,build,opts){let html="";
 modal(title,`${opts||""}<iframe class="doc-frame" id="docf" title="Förhandsvisning"></iframe>
 <p class="small muted" style="margin:0">Välj <b>Skriv ut</b> och sedan <b>Spara som PDF</b> för att få en PDF. Filen (.html) kan öppnas i alla webbläsare och delas, t.ex. i Classroom eller Teams.</p>
 <div class="actions"><button class="btn" id="docsave">Spara som fil</button><span class="sp"></span><button class="btn" data-a="close">Stäng</button><button class="btn pri" id="docprint">Skriv ut / Spara som PDF</button></div>`,m=>{
  m.classList.add("wide");const f=m.querySelector("#docf");const paint=()=>{html=build();f.srcdoc=html};paint();
  m.querySelectorAll("[data-docopt]").forEach(x=>x.addEventListener(x.tagName==="TEXTAREA"||x.type==="text"?"input":"change",()=>{clearTimeout(paint.t);paint.t=setTimeout(paint,300)}));
  m.querySelector("#docsave").onclick=()=>offerFile(fileSafe(title)+".html",html,"text/html");
  m.querySelector("#docprint").onclick=()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){offerFile(fileSafe(title)+".html",html,"text/html");toast("Öppna filen i webbläsaren och skriv ut därifrån.")}}})}
const itemText=(sid,id)=>{const s=subj(sid);if(!s)return null;for(const a of s.areas){const i=a.items.find(x=>x.id===id);if(i)return {area:a.name,text:i.text}}return null};
const plainCrit=t=>String(t||"").replace(/\*([^*]+)\*/g,"$1");

/* LPP: lokal pedagogisk planering för ett arbetsområde */
function lppModal(unitId){const u=unit(unitId);if(!u)return;const c=course(u.courseId)||{};const s=subj(c.subjectId)||{};const g=group(c.groupId);
 const ls=lessonsOf(u.id).sort((a,b)=>a.date<b.date?-1:1);const as=state.assessments.filter(a=>a.unitId===u.id).sort((a,b)=>a.date<b.date?-1:1);
 const opts=`<div class="row"><div class="f"><label for="lppg">Syfte och mål (vad eleverna ska lära sig)</label><textarea id="lppg" data-docopt style="min-height:70px">${esc(u.lppGoal||u.desc||"")}</textarea></div>
  <div class="f"><label for="lppw">Arbetssätt (hur vi arbetar)</label><textarea id="lppw" data-docopt style="min-height:70px" placeholder="t.ex. genomgångar, läsning i par, skrivande med respons">${esc(u.lppWork||"")}</textarea></div></div>
  <div class="row-b"><label class="chk"><input type="checkbox" id="lppl" data-docopt checked><span>Tidsplan med lektioner</span></label><label class="chk"><input type="checkbox" id="lppk" data-docopt checked><span>Betygskriterier</span></label><label class="chk"><input type="checkbox" id="lppt" data-docopt><span>Lärare: </span></label><input id="lppn" data-docopt type="text" placeholder="Namn" value="${esc(u.lppTeacher||"")}" style="max-width:180px"></div>`;
 const build=()=>{const goal=val("lppg"),work=val("lppw"),withL=($("#lppl")||{}).checked!==false,withK=($("#lppk")||{}).checked!==false,teacher=($("#lppt")||{}).checked?val("lppn").trim():"";
  if(u.lppGoal!==goal||u.lppWork!==work||(u.lppTeacher||"")!==val("lppn").trim()){u.lppGoal=goal;u.lppWork=work;u.lppTeacher=val("lppn").trim();commit(true)}
  const ci={};(u.contentIds||[]).forEach(id=>{const t=itemText(c.subjectId,id);if(t)(ci[t.area]=ci[t.area]||[]).push(t.text)});
  const cr=withK&&c.subjectId?critFor(c.subjectId):null;const asp=[...new Set(as.flatMap(a=>a.aspects||[]))].sort((a,b)=>a-b);
  return docWrap("LPP "+u.title,`<h1>${esc(u.title)}</h1><div class="meta">${esc(c.name||"")}${s.name?" · "+esc(s.name)+" "+esc(s.stage||""):""}${g?" · "+esc(g.name):""} · ${esc(wkRange(u.start,u.end))} (${shortD(u.start)}–${shortD(u.end)})${teacher?" · Lärare: "+esc(teacher):""}</div>
   ${goal?`<h2>Syfte och mål</h2><p class="pre">${esc(goal)}</p>`:""}
   ${Object.keys(ci).length?`<h2>Centralt innehåll</h2>${Object.entries(ci).map(([a,l])=>`<h3>${esc(a)}</h3><ul>${l.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`).join("")}`:""}
   ${work?`<h2>Arbetssätt</h2><p class="pre">${esc(work)}</p>`:""}
   ${as.length?`<h2>Bedömning</h2><ul>${as.map(a=>`<li><b>${esc(a.title)}</b> · ${shortD(a.date)}${a.type?" · "+esc(atypeL(a)):""}${a.desc?`<br><span class="pre">${esc(a.desc)}</span>`:""}</li>`).join("")}</ul>`:""}
   ${cr&&asp.length?`<h2>Betygskriterier som bedöms</h2><table><thead><tr>${cr.levels.map(k=>`<th>${esc(cr.names[k])}</th>`).join("")}</tr></thead><tbody>${asp.filter(i=>cr.aspects[i]).map(i=>`<tr>${cr.levels.map(k=>`<td>${esc(plainCrit(cr.aspects[i][k]||""))}</td>`).join("")}</tr>`).join("")}</tbody></table><p class="small">Från Skolverkets betygskriterier${cr.year?" för slutet av åk "+esc(cr.year):""}.</p>`:""}
   ${withL&&ls.length?`<h2>Tidsplan</h2><table><thead><tr><th style="width:110px">Datum</th><th>Lektion</th></tr></thead><tbody>${ls.map(l=>`<tr><td>${shortD(l.date)}</td><td><b>${esc(l.title||"Lektion")}</b>${l.plan?`<br><span class="pre small">${esc(l.plan)}</span>`:""}</td></tr>`).join("")}</tbody></table>`:""}`)};
 docPreview("LPP "+u.title,build,opts)}

/* Veckoplanering för elever: veckans lektioner, inlämningar och händelser */
function weekPlanModal(courseId){let off=0;
 const opts=`<div class="row-b" style="align-items:center"><button class="btn small" id="wpp">‹</button><b id="wpw"></b><button class="btn small" id="wpn">›</button>
  <select id="wpc" data-docopt style="font:inherit;padding:4px 8px;border-radius:6px"><option value="">Alla kurser</option>${state.courses.map(c=>`<option value="${c.id}" ${c.id===courseId?"selected":""}>${esc(c.name)}</option>`).join("")}</select>
  <label class="chk"><input type="checkbox" id="wpl" data-docopt checked><span>Visa planen för lektionerna</span></label></div>
  <div class="f"><label for="wpm">Meddelande till eleverna (valfritt)</label><textarea id="wpm" data-docopt style="min-height:50px" placeholder="t.ex. Kom ihåg att ta med läsboken!"></textarea></div>`;
 const build=()=>{const mon=addDays(mondayOf(TODAY),off*7);const cid=val("wpc");const cs=cid?[course(cid)].filter(Boolean):state.courses;const ids=new Set(cs.map(c=>c.id));const withP=($("#wpl")||{}).checked!==false;
  const w=document.getElementById("wpw");if(w)w.textContent="Vecka "+isoWeek(mon);
  const days=[1,2,3,4,5].map(i=>{const ds=fmtD(addDays(mon,i-1));const d=parseD(ds);
   const occ=(state.schedule||[]).length?dayOccurrences(ds).filter(o=>ids.has(o.course.id)):[];
   const lsx=(state.lessons||[]).filter(l=>l.date===ds).filter(l=>{const u=unit(l.unitId);return ids.has(u?u.courseId:l.courseId)});
   const rows=occ.length?occ.map(o=>`<tr><td style="width:90px">${esc(o.slot.start)}–${esc(o.slot.end)}</td><td class="${o.cancel?"x":""}"><b>${esc(o.course.name)}</b>${o.slot.room?` · ${esc(o.slot.room)}`:""}${o.cancel?` (inställd: ${esc(o.cancel.reason)})`:o.lesson?`<br>${esc(o.lesson.title)}${withP&&o.lesson.plan?`<br><span class="pre small">${esc(o.lesson.plan)}</span>`:""}`:o.unit?`<br><span class="small">${esc(o.unit.title)}</span>`:""}</td></tr>`).join("")
    :lsx.map(l=>{const c=course((unit(l.unitId)||{}).courseId||l.courseId)||{};return `<tr><td style="width:90px">${esc(l.time||"")}</td><td><b>${esc(c.name||"")}</b><br>${esc(l.title||"")}${withP&&l.plan?`<br><span class="pre small">${esc(l.plan)}</span>`:""}</td></tr>`}).join("");
   const ev=eventsIn(d,d).map(e=>`<li>${esc(e.title)}${e.from&&e.to?` ${esc(e.from)}–${esc(e.to)}`:""}</li>`).join("");
   return `<div class="day"><h3>${cap(DAY[i])} ${d.getDate()}/${d.getMonth()+1}</h3>${ev?`<ul>${ev}</ul>`:""}${rows?`<table><tbody>${rows}</tbody></table>`:ev?"":`<p class="small">Inga lektioner.</p>`}</div>`}).join("");
  const due=state.assessments.filter(a=>ids.has(a.courseId)&&a.date>=fmtD(mon)&&a.date<=fmtD(addDays(mon,6))).sort((a,b)=>a.date<b.date?-1:1);
  const msg=val("wpm").trim();const ttl=(cs.length===1?cs[0].name+" · ":"")+"Vecka "+isoWeek(mon);
  return docWrap(ttl,`<h1>Veckoplanering vecka ${isoWeek(mon)}</h1><div class="meta">${cs.length===1?esc(cs[0].name)+" · ":""}${shortD(fmtD(mon))}–${shortD(fmtD(addDays(mon,4)))}</div>
   ${msg?`<p class="pre" style="background:#fff8db;padding:10px 12px;border-radius:6px">${esc(msg)}</p>`:""}
   ${due.length?`<h2>Inlämningar och prov</h2><ul>${due.map(a=>`<li><b>${esc(a.title)}</b> · ${cap(DAY[parseD(a.date).getDay()])} ${shortD(a.date)}${cs.length>1?" · "+esc((course(a.courseId)||{}).name||""):""}${a.type?" · "+esc(atypeL(a)):""}</li>`).join("")}</ul>`:""}
   <h2>Veckans lektioner</h2>${days}`)};
 docPreview("Veckoplanering",build,opts);
 const go=d=>{off+=d;const f=$("#docf");if(f)f.srcdoc=build()};
 const p=$("#wpp"),n=$("#wpn");if(p)p.onclick=()=>go(-1);if(n)n.onclick=()=>go(1);const f=$("#docf");if(f)f.srcdoc=build();
 const sv=$("#docsave");if(sv)sv.onclick=()=>offerFile("veckoplanering-v"+isoWeek(addDays(mondayOf(TODAY),off*7))+".html",build(),"text/html")}

/* ---------- sökning i allt ---------- */
function searchIndex(){const out=[];const add=(kind,title,sub,act,id,extra)=>out.push({kind,title:title||"",sub:sub||"",act,id,hay:((title||"")+" "+(sub||"")+" "+(extra||"")).toLowerCase()});
 state.courses.forEach(c=>add("Kurs",c.name,subjTitle(c.subjectId),"sel-course-go",c.id));
 state.units.forEach(u=>add("Arbetsområde",u.title,(course(u.courseId)||{}).name+" · "+wkRange(u.start,u.end),"edit-unit",u.id,u.desc));
 (state.lessons||[]).forEach(l=>{const c=course((unit(l.unitId)||{}).courseId||l.courseId)||{};if(l.unitId)add("Lektion",l.title||"Lektion",(c.name||"")+" · "+shortD(l.date),"edit-lesson",l.id,(l.plan||"")+" "+(l.note||""))});
 state.assessments.forEach(a=>add("Uppgift",a.title,(course(a.courseId)||{}).name+" · "+shortD(a.date)+(a.type?" · "+atypeL(a):""),"edit-assess",a.id,a.desc));
 state.groups.forEach(g=>g.students.forEach(s=>add("Elev",s.name,g.name+(adaptList(s).length?" · anpassningar":""),"student-go",g.id+"|"+s.id,adaptList(s).join(" ")+" "+(s.note||""))));
 state.events.forEach(e=>add("Händelse",e.title,shortD(e.start)+(e.end!==e.start?"–"+shortD(e.end):""),"edit-event",e.id));
 (state.process||[]).forEach(p=>add("Skrivarbete",p.title,(group(p.groupId)||{}).name,"proc-go",p.id));
 (state.schedule||[]).forEach(sl=>{const c=course(sl.courseId);if(c)add("Schema",c.name,cap(DAY[sl.day])+" "+sl.start+"–"+sl.end+(sl.room?" · "+sl.room:""),"edit-slot",sl.id,sl.note)});
 return out}
function searchModal(){const idx=searchIndex();
 modal("Sök",`<div class="f"><input id="sq" type="search" placeholder="Sök kurser, arbetsområden, lektioner, uppgifter, elever…" autocomplete="off"></div><div id="sres" class="list sres"></div>
 <p class="small muted" style="margin:0">Tips: tryck <kbd>/</kbd> var som helst för att söka.</p>`,m=>{
  const q=m.querySelector("#sq");setTimeout(()=>q.focus(),30);
  const draw=()=>{const t=q.value.trim().toLowerCase();const r=m.querySelector("#sres");if(!t){r.innerHTML="";return}const words=t.split(/\s+/);
   const hits=idx.filter(x=>words.every(w=>x.hay.includes(w))).slice(0,40);
   r.innerHTML=hits.length?hits.map(x=>`<button class="li sr" data-a="${x.act}" data-id="${esc(x.id)}"><span class="tag">${esc(x.kind)}</span><span class="what"><b>${esc(x.title)}</b><br><span class="small muted">${esc(x.sub)}</span></span></button>`).join(""):`<p class="small muted">Inget hittades.</p>`};
  q.oninput=draw;q.onkeydown=e=>{if(e.key==="Enter"){const f=m.querySelector(".sr");if(f)f.click()}}})}
document.addEventListener("keydown",e=>{if(e.key==="/"&&!e.ctrlKey&&!e.metaKey){const t=e.target;if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT"||t.isContentEditable))return;if(document.body.classList.contains("locked")||$("#modalroot .modal"))return;e.preventDefault();searchModal()}});

/* ---------- ämnesbibliotek i arbetslaget: en delad mapp med kursfiler ---------- */
let LIB_DIR="";try{LIB_DIR=localStorage.getItem("lb-libdir")||""}catch(e){}
async function libFiles(){if(!DESKTOP||!LIB_DIR)return [];try{const ents=await T.fs.readDir(LIB_DIR);const out=[];
  for(const e of ents.filter(x=>/\.lararbordet\.json$/i.test(x.name))){try{const p=await T.path.join(LIB_DIR,e.name);const pkg=JSON.parse(await T.fs.readTextFile(p));if(pkg&&pkg.type==="lararbordet-kurs")out.push({name:e.name,path:p,pkg})}catch(err){}}
  return out.sort((a,b)=>a.pkg.course.name.localeCompare(b.pkg.course.name,"sv"))}catch(e){return []}}
async function libraryModal(){const files=await libFiles();
 modal("Ämnesbibliotek",`<p class="small" style="margin:0">Ett bibliotek är en <b>delad mapp</b> för arbetslaget, t.ex. i skolans Google Drive, OneDrive eller Teams. Där lägger ni kurser med arbetsområden, lektioner och uppgifter som alla kan hämta. <b>Inga elever eller omdömen följer med.</b></p>
 ${DESKTOP?`<div class="sec-box"><b>Bibliotekets mapp</b><span class="small muted" style="word-break:break-all">${LIB_DIR?esc(LIB_DIR):"Ingen mapp vald än."}</span><div class="row-b"><button class="btn small" id="libpick">${LIB_DIR?"Byt mapp…":"Välj mapp…"}</button></div></div>
  ${LIB_DIR?`<h3 style="margin:0">Kurser i biblioteket (${files.length})</h3>${files.length?`<div class="list">${files.map((f,i)=>`<div class="li"><span class="what"><b>${esc(f.pkg.course.name)}</b><br><span class="small muted">${esc(subjTitle(f.pkg.course.subjectId)||"")} · ${f.pkg.units.length} arbetsområden · ${(f.pkg.assessments||[]).length} uppgifter · delad ${esc(f.pkg.exported||"")}</span></span><button class="btn small" data-lib="${i}">Hämta</button></div>`).join("")}</div>`:`<p class="small muted">Biblioteket är tomt. Dela en kurs dit med knappen nedan.</p>`}
   <div class="f"><label for="libc">Lägg en av dina kurser i biblioteket</label><div class="row-b"><select id="libc" style="font:inherit;padding:6px 8px;border-radius:6px">${state.courses.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select><button class="btn small pri" id="libshare">Dela till biblioteket</button></div></div>`:""}`
 :`<p class="small" style="margin:0">I webbläsaren: spara kursen med <b>Dela kurs</b> under Planering och lägg filen i arbetslagets delade mapp. Kollegor hämtar den med <b>Importera kurs</b>. I datorappen kan du välja mappen här och se alla kurser direkt.</p>`}
 <div class="actions"><span class="sp"></span><button class="btn pri" data-a="close">Klart</button></div>`,m=>{
  const pk=m.querySelector("#libpick");if(pk)pk.onclick=async()=>{try{const p=await T.dialog.open({directory:true,multiple:false});if(!p)return;LIB_DIR=typeof p==="string"?p:p.path;try{localStorage.setItem("lb-libdir",LIB_DIR)}catch(e){}closeModal();libraryModal()}catch(e){toast("Kunde inte välja mappen.")}};
  m.querySelectorAll("[data-lib]").forEach(b=>b.onclick=()=>{const f=files[+b.dataset.lib];closeModal();importCourseModal(JSON.stringify(f.pkg))});
  const sh=m.querySelector("#libshare");if(sh)sh.onclick=async()=>{const id=val("libc");const pkg=exportCourse(state,id);const c=course(id);if(!pkg)return;
   const write=async p=>{try{await T.fs.writeTextFile(p,JSON.stringify(pkg,null,1));toast(`${c.name} ligger nu i biblioteket.`);libraryModal()}catch(e){toast("Kunde inte spara i mappen: "+(e&&e.message||e))}};
   try{const p=await T.path.join(LIB_DIR,"kurs-"+fileSafe(c.name)+".lararbordet.json");if(await T.fs.exists(p))confirmBox(`Det finns redan en fil för <b>${esc(c.name)}</b> i biblioteket. Ersätta den med din version?`,()=>write(p),"Ersätt");else write(p)}catch(e){toast("Kunde inte spara i mappen: "+(e&&e.message||e))}}})}
