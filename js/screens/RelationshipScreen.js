/**
 * RelationshipScreen — shows friendship tiers and points for all NPCs.
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';

const TIER_NAMES = ['Stranger', 'Acquaintance', 'Friend', 'Close Friend', 'Bonded'];
const TIER_THRESHOLDS = [0, 20, 40, 60, 80];

function getTierProgress(points, tier) {
  const lo = TIER_THRESHOLDS[tier] ?? 0;
  const hi = TIER_THRESHOLDS[tier + 1] ?? 100;
  return Math.max(0, Math.min(1, (points - lo) / (hi - lo)));
}

const RelationshipScreen = {
  _container: null,

  mount(container, params = {}) {
    this._container = container;
    this._render();
  },

  unmount() {
    this._container = null;
  },

  _render() {
    const c = this._container;
    c.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'relationship-screen fade-in';

    // Header
    const header = document.createElement('div');
    header.className = 'screen-header';
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back';
    backBtn.textContent = '← Back';
    backBtn.addEventListener('click', () => EventBus.emit('screen:pop'));
    const title = document.createElement('h2');
    title.textContent = '💜 Relationships';
    header.appendChild(backBtn);
    header.appendChild(title);
    screen.appendChild(header);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'relationship-grid';

    Object.entries(GameState.relationships).forEach(([npcId, rel]) => {
      const tier = rel.tier;
      const tierName = TIER_NAMES[tier] ?? 'Stranger';
      const progress = getTierProgress(rel.points, tier);
      const nextTier = TIER_NAMES[tier + 1];
      const nextThreshold = TIER_THRESHOLDS[tier + 1];

      const card = document.createElement('div');
      card.className = 'relationship-card';
      card.innerHTML = `
        <div class="rel-portrait">${rel.portrait ?? '🧙'}</div>
        <div class="rel-name">${rel.name}</div>
        <div class="rel-tier">${tierName}</div>
        <div class="rel-bar-bg">
          <div class="rel-bar-fill" style="width:${Math.round(progress * 100)}%"></div>
        </div>
        <div class="rel-points">${rel.points} pts${nextThreshold != null ? ` / ${nextThreshold} → ${nextTier}` : ' (Max)'}</div>
      `;
      grid.appendChild(card);
    });

    screen.appendChild(grid);
    c.appendChild(screen);
  },

  update(dt) {},
};

export default RelationshipScreen;
