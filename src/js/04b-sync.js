/* ---------- flera datorer: krockvarning och lås ----------
   Filen kan ligga i en synkad mapp (skolans Drive eller OneDrive). Två skydd:
   1. Innan appen sparar kollar den om filen har ändrats någon annanstans sedan den lästes in.
   2. Skrivbordsappen lägger en låsfil bredvid datafilen (lararbordet.json.lock) medan den är öppen,
      och varnar om en annan dator har filen öppen. Låset förnyas varje minut och räknas som
      gammalt efter tre minuter, ifall en dator stängdes av utan att städa. */
let FORCE_ONCE=false,fileMtime=0,htmlMtime=Date.now(),lockTimer=null,DEVICE=null,conflictShown=false;
async function fileStatMs(p){try{const st=await T.fs.stat(p);return st&&st.mtime?new Date(st.mtime).getTime():0}catch(e){return 0}}
async function htmlUnchanged(){try{const f=await fileHandle.getFile();return f.lastModified<=htmlMtime+1500}catch(e){return true}}
async function deviceId(){if(DEVICE)return DEVICE;try{const d=await T.path.appConfigDir();const p=await T.path.join(d,"enhet.txt");if(await T.fs.exists(p)){DEVICE=(await T.fs.readTextFile(p)).trim()}if(!DEVICE){DEVICE=uid()+uid();await T.fs.mkdir(d,{recursive:true});await T.fs.writeTextFile(p,DEVICE)}}catch(e){DEVICE=DEVICE||uid()}return DEVICE}
const lockPath=()=>filePath+".lock";
const OS_NAME={windows:"en Windows-dator",mac:"en Mac",other:"en annan dator"};
async function readLock(){try{if(await T.fs.exists(lockPath()))return JSON.parse(await T.fs.readTextFile(lockPath()))}catch(e){}return null}
async function writeLock(){try{await T.fs.writeTextFile(lockPath(),JSON.stringify({device:await deviceId(),os:OS,beat:Date.now()}))}catch(e){}}
async function removeLock(){try{const l=await readLock();if(l&&l.device===await deviceId())await T.fs.remove(lockPath())}catch(e){}}
function startLock(){clearInterval(lockTimer);writeLock();lockTimer=setInterval(writeLock,60000)}
async function afterFileOpened(){if(!DESKTOP||!filePath)return;const l=await readLock();const mine=await deviceId();
 if(l&&l.device!==mine&&Date.now()-l.beat<3*60000){const min=Math.max(1,Math.round((Date.now()-l.beat)/60000));
  modal("Öppen på en annan dator?",`<p style="margin:0">Lärarbordet verkar vara öppet på <b>${OS_NAME[l.os]||"en annan dator"}</b> (aktivt för ${min} minut${min>1?"er":""} sedan).</p>
  <p class="small" style="margin:0">Stäng Lärarbordet på den andra datorn och vänta tills filen har synkats, annars kan ändringar skrivas över.</p>
  <div class="actions"><button class="btn" id="lkro">Fortsätt ändå</button><span class="sp"></span><button class="btn pri" id="lkok">Jag har stängt den</button></div>`,m=>{
   m.querySelector("#lkok").onclick=async()=>{closeModal();await reloadFromFile(true);startLock()};
   m.querySelector("#lkro").onclick=()=>{closeModal();startLock()}});return}
 startLock()}
/* Läs in filen igen (efter att den ändrats på en annan dator) */
async function reloadFromFile(quiet){try{
  if(DESKTOP){state=parsePlanbok(await T.fs.readTextFile(filePath));fileMtime=await fileStatMs(filePath)}
  else if(fileHandle){const f=await fileHandle.getFile();state=parsePlanbok(await f.text());htmlMtime=f.lastModified}
  ui=Object.assign(ui,state.ui||{});ui.gapsOnly=false;dirty=false;syncMode="file";savedAt=new Date();render();setSync();
  if(!quiet)toast("Uppdaterad med ändringarna från den andra datorn.")}catch(e){toast("Kunde inte läsa filen. Den kanske håller på att synkas, försök igen om en stund.")}}
function toast(t){const b=document.getElementById("savebar");if(!b)return;b.innerHTML=`<span>${esc(t)}</span><button class="btn pri" data-a="close-toast">OK</button>`;b.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{b.hidden=true;updateBar()},6000)}
function showConflict(force){if(conflictShown&&!force)return;conflictShown=true;
 modal("Filen har ändrats på en annan dator",`<p style="margin:0">Sedan du öppnade Lärarbordet har någon sparat i samma fil, troligen du själv på en annan dator. Om du sparar nu skrivs de ändringarna över.</p>
 <div style="display:grid;gap:8px">
  <button class="btn pri" id="cf-load" style="justify-content:center;padding:10px">Läs in den nya versionen</button><span class="small muted" style="margin-top:-4px">Ändringar du gjort här sedan senaste sparningen försvinner.</span>
  <button class="btn" id="cf-copy" style="justify-content:center;padding:10px">Spara mina ändringar som en kopia</button><span class="small muted" style="margin-top:-4px">Båda versionerna finns kvar, och du kan jämföra dem.</span>
  <button class="btn danger" id="cf-over" style="justify-content:center;padding:10px">Skriv över med mina ändringar</button><span class="small muted" style="margin-top:-4px">Ändringarna från den andra datorn försvinner.</span></div>`,m=>{
  const done=()=>{conflictShown=false;closeModal()};
  m.querySelector("#cf-load").onclick=async()=>{done();await reloadFromFile()};
  m.querySelector("#cf-copy").onclick=async()=>{done();await saveFile(true)};
  m.querySelector("#cf-over").onclick=async()=>{done();if(DESKTOP){try{await desktopWrite(true);dirty=false;savedAt=new Date();syncMode="file";setSync()}catch(e){syncMode="error";setSync()}}else{FORCE_ONCE=true;await saveFile(false)}}})}
/* När fönstret får fokus: hämta ändringar från en annan dator om inget osparat finns här */
window.addEventListener("focus",async()=>{if(!DESKTOP||!filePath||!fileMtime||saving)return;const m=await fileStatMs(filePath);if(m>fileMtime+1500){if(!dirty)await reloadFromFile();else showConflict()}});
/* Skrivbordsappen: spara och släpp låset när fönstret stängs */
if(DESKTOP&&T.window&&T.window.getCurrentWindow){try{T.window.getCurrentWindow().onCloseRequested(async()=>{try{if(dirty&&syncMode!=="conflict"){clearTimeout(saveT);await saveFile(false)}}catch(e){}await removeLock()})}catch(e){}}
