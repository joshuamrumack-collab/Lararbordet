/* ---------- bedömningsskalor ---------- */
const SCALES={
 af:{name:"A–F (betygsstegen)",levels:[{k:"F",l:"F",low:1},{k:"E",l:"E"},{k:"D",l:"D"},{k:"C",l:"C"},{k:"B",l:"B"},{k:"A",l:"A"}]},
 lokal:{name:"Lokal femgradig skala",levels:[{k:"1",l:"Ej visat",low:1},{k:"2",l:"På väg",low:1},{k:"3",l:"Godtagbart"},{k:"4",l:"Väl godtagbart"},{k:"5",l:"Mycket väl godtagbart"}]}
};
const scale=()=>SCALES[state.scale]||SCALES.af;
const lvIdx=k=>scale().levels.findIndex(l=>l.k===k);
const lvT=k=>{const i=lvIdx(k);return i<0?null:i/(scale().levels.length-1)};
const gradeT=k=>k==="G"?1:k==="EG"?0:lvT(k);
const gradeL=k=>k==="G"?"G":k==="EG"?"EG":k;
const hueT=t=>Math.round(8+t*132);
const isLow=k=>{const l=scale().levels.find(x=>x.k===k);return !!(l&&l.low)};
function median(arr){if(!arr.length)return null;const s=[...arr].sort((a,b)=>a-b);return s[Math.floor((s.length-1)/2)]}

