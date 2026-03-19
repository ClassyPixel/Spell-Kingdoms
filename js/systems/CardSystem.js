/**
 * CardSystem — Grid-based tactical card game logic.
 *
 * Phases: initialize → draw → conjure → strategy → regroup → end → (opponent turn) → draw …
 *
 * Initialize sub-steps:
 *   place_champions → place_elites → done
 *
 * Strategy: every player elite may act (attack OR retreat) once per turn.
 * Regroup: assign champion-stacked summons to elites, or cast spells. Auto-skips if nothing possible.
 * Phase auto-advances: draw→conjure, regroup→end (if nothing to do), end→opponent.
 */
import EventBus from '../EventBus.js';
import { CHAMPION_CARDS, ELITE_CARD_DECK, SUMMON_CARD_DECK, SPELL_CARD_DECK } from '../Data.js';

const ROWS = 6;
const COLS = 5;
const PLAYER_ROW  = 5;
const OPP_ROW     = 0;
const P_ELITE_ROW = 4;
const O_ELITE_ROW = 1;

let _uid = 0;
function uid()   { return `c${++_uid}`; }
function inst(t) {
  const hasSummons = t.type === 'elite' || t.type === 'champion';
  return { ...t, iid: uid(), hp: t.hp ?? undefined, maxHp: t.hp ?? undefined,
    summons: hasSummons ? [] : undefined };
}
function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function rollD6() { return Math.floor(Math.random() * 6) + 1; }

// ── Helpers ────────────────────────────────────────────────────────────────────
function gridElite(s, row, col) {
  const c = s.grid[row]?.[col];
  return c?.type === 'elite' ? c : null;
}
function findEliteOnGrid(s, owner) {
  const out = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (s.grid[r][c]?.type === 'elite' && s.grid[r][c]?.owner === owner)
        out.push({ row: r, col: c, elite: s.grid[r][c] });
  return out;
}
function totalPower(elite) {
  const ep = (elite.power ?? 0) + (elite.tempPowerBonus ?? 0);
  return Math.max(0, ep) + (elite.summons ?? []).reduce((s, c) => s + (c.power ?? 0), 0);
}
function allElitesActed(s) {
  const elites = findEliteOnGrid(s, 'player');
  return elites.length > 0 && elites.every(({ elite }) => s.strategy.actedIids.has(elite.iid));
}
function log(s, msg) {
  s.log.push(msg);
  if (s.log.length > 30) s.log.shift();
}

// ── State factory ──────────────────────────────────────────────────────────────
function makeState(npcId, deckOverride, isQuickPlay = false) {
  const elites  = deckOverride?.elites  ?? ELITE_CARD_DECK;
  const summons = deckOverride?.summons ?? SUMMON_CARD_DECK;
  const spells  = deckOverride?.spells  ?? SPELL_CARD_DECK;
  return {
    npcId,
    isQuickPlay,
    grid: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),

    playerChampions:   [],
    opponentChampions: [],

    playerEliteDeck:    shuffle(elites.map(inst)),
    playerSummonDeck:   shuffle(summons.map(inst)),
    playerSpellDeck:    shuffle(spells.map(t => ({ ...t, iid: uid() }))),
    opponentEliteDeck:  shuffle(ELITE_CARD_DECK.map(inst)),
    opponentSummonDeck: shuffle(SUMMON_CARD_DECK.map(inst)),
    opponentSpellDeck:  shuffle(SPELL_CARD_DECK.map(t => ({ ...t, iid: uid() }))),

    // Hand starts with the 3 champion cards for placement
    playerHand:   CHAMPION_CARDS.map(inst),
    opponentHand: [],
    playerCrypt:  [],
    opponentCrypt:[],

    phase:       'initialize',
    initSubStep: 'place_champions',   // place_champions | place_elites | done

    playerNeedsElite:   false,   // draw replacement elite at next draw phase
    opponentNeedsElite: false,   // spawn replacement elite at opponent's next turn

    diceResult:   null,
    diceRolled:   false,
    matchingHand: [],
    pendingSpell: null,

    strategy: {
      selectedRow: null,
      selectedCol: null,
      ralliedIids: new Set(),
      actedIids:   new Set(),   // elites that have attacked or retreated this turn
      attackMode:  false,
    },

    log:        [],
    turnNumber: 1,
    gameOver:   false,
    winner:     null,
  };
}

