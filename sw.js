// Service worker do Fokus: guarda os arquivos para o app abrir mesmo sem internet.
const CACHE = 'fokus-v2'
const ARQUIVOS = ['./', './index.html', './styles.css', './script.js', './manifest.json',
  './imagens/logo.png', './imagens/foco.png', './imagens/descanso-curto.png', './imagens/descanso-longo.png',
  './imagens/pattern.png', './imagens/play_arrow.png', './imagens/pause.png', './imagens/favicon.ico',
  './sons/play.wav', './sons/pause.mp3', './sons/beep.mp3']

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS))))
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
))
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)))
})
