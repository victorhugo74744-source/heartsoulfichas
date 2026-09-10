// js/deadly-cards.js — Complemento "Deadly-Cards" (ver SISTEMAS_EMBUTIDOS em
// js/complementos.js): ruleset alternativo de ficha, dark/horror.
//
// Regras resumidas (definidas pelo Victor):
//  - Sem raças na criação de ficha.
//  - Classe vira carta, do Ás ao Rei — só o Mestre altera depois de criada
//    (trava feita na aba Mestre de ficha-view.html, igual aos traços).
//  - Energia única "Porcentagem" (o Mestre pode trocar o nome pra
//    "Assimilação" mais adiante na campanha) — sem escolha de Aura/Mana/Fé.
//  - Vida: Cabeça 12 + mod. Constituição, Tronco 16 + mod. Constituição,
//    Braços 10 + mod. Constituição cada, Pernas 14 + mod. Constituição cada
//    (ver hpMaxForPart em editor-core.js).
//  - Porcentagem: 3d6, com direito a 3 rerolls (mesmo mecanismo de rolagem
//    já usado pra Energia — ver renderResourceDiceRow em
//    js/editor-abilities.js).
//  - Estamina: 2d10.
//  - Pontos de atributo/perícia/traço ilimitados, mas só distribuíveis
//    dentro do que o Mestre liberar nesta ficha (ver dcCaps() abaixo e
//    attrPoolMax/skillPoolMax/traitPoolMax em editor-core.js) — controlado
//    pela aba Mestre em ficha-view.html, não pelo próprio jogador.
//  - 9 níveis de corrupção (Testemunha → Réquiem), subidos manualmente pelo
//    Mestre quando ele decidir que houve um marco na mesa — sem XP
//    automático.
//
// isDeadlyCardsActive() está definida em js/complementos.js (lê
// editorComplementosCache, que só existe no contexto do ficha-editor).
// Script global comum (sem módulos ES), igual aos demais js/*.js.

