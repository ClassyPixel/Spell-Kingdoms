/**
 * CardGameScreen — Grid-based tactical card game renderer.
 *
 * Layout:
 *   Phase bar (top)
 *   Body row: [Dice Zone | Grid + Hand | Sidebar]
 *   Bottom row: [Crypt Zone | Log | Deck Zone]
 *
 * Listens: cardgame:stateChanged { state }
 * Emits:   cardgame:placeChampion { col, handIdx },
 *          cardgame:placeElite { handIdx, col },
 *          cardgame:rollDice, cardgame:playToElite,
 *          cardgame:playSpell, cardgame:spellTarget, cardgame:cancelSpell,
 *          cardgame:selectElite, cardgame:rally, cardgame:retreat,
 *          cardgame:enableAttack, cardgame:attackTarget,
 *          cardgame:nextPhase, cardgame:surrender
 */
import EventBus from '../EventBus.js';
import SoundSystem from '../systems/SoundSystem.js';
import MusicPlayer from '../systems/MusicPlayer.js';
import GameState from '../GameState.js';
import { NPCS, ITEMS, CARDS, LOOT_BOX_TYPES } from '../Data.js';
import CardArtPreloader from '../systems/CardArtPreloader.js';

const ROWS = 6;
const COLS = 5;
const PLAYER_ROW  = 5;
const OPP_ROW     = 0;
const P_ELITE_ROW = 4;
const O_ELITE_ROW = 1;

const PHASE_LABELS = {
  initialize: 'Initialize',
  draw:       'Draw',
  conjure:    'Conjure',
  strategy:   'Strategy',
  regroup:    'Regroup',
  end:        'End',
  gameover:   'Game Over',
};

const ROLE_ICON = { offensive: '⚔', defensive: '🛡', support: '✚' };

const TERRAIN_ICON = {
  fire:  'assets/images/CardGameArt/TypeArt/fire_img.png',
  ice:   'assets/images/CardGameArt/TypeArt/ice_img.png',
  water: 'assets/images/CardGameArt/TypeArt/water_img.png',
  wind:  'assets/images/CardGameArt/TypeArt/wind_img.png',
  earth: 'assets/images/CardGameArt/TypeArt/earth_img.png',
  spell: 'assets/images/CardGameArt/TypeArt/spell_img.png',
};

// Play zone terrain cell types
const CELL_TERRAIN_ICON = {
  camp:       '⛺',
  lava_floor: '🌋',
  the_void:   '⬛',
};
const CELL_TERRAIN_NAME = {
  camp:       'Camp — Stacked summons restore +1 HP each draw phase',
  lava_floor: 'Lava Floor — Fire-type elite & summons gain +1 power',
  the_void:   'The Void — Destroys any elite & summons on this terrain. Banished after.',
};
const RARITY_COLOR = { C: '#aaa', B: '#4ab87c', A: '#9b30d0', S: '#c07820' };
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

// ── Local helpers ──────────────────────────────────────────────────────────────
function findPlayerElites(s) {
  const out = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (s.grid[r]?.[c]?.type === 'elite' && s.grid[r][c].owner === 'player')
        out.push(s.grid[r][c]);
  return out;
}

// ── Dice SVG ──────────────────────────────────────────────────────────────────
function dieFaceHTML(value, size = 56) {
  if (!value) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="52" height="52" rx="10" fill="#101828" stroke="#1e3050" stroke-width="2"/>
      <text x="28" y="36" text-anchor="middle" fill="#2a4060" font-size="22" font-family="sans-serif" font-weight="bold">?</text>
    </svg>`;
  }
  const dotMap = {
    1: [[28,28]],
    2: [[16,16],[40,40]],
    3: [[16,16],[28,28],[40,40]],
    4: [[16,16],[40,16],[16,40],[40,40]],
    5: [[16,16],[40,16],[28,28],[16,40],[40,40]],
    6: [[16,16],[40,16],[16,28],[40,28],[16,40],[40,40]],
  }[value] || [[28,28]];
  const dots = dotMap.map(([x,y]) =>
    `<circle cx="${x}" cy="${y}" r="5" fill="#c8e8ff"/>`
  ).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="52" height="52" rx="10" fill="#152035" stroke="#3060a0" stroke-width="2"/>
    ${dots}
  </svg>`;
}

// ── Deck stack HTML ────────────────────────────────────────────────────────────
function deckStackHTML(label, count, color) {
  const empty = count === 0;
  return `
    <div class="cg-deck-stack ${empty ? 'empty' : ''}" data-label="${label}" title="${count} cards">
      <div class="cg-deck-cards">
        ${!empty ? `
          <div class="cg-deck-back cg-deck-back-3" style="--dk-color:${color}"></div>
          <div class="cg-deck-back cg-deck-back-2" style="--dk-color:${color}"></div>
          <div class="cg-deck-back cg-deck-back-1" style="--dk-color:${color}"></div>
        ` : `<div class="cg-deck-empty-slot"></div>`}
      </div>
      <div class="cg-deck-count">${count}</div>
      <div class="cg-deck-label">${label}</div>
    </div>
  `;
}

