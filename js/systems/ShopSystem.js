/**
 * ShopSystem — handles shop:open event and pushes ShopScreen.
 *
 * Listens:
 *   shop:open { shopId, shopName }
 */
import EventBus from '../EventBus.js';

let ShopScreen_ref = null;
export function setShopScreenRef(ref) { ShopScreen_ref = ref; }

const ShopSystem = {
  init() {
    EventBus.on('shop:open', (d) => this._open(d.shopId, d.shopName));
  },

  _open(shopId, shopName) {
    if (!ShopScreen_ref) return;
    EventBus.emit('screen:push', {
      screen: ShopScreen_ref,
      params: { shopId, shopName },
    });
  },
};

export default ShopSystem;
