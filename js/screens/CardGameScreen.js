/**
 * CardGameScreen — Canvas-based card battle renderer.
 * CardSystem handles all logic; this screen visualises and receives input.
 *
 * Canvas layout:
 *   Top 1/3    — Opponent area (HP, mana, hand face-down, deck)
 *   Middle     — Battle log strip + vs display
 *   Bottom 1/3 — Player area (HP, mana, hand face-up)
 *   Bottom bar — End Turn button + mana indicator (DOM overlay)
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import { CARDS } from '../Data.js';

const CARD_W = 72;
const CARD_H = 100;
const CARD_R = 6;
const COLORS = {
  bg:       '#0d1a0d',
  panel:    '#1a2a1a',
  border:   '#2a4a2a',
  accent:   '#4ab87c',
  danger:   '#c04a4a',
  gold:     '#e0b84a',
  arcane:   '#9060e0',
  text:     '#d8f0d8',
  textDim:  '#88aa88',
  fire:     '#e06030',
  ice:      '#4ab0d0',
  light:    '#e0d060',
  earth:    '#80a040',
  selected: '#a0e0ff',
};

const ELEMENT_COLORS = { fire: COLORS.fire, ice: COLORS.ice, arcane: COLORS.arcane, earth: COLORS.earth, light: COLORS.light };


const CardGameScreen = {
  _container: null,
  _canvas: null,
  _ctx: null,
  _unsub: [],
  _cardsData: {},
  _animQueue: [],
  _floatingTexts: [],

  mount(container, params = {}) {
    this._container = container;
    this._cardsData = {};
    CARDS.forEach(c => { this._cardsData[c.cardId] = c; });

    this._render();
    this._bindEvents();
    this._draw();
  },

  unmount() {
    this._unsub.forEach(fn => fn());
    this._unsub = [];
    this._container = null;
    this._canvas = null;
    this._ctx = null;
  },

  _render() {
    const c = this._container;
    c.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'card-game-screen';

    const canvas = document.createElement('canvas');
    canvas.id = 'card-game-canvas';
    screen.appendChild(canvas);

    const ui = document.createElement('div');
    ui.className = 'card-game-ui';

    const manaDisplay = document.createElement('span');
    manaDisplay.className = 'card-mana-display';
    manaDisplay.id = 'cg-mana';

    const endTurnBtn = document.createElement('button');
    endTurnBtn.className = 'btn-card-action';
    endTurnBtn.id = 'cg-end-turn';
    endTurnBtn.textContent = 'End Turn';
    endTurnBtn.addEventListener('click', () => {
      if (GameState.cardGame.turn === 'player') {
        EventBus.emit('cardgame:player:endTurn');
      }
    });

    const surrenderBtn = document.createElement('button');
    surrenderBtn.className = 'btn-card-action';
    surrenderBtn.style.background = '#602020';
    surrenderBtn.textContent = 'Surrender';
    surrenderBtn.addEventListener('click', () => {
      EventBus.emit('cardgame:surrender');
    });

    ui.appendChild(manaDisplay);
    ui.appendChild(endTurnBtn);
    ui.appendChild(surrenderBtn);
    screen.appendChild(ui);

    c.appendChild(screen);

    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');

    // Handle resize
    this._resize();
    window.addEventListener('resize', this._resize.bind(this));

    // Click on canvas (card selection + play)
    canvas.addEventListener('click', this._handleClick.bind(this));
  },

  _resize() {
    if (!this._canvas) return;
    const parent = this._canvas.parentElement;
    if (!parent) return;
    this._canvas.width  = parent.clientWidth;
    this._canvas.height = parent.clientHeight;
    this._draw();
  },

  _bindEvents() {
    this._unsub.push(
      EventBus.on('cardgame:stateChanged', () => this._draw()),
      EventBus.on('cardgame:floatText',    (d) => this._addFloat(d)),
      EventBus.on('engine:tick',           (d) => this._tick(d.dt)),
    );
  },

  _tick(dt) {
    this._floatingTexts = this._floatingTexts.filter(f => {
      f.life -= dt;
      f.y -= 30 * dt;
      return f.life > 0;
    });
    if (this._floatingTexts.length) this._draw();
    this._updateUI();
  },

  _addFloat({ x, y, text, color = '#ffffff' }) {
    this._floatingTexts.push({ x, y, text, color, life: 1.2 });
  },

  _updateUI() {
    const manaEl   = document.getElementById('cg-mana');
    const endBtn   = document.getElementById('cg-end-turn');
    const cg = GameState.cardGame;
    if (manaEl) manaEl.textContent = `Mana: ${cg.playerMana} / ${cg.playerMaxMana}`;
    if (endBtn) endBtn.disabled = (cg.turn !== 'player');
  },

  _draw() {
    const canvas = this._canvas;
    const ctx    = this._ctx;
    if (!canvas || !ctx) return;
    const W = canvas.width, H = canvas.height;
    const cg = GameState.cardGame;

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    const midY = H / 2;
    const opponentAreaH = midY - 30;
    const playerAreaH   = H - midY - 30 - 60; // -60 for bottom UI

    // ── Opponent area ──────────────────────────────────────
    this._drawCombatant(ctx, {
      isOpponent: true, x: 0, y: 0, w: W, h: opponentAreaH,
      hp: cg.opponentHP, maxHp: cg.opponentMaxHP,
      mana: cg.opponentMana, maxMana: cg.opponentMaxMana,
      shield: cg.opponentShield,
      handSize: cg.opponentHand.length,
      deckSize: cg.opponentDeck.length,
      npcId: cg.opponentNpcId,
    });

    // ── Center strip ───────────────────────────────────────
    ctx.fillStyle = COLORS.panel;
    ctx.fillRect(0, opponentAreaH, W, 60);
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(0, opponentAreaH, W, 60);

    const turnText = cg.turn === 'player' ? 'YOUR TURN' : 'OPPONENT\'S TURN';
    ctx.fillStyle = cg.turn === 'player' ? COLORS.accent : COLORS.danger;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(turnText, W / 2, opponentAreaH + 22);

    // Last log entry
    const lastLog = cg.log[cg.log.length - 1] ?? '— vs —';
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '11px sans-serif';
    ctx.fillText(lastLog, W / 2, opponentAreaH + 44);

    // ── Player area ────────────────────────────────────────
    const playerY = midY + 30;
    this._drawPlayerHand(ctx, {
      hand: cg.playerHand, selectedIdx: cg.selectedCardIdx,
      x: 0, y: playerY, w: W, h: playerAreaH,
    });

    // Player stats (bottom-left of player area)
    this._drawStats(ctx, {
      hp: cg.playerHP, maxHp: cg.playerMaxHP,
      shield: cg.playerShield,
      x: 12, y: playerY + 8,
    });

    // Deck size bottom-right
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Deck: ${cg.playerDeck.length}  Discard: ${cg.playerDiscard.length}`, W - 10, playerY + 16);

    // ── Floating texts ─────────────────────────────────────
    this._floatingTexts.forEach(f => {
      const alpha = Math.min(1, f.life);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = f.color;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    });
  },

  _drawCombatant(ctx, { isOpponent, x, y, w, h, hp, maxHp, mana, maxMana, shield, handSize, deckSize, npcId }) {
    // Background
    ctx.fillStyle = COLORS.panel;
    ctx.fillRect(x, y, w, h);

    // HP bar
    const barW = 160, barH = 12;
    const barX = isOpponent ? w - barW - 12 : 12;
    const barY = isOpponent ? y + h - 34 : y + 10;

    ctx.fillStyle = '#2a0a0a';
    this._roundRect(ctx, barX, barY, barW, barH, 4);
    ctx.fill();

    const hpRatio = Math.max(0, hp / maxHp);
    const hpColor = hpRatio > 0.5 ? COLORS.accent : hpRatio > 0.25 ? COLORS.gold : COLORS.danger;
    ctx.fillStyle = hpColor;
    this._roundRect(ctx, barX, barY, barW * hpRatio, barH, 4);
    ctx.fill();

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`HP ${hp}/${maxHp}`, barX + barW / 2, barY + barH - 1);

    // Shield
    if (shield > 0) {
      ctx.fillStyle = COLORS.ice;
      ctx.font = '11px sans-serif';
      ctx.textAlign = isOpponent ? 'right' : 'left';
      ctx.fillText(`🛡 ${shield}`, isOpponent ? barX + barW : barX, barY + barH + 14);
    }

    // Opponent hand (face-down cards)
    if (isOpponent && handSize > 0) {
      const startX = w / 2 - (handSize * (CARD_W * 0.6 + 4)) / 2;
      for (let i = 0; i < handSize; i++) {
        const cx = startX + i * (CARD_W * 0.6 + 4);
        const cy = y + h / 2 - CARD_H * 0.4;
        this._drawCardBack(ctx, cx, cy, CARD_W * 0.6, CARD_H * 0.8);
      }
    }

    // Name
    const label = isOpponent ? (npcId ?? 'Opponent') : 'You';
    ctx.fillStyle = isOpponent ? COLORS.danger : COLORS.accent;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = isOpponent ? 'right' : 'left';
    ctx.fillText(label, isOpponent ? w - 12 : 12, isOpponent ? y + 20 : y + h - 10);
  },

  _drawStats(ctx, { hp, maxHp, shield, x, y }) {
    // Already drawn inline above; kept for potential future use
  },

  _drawPlayerHand(ctx, { hand, selectedIdx, x, y, w, h }) {
    if (!hand.length) {
      ctx.fillStyle = COLORS.textDim;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No cards in hand', w / 2, y + h / 2);
      return;
    }

    const spacing = Math.min(CARD_W + 8, (w - 40) / hand.length);
    const totalW  = spacing * (hand.length - 1) + CARD_W;
    const startX  = (w - totalW) / 2;
    const cardY   = y + (h - CARD_H) / 2;

    hand.forEach((cardId, i) => {
      const cx = x + startX + i * spacing;
      const cy = selectedIdx === i ? cardY - 12 : cardY;
      const cardData = this._cardsData[cardId];
      this._drawCard(ctx, cx, cy, cardData, selectedIdx === i);
    });
  },

  _drawCard(ctx, x, y, card, selected = false) {
    if (!card) {
      this._drawCardBack(ctx, x, y, CARD_W, CARD_H);
      return;
    }

    const elemColor = ELEMENT_COLORS[card.element] ?? COLORS.arcane;

    // Shadow
    ctx.shadowColor = selected ? COLORS.selected : 'rgba(0,0,0,0.5)';
    ctx.shadowBlur  = selected ? 16 : 8;

    // Body
    ctx.fillStyle = '#1a1a30';
    this._roundRect(ctx, x, y, CARD_W, CARD_H, CARD_R);
    ctx.fill();

    // Border
    ctx.strokeStyle = selected ? COLORS.selected : elemColor;
    ctx.lineWidth   = selected ? 2.5 : 1.5;
    this._roundRect(ctx, x, y, CARD_W, CARD_H, CARD_R);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Mana cost circle
    ctx.fillStyle = COLORS.arcane;
    ctx.beginPath();
    ctx.arc(x + 12, y + 12, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.manaCost ?? 0, x + 12, y + 16);

    // Art (emoji)
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.art ?? '✨', x + CARD_W / 2, y + 52);

    // Name
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    const name = card.name ?? card.cardId ?? '?';
    ctx.fillText(name.length > 12 ? name.slice(0, 11) + '…' : name, x + CARD_W / 2, y + 72);

    // Power
    if (card.power != null) {
      ctx.fillStyle = card.type === 'attack' ? COLORS.danger : card.type === 'defense' ? COLORS.ice : COLORS.gold;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(card.power, x + CARD_W - 6, y + CARD_H - 6);
    }

    // Type tag
    ctx.fillStyle = elemColor;
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((card.element ?? '').toUpperCase(), x + CARD_W / 2, y + CARD_H - 6);
  },

  _drawCardBack(ctx, x, y, w, h) {
    ctx.fillStyle = '#1a1a30';
    this._roundRect(ctx, x, y, w, h, CARD_R * (w / CARD_W));
    ctx.fill();
    ctx.strokeStyle = COLORS.arcane;
    ctx.lineWidth = 1;
    this._roundRect(ctx, x, y, w, h, CARD_R * (w / CARD_W));
    ctx.stroke();
    ctx.fillStyle = COLORS.arcane;
    ctx.font = `${Math.floor(h * 0.3)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✦', x + w / 2, y + h / 2 + h * 0.1);
  },

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  _handleClick(e) {
    const cg = GameState.cardGame;
    if (cg.turn !== 'player') return;

    const rect   = this._canvas.getBoundingClientRect();
    const mx     = e.clientX - rect.left;
    const my     = e.clientY - rect.top;
    const canvas = this._canvas;
    const W = canvas.width, H = canvas.height;

    const hand    = cg.playerHand;
    const midY    = H / 2;
    const playerY = midY + 30;
    const playerAreaH = H - midY - 30 - 60;

    const spacing = Math.min(CARD_W + 8, (W - 40) / (hand.length || 1));
    const totalW  = spacing * (hand.length - 1) + CARD_W;
    const startX  = (W - totalW) / 2;
    const cardY   = playerY + (playerAreaH - CARD_H) / 2;

    let clickedIdx = -1;
    for (let i = hand.length - 1; i >= 0; i--) {
      const cx = startX + i * spacing;
      const cy = cg.selectedCardIdx === i ? cardY - 12 : cardY;
      if (mx >= cx && mx <= cx + CARD_W && my >= cy && my <= cy + CARD_H) {
        clickedIdx = i;
        break;
      }
    }

    if (clickedIdx === -1) {
      // Clicked empty space — deselect
      if (cg.selectedCardIdx !== null) {
        cg.selectedCardIdx = null;
        this._draw();
      }
      return;
    }

    if (cg.selectedCardIdx === clickedIdx) {
      // Play selected card
      EventBus.emit('cardgame:player:playCard', { cardIdx: clickedIdx });
      cg.selectedCardIdx = null;
    } else {
      // Select card
      cg.selectedCardIdx = clickedIdx;
      this._draw();
    }
  },

  update(dt) {},
};

export default CardGameScreen;
