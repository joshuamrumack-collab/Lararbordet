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
