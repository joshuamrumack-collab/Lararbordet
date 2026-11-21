// Tester för Lärarbordets logik. Kör: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import vm from "node:vm";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gz = (n) => JSON.parse(gunzipSync(readFileSync(join(root, "data", n + ".json.gz"))).toString("utf8"));
const DATA = { catalog: gz("catalog"), crit: gz("crit") };

/* Laddar de DOM-fria modulerna (hjälpfunktioner, katalog, modell, logik) i en egen kontext */
function load() {
  const ctx = vm.createContext({ PB_DATA: DATA, console, TextDecoder, structuredClone });
  const files = readdirSync(join(root, "src/js")).filter((f) => /^0(1|2|3)/.test(f)).sort();
  vm.runInContext(files.map((f) => readFileSync(join(root, "src/js", f), "utf8")).join("\n"), ctx);
  vm.runInContext("var state=exampleState();", ctx);
  /* värden från kontexten kopieras så att jämförelser fungerar mellan olika "realms" */
  return (code) => { const v = vm.runInContext(code, ctx); return v && typeof v === "object" ? JSON.parse(JSON.stringify(v)) : v; };
}

test("veckonummer och veckoförskjutning", () => {
  const run = load();
  assert.equal(run('isoWeek(parseD("2026-11-19"))'), 47);
  assert.equal(run('isoWeek(parseD("2027-01-01"))'), 53);
  assert.equal(run('weekShift("2026-08-17","2027-08-16")'), 364);
  assert.equal(run('weekShift("2026-08-17","2027-08-18")') % 7, 0);
});

test("katalogen innehåller alla skolformer och ordagrant centralt innehåll", () => {
  const run = load();
  assert.deepEqual(run("FORMS.map(f=>f.id)"), ["GR", "GRAN", "GRANO", "GY", "GYOLD"]);
  assert.equal(run('subj("GRGRSVE01/7-9").areas.length'), 5);
  assert.equal(run('subj("GRGRSVE01/7-9").areas[0].name'), "Läsa och skriva");
  assert.match(run('subj("GRGRMAT01/7-9").areas[1].items[4].text'), /^Programmering/);
  assert.equal(run('subjTitle("GRGRSVE01/7-9")'), "Svenska åk 7–9");
});

test("täckning räknas ut från arbetsområden och manuella bockar", () => {
  const run = load();
  const s = run('covSummary("GRGRSVE01/7-9","all")');
  assert.equal(s.n, 25);
  assert.ok(s.covered > 0 && s.gap > 0);
  run('state.manual["GRGRSVE01/7-9~4.3"]=true');
  assert.equal(run('coverage("GRGRSVE01/7-9","all")["GRGRSVE01/7-9~4.3"].state'), "covered");
});

test("äldre sparfiler (v1) läses in och behåller ämnen som används", () => {
  const run = load();
  const old = { v: 1, courses: [{ id: "c1", name: "Sv", subjectId: "sv", groupId: "", color: "#000" }], units: [], events: [], groups: [], assessments: [], grades: {},
    subjects: { sv: { id: "sv", name: "Svenska", stage: "7–9", builtin: true, areas: [] }, x1: { id: "x1", name: "Eget", stage: "", areas: [] }, ma: { id: "ma", builtin: true, areas: [] } } };
  const d = run(`normalize(${JSON.stringify(old)})`);
  assert.equal(d.v, 2);
  assert.deepEqual(Object.keys(d.custom).sort(), ["sv", "x1"]);
  assert.equal(d.subjects, undefined);
  assert.deepEqual(d.lessons, []);
});

test("data läses ur en sparad html-fil", () => {
  const run = load();
  const html = '<!DOCTYPE html><html><body><script type="application/json" id="pbdata">' + JSON.stringify({ courses: [], mine: ["GRGRSVE01/7-9", "finns-inte"] }) + "</script></body></html>";
  const d = run(`parsePlanbok(${JSON.stringify(html)})`);
  assert.deepEqual(d.mine, ["GRGRSVE01/7-9"]);
  assert.throws(() => run('parsePlanbok("<html></html>")'));
});

test("nytt läsår flyttar datum en hel vecka i taget och arkiverar det gamla", () => {
  const run = load();
  const before = run("({c:state.courses.length,u:state.units.length,l:state.lessons.length,first:state.units[0].start})");
  run('var ny=rollover(state,{start:"2027-08-16",end:"2028-06-09",courses:true,lessons:true,groups:false,assessments:true,events:false})');
  assert.equal(run("ny.courses.length"), before.c);
  assert.equal(run("ny.units.length"), before.u);
  assert.ok(run('ny.units.every(u=>u.status==="planerad")'));
  assert.equal(run("ny.assessments.length"), 0, "bedömningar kräver att grupperna följer med");
  assert.equal(run("ny.groups.length"), 0);
  assert.deepEqual(run("ny.grades"), {});
  assert.equal(run('parseD(ny.units[0].start).getDay()'), run(`parseD("${before.first}").getDay()`));
  assert.ok(run("ny.lessons.every(l=>!l.done&&!l.note)"));
  run("applyNewYear(state,ny)");
  assert.equal(run("state.archive.length"), 1);
  assert.equal(run("state.archive[0].label"), "2026/27");
  assert.equal(run("yearLabel(state.year)"), "2027/28");
  run("switchYear(state,state.archive[0].id)");
  assert.equal(run("yearLabel(state.year)"), "2026/27");
  assert.equal(run("state.archive[0].label"), "2027/28");
  assert.ok(run("state.groups.length") > 0, "det gamla läsårets elever finns kvar");
});

