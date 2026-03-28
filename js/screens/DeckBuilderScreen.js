/**
 * DeckBuilderScreen — build a grid-game deck from four sub-decks:
 * Champions, Elites, Summons, Spells.
 *
 * Layout:
 *   Left/Main  — 4 sub-deck tiles + card picker area + Create Deck button
 *   Right panel — current card list for the active sub-deck (click to remove)
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import ScreenManager from './ScreenManager.js';
import {
  CHAMPION_CARDS, ELITE_CARD_DECK, SUMMON_CARD_DECK, SPELL_CARD_DECK,
} from '../Data.js';

// ── Card pools (unique by cardId) ─────────────────────────────────────────────
function uniqueById(arr) {
  const seen = new Set();
  return arr.filter(c => { if (seen.has(c.cardId)) return false; seen.add(c.cardId); return true; });
}

const POOLS = {
  champions: CHAMPION_CARDS,
  elites:    uniqueById(ELITE_CARD_DECK),
  summons:   uniqueById(SUMMON_CARD_DECK),
  spells:    uniqueById(SPELL_CARD_DECK),
};

const REQ = {
  champions: { min: 1,  max: 3,   exact: false, label: 'Conjurers', icon: '🔮', hint: '1–3 conjurers' },
  elites:    { min: 10, max: 10,  exact: true,  label: 'Elites',    icon: '🐉', hint: 'Exactly 10 unique elites' },
  summons:   { min: 40, max: 9999,exact: false, label: 'Summons',   icon: '✨', hint: '40 or more summons' },
  spells:    { min: 10, max: 10,  exact: true,  label: 'Spells',    icon: '🔮', hint: 'Exactly 10 spells · max 2 per type' },
};

const SUB_ORDER = ['champions', 'elites', 'summons', 'spells'];

// ── Card art / rarity helpers (mirrors CardGameScreen) ───────────────────────
const TERRAIN_ICON = {
  fire:  'assets/images/CardGameArt/TypeArt/fire_img.png',
  ice:   'assets/images/CardGameArt/TypeArt/ice_img.png',
  water: 'assets/images/CardGameArt/TypeArt/water_img.png',
  wind:  'assets/images/CardGameArt/TypeArt/wind_img.png',
  earth: 'assets/images/CardGameArt/TypeArt/earth_img.png',
  spell: 'assets/images/CardGameArt/TypeArt/spell_img.png',
};
const RARITY_COLOR   = { C: '#aaa', B: '#4ab87c', A: '#9b30d0', S: '#c07820' };
const ART_BASE = 'assets/images/CardGameArt/CardArt/';

function _cardArtImg(card) {
  if (!card.artFile) return `<div class="cg-art-emoji">${card.art ?? '✨'}</div>`;
  return `<img class="cg-card-art-img" src="${ART_BASE}${card.artFile}" alt="${card.name}" decoding="sync">`;
}
function _terrainCircle(card) {
  if (!card.terrain || !TERRAIN_ICON[card.terrain]) return '';
  return `<img class="cg-terrain-icon" src="${TERRAIN_ICON[card.terrain]}" alt="${card.terrain}">`;
}
function _rarityBadge(card) {
  if (!card.rarity) return '';
  return `<span class="cg-rarity" style="color:${RARITY_COLOR[card.rarity] ?? '#aaa'}">${card.rarity}</span>`;
}

// ── Screen ────────────────────────────────────────────────────────────────────
const DeckBuilderScreen = {
  _container:  null,
  _draft:      { champions: [], elites: [], summons: [], spells: [] },
  _activeSub:  null,   // which sub-deck picker is open
  _pending:    [],     // cards staged but not yet confirmed
  _deckName:   'Deck1',
  _editDeck:   null,   // reference to deck being edited (null = create mode)

  mount(container, params = {}) {
    this._container = container;
    this._draft     = { champions: [], elites: [], summons: [], spells: [] };
    this._activeSub = null;
    this._pending   = [];
    this._deckName  = 'Deck1';
    this._editDeck  = null;

    if (params.deck) {
      const d = params.deck;
      this._draft = {
        champions: [...(d.champions ?? [])],
        elites:    [...(d.elites    ?? [])],
        summons:   [...(d.summons   ?? [])],
        spells:    [...(d.spells    ?? [])],
      };
      this._deckName = d.name ?? 'Deck1';
      this._editDeck = d;   // keep reference for Save Changes
    }

    this._render();
  },

  unmount() { this._container = null; },

  // ── Full render ─────────────────────────────────────────────────────────────

  _render() {
    const c = this._container;
    c.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'db-screen fade-in';

    // Header
    const header = document.createElement('div');
    header.className = 'screen-header';
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back';
    backBtn.textContent = '← Back';
    backBtn.addEventListener('click', () => this._doTransition(() => EventBus.emit('screen:pop')));
    const title = document.createElement('h2');
    title.textContent = '🃏 Deck Builder';

    const nameWrap = document.createElement('div');
    nameWrap.className = 'db-name-wrap';
    const nameLabel = document.createElement('label');
    nameLabel.className = 'db-name-label';
    nameLabel.textContent = 'Deck Name';
    const nameInput = document.createElement('input');
    nameInput.className = 'db-name-input';
    nameInput.type = 'text';
    nameInput.value = this._deckName;
    nameInput.maxLength = 32;
    nameInput.placeholder = 'Deck Name';
    nameInput.addEventListener('input', () => { this._deckName = nameInput.value.trim() || 'Deck1'; });
    nameWrap.appendChild(nameLabel);
    nameWrap.appendChild(nameInput);

    header.appendChild(backBtn);
    header.appendChild(title);
    header.appendChild(nameWrap);
    screen.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'db-body';

    // Main column
    const main = document.createElement('div');
    main.className = 'db-main';

    const tileRow = document.createElement('div');
    tileRow.className = 'db-subdeck-row';
    tileRow.id = 'db-subdeck-row';
    SUB_ORDER.forEach(sub => this._buildTile(sub, tileRow));
    main.appendChild(tileRow);

    const pickerArea = document.createElement('div');
    pickerArea.id = 'db-picker-area';
    main.appendChild(pickerArea);
    this._renderPicker(pickerArea);

    const createArea = document.createElement('div');
    createArea.className = 'db-create-area';
    createArea.id = 'db-create-area';
    this._renderCreateBtn(createArea);
    main.appendChild(createArea);

    body.appendChild(main);

    // Right panel
    const right = document.createElement('div');
    right.className = 'db-right-panel';
    right.id = 'db-right-panel';
    this._renderRight(right);
    body.appendChild(right);

    screen.appendChild(body);
    c.appendChild(screen);
  },

  // ── Sub-deck tiles ──────────────────────────────────────────────────────────

  _buildTile(sub, container) {
    const r        = REQ[sub];
    const cards    = this._draft[sub];
    const count    = cards.length;
    const complete = r.exact ? count === r.max : count >= r.min;
    const isActive = this._activeSub === sub;

    const tile = document.createElement('div');
    tile.className = 'db-tile' + (complete ? ' complete' : '') + (isActive ? ' active' : '');
    tile.id = `db-tile-${sub}`;

    // Count display
    const countStr = r.exact
      ? `${count} / ${r.max}`
      : `${count} / ${r.min}+`;

    tile.innerHTML = `
      <div class="db-tile-label">${r.label}</div>
      <div class="db-tile-count ${complete ? 'ok' : 'need'}">${countStr}</div>
      <div class="db-tile-hint">${r.hint}</div>
      ${complete ? '<div class="db-tile-check">✓ Ready</div>' : ''}
    `;

    const btn = document.createElement('button');
    btn.className = 'db-select-btn' + (isActive ? ' open' : '');
    btn.textContent = isActive ? '✕ Close' : 'Select Cards';
    btn.addEventListener('click', () => this._togglePicker(sub));
    tile.appendChild(btn);

    container.appendChild(tile);
  },

  _togglePicker(sub) {
    if (this._activeSub === sub) {
      this._activeSub = null;
      this._pending   = [];
    } else {
      this._activeSub = sub;
      this._pending   = [];
    }
    this._refreshAll();
  },

  // ── Picker ──────────────────────────────────────────────────────────────────

  _renderPicker(container) {
    if (!container) return;
    container.innerHTML = '';
    const sub = this._activeSub;
    if (!sub) return;

    const r    = REQ[sub];
    const pool = POOLS[sub];

    // Picker header
    const ph = document.createElement('div');
    ph.className = 'db-picker-header';
    ph.innerHTML = `
      <span class="db-picker-title">${r.icon} Choose ${r.label}</span>
      <span class="db-picker-hint">${r.hint}</span>
    `;
    container.appendChild(ph);

    // Card grid — same visual as Card List tab
    const grid = document.createElement('div');
    grid.className = 'inv-card-grid';

    pool.forEach(card => {
      const inDraft    = this._draft[sub].filter(c => c.cardId === card.cardId).length;
      const inPending  = this._pending.filter(c => c.cardId === card.cardId).length;
      const total      = inDraft + inPending;
      const draftTotal = this._draft[sub].length + this._pending.length;

      let canAdd = true, blockedMsg = '';

      if (sub === 'champions') {
        if (total >= 1)      { canAdd = false; blockedMsg = 'Added'; }
        if (draftTotal >= 3) { canAdd = false; blockedMsg = 'Full (3/3)'; }
      } else if (sub === 'elites') {
        if (total >= 1)       { canAdd = false; blockedMsg = 'Added'; }
        if (draftTotal >= 10) { canAdd = false; blockedMsg = 'Full (10/10)'; }
      } else if (sub === 'spells') {
        if (total >= 2)       { canAdd = false; blockedMsg = 'Max ×2'; }
        if (draftTotal >= 10) { canAdd = false; blockedMsg = 'Full (10/10)'; }
      }
      // summons: no cap

      const el = this._buildPickerCard(card, { canAdd, blockedMsg, total });
      grid.appendChild(el);
    });

    container.appendChild(grid);

    // Actions bar
    const actions = document.createElement('div');
    actions.className = 'db-picker-actions';

    const n = this._pending.length;
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-primary';
    confirmBtn.textContent = `✓ Confirm  (${n} card${n !== 1 ? 's' : ''})`;
    confirmBtn.disabled = n === 0;
    confirmBtn.addEventListener('click', () => {
      this._draft[sub].push(...this._pending);
      this._pending   = [];
      this._activeSub = null;
      this._refreshAll();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-back';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      this._pending   = [];
      this._activeSub = null;
      this._refreshAll();
    });

    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);
    container.appendChild(actions);
  },

  // Build a single picker card using the cg-hand-card visual
  _buildPickerCard(card, { canAdd, blockedMsg, total }) {
    const el = document.createElement('div');
    el.className = 'cg-hand-card inv-card-tile db-picker-card'
      + (!canAdd  ? ' db-pcard-disabled' : '')
      + (total > 0 ? ' db-pcard-staged'   : '');

    if (card.type === 'spell') {
      el.innerHTML = `
        <div class="cg-card-top">
          <span class="cg-card-name">${card.name}</span>
          <span class="cg-hcard-cost">0</span>
        </div>
        <div class="cg-type-label">Spell</div>
        <div class="cg-card-art-wrap"><div class="cg-art-emoji">${card.art ?? '✨'}</div></div>
      `;
    } else if (card.type === 'champion') {
      el.innerHTML = `
        <div class="cg-card-top">
          <span class="cg-card-name">${card.name}</span>
        </div>
        ${card.cardType ? `<div class="cg-type-label">${card.cardType}</div>` : ''}
        <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
        <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:100%;background:#4ab87c"></div></div>
        <div class="cg-card-stats"><span class="cg-stat-hp">HP ${card.hp}</span></div>
        <div class="cg-card-bottom">${_rarityBadge(card)}<div class="cg-terrain-circle">${_terrainCircle(card)}</div><span class="cg-card-uid">${card.cardUid ?? ''}</span></div>
      `;
    } else if (card.type === 'elite') {
      el.innerHTML = `
        <div class="cg-card-top">
          <span class="cg-card-name">${card.name}</span>
        </div>
        ${card.cardType ? `<div class="cg-type-label">${card.cardType}</div>` : ''}
        <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
        <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:100%;background:#4ab87c"></div></div>
        <div class="cg-card-stats">
          <span class="cg-stat-hp">HP ${card.hp}</span>
          <span class="cg-stat-pow">POW ${card.power}</span>
        </div>
        <div class="cg-card-bottom">${_rarityBadge(card)}<div class="cg-terrain-circle">${_terrainCircle(card)}</div><span class="cg-card-uid">${card.cardUid ?? ''}</span></div>
      `;
    } else {
      // summon
      el.innerHTML = `
        <div class="cg-card-top">
          <span class="cg-card-name">${card.name}</span>
          <span class="cg-hcard-cost">${card.summonCost ?? ''}</span>
        </div>
        ${card.cardType ? `<div class="cg-type-label">${card.cardType}</div>` : ''}
        <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
        <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:100%;background:#4ab87c"></div></div>
        <div class="cg-card-stats">
          <span class="cg-stat-hp">HP ${card.hp}</span>
          <span class="cg-stat-pow">POW ${card.power}</span>
        </div>
        <div class="cg-card-bottom">${_rarityBadge(card)}<div class="cg-terrain-circle">${_terrainCircle(card)}</div><span class="cg-card-uid">${card.cardUid ?? ''}</span></div>
      `;
    }

    // Staged count badge (top-right corner)
    if (total > 0) {
      const badge = document.createElement('div');
      badge.className = 'db-pcard-badge';
      badge.textContent = `×${total}`;
      el.appendChild(badge);
    }

    // Disabled overlay
    if (!canAdd) {
      const block = document.createElement('div');
      block.className = 'db-pcard-block';
      block.textContent = blockedMsg;
      el.appendChild(block);
    }

    el.dataset.cardid = card.cardId;

    if (canAdd) {
      el.addEventListener('click', () => {
        this._pending.push({ ...card });
        this._updatePickerCardState(this._activeSub);
        this._updateConfirmBtn();
        this._renderRight(document.getElementById('db-right-panel'));
      });
    }

    return el;
  },

  // Update picker card visuals in-place after a selection (no full re-render)
  _updatePickerCardState(sub) {
    const grid = document.getElementById('db-picker-area')?.querySelector('.inv-card-grid');
    if (!grid) return;

    const draftTotal = this._draft[sub].length + this._pending.length;
    const subFull = (sub === 'champions' && draftTotal >= 3)
                 || (sub === 'elites'    && draftTotal >= 10)
                 || (sub === 'spells'    && draftTotal >= 10);

    POOLS[sub].forEach(card => {
      const el = grid.querySelector(`[data-cardid="${card.cardId}"]`);
      if (!el) return;

      const inDraft   = this._draft[sub].filter(c => c.cardId === card.cardId).length;
      const inPending = this._pending.filter(c => c.cardId === card.cardId).length;
      const total     = inDraft + inPending;

      // Staged badge
      let badge = el.querySelector('.db-pcard-badge');
      if (total > 0) {
        if (!badge) { badge = document.createElement('div'); badge.className = 'db-pcard-badge'; el.appendChild(badge); }
        badge.textContent = `×${total}`;
        el.classList.add('db-pcard-staged');
      } else {
        badge?.remove();
        el.classList.remove('db-pcard-staged');
      }

      // Disabled state
      let disabled = false, blockedMsg = '';
      if (sub === 'champions') {
        if (total >= 1) { disabled = true; blockedMsg = 'Added'; }
        else if (subFull) { disabled = true; blockedMsg = 'Full (3/3)'; }
      } else if (sub === 'elites') {
        if (total >= 1) { disabled = true; blockedMsg = 'Added'; }
        else if (subFull) { disabled = true; blockedMsg = 'Full (10/10)'; }
      } else if (sub === 'spells') {
        if (total >= 2) { disabled = true; blockedMsg = 'Max ×2'; }
        else if (subFull) { disabled = true; blockedMsg = 'Full (10/10)'; }
      }

      if (disabled) {
        el.classList.add('db-pcard-disabled');
        let block = el.querySelector('.db-pcard-block');
        if (!block) { block = document.createElement('div'); block.className = 'db-pcard-block'; el.appendChild(block); }
        block.textContent = blockedMsg;
      } else {
        el.classList.remove('db-pcard-disabled');
        el.querySelector('.db-pcard-block')?.remove();
      }
    });
  },

  // Update confirm button count in-place
  _updateConfirmBtn() {
    const btn = document.querySelector('#db-picker-area .btn-primary');
    if (!btn) return;
    const n = this._pending.length;
    btn.textContent = `✓ Confirm  (${n} card${n !== 1 ? 's' : ''})`;
    btn.disabled = n === 0;
  },

  // ── Right panel ─────────────────────────────────────────────────────────────

  _renderRight(container) {
    if (!container) return;
    container.innerHTML = '';

    const sub = this._activeSub;

    const titleEl = document.createElement('div');
    titleEl.className = 'db-right-title';
    titleEl.textContent = sub ? `${REQ[sub].icon} ${REQ[sub].label}` : '← Select a sub-deck';
    container.appendChild(titleEl);

    if (!sub) {
      const hint = document.createElement('p');
      hint.className = 'db-right-empty';
      hint.textContent = 'Press "Select Cards" on a sub-deck to see its contents here.';
      container.appendChild(hint);
      return;
    }

    const r         = REQ[sub];
    const committed = this._draft[sub];
    const total     = committed.length;
    const complete  = r.exact ? total === r.max : total >= r.min;

    // Count badge
    const countBadge = document.createElement('div');
    countBadge.className = 'db-right-count ' + (complete ? 'ok' : 'need');
    countBadge.textContent = r.exact ? `${total} / ${r.max}` : `${total} / ${r.min}+`;
    container.appendChild(countBadge);

    const list = document.createElement('div');
    list.className = 'db-right-list';

    if (!committed.length && !this._pending.length) {
      const empty = document.createElement('p');
      empty.className = 'db-right-empty';
      empty.textContent = 'No cards added yet.';
      list.appendChild(empty);
    }

    // Committed cards (click to remove)
    committed.forEach((card, idx) => {
      const entry = document.createElement('div');
      entry.className = 'db-right-entry';
      entry.innerHTML = `
        <span class="db-re-art">${card.art ?? '✨'}</span>
        <span class="db-re-name">${card.name}</span>
        <span class="db-re-remove" title="Remove">✕</span>
      `;
      entry.addEventListener('click', () => {
        this._draft[sub].splice(idx, 1);
        this._refreshAll();
      });
      list.appendChild(entry);
    });

    // Pending (staged, not yet confirmed)
    if (this._pending.length) {
      const sep = document.createElement('div');
      sep.className = 'db-right-sep';
      sep.textContent = '— Pending —';
      list.appendChild(sep);

      this._pending.forEach((card, idx) => {
        const entry = document.createElement('div');
        entry.className = 'db-right-entry pending';
        entry.innerHTML = `
          <span class="db-re-art">${card.art ?? '✨'}</span>
          <span class="db-re-name">${card.name}</span>
          <span class="db-re-remove" title="Unstage">✕</span>
        `;
        entry.addEventListener('click', () => {
          this._pending.splice(idx, 1);
          this._renderPicker(document.getElementById('db-picker-area'));
          this._renderRight(container);
        });
        list.appendChild(entry);
      });
    }

    container.appendChild(list);
  },

  // ── Create / Save Deck ──────────────────────────────────────────────────────

  _hasChanges() {
    if (!this._editDeck) return false;
    const orig = {
      champions: this._editDeck.champions ?? [],
      elites:    this._editDeck.elites    ?? [],
      summons:   this._editDeck.summons   ?? [],
      spells:    this._editDeck.spells    ?? [],
    };
    return JSON.stringify(orig) !== JSON.stringify(this._draft);
  },

  _isComplete() {
    const { champions, elites, summons, spells } = this._draft;
    if (champions.length < 1)  return false;
    if (elites.length !== 10)  return false;
    if (summons.length < 40)   return false;
    if (spells.length !== 10)  return false;
    const eliteIds = elites.map(e => e.cardId);
    if (new Set(eliteIds).size !== eliteIds.length) return false;
    const tally = {};
    spells.forEach(s => { tally[s.cardId] = (tally[s.cardId] ?? 0) + 1; });
    if (Object.values(tally).some(n => n > 2)) return false;
    return true;
  },

  _renderCreateBtn(container) {
    if (!container) return;
    container.innerHTML = '';
    if (!this._isComplete()) return;
    const btn = document.createElement('button');
    btn.className = 'db-create-btn btn-primary';
    if (this._editDeck) {
      // Hide Save Changes while a sub-deck picker is open, or if nothing changed
      if (this._activeSub !== null || !this._hasChanges()) return;
      btn.textContent = '💾 Save Changes';
      btn.addEventListener('click', () => this._saveDeck());
    } else {
      const customCount = (GameState.deck.customDecks ?? []).length;
      const atLimit = customCount >= 40;
      btn.textContent = atLimit ? `✦ Deck Limit Reached (40/40) ✦` : '✦ Create Deck ✦';
      btn.disabled = atLimit;
      if (atLimit) {
        btn.title = 'Delete a custom deck to make space.';
        btn.style.opacity = '0.5';
      }
      btn.addEventListener('click', () => this._createDeck());
    }
    container.appendChild(btn);
  },

  _createDeck() {
    if (!GameState.deck.customDecks) GameState.deck.customDecks = [];
    if (GameState.deck.customDecks.length >= 40) return;
    const name = this._deckName || `Deck${GameState.deck.customDecks.length + 1}`;
    GameState.deck.customDecks.push({
      ...this._draft,
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      createdAt: Date.now(),
    });
    this._showFinishAnimation('Deck Created!', 'Your new deck has been saved.');
  },

  _saveDeck() {
    const decks = GameState.deck.customDecks ?? [];
    const idx   = decks.findIndex(d => d === this._editDeck || (d.id && d.id === this._editDeck?.id));
    const name  = this._deckName || this._editDeck.name || 'Deck';
    const updated = {
      ...this._editDeck,
      ...this._draft,
      id: this._editDeck.id ?? `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
    };
    if (idx !== -1) {
      decks[idx] = updated;
    } else {
      // Save Changes should never create a new deck.
      return;
    }
    this._showFinishAnimation('Changes Saved!', 'Your deck has been updated.');
  },

  // Full-screen dark transition: fades to black, fires action(), then fades back in
  _doTransition(action) {
    const overlay = document.createElement('div');
    overlay.className = 'db-transition-overlay';
    document.body.appendChild(overlay);
    setTimeout(() => {
      action();
      setTimeout(() => {
        overlay.classList.add('db-transition-overlay--out');
        setTimeout(() => overlay.remove(), 420);
      }, 50);
    }, 300);
  },

  _showFinishAnimation(headline, sub) {
    const root = document.getElementById('game-root') ?? document.body;
    const flash = document.createElement('div');
    flash.className = 'db-created-overlay';
    flash.innerHTML = `
      <div class="db-created-burst">
        <div class="db-created-sparks">✦ ✦ ✦ ✦ ✦</div>
        <div class="db-created-text">${headline}</div>
        <div class="db-created-sub">${sub}</div>
        <div class="db-created-sparks">✦ ✦ ✦ ✦ ✦</div>
      </div>
    `;
    root.appendChild(flash);
    setTimeout(() => {
      flash.remove();
      this._doTransition(() => {
        const prev = ScreenManager._stack[ScreenManager._stack.length - 2];
        if (prev) prev.params = { ...prev.params, tab: 'Decks' };
        EventBus.emit('screen:pop');
      });
    }, 1400);
  },

  // ── Refresh helpers ─────────────────────────────────────────────────────────

  _refreshAll() {
    // Tiles
    const row = document.getElementById('db-subdeck-row');
    if (row) { row.innerHTML = ''; SUB_ORDER.forEach(sub => this._buildTile(sub, row)); }
    // Picker
    this._renderPicker(document.getElementById('db-picker-area'));
    // Right panel
    this._renderRight(document.getElementById('db-right-panel'));
    // Create button
    this._renderCreateBtn(document.getElementById('db-create-area'));
  },

  update(dt) {},
};

export default DeckBuilderScreen;
