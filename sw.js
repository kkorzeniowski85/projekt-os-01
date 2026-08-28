/* Service worker — offline-first, aktualizacja w tle.
   Przy każdej nowej wersji aplikacji podbij CACHE_VERSION. */
const CACHE_VERSION = 'trener-fbw-v27';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  /* schematy wykonania (sekcja „Wykonanie" przy ćwiczeniach) — offline */
  './img/E3.jpg', './img/E6.jpg', './img/E8.jpg', './img/E9.jpg', './img/E10.jpg',
  './img/E13a.png', './img/E13b.png', './img/E14.jpg', './img/E15.jpg', './img/E16.jpg',
  './img/E17.jpg', './img/E19.jpg', './img/E20.jpg', './img/E21.jpg', './img/E24.jpg',
  './img/E25.jpg', './img/E28.jpg', './img/G09.webp', './img/G14a.png', './img/G14b.png',
  './img/G16.jpg',
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
