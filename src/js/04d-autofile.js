/* ---------- webbläsaren: öppna och spara automatiskt i en fil ----------
   Chrome och Edge på dator. Webbläsaren kommer ihåg filen (bara hänvisningen, ingen data).
   Vid start läses filen in, och varje ändring sparas direkt i den. */
const AUTO_KEY="lb-autofil";
const autoOn=()=>{try{return localStorage.getItem(AUTO_KEY)==="1"}catch(e){return false}};
const setAuto=on=>{try{on?localStorage.setItem(AUTO_KEY,"1"):localStorage.removeItem(AUTO_KEY)}catch(e){}};
const isJsonName=n=>/\.json$/i.test(String(n||""));
const HANDLE_READY=(!DESKTOP&&canPick)?IDB.get(HKEY).then(h=>{storedHandle=h;updateBar()}).catch(()=>{}):Promise.resolve();
const PICK_TYPES=[{description:"Lärarbordet",accept:{"text/html":[".html",".htm"],"application/json":[".json"]}}];
async function fileContent(h){return isJsonName(h&&h.name)?await serialize():await buildHTML()}
/* Läser in filen och väljer den nyaste av filen och det som visas nu */
async function openFromHandle(h,opts){opts=opts||{};const f=await h.getFile();const text=await f.text();
 let d=null;if(text.trim()){d=await loadText(text,f.name)}
 fileHandle=h;storedHandle=h;IDB.set(HKEY,h).catch(()=>{});setAuto(true);htmlMtime=f.lastModified;
 const pageReal=!FIRST&&!state.example;
 const useFile=()=>{state=d;ui=Object.assign(ui,state.ui||{});ui.gapsOnly=false;FIRST=false;dirty=false;savedAt=new Date();syncMode="file";resetUndo();render();setSync()};
 const usePage=()=>{state.example=false;FIRST=false;dirty=true;setSync();saveFile(false)};
 if(!d){if(FIRST&&!opts.keepPage){closeModal();welcomeModal()}else usePage();return}
 if(!pageReal||opts.preferFile){useFile();closeModal();if(!opts.quiet)toast(`Lärarbordet öppnar och sparar nu automatiskt i ${f.name}.`);return}
 const fu=d.updated||0,pu=state.updated||0;
 if(fu===pu||JSON.stringify(Object.assign({},d,{ui:0}))===JSON.stringify(Object.assign({},state,{ui:0}))){useFile();return}
 const when=t=>t?new Date(t).toLocaleString("sv-SE",{dateStyle:"short",timeStyle:"short"}):"okänt";
 modal("Vilken version vill du fortsätta med?",`<p style="margin:0">Filen <b>${esc(f.name)}</b> och det som visas här är inte likadana.</p>
  <ul style="margin:0"><li>Filen ändrades senast <b>${when(fu)}</b></li><li>Det som visas här ändrades senast <b>${when(pu)}</b></li></ul>
  <p class="small muted" style="margin:0">Det du inte väljer sparas som säkerhetskopia, så inget försvinner.</p>
  <div class="actions"><button class="btn" id="afp">Behåll det som visas här</button><span class="sp"></span><button class="btn pri" id="aff">Öppna filen</button></div>`,m=>{
  if(fu>pu)m.querySelector("#aff").textContent="Öppna filen (nyast)";else m.querySelector("#afp").textContent="Behåll det som visas här (nyast)";
  m.querySelector("#aff").onclick=async()=>{closeModal();try{await backupNow(null,true)}catch(e){}useFile()};
  m.querySelector("#afp").onclick=async()=>{closeModal();const keep=state;try{state=d;await backupNow(null,true)}catch(e){}state=keep;usePage()}})}
/* Vid start: läs in den kopplade filen om användaren har slagit på det */
async function autoOpen(){if(DESKTOP||!canPick||!storedHandle||!autoOn())return false;
 let p="prompt";try{p=await storedHandle.queryPermission({mode:"readwrite"})}catch(e){}
 if(p==="granted"){try{await openFromHandle(storedHandle,{quiet:true});return true}catch(e){if(e&&e.cancelled)return true;resumeBar(true);return true}}
 resumeBar(false);return true}
