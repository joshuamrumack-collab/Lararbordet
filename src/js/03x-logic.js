/* ---------- logik för läsår, delning, lektioner och betygskriterier ----------
   Rena funktioner utan DOM, så att de kan testas med node --test. */

/* Läs data ur en exporterad .json eller ur en sparad lararbordet.html */
function parsePlanbok(text){let t=String(text||"").trim();if(t.startsWith("<")){const m=t.match(/<script[^>]*id="pbdata"[^>]*>([\s\S]*?)<\/script>/i);if(!m)throw new Error("ingen data");t=m[1].trim()}const d=JSON.parse(t);if(!d||!Array.isArray(d.courses))throw new Error("fel format");return normalize(d)}

const dayMs=864e5;
const shiftDate=(s,days)=>s?fmtD(addDays(parseD(s),days)):s;
/* Antal dagar mellan två läsårsstarter, avrundat till hela veckor så att veckodagarna behålls */
function weekShift(fromStart,toStart){return Math.round((mondayOf(parseD(toStart))-mondayOf(parseD(fromStart)))/dayMs/7)*7}

/* ----- läsår ----- */
const YEAR_KEYS=["year","courses","units","events","groups","assessments","grades","manual","lessons"];
function yearLabel(y){return parseD(y.start).getFullYear()+"/"+String(parseD(y.end).getFullYear()).slice(2)}
function snapshotYear(s){const o={id:uid(),archivedAt:fmtD(TODAY)};YEAR_KEYS.forEach(k=>o[k]=JSON.parse(JSON.stringify(s[k])));o.label=yearLabel(s.year);return o}
/* Bygger ett nytt läsår. opts: {start,end,courses,lessons,assessments,groups,events} */
function rollover(s,opts){
 const shift=weekShift(s.year.start,opts.start);const out={};
 out.year={start:opts.start,end:opts.end};out.grades={};out.manual={};
 const idm={};const nid=old=>idm[old]||(idm[old]=uid());
 out.groups=opts.groups?s.groups.map(g=>({id:nid(g.id),name:g.name,students:g.students.map(st=>({id:nid(st.id),name:st.name}))})):[];
 if(opts.courses){
  out.courses=s.courses.map(c=>Object.assign({},c,{id:nid(c.id),groupId:opts.groups&&c.groupId?nid(c.groupId):""}));
  out.units=s.units.map(u=>Object.assign({},u,{id:nid(u.id),courseId:nid(u.courseId),start:shiftDate(u.start,shift),end:shiftDate(u.end,shift),status:"planerad"}));
  out.lessons=opts.lessons?(s.lessons||[]).filter(l=>idm[l.unitId]).map(l=>Object.assign({},l,{id:uid(),unitId:idm[l.unitId],date:shiftDate(l.date,shift),done:false,note:""})):[];
  out.assessments=opts.assessments&&opts.groups?s.assessments.filter(a=>idm[a.courseId]&&idm[a.groupId]).map(a=>Object.assign({},a,{id:uid(),courseId:idm[a.courseId],groupId:idm[a.groupId],unitId:a.unitId?(idm[a.unitId]||""):"",date:shiftDate(a.date,shift)})):[];
 }else{out.courses=[];out.units=[];out.lessons=[];out.assessments=[]}
 out.events=opts.events?s.events.map(e=>Object.assign({},e,{id:uid(),start:shiftDate(e.start,shift),end:shiftDate(e.end,shift)})):[];
 return out}
/* Ersätter det aktuella läsåret med ett nytt och lägger det gamla i arkivet */
function applyNewYear(s,newYear){s.archive=(s.archive||[]).concat([snapshotYear(s)]);YEAR_KEYS.forEach(k=>s[k]=newYear[k]);return s}
/* Byter plats på det aktuella läsåret och ett arkiverat */
function switchYear(s,archiveId){const i=(s.archive||[]).findIndex(a=>a.id===archiveId);if(i<0)return s;const target=s.archive[i];const cur=snapshotYear(s);s.archive.splice(i,1,cur);YEAR_KEYS.forEach(k=>s[k]=target[k]);return s}

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
/* Ett kort namn på en aspekt: början av E-texten */
function aspectLabel(asp){const t=String(asp.E||asp.G||Object.values(asp)[0]||"").replace(/\*/g,"");return t.length>110?t.slice(0,107).replace(/\s+\S*$/,"")+"…":t}
/* Samlat omdöme ur aspektomdömen: medianen på skalan */
function aggregateAspects(asp){const v=Object.values(asp||{}).map(lvIdx).filter(i=>i>=0);if(!v.length)return null;return scale().levels[median(v)].k}
/* Underlag per aspekt för en elev i en kurs: median och antal bedömningar */
function aspectEvidence(s,courseId,studentId){const out={};s.assessments.filter(a=>a.courseId===courseId&&(a.aspects||[]).length).forEach(a=>{const g=((s.grades[a.id]||{})[studentId]||{}).asp||{};Object.entries(g).forEach(([i,k])=>{if(lvIdx(k)<0)return;(out[i]=out[i]||[]).push(lvIdx(k))})});
 const res={};Object.entries(out).forEach(([i,v])=>res[i]={k:scale().levels[median(v)].k,n:v.length});return res}