const DC_CARD_CLASSES = ['Ás', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Valete', 'Dama', 'Rei'];
const DC_LEVELS = ['Testemunha', 'Maculado', 'Enlutado', 'Profanado', 'Condenado', 'Desfigurado', 'Abissado', 'Inominável', 'Réquiem'];
const DC_ICON = 'assets/deadly-cards-icon-256.png';

function dcEnergyLabel(assimilacao) {
  return assimilacao ? 'Assimilação' : 'Porcentagem';
}

// Pools de atributo/perícia/traço sob controle do Mestre (ver
// attrPoolMax/skillPoolMax/traitPoolMax em editor-core.js). Enquanto o
// Mestre não tiver liberado nada nesta ficha (state.dcCaps ainda não
// existe), tudo começa em 0 — o jogador não gasta pontos que não foram
// dados. Editado só pela aba Mestre em ficha-view.html, nunca pelo próprio
// editor de ficha.
function dcCaps() {
  return (typeof state !== 'undefined' && state.dcCaps) || { attr: 0, skill: 0, trait: 0 };
}

// ============================================================
// FICHA-EDITOR (ficha-editor.html) — liga/desliga o modo Deadly-Cards
// ============================================================
// Chamada no fim de initComplementosUI() (js/complementos.js), toda vez que
// a pasta/campanha escolhida muda. Idempotente: pode ser chamada várias
// vezes seguidas sem acumular efeito colateral.
function applyDeadlyCardsMode() {
  if (typeof state === 'undefined') return;
  const active = typeof isDeadlyCardsActive === 'function' && isDeadlyCardsActive();
  document.body.classList.toggle('dc-active', active);

  applyDcRaceStep(active);
  applyDcEnergyField(active);
  applyDcClassField(active);

  // Pools (atributo/perícia/traço) e recursos (Vida/Estamina/Energia) usam
  // isDeadlyCardsActive() direto dentro das próprias funções de cálculo —
  // só precisam ser re-renderizados aqui pra refletir a mudança de modo.
  if (typeof renderAttrs === 'function') renderAttrs();
  if (typeof updateAttrPoolDisplay === 'function') updateAttrPoolDisplay();
  if (typeof renderSkills === 'function') renderSkills();
  if (typeof updateSkillPoolDisplay === 'function') updateSkillPoolDisplay();
  if (typeof updateTraitPoolDisplay === 'function') updateTraitPoolDisplay();
  if (typeof renderResources === 'function') renderResources();

  renderDcBanner(active);

  // Reaproveita o recálculo de progresso/nav do wizard (ficha-editor.html),
  // que já ignora automaticamente links/etapas com display:none.
  window.dispatchEvent(new Event('complementos:visibility-changed'));
}

// Sem raças: some com a etapa 6 e o item de navegação, e limpa qualquer
// escolha de raça que a ficha já tivesse (ex.: campanha mudou de sistema).
function applyDcRaceStep(active) {
  const raceStep = document.getElementById('step-6');
  const raceNav = document.querySelector('.wizard-nav a[href="#step-6"]');
  if (raceStep) raceStep.style.display = active ? 'none' : '';
  if (raceNav) raceNav.style.display = active ? 'none' : '';
  if (active && state.raceId) {
    state.raceId = '';
    state.raceOptionalChosen = [];
    state.raceTraitsBought = [];
    state.raceVariantChosen = null;
  }
}

// Energia única "Porcentagem"/"Assimilação": esconde o seletor Aura/Mana/Fé
// e trava o valor no nome fixo (a troca de nome em si é feita pelo Mestre
// via state.dcAssimilacao, ver ficha-view.html).
function applyDcEnergyField(active) {
  const energyField = document.getElementById('fEnergy');
  if (!energyField) return;
  const row = energyField.closest('.field');
  let fixedBox = row ? row.querySelector('.dc-energy-fixed') : null;
  if (active) {
    state.energyType = dcEnergyLabel(state.dcAssimilacao);
    energyField.style.display = 'none';
    if (row && !fixedBox) {
      fixedBox = document.createElement('div');
      fixedBox.className = 'dc-energy-fixed';
      row.appendChild(fixedBox);
    }
    if (fixedBox) fixedBox.innerHTML = `<input type="text" value="${escapeHtml(state.energyType)}" disabled title="Definido pelo complemento Deadly-Cards. Só o Mestre troca o nome (Porcentagem → Assimilação) mais adiante na campanha, pela aba Mestre em ficha-view.html.">`;
  } else {
    energyField.style.display = '';
    if (fixedBox) fixedBox.remove();
    if (state.energyType === 'Porcentagem' || state.energyType === 'Assimilação') state.energyType = '';
  }
}

// Classe vira carta (Ás–Rei): troca o input de texto livre por um select
// com as 13 cartas. A ficha nova ainda escolhe a carta livremente aqui na
// criação; a trava de "só o Mestre muda depois" é aplicada em
// ficha-view.html (aba Mestre), no mesmo padrão já usado pra traços.
function applyDcClassField(active) {
  const classField = document.getElementById('fClass');
  if (!classField) return;
  if (active && classField.tagName === 'INPUT') {
    const sel = document.createElement('select');
    sel.id = 'fClass';
    sel.innerHTML = '<option value="">Escolha a carta…</option>' +
      DC_CARD_CLASSES.map(c => `<option value="${c}"${state.currentClass === c ? ' selected' : ''}>${c}</option>`).join('');
    classField.replaceWith(sel);
    sel.addEventListener('change', () => { state.currentClass = sel.value; });
  } else if (!active && classField.tagName === 'SELECT') {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.id = 'fClass';
    inp.placeholder = 'Ex.: Guerreiro de Aura (Poder)';
    inp.value = state.currentClass || '';
    classField.replaceWith(inp);
  }
}

// ============================================================
// FICHA-VIEW (ficha-view.html) — aba Mestre: controles exclusivos do
// Deadly-Cards (carta/classe, nível de corrupção, nome da energia, e os
// pools de pontos que o jogador pode gastar). Só é chamado/mostrado quando
// s.dcActive é true — ver masterTabHtml em js/view.js.
// ============================================================
function dcMasterPanelHtml(s) {
  const caps = s.dcCaps || { attr: 0, skill: 0, trait: 0 };
  const corruptionIdx = Number.isInteger(s.corruptionLevel) ? s.corruptionLevel : 0;
  return `
    <div class="panel dc-master-panel">
      <h2>Deadly-Cards (Mestre)</h2>
      <p class="hint" style="margin-top:-10px;">Visível e editável apenas pelo Mestre. Aqui você troca a carta/classe, sobe o nível de corrupção quando houver um marco na mesa, e libera os pontos que o jogador pode gastar em atributos/perícias/traços.</p>

      <div class="field-row">
        <div class="field">
          <label>Carta (Classe)</label>
          <select id="dcMasterClass">
            <option value="">Nenhuma</option>
            ${DC_CARD_CLASSES.map(c => `<option value="${c}"${s.currentClass === c ? ' selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Nível de corrupção</label>
          <select id="dcMasterLevel">
            ${DC_LEVELS.map((l, i) => `<option value="${i}"${i === corruptionIdx ? ' selected' : ''}>${i + 1}. ${l}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="field" style="flex-direction:row; align-items:center; gap:8px;">
        <input type="checkbox" id="dcMasterAssimilacao" ${s.dcAssimilacao ? 'checked' : ''}>
        <label for="dcMasterAssimilacao" style="margin:0;">Renomear a energia para "Assimilação" (em vez de "Porcentagem")</label>
      </div>

      <div class="sheet-section-title">Pontos liberados para o jogador</div>
      <p class="hint" style="margin:0 0 10px;">Sem raças e sem progressão automática neste complemento — o jogador só gasta o que você liberar aqui.</p>
      <div class="field-row">
        <div class="field"><label>Atributo/Status</label><input type="number" min="0" id="dcMasterCapAttr" value="${caps.attr || 0}"></div>
        <div class="field"><label>Perícia</label><input type="number" min="0" id="dcMasterCapSkill" value="${caps.skill || 0}"></div>
        <div class="field"><label>Traço</label><input type="number" min="0" id="dcMasterCapTrait" value="${caps.trait || 0}"></div>
      </div>

      <div style="margin-top:14px; display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
        <button type="button" class="btn small" id="dcMasterSaveBtn" style="width:auto;">Salvar Deadly-Cards</button>
        <span id="dcMasterMsg" style="font-size:13px; color:var(--benign);"></span>
      </div>
    </div>`;
}

function wireDcMasterPanel(s, sheetId, onSaved) {
  const btn = document.getElementById('dcMasterSaveBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const msg = document.getElementById('dcMasterMsg');
    const update = {
      currentClass: document.getElementById('dcMasterClass').value || '',
      corruptionLevel: parseInt(document.getElementById('dcMasterLevel').value) || 0,
      dcAssimilacao: document.getElementById('dcMasterAssimilacao').checked,
      dcCaps: {
        attr: Math.max(0, parseInt(document.getElementById('dcMasterCapAttr').value) || 0),
        skill: Math.max(0, parseInt(document.getElementById('dcMasterCapSkill').value) || 0),
        trait: Math.max(0, parseInt(document.getElementById('dcMasterCapTrait').value) || 0)
      }
    };
    // Energia acompanha o nome escolhido (Porcentagem/Assimilação) — mesmo
    // campo que o resto da ficha já usa pra rotular a barra de energia.
    update.energyType = dcEnergyLabel(update.dcAssimilacao);
    btn.disabled = true;
    msg.style.color = 'var(--benign)';
    msg.textContent = 'Salvando…';
    try {
      await db.collection('sheets').doc(sheetId).update(update);
      Object.assign(s, update);
      msg.textContent = 'Salvo.';
      setTimeout(() => { const m = document.getElementById('dcMasterMsg'); if (m) m.textContent = ''; }, 3500);
      onSaved && onSaved(s);
    } catch (err) {
      msg.style.color = 'var(--seal-bright)';
      msg.textContent = 'Erro ao salvar: ' + err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

// Aviso fixo no topo da etapa 1, só enquanto o complemento está ativo.
function renderDcBanner(active) {
  let box = document.getElementById('dcBanner');
  if (!active) { if (box) box.remove(); return; }
  const step1 = document.getElementById('step-1');
  if (!box && step1) {
    box = document.createElement('div');
    box.id = 'dcBanner';
    box.className = 'dc-banner';
    step1.insertBefore(box, step1.firstChild ? step1.firstChild.nextSibling : null);
  }
  if (box) {
    box.innerHTML = `
      <img src="${DC_ICON}" alt="Deadly-Cards">
      <div>
        <b>Complemento Deadly-Cards ativo nesta campanha.</b>
        <p>Sem raças, classe = carta, energia única (${escapeHtml(dcEnergyLabel(state.dcAssimilacao))}), e os pontos de atributo/perícia/traço só liberam depois que o Mestre distribuir.</p>
      </div>`;
  }
}
