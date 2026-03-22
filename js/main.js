/**
 * main.js — Boot: imports all modules, wires references, starts the game.
 */
import EventBus    from './EventBus.js';
import GameState   from './GameState.js';
import GameEngine  from './GameEngine.js';
import SaveSystem  from './SaveSystem.js';
import ScreenManager from './screens/ScreenManager.js';

// Screens
import MapScreen         from './screens/MapScreen.js';
import SceneScreen       from './screens/SceneScreen.js';
import DialogueScreen    from './screens/DialogueScreen.js';
import CardGameScreen    from './screens/CardGameScreen.js';
import MenuScreen        from './screens/MenuScreen.js';
import ShopScreen        from './screens/ShopScreen.js';

// Systems
import DialogueSystem, { setDialogueScreenRef } from './systems/DialogueSystem.js';
import CardSystem      from './systems/CardSystem.js';
import QuestSystem     from './systems/QuestSystem.js';
import RelationshipSystem from './systems/RelationshipSystem.js';
import InventorySystem from './systems/InventorySystem.js';
import ShopSystem, { setShopScreenRef } from './systems/ShopSystem.js';
import MusicPlayer from './systems/MusicPlayer.js';
import CardArtPreloader from './systems/CardArtPreloader.js';

// Wire forward references
import { setSceneScreenRef } from './screens/MapScreen.js';

// Quick match data
import { QUICK_MATCH_OPPONENTS, STARTER_DECKS, validateDeck, LOCATIONS, NPCS } from './Data.js';

// Apply map editor overrides (from localStorage sca_map_overrides) to live arrays.
// ES module arrays are shared references — mutating them here affects all importers.
(function applyMapOverrides() {
  try {
    const raw = localStorage.getItem('sca_map_overrides');
    if (!raw) return;
    const ov = JSON.parse(raw);

    // Location / area overrides
    (ov.locations ?? []).forEach(locOv => {
      const loc = LOCATIONS.find(l => l.id === locOv.id);
      if (!loc) return;
      (locOv.areas ?? []).forEach(aOv => {
        const area = loc.areas?.find(a => a.id === aOv.id);
        if (!area) return;
        ['doors', 'treasures', 'barrels', 'objects'].forEach(k => {
          if (aOv[k] !== undefined) area[k] = aOv[k];
        });
      });
    });

    // NPC property overrides (name, description, location)
    (ov.npcs ?? []).forEach(nOv => {
      const npc = NPCS.find(n => n.id === nOv.id);
      if (!npc) return;
      if (nOv.name        !== undefined) npc.name        = nOv.name;
      if (nOv.description !== undefined) npc.description = nOv.description;
      if (nOv.location    !== undefined) npc.location    = nOv.location;
    });
  } catch (e) {
    console.warn('applyMapOverrides failed:', e);
  }
})();

// Quick match state
let _quickMatchActive = false;

// ──────────────────────────────────────────────────────────────────────────────
// Boot sequence
// ──────────────────────────────────────────────────────────────────────────────

async function boot() {
  // Wire cross-module references (avoid circular imports)
  setSceneScreenRef(SceneScreen);
  setDialogueScreenRef(DialogueScreen);
  setShopScreenRef(ShopScreen);
  CardSystem.setCardGameScreen(CardGameScreen);

  // Init systems (all synchronous now — no fetch() calls)
  DialogueSystem.init();
  CardSystem.init();
  QuestSystem.init();
  RelationshipSystem.init();
  InventorySystem.init();
  ShopSystem.init();

  // Kick off background image preloads as early as possible
  CardArtPreloader.preloadBattleBackgrounds();

  // Load settings
  SaveSystem.loadSettings();
  applyFont(GameState.settings.font);

  // Init screen infrastructure
  const container = document.getElementById('screen-container');
  ScreenManager.init(container);
  GameEngine.init(ScreenManager);

  // Global event handlers
  setupGlobalEvents();

  // Animate loading bar
  await animateLoading();

  // Show title screen
  showTitleScreen();

  // Start game loop
  GameEngine.start();
}

// ──────────────────────────────────────────────────────────────────────────────
// Loading animation
// ──────────────────────────────────────────────────────────────────────────────

