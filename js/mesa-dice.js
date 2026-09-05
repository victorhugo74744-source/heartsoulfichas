// ============================================================
// Dados: aplicar rolagem no HP de um alvo, rolagem rápida da mesa (parser de comandos), log de rolagens em tempo real.
// Parte de mesa.js (dividido para facilitar manutenção).
// Depende de variáveis/funções globais definidas em mesa-board.js
// — carregar SEMPRE depois dele, na ordem dos <script> do mesa.html.
// ============================================================

// -------------------------------------------------------------- DADOS --
// Mesmo parser de comandos do js/dice.js (d20, 2d6+3, 2#d20, 4#d6kl2...),
// só que reduzido e desenhado pra caber no painel lateral da mesa.
// As rolagens em si são salvas em tables/{id}/rolls e sincronizadas em
// tempo real (onSnapshot) — é assim que todo mundo na mesa vê os dados de
// todo mundo, e não só os próprios. Uma rolagem marcada como "oculta" só
// aparece pra quem rolou e para o Mestre (as regras do Firestore já
// filtram isso no servidor — os outros jogadores nem recebem o documento).
// ---------- HP por parte do corpo (alvo de ataque/cura na rolagem) --------
// Mesmas 6 partes usadas na ficha (js/editor.js: BODY_PARTS). Cada token
// guarda seu próprio "hp" (independente da ficha, pra funcionar também com
// NPCs avulsos que não têm ficha nenhuma) — inicializado a partir da ficha
// quando o jogador entra na mesa, ou com um valor padrão para NPCs.
const BODY_PARTS_TABLE = [
  ['cabeca', 'Cabeça'], ['tronco', 'Tronco'],
  ['braco_esq', 'Braço Esquerdo'], ['braco_dir', 'Braço Direito'],
  ['perna_esq', 'Perna Esquerda'], ['perna_dir', 'Perna Direita']
];
const BODY_PART_LABEL = Object.fromEntries(BODY_PARTS_TABLE);
const DEFAULT_PART_HP = 10; // usado só para NPCs avulsos (sem ficha própria); editável na lista de tokens

function defaultTokenHp() {
  const hp = {};
  BODY_PARTS_TABLE.forEach(([k]) => { hp[k] = { max: DEFAULT_PART_HP, cur: DEFAULT_PART_HP }; });
  return hp;
}

// Clona só os valores numéricos (max/cur) do HP de uma ficha, ignorando
// qualquer outra chave — pra não arrastar lixo pro documento do token.
function hpFromSheetResources(resources) {
  if (!resources || !resources.hp) return defaultTokenHp();
  const hp = {};
  BODY_PARTS_TABLE.forEach(([k]) => {
    const part = resources.hp[k];
    hp[k] = { max: (part && part.max) || 0, cur: (part && part.cur) || 0 };
  });
  return hp;
}

// Popula o seletor de alvo do painel de Dados com os tokens presentes na
// cena atual (mesma regra de visibilidade usada na lista "Fichas na mesa").
// Cor por faixa de HP restante (verde/amarelo/vermelho) — mesma escala usada
// tanto na barrinha por parte do corpo do painel "🎯 Inspecionar" quanto em
// qualquer outro lugar que precise colorir uma fração de vida.
function hpFractionColor(pct) {
  return pct > 60 ? '#7fb27a' : (pct > 25 ? '#d8b45c' : '#c9564f');
}

// HP de cada parte do corpo em % restante (0–100) — usado pelo painel
// "🎯 Inspecionar" (ver renderTokenInspectPanel em mesa-tokens.js) no lugar
// do número total de HP: um jogador mirando um alvo vê o desgaste de cada
// parte (ex.: "Cabeça 80%"), não o valor bruto cur/max. Partes sem HP
// configurado (max = 0) entram com pct=null, pra a tela pular a barra e só
// mostrar "—".
function tokenPartsHpPercent(tok) {
  const hp = tok.hp || {};
  return BODY_PARTS_TABLE.map(([k, label]) => {
    const p = hp[k] || { cur: 0, max: 0 };
    const max = p.max || 0;
    const pct = max ? Math.max(0, Math.min(100, Math.round(((p.cur || 0) / max) * 100))) : null;
    return { key: k, label, pct };
  });
}

