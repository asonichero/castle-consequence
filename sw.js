// Service worker: caches the game on first load so it installs and plays offline. Bump VERSION whenever the files change, so installed copies refresh.
const VERSION = 'consequence-v04-31';
const FILES = [
  'game.html', 'level.html', 'manifest.webmanifest',
  'js/blocky.js', 'js/cast.js', 'js/audio.js', 'js/farm-layout.js', 'js/farm.js', 'js/game.js', 'js/opening.js', 'js/market.js', 'js/road.js', 'js/night.js', 'js/correction.js', 'js/garden.js', 'js/chapter3.js', 'js/climb.js', 'js/meadow.js', 'js/castle.js', 'js/castle-layout.js', 'js/castlewalk.js', 'js/menus.js', 'js/pain.js', 'js/lap-poses.js', 'js/lap.js', 'js/level.js',
  'vendor/three.min.js', 'vendor/OrbitControls.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Cache first (so it works offline and starts instantly), refreshing the cached copy from the network in the background.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && r.ok && new URL(e.request.url).origin === location.origin) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
