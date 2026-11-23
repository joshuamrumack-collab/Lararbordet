/* ---------- dela arbetsområde, importera delade filer ---------- */
function shareUnit(id){const pkg=exportUnit(state,id);if(!pkg)return;const u=unit(id);const name="arbetsomrade-"+fileSafe(u.title)+".lararbordet.json";const json=JSON.stringify(pkg,null,1);
 modal("Dela arbetsområdet",`<p style="margin:0"><b>${esc(u.title)}</b> sparas som en fil med centralt innehåll, ${pkg.lessons.length} lektioner och ${pkg.assessments.length} uppgifter med deras betygskriterier (matris). LPP-texterna följer också med.</p>
 <p class="small" style="margin:0"><b>Inga elever, omdömen eller anteckningar om elever följer med.</b> Kollegan väljer <b>Importera</b> under Planering och bestämmer själv vilken vecka arbetsområdet ska börja.</p>
 <div class="actions"><span class="sp"></span>${DESKTOP&&LIB_DIR?`<button class="btn" id="shlib">Lägg i ämnesbiblioteket</button>`:""}<button class="btn pri" id="shfile">Spara filen</button></div>`,m=>{
  m.querySelector("#shfile").onclick=()=>{offerFile(name,json,"application/json");closeModal()};
  const lb=m.querySelector("#shlib");if(lb)lb.onclick=async()=>{try{const p=await T.path.join(LIB_DIR,name);await T.fs.writeTextFile(p,json);closeModal();toast(`${u.title} ligger nu i biblioteket.`)}catch(e){toast("Kunde inte spara i mappen: "+(e&&e.message||e))}}})}
/* En fil från en kollega: kurs eller arbetsområde */
function importAnyModal(text){let pkg;try{pkg=JSON.parse(text)}catch(e){pkg=null}
 if(pkg&&pkg.type==="lararbordet-arbetsomrade")return importUnitModal(pkg);
 if(pkg&&pkg.type==="lararbordet-analys"){modal("Analysfil",`<p style="margin:0">Det här är en ämnesanalys från en kollega. Öppna den under <b>Bedömning → Ämnesanalys</b> med <b>Lägg till kollegors filer</b>.</p><div class="actions"><button class="btn pri" data-a="close">OK</button></div>`);return}
 return importCourseModal(text)}
function importUnitModal(pkg){const p=pkg.unit||{};const match=state.courses.filter(c=>c.subjectId===pkg.subjectId);const ws=fmtD(mondayOf(TODAY));
 const opts=state.courses.map(c=>`<option value="${c.id}" ${match[0]&&match[0].id===c.id?"selected":""}>${esc(c.name)}${c.subjectId===pkg.subjectId?"":" (annat ämne)"}</option>`).join("");
 modal("Importera arbetsområde",`<p style="margin:0"><b>${esc(p.title)}</b> · ${esc(subjTitle(pkg.subjectId))}<br><span class="small muted">${(p.contentIds||[]).length} punkter centralt innehåll · ${(pkg.lessons||[]).length} lektioner · ${(pkg.assessments||[]).length} uppgifter · ${Math.ceil(((p.days||0)+1)/7)} veckor</span></p>
 <div class="row"><div class="f"><label for="iuc">Lägg i kursen</label><select id="iuc">${opts}<option value="__new" ${match.length?"":"selected"}>+ Ny kurs: ${esc(pkg.courseName||p.title)}</option></select></div>
  <div class="f"><label for="ius">Börjar veckan med</label><input type="date" id="ius" value="${ws}"></div></div>
 <p class="small muted" id="iuw" style="margin:0"></p>
 <div class="f" id="iugw"><label for="iug">Elevgrupp för uppgifterna</label><select id="iug"><option value="">Ingen, hoppa över uppgifterna</option>${state.groups.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("")}</select></div>
 <div class="actions"><span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="iuok">Importera</button></div>`,m=>{
  const sel=m.querySelector("#iuc"),gs=m.querySelector("#iug");
  const upd=()=>{const c=course(sel.value);const w=m.querySelector("#iuw");
   w.textContent=sel.value==="__new"?"En ny kurs skapas i samma ämne.":c.subjectId===pkg.subjectId?"":"Kursen har ett annat ämne. Lektioner och uppgifter följer med, men inte centralt innehåll och betygskriterier.";
   if(c&&c.groupId)gs.value=c.groupId};sel.onchange=upd;upd();
  m.querySelector("#iuok").onclick=()=>{let cid=sel.value;
   if(cid==="__new"){if(PLAN[pkg.subjectId]&&!state.mine.includes(pkg.subjectId))state.mine.push(pkg.subjectId);if(pkg.custom&&!state.custom[pkg.subjectId])state.custom[pkg.subjectId]=pkg.custom;
    if(!subj(pkg.subjectId)){toast("Ämnet finns inte i din version av Lärarbordet. Välj en befintlig kurs.");return}
    const c={id:uid(),name:pkg.courseName||p.title,subjectId:pkg.subjectId,groupId:val("iug"),color:pkg.color||COLORS[state.courses.length%COLORS.length]};state.courses.push(c);cid=c.id}
   const r=importUnit(state,pkg,cid,val("ius"),val("iug"));ui.course=cid;closeModal();commit();location.hash="planering";
   toast(`${r.unit.title} är importerat${r.assessments?` med ${r.assessments} uppgifter`:""}.`)}})}

