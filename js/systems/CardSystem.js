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
import { CHAMPION_CARDS, ELITE_CARD_DECK, SUMMON_CARD_DECK, SPELL_CARD_DECK, STORY_STARTER_DECKS } from '../Data.js';
import CardArtPreloader from './CardArtPreloader.js';
import GameState from '../GameState.js';

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
  const ep = (elite.power ?? 0) + (elite.tempPowerBonus ?? 0) + (elite.killBonus ?? 0) + (elite.terrainPowerBonus ?? 0);
  return Math.max(0, ep) + (elite.summons ?? []).reduce((s, c) => s + (c.power ?? 0) + (c.terrainPowerBonus ?? 0), 0);
}

// Banish a card — removed from all zones permanently
function banish(s, card) {
  s.banishedCards.push(card);
}

// Display names for terrain types
const TERRAIN_NAMES = {
  camp:       'Camp',
  lava_floor: 'Lava Floor',
  the_void:   'The Void',
};

// Apply active terrain passive effects each draw phase
function applyTerrainEffects(s) {
  // Reset terrain power bonuses from last turn
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const el = s.grid[r]?.[c];
      if (!el) continue;
      delete el.terrainPowerBonus;
      for (const sm of (el.summons ?? [])) delete sm.terrainPowerBonus;
    }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cellTerrain = s.terrainGrid[r][c];
      if (!cellTerrain) continue;
      const el = s.grid[r]?.[c];

      // Camp: restore +1 HP to all stacked summons on this elite
      if (cellTerrain === 'camp' && el?.type === 'elite') {
        for (const sm of (el.summons ?? [])) {
          if (sm.maxHp !== undefined) {
            const prev = sm.hp;
            sm.hp = Math.min(sm.maxHp, sm.hp + 1);
            if (sm.hp > prev) {
              log(s, `⛺ Camp: ${sm.name} restored 1 HP (${sm.hp}/${sm.maxHp}).`);
              EventBus.emit('cardgame:campHeal', { row: r, col: c, name: sm.name, hp: sm.hp, maxHp: sm.maxHp });
            }
          }
        }
      }

      // Lava Floor: +1 power to fire-type elite and its fire-type stacked summons
      if (cellTerrain === 'lava_floor' && el?.type === 'elite') {
        if (el.terrain === 'fire') {
          el.terrainPowerBonus = (el.terrainPowerBonus ?? 0) + 1;
          log(s, `🌋 Lava Floor: ${el.name} gains +1 power.`);
        }
        for (const sm of (el.summons ?? [])) {
          if (sm.terrain === 'fire') {
            sm.terrainPowerBonus = (sm.terrainPowerBonus ?? 0) + 1;
          }
        }
      }

      // The Void: destroy any elite (and all its summons) on this terrain, then banish The Void
      if (cellTerrain === 'the_void' && el?.type === 'elite') {
        log(s, `⬛ The Void consumes ${el.name}!`);
        for (const sm of (el.summons ?? [])) {
          banish(s, sm);
          log(s, `${sm.name} is banished into The Void.`);
        }
        banish(s, el);
        log(s, `${el.name} is banished into The Void.`);
        if (el.owner === 'player') s.playerNeedsElite = true;
        else s.opponentNeedsElite = true;
        s.grid[r][c] = null;
        s.terrainGrid[r][c] = null;  // The Void banishes itself after destroying a card
        log(s, '⬛ The Void has been banished.');
      }
    }
  }
}
// Apply terrain effects to a single cell the moment a card lands on it
function applyTerrainToCell(s, row, col) {
  const cellTerrain = s.terrainGrid[row][col];
  if (!cellTerrain) return;
  const el = s.grid[row][col];
  if (!el || el.type !== 'elite') return;

  if (cellTerrain === 'camp') {
    for (const sm of (el.summons ?? [])) {
      if (sm.maxHp !== undefined) {
        const prev = sm.hp;
        sm.hp = Math.min(sm.maxHp, sm.hp + 1);
        if (sm.hp > prev) log(s, `⛺ Camp: ${sm.name} restored 1 HP (${sm.hp}/${sm.maxHp}).`);
      }
    }
  }

  if (cellTerrain === 'lava_floor') {
    if (el.terrain === 'fire') {
      el.terrainPowerBonus = 1;
      log(s, `🌋 Lava Floor: ${el.name} gains +1 power.`);
    }
    for (const sm of (el.summons ?? [])) {
      if (sm.terrain === 'fire') sm.terrainPowerBonus = 1;
    }
  }

  if (cellTerrain === 'the_void') {
    log(s, `⬛ The Void consumes ${el.name}!`);
    EventBus.emit('cardgame:cardDestroyed', { row, col, art: el.art ?? '💀' });
    for (const sm of (el.summons ?? [])) { banish(s, sm); }
    banish(s, el);
    if (el.owner === 'player') s.playerNeedsElite = true;
    else s.opponentNeedsElite = true;
    s.grid[row][col] = null;
    s.terrainGrid[row][col] = null;
    log(s, '⬛ The Void has been banished.');
  }
}

// Strip stale terrain power bonuses from an elite before it changes cells
function clearTerrainBonus(elite) {
  delete elite.terrainPowerBonus;
  for (const sm of (elite.summons ?? [])) delete sm.terrainPowerBonus;
}

function allElitesActed(s) {
  const elites = findEliteOnGrid(s, 'player');
  return elites.length > 0 && elites.every(({ elite }) => s.strategy.actedIids.has(elite.iid));
}

// Apply start-of-turn passive abilities for all elites of an owner
function applyElitePassives(s, owner) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const el = s.grid[r]?.[c];
      if (!el || el.type !== 'elite' || el.owner !== owner) continue;
      // heal_per_turn: recover 2 HP
      if (el.ability?.type === 'heal_per_turn') {
        const prev = el.hp;
        el.hp = Math.min(el.maxHp, el.hp + (el.ability.amount ?? 2));
        if (el.hp > prev) log(s, `${el.name} regenerates ${el.hp - prev} HP. (${el.hp}/${el.maxHp})`);
      }
      // heal_parent for each stacked summon with heal_parent ability
      for (const sm of (el.summons ?? [])) {
        if (sm.ability?.type === 'heal_parent') {
          const prev = el.hp;
          el.hp = Math.min(el.maxHp, el.hp + 1);
          if (el.hp > prev) log(s, `${sm.name} channels energy: ${el.name} heals 1 HP.`);
        }
      }
    }
  }
}

