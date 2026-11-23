/* ---------- hjälpfunktioner ---------- */
const APP_VERSION="@@VERSION@@";
const $=s=>document.querySelector(s);
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const parseD=s=>{const [y,m,d]=String(s).split("-").map(Number);return new Date(y,(m||1)-1,d||1)};
const fmtD=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const mondayOf=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
function isoWeek(d){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y0)/864e5+1)/7)}
const weekMon=(y,w)=>addDays(mondayOf(new Date(y,0,4)),(w-1)*7);
const W=(y,w,off=0)=>fmtD(addDays(weekMon(y,w),off));
const MON=["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
const DAY=["söndag","måndag","tisdag","onsdag","torsdag","fredag","lördag"];
const shortD=s=>{const d=parseD(s);return d.getDate()+" "+MON[d.getMonth()]};
const wkRange=(a,b)=>{const wa=isoWeek(parseD(a)),wb=isoWeek(parseD(b));return wa===wb?"v."+wa:"v."+wa+"–"+wb};
const TODAY=(()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())})();
const COLORS=["#2f6db3","#c46a2f","#2f8f62","#8a4fa8","#b8465f","#6a8a1f","#1f8ca3","#a07a1c"];
const STATUS={planerad:"Planerad",pagar:"Pågår",klar:"Genomförd",bedomd:"Bedömd"};
const ATYPES={prov:"Prov",inlamning:"Skriftlig inlämning",redovisning:"Redovisning",muntligt:"Muntlig uppgift",laboration:"Laboration",seminarium:"Seminarium",projekt:"Projekt",diagnos:"Diagnos",np:"Nationellt prov",halvkurs:"Halvkursprov",annat:"Annat"};
const AMODES={betyg:"Betygssteg",gk:"Genomfört / ej genomfört"};
const ICON={
 oversikt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
 planering:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M7 13h5M7 17h9"/></svg>',
 schema:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M9 9v12M15 9v12M3 15h18"/></svg>',
 arshjul:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M21 12h-5"/></svg>',
 innehall:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l2 2 3-3M4 13l2 2 3-3M4 20h.01"/><path d="M12 7h8M12 14h8M12 20h8"/></svg>',
 bedomning:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>',
 process:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16M6 16l3-4 3 2 4-6 3 3"/><circle cx="6" cy="16" r="1"/></svg>',
 elever:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16.5 14.3c2.5.2 4.3 2 5 4.7"/></svg>',
 installningar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
};
const TABS=[["oversikt","Översikt"],["schema","Schema"],["planering","Planering"],["elever","Elever"],["arshjul","Årshjul"],["bedomning","Bedömning"],["process","Process"],["innehall","Centralt innehåll"],["installningar","Inställningar"]];
const CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2"><path d="M5 12l5 5 9-10"/></svg>';

/* ljust eller mörkt läge, sparas per dator/telefon */
const THEMES={auto:"Som datorn",light:"Ljust",dark:"Mörkt"};
function getTheme(){try{return localStorage.getItem("lb-theme")||"auto"}catch(e){return "auto"}}
function applyTheme(t){t=t||getTheme();if(t==="auto")document.documentElement.removeAttribute("data-theme");else document.documentElement.setAttribute("data-theme",t)}
function setTheme(t){try{localStorage.setItem("lb-theme",t)}catch(e){}applyTheme(t)}
if(typeof document!=="undefined"&&document.documentElement)applyTheme();
const themeSeg=()=>`<div class="seg" role="group" aria-label="Utseende">${Object.entries(THEMES).map(([k,l])=>`<button aria-pressed="${getTheme()===k}" data-a="theme" data-v="${k}">${l}</button>`).join("")}</div>`;

/* vanliga anpassningar (extra anpassningar i undervisningen) */
const ADAPT={tid:"Extra tid",las:"Uppläst text eller talsyntes",ljud:"Ljudböcker",stav:"Rättstavningsprogram",tal:"Tal till text",munt:"Muntlig redovisning i stället för skriftlig",rum:"Avskild plats vid prov",instr:"Instruktioner skriftligt och i punktform",forf:"Förförståelse, genomgång i förväg",bild:"Bildstöd eller visuellt schema",delar:"Uppgifter i mindre delar",mall:"Mallar och stödstrukturer",dator:"Dator eller digitala verktyg",kapa:"Hörselkåpor",plats:"Särskild placering i klassrummet",paus:"Pauser eller rörelsepauser",forst:"Förstorad text",inl:"Förlängd inlämning"};
/* klockslag alltid i 24-timmarsformat: "820", "8.20", "8:2" och "14" blir 08:20, 08:20, 08:02, 14:00 */
function normTime(v){v=String(v||"").trim();if(!v)return "";let m=v.match(/^(\d{1,2})[:.,\s]?(\d{2})?$/)||v.match(/^(\d{1,2})[:.](\d)$/);
 if(!m){const d=v.replace(/\D/g,"");if(d.length===3||d.length===4)m=[0,d.slice(0,-2),d.slice(-2)];else return v}
 let h=+m[1],mi=m[2]!=null?+m[2]:0;if(String(m[2]||"").length===1)mi=+m[2];if(h>23||mi>59)return v;return String(h).padStart(2,"0")+":"+String(mi).padStart(2,"0")}
if(typeof document!=="undefined")document.addEventListener("focusout",e=>{const t=e.target;if(t&&t.classList&&t.classList.contains("tm")){const n=normTime(t.value);if(n!==t.value){t.value=n;t.dispatchEvent(new Event("change",{bubbles:true}))}}});
const atypeL=a=>a.type==="annat"&&a.typeOther?a.typeOther:(ATYPES[a.type]||"");
/* flikarnas ordning kan ändras under Inställningar */
/* dolda flikar: Innehåll ligger som standard under Planering */
const hiddenTabs=()=>(typeof ui!=="undefined"&&Array.isArray(ui.hiddenTabs))?ui.hiddenTabs:["innehall"];
const tabHidden=id=>id!=="installningar"&&hiddenTabs().includes(id);
function tabsOrdered(){const o=(typeof ui!=="undefined"&&Array.isArray(ui.tabOrder))?ui.tabOrder:[];const ix=id=>{const k=o.indexOf(id);return k<0?100+TABS.findIndex(t=>t[0]===id):k};
 return [...TABS].sort((a,b)=>a[0]==="installningar"?1:b[0]==="installningar"?-1:ix(a[0])-ix(b[0]))}
