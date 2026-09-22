const CACHE='vortex-static-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('vortex-static-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith('/_next/static/'))return;event.respondWith(caches.open(CACHE).then(async cache=>{const found=await cache.match(request);if(found)return found;const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response;}));});
