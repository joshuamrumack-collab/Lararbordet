/* ---------- start ---------- */
if(location.protocol==="https:"&&"serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{})}
render();setSync();setTimeout(checkUpdate,1500);const narrow=window.matchMedia("(max-width: 700px)").matches;
if(IS_MOBILE_APP){location.hash="fil";render()}
else if(DESKTOP)desktopInit();
else if(FIRST&&narrow){FIRST_PHONE=true;location.hash="fil";render()}
else if(FIRST)welcomeModal();
/* sparar också med jämna mellanrum, som en extra säkerhet om något sparande har missats */
setInterval(()=>{if(dirty&&!saving&&!READONLY&&(DESKTOP?filePath:fileHandle))saveFile(false)},45000);
