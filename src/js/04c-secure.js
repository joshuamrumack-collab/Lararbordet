/* ---------- lösenordsskydd, säkerhetskopior och ångra ---------- */

/* Läser en Lärarbordet-fil (json eller html). Är den krypterad frågar vi efter lösenordet.
   readonly: läsläge (telefonen) – lösenordet används bara för att läsa. */
async function loadText(text,name,readonly){const env=readEnvelope(text);if(!env)return parsePlanbok(text);
 if(ENC&&!readonly&&b64e(ENC.salt)===env.salt){try{const pt=new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64d(env.iv)},ENC.key,b64d(env.data)));return parsePlanbok(pt)}catch(e){}}
 const r=await askPassword(name,env);if(!readonly)ENC=r.k;return parsePlanbok(r.text)}
function askPassword(name,env){return new Promise((res,rej)=>{
 modal("Filen är lösenordsskyddad",`<p style="margin:0">Skriv lösenordet för att öppna ${name?`<b>${esc(name)}</b>`:"filen"}.</p>
 <div class="f"><label for="pwi">Lösenord</label><input type="password" id="pwi" autocomplete="current-password"></div><p class="small" id="pwe" style="color:var(--bad);margin:0" hidden>Fel lösenord. Försök igen.</p>
 <div class="actions"><button class="btn" id="pwc">Avbryt</button><span class="sp"></span><button class="btn pri" id="pwo">Öppna</button></div>`,m=>{
  const inp=m.querySelector("#pwi");setTimeout(()=>inp.focus(),50);
  const go=async()=>{const b=m.querySelector("#pwo");b.disabled=true;b.textContent="Öppnar…";try{const r=await decryptEnvelope(env,inp.value);closeModal();res(r)}catch(e){m.querySelector("#pwe").hidden=false;inp.select();b.disabled=false;b.textContent="Öppna"}};
  m.querySelector("#pwo").onclick=go;inp.onkeydown=e=>{if(e.key==="Enter")go()};
  m.querySelector("#pwc").onclick=()=>{closeModal();rej({cancelled:true})}})})}
/* visas om man avbryter vid start */
function lockedScreen(){document.body.classList.add("locked");$("#main").innerHTML=`<section class="panel"><div class="empty"><p><b>Filen är låst med lösenord.</b></p><p class="small muted">Inget visas förrän du skriver lösenordet.</p><button class="btn pri" data-a="unlock">Lås upp</button></div></section>`}
async function unlockStart(){try{
  if(DESKTOP){state=await loadText(await T.fs.readTextFile(filePath),baseName(filePath));ui=Object.assign(ui,state.ui||{});ui.gapsOnly=false;syncMode="file";savedAt=new Date();fileMtime=await fileStatMs(filePath);FIRST=false}
  else if(ENC_PENDING){const r=await askPassword(FILENAME,ENC_PENDING);ENC=r.k;state=parsePlanbok(r.text);ENC_PENDING=null;ui=Object.assign(ui,state.ui||{});ui.gapsOnly=false}
  document.body.classList.remove("locked");resetUndo();render();setSync();if(DESKTOP)afterFileOpened()}
 catch(e){lockedScreen()}}

