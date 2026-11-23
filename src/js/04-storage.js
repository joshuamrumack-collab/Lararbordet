/* ---------- lagring ----------
   Två lägen med samma kod:
   - HTML-fil: datan bäddas in i själva filen (#pbdata) och sparas genom att filen skrivs om.
   - Skrivbordsprogram (Tauri): datan sparas automatiskt i en .json-fil, som standard Dokument/Lärarbordet/lararbordet.json. */
const TOK="__PB"+"DATA__";
const T=window.__TAURI__||null;
const DESKTOP=!!(T&&T.fs&&T.dialog&&T.path);
const TEMPLATE=(()=>{const c=document.documentElement.cloneNode(true);const d=c.querySelector("#pbdata");if(d)d.textContent=TOK;["#main","#tabs","#modalroot"].forEach(q=>{const e=c.querySelector(q);if(e)e.innerHTML=""});return "<!DOCTYPE html>\n"+c.outerHTML})();
const FILENAME=(()=>{try{const n=decodeURIComponent(location.pathname.split("/").pop()||"");if(/\.html?$/i.test(n))return n}catch(e){}return "lararbordet.html"})();
let state=null;
let ENC=null;/* {key,salt,iter} när filen är lösenordsskyddad */
let ENC_PENDING=null;/* krypterad data i HTML-filen som väntar på lösenord */
if(!DESKTOP){try{const raw=document.getElementById("pbdata").textContent.trim();if(raw&&raw!=="null"&&raw!==TOK){const d=JSON.parse(raw);if(isEncrypted(d))ENC_PENDING=d;else state=normalize(d)}}catch(e){}}
let FIRST=!state&&!ENC_PENDING;
if(!state)state=ENC_PENDING?emptyState():exampleState();
/* filter som bara gäller stunden sparas inte i filen, så att "Allt" alltid är förvalt nästa gång */
const uiToSave=()=>{const o=Object.assign({},ui);delete o.gapsOnly;delete o.fullApp;return o};
let ui=Object.assign({course:null,subject:"sv",subjFilter:"all",gapsOnly:false,group:null,acourse:"all",wheel:"all"},state.ui||{});ui.gapsOnly=false;
const saveUI=()=>{};
let fileHandle=null,filePath=null,dirty=false,savedAt=null,saveT=null,saving=false,syncMode="clean";
const canPick=typeof window.showSaveFilePicker==="function";
const baseName=p=>String(p||"").split(/[\\/]/).pop();
/* läs data ur en exporterad .json eller ur en sparad lararbordet.html */
/* datan som text: krypterad om lösenordsskydd är på */
async function serialize(pretty){state.ui=uiToSave();const j=JSON.stringify(state,null,pretty?1:0);return ENC?JSON.stringify(await encryptText(j,ENC)):j}
async function buildHTML(){const json=(await serialize()).replace(/</g,"\\u003c");return TEMPLATE.replace(TOK,()=>json)}
function setSync(m){if(m)syncMode=m;const el=$("#sync");if(!el)return;const hh=d=>String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
 let t,c="";
 if(READONLY){el.textContent="Läsläge";el.className="sync";el.title=RO_NAME;updateBar();return}
 if(saving)t="Sparar…";
 else if(syncMode==="error"){t="Kunde inte spara · försök igen";c="err"}
 else if(syncMode==="readerr"){t="Kunde inte läsa filen";c="err"}
 else if(syncMode==="conflict"){t="Filen ändrades på en annan dator · välj";c="err"}
 else if(dirty){t=DESKTOP?"Sparar strax…":"Osparade ändringar · Spara";c=DESKTOP?"":"err"}
 else if(syncMode==="downloaded"){t="Ny fil nedladdad "+hh(savedAt);c="ok"}
 else if(savedAt){t="Sparat "+hh(savedAt);c="ok"}
 else t=DESKTOP?"Inte sparat än":"Spara till fil";
 el.textContent=t;el.className="sync "+c;updateBar();el.title=DESKTOP?(filePath||""):"Sparar all data i den här HTML-filen (Ctrl/Cmd+S)"}