// ── Screen ─────────────────────────────────────────────────────────────────────
const CardGameScreen = {
  _container:      null,
  _unsub:          [],
  _state:          null,
  _champPanelCol:  null,   // column whose champ panel is open (null = closed)
  _escHandler:     null,
  _movePreview:       null,   // { mode:'rally'|'retreat', fromRow, fromCol, cells:[{row,col,direction}] }
  _touchSel:          null,   // { source:'hand'|'panel', handIdx?, champCol?, summonIdx? }
  _touchPreviewTimer: null,

  mount(container, params = {}) {
    this._container          = container;
    this._champPanelCol      = null;
    this._knownHandKeys      = new Set();
    this._idleTimer          = null;
    this._idleHandler        = null;
    this._touchSel           = null;
    this._touchPreviewTimer  = null;
    this._render();
    this._bindEvents();
    this._bindMenuButton();
    this._bindEscKey();
    this._playMatchMusic();
    EventBus.emit('hud:hide');
  },


  unmount() {
    this._unsub.forEach(fn => fn());
    this._unsub         = [];
    this._container     = null;
    this._state         = null;
    this._champPanelCol      = null;
    this._movePreview        = null;
    this._knownHandKeys      = new Set();
    this._clearTouchSel();
    clearTimeout(this._touchPreviewTimer);
    this._touchSel          = null;
    this._touchPreviewTimer = null;
    this._clearIdleWatch();
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
    this._stopMatchMusic();
    EventBus.emit('hud:show');
  },

  update() {},

  // ── Match music ───────────────────────────────────────────────────────────────
  _playMatchMusic() {
    MusicPlayer.play('assets/audio/MatchOST/01.mp3');
  },

  _stopMatchMusic() {
    MusicPlayer.stop();
  },

  // ── Scaffold ──────────────────────────────────────────────────────────────────
  _render() {
    this._container.innerHTML = `
      <div class="cg-screen">
        <div class="cg-top">
          <div class="cg-opp-crypt-zone" id="cg-opp-crypt-zone"></div>
          <div class="cg-opp-hand-area"  id="cg-opp-hand-area"></div>
          <div class="cg-opp-deck-zone"  id="cg-opp-deck-zone"></div>
        </div>
        <div class="cg-phase-bar"  id="cg-phase-bar"></div>
        <button class="cg-menu-btn" id="cg-menu-btn" title="Game Menu">☰</button>
        <div class="cg-ingame-menu hidden" id="cg-ingame-menu">
          <button class="cg-ingame-menu-item cg-forfeit-btn" id="cg-forfeit-btn">💀 Forfeit</button>
        </div>
        <div class="cg-body">
          <div class="cg-left-panel">
            <div class="cg-dice-zone" id="cg-dice-zone"></div>
            <div class="cg-crypt-zone" id="cg-crypt-zone"></div>
          </div>
          <div class="cg-center">
            <div class="cg-grid-wrap">
              <div class="cg-preview-spacer"></div>
              <div class="cg-grid" id="cg-grid"></div>
              <div class="cg-preview-zone">
                <div class="cg-card-preview hidden" id="cg-card-preview"></div>
              </div>
            </div>
            <div class="cg-champ-panel hidden" id="cg-champ-panel"></div>
            <div class="cg-hand-area" id="cg-hand-area"></div>
          </div>
          <div class="cg-right-panel">
            <div class="cg-phase-msg hidden" id="cg-phase-msg"></div>
            <div class="cg-sidebar" id="cg-sidebar"></div>
            <div class="cg-deck-zone" id="cg-deck-zone"></div>
          </div>
        </div>
      </div>
    `;
  },

  _bindEvents() {
    // Highlight all drop zones while any drag is in flight
    const _onDragStart = () => this._container?.querySelector('.cg-screen')?.classList.add('dragging');
    const _onDragEnd   = () => this._container?.querySelector('.cg-screen')?.classList.remove('dragging');
    document.addEventListener('dragstart', _onDragStart);
    document.addEventListener('dragend',   _onDragEnd);
    this._unsub.push(() => {
      document.removeEventListener('dragstart', _onDragStart);
      document.removeEventListener('dragend',   _onDragEnd);
    });

    this._unsub.push(
      EventBus.on('cardgame:stateChanged', ({ state }) => {
        this._state = state;
        this._update();
      }),
      EventBus.on('cardgame:summonAssigned', ({ row, col, art, power }) => {
        this._showSummonPopup(row, col, art, power);
      }),
      EventBus.on('cardgame:campHeal', ({ row, col }) => {
        this._showCampHealPopup(row, col);
      }),
      EventBus.on('cardgame:beginMatch', () => {
        this._showBeginMatchPopup();
        CardArtPreloader.preloadMatchFullInBackground(this._state);
      }),
      EventBus.on('cardgame:cardDrawn', () => {
        SoundSystem.cardSlide();
      }),
      EventBus.on('cardgame:attackPerformed', ({ attackerRow, attackerCol, targetRow, targetCol, art, artFile }) => {
        SoundSystem.attack();
        this._showAttackAnimation(attackerRow, attackerCol, targetRow, targetCol, art, artFile);
      }),
      EventBus.on('cardgame:cardDestroyed', ({ row, col, art }) => {
        const grid   = document.getElementById('cg-grid');
        const screen = this._container?.querySelector('.cg-screen');
        const cell   = grid?.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cell || !screen) return;
        const rect  = cell.getBoundingClientRect();
        const sRect = screen.getBoundingClientRect();
        const cx = rect.left - sRect.left + rect.width  / 2;
        const cy = rect.top  - sRect.top  + rect.height / 2;
        setTimeout(() => this._showCardExplosion(screen, cx, cy, art), 230);
      }),
      EventBus.on('cardgame:gameOver', ({ win, isQuickPlay, npcId }) => {
        if (win) SoundSystem.victory(); else SoundSystem.defeat();
        MusicPlayer.play(win ? 'assets/audio/VictoryOST/01.mp3' : 'assets/audio/DefeatOST/01.mp3');
        this._showGameOverPopup(win, isQuickPlay ?? false, npcId ?? null);
      }),
      EventBus.on('cardgame:hqCaptured', () => {
        this._showHQCapturedAnimation();
      }),
    );
  },

  _bindMenuButton() {
    const menuBtn   = document.getElementById('cg-menu-btn');
    const menuPanel = document.getElementById('cg-ingame-menu');
    if (!menuBtn || !menuPanel) return;

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuPanel.classList.toggle('hidden');
    });

    document.getElementById('cg-forfeit-btn')?.addEventListener('click', () => {
      menuPanel.classList.add('hidden');
      EventBus.emit('cardgame:surrender');
    });

    document.addEventListener('click', function closeMenu() {
      menuPanel.classList.add('hidden');
    });
  },

  _bindEscKey() {
    this._escHandler = (e) => {
      if (e.key !== 'Escape') return;
      if (this._movePreview) {
        this._movePreview = null;
        this._update();
      } else if (this._state?.pendingTeleport || this._state?.pendingSpell) {
        EventBus.emit('cardgame:cancelSpell');
      } else if (this._champPanelCol !== null) {
        this._champPanelCol = null;
        this._update();
      }
    };
    document.addEventListener('keydown', this._escHandler);
  },

  // ── Full UI refresh ───────────────────────────────────────────────────────────
  _update() {
    const s = this._state;
    if (!s || !this._container) return;
    this._hideStackTooltip();
    this._renderPhaseBar(s);
    this._renderDiceZone(s);
    this._renderGrid(s);
    this._renderSidebar(s);
    this._renderHand(s);
    this._renderCryptZone(s);
    this._renderOppCryptZone(s);
    this._renderOppHand(s);
    this._renderOppDeckZone(s);
    this._renderDeckZone(s);
    this._renderLog(s);
    this._renderChampPanel(s);
  },

  // ── Phase bar ─────────────────────────────────────────────────────────────────
  _phaseHint(s) {
    if (s.gameOver || s.pendingSpell || s.pendingTeleport) return '';
    if (s.phase === 'initialize') {
      if (s.initSubStep === 'place_champions') return 'Drag your champion(s) to the bottom row.';
      if (s.initSubStep === 'place_elites')   return 'Drag your elite(s) in front of each champion.';
    }
    if (s.phase === 'conjure') {
      if (!s.diceResult) return 'Click the dice to roll.';
      if (s.matchingHand.length > 0) return 'Drag a matching card onto a champion or elite to summon it.';
      if (s.playerHand.some(c => c.type === 'spell')) return 'No matching summons — click a spell to cast it, or advance.';
    }
    if (s.phase === 'strategy') {
      if (s.strategy?.attackMode) return 'Click an opponent elite to attack it.';
      return 'Click one of your elites to select it, then choose an action.';
    }
    if (s.phase === 'regroup') return 'Click a champion to assign stacked summons, or click a spell to cast it.';
    return '';
  },

  _startIdleWatch(hint) {
    this._clearIdleWatch();
    const msgEl = document.getElementById('cg-phase-msg');
    if (!hint || !msgEl) return;
    const show = () => {
      msgEl.classList.remove('hidden', 'cg-phase-msg--out');
      void msgEl.offsetWidth; // force reflow to restart animation
      msgEl.classList.add('cg-phase-msg--in');
    };
    const reset = () => { clearTimeout(this._idleTimer); this._idleTimer = setTimeout(show, 3000); };
    this._idleHandler = reset;
    document.addEventListener('mousemove',  this._idleHandler);
    document.addEventListener('keydown',    this._idleHandler);
    document.addEventListener('touchstart', this._idleHandler, { passive: true });
    reset();
  },

  _clearIdleWatch() {
    clearTimeout(this._idleTimer);
    this._idleTimer = null;
    if (this._idleHandler) {
      document.removeEventListener('mousemove',  this._idleHandler);
      document.removeEventListener('keydown',    this._idleHandler);
      document.removeEventListener('touchstart', this._idleHandler);
      this._idleHandler = null;
    }
    const msgEl = document.getElementById('cg-phase-msg');
    if (!msgEl) return;
    if (!msgEl.classList.contains('hidden')) {
      msgEl.classList.remove('cg-phase-msg--in');
      void msgEl.offsetWidth;
      msgEl.classList.add('cg-phase-msg--out');
      msgEl.addEventListener('animationend', () => {
        msgEl.classList.add('hidden');
        msgEl.classList.remove('cg-phase-msg--out');
      }, { once: true });
    } else {
      msgEl.classList.remove('cg-phase-msg--in', 'cg-phase-msg--out');
    }
  },

  _renderPhaseBar(s) {
    const el = document.getElementById('cg-phase-bar');
    if (!el) return;
    const order = ['initialize','draw','conjure','strategy','regroup','end'];
    const cur   = order.indexOf(s.phase);
    const hint  = this._phaseHint(s);

    el.innerHTML = `
      <div class="cg-phase-bar-row">
        <div class="cg-phase-bar-left"><span class="cg-turn-label">Turn ${s.turnNumber}</span></div>
        <div class="cg-phase-pills">
          ${order.map((p, i) => `
            <span class="cg-phase-pill ${s.phase === p ? 'active' : ''} ${i < cur ? 'done' : ''}">${PHASE_LABELS[p]}</span>
            ${i < order.length - 1 ? '<span class="cg-phase-arrow">›</span>' : ''}
          `).join('')}
          <span class="cg-phase-btn-sep">│</span>
          ${this._handNextBtn(s)}
        </div>
      </div>
    `;
    const msgEl = document.getElementById('cg-phase-msg');
    if (msgEl) msgEl.textContent = hint;
    document.getElementById('cg-next-btn')?.addEventListener('click', () => { SoundSystem.click(); EventBus.emit('cardgame:nextPhase'); });
    this._startIdleWatch(hint);
  },

  // ── Dice zone ─────────────────────────────────────────────────────────────────
  _renderDiceZone(s) {
    const el = document.getElementById('cg-dice-zone');
    if (!el) return;

    const canRoll   = s.phase === 'conjure' && !s.diceRolled;
    const rolled    = s.diceResult;
    const d1        = rolled?.[0] ?? null;
    const d2        = rolled?.[1] ?? null;
    const total     = rolled ? d1 + d2 : null;
    const isSpecial = total === 7;

    el.innerHTML = `
      <div class="cg-dice-label">Dice</div>
      <div class="cg-dice-pair ${canRoll ? 'can-roll' : ''}" id="cg-dice-pair">
        <div class="cg-die ${canRoll ? 'rollable' : ''} ${rolled ? 'rolled' : ''}">${dieFaceHTML(d1)}</div>
        <div class="cg-die ${canRoll ? 'rollable' : ''} ${rolled ? 'rolled' : ''}">${dieFaceHTML(d2)}</div>
      </div>
      ${canRoll
        ? `<div class="cg-dice-hint">Click to roll</div>`
        : rolled
          ? `<div class="cg-dice-total ${isSpecial ? 'special' : ''}">${isSpecial ? '✨ 7 ✨' : total}</div>
             <div class="cg-dice-sub">${isSpecial ? 'Spell drawn!' : s.matchingHand.length + ' match'}</div>`
          : `<div class="cg-dice-hint dim">—</div>`
      }
    `;

    if (canRoll) {
      document.getElementById('cg-dice-pair')?.addEventListener('click', () => {
        SoundSystem.click();
        EventBus.emit('cardgame:rollDice');
      });
    }
  },

  // ── Grid ──────────────────────────────────────────────────────────────────────
  _renderGrid(s) {
    const el = document.getElementById('cg-grid');
    if (!el) return;
    el.innerHTML = '';
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS; col++)
        el.appendChild(this._buildCell(s, row, col));
    // Enemy line — absolute overlay between rows 2 and 3 (50% of 6-row grid)
    const line = document.createElement('div');
    line.className = 'cg-enemy-line';
    line.innerHTML = '<span class="cg-enemy-line-label">Enemy Lines</span>';
    el.appendChild(line);
  },

  _buildCell(s, row, col) {
    const cell = document.createElement('div');
    cell.className = 'cg-cell';
    cell.dataset.row = row;
    cell.dataset.col = col;

    const isOppChamp = row === OPP_ROW;
    const isPlrChamp = row === PLAYER_ROW;
    const isOppElite = row === O_ELITE_ROW;
    const isPlrElite = row === P_ELITE_ROW;

    if (isOppChamp) cell.classList.add('cg-row-opp-champ');
    if (isPlrChamp) cell.classList.add('cg-row-plr-champ');
    if (isOppElite) cell.classList.add('cg-row-opp-elite');
    if (isPlrElite) cell.classList.add('cg-row-plr-elite');

    // ── Opponent champion row ──────────────────────────────────────────────────
    if (isOppChamp) {
      // Hide opponent champion placement until initialize phase is complete
      if (s.phase === 'initialize') {
        cell.classList.add('cg-cell-invisible');
        return cell;
      }
      const champ = s.opponentChampions.find(c => c.col === col);
      if (champ) {
        cell.classList.add('cg-cell-champion', 'cg-cell-opp');
        cell.innerHTML = this._champHTML(champ);
        this._bindPreview(cell, champ);
        if (s.strategy.attackMode) {
          cell.classList.add('cg-cell-attackable');
          cell.addEventListener('click', () => EventBus.emit('cardgame:attackTarget', { row, col }));
        }
        // Hover: show opponent elite's summons
        const oppElite = s.grid[O_ELITE_ROW]?.[col];
        if (oppElite?.summons?.length > 0) {
          cell.addEventListener('mouseenter', () => this._showStackTooltip(cell, oppElite.summons, oppElite.name));
          cell.addEventListener('mouseleave', () => this._hideStackTooltip());
        }
      } else {
        cell.classList.add('cg-cell-invisible');
      }
      return cell;
    }

    // ── Player champion row ────────────────────────────────────────────────────
    if (isPlrChamp) {
      const champ = s.playerChampions.find(c => c.col === col);

      // Teleportation destination selection — reveal full champion row
      if (s.pendingTeleport) {
        if (champ) {
          cell.classList.add('cg-cell-champion', 'cg-cell-plr');
          cell.innerHTML = this._champHTML(champ);
          this._bindPreview(cell, champ);
          if (col === s.pendingTeleport.sourceCol) {
            cell.classList.add('cg-cell-teleport-source');
            cell.title = 'Click to cancel Teleportation';
            cell.addEventListener('click', () => EventBus.emit('cardgame:cancelSpell'));
          }
        } else {
          cell.classList.add('cg-cell-empty', 'cg-cell-teleport-dest');
          cell.innerHTML = `<span class="cg-place-hint">✈ Here</span>`;
          cell.addEventListener('click', () => { SoundSystem.drop(); EventBus.emit('cardgame:teleportTarget', { col }); });
        }
        return cell;
      }

      if (champ) {
        cell.classList.add('cg-cell-champion', 'cg-cell-plr');
        cell.innerHTML = this._champHTML(champ);
        this._bindPreview(cell, champ);

        // Spell target: heal_champion or Teleportation source selection
        if (s.pendingSpell?.card.needsTarget === 'player_champion' ||
            s.pendingSpell?.card.needsTarget === 'teleport_champion') {
          cell.classList.add('cg-cell-spell-target');
          cell.addEventListener('click', () => EventBus.emit('cardgame:spellTarget', { row, col }));
          return cell;
        }

        // Conjure: champion cell — stack matching cards OR open panel
        const canStack     = s.phase === 'conjure' && s.diceResult && s.matchingHand.length > 0;
        const canOpenPanel = (s.phase === 'conjure' || s.phase === 'regroup') && (champ.summons?.length ?? 0) > 0;

        if (canStack) {
          cell.classList.add('cg-cell-drop-zone');
          if (canOpenPanel) cell.classList.add('cg-cell-clickable');
          cell.title = 'Drop matching card to stack on champion · Click to assign stacked summons';
          cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('cg-cell-drag-over'); });
          cell.addEventListener('dragleave', () => cell.classList.remove('cg-cell-drag-over'));
          let _justDropped = false;
          cell.addEventListener('drop', e => {
            e.preventDefault();
            cell.classList.remove('cg-cell-drag-over');
            const handIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (!isNaN(handIdx)) {
              SoundSystem.drop();
              _justDropped = true;
              EventBus.emit('cardgame:stackOnChampion', { handIdx, col });
            }
          });
          cell.addEventListener('touchstart', e => {
            if (!this._touchSel || this._touchSel.source !== 'hand') return;
            e.preventDefault();
            SoundSystem.drop();
            EventBus.emit('cardgame:stackOnChampion', { handIdx: this._touchSel.handIdx, col });
            this._clearTouchSel();
          }, { passive: false });
          cell.addEventListener('click', () => {
            if (_justDropped) { _justDropped = false; return; }
            if (canOpenPanel) { this._champPanelCol = col; this._update(); }
          });
        } else if (canOpenPanel) {
          cell.classList.add('cg-cell-clickable');
          cell.title = 'Click to assign stacked summons to an elite';
          cell.addEventListener('click', () => { this._champPanelCol = col; this._update(); });
        }
      } else {
        // Initialize place_champions: drop zone
        if (s.phase === 'initialize' && s.initSubStep === 'place_champions') {
          cell.classList.add('cg-cell-empty', 'cg-cell-drop-zone');
          cell.innerHTML = `<span class="cg-place-hint">+<br>Champion</span>`;
          cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('cg-cell-drag-over'); });
          cell.addEventListener('dragleave', () => cell.classList.remove('cg-cell-drag-over'));
          cell.addEventListener('drop', e => {
            e.preventDefault();
            cell.classList.remove('cg-cell-drag-over');
            const handIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (!isNaN(handIdx)) { SoundSystem.drop(); EventBus.emit('cardgame:placeChampion', { col, handIdx }); }
          });
          cell.addEventListener('touchstart', e => {
            if (!this._touchSel || this._touchSel.source !== 'hand') return;
            e.preventDefault();
            SoundSystem.drop();
            EventBus.emit('cardgame:placeChampion', { col, handIdx: this._touchSel.handIdx });
            this._clearTouchSel();
          }, { passive: false });
        } else {
          // After init: hide empty champion slots
          cell.classList.add('cg-cell-invisible');
        }
      }
      return cell;
    }

    // ── Battle / elite rows ────────────────────────────────────────────────────

    // Hide opponent elite row during initialize (reveals champion column positions)
    if (isOppElite && s.phase === 'initialize') {
      cell.classList.add('cg-cell-invisible');
      return cell;
    }

    const gridCard = s.grid[row]?.[col] ?? null;

    // Move preview cells take priority over normal empty-cell rendering
    if (!gridCard && this._movePreview) {
      const previewMatch = this._movePreview.cells.find(c => c.row === row && c.col === col);
      if (previewMatch) {
        cell.classList.add('cg-cell-move-preview');
        if (previewMatch.extended) cell.classList.add('cg-cell-move-preview--extended');
        cell.addEventListener('click', () => {
          const mode = this._movePreview?.mode;
          const dir  = previewMatch.direction;
          this._movePreview = null;
          if (mode === 'rally')   { SoundSystem.move(); EventBus.emit('cardgame:rally', { direction: dir }); }
          else if (mode === 'retreat') { SoundSystem.move(); EventBus.emit('cardgame:retreat'); }
        });
        return cell;
      }
    }

    // P_ELITE_ROW empty slot: drop zone for elite placement (init AND mid-game)
    if (isPlrElite && !gridCard) {
      const hasChamp = s.playerChampions.find(c => c.col === col);
      const eliteInHand = s.playerHand.some(c => c.type === 'elite');
      const isInitStep  = s.phase === 'initialize' && s.initSubStep === 'place_elites';
      const isMidGame   = s.phase !== 'initialize' && eliteInHand;

      if (hasChamp && (isInitStep || isMidGame)) {
        cell.classList.add('cg-cell-empty', 'cg-cell-drop-zone');
        cell.innerHTML = `<span class="cg-place-hint">+<br>Elite</span>`;
        cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('cg-cell-drag-over'); });
        cell.addEventListener('dragleave', () => cell.classList.remove('cg-cell-drag-over'));
        cell.addEventListener('drop', e => {
          e.preventDefault();
          cell.classList.remove('cg-cell-drag-over');
          const handIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
          if (!isNaN(handIdx)) { SoundSystem.drop(); EventBus.emit('cardgame:placeElite', { handIdx, col }); }
        });
        cell.addEventListener('touchstart', e => {
          if (!this._touchSel || this._touchSel.source !== 'hand') return;
          e.preventDefault();
          SoundSystem.drop();
          EventBus.emit('cardgame:placeElite', { handIdx: this._touchSel.handIdx, col });
          this._clearTouchSel();
        }, { passive: false });
        return cell;
      }
    }

    if (gridCard?.type === 'elite') {
      const isPlayer = gridCard.owner === 'player';
      const isSel    = s.strategy.selectedRow === row && s.strategy.selectedCol === col;
      const hasActed = isPlayer && (s.strategy.actedIids?.has(gridCard.iid) ?? false);

      cell.classList.add('cg-cell-elite', isPlayer ? 'cg-cell-plr' : 'cg-cell-opp');
      if (isSel)     cell.classList.add('cg-cell-selected');
      if (hasActed)  cell.classList.add('cg-cell-acted');
      if (s.strategy.attackMode && !isPlayer) cell.classList.add('cg-cell-attackable');

      // Spell targeting
      const pend = s.pendingSpell;
      if (pend) {
        const nt = pend.card.needsTarget;
        if ((nt === 'player_elite' && isPlayer) || (nt === 'opponent_elite' && !isPlayer)) {
          cell.classList.add('cg-cell-spell-target');
        }
      }

      cell.innerHTML = this._eliteHTML(gridCard, isSel, hasActed);
      this._bindPreview(cell, gridCard);

      // Inline action menu when this elite is selected and ready to act
      if (isSel && !hasActed && isPlayer && s.phase === 'strategy' && !this._movePreview) {
        const hasRallied = s.strategy.ralliedIids?.has(gridCard.iid) ?? false;
        const canRetreat = row <= 2 && !hasRallied;
        const canRally   = !hasRallied;
        const menu = document.createElement('div');
        menu.className = 'cg-elite-action-menu';
        menu.innerHTML = `
          <button class="cg-elite-action-btn cg-eab-attack" data-action="attack">⚔ Attack</button>
          <button class="cg-elite-action-btn cg-eab-rally"  data-action="rally"   ${canRally   ? '' : 'disabled'}>↔ Rally</button>
          <button class="cg-elite-action-btn cg-eab-retreat" data-action="retreat" ${canRetreat ? '' : 'disabled'}>← Retreat</button>
        `;
        menu.querySelector('[data-action="attack"]')?.addEventListener('click', e => {
          e.stopPropagation();
          SoundSystem.click();
          EventBus.emit('cardgame:enableAttack');
        });
        menu.querySelector('[data-action="rally"]')?.addEventListener('click', e => {
          e.stopPropagation();
          if (!canRally) return;
          SoundSystem.click();
          this._startRallyPreview(row, col);
        });
        menu.querySelector('[data-action="retreat"]')?.addEventListener('click', e => {
          e.stopPropagation();
          if (!canRetreat) return;
          SoundSystem.click();
          this._startRetreatPreview(row, col);
        });
        cell.appendChild(menu);
      }

      // Hover: show stacked summons
      if (gridCard.summons?.length > 0) {
        cell.addEventListener('mouseenter', () => this._showStackTooltip(cell, gridCard.summons, gridCard.name));
        cell.addEventListener('mouseleave', () => this._hideStackTooltip());
      }

      // Champ panel: P_ELITE_ROW player elites are drop targets when panel is open
      if (isPlrElite && isPlayer && this._champPanelCol !== null) {
        cell.classList.add('cg-cell-drop-zone');
        cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('cg-cell-drag-over'); });
        cell.addEventListener('dragleave', () => cell.classList.remove('cg-cell-drag-over'));
        cell.addEventListener('drop', e => {
          e.preventDefault();
          cell.classList.remove('cg-cell-drag-over');
          const data = e.dataTransfer.getData('text/plain');
          const parts = data.split(':');
          if (parts.length === 2) {
            const champCol  = parseInt(parts[0], 10);
            const summonIdx = parseInt(parts[1], 10);
            if (!isNaN(champCol) && !isNaN(summonIdx)) {
              SoundSystem.drop();
              EventBus.emit('cardgame:playFromChampion', { champCol, summonIdx, eliteRow: row, eliteCol: col });
            }
          }
        });
        cell.addEventListener('touchstart', e => {
          if (!this._touchSel || this._touchSel.source !== 'panel') return;
          e.preventDefault();
          const { champCol, summonIdx } = this._touchSel;
          SoundSystem.drop();
          EventBus.emit('cardgame:playFromChampion', { champCol, summonIdx, eliteRow: row, eliteCol: col });
          this._clearTouchSel();
        }, { passive: false });
        return cell;
      }

      cell.addEventListener('click', () => {
        if (s.pendingSpell) { EventBus.emit('cardgame:spellTarget', { row, col }); return; }
        if (s.phase === 'strategy' && s.strategy.attackMode && !isPlayer) {
          EventBus.emit('cardgame:attackTarget', { row, col }); return;
        }
        if (s.phase === 'strategy' && isPlayer && !hasActed) {
          EventBus.emit('cardgame:selectElite', { row, col });
        }
      });

    } else {
      cell.classList.add('cg-cell-empty');
    }

    // Terrain spell targeting — highlight all valid non-HQ cells
    if (s.pendingSpell?.card.needsTarget === 'any_terrain_cell' && row !== PLAYER_ROW && row !== OPP_ROW) {
      cell.classList.add('cg-cell-spell-target', 'cg-cell-terrain-target');
      cell.addEventListener('click', () => {
        if (!s.pendingSpell) return;
        SoundSystem.drop();
        EventBus.emit('cardgame:spellTarget', { row, col });
      });
    }

    // Terrain badge — shown on non-HQ battle/elite cells
    if (row !== PLAYER_ROW && row !== OPP_ROW) {
      const cellTerrain = s.terrainGrid?.[row]?.[col];
      if (cellTerrain) {
        const dur = s.terrainDurationGrid?.[row]?.[col];
        const durText = (dur !== null && dur !== undefined) ? ` · ${dur} turn${dur !== 1 ? 's' : ''} left` : '';
        const badge = document.createElement('div');
        badge.className = `cg-terrain-badge cg-terrain-badge-${cellTerrain.replace(/_/g, '-')}`;
        badge.title = (CELL_TERRAIN_NAME[cellTerrain] ?? cellTerrain) + durText;
        badge.textContent = CELL_TERRAIN_ICON[cellTerrain] ?? '🌍';
        cell.appendChild(badge);
      }
    }

    return cell;
  },

  // ── Card HTML helpers ─────────────────────────────────────────────────────────
  _champHTML(champ) {
    const hpPct = Math.max(0, champ.hp / champ.maxHp * 100);
    const hpCol = hpPct > 50 ? '#4ab87c' : hpPct > 25 ? '#e0b84a' : '#c04a4a';
    const stack = champ.summons?.length ?? 0;

    // Conjurer cards: frameless — only art, HP overlay, stack badge
    if (champ.conjurer && champ.artFile) {
      return `
        <div class="cg-conjurer-cell">
          <img class="cg-conjurer-art" src="${ART_BASE}${champ.artFile}" alt="${champ.name}" decoding="sync">
          <div class="cg-conjurer-hp" style="border-color:${hpCol};color:${hpCol}">${Math.max(0, champ.hp)}</div>
          ${stack > 0 ? `<div class="cg-conjurer-stack">⚔ ${stack}</div>` : ''}
        </div>
      `;
    }

    // Legacy champion card (non-conjurer)
    return `
      <div class="cg-champion-card">
        <div class="cg-champ-hp-circle" style="border-color:${hpCol};color:${hpCol}">${Math.max(0, champ.hp)}</div>
        <div class="cg-card-top">
          <span class="cg-card-name">${champ.name ?? 'Conjurer'}</span>
        </div>
        <div class="cg-card-art-wrap">${_cardArtImg(champ)}</div>
        <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:${hpCol}"></div></div>
        <div class="cg-champ-stack-footer">⚔ ${stack}</div>
      </div>
    `;
  },

  _eliteHTML(elite, selected, acted) {
    const hpPct  = Math.max(0, elite.hp / elite.maxHp * 100);
    const hpCol  = hpPct > 50 ? '#4ab87c' : hpPct > 25 ? '#e0b84a' : '#c04a4a';
    const sums   = elite.summons ?? [];
    const killBon = elite.killBonus ?? 0;
    const totPow = (elite.power ?? 0) + (elite.tempPowerBonus ?? 0) + killBon + sums.reduce((a, c) => a + (c.power ?? 0), 0);
    const bonus  = (elite.tempPowerBonus || killBon)
      ? `<span class="cg-bonus">+${elite.tempPowerBonus || ''}${killBon ? `🗡${killBon}` : ''}</span>` : '';
    return `
      <div class="cg-elite-card ${selected ? 'selected' : ''}">
        ${acted ? `<div class="cg-acted-badge">✓</div>` : ''}
        <div class="cg-card-top">
          <span class="cg-card-name">${elite.name ?? 'Elite'}</span>
          <span class="cg-hcard-cost">${elite.summonCost ?? ''}</span>
        </div>
        <div class="cg-card-art-wrap">${_cardArtImg(elite)}</div>
        <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:${hpCol}"></div></div>
        <div class="cg-card-stats">
          <span class="cg-stat-hp">HP ${Math.max(0, elite.hp)}</span>
          <span class="cg-stat-pow">POW ${totPow}${bonus}</span>
          ${(() => { const mov = elite.ability?.type === 'extended_rally' ? (elite.hp / elite.maxHp <= 0.5 ? 2 : 1) : 1; return `<span class="cg-stat-mov${mov > 1 ? ' cg-stat-mov--boosted' : ''}">MOV ${mov}</span>`; })()}
          ${sums.length > 0 ? `<span class="cg-stat-summons">+${sums.length}</span>` : ''}
        </div>
        ${elite.ability?.desc ? `<div class="cg-ability-panel">${elite.ability.desc}</div>` : ''}
      </div>
    `;
  },

  // ── Sidebar ───────────────────────────────────────────────────────────────────
  _renderSidebar(s) {
    const el = document.getElementById('cg-sidebar');
    if (!el) return;
    el.innerHTML = '';

    if (s.gameOver) {
      el.innerHTML = `
        <div class="cg-sidebar-section">
          <div class="cg-gameover-msg ${s.winner === 'player' ? 'win' : 'lose'}">
            ${s.winner === 'player' ? '🎉 Victory!' : '💀 Defeat!'}
          </div>
        </div>`;
      this._renderSidebarLog(el, s);
      return;
    }

    // Spell / teleport targeting banners — these need cancel buttons, stay in sidebar
    const pending = s.pendingSpell;
    if (s.pendingTeleport) {
      el.innerHTML = `
        <div class="cg-sidebar-section cg-spell-pending-banner">
          <div class="cg-sidebar-title">✈ Teleportation</div>
          <div class="cg-spell-desc">Choose a destination in the champion row.</div>
          <button class="btn-cg btn-cg-cancel-spell" id="cg-cancel-spell-btn">✕ Cancel</button>
        </div>`;
      document.getElementById('cg-cancel-spell-btn')?.addEventListener('click', () => EventBus.emit('cardgame:cancelSpell'));
    } else if (pending) {
      el.innerHTML = `
        <div class="cg-sidebar-section cg-spell-pending-banner">
          <div class="cg-sidebar-title">🔮 Targeting</div>
          <div class="cg-spell-name">${pending.card.art} ${pending.card.name}</div>
          <div class="cg-spell-desc">${pending.card.description}</div>
          <button class="btn-cg btn-cg-cancel-spell" id="cg-cancel-spell-btn">✕ Cancel</button>
        </div>`;
      document.getElementById('cg-cancel-spell-btn')?.addEventListener('click', () => EventBus.emit('cardgame:cancelSpell'));
    }

    this._renderSidebarLog(el, s);
  },

  // ── Hand ──────────────────────────────────────────────────────────────────────
  _handNextBtn(s) {
    if (s.gameOver) return '';
    let label    = 'Next Phase ▶';
    let disabled = false;
    if (s.phase === 'end') label = 'End Turn ▶';
    if (s.phase === 'initialize' && s.initSubStep !== 'done') {
      label    = s.initSubStep === 'place_champions' ? 'Place Champions…' : 'Place Elites…';
      disabled = true;
    }
    // Block phase advance only during draw phase when an elite still needs placing
    if (s.phase === 'draw' && s.playerHand.some(c => c.type === 'elite')) {
      disabled = true;
    }
    return `<button class="btn-cg btn-cg-next cg-hand-next-btn" id="cg-next-btn" ${disabled ? 'disabled' : ''}>${label}</button>`;
  },

  _renderHand(s) {
    const el = document.getElementById('cg-hand-area');
    if (!el) return;

    const hasEliteWaiting = s.phase === 'draw' && s.playerHand.some(c => c.type === 'elite');
    const eliteNotice = hasEliteWaiting
      ? `<span class="cg-elite-notice">⚔ Place your Elite card first!</span>` : '';
    const header = `<div class="cg-hand-header">${eliteNotice || '<span class="cg-hand-label">Hand</span>'}</div>`;

    // ── Initialize: champion placement ────────────────────────────────────────
    if (s.phase === 'initialize' && s.initSubStep === 'place_champions') {
      el.innerHTML = `${header}<div class="cg-hand" id="cg-hand"></div>`;

      const hand  = document.getElementById('cg-hand');
      const total = s.playerHand.length;
      s.playerHand.forEach((card, i) => {
        const div = document.createElement('div');
        div.className = 'cg-hand-card cg-hand-champion';
        div.draggable = true;
        const champHpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp * 100) : 0;
        div.innerHTML = `
          ${(card.summons?.length ?? 0) > 0 ? `<div class="cg-champ-stack-badge">${card.summons.length}</div>` : ''}
          <div class="cg-card-top">
            <span class="cg-card-name">${card.name ?? 'Conjurer'}</span>
          </div>
          <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
          <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${champHpPct}%;background:#4ab87c"></div></div>
          <div class="cg-card-stats">
            <span class="cg-stat-hp">HP ${card.hp}</span>
          </div>
        `;
        div.addEventListener('dragstart', e => {
          SoundSystem.dragStart();
          e.dataTransfer.setData('text/plain', String(i));
          e.dataTransfer.effectAllowed = 'move';
          div.classList.add('cg-dragging');
        });
        div.addEventListener('dragend', () => div.classList.remove('cg-dragging'));
        div.addEventListener('touchstart', () => this._setTouchSel({ source: 'hand', handIdx: i }, div), { passive: true });
        this._bindPreview(div, card);
        hand.appendChild(div);
        this._applyArch(div, i, total);
      });
      return;
    }

    // ── Initialize: elite placement ───────────────────────────────────────────
    if (s.phase === 'initialize' && s.initSubStep === 'place_elites') {
      el.innerHTML = `${header}<div class="cg-hand" id="cg-hand"></div>`;

      const hand        = document.getElementById('cg-hand');
      const eliteCards  = s.playerHand.filter(c => c.type === 'elite');
      const total       = eliteCards.length;
      let archIdx       = 0;
      s.playerHand.forEach((card, i) => {
        if (card.type !== 'elite') return;
        const hpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp * 100) : 0;
        const div   = document.createElement('div');
        div.className = 'cg-hand-card cg-hand-elite';
        div.draggable = true;
        div.innerHTML = `
          <div class="cg-card-top">
            <span class="cg-card-name">${card.name ?? 'Elite'}</span>
            <span class="cg-hcard-cost cg-hcard-cost--glow">0</span>
          </div>
          <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
          <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:#c07820"></div></div>
          <div class="cg-card-stats">
            <span class="cg-stat-hp">HP ${card.hp}</span>
            <span class="cg-stat-pow">POW ${card.power}</span>
            ${(() => { const mov = card.ability?.type === 'extended_rally' ? (card.hp / card.maxHp <= 0.5 ? 2 : 1) : 1; return `<span class="cg-stat-mov${mov > 1 ? ' cg-stat-mov--boosted' : ''}">MOV ${mov}</span>`; })()}
          </div>
        `;
        div.addEventListener('dragstart', e => {
          SoundSystem.dragStart();
          e.dataTransfer.setData('text/plain', String(i));
          e.dataTransfer.effectAllowed = 'move';
          div.classList.add('cg-dragging');
        });
        div.addEventListener('dragend', () => div.classList.remove('cg-dragging'));
        div.addEventListener('touchstart', () => this._setTouchSel({ source: 'hand', handIdx: i }, div), { passive: true });
        this._bindPreview(div, card);
        hand.appendChild(div);
        this._applyArch(div, archIdx++, total);
      });
      return;
    }

    // ── Done initializing but summon hand not yet drawn ───────────────────────
    if (s.phase === 'initialize') {
      el.innerHTML = `${header}<div class="cg-hand-empty">Starting first turn…</div>`;

      return;
    }

    // ── Normal hand ───────────────────────────────────────────────────────────
    if (!s.playerHand.length) {
      el.innerHTML = `${header}<div class="cg-hand-empty">No cards in hand</div>`;

      return;
    }

    el.innerHTML = `${header}<div class="cg-hand" id="cg-hand"></div>`;
    const hand = document.getElementById('cg-hand');

    // During draw phase, if an elite needs placing, only show elite cards until placed
    const hasEliteInHand = s.phase === 'draw' && s.playerHand.some(c => c.type === 'elite');

    // Build visible card list first so arch indices are contiguous
    const visibleCards = s.playerHand.map((card, i) => ({ card, i }))
      .filter(({ card }) => !(hasEliteInHand && card.type !== 'elite'));
    const total = visibleCards.length;

    visibleCards.forEach(({ card, i }, archIdx) => {
      const isSpell    = card.type === 'spell';
      const isElite    = card.type === 'elite';
      const isMatching = !isSpell && !isElite && (s.matchingHand?.includes(i) ?? false);
      const isDimmed   = !isSpell && !isElite && s.diceResult && !isMatching && !(card.ability?.type === 'teleport_to_elite');
      const div        = document.createElement('div');

      // Elite in hand (mid-game replacement) — always draggable
      if (isElite) {
        const hpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp * 100) : 0;
        div.className = 'cg-hand-card cg-hand-elite';
        div.draggable = true;
        div.innerHTML = `
          <div class="cg-card-top">
            <span class="cg-card-name">${card.name ?? 'Elite'}</span>
            <span class="cg-hcard-cost cg-hcard-cost--glow">0</span>
          </div>
          <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
          <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:#c07820"></div></div>
          <div class="cg-card-stats">
            <span class="cg-stat-hp">HP ${card.hp}</span>
            <span class="cg-stat-pow">POW ${card.power}</span>
            ${(() => { const mov = card.ability?.type === 'extended_rally' ? (card.hp / card.maxHp <= 0.5 ? 2 : 1) : 1; return `<span class="cg-stat-mov${mov > 1 ? ' cg-stat-mov--boosted' : ''}">MOV ${mov}</span>`; })()}
          </div>
        `;
        div.addEventListener('dragstart', e => {
          SoundSystem.dragStart();
          e.dataTransfer.setData('text/plain', String(i));
          e.dataTransfer.effectAllowed = 'move';
          div.classList.add('cg-dragging');
        });
        div.addEventListener('dragend', () => div.classList.remove('cg-dragging'));
        div.addEventListener('touchstart', () => this._setTouchSel({ source: 'hand', handIdx: i }, div), { passive: true });
        this._bindPreview(div, card);
        hand.appendChild(div);
        this._applyArch(div, archIdx, total);
        return;
      }

      const spellPlayable = isSpell && (s.phase === 'conjure' || s.phase === 'regroup');
      div.className = [
        'cg-hand-card',
        isSpell    ? 'cg-hand-spell'    : '',
        isMatching || spellPlayable ? 'cg-hand-matching' : '',
        isDimmed   ? 'cg-hand-no-match' : '',
      ].filter(Boolean).join(' ');

      if (isSpell) {
        div.innerHTML = `
          <div class="cg-card-top">
            <span class="cg-card-name">${card.name ?? 'Spell'}</span>
            <span class="cg-hcard-cost">0</span>
          </div>
          <div class="cg-type-label">Spell Card</div>
          <div class="cg-card-art-wrap"><div class="cg-art-emoji">${card.art ?? '✨'}</div></div>
        `;
        div.addEventListener('click', () => {
          if (s.phase !== 'conjure' && s.phase !== 'regroup') return;
          EventBus.emit('cardgame:playSpell', { handIdx: i });
        });
        this._bindPreview(div, card);
      } else {
        const hpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp * 100) : 0;
        const hasTeleportAbility = card.ability?.type === 'teleport_to_elite';
        div.innerHTML = `
          <div class="cg-card-top">
            <span class="cg-card-name">${card.name ?? 'Summon'}</span>
            <span class="cg-hcard-cost${isMatching ? ' cg-hcard-cost--glow' : ''}">${card.summonCost}</span>
          </div>
          <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
          <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:#4ab87c"></div></div>
          <div class="cg-card-stats">
            <span class="cg-stat-hp">HP ${card.hp}</span>
            <span class="cg-stat-pow">POW ${card.power}</span>
          </div>
        `;
        const canDragSummon = (isMatching || hasTeleportAbility) && s.phase === 'conjure';
        if (canDragSummon) {
          if (hasTeleportAbility && !isMatching) div.classList.add('cg-hand-matching', 'cg-teleport-ability');
          div.draggable = true;
          div.addEventListener('dragstart', e => {
            SoundSystem.dragStart();
            e.dataTransfer.setData('text/plain', String(i));
            e.dataTransfer.effectAllowed = 'move';
            div.classList.add('cg-dragging');
          });
          div.addEventListener('dragend', () => div.classList.remove('cg-dragging'));
          div.addEventListener('touchstart', () => this._setTouchSel({ source: 'hand', handIdx: i }, div), { passive: true });
        }
        this._bindPreview(div, card);
      }

      const cardKey = card.uid ?? `${card.type}:${card.name}:${archIdx}`;
      const isNew = !this._knownHandKeys.has(cardKey);
      hand.appendChild(div);
      this._applyArch(div, archIdx, total);
      if (isNew) div.classList.add('cg-hand-card-deal');
    });

    // Update known hand keys to current hand
    this._knownHandKeys = new Set(
      visibleCards.map(({ card }, idx) => card.uid ?? `${card.type}:${card.name}:${idx}`)
    );
  },

  // ── Champion panel (stacked summons → drag to elite) ─────────────────────────
  _renderChampPanel(s) {
    const el = document.getElementById('cg-champ-panel');
    if (!el) return;

    // Auto-close if champion has no more stacked summons
    if (this._champPanelCol !== null) {
      const champ = s?.playerChampions?.find(c => c.col === this._champPanelCol);
      if (!champ || !champ.summons || champ.summons.length === 0) {
        this._champPanelCol = null;
      }
    }

    if (this._champPanelCol === null) {
      el.classList.add('hidden');
      el.innerHTML = '';
      return;
    }

    const col   = this._champPanelCol;
    const champ = s.playerChampions.find(c => c.col === col);
    if (!champ) { this._champPanelCol = null; el.classList.add('hidden'); return; }

    el.classList.remove('hidden');
    el.innerHTML = `
      <div class="cg-champ-panel-header">
        <span>${champ.art ?? '⚔️'} ${champ.name} — Stacked Summons (${champ.summons.length})</span>
        <button class="cg-champ-panel-close" id="cg-champ-panel-close">✕</button>
      </div>
      <div class="cg-champ-panel-hint">Drag a card to a highlighted elite to assign it</div>
      <div class="cg-champ-panel-cards" id="cg-champ-panel-cards"></div>
    `;

    document.getElementById('cg-champ-panel-close')?.addEventListener('click', () => {
      this._champPanelCol = null;
      this._update();
    });

    const cardsEl = document.getElementById('cg-champ-panel-cards');
    if (!cardsEl) return;

    champ.summons.forEach((card, idx) => {
      const hpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp * 100) : 0;
      const div   = document.createElement('div');
      div.className = 'cg-hand-card cg-hand-matching cg-champ-panel-card';
      div.draggable = true;
      div.innerHTML = `
        <div class="cg-card-top">
          <span class="cg-card-name">${card.name ?? 'Summon'}</span>
          <span class="cg-hcard-cost">${card.summonCost}</span>
        </div>
        <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
        <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:#4ab87c"></div></div>
        <div class="cg-card-stats">
          <span class="cg-stat-hp">HP ${card.hp}</span>
          <span class="cg-stat-pow">POW ${card.power}</span>
        </div>
        ${card.ability?.desc ? `<div class="cg-ability-panel">${card.ability.desc}</div>` : ''}
      `;
      div.addEventListener('dragstart', e => {
        SoundSystem.dragStart();
        e.dataTransfer.setData('text/plain', `${col}:${idx}`);
        e.dataTransfer.effectAllowed = 'move';
        div.classList.add('cg-dragging');
      });
      div.addEventListener('dragend', () => div.classList.remove('cg-dragging'));
      div.addEventListener('dblclick', () => {
        SoundSystem.drop();
        EventBus.emit('cardgame:playFromChampion', { champCol: col, summonIdx: idx, eliteRow: P_ELITE_ROW, eliteCol: col });
      });
      div.addEventListener('touchstart', () => this._setTouchSel({ source: 'panel', champCol: col, summonIdx: idx }, div), { passive: true });
      this._bindPreview(div, card);
      cardsEl.appendChild(div);
    });
  },

  // ── Crypt stack HTML helper ───────────────────────────────────────────────────
  _cryptStackHTML(cards, label) {
    const count   = cards.length;
    const topCard = count > 0 ? cards[cards.length - 1] : null;
    const tip     = count > 0
      ? cards.slice(-5).reverse().map(c => c.name ?? '?').join(', ') + (count > 5 ? ` +${count - 5} more` : '')
      : 'Empty';
    return `
      <div class="cg-crypt-stack ${count === 0 ? 'empty' : ''}" title="${tip}">
        <div class="cg-crypt-cards">
          ${count > 2 ? `<div class="cg-crypt-card cg-crypt-card-3"></div>` : ''}
          ${count > 1 ? `<div class="cg-crypt-card cg-crypt-card-2"></div>` : ''}
          ${topCard
            ? `<div class="cg-crypt-card cg-crypt-card-1">
                 <span class="cg-crypt-art">${topCard.art ?? '💀'}</span>
               </div>`
            : `<div class="cg-crypt-empty-slot"></div>`
          }
        </div>
        <div class="cg-crypt-count">${count}</div>
        <div class="cg-crypt-label">${label}</div>
      </div>
    `;
  },

  // ── Player crypt (bottom-left) ────────────────────────────────────────────────
  _renderCryptZone(s) {
    const el = document.getElementById('cg-crypt-zone');
    if (!el) return;
    const count   = s.playerCrypt.length;
    const topCard = count > 0 ? s.playerCrypt[count - 1] : null;
    const tip     = count > 0 ? s.playerCrypt.slice(-5).reverse().map(c => c.name ?? '?').join(', ') : 'Empty';
    el.innerHTML = `
      <div class="cg-crypt-card-display ${count === 0 ? 'empty' : ''}" title="${tip}">
        <div class="cg-crypt-count-badge">${count}</div>
        <div class="cg-crypt-art-emoji">${topCard?.art ?? '💀'}</div>
        <div class="cg-crypt-card-name">${topCard?.name ?? 'Empty'}</div>
        <div class="cg-crypt-footer">Crypt · ${count} card${count !== 1 ? 's' : ''} ${count > 0 ? '· 👁 View' : ''}</div>
      </div>
    `;
    if (count > 0) {
      el.querySelector('.cg-crypt-card-display')
        ?.addEventListener('click', () => this._showCryptModal(s.playerCrypt.slice(), 'Your Crypt'));
    }
  },

  // ── Opponent crypt (top-right) ────────────────────────────────────────────────
  _renderOppCryptZone(s) {
    const el = document.getElementById('cg-opp-crypt-zone');
    if (!el) return;
    const count = s.opponentCrypt.length;
    el.innerHTML = `
      <div class="cg-crypt-zone-inner">
        <div class="cg-crypt-title">Crypt${count > 0 ? ' · 👁' : ''}</div>
        <div class="cg-crypt-stacks">${this._cryptStackHTML(s.opponentCrypt, 'Opp')}</div>
      </div>
    `;
    if (count > 0) {
      el.querySelector('.cg-crypt-zone-inner')
        ?.addEventListener('click', () => this._showCryptModal(s.opponentCrypt.slice(), 'Opponent Crypt'));
    }
  },

  // ── Opponent hand (face-down, top-center) ─────────────────────────────────────
  _renderOppHand(s) {
    const el = document.getElementById('cg-opp-hand-area');
    if (!el) return;
    const count = s.opponentHand.length;
    el.innerHTML = `<div class="cg-hand-label">Opp (${count})</div><div class="cg-opp-hand" id="cg-opp-hand"></div>`;
    const hand = document.getElementById('cg-opp-hand');
    if (hand) {
      for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = 'cg-opp-hand-card';
        hand.appendChild(div);
      }
    }
  },

  // ── Opponent deck zone (top-left, mirrored order) ─────────────────────────────
  _renderOppDeckZone(s) {
    const el = document.getElementById('cg-opp-deck-zone');
    if (!el) return;
    // Reversed order relative to player (player: Elite|Spell|Summon → opp: Summon|Spell|Elite)
    el.innerHTML = `
      <div class="cg-deck-zone-inner">
        ${deckStackHTML('Summon', s.opponentSummonDeck?.length ?? 0, '#0e2a1a')}
        ${deckStackHTML('Spell',  s.opponentSpellDeck?.length  ?? 0, '#2a1a4a')}
        ${deckStackHTML('Elite',  s.opponentEliteDeck?.length  ?? 0, '#1a3a5a')}
      </div>
    `;
  },

  // ── Deck zone ─────────────────────────────────────────────────────────────────
  _renderDeckZone(s) {
    const el = document.getElementById('cg-deck-zone');
    if (!el) return;
    el.innerHTML = `
      <div class="cg-deck-zone-inner">
        ${deckStackHTML('Elite',   s.playerEliteDeck?.length  ?? 0, '#1a3a5a')}
        ${deckStackHTML('Spell',   s.playerSpellDeck?.length  ?? 0, '#2a1a4a')}
        ${deckStackHTML('Summon',  s.playerSummonDeck?.length ?? 0, '#0e2a1a')}
      </div>
    `;
  },

  // ── Hand arch transform ───────────────────────────────────────────────────────
  _applyArch(div, i, total) {
    div.style.zIndex = String(i + 1);
    div.style.transformOrigin = 'top center';
    div.style.transition = 'transform 0.18s ease, box-shadow 0.18s ease';
    div.addEventListener('mouseenter', () => { div.style.transform = 'translateY(-55px) scale(1.12)'; div.style.zIndex = '80'; });
    div.addEventListener('mouseleave', () => { div.style.transform = '';                               div.style.zIndex = String(i + 1); });
    div.addEventListener('dragstart',  () => { div.style.transform = ''; });
    div.addEventListener('dragend',    () => { div.style.transform = ''; });
    div.addEventListener('touchstart', () => { div.style.transform = 'translateY(-32px) scale(1.08)'; div.style.zIndex = '80'; }, { passive: true });
    div.addEventListener('touchend',   () => { div.style.transform = '';                               div.style.zIndex = String(i + 1); }, { passive: true });
  },

  // ── Move preview helpers ──────────────────────────────────────────────────────
  _startRallyPreview(fromRow, fromCol) {
    const s     = this._state;
    const elite = s.grid[fromRow]?.[fromCol];

    // Mirror the exact same condition used in CardSystem._rally()
    const hasExtended = elite?.ability?.type === 'extended_rally'
      && elite.hp / elite.maxHp <= 0.5;
    const maxSteps = hasExtended ? 2 : 1;

    const dirs = [
      { dr: -1, dc:  0, direction: 'up'    },
      { dr:  1, dc:  0, direction: 'down'  },
      { dr:  0, dc: -1, direction: 'left'  },
      { dr:  0, dc:  1, direction: 'right' },
    ];
    const cells = [];
    for (const { dr, dc, direction } of dirs) {
      for (let step = 1; step <= maxSteps; step++) {
        const nr = fromRow + dr * step, nc = fromCol + dc * step;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
        if (nr === PLAYER_ROW || nr === OPP_ROW) break;
        if (s.grid[nr]?.[nc] !== null) break;
        // Mark step-2 cells so they render with the extended-range style
        cells.push({ row: nr, col: nc, direction, extended: step === 2 });
      }
    }
    this._movePreview = { mode: 'rally', fromRow, fromCol, cells };
    this._update();
  },

  _startRetreatPreview(fromRow, fromCol) {
    const s = this._state;
    const nr = Math.min(fromRow + 2, PLAYER_ROW - 1);
    const cells = [];
    if (s.grid[nr]?.[fromCol] === null) {
      cells.push({ row: nr, col: fromCol, direction: null });
    }
    this._movePreview = { mode: 'retreat', fromRow, fromCol, cells };
    this._update();
  },

  // ── Begin Match dramatic popup ────────────────────────────────────────────────
  _showBeginMatchPopup() {
    const screen = this._container?.querySelector('.cg-screen');
    if (!screen) return;
    const overlay = document.createElement('div');
    overlay.className = 'cg-begin-match-overlay';
    overlay.innerHTML = '<div class="cg-begin-match-text">⚔ Begin Match! ⚔</div>';
    screen.appendChild(overlay);
    setTimeout(() => overlay.remove(), 2100);
  },

  // ── Summon pop-up (Reinforcements! float animation) ───────────────────────────
  _showSummonPopup(row, col, art, power) {
    const grid = document.getElementById('cg-grid');
    const screen = this._container?.querySelector('.cg-screen');
    if (!grid || !screen) return;
    const cell = grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;

    const cellRect   = cell.getBoundingClientRect();
    const screenRect = screen.getBoundingClientRect();

    const popup = document.createElement('div');
    popup.className = 'cg-summon-popup';
    popup.textContent = `⚔ Reinforcements!`;
    popup.style.left = (cellRect.left - screenRect.left + cellRect.width / 2) + 'px';
    popup.style.top  = (cellRect.top  - screenRect.top) + 'px';
    screen.appendChild(popup);
    setTimeout(() => popup.remove(), 1100);
  },

  // ── Camp heal pop-up (+1 HP float animation) ─────────────────────────────────
  _showCampHealPopup(row, col) {
    const grid   = document.getElementById('cg-grid');
    const screen = this._container?.querySelector('.cg-screen');
    if (!grid || !screen) return;
    const cell = grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    const cellRect   = cell.getBoundingClientRect();
    const screenRect = screen.getBoundingClientRect();
    const popup = document.createElement('div');
    popup.className = 'cg-camp-heal-popup';
    popup.textContent = `⛺ +1 HP`;
    popup.style.left = (cellRect.left - screenRect.left + cellRect.width / 2) + 'px';
    popup.style.top  = (cellRect.top  - screenRect.top) + 'px';
    screen.appendChild(popup);
    setTimeout(() => popup.remove(), 1200);
  },

  // ── Stack tooltip (hover over elite/champion) ─────────────────────────────────
  _showStackTooltip(cell, summons, title) {
    this._hideStackTooltip();
    const screen = this._container?.querySelector('.cg-screen');
    if (!screen || !summons.length) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'cg-stack-tooltip';
    tooltip.id = 'cg-stack-tooltip';
    tooltip.innerHTML = `
      <div class="cg-stack-tt-title">${title} — Summons (${summons.length})</div>
      ${summons.map(c => `
        <div class="cg-stack-tt-card">
          <span class="cg-stack-tt-art">${c.art ?? '✨'}</span>
          <span class="cg-stack-tt-name">${c.name ?? 'Summon'}</span>
          <span class="cg-stack-tt-stats">HP ${Math.max(0, c.hp)} · ⚔${c.power ?? 0}</span>
        </div>
      `).join('')}
    `;

    screen.appendChild(tooltip);

    const cellRect   = cell.getBoundingClientRect();
    const screenRect = screen.getBoundingClientRect();
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;

    let top  = cellRect.top  - screenRect.top  - th - 6;
    let left = cellRect.left - screenRect.left + cellRect.width / 2 - tw / 2;

    if (top < 0) top = cellRect.bottom - screenRect.top + 6;
    if (left < 0) left = 4;
    if (left + tw > screenRect.width) left = screenRect.width - tw - 4;

    tooltip.style.top  = top  + 'px';
    tooltip.style.left = left + 'px';
  },

  _hideStackTooltip() {
    document.getElementById('cg-stack-tooltip')?.remove();
  },

  // ── Card hover preview ──────────────────────────────────────────────────────
  _cardPreviewHTML(card) {
    const hpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp * 100) : 0;
    const hpCol = hpPct > 50 ? '#4ab87c' : hpPct > 25 ? '#e0b84a' : '#c04a4a';
    if (card.type === 'spell') {
      return `
        <div class="cg-card-top"><span class="cg-card-name">${card.name ?? 'Spell'}</span><span class="cg-hcard-cost">0</span></div>
        <div class="cg-type-label">Spell Card</div>
        <div class="cg-card-art-wrap"><div class="cg-art-emoji">${card.art ?? '✨'}</div></div>
        ${card.description ? `<div class="cg-ability-panel">${card.description}</div>` : ''}
      `;
    }
    if (card.type === 'champion') {
      const stack = card.summons?.length ?? 0;
      return `
        ${stack > 0 ? `<div class="cg-champ-stack-badge">${stack}</div>` : ''}
        <div class="cg-card-top"><span class="cg-card-name">${card.name ?? 'Champion'}</span></div>
        ${card.cardType ? `<div class="cg-type-label">${card.cardType}</div>` : ''}
        <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
        <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:${hpCol}"></div></div>
        <div class="cg-card-stats"><span class="cg-stat-hp">HP ${Math.max(0, card.hp)}/${card.maxHp}</span></div>
        ${card.ability?.desc ? `<div class="cg-ability-panel">${card.ability.desc}</div>` : ''}
        <div class="cg-card-bottom">${_rarityBadge(card)}<div class="cg-terrain-circle">${_terrainCircle(card)}</div><span class="cg-card-uid">${card.cardUid ?? ''}</span></div>
      `;
    }
    if (card.type === 'elite') {
      const sums = card.summons ?? [];
      const killBon = card.killBonus ?? 0;
      const totPow = (card.power ?? 0) + (card.tempPowerBonus ?? 0) + killBon + sums.reduce((a, c) => a + (c.power ?? 0), 0);
      const bonus = (card.tempPowerBonus || killBon) ? `<span class="cg-bonus">+${card.tempPowerBonus || ''}${killBon ? `🗡${killBon}` : ''}</span>` : '';
      return `
        <div class="cg-card-top"><span class="cg-card-name">${card.name ?? 'Elite'}</span><span class="cg-hcard-cost">${card.summonCost ?? ''}</span></div>
        ${card.cardType ? `<div class="cg-type-label">${card.cardType}</div>` : ''}
        <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
        <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:${hpCol}"></div></div>
        <div class="cg-card-stats">
          <span class="cg-stat-hp">HP ${Math.max(0, card.hp)}</span>
          <span class="cg-stat-pow">POW ${totPow}${bonus}</span>
          ${(() => { const mov = card.ability?.type === 'extended_rally' ? (card.hp / card.maxHp <= 0.5 ? 2 : 1) : 1; return `<span class="cg-stat-mov${mov > 1 ? ' cg-stat-mov--boosted' : ''}">MOV ${mov}</span>`; })()}
          ${sums.length > 0 ? `<span class="cg-stat-summons">+${sums.length}</span>` : ''}
        </div>
        ${card.ability?.desc ? `<div class="cg-ability-panel">${card.ability.desc}</div>` : ''}
        <div class="cg-card-bottom">${_rarityBadge(card)}<div class="cg-terrain-circle">${_terrainCircle(card)}</div><span class="cg-card-uid">${card.cardUid ?? ''}</span></div>
      `;
    }
    // summon (default)
    return `
      <div class="cg-card-top"><span class="cg-card-name">${card.name ?? 'Summon'}</span><span class="cg-hcard-cost">${card.summonCost ?? ''}</span></div>
      ${card.cardType ? `<div class="cg-type-label">${card.cardType}</div>` : ''}
      <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
      <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:#4ab87c"></div></div>
      <div class="cg-card-stats"><span class="cg-stat-hp">HP ${card.hp}</span><span class="cg-stat-pow">POW ${card.power}</span></div>
      ${card.ability?.desc ? `<div class="cg-ability-panel">${card.ability.desc}</div>` : ''}
      <div class="cg-card-bottom">${_rarityBadge(card)}<div class="cg-terrain-circle">${_terrainCircle(card)}</div><span class="cg-card-uid">${card.cardUid ?? ''}</span></div>
    `;
  },

  _showCardPreview(card) {
    const el = this._container?.querySelector('#cg-card-preview');
    if (!el) return;
    el.innerHTML = this._cardPreviewHTML(card);
    el.classList.remove('hidden');
  },

  _hideCardPreview() {
    const el = this._container?.querySelector('#cg-card-preview');
    if (!el) return;
    el.classList.add('hidden');
  },

  // ── Bind card preview for mouse + touch ──────────────────────────────────────
  _bindPreview(el, card) {
    el.addEventListener('mouseenter', () => this._showCardPreview(card));
    el.addEventListener('mouseleave', () => this._hideCardPreview());
    el.addEventListener('touchstart', () => {
      clearTimeout(this._touchPreviewTimer);
      this._showCardPreview(card);
    }, { passive: true });
    el.addEventListener('touchend', () => {
      this._touchPreviewTimer = setTimeout(() => this._hideCardPreview(), 1400);
    }, { passive: true });
  },

  // ── Touch card selection (mobile drag-and-drop replacement) ──────────────────
  _setTouchSel(sel, el) {
    this._clearTouchSel();
    this._touchSel = sel;
    if (el) el.classList.add('cg-touch-selected');
  },

  _clearTouchSel() {
    this._container?.querySelectorAll('.cg-touch-selected')
      .forEach(e => e.classList.remove('cg-touch-selected'));
    this._touchSel = null;
  },

  // ── Attack animation — card nudge/push ────────────────────────────────────────
  _showAttackAnimation(aRow, aCol, tRow, tCol, art, artFile) {
    const grid   = document.getElementById('cg-grid');
    const screen = this._container?.querySelector('.cg-screen');
    if (!grid || !screen) return;

    const aCell = grid.querySelector(`[data-row="${aRow}"][data-col="${aCol}"]`);
    const tCell = grid.querySelector(`[data-row="${tRow}"][data-col="${tCol}"]`);
    if (!aCell || !tCell) return;

    const sRect = screen.getBoundingClientRect();
    const aRect = aCell.getBoundingClientRect();
    const tRect = tCell.getBoundingClientRect();

    // Direction unit vector from attacker → target
    const dx   = tRect.left - aRect.left;
    const dy   = tRect.top  - aRect.top;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx   = dx / dist;
    const ny   = dy / dist;

    // Ghost overlay covering the attacker cell (shows card art, performs the lunge)
    const aGhost = document.createElement('div');
    aGhost.className = 'cg-attack-ghost cg-attack-ghost-a';
    aGhost.innerHTML = artFile
      ? `<img class="cg-attack-ghost-img" src="${ART_BASE}${artFile}" alt="${art}" draggable="false">`
      : `<span class="cg-attack-ghost-art">${art}</span>`;
    Object.assign(aGhost.style, {
      left: (aRect.left - sRect.left) + 'px', top:  (aRect.top - sRect.top) + 'px',
      width: aRect.width + 'px',              height: aRect.height + 'px',
    });
    screen.appendChild(aGhost);

    // Ghost overlay covering the target cell (shows reaction/push)
    const tGhost = document.createElement('div');
    tGhost.className = 'cg-attack-ghost cg-attack-ghost-t';
    Object.assign(tGhost.style, {
      left: (tRect.left - sRect.left) + 'px', top:  (tRect.top - sRect.top) + 'px',
      width: tRect.width + 'px',              height: tRect.height + 'px',
    });
    screen.appendChild(tGhost);

    // Phase 1 — wind-up: attacker moves slightly opposite to target (80ms)
    requestAnimationFrame(() => {
      aGhost.style.transition = 'transform 80ms ease-in';
      aGhost.style.transform  = `translate(${-nx * 12}px, ${-ny * 12}px)`;
    });

    // Phase 2 — lunge: attacker charges forward, target is pushed back (130ms)
    setTimeout(() => {
      aGhost.style.transition = 'transform 130ms cubic-bezier(0.1, 0, 0.6, 1)';
      aGhost.style.transform  = `translate(${nx * 26}px, ${ny * 26}px)`;
      tGhost.style.transition = 'transform 130ms ease-out';
      tGhost.style.transform  = `translate(${nx * 14}px, ${ny * 14}px)`;
    }, 80);

    // Phase 3 — return: both snap back, hit flash fires (210ms)
    setTimeout(() => {
      aGhost.style.transition = 'transform 200ms ease-in-out';
      aGhost.style.transform  = '';
      tGhost.style.transition = 'transform 200ms ease-in-out';
      tGhost.style.transform  = '';

      const hit = document.createElement('div');
      hit.className = 'cg-attack-hit';
      Object.assign(hit.style, {
        left: (tRect.left - sRect.left) + 'px', top:  (tRect.top - sRect.top) + 'px',
        width: tRect.width + 'px',              height: tRect.height + 'px',
      });
      screen.appendChild(hit);
      setTimeout(() => hit.remove(), 420);
    }, 210);

    // Cleanup ghosts after full animation
    setTimeout(() => { aGhost.remove(); tGhost.remove(); }, 500);
  },

  // ── Card explosion ────────────────────────────────────────────────────────────
  _showCardExplosion(screen, cx, cy, art) {
    const container = document.createElement('div');
    container.className = 'cg-card-explosion';
    container.style.left = cx + 'px';
    container.style.top  = cy + 'px';
    screen.appendChild(container);

    const COLORS = ['#ff6030', '#ffb030', '#ff3060', '#ff8020', '#ffdd40', '#ff4090'];
    const COUNT  = 14;
    for (let i = 0; i < COUNT; i++) {
      const p     = document.createElement('div');
      p.className = 'cg-explosion-particle';
      const angle = (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = 30 + Math.random() * 40;
      p.style.setProperty('--ex', Math.cos(angle) * speed + 'px');
      p.style.setProperty('--ey', Math.sin(angle) * speed + 'px');
      p.style.background     = COLORS[i % COLORS.length];
      p.style.animationDelay = Math.round(Math.random() * 60) + 'ms';
      p.style.width          = (4 + Math.random() * 5) + 'px';
      p.style.height         = p.style.width;
      container.appendChild(p);
    }

    // Central flash burst
    const flash = document.createElement('div');
    flash.className = 'cg-explosion-flash';
    container.appendChild(flash);

    setTimeout(() => container.remove(), 700);
  },

  // ── Crypt viewer modal ────────────────────────────────────────────────────────
  _showCryptModal(cards, title) {
    const screen = this._container?.querySelector('.cg-screen');
    if (!screen) return;

    const overlay = document.createElement('div');
    overlay.className = 'cg-crypt-modal-overlay';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    const panel = document.createElement('div');
    panel.className = 'cg-crypt-modal';

    const header = document.createElement('div');
    header.className = 'cg-crypt-modal-header';
    header.innerHTML = `<span class="cg-crypt-modal-title">💀 ${title}</span>`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'cg-crypt-modal-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => overlay.remove());
    header.appendChild(closeBtn);

    const countEl = document.createElement('div');
    countEl.className = 'cg-crypt-modal-count';
    countEl.textContent = `${cards.length} card${cards.length !== 1 ? 's' : ''}`;

    const grid = document.createElement('div');
    grid.className = 'cg-crypt-modal-grid';

    if (cards.length === 0) {
      grid.innerHTML = '<div class="cg-crypt-modal-empty">The crypt is empty</div>';
    } else {
      [...cards].reverse().forEach(card => {
        const cardEl = document.createElement('div');
        const isSpell    = card.type === 'spell';
        const isElite    = card.type === 'elite';
        const isChampion = card.type === 'champion';
        cardEl.className = 'cg-hand-card cg-crypt-modal-card' + (isSpell ? ' cg-hand-spell' : '');

        if (isSpell) {
          cardEl.innerHTML = `
            <div class="cg-card-top"><span class="cg-card-name">${card.name ?? 'Spell'}</span></div>
            <div class="cg-type-label">Spell Card</div>
            <div class="cg-card-art-wrap"><div class="cg-art-emoji">${card.art ?? '✨'}</div></div>
          `;
        } else if (isChampion) {
          const hpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp * 100) : 100;
          cardEl.innerHTML = `
            <div class="cg-card-top"><span class="cg-card-name">${card.name ?? 'Champion'}</span></div>
            <div class="cg-type-label">Champion</div>
            <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
            <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:#c07820"></div></div>
            <div class="cg-card-stats"><span class="cg-stat-hp">HP ${card.hp ?? '?'}/${card.maxHp ?? '?'}</span></div>
          `;
        } else if (isElite) {
          const hpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp * 100) : 100;
          cardEl.innerHTML = `
            <div class="cg-card-top"><span class="cg-card-name">${card.name ?? 'Elite'}</span></div>
            <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
            <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:#c07820"></div></div>
            <div class="cg-card-stats">
              <span class="cg-stat-hp">HP ${card.maxHp ?? '?'}</span>
              <span class="cg-stat-pow">POW ${card.power ?? '?'}</span>
            </div>
          `;
        } else {
          // summon
          const hpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp * 100) : 100;
          cardEl.innerHTML = `
            <div class="cg-card-top">
              <span class="cg-card-name">${card.name ?? 'Summon'}</span>
              <span class="cg-hcard-cost">${card.summonCost ?? ''}</span>
            </div>
            <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
            <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:#4ab87c"></div></div>
            <div class="cg-card-stats">
              <span class="cg-stat-hp">HP ${card.maxHp ?? '?'}</span>
              <span class="cg-stat-pow">POW ${card.power ?? '?'}</span>
            </div>
          `;
        }

        grid.appendChild(cardEl);
      });
    }

    panel.appendChild(header);
    panel.appendChild(countEl);
    panel.appendChild(grid);
    overlay.appendChild(panel);
    screen.appendChild(overlay);
  },

  // ── Headquarters Captured animation ──────────────────────────────────────────
  _showHQCapturedAnimation() {
    const screen = this._container?.querySelector('.cg-screen');
    if (!screen) return;

    const overlay = document.createElement('div');
    overlay.className = 'cg-hq-captured-overlay';
    overlay.innerHTML = `
      <div class="cg-hq-captured-banner">
        <div class="cg-hq-captured-flag">🏴</div>
        <div class="cg-hq-captured-text">Headquarters Captured</div>
        <div class="cg-hq-captured-sub">The enemy command has fallen!</div>
      </div>
    `;
    screen.appendChild(overlay);

    // Fade out and remove before the victory popup appears
    setTimeout(() => {
      overlay.classList.add('cg-hq-captured-fadeout');
      setTimeout(() => overlay.remove(), 600);
    }, 2800);
  },

  // ── Game over popup ───────────────────────────────────────────────────────────
  _showGameOverPopup(win, isQuickPlay, npcId) {
    const screen = this._container?.querySelector('.cg-screen');
    if (!screen) return;
    const popup = document.createElement('div');
    popup.className = `cg-gameover-popup ${win ? 'win' : 'lose'}`;

    if (win) {
      const champs = this._state?.playerChampions ?? [];
      const champsHTML = champs.slice(0, 3).map(c => `
        <div class="cg-victory-champ">
          <div class="cg-victory-champ-art">${c.art ?? '⚔️'}</div>
          <div class="cg-victory-champ-name">${c.name ?? 'Champion'}</div>
        </div>
      `).join('');
      popup.innerHTML = `
        <div class="cg-victory-inner">
          <div class="cg-victory-champs">${champsHTML}</div>
          <div class="cg-gameover-popup-text">🏆 Victory!</div>
        </div>
      `;
      if (!isQuickPlay) {
        setTimeout(() => this._showRewardsWindow(npcId, screen), 5000);
      }
    } else {
      popup.innerHTML = `<div class="cg-gameover-popup-text">💀 Defeat!</div>`;
    }

    screen.appendChild(popup);
  },

  _showRewardsWindow(npcId, screen) {
    if (!screen || !this._container) return;
    const npc     = NPCS.find(n => n.id === npcId);
    const rewards = npc?.matchRewards ?? [];

    const win = document.createElement('div');
    win.className = 'cg-rewards-window';
    win.innerHTML = `
      <div class="cg-rewards-title">🎁 Match Rewards</div>
      <div class="cg-rewards-list">
        ${rewards.length
          ? rewards.map(r => this._rewardHTML(r)).join('')
          : `<div class="cg-reward-item"><span class="cg-reward-label cg-reward-none">No rewards for this match.</span></div>`}
      </div>
      <button class="cg-rewards-confirm" id="cg-rewards-confirm">✓ Collect &amp; Continue</button>
    `;
    screen.appendChild(win);

    document.getElementById('cg-rewards-confirm')?.addEventListener('click', () => {
      this._applyRewards(rewards);
      EventBus.emit('cardgame:result', { win: true, npcId });
      EventBus.emit('screen:pop');
    });
  },

  _rewardHTML(r) {
    if (r.type === 'exp') {
      return `<div class="cg-reward-item">
        <span class="cg-reward-icon">⭐</span>
        <span class="cg-reward-label">${r.value} EXP</span>
      </div>`;
    }
    if (r.type === 'item') {
      const item = ITEMS.find(i => i.itemId === r.itemId);
      return `<div class="cg-reward-item">
        <span class="cg-reward-icon">${item?.icon ?? '📦'}</span>
        <span class="cg-reward-label">${item?.name ?? r.itemId}${(r.count ?? 1) > 1 ? ` ×${r.count}` : ''}</span>
      </div>`;
    }
    if (r.type === 'lootBox') {
      const def = LOOT_BOX_TYPES[r.boxTypeId] ?? LOOT_BOX_TYPES.small;
      return `<div class="cg-reward-item">
        <span class="cg-reward-icon">${def.icon}</span>
        <span class="cg-reward-label">${r.label ?? def.label} <span style="font-size:0.75em;color:var(--color-text-dim)">(${def.packCount} pack${def.packCount !== 1 ? 's' : ''})</span></span>
      </div>`;
    }
    return '';
  },

  _applyRewards(rewards) {
    for (const r of rewards) {
      if (r.type === 'exp') {
        GameState.addXp(r.value);
      }
      if (r.type === 'item') {
        GameState.addItem(r.itemId, r.count ?? 1);
      }
      if (r.type === 'lootBox') {
        GameState.addLootBox({ boxTypeId: r.boxTypeId ?? 'small', label: r.label, icon: r.icon ?? '📦' });
      }
    }
    EventBus.emit('toast', { message: '✓ Rewards collected!', type: 'success' });
  },

  // ── Log (rendered inside sidebar, bottom bar left empty) ─────────────────────
  _renderLog(s) {
    const el = document.getElementById('cg-log-bar');
    if (el) el.innerHTML = '';   // bottom bar stays in DOM but is now empty
  },

  _renderSidebarLog(el, s) {
    const logWrap = document.createElement('div');
    logWrap.className = 'cg-sidebar-log';
    logWrap.innerHTML = `<div class="cg-sidebar-label">Log</div>` +
      s.log.slice(-8).reverse()
        .map((msg, i) => `<div class="cg-log-entry ${i === 0 ? 'latest' : 'dim'}">${msg}</div>`)
        .join('');
    el.appendChild(logWrap);
  },
};

export default CardGameScreen;