function animateLoading() {
  return new Promise(resolve => {
    const fill    = document.getElementById('loading-fill');
    const loading = document.getElementById('loading-screen');
    let progress  = 0;

    const interval = setInterval(() => {
      // Ease: move fast early, slow near 100
      const step = progress < 50 ? 3 : progress < 80 ? 2 : 1;
      progress = Math.min(100, progress + step);
      if (fill) fill.style.width = progress + '%';

      if (progress >= 100) {
        clearInterval(interval);
        loading.classList.add('fade-out');
        setTimeout(() => {
          loading.style.display = 'none';
          resolve();
        }, 500);
      }
    }, 30);
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Title Screen
// ──────────────────────────────────────────────────────────────────────────────

function showTitleScreen() {
  const TitleScreen = {
    mount(container) {
      MusicPlayer.play('assets/audio/TitleOST/01.mp3');
      container.innerHTML = '';
      const screen = document.createElement('div');
      screen.className = 'title-screen fade-in';

      const h1 = document.createElement('h1');
      h1.textContent = 'Conjuring Masters';
      screen.appendChild(h1);

      const sub = document.createElement('p');
      sub.className = 'subtitle';
      sub.textContent = 'Build your deck. Command your forces. Conquer the kingdom.';
      screen.appendChild(sub);

      // New Game
      const newGameBtn = document.createElement('button');
      newGameBtn.className = 'title-btn';
      newGameBtn.textContent = '✨ New Game';
      newGameBtn.addEventListener('click', () => showNameEntry());
      screen.appendChild(newGameBtn);

      // Continue (only if saves exist)
      if (SaveSystem.hasSave()) {
        const continueBtn = document.createElement('button');
        continueBtn.className = 'title-btn secondary';
        continueBtn.textContent = '📂 Continue';
        continueBtn.addEventListener('click', () => showLoadScreen());
        screen.appendChild(continueBtn);
      }

      // Load
      const loadBtn = document.createElement('button');
      loadBtn.className = 'title-btn secondary';
      loadBtn.textContent = '💾 Load Game';
      loadBtn.addEventListener('click', () => showLoadScreen());
      screen.appendChild(loadBtn);

      // Quick Match
      const qmBtn = document.createElement('button');
      qmBtn.className = 'title-btn secondary';
      qmBtn.textContent = '⚡ Quick Match';
      qmBtn.addEventListener('click', () => showQuickMatchOpponentSelect());
      screen.appendChild(qmBtn);

      container.appendChild(screen);
    },
    unmount() { MusicPlayer.stop(); },
    update() {},
  };

  ScreenManager.clear(TitleScreen);
  hideHUD();
}

// ──────────────────────────────────────────────────────────────────────────────
// Name Entry Screen
// ──────────────────────────────────────────────────────────────────────────────

function showNameEntry() {
  const NameScreen = {
    mount(container) {
      container.innerHTML = '';
      const screen = document.createElement('div');
      screen.className = 'name-screen fade-in';

      const h2 = document.createElement('h2');
      h2.textContent = 'What is your name?';
      screen.appendChild(h2);

      const p = document.createElement('p');
      p.textContent = 'You will be known by this name throughout the Academy.';
      screen.appendChild(p);

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Enter your name...';
      input.maxLength = 20;
      input.value = 'Student';
      screen.appendChild(input);

      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'title-btn';
      confirmBtn.textContent = 'Begin Adventure';
      confirmBtn.addEventListener('click', () => {
        const name = input.value.trim() || 'Student';
        GameState.player.name = name;
        startNewGame();
      });
      screen.appendChild(confirmBtn);

      const backBtn = document.createElement('button');
      backBtn.className = 'title-btn secondary';
      backBtn.textContent = '← Back';
      backBtn.addEventListener('click', () => showTitleScreen());
      screen.appendChild(backBtn);

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmBtn.click();
      });

      setTimeout(() => input.focus(), 100);
      container.appendChild(screen);
    },
    unmount() {},
    update() {},
  };

  ScreenManager.clear(NameScreen);
}

// ──────────────────────────────────────────────────────────────────────────────
// Load Screen
// ──────────────────────────────────────────────────────────────────────────────

function showLoadScreen() {
  const LoadScreen = {
    mount(container) {
      container.innerHTML = '';
      const screen = document.createElement('div');
      screen.className = 'save-screen fade-in';

      const h2 = document.createElement('h2');
      h2.textContent = 'Load Game';
      screen.appendChild(h2);

      const slots = document.createElement('div');
      slots.className = 'save-slots';

      const slotInfo = SaveSystem.getSlotsInfo();
      slotInfo.forEach(info => {
        const el = document.createElement('div');
        el.className = 'save-slot' + (info.empty ? ' empty' : '');

        if (info.empty) {
          el.innerHTML = `<span class="slot-label">Slot ${info.slot + 1}</span><span class="slot-info">Empty</span>`;
        } else {
          el.innerHTML = `
            <div>
              <div class="slot-label">Slot ${info.slot + 1} — ${info.playerName}</div>
              <div class="slot-meta">${info.location} · ${SaveSystem.formatTimestamp(info.timestamp)}</div>
            </div>
            <span style="color:var(--color-text-dim);font-size:0.8em">${SaveSystem.formatPlaytime(info.playtime)}</span>
          `;
          el.addEventListener('click', () => {
            if (SaveSystem.load(info.slot)) {
              enterGame();
            }
          });
        }

        slots.appendChild(el);
      });

      screen.appendChild(slots);

      const backBtn = document.createElement('button');
      backBtn.className = 'back-btn';
      backBtn.textContent = '← Back';
      backBtn.addEventListener('click', () => showTitleScreen());
      screen.appendChild(backBtn);

      container.appendChild(screen);
    },
    unmount() {},
    update() {},
  };

  ScreenManager.clear(LoadScreen);
}

// ──────────────────────────────────────────────────────────────────────────────
// Quick Match screens
// ──────────────────────────────────────────────────────────────────────────────

function showQuickMatchOpponentSelect() {
  const screen = { mount(c) { _buildQMOpponentSelect(c); }, unmount() {}, update() {} };
  ScreenManager.clear(screen);
  hideHUD();
}

function _buildQMOpponentSelect(container) {
  container.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'qm-screen fade-in';

  root.innerHTML = `
    <div class="qm-header">
      <h2 class="qm-title">⚡ Quick Match</h2>
      <p class="qm-subtitle">Choose your opponent</p>
    </div>
  `;

  const grid = document.createElement('div');
  grid.className = 'qm-opponent-grid';

  const diffColors = ['', '#4a9a4a', '#c09030', '#c04040'];
  QUICK_MATCH_OPPONENTS.forEach(opp => {
    const card = document.createElement('div');
    card.className = 'qm-opponent-card';
    const stars = '★'.repeat(opp.difficulty) + '☆'.repeat(3 - opp.difficulty);
    card.innerHTML = `
      <div class="qm-opp-portrait">${opp.portrait}</div>
      <div class="qm-opp-name">${opp.name}</div>
      <div class="qm-opp-difficulty" style="color:${diffColors[opp.difficulty]}">${stars} ${opp.difficultyLabel}</div>
      <div class="qm-opp-desc">${opp.description}</div>
      <div class="qm-opp-challenge">Challenge ▶</div>
    `;
    card.addEventListener('click', () => showQuickMatchDeckSelect(opp.npcId));
    grid.appendChild(card);
  });

  root.appendChild(grid);

  const backBtn = document.createElement('button');
  backBtn.className = 'title-btn secondary';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showTitleScreen());
  root.appendChild(backBtn);

  container.appendChild(root);
}