/* ---------- LPP för elever: klarspråk, bildstöd och självskattning ---------- */
const PICT={
 goal:`<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#fde2e2" stroke="#c0392b" stroke-width="3"/><circle cx="24" cy="24" r="12" fill="#fff" stroke="#c0392b" stroke-width="3"/><circle cx="24" cy="24" r="4" fill="#c0392b"/></svg>`,
 work:`<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><rect x="6" y="10" width="28" height="32" rx="3" fill="#e3effb" stroke="#2f6db3" stroke-width="3"/><path d="M12 19h16M12 26h16M12 33h10" stroke="#2f6db3" stroke-width="3" stroke-linecap="round"/><path d="M36 8l6 6-14 14h-6v-6z" fill="#ffd54a" stroke="#8a6d00" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
 learn:`<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><path d="M24 6a13 13 0 0 0-8 23c2 2 3 4 3 6h10c0-2 1-4 3-6A13 13 0 0 0 24 6z" fill="#fff3c4" stroke="#b8860b" stroke-width="3"/><path d="M19 40h10M20 44h8" stroke="#b8860b" stroke-width="3" stroke-linecap="round"/></svg>`,
 check:`<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><rect x="8" y="6" width="32" height="38" rx="4" fill="#e6f5ea" stroke="#2e7d4f" stroke-width="3"/><path d="M15 18l4 4 8-8M15 32l4 4 8-8" fill="none" stroke="#2e7d4f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
 cal:`<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><rect x="6" y="10" width="36" height="32" rx="4" fill="#fff" stroke="#5b4b9a" stroke-width="3"/><path d="M6 19h36" stroke="#5b4b9a" stroke-width="3"/><path d="M15 6v8M33 6v8" stroke="#5b4b9a" stroke-width="3" stroke-linecap="round"/><rect x="13" y="25" width="7" height="6" fill="#5b4b9a"/></svg>`,
 me:`<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><circle cx="24" cy="16" r="9" fill="#fde7cf" stroke="#a0522d" stroke-width="3"/><path d="M8 44c1-10 8-15 16-15s15 5 16 15" fill="#fde7cf" stroke="#a0522d" stroke-width="3"/></svg>`};