test("delad kurs innehåller inga elever och kan importeras", () => {
  const run = load();
  const pkg = run('exportCourse(state,"c-sv")');
  const json = JSON.stringify(pkg);
  for (const name of run("state.groups[0].students.map(s=>s.name)")) assert.ok(!json.includes(name), "elevnamn får inte följa med");
  assert.ok(!json.includes('"grades"'));
  run("var s2=emptyState();");
  const c = run(`importCourse(s2,${json},"")`);
  assert.equal(run("s2.units.length"), pkg.units.length);
  assert.equal(run("s2.assessments.length"), 0);
  assert.ok(run("s2.mine.includes('GRGRSVE01/7-9')"));
  assert.equal(c.name, "Svenska 8B");
  assert.throws(() => run('importCourse(emptyState(),{type:"annat"})'));
});

test("lektionsserier hoppar över lov", () => {
  const run = load();
  const d = run('seriesDates(state,"2026-10-19","2026-11-06",[1,4])');
  assert.deepEqual(d, ["2026-10-19", "2026-10-22", "2026-11-02", "2026-11-05"]);
});

test("betygskriterier delas upp i aspekter per stadium och skolform", () => {
  const run = load();
  const sv = run('critFor("GRGRSVE01/7-9")');
  assert.deepEqual(sv.levels, ["E", "C", "A"]);
  assert.equal(sv.aspects.length, 5);
  assert.equal(sv.year, "9");
  assert.equal(run('critFor("GRGRSVE01/4-6").year'), "6");
  const gy = run('critFor(Object.keys(PLAN).find(k=>k.startsWith("MATE/")))');
  assert.ok(gy && gy.aspects.length >= 3);
  const old = run('critFor(Object.keys(PLAN).find(k=>k.startsWith("MAT/MATMAT01a")))');
  assert.ok(old && old.levels.includes("A"));
  assert.deepEqual(run('critFor("GRSAEST01/7-9").levels'), ["G", "F"]);
  assert.equal(run('aggregateAspects({0:"E",1:"C",2:"A"})'), "C");
  assert.equal(run("aggregateAspects({})"), null);
});

test("underlag per kriterium samlas per elev", () => {
  const run = load();
  const ev = run('aspectEvidence(state,"c-sv","s1")');
  assert.deepEqual(Object.keys(ev).sort(), ["0", "1"]);
  assert.equal(ev["0"].n, 1);
});

test("schema och kalendarium ställer in rätt lektioner", () => {
  const run = load();
  // Studiedag fredag v.48 (2026-11-27): engelska på fredagar ställs in
  assert.equal(run('cancellation(state,state.schedule.find(x=>x.id==="s-en2"),"2026-11-27").reason'), "Studiedag");
  // Friluftsdag torsdag v.49 för 8B: svenska på torsdagar ställs in
  assert.equal(run('cancellation(state,state.schedule.find(x=>x.id==="s-sv2"),"2026-12-03").type'), "aktivitet");
  // vanlig dag: ingen inställning
  assert.equal(run('cancellation(state,state.schedule.find(x=>x.id==="s-sv1"),"2026-11-16")'), null);
  // aktivitet för en annan grupp påverkar inte
  run('state.events.push({id:"x",title:"Utflykt 9A",start:"2026-11-16",end:"2026-11-16",type:"aktivitet",groups:["annan"],from:"",to:""})');
  assert.equal(run('cancellation(state,state.schedule.find(x=>x.id==="s-sv1"),"2026-11-16")'), null);
  // aktivitet med tid: bara pass som överlappar
  run('state.events.push({id:"y",title:"Föreläsning",start:"2026-11-18",end:"2026-11-18",type:"aktivitet",groups:[],from:"12:30",to:"13:30"})');
  assert.equal(run('cancellation(state,state.schedule.find(x=>x.id==="s-ma2"),"2026-11-18").reason'), "Föreläsning");
  assert.equal(run('cancellation(state,state.schedule.find(x=>x.id==="s-en1"),"2026-11-18")'), null);
  // manuellt inställd
  run('state.cancel["s-sv1|2026-11-23"]="Sjuk"');
  assert.equal(run('cancellation(state,state.schedule.find(x=>x.id==="s-sv1"),"2026-11-23").reason'), "Sjuk");
  // lov: höstlov v.44
  assert.equal(run('courseSlots(state,"c-sv","2026-10-26","2026-10-30").every(x=>x.cancel)'), true);
});

