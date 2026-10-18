const CACHE="chatstack-v2";
const ARCHIVOS=["./","./chatstack_v3.html","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{
 e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  await Promise.all(ARCHIVOS.map(u=>c.add(u).catch(()=>{})));
  await self.skipWaiting();
 })());
});
self.addEventListener("activate",e=>{
 e.waitUntil((async()=>{
  const claves=await caches.keys();
  await Promise.all(claves.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener("fetch",e=>{
 const req=e.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin){
  if(req.destination==="script"){
   e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{
    caches.open(CACHE).then(c=>c.put(req,res.clone()));
    return res;
   })));
  }
  return;
 }
 e.respondWith(
  fetch(req).then(res=>{
   if(res.ok){const copia=res.clone();caches.open(CACHE).then(c=>c.put(req,copia))}
   return res;
  }).catch(()=>caches.match(req).then(r=>r||caches.match("./chatstack_v3.html")))
 );
});
self.addEventListener("push",e=>{
 let d={title:"ChatStack",body:"Tienes una novedad"};
 try{d=e.data.json()}catch(_){}
 const tag=d.tag||"chatstack";
 const opciones={
  body:d.body,
  icon:d.icon||"icon-192.png",
  tag,
  silent:false,
  requireInteraction:!!d.llamada,
  vibrate:d.llamada?[500,250,500,250,500,250,500]:[200],
  data:{callId:d.callId||null}
 };
 if(d.llamada&&d.callId){
  opciones.actions=[{action:"aceptar",title:"Aceptar"},{action:"rechazar",title:"Rechazar"}];
 }
 e.waitUntil((async()=>{
  await self.registration.showNotification(d.title,opciones);
  if(d.llamada){
   await new Promise(r=>setTimeout(r,30000));
   const avisos=await self.registration.getNotifications({tag});
   avisos.forEach(n=>n.close());
  }
 })());
});
self.addEventListener("notificationclick",e=>{
 e.notification.close();
 const callId=e.notification.data&&e.notification.data.callId;
 let destino="./chatstack_v3.html";
 if(callId){
  destino+="?llamada="+encodeURIComponent(callId);
  if(e.action==="aceptar"||e.action==="rechazar")destino+="&accion="+e.action;
 }
 e.waitUntil(
  self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{
   const w=cs.find(c=>c.url.includes("chatstack_v3.html"));
   if(w){
    w.postMessage({tipo:"abrir-llamada",url:destino});
    return w.focus();
   }
   return self.clients.openWindow(destino);
  })
 );
});
