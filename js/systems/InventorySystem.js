/**
 * InventorySystem — handles item use effects.
 *
 * Listens:
 *   inventory:useItem { itemId }
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import { ITEMS } from '../Data.js';

const InventorySystem = {
  _itemMap: {},

  init() {
    ITEMS.forEach(it => { this._itemMap[it.itemId] = it; });
    EventBus.on('inventory:useItem', (d) => this._use(d.itemId));
  },

  _use(itemId) {
    const item = this._itemMap[itemId];
    if (!item || !item.usable) return;
    if (!GameState.hasItem(itemId)) {
      EventBus.emit('toast', { message: `No ${item.name} left!`, type: 'error' });
      return;
    }

    const effect = item.effect;
    if (!effect) return;

    switch (effect.type) {
      case 'heal':
        GameState.player.hp = Math.min(
          GameState.player.maxHp ?? 20,
          (GameState.player.hp ?? 20) + (effect.value ?? 5)
        );
        // In card game context, heal player HP
        if (GameState.cardGame.active) {
          const cg = GameState.cardGame;
          cg.playerHP = Math.min(cg.playerMaxHP, cg.playerHP + (effect.value ?? 5));
          EventBus.emit('cardgame:stateChanged');
        }
        GameState.removeItem(itemId, 1);
        EventBus.emit('toast', { message: `Used ${item.name}: +${effect.value} HP`, type: 'success' });
        break;

      case 'mana':
        if (GameState.cardGame.active) {
          const cg = GameState.cardGame;
          cg.playerMana = Math.min(cg.playerMaxMana, cg.playerMana + (effect.value ?? 2));
          EventBus.emit('cardgame:stateChanged');
        }
        GameState.removeItem(itemId, 1);
        EventBus.emit('toast', { message: `Used ${item.name}: +${effect.value} Mana`, type: 'success' });
        break;

      case 'addCard':
        GameState.addCardToCollection(effect.cardId);
        GameState.removeItem(itemId, 1);
        EventBus.emit('toast', { message: `Learned: ${effect.cardId}`, type: 'success' });
        break;

      default:
        console.warn('[InventorySystem] Unknown item effect:', effect.type);
    }
  },
};

export default InventorySystem;
