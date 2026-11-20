/* ---------- guide: synka till rätt fil på rätt ställe ---------- */
let GUIDE={step:0,svc:"google"};
function syncGuide(step){if(step!=null)GUIDE.step=step;const g=GUIDE;const app=DESKTOP&&!IS_MOBILE_APP;const G=g.svc==="google";
 const where=app?syncPlace(filePath):null;
 const folder=G?(OS==="mac"?"Google Drive → Min enhet":"G:\\Min enhet (Google Drive)"):"OneDrive - <skolans namn>";
 const steps=[
  {t:"Välj skolans lagring",b:`<p style="margin:0">Filen ska ligga i skolans molnlagring, inloggad med ditt <b>jobbkonto</b>. Använd inte ett privat Google- eller Microsoft-konto, eftersom filen innehåller elevuppgifter.</p>
   <p class="small muted" style="margin:0">Osäker på om lagringen är godkänd för omdömen? Fråga skolans dataskyddsombud eller IT-avdelning.</p>
   <div class="f"><label>Vilken använder din skola?</label><div class="seg"><button aria-pressed="${G}" data-svc="google">Google Drive</button><button aria-pressed="${!G}" data-svc="onedrive">OneDrive</button></div></div>`},
  {t:"Synka mappen till datorn",b:G?`<ol class="g-ol"><li>Installera <b>Google Drive för datorn</b> från Googles webbplats.</li><li>Logga in med ditt <b>jobbkonto</b>.</li><li>Nu finns mappen <b>${esc(folder)}</b> på datorn. Skapa en mapp där som heter <b>Lärarbordet</b>.</li></ol>`
   :`<ol class="g-ol"><li>${OS==="mac"?"Installera <b>OneDrive</b> från App Store.":"OneDrive finns redan i Windows. Klicka på molnikonen nere till höger."}</li><li>Logga in med ditt <b>jobbkonto</b>.</li><li>Nu finns mappen <b>OneDrive - skolans namn</b>. Den med skolans namn är jobbkontot. Skapa en mapp där som heter <b>Lärarbordet</b>.</li></ol>`},
  {t:app?"Flytta filen dit":"Spara filen där",b:app?`<p style="margin:0">Tryck på knappen och välj mappen <b>Lärarbordet</b> som du nyss skapade. Lärarbordet sparar sedan alltid där, och den gamla filen döps om till <i>flyttad</i> så att du inte råkar öppna den.</p>
    <button class="btn pri" id="gsave">Flytta filen…</button>
    <p class="small" style="margin:0">${where?(where.work===false?`<span class="lowtag">Filen ligger i ${esc(where.name)}, som ser ut att vara ett privat konto.</span>`:`<span style="color:var(--ok)">Klart: filen ligger i ${esc(where.name)}${where.org?" för "+esc(where.org):""}.</span>`):`Just nu ligger filen här: <span class="muted" style="word-break:break-all">${esc(filePath||"")}</span>`}</p>`
   :canPick?`<p style="margin:0">Tryck på knappen och spara filen i mappen <b>Lärarbordet</b> som du nyss skapade.</p><button class="btn pri" id="gsave">Spara filen i mappen…</button>
    <p class="small" style="margin:0"><b>Viktigt:</b> öppna sedan alltid filen därifrån, genom att dubbelklicka på den i mappen. Ta bort gamla kopior, t.ex. i Hämtade filer, så att du inte råkar öppna fel fil.</p>`
   :`<p style="margin:0">Den här webbläsaren kan inte spara direkt i en mapp. Använd <b>Chrome</b> eller <b>Edge</b>, eller ladda ner skrivbordsappen, så fungerar synkningen.</p>`},
  {t:"Den andra datorn",b:`<ol class="g-ol"><li>Gör steg 2 på den andra datorn också, med samma jobbkonto.</li><li>Vänta tills filen har synkats. Synkprogrammet visar en grön bock eller ett moln.</li><li>${app?"Installera Lärarbordet och välj <b>Öppna en befintlig fil</b> (eller Inställningar → Öppna annan fil). Välj filen i mappen Lärarbordet.":"Öppna filen genom att dubbelklicka på den i mappen Lärarbordet."}</li></ol>`},
  {t:"Telefonen",b:`<ol class="g-ol"><li>Installera ${G?"<b>Google Drive</b>":"<b>OneDrive</b>"}-appen och logga in med jobbkontot.</li><li>Öppna Lärarbordet i telefonen: Android-appen eller webbversionen tillagd på hemskärmen.</li><li>Tryck på <b>Fil → Öppna min fil</b> och välj ${G?"Google Drive":"OneDrive"} → Lärarbordet → filen. På iPhone trycker du först på <b>Bläddra</b>.</li><li>Telefonen kan bara läsa. Öppna filen igen när du vill se det senaste.</li></ol>`},
  {t:"Varje dag",b:`<ul class="g-ol"><li><b>Stäng Lärarbordet</b> innan du byter dator.</li><li><b>Vänta på synkningen</b> innan du öppnar på nästa dator.</li><li>Om filen ändrats på en annan dator varnar Lärarbordet och låter dig välja vad som ska gälla.${app?" Skrivbordsappen varnar också om filen är öppen på en annan dator.":""}</li><li>Hittar du filer som <b>lararbordet (1).json</b> har synkprogrammet sparat en kopia vid en krock. Öppna den nyaste och ta bort den andra.</li></ul>`}];
 const s=steps[g.step];
 modal("Synka mellan datorer",`<div class="g-steps">${steps.map((x,i)=>`<button class="g-dot" aria-current="${i===g.step}" data-gs="${i}" aria-label="Steg ${i+1}: ${esc(x.t)}">${i+1}</button>`).join("")}</div>
 <h3 style="margin:0">${g.step+1}. ${esc(s.t)}</h3><div style="display:grid;gap:10px">${s.b}</div>
 <div class="actions">${g.step?'<button class="btn" id="gprev">Tillbaka</button>':""}<span class="sp"></span>${g.step<steps.length-1?'<button class="btn pri" id="gnext">Nästa</button>':'<button class="btn pri" data-a="close">Klart</button>'}</div>`,m=>{
  m.querySelectorAll("[data-gs]").forEach(b=>b.onclick=()=>syncGuide(+b.dataset.gs));
  m.querySelectorAll("[data-svc]").forEach(b=>b.onclick=()=>{GUIDE.svc=b.dataset.svc;syncGuide()});
  const sv=m.querySelector("#gsave");if(sv)sv.onclick=async()=>{await saveFile(true);syncGuide()};
  const p=m.querySelector("#gprev");if(p)p.onclick=()=>syncGuide(g.step-1);
  const n=m.querySelector("#gnext");if(n)n.onclick=()=>syncGuide(g.step+1)})}
