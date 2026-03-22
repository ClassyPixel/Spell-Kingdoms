/**
 * SceneScreen — shows the location backdrop and NPC sprites.
 * Clicking an NPC starts a dialogue.
 * Left sidebar: player info, game clock, menu buttons.
 * Bottom bar: location name + "Open Map" button.
 */
import EventBus           from '../EventBus.js';
import GameState           from '../GameState.js';
import { NPCS, LOCATIONS, WORLD_LOCATIONS, ITEMS, STORY_STARTER_DECKS, DIALOGUES } from '../Data.js';
import InventoryScreen     from './InventoryScreen.js';
import DeckBuilderScreen   from './DeckBuilderScreen.js';
import QuestJournalScreen  from './QuestJournalScreen.js';
import SettingsScreen      from './SettingsScreen.js';

const SceneScreen = {
  _container:       null,
  _locationId:      null,
  _areaId:          null,
  _prevAreaId:      null,
  _clockTimer:      null,
  _unsubHotelRest:  null,
  _narratorTimer:   null,

  mount(container, params = {}) {
    this._container = container;
    this._locationId = params.locationId ?? GameState.progression.currentLocation;
    // Restore the last visited area for this location if no specific area was requested
    const savedAreaMap = GameState.progression.currentAreaByLocation ?? {};
    this._areaId = params.areaId ?? savedAreaMap[this._locationId] ?? null;
    GameState.initGameClock();
    this._unsubHotelRest = EventBus.on('hotel:rest', (d) => this._doHotelRest(d));

    const location = LOCATIONS.find(l => l.id === this._locationId) ?? {
      id: this._locationId, name: this._locationId, description: '', icon: '🏛️', bgIcon: '🏛️',
    };
    const locationNpcs = NPCS.filter(n => n.location === this._locationId);
    this._render(location, locationNpcs);
  },

  unmount() {
    if (this._clockTimer) clearInterval(this._clockTimer);
    this._clockTimer = null;
    if (this._narratorTimer) { clearTimeout(this._narratorTimer); this._narratorTimer = null; }
    this._container  = null;
    this._areaId     = null;
    this._prevAreaId = null;
    if (this._unsubHotelRest) { this._unsubHotelRest(); this._unsubHotelRest = null; }
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
    const match = STORY_STARTER_DECKS.find(d => {
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
    avatar.innerHTML = `<img src="assets/images/CardGameArt/AvatarArt/playeravatar_img.JPG" alt="Player Avatar" class="sidebar-avatar-img">`;

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

    // Currency
    const coinEl = document.createElement('div');
    coinEl.className = 'sidebar-stat sidebar-currency';
    coinEl.innerHTML = `🪙 <span id="sidebar-coin-val">${GameState.player.coin}</span>`;

    const gemsEl = document.createElement('div');
    gemsEl.className = 'sidebar-stat sidebar-currency';
    gemsEl.innerHTML = `💎 <span id="sidebar-gems-val">${GameState.player.gemstones ?? 0}</span>`;

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
      { label: '🗺 Area Map',     action: () => this._showAreaMap() },
      { label: '📦 Objects',      action: () => this._showObjectsList() },
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
    sidebar.appendChild(coinEl);
    sidebar.appendChild(gemsEl);
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

    // Resolve current area (first area is default)
    const currentArea = location.areas
      ? (location.areas.find(a => a.id === this._areaId) ?? location.areas[0])
      : null;

    const screen = document.createElement('div');
    screen.className = 'scene-screen fade-in';

    // Sidebar
    screen.appendChild(this._buildSidebar());

    // Backdrop — use area bg if available, else fall back to location bg
    const backdrop = document.createElement('div');
    backdrop.className = 'scene-backdrop';
    const bgImage = currentArea?.bgImage ?? location.bgImage;
    const bgIcon  = currentArea?.bgIcon  ?? location.bgIcon ?? location.icon ?? '🏛️';
    if (bgImage) {
      backdrop.style.backgroundImage    = `url('${bgImage}')`;
      backdrop.style.backgroundSize     = 'cover';
      backdrop.style.backgroundPosition = 'center';
    }
    backdrop.innerHTML = bgImage
      ? ''
      : `<div class="scene-backdrop-art">${bgIcon}</div>`;

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
      el.className = 'scene-npc' +
        (npc.portraitImg              ? ' scene-npc--img'   : '') +
        (npc.scenePosition === 'right' ? ' scene-npc--right' : '');
      el.innerHTML = `
        <div class="npc-sprite">${npc.portraitImg ? `<img src="${npc.portraitImg}" alt="${npc.name}" class="npc-sprite-img">` : (npc.portrait ?? '🧙')}</div>
        <div class="npc-name-tag">${npc.name}</div>
      `;
      el.addEventListener('click', () => this._talkTo(npc));
      npcArea.appendChild(el);
    });

    backdrop.appendChild(npcArea);

    // Doors
    if (currentArea?.doors?.length) {
      this._renderDoors(currentArea.doors, backdrop);
    }

    // Treasures
    if (currentArea?.treasures?.length) {
      this._renderTreasures(currentArea.treasures, backdrop);
    }

    // Barrels
    if (currentArea?.barrels?.length) {
      this._renderBarrels(currentArea.barrels, backdrop);
    }

    // Decorative props (non-interactive objects)
    if (currentArea?.objects?.length) {
      this._renderObjects(currentArea.objects, backdrop);
    }

    screen.appendChild(backdrop);

    // Bottom bar — show area name when inside a sub-area
    const areaLabel = currentArea && currentArea !== location.areas?.[0]
      ? ` · ${currentArea.name}`
      : (currentArea ? ` · ${currentArea.name}` : '');
    const displayDesc = currentArea?.description ?? location.description ?? '';

    const bar = document.createElement('div');
    bar.className = 'scene-bottom-bar';
    bar.innerHTML = `
      <div>
        <div class="scene-location-name">${location.name}${areaLabel}</div>
        <div class="scene-location-desc">${displayDesc}</div>
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

    // First-visit narrator — fire once per area per playthrough
    if (currentArea) {
      const visitFlag = `visited_area_${currentArea.id}`;
      if (!GameState.getFlag(visitFlag)) {
        GameState.setFlag(visitFlag, true);
        const narratorNode = `area_${currentArea.id}`;
        if (DIALOGUES.narrator?.nodes?.[narratorNode]) {
          this._narratorTimer = setTimeout(() => {
            this._narratorTimer = null;
            EventBus.emit('dialogue:start', { npcId: 'narrator', nodeOverride: narratorNode });
          }, 500);
        }
      }
    }
  },

  _renderDoors(doors, backdrop) {
    const makeDoorEl = (door) => {
      const el = document.createElement('div');
      el.className = 'scene-door';
      Object.assign(el.style, door.position);
      el.innerHTML = `
        <div class="scene-door-frame">
          <div class="scene-door-panel">
            <div class="scene-door-knob"></div>
          </div>
        </div>
        <div class="scene-door-label">${door.label}</div>
      `;
      el.addEventListener('click', () => this._goToDoor(door));
      backdrop.appendChild(el);
    };

    doors.forEach(makeDoorEl);

    // Auto-inject a back door if none of the area's doors already lead to the previous area
    if (this._prevAreaId && !doors.some(d => d.targetAreaId === this._prevAreaId)) {
      makeDoorEl({ id: '__back', label: '← Back', targetAreaId: this._prevAreaId,
        position: { bottom: '10%', left: '50%', transform: 'translateX(-50%)' } });
    }
  },

  _goToDoor(door) {
    const location = LOCATIONS.find(l => l.id === this._locationId) ?? {
      id: this._locationId, name: this._locationId, description: '', icon: '🏛️', bgIcon: '🏛️',
    };
    const currentArea = location.areas
      ? (location.areas.find(a => a.id === this._areaId) ?? location.areas[0])
      : null;
    this._prevAreaId = currentArea?.id ?? null;

    if (!GameState.progression.currentAreaByLocation) GameState.progression.currentAreaByLocation = {};

    if (door.targetLocationId) {
      // Cross-location navigation
      this._locationId = door.targetLocationId;
      this._areaId     = door.targetAreaId ?? null;
      this._prevAreaId = null;
      GameState.progression.currentLocation = door.targetLocationId;
      if (door.targetAreaId) GameState.progression.currentAreaByLocation[door.targetLocationId] = door.targetAreaId;
      const newLoc = LOCATIONS.find(l => l.id === this._locationId) ?? {
        id: this._locationId, name: this._locationId, description: '', icon: '🏛️', bgIcon: '🏛️',
      };
      this._render(newLoc, NPCS.filter(n => n.location === this._locationId));
    } else {
      this._areaId = door.targetAreaId;
      GameState.progression.currentAreaByLocation[this._locationId] = door.targetAreaId;
      const locationNpcs = NPCS.filter(n => n.location === this._locationId);
      this._render(location, locationNpcs);
    }
  },

  _renderObjects(objects, backdrop) {
    objects.forEach(obj => {
      const el = document.createElement('div');
      el.className = 'scene-prop' + (obj.action ? ' scene-prop--interactive' : '');
      el.title = obj.label;
      el.textContent = obj.icon;
      Object.assign(el.style, obj.position);
      if (obj.action === 'rest') {
        el.addEventListener('click', () => this._promptRest());
      }
      backdrop.appendChild(el);
    });
  },

  _promptRest() {
    if (document.querySelector('.scene-confirm-overlay')) return; // already open

    const overlay = document.createElement('div');
    overlay.className = 'scene-confirm-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'scene-confirm-dialog';

    const msg = document.createElement('p');
    msg.className = 'scene-confirm-msg';
    msg.textContent = 'Rest for a while?';

    const btnRow = document.createElement('div');
    btnRow.className = 'scene-confirm-btns';

    const yesBtn = document.createElement('button');
    yesBtn.className = 'btn-primary';
    yesBtn.textContent = 'Yes';
    yesBtn.addEventListener('click', () => {
      overlay.remove();
      this._doHotelRest({ hours: 8 });
    });

    const noBtn = document.createElement('button');
    noBtn.className = 'btn-secondary';
    noBtn.textContent = 'No';
    noBtn.addEventListener('click', () => overlay.remove());

    btnRow.appendChild(yesBtn);
    btnRow.appendChild(noBtn);
    dialog.appendChild(msg);
    dialog.appendChild(btnRow);
    overlay.appendChild(dialog);

    // Close on backdrop click
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.body.appendChild(overlay);
  },

  _renderTreasures(treasures, backdrop) {
    treasures.forEach(treasure => {
      if (GameState.getFlag(`treasure_${treasure.id}`)) return; // gone once looted
      const el = document.createElement('div');
      el.className = 'scene-treasure';
      el.title = treasure.label;
      el.textContent = treasure.icon;
      Object.assign(el.style, treasure.position);
      el.addEventListener('click', () => this._openTreasure(treasure, el));
      backdrop.appendChild(el);
    });
  },

  _openTreasure(treasure, el) {
    if (GameState.getFlag(`treasure_${treasure.id}`)) return;
    GameState.setFlag(`treasure_${treasure.id}`, true);
    el.remove();
    this._showLootPopup(this._applyLoot(treasure.loot));
  },

  _renderBarrels(barrels, backdrop) {
    barrels.forEach(barrel => {
      const available = this._isBarrelAvailable(barrel.id);
      const el = document.createElement('div');
      el.className = 'scene-barrel' + (available ? '' : ' scene-barrel--empty');
      el.title = available ? barrel.label : `${barrel.label} (refills in a day)`;
      el.textContent = barrel.icon;
      Object.assign(el.style, barrel.position);
      if (available) {
        el.addEventListener('click', () => this._openBarrel(barrel, el));
      }
      backdrop.appendChild(el);
    });
  },

  _openBarrel(barrel, el) {
    if (!this._isBarrelAvailable(barrel.id)) return;
    GameState.setFlag(`barrel_${barrel.id}`, Date.now());
    el.classList.add('scene-barrel--empty');
    el.title = `${barrel.label} (refills in a day)`;
    el.replaceWith(el.cloneNode(true)); // drop click listener cleanly
    this._showLootPopup(this._applyLoot(barrel.loot));
  },

  _isBarrelAvailable(barrelId) {
    const lootedAt = GameState.getFlag(`barrel_${barrelId}`);
    if (!lootedAt) return true;
    const oneDayMs = 24 * 60 * 1000; // 24 game-hours = 24 real minutes
    return (Date.now() - lootedAt) >= oneDayMs;
  },

  _applyLoot(loot) {
    if (loot.type === 'coin') {
      GameState.addCoin(loot.amount);
      return `+${loot.amount} 🪙`;
    } else if (loot.type === 'item') {
      const qty = loot.quantity ?? 1;
      GameState.addItem(loot.itemId, qty);
      const item = ITEMS.find(i => i.itemId === loot.itemId);
      return `${item?.icon ?? '📦'} ${item?.name ?? loot.itemId} ×${qty}`;
    }
    return '';
  },

  _showLootPopup(text) {
    const popup = document.createElement('div');
    popup.className = 'scene-loot-popup';
    popup.textContent = text;
    this._container.appendChild(popup);
    setTimeout(() => popup.remove(), 2200);
  },

  _doHotelRest({ hours = 12 } = {}) {
    this._playRestAnimation(() => {
      // Advance game time at the moment the screen is fully dark
      GameState.initGameClock();
      const elapsed     = (Date.now() - GameState.gameTime.startedAt) / 60000; // real mins = game hours
      const currentHour = (GameState.gameTime.baseHour + elapsed) % 24;
      GameState.gameTime.baseHour  = (currentHour + hours) % 24;
      GameState.gameTime.startedAt = Date.now();
    });
  },

  _playRestAnimation(onDark) {
    const overlay = document.createElement('div');
    overlay.className = 'hotel-rest-overlay';
    document.body.appendChild(overlay);

    // After fade-to-dark completes, advance time then fade back to light
    setTimeout(() => {
      onDark();
      overlay.classList.add('hotel-rest-overlay--fadeout');
      setTimeout(() => overlay.remove(), 1500);
    }, 1500);
  },

  _showAreaMap() {
    // Find which world location the current location belongs to
    const worldLoc = WORLD_LOCATIONS.find(wl => (wl.areaIds ?? []).includes(this._locationId));
    if (!worldLoc) return;

    const areas = (worldLoc.areaIds ?? [])
      .map(id => LOCATIONS.find(l => l.id === id))
      .filter(Boolean);

    // Build overlay
    const overlay = document.createElement('div');
    overlay.className = 'area-map-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    const panel = document.createElement('div');
    panel.className = 'area-map-panel';

    const header = document.createElement('div');
    header.className = 'area-map-header';
    header.innerHTML = `<span class="area-map-title">${worldLoc.name} — Area Map</span>`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'area-map-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => overlay.remove());
    header.appendChild(closeBtn);
    panel.appendChild(header);

    const mapArea = document.createElement('div');
    mapArea.className = 'area-map-canvas';

    areas.forEach(loc => {
      const pos = loc.mapPosition;
      if (!pos) return;
      const isCurrent = loc.id === this._locationId;
      const unlocked  = GameState.isLocationUnlocked(loc.id);

      const pin = document.createElement('div');
      pin.className = 'area-map-pin' +
        (isCurrent ? ' area-map-pin--current' : '') +
        (!unlocked  ? ' area-map-pin--locked'  : '');
      pin.style.left = pos[0] + '%';
      pin.style.top  = pos[1] + '%';

      const icon = document.createElement('div');
      icon.className = 'area-map-pin-icon';
      icon.textContent = loc.icon ?? '🏛️';
      pin.appendChild(icon);

      const label = document.createElement('div');
      label.className = 'area-map-pin-label';
      label.textContent = loc.name;
      pin.appendChild(label);

      mapArea.appendChild(pin);
    });

    panel.appendChild(mapArea);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  },

  _showObjectsList() {
    const location = LOCATIONS.find(l => l.id === this._locationId);
    const currentArea = location?.areas
      ? (location.areas.find(a => a.id === this._areaId) ?? location.areas[0])
      : null;
    const objects = currentArea?.objects ?? [];

    const overlay = document.createElement('div');
    overlay.className = 'area-map-overlay';
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    const panel = document.createElement('div');
    panel.className = 'area-map-panel objects-list-panel';

    const header = document.createElement('div');
    header.className = 'area-map-header';
    header.innerHTML = `<span class="area-map-title">${currentArea?.name ?? 'Area'} — Objects</span>`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'area-map-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => overlay.remove());
    header.appendChild(closeBtn);
    panel.appendChild(header);

    const list = document.createElement('div');
    list.className = 'objects-list-body';

    if (objects.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'objects-list-empty';
      empty.textContent = 'Nothing of interest here.';
      list.appendChild(empty);
    } else {
      objects.forEach(obj => {
        const row = document.createElement('div');
        row.className = 'objects-list-row' + (obj.action ? ' objects-list-row--interactive' : '');

        const icon = document.createElement('span');
        icon.className = 'objects-list-icon';
        icon.textContent = obj.icon;

        const label = document.createElement('span');
        label.className = 'objects-list-label';
        label.textContent = obj.label;

        row.appendChild(icon);
        row.appendChild(label);

        if (obj.action === 'rest') {
          const actionBtn = document.createElement('button');
          actionBtn.className = 'btn-secondary objects-list-action';
          actionBtn.textContent = 'Rest';
          actionBtn.addEventListener('click', () => {
            overlay.remove();
            this._promptRest();
          });
          row.appendChild(actionBtn);
        }

        list.appendChild(row);
      });
    }

    panel.appendChild(list);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  },

  _talkTo(npc) {
    EventBus.emit('dialogue:start', { npcId: npc.id });
  },

  update(dt) {},
};

export default SceneScreen;