const face=(k,size=30)=>{const m={sad:"M16 32q8-6 16 0",mid:"M16 30h16",happy:"M15 28q9 8 18 0"}[k];const col={sad:"#c0392b",mid:"#b8860b",happy:"#2e7d4f"}[k];
 return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#fff" stroke="${col}" stroke-width="3"/><circle cx="17" cy="19" r="2.6" fill="${col}"/><circle cx="31" cy="19" r="2.6" fill="${col}"/><path d="${m}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round"/></svg>`};
const EASY_CSS=`.easy{font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:1.7}.easy h1{font-size:30px}.easy h2{font-size:22px}.easy table{font-size:16px}
.sh{display:flex;align-items:center;gap:12px}.sh svg{flex:none}.goals{list-style:none;padding:0}.goals li{display:flex;gap:12px;align-items:center;justify-content:space-between;border-bottom:1px solid #d8dde4;padding:8px 0}
.rate{display:flex;gap:10px;flex:none}.rate span{display:flex;flex-direction:column;align-items:center;font-size:11px;color:#555;gap:2px}.box{display:inline-block;width:16px;height:16px;border:2px solid #555;border-radius:3px;vertical-align:middle}
.lines{border-bottom:1px solid #999;height:34px}.cell-sa{margin-top:8px;font-size:12px;color:#555;display:flex;align-items:center;gap:6px}.lvl{font-size:13px}.pill{display:inline-block;background:#eef1f5;border-radius:99px;padding:1px 10px;font-size:13px}`;
function lppStudentModal(unitId){const u=unit(unitId);if(!u)return;const c=course(u.courseId)||{};const s=subj(c.subjectId)||{};
 const ls=lessonsOf(u.id).sort((a,b)=>a.date<b.date?-1:1);const as=state.assessments.filter(a=>a.unitId===u.id).sort((a,b)=>a.date<b.date?-1:1);
 const cr=c.subjectId?critFor(c.subjectId):null;const asp=cr?[...new Set(as.flatMap(a=>a.aspects||[]))].filter(i=>cr.aspects[i]).sort((a,b)=>a-b):[];
 const items=(u.contentIds||[]).map(id=>({id,t:itemText(c.subjectId,id)})).filter(x=>x.t);
 const opts=`<p class="small muted" style="margin:0">Skriv med elevernas ord. Texterna sparas i arbetsområdet och följer med när du delar det. Lämnar du en rad tom används Skolverkets text.</p>
 <div class="row"><div class="f"><label for="eg">Det här ska vi lära oss</label><textarea id="eg" data-docopt style="min-height:60px" placeholder="t.ex. Du ska lära dig att skriva en text som övertygar andra.">${esc(u.easyGoal||"")}</textarea></div>
  <div class="f"><label for="ew">Så här ska vi jobba</label><textarea id="ew" data-docopt style="min-height:60px" placeholder="t.ex. Vi läser exempel, skriver i par och ger varandra tips.">${esc(u.easyWork||"")}</textarea></div></div>
 ${items.length?`<details class="f"><summary><b>Målen med elevens ord</b> (${items.filter(x=>(u.easy||{})[x.id]).length} av ${items.length} skrivna)</summary><div style="display:grid;gap:8px;margin-top:8px">${items.map(x=>`<div class="f"><span class="small muted">${esc(x.t.text)}</span><input type="text" data-docopt data-easy="${esc(x.id)}" value="${esc((u.easy||{})[x.id]||"")}" placeholder="Jag ska kunna …"></div>`).join("")}</div></details>`:""}
 ${asp.length?`<details class="f"><summary><b>Kriterierna med elevens ord</b> (${asp.filter(i=>(u.easyCrit||{})[i]).length} av ${asp.length} skrivna)</summary><div style="display:grid;gap:8px;margin-top:8px">${asp.map(i=>`<div class="f"><span class="small muted">${esc(aspectLabel(cr.aspects[i]))}</span><input type="text" data-docopt data-ecrit="${i}" value="${esc((u.easyCrit||{})[i]||"")}" placeholder="Det här betyder att du …"></div>`).join("")}</div></details>`:""}
 <div class="row-b"><label class="chk"><input type="checkbox" id="ebs" data-docopt checked><span>Bildstöd</span></label><label class="chk"><input type="checkbox" id="ebig" data-docopt checked><span>Stor och tydlig text</span></label><label class="chk"><input type="checkbox" id="esa" data-docopt checked><span>Självskattning</span></label><label class="chk"><input type="checkbox" id="emx" data-docopt ${asp.length?"checked":""} ${asp.length?"":"disabled"}><span>Matris</span></label><label class="chk"><input type="checkbox" id="etp" data-docopt checked><span>Tidsplan</span></label></div>`;
 const build=()=>{const on=id=>{const x=$("#"+id);return !x||x.checked};const pic=on("ebs"),sa=on("esa"),mx=on("emx")&&asp.length,tp=on("etp"),big=on("ebig");
  const easy={};document.querySelectorAll("[data-easy]").forEach(x=>{if(x.value.trim())easy[x.dataset.easy]=x.value.trim()});
  const ecrit={};document.querySelectorAll("[data-ecrit]").forEach(x=>{if(x.value.trim())ecrit[x.dataset.ecrit]=x.value.trim()});
  const goal=val("eg").trim(),work=val("ew").trim();
  if(goal!==(u.easyGoal||"")||work!==(u.easyWork||"")||JSON.stringify(easy)!==JSON.stringify(u.easy||{})||JSON.stringify(ecrit)!==JSON.stringify(u.easyCrit||{})){u.easyGoal=goal;u.easyWork=work;u.easy=easy;u.easyCrit=ecrit;commit(true)}
  const H=(k,t)=>pic?`<h2 class="sh">${PICT[k]}<span>${t}</span></h2>`:`<h2>${t}</h2>`;
  const rate=sa?`<span class="rate"><span>${face("sad",pic?30:20)}<i class="box"></i>Inte än</span><span>${face("mid",pic?30:20)}<i class="box"></i>Lite</span><span>${face("happy",pic?30:20)}<i class="box"></i>Ja!</span></span>`:"";
  const goals=items.map(x=>({t:easy[x.id]||x.t.text,orig:!easy[x.id]}));
  const lowName=cr?cr.names[cr.levels[0]]:"";
  const body=`<div class="${big?"easy":""}"><h1>${esc(u.title)}</h1><div class="meta">${esc(c.name||"")} · ${esc(wkRange(u.start,u.end))} · ${shortD(u.start)}–${shortD(u.end)}</div>
   ${sa?`<p style="margin-top:14px">Namn: <span style="display:inline-block;min-width:260px;border-bottom:1px solid #999">&nbsp;</span></p>`:""}
   ${goal||u.lppGoal||u.desc?H("goal","Det här ska vi lära oss")+`<p class="pre">${esc(goal||u.lppGoal||u.desc)}</p>`:""}
   ${work||u.lppWork?H("work","Så här ska vi jobba")+`<p class="pre">${esc(work||u.lppWork)}</p>`:""}
   ${goals.length?H("learn",sa?"Mina mål – hur går det?":"Mina mål")+`<ul class="goals">${goals.map(g=>`<li><span>${esc(g.t)}</span>${rate}</li>`).join("")}</ul>${sa?`<p class="small">Kryssa i en ruta för varje mål. Gör det i början och i slutet av arbetsområdet.</p>`:""}`:""}
   ${as.length?H("check","Det här ska du visa")+`<ul>${as.map(a=>`<li><b>${esc(a.title)}</b> · ${cap(DAY[parseD(a.date).getDay()])} ${shortD(a.date)}${a.type?` <span class="pill">${esc(atypeL(a))}</span>`:""}${a.desc?`<br><span class="pre">${esc(a.desc)}</span>`:""}</li>`).join("")}</ul>`:""}
   ${mx?H("check","Så här bedömer jag")+asp.map(i=>`<h3>${esc(ecrit[i]||aspectLabel(cr.aspects[i]))}</h3><table><thead><tr>${cr.levels.map(k=>`<th>${esc(cr.names[k])}</th>`).join("")}</tr></thead><tbody><tr>${cr.levels.map(k=>`<td class="lvl">${critText(cr.aspects[i][k]||"")}${sa?`<div class="cell-sa"><i class="box"></i>Här är jag nu</div>`:""}</td>`).join("")}</tr></tbody></table>`).join("")+`<p class="small">Orden i fetstil visar skillnaden mellan nivåerna. Texten kommer från Skolverkets betygskriterier${lowName?`, som börjar på ${esc(lowName)}`:""}.</p>`:""}
   ${tp&&ls.length?H("cal","Tidsplan")+`<table><thead><tr><th style="width:120px">Dag</th><th>Vad vi gör</th></tr></thead><tbody>${ls.map(l=>`<tr><td>${cap(DAY[parseD(l.date).getDay()])} ${shortD(l.date)}</td><td>${esc(l.title||"Lektion")}</td></tr>`).join("")}</tbody></table>`:""}
   ${sa?H("me","Jag tänker efter")+`<p><b>Det här är jag bra på:</b></p><div class="lines"></div><div class="lines"></div><p><b>Det här vill jag öva mer på:</b></p><div class="lines"></div><div class="lines"></div><p><b>Det här kan hjälpa mig:</b></p><div class="lines"></div>`:""}</div>`;
  return docWrap(u.title+" – för elever",body).replace("</style>",EASY_CSS+"</style>")};
 docPreview(u.title+" – för elever",build,opts)}

/* ---------- ämnesanalys: elever under E och centralt innehåll som inte bedömts ---------- */
let AN_OTHERS=[];
function analysisModal(gid,keep){if(!keep)AN_OTHERS=[];if(!state.groups.length){toast("Lägg till en elevgrupp först.");return}let g=gid||ui.group||state.groups[0].id;
 const opts=`<div class="row-b" style="align-items:center"><select id="ang" data-docopt style="font:inherit;padding:4px 8px;border-radius:6px" aria-label="Elevgrupp">${state.groups.map(x=>`<option value="${x.id}" ${x.id===g?"selected":""}>${esc(x.name)}</option>`).join("")}</select>
  <label class="chk"><input type="checkbox" id="anc" data-docopt checked><span>Centralt innehåll</span></label><span class="sp"></span><button class="btn small" id="anadd">Lägg till kollegors filer…</button><button class="btn small" id="anexp">Spara för arbetslaget…</button></div>
  <p class="small muted" style="margin:0" id="anfrom">${AN_OTHERS.length?`Med ${AN_OTHERS.length} ${AN_OTHERS.length===1?"fil":"filer"} från kollegor. De sparas inte, utan försvinner när du stänger.`:"Under E betyder att mittvärdet av elevens omdömen eller det senaste omdömet ligger under godtagbar nivå."}</p>`;
 const lvl=k=>k?`<b style="color:${isLow(k)||k==="EG"?"#b3261e":"inherit"}">${esc(k)}</b>`:"–";
 const build=()=>{g=val("ang")||g;const an=analyzeGroup(state,g);if(!an)return docWrap("Ämnesanalys","");const own=exportAnalysis(an,true);own.courses.forEach((c,i)=>c.full=an.courses[i]);
  const mg=mergeAnalyses(own,AN_OTHERS);const withC=($("#anc")||{}).checked!==false;
  const rows=mg.courses.map(c=>`<tr><td><b>${esc(c.name)}</b>${c.from?` <span class="small">(${esc(c.from)})</span>`:""}<br><span class="small">${esc(c.subject||"")}</span></td><td>${c.assessments}</td><td style="${c.below?"color:#b3261e;font-weight:bold":""}">${c.below}</td><td>${c.missing}</td><td>${c.content?`${c.content.notAssessed} av ${c.content.total}`:"–"}</td></tr>`).join("");
  const risk=mg.risk.length?`<table><thead><tr><th>Elev</th><th>Antal ämnen</th>${mg.courses.map(c=>`<th class="small">${esc(c.name)}</th>`).join("")}</tr></thead><tbody>${mg.risk.map(r=>`<tr><td><b>${esc(r.name)}</b></td><td>${r.courses.length}</td>${mg.courses.map((c,ci)=>{const x=(c.students||[]).find(y=>String(y.name).trim().toLowerCase()===String(r.name).trim().toLowerCase());return `<td>${r.courses.includes(ci)&&x?`${lvl(x.median)}${x.last&&x.last!==x.median?` <span class="small">senast ${lvl(x.last)}</span>`:""}`:""}</td>`}).join("")}</tr>`).join("")}</tbody></table>`:`<p>Inga elever ligger under godtagbar nivå just nu.</p>`;
  const miss=mg.courses.filter(c=>c.from===""&&c.full).map(c=>{const st=c.full.students.filter(x=>x.missing&&c.full.assessments);return st.length?`<tr><td><b>${esc(c.name)}</b></td><td>${st.map(x=>`${esc(x.name)} (${x.missing})`).join(", ")}</td></tr>`:""}).join("");
  const cont=withC?mg.courses.filter(c=>c.content&&c.content.notAssessed).map(c=>`<h3>${esc(c.name)}${c.from?` (${esc(c.from)})`:""} · ${c.content.notAssessed} av ${c.content.total} ej bedömda</h3>${c.content.areas.map(a=>`<p class="small" style="margin:6px 0 2px"><b>${esc(a.name)}</b></p><ul>${a.items.map(i=>`<li>${esc(i.text)} <span class="small">· ${esc({gap:"inte planerat",planned:"planerat",ongoing:"pågår",covered:"genomfört men inte bedömt"}[i.state]||"")}</span></li>`).join("")}</ul>`).join("")}`).join(""):"";
  return docWrap("Ämnesanalys "+an.group,`<h1>Ämnesanalys ${esc(an.group)}</h1><div class="meta">${shortD(an.exported)} · ${mg.courses.length} kurser${AN_OTHERS.length?` · med kollegors underlag`:""}</div>
   <h2>Översikt</h2><table><thead><tr><th>Kurs</th><th>Bedömningar</th><th>Elever under E</th><th>Saknade omdömen</th><th>Centralt innehåll ej bedömt</th></tr></thead><tbody>${rows}</tbody></table>
   <h2>Elever under godtagbar nivå</h2>${risk}<p class="small">Mittvärde av elevens omdömen i kursen, och det senaste omdömet om det är lägre. Det är ett underlag för samtal i arbetslaget, inte ett betyg.</p>
   ${miss?`<h2>Saknade omdömen</h2><table><tbody>${miss}</tbody></table>`:""}
   ${cont?`<h2>Centralt innehåll som inte bedömts än</h2>${cont}`:""}
   <p class="small" style="margin-top:20px">Innehåller elevuppgifter. Hantera dokumentet enligt skolans rutiner för personuppgifter.</p>`)};
 docPreview("Ämnesanalys",build,opts);
 const m=$("#modalroot .modal");if(!m)return;
 m.querySelector("#anadd").onclick=async()=>{const t=await pickTextFile(["json"]);if(t==null)return;let o;try{o=JSON.parse(t)}catch(e){o=null}
  if(!o||o.type!=="lararbordet-analys"){toast("Filen är ingen ämnesanalys från Lärarbordet.");return}
  o.from="kollega";AN_OTHERS.push(o);closeModal();analysisModal(g,true)};
 m.querySelector("#anexp").onclick=()=>{const an=analyzeGroup(state,val("ang")||g);if(!an)return;
  modal("Spara för arbetslaget",`<p style="margin:0">Filen innehåller en sammanfattning per kurs: antal bedömningar, elever under godtagbar nivå, saknade omdömen och centralt innehåll som inte bedömts. Inga enskilda omdömen eller anteckningar.</p>
  <label class="chk"><input type="checkbox" id="annm" checked><span>Med elevernas namn (annars bara initialer)</span></label><p class="small muted" style="margin:0">Kollegor som läser in filen kan se er gemensamma bild av gruppen. Lägg den bara där skolan tillåter elevuppgifter.</p>
  <div class="actions"><span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="anok">Spara filen</button></div>`,mm=>mm.querySelector("#anok").onclick=()=>{const pkg=exportAnalysis(an,mm.querySelector("#annm").checked);offerFile("analys-"+fileSafe(an.group)+"-"+fmtD(TODAY)+".lararbordet.json",JSON.stringify(pkg,null,1),"application/json");closeModal()})};
}
