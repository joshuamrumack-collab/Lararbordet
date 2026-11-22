/* ---------- Process: följ ett skrivarbete lektion för lektion ----------
   state.process: [{id,groupId,courseId,title,parts:[{name,kind}],cols:[{id,label,date}],minWords,maxWords,count:"total"|"lesson",
                    data:{[elev]:{parts:{[i]:true},ptext:{[i]:text},v:{[kol]:värde}}}}]
   Värde: antal ord (siffror), "k" klar, "gf" giltig frånvaro, "of" ogiltig frånvaro, eller fri text. */
const PCODES={k:"Klar",gf:"Giltig frånvaro",of:"Ogiltig frånvaro"};
const PSHORT={k:"Klar",gf:"GF",of:"OF"};
const PKINDS={check:"Bock",text:"Textruta",both:"Bock och textruta"};
function procAvg(p,colId,students){const v=students.map(s=>((p.data[s.id]||{}).v||{})[colId]).filter(x=>/^\d+$/.test(x||"")).map(Number);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null}
function curProc(){return (state.process||[]).find(x=>x.id===ui.proc)||(state.process||[]).filter(x=>x.groupId===ui.pgroup).pop()}
function vProcess(){
 if(!state.groups.length)return `<section class="panel"><div class="empty"><p>Lägg till en elevgrupp först.</p><button class="btn pri" data-a="edit-group">+ Elevgrupp</button></div></section>`;
 state.process=state.process||[];
 if(!group(ui.pgroup))ui.pgroup=(group(ui.group)||state.groups[0]).id;const g=group(ui.pgroup);
 const ps=state.process.filter(p=>p.groupId===g.id);let p=ps.find(x=>x.id===ui.proc)||ps[ps.length-1];
 const head=`<section class="panel"><div class="toolbar"><div class="chips">${state.groups.map(x=>`<button class="chip" aria-pressed="${x.id===g.id}" data-a="sel-pgroup" data-id="${x.id}">${esc(x.name)}</button>`).join("")}</div><span class="sp"></span><button class="btn pri" data-a="new-proc">+ Nytt skrivarbete</button></div>
  ${ps.length?`<div class="chips" style="margin-top:10px">${ps.map(x=>`<button class="chip" aria-pressed="${p&&x.id===p.id}" data-a="sel-proc" data-id="${x.id}">${esc(x.title)}</button>`).join("")}</div>`:""}</section>`;
 if(!p)return head+`<section class="panel"><div class="empty"><p>Följ ett längre skrivarbete lektion för lektion: hur mycket varje elev har skrivit, vilka delar som är inlämnade och vem som var frånvarande.</p><button class="btn pri" data-a="new-proc">Starta ett skrivarbete</button></div></section>`;
 const ro=READONLY?"readonly":"";const parts=procParts(p);const hasGoal=+p.minWords>0;
 const hdr=`<tr><th class="name">Elev</th>${parts.map(t=>`<th class="pp">${esc(t.name)}</th>`).join("")}${p.cols.map((c,k)=>{const ex=procExpected(p,k);return `<th><span>${esc(c.label)}</span>${c.date?`<span class="d">${shortD(c.date)}</span>`:""}${ex!=null?`<span class="d" title="Så många ord bör eleven ha skrivit ${p.count==="lesson"?"den här lektionen":"totalt efter den här lektionen"}">mål ${ex}</span>`:""}${READONLY?"":`<button class="ulink" data-a="edit-pcol" data-id="${c.id}" title="Ändra eller ta bort">ändra</button>`}</th>`}).join("")}<th>${p.count==="lesson"?"Totalt":"Senast"}</th></tr>`;
 const avgs={};p.cols.forEach(c=>avgs[c.id]=procAvg(p,c.id,g.students));
 const partCell=(s,t,i,d)=>{const ck=t.kind!=="text"?`<input type="checkbox" data-pp="${s.id}|${i}" ${(d.parts||{})[i]?"checked":""} ${READONLY?"disabled":""} aria-label="${esc(s.name)}: ${esc(t.name)} inlämnad">`:"";
  const tx=t.kind!=="check"?`<input class="ptx" data-pt="${s.id}|${i}" value="${esc((d.ptext||{})[i]||"")}" ${ro} placeholder="…" aria-label="${esc(s.name)}: ${esc(t.name)}">`:"";return `<td class="pp ${t.kind}">${ck}${tx}</td>`};
 const rows=g.students.map(s=>{const d=p.data[s.id]||{};const v=d.v||{};
  return `<tr><td class="name">${esc(s.name)}${adaptList(s).length?` <span class="tag" title="${esc(adaptList(s).join(", "))}">anp.</span>`:""}</td>${parts.map((t,i)=>partCell(s,t,i,d)).join("")}
   ${p.cols.map((c,k)=>{const x=v[c.id]||"";return `<td class="${procClass2(x,procExpected(p,k),avgs[c.id])}"><input data-pv="${s.id}|${c.id}" value="${esc(PSHORT[x]||x)}" ${ro} inputmode="text" aria-label="${esc(s.name)}, ${esc(c.label)}"></td>`}).join("")}
   ${lastCell(p,v)}</tr>`}).join("");
 const foot=`<tr><td class="name small muted">Snitt ord</td>${parts.map((t,i)=>`<td class="pp small muted">${t.kind!=="text"?g.students.filter(s=>((p.data[s.id]||{}).parts||{})[i]).length+"/"+g.students.length:""}</td>`).join("")}${p.cols.map(c=>`<td class="small muted num">${avgs[c.id]??"–"}</td>`).join("")}<td></td></tr>`;
 const goal=hasGoal?`<p class="small" style="margin:0 0 8px"><b>Mål:</b> ${+p.minWords}${+p.maxWords?"–"+(+p.maxWords):""} ord för hela uppgiften. Det blir minst <b>${Math.ceil(p.minWords/Math.max(1,p.cols.length))} ord per lektion</b> över ${p.cols.length} lektioner${+p.maxWords?` (högst ${Math.ceil(p.maxWords/Math.max(1,p.cols.length))})`:""}. Du skriver ${p.count==="lesson"?"antal ord den lektionen":"antal ord totalt hittills"}.</p>`
  :`<p class="small muted" style="margin:0 0 8px">Ange ett mål för antal ord under Ändra, så räknar Lärarbordet ut hur mycket eleverna bör skriva per lektion och markerar den som ligger efter.</p>`;
 return head+`<section class="panel"><div class="panel-h"><div><h1>${esc(p.title)}</h1><span class="small muted">${esc(g.name)}${course(p.courseId)?" · "+esc(course(p.courseId).name):""}${(()=>{const a=state.assessments.find(x=>x.id===p.assessId);return a?` · uppgift: <button class="ulink" data-a="edit-assess" data-id="${a.id}">${esc(a.title)}</button>`:""})()}</span></div><span class="sp"></span>
   ${READONLY?"":`<button class="btn" data-a="edit-proc" data-id="${p.id}">Ändra</button><button class="btn" data-a="add-ppart">+ Inlämningsdel</button><button class="btn pri" data-a="add-pcol">+ Lektion</button>`}</div>
  ${goal}
  <div class="cm-legend" style="margin-bottom:8px"><span>Skriv antal ord, eller <b>k</b> för klar, <b>gf</b> för giltig frånvaro, <b>of</b> för ogiltig frånvaro:</span><span><i style="background:#86efac"></i>klar${hasGoal?" eller i fas":""}</span><span><i style="background:${hasGoal?"#f87171":"#fdba74"}"></i>${hasGoal?"ligger efter":"under snittet"}</span><span><i style="background:#fde68a"></i>giltig frånvaro</span><span><i style="background:#fca5a5"></i>ogiltig frånvaro</span></div>
  ${p.cols.length||parts.length?`<div class="mx-wrap"><table class="mx ptab" data-pid="${p.id}"><thead>${hdr}</thead><tbody>${rows}</tbody><tfoot>${foot}</tfoot></table></div>`:`<div class="empty">Lägg till en lektion för att börja fylla i, och inlämningsdelar som t.ex. Disposition eller Första utkast.</div>`}
  <p class="small muted" style="margin:8px 0 0">${hasGoal?"Rött betyder att eleven ligger efter målet för lektionen.":"Orange betyder färre ord än gruppens snitt den lektionen."} Tryck Tab för att gå till nästa ruta.</p></section>`}
