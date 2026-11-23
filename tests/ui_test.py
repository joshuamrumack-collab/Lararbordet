"""Klicktest av dist/index.html (kör `npm run build` först).
Går igenom alla flikar och de viktigaste rutorna i dator- och telefonvy, i ljust och mörkt läge,
och misslyckas om något JavaScript-fel uppstår."""
import pathlib, sys
from playwright.sync_api import sync_playwright

URL = (pathlib.Path(__file__).resolve().parent.parent / "dist" / "index.html").as_uri()
TABS = ["oversikt", "schema", "planering", "elever", "arshjul", "bedomning", "process", "innehall", "installningar"]
fel = []

def ny_sida(b, tema, mobil=False):
    ctx = b.new_context(viewport={"width": 390, "height": 800} if mobil else {"width": 1280, "height": 900}, is_mobile=mobil, has_touch=mobil)
    ctx.route("https://api.github.com/**", lambda r: r.fulfill(status=200, content_type="application/json", body="{}"))
    ctx.add_init_script(f"try{{localStorage.setItem('lb-theme','{tema}')}}catch(e){{}}")
    p = ctx.new_page(); p.set_default_timeout(5000)
    namn = f"{'telefon' if mobil else 'dator'}/{tema}"
    p.on("pageerror", lambda e: fel.append(f"{namn}: {e}"))
    # nätverksfel (t.ex. GitHubs gräns för uppdateringskollen i bygget) räknas inte som fel i appen
    p.on("console", lambda m: m.type == "error" and not m.text.startswith("Failed to load resource") and fel.append(f"{namn} console: {m.text}"))
    p.goto(URL); p.wait_for_timeout(600)
    p.evaluate("closeModal()")
    return p

def steg(p, namn, fn):
    try:
        fn()
    except Exception as e:
        fel.append(f"{namn}: {str(e).splitlines()[0]}")
    try:
        p.evaluate("closeModal()")
    except Exception:
        pass

def gå(p, flik):
    p.evaluate(f"location.hash='#{flik}'"); p.wait_for_timeout(150)

