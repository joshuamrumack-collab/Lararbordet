/* ---------- Process: följ ett skrivarbete lektion för lektion ----------
   state.process: [{id,groupId,courseId,title,parts:["Disposition",...],cols:[{id,label,date}],data:{[elev]:{parts:{[i]:true},v:{[kol]:värde}}}}]
   Värde: antal ord (siffror), "k" klar, "gf" giltig frånvaro, "of" ogiltig frånvaro, eller fri text. */
const PCODES={k:"Klar",gf:"Giltig frånvaro",of:"Ogiltig frånvaro"};
function procAvg(p,colId,students){const v=students.map(s=>((p.data[s.id]||{}).v||{})[colId]).filter(x=>/^\d+$/.test(x||"")).map(Number);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null}
function procClass(v,avg){if(v==="k")return "pk";if(v==="of")return "pof";if(v==="gf")return "pgf";if(/^\d+$/.test(v||"")&&avg!=null&&+v<avg)return "plow";return ""}
function vProcess(){
 if(!state.groups.length)return `<section class="panel"><div class="empty"><p>Lägg till en elevgrupp först.</p><button class="btn pri" data-a="edit-group">+ Elevgrupp</button></div></section>`;
 state.process=state.process||[];
 if(!group(ui.pgroup))ui.pgroup=(group(ui.group)||state.groups[0]).id;const g=group(ui.pgroup);
 const ps=state.process.filter(p=>p.groupId===g.id);let p=ps.find(x=>x.id===ui.proc)||ps[ps.length-1];
 const head=`<section class="panel"><div class="toolbar"><div class="chips">${state.groups.map(x=>`<button class="chip" aria-pressed="${x.id===g.id}" data-a="sel-pgroup" data-id="${x.id}">${esc(x.name)}</button>`).join("")}</div><span class="sp"></span><button class="btn pri" data-a="new-proc">+ Nytt skrivarbete</button></div>
  ${ps.length?`<div class="chips" style="margin-top:10px">${ps.map(x=>`<button class="chip" aria-pressed="${p&&x.id===p.id}" data-a="sel-proc" data-id="${x.id}">${esc(x.title)}</button>`).join("")}</div>`:""}</section>`;
 if(!p)return head+`<section class="panel"><div class="empty"><p>Följ ett längre skrivarbete lektion för lektion: hur mycket varje elev har skrivit, vilka delar som är inlämnade och vem som var frånvarande.</p><button class="btn pri" data-a="new-proc">Starta ett skrivarbete</button></div></section>`;
 const ro=READONLY?"readonly":"";
 const hdr=`<tr><th class="name">Elev</th>${p.parts.map((t,i)=>`<th class="pp">${esc(t)}</th>`).join("")}${p.cols.map(c=>`<th><span>${esc(c.label)}</span>${c.date?`<span class="d">${shortD(c.date)}</span>`:""}${READONLY?"":`<button class="ulink" data-a="edit-pcol" data-id="${c.id}" title="Ändra eller ta bort">ändra</button>`}</th>`).join("")}<th>Senast</th></tr>`;
 const avgs={};p.cols.forEach(c=>avgs[c.id]=procAvg(p,c.id,g.students));
 const rows=g.students.map(s=>{const d=p.data[s.id]||{};const v=d.v||{};const last=[...p.cols].reverse().map(c=>v[c.id]).find(x=>/^\d+$/.test(x||""));const done=p.cols.some(c=>v[c.id]==="k");
  return `<tr><td class="name">${esc(s.name)}${adaptList(s).length?` <span class="tag" title="${esc(adaptList(s).join(", "))}">anp.</span>`:""}</td>${p.parts.map((t,i)=>`<td class="pp"><input type="checkbox" data-pp="${s.id}|${i}" ${(d.parts||{})[i]?"checked":""} ${READONLY?"disabled":""} aria-label="${esc(s.name)}: ${esc(t)} inlämnad"></td>`).join("")}
   ${p.cols.map(c=>{const x=v[c.id]||"";return `<td class="${procClass(x,avgs[c.id])}"><input data-pv="${s.id}|${c.id}" value="${esc(PCODES[x]?{k:"Klar",gf:"GF",of:"OF"}[x]:x)}" ${ro} inputmode="text" aria-label="${esc(s.name)}, ${esc(c.label)}"></td>`}).join("")}
   <td class="num ${done?"pk":""}">${done?"Klar":last||"–"}</td></tr>`}).join("");
 const foot=`<tr><td class="name small muted">Snitt ord</td>${p.parts.map((t,i)=>`<td class="pp small muted">${g.students.filter(s=>((p.data[s.id]||{}).parts||{})[i]).length}/${g.students.length}</td>`).join("")}${p.cols.map(c=>`<td class="small muted num">${avgs[c.id]??"–"}</td>`).join("")}<td></td></tr>`;
 return head+`<section class="panel"><div class="panel-h"><div><h1>${esc(p.title)}</h1><span class="small muted">${esc(g.name)}${course(p.courseId)?" · "+esc(course(p.courseId).name):""}</span></div><span class="sp"></span>
   ${READONLY?"":`<button class="btn" data-a="edit-proc" data-id="${p.id}">Ändra</button><button class="btn" data-a="add-ppart">+ Inlämningsdel</button><button class="btn pri" data-a="add-pcol">+ Lektion</button>`}</div>
  <div class="cm-legend" style="margin-bottom:8px"><span>Skriv antal ord, eller <b>k</b> för klar, <b>gf</b> för giltig frånvaro, <b>of</b> för ogiltig frånvaro:</span><span><i style="background:#86efac"></i>klar</span><span><i style="background:#fdba74"></i>under snittet</span><span><i style="background:#fde68a"></i>giltig frånvaro</span><span><i style="background:#fca5a5"></i>ogiltig frånvaro</span></div>
  ${p.cols.length||p.parts.length?`<div class="mx-wrap"><table class="mx ptab" data-pid="${p.id}"><thead>${hdr}</thead><tbody>${rows}</tbody><tfoot>${foot}</tfoot></table></div>`:`<div class="empty">Lägg till en lektion för att börja fylla i, och inlämningsdelar som t.ex. Disposition eller Första utkast.</div>`}
  <p class="small muted" style="margin:8px 0 0">Orange betyder färre ord än gruppens snitt den lektionen. Tryck Tab för att gå till nästa ruta.</p></section>`}