/* skydda, byta lösenord eller ta bort skyddet */
function protectModal(){const on=!!ENC;
 modal(on?"Byt lösenord":"Skydda filen med lösenord",`<p style="margin:0">Filen krypteras (AES-256). Utan lösenordet går den inte att läsa, inte ens om någon kommer åt din dator eller molnmapp.</p>
 <p class="example" style="margin:0;background:var(--bad-bg);color:var(--bad)"><span><b>Glömmer du lösenordet går datan inte att få tillbaka.</b> Skriv upp det på ett säkert ställe, t.ex. i en lösenordshanterare.</span></p>
 <div class="f"><label for="pw1">Nytt lösenord</label><input type="password" id="pw1" autocomplete="new-password"><span class="small muted">Minst 8 tecken. En mening av några ord är lätt att minnas och svår att gissa.</span></div>
 <div class="f"><label for="pw2">Skriv lösenordet igen</label><input type="password" id="pw2" autocomplete="new-password"></div><p class="small" id="pwe" style="color:var(--bad);margin:0" hidden></p>
 <div class="actions"><span class="sp"></span><button class="btn" data-a="close">Avbryt</button><button class="btn pri" id="pwok">${on?"Byt lösenord":"Skydda filen"}</button></div>`,m=>{
  m.querySelector("#pwok").onclick=async()=>{const a=val("pw1"),b=val("pw2");const er=m.querySelector("#pwe");
   if(a.length<8){er.textContent="Lösenordet behöver vara minst 8 tecken.";er.hidden=false;return}if(a!==b){er.textContent="Lösenorden är inte lika.";er.hidden=false;return}
   ENC=await makeKey(a);closeModal();commit();toast(on?"Lösenordet är bytt.":"Filen är skyddad med lösenord. Kom ihåg lösenordet!")}})}
function unprotect(){confirmBox("Ta bort lösenordsskyddet? Filen sparas då okrypterad igen.",()=>{ENC=null;commit();toast("Lösenordsskyddet är borttaget.")},"Ta bort skyddet")}

/* ---------- ångra ---------- */
let UNDO=[],LAST_SNAP=null;
function resetUndo(){UNDO=[];try{LAST_SNAP=JSON.stringify(state)}catch(e){LAST_SNAP=null}}
function undoRecord(){try{const now=JSON.stringify(state);if(LAST_SNAP&&LAST_SNAP!==now){UNDO.push(LAST_SNAP);if(UNDO.length>30)UNDO.shift()}LAST_SNAP=now}catch(e){}}
function undo(){if(READONLY||!UNDO.length){toast("Det finns inget att ångra.");return}const prev=UNDO.pop();const keepUi=ui;state=normalize(JSON.parse(prev));LAST_SNAP=prev;ui=keepUi;closeModal();
 state.updated=Date.now();dirty=true;render();setSync();if(DESKTOP||fileHandle){clearTimeout(saveT);saveT=setTimeout(()=>saveFile(false),700)}toast("Ångrat.")}
function undoToast(t){const b=document.getElementById("savebar");if(!b)return;b.innerHTML=`<span>${esc(t)}</span><button class="btn pri" data-a="undo">Ångra</button><button class="x" data-a="close-toast" aria-label="Stäng">×</button>`;b.hidden=false;TOAST_ON=true;clearTimeout(toast.t);toast.t=setTimeout(()=>{TOAST_ON=false;b.hidden=true;updateBar()},9000)}
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==="z"){const t=e.target;if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable))return;e.preventDefault();undo()}});

/* ---------- säkerhetskopior ----------
   Datorappen: filer i en mapp (som standard "Säkerhetskopior" bredvid datafilen), de senaste N sparas.
   Webbläsaren: i webbläsarens lagring (IndexedDB). Högst en kopia per kvart, och alltid vid första sparandet. */
let BK={dir:"",keep:10},BK_AT=0;
async function bkConfPath(){return T.path.join(await T.path.appConfigDir(),"installningar.json")}
async function loadBkConf(){if(!DESKTOP)return;try{const p=await bkConfPath();if(await T.fs.exists(p))BK=Object.assign(BK,JSON.parse(await T.fs.readTextFile(p)))}catch(e){}}
async function saveBkConf(){try{const d=await T.path.appConfigDir();await T.fs.mkdir(d,{recursive:true});await T.fs.writeTextFile(await bkConfPath(),JSON.stringify(BK))}catch(e){}}
async function bkDir(){return BK.dir||T.path.join(await T.path.dirname(filePath),"Säkerhetskopior")}
const stamp=d=>fmtD(d)+"-"+String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")+String(d.getSeconds()).padStart(2,"0");
const BIDB={open(){return new Promise((res,rej)=>{try{const r=indexedDB.open("lararbordet-kopior",1);r.onupgradeneeded=()=>r.result.createObjectStore("b");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}})},
 async tx(mode,fn){const db=await this.open();return new Promise((res,rej)=>{const t=db.transaction("b",mode);const st=t.objectStore("b");const out=fn(st);t.oncomplete=()=>res(out&&out.result!==undefined?out.result:out);t.onerror=()=>rej(t.error)})}};
