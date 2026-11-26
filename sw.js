// Estudio Beat Pro — service worker (works offline)
const VERSION = 'beatpro-v9';
const FILES = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
const SAMPLES = 'beatpro-samples';
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== SAMPLES).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Page: network first (to get updates), cache if offline. Other files: cache first.
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  // recorded instrument samples: keep them so the app sounds real without internet
  if (req.method === 'GET' && (url.hostname === 'gleitz.github.io' || url.hostname === 'cdn.jsdelivr.net')) {
    e.respondWith(caches.open(SAMPLES).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); }
    return r;
  })));
});
