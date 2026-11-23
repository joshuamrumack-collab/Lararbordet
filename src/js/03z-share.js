/* ---------- dela ett arbetsområde med en kollega (utan elever och omdömen) ---------- */
/* Lektioner och uppgifter sparas som dagar från arbetsområdets första måndag, så att veckodagarna följer med. */
const dayDiff=(a,b)=>Math.round((parseD(b)-parseD(a))/dayMs);
function exportUnit(s,unitId){const u=s.units.find(x=>x.id===unitId);if(!u)return null;const c=s.courses.find(x=>x.id===u.courseId)||{};
 const base=fmtD(mondayOf(parseD(u.start)));const sid=c.subjectId||"";const cids=new Set(u.contentIds||[]);
 const as=s.assessments.filter(a=>a.unitId===u.id);
 return {type:"lararbordet-arbetsomrade",v:1,exported:fmtD(TODAY),subjectId:sid,courseName:c.name||"",color:c.color||"",
  unit:{title:u.title,days:dayDiff(base,u.end),startDay:dayDiff(base,u.start),desc:u.desc||"",contentIds:u.contentIds||[],lppGoal:u.lppGoal||"",lppWork:u.lppWork||"",easy:u.easy||{},easyGoal:u.easyGoal||"",easyWork:u.easyWork||"",easyCrit:u.easyCrit||{}},
  lessons:(s.lessons||[]).filter(l=>l.unitId===u.id).sort((a,b)=>a.date<b.date?-1:1).map(l=>({day:dayDiff(base,l.date),title:l.title||"",plan:l.plan||"",time:l.time||""})),
  assessments:as.map(a=>({day:dayDiff(base,a.date),title:a.title,desc:a.desc||"",type:a.type||"",typeOther:a.typeOther||"",mode:a.mode||"betyg",max:a.max==null?null:a.max,aspects:a.aspects||[],contentIds:a.contentIds||[]})),
  extra:((s.extra||{})[sid]||[]).filter(e=>cids.has(e.id)),custom:(s.custom||{})[sid]||null}}
/* Lägger in ett delat arbetsområde i en kurs. Startar den måndag som startDate ligger i. */
function importUnit(s,pkg,courseId,startDate,groupId){
 if(!pkg||pkg.type!=="lararbordet-arbetsomrade")throw new Error("Filen är inget delat arbetsområde från Lärarbordet.");
 const c=s.courses.find(x=>x.id===courseId);if(!c)throw new Error("Välj en kurs.");
 const same=c.subjectId===pkg.subjectId;const base=mondayOf(parseD(startDate||fmtD(TODAY)));const at=d=>fmtD(addDays(base,d||0));
 if(same&&pkg.custom&&!s.custom[c.subjectId])s.custom[c.subjectId]=pkg.custom;
 if(same&&pkg.extra&&pkg.extra.length){const have=new Set(((s.extra[c.subjectId])||[]).map(e=>e.id));s.extra[c.subjectId]=((s.extra[c.subjectId])||[]).concat(pkg.extra.filter(e=>!have.has(e.id)))}
 const known=new Set(allItems(c.subjectId).map(i=>i.id));const keep=ids=>same?(ids||[]).filter(id=>known.has(id)):[];
 const p=pkg.unit;const u={id:uid(),courseId:c.id,title:p.title,start:at(p.startDay),end:at(p.days),status:"planerad",desc:p.desc||"",contentIds:keep(p.contentIds)};
 ["lppGoal","lppWork","easyGoal","easyWork"].forEach(k=>{if(p[k])u[k]=p[k]});
 if(same&&p.easy&&Object.keys(p.easy).length)u.easy=Object.assign({},p.easy);if(same&&p.easyCrit&&Object.keys(p.easyCrit).length)u.easyCrit=Object.assign({},p.easyCrit);
 s.units.push(u);s.lessons=s.lessons||[];
 (pkg.lessons||[]).forEach(l=>s.lessons.push({id:uid(),unitId:u.id,date:at(l.day),title:l.title||"Lektion",plan:l.plan||"",note:"",done:false,...(l.time?{time:l.time}:{})}));
 const gid=groupId||c.groupId||"";let na=0;
 if(gid)(pkg.assessments||[]).forEach(a=>{s.assessments.push({id:uid(),courseId:c.id,groupId:gid,unitId:u.id,title:a.title,date:at(a.day),desc:a.desc||"",type:a.type||"",typeOther:a.typeOther||"",mode:a.mode||"betyg",max:a.max==null?null:a.max,aspects:same&&a.mode!=="gk"?a.aspects||[]:[],contentIds:keep(a.contentIds)});na++});
 return {unit:u,assessments:na,sameSubject:same,lessons:(pkg.lessons||[]).length}}

