/* ---------- omdömen med tangentbordet, som i ett kalkylark ----------
   Klick markerar en ruta, klick igen eller Enter öppnar rutan för omdöme och anteckning.
   Skriv nivån (t.ex. C, eller G/EG) så sparas den och markeringen flyttar ned till nästa elev.
   Piltangenter flyttar, Delete tar bort omdömet. */
let SEL_CELL=null,QG_BUF="",QG_T=null;
const finePointer=()=>window.matchMedia&&window.matchMedia("(pointer:fine)").matches;
const cellKey=el=>el.dataset.as+"|"+el.dataset.st;
function selectCell(el){document.querySelectorAll(".mx .cell.sel").forEach(x=>x.classList.remove("sel"));if(!el)return;el.classList.add("sel");SEL_CELL=cellKey(el);el.focus({preventScroll:false})}
function gradeKeys(aid){const a=state.assessments.find(x=>x.id===aid);return a&&a.mode==="gk"?["G","EG"]:scale().levels.map(l=>l.k)}
function quickGrade(aid,sid,k){const cur=(state.grades[aid]||{})[sid]||{};state.grades[aid]=state.grades[aid]||{};
 const keep=cur.note||(cur.asp&&Object.keys(cur.asp).length)||cur.p!=null;
 if(!k){if(keep)state.grades[aid][sid]=Object.assign({},cur,{k:""});else delete state.grades[aid][sid]}
 else state.grades[aid][sid]=Object.assign({},cur,{k},cur.asp&&Object.keys(cur.asp).length?{manual:true}:{});
 const a=state.assessments.find(x=>x.id===aid);if(a)ui.lastCourse=a.courseId;commit()}
function cellAt(el,dr,dc){const td=el.closest("td"),tr=td.closest("tr");const ci=[...tr.children].indexOf(td);const rows=[...tr.parentElement.children];const ri=rows.indexOf(tr);
 const r=rows[ri+dr];if(!r)return null;const t=r.children[ci+dc];return t?t.querySelector(".cell"):null}
function refocus(key,dr){const [aid,sid]=key.split("|");const el=document.querySelector(`.mx .cell[data-as="${aid}"][data-st="${sid}"]`);if(!el)return;selectCell(dr?cellAt(el,dr,0)||el:el)}
document.addEventListener("keydown",e=>{const el=e.target;if(!el||!el.classList||!el.classList.contains("cell")||!el.closest(".mx")||e.ctrlKey||e.metaKey||e.altKey)return;
 const mv={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[e.key];
 if(mv){e.preventDefault();const n=cellAt(el,mv[0],mv[1]);if(n)selectCell(n);return}
 if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();gradeModal(el.dataset.as,el.dataset.st);return}
 if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();const k=cellKey(el);quickGrade(el.dataset.as,el.dataset.st,"");refocus(k,0);return}
 if(e.key.length!==1||READONLY)return;
 const keys=gradeKeys(el.dataset.as);QG_BUF+=e.key.toUpperCase();clearTimeout(QG_T);
 const exact=keys.find(k=>k.toUpperCase()===QG_BUF);const pre=keys.filter(k=>k.toUpperCase().startsWith(QG_BUF));
 if(!pre.length){QG_BUF="";if(!exact){el.classList.add("nope");setTimeout(()=>el.classList.remove("nope"),300);return}}
 e.preventDefault();
 const done=k=>{QG_BUF="";const key=cellKey(el);quickGrade(el.dataset.as,el.dataset.st,k);refocus(key,1)};
 if(pre.length===1){done(pre[0]);return}
 if(exact){QG_T=setTimeout(()=>done(exact),600);return}
 QG_T=setTimeout(()=>{QG_BUF=""},900)},true);
document.addEventListener("mousedown",e=>{const el=e.target&&e.target.closest&&e.target.closest(".mx .cell");if(el)el.dataset.was=el.classList.contains("sel")?"1":""},true);
document.addEventListener("focusin",e=>{const el=e.target;if(el&&el.classList&&el.classList.contains("cell")&&el.closest(".mx")){document.querySelectorAll(".mx .cell.sel").forEach(x=>x!==el&&x.classList.remove("sel"));el.classList.add("sel");SEL_CELL=cellKey(el)}});