function lastCell(p,v){const nums=p.cols.map(c=>v[c.id]).filter(x=>/^\d+$/.test(x||""));const done=p.cols.some(c=>v[c.id]==="k");
 const last=p.count==="lesson"?(nums.length?String(nums.reduce((a,b)=>a+ +b,0)):""):nums[nums.length-1];
 const behind=!done&&+p.minWords>0&&last!=null&&last!==""&&(()=>{const k=p.cols.map(c=>/^\d+$/.test(v[c.id]||"")).lastIndexOf(true);return +last<(p.count==="lesson"?Math.ceil(p.minWords*(k+1)/p.cols.length):procExpected(p,k))})();
 return `<td class="num ptot ${done?"pk":behind?"pbehind":""}">${done?"Klar":last?`${last} ord`:"–"}${!done&&last&&+p.minWords>0?`<span class="d">${Math.round(last/p.minWords*100)} % av målet</span>`:""}</td>`}
function bindProcess(){const t=document.querySelector(".ptab");if(!t||READONLY)return;const p=(state.process||[]).find(x=>x.id===t.dataset.pid);if(!p)return;const g=group(p.groupId);const parts=procParts(p);
 const paintCol=cid=>{const k=p.cols.findIndex(c=>c.id===cid);const avg=procAvg(p,cid,g.students);const ex=procExpected(p,k);
  t.querySelectorAll(`[data-pv$="|${cid}"]`).forEach(inp=>{const sid=inp.dataset.pv.split("|")[0];inp.parentElement.className=procClass2(((p.data[sid]||{}).v||{})[cid]||"",ex,avg)});
  const fc=t.querySelectorAll("tfoot td")[1+parts.length+k];if(fc)fc.textContent=avg??"–";
  t.querySelectorAll("tbody tr").forEach((tr,ri)=>{const s=g.students[ri];if(!s)return;const tmp=document.createElement("tr");tmp.innerHTML=lastCell(p,(p.data[s.id]||{}).v||{});tr.replaceChild(tmp.firstElementChild,tr.lastElementChild)})};
 t.addEventListener("change",e=>{const el=e.target;
  if(el.dataset.pp){const [sid,i]=el.dataset.pp.split("|");const d=p.data[sid]=p.data[sid]||{};d.parts=d.parts||{};if(el.checked)d.parts[i]=true;else delete d.parts[i];commit(true);
   const n=g.students.filter(s=>((p.data[s.id]||{}).parts||{})[i]).length;const fc=t.querySelectorAll("tfoot td")[1+ +i];if(fc)fc.textContent=n+"/"+g.students.length;return}
  if(el.dataset.pt){const [sid,i]=el.dataset.pt.split("|");const d=p.data[sid]=p.data[sid]||{};d.ptext=d.ptext||{};const v=el.value.trim();if(v)d.ptext[i]=v;else delete d.ptext[i];commit(true);return}
  if(el.dataset.pv){const [sid,cid]=el.dataset.pv.split("|");const d=p.data[sid]=p.data[sid]||{};d.v=d.v||{};const v=procVal(el.value);if(v)d.v[cid]=v;else delete d.v[cid];el.value=PSHORT[v]||v;commit(true);paintCol(cid)}})}
