/* Service worker — offline-first, aktualizacja w tle.
   Przy każdej nowej wersji aplikacji podbij CACHE_VERSION. */
const CACHE_VERSION = 'trener-fbw-v26';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (e) => {
  /* cache:'reload' = pobierz prosto z serwera, z pominięciem cache HTTP
     (GitHub Pages trzyma pliki do 10 min) — nowa wersja ma być naprawdę nowa. */
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Stale-while-revalidate: odpowiada z cache natychmiast (offline działa),
   a w tle pobiera świeżą wersję — kolejne otwarcie ma już aktualizację. */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  /* Adresy z parametrem (np. sprawdzanie aktualizacji index.html?sprawdzenie=…)
     i inne domeny idą prosto do sieci — bez cache, bez zapisywania. */
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || url.search) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request)
        .then((resp) => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