async function backupNow(txt,force){if(READONLY||state.example)return;const now=Date.now();if(!force&&BK_AT&&now-BK_AT<15*60*1000)return;BK_AT=now;txt=txt||await serialize(true);
 if(DESKTOP){if(!filePath)return;const dir=await bkDir();await T.fs.mkdir(dir,{recursive:true});await T.fs.writeTextFile(await T.path.join(dir,"lararbordet-"+stamp(new Date())+".json"),txt);
  const list=(await listBackups()).slice(BK.keep||10);for(const b of list){try{await T.fs.remove(b.path)}catch(e){}}return}
 const key=stamp(new Date());await BIDB.tx("readwrite",st=>st.put(txt,key));const keys=(await BIDB.tx("readonly",st=>st.getAllKeys())).sort().reverse();
 for(const k of keys.slice(BK.keep||10))await BIDB.tx("readwrite",st=>st.delete(k))}
async function listBackups(){if(DESKTOP){try{const dir=await bkDir();if(!(await T.fs.exists(dir)))return [];const ents=await T.fs.readDir(dir);
   return (await Promise.all(ents.filter(e=>/^lararbordet-.*\.json$/.test(e.name)).map(async e=>({name:e.name,key:e.name.slice(12,-5),path:await T.path.join(dir,e.name)})))).sort((a,b)=>a.key<b.key?1:-1)}catch(e){return []}}
 try{return (await BIDB.tx("readonly",st=>st.getAllKeys())).sort().reverse().map(k=>({name:k,key:k}))}catch(e){return []}}
async function readBackup(b){return DESKTOP?T.fs.readTextFile(b.path):BIDB.tx("readonly",st=>st.get(b.key))}
const bkLabel=k=>{const m=String(k).match(/(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})/);return m?`${+m[3]} ${MON[+m[2]-1]} ${m[1]} kl. ${m[4]}.${m[5]}`:k};
async function backupsModal(){const list=await listBackups();const dir=DESKTOP&&filePath?await bkDir():"";
 modal("Säkerhetskopior",`<p class="small" style="margin:0">${DESKTOP?`Lärarbordet sparar en kopia av filen högst en gång i kvarten när du arbetar, och behåller de ${BK.keep||10} senaste.`:`Webbläsaren sparar en kopia högst en gång i kvarten när filen sparas, och behåller de ${BK.keep||10} senaste. Kopiorna finns bara i den här webbläsaren på den här datorn.`}${ENC?" Kopiorna är krypterade med samma lösenord som filen.":""}</p>
 ${DESKTOP?`<p class="small muted" style="margin:0;word-break:break-all">Mapp: ${esc(dir)}</p>`:""}
 ${list.length?`<div class="list">${list.map((b,i)=>`<div class="li"><span class="what"><b>${esc(bkLabel(b.key))}</b>${i===0?' <span class="tag">senaste</span>':""}</span><button class="btn small" data-bk="${i}">Återställ</button></div>`).join("")}</div>`:`<div class="empty">Inga säkerhetskopior än. Den första görs nästa gång filen sparas.</div>`}
 <div class="actions"><button class="btn" id="bknow">Gör en kopia nu</button><span class="sp"></span><button class="btn pri" data-a="close">Klart</button></div>`,m=>{
  m.querySelectorAll("[data-bk]").forEach(btn=>btn.onclick=()=>{const b=list[+btn.dataset.bk];confirmBox(`Återställa kopian från <b>${esc(bkLabel(b.key))}</b>? Det du har nu ersätts, men du kan ångra direkt efteråt.`,async()=>{try{const d=await loadText(await readBackup(b),bkLabel(b.key));state=d;state.example=false;commit();undoToast("Säkerhetskopian är återställd.")}catch(e){if(!(e&&e.cancelled))toast("Kunde inte läsa kopian.")}},"Återställ")});
  m.querySelector("#bknow").onclick=async()=>{try{await backupNow(null,true);closeModal();backupsModal()}catch(e){toast("Kunde inte göra en kopia: "+(e&&e.message||e))}}})}
