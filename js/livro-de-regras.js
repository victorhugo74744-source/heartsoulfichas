(async function(){
let CH = [];
try {
const resp = await fetch('regras.json');
if(!resp.ok) throw new Error('regras.json: HTTP ' + resp.status);
CH = await resp.json();
} catch(err) {
console.error('Não foi possível carregar regras.json', err);
document.getElementById('content').innerHTML =
'<div class="chat-empty">Não foi possível carregar o livro de regras. Verifique sua conexão e recarregue a página.</div>';
return;
}
const RACE_ICON = '⚚';
const PARTS = [
{ label: 'Fundamentos das Regras', ids: ['mecanicas-gerais','atributos-pericias','sorte-inspiracao','furtividade'] },
{ label: 'Combate e Poder', ids: ['mecanicas-combate','estamina','mao-peso','tecnicas','tracos-conceito','tracos-catalogo','habilidades-criacao'] },
{ label: 'Progressão do Personagem', ids: ['energias-classes','niveis','experiencia','treinamento','pericias-criacao'] },
{ label: 'Vida na Campanha', ids: ['economia','descanso','sanidade','oficios'] },
{ label: 'Criação de Personagem', ids: ['antecedentes','racas'] },
{ label: 'O Mundo', ids: ['lore-mundo'] },
];
const PART_OF = {};
PARTS.forEach(p => p.ids.forEach(id => { PART_OF[id] = p.label; }));
const sidebarNav = document.getElementById('sidebarNav');
const content = document.getElementById('content');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const sidebar = document.getElementById('sidebar');
const scrim = document.getElementById('scrim');
const menuBtn = document.getElementById('menuBtn');
const topbarTitle = document.getElementById('topbarTitle');
const readingProgress = document.getElementById('readingProgress');
const backToTop = document.getElementById('backToTop');
function slugify(s){ return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function wordCount(arr){
let n = 0;
(arr||[]).forEach(p => { if(typeof p === 'string') n += (p.match(/\S+/g)||[]).length; });
return n;
}
function chapterWords(c){
let n = wordCount(c.paragraphs) + wordCount(c.intro);
(c.subsections||[]).forEach(s => {
n += wordCount(s.paragraphs);
if(s.desc) n += wordCount([s.desc]);
if(s.quote) n += wordCount([s.quote]);
});
(c.subsections_search||[]).forEach(s => { n += wordCount(s.paragraphs); });
return n;
}
function readMinutes(c){ return Math.max(1, Math.round(chapterWords(c) / 200)); }
function buildSidebar(){
sidebarNav.innerHTML = '';
let lastPart = null;
CH.forEach((c, i) => {
const part = PART_OF[c.id];
if(part && part !== lastPart){
const label = document.createElement('div');
label.className = 'nav-part-label';
label.textContent = part;
sidebarNav.appendChild(label);
lastPart = part;
}
const hasSub = !!c.subsections;
const group = document.createElement('div');
group.className = 'nav-group';
group.id = 'navgroup-' + c.id;
const row = document.createElement('div');
row.className = 'nav-chapter';
row.dataset.chapter = c.id;
row.innerHTML = `<span class="nav-num">${String(i+1).padStart(2,'0')}</span><span>${c.title}</span>${hasSub ? '<span class="nav-caret">▸</span>' : ''}`;
row.addEventListener('click', () => {
if(hasSub){
const wasExpanded = group.classList.contains('expanded');
document.querySelectorAll('.nav-group').forEach(g => g.classList.remove('expanded'));
if(!wasExpanded) group.classList.add('expanded');
}
navigate(c.id);
closeSidebarMobile();
});
group.appendChild(row);
if(hasSub){
const subWrap = document.createElement('div');
subWrap.className = 'nav-sub';
c.subsections.forEach(s => {
const item = document.createElement('div');
item.className = 'nav-sub-item';
item.dataset.chapter = c.id;
item.dataset.sub = s.id;
item.textContent = s.title;
item.addEventListener('click', (e) => {
e.stopPropagation();
navigate(c.id, s.id);
closeSidebarMobile();
});
subWrap.appendChild(item);
});
group.appendChild(subWrap);
}
sidebarNav.appendChild(group);
});
}
function closeSidebarMobile(){
sidebar.classList.remove('open');
scrim.classList.remove('show');
}
menuBtn && menuBtn.addEventListener('click', () => {
sidebar.classList.toggle('open');
scrim.classList.toggle('show');
});
scrim && scrim.addEventListener('click', closeSidebarMobile);
const appEl = document.querySelector('.app');
const sidebarToggle = document.getElementById('sidebarToggle');
if(localStorage.getItem('livroSidebarCollapsed') === '1'){ appEl.classList.add('collapsed'); }
sidebarToggle && sidebarToggle.addEventListener('click', () => {
const collapsed = appEl.classList.toggle('collapsed');
localStorage.setItem('livroSidebarCollapsed', collapsed ? '1' : '0');
sidebarToggle.querySelector('svg').style.transform = collapsed ? 'rotate(180deg)' : 'rotate(0deg)';
});
if(appEl.classList.contains('collapsed') && sidebarToggle){
sidebarToggle.querySelector('svg').style.transform = 'rotate(180deg)';
}
const FONT_STEPS = [0.88, 1, 1.12, 1.26, 1.4];
const storedFontStep = localStorage.getItem('livroFontStep');
let fontStepIdx = storedFontStep === null ? 1 : Number(storedFontStep);
if(!Number.isInteger(fontStepIdx) || fontStepIdx < 0 || fontStepIdx >= FONT_STEPS.length) fontStepIdx = 1;
function applyFontStep(){
document.documentElement.style.setProperty('--font-scale', FONT_STEPS[fontStepIdx]);
localStorage.setItem('livroFontStep', String(fontStepIdx));
}
applyFontStep();
document.getElementById('fontUp')?.addEventListener('click', () => {
fontStepIdx = Math.min(FONT_STEPS.length - 1, fontStepIdx + 1);
applyFontStep();
});
document.getElementById('fontDown')?.addEventListener('click', () => {
fontStepIdx = Math.max(0, fontStepIdx - 1);
applyFontStep();
});
document.getElementById('fontReset')?.addEventListener('click', () => {
fontStepIdx = 1;
applyFontStep();
});
function updateScrollUI(){
const doc = document.documentElement;
const scrollTop = window.scrollY || doc.scrollTop;
const height = doc.scrollHeight - doc.clientHeight;
const pct = height > 0 ? Math.min(100, (scrollTop / height) * 100) : 0;
if(readingProgress) readingProgress.style.width = pct + '%';
if(backToTop) backToTop.classList.toggle('show', scrollTop > 600);
}
window.addEventListener('scroll', updateScrollUI, { passive:true });
backToTop && backToTop.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
function setActiveNav(chapterId, subId){
document.querySelectorAll('.nav-chapter').forEach(el => el.classList.toggle('active', el.dataset.chapter === chapterId && !subId));
document.querySelectorAll('.nav-sub-item').forEach(el => el.classList.toggle('active', el.dataset.chapter === chapterId && el.dataset.sub === subId));
const group = document.getElementById('navgroup-' + chapterId);
if(group && subId){
document.querySelectorAll('.nav-group').forEach(g => g.classList.remove('expanded'));
group.classList.add('expanded');
const activeEl = group.querySelector('.nav-sub-item.active');
if(activeEl) activeEl.scrollIntoView({block:'nearest'});
}
}
function paraIsLabel(p){
return p.length < 60 && /[:：]$/.test(p.trim());
}
function ruleList(items){
return `<ul class="rule-list">${items.map(i => `<li>${mdBold(i)}</li>`).join('')}</ul>`;
}
function renderEntryParagraphs(paragraphs, headingsOut, nature){
let html = '';
const usedIds = new Set();
// Marcadores no JSON: "> Título: texto" = destaque; "- item" = lista (itens seguidos entram no destaque anterior, se houver);
// "~ texto" = parágrafo comum (evita que uma frase com ":" no meio seja lida como verbete "Nome: descrição")
const blocks = [];
paragraphs.forEach(p => {
const c = p.match(/^>\s+(.+)$/s), li = p.match(/^-\s+(.+)$/s), pl = p.match(/^~\s+(.+)$/s), last = blocks[blocks.length - 1];
if(pl){ blocks.push({ kind:'plain', text:pl[1] }); }
else if(c){ blocks.push({ kind:'callout', text:c[1], items:[] }); }
else if(li){
if(last && (last.kind === 'callout' || last.kind === 'list')) last.items.push(li[1]);
else blocks.push({ kind:'list', items:[li[1]] });
}
else blocks.push({ kind:'p', text:p });
});
blocks.forEach(b => {
if(b.kind === 'callout'){
const cm = b.text.match(/^([^:]{2,40}):\s+(.+)$/s);
html += `<aside class="callout">${cm ? `<div class="callout-title">${escapeHtml(cm[1])}</div>` : ''}<div class="callout-body">${mdBold(cm ? cm[2] : b.text)}</div>${b.items.length ? ruleList(b.items) : ''}</aside>`;
return;
}
if(b.kind === 'list'){ html += ruleList(b.items); return; }
if(b.kind === 'plain'){ html += `<p>${mdBold(b.text)}</p>`; return; }
const p = b.text;
const heading = p.match(/^##\s*(.+)$/) ||
(p.trim().length <= 60 && /^[A-ZÀ-Ý][\wÀ-ÿ'\-]*(?:\s+(?:(?:de|da|do|das|dos|e|em|a|o|ou|com|para|por|no|na|ao|à|às)\s+)?[A-ZÀ-Ý][\wÀ-ÿ'\-]*){0,5}$/.test(p.trim())
? [null, p.trim()] : null);
const m = p.match(/^([A-ZÀ-Ý][^():]{2,60}?)\s*\((Custo|Custo aproximado)[:\s]*([^)]*)\)\s*[:\-–]?\s*(.*)$/s);
const n = p.match(/^([A-ZÀ-Ý][^():]{1,40}?(?:\s*\([^()]{1,60}\))?)\s*:\s+(.+)$/s) ||
p.match(/^(Resultado\s+\d+\s*[-–—]\s*\d+\s*[—–-]\s*[A-ZÀ-Ý][^:()]{1,60})\s*:\s+(.+)$/s);
if(heading){
const text = heading[1].trim();
let id = 'h-' + slugify(text);
let uniq = id, i2 = 2;
while(usedIds.has(uniq)){ uniq = id + '-' + (i2++); }
usedIds.add(uniq);
if(headingsOut) headingsOut.push({ id: uniq, text });
html += `<h4 class="mini-heading" id="${uniq}">${escapeHtml(text)}</h4>`;
} else if(m){
const [, name, , cost, rest] = m;
html += `<div class="entry cost${nature ? ' ' + nature : ''}"><span class="entry-name">${escapeHtml(name.trim())}</span><span class="entry-cost">${escapeHtml(cost.trim())}</span><div class="entry-body">${mdBold(rest.trim())}</div></div>`;
} else if(paraIsLabel(p)){
html += `<p class="label-line">${mdBold(p)}</p>`;
} else if(n){
const [, name, rest] = n;
html += `<div class="entry${nature ? ' ' + nature : ''}"><span class="entry-name">${escapeHtml(name.trim())}</span><div class="entry-body">${mdBold(rest.trim())}</div></div>`;
} else {
html += `<p>${mdBold(p)}</p>`;
}
});
return html;
}
function renderAntecedenteCard(s){
const meta = [
['Estilo de jogo', s.estilo],
['Vantagens', s.vantagens],
['Desvantagens', s.desvantagens],
['Atributos', s.atributos],
].filter(([,v]) => v);
const metaHtml = meta.map(([k,v]) => `<div class="ante-meta-item"><div class="mk">${escapeHtml(k)}</div><div class="mv">${escapeHtml(v)}</div></div>`).join('');
const skillsHtml = (s.skills||[]).map(sk => `<span class="ante-skill-chip">${escapeHtml(sk)}</span>`).join('');
return `<div class="ante-card" id="sub-${s.id}">
<div class="ante-head"><span class="ante-icon">${escapeHtml(s.icon||'📜')}</span><h3>${escapeHtml(s.title)}</h3></div>
<p class="ante-desc">${mdBold(s.desc||'')}</p>
${s.quote ? `<p class="ante-quote">“${mdBold(s.quote)}”</p>` : ''}
<div class="ante-meta">${metaHtml}</div>
<div class="ante-skills-label">Perícias disponíveis</div>
<div class="ante-skills">${skillsHtml}</div>
</div>`;
}
function renderDeityCard(d, kind){
const prefix = kind === 'divine' ? 'deus' : 'demonio';
return `<div class="deity-card ${kind}" data-accordion id="sub-${prefix}-${d.id}">
<div class="deity-card-head" data-toggle>
<span class="deity-icon">${escapeHtml(d.icon)}</span>
<div class="deity-name-wrap">
<div class="deity-name">${escapeHtml(d.name)}</div>
<div class="deity-epithet">${escapeHtml(d.epithet)}</div>
</div>
<span class="deity-caret">▾</span>
</div>
<div class="deity-card-body"><div><p>${mdBold(d.desc)}</p></div></div>
</div>`;
}
function renderKingdomCard(k){
const sectionsHtml = k.sections.map(s =>
`<div class="kingdom-section"><div class="ks-label">${escapeHtml(s.label)}</div>${s.paragraphs.map(p => `<p>${mdBold(p)}</p>`).join('')}</div>`
).join('');
return `<div class="kingdom-card" data-accordion id="sub-${k.id}">
<div class="kingdom-card-head" data-toggle>
<span class="kingdom-icon">${escapeHtml(k.icon)}</span>
<div class="kingdom-name-wrap">
<div class="kingdom-name">${escapeHtml(k.name)}</div>
<div class="kingdom-epithet">${escapeHtml(k.epithet)}</div>
</div>
<span class="deity-caret">▾</span>
</div>
<div class="kingdom-card-body"><div>${sectionsHtml}</div></div>
</div>`;
}
function renderLoreChapter(chapter){
let html = '';
// A introdução (chapter.intro) já é desenhada por renderChapter, acima do corpo; repetir aqui duplicava o texto do Panteão.
html += `<div class="subsection-title" id="sub-panteao-deuses">🌟 Os Doze Deuses da Alma</div>`;
if(chapter.pantheon.gods_intro) html += renderEntryParagraphs(chapter.pantheon.gods_intro);
html += `<div class="deity-grid">${chapter.pantheon.gods.map(g => renderDeityCard(g,'divine')).join('')}</div>`;
html += `<div class="subsection-title" id="sub-panteao-demonios">💀 Os Doze Demônios do Coração</div>`;
if(chapter.pantheon.demons_intro) html += renderEntryParagraphs(chapter.pantheon.demons_intro);
html += `<div class="deity-grid">${chapter.pantheon.demons.map(d => renderDeityCard(d,'infernal')).join('')}</div>`;
chapter.continents.forEach(c => {
html += `<div class="lore-continent-head" id="sub-continente-${c.id}"><span class="lc-icon">${escapeHtml(c.icon)}</span> ${escapeHtml(c.name)} <span class="lc-epithet">— ${escapeHtml(c.epithet)}</span></div>`;
if(c.intro && c.intro.length) html += renderEntryParagraphs(c.intro);
html += `<div class="kingdom-grid">${c.kingdoms.map(k => renderKingdomCard(k)).join('')}</div>`;
});
return html;
}
function escapeHtml(s){
return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function mdBold(s){
return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*\*/g, '');
}
function chapterMeta(chapterId){
const idx = CH.findIndex(c => c.id === chapterId);
return { chapter: CH[idx], idx };
}
function renderHome(){
document.title = 'Heartsoul — Sistema de RPG';
topbarTitle.textContent = 'Heartsoul';
setActiveNav(null, null);
function cardFor(c){
const i = CH.indexOf(c);
const desc = c.subtitle || (c.paragraphs && c.paragraphs[0] ? c.paragraphs[0].slice(0,90)+'…' : (c.intro && c.intro[0] ? c.intro[0].slice(0,90)+'…' : ''));
return `<div class="chapter-card" data-nav="${c.id}">
<div class="cc-num">${String(i+1).padStart(2,'0')} ${c.subsections ? '· '+c.subsections.length+' entradas' : ''} · ${readMinutes(c)} min</div>
<h3>${escapeHtml(c.title)}</h3>
<p>${mdBold(desc)}</p>
</div>`;
}
let partsHtml = '';
const seen = new Set();
PARTS.forEach(part => {
const chapters = part.ids.map(id => CH.find(c => c.id === id)).filter(Boolean);
if(!chapters.length) return;
chapters.forEach(c => seen.add(c.id));
partsHtml += `<div class="home-part">
<div class="home-part-head"><span class="home-part-line"></span><h2>${escapeHtml(part.label)}</h2><span class="home-part-line"></span></div>
<div class="chapter-grid">${chapters.map(cardFor).join('')}</div>
</div>`;
});
const leftover = CH.filter(c => !seen.has(c.id));
if(leftover.length){
partsHtml += `<div class="home-part">
<div class="home-part-head"><span class="home-part-line"></span><h2>Outros</h2><span class="home-part-line"></span></div>
<div class="chapter-grid">${leftover.map(cardFor).join('')}</div>
</div>`;
}
content.innerHTML = `
<div class="hero">
${sealSVG()}
<h1>HEARTSOUL</h1>
<p class="tagline">Sua alma escolhe o caminho<span class="sep">·</span>seu coração os meios</p>
<div class="hero-divider"><span class="line"></span>${diamondSVG()}<span class="line"></span></div>
<div class="stats-row">
<div class="stat"><b>${CH.length}</b><span>Capítulos</span></div>
<div class="stat"><b>20</b><span>Raças</span></div>
<div class="stat"><b>${(CH.find(c=>c.id==='antecedentes')||{subsections:[]}).subsections.length}</b><span>Antecedentes</span></div>
<div class="stat"><b>${(CH.find(c=>c.id==='tracos-catalogo')||{subsections:[]}).subsections.length}</b><span>Categorias de Traços</span></div>
<div class="stat"><b>150+</b><span>Traços catalogados</span></div>
</div>
</div>
${partsHtml}
`;
content.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => navigate(el.dataset.nav)));
window.scrollTo(0,0);
updateScrollUI();
}
function renderChapter(chapterId, subId){
const { chapter, idx } = chapterMeta(chapterId);
if(!chapter){ renderHome(); return; }
document.title = chapter.title + ' — Heartsoul';
topbarTitle.textContent = chapter.title;
setActiveNav(chapterId, subId);
const subList = chapter.subsections || chapter.subsections_search;
const subTitle = subId && subList ? (subList.find(s=>s.id===subId)||{}).title||'' : '';
let html = `<div class="crumb"><a data-nav-home>Heartsoul</a> / ${escapeHtml(chapter.title)}${subTitle ? ' / ' + escapeHtml(subTitle) : ''}</div>`;
html += `<div class="chapter-header">
<div class="chapter-number">Capítulo ${String(idx+1).padStart(2,'0')} · ~${readMinutes(chapter)} min de leitura</div>
<h1>${escapeHtml(chapter.title)}</h1>
${chapter.subtitle ? `<div class="subtitle">${escapeHtml(chapter.subtitle)}</div>` : ''}
</div>`;
html += `<div class="prose">`;
const pageHeadings = [];
if(chapter.intro && chapter.intro.length){
html += renderEntryParagraphs(chapter.intro, pageHeadings);
}
let bodyHtml = '';
if(chapter.id === 'lore-mundo'){
bodyHtml += renderLoreChapter(chapter);
} else if(chapter.id === 'antecedentes' && chapter.subsections){
bodyHtml += `<div class="race-subnav">${chapter.subsections.map(s => `<span class="race-chip${s.id===subId?' active':''}" data-jump="${s.id}">${escapeHtml(s.title)}</span>`).join('')}</div>`;
chapter.subsections.forEach(s => { bodyHtml += renderAntecedenteCard(s); });
} else if(chapter.subsections){
const isRaces = chapter.id === 'racas';
bodyHtml += `<div class="race-subnav">${chapter.subsections.map(s => `<span class="race-chip${s.id===subId?' active':''}" data-jump="${s.id}">${isRaces?'':''}${escapeHtml(s.title)}</span>`).join('')}</div>`;
chapter.subsections.forEach(s => {
const isBenign = /benign/i.test(s.title);
const isMalign = /malign/i.test(s.title);
let tag = '';
if(isBenign) tag = '<span class="tag benign">Benigno</span>';
if(isMalign) tag = '<span class="tag malign">Maligno</span>';
bodyHtml += `<div class="subsection-title" id="sub-${s.id}">${escapeHtml(s.title)} ${tag}</div>`;
bodyHtml += renderEntryParagraphs(s.paragraphs, pageHeadings, isBenign ? 'benign' : (isMalign ? 'malign' : ''));
});
} else {
bodyHtml += renderEntryParagraphs(chapter.paragraphs || [], pageHeadings);
}
if(pageHeadings.length >= 3){
html += `<div class="page-toc"><div class="page-toc-label">Nesta página</div><div class="page-toc-list">${
pageHeadings.map(h => `<a data-jump-anchor="${h.id}">${escapeHtml(h.text)}</a>`).join('')
}</div></div>`;
}
html += bodyHtml;
html += `</div>`;
const prev = CH[idx-1];
const next = CH[idx+1];
html += `<div class="chapter-nav-footer">
${prev ? `<div class="nav-footer-btn prev" data-nav="${prev.id}"><div class="fk">← Anterior</div><div class="ft">${escapeHtml(prev.title)}</div></div>` : `<div></div>`}
${next ? `<div class="nav-footer-btn next" data-nav="${next.id}"><div class="fk">Próximo →</div><div class="ft">${escapeHtml(next.title)}</div></div>` : `<div></div>`}
</div>`;
content.innerHTML = html;
content.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => navigate(el.dataset.nav)));
content.querySelector('[data-nav-home]')?.addEventListener('click', () => navigate(null));
content.querySelectorAll('[data-jump]').forEach(el => el.addEventListener('click', () => {
navigate(chapterId, el.dataset.jump, true);
}));
content.querySelectorAll('[data-jump-anchor]').forEach(el => el.addEventListener('click', () => {
document.getElementById(el.dataset.jumpAnchor)?.scrollIntoView({ behavior:'smooth', block:'start' });
}));
content.querySelectorAll('[data-toggle]').forEach(el => el.addEventListener('click', () => {
el.closest('[data-accordion]').classList.toggle('expanded');
}));
if(subId){
const target = document.getElementById('sub-' + subId);
if(target){
if(target.hasAttribute('data-accordion')) target.classList.add('expanded');
target.scrollIntoView({behavior:'smooth', block:'start'});
}
} else {
window.scrollTo(0,0);
}
updateScrollUI();
}
function navigate(chapterId, subId, skipHash){
if(!chapterId){
location.hash = '';
renderHome();
return;
}
const hash = '#/' + chapterId + (subId ? '/' + subId : '');
if(location.hash !== hash) location.hash = hash;
else renderChapter(chapterId, subId);
}
function routeFromHash(){
const h = location.hash.replace(/^#\/?/, '');
if(!h){ renderHome(); return; }
const [chapterId, subId] = h.split('/');
renderChapter(chapterId, subId);
}
window.addEventListener('hashchange', routeFromHash);
let searchTimer;
let activeHitIndex = -1;
searchInput.addEventListener('input', () => {
searchClear.classList.toggle('show', searchInput.value.length > 0);
clearTimeout(searchTimer);
searchTimer = setTimeout(doSearch, 120);
});
searchClear.addEventListener('click', () => {
searchInput.value = '';
searchClear.classList.remove('show');
buildSidebar();
searchInput.focus();
});
searchInput.addEventListener('keydown', (e) => {
const hitEls = () => Array.from(sidebarNav.querySelectorAll('.search-hit'));
if(e.key === 'Escape'){
if(searchInput.value){ searchInput.value=''; searchClear.classList.remove('show'); buildSidebar(); }
else searchInput.blur();
return;
}
if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
const els = hitEls();
if(!els.length) return;
e.preventDefault();
els.forEach(el => el.classList.remove('kbd-active'));
activeHitIndex += (e.key === 'ArrowDown' ? 1 : -1);
if(activeHitIndex < 0) activeHitIndex = els.length - 1;
if(activeHitIndex >= els.length) activeHitIndex = 0;
els[activeHitIndex].classList.add('kbd-active');
els[activeHitIndex].scrollIntoView({ block:'nearest' });
} else if(e.key === 'Enter'){
const els = hitEls();
if(!els.length) return;
e.preventDefault();
(els[activeHitIndex] || els[0]).click();
}
});
window.addEventListener('keydown', (e) => {
if(e.key === '/' && document.activeElement !== searchInput && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){
e.preventDefault();
searchInput.focus();
}
});
function doSearch(){
activeHitIndex = -1;
const tokens = searchInput.value.trim().toLowerCase().split(/\s+/).filter(t => t.length >= 2);
if(tokens.length === 0){ buildSidebar(); return; }
function matchesAll(textLower){
return tokens.every(t => textLower.includes(t));
}
const hits = [];
CH.forEach(c => {
let scanList = c.subsections ? c.subsections : (c.subsections_search ? c.subsections_search : [{id:null, title:null, paragraphs:c.paragraphs||[]}]);
if(c.intro && c.intro.length){
scanList = [{ id:null, title:null, paragraphs:c.intro }, ...scanList];
}
if(matchesAll(c.title.toLowerCase())){
hits.push({ chapterId: c.id, subId: null, chapterTitle: c.title, snippet: markTokens(escapeHtml(c.title), tokens), isTitle:true });
}
scanList.forEach(block => {
if(block.title && matchesAll(block.title.toLowerCase())){
hits.push({ chapterId: c.id, subId: block.id, chapterTitle: c.title, snippet: markTokens(escapeHtml(block.title), tokens), isTitle:true });
}
(block.paragraphs||[]).forEach(p => {
p = p.replace(/^(?:>|-|~)\s+/, '');
const pLower = p.toLowerCase();
if(matchesAll(pLower)){
const firstIdx = pLower.indexOf(tokens[0]);
hits.push({
chapterId: c.id, subId: block.id, chapterTitle: c.title,
snippet: makeSnippet(p, firstIdx === -1 ? 0 : firstIdx, tokens[0].length, tokens)
});
}
});
});
});
sidebarNav.innerHTML = '';
const wrap = document.createElement('div');
wrap.className = 'search-results';
if(hits.length === 0){
wrap.innerHTML = `<div class="no-results">Nenhum resultado para "${escapeHtml(searchInput.value)}"</div>`;
} else {
const shown = hits.slice(0, 80);
wrap.innerHTML = `<div class="search-meta">${hits.length} resultado${hits.length===1?'':'s'} para "${escapeHtml(searchInput.value.trim())}"</div>`;
let lastChapter = null;
shown.forEach(h => {
if(h.chapterId !== lastChapter){
const groupLabel = document.createElement('div');
groupLabel.className = 'search-group-label';
groupLabel.textContent = h.chapterTitle;
wrap.appendChild(groupLabel);
lastChapter = h.chapterId;
}
const el = document.createElement('div');
el.className = 'search-hit';
el.innerHTML = `<div class="sh-snip">${h.snippet}</div>`;
el.addEventListener('click', () => { navigate(h.chapterId, h.subId); closeSidebarMobile(); });
wrap.appendChild(el);
});
if(hits.length > shown.length){
const hint = document.createElement('div');
hint.className = 'search-hint';
hint.textContent = `Mostrando os ${shown.length} primeiros — refine a busca para ver mais.`;
wrap.appendChild(hint);
}
}
sidebarNav.appendChild(wrap);
}
function markTokens(escapedText, tokens){
let out = escapedText;
tokens.forEach(t => {
const re = new RegExp('(' + escapeRegex(t) + ')', 'ig');
out = out.replace(re, '<mark>$1</mark>');
});
return out;
}
function makeSnippet(text, idx, len, tokens){
const start = Math.max(0, idx - 40);
const end = Math.min(text.length, idx + len + 60);
let snip = (start>0?'…':'') + text.slice(start,end) + (end<text.length?'…':'');
let marked = markTokens(escapeHtml(snip), tokens || []);
return marked.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*\*/g, '');
}
function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function sealSVG(){
return `<svg class="hero-seal" width="120" height="120" viewBox="0 0 120 120" fill="none">
<circle cx="60" cy="60" r="54" stroke="#C9A15C" stroke-width="1" opacity="0.5"/>
<circle cx="60" cy="60" r="44" stroke="#9C2B2B" stroke-width="1" opacity="0.6"/>
<circle cx="60" cy="60" r="4" fill="#C9A15C"/>
<g stroke="#C9A15C" stroke-width="1" opacity="0.7">
<path d="M60 16 L60 34"/><path d="M60 86 L60 104"/>
<path d="M16 60 L34 60"/><path d="M86 60 L104 60"/>
<path d="M27 27 L38 38"/><path d="M82 82 L93 93"/>
<path d="M93 27 L82 38"/><path d="M38 82 L27 93"/>
</g>
<path d="M60 24 L84 60 L60 96 L36 60 Z" stroke="#9C2B2B" stroke-width="1" opacity="0.55" fill="none"/>
</svg>`;
}
function diamondSVG(){
return `<svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0L10 5L5 10L0 5Z" fill="#9C2B2B"/></svg>`;
}
buildSidebar();
routeFromHash();
})();
