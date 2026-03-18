/**
 * DeckBuilderScreen — view collection, add/remove cards to active deck.
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import { CARDS } from '../Data.js';

function buildCardMap(cards) {
  const m = {};
  cards.forEach(c => { m[c.cardId] = c; });
  return m;
}

function countOccurrences(arr, val) {
  return arr.filter(x => x === val).length;
}

const DeckBuilderScreen = {
  _container: null,
  _cardMap: {},

  mount(container, params = {}) {
    this._container = container;
    this._cardMap = buildCardMap(CARDS);
    this._render();
  },

  unmount() {
    this._container = null;
  },

  _render() {
    const c = this._container;
    c.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'deck-builder-screen fade-in';

    // Header
    const header = document.createElement('div');
    header.className = 'screen-header';
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back';
    backBtn.textContent = '← Back';
    backBtn.addEventListener('click', () => EventBus.emit('screen:pop'));
    const title = document.createElement('h2');
    title.textContent = `🃏 Deck Builder`;
    header.appendChild(backBtn);
    header.appendChild(title);
    screen.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'deck-builder-body';

    // Collection panel
    const collPanel = document.createElement('div');
    collPanel.className = 'deck-builder-collection';
    const collTitle = document.createElement('h3');
    collTitle.textContent = 'Collection — click to add';
    collPanel.appendChild(collTitle);

    const collGrid = document.createElement('div');
    collGrid.className = 'cards-grid';
    const uniqueCards = [...new Set(GameState.deck.collection)];
    uniqueCards.forEach(cardId => {
      const card = this._cardMap[cardId];
      const inDeck = countOccurrences(GameState.deck.activeDeck, cardId);
      const el = this._buildCardEl(cardId, card);
      const countLabel = document.createElement('div');
      countLabel.style.cssText = 'font-size:0.65em;color:var(--color-text-dim);text-align:center;margin-top:2px';
      countLabel.textContent = `In deck: ${inDeck}`;
      const wrap = document.createElement('div');
      wrap.appendChild(el);
      wrap.appendChild(countLabel);
      wrap.addEventListener('click', () => this._addToDeck(cardId));
      collGrid.appendChild(wrap);
    });
    collPanel.appendChild(collGrid);

    // Active deck panel
    const deckPanel = document.createElement('div');
    deckPanel.className = 'deck-builder-active';
    const deckTitle = document.createElement('h3');
    deckTitle.id = 'db-deck-title';
    deckTitle.textContent = `Active Deck (${GameState.deck.activeDeck.length}/${GameState.deck.maxDeckSize})`;
    deckPanel.appendChild(deckTitle);

    const deckList = document.createElement('div');
    deckList.className = 'deck-list';
    deckList.id = 'db-deck-list';
    this._renderDeckList(deckList);
    deckPanel.appendChild(deckList);

    body.appendChild(collPanel);
    body.appendChild(deckPanel);
    screen.appendChild(body);
    c.appendChild(screen);
  },

  _renderDeckList(container) {
    container.innerHTML = '';
    const counts = {};
    GameState.deck.activeDeck.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    Object.entries(counts).forEach(([cardId, count]) => {
      const card = this._cardMap[cardId];
      const el = document.createElement('div');
      el.className = 'deck-card-entry';
      el.innerHTML = `
        <span>${card?.art ?? '✨'} ${card?.name ?? cardId}</span>
        <span style="color:var(--color-text-dim)">x${count}</span>
        <span style="color:var(--color-danger);font-size:0.8em;margin-left:4px">✕</span>
      `;
      el.title = 'Click to remove';
      el.addEventListener('click', () => this._removeFromDeck(cardId));
      container.appendChild(el);
    });
    if (!GameState.deck.activeDeck.length) {
      container.innerHTML = '<p style="color:var(--color-text-dim);font-size:0.8em;padding:8px">Deck is empty</p>';
    }
  },

  _buildCardEl(cardId, card) {
    const el = document.createElement('div');
    el.className = `card-mini ${card?.element ?? ''}`;
    el.innerHTML = `
      <div class="card-cost">${card?.manaCost ?? 0}</div>
      <div class="card-art">${card?.art ?? '✨'}</div>
      <div class="card-name">${card?.name ?? cardId}</div>
      <div class="card-type-tag">${card?.type ?? ''}</div>
    `;
    return el;
  },

  _addToDeck(cardId) {
    const size = GameState.deck.activeDeck.length;
    if (size >= GameState.deck.maxDeckSize) {
      EventBus.emit('toast', { message: 'Deck is full!', type: 'error' });
      return;
    }
    GameState.addCardToDeck(cardId);
    this._refreshDeckUI();
  },

  _removeFromDeck(cardId) {
    GameState.removeCardFromDeck(cardId);
    this._refreshDeckUI();
  },

  _refreshDeckUI() {
    const deckList = document.getElementById('db-deck-list');
    const deckTitle = document.getElementById('db-deck-title');
    if (deckList) this._renderDeckList(deckList);
    if (deckTitle) deckTitle.textContent = `Active Deck (${GameState.deck.activeDeck.length}/${GameState.deck.maxDeckSize})`;
  },

  update(dt) {},
};

export default DeckBuilderScreen;
