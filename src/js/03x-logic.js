/* ---------- logik för läsår, delning, lektioner och betygskriterier ----------
   Rena funktioner utan DOM, så att de kan testas med node --test. */

/* Läs data ur en exporterad .json eller ur en sparad lararbordet.html */
function parsePlanbok(text){let t=String(text||"").trim();if(t.startsWith("<")){const m=t.match(/<script[^>]*id="pbdata"[^>]*>([\s\S]*?)<\/script>/i);if(!m)throw new Error("ingen data");t=m[1].trim()}const d=JSON.parse(t);if(!d||!Array.isArray(d.courses))throw new Error("fel format");return normalize(d)}

const dayMs=864e5;
const shiftDate=(s,days)=>s?fmtD(addDays(parseD(s),days)):s;
/* Antal dagar mellan två läsårsstarter, avrundat till hela veckor så att veckodagarna behålls */
function weekShift(fromStart,toStart){return Math.round((mondayOf(parseD(toStart))-mondayOf(parseD(fromStart)))/dayMs/7)*7}

/* ----- läsår ----- */
const YEAR_KEYS=["year","courses","units","events","groups","assessments","grades","manual","lessons","schedule","cancel","process","kmat"];
function yearLabel(y){return parseD(y.start).getFullYear()+"/"+String(parseD(y.end).getFullYear()).slice(2)}
function snapshotYear(s){const o={id:uid(),archivedAt:fmtD(TODAY)};YEAR_KEYS.forEach(k=>o[k]=s[k]==null?(k==="process"?[]:k==="kmat"?{}:null):JSON.parse(JSON.stringify(s[k])));o.label=yearLabel(s.year);return o}
/* Bygger ett nytt läsår. opts: {start,end,courses,lessons,assessments,groups,events} */
function rollover(s,opts){
 const shift=weekShift(s.year.start,opts.start);const out={};
 out.year={start:opts.start,end:opts.end};out.grades={};out.manual={};out.process=[];out.kmat={};
 const idm={};const nid=old=>idm[old]||(idm[old]=uid());
 out.groups=opts.groups?s.groups.map(g=>({id:nid(g.id),name:g.name,students:g.students.map(st=>Object.assign({},st,{id:nid(st.id)}))})):[];
 if(opts.courses){
  out.courses=s.courses.map(c=>Object.assign({},c,{id:nid(c.id),groupId:opts.groups&&c.groupId?nid(c.groupId):""}));
  out.units=s.units.map(u=>Object.assign({},u,{id:nid(u.id),courseId:nid(u.courseId),start:shiftDate(u.start,shift),end:shiftDate(u.end,shift),status:"planerad"}));
  out.lessons=opts.lessons?(s.lessons||[]).filter(l=>idm[l.unitId]).map(l=>Object.assign({},l,{id:uid(),unitId:idm[l.unitId],date:shiftDate(l.date,shift),done:false,note:""})):[];
  out.assessments=opts.assessments&&opts.groups?s.assessments.filter(a=>idm[a.courseId]&&idm[a.groupId]).map(a=>Object.assign({},a,{id:uid(),courseId:idm[a.courseId],groupId:idm[a.groupId],unitId:a.unitId?(idm[a.unitId]||""):"",date:shiftDate(a.date,shift)})):[];
 }else{out.courses=[];out.units=[];out.lessons=[];out.assessments=[]}
 out.events=opts.events?s.events.map(e=>Object.assign({},e,{id:uid(),start:shiftDate(e.start,shift),end:shiftDate(e.end,shift),groups:(e.groups||[]).map(g=>idm[g]).filter(Boolean)})):[];
 out.schedule=opts.courses?(s.schedule||[]).filter(x=>idm[x.courseId]).map(x=>Object.assign({},x,{id:uid(),courseId:idm[x.courseId]})):[];out.cancel={};
 return out}