// Quando a cena ainda não tem nenhum token, a caixa "Aplicar em um alvo"
// (select + partes do corpo) some e dá lugar a uma dica curta — no início
// de toda mesa nova (ou numa cena só de exploração, sem combate) esse bloco
// inteiro ficava ocupando espaço vertical só pra mostrar "sem alvo", que já
// é o comportamento padrão de qualquer jeito.
function renderDiceTargetOptions() {
  const select = document.getElementById('diceTargetSelect');
  const targetRow = document.getElementById('diceTargetRow');
  const emptyHint = document.getElementById('diceTargetEmpty');
  if (!select) return;
  const prevValue = select.value;
  const tokens = Object.values(liveTokens).filter(t => isTokenInActiveScene(t) && !t.prop);

  if (!tokens.length) {
    if (targetRow) targetRow.classList.add('hidden');
    if (emptyHint) emptyHint.classList.remove('hidden');
    select.innerHTML = '<option value="">— sem alvo (rolagem livre) —</option>';
    select.value = '';
    updateDiceTargetUiState();
    return;
  }
  if (targetRow) targetRow.classList.remove('hidden');
  if (emptyHint) emptyHint.classList.add('hidden');

  const options = tokens.map(t => `<option value="${t.id}">${escapeHtml(t.name || 'Token')}</option>`).join('');
  select.innerHTML = `<option value="">— sem alvo (rolagem livre) —</option>${options}`;
  if (prevValue && tokens.some(t => t.id === prevValue)) select.value = prevValue;
  updateDiceTargetUiState();
}

// Lê a ação marcada no toggle segmentado "⚔️ Dano / ❤️ Curar" (substituiu
// o antigo <select> — ver comentário na CSS do dice-action-toggle).
function getSelectedDiceAction() {
  const checked = document.querySelector('#diceActionToggle input[name="diceAction"]:checked');
  return checked ? checked.value : 'damage';
}

// Lê quais partes do corpo estão marcadas no grupo de checkboxes (multi-
// seleção — substitui o antigo <select> de parte única).
function getCheckedBodyParts() {
  return Array.from(document.querySelectorAll('#diceBodyPartChecks input[type=checkbox]:checked'))
    .map(cb => cb.value);
}

// Mostra/esconde os seletores de parte do corpo e ação conforme haver ou
// não um alvo escolhido. (A exibição do HP do alvo aqui foi removida —
// o painel "🎯 Inspecionar" já mostra o HP por parte do corpo.)
function updateDiceTargetUiState() {
  const targetSel = document.getElementById('diceTargetSelect');
  const partRow = document.getElementById('dicePartRow');
  if (!targetSel || !partRow) return;
  const targetId = targetSel.value;
  if (!targetId) {
    partRow.classList.add('hidden');
    return;
  }
  partRow.classList.remove('hidden');
}