/* ---------- exempeldata ---------- */
function exampleState(){
 const Y=2026,Y2=2027;
 const c=[{id:"c-sv",name:"Svenska 8B",subjectId:"GRGRSVE01/7-9",groupId:"g8b",color:COLORS[0]},{id:"c-ma",name:"Matematik 8B",subjectId:"GRGRMAT01/7-9",groupId:"g8b",color:COLORS[1]},{id:"c-en",name:"Engelska 8B",subjectId:"GRGRENG01/7-9",groupId:"g8b",color:COLORS[2]},{id:"c-tk",name:"Teknik 8",subjectId:"GRGRTEK01/7-9",groupId:"g8b",color:COLORS[3]}];
 const U=(id,courseId,title,s,e,status,contentIds,desc="")=>({id,courseId,title,start:s,end:e,status,contentIds,desc});
 const units=[
  U("u1","c-sv","Novellen",W(Y,34),W(Y,39,4),"klar",["GRGRSVE01/7-9~1.1", "GRGRSVE01/7-9~3.1", "GRGRSVE01/7-9~3.2", "GRGRSVE01/7-9~1.4"],"Läsa noveller, analysera berättartekniker, skriva egen novell."),
  U("u2","c-sv","Debattartikel och argumentation",W(Y,40),W(Y,43,4),"klar",["GRGRSVE01/7-9~1.4", "GRGRSVE01/7-9~3.5", "GRGRSVE01/7-9~2.1", "GRGRSVE01/7-9~1.5"],"Argumenterande text och muntlig debatt. Kamratrespons i Docs."),
  U("u3","c-sv","Källkritik i digitala medier",W(Y,45),W(Y,48,4),"pagar",["GRGRSVE01/7-9~5.1", "GRGRSVE01/7-9~5.2", "GRGRSVE01/7-9~5.3", "GRGRSVE01/7-9~4.4"],"Faktagranskning, källhänvisningar, AI-genererat innehåll."),
  U("u4","c-sv","Lyrik och muntlig framställning",W(Y,49),W(Y,51,4),"planerad",["GRGRSVE01/7-9~3.1", "GRGRSVE01/7-9~3.2", "GRGRSVE01/7-9~2.3"]),
  U("u5","c-sv","Språk i förändring",W(Y2,3),W(Y2,7,4),"planerad",["GRGRSVE01/7-9~4.5", "GRGRSVE01/7-9~4.6"]),
  U("u6","c-ma","Tal och procent",W(Y,34),W(Y,38,4),"klar",["GRGRMAT01/7-9~1.1", "GRGRMAT01/7-9~1.4", "GRGRMAT01/7-9~1.5", "GRGRMAT01/7-9~5.3"]),
  U("u7","c-ma","Algebra och ekvationer",W(Y,39),W(Y,48,4),"pagar",["GRGRMAT01/7-9~2.1", "GRGRMAT01/7-9~2.2", "GRGRMAT01/7-9~2.3", "GRGRMAT01/7-9~6.1"]),
  U("u8","c-ma","Geometri",W(Y,49),W(Y2,6,4),"planerad",["GRGRMAT01/7-9~3.1", "GRGRMAT01/7-9~3.2", "GRGRMAT01/7-9~3.4"]),
  U("u9","c-ma","Statistik och sannolikhet",W(Y2,9),W(Y2,13,4),"planerad",["GRGRMAT01/7-9~4.1", "GRGRMAT01/7-9~4.3"]),
  U("u10","c-en","Short stories",W(Y,35),W(Y,40,4),"klar",["GRGRENG01/7-9~2.3", "GRGRENG01/7-9~2.5", "GRGRENG01/7-9~1.1"]),
  U("u11","c-en","Debate club",W(Y,41),W(Y,48,4),"pagar",["GRGRENG01/7-9~1.3", "GRGRENG01/7-9~3.1", "GRGRENG01/7-9~3.2"]),
  U("u12","c-en","Travel and cultures",W(Y2,3),W(Y2,8,4),"planerad",["GRGRENG01/7-9~1.4", "GRGRENG01/7-9~2.1"]),
  U("u13","c-tk","Styr och reglering med micro:bit",W(Y,36),W(Y,50,4),"pagar",["GRGRTEK01/7-9~2.2", "GRGRTEK01/7-9~3.3", "GRGRTEK01/7-9~3.4", "GRGRTEK01/7-9~2.1"]),
  U("u14","c-tk","Hållbar teknik",W(Y2,4),W(Y2,10,4),"planerad",["GRGRTEK01/7-9~1.3", "GRGRTEK01/7-9~1.2"])
 ];
 const events=[
  {id:"e1",title:"Höstlov",start:W(Y,44),end:W(Y,44,4),type:"lov"},
  {id:"e2",title:"Utvecklingssamtal",start:W(Y,46),end:W(Y,46,4),type:"annat"},
  {id:"e3",title:"Betygsunderlag HT klart",start:W(Y,50,4),end:W(Y,50,4),type:"deadline"},
  {id:"e4",title:"Jullov",start:"2026-12-21",end:"2027-01-08",type:"lov"},
  {id:"e5",title:"Sportlov",start:W(Y2,9),end:W(Y2,9,4),type:"lov"},
  {id:"e6",title:"Påsklov",start:W(Y2,13),end:W(Y2,13,4),type:"lov"},
  {id:"e7",title:"Betygssättning VT",start:"2027-06-04",end:"2027-06-04",type:"deadline"},
  {id:"e8",title:"Studiedag",start:W(Y,48,4),end:W(Y,48,4),type:"studiedag"},
  {id:"e9",title:"Friluftsdag",start:W(Y,49,3),end:W(Y,49,3),type:"aktivitet",groups:["g8b"],from:"",to:""},
  {id:"e10",title:"Prao",start:W(Y2,6),end:W(Y2,7,4),type:"aktivitet",groups:["g8b"],from:"",to:""}
 ];
 const names=["Alva","Elias","Maja","Noah","Wilma","Liam","Ella","Hugo","Saga","Omar","Freja","Leo"];
 const base=[4,2,5,1,3,0,3,2,4,3,5,1];
 const students=names.map((n,i)=>({id:"s"+(i+1),name:n+" "+"ABCDEFGHIJKL"[i]+"."}));
 const assessments=[
  {id:"a1",title:"Novellanalys",date:W(Y,39,2),courseId:"c-sv",groupId:"g8b",unitId:"u1",desc:"Skriftlig analys av två noveller."},
  {id:"a2",title:"Muntlig debatt",date:W(Y,42,2),courseId:"c-sv",groupId:"g8b",unitId:"u2",desc:""},
  {id:"a3",title:"Debattartikel",date:W(Y,43,4),courseId:"c-sv",groupId:"g8b",unitId:"u2",desc:""},
  {id:"a4",title:"Diagnos procent",date:W(Y,36,3),courseId:"c-ma",groupId:"g8b",unitId:"u6",desc:""},
  {id:"a5",title:"Prov tal och procent",date:W(Y,38,3),courseId:"c-ma",groupId:"g8b",unitId:"u6",desc:""},
  {id:"a6",title:"Book review",date:W(Y,40,4),courseId:"c-en",groupId:"g8b",unitId:"u10",desc:""},
  {id:"a7",title:"Styrsystem-prototyp",date:W(Y,43,3),courseId:"c-tk",groupId:"g8b",unitId:"u13",desc:"Delredovisning."}
 ];
 const L=["F","E","D","C","B","A"]; const grades={};
 assessments.forEach((a,j)=>{grades[a.id]={};students.forEach((s,i)=>{if(a.id==="a3"&&i>8)return;if(a.id==="a7"&&i%4===3)return;const v=Math.max(0,Math.min(5,base[i]+((i*7+j*3)%3)-1));grades[a.id][s.id]={k:L[v],note:(a.id==="a5"&&i===5)?"Behöver extra stöd med procentuell förändring.":""}})});
 const schedule=[
  {id:"s-sv1",courseId:"c-sv",day:1,start:"08:20",end:"09:20",room:"B12",weeks:"alla"},{id:"s-sv2",courseId:"c-sv",day:4,start:"10:00",end:"11:00",room:"B12",weeks:"alla"},
  {id:"s-ma1",courseId:"c-ma",day:2,start:"09:30",end:"10:30",room:"C3",weeks:"alla"},{id:"s-ma2",courseId:"c-ma",day:3,start:"13:00",end:"14:00",room:"C3",weeks:"alla"},
  {id:"s-en1",courseId:"c-en",day:3,start:"08:20",end:"09:20",room:"B14",weeks:"alla"},{id:"s-en2",courseId:"c-en",day:5,start:"10:00",end:"11:00",room:"B14",weeks:"alla"},
  {id:"s-tk1",courseId:"c-tk",day:2,start:"13:00",end:"14:20",room:"Tekniksalen",weeks:"alla"}];
 /* lektioner: varje arbetsområde som pågår eller är klart får lektioner två dagar i veckan */
 const lessons=[];const plans={u3:["Vad är en källa?","Sök och sovra","Faktagranska en nyhet","AI-genererade bilder och texter","Källhänvisningar","Skriv en källkritisk text","Kamratrespons","Redovisning"]};
 units.filter(u=>u.status!=="planerad").forEach(u=>{const wd=u.courseId==="c-sv"?[1,4]:u.courseId==="c-ma"?[2,3]:u.courseId==="c-en"?[3,5]:[2];let n=0;
  for(let d=parseD(u.start);d<=parseD(u.end);d=addDays(d,1)){if(!wd.includes(d.getDay())||events.some(e=>e.type==="lov"&&parseD(e.start)<=d&&parseD(e.end)>=d))continue;n++;const ds=fmtD(d);
   lessons.push({id:"l"+u.id+"-"+n,unitId:u.id,date:ds,title:(plans[u.id]&&plans[u.id][n-1])||("Lektion "+n),plan:n===1&&u.id==="u3"?"Brainstorm: var hittar ni nyheter? Gemensam genomgång av SAFE-modellen. Exit ticket.":"",note:ds<fmtD(TODAY)&&n%3===1?"Gick bra, flera behöver mer stöd med sökord.":"",done:ds<fmtD(TODAY)})}});
 /* betygskriterier: muntlig debatt bedöms mot aspekt 1, debattartikeln mot aspekt 2 (svenska åk 9) */
 assessments.find(a=>a.id==="a2").aspects=[0];assessments.find(a=>a.id==="a3").aspects=[1];
 ["a2","a3"].forEach(aid=>{const asp=aid==="a2"?0:1;Object.values(grades[aid]).forEach(g=>{g.asp={[asp]:g.k};g.manual=false})});
 return {v:2,example:true,updated:0,scale:"af",year:{start:"2026-08-17",end:"2027-06-11"},mine:["GRGRSVE01/7-9", "GRGRMAT01/7-9", "GRGRENG01/7-9", "GRGRTEK01/7-9"],custom:{},extra:{},lessons,archive:[],schedule,cancel:{},checkUpdates:true,courses:c,units,events,manual:{},groups:[{id:"g8b",name:"8B",students:students.map((st,i)=>i===1?Object.assign({},st,{adapt:["tid","las","stav"]}):i===3?Object.assign({},st,{adapt:["tid","instr","delar"],note:"Behöver komma igång direkt, ge första uppgiften vid dörren."}):i===6?Object.assign({},st,{adapt:["kapa","plats"]}):st)}],assessments,grades};
}
function emptyState(){return {v:2,example:false,updated:Date.now(),scale:"af",year:{start:"2026-08-17",end:"2027-06-11"},mine:[],custom:{},extra:{},lessons:[],archive:[],schedule:[],cancel:{},checkUpdates:true,courses:[],units:[],events:[],manual:{},groups:[],assessments:[],grades:{}}}
function normalize(s){const e=emptyState();const o=Object.assign(e,s||{});for(const k of ["courses","units","events","groups","assessments","mine","lessons","archive","schedule","process"]) if(!Array.isArray(o[k]))o[k]=[];if(!o.grades||typeof o.grades!=="object")o.grades={};if(!o.manual)o.manual={};if(!o.custom)o.custom={};if(!o.cancel||typeof o.cancel!=="object")o.cancel={};if(!o.extra)o.extra={};if(!o.kmat||typeof o.kmat!=="object")o.kmat={};if(!o.removed||typeof o.removed!=="object")o.removed={};
 /* äldre filer (v1) hade ämnena inbäddade: behåll egna ämnen, och gamla förkortade listor som används av kurser */
 if(o.subjects){const used=new Set(o.courses.map(c=>c.subjectId));Object.values(o.subjects).forEach(x=>{if(!x||!x.id)return;if(!x.builtin)o.custom[x.id]=x;else if(used.has(x.id))o.custom[x.id]=Object.assign({},x,{builtin:false,stage:(x.stage||"")+" (äldre förkortad lista)"})});delete o.subjects}
 o.mine=o.mine.filter(id=>PLAN[id]);o.v=2;return o}