/* Ersätter det aktuella läsåret med ett nytt och lägger det gamla i arkivet */
function applyNewYear(s,newYear){s.archive=(s.archive||[]).concat([snapshotYear(s)]);YEAR_KEYS.forEach(k=>s[k]=newYear[k]);return s}
/* Byter plats på det aktuella läsåret och ett arkiverat */
function switchYear(s,archiveId){const i=(s.archive||[]).findIndex(a=>a.id===archiveId);if(i<0)return s;const target=s.archive[i];const cur=snapshotYear(s);s.archive.splice(i,1,cur);YEAR_KEYS.forEach(k=>s[k]=target[k]!==undefined&&target[k]!==null?target[k]:(k==="process"?[]:k==="kmat"?{}:target[k]));return s}

/* ----- dela kurs i arbetslaget (utan elever och omdömen) ----- */
function exportCourse(s,courseId){const c=s.courses.find(x=>x.id===courseId);if(!c)return null;
 const units=s.units.filter(u=>u.courseId===c.id);const uids=new Set(units.map(u=>u.id));
 const pkg={type:"lararbordet-kurs",v:1,exported:fmtD(TODAY),yearStart:s.year.start,course:{name:c.name,subjectId:c.subjectId,color:c.color},
  units:units.map(u=>({id:u.id,title:u.title,start:u.start,end:u.end,desc:u.desc||"",contentIds:u.contentIds||[]})),
  lessons:(s.lessons||[]).filter(l=>uids.has(l.unitId)).map(l=>({unitId:l.unitId,date:l.date,title:l.title,plan:l.plan||""})),
  assessments:s.assessments.filter(a=>a.courseId===c.id).map(a=>({title:a.title,date:a.date,unitId:a.unitId||"",desc:a.desc||"",aspects:a.aspects||[]})),
  extra:(s.extra||{})[c.subjectId]||[],custom:(s.custom||{})[c.subjectId]||null};
 return pkg}
/* Lägger in en delad kurs i läsåret. Datumen flyttas till samma veckor i det aktuella läsåret. */
function importCourse(s,pkg,groupId){
 if(!pkg||pkg.type!=="lararbordet-kurs")throw new Error("Filen är ingen delad kurs från Lärarbordet.");
 const shift=weekShift(pkg.yearStart||s.year.start,s.year.start);const cid=uid();const um={};
 if(pkg.custom&&!s.custom[pkg.course.subjectId])s.custom[pkg.course.subjectId]=pkg.custom;
 if(PLAN[pkg.course.subjectId]&&!s.mine.includes(pkg.course.subjectId))s.mine.push(pkg.course.subjectId);
 if(pkg.extra&&pkg.extra.length){const have=new Set(((s.extra[pkg.course.subjectId])||[]).map(e=>e.id));s.extra[pkg.course.subjectId]=((s.extra[pkg.course.subjectId])||[]).concat(pkg.extra.filter(e=>!have.has(e.id)))}
 const c={id:cid,name:pkg.course.name,subjectId:pkg.course.subjectId,groupId:groupId||"",color:pkg.course.color||COLORS[s.courses.length%COLORS.length]};s.courses.push(c);
 pkg.units.forEach(u=>{um[u.id]=uid();s.units.push({id:um[u.id],courseId:cid,title:u.title,start:shiftDate(u.start,shift),end:shiftDate(u.end,shift),status:"planerad",desc:u.desc||"",contentIds:u.contentIds||[]})});
 s.lessons=s.lessons||[];(pkg.lessons||[]).forEach(l=>{if(um[l.unitId])s.lessons.push({id:uid(),unitId:um[l.unitId],date:shiftDate(l.date,shift),title:l.title,plan:l.plan||"",note:"",done:false})});
 if(groupId)(pkg.assessments||[]).forEach(a=>s.assessments.push({id:uid(),courseId:cid,groupId,unitId:a.unitId?(um[a.unitId]||""):"",title:a.title,date:shiftDate(a.date,shift),desc:a.desc||"",aspects:a.aspects||[]}));
 return c}

