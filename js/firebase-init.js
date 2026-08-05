// Inicializa o Firebase (compat SDK) usando window.FIREBASE_CONFIG de firebase-config.js
firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------- Helpers de usuário ----------
async function getUserProfile(uid) {
  const doc = await db.collection('users').doc(uid).get();
  return doc.exists ? doc.data() : null;
}

async function createUserProfile(uid, { name, email, role }) {
  await db.collection('users').doc(uid).set({
    name, email, role,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// ---------- Pastas de campanha ----------
async function getFolders() {
  const snap = await db.collection('folders').orderBy('name').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ---------- Guarda de rota ----------
// requiredRole: 'player' | 'master' | null (qualquer logado)
function guardPage(requiredRole, onReady) {
  // O Firebase pode disparar onAuthStateChanged mais de uma vez na mesma
  // sessão (ex.: um disparo com o estado em cache e outro após validar com
  // o servidor). Sem essa trava, onReady() rodava de novo a cada disparo,
  // duplicando TODOS os event listeners que ele registra — inclusive o
  // acordeão dos painéis da Mesa, que aí alternava aberto/fechado duas
  // vezes por clique e parecia simplesmente não fazer nada.
  let started = false;

  // Sem conexão (ou com o servidor fora do ar), o onAuthStateChanged nunca
  // dispara e a página fica com o spinner de carregamento girando pra
  // sempre, sem nenhum aviso. Se não responder em tempo hábil, mostra um
  // aviso de conexão com opção de tentar de novo.
  let responded = false;
  const connTimeout = setTimeout(() => {
    if (!responded) showConnectionError();
  }, 9000);

  auth.onAuthStateChanged(async (user) => {
    responded = true;
    clearTimeout(connTimeout);
    if (!user) {
      location.href = 'index.html';
      return;
    }
    const profile = await getUserProfile(user.uid);
    if (!profile) {
      // Conta existe no Auth mas não tem perfil salvo — algo deu errado no cadastro.
      await auth.signOut();
      location.href = 'index.html';
      return;
    }
    if (requiredRole && profile.role !== requiredRole) {
      location.href = profile.role === 'master' ? 'master.html' : 'minhas-fichas.html';
      return;
    }
    if (started) return;
    started = true;
    onReady(user, profile);
  });
}

// Overlay de "sem conexão" — cobre a tela inteira por cima do que já
// estiver carregado (spinner, painel parcial etc.) e dá uma ação clara
// pro usuário, em vez de deixá-lo preso olhando pra um spinner que nunca
// vai sumir sozinho.
function showConnectionError() {
  if (document.getElementById('connErrorOverlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'connErrorOverlay';
  overlay.className = 'conn-error-overlay';
  overlay.innerHTML = `
    <div class="conn-error-box">
      <p class="conn-error-title">⚠ Não foi possível conectar</p>
      <p class="hint">Verifique sua internet e tente novamente.</p>
      <button class="btn" type="button">Recarregar</button>
    </div>`;
  overlay.querySelector('.btn').addEventListener('click', () => location.reload());
  document.body.appendChild(overlay);
}

// Banner de "sem conexão" — diferente do showConnectionError() acima
// (que é um overlay bloqueante só pra quando a página nem consegue
// terminar de carregar): este é um aviso leve que aparece no topo da
// tela quando a internet cai NO MEIO do uso — por exemplo, mexendo numa
// ficha, jogando numa mesa ou no meio de uma conversa no chat — e some
// sozinho quando a conexão volta. Não bloqueia nada: o usuário continua
// vendo e usando o que já estava na tela (o Firestore enfileira as
// escritas e sincroniza quando a rede volta), só fica avisado de que
// está offline enquanto isso.
//
// Usa o evento nativo online/offline do navegador. Isso reflete a
// interface de rede do dispositivo (ex.: Wi-Fi caiu, avião), não
// necessariamente se o servidor do Firestore está alcançável — não cobre
// o caso raro de "tenho internet mas o Firestore está fora do ar", que
// já é tratado separadamente pelos try/catch de cada ação (alerta de
// erro pontual na hora de salvar/rolar/etc).
function initOfflineBanner() {
  if (document.getElementById('offlineBanner')) return;
  const banner = document.createElement('div');
  banner.id = 'offlineBanner';
  banner.className = 'offline-banner';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  banner.innerHTML = `<span class="dot" aria-hidden="true"></span> Sem conexão — reconectando automaticamente quando a internet voltar…`;
  document.body.appendChild(banner);

  function update() {
    banner.classList.toggle('show', !navigator.onLine);
  }
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update(); // cobre o caso de já abrir a página offline
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOfflineBanner);
} else {
  initOfflineBanner();
}

function renderTopbar(profile) {
  const el = document.getElementById('topbarRight');
  if (!el) return;
  const roleLabel = profile.role === 'master' ? '<span class="badge-master">Mestre</span>' : '';
  const avatarImg = profile.avatarImage
    ? `<img src="${profile.avatarImage}" alt="" class="topbar-avatar">`
    : '';
  // No mobile, esse bloco vira um menu retrátil (toggle + dropdown) em vez de
  // uma fileira de links que não cabe na tela. Ver regras @media em style.css.
  el.innerHTML = `
    <button class="topbar-toggle" id="topbarToggle" type="button" aria-label="Abrir menu" aria-expanded="false">☰</button>
    <div class="topbar-menu" id="topbarMenu">
      <span class="topbar-user">${avatarImg}Olá, <span class="who">${escapeHtml(profile.name)}</span> ${roleLabel}</span>
      <a href="perfil.html" class="btn-link">👤 Meu Perfil</a>
      <a href="livro-de-regras.html" class="btn-link" target="_blank" rel="noopener">📖 Livro de Regras</a>
      <a href="patch-notes.html" class="btn-link">🆕 Novidades<span id="patchNotesBadge" class="new-dot hidden"></span></a>
      <a href="dados.html" class="btn-link">🎲 Rolagem de Dados</a>
      <a href="mesa.html" class="btn-link">🗺️ Mesa</a>
      ${profile.role === 'master'
        ? '<a href="master.html" class="btn-link">Painel do Mestre</a><a href="minhas-fichas.html" class="btn-link">Minhas Fichas (Jogador)</a>'
        : '<a href="minhas-fichas.html" class="btn-link">Minhas Fichas</a>'}
    </div>
  `;
  // "Sair" e "Excluir conta" não ficam mais na barra principal — ambos já
  // estão disponíveis na aba Meu Perfil (ver perfil.html / perfil.js).

  const toggleBtn = document.getElementById('topbarToggle');
  const menu = document.getElementById('topbarMenu');
  const closeMenu = () => { menu.classList.remove('open'); toggleBtn.setAttribute('aria-expanded', 'false'); };
  toggleBtn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // Fecha o menu ao navegar (clicar em qualquer link/botão dentro dele) ou
  // ao tocar fora dele.
  menu.querySelectorAll('a, button').forEach(elMenu => elMenu.addEventListener('click', () => closeMenu()));
  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('open')) return;
    if (menu.contains(e.target) || toggleBtn.contains(e.target)) return;
    closeMenu();
  });

  // Bolinha de "novidade" no link Novidades — compara o id do patch note
  // mais recente (topo de patch-notes.json) com o último que este
  // navegador já viu (guardado em localStorage por patch-notes.html ao
  // ser aberta). Roda em toda página, já que o topbar aparece em todas.
  // Falha em silêncio sem internet/arquivo — não é uma função crítica.
  const badge = document.getElementById('patchNotesBadge');
  if (badge) {
    fetch('patch-notes.json').then(r => r.ok ? r.json() : []).then(notes => {
      if (Array.isArray(notes) && notes.length && notes[0].id !== localStorage.getItem('hsPatchNotesSeen')) {
        badge.classList.remove('hidden');
      }
    }).catch(() => {});
  }
}

// ---------- Limpeza em cascata (pastas e mesas de um Mestre) ----------
// As sub-coleções que pertencem a uma mesa. O SDK do cliente não tem um
// "apagar coleção inteira" pronto (isso normalmente é coisa de Admin
// SDK/Cloud Function), então cada uma é lida e apagada documento por
// documento.
const TABLE_SUBCOLLECTIONS = [
  'tokens', 'rolls', 'scenes', 'drawings', 'fog', 'pings',
  'templates', 'initiative', 'presence', 'chatMessages'
];

// Apaga todos os documentos de uma referência de coleção/consulta, em
// lotes de até 450 (o limite de um batch do Firestore é 500 operações).
async function deleteAllDocs(queryOrCollectionRef) {
  const snap = await queryOrCollectionRef.get();
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 450) {
    const batch = db.batch();
    docs.slice(i, i + 450).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}

// Apaga uma mesa inteira: todo o conteúdo dela (tokens, mapas/cenas,
// desenhos, névoa, chat, iniciativa, presença...) e por fim o próprio
// documento da mesa.
async function deleteTableCascade(tableId) {
  const tableRef = db.collection('tables').doc(tableId);
  for (const sub of TABLE_SUBCOLLECTIONS) {
    await deleteAllDocs(tableRef.collection(sub));
  }
  await tableRef.delete();
}

// Quando um Mestre exclui a própria conta, as pastas e mesas que ele
// criou não podem ficar "órfãs" — como as regras do Firestore só liberam
// quem criou a pasta/mesa a gerenciá-la, ninguém mais conseguiria mexer
// nelas depois. Por isso, antes de apagar o perfil:
//  - cada pasta dele é excluída, e as fichas que estavam nela voltam a
//    ficar "sem pasta" (não são apagadas, só perdem o vínculo — igual ao
//    botão "Excluir pasta" do Painel do Mestre);
//  - cada mesa dele é apagada por completo, com tudo dentro.
// Precisa rodar ANTES de apagar o documento em /users/{uid}, porque as
// regras de dono de pasta/mesa consultam esse documento (role == 'master')
// pra autorizar as próprias exclusões.
async function cleanupMasterOwnedData(uid) {
  const foldersSnap = await db.collection('folders').where('createdBy', '==', uid).get();
  for (const folderDoc of foldersSnap.docs) {
    try {
      const sheetsSnap = await db.collection('sheets').where('folderId', '==', folderDoc.id).get();
      if (!sheetsSnap.empty) {
        const batch = db.batch();
        sheetsSnap.forEach(d => batch.update(d.ref, { folderId: null, folderName: null, masterId: null }));
        await batch.commit();
      }
    } catch (err) {
      // Uma ficha salva antes da atualização de "dono de pasta" (sem o
      // campo masterId ainda) pode barrar essa limpeza pontual — não
      // impede a exclusão da pasta em si, só deixa aquela ficha com uma
      // referência solta a uma pasta que não existe mais (inofensivo).
      console.error('Não foi possível desvincular fichas da pasta ' + folderDoc.id + ':', err);
    }
    await folderDoc.ref.delete();
  }

  const tablesSnap = await db.collection('tables').where('createdBy', '==', uid).get();
  for (const tableDoc of tablesSnap.docs) {
    await deleteTableCascade(tableDoc.id);
  }
}

// ---------- Excluir conta ----------
// Apaga o perfil do jogador/mestre, todas as suas fichas salvas e a própria
// conta de autenticação. Se for uma conta de Mestre, também apaga as
// pastas/campanhas e mesas que ela criou (ver cleanupMasterOwnedData).
// Exige reconfirmar a senha (exigência do Firebase para operações
// sensíveis, evita que alguém exclua a conta com a sessão aberta
// esquecida em outro lugar).
async function deleteOwnAccount() {
  const user = auth.currentUser;
  if (!user) return;

  const sure = confirm('Tem certeza que quer excluir sua conta? Isso apaga seu perfil e TODAS as suas fichas salvas — e, se for uma conta de Mestre, também as pastas/campanhas e mesas que você criou (as fichas dos jogadores que estavam nessas pastas não são apagadas, só ficam sem pasta). Essa ação não pode ser desfeita. Deseja continuar?');
  if (!sure) return;

  const password = prompt('Por segurança, digite sua senha para confirmar a exclusão da conta:');
  if (!password) return;

  try {
    const cred = firebase.auth.EmailAuthProvider.credential(user.email, password);
    await user.reauthenticateWithCredential(cred);

    // Se for Mestre, limpa antes o que é dono (pastas e mesas) — precisa
    // rodar enquanto o perfil (com role == 'master') ainda existe.
    const profile = await getUserProfile(user.uid);
    if (profile && profile.role === 'master') {
      await cleanupMasterOwnedData(user.uid);
    }

    // Apaga todas as fichas de que o usuário é dono.
    const sheetsSnap = await db.collection('sheets').where('ownerId', '==', user.uid).get();
    if (!sheetsSnap.empty) {
      const batch = db.batch();
      sheetsSnap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Apaga o perfil salvo no Firestore.
    await db.collection('users').doc(user.uid).delete();

    // Por fim, apaga a conta de autenticação em si.
    await user.delete();

    alert('Sua conta foi excluída com sucesso.');
    location.href = 'index.html';
  } catch (err) {
    const wrongPass = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential';
    alert('Erro ao excluir conta: ' + (wrongPass ? 'senha incorreta.' : err.message));
  }
}
