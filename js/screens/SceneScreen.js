/**
 * SceneScreen — shows the location backdrop and NPC sprites.
 * Clicking an NPC starts a dialogue.
 * Left sidebar: player info, game clock, menu buttons.
 * Bottom bar: location name + "Open Map" button.
 */
import EventBus           from '../EventBus.js';
import GameState           from '../GameState.js';
import { NPCS, LOCATIONS, WORLD_LOCATIONS, ITEMS, STORY_STARTER_DECKS, DIALOGUES, CONJURER_COMPANIONS } from '../Data.js';
import MusicPlayer         from '../systems/MusicPlayer.js';
import InventoryScreen     from './InventoryScreen.js';
import DeckBuilderScreen   from './DeckBuilderScreen.js';
import QuestJournalScreen  from './QuestJournalScreen.js';
import SettingsScreen      from './SettingsScreen.js';
import MapScreen           from './MapScreen.js';

// Applies scale and rotation from map-editor data to a scene element.
function _applySpriteTransform(el, obj) {
  const scale    = obj.scale    ?? 1;
  const rotation = obj.rotation ?? 0;
  if (scale !== 1 || rotation !== 0) {
    const base = el.style.transform ? el.style.transform + ' ' : '';
    el.style.transform = `${base}scale(${scale}) rotate(${rotation}deg)`;
  }
}

