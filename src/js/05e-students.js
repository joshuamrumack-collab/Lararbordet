/* ---------- Elever: samlad information om varje elev ---------- */
const adaptList=s=>[...(s.adapt||[]).map(k=>ADAPT[k]).filter(Boolean),...(s.adaptOther?[s.adaptOther]:[])];
/* Gruppens anpassningar: [{label,names}] sorterat efter hur många som har dem */
function adaptSummary(g){const map={};(g?g.students:[]).forEach(s=>{(s.adapt||[]).forEach(k=>{if(ADAPT[k])(map[ADAPT[k]]=map[ADAPT[k]]||[]).push(s.name)});if(s.adaptOther)(map[s.adaptOther]=map[s.adaptOther]||[]).push(s.name)});
 return Object.entries(map).map(([label,names])=>({label,names})).sort((a,b)=>b.names.length-a.names.length||a.label.localeCompare(b.label,"sv"))}
function adaptReminder(c,compact){const g=c&&group(c.groupId);const sum=adaptSummary(g);if(!sum.length)return "";
 return `<div class="adapt-rem"><b>Inför lektionen: anpassningar i ${esc(g.name)}</b><ul>${sum.map(x=>`<li><b>${esc(x.label)}</b> <span class="muted">${esc(x.names.join(", "))}</span></li>`).join("")}</ul></div>`}

function vStudents(){
 if(!state.groups.length)return `<section class="panel"><div class="empty"><p>Lägg till en elevgrupp för att samla information om eleverna.</p><button class="btn pri" data-a="edit-group">+ Elevgrupp</button></div></section>`;
 if(!group(ui.sgroup))ui.sgroup=(group(ui.group)||state.groups[0]).id;const g=group(ui.sgroup);
 let s=g.students.find(x=>x.id===ui.student);if(!s)s=g.students[0];
 const chips=state.groups.map(x=>`<button class="chip" aria-pressed="${x.id===g.id}" data-a="sel-sgroup" data-id="${x.id}">${esc(x.name)}</button>`).join("");
 const list=g.students.map(x=>{const n=adaptList(x).length;return `<button class="st-li" aria-current="${s&&x.id===s.id}" data-a="sel-student" data-id="${x.id}"><b>${esc(x.name)}</b>${n?`<span class="tag">${n} anpassning${n>1?"ar":""}</span>`:""}${x.diag?'<span class="tag">utredning/diagnos</span>':""}</button>`}).join("");
 const sum=adaptSummary(g);
 const head=`<section class="panel"><div class="toolbar"><div class="chips">${chips}</div><button class="btn" data-a="edit-group">+ Elevgrupp</button><span class="sp"></span><button class="btn" data-a="edit-group" data-id="${g.id}">Ändra elever i ${esc(g.name)}</button></div></section>`;
 if(!s)return head+`<section class="panel"><div class="empty">Gruppen har inga elever. Tryck på Ändra elever och klistra in namnen.</div></section>`;
 const ro=READONLY?"disabled":"";
 const detail=`<section class="panel"><div class="panel-h"><h1>${esc(s.name)}</h1><span class="muted small">${esc(g.name)}</span></div>
  <div class="grid2" style="gap:16px">
   <div class="f"><label>Anpassningar</label><div class="cl" id="stad">${Object.entries(ADAPT).map(([k,l])=>`<label><input type="checkbox" value="${k}" ${(s.adapt||[]).includes(k)?"checked":""} ${ro}><span>${esc(l)}</span></label>`).join("")}</div>
    <input id="stao" value="${esc(s.adaptOther||"")}" placeholder="Annan anpassning" ${ro}></div>
   <div style="display:grid;gap:14px;align-content:start">
    <div class="f"><label for="stn">Anteckningar</label><textarea id="stn" style="min-height:120px" placeholder="Styrkor, intressen, vad som fungerar, kontakt med hemmet…" ${ro}>${esc(s.note||"")}</textarea></div>
    <div class="f"><label for="stdg">Diagnos eller pågående utredning</label><textarea id="stdg" style="min-height:70px" placeholder="Skriv bara det som behövs för undervisningen" ${ro}>${esc(s.diag||"")}</textarea>
     <span class="small" style="color:var(--bad)">Uppgifter om hälsa är känsliga personuppgifter. Skriv bara in dem om skolan har godkänt det och filen ligger i skolans lagring, och dela aldrig filen med andra. Annars hör de hemma i elevhälsans system.</span></div>
    ${READONLY?"":`<button class="btn pri" id="stsave" style="justify-self:start">Spara</button>`}
   </div></div></section>`;
 return head+`<div class="st-layout"><section class="panel st-list"><div class="panel-h"><h2>Elever</h2></div>${list}
   ${sum.length?`<div class="adapt-rem" style="margin-top:12px"><b>Gruppens anpassningar</b><ul>${sum.map(x=>`<li><b>${esc(x.label)}</b> <span class="muted">${x.names.length}</span></li>`).join("")}</ul></div>`:""}</section>
  <div style="display:grid;gap:16px;min-width:0">${detail}${studentCourses(g.id,s.id)}</div></div>`}
function bindStudents(){const b=document.getElementById("stsave");const g=group(ui.sgroup);if(!g)return;const s=g.students.find(x=>x.id===ui.student)||g.students[0];if(!s)return;
 const m=$("#main");bindKmat(m,g.id,s.id);
 if(b)b.onclick=()=>{s.adapt=[...m.querySelectorAll("#stad input:checked")].map(x=>x.value);if(!s.adapt.length)delete s.adapt;
  const o=val("stao").trim();if(o)s.adaptOther=o;else delete s.adaptOther;const n=val("stn").trim();if(n)s.note=n;else delete s.note;const d=val("stdg").trim();if(d)s.diag=d;else delete s.diag;commit();toast("Sparat.")}}
/* liten gul markering på lektioner där gruppen har anpassningar */
const adaptTag=c=>{const g=c&&group(c.groupId);return g&&adaptSummary(g).length?`<span class="adapt-tag" title="Tryck på lektionen för att läsa om anpassningarna">Anpassningar krävs</span>`:""};