/* Spara-uppmaning i HTML-versionen: kommer ihåg vilken fil du sparade i (bara själva filhänvisningen, ingen data) */
let storedHandle=null;
const HKEY="fil:"+location.pathname;
const IDB={open(){return new Promise((res,rej)=>{try{const r=indexedDB.open("lararbordet",1);r.onupgradeneeded=()=>r.result.createObjectStore("h");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}})},
 async get(k){const db=await this.open();return new Promise(res=>{const t=db.transaction("h").objectStore("h").get(k);t.onsuccess=()=>res(t.result||null);t.onerror=()=>res(null)})},
 async set(k,v){const db=await this.open();return new Promise(res=>{const t=db.transaction("h","readwrite").objectStore("h").put(v,k);t.onsuccess=()=>res();t.onerror=()=>res()})}};
let TOAST_ON=false;
function updateBar(){const b=document.getElementById("savebar");if(!b||TOAST_ON)return;
 if(DESKTOP||READONLY||!dirty||saving||fileHandle||BAR_HIDDEN){b.hidden=true;return}
 let msg,btn;
 if(canPick&&storedHandle){msg=`Du har ändringar som inte är sparade. Spara dem i <b>${esc(storedHandle.name)}</b>?`;btn="Spara i filen"}
 else if(canPick){msg=`Du har ändringar som inte är sparade. Välj <b>${esc(FILENAME)}</b> för att spara direkt i filen. Sedan sparas allt automatiskt.`;btn="Spara i filen…"}
 else{msg=`Du har ändringar som inte är sparade. Ladda ner den uppdaterade filen och ersätt den gamla med den.`;btn="Ladda ner filen"}
 b.innerHTML=`<span>${msg}</span><button class="btn pri" data-a="bar-save">${btn}</button><button class="x" data-a="bar-hide" aria-label="Stäng rutan" title="Stäng. Du kan spara senare med Spara uppe till höger eller Ctrl/Cmd+S.">×</button>`;b.hidden=false}
let BAR_HIDDEN=false;
async function barSave(){if(canPick&&storedHandle&&!fileHandle){try{const st=await storedHandle.requestPermission({mode:"readwrite"});if(st==="granted")fileHandle=storedHandle}catch(e){}}saveFile(false)}
async function tryStored(){if(fileHandle||!storedHandle)return false;try{if((await storedHandle.queryPermission({mode:"readwrite"}))==="granted"){fileHandle=storedHandle;return true}}catch(e){}return false}
/* ---------- läsläge (t.ex. i telefonen): visar en fil men sparar aldrig något ---------- */
let READONLY=false,RO_SNAP=null,RO_NAME="";
async function openReadOnly(text,name){const d=await loadText(text,name,true);READONLY=true;RO_SNAP=JSON.stringify(d);RO_NAME=name||"";state=d;ui=Object.assign(ui,d.ui||{});ui.gapsOnly=false;dirty=false;document.body.classList.add("ro");closeModal();PH={course:null,student:null,group:null,week:0,open:{},nav:[],tab:"idag"};location.hash=isPhone()?"idag":"oversikt";render();setSync()}
async function pickReadOnlyApp(){try{const p=await T.dialog.open({multiple:false,directory:false});if(!p)return true;const path=typeof p==="string"?p:p.path;await openReadOnly(await T.fs.readTextFile(path),decodeURIComponent(String(path).split(/[\/]/).pop()||"fil"));return true}catch(e){if(e&&e.cancelled)return true;return false}}
function pickReadOnly(){if(IS_MOBILE_APP){pickReadOnlyApp().then(ok=>{if(!ok)pickReadOnlyInput()});return}pickReadOnlyInput()}
function pickReadOnlyInput(){const inp=document.createElement("input");inp.type="file";inp.accept=".json,.html,application/json,text/html";
 inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f)return;try{await openReadOnly(await f.text(),f.name)}catch(e){if(e&&e.cancelled)return;modal("Kunde inte öppna",`<p style="margin:0">Filen kommer inte från Lärarbordet. Välj din <b>lararbordet.json</b> eller <b>lararbordet.html</b>.</p><div class="actions"><button class="btn pri" data-a="close">OK</button></div>`)}};inp.click()}
