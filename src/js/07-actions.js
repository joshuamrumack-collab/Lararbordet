/* ---------- händelser ---------- */
const A={
 close:()=>closeModal(), ov:(el,e)=>{if(e.target===el)closeModal()},
 "clear-example":()=>A.wipe(),
 "load-example":()=>confirmBox("Exempeldata ersätter allt du har lagt in. Exportera först om du vill spara något.",()=>{state=exampleState();state.example=true;commit()},"Visa exempel"),
 wipe:()=>confirmBox("Allt tas bort: kurser, arbetsområden, händelser, elever, omdömen och valda ämnen. Du får ett helt tomt Lärarbordet. Det går inte att ångra.",()=>{state=emptyState();ui=Object.assign(ui,{course:null,group:null,subject:null,subjFilter:"all",acourse:"all",wheel:"all"});commit();pickerModal()},"Rensa allt"),
 picker:()=>pickerModal(),
 "open-update":()=>{const v=UPDATE?UPDATE.version:"";modal(v?"Uppdatera till "+v:"Ladda ner Lärarbordet",DESKTOP?`<p style="margin:0">Ladda ner den nya installationsfilen och installera den som vanligt. Din data ligger kvar i <b>Dokument/Lärarbordet</b> och följer med automatiskt.</p><div class="actions"><span class="sp"></span><button class="btn pri" id="upgo">Öppna nedladdningssidan</button></div>`
  :`<ol style="margin:0;padding-left:20px;display:grid;gap:6px"><li>Spara dina ändringar i den här filen först.</li><li>Ladda ner den nya <b>lararbordet.html</b> från nedladdningssidan.</li><li>Öppna den nya filen och välj <b>Inställningar → Importera data</b>.</li><li>Välj din gamla lararbordet.html. All data flyttas över.</li></ol><div class="actions"><span class="sp"></span><button class="btn pri" id="upgo">Öppna nedladdningssidan</button></div>`,m=>m.querySelector("#upgo").onclick=()=>openExternal(UPDATE?UPDATE.url:RELEASES_URL))},
 "new-year":()=>newYearModal(),
 "switch-year":el=>{const a=state.archive.find(x=>x.id===el.dataset.id);if(!a)return;confirmBox(`Öppna läsår ${esc(a.label)}? Läsår ${esc(yearLabel(state.year))} sparas under Tidigare läsår så att du kan byta tillbaka.`,()=>{switchYear(state,a.id);ui=Object.assign(ui,{course:null,group:null,acourse:"all",wheel:"all"});commit()},"Öppna")},
 "del-year":el=>{const a=state.archive.find(x=>x.id===el.dataset.id);if(!a)return;confirmBox(`Ta bort läsår ${esc(a.label)} med alla kurser, elever och omdömen? Det går inte att ångra. Exportera gärna en säkerhetskopia först.`,()=>{state.archive=state.archive.filter(x=>x!==a);commit()})},
 "share-course":el=>shareCourse(el.dataset.id),
 "import-course":()=>pickTextFile(["json"]).then(t=>{if(t!=null)importCourseModal(t)}),
 "edit-lesson":el=>lessonModal(el.dataset.id),
 "toggle-lesson":el=>{const l=state.lessons.find(x=>x.id===el.dataset.id);if(!l)return;l.done=!l.done;commit();lessonsModal(l.unitId)},
 "bar-save":()=>barSave(),
 unmine:el=>{state.mine=state.mine.filter(x=>x!==el.dataset.id);commit()},
 "sel-course":el=>{ui.course=el.dataset.id;saveUI();render()},
 "new-course":()=>courseModal(), "edit-course":el=>courseModal(el.dataset.id),
 "new-unit":()=>unitModal(), "edit-unit":el=>unitModal(el.dataset.id),
 wheel:el=>{ui.wheel=el.dataset.id;saveUI();render()},
 "new-event":()=>eventModal(), "edit-event":el=>eventModal(el.dataset.id),
 "goto-subject":el=>{ui.subject=el.dataset.id;ui.subjFilter="all";ui.gapsOnly=true;saveUI();location.hash="innehall"},
 "sel-subject":el=>{ui.subject=el.dataset.id;ui.subjFilter="all";saveUI();render()},
 gaps:el=>{ui.gapsOnly=el.dataset.v==="1";saveUI();render()},
 "toggle-manual":el=>{const id=el.dataset.id;if(state.manual[id])delete state.manual[id];else state.manual[id]=true;commit()},
 "add-item":el=>addItemModal(el.dataset.area),
 "del-item":el=>{const id=el.dataset.id;const s=subj(ui.subject);if(s.official){state.extra[s.id]=(state.extra[s.id]||[]).filter(e=>e.id!==id)}else{state.custom[s.id].areas.forEach(a=>a.items=a.items.filter(i=>i.id!==id))}commit()},
 "sel-group":el=>{ui.group=el.dataset.id;saveUI();render()},
 "edit-group":el=>groupModal(el.dataset.id),
 "new-assess":()=>{if(!state.courses.length){modal("Skapa en kurs först",`<p style="margin:0">En bedömning hör till en kurs.</p><div class="actions"><a class="btn pri" href="#planering" data-a="close">Till planeringen</a></div>`);return}assessModal()},
 "edit-assess":el=>assessModal(el.dataset.id),
 grade:el=>gradeModal(el.dataset.as,el.dataset.st),
 student:el=>studentModal(el.dataset.g,el.dataset.id),
 "export-csv":()=>offerFile("omdomen-"+(group(ui.group)||{name:"grupp"}).name+".csv","﻿"+csv(),"text/csv"),
 "export-json":()=>offerFile("lararbordet-"+fmtD(TODAY)+".json",JSON.stringify(state,null,1),"application/json"),
 "import-json":()=>$("#importfile").click(),
 save:()=>saveFile(false), "save-as":()=>saveFile(true), "open-file":()=>desktopOpen(),
 "new-subject":()=>subjectModal(),
 "del-subject":el=>confirmBox("Ämnet och dess innehåll tas bort. Kurser i ämnet blir utan ämne.",()=>{delete state.custom[el.dataset.id];commit()}),
 "save-year":()=>{const s=val("ys"),e=val("ye");if(s&&e&&e>s){state.year={start:s,end:e};commit()}},
 scale:el=>{const from=scale();const to=SCALES[el.value];if(!to||el.value===state.scale)return;
  Object.values(state.grades).forEach(m=>Object.values(m).forEach(v=>{const i=from.levels.findIndex(l=>l.k===v.k);if(i>=0)v.k=to.levels[Math.round(i/(from.levels.length-1)*(to.levels.length-1))].k}));state.scale=el.value;commit()}
};
document.addEventListener("click",e=>{const el=e.target.closest("[data-a]");if(!el)return;const f=A[el.dataset.a];if(!f)return;if(el.dataset.a==="scale")return;if(el.dataset.a==="ov"){if(e.target===el)closeModal();return}if(el.tagName!=="A")e.preventDefault();f(el,e)});
document.addEventListener("change",e=>{if(e.target.id==="subjfilter"){ui.subjFilter=e.target.value;saveUI();render()}if(e.target.id==="acourse"){ui.acourse=e.target.value;saveUI();render()}if(e.target.dataset.a==="scale")A.scale(e.target);if(e.target.id==="chkupd"){state.checkUpdates=e.target.checked;commit()}});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();if((e.key==="Enter"||e.key===" ")&&e.target.matches(".arc,[data-a='edit-event']")){e.preventDefault();e.target.dispatchEvent(new MouseEvent("click",{bubbles:true}))}});
$("#importfile").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{state=parsePlanbok(await f.text());state.example=false;commit();modal("Importerat",`<p style="margin:0">Datan är inläst: ${state.courses.length} kurser, ${state.units.length} arbetsområden, ${state.assessments.length} bedömningar.</p><div class="actions"><button class="btn pri" data-a="close">Klart</button></div>`)}catch(err){modal("Kunde inte importera",`<p style="margin:0">Filen kommer inte från Lärarbordet. Välj en exporterad .json eller en sparad lararbordet.html.</p><div class="actions"><button class="btn pri" data-a="close">OK</button></div>`)}e.target.value=""});
window.addEventListener("hashchange",()=>{closeModal();render();window.scrollTo(0,0)});