function showQuickMatchDeckSelect(npcId) {
  const screen = { mount(c) { _buildQMDeckSelect(c, npcId); }, unmount() {}, update() {} };
  ScreenManager.clear(screen);
}

function _buildQMDeckSelect(container, npcId) {
  const opp = QUICK_MATCH_OPPONENTS.find(o => o.npcId === npcId);
  container.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'qm-screen fade-in';

  root.innerHTML = `
    <div class="qm-header">
      <h2 class="qm-title">Select Starter Deck</h2>
      <p class="qm-subtitle">vs <span class="qm-vs-label">${opp?.portrait ?? '?'} ${opp?.name ?? 'Opponent'}</span></p>
    </div>
  `;

  const deckGrid = document.createElement('div');
  deckGrid.className = 'qm-deck-grid';

  STARTER_DECKS.forEach(deck => {
    const card = document.createElement('div');
    card.className = 'qm-deck-card';
    card.style.setProperty('--deck-color', deck.color);
    const vd = validateDeck(deck);
    card.innerHTML = `
      <div class="qm-deck-art">${deck.art}</div>
      <div class="qm-deck-name">${deck.name}</div>
      <div class="qm-deck-desc">${deck.description}</div>
      <div class="qm-deck-counts">
        <span class="${deck.elites.length === 10 ? 'qm-valid' : 'qm-invalid'}">🐉 ${deck.elites.length}/10 elites</span>
        <span class="${deck.summons.length >= 40 ? 'qm-valid' : 'qm-invalid'}">✨ ${deck.summons.length}/40+ summons</span>
        <span class="${deck.spells.length === 10 ? 'qm-valid' : 'qm-invalid'}">🔮 ${deck.spells.length}/10 spells</span>
      </div>
      ${vd.valid
        ? `<div class="qm-deck-cta">Preview Deck ▶</div>`
        : `<div class="qm-deck-cta qm-deck-invalid">✗ Deck not valid</div>`}
    `;
    if (vd.valid) {
      card.addEventListener('click', () => showQuickMatchDeckPreview(npcId, deck));
    } else {
      card.classList.add('qm-deck-card-disabled');
    }
    deckGrid.appendChild(card);
  });

  root.appendChild(deckGrid);

  const backBtn = document.createElement('button');
  backBtn.className = 'title-btn secondary';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showQuickMatchOpponentSelect());
  root.appendChild(backBtn);

  container.appendChild(root);
}