// Aplica o total de uma rolagem como dano ou cura em uma ou mais partes do
// corpo marcadas do token-alvo (mesmo total em cada parte marcada). Usa uma
// transação (só no documento do token) pra não perder rolagens simultâneas
// de jogadores diferentes contra o mesmo alvo.
//
// IMPORTANTE: a transação NÃO lê o documento da ficha (sheets/{id}) do
// alvo. As regras do Firestore só deixam um jogador LER a ficha de outra
// pessoa se ele for o dono dela ou o Mestre daquela campanha — então, se
// essa leitura estivesse dentro da transação, ela falhava
// (permission-denied) sempre que um jogador aplicasse dano/cura no token
// de outro jogador, e a transação inteira era desfeita (nem o HP do token
// chegava a ser salvo). O campo "hp" do token, e o espelho em
// "resources.hp" da ficha, já são liberados para escrita por QUALQUER
// pessoa logada — só a leitura prévia da ficha alheia é que não era
// liberada. A correção é a mesma já usada em setTokenHpPart (edição manual
// de HP, mais acima): escreve direto no token, e espelha na ficha com um
// .update() cego (sem ler antes) via syncTokenHpToSheet.
async function applyRollToBodyPart(tokenId, partKeys, action, amount) {
  const ref = db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId);
  try {
    const applied = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return null;
      const data = snap.data();
      const hp = Object.assign({}, defaultTokenHp(), data.hp || {});
      const results = partKeys.map(partKey => {
        const part = hp[partKey] || { max: 0, cur: 0 };
        const before = part.cur;
        const after = action === 'heal'
          ? Math.min(part.max, before + amount)
          : Math.max(0, before - amount);
        hp[partKey] = { max: part.max, cur: after };
        return { partKey, before, after, max: part.max };
      });
      tx.update(ref, { hp, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      return { targetName: data.name || 'Token', results, hp, sheetId: data.sheetId || null };
    });
    if (applied && applied.sheetId) {
      // Best-effort: se isto falhar (ex.: ficha foi excluída), o HP do
      // token já foi salvo acima e o jogo continua normalmente; só o
      // espelho na Ficha que não vai atualizar.
      await syncTokenHpToSheet(applied.sheetId, applied.hp);
    }
    return applied;
  } catch (err) {
    console.error('Erro ao aplicar dano/cura no HP do alvo:', err);
    return null;
  }
}