/* ----- lektioner ----- */
const lessonsOf=unitId=>(state.lessons||[]).filter(l=>l.unitId===unitId).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
function isLovDay(s,d){return s.events.some(e=>e.type==="lov"&&parseD(e.start)<=d&&parseD(e.end)>=d)}
/* Datum för en lektionsserie: valda veckodagar (1=måndag … 5=fredag) mellan start och slut, utan lov */
function seriesDates(s,start,end,weekdays){const out=[];let d=parseD(start);const e=parseD(end);while(d<=e){const wd=d.getDay();if(weekdays.includes(wd)&&!isLovDay(s,d))out.push(fmtD(d));d=addDays(d,1)}return out}
function lessonsInWeek(s,monday){const a=fmtD(monday),b=fmtD(addDays(monday,6));return (s.lessons||[]).filter(l=>l.date>=a&&l.date<=b).sort((x,y)=>x.date<y.date?-1:1)}

/* ----- betygskriterier ----- */
/* Nyckel till kriterierna för en plan: grundskolan per årskurs (6 eller 9), gymnasiets ämnen med nivåer per ämne, äldre gymnasiekurser per kurs */
function critFor(planId){const r=PLAN[planId];if(!r)return null;let all;try{all=CRIT()}catch(e){return null}
 const code=r.s.id;let set=null;
 if(r.f.id==="GYOLD")set=(all[planId]||{})["*"];
 else if(r.f.id==="GY")set=(all[code]||{})["*"];
 else{const y=(planId.split("/")[1]||"").split("-").pop();set=(all[code]||{})[y]||null}
 if(!set)return null;
 const order=["E","C","A","G","F"].filter(k=>set[k]&&set[k].length);if(!order.length)return null;
 const n=Math.max(...order.map(k=>set[k].length));const aspects=[];for(let i=0;i<n;i++){const o={};order.forEach(k=>o[k]=set[k][i]||"");aspects.push(o)}
 const names={E:"E",C:"C",A:"A",G:"Grundläggande",F:"Fördjupade"};
 return {levels:order,names,aspects,year:r.f.id.startsWith("GR")?(planId.split("/")[1]||"").split("-").pop():null}}
/* Kriteriematris (Vklass-stil): markeringar per nivå, "y" delvis (gult), "g" uppnått (grönt), "r" inte uppnått (rött).
   Ger ett betygssteg för aspekten: A grönt = A, C grönt + A gult = B, C grönt = C, E grönt + C gult = D, E grönt = E, annars F. */
function markToGrade(m,scaleKey){m=m||{};const has=Object.values(m).some(Boolean);if(!has)return null;
 const g=k=>m[k]==="g",y=k=>m[k]==="y";let step;
 if(g("A"))step=5;else if(g("C")&&y("A"))step=4;else if(g("C"))step=3;else if(g("E")&&y("C"))step=2;else if(g("E"))step=1;else step=0;
 if(scaleKey==="lokal")return String([y("E")?2:1,3,4,4,5,5][step]);
 return ["F","E","D","C","B","A"][step]}
/* Ett kriterium kan delas i sina meningar (delar), t.ex. lyssna, läsa, välja källor. Delas bara om alla nivåer har lika många meningar. */
const splitSent=t=>String(t||"").trim().split(/(?<=[.!?])\s+(?=[A-ZÅÄÖ*])/).filter(Boolean);
function critParts(A,levels){const lv=levels.filter(k=>A[k]);if(!lv.length)return [A];const sp=lv.map(k=>splitSent(A[k]));const n=sp[0].length;
 if(n<2||sp.some(x=>x.length!==n))return [A];return Array.from({length:n},(_,j)=>{const o={};lv.forEach((k,i)=>o[k]=sp[i][j]);return o})}
/* Aspektens steg ur delarnas markeringar: medianen av delarnas steg */
function partsToGrade(asm,i,nParts,scaleKey){const gs=[];for(let j=0;j<nParts;j++){const g=markToGrade((asm||{})[nParts>1?i+"."+j:String(i)],scaleKey);if(g)gs.push(g)}
 if(!gs.length)return null;const order=scaleKey==="lokal"?["1","2","3","4","5"]:["F","E","D","C","B","A"];const v=gs.map(g=>order.indexOf(g)).sort((a,b)=>a-b);return order[v[Math.floor((v.length-1)/2)]]}