function commit(quiet){if(READONLY){state=normalize(JSON.parse(RO_SNAP));render();toast("Läsläge: ändringar sparas inte. Ändra på datorn.");return}
 undoRecord();state.updated=Date.now();dirty=true;if(!quiet)render();setSync();
 if(DESKTOP||fileHandle){clearTimeout(saveT);saveT=setTimeout(()=>saveFile(false),400);return}
 tryStored().then(ok=>{if(ok){clearTimeout(saveT);saveT=setTimeout(()=>saveFile(false),400)}})}
function downloadBlob(name,data,mime){const url=URL.createObjectURL(new Blob([data],{type:mime}));const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}

/* skrivbordsläge */
async function rememberPath(p){try{const d=await T.path.appConfigDir();await T.fs.mkdir(d,{recursive:true});await T.fs.writeTextFile(await T.path.join(d,"senaste-fil.txt"),p)}catch(e){}}
async function desktopWrite(force){state.ui=uiToSave();const dir=await T.path.dirname(filePath);await T.fs.mkdir(dir,{recursive:true});
 if(!force&&fileMtime){const m=await fileStatMs(filePath);if(m&&m>fileMtime+1500){showConflict();throw {conflict:true}}}
 const txt=await serialize(true);await T.fs.writeTextFile(filePath,txt);fileMtime=(await fileStatMs(filePath))||Date.now();await rememberPath(filePath);if(!lockTimer)startLock();backupNow(txt).catch(()=>{})}
async function desktopInit(){
 try{let p=null;try{const cfg=await T.path.join(await T.path.appConfigDir(),"senaste-fil.txt");if(await T.fs.exists(cfg))p=(await T.fs.readTextFile(cfg)).trim()}catch(e){}
  if(!p||!(await T.fs.exists(p).catch(()=>false)))p=await T.path.join(await T.path.documentDir(),"Lärarbordet","lararbordet.json");
  filePath=p;
  if(await T.fs.exists(p)){state=await loadText(await T.fs.readTextFile(p),baseName(p));ui=Object.assign(ui,state.ui||{});ui.gapsOnly=false;savedAt=new Date();syncMode="file";FIRST=false;fileMtime=await fileStatMs(p)}else FIRST=true;
 }catch(e){syncMode=e&&e.cancelled?"locked":"readerr"}
 resetUndo();render();setSync();if(syncMode==="locked"){lockedScreen();return}if(FIRST)welcomeModal();else afterFileOpened()}
async function desktopOpen(){try{const p=await T.dialog.open({multiple:false,directory:false,filters:[{name:"Lärarbordet",extensions:["json","html"]}]});if(!p)return;const path=typeof p==="string"?p:p.path;
  const d=await loadText(await T.fs.readTextFile(path),baseName(path));
  if(/\.html?$/i.test(path)){state=d;state.example=false;filePath=path.replace(/\.html?$/i,".json");await desktopWrite()}else{state=d;filePath=path;await rememberPath(path)}
  ui=Object.assign(ui,state.ui||{});ui.gapsOnly=false;dirty=false;savedAt=new Date();syncMode="file";fileMtime=await fileStatMs(filePath);resetUndo();render();setSync();afterFileOpened()}
 catch(e){if(e&&e.cancelled)return;modal("Kunde inte öppna",`<p style="margin:0">Filen kommer inte från Lärarbordet. Välj en lararbordet.json eller en sparad lararbordet.html.</p><div class="actions"><button class="btn pri" data-a="close">OK</button></div>`)}}