function bindProcess(){const t=document.querySelector(".ptab");if(!t||READONLY)return;const p=(state.process||[]).find(x=>x.id===t.dataset.pid);if(!p)return;
 t.addEventListener("change",e=>{const el=e.target;if(el.dataset.pp){const [sid,i]=el.dataset.pp.split("|");const d=p.data[sid]=p.data[sid]||{};d.parts=d.parts||{};if(el.checked)d.parts[i]=true;else delete d.parts[i];commit(true);const g=group(p.groupId);const n=g.students.filter(s=>((p.data[s.id]||{}).parts||{})[i]).length;const fc=t.querySelectorAll("tfoot td")[1+ +i];if(fc)fc.textContent=n+"/"+g.students.length;return}
  if(el.dataset.pv){const [sid,cid]=el.dataset.pv.split("|");const d=p.data[sid]=p.data[sid]||{};d.v=d.v||{};const v=procVal(el.value);if(v)d.v[cid]=v;else delete d.v[cid];el.value=v&&PCODES[v]?{k:"Klar",gf:"GF",of:"OF"}[v]:v;commit(true);paintCol(cid)}});
 const g=group(p.groupId);
 const paintCol=cid=>{const avg=procAvg(p,cid,g.students);t.querySelectorAll(`[data-pv$="|${cid}"]`).forEach(inp=>{const sid=inp.dataset.pv.split("|")[0];inp.parentElement.className=procClass(((p.data[sid]||{}).v||{})[cid]||"",avg)});
  const ci=p.cols.findIndex(c=>c.id===cid);const fc=t.querySelectorAll("tfoot td")[1+p.parts.length+ci];if(fc)fc.textContent=avg??"–";
  t.querySelectorAll("tbody tr").forEach((tr,ri)=>{const s=g.students[ri];if(!s)return;const v=(p.data[s.id]||{}).v||{};const last=[...p.cols].reverse().map(c=>v[c.id]).find(x=>/^\d+$/.test(x||""));const done=p.cols.some(c=>v[c.id]==="k");const td=tr.lastElementChild;td.textContent=done?"Klar":last||"–";td.className="num "+(done?"pk":"")})}}
