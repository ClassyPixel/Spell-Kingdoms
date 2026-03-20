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
  champions: { min: 1,  max: 3,   exact: false, label: 'Champions', icon: '👑', hint: '1–3 champions' },
  elites:    { min: 10, max: 10,  exact: true,  label: 'Elites',    icon: '🐉', hint: 'Exactly 10 unique elites' },
  summons:   { min: 40, max: 9999,exact: false, label: 'Summons',   icon: '✨', hint: '40 or more summons' },
  spells:    { min: 10, max: 10,  exact: true,  label: 'Spells',    icon: '🔮', hint: 'Exactly 10 spells · max 2 per type' },
};

const SUB_ORDER = ['champions', 'elites', 'summons', 'spells'];
const RARITY_COLOR = { S: '#e0b84a', A: '#9060e0', B: '#4ab0d0', C: '#888' };

// ── Screen ────────────────────────────────────────────────────────────────────
const DeckBuilderScreen = {
  _container:  null,
  _draft:      { champions: [], elites: [], summons: [], spells: [] },
  _activeSub:  null,   // which sub-deck picker is open
  _pending:    [],     // cards staged but not yet confirmed
  _deckName:   'Deck1',

  mount(container) {
    this._container = container;
    this._draft     = { champions: [], elites: [], summons: [], spells: [] };
    this._activeSub = null;
    this._pending   = [];
    this._deckName  = 'Deck1';
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
    backBtn.addEventListener('click', () => EventBus.emit('screen:pop'));
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

    // Art preview strip (up to 6 icons)
    const arts = cards.slice(0, 6).map(c => `<span title="${c.name}">${c.art ?? '✨'}</span>`).join('');
    const more = cards.length > 6 ? `<span class="db-tile-more">+${cards.length - 6}</span>` : '';

    // Count display
    const countStr = r.exact
      ? `${count} / ${r.max}`
      : `${count} / ${r.min}+`;

    tile.innerHTML = `
      <div class="db-tile-icon">${r.icon}</div>
      <div class="db-tile-label">${r.label}</div>
      <div class="db-tile-count ${complete ? 'ok' : 'need'}">${countStr}</div>
      <div class="db-tile-arts">${arts || '<span class="db-tile-empty">No cards yet</span>'}${more}</div>
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

    // Card grid
    const grid = document.createElement('div');
    grid.className = 'db-picker-grid';

    pool.forEach(card => {
      const inDraft   = this._draft[sub].filter(c => c.cardId === card.cardId).length;
      const inPending = this._pending.filter(c => c.cardId === card.cardId).length;
      const total     = inDraft + inPending;
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

      const rc = RARITY_COLOR[card.rarity] ?? '#888';
      const el = document.createElement('div');
      el.className = 'db-pcard' + (!canAdd ? ' disabled' : '') + (total > 0 ? ' staged' : '');

      el.innerHTML = `
        <div class="db-pcard-art">${card.art ?? '✨'}</div>
        <div class="db-pcard-name">${card.name}</div>
        <div class="db-pcard-meta">${card.cardType ?? card.type ?? ''}${card.rarity ? ` · <span style="color:${rc}">${card.rarity}</span>` : ''}</div>
        ${card.hp !== undefined ? `<div class="db-pcard-stat">HP ${card.hp}  PWR ${card.power}</div>` : ''}
        ${total > 0 ? `<div class="db-pcard-badge">×${total}</div>` : ''}
        ${!canAdd ? `<div class="db-pcard-block">${blockedMsg}</div>` : ''}
      `;

      if (canAdd) {
        el.addEventListener('click', () => {
          this._pending.push({ ...card });
          this._renderPicker(document.getElementById('db-picker-area'));
          this._renderRight(document.getElementById('db-right-panel'));
        });
      }
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

  // ── Create Deck ─────────────────────────────────────────────────────────────

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
    btn.textContent = '✦ Create Deck ✦';
    btn.addEventListener('click', () => this._createDeck());
    container.appendChild(btn);
  },

  _createDeck() {
    if (!GameState.deck.customDecks) GameState.deck.customDecks = [];
    const name = this._deckName || `Deck${GameState.deck.customDecks.length + 1}`;
    GameState.deck.customDecks.push({ ...this._draft, name, createdAt: Date.now() });
    this._showCreatedAnimation();
  },

  _showCreatedAnimation() {
    const root = document.getElementById('game-root') ?? document.body;
    const overlay = document.createElement('div');
    overlay.className = 'db-created-overlay';

    overlay.innerHTML = `
      <div class="db-created-burst">
        <div class="db-created-sparks">✦ ✦ ✦ ✦ ✦</div>
        <div class="db-created-text">Deck Created!</div>
        <div class="db-created-sub">Your deck has been saved.</div>
        <div class="db-created-sparks">✦ ✦ ✦ ✦ ✦</div>
      </div>
    `;
    root.appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
        EventBus.emit('screen:pop');
      }, 600);
    }, 2400);
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
