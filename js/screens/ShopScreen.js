/**
 * ShopScreen — shows merchant's wares, handles buy transactions.
 * Params: { shopId, shopName }
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import { ITEMS, SHOP_STOCK } from '../Data.js';

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

    const goldDisplay = document.createElement('span');
    goldDisplay.id = 'shop-gold';
    goldDisplay.style.cssText = 'margin-left:auto;color:var(--color-gold);font-weight:600';
    goldDisplay.textContent = `Gold: ${GameState.player.gold}`;
    header.appendChild(goldDisplay);
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
      const item = this._itemMap[entry.itemId];
      const purchased = shopState.purchasedCounts[entry.itemId] ?? 0;
      const available = entry.stock === -1 ? Infinity : (entry.stock - purchased);
      const outOfStock = available <= 0;

      const el = document.createElement('div');
      el.className = 'shop-item' + (outOfStock ? ' out-of-stock' : '');
      el.innerHTML = `
        <div class="shop-item-icon">${item?.icon ?? '📦'}</div>
        <div class="shop-item-name">${item?.name ?? entry.itemId}</div>
        <div class="shop-item-price">💰 ${entry.price}</div>
        <div class="shop-item-stock">${entry.stock === -1 ? '∞' : `${available} left`}</div>
      `;

      if (!outOfStock) {
        el.addEventListener('click', () => this._buy(entry, item));
      }

      grid.appendChild(el);
    });
  },

  _buy(entry, itemData) {
    if (GameState.player.gold < entry.price) {
      EventBus.emit('toast', { message: 'Not enough gold!', type: 'error' });
      return;
    }

    const shopState = GameState.shops[this._shopId];
    const purchased = shopState.purchasedCounts[entry.itemId] ?? 0;
    const available = entry.stock === -1 ? Infinity : (entry.stock - purchased);
    if (available <= 0) {
      EventBus.emit('toast', { message: 'Out of stock!', type: 'error' });
      return;
    }

    GameState.addGold(-entry.price);
    GameState.addItem(entry.itemId, 1);
    shopState.purchasedCounts[entry.itemId] = purchased + 1;

    EventBus.emit('toast', { message: `Bought ${itemData?.name ?? entry.itemId}!`, type: 'success' });
    EventBus.emit('shop:purchased', { itemId: entry.itemId, shopId: this._shopId });

    // Refresh
    const grid = document.getElementById('shop-grid');
    const goldEl = document.getElementById('shop-gold');
    if (grid) this._renderStock(grid);
    if (goldEl) goldEl.textContent = `Gold: ${GameState.player.gold}`;
  },

  update(dt) {},
};

export default ShopScreen;