def klicka_alla(p, sel):
    for i in range(p.locator(sel).count()):
        p.locator(sel).nth(i).click(); p.wait_for_timeout(80)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    for tema in ["light", "dark"]:
        p = ny_sida(b, tema)
        for t in TABS:
            steg(p, f"flik {t}", lambda: gå(p, t))
        gå(p, "arshjul"); steg(p, "årshjulets vyer", lambda: klicka_alla(p, "[data-a=wheelmode]"))
        gå(p, "planering"); steg(p, "planeringsvyer", lambda: (klicka_alla(p, "[data-a=planview]"), klicka_alla(p, "[data-a=sel-course]")))
        gå(p, "innehall"); steg(p, "innehållsvyer", lambda: klicka_alla(p, "[data-a=cview]"))
        gå(p, "planering"); p.evaluate("ui.planView='tidslinje';render()")
        steg(p, "ny kurs", lambda: (p.click("[data-a=new-course]"), p.click("#csave")))
        steg(p, "nytt arbetsområde", lambda: (p.evaluate("ui.course=state.courses[0].id;ui.planView='tidslinje';render()"), p.click("[data-a=new-unit] >> nth=0"), p.fill("#ut", "Testområde"), p.click("#usave")))
        steg(p, "ny uppgift", lambda: (p.click("[data-a=new-task] >> nth=0"), p.fill("#at", "Testuppgift"), p.click("#asave")))
        steg(p, "LPP", lambda: (p.click(".ucard >> nth=0"), p.click("[data-a=lpp]"), p.wait_for_timeout(300)))
        steg(p, "LPP för elever", lambda: (p.click(".ucard >> nth=0"), p.click("[data-a=lpp-elev]"), p.fill("#eg", "Vi lär oss"), p.wait_for_timeout(400)))
        steg(p, "dela arbetsområde", lambda: (p.click(".ucard >> nth=0"), p.click("[data-a=share-unit]")))
        steg(p, "importera arbetsområde", lambda: (p.evaluate("importAnyModal(JSON.stringify(exportUnit(state,state.units[0].id)))"), p.click("#iuok")))
        steg(p, "veckoplanering", lambda: (p.click("[data-a=weekplan] >> nth=0"), p.wait_for_timeout(300)))
        steg(p, "ämnesbibliotek", lambda: p.click("[data-a=library]"))
        steg(p, "så hänger det ihop", lambda: p.click("[data-a=how]"))
        gå(p, "bedomning")
        def snabbomdome():
            p.evaluate("closeModal();ui.acourse='all';location.hash='bedomning';render()"); p.wait_for_timeout(150)
            c = p.locator(".mx .cell >> nth=0"); aid = c.get_attribute("data-as"); sid = c.get_attribute("data-st")
            c.click(); p.keyboard.press("b")
            k = p.evaluate(f"((state.grades['{aid}']||{{}})['{sid}']||{{}}).k")
            if k != "B": raise Exception("snabbomdöme sparades inte: " + str(k))
            if p.evaluate("document.activeElement.dataset.st") == sid: raise Exception("markeringen flyttade inte ned")
            p.keyboard.press("ArrowUp"); p.keyboard.press("Delete"); p.keyboard.press("Enter")
            if not p.locator("#gsave").count(): raise Exception("Enter öppnade inte rutan")
            p.evaluate("closeModal()")
        steg(p, "omdöme med tangentbordet", snabbomdome)
        steg(p, "kom igång", lambda: (p.evaluate("closeModal();state=emptyState();state.mine=[];ui.startHidden=false;location.hash='oversikt';render()"), p.click("[data-a=picker]"), p.evaluate("closeModal();state=exampleState();location.hash='bedomning';render()")))
        steg(p, "bedöm elev", lambda: (p.evaluate("(()=>{const a=state.assessments.find(x=>(x.aspects||[]).length);gradeModal(a.id,group(a.groupId).students[0].id)})()"), p.click("[data-cm] >> nth=0"), p.click("#gsave")))
        steg(p, "resultat", lambda: p.click("[data-a=results]"))
        steg(p, "ämnesanalys", lambda: (p.click("[data-a=analysis]"), p.wait_for_timeout(300), p.uncheck("#anc"), p.wait_for_timeout(400)))
        pdf = str(pathlib.Path(__file__).resolve().parent / "fixtures" / "schema.pdf")
        def pdfimport():
            p.evaluate("closeModal();delete Promise.withResolvers;location.hash='schema'")
            p.wait_for_timeout(200); p.click("[data-a=import-ics] >> nth=0"); p.set_input_files("#icsf", pdf)
            p.wait_for_selector(".imp-row", timeout=15000)
            if p.locator(".imp-row").count() < 3: raise Exception("PDF-schemat gav för få lektioner")
            p.click("#icsok")
        steg(p, "importera PDF-schema (äldre webbläsare)", pdfimport)
        gå(p, "schema")
        steg(p, "lektion i veckovyn", lambda: (p.click(".occ:not(.cancelled) >> nth=0"), p.fill("#opl", "Plan"), p.click("#osave")))
        steg(p, "lektion i schemat", lambda: (p.click("[data-a=new-slot] >> nth=0"), p.fill("#sls", "1500"), p.fill("#sle", "1600"), p.click("#slok")))
        steg(p, "händelse", lambda: (p.click("[data-a=new-event] >> nth=0"), p.fill("#et", "Testdag"), p.click("#esave")))
        steg(p, "importera schema", lambda: p.click("[data-a=import-ics] >> nth=0"))
        gå(p, "process")
        steg(p, "skrivarbete", lambda: (p.click("[data-a=new-proc] >> nth=0"), p.fill("#prt", "Test"), p.fill("#prmin", "800"), p.click("#prok"), p.locator("[data-pv]").first.fill("150"), p.locator("[data-pv]").first.press("Tab")))
        gå(p, "elever")
        steg(p, "elev", lambda: (p.check("#stad input >> nth=0"), p.click("#stsave")))
        steg(p, "sök", lambda: (p.click("[data-a=search]"), p.fill("#sq", "a"), p.wait_for_timeout(100)))
        gå(p, "installningar")
        steg(p, "säkerhetskopior", lambda: p.click("[data-a=backups]"))
        steg(p, "ångra", lambda: p.evaluate("undo()"))
        p.context.close()
        # telefonen i läsläge
        p = ny_sida(b, tema, mobil=True)
        p.evaluate("READONLY=true;RO_SNAP=JSON.stringify(state);document.body.classList.add('ro');location.hash='idag';render()")
        for t in ["idag", "vecka", "kurser", "elever", "fil"]:
            steg(p, f"telefon {t}", lambda: (gå(p, t), p.locator("[data-a=p-go]").count() and (p.locator("[data-a=p-go]").first.click(), p.wait_for_timeout(100))))
        p.context.close()
    b.close()

if fel:
    print("Fel i klicktestet:"); [print(" -", f) for f in fel]; sys.exit(1)
print("Klicktestet gick igenom utan fel.")