async function saveFile(forcePicker){if(saving){clearTimeout(saveT);saveT=setTimeout(()=>saveFile(forcePicker),600);return}
 saving=true;setSync();
 try{
  if(DESKTOP){let old=null;if(forcePicker){const p=await T.dialog.save({defaultPath:filePath,filters:[{name:"Lärarbordet",extensions:["json"]}]});if(!p)return;if(p!==filePath){old=filePath;await removeLock();clearInterval(lockTimer);lockTimer=null;fileMtime=0}filePath=p}
   await desktopWrite(!!old);if(old){try{if(await T.fs.exists(old))await T.fs.rename(old,old.replace(/\.json$/i,"")+" (flyttad).json")}catch(e){}}dirty=false;savedAt=new Date();syncMode="file";return}
  const html=await buildHTML();
  if(canPick){
   try{if(!fileHandle||forcePicker){fileHandle=await window.showSaveFilePicker({suggestedName:storedHandle?storedHandle.name:FILENAME,types:[{description:"Lärarbordet (HTML)",accept:{"text/html":[".html"]}}]});storedHandle=fileHandle;IDB.set(HKEY,fileHandle).catch(()=>{})}
    if(!forcePicker&&!FORCE_ONCE&&!(await htmlUnchanged())){showConflict();throw {conflict:true}}FORCE_ONCE=false;
    const w=await fileHandle.createWritable();await w.write(isJsonName(fileHandle.name)?await serialize():html);await w.close();htmlMtime=(await fileHandle.getFile()).lastModified;dirty=false;savedAt=new Date();syncMode="file";backupNow(null).catch(()=>{});return}
   catch(e){if(e&&e.name==="AbortError")return;if(e&&e.conflict)throw e;fileHandle=null}
  }
  downloadBlob(FILENAME,html,"text/html");dirty=false;savedAt=new Date();syncMode="downloaded";
 }catch(e){syncMode=e&&e.conflict?"conflict":"error"}
 finally{saving=false;setSync()}}
window.addEventListener("beforeunload",e=>{if(dirty&&!DESKTOP&&!READONLY){e.preventDefault();e.returnValue=""}});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();saveFile(false)}});

/* Öppna en textfil: dialog i skrivbordsappen, filväljare i webbläsaren */
function pickTextFile(exts){if(DESKTOP)return T.dialog.open({multiple:false,directory:false,filters:[{name:"Lärarbordet",extensions:exts}]}).then(p=>p?T.fs.readTextFile(typeof p==="string"?p:p.path):null);
 return new Promise(res=>{const inp=document.createElement("input");inp.type="file";inp.accept=exts.map(e=>"."+e).join(",");inp.onchange=async()=>{const f=inp.files&&inp.files[0];res(f?await f.text():null)};inp.click()})}
function openExternal(url){if(DESKTOP&&T.opener&&T.opener.openUrl){T.opener.openUrl(url).catch(()=>{});return}const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener";document.body.appendChild(a);a.click();a.remove()}

/* ---------- uppdateringar ---------- */
let UPDATE=null;
const RELEASES_URL="https://github.com/joshuamrumack-collab/Lararbordet/releases/latest";
const verGt=(a,b)=>{const x=String(a).split(".").map(Number),y=String(b).split(".").map(Number);for(let i=0;i<3;i++){const p=x[i]||0,q=y[i]||0;if(p!==q)return p>q}return false};
async function checkUpdate(force){if(!force&&(state.checkUpdates===false||APP_VERSION.includes("@@")||location.hostname.endsWith("github.io")))return;
 try{const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),6000);const r=await fetch("https://api.github.com/repos/joshuamrumack-collab/Lararbordet/releases/latest",{signal:ctl.signal,headers:{Accept:"application/vnd.github+json"}});clearTimeout(t);if(!r.ok)return;
  const j=await r.json();const v=String(j.tag_name||"").replace(/^v/,"");if(v&&verGt(v,APP_VERSION)){UPDATE={version:v,url:j.html_url||RELEASES_URL};render()}}catch(e){}}