/* Kunskapsmatris: senaste markering per del och nivå från elevens uppgifter i kursen */
function derivedMarks(s,courseId,studentId,cr){const out={};if(!cr)return out;
 s.assessments.filter(a=>a.courseId===courseId&&(a.aspects||[]).length).sort((a,b)=>a.date<b.date?-1:1).forEach(a=>{const g=((s.grades[a.id]||{})[studentId]||{}).asm||{};
  Object.entries(g).forEach(([key,lvls])=>{const i=+String(key).split(".")[0];const A=cr.aspects[i];if(!A)return;const n=critParts(A,cr.levels).length;
   const keys=String(key).includes(".")||n<2?[n<2?String(i):key]:Array.from({length:n},(_,j)=>i+"."+j);
   keys.forEach(k=>Object.entries(lvls||{}).forEach(([lv,m])=>{if(m){(out[k]=out[k]||{})[lv]={m,from:a.title,date:a.date}}}))})});
 return out}
/* Ett kort namn på en aspekt: början av E-texten */
function aspectLabel(asp){const t=String(asp.E||asp.G||Object.values(asp)[0]||"").replace(/\*/g,"");return t.length>110?t.slice(0,107).replace(/\s+\S*$/,"")+"…":t}
/* Samlat omdöme ur aspektomdömen: medianen på skalan */
function aggregateAspects(asp){const v=Object.values(asp||{}).map(lvIdx).filter(i=>i>=0);if(!v.length)return null;return scale().levels[median(v)].k}
/* Underlag per aspekt för en elev i en kurs: median och antal bedömningar */
function aspectEvidence(s,courseId,studentId){const out={};s.assessments.filter(a=>a.courseId===courseId&&(a.aspects||[]).length).forEach(a=>{const g=((s.grades[a.id]||{})[studentId]||{}).asp||{};Object.entries(g).forEach(([i,k])=>{if(lvIdx(k)<0)return;(out[i]=out[i]||[]).push(lvIdx(k))})});
 const res={};Object.entries(out).forEach(([i,v])=>res[i]={k:scale().levels[median(v)].k,n:v.length});return res}

/* ----- schema och kalendarium -----
   state.schedule: [{id,courseId,day(1-5),start:"08:20",end:"09:20",room,weeks:"alla"|"jamna"|"udda"}]
   state.events: typ lov | studiedag | aktivitet (groups:[] = alla, from/to = tid, tomt = hela dagen) | annat | deadline
   state.cancel: {"slotId|datum": "orsak"} – enstaka lektioner som ställts in för hand */
const EVENT_TYPES={lov:"Lov",studiedag:"Studiedag",aktivitet:"Aktivitet",annat:"Händelse",deadline:"Deadline"};
const CANCELS={lov:true,studiedag:true,aktivitet:true};
const WEEKS_LABEL={alla:"Varje vecka",jamna:"Jämna veckor",udda:"Udda veckor"};
function slotRunsInWeek(slot,d){if(!slot.weeks||slot.weeks==="alla")return true;const w=isoWeek(d);return slot.weeks==="jamna"?w%2===0:w%2===1}
function slotDates(s,slot,from,to){const a=from>s.year.start?from:s.year.start,b=to<s.year.end?to:s.year.end;const out=[];
 for(let d=parseD(a);fmtD(d)<=b;d=addDays(d,1))if(d.getDay()===+slot.day&&slotRunsInWeek(slot,d))out.push(fmtD(d));return out}
/* Varför en lektion blir inställd, eller null om den blir av */
function cancellation(s,slot,date){const c=(s.courses||[]).find(x=>x.id===slot.courseId)||{};
 const man=(s.cancel||{})[slot.id+"|"+date];if(man!=null)return {reason:man||"Inställd",type:"manuell"};
 for(const e of s.events){if(!CANCELS[e.type]||date<e.start||date>e.end)continue;
  if(e.type==="aktivitet"&&e.groups&&e.groups.length&&!e.groups.includes(c.groupId))continue;
  if(e.from&&e.to&&!(slot.start<e.to&&slot.end>e.from))continue;
  return {reason:e.title,type:e.type}}
 return null}
