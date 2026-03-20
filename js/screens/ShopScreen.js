/**
 * ShopScreen — shows merchant's wares, handles buy transactions.
 * Params: { shopId, shopName }
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import { ITEMS, SHOP_STOCK, LOOT_BOX_TYPES } from '../Data.js';

const ShopScreen = {
  _container: null,
  _shopId: null,
  _shopName: null,
  _itemMap: {},
  _stock: [],

  mount(container, params = {}) {
    this._container = container;
    this._shopId   = params.shopId   ?? 'general_shop';
    this._shopName = params.shopName ?? 'Shop';

    this._itemMap = {};
    ITEMS.forEach(it => { this._itemMap[it.itemId] = it; });

    const shopEntry = SHOP_STOCK.find(s => s.shopId === this._shopId);
    this._stock = shopEntry?.stock ?? [];

    if (!GameState.shops[this._shopId]) {
      GameState.shops[this._shopId] = { purchasedCounts: {} };
    }

    this._render();
  },

  unmount() {
    this._container = null;
    EventBus.emit('shop:closed');
  },

  _render() {
    const c = this._container;
    c.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'shop-screen fade-in';

    // Header
    const header = document.createElement('div');
    header.className = 'screen-header';
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back';
    backBtn.textContent = '← Back';
    backBtn.addEventListener('click', () => EventBus.emit('screen:pop'));
    const title = document.createElement('h2');
    title.textContent = `🛒 ${this._shopName}`;
    header.appendChild(backBtn);
    header.appendChild(title);

    const coinDisplay = document.createElement('span');
    coinDisplay.id = 'shop-coin';
    coinDisplay.style.cssText = 'margin-left:auto;color:var(--color-gold);font-weight:600';
    coinDisplay.textContent = `🪙 ${GameState.player.coin} coins`;
    header.appendChild(coinDisplay);
    screen.appendChild(header);

    // Stock grid
    const stockArea = document.createElement('div');
    stockArea.className = 'shop-body';

    const grid = document.createElement('div');
    grid.className = 'shop-stock';
    grid.id = 'shop-grid';
    this._renderStock(grid);
    stockArea.appendChild(grid);
    screen.appendChild(stockArea);
    c.appendChild(screen);
  },

  _renderStock(grid) {
    grid.innerHTML = '';
    const shopState = GameState.shops[this._shopId];

    this._stock.forEach(entry => {
      const isLootBox = !!entry.lootBoxId;
      const lootDef   = isLootBox ? (LOOT_BOX_TYPES[entry.lootBoxId] ?? {}) : null;
      const item      = isLootBox ? null : this._itemMap[entry.itemId];

      const stockKey  = isLootBox ? `lootbox_${entry.lootBoxId}` : entry.itemId;
      const purchased = shopState.purchasedCounts[stockKey] ?? 0;
      const available = entry.stock === -1 ? Infinity : (entry.stock - purchased);
      const outOfStock = available <= 0;

      const icon  = isLootBox ? (lootDef.icon ?? '📦')  : (item?.icon ?? '📦');
      const name  = isLootBox ? (lootDef.label ?? entry.lootBoxId) : (item?.name ?? entry.itemId);
      const desc  = isLootBox ? `${lootDef.packCount} pack${lootDef.packCount !== 1 ? 's' : ''} · ${lootDef.packCount * 6} cards` : '';

      const el = document.createElement('div');
      el.className = 'shop-item' + (outOfStock ? ' out-of-stock' : '');
      el.innerHTML = `
        <div class="shop-item-icon">${icon}</div>
        <div class="shop-item-name">${name}</div>
        ${desc ? `<div class="shop-item-desc" style="font-size:0.8em;color:var(--color-text-dim)">${desc}</div>` : ''}
        <div class="shop-item-price">🪙 ${entry.price}</div>
        <div class="shop-item-stock">${entry.stock === -1 ? '∞' : `${available} left`}</div>
      `;

      if (!outOfStock) {
        el.addEventListener('click', () => this._buy(entry, { isLootBox, lootDef, item, stockKey, name }));
      }

      grid.appendChild(el);
    });
  },

  _buy(entry, { isLootBox, lootDef, item, stockKey, name }) {
    if (GameState.player.coin < entry.price) {
      EventBus.emit('toast', { message: 'Not enough coins!', type: 'error' });
      return;
    }

    const shopState = GameState.shops[this._shopId];
    const purchased = shopState.purchasedCounts[stockKey] ?? 0;
    const available = entry.stock === -1 ? Infinity : (entry.stock - purchased);
    if (available <= 0) {
      EventBus.emit('toast', { message: 'Out of stock!', type: 'error' });
      return;
    }

    GameState.addCoin(-entry.price);
    if (isLootBox) {
      GameState.addLootBox({ boxTypeId: entry.lootBoxId, label: lootDef?.label, icon: lootDef?.icon });
    } else {
      GameState.addItem(entry.itemId, 1);
    }
    shopState.purchasedCounts[stockKey] = purchased + 1;

    EventBus.emit('toast', { message: `Bought ${name}!`, type: 'success' });
    EventBus.emit('shop:purchased', { itemId: stockKey, shopId: this._shopId });

    // Refresh
    const grid = document.getElementById('shop-grid');
    const coinEl = document.getElementById('shop-coin');
    if (grid)   this._renderStock(grid);
    if (coinEl) coinEl.textContent = `🪙 ${GameState.player.coin} coins`;
  },

  update(dt) {},
};

export default ShopScreen;