/* ---------- ladda ner senaste versionen ---------- */
const WEB_URL="https://joshuamrumack-collab.github.io/Lararbordet/";
const isWebCopy=()=>location.hostname.endsWith("github.io");
const OS=(()=>{const u=(navigator.userAgent||"")+" "+(navigator.platform||"");return /Android/i.test(u)?"android":/iPhone|iPad|iPod/i.test(u)?"ios":/Win/i.test(u)?"windows":/Mac/i.test(u)?"mac":"other"})();
async function latestRelease(){const r=await fetch("https://api.github.com/repos/joshuamrumack-collab/Lararbordet/releases/latest",{headers:{Accept:"application/vnd.github+json"}});if(!r.ok)throw new Error("GitHub svarade inte");return r.json()}
/* Skrivbordsappen: öppna rätt installationsfil i webbläsaren */
async function downloadInstaller(){const st=$("#dlstatus");if(st)st.textContent="Hämtar…";
 /* datorappen uppdaterar sig själv om uppdateringen är signerad; annars laddas installationsfilen ner */
 if(DESKTOP&&T.updater&&T.updater.check){try{const u=await T.updater.check();if(u){let got=0,total=0;
   const say=t=>{if(st)st.textContent=t;const b=document.getElementById("savebar");if(b){b.innerHTML=`<span>${esc(t)}</span>`;b.hidden=false;TOAST_ON=true}};
   if(dirty)await saveFile(false);say(`Laddar ner version ${u.version}…`);
   await u.downloadAndInstall(ev=>{if(ev.event==="Started")total=ev.data.contentLength||0;else if(ev.event==="Progress"){got+=ev.data.chunkLength||0;if(total)say(`Laddar ner version ${u.version}… ${Math.round(got/total*100)} %`)}else if(ev.event==="Finished")say("Installerar…")});
   say("Klart. Lärarbordet startar om.");await removeLock().catch(()=>{});if(T.process&&T.process.relaunch)await T.process.relaunch();return}}catch(e){}}
 try{const j=await latestRelease();const pat=OS==="android"?/android\.apk$/:OS==="windows"?/x64-setup\.exe$/:OS==="mac"?/universal\.dmg$/:null;const a=pat&&(j.assets||[]).find(x=>pat.test(x.name));
  openExternal(a?a.browser_download_url:(j.html_url||RELEASES_URL));if(st)st.textContent=a?`Laddar ner ${a.name}. Installera den som vanligt, din data ligger kvar.`:"Nedladdningssidan öppnades."}
 catch(e){openExternal(RELEASES_URL);if(st)st.textContent="Nedladdningssidan öppnades."}}
/* HTML-versionen: hämta den nya filen, lägg in all data och spara */
async function updateHtmlFile(){const st=$("#dlstatus");const say=t=>{if(st)st.innerHTML=t};say("Hämtar senaste versionen…");
 let html;try{const r=await fetch(WEB_URL+"?v="+Date.now(),{cache:"no-store"});if(!r.ok)throw 0;html=await r.text()}catch(e){say("Kunde inte nå GitHub. Kontrollera internet och försök igen.");return}
 const m=html.match(/APP_VERSION="([^"]+)"/);const ver=m?m[1]:"?";
 if(!/id="pbdata"/.test(html)){say("Den hämtade filen ser inte ut som Lärarbordet. Ladda ner den från nedladdningssidan i stället.");return}
 const json=(await serialize()).replace(/</g,"\\u003c");
 const out=html.replace(/(<script type="application\/json" id="pbdata">)[\s\S]*?(<\/script>)/,(x,a,b)=>a+json+b);
 if(canPick){try{if(!fileHandle&&storedHandle){try{if((await storedHandle.requestPermission({mode:"readwrite"}))==="granted")fileHandle=storedHandle}catch(e){}}
   if(!fileHandle){fileHandle=await window.showSaveFilePicker({suggestedName:FILENAME,types:[{description:"Lärarbordet (HTML)",accept:{"text/html":[".html"]}}]});storedHandle=fileHandle;IDB.set(HKEY,fileHandle).catch(()=>{})}
   const w=await fileHandle.createWritable();await w.write(out);await w.close();dirty=false;savedAt=new Date();setSync("file");
   say(`Klart! <b>${esc(fileHandle.name)}</b> är nu version ${esc(ver)} med all din data. <button class="btn pri" data-a="reload">Öppna nya versionen</button>`);return}
  catch(e){if(e&&e.name==="AbortError"){say("Avbrutet. Inget ändrades.");return}}}
 downloadBlob(FILENAME,out,"text/html");dirty=false;savedAt=new Date();setSync("downloaded");
 say(`Version ${esc(ver)} med all din data laddades ner som <b>${esc(FILENAME)}</b>. Ersätt den gamla filen med den nya och öppna den.`)}
function downloadLatest(){return DESKTOP?downloadInstaller():updateHtmlFile()}
