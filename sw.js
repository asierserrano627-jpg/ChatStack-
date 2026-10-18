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
 e.waitUntil(self.registration.showNotification(d.title,{body:d.body,tag:d.tag||"chatstack",requireInteraction:!!d.llamada,vibrate:d.llamada?[300,200,300]:[150]}));
});
self.addEventListener("notificationclick",e=>{
 e.notification.close();
 e.waitUntil(
  self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{
   if(cs.length)return cs[0].focus();
   return self.clients.openWindow("./");
  })
 );
});
