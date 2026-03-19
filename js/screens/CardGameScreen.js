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
  end:        'End',
  gameover:   'Game Over',
};

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

  mount(container, params = {}) {
    this._container     = container;
    this._champPanelCol = null;
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
    this._champPanelCol = null;
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
    this._bgm = new Audio('assets/audio/matchost/All Comes Together.mp3');
    this._bgm.loop   = true;
    this._bgm.volume = 0.5;
    this._bgm.play().catch(() => {});   // ignore autoplay block silently
  },

  _stopMatchMusic() {
    if (this._bgm) {
      this._bgm.pause();
      this._bgm.currentTime = 0;
      this._bgm = null;
    }
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
          <div class="cg-dice-zone" id="cg-dice-zone"></div>
          <div class="cg-center">
            <div class="cg-grid-wrap">
              <div class="cg-grid" id="cg-grid"></div>
            </div>
            <div class="cg-champ-panel hidden" id="cg-champ-panel"></div>
            <div class="cg-hand-area" id="cg-hand-area"></div>
          </div>
          <div class="cg-sidebar" id="cg-sidebar"></div>
        </div>
        <div class="cg-bottom">
          <div class="cg-crypt-zone" id="cg-crypt-zone"></div>
          <div class="cg-log-bar"   id="cg-log-bar"></div>
          <div class="cg-deck-zone" id="cg-deck-zone"></div>
        </div>
      </div>
    `;
  },

  _bindEvents() {
    this._unsub.push(
      EventBus.on('cardgame:stateChanged', ({ state }) => {
        this._state = state;
        this._update();
      }),
      EventBus.on('cardgame:summonAssigned', ({ row, col, art, power }) => {
        this._showSummonPopup(row, col, art, power);
      }),
      EventBus.on('cardgame:beginMatch', () => {
        this._showBeginMatchPopup();
      }),
      EventBus.on('cardgame:cardDrawn', () => {
        SoundSystem.drawCard();
      }),
      EventBus.on('cardgame:attackPerformed', ({ attackerRow, attackerCol, targetRow, targetCol, art }) => {
        SoundSystem.attack();
        this._showAttackAnimation(attackerRow, attackerCol, targetRow, targetCol, art);
      }),
      EventBus.on('cardgame:gameOver', ({ win }) => {
        if (win) SoundSystem.victory(); else SoundSystem.defeat();
        this._showGameOverPopup(win);
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
      if (e.key === 'Escape' && this._champPanelCol !== null) {
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
  _renderPhaseBar(s) {
    const el = document.getElementById('cg-phase-bar');
    if (!el) return;
    const order = ['initialize','draw','conjure','strategy','end'];
    const cur   = order.indexOf(s.phase);

    el.innerHTML = `
      <div class="cg-phase-pills">
        ${order.map((p, i) => `
          <span class="cg-phase-pill ${s.phase === p ? 'active' : ''} ${i < cur ? 'done' : ''}">${PHASE_LABELS[p]}</span>
          ${i < order.length - 1 ? '<span class="cg-phase-arrow">›</span>' : ''}
        `).join('')}
      </div>
      <div class="cg-phase-controls">
        <span class="cg-turn-label">Turn ${s.turnNumber}</span>
      </div>
    `;
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
      const champ = s.opponentChampions.find(c => c.col === col);
      if (champ) {
        cell.classList.add('cg-cell-champion', 'cg-cell-opp');
        cell.innerHTML = this._champHTML(champ);
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
        cell.classList.add('cg-cell-empty');
      }
      return cell;
    }

    // ── Player champion row ────────────────────────────────────────────────────
    if (isPlrChamp) {
      const champ = s.playerChampions.find(c => c.col === col);
      if (champ) {
        cell.classList.add('cg-cell-champion', 'cg-cell-plr');
        cell.innerHTML = this._champHTML(champ);

        // Spell target: heal_champion
        if (s.pendingSpell?.card.needsTarget === 'player_champion') {
          cell.classList.add('cg-cell-spell-target');
          cell.addEventListener('click', () => EventBus.emit('cardgame:spellTarget', { row, col }));
          return cell;
        }

        // Hover: show player elite's summons
        const plrEliteForChamp = s.grid[P_ELITE_ROW]?.[col];
        if (plrEliteForChamp?.summons?.length > 0) {
          cell.addEventListener('mouseenter', () => this._showStackTooltip(cell, plrEliteForChamp.summons, plrEliteForChamp.name));
          cell.addEventListener('mouseleave', () => this._hideStackTooltip());
        }

        // Conjure: champion cell — stack matching cards OR open panel
        const canStack     = s.phase === 'conjure' && s.diceResult && s.matchingHand.length > 0;
        const canOpenPanel = s.phase === 'conjure' && (champ.summons?.length ?? 0) > 0;

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
        } else {
          cell.classList.add('cg-cell-empty');
        }
      }
      return cell;
    }

    // ── Battle / elite rows ────────────────────────────────────────────────────
    const gridCard = s.grid[row]?.[col] ?? null;

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

    return cell;
  },

  // ── Card HTML helpers ─────────────────────────────────────────────────────────
  _champHTML(champ) {
    const hpPct      = Math.max(0, champ.hp / champ.maxHp * 100);
    const hpCol      = hpPct > 50 ? '#4ab87c' : hpPct > 25 ? '#e0b84a' : '#c04a4a';
    const stackCount = champ.summons?.length ?? 0;
    return `
      <div class="cg-champion-card">
        ${stackCount > 0 ? `<div class="cg-champ-stack-badge">${stackCount}</div>` : ''}
        <div class="cg-card-art">${champ.art ?? '⚔️'}</div>
        <div class="cg-card-name">${champ.name ?? 'Champion'}</div>
        <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:${hpCol}"></div></div>
        <div class="cg-card-hp">${Math.max(0, champ.hp)}/${champ.maxHp}</div>
      </div>
    `;
  },

  _eliteHTML(elite, selected, acted) {
    const hpPct  = Math.max(0, elite.hp / elite.maxHp * 100);
    const hpCol  = hpPct > 50 ? '#4ab87c' : hpPct > 25 ? '#e0b84a' : '#c04a4a';
    const sums   = elite.summons ?? [];
    const totPow = (elite.power ?? 0) + (elite.tempPowerBonus ?? 0) + sums.reduce((a, c) => a + (c.power ?? 0), 0);
    const bonus  = elite.tempPowerBonus ? ` <span class="cg-bonus">+${elite.tempPowerBonus}</span>` : '';
    const actedBadge = acted ? `<div class="cg-acted-badge">✓</div>` : '';
    return `
      <div class="cg-elite-card ${selected ? 'selected' : ''}">
        ${actedBadge}
        <div class="cg-card-art">${elite.art ?? '✨'}</div>
        <div class="cg-card-name">${elite.name ?? 'Elite'}</div>
        <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:${hpCol}"></div></div>
        <div class="cg-card-stats">
          <span class="cg-stat-hp">${Math.max(0, elite.hp)}/${elite.maxHp}</span>
          <span class="cg-stat-pow">⚔${totPow}${bonus}</span>
          ${sums.length > 0 ? `<span class="cg-stat-summons">+${sums.length}</span>` : ''}
        </div>
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
      return;
    }

    if (s.phase === 'initialize') {
      const step = s.initSubStep;
      el.innerHTML = `
        <div class="cg-sidebar-section">
          <div class="cg-sidebar-title">Initialize</div>
          ${step === 'place_champions'
            ? `<p>Drag your <b>${s.playerHand.length}</b> champion card(s) to the bottom row.</p>`
            : step === 'place_elites'
              ? `<p>Drag your <b>${s.playerHand.filter(c => c.type === 'elite').length}</b> elite card(s) in front of each champion.</p>`
              : `<p>All placed! Starting…</p>`
          }
          ${s.playerChampions.map(c => `<div class="cg-placed-champ">${c.art} ${c.name} → col ${c.col + 1}</div>`).join('')}
        </div>`;
    }

    if (s.phase === 'draw') {
      el.innerHTML = `
        <div class="cg-sidebar-section">
          <div class="cg-sidebar-title">Draw Phase</div>
          <p>Card drawn. Advancing to Conjure…</p>
        </div>`;
    }

    if (s.phase === 'conjure') {
      const pending = s.pendingSpell;
      if (pending) {
        el.innerHTML = `
          <div class="cg-sidebar-section cg-spell-pending-banner">
            <div class="cg-sidebar-title">🔮 Targeting</div>
            <div class="cg-spell-name">${pending.card.art} ${pending.card.name}</div>
            <div class="cg-spell-desc">${pending.card.description}</div>
            <button class="btn-cg btn-cg-cancel-spell" id="cg-cancel-spell-btn">✕ Cancel</button>
          </div>`;
        document.getElementById('cg-cancel-spell-btn')?.addEventListener('click', () => EventBus.emit('cardgame:cancelSpell'));
        return;
      }

      const spells = s.playerHand.filter(c => c.type === 'spell').length;
      el.innerHTML = `
        <div class="cg-sidebar-section">
          <div class="cg-sidebar-title">Conjure Phase</div>
          ${s.diceResult
            ? `<div class="cg-dice-sub-info">
                 ${s.matchingHand.length > 0
                   ? `<b>${s.matchingHand.length}</b> card(s) match. Click a champion to summon.`
                   : s.diceResult[0] + s.diceResult[1] === 7
                     ? 'Spell card drawn!'
                     : 'No matching summon cards.'}
               </div>`
            : `<p>Click the dice to roll.</p>`
          }
          ${spells > 0 ? `<div class="cg-spell-hint">✨ ${spells} spell card(s) in hand — click to cast</div>` : ''}
          <div class="cg-dim">Spell deck: ${s.playerSpellDeck?.length ?? 0}</div>
        </div>`;
    }

    if (s.phase === 'strategy') {
      const { selectedRow: selRow, selectedCol: selCol, attackMode, ralliedIids, actedIids } = s.strategy;
      const selElite     = selRow !== null ? s.grid[selRow]?.[selCol] : null;
      const alreadyActed = selElite ? (actedIids?.has(selElite.iid) ?? false) : false;
      const alreadyRallied = selElite ? (ralliedIids?.has(selElite.iid) ?? false) : false;
      const playerElites = findPlayerElites(s);
      const actedCount   = playerElites.filter(e => actedIids?.has(e.iid)).length;
      const totPow = selElite
        ? (selElite.power ?? 0) + (selElite.tempPowerBonus ?? 0) + (selElite.summons ?? []).reduce((a,c)=>a+(c.power??0),0)
        : 0;

      el.innerHTML = `
        <div class="cg-sidebar-section">
          <div class="cg-sidebar-title">Strategy</div>
          <div class="cg-dim">${actedCount}/${playerElites.length} elites acted</div>
          ${selElite
            ? `<div class="cg-selected-info"><b>${selElite.name}</b><br>HP: ${Math.max(0,selElite.hp)}/${selElite.maxHp} · ⚔${totPow}</div>`
            : `<p class="cg-dim">Click a player elite to act.</p>`}
          ${selElite && !alreadyActed ? `
            <div class="cg-action-group">
              <div class="cg-sidebar-label">Rally (move 1)</div>
              <div class="cg-rally-grid">
                <div></div>
                <button class="btn-cg btn-cg-dir" data-dir="up"    ${alreadyRallied?'disabled':''}>↑</button>
                <div></div>
                <button class="btn-cg btn-cg-dir" data-dir="left"  ${alreadyRallied?'disabled':''}>←</button>
                <div class="cg-dir-center">•</div>
                <button class="btn-cg btn-cg-dir" data-dir="right" ${alreadyRallied?'disabled':''}>→</button>
                <div></div>
                <button class="btn-cg btn-cg-dir" data-dir="down"  ${alreadyRallied?'disabled':''}>↓</button>
                <div></div>
              </div>
            </div>
            <div class="cg-action-group">
              <button class="btn-cg btn-cg-retreat" id="cg-retreat-btn"
                ${selRow <= 2 ? '' : 'disabled'}>Retreat (2 spaces)</button>
              <button class="btn-cg btn-cg-attack ${attackMode ? 'active' : ''}" id="cg-attack-btn">
                ${attackMode ? '⚔ Click a target…' : '⚔ Attack'}
              </button>
            </div>` : ''
          }
          ${alreadyActed ? `<p class="cg-dim">This elite has already acted. Select another.</p>` : ''}
        </div>`;

      el.querySelectorAll('[data-dir]').forEach(btn =>
        btn.addEventListener('click', () => { SoundSystem.move(); EventBus.emit('cardgame:rally', { direction: btn.dataset.dir }); })
      );
      document.getElementById('cg-retreat-btn')?.addEventListener('click', () => { SoundSystem.move(); EventBus.emit('cardgame:retreat'); });
      document.getElementById('cg-attack-btn')?.addEventListener('click', () => {
        if (!attackMode) { SoundSystem.click(); EventBus.emit('cardgame:enableAttack'); }
      });
    }

    if (s.phase === 'end') {
      el.innerHTML = `
        <div class="cg-sidebar-section">
          <div class="cg-sidebar-title">End Phase</div>
          <p>Passing to opponent…</p>
        </div>`;
    }
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
    // Block phase advance while a mid-game elite awaits placement
    if (s.phase !== 'initialize' && s.playerHand.some(c => c.type === 'elite')) {
      disabled = true;
    }
    return `<button class="btn-cg btn-cg-next cg-hand-next-btn" id="cg-next-btn" ${disabled ? 'disabled' : ''}>${label}</button>`;
  },

  _renderHand(s) {
    const el = document.getElementById('cg-hand-area');
    if (!el) return;

    const hasEliteWaiting = s.playerHand.some(c => c.type === 'elite');
    const eliteNotice = hasEliteWaiting
      ? `<span class="cg-elite-notice">⚔ Place your Elite card first!</span>` : '';
    const header = `<div class="cg-hand-header">${eliteNotice || '<span class="cg-hand-label">Hand</span>'}${this._handNextBtn(s)}</div>`;

    // ── Initialize: champion placement ────────────────────────────────────────
    if (s.phase === 'initialize' && s.initSubStep === 'place_champions') {
      el.innerHTML = `${header}<div class="cg-hand" id="cg-hand"></div>`;
      document.getElementById('cg-next-btn')?.addEventListener('click', () => { SoundSystem.click(); EventBus.emit('cardgame:nextPhase'); });
      const hand = document.getElementById('cg-hand');
      s.playerHand.forEach((card, i) => {
        const div = document.createElement('div');
        div.className = 'cg-hand-card cg-hand-champion';
        div.draggable = true;
        div.innerHTML = `
          <div class="cg-hcard-art" style="font-size:2em">${card.art ?? '⚔️'}</div>
          <div class="cg-hcard-name">${card.name ?? 'Champion'}</div>
          <div class="cg-hcard-stats"><span>HP ${card.hp}</span></div>
          <div class="cg-hcard-tag cg-hcard-tag-champion">CHAMPION</div>
        `;
        div.addEventListener('dragstart', e => {
          SoundSystem.dragStart();
          e.dataTransfer.setData('text/plain', String(i));
          e.dataTransfer.effectAllowed = 'move';
          div.classList.add('cg-dragging');
        });
        div.addEventListener('dragend', () => div.classList.remove('cg-dragging'));
        hand.appendChild(div);
      });
      return;
    }

    // ── Initialize: elite placement ───────────────────────────────────────────
    if (s.phase === 'initialize' && s.initSubStep === 'place_elites') {
      el.innerHTML = `${header}<div class="cg-hand" id="cg-hand"></div>`;
      document.getElementById('cg-next-btn')?.addEventListener('click', () => { SoundSystem.click(); EventBus.emit('cardgame:nextPhase'); });
      const hand = document.getElementById('cg-hand');
      s.playerHand.forEach((card, i) => {
        if (card.type !== 'elite') return;
        const hpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp * 100) : 0;
        const div   = document.createElement('div');
        div.className = 'cg-hand-card cg-hand-elite';
        div.draggable = true;
        div.innerHTML = `
          <div class="cg-hcard-art">${card.art ?? '✨'}</div>
          <div class="cg-hcard-name">${card.name ?? 'Elite'}</div>
          <div class="cg-hcard-stats"><span>HP ${card.hp}</span><span>⚔${card.power}</span></div>
          <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:#c07820"></div></div>
          <div class="cg-hcard-tag cg-hcard-tag-elite">ELITE</div>
        `;
        div.addEventListener('dragstart', e => {
          SoundSystem.dragStart();
          e.dataTransfer.setData('text/plain', String(i));
          e.dataTransfer.effectAllowed = 'move';
          div.classList.add('cg-dragging');
        });
        div.addEventListener('dragend', () => div.classList.remove('cg-dragging'));
        hand.appendChild(div);
      });
      return;
    }

    // ── Done initializing but summon hand not yet drawn ───────────────────────
    if (s.phase === 'initialize') {
      el.innerHTML = `${header}<div class="cg-hand-empty">Starting first turn…</div>`;
      document.getElementById('cg-next-btn')?.addEventListener('click', () => { SoundSystem.click(); EventBus.emit('cardgame:nextPhase'); });
      return;
    }

    // ── Normal hand ───────────────────────────────────────────────────────────
    if (!s.playerHand.length) {
      el.innerHTML = `${header}<div class="cg-hand-empty">No cards in hand</div>`;
      document.getElementById('cg-next-btn')?.addEventListener('click', () => { SoundSystem.click(); EventBus.emit('cardgame:nextPhase'); });
      return;
    }

    el.innerHTML = `${header}<div class="cg-hand" id="cg-hand"></div>`;
    document.getElementById('cg-next-btn')?.addEventListener('click', () => { SoundSystem.click(); EventBus.emit('cardgame:nextPhase'); });
    const hand = document.getElementById('cg-hand');

    // If an elite card is in hand, only show elite cards until placed
    const hasEliteInHand = s.playerHand.some(c => c.type === 'elite');

    s.playerHand.forEach((card, i) => {
      const isSpell    = card.type === 'spell';
      const isElite    = card.type === 'elite';

      // Hide summon/spell cards while an elite awaits placement
      if (hasEliteInHand && !isElite) return;

      const isMatching = !isSpell && !isElite && (s.matchingHand?.includes(i) ?? false);
      const isDimmed   = !isSpell && !isElite && s.diceResult && !isMatching;
      const div        = document.createElement('div');

      // Elite in hand (mid-game replacement) — always draggable
      if (isElite) {
        const hpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp * 100) : 0;
        div.className = 'cg-hand-card cg-hand-elite';
        div.draggable = true;
        div.innerHTML = `
          <div class="cg-hcard-art">${card.art ?? '✨'}</div>
          <div class="cg-hcard-name">${card.name ?? 'Elite'}</div>
          <div class="cg-hcard-stats"><span>HP ${card.hp}</span><span>⚔${card.power}</span></div>
          <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:#c07820"></div></div>
          <div class="cg-hcard-tag cg-hcard-tag-elite">ELITE</div>
        `;
        div.addEventListener('dragstart', e => {
          SoundSystem.dragStart();
          e.dataTransfer.setData('text/plain', String(i));
          e.dataTransfer.effectAllowed = 'move';
          div.classList.add('cg-dragging');
        });
        div.addEventListener('dragend', () => div.classList.remove('cg-dragging'));
        hand.appendChild(div);
        return;
      }

      div.className = [
        'cg-hand-card',
        isSpell    ? 'cg-hand-spell'    : '',
        isMatching ? 'cg-hand-matching' : '',
        isDimmed   ? 'cg-hand-no-match' : '',
      ].filter(Boolean).join(' ');

      if (isSpell) {
        div.innerHTML = `
          <div class="cg-hcard-spell-art">${card.art ?? '✨'}</div>
          <div class="cg-hcard-name">${card.name ?? 'Spell'}</div>
          <div class="cg-hcard-spell-desc">${card.description ?? ''}</div>
          <div class="cg-hcard-spell-tag">SPELL</div>
        `;
        div.addEventListener('click', () => {
          if (s.phase !== 'conjure') return;
          EventBus.emit('cardgame:playSpell', { handIdx: i });
        });
      } else {
        const hpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp * 100) : 0;
        div.innerHTML = `
          <div class="cg-hcard-cost">${card.summonCost}</div>
          <div class="cg-hcard-art">${card.art ?? '✨'}</div>
          <div class="cg-hcard-name">${card.name ?? 'Summon'}</div>
          <div class="cg-hcard-stats"><span>HP ${card.hp}</span><span>⚔${card.power}</span></div>
          <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:#4ab87c"></div></div>
        `;
        if (isMatching && s.phase === 'conjure') {
          div.draggable = true;
          div.addEventListener('dragstart', e => {
            SoundSystem.dragStart();
            e.dataTransfer.setData('text/plain', String(i));
            e.dataTransfer.effectAllowed = 'move';
            div.classList.add('cg-dragging');
          });
          div.addEventListener('dragend', () => div.classList.remove('cg-dragging'));
        }
      }

      hand.appendChild(div);
    });
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
        <div class="cg-hcard-cost">${card.summonCost}</div>
        <div class="cg-hcard-art">${card.art ?? '✨'}</div>
        <div class="cg-hcard-name">${card.name ?? 'Summon'}</div>
        <div class="cg-hcard-stats"><span>HP ${card.hp}</span><span>⚔${card.power}</span></div>
        <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:${hpPct}%;background:#4ab87c"></div></div>
      `;
      div.addEventListener('dragstart', e => {
        SoundSystem.dragStart();
        e.dataTransfer.setData('text/plain', `${col}:${idx}`);
        e.dataTransfer.effectAllowed = 'move';
        div.classList.add('cg-dragging');
      });
      div.addEventListener('dragend', () => div.classList.remove('cg-dragging'));
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
    el.innerHTML = `
      <div class="cg-crypt-zone-inner">
        <div class="cg-crypt-title">Crypt</div>
        <div class="cg-crypt-stacks">${this._cryptStackHTML(s.playerCrypt, 'Yours')}</div>
      </div>
    `;
  },

  // ── Opponent crypt (top-right) ────────────────────────────────────────────────
  _renderOppCryptZone(s) {
    const el = document.getElementById('cg-opp-crypt-zone');
    if (!el) return;
    el.innerHTML = `
      <div class="cg-crypt-zone-inner">
        <div class="cg-crypt-title">Crypt</div>
        <div class="cg-crypt-stacks">${this._cryptStackHTML(s.opponentCrypt, 'Opp')}</div>
      </div>
    `;
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

  // ── Attack animation ──────────────────────────────────────────────────────────
  _showAttackAnimation(aRow, aCol, tRow, tCol, art) {
    const grid = document.getElementById('cg-grid');
    const screen = this._container?.querySelector('.cg-screen');
    if (!grid || !screen) return;

    const aCell = grid.querySelector(`[data-row="${aRow}"][data-col="${aCol}"]`);
    const tCell = grid.querySelector(`[data-row="${tRow}"][data-col="${tCol}"]`);
    if (!aCell || !tCell) return;

    const screenRect = screen.getBoundingClientRect();
    const aRect = aCell.getBoundingClientRect();
    const tRect = tCell.getBoundingClientRect();

    const startX = aRect.left - screenRect.left + aRect.width  / 2;
    const startY = aRect.top  - screenRect.top  + aRect.height / 2;
    const endX   = tRect.left - screenRect.left + tRect.width  / 2;
    const endY   = tRect.top  - screenRect.top  + tRect.height / 2;

    const proj = document.createElement('div');
    proj.className = 'cg-attack-projectile';
    proj.textContent = art;
    proj.style.left = startX + 'px';
    proj.style.top  = startY + 'px';
    proj.style.opacity = '1';
    screen.appendChild(proj);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      proj.style.left    = endX + 'px';
      proj.style.top     = endY + 'px';
      proj.style.opacity = '0';
    }));

    setTimeout(() => {
      proj.remove();
      // Hit flash on target cell
      const hit = document.createElement('div');
      hit.className = 'cg-attack-hit';
      hit.style.left   = (tRect.left - screenRect.left) + 'px';
      hit.style.top    = (tRect.top  - screenRect.top)  + 'px';
      hit.style.width  = tRect.width  + 'px';
      hit.style.height = tRect.height + 'px';
      screen.appendChild(hit);
      setTimeout(() => hit.remove(), 420);
    }, 310);
  },

  // ── Game over popup ───────────────────────────────────────────────────────────
  _showGameOverPopup(win) {
    const screen = this._container?.querySelector('.cg-screen');
    if (!screen) return;
    const popup = document.createElement('div');
    popup.className = `cg-gameover-popup ${win ? 'win' : 'lose'}`;
    popup.innerHTML = `<div class="cg-gameover-popup-text">${win ? '🏆 Victory!' : '💀 Defeat!'}</div>`;
    screen.appendChild(popup);
    // auto-remove when screen pops
  },

  // ── Log ───────────────────────────────────────────────────────────────────────
  _renderLog(s) {
    const el = document.getElementById('cg-log-bar');
    if (!el) return;
    el.innerHTML = s.log.slice(-4).reverse()
      .map((msg, i) => `<span class="cg-log-entry ${i === 0 ? 'latest' : 'dim'}">${msg}</span>`)
      .join('');
  },
};

export default CardGameScreen;
