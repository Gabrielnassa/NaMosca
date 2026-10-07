/* Na Mosca — service worker: funciona offline, atualiza dados e avisa novos resultados. */
const VERSAO = 'nm-v1';
const BASE = ['./', './index.html', './resultados.html', './assets/css/style.css', './assets/js/data.js', './assets/js/stats.js', './assets/js/ui.js', './manifest.webmanifest', './assets/img/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO && k !== 'nm-estado').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Dados e páginas: rede primeiro (sempre o mais novo), cache como reserva. Demais arquivos: cache primeiro.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const redePrimeiro = url.pathname.includes('/data/') || e.request.mode === 'navigate' || url.pathname.endsWith('.html');
  if (redePrimeiro) {
    e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(VERSAO).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then((c) => c || fetch(e.request).then((r) => { const cp = r.clone(); caches.open(VERSAO).then((cc) => cc.put(e.request, cp)); return r; })));
  }
});

/* ---------- Avisos de novos resultados ---------- */
async function lerEstado() { const c = await caches.open('nm-estado'); const r = await c.match('estado'); return r ? r.json() : {}; }
async function gravarEstado(s) { const c = await caches.open('nm-estado'); await c.put('estado', new Response(JSON.stringify(s))); }

async function verificar() {
  const estado = await lerEstado();
  if (!estado.ativo) return;
  const novos = [];
  for (const b of ['rj', 'sp']) {
    try {
      const j = await (await fetch(`./data/bicho/${b}.json`, { cache: 'no-cache' })).json();
      const ult = j.extracoes[j.extracoes.length - 1];
      const chave = `${ult.data}|${ult.id}`;
      if (estado[b] && estado[b] !== chave && (!estado.favs || !estado.favs.length || estado.favs.includes(ult.id))) novos.push(ult);
      estado[b] = chave;
    } catch (e) {}
  }
  await gravarEstado(estado);
  for (const e of novos) {
    await self.registration.showNotification(`Saiu o ${e.id}: ${e.premios[0]}`, {
      body: `1º ${e.premios[0]} · 2º ${e.premios[1]} · 3º ${e.premios[2]} · 4º ${e.premios[3]} · 5º ${e.premios[4]}`,
      icon: './assets/img/icon-192.png', badge: './assets/img/icon-192.png', tag: `res-${e.id}`, data: { url: `./resultados.html?s=${e.id}` },
    });
  }
}
self.addEventListener('periodicsync', (e) => { if (e.tag === 'resultados') e.waitUntil(verificar()); });
self.addEventListener('message', (e) => {
  if (e.data && e.data.tipo === 'avisos') e.waitUntil((async () => { const s = await lerEstado(); Object.assign(s, e.data.estado); await gravarEstado(s); })());
  if (e.data && e.data.tipo === 'verificar') e.waitUntil(verificar());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow(e.notification.data && e.notification.data.url || './'));
});
