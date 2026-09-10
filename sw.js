/**
 * Service Worker do PWA PescaMS
 * Estratégia Offline-First / Cache-First para garantir funcionamento
 * 100% autônomo nas regiões mais remotas do Pantanal sem sinal de celular.
 */

const CACHE_NAME = "pescams-cache-v1.2.0";

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/main.css",
  "./css/components.css",
  "./css/map.css",
  "./css/camera.css",
  "./css/leaflet.css",
  "./js/leaflet.js",
  "./js/app.js",
  "./js/icons.js",
  "./js/db.js",
  "./js/data/species.js",
  "./js/data/rivers-zones.js",
  "./js/data/laws.js",
  "./js/data/faq-qa.js",
  "./js/modules/map.js",
  "./js/modules/camera-classifier.js",
  "./js/modules/calculator.js",
  "./js/modules/solunar.js",
  "./js/modules/weather.js",
  "./js/modules/calendar.js",
  "./js/modules/safety.js",
  "./js/modules/logbook.js",
  "./js/modules/search.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable.png",
  "./assets/icons/icon.svg",
  "./assets/icons/favicon.svg"
];

// Instalação: pré-armazenamento de todo o App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pré-carregando todos os ativos offline...");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Ativação: limpeza de caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removendo cache antigo:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições: Cache First para o app e Stale-While-Revalidate para tiles do mapa
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Se for requisição para tiles do OpenStreetMap, cachear dinamicamente
  if (url.hostname.includes("tile.openstreetmap.org")) {
    event.respondWith(
      caches.open(CACHE_NAME + "-tiles").then((tileCache) => {
        return tileCache.match(event.request).then((cachedTile) => {
          if (cachedTile) return cachedTile;
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              tileCache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Se falhar a rede e não tiver cache do tile, não quebra a página
            return new Response("", { status: 404, statusText: "Offline tile not cached" });
          });
        });
      })
    );
    return;
  }

  // Requisições normais do app: Cache First com fallback de rede
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Se for navegação de página e falhar a rede, servir index.html do cache
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});

// Suporte a Notificações Locais e Push
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow("./index.html");
    })
  );
});