async function pickBackupDir(){try{const p=await T.dialog.open({directory:true,multiple:false,defaultPath:await bkDir()});if(!p)return;BK.dir=typeof p==="string"?p:p.path;await saveBkConf();BK_AT=0;await backupNow(null,true);render();toast("Säkerhetskopiorna sparas nu i den valda mappen.")}catch(e){toast("Kunde inte välja mappen.")}}
async function setBkKeep(n){BK.keep=Math.max(3,Math.min(50,+n||10));if(DESKTOP)await saveBkConf();else try{localStorage.setItem("lb-bkeep",String(BK.keep))}catch(e){}}
if(!DESKTOP){try{const n=+localStorage.getItem("lb-bkeep");if(n)BK.keep=n}catch(e){}}

/* ---------- inställningar: säkerhet, filens plats och kopior ---------- */
function securityPanel(){
 return `<section class="panel"><div class="panel-h"><h2>Fil och säkerhet</h2></div>
 <div class="sec-grid">
  <div class="sec-box"><b>Var filen sparas</b>
   ${DESKTOP?`<span class="small muted" style="word-break:break-all">${esc(filePath||"")}</span><span class="small">Lärarbordet öppnar och sparar automatiskt i den här filen.</span>
    <div class="row-b"><button class="btn small" data-a="save-as">Flytta filen…</button><button class="btn small" data-a="open-file">Öppna en annan fil…</button>${T.opener&&T.opener.revealItemInDir?`<button class="btn small" data-a="reveal-file">Visa i mappen</button>`:""}</div>`
   :`<span class="small muted">${fileHandle?`Sparas i <b>${esc(fileHandle.name)}</b>.`:storedHandle?`Senast: <b>${esc(storedHandle.name)}</b>.`:"Inte vald än."}</span><span class="small">${canPick?"I Chrome och Edge sparas ändringarna direkt i filen du väljer.":"Den här webbläsaren kan inte spara direkt i en fil. Ändringarna laddas ner som en ny fil."}</span>
    <div class="row-b"><button class="btn small" data-a="save-as">${canPick?"Välj fil att spara i…":"Ladda ner filen"}</button></div>`}</div>
  <div class="sec-box"><b>Lösenordsskydd</b><span class="small ${ENC?"":"muted"}">${ENC?"På. Filen och säkerhetskopiorna är krypterade.":"Av. Rekommenderas om filen innehåller anpassningar eller andra uppgifter om elever."}</span>
   <div class="row-b">${READONLY?"":ENC?`<button class="btn small" data-a="protect">Byt lösenord</button><button class="btn small danger" data-a="unprotect">Ta bort skyddet</button>`:`<button class="btn small pri" data-a="protect">Skydda med lösenord</button>`}</div></div>
  <div class="sec-box"><b>Säkerhetskopior</b><span class="small muted">${DESKTOP?"Sparas i en egen mapp.":"Sparas i webbläsaren."} De senaste <select id="bkkeep" aria-label="Antal kopior">${[5,10,20,30].map(n=>`<option ${n===(BK.keep||10)?"selected":""}>${n}</option>`).join("")}</select> behålls.</span>
   <div class="row-b"><button class="btn small" data-a="backups">Visa och återställ</button>${DESKTOP?`<button class="btn small" data-a="bk-dir">Byt mapp…</button>`:""}</div></div>
  <div class="sec-box"><b>Ångra</b><span class="small muted">Ångra den senaste ändringen med <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Z</kbd>. Efter att något tagits bort visas också en Ångra-knapp.</span></div>
 </div></section>`}
document.addEventListener("change",e=>{if(e.target&&e.target.id==="bkkeep")setBkKeep(e.target.value)});