test("jämna och udda veckor", () => {
  const run = load();
  run('state.schedule.push({id:"jv",courseId:"c-sv",day:5,start:"14:00",end:"15:00",weeks:"jamna"})');
  const d = run('slotDates(state,state.schedule.find(x=>x.id==="jv"),"2026-11-16","2026-12-06")');
  assert.deepEqual(d, ["2026-11-27"], "v.48 är jämn");
  run('state.schedule.find(x=>x.id==="jv").weeks="udda"');
  assert.deepEqual(run('slotDates(state,state.schedule.find(x=>x.id==="jv"),"2026-11-16","2026-12-06")'), ["2026-11-20", "2026-12-04"], "v.47 och v.49 är udda");
});

test("kapacitet per arbetsområde och flytt av inställda lektioner", () => {
  const run = load();
  const k = run('unitCapacity(state,unit("u3"))');
  assert.ok(k.total > 0 && k.cancelled >= 0 && k.available === k.total - k.cancelled);
  // lägg en ej genomförd lektion på friluftsdagen och flytta fram
  run('state.lessons.push({id:"t1",unitId:"u4",date:"2026-12-03",time:"10:00",title:"Test",plan:"",note:"",done:false})');
  assert.equal(run('lessonCancel(state,state.lessons.find(l=>l.id==="t1")).reason'), "Friluftsdag");
  const moved = run('reflowLessons(state,"u4")');
  assert.ok(moved >= 1);
  assert.equal(run('lessonCancel(state,state.lessons.find(l=>l.id==="t1"))'), null);
  assert.ok(run('state.lessons.find(l=>l.id==="t1").date') > "2026-12-03");
});

test("nytt läsår tar med schemat till de nya kurserna", () => {
  const run = load();
  run('var ny=rollover(state,{start:"2027-08-16",end:"2028-06-09",courses:true,lessons:false,groups:true,assessments:false,events:true})');
  assert.equal(run("ny.schedule.length"), run("state.schedule.length"));
  assert.ok(run("ny.schedule.every(x=>ny.courses.some(c=>c.id===x.courseId))"));
  assert.ok(run('ny.events.filter(e=>e.type==="aktivitet").every(e=>e.groups.every(g=>ny.groups.some(x=>x.id===g)))'));
  assert.deepEqual(run("ny.cancel"), {});
});

test("kriteriematris ger betygssteg", () => {
  const run = load();
  assert.equal(run('markToGrade({})'), null);
  assert.equal(run('markToGrade({E:"g"})'), "E");
  assert.equal(run('markToGrade({E:"g",C:"y"})'), "D");
  assert.equal(run('markToGrade({E:"g",C:"g"})'), "C");
  assert.equal(run('markToGrade({E:"g",C:"g",A:"y"})'), "B");
  assert.equal(run('markToGrade({E:"g",C:"g",A:"g"})'), "A");
  assert.equal(run('markToGrade({E:"r"})'), "F");
  assert.equal(run('markToGrade({E:"y"})'), "F");
  assert.equal(run('markToGrade({E:"y"},"lokal")'), "2");
  assert.equal(run('markToGrade({E:"g",C:"g"},"lokal")'), "4");
});

test("täckning räknar bedömda arbetsområden och antal prov", () => {
  const run = load();
  run('unit("u6").status="bedomd"');
  const id = run('unit("u6").contentIds[0]');
  assert.equal(run(`coverage("GRGRMAT01/7-9","all")["${id}"].state`), "covered");
  assert.equal(run(`coverage("GRGRMAT01/7-9","all")["${id}"].assessed`), true);
  assert.ok(Array.isArray(run(`coverage("GRGRMAT01/7-9","all")["${id}"].tests`)));
});

test("kalendarium från inklistrade Excel-rader", () => {
  const run = load();
  const rows = run(`parseCalendarRows("Datum\\tSlut\\tNamn\\tTyp\\n2026-10-26\\t2026-10-30\\tHöstlov\\n3/12/2026\\t\\tFriluftsdag\\n2027-01-08;;Studiedag\\n15.1\\t\\tUtvecklingssamtal\\tHändelse",2027)`);
  assert.equal(rows.length, 4);
  assert.deepEqual(rows[0], { title: "Höstlov", start: "2026-10-26", end: "2026-10-30", type: "lov" });
  assert.equal(rows[1].start, "2026-12-03");
  assert.equal(rows[1].type, "aktivitet");
  assert.equal(rows[2].type, "studiedag");
  assert.equal(rows[3].start, "2027-01-15");
  assert.equal(rows[3].type, "annat");
  const n = run("state.events.length");
  const r1 = run(`mergeEvents(state,parseCalendarRows("2030-01-01\\tTestdag\\tStudiedag"))`);
  assert.deepEqual(r1, { added: 1, updated: 0 });
  const r2 = run(`mergeEvents(state,parseCalendarRows("2030-01-01\\t2030-01-02\\tTestdag\\tStudiedag"))`);
  assert.deepEqual(r2, { added: 0, updated: 1 });
  assert.equal(run("state.events.length"), n + 1);
});
