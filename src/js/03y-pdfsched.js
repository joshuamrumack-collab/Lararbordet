/* ---------- Schema från PDF (t.ex. utskrift från Skola24 eller annan schemavisare) ----------
   items: [{str,x,y,w,page}] där y växer nedåt. Hittar dagkolumner via rubrikerna Måndag–Fredag,
   och lektioner via klockslag: överst start, längst ned slut (eller "08:20-09:20" i samma text). */
const PDF_DAYS=[["mån",1],["tis",2],["ons",3],["tor",4],["fre",5],["mon",1],["tue",2],["wed",3],["thu",4],["fri",5]];
const TIME_RE=/\b([01]?\d|2[0-3])[:.]([0-5]\d)(?:\s?([ap])\.?m\b\.?)?/gi;
const DAY_WORD=/^(måndag|mån|tisdag|tis|onsdag|ons|torsdag|tors|tor|fredag|fre|monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thu|friday|fri)(?=$|[\s.,:\/0-9(-])/;
const hhmm=(h,m,ap)=>{h=+h;if(ap){ap=ap.toLowerCase();if(ap==="p"&&h<12)h+=12;if(ap==="a"&&h===12)h=0}return String(h).padStart(2,"0")+":"+m};
function parsePdfSchedule(items){const out=[];const pages=[...new Set(items.map(i=>i.page||1))];
 for(const pg of pages){const its=items.filter(i=>(i.page||1)===pg&&String(i.str).trim());
  /* dagrubriker */
  const heads=[];its.forEach(i=>{const t=i.str.trim().toLowerCase();const dm=t.match(DAY_WORD);const d=dm&&!/\d{1,2}[:.]\d{2}/.test(t)?PDF_DAYS.find(([k])=>dm[1].startsWith(k)):null;if(d&&!heads.some(h=>h.day===d[1]))heads.push({day:d[1],x:i.x+(i.w||0)/2,l:i.x,y:i.y})});
  if(heads.length<2)continue;heads.sort((a,b)=>a.x-b.x);
  const gap=(heads[heads.length-1].x-heads[0].x)/(heads.length-1);const headY=Math.max(...heads.map(h=>h.y));
  const lo=Math.min(heads[0].x-gap/2,heads[0].l)-6,hi=heads[heads.length-1].x+gap*0.75;
  /* klockslag och övrig text under rubrikerna */
  let toks=[];const texts=[];
  its.forEach(i=>{if(i.y<=headY+2)return;const s=i.str.trim();const ts=[...s.matchAll(TIME_RE)];const w=i.w||0;
   if(ts.length){const per=w/Math.max(1,ts.length);ts.forEach((m,k)=>toks.push({t:hhmm(m[1],m[2],m[3]),x:i.x+k*per,w:per,y:i.y+k*0.01,id:toks.length}));const rest=s.replace(TIME_RE,"").replace(/^[\s\-–—]+|[\s\-–—]+$/g,"").trim();if(rest.length>1)texts.push({s:rest,x:i.x,w,y:i.y})}
   else texts.push({s,x:i.x,w,y:i.y})});
  /* tidsaxeln till vänster (hela och halva timmar i en lodrät rad) räknas inte */
  const byX={};toks.forEach(t=>{const k=Math.round(t.x/4);(byX[k]=byX[k]||[]).push(t)});
  Object.values(byX).forEach(g=>{if(g.length>=4&&g.every(t=>/:(00|30)$/.test(t.t))&&g[0].x<heads[0].x)toks=toks.filter(t=>!g.includes(t))});
  toks=toks.filter(t=>t.x+t.w/2>=lo&&t.x<=hi).sort((a,b)=>a.y-b.y||a.x-b.x);
  /* para ihop start och slut: närmaste senare klockslag nedanför, i samma kolumn */
  const used=new Set();
  for(const st of toks){if(used.has(st.id))continue;let best=null;
   for(const e of toks){if(used.has(e.id)||e===st||e.y<st.y||e.t<=st.t)continue;if(e.x<st.x-12||e.x>st.x+gap*0.95)continue;if(!best||e.y<best.y)best=e}
   if(!best)continue;used.add(st.id);used.add(best.id);
   const cx=(st.x+best.x+best.w)/2;let col=heads[0],bd=1e9;heads.forEach(h=>{const d=Math.abs(h.x-cx);if(d<bd){bd=d;col=h}});
   const nxt=toks.filter(t=>!used.has(t.id)&&t.y>st.y+1&&t.x>=st.x-12&&t.x<=st.x+gap*0.95).sort((a,b)=>a.y-b.y)[0];
   const bot=best.y-st.y<1?(nxt?nxt.y-1:best.y+60):best.y+4;const L=Math.min(st.x,best.x)-4,R=Math.max(best.x+best.w,st.x+gap*0.6)+4;
   const txt=texts.filter(x=>x.y>=st.y-14&&x.y<=bot&&x.x+x.w/2>=L&&x.x+x.w/2<=R).sort((a,b)=>a.y-b.y||a.x-b.x).map(x=>x.s);
   const room=([...txt].reverse().find(x=>/^(sal\s*)?[A-ZÅÄÖ]{0,3}\s?\d{1,4}[A-Za-z]?$/i.test(x))||"").replace(/^sal\s*/i,"");
   out.push({day:col.day,start:st.t,end:best.t,text:txt.filter(x=>x!==room).join(" ").replace(/\s+/g," ").trim(),room})}}
 const seen=new Set();return out.filter(x=>{const k=[x.day,x.start,x.end,x.text].join("|");if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>a.day-b.day||(a.start<b.start?-1:1))}
/* gissar kurs ur texten i en lektion: kursnamn, ämnesnamn eller ämneskod och grupp */
function guessCourse(s,text){const t=String(text||"").toLowerCase();if(!t)return "";let best="",bs=0;
 (s.courses||[]).forEach(c=>{let sc=0;const n=c.name.toLowerCase();if(t.includes(n))sc+=10;n.split(/\s+/).forEach(w=>{if(w.length>1&&t.includes(w))sc+=w.length>3?3:2});
  const g=(s.groups||[]).find(x=>x.id===c.groupId);if(g&&t.includes(g.name.toLowerCase()))sc+=4;
  const code=String(c.subjectId||"").split("/")[0].toLowerCase();if(code&&t.includes(code.slice(0,6)))sc+=4;
  if(sc>bs){bs=sc;best=c.id}});return bs>=3?best:""}
