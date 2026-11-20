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
const STATUS={planerad:"Planerad",pagar:"Pågår",klar:"Genomförd"};
const ICON={
 oversikt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
 planering:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M7 13h5M7 17h9"/></svg>',
 schema:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M9 9v12M15 9v12M3 15h18"/></svg>',
 arshjul:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M21 12h-5"/></svg>',
 innehall:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l2 2 3-3M4 13l2 2 3-3M4 20h.01"/><path d="M12 7h8M12 14h8M12 20h8"/></svg>',
 bedomning:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>',
 installningar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
};
const TABS=[["oversikt","Översikt"],["planering","Planering"],["schema","Schema"],["arshjul","Årshjul"],["innehall","Centralt innehåll"],["bedomning","Bedömning"],["installningar","Inställningar"]];
const CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2"><path d="M5 12l5 5 9-10"/></svg>';