/* Alla schemalagda lektioner för en kurs mellan två datum, med eventuell orsak till att de ställs in */
function courseSlots(s,courseId,from,to){const out=[];(s.schedule||[]).filter(x=>x.courseId===courseId).forEach(sl=>slotDates(s,sl,from,to).forEach(d=>out.push({date:d,slot:sl,cancel:cancellation(s,sl,d)})));
 return out.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.slot.start<b.slot.start?-1:1)}
const hasSchedule=(s,courseId)=>(s.schedule||[]).some(x=>x.courseId===courseId);
function courseStats(s,courseId,from,to){const l=courseSlots(s,courseId,from||s.year.start,to||s.year.end);const c=l.filter(x=>x.cancel);return {total:l.length,cancelled:c.length,held:l.length-c.length,list:c}}
function unitCapacity(s,u){if(!hasSchedule(s,u.courseId))return null;const l=courseSlots(s,u.courseId,u.start,u.end);const c=l.filter(x=>x.cancel).length;
 return {total:l.length,cancelled:c,available:l.length-c,planned:(s.lessons||[]).filter(x=>x.unitId===u.id).length}}
/* Är en planerad lektion inställd? Bara om kursen har schema den dagen och alla pass den dagen är inställda. */
function lessonCancel(s,l){const u=s.units.find(x=>x.id===l.unitId);if(!u)return null;const day=courseSlots(s,u.courseId,l.date,l.date);
 if(!day.length)return null;const pick=l.time?day.filter(x=>x.slot.start===l.time):day;const list=pick.length?pick:day;return list.every(x=>x.cancel)?list[0].cancel:null}
/* Datum för lektioner som följer schemat, utan inställda pass */
function scheduleDates(s,courseId,from,to){return courseSlots(s,courseId,from,to).filter(x=>!x.cancel).map(x=>({date:x.date,time:x.slot.start}))}
/* Flytta fram ej genomförda lektioner i ett arbetsområde till nästa pass som blir av. Ordningen behålls. */
function reflowLessons(s,unitId){const u=s.units.find(x=>x.id===unitId);if(!u||!hasSchedule(s,u.courseId))return 0;
 const pend=(s.lessons||[]).filter(l=>l.unitId===unitId&&!l.done).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);if(!pend.length)return 0;
 const taken=new Set((s.lessons||[]).filter(l=>l.done||l.unitId!==unitId).filter(l=>{const v=s.units.find(x=>x.id===l.unitId);return v&&v.courseId===u.courseId}).map(l=>l.date+"|"+(l.time||"")));
 const free=scheduleDates(s,u.courseId,pend[0].date,s.year.end).filter(x=>!taken.has(x.date+"|"+x.time));let moved=0;
 pend.forEach((l,i)=>{const f=free[i];if(!f)return;if(l.date!==f.date||l.time!==f.time){l.date=f.date;l.time=f.time;moved++}});return moved}

/* ----- kalendarium från Excel: klistra in rader (eller CSV) med datum, slutdatum, namn, typ ----- */
function parseDateLoose(t,yearHint){t=String(t||"").trim();if(!t)return null;let m;
 if(m=t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))return fmtD(new Date(+m[1],+m[2]-1,+m[3]));
 if(m=t.match(/^(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?$/)){let y=m[3]?+m[3]:yearHint;if(y<100)y+=2000;if(!y)return null;return fmtD(new Date(y,+m[2]-1,+m[1]))}
 if(m=t.match(/^(\d{5})$/)){const d=new Date(Date.UTC(1899,11,30)+(+m[1])*864e5);return fmtD(new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()))}
 return null}
function guessType(name,typ){const t=(String(typ||"")+" "+String(name||"")).toLowerCase();
 if(/studiedag|kompetensutveckl|planeringsdag|\bapt\b/.test(t))return "studiedag";
 if(/\blov\b|lov$|lovet|sommarlov|jullov|sportlov|påsklov|höstlov|ledig|klämdag|röd dag/.test(t))return "lov";
 if(/deadline|sista dag|inlämning/.test(t))return "deadline";
 if(/aktivitet|friluftsdag|prao|temadag|utflykt|idrottsdag/.test(t))return "aktivitet";
 return "annat"}
