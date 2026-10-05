var C='gct-v1',F=['index.html','about.html','programs.html','admission.html','contact.html','media.html','privacy.html','login.html','dashboard.html','app.js','extra.css','site.js'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(F)}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}))});
self.addEventListener('fetch',function(e){if(e.request.method!=='GET'||new URL(e.request.url).pathname.indexOf('/api/')===0)return;
e.respondWith(fetch(e.request).then(function(r){var c2=r.clone();caches.open(C).then(function(c){c.put(e.request,c2)});return r}).catch(function(){return caches.match(e.request)}))});
