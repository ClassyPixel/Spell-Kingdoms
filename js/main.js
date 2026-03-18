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

// Wire forward references
import { setSceneScreenRef } from './screens/MapScreen.js';

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

  // Load settings
  SaveSystem.loadSettings();

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
    const fill = document.getElementById('loading-fill');
    const loading = document.getElementById('loading-screen');
    let progress = 0;

    const steps = [
      { target: 30,  delay: 80  },
      { target: 60,  delay: 60  },
      { target: 85,  delay: 100 },
      { target: 100, delay: 50  },
    ];

    let stepIdx = 0;

    function tick() {
      const step = steps[stepIdx];
      if (!step) {
        // Fade out loading screen
        loading.classList.add('fade-out');
        setTimeout(() => {
          loading.style.display = 'none';
          resolve();
        }, 500);
        return;
      }

      progress++;
      if (fill) fill.style.width = progress + '%';

      if (progress >= step.target) {
        stepIdx++;
        setTimeout(tick, step.delay * 2);
      } else {
        setTimeout(tick, step.delay / (step.target - (steps[stepIdx - 1]?.target ?? 0)));
      }
    }

    setTimeout(tick, 200);
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Title Screen
// ──────────────────────────────────────────────────────────────────────────────

function showTitleScreen() {
  const TitleScreen = {
    mount(container) {
      container.innerHTML = '';
      const screen = document.createElement('div');
      screen.className = 'title-screen fade-in';

      const h1 = document.createElement('h1');
      h1.textContent = 'Spellcaster Academy';
      screen.appendChild(h1);

      const sub = document.createElement('p');
      sub.className = 'subtitle';
      sub.textContent = 'A tale of magic, friendship, and forbidden secrets';
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

      container.appendChild(screen);
    },
    unmount() {},
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

function showHUD() {
  document.getElementById('hud').classList.remove('hidden');
}

function hideHUD() {
  document.getElementById('hud').classList.add('hidden');
}

function updateHUD() {
  const nameEl  = document.getElementById('hud-name');
  const levelEl = document.getElementById('hud-level-val');
  const goldEl  = document.getElementById('hud-gold-val');
  if (nameEl)  nameEl.textContent  = GameState.player.name;
  if (levelEl) levelEl.textContent = GameState.player.level;
  if (goldEl)  goldEl.textContent  = GameState.player.gold;
}

// ──────────────────────────────────────────────────────────────────────────────
// Global event wiring
// ──────────────────────────────────────────────────────────────────────────────

function setupGlobalEvents() {
  // HUD menu button
  document.getElementById('hud-menu-btn')?.addEventListener('click', () => {
    EventBus.emit('menu:open');
  });

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

  // Update HUD whenever gold/level changes
  EventBus.on('cardgame:result',     () => updateHUD());
  EventBus.on('shop:purchased',      () => updateHUD());
  EventBus.on('quest:completed',     () => updateHUD());
  EventBus.on('screen:changed',      () => updateHUD());
  EventBus.on('inventory:useItem',   () => setTimeout(updateHUD, 50));

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