// Espelha o HP do token (já no formato {parte: {max,cur}}, idêntico ao
// resources.hp da ficha) de volta no documento da ficha em sheets/{id} —
// só quando o token pertence a uma ficha de jogador (tem sheetId; NPCs
// avulsos não têm ficha pra sincronizar). Assim, dano/cura sofridos na
// mesa aparecem também na Ficha (ficha-editor.html e ficha-view.html),
// sem precisar o jogador copiar o valor manualmente depois da sessão.
async function syncTokenHpToSheet(sheetId, hp) {
  if (!sheetId) return;
  try {
    await db.collection('sheets').doc(sheetId)
      .update({ 'resources.hp': hp, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  } catch (err) {
    console.warn('Não foi possível sincronizar o HP com a ficha:', err);
  }
}

const TABLE_QUICK_DICE = [4, 6, 8, 10, 12, 20, 100];
let tableRollHistory = [];

function tableRollDie(sides) { return 1 + Math.floor(Math.random() * sides); }
const TABLE_DICE_HELP = 'Exemplos: d20, 2d6+3, 2#d20, 4#d6kl2.';

function parseTableRollCommand(raw) {
  const cmd = (raw || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!cmd) return { error: 'Digite um comando de rolagem.' };
  if (cmd.includes('#')) return parseTableAdvantage(cmd, raw);
  return parseTableSum(cmd, raw);
}

function parseTableAdvantage(cmd, raw) {
  const m = cmd.match(/^(\d*)#d(\d+)(k[hl])?(\d*)([+-]\d+)?$/);
  if (!m) return { error: `Não entendi "${raw}". ${TABLE_DICE_HELP}` };
  const [, nStr, xStr, keepMode, keepNStr, modStr] = m;
  const sides = parseInt(xStr, 10);
  if (!sides || sides < 2 || sides > 1000) return { error: 'Escolha um dado entre d2 e d1000.' };
  let n = nStr ? parseInt(nStr, 10) : 2;
  n = Math.max(2, Math.min(30, n));
  const mod = modStr ? parseInt(modStr, 10) : 0;
  const rolls = Array.from({ length: n }, () => tableRollDie(sides));
  let keepN = keepNStr ? parseInt(keepNStr, 10) : 1;
  keepN = Math.max(1, Math.min(n, keepN));
  const mode = keepMode === 'kl' ? 'kl' : 'kh';
  const sorted = rolls.map((v, i) => ({ v, i })).sort((a, b) => mode === 'kl' ? a.v - b.v : b.v - a.v);
  const keptIdx = new Set(sorted.slice(0, keepN).map(o => o.i));
  const kept = rolls.filter((_, i) => keptIdx.has(i));
  const total = kept.reduce((a, b) => a + b, 0) + mod;
  let label = `${n}#d${sides}${mode}${keepN}`;
  if (mod) label += (mod > 0 ? `+${mod}` : `${mod}`);
  const shown = rolls.map((v, i) => keptIdx.has(i) ? `<b style="color:var(--gold-dim)">${v}</b>` : v).join(', ');
  const detail = `[${shown}]${mode === 'kl' ? ' · desvantagem' : (keepN === 1 && n === 2 ? ' · vantagem' : ' · melhor de ' + n)}`;
  const isNat20 = sides === 20 && mode === 'kh' && keepN === 1 && kept[0] === 20;
  const isNat1 = sides === 20 && mode === 'kl' && keepN === 1 && kept[0] === 1;
  return { ok: true, label, detail, total, isNat20, isNat1 };
}

function parseTableSum(cmd, raw) {
  const termRe = /([+-]?)(\d*d\d+|\d+)/gi;
  const terms = [];
  let idx = 0, match;
  while ((match = termRe.exec(cmd)) !== null) {
    if (match.index !== idx) return { error: `Não entendi "${raw}". ${TABLE_DICE_HELP}` };
    idx = termRe.lastIndex;
    terms.push({ sign: match[1] === '-' ? -1 : 1, text: match[2] });
  }
  if (idx !== cmd.length || terms.length === 0) return { error: `Não entendi "${raw}". ${TABLE_DICE_HELP}` };

  let total = 0, diceCount = 0;
  const parts = [];
  for (const term of terms) {
    const dMatch = term.text.match(/^(\d*)d(\d+)$/);
    if (dMatch) {
      let n = dMatch[1] ? parseInt(dMatch[1], 10) : 1;
      n = Math.max(1, Math.min(30, n));
      const sides = parseInt(dMatch[2], 10);
      if (!sides || sides < 2 || sides > 1000) return { error: 'Escolha dados entre d2 e d1000.' };
      diceCount += n;
      if (diceCount > 50) return { error: 'Muitos dados na mesma rolagem — no máximo 50 ao todo.' };
      const rolls = Array.from({ length: n }, () => tableRollDie(sides));
      const sum = rolls.reduce((a, b) => a + b, 0);
      total += term.sign * sum;
      parts.push({ type: 'dice', sign: term.sign, n, sides, rolls, sum });
    } else {
      const value = parseInt(term.text, 10);
      total += term.sign * value;
      parts.push({ type: 'mod', sign: term.sign, value });
    }
  }
  if (diceCount === 0) return { error: 'Inclua ao menos um dado na rolagem, ex: 1d20+3.' };

  const label = terms.map((t, i) => (i === 0 ? (t.sign < 0 ? '-' : '') : (t.sign < 0 ? ' - ' : ' + ')) + t.text).join('');
  const detail = parts.map(p => p.type === 'dice'
    ? `${p.sign < 0 ? '-' : ''}${p.n}d${p.sides}[${p.rolls.join(', ')}]`
    : (p.sign < 0 ? '-' : '+') + p.value
  ).join('  ');

  const isSingleD20 = parts.length === 1 && parts[0].type === 'dice' && parts[0].n === 1 && parts[0].sides === 20 && parts[0].sign === 1;
  const isNat20 = isSingleD20 && parts[0].rolls[0] === 20;
  const isNat1 = isSingleD20 && parts[0].rolls[0] === 1;
  return { ok: true, label, detail, total, isNat20, isNat1 };
}

function renderTableDiceQuickRow() {
  const el = document.getElementById('diceQuickRow');
  el.innerHTML = TABLE_QUICK_DICE.map(f => `<button type="button" data-quick="d${f}">d${f}</button>`).join('') +
    `<button type="button" data-quick="2#d20">Vant.</button>` +
    `<button type="button" data-quick="2#d20kl">Desv.</button>`;
  el.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('diceCmdInput').value = btn.dataset.quick;
      document.getElementById('diceCmdInput').focus();
    });
  });
}