function parseCalendarRows(text,yearHint){const out=[];const lines=String(text||"").split(/\r?\n/).filter(l=>l.trim());
 for(const line of lines){const sep=line.includes("\t")?"\t":line.includes(";")?";":",";const c=line.split(sep).map(x=>x.trim().replace(/^"|"$/g,""));
  const dates=[];const rest=[];c.forEach(x=>{const d=parseDateLoose(x,yearHint);if(d&&dates.length<2)dates.push(d);else if(x)rest.push(x)});
  if(!dates.length)continue;const title=rest[0]||"Händelse";const typ=rest[1]||"";let [a,b]=dates;if(!b)b=a;if(b<a)[a,b]=[b,a];
  const type=Object.keys(EVENT_TYPES).find(k=>EVENT_TYPES[k].toLowerCase()===typ.toLowerCase())||guessType(title,typ);
  out.push({title,start:a,end:b,type})}
 return out}
/* lägger till nya och uppdaterar befintliga (samma namn och startdatum) */
function mergeEvents(s,rows){let added=0,updated=0;rows.forEach(r=>{const e=s.events.find(x=>x.title.toLowerCase()===r.title.toLowerCase()&&x.start===r.start);
  if(e){if(e.end!==r.end||e.type!==r.type){e.end=r.end;e.type=r.type;updated++}}else{s.events.push({id:uid(),title:r.title,start:r.start,end:r.end,type:r.type,groups:[],from:"",to:""});added++}});return {added,updated}}

/* process: antal ord, k klar, gf giltig frånvaro, of ogiltig frånvaro, annars fri text */
function procVal(t){t=String(t||"").trim();const l=t.toLowerCase();if(!t)return "";if(/^(k|klar|d|done|✓)$/.test(l))return "k";if(/^(gf|giltig)/.test(l))return "gf";if(/^(of|ogiltig)/.test(l))return "of";const n=t.replace(/\s/g,"");return /^\d+$/.test(n)?n:t}

/* ----- iCal (.ics): Google Kalender, Outlook, Skola24 och andra schemaprogram ----- */
function parseICS(text){const lines=String(text||"").replace(/\r\n[ \t]/g,"").replace(/\n[ \t]/g,"").split(/\r?\n/);const out=[];let cur=null;
 const unesc=v=>v.replace(/\\n/gi,"\n").replace(/\\([,;\\])/g,"$1");
 const dt=(prop,val)=>{const m=val.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/);if(!m)return null;
  if(!m[4])return {date:`${m[1]}-${m[2]}-${m[3]}`,time:""};
  if(m[7]){const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5]));return {date:fmtD(d),time:String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}}
  return {date:`${m[1]}-${m[2]}-${m[3]}`,time:`${m[4]}:${m[5]}`}};
 for(const ln of lines){if(ln==="BEGIN:VEVENT"){cur={summary:"",location:"",desc:"",rrule:""};continue}if(ln==="END:VEVENT"){if(cur&&cur.start)out.push(cur);cur=null;continue}if(!cur)continue;
  const i=ln.indexOf(":");if(i<0)continue;const prop=ln.slice(0,i).split(";")[0].toUpperCase();const val=ln.slice(i+1);
  if(prop==="SUMMARY")cur.summary=unesc(val).trim();else if(prop==="LOCATION")cur.location=unesc(val).trim();else if(prop==="DESCRIPTION")cur.desc=unesc(val).trim();else if(prop==="RRULE")cur.rrule=val;
  else if(prop==="DTSTART")cur.start=dt(prop,val);else if(prop==="DTEND")cur.end=dt(prop,val)}
 return out.map(e=>{let end=e.end||e.start;if(!e.start.time&&e.end&&e.end.date>e.start.date)end={date:fmtD(addDays(parseD(e.end.date),-1)),time:""};return {summary:e.summary||"Händelse",location:e.location,desc:e.desc,rrule:e.rrule,date:e.start.date,start:e.start.time,endDate:end.date,end:end.time||""}})}