function showQuickMatchDeckPreview(npcId, deckConfig) {
  const screen = { mount(c) { _buildQMDeckPreview(c, npcId, deckConfig); }, unmount() {}, update() {} };
  ScreenManager.clear(screen);
}

function _buildQMDeckPreview(container, npcId, deckConfig) {
  const opp = QUICK_MATCH_OPPONENTS.find(o => o.npcId === npcId);
  container.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'qm-screen qm-preview-screen fade-in';

  // Header
  const header = document.createElement('div');
  header.className = 'qm-header';
  const vd2 = validateDeck(deckConfig);
  header.innerHTML = `
    <h2 class="qm-title">${deckConfig.art} ${deckConfig.name} — Deck List</h2>
    <p class="qm-subtitle">vs ${opp?.portrait ?? ''} ${opp?.name ?? 'Opponent'} · ${deckConfig.description}</p>
    <div class="qm-deck-validity ${vd2.valid ? 'valid' : 'invalid'}">
      ${vd2.valid
        ? '✓ Deck is valid and ready to play'
        : '✗ ' + vd2.errors.join(' · ')}
    </div>
  `;
  root.appendChild(header);

  // Scrollable card content
  const content = document.createElement('div');
  content.className = 'qm-preview-content';

  const sections = [
    { label: '⚔️ Champions',      cards: deckConfig.champions, type: 'champion' },
    { label: '🐉 Elite Summons',  cards: deckConfig.elites,    type: 'elite'    },
    { label: '✨ Summon Cards',   cards: deckConfig.summons,   type: 'summon'   },
    { label: '🔮 Spell Cards',    cards: deckConfig.spells,    type: 'spell'    },
  ];

  sections.forEach(({ label, cards, type }) => {
    if (!cards?.length) return;

    // Deduplicate by cardId, count copies
    const grouped = [];
    const seen = new Map();
    cards.forEach(card => {
      if (seen.has(card.cardId)) { seen.get(card.cardId).count++; }
      else { const entry = { card, count: 1 }; seen.set(card.cardId, entry); grouped.push(entry); }
    });

    const sec = document.createElement('div');
    sec.className = 'qm-card-section';

    const title = document.createElement('div');
    title.className = 'qm-section-title';
    title.textContent = `${label}  (${cards.length})`;
    sec.appendChild(title);

    const cardGrid = document.createElement('div');
    cardGrid.className = 'qm-cards-grid';

    grouped.forEach(({ card, count }) => {
      const item = document.createElement('div');
      item.className = `qm-card-item qm-card-${type}`;

      let stats = '';
      if (type === 'champion') stats = `HP ${card.hp}`;
      else if (type === 'elite')  stats = `HP ${card.hp} · ⚔ ${card.power}`;
      else if (type === 'summon') stats = `Cost ${card.summonCost} · HP ${card.hp} · ⚔ ${card.power}`;
      else if (type === 'spell')  stats = card.description ?? '';

      item.innerHTML = `
        <div class="qm-ci-art">${card.art ?? '?'}</div>
        <div class="qm-ci-name">${card.name}</div>
        <div class="qm-ci-stats">${stats}</div>
        ${count > 1 ? `<div class="qm-ci-count">×${count}</div>` : ''}
      `;
      cardGrid.appendChild(item);
    });

    sec.appendChild(cardGrid);
    content.appendChild(sec);
  });

  root.appendChild(content);

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'qm-preview-actions';

  const vdPreview = validateDeck(deckConfig);
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'title-btn';
  confirmBtn.textContent = vdPreview.valid ? '✓ Confirm & Begin Match' : '✗ Deck Not Valid';
  confirmBtn.disabled = !vdPreview.valid;
  if (vdPreview.valid) {
    confirmBtn.addEventListener('click', () => {
      _quickMatchActive = true;
      hideHUD();
      EventBus.emit('cardgame:start', { npcId, deck: deckConfig, isQuickPlay: true });
    });
  }
  actions.appendChild(confirmBtn);

  const backBtn = document.createElement('button');
  backBtn.className = 'title-btn secondary';
  backBtn.textContent = '← Back to Deck Selection';
  backBtn.addEventListener('click', () => showQuickMatchDeckSelect(npcId));
  actions.appendChild(backBtn);

  root.appendChild(actions);
  container.appendChild(root);
}

