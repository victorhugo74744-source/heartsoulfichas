// editor-build.js — parte de js/editor.js, dividido em Ago/2026 porque o arquivo
// único tinha passado de 1900 linhas. UI de construção da ficha: atributos, perícias, raça, antecedente, traços adicionais e inspiração.
// Carregado como script global comum (sem módulos ES) — ver ordem exigida
// em ficha-editor.html. Funções e variáveis aqui são globais e usadas
// livremente pelos outros arquivos editor-*.js.

// ================= ATTRIBUTES =================
function renderAttrs() {
  const grid = document.getElementById('attrGrid');
  const bonuses = traitAttrBonuses();
  grid.innerHTML = ATTR_KEYS.map(([k, label]) => {
    const v = state.attributes[k];
    const traitBonus = bonuses[k] || 0;
    const manual = (state.attrManualBonus && state.attrManualBonus[k]) || 0;
    const total = v + traitBonus + manual;
    const bonusLine = (traitBonus || manual)
      ? `<div class="attr-bonus">+${traitBonus} bônus${manual ? ` ${manual >= 0 ? '+' + manual : manual} ajuste` : ''} = <b style="color:var(--gold);">${total}</b></div>`
      : '';
    return `
      <div class="attr-box">
        <div class="attr-name">${label}</div>
        <div class="attr-controls">
          <button type="button" data-attr="${k}" data-dir="-1">−</button>
          <div class="val">${v}</div>
          <button type="button" data-attr="${k}" data-dir="1">+</button>
        </div>
        ${bonusLine}
        <div class="attr-mod">mod. ${attrMod(total) >= 0 ? '+' : ''}${attrMod(total)}</div>
        <div class="attr-manual">
          <label>Ajuste manual</label>
          <input type="number" data-attr-manual="${k}" value="${manual}">
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('button[data-attr]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.attr;
      const dir = parseInt(btn.dataset.dir);
      const current = state.attributes[k];
      const spent = attrPoolSpent();
      if (dir === 1) {
        // O limite de 8 por atributo só vale na criação da ficha. Depois de
        // criada, na edição (editingSheetId definido), o jogador pode evoluir
        // o atributo livremente além de 8, ainda respeitando o total de pontos.
        if (!editingSheetId && current >= 8) return;
        if (spent >= attrPoolMax()) return;
        state.attributes[k]++;
      } else {
        if (current <= 1) return;
        state.attributes[k]--;
      }
      renderAttrs();
      updateAttrPoolDisplay();
      renderResources();
    });
  });
  grid.querySelectorAll('[data-attr-manual]').forEach(inp => {
    inp.addEventListener('change', () => {
      if (!state.attrManualBonus) state.attrManualBonus = {};
      state.attrManualBonus[inp.dataset.attrManual] = parseInt(inp.value) || 0;
      renderAttrs();
      renderResources();
    });
  });
}
function updateAttrPoolDisplay() {
  const remaining = attrPoolMax() - attrPoolSpent();
  const el = document.getElementById('attrPoolCount');
  el.textContent = remaining;
  el.classList.toggle('over', remaining < 0);
  const info = document.getElementById('attrLimitInfo');
  if (info) {
    info.textContent = editingSheetId
      ? `Limite no nível ${charLevel()}: ${attrPoolMax()} pontos (16 base + 3 por nível acima de 1). O limite de 8 por atributo não se aplica mais — a ficha já foi criada.`
      : `Limite no nível ${charLevel()}: ${attrPoolMax()} pontos (16 base + 3 por nível acima de 1).`;
  }
}

// ================= SKILLS =================
// Perícias extras concedidas pelo Antecedente ou por um Traço são, na
// prática, perícias como qualquer outra — por isso elas também entram na
// lista de "skills" (com pontos podendo ser distribuídos nelas), só que já
// nascem com 1 ponto grátis (sem gastar da Reserva de Perícia, ver
// skillFreePoints acima) e marcadas com fromBackground/fromTrait para
// lembrar de onde vieram e impedir remoção direta pelo botão ✕ (a remoção é
// automática: desmarcando a perícia no Antecedente, ou removendo o Traço).
// Se a mesma perícia vier de mais de uma origem ao mesmo tempo, ela só some
// da lista quando a última origem for removida.
function grantFreeSkill(name, sourceFlag) {
  const existing = state.skills.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing[sourceFlag] = true;
    const floor = skillFreePoints(existing);
    if (existing.points < floor) existing.points = floor;
  } else {
    state.skills.push({ name, points: 1, [sourceFlag]: true });
  }
}
function revokeFreeSkill(name, sourceFlag) {
  const idx = state.skills.findIndex(s => s[sourceFlag] && s.name.toLowerCase() === name.toLowerCase());
  if (idx === -1) return;
  const s = state.skills[idx];
  s[sourceFlag] = false;
  const otherFlag = sourceFlag === 'fromBackground' ? 'fromTrait' : 'fromBackground';
  if (!s[otherFlag]) {
    state.skills.splice(idx, 1);
  } else {
    // Perde-se 1 ponto grátis (o da origem removida), mas nunca abaixo do
    // novo piso (1, já que a outra origem ainda concede o dela).
    s.points = Math.max(skillFreePoints(s), s.points - 1);
  }
}
function addBackgroundSkillToList(name) { grantFreeSkill(name, 'fromBackground'); }
function removeBackgroundSkillFromList(name) { revokeFreeSkill(name, 'fromBackground'); }
function clearAllBackgroundSkillsFromList() {
  state.skills.filter(s => s.fromBackground).map(s => s.name).forEach(removeBackgroundSkillFromList);
}
function addTraitSkillToList(name) { grantFreeSkill(name, 'fromTrait'); }
function removeTraitSkillFromList(name) { revokeFreeSkill(name, 'fromTrait'); }
function clearAllTraitSkillsFromList() {
  state.skills.filter(s => s.fromTrait).map(s => s.name).forEach(removeTraitSkillFromList);
}
function renderBackgroundSkillsBox() {
  const box = document.getElementById('bgSkillsBox');
  if (!box) return;
  if (!state.backgroundId || state.backgroundSkills.length === 0) {
    box.innerHTML = '';
    return;
  }
  box.innerHTML = `
    <div class="sheet-section-title">Perícias Extras (Antecedente)</div>
    <div class="extra-skills-row">
      ${state.backgroundSkills.map(name => `<span class="extra-skill-chip">${escapeHtml(name)}</span>`).join('')}
    </div>
    <p class="hint" style="margin:-8px 0 18px;">Elas também são perícias e já entram com 1 ponto grátis (2, se a mesma perícia também vier de um Traço) — distribua pontos extras nelas na lista abaixo (marcadas como "Antecedente"), respeitando sempre o teto por perícia.</p>`;
}
function renderSkills() {
  renderBackgroundSkillsBox();
  const list = document.getElementById('skillsList');
  if (state.skills.length === 0) {
    list.innerHTML = `<p class="hint" style="margin:0 0 10px;">Nenhuma perícia adicionada ainda.</p>`;
  } else {
    list.innerHTML = state.skills.map((s, i) => `
      <div class="skill-row">
        <span>${escapeHtml(s.name)} ${s.fromBackground ? '<span class="tag benign" style="margin-left:6px;">Antecedente</span>' : ''}${s.fromTrait ? '<span class="tag benign" style="margin-left:6px;">Traço</span>' : ''}</span>
        <div class="skill-pts">
          <button type="button" data-i="${i}" data-dir="-1">−</button>
          <span class="val">${s.points}</span>
          <button type="button" data-i="${i}" data-dir="1">+</button>
          ${(s.fromBackground || s.fromTrait) ? '' : `<button type="button" class="skill-remove" data-remove="${i}">✕</button>`}
        </div>
      </div>`).join('');
  }
  list.querySelectorAll('button[data-i]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i);
      const dir = parseInt(btn.dataset.dir);
      const s = state.skills[i];
      if (dir === 1) {
        if (s.points >= skillCapPerSkill()) return;
        if (skillPoolSpent() >= skillPoolMax()) return;
        s.points++;
      } else {
        if (s.points > skillFreePoints(s)) s.points--;
      }
      renderSkills(); updateSkillPoolDisplay();
    });
  });
  list.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.skills.splice(parseInt(btn.dataset.remove), 1);
      renderSkills(); updateSkillPoolDisplay();
    });
  });
}
function updateSkillPoolDisplay() {
  const remaining = skillPoolMax() - skillPoolSpent();
  const el = document.getElementById('skillPoolCount');
  el.textContent = remaining;
  el.classList.toggle('over', remaining < 0);
  const info = document.getElementById('skillLimitInfo');
  if (info) info.textContent = `Limite no nível ${charLevel()}: ${skillPoolMax()} pontos para gastar, máximo de +${skillCapPerSkill()} por perícia.`;
}
document.getElementById('addSkillBtn').addEventListener('click', () => {
  const input = document.getElementById('newSkillName');
  const name = input.value.trim();
  if (!name) return;
  if (state.skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
    input.value = ''; return;
  }
  state.skills.push({ name, points: 1 });
  input.value = '';
  renderSkills(); updateSkillPoolDisplay();
});
document.getElementById('newSkillName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addSkillBtn').click(); }
});

// ================= RACE =================
function truncateWords(str, max) {
  if (!str) return '';
  if (str.length <= max) return str;
  const cut = str.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}
function renderRaceGrid() {
  const grid = document.getElementById('raceGrid');
  grid.innerHTML = DATA.races.map(r => `
    <div class="race-card ${state.raceId === r.id ? 'selected' : ''}" data-race="${r.id}" title="${escapeHtml(truncateWords((r.flavor && r.flavor[0]) || '', 140))}">
      <div class="rname">${escapeHtml(r.name)}</div>
    </div>`).join('');
  grid.querySelectorAll('.race-card').forEach(card => {
    card.addEventListener('click', () => {
      state.raceId = card.dataset.race;
      state.raceOptionalChosen = [];
      state.raceTraitsBought = [];
      state.raceVariantChosen = null;
      renderRaceGrid();
      renderRaceDetail();
      renderAttrs();
      updateTraitPoolDisplay();
      renderResources();
    });
  });
}
// raceTraitNameDesc / formatTraitBody vêm de firebase-init.js (compartilhado
// com view.js), pra separar "Nome: descrição" e quebrar a descrição em
// sub-seções em vez de texto corrido — ver comentário lá.
function renderRaceDetail() {
  const box = document.getElementById('raceDetail');
  if (!state.raceId) { box.innerHTML = ''; return; }
  const race = DATA.races.find(r => r.id === state.raceId);
  const buyableIdx = race.optionalTraits.map((_, i) => i).filter(i => !state.raceOptionalChosen.includes(i));
  box.innerHTML = `
    <div class="race-detail">
      ${race.flavor && race.flavor.length ? `<div class="race-flavor"><div class="sheet-section-title" style="margin-top:0;">Descrição</div>${race.flavor.map(p => `<p>${escapeHtml(p)}</p>`).join('')}</div>` : ''}
      ${(() => {
        const fixedRaw = (state.raceId === state.loadedRaceId && state.raceFixedTraitOverride) ? state.raceFixedTraitOverride : race.fixedTrait;
        const { name: fixedName, desc: fixedBody } = raceTraitNameDesc(fixedRaw);
        return `
      <div class="sheet-section-title" style="margin-top:0;">Traço Fixo <span style="color:var(--seal-bright);">(obrigatório)</span></div>
      <div class="fixed-trait">
        <div class="trait-rich-name">${escapeHtml(fixedName)}</div>
        ${formatTraitBody(fixedBody)}
      </div>`;
      })()}
      ${race.variantChoice ? `
        <div class="sheet-section-title">${escapeHtml(race.variantChoice.label)} <span style="color:var(--seal-bright);">(obrigatório)</span></div>
        ${race.variantChoice.hint ? `<p class="hint" style="margin:-4px 0 10px;">${escapeHtml(race.variantChoice.hint)}</p>` : ''}
        ${race.variantChoice.options.map((v, i) => {
          const selected = state.raceVariantChosen === i;
          return `
            <div class="trait-pick ${selected ? 'selected' : ''}" data-variant="${i}">
              <div class="thead">
                <span class="tname">${escapeHtml(v.name)}</span>
              </div>
              <div class="tdesc">${escapeHtml(v.desc)}</div>
            </div>`;
        }).join('')}
        <p class="hint" id="raceVariantWarning" style="margin-top:10px;"></p>
      ` : ''}
      <div class="sheet-section-title">Escolha 2 traços opcionais (gratuitos)</div>
      ${race.optionalTraits.map((t, i) => {
        const { name, desc } = raceTraitNameDesc(t);
        const selected = state.raceOptionalChosen.includes(i);
        return `
          <div class="trait-pick ${selected ? 'selected' : ''}" data-opt="${i}">
            <div class="thead">
              <span class="tname">${escapeHtml(name)}</span>
              <span class="tcost">Grátis</span>
            </div>
            ${desc ? `<div class="tdesc">${formatTraitBody(desc)}</div>` : ''}
          </div>`;
      }).join('')}
      <p class="hint" id="raceOptWarning" style="margin-top:10px;"></p>

      ${buyableIdx.length ? `
        <div class="sheet-section-title">Traços extras da raça (comprados com Pontos de Traço)</div>
        <p class="hint" style="margin:-4px 0 10px;">Além dos 2 traços opcionais gratuitos, você pode comprar os demais traços da sua própria raça gastando Pontos de Traço (custo ${RACE_TRAIT_BUY_COST} cada, junto com os traços da etapa 7).</p>
        ${buyableIdx.map(i => {
          const { name, desc } = raceTraitNameDesc(race.optionalTraits[i]);
          const selected = (state.raceTraitsBought || []).includes(i);
          return `
            <div class="trait-pick ${selected ? 'selected' : ''}" data-race-buy="${i}">
              <div class="thead">
                <span class="tname">${escapeHtml(name)}</span>
                <span class="tcost">Custo ${RACE_TRAIT_BUY_COST} Pts. Traço</span>
              </div>
              ${desc ? `<div class="tdesc">${formatTraitBody(desc)}</div>` : ''}
            </div>`;
        }).join('')}
        <p class="hint" id="raceTraitWarning" style="margin-top:6px;"></p>
      ` : ''}
    </div>`;
  box.querySelectorAll('[data-variant]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.variant);
      state.raceVariantChosen = (state.raceVariantChosen === idx) ? null : idx;
      renderRaceDetail();
      renderAttrs();
      renderResources();
    });
  });
  box.querySelectorAll('[data-opt]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.opt);
      state.raceOptionalTouched = true;
      if (state.raceOptionalChosen.includes(idx)) {
        state.raceOptionalChosen = state.raceOptionalChosen.filter(x => x !== idx);
      } else {
        if (state.raceOptionalChosen.length >= 2) {
          flashMsg('raceOptWarning', 'Você já escolheu os 2 traços opcionais gratuitos.', true);
          return;
        }
        state.raceOptionalChosen.push(idx);
        // Não faz sentido comprar um traço que virou gratuito.
        state.raceTraitsBought = (state.raceTraitsBought || []).filter(x => x !== idx);
      }
      updateRaceOptWarning();
      renderRaceDetail();
      renderAttrs();
      updateTraitPoolDisplay();
      renderResources();
    });
  });
  box.querySelectorAll('[data-race-buy]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.raceBuy);
      state.raceBoughtTouched = true;
      if (!state.raceTraitsBought) state.raceTraitsBought = [];
      if (state.raceTraitsBought.includes(idx)) {
        state.raceTraitsBought = state.raceTraitsBought.filter(x => x !== idx);
      } else {
        if (traitPoolSpent() + RACE_TRAIT_BUY_COST > traitPoolMax()) {
          flashMsg('raceTraitWarning', 'Pontos de Traço insuficientes para comprar este traço racial.', true);
          return;
        }
        state.raceTraitsBought.push(idx);
      }
      renderRaceDetail();
      updateTraitPoolDisplay();
      renderAttrs();
      renderResources();
    });
  });
  updateRaceOptWarning();
  updateRaceVariantWarning();
}
function updateRaceOptWarning() {
  const w = document.getElementById('raceOptWarning');
  if (!w) return;
  const n = state.raceOptionalChosen.length;
  w.textContent = n === 2 ? '✓ 2 traços opcionais escolhidos.' : `Faltam ${2 - n} traço(s) opcional(is).`;
  w.style.color = n === 2 ? 'var(--benign)' : 'var(--ink-mute)';
}
function updateRaceVariantWarning() {
  const w = document.getElementById('raceVariantWarning');
  if (!w) return;
  const race = DATA.races.find(r => r.id === state.raceId);
  if (!race || !race.variantChoice) { w.textContent = ''; return; }
  const chosen = state.raceVariantChosen !== null && state.raceVariantChosen !== undefined;
  w.textContent = chosen ? '✓ Variação escolhida.' : 'Escolha uma variação.';
  w.style.color = chosen ? 'var(--benign)' : 'var(--seal-bright)';
}

// ================= BACKGROUND =================
// Filtro por "status" (atributo) do antecedente: reaproveita o mesmo parser
// de bônus de atributo usado pelos traços (parseAttrBonusesFromText), já
// que o campo "atributos" dos antecedentes usa o mesmo formato de texto
// livre ("+2 Intelecto, +2 Foco.").
function populateBackgroundOptions(attrFilter) {
  const sel = document.getElementById('fBackground');
  const prevValue = sel.value;
  sel.innerHTML = '<option value="">Nenhum antecedente</option>';
  DATA.backgrounds.forEach(b => {
    if (attrFilter && !Object.keys(parseAttrBonusesFromText(b.atributos)).includes(attrFilter)) return;
    const opt = document.createElement('option');
    opt.value = b.id; opt.textContent = `${b.icon || ''} ${b.name}`.trim();
    sel.appendChild(opt);
  });
  if (Array.from(sel.options).some(o => o.value === prevValue)) {
    sel.value = prevValue;
    return;
  }
  sel.value = '';
  // Antecedente selecionado ficou fora do filtro: limpa a seleção pra não
  // deixar estado (perícias escolhidas etc.) preso a um antecedente que
  // não aparece mais no select.
  if (state.backgroundId) {
    clearAllBackgroundSkillsFromList();
    state.backgroundId = '';
    state.backgroundSkills = [];
    renderBackgroundDetail();
    renderSkills();
    updateSkillPoolDisplay();
    renderAttrs();
    renderResources();
  }
}
function initBackgroundFilter() {
  const filterEl = document.getElementById('backgroundFilterAttr');
  if (!filterEl) return;
  if (filterEl.options.length <= 1) {
    ATTR_KEYS.forEach(([key, label]) => {
      filterEl.insertAdjacentHTML('beforeend', `<option value="${key}">${label}</option>`);
    });
  }
  filterEl.addEventListener('change', () => populateBackgroundOptions(filterEl.value));
}
function renderBackgroundSelect() {
  const sel = document.getElementById('fBackground');
  populateBackgroundOptions('');
  sel.addEventListener('change', () => {
    clearAllBackgroundSkillsFromList();
    state.backgroundId = sel.value;
    state.backgroundSkills = [];
    renderBackgroundDetail();
    renderSkills();
    updateSkillPoolDisplay();
    renderAttrs();
    renderResources();
  });
  initBackgroundFilter();
}
function renderBackgroundDetail() {
  const box = document.getElementById('backgroundDetail');
  if (!state.backgroundId) { box.innerHTML = ''; return; }
  const bg = DATA.backgrounds.find(b => b.id === state.backgroundId);
  box.innerHTML = `
    <div class="race-detail">
      <p>${escapeHtml(bg.desc)}</p>
      <p><b style="color:var(--gold)">Atributos:</b> ${escapeHtml(bg.atributos)}</p>
      <p><b style="color:var(--gold)">Vantagens:</b> ${escapeHtml(bg.vantagens)}</p>
      <p><b style="color:var(--gold)">Desvantagens:</b> ${escapeHtml(bg.desvantagens)}</p>
      <p style="font-style:italic; color:var(--ink-mute);">"${escapeHtml(bg.quote)}"</p>
      <div class="sheet-section-title">Perícias do Antecedente — escolha até 2 (viram Perícias Extras, já entram com 1 ponto sem custar da Reserva de Perícia, e dá pra investir pontos extras nelas na etapa 3)</div>
      <div class="bg-skill-grid">
        ${bg.skills.map(name => `
          <label class="trait-option bg-skill-option">
            <input type="checkbox" data-bgskill="${escapeHtml(name)}" ${state.backgroundSkills.includes(name) ? 'checked' : ''}>
            <span>${escapeHtml(name)}</span>
          </label>`).join('')}
      </div>
      <p class="hint" id="bgSkillWarning" style="margin-top:8px;"></p>
    </div>`;
  box.querySelectorAll('input[data-bgskill]').forEach(chk => {
    chk.addEventListener('change', () => {
      const name = chk.dataset.bgskill;
      if (chk.checked) {
        if (state.backgroundSkills.length >= 2) { chk.checked = false; return; }
        state.backgroundSkills.push(name);
        addBackgroundSkillToList(name);
      } else {
        state.backgroundSkills = state.backgroundSkills.filter(n => n !== name);
        removeBackgroundSkillFromList(name);
      }
      updateBgSkillWarning();
      renderSkills();
      updateSkillPoolDisplay();
    });
  });
  updateBgSkillWarning();
}
function updateBgSkillWarning() {
  const w = document.getElementById('bgSkillWarning');
  if (!w) return;
  const n = state.backgroundSkills.length;
  w.textContent = n === 2 ? '✓ 2 perícias extras escolhidas.' : `Você pode escolher mais ${2 - n} perícia(s) extra(s) (opcional).`;
  w.style.color = n === 2 ? 'var(--benign)' : 'var(--ink-mute)';
}

// ================= TRAITS =================
// As categorias de traço funcionam como um acordeão: ficam fechadas por
// padrão (só o título aparece) e abrem ao clicar, mostrando os traços
// daquela categoria pra escolher. Clicar de novo no título fecha a categoria.
// openTraitCats guarda o estado "aberta" fora de qualquer busca/filtro (o
// que o jogador deixou aberto navegando manualmente pelo catálogo inteiro).
let openTraitCats = new Set();
// closedTraitCats guarda categorias que o jogador fechou manualmente
// ENQUANTO havia busca/filtro ativo. Existe separado de openTraitCats porque,
// com filtro ativo, toda categoria com resultado abre automaticamente (ver
// hasActiveFilter mais abaixo) — sem esse segundo set, o clique no título
// pra fechar a categoria era ignorado (a categoria reabria sozinha no
// próximo render, porque o cálculo de isOpen olhava só pra hasActiveFilter
// e nunca pra essa escolha manual). Fica esvaziado sempre que a busca/filtro
// volta a ficar vazia, porque só faz sentido dentro de uma sessão de filtro.
let closedTraitCats = new Set();

// ---- Filtro de traços (custo / atributo concedido / adicional em testes /
// elemento) ----
// O texto do traço é livre (ver parseAttrBonusesFromText mais acima), então
// esses filtros também são leitura de "melhor esforço" sobre o `desc`.
const TRAIT_ELEMENTS = [
  ['fogo', 'Fogo', /\bfogo\b/i],
  ['gelo', 'Gelo / Frio', /\bgelo\b|\bgélid[oa]\b|\bcongelamento\b/i],
  ['raio', 'Raio / Elétrico', /\braio\b|\belétric\w*/i],
  // O \b do JS só reconhece [A-Za-z0-9_] como "caractere de palavra" — não
  // conhece acento. Um padrão que COMEÇA com letra acentuada (á, é...)
  // nunca bate com \b, porque o próprio primeiro caractere do padrão já
  // não conta como fronteira de palavra: "ácido"/"água" ficavam sem
  // resultado NENHUM no filtro de elemento, sempre (bug pego pelos testes
  // em tests/client/trait-parser.test.js — ver "catálogo real" nesse
  // arquivo). Por isso usam (?<!...)/(?!...) com \p{L}/\p{N} (Unicode-aware
  // de verdade, ao contrário de \b) no lugar de \b. Qualquer elemento novo
  // que comece com letra acentuada precisa do mesmo tratamento.
  ['acido', 'Ácido', /(?<![\p{L}\p{N}_])ácido(?![\p{L}\p{N}_])/iu],
  ['veneno', 'Veneno', /\bvenenos?\b|\btoxinas?\b/i],
  ['sombra', 'Sombra / Trevas', /\bsombras?\b|\btrevas?\b/i],
  ['luz', 'Luz', /\bluz\b/i],
  ['vento', 'Vento / Ar', /\bvento\b/i],
  ['agua', 'Água', /(?<![\p{L}\p{N}_])água(?![\p{L}\p{N}_])/iu],
];
function traitGrantedAttrs(desc) {
  return Object.keys(parseAttrBonusesFromText(desc || ''));
}
function traitHasTestBonus(desc) {
  return /em\s+testes/i.test(desc || '');
}
function traitElementsFound(desc) {
  if (!desc) return [];
  return TRAIT_ELEMENTS.filter(([, , re]) => re.test(desc)).map(([key]) => key);
}
// Tira acentos pra busca não exigir digitar "é"/"ç" certinho (ex.: "eletrico"
// encontra "Elétrico", "agua" encontra "Água"). Usado só pra comparação —
// o texto exibido continua com acento normal.
function normalizeSearchText(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function getTraitFilters() {
  const costEl = document.getElementById('traitFilterCost');
  const attrEl = document.getElementById('traitFilterAttr');
  const testEl = document.getElementById('traitFilterTest');
  const elemEl = document.getElementById('traitFilterElement');
  return {
    cost: costEl && costEl.value ? parseInt(costEl.value) : null,
    attr: attrEl ? attrEl.value : '',
    testOnly: testEl ? testEl.value === 'yes' : false,
    element: elemEl ? elemEl.value : '',
  };
}
function traitMatchesFilters(it, filters) {
  if (filters.cost !== null && it.cost !== filters.cost) return false;
  if (filters.attr && !traitGrantedAttrs(it.desc).includes(filters.attr)) return false;
  if (filters.testOnly && !traitHasTestBonus(it.desc)) return false;
  if (filters.element && !traitElementsFound(it.desc).includes(filters.element)) return false;
  return true;
}
function initTraitFilters() {
  const costEl = document.getElementById('traitFilterCost');
  const attrEl = document.getElementById('traitFilterAttr');
  const elemEl = document.getElementById('traitFilterElement');
  if (costEl && costEl.options.length <= 1) {
    const costs = new Set();
    TRAIT_CATS.forEach(([catKey]) => DATA.traits[catKey].items.forEach(it => costs.add(it.cost)));
    Array.from(costs).sort((a, b) => a - b).forEach(c => {
      costEl.insertAdjacentHTML('beforeend', `<option value="${c}">${c} ponto${c === 1 ? '' : 's'}</option>`);
    });
  }
  if (attrEl && attrEl.options.length <= 1) {
    ATTR_KEYS.forEach(([key, label]) => {
      attrEl.insertAdjacentHTML('beforeend', `<option value="${key}">${label}</option>`);
    });
  }
  if (elemEl && elemEl.options.length <= 1) {
    TRAIT_ELEMENTS.forEach(([key, label]) => {
      elemEl.insertAdjacentHTML('beforeend', `<option value="${key}">${label}</option>`);
    });
  }
  ['traitFilterCost', 'traitFilterAttr', 'traitFilterTest', 'traitFilterElement'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => renderTraitCategories(document.getElementById('traitSearch').value));
  });
  const clearBtn = document.getElementById('traitFilterClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.getElementById('traitSearch').value = '';
      if (costEl) costEl.value = '';
      if (attrEl) attrEl.value = '';
      const testEl = document.getElementById('traitFilterTest');
      if (testEl) testEl.value = '';
      if (elemEl) elemEl.value = '';
      renderTraitCategories('');
    });
  }
  // Painel de filtros avançados (custo/atributo/teste/elemento) começa
  // escondido — só aparece ao clicar no botão-funil, pra não ocupar espaço
  // de tela pra quem só quer usar a busca por texto.
  const toggleBtn = document.getElementById('traitFilterToggleBtn');
  const filtersBox = document.getElementById('traitFilters');
  if (toggleBtn && filtersBox) {
    toggleBtn.addEventListener('click', () => {
      const willOpen = !filtersBox.classList.contains('open');
      filtersBox.classList.toggle('open', willOpen);
      toggleBtn.setAttribute('aria-expanded', String(willOpen));
    });
  }
}

// Reflete no botão-funil (fora do painel, então continua visível mesmo com
// o painel fechado) se há algum filtro estruturado ativo — cost/attr/
// testOnly/element. A busca por texto já aparece no próprio campo, então
// não entra nessa contagem.
function updateTraitFilterToggleUI(filters) {
  const btn = document.getElementById('traitFilterToggleBtn');
  const badge = document.getElementById('traitFilterBadge');
  if (!btn || !badge) return;
  const f = filters || getTraitFilters();
  const count = (f.cost !== null ? 1 : 0) + (f.attr ? 1 : 0) + (f.testOnly ? 1 : 0) + (f.element ? 1 : 0);
  badge.textContent = String(count);
  badge.hidden = count === 0;
  btn.classList.toggle('has-active', count > 0);
}

function renderTraitCategories(filter) {
  const wrap = document.getElementById('traitCategories');
  // Busca global: um único campo de texto cruza as 6 categorias (físico,
  // mental, especial × benigno/maligno) de uma vez, e bate tanto contra o
  // nome do traço quanto contra a descrição/efeito — assim "vontade" ou
  // "escuridão" acham qualquer traço que mencione isso, não só quem tem
  // isso no nome. Combina com os filtros estruturados (custo/atributo/
  // elemento) ao mesmo tempo.
  const f = normalizeSearchText(filter);
  const filters = getTraitFilters();
  const hasActiveFilter = !!(f || filters.cost !== null || filters.attr || filters.testOnly || filters.element);
  // Sem filtro/busca ativos, "fechar manualmente durante o filtro" deixa de
  // fazer sentido — limpa pra não sobrar estado preso de uma sessão de
  // filtro anterior.
  if (!hasActiveFilter) closedTraitCats.clear();
  updateTraitFilterToggleUI(filters);
  let totalMatches = 0;
  wrap.innerHTML = TRAIT_CATS.map(([catKey, kind]) => {
    const cat = DATA.traits[catKey];
    const items = cat.items.filter(it => {
      if (f) {
        const hay = it.__searchHay || (it.__searchHay = normalizeSearchText(it.name + ' ' + it.desc));
        if (!hay.includes(f)) return false;
      }
      return traitMatchesFilters(it, filters);
    });
    if (items.length === 0) return '';
    totalMatches += items.length;
    // Durante uma busca ou filtro ativo, abre automaticamente as categorias
    // com resultado — a menos que o jogador já tenha fechado essa categoria
    // manualmente dentro desta mesma sessão de filtro (closedTraitCats).
    const isOpen = hasActiveFilter
      ? !closedTraitCats.has(catKey)
      : openTraitCats.has(catKey);
    return `
      <div class="trait-cat">
        <button type="button" class="trait-cat-title" data-cat-toggle="${catKey}">
          <span class="tc-chevron">${isOpen ? '▾' : '▸'}</span>
          ${escapeHtml(cat.title)}
          <span class="tag ${kind}">${kind === 'malign' ? 'Maligno' : 'Benigno'}</span>
          <span class="tc-count">${items.length} traço${items.length === 1 ? '' : 's'}</span>
        </button>
        <div class="trait-cat-body" ${isOpen ? '' : 'style="display:none;"'}>
          ${items.map(it => {
            const selected = state.extraTraits.some(t => t.cat === catKey && t.name === it.name);
            const grantedSkill = parseTraitSkillFromText(it.desc);
            return `
              <div class="trait-pick ${selected ? 'selected' : ''}" data-cat="${catKey}" data-name="${escapeHtml(it.name)}" data-cost="${it.cost}">
                <div class="thead">
                  <span class="tname">${escapeHtml(it.name)}</span>
                  <span class="tcost">Custo ${it.cost}</span>
                </div>
                <div class="tdesc">${escapeHtml(it.desc)}</div>
                ${grantedSkill ? `<div class="hint" style="margin:6px 0 0;">🎯 Concede a perícia <b>${escapeHtml(grantedSkill)}</b> com 1 ponto grátis.</div>` : ''}
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }).join('');

  const resultCountEl = document.getElementById('traitFilterResultCount');
  if (resultCountEl) {
    resultCountEl.textContent = hasActiveFilter
      ? `${totalMatches} traço${totalMatches === 1 ? '' : 's'} encontrado${totalMatches === 1 ? '' : 's'}.`
      : '';
  }
  if (totalMatches === 0 && hasActiveFilter) {
    wrap.innerHTML = `<p class="hint" style="margin:0;">Nenhum traço corresponde aos filtros escolhidos.</p>`;
  }

  wrap.querySelectorAll('[data-cat-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.catToggle;
      if (hasActiveFilter) {
        // Com filtro ativo a categoria começa aberta — clicar aqui é o
        // jogador fechando-a manualmente (ou reabrindo, se já tinha fechado).
        if (closedTraitCats.has(key)) closedTraitCats.delete(key); else closedTraitCats.add(key);
      } else {
        if (openTraitCats.has(key)) openTraitCats.delete(key); else openTraitCats.add(key);
      }
      renderTraitCategories(document.getElementById('traitSearch').value);
    });
  });

  wrap.querySelectorAll('.trait-pick').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const cat = el.dataset.cat, name = el.dataset.name, cost = parseInt(el.dataset.cost);
      const idx = state.extraTraits.findIndex(t => t.cat === cat && t.name === name);
      if (idx >= 0) {
        const skillName = parseTraitSkillFromText(state.extraTraits[idx].desc);
        if (skillName) removeTraitSkillFromList(skillName);
        state.extraTraits.splice(idx, 1);
      } else {
        if (traitPoolSpent() + cost > traitPoolMax()) {
          flashMsg('traitMalignWarning', `Não há pontos suficientes para "${name}" (custo ${cost}).`, true);
          return;
        }
        const catData = DATA.traits[cat].items.find(i => i.name === name);
        state.extraTraits.push({ cat, name, cost, desc: catData.desc });
        const skillName = parseTraitSkillFromText(catData.desc);
        if (skillName) addTraitSkillToList(skillName);
      }
      renderTraitCategories(document.getElementById('traitSearch').value);
      renderChosenTraits();
      updateTraitPoolDisplay();
      renderAttrs();
      renderResources();
      renderSkills();
      updateSkillPoolDisplay();
    });
  });
}
function renderChosenTraits() {
  const box = document.getElementById('chosenTraitsList');
  if (state.extraTraits.length === 0) {
    box.innerHTML = `<span class="hint" style="margin:0;">Nenhum traço escolhido ainda.</span>`;
    return;
  }
  box.innerHTML = state.extraTraits.map((t, i) => `
    <span class="chosen-chip">${escapeHtml(t.name)} (${t.cost}) ${t.cat.endsWith('_malign') ? '☠' : ''}
      <button type="button" data-remove-trait="${i}">✕</button>
    </span>`).join('');
  box.querySelectorAll('[data-remove-trait]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.removeTrait);
      const skillName = parseTraitSkillFromText(state.extraTraits[i].desc);
      if (skillName) removeTraitSkillFromList(skillName);
      state.extraTraits.splice(i, 1);
      renderTraitCategories(document.getElementById('traitSearch').value);
      renderChosenTraits();
      updateTraitPoolDisplay();
      renderAttrs();
      renderResources();
      renderSkills();
      updateSkillPoolDisplay();
    });
  });
}
function updateTraitPoolDisplay() {
  const remaining = traitPoolMax() - traitPoolSpent();
  const el = document.getElementById('traitPoolCount');
  el.textContent = remaining;
  el.classList.toggle('over', remaining < 0);
  const info = document.getElementById('traitLimitInfo');
  if (info) info.textContent = `Limite atual: ${traitPoolMax()} pontos (6 base${state.traitBonusFromInspiration ? ' + ' + state.traitBonusFromInspiration + ' via Inspiração' : ''}).`;
  const warnBox = document.getElementById('traitMalignWarning');
  if (!hasMalignTrait()) {
    warnBox.innerHTML = `<div class="error-msg" style="margin-bottom:14px;">Escolha ao menos 1 Traço Maligno (categorias marcadas "Maligno" abaixo).</div>`;
  } else {
    warnBox.innerHTML = '';
  }
}

// ================= INSPIRAÇÃO =================
function updateInspirationDisplay() {
  const el = document.getElementById('inspirationCount');
  if (el) el.textContent = state.inspirationPoints || 0;
  const btn = document.getElementById('convertInspirationBtn');
  if (btn) btn.disabled = (state.inspirationPoints || 0) < INSPIRATION_PER_TRAIT_POINT;
}
function initInspirationUI() {
  const input = document.getElementById('fInspiration');
  if (input) {
    input.value = state.inspirationPoints || 0;
    input.addEventListener('input', () => {
      state.inspirationPoints = Math.max(0, parseInt(input.value) || 0);
      updateInspirationDisplay();
    });
  }
  const btn = document.getElementById('convertInspirationBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      if ((state.inspirationPoints || 0) < INSPIRATION_PER_TRAIT_POINT) return;
      state.inspirationPoints -= INSPIRATION_PER_TRAIT_POINT;
      state.traitBonusFromInspiration = (state.traitBonusFromInspiration || 0) + 1;
      if (input) input.value = state.inspirationPoints;
      updateInspirationDisplay();
      updateTraitPoolDisplay();
    });
  }
}
document.getElementById('traitSearch').addEventListener('input', (e) => {
  renderTraitCategories(e.target.value);
});