function resumeBar(failed){const b=document.getElementById("savebar");if(!b)return;TOAST_ON=true;
 b.innerHTML=`<span>${failed?`Kunde inte läsa <b>${esc(storedHandle.name)}</b>. Försök igen eller välj filen på nytt.`:`Fortsätt i <b>${esc(storedHandle.name)}</b>? Webbläsaren behöver din tillåtelse. Välj <b>Tillåt vid varje besök</b> så slipper du frågan nästa gång.`}</span><button class="btn pri" data-a="auto-resume">Fortsätt</button><button class="btn" data-a="auto-pick" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.55)">Välj fil…</button><button class="x" data-a="auto-later" aria-label="Inte nu">×</button>`;b.hidden=false}
async function autoResume(){const b=document.getElementById("savebar");try{const p=await storedHandle.requestPermission({mode:"readwrite"});if(p!=="granted"){toast("Webbläsaren fick inte tillåtelse. Du kan försöka igen under Inställningar.");return}
  TOAST_ON=false;if(b)b.hidden=true;await openFromHandle(storedHandle,{quiet:true});toast(`Öppnade ${storedHandle.name}. Ändringar sparas direkt i filen.`)}catch(e){if(e&&e.cancelled)return;resumeBar(true)}}
function autoLater(){TOAST_ON=false;const b=document.getElementById("savebar");if(b)b.hidden=true;updateBar();if(FIRST)welcomeModal()}
/* Koppla en fil: förklaring först, sedan väljer användaren befintlig fil eller skapar en ny */
function autoFileModal(){if(!canPick){modal("Fungerar inte i den här webbläsaren",`<p style="margin:0">Automatisk läsning och sparning i en fil fungerar i Chrome och Edge på dator. Här laddas ändringarna ner som en ny fil i stället. Vill du ha automatisk sparning överallt kan du använda programmet för Windows, Mac eller Android.</p><div class="actions"><button class="btn pri" data-a="close">OK</button></div>`);return}
 modal("Öppna och spara automatiskt i en fil",`<p style="margin:0">Välj en fil så öppnar Lärarbordet den när du kommer hit och sparar varje ändring direkt i den. Filen kan ligga i en mapp som synkas, till exempel skolans OneDrive eller Google Drive för dator.</p>
  <ul class="small" style="margin:0;padding-left:18px"><li>Webbläsaren frågar om lov att läsa och ändra filen. Välj <b>Tillåt vid varje besök</b> så slipper du frågan nästa gång.</li><li>Webbläsaren sparar bara var filen ligger, aldrig innehållet.</li><li>Du kan välja en <b>.html</b>-fil från Lärarbordet eller en <b>.json</b>-fil, samma som programmet för dator använder.</li><li>Du kan stänga av det när du vill under Inställningar.</li></ul>
  <div class="actions"><button class="btn" data-a="close">Avbryt</button><span class="sp"></span><button class="btn" id="afnew">Skapa ny fil…</button><button class="btn pri" id="afopen">Välj befintlig fil…</button></div>`,m=>{
  m.querySelector("#afopen").onclick=async()=>{let h;try{[h]=await window.showOpenFilePicker({types:PICK_TYPES,multiple:false})}catch(e){return}
   try{if((await h.requestPermission({mode:"readwrite"}))!=="granted"){toast("Utan tillåtelse kan Lärarbordet inte spara i filen.");return}closeModal();await openFromHandle(h)}
   catch(e){if(e&&e.cancelled)return;modal("Kunde inte öppna",`<p style="margin:0">Filen kommer inte från Lärarbordet. Välj en lararbordet.json eller en sparad lararbordet.html.</p><div class="actions"><button class="btn pri" data-a="close">OK</button></div>`)}};
  m.querySelector("#afnew").onclick=async()=>{let h;try{h=await window.showSaveFilePicker({suggestedName:FILENAME,types:[{description:"Lärarbordet (HTML)",accept:{"text/html":[".html"]}},{description:"Lärarbordet (JSON, samma som datorprogrammet)",accept:{"application/json":[".json"]}}]})}catch(e){return}
   closeModal();fileHandle=h;storedHandle=h;IDB.set(HKEY,h).catch(()=>{});setAuto(true);state.example=false;FIRST=false;dirty=true;FORCE_ONCE=true;await saveFile(false);render();toast(`Lärarbordet sparar nu automatiskt i ${h.name}.`)}})}
function autoStop(){setAuto(false);fileHandle=null;render();setSync();toast("Lärarbordet öppnar inte längre filen automatiskt. Spara med Spara-knappen.")}