function log(s, msg) {
  s.log.push(msg);
  if (s.log.length > 30) s.log.shift();
}

// ── State factory ──────────────────────────────────────────────────────────────
function makeState(npcId, deckOverride, isQuickPlay = false) {
  const customDeck = (GameState.deck.customDecks ?? []).find(d => d.id === GameState.deck.activeDeckId);
  const activeDeck = deckOverride
    ?? STORY_STARTER_DECKS.find(d => d.id === GameState.deck.activeDeckId)
    ?? customDeck
    ?? null;
  const elites  = activeDeck?.elites  ?? ELITE_CARD_DECK;
  const summons = activeDeck?.summons ?? SUMMON_CARD_DECK;
  const spells  = activeDeck?.spells  ?? SPELL_CARD_DECK;
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

    terrainGrid:         Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
    terrainDurationGrid: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),  // null = permanent, n = turns left
    banishedCards: [],
    frozenEliteIids: new Set(),  // elite iids that cannot be conjured this turn (returned from field)

    diceResult:      null,
    diceRolled:      false,
    matchingHand:    [],
    pendingSpell:    null,
    pendingTeleport: null,
    opponentGoal:    'offensive',

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
    EventBus.on('cardgame:start',           (d) => this._startGame(d.npcId, d.deck, d.isQuickPlay ?? false).catch(e => console.warn('[CardArtPreloader] preload failed, continuing:', e)));
    EventBus.on('cardgame:placeChampion',   (d) => this._placeChampion(d.col, d.handIdx));
    EventBus.on('cardgame:placeElite',      (d) => this._placeElite(d.handIdx, d.col));
    EventBus.on('cardgame:rollDice',        ()  => this._rollDice());
    EventBus.on('cardgame:stackOnChampion', (d) => this._stackOnChampion(d.handIdx, d.col));
    EventBus.on('cardgame:playFromChampion',(d) => this._playFromChampion(d.champCol, d.summonIdx, d.eliteRow, d.eliteCol));
    EventBus.on('cardgame:playToElite',     (d) => this._playToElite(d.handIdx, d.row, d.col));
    EventBus.on('cardgame:playSpell',       (d) => this._playSpell(d.handIdx));
    EventBus.on('cardgame:spellTarget',     (d) => this._spellTarget(d.row, d.col));
    EventBus.on('cardgame:cancelSpell',     ()  => this._cancelSpell());
    EventBus.on('cardgame:teleportTarget',  (d) => this._teleportTarget(d.col));
    EventBus.on('cardgame:selectElite',     (d) => this._selectElite(d.row, d.col));
    EventBus.on('cardgame:rally',           (d) => this._rally(d.direction));
    EventBus.on('cardgame:retreat',         ()  => this._retreat());
    EventBus.on('cardgame:enableAttack',    ()  => this._enableAttack());
    EventBus.on('cardgame:attackTarget',    (d) => this._attackTarget(d.row, d.col));
    EventBus.on('cardgame:nextPhase',       ()  => this._nextPhase());
    EventBus.on('cardgame:surrender',       ()  => this._endGame(false));
  },

  // ── Initialize ──────────────────────────────────────────────────────────────

  async _startGame(npcId, deckOverride, isQuickPlay = false) {
    _uid = 0;
    this.state = makeState(npcId, deckOverride, isQuickPlay);
    const s = this.state;

    // Opponent setup — random champion placement, elites in front, 6-card hand
    shuffle([0, 1, 2, 3, 4]).slice(0, 3).forEach((col, i) => {
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
    await CardArtPreloader.preloadMatchThumbs(s);
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
      if (el) { el.owner = 'player'; s.playerHand.unshift(el); }
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
    if (s.frozenEliteIids?.has(card.iid)) {
      log(s, `${card.name} just returned from the field — cannot be conjured until next turn.`);
      this._emit(); return;
    }

    const el = s.playerHand.splice(handIdx, 1)[0];
    el.row = P_ELITE_ROW; el.col = col;
    s.grid[P_ELITE_ROW][col] = el;
    log(s, `${el.name} placed in column ${col + 1}.`);
    applyTerrainToCell(s, P_ELITE_ROW, col);

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

    const hasSpells      = s.playerHand.some(c => c.type === 'spell');
    const hasChampStacks = s.playerChampions.some(ch => (ch.summons?.length ?? 0) > 0);
    if (total !== 7 && s.matchingHand.length === 0 && !hasSpells && !hasChampStacks) {
      const ts = this.state;
      setTimeout(() => { if (this.state === ts) this._nextPhase(); }, 1200);
    }
  },

  _playToElite(handIdx, row, col) {
    const s = this.state;
    if (s.phase !== 'conjure') return;
    if (!s.diceResult) { log(s, 'Roll the dice first!'); this._emit(); return; }
    const card = s.playerHand[handIdx];
    const hasTeleport = card?.ability?.type === 'teleport_to_elite';
    if (!s.matchingHand.includes(handIdx) && !hasTeleport) { log(s, 'Card does not match the dice roll.'); this._emit(); return; }
    if (hasTeleport && !s.matchingHand.includes(handIdx)) log(s, `${card.name} teleports to elite!`);

    const elite = gridElite(s, row, col);
    if (!elite || elite.owner !== 'player') { log(s, 'Target must be a player elite.'); this._emit(); return; }

    const [removed] = s.playerHand.splice(handIdx, 1);
    elite.summons.push(removed);
    s.matchingHand = s.matchingHand.filter(i => i !== handIdx).map(i => i > handIdx ? i - 1 : i);
    log(s, `${removed.name} stacked under ${elite.name}.`);
    this._emit();
    EventBus.emit('cardgame:summonAssigned', { row, col, art: removed.art ?? '✨', power: removed.power ?? 0 });
  },

  _stackOnChampion(handIdx, col) {
    const s = this.state;
    if (s.phase !== 'conjure' || !s.diceResult) return;
    const card = s.playerHand[handIdx];
    const hasTeleport = card?.ability?.type === 'teleport_to_elite';
    if (!s.matchingHand.includes(handIdx) && !hasTeleport) { log(s, 'Card does not match dice roll.'); this._emit(); return; }
    const champ = s.playerChampions.find(c => c.col === col);
    if (!champ) return;
    if (!champ.summons) champ.summons = [];
    const [removed] = s.playerHand.splice(handIdx, 1);
    champ.summons.push(removed);
    s.matchingHand = s.matchingHand.filter(i => i !== handIdx).map(i => i > handIdx ? i - 1 : i);
    log(s, `${removed.name} stacked on ${champ.name}. Click champion to assign to an elite.`);
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
    } else if (needsTarget === 'any_terrain_cell') {
      if (row === PLAYER_ROW || row === OPP_ROW) { log(s, 'Cannot place terrain on a Headquarters row.'); this._emit(); return; }
    } else if (needsTarget === 'teleport_champion') {
      if (row !== PLAYER_ROW) { log(s, 'Invalid target — click a player champion.'); this._emit(); return; }
      const champ = s.playerChampions.find(c => c.col === col);
      if (!champ) { log(s, 'No champion there.'); this._emit(); return; }
      const takenCols = new Set(s.playerChampions.map(c => c.col));
      const hasDest = [...Array(COLS).keys()].some(c => !takenCols.has(c));
      if (!hasDest) { log(s, 'No open champion slots to teleport to.'); this._emit(); return; }
      // Enter second-step targeting: select destination
      s.playerHand.splice(handIdx, 1);
      s.matchingHand = s.matchingHand.filter(i => i !== handIdx).map(i => i > handIdx ? i - 1 : i);
      s.pendingSpell = null;
      s.pendingTeleport = { sourceCol: col };
      log(s, `Teleportation: ${champ.name} ready — choose a destination in the champion row.`);
      this._emit();
      return;
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
    if (s.pendingTeleport) {
      log(s, 'Teleportation cancelled.');
      s.pendingTeleport = null;
      this._emit();
      return;
    }
    if (!s.pendingSpell) return;
    log(s, `Cancelled ${s.pendingSpell.card.name}.`);
    s.pendingSpell = null;
    this._emit();
  },

  _teleportTarget(col) {
    const s = this.state;
    if (!s.pendingTeleport) return;
    const { sourceCol } = s.pendingTeleport;
    if (col === sourceCol) { log(s, 'Same column — pick a different destination.'); this._emit(); return; }
    if (s.playerChampions.find(c => c.col === col)) { log(s, 'A champion already occupies that column.'); this._emit(); return; }
    const champ = s.playerChampions.find(c => c.col === sourceCol);
    if (!champ) { s.pendingTeleport = null; this._emit(); return; }
    champ.col = col;
    s.pendingTeleport = null;
    log(s, `${champ.name} teleported to column ${col + 1}!`);
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
        // Insert next to summon cards (right before first summon, after spells/elites)
        const insertAt = s.playerHand.findIndex(c => c.type === 'summon');
        if (insertAt === -1) s.playerHand.push(rev);
        else s.playerHand.splice(insertAt, 0, rev);
        // Elite returned from crypt cannot be conjured this turn
        if (rev.type === 'elite') {
          s.frozenEliteIids.add(rev.iid);
          log(s, `${rev.name} revived! (Cannot be conjured until next turn.)`);
        } else {
          log(s, `${rev.name} revived!`);
        }
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
        clearTerrainBonus(e);
        s.grid[e.row][e.col] = null;
        e.row = P_ELITE_ROW; e.col = tCol;
        s.grid[P_ELITE_ROW][tCol] = e;
        log(s, `${e.name} teleported to col ${tCol + 1}!`);
        applyTerrainToCell(s, P_ELITE_ROW, tCol);
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
      case 'teleport_champion': break;  // handled via two-step targeting in _spellTarget/_teleportTarget
      case 'set_terrain': {
        if (row === null || col === null) { log(s, 'No target selected.'); break; }
        if (row === PLAYER_ROW || row === OPP_ROW) { log(s, 'Cannot place terrain on a Headquarters row.'); break; }
        const terrainType = effect.terrain;
        s.terrainGrid[row][col] = terrainType;
        s.terrainDurationGrid[row][col] = effect.duration ?? null;
        log(s, `${TERRAIN_NAMES[terrainType] ?? terrainType} placed at column ${col + 1}!`);
        // Apply terrain effect immediately — a card may already occupy this cell
        applyTerrainToCell(s, row, col);
        break;
      }
      case 'random_terrain': {
        // Collect all non-HQ cells (rows 1–4) that have no terrain already
        const eligible = [];
        for (let r = 1; r < ROWS - 1; r++)
          for (let c = 0; c < COLS; c++)
            if (!s.terrainGrid[r][c]) eligible.push([r, c]);
        // Shuffle and pick up to `count` cells
        for (let i = eligible.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
        }
        const picks = eligible.slice(0, effect.count ?? 3);
        if (!picks.length) { log(s, 'No open cells for terrain!'); break; }
        const dur = effect.duration ?? null;
        for (const [r, c] of picks) {
          s.terrainGrid[r][c] = effect.terrain;
          s.terrainDurationGrid[r][c] = dur;
          log(s, `🌋 Lava Floor erupts at column ${c + 1}!${dur ? ` (${dur} turns)` : ''}`);
          applyTerrainToCell(s, r, c);
        }
        break;
      }
      case 'banish_elite': {
        const e = gridElite(s, row, col);
        if (!e) { log(s, 'No elite at target.'); break; }
        log(s, `${e.name} is banished!`);
        for (const sm of (e.summons ?? [])) banish(s, sm);
        banish(s, e);
        if (e.owner === 'player') s.playerNeedsElite = true;
        else s.opponentNeedsElite = true;
        s.grid[row][col] = null;
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

    // extended_rally: move up to 2 cells when HP ≤ 50%
    const hasExtended = elite.ability?.type === 'extended_rally' && elite.hp / elite.maxHp <= 0.5;
    const maxSteps    = hasExtended ? 2 : 1;

    let actualSteps = 0;
    for (let step = 1; step <= maxSteps; step++) {
      const tr = row + dr * step, tc = col + dc * step;
      if (tr < 0 || tr >= ROWS || tc < 0 || tc >= COLS) break;
      if (tr === PLAYER_ROW || tr === OPP_ROW) break;
      if (s.grid[tr][tc] !== null) break;
      actualSteps = step;
    }
    if (actualSteps === 0) { log(s, 'Cell is occupied.'); this._emit(); return; }

    const nr = row + dr * actualSteps, nc = col + dc * actualSteps;
    clearTerrainBonus(elite);
    s.grid[row][col] = null;
    elite.row = nr; elite.col = nc;
    s.grid[nr][nc] = elite;
    s.strategy.ralliedIids.add(elite.iid);
    s.strategy.selectedRow = nr;
    s.strategy.selectedCol = nc;
    log(s, `${elite.name} rallied ${direction}${actualSteps > 1 ? ' (2 cells!)' : ''}.`);
    applyTerrainToCell(s, nr, nc);
    if (!s.grid[nr][nc]) {
      // Elite was destroyed by terrain (e.g. The Void)
      s.strategy.selectedRow = null;
      s.strategy.selectedCol = null;
      if (this._checkWin()) return;
    }
    this._emit();
  },

  _retreat() {
    const s = this.state;
    if (s.phase !== 'strategy') return;
    const { selectedRow: row, selectedCol: col } = s.strategy;
    if (row === null) { log(s, 'Select an elite first.'); this._emit(); return; }

    const elite = gridElite(s, row, col);
    if (!elite) return;
    if (s.strategy.actedIids.has(elite.iid))   { log(s, 'This elite has already acted.'); this._emit(); return; }
    if (s.strategy.ralliedIids.has(elite.iid)) { log(s, 'Cannot retreat after rallying.'); this._emit(); return; }
    if (row > 2) { log(s, 'Retreat only available in opponent territory (rows 1-2).'); this._emit(); return; }

    const nr = Math.min(row + 2, PLAYER_ROW - 1);
    if (s.grid[nr][col] !== null) { log(s, 'Retreat path blocked.'); this._emit(); return; }

    clearTerrainBonus(elite);
    s.grid[row][col] = null;
    elite.row = nr; elite.col = col;
    s.grid[nr][col] = elite;
    s.strategy.actedIids.add(elite.iid);
    s.strategy.selectedRow = null;
    s.strategy.selectedCol = null;
    log(s, `${elite.name} retreated.`);
    applyTerrainToCell(s, nr, col);
    if (!s.grid[nr][col] && this._checkWin()) return;

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
      EventBus.emit('cardgame:attackPerformed', { attackerRow: aRow, attackerCol: aCol, targetRow: row, targetCol: col, art: attacker.art ?? '⚔️', artFile: attacker.artFile ?? null });
      let dmg = atkPow;
      while (dmg > 0 && target.summons.length > 0) {
        const sm = target.summons[target.summons.length - 1];
        if (dmg >= sm.hp) {
          dmg -= sm.hp;
          target.summons.pop();
          if (sm.ability?.type === 'return_from_crypt') {
            s.opponentHand.push(sm);
            log(s, `${sm.name} rises from destruction — returned to opponent hand!`);
          } else {
            EventBus.emit('cardgame:cardDestroyed', { row, col, art: sm.art ?? '💀' });
            s.opponentCrypt.push(sm);
          }
          if (sm.ability?.type === 'void_on_death') {
            const eligible = [];
            for (let r = 1; r < ROWS - 1; r++)
              for (let c = 0; c < COLS; c++)
                if (!s.terrainGrid[r][c]) eligible.push([r, c]);
            if (eligible.length) {
              const [r, c] = eligible[Math.floor(Math.random() * eligible.length)];
              s.terrainGrid[r][c] = 'the_void';
              s.terrainDurationGrid[r][c] = null;
              log(s, `${sm.name}'s dying curse tears open The Void!`);
            }
          }
          log(s, `${sm.name} destroyed!`);
          if (attacker.ability?.type === 'kill_bonus') {
            attacker.killBonus = (attacker.killBonus ?? 0) + 1;
            log(s, `${attacker.name} kill bonus: now +${attacker.killBonus} attack!`);
          }
        } else { sm.hp -= dmg; dmg = 0; }
      }
      if (dmg > 0) {
        target.hp -= dmg;
        log(s, `${target.name} takes ${dmg}! (${Math.max(0, target.hp)}/${target.maxHp} HP)`);
        if (target.hp <= 0) {
          log(s, `${target.name} destroyed!`); EventBus.emit('cardgame:cardDestroyed', { row, col, art: target.art ?? '💀' }); s.opponentCrypt.push(target); s.grid[row][col] = null;
          if (attacker.ability?.type === 'kill_bonus') {
            attacker.killBonus = (attacker.killBonus ?? 0) + 1;
            log(s, `${attacker.name} kill bonus: now +${attacker.killBonus} attack!`);
          }
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
      EventBus.emit('cardgame:attackPerformed', { attackerRow: aRow, attackerCol: aCol, targetRow: row, targetCol: col, art: attacker.art ?? '⚔️', artFile: attacker.artFile ?? null });
      champ.hp -= atkPow;
      log(s, `${attacker.name} attacks ${champ.name} for ${atkPow}! (${Math.max(0,champ.hp)}/${champ.maxHp} HP)`);
      if (champ.hp <= 0) {
        log(s, `${champ.name} destroyed!`);
        EventBus.emit('cardgame:cardDestroyed', { row: OPP_ROW, col, art: champ.art ?? '💀' });
        s.opponentChampions = s.opponentChampions.filter(c => c !== champ);
        const ef = gridElite(s, O_ELITE_ROW, col);
        if (ef?.owner === 'opponent') { EventBus.emit('cardgame:cardDestroyed', { row: O_ELITE_ROW, col, art: ef.art ?? '💀' }); s.opponentCrypt.push(ef); s.grid[O_ELITE_ROW][col] = null; }
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
        applyTerrainToCell(s, O_ELITE_ROW, ch.col);
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
      s.matchingHand = []; s.pendingSpell = null; s.pendingTeleport = null;
      log(s, 'Conjure Phase — roll the dice!');
      this._emit();
    } else if (s.phase === 'conjure') {
      s.pendingSpell = null; s.pendingTeleport = null;
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
    // Clear frozen elite restriction from previous turn
    s.frozenEliteIids = new Set();

    // Clear temp bonuses at start of each player turn
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (s.grid[r]?.[c]) delete s.grid[r][c].tempPowerBonus;

    // Apply start-of-turn passive abilities for player elites
    applyElitePassives(s, 'player');

    // Apply terrain passive effects then decrement timed terrain durations
    applyTerrainEffects(s);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const dur = s.terrainDurationGrid[r][c];
        if (dur === null || dur === undefined) continue;
        if (dur <= 1) {
          const name = TERRAIN_NAMES[s.terrainGrid[r][c]] ?? 'Terrain';
          s.terrainGrid[r][c] = null;
          s.terrainDurationGrid[r][c] = null;
          log(s, `${name} at column ${c + 1} fades away.`);
        } else {
          s.terrainDurationGrid[r][c] = dur - 1;
        }
      }

    // Restore full HP on all summon cards currently in hand
    for (const c of s.playerHand) {
      if (c.type === 'summon' && c.maxHp !== undefined) c.hp = c.maxHp;
    }

    // Draw replacement elite first if one is pending
    if (s.playerNeedsElite && s.playerEliteDeck.length) {
      s.playerNeedsElite = false;
      const el = s.playerEliteDeck.shift();
      el.owner = 'player';
      s.playerHand.unshift(el);
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
    s.pendingSpell = null; s.pendingTeleport = null;
    log(s, 'Regroup Phase — assign summons or cast spells.');
    this._emit();
  },

  _endRegroupPhase() {
    const s = this.state;
    s.pendingSpell = null; s.pendingTeleport = null;
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

    this._resolveOpponentElite();

    // Apply start-of-turn passive abilities for opponent elites
    applyElitePassives(s, 'opponent');

    // Apply terrain passive effects
    applyTerrainEffects(s);

    const card = s.opponentSummonDeck.shift();
    if (card) s.opponentHand.push(card);

    // Re-evaluate strategy
    const newGoal = this._evalOppGoal(s);
    if (newGoal !== s.opponentGoal) {
      log(s, `Opponent shifts to ${newGoal} strategy!`);
      s.opponentGoal = newGoal;
    }

    const d1 = rollD6(), d2 = rollD6(), total = d1 + d2;
    log(s, `Opponent rolls: ${d1}+${d2}=${total}`);
    if (total !== 7) {
      s.opponentHand.filter(c => c.type === 'summon' && (c.summonCost === total || c.ability?.type === 'teleport_to_elite')).forEach(card => {
        const elites = findEliteOnGrid(s, 'opponent');
        if (!elites.length) return;
        const t = this._oppPickSummonTarget(s, elites, s.opponentGoal);
        t.elite.summons.push(card);
        s.opponentHand = s.opponentHand.filter(c => c !== card);
        log(s, `Opponent summons ${card.name}.`);
      });
    } else {
      const spell = s.opponentSpellDeck.shift();
      if (spell) log(s, `Opponent drew spell: ${spell.name}.`);
    }

    if (this._oppActElites(s)) return;  // checkWin returned true

    s.turnNumber++; s.phase = 'draw';
    log(s, `── Your Turn (round ${s.turnNumber}) ──`);
    this._drawPhase();
  },

  // Evaluate opponent goal each turn
  _evalOppGoal(s) {
    if (!s.opponentChampions.length) return 'offensive';
    const plrInOppTerritory = findEliteOnGrid(s, 'player').filter(e => e.row <= 2).length;
    if (s.turnNumber <= 2 || plrInOppTerritory >= 2) return 'absoluteDefense';
    const anyOppChampLow = s.opponentChampions.some(c => c.hp / c.maxHp < 0.45);
    if (anyOppChampLow || plrInOppTerritory >= 1) return 'defensive';
    const plrVulnerable = s.playerChampions.some(c => c.hp / c.maxHp < 0.45);
    const totalPlrHp  = s.playerChampions.reduce((sum, c) => sum + Math.max(0, c.hp), 0);
    const totalOppPow = findEliteOnGrid(s, 'opponent').reduce((sum, {elite}) => sum + totalPower(elite), 0);
    if (plrVulnerable || (totalPlrHp > 0 && totalOppPow >= totalPlrHp * 0.6)) return 'offensive';
    return 'balanced';
  },

  // Choose which elite to stack summons on based on goal
  _oppPickSummonTarget(s, elites, goal) {
    if (goal === 'absoluteDefense' || goal === 'defensive') {
      const oppCols = new Set(s.opponentChampions.map(c => c.col));
      const defenders = elites.filter(e => oppCols.has(e.col));
      const pool = defenders.length ? defenders : elites;
      return pool.reduce((a, b) => a.elite.summons.length <= b.elite.summons.length ? a : b);
    }
    if (goal === 'offensive') {
      return elites.reduce((a, b) => b.row > a.row ? b : a);
    }
    // balanced: most advanced with fewest summons
    return elites.reduce((a, b) => {
      if (b.row !== a.row) return b.row > a.row ? b : a;
      return a.elite.summons.length <= b.elite.summons.length ? a : b;
    });
  },

  // Main movement/attack loop — returns true if game ended
  _oppActElites(s) {
    const globalGoal = s.opponentGoal ?? 'balanced';
    const snapshot = findEliteOnGrid(s, 'opponent').sort((a, b) => b.row - a.row);

    for (const { elite } of snapshot) {
      const r = elite.row, c = elite.col;

      // Attack player champion directly — always highest priority
      if (r === P_ELITE_ROW) {
        const pChamp = s.playerChampions.find(ch => ch.col === c);
        if (pChamp) {
          const atkPow = totalPower(elite);
          EventBus.emit('cardgame:attackPerformed', { attackerRow: r, attackerCol: c, targetRow: PLAYER_ROW, targetCol: c, art: elite.art ?? '⚔️', artFile: elite.artFile ?? null });
          pChamp.hp -= atkPow;
          log(s, `${elite.name} attacks your ${pChamp.name} for ${atkPow}! (${Math.max(0, pChamp.hp)}/${pChamp.maxHp} HP)`);
          if (pChamp.hp <= 0) { log(s, `${pChamp.name} defeated!`); s.playerChampions = s.playerChampions.filter(ch => ch !== pChamp); }
          if (this._checkWin()) return true;
          continue;
        }
      }

      const eliteGoal = this._pickEliteStrategy(s, elite, r, c, globalGoal);

      // ── FullOffensive ──────────────────────────────────────────────────────────
      if (eliteGoal === 'fullOffensive') {
        const target = this._oppFindAttackTarget(s, r, c, 'offensive');
        if (target && this._canOneShot(elite, target.elite)) {
          const destroyed = this._oppDoEliteAttack(s, elite, r, c, target.row, target.col);
          if (this._checkWin()) return true;
          if (destroyed) this._spawnPlayerElite(target.col);
        } else {
          this._oppMoveOffensive(s, elite, r, c);
          if (this._checkWin()) return true;
        }
        continue;
      }

      // ── Coward ─────────────────────────────────────────────────────────────────
      if (eliteGoal === 'coward') {
        const target = this._oppFindAttackTarget(s, r, c, 'defensive');
        if (target) {
          const destroyed = this._oppDoEliteAttack(s, elite, r, c, target.row, target.col);
          if (this._checkWin()) return true;
          if (destroyed) this._spawnPlayerElite(target.col);
        } else {
          this._oppMoveCoward(s, elite, r, c);
          if (this._checkWin()) return true;
        }
        continue;
      }

      // ── TerrainAdvantage ───────────────────────────────────────────────────────
      if (eliteGoal === 'terrainAdvantage') {
        const target = this._oppFindAttackTarget(s, r, c, 'offensive');
        if (target) {
          const destroyed = this._oppDoEliteAttack(s, elite, r, c, target.row, target.col);
          if (this._checkWin()) return true;
          if (destroyed) this._spawnPlayerElite(target.col);
        } else {
          const terrainDest = this._findBeneficialTerrain(s, elite, r, c);
          if (terrainDest) this._oppMoveTowardCell(s, elite, r, c, terrainDest.row, terrainDest.col);
          if (this._checkWin()) return true;
        }
        continue;
      }

      // ── Initiative ─────────────────────────────────────────────────────────────
      if (eliteGoal === 'initiative') {
        const initTarget = this._findInitiativeTarget(s, r, c);
        if (initTarget) {
          this._oppMoveTowardCell(s, elite, r, c, initTarget.row, initTarget.col);
          if (this._checkWin()) return true;
          continue;
        }
      }

      // ── Global goal attack + move ──────────────────────────────────────────────
      const target = this._oppFindAttackTarget(s, r, c, globalGoal);
      if (target) {
        // Balanced: only attack if can one-shot (don't engage otherwise)
        if (globalGoal === 'balanced' && elite.summons.length === 0 && !this._canOneShot(elite, target.elite)) {
          // hold — fall through to move
        } else {
          const destroyed = this._oppDoEliteAttack(s, elite, r, c, target.row, target.col);
          if (this._checkWin()) return true;
          if (destroyed) this._spawnPlayerElite(target.col);
          continue;
        }
      }

      if      (globalGoal === 'offensive')       this._oppMoveOffensive(s, elite, r, c);
      else if (globalGoal === 'absoluteDefense') this._oppMoveAbsoluteDefense(s, elite, r, c);
      else if (globalGoal === 'defensive')       this._oppMoveDefensive(s, elite, r, c);
      else                                        this._oppMoveBalanced(s, elite, r, c);
      if (this._checkWin()) return true;
    }
    return false;
  },

  // Find the best adjacent player elite to attack
  _oppFindAttackTarget(s, row, col, goal) {
    const candidates = [];
    // Below (advancing direction — primary)
    const bRow = row + 1;
    if (bRow < ROWS) {
      const below = gridElite(s, bRow, col);
      if (below?.owner === 'player') candidates.push({ row: bRow, col, elite: below });
    }
    // Horizontal (left/right, same row)
    for (const dc of [-1, 1]) {
      const nc = col + dc;
      if (nc < 0 || nc >= COLS) continue;
      const side = gridElite(s, row, nc);
      if (side?.owner === 'player') candidates.push({ row, col: nc, elite: side });
    }
    if (!candidates.length) return null;
    if (goal === 'offensive') {
      // Attack weakest target (lowest effective HP pool)
      return candidates.reduce((a, b) => {
        const hpA = a.elite.hp + a.elite.summons.reduce((x, y) => x + y.hp, 0);
        const hpB = b.elite.hp + b.elite.summons.reduce((x, y) => x + y.hp, 0);
        return hpB < hpA ? b : a;
      });
    }
    // Defensive: prioritise the most advanced threat (lowest row number)
    return candidates.reduce((a, b) => a.row < b.row ? a : b);
  },

  // Execute an attack on a player elite; returns true if destroyed
  _oppDoEliteAttack(s, attacker, aRow, aCol, tRow, tCol) {
    const target = gridElite(s, tRow, tCol);
    if (!target || target.owner !== 'player') return false;
    const atkPow = totalPower(attacker);
    EventBus.emit('cardgame:attackPerformed', { attackerRow: aRow, attackerCol: aCol, targetRow: tRow, targetCol: tCol, art: attacker.art ?? '⚔️', artFile: attacker.artFile ?? null });
    let dmg = atkPow;
    while (dmg > 0 && target.summons.length > 0) {
      const sm = target.summons[target.summons.length - 1];
      if (dmg >= sm.hp) {
        dmg -= sm.hp;
        target.summons.pop();
        if (sm.ability?.type === 'return_from_crypt') {
          s.playerHand.push(sm);
          log(s, `${sm.name} rises from destruction — returned to your hand!`);
        } else {
          EventBus.emit('cardgame:cardDestroyed', { row: tRow, col: tCol, art: sm.art ?? '💀' });
          s.playerCrypt.push(sm);
        }
        if (sm.ability?.type === 'void_on_death') {
          const eligible = [];
          for (let r = 1; r < ROWS - 1; r++)
            for (let c = 0; c < COLS; c++)
              if (!s.terrainGrid[r][c]) eligible.push([r, c]);
          if (eligible.length) {
            const [r, c] = eligible[Math.floor(Math.random() * eligible.length)];
            s.terrainGrid[r][c] = 'the_void';
            s.terrainDurationGrid[r][c] = null;
            log(s, `${sm.name}'s dying curse tears open The Void!`);
          }
        }
        log(s, `Your ${sm.name} destroyed!`);
        if (attacker.ability?.type === 'kill_bonus') {
          attacker.killBonus = (attacker.killBonus ?? 0) + 1;
          log(s, `${attacker.name} kill bonus: now +${attacker.killBonus} attack!`);
        }
      } else { sm.hp -= dmg; dmg = 0; }
    }
    if (dmg > 0) {
      target.hp -= dmg;
      log(s, `${attacker.name} attacks your ${target.name} for ${dmg}! (${Math.max(0, target.hp)}/${target.maxHp} HP)`);
      if (target.hp <= 0) {
        log(s, `Your ${target.name} destroyed!`);
        EventBus.emit('cardgame:cardDestroyed', { row: tRow, col: tCol, art: target.art ?? '💀' });
        s.playerCrypt.push(target);
        s.grid[tRow][tCol] = null;
        if (attacker.ability?.type === 'kill_bonus') {
          attacker.killBonus = (attacker.killBonus ?? 0) + 1;
          log(s, `${attacker.name} kill bonus: now +${attacker.killBonus} attack!`);
        }
        return true;
      }
    }
    return false;
  },

  // Offensive movement: advance or flank
  _oppMoveOffensive(s, elite, row, col) {
    const nextRow = row + 1;
    if (nextRow >= PLAYER_ROW) return;

    // Advance if clear
    if (s.grid[nextRow][col] === null) {
      clearTerrainBonus(elite);
      s.grid[row][col] = null;
      elite.row = nextRow; elite.col = col;
      s.grid[nextRow][col] = elite;
      log(s, `${elite.name} advances.`);
      applyTerrainToCell(s, nextRow, col);
      return;
    }

    // Blocked — try lateral toward weakest player champion column
    const targetCol = this._oppTargetChampCol(s);
    const dirs = targetCol !== null && targetCol !== col
      ? (targetCol > col ? [1, -1] : [-1, 1])
      : [1, -1];

    for (const dc of dirs) {
      const nc = col + dc;
      if (nc < 0 || nc >= COLS || s.grid[row][nc] !== null) continue;
      clearTerrainBonus(elite);
      s.grid[row][col] = null;
      elite.row = row; elite.col = nc;
      s.grid[row][nc] = elite;
      log(s, `${elite.name} flanks to column ${nc + 1}.`);
      applyTerrainToCell(s, row, nc);
      return;
    }
  },

  // Defensive movement: hold champion column or reinforce
  _oppMoveDefensive(s, elite, row, col) {
    const nearestCol = this._nearestOppChampCol(s, col);

    if (nearestCol !== null && col !== nearestCol) {
      // Move laterally toward nearest own champion column
      const dc = nearestCol > col ? 1 : -1;
      const nc = col + dc;
      if (nc >= 0 && nc < COLS && s.grid[row][nc] === null) {
        clearTerrainBonus(elite);
        s.grid[row][col] = null;
        elite.row = row; elite.col = nc;
        s.grid[row][nc] = elite;
        log(s, `${elite.name} guards column ${nc + 1}.`);
        applyTerrainToCell(s, row, nc);
        return;
      }
    }

    // Already in champion column or blocked — advance only if very close to base
    if (row <= O_ELITE_ROW + 1) {
      const nextRow = row + 1;
      if (nextRow < PLAYER_ROW && s.grid[nextRow][col] === null) {
        clearTerrainBonus(elite);
        s.grid[row][col] = null;
        elite.row = nextRow; elite.col = col;
        s.grid[nextRow][col] = elite;
        log(s, `${elite.name} holds ground.`);
        applyTerrainToCell(s, nextRow, col);
      }
    }
  },

  // Column of player champion with lowest HP (offensive target priority)
  _oppTargetChampCol(s) {
    if (!s.playerChampions.length) return null;
    return s.playerChampions.reduce((a, b) => b.hp < a.hp ? b : a).col;
  },

  // Column of nearest opponent champion to a given column
  _nearestOppChampCol(s, fromCol) {
    if (!s.opponentChampions.length) return null;
    return s.opponentChampions.reduce((best, ch) =>
      Math.abs(ch.col - fromCol) < Math.abs(best.col - fromCol) ? ch : best
    ).col;
  },

  // Per-elite strategy override on top of global goal
  _pickEliteStrategy(s, elite, row, col, globalGoal) {
    // Coward: strongest elite with dangerously low HP
    if (elite.hp / elite.maxHp < 0.35 && this._isStrongestOppElite(s, elite)) return 'coward';
    // FullOffensive: can one-shot an adjacent player elite
    const adjTarget = this._oppFindAttackTarget(s, row, col, 'offensive');
    if (adjTarget && this._canOneShot(elite, adjTarget.elite)) return 'fullOffensive';
    // TerrainAdvantage: beneficial terrain nearby
    if (this._findBeneficialTerrain(s, elite, row, col)) return 'terrainAdvantage';
    // Initiative: player elite approaching — advance to intercept (not during absoluteDefense)
    if (globalGoal !== 'absoluteDefense' && this._findInitiativeTarget(s, row, col)) return 'initiative';
    return globalGoal;
  },

  // Can attacker destroy target (elite + all stacked summons) in one hit?
  _canOneShot(attacker, target) {
    const totalHp = target.hp + (target.summons ?? []).reduce((sum, sm) => sum + sm.hp, 0);
    return totalPower(attacker) >= totalHp;
  },

  // Is this the opponent's highest-power elite on the grid?
  _isStrongestOppElite(s, elite) {
    const elites = findEliteOnGrid(s, 'opponent');
    if (elites.length <= 1) return true;
    const thisPow = totalPower(elite);
    return elites.every(e => totalPower(e.elite) <= thisPow);
  },

  // Find nearest beneficial terrain within Manhattan distance 2; returns {row,col} or null
  _findBeneficialTerrain(s, elite, row, col) {
    const needsHeal = elite.hp / elite.maxHp < 0.65 ||
      (elite.summons ?? []).some(sm => sm.maxHp !== undefined && sm.hp < sm.maxHp);
    let best = null, bestDist = Infinity;
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const dist = Math.abs(dr) + Math.abs(dc);
        if (dist > 2 || dist === 0) continue;
        const tr = row + dr, tc = col + dc;
        if (tr < 0 || tr >= ROWS || tc < 0 || tc >= COLS) continue;
        const terrain = s.terrainGrid[tr][tc];
        if (!terrain) continue;
        if (terrain === 'camp' && needsHeal && dist < bestDist) { best = { row: tr, col: tc }; bestDist = dist; }
        if (terrain === 'lava_floor' && elite.terrain === 'fire' && dist < bestDist) {
          const hasNearTarget = findEliteOnGrid(s, 'player').some(e => Math.abs(e.row - tr) + Math.abs(e.col - tc) <= 1);
          if (hasNearTarget) { best = { row: tr, col: tc }; bestDist = dist; }
        }
      }
    }
    return best;
  },

  // Find a player elite 2 steps ahead that we could one-shot once adjacent
  _findInitiativeTarget(s, row, col) {
    // Two rows forward with clear path
    if (row + 2 < PLAYER_ROW && s.grid[row + 1]?.[col] === null) {
      const t = gridElite(s, row + 2, col);
      if (t?.owner === 'player' && this._canOneShot(gridElite(s, row, col), t)) return { row: row + 2, col };
    }
    // One forward, one lateral
    if (row + 1 < PLAYER_ROW && s.grid[row + 1]?.[col] === null) {
      for (const dc of [-1, 1]) {
        const nc = col + dc;
        if (nc < 0 || nc >= COLS) continue;
        const t = gridElite(s, row + 1, nc);
        if (t?.owner === 'player' && this._canOneShot(gridElite(s, row, col), t)) return { row: row + 1, col: nc };
      }
    }
    return null;
  },

  // Move elite one step toward a target cell (greedy best-first)
  _oppMoveTowardCell(s, elite, row, col, targetRow, targetCol) {
    const moves = [];
    if (targetRow > row && row + 1 < PLAYER_ROW && s.grid[row + 1][col] === null) moves.push([row + 1, col]);
    if (targetRow < row && row - 1 >= 0          && s.grid[row - 1][col] === null) moves.push([row - 1, col]);
    if (targetCol > col && col + 1 < COLS         && s.grid[row][col + 1] === null) moves.push([row, col + 1]);
    if (targetCol < col && col - 1 >= 0           && s.grid[row][col - 1] === null) moves.push([row, col - 1]);
    if (!moves.length) return;
    const [nr, nc] = moves.reduce((best, m) => {
      return (Math.abs(m[0] - targetRow) + Math.abs(m[1] - targetCol)) <
             (Math.abs(best[0] - targetRow) + Math.abs(best[1] - targetCol)) ? m : best;
    });
    clearTerrainBonus(elite);
    s.grid[row][col] = null;
    elite.row = nr; elite.col = nc;
    s.grid[nr][nc] = elite;
    log(s, `${elite.name} moves toward (${nr + 1},${nc + 1}).`);
    applyTerrainToCell(s, nr, nc);
  },

  // Coward: retreat toward own base, seek camp terrain if available
  _oppMoveCoward(s, elite, row, col) {
    const camp = this._findBeneficialTerrain(s, elite, row, col);
    if (camp) { this._oppMoveTowardCell(s, elite, row, col, camp.row, camp.col); return; }
    // Retreat upward
    if (row - 1 >= O_ELITE_ROW && s.grid[row - 1][col] === null) {
      clearTerrainBonus(elite);
      s.grid[row][col] = null; elite.row = row - 1; elite.col = col; s.grid[row - 1][col] = elite;
      log(s, `${elite.name} retreats!`);
      applyTerrainToCell(s, row - 1, col);
      return;
    }
    // Can't go up — retreat laterally toward own champion column
    const nc = this._nearestOppChampCol(s, col);
    if (nc !== null && nc !== col) {
      const dc = nc > col ? 1 : -1;
      const newC = col + dc;
      if (newC >= 0 && newC < COLS && s.grid[row][newC] === null) {
        clearTerrainBonus(elite);
        s.grid[row][col] = null; elite.row = row; elite.col = newC; s.grid[row][newC] = elite;
        log(s, `${elite.name} retreats laterally!`);
        applyTerrainToCell(s, row, newC);
      }
    }
  },

  // AbsoluteDefense movement: stay near champion column, only advance with 2+ summons
  _oppMoveAbsoluteDefense(s, elite, row, col) {
    const nearestCol = this._nearestOppChampCol(s, col);
    if (nearestCol !== null && col !== nearestCol) {
      const dc = nearestCol > col ? 1 : -1;
      const nc = col + dc;
      if (nc >= 0 && nc < COLS && s.grid[row][nc] === null) {
        clearTerrainBonus(elite);
        s.grid[row][col] = null; elite.row = row; elite.col = nc; s.grid[row][nc] = elite;
        log(s, `${elite.name} defends column ${nc + 1}.`);
        applyTerrainToCell(s, row, nc);
        return;
      }
    }
    // Only advance if 2+ summons stacked
    if ((elite.summons?.length ?? 0) >= 2) {
      const nextRow = row + 1;
      if (nextRow < PLAYER_ROW && s.grid[nextRow][col] === null) {
        clearTerrainBonus(elite);
        s.grid[row][col] = null; elite.row = nextRow; elite.col = col; s.grid[nextRow][col] = elite;
        log(s, `${elite.name} advances with full summons.`);
        applyTerrainToCell(s, nextRow, col);
      }
    }
  },

  // Balanced movement: hold until 1 summon stacked, then advance while avoiding player elites
  _oppMoveBalanced(s, elite, row, col) {
    if ((elite.summons?.length ?? 0) === 0) return; // Hold position — wait for a summon
    const nextRow = row + 1;
    if (nextRow >= PLAYER_ROW) return;
    // Advance if no player elite in next cell
    if (s.grid[nextRow][col] === null && gridElite(s, nextRow, col)?.owner !== 'player') {
      clearTerrainBonus(elite);
      s.grid[row][col] = null; elite.row = nextRow; elite.col = col; s.grid[nextRow][col] = elite;
      log(s, `${elite.name} advances (balanced).`);
      applyTerrainToCell(s, nextRow, col);
      return;
    }
    // Blocked — flank toward weakest player champion column
    const targetCol = this._oppTargetChampCol(s);
    const dirs = targetCol !== null && targetCol !== col ? (targetCol > col ? [1, -1] : [-1, 1]) : [1, -1];
    for (const dc of dirs) {
      const nc = col + dc;
      if (nc < 0 || nc >= COLS || s.grid[row][nc] !== null) continue;
      clearTerrainBonus(elite);
      s.grid[row][col] = null; elite.row = row; elite.col = nc; s.grid[row][nc] = elite;
      log(s, `${elite.name} flanks (balanced).`);
      applyTerrainToCell(s, row, nc);
      return;
    }
  },

  // ── Win condition ──────────────────────────────────────────────────────────

  _checkWin() {
    const s = this.state;
    if (s.opponentChampions.length === 0) { this._endGame(true);  return true; }
    if (s.playerChampions.length   === 0) { this._endGame(false); return true; }

    const hasOppElites = findEliteOnGrid(s, 'opponent').length > 0;
    const hasPlrElites = findEliteOnGrid(s, 'player').length > 0;

    // Headquarters Captured: ALL opponent champions must be blocked by a player elite
    // at O_ELITE_ROW in the same column, AND no opponent elites remain on the grid
    if (!hasOppElites) {
      const playerElitesAtHQ = findEliteOnGrid(s, 'player').filter(e => e.row === O_ELITE_ROW);
      const allChampionsBlocked = s.opponentChampions.length > 0 &&
        s.opponentChampions.every(ch => playerElitesAtHQ.some(e => e.col === ch.col));
      if (allChampionsBlocked) {
        s.gameOver = true; s.winner = 'player'; s.phase = 'gameover';
        log(s, '🏴 Headquarters Captured!');
        EventBus.emit('cardgame:hqCaptured', { npcId: s.npcId, isQuickPlay: s.isQuickPlay ?? false });
        this._emit();
        const thisState = this.state;
        setTimeout(() => { if (this.state === thisState) this._endGame(true); }, 3500);
        return true;
      }
      // No elites and no deck left — standard wipe win
      if (!s.opponentEliteDeck.length) { this._endGame(true); return true; }
    }

    if (!hasPlrElites && !s.playerEliteDeck.length) { this._endGame(false); return true; }
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