function procModal(id){const p=id?(state.process||[]).find(x=>x.id===id):null;const g=group(ui.pgroup);const cs=state.courses.filter(c=>c.groupId===g.id);
 let parts=p?procParts(p).map(x=>Object.assign({},x,{oi:procParts(p).indexOf(x)})):[{name:"Formulär",kind:"check"},{name:"Disposition",kind:"both"},{name:"Första utkast",kind:"check"},{name:"Slutversion",kind:"check"}];
 const prow=(t,i)=>`<div class="pp-row" data-i="${i}"><input data-pn value="${esc(t.name)}" placeholder="Namn på delen" aria-label="Namn på del ${i+1}"><select data-pk aria-label="Typ">${Object.entries(PKINDS).map(([k,l])=>`<option value="${k}" ${t.kind===k?"selected":""}>${l}</option>`).join("")}</select><button class="btn ghost small" data-px aria-label="Ta bort delen">×</button></div>`;
 modal(p?"Skrivarbete":"Nytt skrivarbete",`<p class="small muted" style="margin:-8px 0 0">${esc(g.name)}</p><div class="f"><label for="prt">Namn</label><input id="prt" value="${esc(p?p.title:"")}" placeholder="t.ex. Utredande text"></div>
 <div class="f"><label for="pra">Koppla till en uppgift</label><select id="pra"><option value="">Ingen, eller skapa uppgiften senare</option>${state.assessments.filter(a=>a.groupId===g.id).sort((x,y)=>x.date<y.date?1:-1).map(a=>`<option value="${a.id}" ${p&&p.assessId===a.id?"selected":""}>${esc(a.title)} · ${shortD(a.date)}${a.type?" · "+esc(atypeL(a)):""}</option>`).join("")}</select><span class="small muted">Skrivarbetet följer processen fram till uppgiften, som du bedömer under Bedömning.</span></div>
 <div class="f"><label for="prc">Kurs</label><select id="prc"><option value="">Ingen</option>${cs.map(c=>`<option value="${c.id}" ${p&&p.courseId===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div>
 <div class="f"><label>Inlämningsdelar</label><span class="small muted" style="margin-top:-4px">Välj om en del bockas av, fylls i med text (t.ex. ämne eller kommentar) eller både och.</span><div id="pprows" style="display:grid;gap:6px">${parts.map(prow).join("")}</div><button class="btn small" id="ppadd" style="justify-self:start;align-self:flex-start">+ Del</button></div>
 <div class="row"><div class="f"><label for="prmin">Minst antal ord, hela uppgiften</label><input type="number" id="prmin" min="0" step="50" value="${p&&p.minWords?p.minWords:""}" placeholder="t.ex. 800"></div>
  <div class="f"><label for="prmax">Högst antal ord</label><input type="number" id="prmax" min="0" step="50" value="${p&&p.maxWords?p.maxWords:""}" placeholder="t.ex. 1200"></div></div>
 <div class="f"><label for="prcnt">Jag skriver in</label><select id="prcnt"><option value="total" ${!p||p.count!=="lesson"?"selected":""}>Antal ord totalt hittills</option><option value="lesson" ${p&&p.count==="lesson"?"selected":""}>Antal ord skrivna den lektionen</option></select></div>
 ${p?"":`<div class="f"><label for="prn">Antal lektioner</label><input type="number" id="prn" min="0" max="30" value="4" style="max-width:120px"><span class="small muted">Målet delas på lektionerna. Du kan lägga till fler senare.</span></div>`}
 <p class="small muted" id="prpace" style="margin:0"></p>
 <div class="actions">${p?'<button class="btn danger" id="prdel">Ta bort</button>':""}<span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="prok">Spara</button></div>`,m=>{
  const read=()=>{parts=[...m.querySelectorAll(".pp-row")].map(r=>({name:r.querySelector("[data-pn]").value,kind:r.querySelector("[data-pk]").value,oi:parts[+r.dataset.i]?parts[+r.dataset.i].oi:undefined}))};
  const paint=()=>{m.querySelector("#pprows").innerHTML=parts.map(prow).join("");m.querySelectorAll("[data-px]").forEach(b=>b.onclick=()=>{read();parts.splice(+b.closest(".pp-row").dataset.i,1);paint()})};paint();
  m.querySelector("#ppadd").onclick=()=>{read();parts.push({name:"",kind:"check"});paint();const l=[...m.querySelectorAll("[data-pn]")].pop();if(l)l.focus()};
  m.querySelector("#pra").onchange=e=>{const a=state.assessments.find(x=>x.id===e.target.value);if(!a)return;if(!val("prt").trim())m.querySelector("#prt").value=a.title;if(a.courseId&&m.querySelector(`#prc option[value="${a.courseId}"]`))m.querySelector("#prc").value=a.courseId};
  const pace=()=>{const mn=+val("prmin"),mx=+val("prmax"),n=p?p.cols.length:+val("prn");m.querySelector("#prpace").innerHTML=mn&&n?`Det blir minst <b>${Math.ceil(mn/n)} ord per lektion</b>${mx?` och högst ${Math.ceil(mx/n)}`:""} över ${n} lektioner.`:""};
  ["prmin","prmax","prn"].forEach(x=>{const e=m.querySelector("#"+x);if(e)e.oninput=pace});pace();
  m.querySelector("#prok").onclick=()=>{const t=val("prt").trim();if(!t){$("#prt").focus();return}read();const np=parts.filter(x=>x.name.trim()).map(x=>({name:x.name.trim(),kind:x.kind,oi:x.oi}));
   const mn=Math.max(0,+val("prmin")||0),mx=Math.max(0,+val("prmax")||0);const o={title:t,courseId:val("prc"),assessId:val("pra"),parts:np.map(({name,kind})=>({name,kind})),minWords:mn||null,maxWords:mx&&mx>=mn?mx:null,count:val("prcnt")};
   if(p){/* flytta bockar och text med delarna */Object.values(p.data).forEach(d=>{const op=d.parts||{},ot=d.ptext||{};d.parts={};d.ptext={};np.forEach((x,i)=>{if(x.oi!=null){if(op[x.oi])d.parts[i]=true;if(ot[x.oi])d.ptext[i]=ot[x.oi]}})});Object.assign(p,o)}
   else{const n=Math.max(0,Math.min(30,+val("prn")||0));const nw=Object.assign({id:uid(),groupId:g.id,cols:Array.from({length:n},(_,i)=>({id:uid(),label:"Lektion "+(i+1),date:""})),data:{}},o);(state.process=state.process||[]).push(nw);ui.proc=nw.id;saveUI()}
   closeModal();commit()};
  const d=m.querySelector("#prdel");if(d)d.onclick=()=>confirmBox(`Ta bort skrivarbetet “${esc(p.title)}” och allt som är ifyllt?`,()=>{state.process=state.process.filter(x=>x!==p);commit()})})}