// As regras do Firestore (firestore.rules) só liberam a leitura de uma
// rolagem "oculta" pra quem a fez ou pro Mestre — e o campo "hidden"/"by"
// não faz parte da própria consulta original (só um orderBy+limit simples).
// Isso é um detalhe importante do Firestore: em consultas de LISTA (não um
// get() de um doc só), a regra de segurança precisa poder ser comprovada
// só pelas cláusulas where() da consulta — ele NÃO busca os documentos e
// filtra depois. Se a regra depende de um campo do documento que a query
// não restringe com um where() equivalente, a consulta inteira é negada
// (permission-denied) pra quem não é Mestre — é por isso que os jogadores
// não viam nada no histórico, nem as rolagens públicas.
// Solução: pra quem não é Mestre, dividir em duas consultas que o Firestore
// CONSEGUE comprovar sozinhas — "hidden == false" (rolagens públicas de
// todo mundo) e "by == meu uid" (minhas próprias rolagens, incluindo as
// que eu ocultei) — e juntar os dois resultados no cliente. O Mestre
// continua com a consulta única de sempre, já que "isMaster()" na regra
// não depende do documento, então o Firestore já consegue comprovar aquela
// sozinha.
let rollsPublicMap = {};
let rollsMineMap = {};

// Guarda os ids de rolagem já vistos, pra distinguir "rolagem nova de
// verdade" (dispara a animação) de "veio de novo no snapshot" (reconexão,
// outro campo do mesmo doc mudou, etc.) e também do histórico carregado ao
// entrar na mesa — senão, ao abrir a mesa com 50 rolagens antigas no
// Firestore, o balão animado dispararia 50 vezes seguidas de uma vez.
// null = ainda não veio nenhum snapshot; nesse caso a primeira leva inteira
// só é "registrada como vista", sem animar nada.
let diceRollSeenIds = null;
// ids que acabaram de chegar nesta leva — usado só pra marcar a entrada
// correspondente no log com a classe de "pouso" (de-fresh) uma única vez.
let diceFreshRollIds = new Set();

function mergeAndRenderRolls() {
  const merged = Object.assign({}, rollsPublicMap, rollsMineMap);
  const list = Object.keys(merged)
    .map(id => merged[id])
    .sort((a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt))
    .slice(0, 50);

  if (diceRollSeenIds === null) {
    diceRollSeenIds = new Set(list.map(h => h.id));
  } else {
    // Mais antiga primeiro, pra os balões aparecerem na ordem certa caso
    // mais de uma rolagem chegue no mesmo snapshot.
    const freshOldestFirst = list.filter(h => !diceRollSeenIds.has(h.id)).reverse();
    freshOldestFirst.forEach(h => {
      diceRollSeenIds.add(h.id);
      diceFreshRollIds.add(h.id);
      showDiceRollToast(h);
    });
  }

  tableRollHistory = list.slice().reverse(); // mais antiga em cima, mais nova embaixo
  renderTableDiceLog();
}

function tsMillis(ts) {
  if (!ts) return 0;
  return ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime();
}

