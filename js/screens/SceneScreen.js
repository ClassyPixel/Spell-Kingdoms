/**
 * SceneScreen — shows the location backdrop and NPC sprites.
 * Clicking an NPC starts a dialogue.
 * Left sidebar: player info, game clock, menu buttons.
 * Bottom bar: location name + "Open Map" button.
 */
import EventBus           from '../EventBus.js';
import GameState           from '../GameState.js';
import { NPCS, LOCATIONS, STARTER_DECKS } from '../Data.js';
import InventoryScreen     from './InventoryScreen.js';
import DeckBuilderScreen   from './DeckBuilderScreen.js';
import QuestJournalScreen  from './QuestJournalScreen.js';
import SettingsScreen      from './SettingsScreen.js';

const SceneScreen = {
  _container:  null,
  _locationId: null,
  _clockTimer: null,

  mount(container, params = {}) {
    this._container = container;
    this._locationId = params.locationId ?? GameState.progression.currentLocation;
    GameState.initGameClock();

    const location = LOCATIONS.find(l => l.id === this._locationId) ?? {
      id: this._locationId, name: this._locationId, description: '', icon: '🏛️', bgIcon: '🏛️',
    };
    const locationNpcs = NPCS.filter(n => n.location === this._locationId);
    this._render(location, locationNpcs);
  },

  unmount() {
    if (this._clockTimer) clearInterval(this._clockTimer);
    this._clockTimer = null;
    this._container = null;
  },

  // ── Clock helpers ───────────────────────────────────────────────────────────

  _getGameTime() {
    const { startedAt, baseHour } = GameState.gameTime;
    const elapsedMins = (Date.now() - startedAt) / 60000; // real minutes = game hours
    const totalHours  = (baseHour + elapsedMins) % 24;
    const h = Math.floor(totalHours);
    const m = Math.floor((totalHours % 1) * 60);
    return { h, m };
  },

  _timePeriod(h) {
    if (h >= 5  && h < 12) return '🌅 Morning';
    if (h >= 12 && h < 14) return '☀️ Noon';
    if (h >= 14 && h < 20) return '🌆 Evening';
    return '🌙 Night';
  },

  _updateClockEl(el) {
    const { h, m } = this._getGameTime();
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    el.innerHTML = `
      <div class="sidebar-time">${hh}:${mm}</div>
      <div class="sidebar-period">${this._timePeriod(h)}</div>
    `;
  },

  // ── Active deck display name ────────────────────────────────────────────────

  _deckLabel() {
    const active = GameState.deck.activeDeck;
    // Try to match against a saved starter deck by comparing card sets
    const match = STARTER_DECKS.find(d => {
      const allCards = [...d.elites, ...d.summons, ...d.spells];
      return allCards.length === active.length &&
        allCards.every((id, i) => id === active[i]);
    });
    return match ? match.name : `Active Deck · ${active.length} cards`;
  },

  // ── Sidebar ─────────────────────────────────────────────────────────────────

  _buildSidebar() {
    const sidebar = document.createElement('div');
    sidebar.className = 'scene-sidebar';

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'sidebar-avatar';
    avatar.textContent = '🧑‍🎓';

    // Player name
    const nameEl = document.createElement('div');
    nameEl.className = 'sidebar-player-name';
    nameEl.textContent = GameState.player.name;

    // Level
    const levelEl = document.createElement('div');
    levelEl.className = 'sidebar-stat';
    levelEl.textContent = `Lv. ${GameState.player.level}`;

    // Deck
    const deckEl = document.createElement('div');
    deckEl.className = 'sidebar-stat sidebar-deck-label';
    deckEl.textContent = `🃏 ${this._deckLabel()}`;

    // Clock
    const clockEl = document.createElement('div');
    clockEl.className = 'sidebar-clock';
    clockEl.id = 'scene-sidebar-clock';
    this._updateClockEl(clockEl);

    // Divider
    const divider = document.createElement('div');
    divider.className = 'sidebar-divider';

    // Menu buttons
    const NAV_BUTTONS = [
      { label: '🎒 Inventory',    action: () => EventBus.emit('screen:push', { screen: InventoryScreen,    params: {} }) },
      { label: '🃏 Deck Builder', action: () => EventBus.emit('screen:push', { screen: DeckBuilderScreen,  params: {} }) },
      { label: '📜 Quest Journal',action: () => EventBus.emit('screen:push', { screen: QuestJournalScreen, params: {} }) },
      { label: '💾 Save / Load',  action: () => EventBus.emit('menu:open') },
      { label: '⚙️ Settings',    action: () => EventBus.emit('screen:push', { screen: SettingsScreen,     params: {} }) },
      { label: '🚪 Exit Game',   action: () => EventBus.emit('game:returnToTitle') },
    ];

    sidebar.appendChild(avatar);
    sidebar.appendChild(nameEl);
    sidebar.appendChild(levelEl);
    sidebar.appendChild(deckEl);
    sidebar.appendChild(clockEl);
    sidebar.appendChild(divider);

    NAV_BUTTONS.forEach(({ label, action }) => {
      const btn = document.createElement('button');
      btn.className = 'sidebar-nav-btn';
      btn.textContent = label;
      btn.addEventListener('click', action);
      sidebar.appendChild(btn);
    });

    // Start clock ticker (every second)
    this._clockTimer = setInterval(() => {
      const el = document.getElementById('scene-sidebar-clock');
      if (el) this._updateClockEl(el);
    }, 1000);

    return sidebar;
  },

  // ── Main render ─────────────────────────────────────────────────────────────

  _render(location, npcs) {
    const c = this._container;
    c.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'scene-screen fade-in';

    // Sidebar
    screen.appendChild(this._buildSidebar());

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'scene-backdrop';
    backdrop.innerHTML = `<div class="scene-backdrop-art">${location.bgIcon ?? location.icon ?? '🏛️'}</div>`;

    // NPC sprites
    const npcArea = document.createElement('div');
    npcArea.className = 'scene-npcs';

    if (npcs.length === 0) {
      const empty = document.createElement('p');
      empty.style.cssText = 'color:var(--color-text-dim);font-size:0.9em;margin-bottom:30px';
      empty.textContent = 'The area is quiet...';
      npcArea.appendChild(empty);
    }

    npcs.forEach(npc => {
      const el = document.createElement('div');
      el.className = 'scene-npc';
      el.innerHTML = `
        <div class="npc-sprite">${npc.portrait ?? '🧙'}</div>
        <div class="npc-name-tag">${npc.name}</div>
      `;
      el.addEventListener('click', () => this._talkTo(npc));
      npcArea.appendChild(el);
    });

    backdrop.appendChild(npcArea);
    screen.appendChild(backdrop);

    // Bottom bar
    const bar = document.createElement('div');
    bar.className = 'scene-bottom-bar';
    bar.innerHTML = `
      <div>
        <div class="scene-location-name">${location.name}</div>
        <div class="scene-location-desc">${location.description ?? ''}</div>
      </div>
    `;

    const actions = document.createElement('div');
    actions.className = 'scene-actions';

    const mapBtn = document.createElement('button');
    mapBtn.className = 'btn-scene';
    mapBtn.textContent = '🗺 Map';
    mapBtn.addEventListener('click', () => EventBus.emit('screen:pop'));

    actions.appendChild(mapBtn);
    bar.appendChild(actions);
    screen.appendChild(bar);

    c.appendChild(screen);
  },

  _talkTo(npc) {
    EventBus.emit('dialogue:start', { npcId: npc.id });
  },

  update(dt) {},
};

export default SceneScreen;