function pcolModal(id){const p=curProc();if(!p)return;const c=id?p.cols.find(x=>x.id===id):null;
 modal(c?"Lektion":"Ny lektion",`<div class="row"><div class="f"><label for="pcl">Rubrik</label><input id="pcl" value="${esc(c?c.label:"Lektion "+(p.cols.length+1))}"></div><div class="f"><label for="pcd">Datum</label><input type="date" id="pcd" value="${c?c.date:fmtD(TODAY)}"></div></div>
 ${+p.minWords>0&&!c?`<p class="small muted" style="margin:0">Målet per lektion räknas om när antalet lektioner ändras.</p>`:""}
 <div class="actions">${c?'<button class="btn danger" id="pcdel">Ta bort</button>':""}<span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="pcok">Spara</button></div>`,m=>{
  m.querySelector("#pcok").onclick=()=>{const o={label:val("pcl").trim()||"Lektion",date:val("pcd")};if(c)Object.assign(c,o);else p.cols.push(Object.assign({id:uid()},o));closeModal();commit()};
  const d=m.querySelector("#pcdel");if(d)d.onclick=()=>confirmBox(`Ta bort “${esc(c.label)}” och det som är ifyllt den lektionen?`,()=>{p.cols=p.cols.filter(x=>x!==c);Object.values(p.data).forEach(x=>{if(x.v)delete x.v[c.id]});commit()})})}