function procModal(id){const p=id?(state.process||[]).find(x=>x.id===id):null;const g=group(ui.pgroup);const cs=state.courses.filter(c=>c.groupId===g.id);
 modal(p?"Skrivarbete":"Nytt skrivarbete",`<p class="small muted" style="margin:-8px 0 0">${esc(g.name)}</p><div class="f"><label for="prt">Namn</label><input id="prt" value="${esc(p?p.title:"")}" placeholder="t.ex. Utredande text"></div>
 <div class="f"><label for="prc">Kurs</label><select id="prc"><option value="">Ingen</option>${cs.map(c=>`<option value="${c.id}" ${p&&p.courseId===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div>
 <div class="f"><label for="prp">Inlämningsdelar, en per rad</label><textarea id="prp" placeholder="Formulär&#10;Disposition&#10;Första utkast&#10;Slutversion">${esc(p?p.parts.join("\n"):"")}</textarea></div>
 ${p?"":`<div class="f"><label for="prn">Antal lektioner att börja med</label><input type="number" id="prn" min="0" max="30" value="4" style="max-width:120px"></div>`}
 <div class="actions">${p?'<button class="btn danger" id="prdel">Ta bort</button>':""}<span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="prok">Spara</button></div>`,m=>{
  m.querySelector("#prok").onclick=()=>{const t=val("prt").trim();if(!t){$("#prt").focus();return}const parts=val("prp").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
   if(p){const old=p.parts;Object.assign(p,{title:t,courseId:val("prc"),parts});/* behåll bockar för delar med samma namn */Object.values(p.data).forEach(d=>{if(!d.parts)return;const np={};parts.forEach((x,i)=>{const oi=old.indexOf(x);if(oi>=0&&d.parts[oi])np[i]=true});d.parts=np})}
   else{const n=Math.max(0,Math.min(30,+val("prn")||0));const np={id:uid(),groupId:g.id,courseId:val("prc"),title:t,parts,cols:Array.from({length:n},(_,i)=>({id:uid(),label:"Lektion "+(i+1),date:""})),data:{}};(state.process=state.process||[]).push(np);ui.proc=np.id;saveUI()}
   closeModal();commit()};
  const d=m.querySelector("#prdel");if(d)d.onclick=()=>confirmBox(`Ta bort skrivarbetet “${esc(p.title)}” och allt som är ifyllt?`,()=>{state.process=state.process.filter(x=>x!==p);commit()})})}
function pcolModal(id){const p=(state.process||[]).find(x=>x.id===ui.proc)||(state.process||[]).filter(x=>x.groupId===ui.pgroup).pop();if(!p)return;const c=id?p.cols.find(x=>x.id===id):null;
 modal(c?"Lektion":"Ny lektion",`<div class="row"><div class="f"><label for="pcl">Rubrik</label><input id="pcl" value="${esc(c?c.label:"Lektion "+(p.cols.length+1))}"></div><div class="f"><label for="pcd">Datum</label><input type="date" id="pcd" value="${c?c.date:fmtD(TODAY)}"></div></div>
 <div class="actions">${c?'<button class="btn danger" id="pcdel">Ta bort</button>':""}<span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="pcok">Spara</button></div>`,m=>{
  m.querySelector("#pcok").onclick=()=>{const o={label:val("pcl").trim()||"Lektion",date:val("pcd")};if(c)Object.assign(c,o);else p.cols.push(Object.assign({id:uid()},o));closeModal();commit()};
  const d=m.querySelector("#pcdel");if(d)d.onclick=()=>confirmBox(`Ta bort “${esc(c.label)}” och det som är ifyllt den lektionen?`,()=>{p.cols=p.cols.filter(x=>x!==c);Object.values(p.data).forEach(x=>{if(x.v)delete x.v[c.id]});commit()})})}
