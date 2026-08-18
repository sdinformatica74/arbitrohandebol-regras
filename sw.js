// Service Worker — Regras de Jogo Handebol Indoor
// SDInformática — Profª Synthia Duarte

const CACHE_NAME = 'handball-arbitro-v38-ui2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './regulamento.pdf',
  './apostila_completa.pdf',
  './con-192.png',
  './con-512.png'
];

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cacheando assets da nova versão');
      return cache.addAll(ASSETS);
    })
    // Não chama skipWaiting aqui: o app mostra o aviso e só aplica
    // a nova versão quando o usuário tocar em "Atualizar agora".
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // O HTML principal precisa buscar a versão mais recente no servidor.
  // Os demais arquivos continuam usando a estratégia de cache existente.
  const url = new URL(event.request.url);
  const isAppShell = url.pathname.endsWith('/index.html') || url.pathname.endsWith('/');

  if (isAppShell) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
