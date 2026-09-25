firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();
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
async function getFolders() {
const snap = await db.collection('folders').orderBy('name').get();
return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function syncFolderMembership(ownerUid, oldFolderId, newFolderId) {
oldFolderId = oldFolderId || null;
newFolderId = newFolderId || null;
if (oldFolderId === newFolderId) return;
try {
if (newFolderId) {
await db.collection('folders').doc(newFolderId).collection('members').doc(ownerUid).set({
uid: ownerUid,
updatedAt: firebase.firestore.FieldValue.serverTimestamp()
});
}
if (oldFolderId) {
const stillThere = await db.collection('sheets')
.where('ownerId', '==', ownerUid)
.where('folderId', '==', oldFolderId)
.limit(1).get();
if (stillThere.empty) {
await db.collection('folders').doc(oldFolderId).collection('members').doc(ownerUid).delete();
}
}
} catch (err) {
console.warn('Não foi possível atualizar a marca de pasta/mesa:', err);
}
}
function escapeHtml(str) {
if (str === null || str === undefined) return '';
return String(str)
.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function formatAbilityDesc(text) {
if (!text) return '';
const lines = String(text).replace(/\r\n/g, '\n').split('\n');
const blocks = [];
let curList = null;
let curPara = null;
lines.forEach(raw => {
const line = raw.trim();
const li = line.match(/^[-•]\s+(.+)$/);
if (!line) {
curList = null; curPara = null;
} else if (li) {
if (!curList) { curList = { kind: 'list', items: [] }; blocks.push(curList); }
curList.items.push(li[1]);
curPara = null;
} else {
if (!curPara) { curPara = { kind: 'p', lines: [] }; blocks.push(curPara); }
curPara.lines.push(line);
curList = null;
}
});
return blocks.map(b => b.kind === 'list'
? `<ul class="ability-desc-list">${b.items.map(it => `<li>${escapeHtml(it)}</li>`).join('')}</ul>`
: `<p class="ability-desc-p">${escapeHtml(b.lines.join(' '))}</p>`
).join('');
}
function raceTraitNameDesc(str) {
if (!str) return { name: '', desc: '' };
const idx = str.indexOf(':');
if (idx === -1) return { name: str, desc: '' };
return { name: str.slice(0, idx).trim(), desc: str.slice(idx + 1).trim() };
}
function formatTraitBody(body) {
if (!body) return '';
const labelRe = /\.\s+(\p{Lu}[^.:]{0,44}):\s+/gu;
const matches = [];
let m;
while ((m = labelRe.exec(body))) {
matches.push({ label: m[1].trim(), start: m.index, contentStart: m.index + m[0].length });
}
if (matches.length === 0) {
return `<p class="trait-rich-body">${escapeHtml(body)}</p>`;
}
const intro = body.slice(0, matches[0].start + 1).trim();
const items = matches.map((mm, i) => {
const end = i + 1 < matches.length ? matches[i + 1].start + 1 : body.length;
return { label: mm.label, text: body.slice(mm.contentStart, end).trim() };
});
return `${intro ? `<p class="trait-rich-body">${escapeHtml(intro)}</p>` : ''}<ul class="trait-rich-list">${items.map(it => `<li><b>${escapeHtml(it.label)}:</b> ${escapeHtml(it.text)}</li>`).join('')}</ul>`;
}
function fmtDate(ts) {
if (!ts) return '';
const d = ts.toDate ? ts.toDate() : new Date(ts);
return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function guardPage(requiredRole, onReady) {
let started = false;
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
update();
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
const currentPage = location.pathname.split('/').pop() || 'index.html';
const navLink = (file, icon, label, extra = '') => {
const isActive = currentPage === file;
const cls = 'btn-link' + (isActive ? ' active' : '');
const aria = isActive ? ' aria-current="page"' : '';
return `<a href="${file}" class="${cls}"${aria}${extra}>${icon} ${label}</a>`;
};
const homeHref = profile.role === 'master' ? 'master.html' : 'minhas-fichas.html';
const fichasGroup = profile.role === 'master'
? navLink('master.html', '🛡️', 'Painel do Mestre') + navLink('minhas-fichas.html', '📜', 'Minhas Fichas (Jogador)')
: navLink('minhas-fichas.html', '📜', 'Minhas Fichas');
el.innerHTML = `
<button class="topbar-toggle" id="topbarToggle" type="button" aria-label="Abrir menu" aria-expanded="false">☰</button>
<div class="topbar-menu" id="topbarMenu">
<span class="topbar-user">${avatarImg}Olá, <span class="who">${escapeHtml(profile.name)}</span> ${roleLabel}</span>
<span class="topbar-group" data-group-label="Fichas">${fichasGroup}</span>
<span class="topbar-divider" aria-hidden="true"></span>
<span class="topbar-group" data-group-label="Ferramentas">
${navLink('mesa.html', '🗺️', 'Mesa')}
${navLink('dados.html', '🎲', 'Rolagem de Dados')}
${navLink('livro-de-regras.html', '📖', 'Livro de Regras', ' target="_blank" rel="noopener"')}
</span>
<span class="topbar-divider" aria-hidden="true"></span>
<span class="topbar-group" data-group-label="Conta">
${navLink('perfil.html', '👤', 'Meu Perfil')}
${navLink('patch-notes.html', '🆕', 'Novidades<span id="patchNotesBadge" class="new-dot hidden"></span>')}
</span>
</div>
`;
const brand = document.querySelector('.topbar .brand');
if (brand && !brand.closest('a')) {
const brandLink = document.createElement('a');
brandLink.href = homeHref;
brandLink.className = 'brand-link';
brandLink.setAttribute('aria-label', 'Ir para o início');
while (brand.firstChild) brandLink.appendChild(brand.firstChild);
brand.appendChild(brandLink);
}
const toggleBtn = document.getElementById('topbarToggle');
const menu = document.getElementById('topbarMenu');
const closeMenu = () => { menu.classList.remove('open'); toggleBtn.setAttribute('aria-expanded', 'false'); };
toggleBtn.addEventListener('click', () => {
const open = menu.classList.toggle('open');
toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
});
menu.querySelectorAll('a, button').forEach(elMenu => elMenu.addEventListener('click', () => closeMenu()));
document.addEventListener('click', (e) => {
if (!menu.classList.contains('open')) return;
if (menu.contains(e.target) || toggleBtn.contains(e.target)) return;
closeMenu();
});
const badge = document.getElementById('patchNotesBadge');
if (badge) {
fetch('patch-notes.json').then(r => r.ok ? r.json() : []).then(notes => {
if (Array.isArray(notes) && notes.length && notes[0].id !== localStorage.getItem('hsPatchNotesSeen')) {
badge.classList.remove('hidden');
}
}).catch(() => {});
}
}
const TABLE_SUBCOLLECTIONS = [
'tokens', 'rolls', 'scenes', 'drawings', 'fog', 'pings',
'templates', 'initiative', 'presence', 'chatMessages'
];
async function deleteAllDocs(queryOrCollectionRef) {
const snap = await queryOrCollectionRef.get();
const docs = snap.docs;
for (let i = 0; i < docs.length; i += 450) {
const batch = db.batch();
docs.slice(i, i + 450).forEach(d => batch.delete(d.ref));
await batch.commit();
}
}
async function deleteTableCascade(tableId) {
const tableRef = db.collection('tables').doc(tableId);
for (const sub of TABLE_SUBCOLLECTIONS) {
await deleteAllDocs(tableRef.collection(sub));
}
await tableRef.delete();
}
async function cleanupMasterOwnedData(uid) {
const foldersSnap = await db.collection('folders').where('createdBy', '==', uid).get();
for (const folderDoc of foldersSnap.docs) {
try {
const sheetsSnap = await db.collection('sheets')
.where('folderId', '==', folderDoc.id)
.where('masterId', '==', uid)
.get();
if (!sheetsSnap.empty) {
const batch = db.batch();
sheetsSnap.forEach(d => batch.update(d.ref, { folderId: null, folderName: null, masterId: null }));
await batch.commit();
}
} catch (err) {
console.error('Não foi possível desvincular fichas da pasta ' + folderDoc.id + ':', err);
}
await folderDoc.ref.delete();
}
const tablesSnap = await db.collection('tables').where('createdBy', '==', uid).get();
for (const tableDoc of tablesSnap.docs) {
await deleteTableCascade(tableDoc.id);
}
}
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
const profile = await getUserProfile(user.uid);
if (profile && profile.role === 'master') {
await cleanupMasterOwnedData(user.uid);
}
const sheetsSnap = await db.collection('sheets').where('ownerId', '==', user.uid).get();
if (!sheetsSnap.empty) {
const batch = db.batch();
sheetsSnap.forEach(doc => batch.delete(doc.ref));
await batch.commit();
}
await db.collection('users').doc(user.uid).delete();
await user.delete();
alert('Sua conta foi excluída com sucesso.');
location.href = 'index.html';
} catch (err) {
const wrongPass = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential';
alert('Erro ao excluir conta: ' + (wrongPass ? 'senha incorreta.' : err.message));
}
}