// Mostra o erro de sincronização na própria tela (em vez de só no console),
// porque um índice do Firestore que ainda não terminou de ser criado, ou
// que nunca foi implantado, falha *silenciosamente* pro jogador — ele só
// via de menos rolagens dos outros, sem nenhuma pista do motivo. Se o erro
// vier com um link pra criar o índice automaticamente, ele aparece aqui.
function showRollsSyncError(context, err) {
  console.error(`Erro ao sincronizar rolagens (${context}):`, err);
  const errEl = document.getElementById('diceErr');
  if (!errEl) return;
  const isIndexError = err && (err.code === 'failed-precondition' || /index/i.test(err.message || ''));
  errEl.textContent = isIndexError
    ? `Não foi possível sincronizar as rolagens (${context}): falta criar um índice no Firestore. Veja o console do navegador (F12) — o erro traz um link para criar o índice automaticamente, ou rode "firebase deploy --only firestore:indexes".`
    : `Não foi possível sincronizar as rolagens (${context}): ${err.message || err}`;
  errEl.style.display = 'block';
}

function listenRolls() {
  const rollsRef = db.collection('tables').doc(curTable.id).collection('rolls');

  if (isTableOwner()) {
    // Só o dono desta mesa recebe as rolagens ocultas de todo mundo; um
    // Mestre visitante (que não criou esta mesa) cai no mesmo caminho dos
    // jogadores comuns logo abaixo — senão a consulta sem filtro seria
    // barrada pela regra do Firestore (isTableMaster), que só libera as
    // rolagens ocultas para o Mestre dono da mesa.
    rollsPublicMap = {}; rollsMineMap = {};
    rollsUnsub = rollsRef.orderBy('createdAt', 'desc').limit(50)
      .onSnapshot(snap => {
        rollsPublicMap = {};
        snap.docs.forEach(d => { rollsPublicMap[d.id] = { id: d.id, ...d.data() }; });
        mergeAndRenderRolls();
      }, err => showRollsSyncError('mestre', err));
    return;
  }

  const unsubPublic = rollsRef.where('hidden', '==', false).orderBy('createdAt', 'desc').limit(50)
    .onSnapshot(snap => {
      rollsPublicMap = {};
      snap.docs.forEach(d => { rollsPublicMap[d.id] = { id: d.id, ...d.data() }; });
      mergeAndRenderRolls();
    }, err => showRollsSyncError('rolagens públicas', err));

  const unsubMine = rollsRef.where('by', '==', curUser.uid).orderBy('createdAt', 'desc').limit(50)
    .onSnapshot(snap => {
      rollsMineMap = {};
      snap.docs.forEach(d => { rollsMineMap[d.id] = { id: d.id, ...d.data() }; });
      mergeAndRenderRolls();
    }, err => showRollsSyncError('minhas rolagens', err));

  rollsUnsub = () => { unsubPublic(); unsubMine(); };
}

function renderTableDiceLog() {
  const el = document.getElementById('diceLog');
  if (!tableRollHistory.length) {
    el.innerHTML = '<div class="dice-empty">Nenhuma rolagem ainda.</div>';
    return;
  }
  el.innerHTML = tableRollHistory.map(h => {
    // "de-fresh" só na rolagem que acabou de chegar (dá o efeito de pouso
    // no log, em sincronia com o balão flutuante) — nunca no histórico
    // carregado ao entrar na mesa nem em re-renders posteriores da mesma
    // entrada, pra não repetir a animação toda vez que o log é redesenhado.
    const isFresh = diceFreshRollIds.has(h.id);
    const freshClass = isFresh ? ' de-fresh' + (h.isNat20 ? ' de-crit' : '') + (h.isNat1 ? ' de-fail' : '') : '';
    return `
    <div class="dice-entry${h.hidden ? ' de-hidden' : ''}${freshClass}">
      <div class="de-head">
        <span class="de-cmd">${escapeHtml(h.label)}${h.byName ? ` · ${escapeHtml(h.byName)}` : ''}${h.hidden ? ' · 🙈 oculta' : ''}</span>
        <span class="de-total${h.isNat20 ? ' crit' : ''}${h.isNat1 ? ' fail' : ''}">${h.total}</span>
      </div>
      <div class="de-detail">${h.detail}${h.isNat20 ? ' · 🎉 20 natural!' : ''}${h.isNat1 ? ' · 💀 1 natural' : ''}</div>
      ${h.applyAction ? `
      <div class="de-apply">
        ${h.applyAction === 'heal'
          ? `<span class="heal">❤️ Curou</span>`
          : `<span class="dmg">⚔️ Dano em</span>`}
        ${escapeHtml(h.applyTargetName || 'alvo')}:
        ${(h.applyParts || []).map(p =>
          `${escapeHtml(p.partLabel || '')}: ${p.before} → ${p.after}${p.max != null ? `/${p.max}` : ''} HP`
        ).join(' · ')}
      </div>` : ''}
    </div>`;
  }).join('');
  // Consumido — evita que a próxima chamada a renderTableDiceLog (ex.: um
  // segundo snapshot que não trouxe rolagem nova nenhuma) reaplique o
  // efeito de pouso nas mesmas entradas.
  diceFreshRollIds.clear();
}