/* ---------- ämnesanalys för arbetslaget ---------- */
const lowMark=k=>k==="EG"||isLow(k);
/* Per kurs: elever som ligger under E (mediantal eller senaste omdöme) och centralt innehåll som inte bedömts. */
function analyzeGroup(s,groupId){const g=s.groups.find(x=>x.id===groupId);if(!g)return null;const lv=scale().levels;
 const cs=s.courses.filter(c=>c.groupId===g.id||s.assessments.some(a=>a.groupId===g.id&&a.courseId===c.id));
 const courses=cs.map(c=>{const as=s.assessments.filter(a=>a.groupId===g.id&&a.courseId===c.id).sort((a,b)=>a.date<b.date?-1:1);
  const students=g.students.map(st=>{const got=as.map(a=>({a,v:(s.grades[a.id]||{})[st.id]})).filter(x=>x.v&&x.v.k);
   const idx=got.map(x=>lvIdx(x.v.k)).filter(i=>i>=0);const m=median(idx);const med=m==null?null:lv[m].k;
   const last=got.length?got[got.length-1]:null;const lows=got.filter(x=>lowMark(x.v.k));
   const below=(med!=null&&isLow(med))||!!(last&&lowMark(last.v.k));
   return {id:st.id,name:st.name,median:med,last:last?last.v.k:null,lastTitle:last?last.a.title:"",low:lows.length,lowTitles:lows.map(x=>x.a.title),missing:as.length-got.length,count:got.length,below}});
  let content=null;
  if(subj(c.subjectId)){const cov=coverage(c.subjectId,c.id);const s2=subj(c.subjectId);
   const areas=s2.areas.map(a=>({name:a.name,items:a.items.filter(i=>cov[i.id]&&!cov[i.id].assessed).map(i=>({id:i.id,text:i.text,state:cov[i.id].state}))})).filter(a=>a.items.length);
   const total=Object.keys(cov).length;const notAssessed=areas.reduce((n,a)=>n+a.items.length,0);
   content={total,assessed:total-notAssessed,notAssessed,areas}}
  return {courseId:c.id,name:c.name,subject:subjTitle(c.subjectId),assessments:as.length,students,below:students.filter(x=>x.below).length,missing:students.reduce((n,x)=>n+x.missing,0),content}});
 return {group:g.name,exported:fmtD(TODAY),courses}}
/* Fil att dela i arbetslaget. Med elevnamn bara om läraren väljer det. */
function exportAnalysis(an,withNames){const ini=n=>String(n||"").split(/\s+/).filter(Boolean).map(w=>w[0].toUpperCase()+".").join(" ");
 return {type:"lararbordet-analys",v:1,exported:an.exported,group:an.group,names:!!withNames,
  courses:an.courses.map(c=>({name:c.name,subject:c.subject,assessments:c.assessments,below:c.below,missing:c.missing,
   students:c.students.filter(x=>x.below||x.missing).map(x=>({name:withNames?x.name:ini(x.name),median:x.median,last:x.last,low:x.low,missing:x.missing,below:x.below})),
   content:c.content?{total:c.content.total,assessed:c.content.assessed,notAssessed:c.content.notAssessed,areas:c.content.areas.map(a=>({name:a.name,items:a.items.map(i=>({text:i.text,state:i.state}))}))}:null}))}}
/* Slår ihop egen analys med kollegors filer: elever matchas på namn */
function mergeAnalyses(own,others){const courses=own.courses.map(c=>Object.assign({},c,{from:""}));
 (others||[]).forEach(o=>{if(!o||o.type!=="lararbordet-analys")return;(o.courses||[]).forEach(c=>courses.push(Object.assign({},c,{from:o.from||"kollega",students:(c.students||[]).map(x=>Object.assign({},x))})))});
 const map=new Map();courses.forEach((c,ci)=>(c.students||[]).forEach(x=>{if(!x.below)return;const k=String(x.name).trim().toLowerCase();if(!map.has(k))map.set(k,{name:x.name,courses:[]});map.get(k).courses.push(ci)}));
 const risk=[...map.values()].sort((a,b)=>b.courses.length-a.courses.length||a.name.localeCompare(b.name,"sv"));
 return {group:own.group,courses,risk}}
