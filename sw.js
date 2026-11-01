// Estudio de pistas: funciona sin conexión. Guarda la app al instalarla; las fuentes, al usarlas.
var VERSION = 'estudio-pistas-v3';
// Las dos apps comparten el almacén de caché del dominio (usuario.github.io): cada una solo borra sus propias versiones antiguas.
var PREFIJO = VERSION.replace(/v\d+$/, '');
var BASE = ['./', 'index.html', 'manifest.webmanifest', 'icono-192.png', 'icono-512.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSION && k.indexOf(PREFIJO) === 0; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // la app: se abre al instante desde la copia guardada y, en segundo plano, se actualiza para la próxima vez
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (guardada) {
      var red = fetch(e.request).then(function (r) { if (r && r.ok) { var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, cp); }); } return r; }).catch(function () { return null; });
      if (guardada) { e.waitUntil(red); return guardada; }
      return red.then(function (r) { return r || caches.match('index.html'); });
    }));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(e.request).then(function (r) { return r || fetch(e.request).then(function (x) { var cp = x.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, cp); }); return x; }); }));
  }
});
