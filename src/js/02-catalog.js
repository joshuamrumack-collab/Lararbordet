/* ---------- Skolverkets kurs- och ämnesplaner (ordagrant centralt innehåll) ---------- */
/* Datan ligger gzip-komprimerad och base64-kodad i sidan och packas upp med fflate (MIT). I tester sätts globalThis.PB_DATA. */
function unpack(id){if(globalThis.PB_DATA&&globalThis.PB_DATA[id])return globalThis.PB_DATA[id];const t=document.getElementById(id+"-gz").textContent.trim();const bin=atob(t);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return JSON.parse(new TextDecoder().decode(fflate.gunzipSync(u)))}
const CAT=unpack("catalog");
let _CRIT=null;const CRIT=()=>_CRIT||(_CRIT=unpack("crit"));
const FORMS=CAT.forms;
const PLAN={};FORMS.forEach(f=>f.subjects.forEach(su=>su.plans.forEach(pl=>PLAN[pl.id]={f,s:su,p:pl})));
const FORM_LABEL={GR:"Grundskolan",GRAN:"Anpassad grundskola",GRANO:"Anpassad grundskola · ämnesområde",GY:"Gymnasieskolan",GYOLD:"Gymnasieskolan · äldre kurs",X:"Eget ämne"};
const stripPts=t=>String(t).replace(/\s*\(\d+ p\)$/,"");
function planNames(r){if(r.f.id==="GYOLD")return {name:stripPts(r.p.name),stage:(r.p.name.match(/\((\d+ p)\)$/)||["",""])[1]};
 const st=r.p.name.replace(/^Åk /,"åk ").replace(/^Nivå /,"nivå ").replace(/^Alla årskurser$/,"");return {name:r.s.name,stage:st}}
const _sc={};
function subj(id){
 if(!id)return null;if(state.custom&&state.custom[id])return state.custom[id];
 const r=PLAN[id];if(!r)return null;
 let o=_sc[id];if(!o){const nm=planNames(r);o=_sc[id]={id,name:nm.name,stage:nm.stage,form:r.f.id,official:true,areas:r.p.areas.map((ar,ai)=>({id:id+"~"+(ai+1),name:ar[0],items:ar[1].map((t,ii)=>({id:id+"~"+(ai+1)+"."+(ii+1),text:t}))}))}}
 const ex=(state.extra||{})[id]||[];if(!ex.length)return o;
 return Object.assign({},o,{areas:o.areas.map(ar=>Object.assign({},ar,{items:ar.items.concat(ex.filter(e=>e.area===ar.id).map(e=>({id:e.id,text:e.text,custom:true})))}))})}
const subjTitle=id=>{const x=subj(id);return x?(x.name+(x.stage?" "+x.stage:"")):"Okänt ämne"};
const formOf=id=>{const x=subj(id);return x?(x.form||"X"):"X"};
