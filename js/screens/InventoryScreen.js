/**
 * InventoryScreen — tabbed inventory: Card List, Decks, Loot, Key Items.
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import SoundSystem from '../systems/SoundSystem.js';
import DeckBuilderScreen from './DeckBuilderScreen.js';
import {
  ITEMS, STORY_STARTER_DECKS, validateDeck, LOOT_BOX_TYPES, openLootBox,
} from '../Data.js';

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

function buildItemsMap() {
  const m = {};
  ITEMS.forEach(it => { m[it.itemId] = it; });
  return m;
}

const TABS = ['Card List', 'Decks', 'Loot', 'Key Items'];

const InventoryScreen = {
  _container: null,
  _itemsMap: {},
  _activeTab: 'Card List',

  mount(container, params = {}) {
    this._container = container;
    this._itemsMap = buildItemsMap();
    this._activeTab = params.tab || 'Card List';
    this._render();
  },

  unmount() {
    document.querySelectorAll('[data-inv-modal]').forEach(el => el.remove());
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
    // Count cards from collection; also ensure active-deck cards are always counted
    // (quick-match STARTER_DECKS are separate and don't contribute here)
    const ownedCounts = {};
    (GameState.deck.collection ?? []).forEach(id => {
      ownedCounts[id] = (ownedCounts[id] ?? 0) + 1;
    });
    // Active deck cards count as owned — take the higher of the two counts
    const activeCounts = {};
    (GameState.deck.activeDeck ?? []).forEach(id => {
      activeCounts[id] = (activeCounts[id] ?? 0) + 1;
    });
    Object.entries(activeCounts).forEach(([id, cnt]) => {
      if ((ownedCounts[id] ?? 0) < cnt) ownedCounts[id] = cnt;
    });

    // Collect unique owned cards from all story starter decks
    const seen = new Set();
    const addOwned = (arr) => (arr ?? []).filter(c => {
      if (seen.has(c.cardId)) return false;
      seen.add(c.cardId);
      return (ownedCounts[c.cardId] ?? 0) > 0;
    });

    let champions = [], elites = [], summons = [], spells = [];
    STORY_STARTER_DECKS.forEach(deck => {
      champions = champions.concat(addOwned(deck.champions));
      elites    = elites   .concat(addOwned(deck.elites));
      summons   = summons  .concat(addOwned(deck.summons));
      spells    = spells   .concat(addOwned(deck.spells));
    });
    const total     = champions.length + elites.length + summons.length + spells.length;

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'inv-section-title';
    sectionTitle.textContent = total > 0 ? `${total} unique cards owned` : 'No cards in collection yet.';
    content.appendChild(sectionTitle);

    if (total === 0) return;

    const sections = [
      { label: '👑 Champions', cards: champions },
      { label: '🐉 Elites',    cards: elites },
      { label: '✨ Summons',   cards: summons },
      { label: '🔮 Spells',    cards: spells },
    ];

    sections.forEach(({ label, cards }) => {
      if (cards.length === 0) return;

      const heading = document.createElement('div');
      heading.className = 'inv-card-section-heading';
      heading.textContent = `${label} (${cards.length})`;
      content.appendChild(heading);

      const grid = document.createElement('div');
      grid.className = 'inv-card-grid';

      cards.forEach(card => {
        const tile  = this._buildCardTile(card);
        const badge = document.createElement('div');
        badge.className = 'inv-card-count';
        badge.textContent = `×${ownedCounts[card.cardId]}`;
        tile.appendChild(badge);
        grid.appendChild(tile);
      });

      content.appendChild(grid);
    });
  },

  _buildCardTile(card) {
    const div = document.createElement('div');
    div.className = 'cg-hand-card inv-card-tile';

    if (card.type === 'spell') {
      div.innerHTML = `
        <div class="cg-card-top">
          <span class="cg-card-name">${card.name}</span>
          <span class="cg-hcard-cost">0</span>
        </div>
        <div class="cg-type-label">Spell</div>
        <div class="cg-card-art-wrap"><div class="cg-art-emoji">${card.art ?? '✨'}</div></div>
      `;
    } else if (card.type === 'champion') {
      div.innerHTML = `
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
      div.innerHTML = `
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
      div.innerHTML = `
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

    div.addEventListener('click', () => this._showCardPreviewModal(card));
    return div;
  },

  _showCardPreviewModal(card) {
    const overlay = document.createElement('div');
    overlay.className = 'inv-preview-overlay';

    const previewCard = document.createElement('div');
    previewCard.className = 'cg-hand-card inv-preview-card';
    previewCard.innerHTML = this._buildCardPreviewHTML(card);

    overlay.appendChild(previewCard);

    const close = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    };

    const onKey = (e) => { if (e.key === 'Escape') close(); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);

    this._container.appendChild(overlay);
  },

  _buildCardPreviewHTML(card) {
    if (card.type === 'spell') {
      return `
        <div class="cg-card-top"><span class="cg-card-name">${card.name ?? 'Spell'}</span><span class="cg-hcard-cost">0</span></div>
        <div class="cg-type-label">Spell Card</div>
        <div class="cg-card-art-wrap"><div class="cg-art-emoji">${card.art ?? '✨'}</div></div>
        ${card.description ? `<div class="cg-ability-panel">${card.description}</div>` : ''}
      `;
    }
    if (card.type === 'champion') {
      return `
        <div class="cg-card-top"><span class="cg-card-name">${card.name ?? 'Champion'}</span></div>
        ${card.cardType ? `<div class="cg-type-label">${card.cardType}</div>` : ''}
        <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
        <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:100%;background:#4ab87c"></div></div>
        <div class="cg-card-stats"><span class="cg-stat-hp">HP ${card.hp} / ${card.maxHp}</span></div>
        ${card.ability?.desc ? `<div class="cg-ability-panel">${card.ability.desc}</div>` : ''}
        <div class="cg-card-bottom">${_rarityBadge(card)}<div class="cg-terrain-circle">${_terrainCircle(card)}</div><span class="cg-card-uid">${card.cardUid ?? ''}</span></div>
      `;
    }
    if (card.type === 'elite') {
      return `
        <div class="cg-card-top"><span class="cg-card-name">${card.name ?? 'Elite'}</span></div>
        ${card.cardType ? `<div class="cg-type-label">${card.cardType}</div>` : ''}
        <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
        <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:100%;background:#4ab87c"></div></div>
        <div class="cg-card-stats">
          <span class="cg-stat-hp">HP ${card.hp}</span>
          <span class="cg-stat-pow">POW ${card.power}</span>
          <span class="cg-stat-mov">MOV ${card.ability?.type === 'extended_rally' ? 2 : 1}</span>
        </div>
        ${card.ability?.desc ? `<div class="cg-ability-panel">${card.ability.desc}</div>` : ''}
        <div class="cg-card-bottom">${_rarityBadge(card)}<div class="cg-terrain-circle">${_terrainCircle(card)}</div><span class="cg-card-uid">${card.cardUid ?? ''}</span></div>
      `;
    }
    // summon
    return `
      <div class="cg-card-top"><span class="cg-card-name">${card.name ?? 'Summon'}</span><span class="cg-hcard-cost">${card.summonCost ?? ''}</span></div>
      ${card.cardType ? `<div class="cg-type-label">${card.cardType}</div>` : ''}
      <div class="cg-card-art-wrap">${_cardArtImg(card)}</div>
      <div class="cg-hp-bar-wrap"><div class="cg-hp-bar" style="width:100%;background:#4ab87c"></div></div>
      <div class="cg-card-stats"><span class="cg-stat-hp">HP ${card.hp}</span><span class="cg-stat-pow">POW ${card.power}</span></div>
      ${card.ability?.desc ? `<div class="cg-ability-panel">${card.ability.desc}</div>` : ''}
      <div class="cg-card-bottom">${_rarityBadge(card)}<div class="cg-terrain-circle">${_terrainCircle(card)}</div><span class="cg-card-uid">${card.cardUid ?? ''}</span></div>
    `;
  },

  // ── Decks ──────────────────────────────────────────────────────────────────

  _renderDecks(content) {
    const customDecks = (GameState.deck.customDecks ?? []).map(d => ({
      ...d,
      art:         d.art         ?? '🃏',
      color:       d.color       ?? '#3a3060',
      description: d.description ?? 'Custom deck',
    }));
    const allDecks = [...STORY_STARTER_DECKS, ...customDecks];

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'inv-section-title';
    sectionTitle.textContent = `${allDecks.length} deck${allDecks.length !== 1 ? 's' : ''}`;
    content.appendChild(sectionTitle);

    if (!allDecks.length) {
      const empty = document.createElement('p');
      empty.className = 'inv-empty';
      empty.textContent = 'No decks yet.';
      content.appendChild(empty);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'inv-deck-grid';

    allDecks.forEach(deck => {
      const tile = document.createElement('div');
      tile.className = 'inv-deck-icon-tile';
      tile.style.cssText += 'cursor:pointer';
      tile.style.setProperty('--deck-color', deck.color ?? '#5a3a8a');

      const firstElite = deck.elites?.[0];
      const deckArtHtml = firstElite?.artFile
        ? `<img src="${ART_BASE}${firstElite.artFile}" alt="${firstElite.name}" class="inv-deck-elite-img">`
        : `<span>${firstElite?.art ?? deck.art ?? '🃏'}</span>`;

      const vd = validateDeck(deck);
      tile.innerHTML = `
        <div class="inv-deck-icon-art">${deckArtHtml}</div>
        <div class="inv-deck-icon-name">${deck.name}</div>
        <div class="inv-deck-icon-tooltip">
          <div class="inv-dit-name">${deck.name}</div>
          ${deck.description ? `<div class="inv-dit-desc">${deck.description}</div><div class="inv-dit-divider"></div>` : ''}
          <div class="inv-dit-row"><span>👑 Champions</span><span>${deck.champions?.length ?? 0}</span></div>
          <div class="inv-dit-row"><span>🐉 Elites</span><span>${deck.elites?.length ?? 0} / 10</span></div>
          <div class="inv-dit-row"><span>✨ Summons</span><span>${deck.summons?.length ?? 0} / 40+</span></div>
          <div class="inv-dit-row"><span>🔮 Spells</span><span>${deck.spells?.length ?? 0} / 10</span></div>
          <div class="inv-dit-status ${vd.valid ? 'inv-dit-valid' : 'inv-dit-invalid'}" style="margin-top:6px">${vd.valid ? '✓ Valid' : '✗ Invalid'}</div>
        </div>
      `;

      tile.addEventListener('click', () => this._showDeckEditModal(deck));
      grid.appendChild(tile);
    });

    content.appendChild(grid);
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

    const grid = document.createElement('div');
    grid.className = 'inv-deck-grid';

    boxes.forEach((box, idx) => {
      const def = LOOT_BOX_TYPES[box.boxTypeId] ?? LOOT_BOX_TYPES.small;

      const tile = document.createElement('div');
      tile.className = 'inv-loot-tile';
      tile.style.setProperty('--deck-color', def.color ?? '#5a3a8a');
      tile.innerHTML = `
        <div class="inv-deck-icon-art"><span>${box.icon || def.icon || '📦'}</span></div>
        <div class="inv-deck-icon-name">${box.label ?? def.label}</div>
      `;
      tile.addEventListener('click', () => this._showLootBoxModal(idx, content));
      grid.appendChild(tile);
    });

    content.appendChild(grid);
  },

  _showLootBoxModal(idx, content) {
    const boxes = GameState.inventory.lootBoxes;
    const box   = boxes[idx];
    if (!box) return;
    const def        = LOOT_BOX_TYPES[box.boxTypeId] ?? LOOT_BOX_TYPES.small;
    const totalCards = def.packCount * 6;

    const overlay = document.createElement('div');
    overlay.className = 'inv-center-overlay';

    const modal = document.createElement('div');
    modal.className = 'inv-center-modal';
    modal.innerHTML = `
      <div class="inv-modal-icon">${box.icon || def.icon || '📦'}</div>
      <div class="inv-modal-title">${box.label ?? def.label}</div>
      <div class="inv-modal-desc">${(def.description ?? '').replace(/\n/g, '<br>')}</div>
      <div class="inv-modal-meta">${def.packCount} pack${def.packCount !== 1 ? 's' : ''} · ${totalCards} cards · Each pack guarantees 1× B rank+</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'inv-modal-actions';

    const openBtn = document.createElement('button');
    openBtn.className = 'btn-primary';
    openBtn.textContent = '✦ Open';
    openBtn.addEventListener('click', () => { overlay.remove(); this._openLootBox(idx, content); });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-back';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => overlay.remove());

    actions.appendChild(openBtn);
    actions.appendChild(cancelBtn);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.dataset.invModal = '1';
    document.body.appendChild(overlay);
  },

  _showDeckEditModal(deck) {
    const overlay = document.createElement('div');
    overlay.className = 'inv-center-overlay';

    const modal = document.createElement('div');
    modal.className = 'inv-center-modal';

    const firstElite = deck.elites?.[0];
    const artHtml = firstElite?.artFile
      ? `<img src="${ART_BASE}${firstElite.artFile}" alt="${firstElite.name}" class="inv-modal-deck-img">`
      : `<div class="inv-modal-icon">${firstElite?.art ?? deck.art ?? '🃏'}</div>`;

    modal.innerHTML = `
      ${artHtml}
      <div class="inv-modal-title">${deck.name}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'inv-modal-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-primary';
    editBtn.textContent = '✏️ Edit Deck';
    editBtn.addEventListener('click', () => {
      overlay.remove();
      EventBus.emit('screen:push', { screen: DeckBuilderScreen, params: { deck } });
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-back';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => overlay.remove());

    actions.appendChild(editBtn);
    actions.appendChild(cancelBtn);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.dataset.invModal = '1';
    document.body.appendChild(overlay);
  },

  _openLootBox(idx, content) {
    const boxes = GameState.inventory.lootBoxes;
    const box   = boxes[idx];
    if (!box) return;

    const packs = openLootBox(box.boxTypeId ?? 'small');
    boxes.splice(idx, 1);

    content.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'inv-section-title';
    header.textContent = `Opening: ${box.label ?? 'Loot Box'} — ${packs.length} pack${packs.length !== 1 ? 's' : ''}, ${packs.length * 6} cards`;
    content.appendChild(header);

    const revealArea = document.createElement('div');
    revealArea.className = 'inv-reveal-area';

    const allCards = [];

    // Animation timing constants
    const STAGGER       = 0.08;   // s between cards within a pack
    const ANIM_DUR      = 0.38;   // s for the slide-in
    const PACK_GAP      = 0.28;   // s pause after last card of each pack before next
    const PACK_INTERVAL = STAGGER * 6 + ANIM_DUR + PACK_GAP; // ~1.12s per pack

    packs.forEach((pack, packIdx) => {
      const packSection = document.createElement('div');
      packSection.className = 'inv-pack-section';

      const packLabel = document.createElement('div');
      packLabel.className = 'inv-pack-label';
      packLabel.textContent = packs.length > 1 ? `Pack ${packIdx + 1}` : 'Booster Pack';
      packSection.appendChild(packLabel);

      const packGrid = document.createElement('div');
      packGrid.className = 'inv-pack-grid';

      pack.forEach((card, cardIdx) => {
        allCards.push(card);
        const tile = this._buildCardTile(card);

        const slideDelay = packIdx * PACK_INTERVAL + cardIdx * STAGGER;
        const glowDelay  = slideDelay + ANIM_DUR;
        const isGlow     = card.rarity === 'S' || card.rarity === 'A';

        if (isGlow) {
          tile.classList.add('inv-rank-glow');
          tile.style.setProperty('--rank-glow-color', RARITY_COLOR[card.rarity] ?? '#c07820');
          tile.style.animation = [
            `card-slide-in ${ANIM_DUR}s cubic-bezier(0.22,0.61,0.36,1) ${slideDelay}s both`,
            `rank-glow-pulse 2s ease-in-out ${glowDelay}s infinite`,
          ].join(', ');
        } else {
          tile.style.animation =
            `card-slide-in ${ANIM_DUR}s cubic-bezier(0.22,0.61,0.36,1) ${slideDelay}s both`;
        }

        // Play card slide SFX in sync with each card's animation start
        setTimeout(() => SoundSystem.cardSlide(), slideDelay * 1000);

        packGrid.appendChild(tile);
      });

      packSection.appendChild(packGrid);
      revealArea.appendChild(packSection);

      // Scroll to this pack section as its first card begins sliding in
      const scrollAt = (packIdx * PACK_INTERVAL + 0.05) * 1000;
      setTimeout(() => {
        packSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, scrollAt);
    });

    content.appendChild(revealArea);

    // Summary + collect button fade in after all packs finish
    const totalMs = (packs.length * PACK_INTERVAL + ANIM_DUR) * 1000;

    const summary = document.createElement('div');
    summary.className = 'inv-reveal-summary';
    summary.style.cssText = 'opacity:0;transition:opacity 0.5s ease';
    const rarityCount = {};
    allCards.forEach(c => { rarityCount[c.rarity] = (rarityCount[c.rarity] || 0) + 1; });
    const summaryParts = ['S','A','B','C']
      .filter(r => rarityCount[r])
      .map(r => `<span style="color:${RARITY_COLOR[r] ?? '#888'}">${r}: ${rarityCount[r]}</span>`);
    summary.innerHTML = `${allCards.length} cards obtained — ${summaryParts.join(' · ')}`;
    content.appendChild(summary);

    const collectBtn = document.createElement('button');
    collectBtn.className = 'btn-primary inv-deck-edit-btn';
    collectBtn.style.cssText = 'opacity:0;pointer-events:none;transition:opacity 0.5s ease';
    collectBtn.textContent = `✓ Collect All (${allCards.length} cards)`;
    collectBtn.addEventListener('click', () => {
      allCards.forEach(card => GameState.addCardToCollection(card.cardId));
      this._renderTabContent(content);
    });
    content.appendChild(collectBtn);

    setTimeout(() => {
      summary.style.opacity = '1';
      collectBtn.style.opacity = '1';
      collectBtn.style.pointerEvents = '';
      content.scrollTo({ top: content.scrollHeight, behavior: 'smooth' });
    }, totalMs);
  },

  // ── Key Items ──────────────────────────────────────────────────────────────

  _renderKeyItems(content) {
    const empty = document.createElement('p');
    empty.className = 'inv-empty';
    empty.textContent = 'Nothing here yet.';
    content.appendChild(empty);
  },

  update(dt) {},
};

export default InventoryScreen;
