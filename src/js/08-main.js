/* ---------- start ---------- */
if(location.protocol==="https:"&&"serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{})}
render();setSync();setTimeout(checkUpdate,1500);if(DESKTOP)desktopInit();else if(FIRST)welcomeModal();