/* Lektioner som återkommer varje vecka blir rader i veckoschemat, resten blir händelser */
function splitICS(evs){const map={};const rest=[];
 evs.forEach(e=>{if(e.start&&e.end&&e.date===e.endDate){const day=parseD(e.date).getDay();if(day>=1&&day<=5){const k=[day,e.start,e.end,e.summary].join("|");(map[k]=map[k]||[]).push(e);return}}rest.push(e)});
 const slots=[];Object.entries(map).forEach(([k,list])=>{const weekly=list.some(e=>/FREQ=WEEKLY/i.test(e.rrule));if(weekly||list.length>=2){const [day,start,end,summary]=k.split("|");slots.push({summary,day:+day,start,end,room:list[0].location||"",n:list.length,weekly})}else rest.push(...list)});
 slots.sort((a,b)=>a.day-b.day||(a.start<b.start?-1:1));
 return {slots,events:rest.map(e=>({title:e.summary,start:e.date,end:e.endDate||e.date,type:guessType(e.summary,""),from:e.start||"",to:e.end||""}))}}
/* Export till kalender: alla lektioner som blir av, med plan, och kalendariets händelser */
function buildICS(s){const esc2=t=>String(t||"").replace(/\\/g,"\\\\").replace(/;/g,"\;").replace(/,/g,"\\,").replace(/\r?\n/g,"\\n");
 const d8=d=>d.replace(/-/g,"");const t6=t=>t.replace(":","")+"00";const now=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");
 const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//DorkTeach//Lärarbordet//SV","CALSCALE:GREGORIAN","X-WR-CALNAME:Lärarbordet"];
 const ev=(uidv,lines)=>{L.push("BEGIN:VEVENT","UID:"+uidv+"@lararbordet","DTSTAMP:"+now,...lines,"END:VEVENT")};
 (s.schedule||[]).forEach(sl=>{const c=(s.courses||[]).find(x=>x.id===sl.courseId);if(!c)return;slotDates(s,sl,s.year.start,s.year.end).forEach(d=>{if(cancellation(s,sl,d))return;
   const uids=new Set(s.units.filter(u=>u.courseId===c.id).map(u=>u.id));const l=(s.lessons||[]).find(x=>x.date===d&&(uids.has(x.unitId)||x.courseId===c.id)&&(!x.time||x.time===sl.start));
   ev(sl.id+"-"+d8(d),["DTSTART;TZID=Europe/Stockholm:"+d8(d)+"T"+t6(sl.start),"DTEND;TZID=Europe/Stockholm:"+d8(d)+"T"+t6(sl.end),"SUMMARY:"+esc2(c.name+(l&&l.title?" · "+l.title:"")),...(sl.room?["LOCATION:"+esc2(sl.room)]:[]),...((l&&l.plan)||sl.note?["DESCRIPTION:"+esc2([l&&l.plan,sl.note].filter(Boolean).join("\n\n"))]:[])])})});
 (s.events||[]).forEach(e=>{const timed=e.from&&e.to;ev("ev-"+e.id,timed?["DTSTART;TZID=Europe/Stockholm:"+d8(e.start)+"T"+t6(e.from),"DTEND;TZID=Europe/Stockholm:"+d8(e.start)+"T"+t6(e.to),"SUMMARY:"+esc2(e.title)]:["DTSTART;VALUE=DATE:"+d8(e.start),"DTEND;VALUE=DATE:"+d8(fmtD(addDays(parseD(e.end),1))),"SUMMARY:"+esc2(e.title)])});
 L.push("END:VCALENDAR");return L.join("\r\n")}
/* process: delarnas typ ("check", "text" eller "both") och förväntat antal ord efter lektion k av n */
const procParts=p=>(p.parts||[]).map(x=>typeof x==="string"?{name:x,kind:"check"}:x);
function procExpected(p,k){const n=(p.cols||[]).length;const min=+p.minWords||0;if(!min||!n)return null;return p.count==="lesson"?Math.ceil(min/n):Math.ceil(min*(k+1)/n)}
function procClass2(v,exp,avg){if(v==="k")return "pk";if(v==="of")return "pof";if(v==="gf")return "pgf";if(!/^\d+$/.test(v||""))return "";
 if(exp!=null)return +v<exp?"pbehind":"pok";return avg!=null&&+v<avg?"plow":""}