// Balão flutuante sobre o tabuleiro: gira mostrando números aleatórios por
// um instante (suspense) e então encaixa no resultado real já calculado
// (o total já veio pronto do Firestore — aqui só criamos o efeito visual
// de "o dado ainda está rolando"), com brilho dourado em 20 natural e
// tremor vermelho em 1 natural. Cada rolagem nova ganha o seu próprio
// balão independente — não fila nem espera o anterior sumir, pra não
// atrasar a resposta visual se vários jogadores rolarem ao mesmo tempo.
// Estima o teto plausível pros números aleatórios mostrados durante o
// "suspense" do balão — antes girava sempre entre 1 e 20, mesmo numa
// rolagem de d100 ou 2d6 (ficava saltando de "17" pra "84" no instante do
// resultado, quebrando a ilusão). Aqui lemos o(s) dNN do próprio rótulo da
// rolagem (ex.: "2d6+3" → 6, "1d100" → 100, "3#d20kh1" → 20) e giramos
// dentro da faixa do maior dado realmente usado.
function guessSpinCeiling(label) {
  const sides = Array.from((label || '').matchAll(/d(\d+)/gi))
    .map(m => parseInt(m[1], 10)).filter(n => n > 1);
  if (!sides.length) return 20;
  return Math.min(100, Math.max(...sides));
}