// ── CardSystem ─────────────────────────────────────────────────────────────────
const CardSystem = {
  state: null,
  _screen: null,

  setCardGameScreen(screen) { this._screen = screen; },

  init() {
    EventBus.on('cardgame:start',           (d) => this._startGame(d.npcId, d.deck, d.isQuickPlay ?? false));
    EventBus.on('cardgame:placeChampion',   (d) => this._placeChampion(d.col, d.handIdx));
    EventBus.on('cardgame:placeElite',      (d) => this._placeElite(d.handIdx, d.col));
    EventBus.on('cardgame:rollDice',        ()  => this._rollDice());
    EventBus.on('cardgame:stackOnChampion', (d) => this._stackOnChampion(d.handIdx, d.col));
    EventBus.on('cardgame:playFromChampion',(d) => this._playFromChampion(d.champCol, d.summonIdx, d.eliteRow, d.eliteCol));
    EventBus.on('cardgame:playToElite',     (d) => this._playToElite(d.handIdx, d.row, d.col));
    EventBus.on('cardgame:playSpell',       (d) => this._playSpell(d.handIdx));
    EventBus.on('cardgame:spellTarget',     (d) => this._spellTarget(d.row, d.col));
    EventBus.on('cardgame:cancelSpell',     ()  => this._cancelSpell());
    EventBus.on('cardgame:selectElite',     (d) => this._selectElite(d.row, d.col));
    EventBus.on('cardgame:rally',           (d) => this._rally(d.direction));
    EventBus.on('cardgame:retreat',         ()  => this._retreat());
    EventBus.on('cardgame:enableAttack',    ()  => this._enableAttack());
    EventBus.on('cardgame:attackTarget',    (d) => this._attackTarget(d.row, d.col));
    EventBus.on('cardgame:nextPhase',       ()  => this._nextPhase());
    EventBus.on('cardgame:surrender',       ()  => this._endGame(false));
  },

  // ── Initialize ──────────────────────────────────────────────────────────────

  _startGame(npcId, deckOverride, isQuickPlay = false) {
    _uid = 0;
    this.state = makeState(npcId, deckOverride, isQuickPlay);
    const s = this.state;

    // Opponent setup (champions cols 1-3, elites in front, 6-card hand)
    [1, 2, 3].forEach((col, i) => {
      const ch = inst(CHAMPION_CARDS[i]);
      ch.col = col; ch.owner = 'opponent';
      s.opponentChampions.push(ch);
    });
    s.opponentChampions.forEach(ch => {
      const el = s.opponentEliteDeck.shift();
      el.owner = 'opponent'; el.row = O_ELITE_ROW; el.col = ch.col;
      s.grid[O_ELITE_ROW][ch.col] = el;
    });
    for (let i = 0; i < 6; i++) {
      const c = s.opponentSummonDeck.shift();
      if (c) s.opponentHand.push(c);
    }

    log(s, 'Game started! Drag your 3 champions to the bottom row.');
    if (this._screen) EventBus.emit('screen:push', { screen: this._screen, params: { npcId } });
    this._emit();
  },

  _placeChampion(col, handIdx) {
    const s = this.state;
    if (s.phase !== 'initialize' || s.initSubStep !== 'place_champions') return;
    if (col < 0 || col >= COLS) return;
    if (s.playerChampions.find(c => c.col === col)) { log(s, 'Column already taken.'); this._emit(); return; }
    if (handIdx === undefined || handIdx === null) return;

    const card = s.playerHand[handIdx];
    if (!card || card.type !== 'champion') { log(s, 'Select a champion card.'); this._emit(); return; }

    const ch = s.playerHand.splice(handIdx, 1)[0];
    ch.col = col; ch.owner = 'player';
    s.playerChampions.push(ch);
    log(s, `${ch.name} placed in column ${col + 1}.`);

    if (s.playerChampions.length === 3) this._afterChampionsPlaced();
    this._emit();
  },

  _afterChampionsPlaced() {
    const s = this.state;
    s.initSubStep = 'place_elites';
    for (let i = 0; i < 3; i++) {
      const el = s.playerEliteDeck.shift();
      if (el) { el.owner = 'player'; s.playerHand.push(el); }
    }
    log(s, 'Champions placed! Drag your elite cards in front of each champion.');
  },

  _placeElite(handIdx, col) {
    const s = this.state;
    if (s.gameOver) return;
    // Allow during init (place_elites step) OR any mid-game phase when an elite is in hand
    const isInit = s.phase === 'initialize' && s.initSubStep === 'place_elites';
    const isMidGame = s.phase !== 'initialize';
    if (!isInit && !isMidGame) return;
    if (col < 0 || col >= COLS) return;

    const card = s.playerHand[handIdx];
    if (!card || card.type !== 'elite') { log(s, 'Select an elite card.'); this._emit(); return; }
    if (!s.playerChampions.find(c => c.col === col)) { log(s, 'No champion in that column.'); this._emit(); return; }
    if (s.grid[P_ELITE_ROW][col]) { log(s, 'Elite already placed here.'); this._emit(); return; }

    const el = s.playerHand.splice(handIdx, 1)[0];
    el.row = P_ELITE_ROW; el.col = col;
    s.grid[P_ELITE_ROW][col] = el;
    log(s, `${el.name} placed in column ${col + 1}.`);

    if (s.phase === 'initialize') {
      const allPlaced = s.playerChampions.every(ch => s.grid[P_ELITE_ROW][ch.col]);
      if (allPlaced) this._finishInitialize();
    }
    this._emit();
  },

  _finishInitialize() {
    const s = this.state;
    s.initSubStep = 'done';
    for (let i = 0; i < 6; i++) {
      const c = s.playerSummonDeck.shift();
      if (c) s.playerHand.push(c);
    }
    log(s, 'All placed! Starting first turn…');
    this._emit();
    EventBus.emit('cardgame:beginMatch');
    const thisState = this.state;
    setTimeout(() => {
      if (this.state === thisState) this._nextPhase();  // init → draw (auto-advances to conjure)
    }, 2200);
  },

  // ── Conjure Phase ─────────────────────────────────────────────────────────────

  _rollDice() {
    const s = this.state;
    if (s.phase !== 'conjure') return;
    if (s.diceRolled) { log(s, 'Already rolled. Play a Second Wind to roll again.'); this._emit(); return; }

    const d1 = rollD6(), d2 = rollD6();
    const total = d1 + d2;
    s.diceResult = [d1, d2];
    s.diceRolled = true;

    if (total === 7) {
      const spell = s.playerSpellDeck.shift();
      if (spell) { s.playerHand.push(spell); log(s, `🎲 ${d1}+${d2}=7 — Arcane surge! Drew: ${spell.name}.`); }
      else log(s, `🎲 ${d1}+${d2}=7 — Arcane surge! (Spell deck empty.)`);
      s.matchingHand = [];
    } else {
      s.matchingHand = s.playerHand
        .map((c, i) => (c.type === 'summon' && c.summonCost === total) ? i : -1)
        .filter(i => i !== -1);
      log(s, `🎲 ${d1}+${d2}=${total}. ${s.matchingHand.length} summon card(s) match!`);
    }
    this._emit();
  },

  _playToElite(handIdx, row, col) {
    const s = this.state;
    if (s.phase !== 'conjure') return;
    if (!s.diceResult) { log(s, 'Roll the dice first!'); this._emit(); return; }
    if (!s.matchingHand.includes(handIdx)) { log(s, 'Card does not match the dice roll.'); this._emit(); return; }

    const elite = gridElite(s, row, col);
    if (!elite || elite.owner !== 'player') { log(s, 'Target must be a player elite.'); this._emit(); return; }

    const card = s.playerHand.splice(handIdx, 1)[0];
    elite.summons.push(card);
    s.matchingHand = s.matchingHand.filter(i => i !== handIdx).map(i => i > handIdx ? i - 1 : i);
    log(s, `${card.name} stacked under ${elite.name}.`);
    this._emit();
    EventBus.emit('cardgame:summonAssigned', { row, col, art: card.art ?? '✨', power: card.power ?? 0 });
  },

  _stackOnChampion(handIdx, col) {
    const s = this.state;
    if (s.phase !== 'conjure' || !s.diceResult) return;
    if (!s.matchingHand.includes(handIdx)) { log(s, 'Card does not match dice roll.'); this._emit(); return; }
    const champ = s.playerChampions.find(c => c.col === col);
    if (!champ) return;
    if (!champ.summons) champ.summons = [];
    const card = s.playerHand.splice(handIdx, 1)[0];
    champ.summons.push(card);
    s.matchingHand = s.matchingHand.filter(i => i !== handIdx).map(i => i > handIdx ? i - 1 : i);
    log(s, `${card.name} stacked on ${champ.name}. Click champion to assign to an elite.`);
    this._emit();
  },

  _playFromChampion(champCol, summonIdx, eliteRow, eliteCol) {
    const s = this.state;
    const champ = s.playerChampions.find(c => c.col === champCol);
    if (!champ?.summons?.[summonIdx]) return;
    const elite = s.grid[eliteRow]?.[eliteCol];
    if (!elite || elite.type !== 'elite' || elite.owner !== 'player') return;
    const card = champ.summons.splice(summonIdx, 1)[0];
    elite.summons.push(card);
    log(s, `${card.name} assigned to ${elite.name}.`);
    this._emit();
    EventBus.emit('cardgame:summonAssigned', { row: eliteRow, col: eliteCol, art: card.art ?? '✨', power: card.power ?? 0 });
  },

  // ── Spell logic ───────────────────────────────────────────────────────────────

  _playSpell(handIdx) {
    const s = this.state;
    if (s.phase !== 'conjure' && s.phase !== 'regroup') return;
    const card = s.playerHand[handIdx];
    if (!card || card.type !== 'spell') return;

    if (card.needsTarget) {
      s.pendingSpell = { handIdx, card };
      log(s, `${card.name}: ${card.description} — Click a target.`);
      this._emit();
    } else {
      s.playerHand.splice(handIdx, 1);
      s.matchingHand = s.matchingHand.filter(i => i !== handIdx).map(i => i > handIdx ? i - 1 : i);
      this._applySpellEffect(card.effect, null, null);
      log(s, `Cast ${card.name}!`);
      this._emit();
    }
  },

  _spellTarget(row, col) {
    const s = this.state;
    if (!s.pendingSpell) return;
    const { handIdx, card } = s.pendingSpell;
    const needsTarget = card.needsTarget;

    if (needsTarget === 'player_elite') {
      const e = gridElite(s, row, col);
      if (!e || e.owner !== 'player') { log(s, 'Invalid target — click a player elite.'); this._emit(); return; }
    } else if (needsTarget === 'player_champion') {
      if (row !== PLAYER_ROW) { log(s, 'Invalid target — click a player champion.'); this._emit(); return; }
      if (!s.playerChampions.find(c => c.col === col)) { log(s, 'No champion there.'); this._emit(); return; }
    } else if (needsTarget === 'opponent_elite') {
      const e = gridElite(s, row, col);
      if (!e || e.owner !== 'opponent') { log(s, 'Invalid target — click an opponent elite.'); this._emit(); return; }
    }

    s.playerHand.splice(handIdx, 1);
    s.matchingHand = s.matchingHand.filter(i => i !== handIdx).map(i => i > handIdx ? i - 1 : i);
    s.pendingSpell = null;
    this._applySpellEffect(card.effect, row, col);
    log(s, `Cast ${card.name}!`);
    this._emit();
  },

  _cancelSpell() {
    const s = this.state;
    if (!s.pendingSpell) return;
    log(s, `Cancelled ${s.pendingSpell.card.name}.`);
    s.pendingSpell = null;
    this._emit();
  },

  _applySpellEffect(effect, row, col) {
    const s = this.state;
    switch (effect.type) {
      case 'extra_roll':
        s.diceResult = null; s.diceRolled = false; s.matchingHand = [];
        log(s, 'Second Wind! Roll again.');
        break;
      case 'revive':
        if (!s.playerCrypt.length) { log(s, 'Crypt is empty.'); break; }
        const rev = s.playerCrypt.pop();
        if (rev.maxHp !== undefined) rev.hp = rev.maxHp;
        s.playerHand.push(rev);
        log(s, `${rev.name} revived!`);
        break;
      case 'draw_cards':
        let drew = 0;
        for (let i = 0; i < (effect.count ?? 1); i++) {
          const c = s.playerSummonDeck.shift();
          if (c) { s.playerHand.push(c); drew++; }
        }
        log(s, `Drew ${drew} summon card(s).`);
        break;
      case 'boost_elite': {
        const e = gridElite(s, row, col);
        if (e) { e.tempPowerBonus = (e.tempPowerBonus ?? 0) + (effect.amount ?? 3); log(s, `${e.name} +${effect.amount} power!`); }
        break;
      }
      case 'heal_champion': {
        const ch = s.playerChampions.find(c => c.col === col);
        if (ch) { const b = ch.hp; ch.hp = Math.min(ch.maxHp, ch.hp + (effect.amount ?? 5)); log(s, `${ch.name} healed ${ch.hp - b} HP.`); }
        break;
      }
      case 'teleport_elite': {
        const e = gridElite(s, row, col);
        if (!e) break;
        let tCol = null;
        const sc = s.playerChampions.find(c => c.col === e.col);
        if (sc && !s.grid[P_ELITE_ROW][sc.col]) tCol = sc.col;
        else for (const ch of s.playerChampions) { if (!s.grid[P_ELITE_ROW][ch.col]) { tCol = ch.col; break; } }
        if (tCol === null) { log(s, 'No open front row.'); break; }
        s.grid[e.row][e.col] = null;
        e.row = P_ELITE_ROW; e.col = tCol;
        s.grid[P_ELITE_ROW][tCol] = e;
        log(s, `${e.name} teleported to col ${tCol + 1}!`);
        break;
      }
      case 'shield_elite': {
        const e = gridElite(s, row, col);
        if (e) { e.hp += (effect.amount ?? 5); e.maxHp += (effect.amount ?? 5); log(s, `${e.name} +${effect.amount} max HP!`); }
        break;
      }
      case 'weaken_elite': {
        const e = gridElite(s, row, col);
        if (e) { e.tempPowerBonus = (e.tempPowerBonus ?? 0) - (effect.amount ?? 3); log(s, `${e.name} -${effect.amount} power!`); }
        break;
      }
      default: log(s, `Unknown spell: ${effect.type}`);
    }
  },

  // ── Strategy Phase ────────────────────────────────────────────────────────────

  _selectElite(row, col) {
    const s = this.state;
    if (s.phase !== 'strategy') return;
    const elite = gridElite(s, row, col);
    if (!elite || elite.owner !== 'player') return;
    if (s.strategy.actedIids.has(elite.iid)) return;  // already acted

    if (s.strategy.selectedRow === row && s.strategy.selectedCol === col) {
      s.strategy.selectedRow = null; s.strategy.selectedCol = null;
      s.strategy.attackMode  = false;
    } else {
      s.strategy.selectedRow = row; s.strategy.selectedCol = col;
      s.strategy.attackMode  = false;
    }
    this._emit();
  },

  _rally(direction) {
    const s = this.state;
    if (s.phase !== 'strategy') return;
    const { selectedRow: row, selectedCol: col } = s.strategy;
    if (row === null) { log(s, 'Select an elite first.'); this._emit(); return; }

    const elite = gridElite(s, row, col);
    if (!elite) return;
    if (s.strategy.actedIids.has(elite.iid))   { log(s, 'This elite has already acted.'); this._emit(); return; }
    if (s.strategy.ralliedIids.has(elite.iid)) { log(s, 'This elite has already rallied.'); this._emit(); return; }

    const dr = { up: -1, down: 1, left: 0,  right: 0  }[direction] ?? 0;
    const dc = { up: 0,  down: 0, left: -1, right: 1  }[direction] ?? 0;
    const nr = row + dr, nc = col + dc;

    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { log(s, 'Cannot move outside grid.'); this._emit(); return; }
    if (nr === PLAYER_ROW || nr === OPP_ROW)           { log(s, 'Elites cannot enter champion rows.'); this._emit(); return; }
    if (s.grid[nr][nc] !== null)                       { log(s, 'Cell is occupied.'); this._emit(); return; }

    s.grid[row][col] = null;
    elite.row = nr; elite.col = nc;
    s.grid[nr][nc] = elite;
    s.strategy.ralliedIids.add(elite.iid);
    s.strategy.selectedRow = nr;
    s.strategy.selectedCol = nc;
    log(s, `${elite.name} rallied ${direction}.`);
    this._emit();
  },

  _retreat() {
    const s = this.state;
    if (s.phase !== 'strategy') return;
    const { selectedRow: row, selectedCol: col } = s.strategy;
    if (row === null) { log(s, 'Select an elite first.'); this._emit(); return; }

    const elite = gridElite(s, row, col);
    if (!elite) return;
    if (s.strategy.actedIids.has(elite.iid)) { log(s, 'This elite has already acted.'); this._emit(); return; }
    if (row > 2) { log(s, 'Retreat only available in opponent territory (rows 1-2).'); this._emit(); return; }

    const nr = Math.min(row + 2, PLAYER_ROW - 1);
    if (s.grid[nr][col] !== null) { log(s, 'Retreat path blocked.'); this._emit(); return; }

    s.grid[row][col] = null;
    elite.row = nr; elite.col = col;
    s.grid[nr][col] = elite;
    s.strategy.actedIids.add(elite.iid);
    s.strategy.selectedRow = null;
    s.strategy.selectedCol = null;
    log(s, `${elite.name} retreated.`);

    const thisState = this.state;
    if (allElitesActed(s)) {
      log(s, 'All elites have acted!');
      this._emit();
      setTimeout(() => { if (this.state === thisState) this._endStrategyPhase(); }, 600);
    } else {
      this._emit();
    }
  },

  _enableAttack() {
    const s = this.state;
    if (s.phase !== 'strategy') return;
    if (s.strategy.selectedRow === null) { log(s, 'Select an elite first.'); this._emit(); return; }
    const elite = gridElite(s, s.strategy.selectedRow, s.strategy.selectedCol);
    if (elite && s.strategy.actedIids.has(elite.iid)) { log(s, 'Elite has already acted.'); this._emit(); return; }
    s.strategy.attackMode = true;
    log(s, 'Attack mode: click a target.');
    this._emit();
  },

  _attackTarget(row, col) {
    const s = this.state;
    if (s.phase !== 'strategy' || !s.strategy.attackMode) return;

    const { selectedRow: aRow, selectedCol: aCol } = s.strategy;
    if (aRow === null) return;

    const attacker = gridElite(s, aRow, aCol);
    if (!attacker) return;
    if (s.strategy.actedIids.has(attacker.iid)) return;
    const atkPow = totalPower(attacker);

    const _markActed = () => {
      s.strategy.actedIids.add(attacker.iid);
      s.strategy.attackMode  = false;
      s.strategy.selectedRow = null;
      s.strategy.selectedCol = null;
      const thisState = this.state;
      if (!this._checkWin()) {
        if (allElitesActed(s)) {
          log(s, 'All elites have acted!');
          this._emit();
          setTimeout(() => { if (this.state === thisState) this._endStrategyPhase(); }, 600);
        } else {
          log(s, 'Select another elite to act.');
          this._emit();
        }
      }
    };

    // ── Attack opponent elite ──────────────────────────────────────────────────
    const target = gridElite(s, row, col);
    if (target && target.owner === 'opponent') {
      const adjVertical   = Math.abs(aRow - row) === 1 && aCol === col;
      const adjHorizontal = aRow === row && Math.abs(aCol - col) === 1;
      if (!adjVertical && !adjHorizontal) {
        log(s, 'Must be adjacent (above/below or left/right) to attack an elite.'); this._emit(); return;
      }
      log(s, `${attacker.name} (${atkPow}) attacks ${target.name}!`);
      EventBus.emit('cardgame:attackPerformed', { attackerRow: aRow, attackerCol: aCol, targetRow: row, targetCol: col, art: attacker.art ?? '⚔️' });
      let dmg = atkPow;
      while (dmg > 0 && target.summons.length > 0) {
        const sm = target.summons[target.summons.length - 1];
        if (dmg >= sm.hp) { dmg -= sm.hp; s.opponentCrypt.push(target.summons.pop()); log(s, `${sm.name} destroyed!`); }
        else              { sm.hp -= dmg; dmg = 0; }
      }
      if (dmg > 0) {
        target.hp -= dmg;
        log(s, `${target.name} takes ${dmg}! (${Math.max(0, target.hp)}/${target.maxHp} HP)`);
        if (target.hp <= 0) {
          log(s, `${target.name} destroyed!`); s.opponentCrypt.push(target); s.grid[row][col] = null;
          this._spawnOpponentElite(col);
        }
      }
      _markActed(); return;
    }

    // ── Attack opponent champion ───────────────────────────────────────────────
    if (row === OPP_ROW) {
      const champ = s.opponentChampions.find(c => c.col === col);
      if (!champ) { this._emit(); return; }
      if (aRow !== OPP_ROW + 1 || aCol !== col) {
        log(s, 'Must be in front of the champion to attack.'); this._emit(); return;
      }
      EventBus.emit('cardgame:attackPerformed', { attackerRow: aRow, attackerCol: aCol, targetRow: row, targetCol: col, art: attacker.art ?? '⚔️' });
      champ.hp -= atkPow;
      log(s, `${attacker.name} attacks ${champ.name} for ${atkPow}! (${Math.max(0,champ.hp)}/${champ.maxHp} HP)`);
      if (champ.hp <= 0) {
        log(s, `${champ.name} destroyed!`);
        s.opponentChampions = s.opponentChampions.filter(c => c !== champ);
        const ef = gridElite(s, O_ELITE_ROW, col);
        if (ef?.owner === 'opponent') { s.opponentCrypt.push(ef); s.grid[O_ELITE_ROW][col] = null; }
      }
      _markActed(); return;
    }

    log(s, 'Invalid target.'); this._emit();
  },

  _spawnOpponentElite(col) {
    const s = this.state;
    if (!s.opponentEliteDeck.length) return;
    s.opponentNeedsElite = true;
  },

  _resolveOpponentElite() {
    const s = this.state;
    if (!s.opponentNeedsElite || !s.opponentEliteDeck.length) return;
    s.opponentNeedsElite = false;
    for (const ch of s.opponentChampions) {
      if (!s.grid[O_ELITE_ROW][ch.col]) {
        const el = s.opponentEliteDeck.shift();
        el.owner = 'opponent'; el.row = O_ELITE_ROW; el.col = ch.col;
        s.grid[O_ELITE_ROW][ch.col] = el;
        log(s, `Opponent draws ${el.name}!`);
        return;
      }
    }
  },

  _spawnPlayerElite(col) {
    const s = this.state;
    if (!s.playerEliteDeck.length) { log(s, 'No more elite cards!'); return; }
    s.playerNeedsElite = true;
    log(s, 'Elite destroyed! A replacement will arrive at the start of your next turn.');
  },

  // ── Phase transitions ──────────────────────────────────────────────────────

  _nextPhase() {
    const s = this.state;
    if (s.gameOver) return;
    if (s.phase === 'initialize') {
      if (s.initSubStep !== 'done') { log(s, 'Finish placing all cards first!'); this._emit(); return; }
      s.phase = 'draw';
      this._drawPhase();
    } else if (s.phase === 'draw') {
      s.phase = 'conjure'; s.diceResult = null; s.diceRolled = false;
      s.matchingHand = []; s.pendingSpell = null;
      log(s, 'Conjure Phase — roll the dice!');
      this._emit();
    } else if (s.phase === 'conjure') {
      s.pendingSpell = null;
      s.phase = 'strategy';
      s.strategy = { selectedRow: null, selectedCol: null, ralliedIids: new Set(), actedIids: new Set(), attackMode: false };
      log(s, 'Strategy Phase — select an elite to act.');
      this._emit();
    } else if (s.phase === 'strategy') {
      this._endStrategyPhase();
    } else if (s.phase === 'regroup') {
      this._endRegroupPhase();
    } else if (s.phase === 'end') {
      this._opponentTurn();
    }
  },

  _drawPhase() {
    const s = this.state;
    // Clear temp bonuses at start of each player turn
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (s.grid[r]?.[c]) delete s.grid[r][c].tempPowerBonus;

    // Draw replacement elite first if one is pending
    if (s.playerNeedsElite && s.playerEliteDeck.length) {
      s.playerNeedsElite = false;
      const el = s.playerEliteDeck.shift();
      el.owner = 'player';
      s.playerHand.push(el);
      log(s, `${el.name} drawn to hand — place it on a champion!`);
      EventBus.emit('cardgame:cardDrawn');
    }

    const card = s.playerSummonDeck.shift();
    if (card) { s.playerHand.push(card); log(s, `Drew: ${card.name} (Cost ${card.summonCost}).`); }
    else log(s, 'Summon deck empty!');
    EventBus.emit('cardgame:cardDrawn');
    this._emit();

    // Auto-advance to conjure
    const thisState = this.state;
    setTimeout(() => {
      if (this.state === thisState && s.phase === 'draw') this._nextPhase();
    }, 800);
  },

  _endStrategyPhase() {
    const s = this.state;
    s.strategy = { selectedRow: null, selectedCol: null, ralliedIids: new Set(), actedIids: new Set(), attackMode: false };
    this._enterRegroup();
  },

  _canRegroup(s) {
    const hasSpells        = s.playerHand.some(c => c.type === 'spell');
    const hasStackedSummons = s.playerChampions.some(c => (c.summons?.length ?? 0) > 0);
    const hasPlayerElites  = findEliteOnGrid(s, 'player').length > 0;
    return hasSpells || (hasStackedSummons && hasPlayerElites);
  },

  _enterRegroup() {
    const s = this.state;
    if (!this._canRegroup(s)) {
      // Nothing to do — skip straight to end
      s.phase = 'end';
      log(s, 'Regroup skipped — nothing to do. Passing to opponent…');
      this._emit();
      const thisState = this.state;
      setTimeout(() => { if (this.state === thisState && s.phase === 'end') this._opponentTurn(); }, 800);
      return;
    }
    s.phase = 'regroup';
    s.pendingSpell = null;
    log(s, 'Regroup Phase — assign summons or cast spells.');
    this._emit();
  },

  _endRegroupPhase() {
    const s = this.state;
    s.pendingSpell = null;
    s.phase = 'end';
    log(s, 'End Phase — passing to opponent…');
    this._emit();
    const thisState = this.state;
    setTimeout(() => { if (this.state === thisState && s.phase === 'end') this._opponentTurn(); }, 800);
  },

  // ── Opponent AI ───────────────────────────────────────────────────────────────

  _opponentTurn() {
    const s = this.state;
    log(s, '── Opponent\'s Turn ──');

    // Draw replacement elite first if one is pending
    this._resolveOpponentElite();

    const card = s.opponentSummonDeck.shift();
    if (card) s.opponentHand.push(card);

    const d1 = rollD6(), d2 = rollD6(), total = d1 + d2;
    log(s, `Opponent rolls: ${d1}+${d2}=${total}`);
    if (total !== 7) {
      s.opponentHand.filter(c => c.type === 'summon' && c.summonCost === total).forEach(card => {
        const elites = findEliteOnGrid(s, 'opponent');
        if (!elites.length) return;
        const t = elites.reduce((a, b) => a.elite.summons.length <= b.elite.summons.length ? a : b);
        t.elite.summons.push(card);
        s.opponentHand = s.opponentHand.filter(c => c !== card);
        log(s, `Opponent summons ${card.name}.`);
      });
    } else {
      const spell = s.opponentSpellDeck.shift();
      if (spell) log(s, `Opponent drew spell: ${spell.name}.`);
    }

    const oppElites = findEliteOnGrid(s, 'opponent').sort((a, b) => b.row - a.row);
    let attacked = false;
    for (const { row, col, elite } of oppElites) {
      if (attacked) break;
      const atkPow = totalPower(elite);
      const nextRow = row + 1;

      if (row === P_ELITE_ROW) {
        const pChamp = s.playerChampions.find(c => c.col === col);
        if (pChamp) {
          EventBus.emit('cardgame:attackPerformed', { attackerRow: row, attackerCol: col, targetRow: PLAYER_ROW, targetCol: col, art: elite.art ?? '⚔️' });
          pChamp.hp -= atkPow;
          log(s, `${elite.name} attacks your ${pChamp.name} for ${atkPow}! (${Math.max(0,pChamp.hp)}/${pChamp.maxHp} HP)`);
          if (pChamp.hp <= 0) { log(s, `${pChamp.name} defeated!`); s.playerChampions = s.playerChampions.filter(c => c !== pChamp); }
          attacked = true; if (this._checkWin()) return; continue;
        }
      }

      const pElite = nextRow < ROWS ? gridElite(s, nextRow, col) : null;
      if (pElite?.owner === 'player') {
        EventBus.emit('cardgame:attackPerformed', { attackerRow: row, attackerCol: col, targetRow: nextRow, targetCol: col, art: elite.art ?? '⚔️' });
        let dmg = atkPow;
        while (dmg > 0 && pElite.summons.length > 0) {
          const sm = pElite.summons[pElite.summons.length - 1];
          if (dmg >= sm.hp) { dmg -= sm.hp; s.playerCrypt.push(pElite.summons.pop()); log(s, `Your ${sm.name} destroyed!`); }
          else              { sm.hp -= dmg; dmg = 0; }
        }
        if (dmg > 0) {
          pElite.hp -= dmg;
          log(s, `${elite.name} attacks your ${pElite.name} for ${dmg}! (${Math.max(0,pElite.hp)}/${pElite.maxHp} HP)`);
          if (pElite.hp <= 0) {
            log(s, `Your ${pElite.name} destroyed!`); s.playerCrypt.push(pElite);
            s.grid[nextRow][col] = null; this._spawnPlayerElite(col);
          }
        }
        attacked = true; if (this._checkWin()) return; continue;
      }

      if (nextRow < PLAYER_ROW && s.grid[nextRow][col] === null) {
        s.grid[row][col] = null; elite.row = nextRow; elite.col = col;
        s.grid[nextRow][col] = elite; log(s, `${elite.name} advances.`);
      }
    }

    s.turnNumber++; s.phase = 'draw';
    log(s, `── Your Turn (round ${s.turnNumber}) ──`);
    this._drawPhase();
  },

  // ── Win condition ──────────────────────────────────────────────────────────

  _checkWin() {
    const s = this.state;
    if (s.opponentChampions.length === 0) { this._endGame(true);  return true; }
    if (s.playerChampions.length   === 0) { this._endGame(false); return true; }
    const hasOppElites = findEliteOnGrid(s, 'opponent').length > 0;
    if (!hasOppElites && !s.opponentEliteDeck.length) { this._endGame(true);  return true; }
    const hasPlrElites = findEliteOnGrid(s, 'player').length > 0;
    if (!hasPlrElites && !s.playerEliteDeck.length)   { this._endGame(false); return true; }
    return false;
  },

  _endGame(win) {
    const s = this.state;
    s.gameOver = true; s.winner = win ? 'player' : 'opponent'; s.phase = 'gameover';
    log(s, win ? '🎉 Victory!' : '💀 Defeat!');
    EventBus.emit('cardgame:gameOver', { win, isQuickPlay: s.isQuickPlay ?? false, npcId: s.npcId });
    this._emit();
    // Defeat or quick-play: auto-close after 2.5s
    // Story wins: CardGameScreen handles closing via the rewards confirm button
    if (!win || s.isQuickPlay) {
      const npcId = s.npcId;
      setTimeout(() => {
        EventBus.emit('cardgame:result', { win, npcId });
        EventBus.emit('screen:pop');
      }, 2500);
    }
  },

  _emit() { EventBus.emit('cardgame:stateChanged', { state: this.state }); },
};

export default CardSystem;