/* ---------- härledda data ---------- */
const course=id=>state.courses.find(c=>c.id===id);
const unit=id=>state.units.find(u=>u.id===id);
const group=id=>state.groups.find(g=>g.id===id);
const allItems=sid=>{const s=subj(sid);return s?s.areas.flatMap(a=>a.items):[]};
function coverage(sid,courseFilter){
 const res={};const items=allItems(sid);items.forEach(i=>res[i.id]={state:"gap",units:[],assessed:false,tests:[],manual:!!state.manual[i.id]});
 const rank={gap:0,planned:1,ongoing:2,covered:3};const map={planerad:"planned",pagar:"ongoing",klar:"covered",bedomd:"covered"};
 const cs=state.courses.filter(c=>c.subjectId===sid&&(courseFilter==="all"||!courseFilter||c.id===courseFilter)).map(c=>c.id);
 state.units.filter(u=>cs.includes(u.courseId)).forEach(u=>(u.contentIds||[]).forEach(id=>{const r=res[id];if(!r)return;r.units.push(u);if(u.status==="bedomd")r.assessed=true;const st=map[u.status]||"planned";if(rank[st]>rank[r.state])r.state=st}));
 state.assessments.filter(a=>cs.includes(a.courseId)).forEach(a=>{const u=unit(a.unitId);(u?u.contentIds||[]:[]).concat(a.contentIds||[]).forEach(id=>{if(res[id]){res[id].assessed=true;if(!res[id].tests.includes(a))res[id].tests.push(a)}})});
 Object.values(res).forEach(r=>{if(r.manual)r.state="covered"});
 return res}