const SceneScreen = {
  _container:       null,
  _locationId:      null,
  _areaId:          null,
  _prevAreaId:      null,
  _clockTimer:      null,
  _unsubHotelRest:  null,
  _unsubDialogue:   [],
  _narratorTimer:   null,

  mount(container, params = {}) {
    this._container = container;
    this._locationId = params.locationId ?? GameState.progression.currentLocation;
    // Always prefer the live savedAreaMap so navigation via _goToDoor is preserved
    // when returning from a pushed screen (whose stack entry may have a stale areaId).
    const savedAreaMap = GameState.progression.currentAreaByLocation ?? {};
    this._areaId = savedAreaMap[this._locationId] ?? params.areaId ?? null;
    GameState.initGameClock();
    this._unsubHotelRest = EventBus.on('hotel:rest', (d) => this._doHotelRest(d));

    this._unsubDialogue = [
      EventBus.on('dialogue:start', ({ npcId } = {}) => {
        if (npcId === 'narrator') return; // narrator speech never fades scene sprites
        const backdrop = this._container?.querySelector('.scene-backdrop');
        if (backdrop) backdrop.classList.add('dlg-active');
      }),
      EventBus.on('dialogue:end', () => {
        const backdrop = this._container?.querySelector('.scene-backdrop');
        if (backdrop) backdrop.classList.remove('dlg-active');
      }),
    ];

    const location = LOCATIONS.find(l => l.id === this._locationId) ?? {
      id: this._locationId, name: this._locationId, description: '', icon: '🏛️', bgIcon: '🏛️',
    };
    const locationNpcs = NPCS.filter(n => n.location === this._locationId);

    // Play area music based on location
    MusicPlayer.play('assets/audio/MapAreaOST/Academy.mp3');

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
    this._unsubDialogue.forEach(fn => fn());
    this._unsubDialogue = [];
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
    const id = GameState.deck.activeDeckId;
    if (id) {
      const match = STORY_STARTER_DECKS.find(d => d.id === id);
      if (match) return match.name;
      const custom = (GameState.deck.customDecks ?? []).find(d => d.id === id);
      if (custom) return custom.name ?? 'Custom Deck';
    }
    return `Main Deck · ${GameState.deck.activeDeck?.length ?? 0} cards`;
  },

  // ── Sidebar ─────────────────────────────────────────────────────────────────

  _buildSidebar() {
    const sidebar = document.createElement('div');
    sidebar.className = 'scene-sidebar';

    // ── Player info panel (top of strip) ──────────────────────────
    const playerPanel = document.createElement('div');
    playerPanel.className = 'scene-player-panel';

    // Left column: avatar + coin + gems
    const sppLeft = document.createElement('div');
    sppLeft.className = 'spp-left';

    const avatar = document.createElement('div');
    avatar.className = 'sidebar-avatar';
    avatar.innerHTML = `<img src="assets/images/CardGameArt/AvatarArt/playeravatar_img.JPG" alt="Player Avatar" class="sidebar-avatar-img">`;

    const coinEl = document.createElement('div');
    coinEl.className = 'sidebar-currency';
    coinEl.innerHTML = `🪙 <span id="sidebar-coin-val">${GameState.player.coin}</span>`;

    const gemsEl = document.createElement('div');
    gemsEl.className = 'sidebar-currency sidebar-currency--gems';
    gemsEl.innerHTML = `💎 <span id="sidebar-gems-val">${GameState.player.gemstones ?? 0}</span>`;

    const currencyRow = document.createElement('div');
    currencyRow.className = 'spp-currencies';
    currencyRow.appendChild(coinEl);
    currencyRow.appendChild(gemsEl);

    sppLeft.appendChild(avatar);
    sppLeft.appendChild(currencyRow);

    // Right column: name on top, then [LV + clock] row below
    const sppRight = document.createElement('div');
    sppRight.className = 'spp-right';

    const nameEl = document.createElement('div');
    nameEl.className = 'sidebar-player-name';
    nameEl.textContent = GameState.player.name;

    const lvClockRow = document.createElement('div');
    lvClockRow.className = 'spp-lv-clock-row';

    const lvEl = document.createElement('div');
    lvEl.className = 'sidebar-player-lv';
    lvEl.textContent = `LV:${GameState.player.level}`;

    const clockEl = document.createElement('div');
    clockEl.className = 'sidebar-clock';
    clockEl.id = 'scene-sidebar-clock';
    this._updateClockEl(clockEl);

    lvClockRow.appendChild(lvEl);
    lvClockRow.appendChild(clockEl);

    sppRight.appendChild(nameEl);
    sppRight.appendChild(lvClockRow);

    playerPanel.appendChild(sppLeft);
    playerPanel.appendChild(sppRight);

    // ── Deck panel (separate auto-size panel below player panel) ──
    const deckPanel = document.createElement('div');
    deckPanel.className = 'scene-deck-panel';
    const deckIcon = document.createElement('img');
    deckIcon.src = 'assets/images/CardGameArt/IconArt/deckboxicon_img.png';
    deckIcon.alt = 'Deck';
    deckIcon.className = 'scene-deck-icon';
    const deckLabelEl = document.createElement('span');
    deckLabelEl.className = 'scene-deck-label-prefix';
    deckLabelEl.textContent = 'Main deck:';
    const deckNameEl = document.createElement('span');
    deckNameEl.textContent = this._deckLabel();
    deckPanel.appendChild(deckIcon);
    deckPanel.appendChild(deckLabelEl);
    deckPanel.appendChild(deckNameEl);

    // ── Nav button strip ───────────────────────────────────────────
    const navStrip = document.createElement('div');
    navStrip.className = 'scene-nav-strip';

    const NAV_BUTTONS = [
      { icon: '🎒', title: 'Inventory',    action: () => EventBus.emit('screen:push', { screen: InventoryScreen,    params: {} }) },
      { icon: '🃏', title: 'Deck Builder', action: () => EventBus.emit('screen:push', { screen: DeckBuilderScreen,  params: {} }) },
      { icon: '📜', title: 'Quest Journal',action: () => EventBus.emit('screen:push', { screen: QuestJournalScreen, params: {} }) },
      { icon: '👥', title: 'Companions',   action: () => this._showCompanionsPanel() },
      { icon: '🗺', title: 'Area Map',     action: () => this._showAreaMap() },
      { icon: '💾', title: 'Save / Load',  action: () => EventBus.emit('menu:open') },
      { icon: '⚙️', title: 'Settings',    action: () => EventBus.emit('screen:push', { screen: SettingsScreen,     params: {} }) },
      { icon: '🚪', title: 'Exit Game',   action: () => EventBus.emit('game:returnToTitle') },
    ];

    NAV_BUTTONS.forEach(({ icon, title, action }) => {
      const btn = document.createElement('button');
      btn.className = 'scene-nav-circle';
      btn.title = title;
      btn.textContent = icon;
      btn.addEventListener('click', action);
      navStrip.appendChild(btn);
    });

    sidebar.appendChild(playerPanel);
    sidebar.appendChild(deckPanel);
    sidebar.appendChild(navStrip);

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
      const posKey = `${this._locationId}:${currentArea?.id}:${npc.id}`;
      const npcPos = window._mapNpcPositions?.[posKey];

      const el = document.createElement('div');
      if (npcPos) {
        el.className = 'scene-npc' + (npc.portraitImg ? ' scene-npc--img' : '') + ' scene-npc--positioned';
        el.style.left   = `${npcPos.left}%`;
        el.style.bottom = `${npcPos.bottom}%`;
      } else {
        el.className = 'scene-npc' +
          (npc.portraitImg               ? ' scene-npc--img'   : '') +
          (npc.scenePosition === 'right'  ? ' scene-npc--right' : '');
      }
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

    // World Map button — top right of backdrop
    const worldMapBtn = document.createElement('button');
    worldMapBtn.className = 'scene-worldmap-btn';
    worldMapBtn.title = 'World Map';
    worldMapBtn.innerHTML = '🌍 World Map';
    worldMapBtn.addEventListener('click', () => {
      EventBus.emit('screen:push', { screen: MapScreen, params: {} });
    });
    backdrop.appendChild(worldMapBtn);

    screen.appendChild(backdrop);

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
      if (treasure.img) {
        const img = document.createElement('img');
        img.src = treasure.img;
        img.alt = treasure.label;
        img.className = 'scene-treasure-img';
        el.appendChild(img);
      } else {
        el.textContent = treasure.icon;
      }
      Object.assign(el.style, treasure.position);
      _applySpriteTransform(el, treasure);
      el.addEventListener('click', () => this._openTreasure(treasure, el));
      backdrop.appendChild(el);
    });
  },

  _openTreasure(treasure, el) {
    if (GameState.getFlag(`treasure_${treasure.id}`)) return;
    GameState.setFlag(`treasure_${treasure.id}`, true);
    const rect = el.getBoundingClientRect();
    el.remove();
    this._showLootPopup(this._applyLoot(treasure.loot), rect);
  },

  _renderBarrels(barrels, backdrop) {
    barrels.forEach(barrel => {
      const available = this._isBarrelAvailable(barrel.id);
      const el = document.createElement('div');
      el.className = 'scene-barrel' + (available ? '' : ' scene-barrel--empty');
      el.title = available ? barrel.label : `${barrel.label} (refills in a day)`;
      if (barrel.img) {
        const img = document.createElement('img');
        img.src = barrel.img;
        img.alt = barrel.label;
        img.className = 'scene-barrel-img';
        el.appendChild(img);
      } else {
        el.textContent = barrel.icon;
      }
      Object.assign(el.style, barrel.position);
      _applySpriteTransform(el, barrel);
      if (available) {
        el.addEventListener('click', () => this._openBarrel(barrel, el));
      }
      backdrop.appendChild(el);
    });
  },

  _openBarrel(barrel, el) {
    if (!this._isBarrelAvailable(barrel.id)) return;
    GameState.setFlag(`barrel_${barrel.id}`, Date.now());
    const rect = el.getBoundingClientRect();
    el.classList.add('scene-barrel--empty');
    el.title = `${barrel.label} (refills in a day)`;
    el.replaceWith(el.cloneNode(true)); // drop click listener cleanly
    this._showLootPopup(this._applyLoot(barrel.loot), rect);
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
      const coinEl = document.getElementById('sidebar-coin-val');
      if (coinEl) coinEl.textContent = GameState.player.coin;
      return `+${loot.amount} 🪙`;
    } else if (loot.type === 'item') {
      const qty = loot.quantity ?? 1;
      GameState.addItem(loot.itemId, qty);
      const item = ITEMS.find(i => i.itemId === loot.itemId);
      return `${item?.icon ?? '📦'} ${item?.name ?? loot.itemId} ×${qty}`;
    }
    return '';
  },

  _showLootPopup(text, sourceRect) {
    const popup = document.createElement('div');
    popup.className = 'scene-loot-popup';
    popup.textContent = text;
    if (sourceRect) {
      popup.classList.add('scene-loot-popup--anchored');
      popup.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
      popup.style.top  = `${sourceRect.top}px`;
    }
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

      // Roll barrel loot timestamps back by the skipped real-time equivalent
      // (1 game-hour = 1 real-minute = 60 000 ms) so they respawn correctly
      const skipMs = hours * 60 * 1000;
      const flags  = GameState.progression.gameFlags;
      Object.keys(flags).forEach(key => {
        if (key.startsWith('barrel_') && typeof flags[key] === 'number') {
          GameState.setFlag(key, flags[key] - skipMs);
        }
      });
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

  // ── Companions Panel ────────────────────────────────────────────────────────

  _showCompanionsPanel() {
    if (document.querySelector('.companions-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'companions-overlay';

    const panel = document.createElement('div');
    panel.className = 'companions-panel';

    const header = document.createElement('div');
    header.className = 'companions-header';
    header.innerHTML = '<span>👥 Companions</span>';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'companions-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => overlay.remove());
    header.appendChild(closeBtn);
    panel.appendChild(header);

    const list = document.createElement('div');
    list.className = 'companions-list';

    const activeCompanions = CONJURER_COMPANIONS.filter(c =>
      GameState.companions[c.id]?.isCompanion
    );

    if (activeCompanions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'companions-empty';
      empty.textContent = 'No companions yet. Build friendships with conjurers you meet to earn their company.';
      list.appendChild(empty);
    } else {
      activeCompanions.forEach(comp => {
        const state    = GameState.companions[comp.id] ?? {};
        const rel      = GameState.relationships[comp.id] ?? {};
        const fp       = rel.points ?? 0;
        const romanced = state.romanced ?? false;

        const entry = document.createElement('div');
        entry.className = 'companions-entry';

        const portrait = document.createElement('div');
        portrait.className = 'companions-portrait';
        if (comp.portraitImg) {
          portrait.innerHTML = `<img src="${comp.portraitImg}" alt="${comp.name}" class="companions-portrait-img">`;
        } else {
          portrait.textContent = comp.portrait;
        }

        const info = document.createElement('div');
        info.className = 'companions-info';
        info.innerHTML = `
          <div class="companions-name">${comp.name}${romanced ? ' 💕' : ''}</div>
          <div class="companions-friendship">
            <div class="companions-fp-bar-wrap">
              <div class="companions-fp-bar" style="width:${fp}%"></div>
            </div>
            <span class="companions-fp-label">${fp} / 100</span>
          </div>
        `;

        // Tooltip on hover
        const tooltip = document.createElement('div');
        tooltip.className = 'companions-tooltip';
        tooltip.innerHTML = `
          <strong>${comp.name}</strong>
          <p>${comp.description}</p>
          <div>Friendship: ${fp} / 100</div>
          ${romanced ? '<div style="color:#f9a;margin-top:4px">💕 Romanced</div>' : ''}
        `;
        entry.appendChild(tooltip);

        entry.appendChild(portrait);
        entry.appendChild(info);

        entry.addEventListener('click', () => {
          overlay.remove();
          EventBus.emit('dialogue:start', { npcId: comp.id });
        });

        list.appendChild(entry);
      });
    }

    panel.appendChild(list);
    overlay.appendChild(panel);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
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

    // World Map button — bottom right of area map panel
    const areaMapWorldBtn = document.createElement('button');
    areaMapWorldBtn.className = 'area-map-worldmap-btn';
    areaMapWorldBtn.innerHTML = '🌍 World Map';
    areaMapWorldBtn.addEventListener('click', () => {
      overlay.remove();
      EventBus.emit('screen:push', { screen: MapScreen, params: {} });
    });
    panel.appendChild(areaMapWorldBtn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  },

  _talkTo(npc) {
    EventBus.emit('dialogue:start', { npcId: npc.id });
  },

  update(dt) {},
};

export default SceneScreen;
