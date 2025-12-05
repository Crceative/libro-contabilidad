// Service Worker para Libro de Contabilidad
const CACHE_NAME = 'libro-contabilidad-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalar Service Worker y cachear assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ Cache abierto:', CACHE_NAME);
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        console.log('⚠️ Algunos assets no pudieron cachearse (normal en desarrollo)');
      });
    })
  );
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Borrando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia: Network First, luego Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // No cachear solicitudes POST, PUT, DELETE
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Si la respuesta es válida, cachearla
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, usar el cache
        return caches.match(request).then((response) => {
          return response || new Response('Offline - Contenido no disponible', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// Sincronización en background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('🔄 Sincronizando datos...');
  // Aquí irá la lógica de sincronización con servidor (futuro)
}

// Notificaciones Push (opcional futuro)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification('Libro de Contabilidad', {
      body: data.message || 'Nueva notificación',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png'
    })
  );
});
