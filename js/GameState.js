/**
 * GameState — single source of truth for all mutable game data.
 * Never mutate directly from the outside; use the helper methods.
 * Systems read from this; EventBus carries the news of changes.
 */
const GameState = {
  version: 1,

  player: {
    name: 'Student',
    level: 1,
    gold: 100,
    xp: 0,
    xpToNext: 100,
  },

  progression: {
    currentLocation: 'academy_courtyard',
    unlockedLocations: ['academy_courtyard'],
    gameFlags: {},   // boolean/string key-value: backbone of all branching logic
  },

  inventory: {
    items: [],       // [{ itemId, quantity }]
    maxSlots: 20,
  },

  deck: {
    activeDeck: ['ember_bolt', 'ember_bolt', 'frost_shard', 'frost_shard',
                 'shield_wall', 'shield_wall', 'healing_light', 'healing_light'],
    collection: ['ember_bolt', 'ember_bolt', 'frost_shard', 'frost_shard',
                 'shield_wall', 'shield_wall', 'healing_light', 'healing_light',
                 'arcane_blast', 'thunder_strike'],
    maxDeckSize: 20,
  },

  relationships: {
    aria:          { points: 0, tier: 0, name: 'Aria',          portrait: '🧙‍♀️' },
    master_aldric: { points: 0, tier: 0, name: 'Master Aldric', portrait: '🧓' },
    zephyr:        { points: 0, tier: 0, name: 'Zephyr',        portrait: '🧝' },
  },

  quests: {
    active:    [],
    completed: [],
    failed:    [],
  },

  cardGame: {
    active:          false,
    opponentNpcId:   null,
    playerHand:      [],
    opponentHand:    [],
    playerHP:        20,
    opponentHP:      20,
    playerMaxHP:     20,
    opponentMaxHP:   20,
    playerMana:      1,
    playerMaxMana:   1,
    opponentMana:    1,
    opponentMaxMana: 1,
    playerDeck:      [],
    opponentDeck:    [],
    playerDiscard:   [],
    opponentDiscard: [],
    playerShield:    0,
    opponentShield:  0,
    turn:            'player',
    turnNumber:      0,
    log:             [],
    selectedCardIdx: null,
  },

  shops: {},   // { shopId: { purchasedCounts: { itemId: count } } }

  settings: {
    musicVolume: 0.7,
    sfxVolume:   1.0,
    textSpeed:   'normal',   // 'slow' | 'normal' | 'fast' | 'instant'
    fullscreen:  false,
  },

  // ──────────────────────────────────────────
  // Helper methods
  // ──────────────────────────────────────────

  setFlag(key, value = true) {
    this.progression.gameFlags[key] = value;
  },

  getFlag(key) {
    return this.progression.gameFlags[key];
  },

  addGold(amount) {
    this.player.gold = Math.max(0, this.player.gold + amount);
  },

  addItem(itemId, qty = 1) {
    const slot = this.inventory.items.find(s => s.itemId === itemId);
    if (slot) {
      slot.quantity += qty;
    } else {
      this.inventory.items.push({ itemId, quantity: qty });
    }
  },

  removeItem(itemId, qty = 1) {
    const idx = this.inventory.items.findIndex(s => s.itemId === itemId);
    if (idx === -1) return false;
    this.inventory.items[idx].quantity -= qty;
    if (this.inventory.items[idx].quantity <= 0) {
      this.inventory.items.splice(idx, 1);
    }
    return true;
  },

  hasItem(itemId, qty = 1) {
    const slot = this.inventory.items.find(s => s.itemId === itemId);
    return slot ? slot.quantity >= qty : false;
  },

  getRelationship(npcId) {
    return this.relationships[npcId] || null;
  },

  addRelationshipPoints(npcId, points) {
    const rel = this.relationships[npcId];
    if (!rel) return;
    rel.points = Math.min(100, Math.max(0, rel.points + points));
    rel.tier = this._calcTier(rel.points);
  },

  _calcTier(points) {
    if (points >= 80) return 4;
    if (points >= 60) return 3;
    if (points >= 40) return 2;
    if (points >= 20) return 1;
    return 0;
  },

  unlockLocation(locationId) {
    if (!this.progression.unlockedLocations.includes(locationId)) {
      this.progression.unlockedLocations.push(locationId);
    }
  },

  isLocationUnlocked(locationId) {
    return this.progression.unlockedLocations.includes(locationId);
  },

  addCardToCollection(cardId) {
    this.deck.collection.push(cardId);
  },

  addCardToDeck(cardId) {
    if (this.deck.activeDeck.length < this.deck.maxDeckSize) {
      this.deck.activeDeck.push(cardId);
    }
  },

  removeCardFromDeck(cardId) {
    const idx = this.deck.activeDeck.indexOf(cardId);
    if (idx !== -1) this.deck.activeDeck.splice(idx, 1);
  },

  /** Serialize state for saving (deep-clone). */
  serialize() {
    return JSON.parse(JSON.stringify({
      version:      this.version,
      player:       this.player,
      progression:  this.progression,
      inventory:    this.inventory,
      deck:         this.deck,
      relationships: this.relationships,
      quests:       this.quests,
      shops:        this.shops,
      settings:     this.settings,
    }));
  },

  /** Restore state from a saved snapshot. */
  deserialize(data) {
    this.version      = data.version      ?? 1;
    this.player       = data.player       ?? this.player;
    this.progression  = data.progression  ?? this.progression;
    this.inventory    = data.inventory    ?? this.inventory;
    this.deck         = data.deck         ?? this.deck;
    this.relationships = data.relationships ?? this.relationships;
    this.quests       = data.quests       ?? this.quests;
    this.shops        = data.shops        ?? this.shops;
    this.settings     = { ...this.settings, ...(data.settings ?? {}) };
    // cardGame is always reset on load
    this.cardGame.active = false;
  },
};

export default GameState;
