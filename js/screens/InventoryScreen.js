/**
 * InventoryScreen — shows player's items in a grid with detail panel.
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import { ITEMS } from '../Data.js';

const InventoryScreen = {
  _container: null,
  _itemsMap: {},
  _selected: null,

  mount(container, params = {}) {
    this._container = container;
    this._itemsMap = {};
    ITEMS.forEach(it => { this._itemsMap[it.itemId] = it; });
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
    title.textContent = `🎒 Inventory (${GameState.inventory.items.length}/${GameState.inventory.maxSlots})`;
    header.appendChild(backBtn);
    header.appendChild(title);
    screen.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flex = '1';
    body.style.overflow = 'hidden';

    // Grid
    const grid = document.createElement('div');
    grid.className = 'inventory-grid';

    const slots = [];
    GameState.inventory.items.forEach(slot => {
      const item = this._itemsMap[slot.itemId];
      const el = document.createElement('div');
      el.className = 'inventory-slot filled';
      el.innerHTML = `
        <div class="item-icon">${item?.icon ?? '📦'}</div>
        <div class="item-qty">x${slot.quantity}</div>
      `;
      el.title = item?.name ?? slot.itemId;
      el.addEventListener('click', () => this._selectItem(slot.itemId, item));
      grid.appendChild(el);
    });

    // Empty slots
    const emptyCount = GameState.inventory.maxSlots - GameState.inventory.items.length;
    for (let i = 0; i < emptyCount; i++) {
      const el = document.createElement('div');
      el.className = 'inventory-slot empty';
      grid.appendChild(el);
    }

    body.appendChild(grid);

    // Detail panel
    const detail = document.createElement('div');
    detail.className = 'item-detail-panel';
    detail.id = 'inv-detail';
    detail.innerHTML = '<p style="color:var(--color-text-dim);font-size:0.85em">Select an item to view details</p>';
    body.appendChild(detail);

    screen.appendChild(body);
    c.appendChild(screen);
  },

  _selectItem(itemId, itemData) {
    this._selected = itemId;
    const panel = document.getElementById('inv-detail');
    if (!panel || !itemData) return;

    panel.innerHTML = `
      <div style="font-size:2.5em;text-align:center;margin-bottom:10px">${itemData.icon ?? '📦'}</div>
      <h3>${itemData.name}</h3>
      <p>${itemData.description ?? ''}</p>
      <p style="margin-top:10px;color:var(--color-text-dim);font-size:0.8em">Type: ${itemData.type ?? 'misc'}</p>
    `;

    if (itemData.usable) {
      const useBtn = document.createElement('button');
      useBtn.className = 'btn-primary';
      useBtn.style.marginTop = '12px';
      useBtn.style.width = '100%';
      useBtn.textContent = 'Use';
      useBtn.addEventListener('click', () => {
        EventBus.emit('inventory:useItem', { itemId });
      });
      panel.appendChild(useBtn);
    }
  },

  update(dt) {},
};

export default InventoryScreen;