// ──────────────────────────────────────────────────────────────────────────────
// Game entry points
// ──────────────────────────────────────────────────────────────────────────────

function startNewGame() {
  // Give starting items
  GameState.addItem('health_potion', 2);
  GameState.addItem('academy_badge', 1);

  // Start main quest
  EventBus.emit('quest:trigger', { questId: 'main_01' });

  enterGame();
}

function enterGame() {
  showHUD();
  updateHUD();
  ScreenManager.clear(MapScreen);
}

// ──────────────────────────────────────────────────────────────────────────────
// HUD
// ──────────────────────────────────────────────────────────────────────────────

function showHUD() {}
function hideHUD() {}

function updateHUD() {
  const coinEl = document.getElementById('sidebar-coin-val');
  const gemsEl = document.getElementById('sidebar-gems-val');
  if (coinEl) coinEl.textContent = GameState.player.coin;
  if (gemsEl) gemsEl.textContent = GameState.player.gemstones ?? 0;
}

// ──────────────────────────────────────────────────────────────────────────────
// ── Font helper ───────────────────────────────────────────────────────────────

function applyFont(fontKey) {
  document.body.classList.remove('font-lutin', 'font-badabb', 'font-merienda', 'font-anticorona');
  if (fontKey && fontKey !== 'default') {
    document.body.classList.add(`font-${fontKey}`);
  }
}

// Global event wiring
// ──────────────────────────────────────────────────────────────────────────────

function setupGlobalEvents() {
  // Menu open
  EventBus.on('menu:open', () => {
    ScreenManager.push(MenuScreen);
  });

  // Return to title
  EventBus.on('game:returnToTitle', () => {
    hideHUD();
    showTitleScreen();
  });

  // Toast notifications
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  toastContainer.id = 'toast-container';
  document.getElementById('game-root').appendChild(toastContainer);

  EventBus.on('toast', ({ message, type = 'info' }) => {
    showToast(message, type);
  });

  // Update HUD whenever coin/level changes
  EventBus.on('cardgame:result',     ({ win, npcId }) => {
    updateHUD();
    if (_quickMatchActive) {
      // Quick match: pop card game screen, return to opponent select
      _quickMatchActive = false;
      setTimeout(() => {
        EventBus.emit('screen:pop');
        setTimeout(() => showQuickMatchOpponentSelect(), 200);
      }, 100);
    } else {
      // Story mode: CardSystem/CardGameScreen already pops the card game screen,
      // so just start the post-game dialogue after a brief delay for SceneScreen to settle.
      setTimeout(() => {
        EventBus.emit('dialogue:start', { npcId, nodeOverride: win ? 'post_win' : 'post_lose' });
      }, 300);
    }
  });
  EventBus.on('shop:purchased',      () => updateHUD());
  EventBus.on('quest:completed',     () => updateHUD());
  EventBus.on('screen:changed',      () => updateHUD());
  EventBus.on('inventory:useItem',   () => setTimeout(updateHUD, 50));
  EventBus.on('settings:changed',    ({ key, value }) => { if (key === 'font') applyFont(value); });

  // Side effect: zephyr's quest flag when entering quest
  EventBus.on('quest:started', ({ questId }) => {
    if (questId === 'side_02') GameState.setFlag('side_02_active');
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2800);
}

// ──────────────────────────────────────────────────────────────────────────────
// Start
// ──────────────────────────────────────────────────────────────────────────────

boot().catch(err => {
  console.error('[Boot] Fatal error:', err);
  document.getElementById('loading-screen').innerHTML = `
    <div class="loading-content">
      <h1 style="color:#c04a4a">Boot Error</h1>
      <p style="color:#888">${err.message}</p>
    </div>
  `;
});
