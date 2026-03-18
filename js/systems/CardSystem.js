/**
 * CardSystem — pure card game logic (no rendering).
 * Drives the state machine in GameState.cardGame.
 *
 * Listens:
 *   cardgame:start           { npcId }
 *   cardgame:player:playCard  { cardIdx }
 *   cardgame:player:endTurn   {}
 *   cardgame:surrender        {}
 *
 * Emits:
 *   cardgame:stateChanged  {}
 *   cardgame:floatText     { x, y, text, color }
 *   cardgame:result        { win, npcId }
 *   screen:push            (CardGameScreen)
 *   screen:pop             ()
 */
import EventBus  from '../EventBus.js';
import GameState from '../GameState.js';
import { CARDS, NPCS } from '../Data.js';

function buildCardMap(cards) {
  const m = {};
  cards.forEach(c => { m[c.cardId] = c; });
  return m;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const AI_THINK_DELAY = 900; // ms

const CardSystem = {
  _cardMap: {},
  _aiTimeout: null,
  _CardGameScreen: null,

  setCardGameScreen(screen) {
    this._CardGameScreen = screen;
  },

  init() {
    this._cardMap = buildCardMap(CARDS);

    EventBus.on('cardgame:start',           (d) => this._startGame(d.npcId));
    EventBus.on('cardgame:player:playCard',  (d) => this._playerPlayCard(d.cardIdx));
    EventBus.on('cardgame:player:endTurn',   ()  => this._playerEndTurn());
    EventBus.on('cardgame:surrender',        ()  => this._surrender());
  },

  _startGame(npcId) {
    const npc = NPCS.find(n => n.id === npcId);
    const opponentDeck = shuffle(npc?.deck ?? this._defaultOpponentDeck());
    const playerDeck   = shuffle([...GameState.deck.activeDeck]);

    const cg = GameState.cardGame;
    cg.active          = true;
    cg.opponentNpcId   = npcId;
    cg.playerDeck      = playerDeck;
    cg.opponentDeck    = opponentDeck;
    cg.playerHand      = [];
    cg.opponentHand    = [];
    cg.playerDiscard   = [];
    cg.opponentDiscard = [];
    cg.playerHP        = 20;
    cg.opponentHP      = 20;
    cg.playerMaxHP     = 20;
    cg.opponentMaxHP   = 20;
    cg.playerMana      = 1;
    cg.playerMaxMana   = 1;
    cg.opponentMana    = 1;
    cg.opponentMaxMana = 1;
    cg.playerShield    = 0;
    cg.opponentShield  = 0;
    cg.turn            = 'player';
    cg.turnNumber      = 1;
    cg.log             = [`Duel vs ${npc?.name ?? npcId} begins!`];
    cg.selectedCardIdx = null;

    // Draw initial hands (5 cards each)
    for (let i = 0; i < 5; i++) {
      this._drawCard('player');
      this._drawCard('opponent');
    }

    EventBus.emit('screen:push', { screen: this._CardGameScreen, params: { npcId } });
    EventBus.emit('cardgame:stateChanged');
  },

  _drawCard(who) {
    const cg = GameState.cardGame;
    const deck    = who === 'player' ? cg.playerDeck    : cg.opponentDeck;
    const hand    = who === 'player' ? cg.playerHand    : cg.opponentHand;
    const discard = who === 'player' ? cg.playerDiscard : cg.opponentDiscard;

    if (deck.length === 0) {
      if (discard.length === 0) return false; // no cards left
      // Reshuffle discard
      const reshuffled = shuffle(discard);
      if (who === 'player') { cg.playerDeck = reshuffled; cg.playerDiscard = []; }
      else { cg.opponentDeck = reshuffled; cg.opponentDiscard = []; }
      return this._drawCard(who);
    }

    hand.push(deck.shift());
    return true;
  },

  _playerPlayCard(cardIdx) {
    const cg = GameState.cardGame;
    if (cg.turn !== 'player') return;
    if (cardIdx < 0 || cardIdx >= cg.playerHand.length) return;

    const cardId = cg.playerHand[cardIdx];
    const card   = this._cardMap[cardId];
    if (!card) return;

    if (cg.playerMana < (card.manaCost ?? 0)) {
      EventBus.emit('toast', { message: 'Not enough mana!', type: 'error' });
      return;
    }

    // Spend mana, remove from hand
    cg.playerMana -= card.manaCost ?? 0;
    cg.playerHand.splice(cardIdx, 1);
    cg.playerDiscard.push(cardId);
    cg.selectedCardIdx = null;

    this._resolveCard(card, 'player');
    this._log(`You play ${card.name}.`);

    this._checkWinLoss();
    EventBus.emit('cardgame:stateChanged');
  },

  _playerEndTurn() {
    const cg = GameState.cardGame;
    if (cg.turn !== 'player') return;

    // Clear player shields at end of turn (only one-turn shields)
    // cg.playerShield = 0;  // keep shields between turns for now

    this._log('You end your turn.');
    cg.turn = 'opponent';

    EventBus.emit('cardgame:stateChanged');

    // AI plays after a delay
    clearTimeout(this._aiTimeout);
    this._aiTimeout = setTimeout(() => this._aiTurn(), AI_THINK_DELAY);
  },

  _aiTurn() {
    const cg = GameState.cardGame;
    if (cg.turn !== 'opponent') return;

    cg.turnNumber++;
    cg.opponentMaxMana = Math.min(10, cg.opponentMaxMana + 1);
    cg.opponentMana    = cg.opponentMaxMana;
    this._drawCard('opponent');

    // Play cards using AI priority
    let played = 0;
    const MAX_PLAYS = 3;

    while (played < MAX_PLAYS && cg.opponentHand.length > 0) {
      const choice = this._aiChooseCard();
      if (choice === -1) break;

      const cardId = cg.opponentHand[choice];
      const card   = this._cardMap[cardId];
      cg.opponentMana -= card.manaCost ?? 0;
      cg.opponentHand.splice(choice, 1);
      cg.opponentDiscard.push(cardId);

      this._resolveCard(card, 'opponent');
      this._log(`Opponent plays ${card.name}.`);
      played++;

      if (this._checkWinLoss()) return;
    }

    this._log('Opponent ends their turn.');
    // Switch back to player
    cg.turn = 'player';
    cg.playerMaxMana = Math.min(10, cg.playerMaxMana + 1);
    cg.playerMana    = cg.playerMaxMana;
    this._drawCard('player');

    EventBus.emit('cardgame:stateChanged');
  },

  _aiChooseCard() {
    const cg = GameState.cardGame;
    const hand = cg.opponentHand;
    if (!hand.length) return -1;

    // Build playable cards list
    const playable = hand
      .map((cardId, idx) => ({ cardId, idx, card: this._cardMap[cardId] }))
      .filter(({ card }) => card && (card.manaCost ?? 0) <= cg.opponentMana);

    if (!playable.length) return -1;

    // Priority: attack if player low HP, defend if own HP low, else highest power
    const attacks = playable.filter(({ card }) => card.type === 'attack');
    const defends = playable.filter(({ card }) => card.type === 'defense' || card.type === 'heal');

    if (cg.playerHP <= 5 && attacks.length) {
      // Go for the kill
      return attacks.reduce((best, cur) =>
        (cur.card.power ?? 0) > (best.card.power ?? 0) ? cur : best
      ).idx;
    }

    if (cg.opponentHP <= 8 && defends.length) {
      return defends[0].idx;
    }

    // Play highest-power affordable card
    return playable.reduce((best, cur) =>
      (cur.card.power ?? 0) > (best.card.power ?? 0) ? cur : best
    ).idx;
  },

  _resolveCard(card, who) {
    const cg = GameState.cardGame;
    const effect = card.effect;
    if (!effect) return;

    const isPlayer = who === 'player';

    switch (effect.type) {
      case 'damage': {
        const target  = effect.target === 'opponent' ? (isPlayer ? 'opponent' : 'player') : (isPlayer ? 'player' : 'opponent');
        const shield  = target === 'player' ? cg.playerShield : cg.opponentShield;
        const damage  = Math.max(0, (effect.value ?? card.power ?? 0) - shield);
        if (target === 'player')   cg.playerHP   = Math.max(0, cg.playerHP   - damage);
        else                       cg.opponentHP = Math.max(0, cg.opponentHP - damage);
        if (shield > 0) {
          const absorbed = Math.min(shield, effect.value ?? card.power ?? 0);
          if (target === 'player')   cg.playerShield   = Math.max(0, cg.playerShield   - absorbed);
          else                       cg.opponentShield = Math.max(0, cg.opponentShield - absorbed);
        }
        // Float text hint (approximate positions)
        EventBus.emit('cardgame:floatText', {
          x:     target === 'player' ? 120 : 600,
          y:     target === 'player' ? 400 : 200,
          text:  `-${damage}`,
          color: '#ff4444',
        });
        break;
      }
      case 'heal': {
        const target = effect.target === 'self' ? who : (isPlayer ? 'opponent' : 'player');
        const amount = effect.value ?? card.power ?? 0;
        if (target === 'player') cg.playerHP   = Math.min(cg.playerMaxHP,   cg.playerHP   + amount);
        else                     cg.opponentHP = Math.min(cg.opponentMaxHP, cg.opponentHP + amount);
        EventBus.emit('cardgame:floatText', {
          x: target === 'player' ? 120 : 600, y: target === 'player' ? 400 : 200,
          text: `+${amount}`, color: '#4ab87c',
        });
        break;
      }
      case 'shield': {
        const amount = effect.value ?? card.power ?? 0;
        if (isPlayer) cg.playerShield   += amount;
        else          cg.opponentShield += amount;
        EventBus.emit('cardgame:floatText', {
          x: isPlayer ? 120 : 600, y: isPlayer ? 400 : 200,
          text: `🛡+${amount}`, color: '#4ab0d0',
        });
        break;
      }
      case 'draw': {
        const count = effect.value ?? 1;
        for (let i = 0; i < count; i++) this._drawCard(who);
        break;
      }
      case 'mana': {
        const amount = effect.value ?? 1;
        if (isPlayer) cg.playerMana   = Math.min(cg.playerMaxMana,   cg.playerMana   + amount);
        else          cg.opponentMana = Math.min(cg.opponentMaxMana, cg.opponentMana + amount);
        break;
      }
    }
  },

  _checkWinLoss() {
    const cg = GameState.cardGame;
    if (cg.opponentHP <= 0) {
      this._endGame(true);
      return true;
    }
    if (cg.playerHP <= 0) {
      this._endGame(false);
      return true;
    }
    // Check deck depletion — loss if player has no cards and hand is empty
    if (cg.playerHand.length === 0 && cg.playerDeck.length === 0 && cg.playerDiscard.length === 0) {
      this._endGame(false);
      return true;
    }
    return false;
  },

  _endGame(win) {
    const cg = GameState.cardGame;
    cg.active = false;

    this._log(win ? 'You win!' : 'You lose...');
    EventBus.emit('cardgame:stateChanged');

    const npcId = cg.opponentNpcId;
    EventBus.emit('cardgame:result', { win, npcId });

    // Show result modal then pop
    setTimeout(() => {
      const msg = win
        ? `You defeated ${npcId}! Victory!`
        : `You were defeated by ${npcId}...`;
      this._showResultModal(win, msg);
    }, 400);
  },

  _showResultModal(win, msg) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const box = document.createElement('div');
    box.className = 'modal-box';
    box.innerHTML = `
      <h3 style="color:${win ? 'var(--color-success)' : 'var(--color-danger)'}">${win ? '🏆 Victory!' : '💀 Defeat'}</h3>
      <p>${msg}</p>
    `;
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.textContent = 'Continue';
    btn.addEventListener('click', () => {
      overlay.remove();
      EventBus.emit('screen:pop');  // pop CardGameScreen
    });
    box.appendChild(btn);
    overlay.appendChild(box);
    document.getElementById('screen-container').appendChild(overlay);
  },

  _surrender() {
    const cg = GameState.cardGame;
    if (!cg.active) return;
    cg.playerHP = 0;
    this._endGame(false);
  },

  _log(msg) {
    const cg = GameState.cardGame;
    cg.log.push(msg);
    if (cg.log.length > 20) cg.log.shift();
  },

  _defaultOpponentDeck() {
    return ['ember_bolt', 'ember_bolt', 'frost_shard', 'frost_shard',
            'shield_wall', 'shield_wall', 'healing_light', 'healing_light'];
  },
};

export default CardSystem;