// Balão flutuante sobre o tabuleiro: o dado tomba (ícone rodando em várias
// etapas, não um giro plano) mostrando números de suspense dentro da faixa
// plausível do próprio dado, cada troca com um "tique" visual (pop rápido,
// como um contador de caça-níquel), até encaixar no resultado real já
// calculado (o total já veio pronto do Firestore — aqui só criamos o efeito
// de "o dado ainda está rolando"). No pouso: brilho dourado varrendo o
// balão em 20 natural, anel vermelho pulsante em 1 natural. A duração do
// giro varia um pouco a cada rolagem (não é sempre idêntica), pra não ficar
// mecânico numa sessão com muitas rolagens seguidas. Cada rolagem nova
// ganha o seu próprio balão independente — não fila nem espera o anterior
// sumir, pra não atrasar a resposta visual se vários jogadores rolarem ao
// mesmo tempo.
function showDiceRollToast(entry) {
  const layer = document.getElementById('diceToastLayer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = 'dice-toast';
  el.innerHTML = `
    <span class="dice-toast-icon">🎲</span>
    <div class="dice-toast-body">
      <span class="dice-toast-who">${escapeHtml(entry.byName || 'Alguém')}${entry.hidden ? ' · 🙈' : ''}</span>
      <span class="dice-toast-cmd">${escapeHtml(entry.label)}</span>
    </div>
    <span class="dice-toast-total">–</span>`;
  layer.appendChild(el);
  const totalEl = el.querySelector('.dice-toast-total');
  const iconEl = el.querySelector('.dice-toast-icon');

  const ceiling = guessSpinCeiling(entry.label);
  const spinMs = 480 + Math.floor(Math.random() * 170); // varia ~480–650ms
  const tickMs = 60;
  const ticks = Math.max(1, Math.round(spinMs / tickMs));
  iconEl.style.animationDuration = spinMs + 'ms';
  let i = 0;
  const spinTimer = setInterval(() => {
    totalEl.textContent = String(1 + Math.floor(Math.random() * ceiling));
    // Reinicia a animação de "tique" a cada troca de número — remover,
    // forçar reflow e reaplicar é o jeito confiável de reiniciar a mesma
    // CSS animation em rápida sucessão (senão o browser ignora repetições
    // da mesma classe já aplicada).
    totalEl.classList.remove('ticking');
    void totalEl.offsetWidth;
    totalEl.classList.add('ticking');
    i++;
    if (i >= ticks) {
      clearInterval(spinTimer);
      totalEl.classList.remove('ticking');
      totalEl.textContent = entry.total;
      el.classList.add('settled');
      if (entry.isNat20) el.classList.add('crit');
      if (entry.isNat1) el.classList.add('fail');
    }
  }, tickMs);

  // Some sozinho depois de um tempo (bate com a animação CSS de saída,
  // diceToastOut, que começa em 1.75s) — remove o nó do DOM em vez de só
  // deixar invisível, pra não acumular elementos escondidos numa sessão
  // longa de mesa com muitas rolagens.
  setTimeout(() => el.remove(), 2100);
}

async function doTableRoll() {
  const input = document.getElementById('diceCmdInput');
  const errEl = document.getElementById('diceErr');
  const hideChk = document.getElementById('diceHideChk');
  const targetSel = document.getElementById('diceTargetSelect');
  const result = parseTableRollCommand(input.value);
  if (result.error) {
    errEl.textContent = result.error;
    errEl.style.display = 'flex';
    // Reinicia a animação mesmo se o erro anterior ainda não tiver sumido
    // (dois comandos errados seguidos) — remover e forçar reflow antes de
    // reaplicar a classe é o jeito confiável de reiniciar uma CSS animation.
    input.classList.remove('dice-input-shake');
    void input.offsetWidth;
    input.classList.add('dice-input-shake');
    return;
  }
  errEl.style.display = 'none';
  input.classList.remove('dice-input-shake');

  const targetId = targetSel ? targetSel.value : '';
  const partKeys = targetId ? getCheckedBodyParts() : [];
  const action = (targetId && partKeys.length) ? getSelectedDiceAction() : '';

  // Se um alvo e ao menos uma parte do corpo estiverem marcados, o total da
  // própria rolagem é debitado (dano) ou somado (cura) diretamente no HP de
  // cada parte marcada, no token do alvo — sem precisar de nenhum passo
  // manual extra.
  let apply = null;
  if (targetId && partKeys.length && action) {
    apply = await applyRollToBodyPart(targetId, partKeys, action, result.total);
  }

  try {
    await db.collection('tables').doc(curTable.id).collection('rolls').add({
      by: curUser.uid,
      byName: curProfile ? curProfile.name : '',
      label: result.label,
      detail: result.detail,
      total: result.total,
      isNat20: !!result.isNat20,
      isNat1: !!result.isNat1,
      hidden: !!(hideChk && hideChk.checked),
      applyAction: apply ? action : null,
      applyTargetName: apply ? apply.targetName : null,
      applyParts: apply ? apply.results.map(r => ({
        partKey: r.partKey,
        partLabel: BODY_PART_LABEL[r.partKey],
        before: r.before,
        after: r.after,
        max: r.max
      })) : null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = '';
    input.focus();
    updateDiceTargetUiState();
  } catch (err) {
    errEl.textContent = 'Erro ao registrar a rolagem: ' + err.message;
    errEl.style.display = 'block';
  }
}

