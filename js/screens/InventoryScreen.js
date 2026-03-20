/**
 * InventoryScreen — tabbed inventory: Card List, Decks, Loot, Key Items.
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import { CARDS, ITEMS, STARTER_DECKS, validateDeck, LOOT_BOX_TYPES, openLootBox } from '../Data.js';

function buildCardMap() {
  const m = {};
  CARDS.forEach(c => { m[c.cardId] = c; });
  return m;
}

function buildItemsMap() {
  const m = {};
  ITEMS.forEach(it => { m[it.itemId] = it; });
  return m;
}

function countArr(arr) {
  const counts = {};
  arr.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
  return counts;
}

const TABS = ['Card List', 'Decks', 'Loot', 'Key Items'];

const InventoryScreen = {
  _container: null,
  _cardMap: {},
  _itemsMap: {},
  _activeTab: 'Card List',

  mount(container, params = {}) {
    this._container = container;
    this._cardMap = buildCardMap();
    this._itemsMap = buildItemsMap();
    this._activeTab = params.tab || 'Card List';
    this._render();
  },

  unmount() {
    this._container = null;
  },

  _render() {
    const c = this._container;
    c.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'inventory-screen fade-in';

    // Header
    const header = document.createElement('div');
    header.className = 'screen-header';
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back';
    backBtn.textContent = '← Back';
    backBtn.addEventListener('click', () => EventBus.emit('screen:pop'));
    const title = document.createElement('h2');
    title.textContent = '🎒 Inventory';
    header.appendChild(backBtn);
    header.appendChild(title);
    screen.appendChild(header);

    // Tab bar
    const tabBar = document.createElement('div');
    tabBar.className = 'inv-tab-bar';

    const content = document.createElement('div');
    content.className = 'inv-content';

    TABS.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'inv-tab' + (tab === this._activeTab ? ' active' : '');
      btn.textContent = tab;
      btn.addEventListener('click', () => {
        this._activeTab = tab;
        tabBar.querySelectorAll('.inv-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderTabContent(content);
      });
      tabBar.appendChild(btn);
    });

    screen.appendChild(tabBar);

    this._renderTabContent(content);
    screen.appendChild(content);

    c.appendChild(screen);
  },

  _renderTabContent(content) {
    content.innerHTML = '';
    switch (this._activeTab) {
      case 'Card List':  this._renderCardList(content);  break;
      case 'Decks':      this._renderDecks(content);      break;
      case 'Loot':       this._renderLoot(content);       break;
      case 'Key Items':  this._renderKeyItems(content);   break;
    }
  },

  // ── Card List ──────────────────────────────────────────────────────────────

  _renderCardList(content) {
    const collection = GameState.deck.collection;

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'inv-section-title';
    sectionTitle.textContent = collection.length
      ? `${collection.length} cards total · ${Object.keys(countArr(collection)).length} unique`
      : 'No cards in collection yet.';
    content.appendChild(sectionTitle);

    if (!collection.length) return;

    const counts = countArr(collection);
    const list = document.createElement('div');
    list.className = 'inv-card-list';

    Object.keys(counts).forEach(cardId => {
      const card = this._cardMap[cardId];
      if (!card) return;
      const row = document.createElement('div');
      row.className = 'inv-card-row';
      row.innerHTML = `
        <span class="inv-card-art">${card.art}</span>
        <div class="inv-card-info">
          <span class="inv-card-name">${card.name}</span>
          <span class="inv-card-meta">${card.element} · ${card.type} · ${card.manaCost} mana — ${card.description}</span>
        </div>
        <span class="inv-card-count">×${counts[cardId]}</span>
      `;

      // Floating card preview on hover
      const preview = this._buildCardPreview(card);
      row.appendChild(preview);
      row.addEventListener('mouseenter', () => preview.classList.add('visible'));
      row.addEventListener('mouseleave', () => preview.classList.remove('visible'));

      list.appendChild(row);
    });

    content.appendChild(list);
  },

  // ── Decks ──────────────────────────────────────────────────────────────────

  _renderDecks(content) {
    const savedIds = GameState.deck.savedDeckIds || [];
    const ownedDecks = STARTER_DECKS.filter(d => savedIds.includes(d.id));

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'inv-section-title';
    sectionTitle.textContent = `${ownedDecks.length} deck${ownedDecks.length !== 1 ? 's' : ''} in collection`;
    content.appendChild(sectionTitle);

    if (!ownedDecks.length) {
      const empty = document.createElement('p');
      empty.className = 'inv-empty';
      empty.textContent = 'No decks in your collection yet.';
      content.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'inv-deck-list';

    ownedDecks.forEach(deck => {
      const vd = validateDeck(deck);

      const card = document.createElement('div');
      card.className = 'inv-deck-card';
      card.style.setProperty('--deck-color', deck.color);

      const header = document.createElement('div');
      header.className = 'inv-deck-card-header';
      header.innerHTML = `
        <span class="inv-deck-art">${deck.art}</span>
        <div class="inv-card-info">
          <span class="inv-card-name">${deck.name}</span>
          <span class="inv-card-meta">${deck.description}</span>
        </div>
        <span class="inv-deck-status ${vd.valid ? 'inv-deck-valid' : 'inv-deck-invalid'}">
          ${vd.valid ? '✓ Valid' : '✗ Invalid'}
        </span>
      `;

      const counts = document.createElement('div');
      counts.className = 'inv-deck-counts';
      counts.innerHTML = `
        <span class="${deck.elites.length === 10 ? 'inv-count-ok' : 'inv-count-bad'}">🐉 ${deck.elites.length}/10 elites</span>
        <span class="${deck.summons.length >= 40 ? 'inv-count-ok' : 'inv-count-bad'}">✨ ${deck.summons.length}/40+ summons</span>
        <span class="${deck.spells.length === 10 ? 'inv-count-ok' : 'inv-count-bad'}">🔮 ${deck.spells.length}/10 spells</span>
      `;

      card.appendChild(header);
      card.appendChild(counts);
      list.appendChild(card);
    });

    content.appendChild(list);
  },

  // ── Loot ───────────────────────────────────────────────────────────────────

  _renderLoot(content) {
    const boxes = GameState.inventory.lootBoxes || [];

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'inv-section-title';
    sectionTitle.textContent = boxes.length
      ? `${boxes.length} loot box${boxes.length !== 1 ? 'es' : ''} available`
      : 'No loot boxes available.';
    content.appendChild(sectionTitle);

    if (!boxes.length) {
      const empty = document.createElement('p');
      empty.className = 'inv-empty';
      empty.textContent = 'Win story matches to earn booster packs!';
      content.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'inv-loot-list';

    boxes.forEach((box, idx) => {
      const def = LOOT_BOX_TYPES[box.boxTypeId] ?? LOOT_BOX_TYPES.small;
      const totalCards = def.packCount * 6;

      const row = document.createElement('div');
      row.className = 'inv-loot-row';

      // Icon with tooltip
      const iconWrap = document.createElement('div');
      iconWrap.className = 'inv-loot-icon-wrap';

      const icon = document.createElement('span');
      icon.className = 'inv-loot-icon';
      icon.textContent = box.icon || def.icon;

      const tooltip = document.createElement('div');
      tooltip.className = 'inv-loot-tooltip';
      tooltip.innerHTML = `<strong>${box.label ?? def.label}</strong><br>${def.description.replace(/\n/g, '<br>')}`;

      iconWrap.appendChild(icon);
      iconWrap.appendChild(tooltip);

      const info = document.createElement('div');
      info.className = 'inv-card-info';
      info.innerHTML = `
        <span class="inv-card-name">${box.label ?? def.label}</span>
        <span class="inv-card-meta">${def.packCount} booster pack${def.packCount !== 1 ? 's' : ''} · ${totalCards} cards total · Each pack guarantees 1× B rank+</span>
      `;

      const openBtn = document.createElement('button');
      openBtn.className = 'btn-primary inv-loot-open';
      openBtn.textContent = 'Open';
      openBtn.addEventListener('click', () => this._openLootBox(idx, content));

      row.appendChild(iconWrap);
      row.appendChild(info);
      row.appendChild(openBtn);
      list.appendChild(row);
    });

    content.appendChild(list);
  },

  _openLootBox(idx, content) {
    const boxes  = GameState.inventory.lootBoxes;
    const box    = boxes[idx];
    if (!box) return;

    // Generate all packs
    const packs = openLootBox(box.boxTypeId ?? 'small');
    // Remove box from inventory now (before confirm, so user can't double-open)
    boxes.splice(idx, 1);

    const RARITY_COLORS = { S: '#e0b84a', A: '#9060e0', B: '#4ab0d0', C: '#888' };
    const RARITY_LABELS = { S: 'S', A: 'A', B: 'B', C: 'C' };

    content.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'inv-section-title';
    header.textContent = `Opening: ${box.label ?? 'Loot Box'} — ${packs.length} pack${packs.length !== 1 ? 's' : ''}, ${packs.length * 6} cards`;
    content.appendChild(header);

    const revealArea = document.createElement('div');
    revealArea.className = 'inv-reveal-area';

    const allCards = [];

    packs.forEach((pack, packIdx) => {
      const packSection = document.createElement('div');
      packSection.className = 'inv-pack-section';

      const packLabel = document.createElement('div');
      packLabel.className = 'inv-pack-label';
      packLabel.textContent = packs.length > 1 ? `Pack ${packIdx + 1}` : 'Booster Pack';
      packSection.appendChild(packLabel);

      const packGrid = document.createElement('div');
      packGrid.className = 'inv-pack-grid';

      pack.forEach(card => {
        allCards.push(card);
        const tile = document.createElement('div');
        tile.className = 'inv-card-tile';
        tile.style.setProperty('--rarity-color', RARITY_COLORS[card.rarity] ?? '#888');

        tile.innerHTML = `
          <div class="inv-tile-art">${card.art ?? '🃏'}</div>
          <div class="inv-tile-name">${card.name}</div>
          <div class="inv-tile-meta">${card.type ?? ''}</div>
          <div class="inv-tile-rarity" style="color:${RARITY_COLORS[card.rarity] ?? '#888'}">${RARITY_LABELS[card.rarity] ?? '?'}</div>
        `;
        packGrid.appendChild(tile);
      });

      packSection.appendChild(packGrid);
      revealArea.appendChild(packSection);
    });

    content.appendChild(revealArea);

    // Summary
    const summary = document.createElement('div');
    summary.className = 'inv-reveal-summary';
    const rarityCount = {};
    allCards.forEach(c => { rarityCount[c.rarity] = (rarityCount[c.rarity] || 0) + 1; });
    const summaryParts = ['S','A','B','C']
      .filter(r => rarityCount[r])
      .map(r => `<span style="color:${RARITY_COLORS[r]}">${r}: ${rarityCount[r]}</span>`);
    summary.innerHTML = `${allCards.length} cards obtained — ${summaryParts.join(' · ')}`;
    content.appendChild(summary);

    const collectBtn = document.createElement('button');
    collectBtn.className = 'btn-primary inv-deck-edit-btn';
    collectBtn.textContent = `✓ Collect All (${allCards.length} cards)`;
    collectBtn.addEventListener('click', () => {
      allCards.forEach(card => GameState.addCardToCollection(card.cardId));
      this._renderTabContent(content);
    });
    content.appendChild(collectBtn);
  },

  // ── Key Items ──────────────────────────────────────────────────────────────

  _renderKeyItems(content) {
    const empty = document.createElement('p');
    empty.className = 'inv-empty';
    empty.textContent = 'Nothing here yet.';
    content.appendChild(empty);
  },

  _buildCardPreview(card) {
    const ELEMENT_COLORS = {
      fire: '#c0401a', ice: '#2a80c0', arcane: '#7c5cbf',
      earth: '#5a8a30', light: '#c0a020', wind: '#40a080',
    };
    const borderColor = ELEMENT_COLORS[card.element] ?? 'var(--color-border)';

    const el = document.createElement('div');
    el.className = 'inv-card-preview';
    el.style.setProperty('--preview-color', borderColor);
    el.innerHTML = `
      <div class="icp-art">${card.art}</div>
      <div class="icp-name">${card.name}</div>
      <div class="icp-divider"></div>
      <div class="icp-row"><span class="icp-label">Element</span><span>${card.element ?? '—'}</span></div>
      <div class="icp-row"><span class="icp-label">Type</span><span>${card.type ?? '—'}</span></div>
      <div class="icp-row"><span class="icp-label">Mana</span><span>${card.manaCost ?? 0}</span></div>
      <div class="icp-desc">${card.description ?? ''}</div>
    `;
    return el;
  },

  update(dt) {},
};

export default InventoryScreen;