function covSummary(sid,cf){const c=coverage(sid,cf);const v=Object.values(c);const n=v.length||1;const k=s=>v.filter(x=>x.state===s).length;return {n:v.length,covered:k("covered"),ongoing:k("ongoing"),planned:k("planned"),gap:k("gap"),pct:Math.round(k("covered")/n*100)}}
const usedSubjects=()=>[...new Set([...state.mine,...state.courses.map(c=>c.subjectId),...Object.keys(state.custom)])].filter(id=>subj(id));
function yearWeeks(){const out=[];let d=mondayOf(parseD(state.year.start));const end=parseD(state.year.end);while(d<=end){out.push(new Date(d));d=addDays(d,7)}return out}
const inLov=d=>state.events.some(e=>e.type==="lov"&&parseD(e.start)<=addDays(d,4)&&parseD(e.end)>=d);
function studentSummary(gid,sid,courseFilter){const vals=[];let low=0,missing=0;state.assessments.filter(a=>a.groupId===gid&&(courseFilter==="all"||a.courseId===courseFilter)).forEach(a=>{const g=(state.grades[a.id]||{})[sid];if(g&&lvIdx(g.k)>=0){vals.push(lvIdx(g.k));if(isLow(g.k))low++}else missing++});const m=median(vals);return {m,low,missing,count:vals.length}}
