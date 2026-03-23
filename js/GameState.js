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
    coin: 100000,
    gemstones: 0,
    xp: 0,
    xpToNext: 100,
    charisma: 0,   // 0–100; increases with level; unlocks charisma-gated dialogue
  },

  progression: {
    currentLocation: 'academy_courtyard',
    unlockedLocations: ['academy_courtyard', 'library', 'dueling_grounds', 'market', 'dormitory', 'headmaster_office'],
    gameFlags: {},   // boolean/string key-value: backbone of all branching logic
  },

  inventory: {
    items: [],       // [{ itemId, quantity }]
    maxSlots: 20,
    lootBoxes: [],   // [{ label, icon, cards: [cardId, ...] }]
  },

  deck: {
    activeDeckId: 'story_ember_adept',
    activeDeck: ['ember_bolt', 'ember_bolt', 'frost_shard', 'frost_shard',
                 'shield_wall', 'shield_wall', 'healing_light', 'healing_light'],
    collection: ['ember_bolt', 'ember_bolt', 'frost_shard', 'frost_shard',
                 'shield_wall', 'shield_wall', 'healing_light', 'healing_light',
                 'arcane_blast', 'thunder_strike'],
    maxDeckSize: 20,
    // IDs of STARTER_DECKS the player owns; all 3 are available from the start
    savedDeckIds: ['blitz_rush', 'iron_bulwark', 'arcane_balance'],
  },

  relationships: {
    aria:               { points: 0, tier: 0, name: 'Aria',           portrait: '🧙‍♀️' },
    master_aldric:      { points: 0, tier: 0, name: 'Master Aldric',  portrait: '🧓' },
    zephyr:             { points: 0, tier: 0, name: 'Zephyr',         portrait: '🧝' },
    conj_elder_rook:    { points: 0, tier: 0, name: 'Elder Rook',     portrait: '🔮', isConjurer: true },
    conj_lira_solstice: { points: 0, tier: 0, name: 'Lira Solstice',  portrait: '✨', isConjurer: true },
    conj_malachar:      { points: 0, tier: 0, name: 'Malachar',       portrait: '🔥', isConjurer: true },
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

  // Conjurer companion tracking
  companions: {
    conj_elder_rook:    { friendshipPoints: 0, isCompanion: false, cardUnlocked: false, romanced: false },
    conj_lira_solstice: { friendshipPoints: 0, isCompanion: false, cardUnlocked: false, romanced: false },
    conj_malachar:      { friendshipPoints: 0, isCompanion: false, cardUnlocked: false, romanced: false },
  },

  gameTime: {
    startedAt: null,  // real timestamp when session began (ms); null = set on first use
    baseHour:  8,     // in-game hour at session start (0–23)
  },

  chapters: {
    current: 1,
    unlocked: [1],
  },

  settings: {
    musicVolume: 0.7,
    sfxVolume:   1.0,
    textSpeed:   'normal',   // 'slow' | 'normal' | 'fast' | 'instant'
    fullscreen:  false,
    font:        'merienda',
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

  addCoin(amount) {
    this.player.coin = Math.max(0, this.player.coin + amount);
  },

  addGemstones(amount) {
    this.player.gemstones = Math.max(0, (this.player.gemstones ?? 0) + amount);
  },

  addCharisma(amount) {
    this.player.charisma = Math.min(100, Math.max(0, (this.player.charisma ?? 0) + amount));
  },

  addXp(amount) {
    if (this.player.level >= 100) return;
    this.player.xp += amount;
    while (this.player.xp >= this.player.xpToNext && this.player.level < 100) {
      this.player.xp      -= this.player.xpToNext;
      this.player.level   += 1;
      this.player.xpToNext = Math.floor(this.player.xpToNext * 1.4);
      this.addCharisma(10);
    }
    if (this.player.level >= 100) this.player.xp = 0;
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

  addLootBox(box) {
    // box: { boxTypeId, label, icon } — cards generated on open
    this.inventory.lootBoxes.push(box);
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

  /** Add friendship points to a conjurer companion; check if they should join. */
  addCompanionFriendship(conjurerId, points) {
    const c = this.companions[conjurerId];
    if (!c) return;
    c.friendshipPoints = Math.min(100, Math.max(0, c.friendshipPoints + points));
  },

  /** Mark a conjurer as a companion and unlock their card in key items. */
  unlockCompanion(conjurerId) {
    const c = this.companions[conjurerId];
    if (!c) return;
    c.isCompanion = true;
    c.cardUnlocked = true;
    this.setFlag(`conj_${conjurerId}_companion`, true);
  },

  /** Set romance status for a conjurer companion. */
  setCompanionRomanced(conjurerId, value = true) {
    const c = this.companions[conjurerId];
    if (!c) return;
    c.romanced = value;
    this.setFlag(`${conjurerId}_romanced`, value);
  },

  /** Lazily initialise game clock — call before reading gameTime. */
  initGameClock() {
    if (!this.gameTime.startedAt) this.gameTime.startedAt = Date.now();
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
      companions:   this.companions,
      settings:     this.settings,
      gameTime:     this.gameTime,
    }));
  },

  /** Restore state from a saved snapshot. */
  deserialize(data) {
    this.version      = data.version      ?? 1;
    const _pd = data.player ?? {};
    this.player       = { coin: 100000, gemstones: 0, charisma: 0, ...this.player, ..._pd };
    // Backfill coin from old saves that used 'gold'
    if (_pd.gold !== undefined && _pd.coin === undefined) this.player.coin = _pd.gold;
    this.progression  = data.progression  ?? this.progression;
    this.inventory    = { lootBoxes: [], ...this.inventory, ...(data.inventory ?? {}) };
    this.deck         = { savedDeckIds: ['blitz_rush', 'iron_bulwark', 'arcane_balance'], ...this.deck, ...(data.deck ?? {}) };
    this.relationships = { ...this.relationships, ...(data.relationships ?? {}) };
    this.quests       = data.quests       ?? this.quests;
    this.shops        = data.shops        ?? this.shops;
    this.companions   = { ...this.companions, ...(data.companions ?? {}) };
    this.settings     = { ...this.settings, ...(data.settings ?? {}) };
    this.gameTime     = { startedAt: null, baseHour: 8, ...(data.gameTime ?? {}) };
    // cardGame is always reset on load
    this.cardGame.active = false;
  },
};

export default GameState;
