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

const CACHE_NAME = 'heartsoul-shell-v31'; // v31: inventário em cards no editor, na ficha e na mesa (js/editor-misc.js, js/view.js, js/mesa-tokens.js e css/style.css mudaram); sem este bump o cache antigo continuaria sendo servido.
// v27 (anterior): traços "Força Desproporcional" (meio-orc) e "Força de Três Anões" (anão) passam a dar +2 de Constituição só para a capacidade de carga (texto trocado de Força para Constituição em js/data/races.js e regras.json) e o cálculo de peso do editor, da ficha e da mesa (js/editor-core.js, js/editor-misc.js, js/view.js, js/mesa-tokens.js) soma esse bônus — sem este bump o cache antigo continuaria sendo servido.
// v26 (anterior): traços que dobram a capacidade de carga (ex.: Força das Montanhas, dos Golias) agora dobram de verdade a capacidade do inventário no editor, na ficha e na mesa (js/editor-core.js, js/editor-misc.js, js/view.js, js/mesa-tokens.js) + correção de "e dobrada" para "é dobrada" em js/data/races.js e regras.json — sem este bump o cache antigo continuaria sendo servido.
// v25 (anterior): livro de regras — capítulo "Criação de Itens e Ofícios" reestruturado (subtítulos, listas com marcador, destaque no exemplo) e frases de abertura que viravam cartão com a frase inteira como título (Combate, Catálogo de Traços, Treinamento). regras.json e js/livro-de-regras.js mudaram, então sem este bump o cache antigo continuaria sendo servido.
// v24 (anterior): livro de regras — seção "Mecânica de Sorte" (destaque "Quando usar" com os exemplos dentro, listas com marcador em vez de parágrafos soltos). regras.json, js/livro-de-regras.js e css/livro-de-regras.css mudaram, então sem este bump quem já visitou o site continuaria vendo a versão antiga a partir do cache.
// v23 (anterior): etapa de build (CSS/JS minificados, PNGs recomprimidos) + acabamento de design: identidade visual na tela de login (glow do selo, eyebrow, divisor), correção do spinner de carregamento das mesas (ficava desalinhado do texto por um conflito de grid) e do estado de erro do livro de regras (sem estilo nenhum antes), e contraste de --ink-mute elevado pra AAA em todo o site. css/*.css e index.html mudaram, então sem este bump quem já visitou o site continuaria vendo a versão antiga a partir do cache.
// v22 (anterior): reformulação da iniciativa (jogadores entram e rolam a própria, Mestre adiciona monstros manualmente e rola por eles, atalho ⚔ no painel de Dados, regras do Firestore ajustadas) + dado sobre a mesa virou um d20 desenhado com o número dentro da face + acabamento no livro de regras (verbetes viraram cartão com friso pela natureza) e na barra de ferramentas do mapa (losango nos rótulos de grupo, transições/feedback de clique) — não apareceriam pra quem já visitou o site sem este bump, pelo mesmo motivo das vezes anteriores.
// v21 (anterior): correção do histórico de rolagens da mesa (mesa.html/js/mesa-dice.js/js/mesa-init.js) + passada de acabamento visual nas páginas que ainda não tinham recebido uma (dados, perfil, patch-notes, minhas-fichas, master, offline) — não apareceriam pra quem já visitou o site sem este bump, pelo mesmo motivo das vezes anteriores.
// v20 (anterior): correção do painel "Complementos" do Mestre (master.html/js/master.js) — initComplementosPanel nunca era chamado, então a seção ficava vazia; não apareceria pra quem já visitou o site sem este bump, pelo mesmo motivo das vezes anteriores.
// v19 (anterior): complemento "Deadly-Cards" — novo tipo de complemento "sistema" no Painel do Mestre (js/complementos.js), novo js/deadly-cards.js, e ajustes de CSS (css/style.css) não apareceriam pra quem já visitou o site sem este bump, pelo mesmo motivo das vezes anteriores.
// v18 (anterior): visual da biblioteca de NPCs/Monstros mais refinado — retrato em medalhão circular com brilho na cor do próprio NPC, título com losango dourado (mesmo motivo dos painéis), busca com ícone embutido e estado vazio com ícone flutuante — js/npc-library.js/css/style.css
// v17 (anterior): biblioteca de NPCs/Monstros ganhou busca por nome, ordenação por HP e formulário "Novo NPC" retrátil (recolhido por padrão quando já há NPCs salvos) — js/npc-library.js/css/style.css
// v16 (anterior): painel "Colocar tokens na mesa" virou sub-sanfonas retráteis (mesa.html/mesa-tokens.js/mesa-tools.js) + redesign da Biblioteca de NPCs/Monstros (npc-library.js/style.css)
// v15 (anterior): sistema de consumíveis no inventário (efeitos de Cura/Dano/Buff/Debuff + botão "Usar" na mesa)
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
