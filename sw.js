// Service worker mínimo do Heartsoul — existe principalmente para o site
// ser reconhecido como um PWA instalável (é um dos requisitos, junto do
// manifest.json, para o Chrome/Android oferecer "Instalar app" e para
// ferramentas como o PWABuilder conseguirem empacotar isto como .apk).
//
// Estratégia "cache-first" só para o casco estático do site (HTML, CSS,
// JS, ícones). NÃO cacheia nada do Firebase/Firestore — os dados da mesa,
// fichas e chat continuam sempre ao vivo, exigindo internet, exatamente
// como hoje. Isto só evita reload de arquivo estático quando a conexão
// cai por um instante, e permite abrir o app (a tela de login, por
// exemplo) mesmo sem internet.

const CACHE_NAME = 'heartsoul-shell-v12'; // v12: sussurro direto pro Mestre no seletor da mesa
// (lista "Fichas na mesa" e a correção do bug de cache) não apareceriam na página "Novidades" pra quem
// já visitou o site sem este bump, pelo mesmo motivo das vezes anteriores.
// v10 (anterior): melhorias na lista "Fichas na mesa" (mesa.html/js/mesa-tokens.js/js/mesa-init.js:
// busca, ordenação, agrupamento, condições/status, badge de iniciativa).
// v9 (anterior): atualizações em regras.json (livro) e em mesa.html/mesa-tokens.js (fichas na mesa)
// não apareciam pra quem já tinha visitado o site, porque o service worker antigo (v8) continuava
// servindo esses arquivos direto do cache. Bumpar o nome do cache é o que faz o navegador notar que
// o sw.js mudou, instalar a nova versão e (no evento "activate") apagar o cache antigo — daí o
// próximo carregamento de cada arquivo vai pra rede em vez do cache obsoleto.
// v8 (anterior): a ferramenta "Névoa (contorno)" (mesa.html/mesa-tools.js) não aparecia pelo mesmo motivo.
// v7 (anterior): nova página patch-notes.html (Novidades) e seu arquivo de dados patch-notes.json
// entraram no app shell, mesmo esquema do livro de regras (HTML fixo + JSON carregado à parte via fetch).
const APP_SHELL = [
  './',
  './index.html',
  './minhas-fichas.html',
  './ficha-editor.html',
  './ficha-view.html',
  './master.html',
  './mesa.html',
  './dados.html',
  './livro-de-regras.html',
  './regras.json',
  './patch-notes.html',
  './patch-notes.json',
  './perfil.html',
  './offline.html',
  './css/style.css',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca intercepta chamadas para fora do próprio site (Firebase,
  // Firestore, Google Fonts etc.) — tudo isso continua indo direto pra
  // rede, sem cache, pra não servir dado desatualizado de ficha/mesa/chat.
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((resp) => {
          if (resp && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => {
          // Sem rede e sem cópia em cache desta rota específica. Para uma
          // navegação de página (o usuário abrindo uma tela, não uma
          // chamada de API/asset), mostra a tela "sem conexão" em vez de
          // deixar o navegador exibir o erro genérico dele.
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match('./offline.html');
          return undefined;
        });
      return cached || network;
    })
  );
});
