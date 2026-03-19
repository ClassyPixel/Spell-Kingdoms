/**
 * MapScreen — world map with clickable location tiles.
 * Reads location data and unlocked state from GameState.
 * Navigates to SceneScreen on location click.
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import { LOCATIONS } from '../Data.js';
import MusicPlayer from '../systems/MusicPlayer.js';

// Location grid layout: [row, col] (0-indexed)
const GRID_POSITIONS = {
  academy_courtyard: [1, 1],
  library:           [0, 0],
  dueling_grounds:   [0, 2],
  market:            [2, 0],
  dormitory:         [2, 2],
  headmaster_office: [0, 1],
};

function loadLocations() {
  return LOCATIONS;
}

const MapScreen = {
  _container: null,
  _locations: [],

  mount(container, params = {}) {
    this._container = container;
    this._locations = loadLocations();
    MusicPlayer.play('assets/audio/matchost/Detuned.mp3');
    this._render();
  },

  unmount() {
    MusicPlayer.stop();
    this._container = null;
  },

  _render() {
    const c = this._container;
    c.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'map-screen fade-in';

    const title = document.createElement('h2');
    title.textContent = '— World Map —';
    screen.appendChild(title);

    // 3×3 grid
    const grid = document.createElement('div');
    grid.className = 'map-grid';
    // Fill 9 cells
    const cells = Array.from({ length: 9 }, () => null);

    for (const loc of this._locations) {
      const pos = GRID_POSITIONS[loc.id];
      if (pos) cells[pos[0] * 3 + pos[1]] = loc;
    }

    cells.forEach((loc, i) => {
      const cell = document.createElement('div');
      if (!loc) {
        cell.className = 'map-location locked';
        cell.innerHTML = '<div class="map-location-icon">🌫️</div>';
        grid.appendChild(cell);
        return;
      }

      const unlocked = GameState.isLocationUnlocked(loc.id);
      const isCurrent = GameState.progression.currentLocation === loc.id;

      cell.className = 'map-location' +
        (!unlocked ? ' locked' : '') +
        (isCurrent ? ' current' : '');

      cell.innerHTML = `
        <div class="map-location-icon">${loc.icon ?? '🏛️'}</div>
        <div class="map-location-name">${loc.name}</div>
        <div class="map-location-tag">${loc.tag ?? ''}</div>
        ${isCurrent ? '<div class="current-badge"></div>' : ''}
      `;

      if (unlocked) {
        cell.addEventListener('click', () => this._travel(loc));
      }

      grid.appendChild(cell);
    });

    screen.appendChild(grid);

    // Hint
    const hint = document.createElement('p');
    hint.style.cssText = 'margin-top:16px;font-size:0.8em;color:var(--color-text-dim)';
    hint.textContent = `Current location: ${this._getCurrentLocationName()}`;
    screen.appendChild(hint);

    c.appendChild(screen);
  },

  _getCurrentLocationName() {
    const id = GameState.progression.currentLocation;
    const loc = (this._locations || []).find(l => l.id === id);
    return loc ? loc.name : id;
  },

  _travel(loc) {
    GameState.progression.currentLocation = loc.id;
    EventBus.emit('screen:push', { screen: SceneScreen_ref, params: { locationId: loc.id } });
  },
};

// Forward reference resolved at runtime via dynamic import in main.js
let SceneScreen_ref = null;
export function setSceneScreenRef(ref) { SceneScreen_ref = ref; }

export default MapScreen;
