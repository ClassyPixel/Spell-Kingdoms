/**
 * MapScreen — world map rendered as a country silhouette with
 * scattered location pins positioned inside the land mass.
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import { LOCATIONS } from '../Data.js';
import MusicPlayer from '../systems/MusicPlayer.js';

// Position each location as [left%, top%] within the map canvas.
const PIN_POSITIONS = {
  headmaster_office: [49,  16],
  library:           [24,  38],
  dueling_grounds:   [72,  34],
  academy_courtyard: [48,  55],
  market:            [29,  70],
  dormitory:         [68,  72],
};

// Road connections between locations (pairs of location IDs)
const ROADS = [
  ['headmaster_office', 'academy_courtyard'],
  ['library',           'academy_courtyard'],
  ['dueling_grounds',   'academy_courtyard'],
  ['academy_courtyard', 'market'],
  ['academy_courtyard', 'dormitory'],
  ['library',           'headmaster_office'],
  ['dueling_grounds',   'headmaster_office'],
];

// Country border path — viewBox 800 × 500
const COUNTRY_PATH = `
  M 118,148
  C 132,90  195,48  295,36
  C 368,26  415,54  476,38
  C 548,20  636,46  702,88
  C 752,124 764,188 744,244
  C 728,294 706,332 722,392
  C 738,442 702,474 638,470
  C 578,466 518,448 458,466
  C 398,484 336,472 272,456
  C 210,440 156,462 114,432
  C 74,402  58,352  68,292
  C 78,232  104,196 118,148 Z
`;

const MapScreen = {
  _container: null,
  _locations: [],

  mount(container, params = {}) {
    this._container = container;
    this._locations = LOCATIONS;
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

    // Title
    const title = document.createElement('div');
    title.className = 'map-title';
    title.textContent = '— Arcane Card Kingdom —';
    screen.appendChild(title);

    // Map canvas
    const canvas = document.createElement('div');
    canvas.className = 'map-canvas';

    // SVG layer: country silhouette + roads + decorations
    canvas.innerHTML = this._buildSVG();

    // Location pins (HTML, positioned over the SVG)
    this._locations.forEach(loc => {
      const pos = PIN_POSITIONS[loc.id];
      if (!pos) return;

      const unlocked  = GameState.isLocationUnlocked(loc.id);
      const isCurrent = GameState.progression.currentLocation === loc.id;

      const pin = document.createElement('div');
      pin.className = 'map-pin' +
        (!unlocked  ? ' locked'  : '') +
        (isCurrent  ? ' current' : '');
      pin.style.left = pos[0] + '%';
      pin.style.top  = pos[1] + '%';

      pin.innerHTML = `
        <div class="map-pin-diamond">
          <div class="map-pin-icon">${loc.icon ?? '🏛️'}</div>
        </div>
        <div class="map-pin-label">${loc.name}</div>
        <div class="map-pin-tag">${loc.tag ?? ''}</div>
        ${isCurrent ? '<div class="map-pin-pulse"></div>' : ''}
        ${!unlocked ? '<div class="map-pin-lock">🔒</div>' : ''}
      `;

      if (unlocked) {
        pin.addEventListener('click', () => this._travel(loc));
      }

      canvas.appendChild(pin);
    });

    screen.appendChild(canvas);

    // Footer hint
    const hint = document.createElement('div');
    hint.className = 'map-hint';
    hint.textContent = `You are at: ${this._getCurrentLocationName()}`;
    screen.appendChild(hint);

    c.appendChild(screen);
  },

  _buildSVG() {
    // Compute road line endpoints from PIN_POSITIONS (800×500 canvas)
    const W = 800, H = 500;
    const roadLines = ROADS.map(([a, b]) => {
      const [ax, ay] = PIN_POSITIONS[a] ?? [50, 50];
      const [bx, by] = PIN_POSITIONS[b] ?? [50, 50];
      return `<line
        x1="${ax / 100 * W}" y1="${ay / 100 * H}"
        x2="${bx / 100 * W}" y2="${by / 100 * H}"
        class="map-road"
      />`;
    }).join('');

    return `
    <svg class="map-svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet"
         xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="map-glow">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="map-shadow">
          <feDropShadow dx="4" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.5"/>
        </filter>
        <radialGradient id="land-grad" cx="50%" cy="45%" r="55%">
          <stop offset="0%"   stop-color="#1e3a2a"/>
          <stop offset="60%"  stop-color="#16301f"/>
          <stop offset="100%" stop-color="#0e2016"/>
        </radialGradient>
        <pattern id="noise" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="transparent"/>
          <circle cx="1" cy="1" r="0.6" fill="rgba(255,255,255,0.03)"/>
          <circle cx="3" cy="3" r="0.4" fill="rgba(255,255,255,0.02)"/>
        </pattern>
      </defs>

      <!-- Ocean / background -->
      <rect width="800" height="500" fill="#0a1520"/>
      <!-- Ocean ripple lines -->
      <line x1="0" y1="80"  x2="800" y2="80"  stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      <line x1="0" y1="160" x2="800" y2="160" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      <line x1="0" y1="240" x2="800" y2="240" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      <line x1="0" y1="320" x2="800" y2="320" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      <line x1="0" y1="400" x2="800" y2="400" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>

      <!-- Country shadow/glow -->
      <path d="${COUNTRY_PATH}" fill="rgba(30,80,50,0.25)" transform="translate(6,8)" filter="url(#map-shadow)"/>

      <!-- Country land mass -->
      <path d="${COUNTRY_PATH}" fill="url(#land-grad)" stroke="#2a6040" stroke-width="2.5" filter="url(#map-glow)"/>
      <!-- Noise texture overlay -->
      <path d="${COUNTRY_PATH}" fill="url(#noise)"/>
      <!-- Inner land highlight -->
      <path d="${COUNTRY_PATH}" fill="none" stroke="rgba(80,180,100,0.15)" stroke-width="6"/>

      <!-- Terrain decorations -->
      <!-- Mountains (upper area) -->
      <text x="540" y="130" font-size="22" opacity="0.35" text-anchor="middle">⛰️</text>
      <text x="570" y="110" font-size="18" opacity="0.25" text-anchor="middle">⛰️</text>
      <text x="190" y="180" font-size="16" opacity="0.3"  text-anchor="middle">⛰️</text>
      <!-- Forests -->
      <text x="150" y="290" font-size="14" opacity="0.3"  text-anchor="middle">🌲</text>
      <text x="170" y="310" font-size="12" opacity="0.25" text-anchor="middle">🌲</text>
      <text x="640" y="300" font-size="14" opacity="0.3"  text-anchor="middle">🌲</text>
      <text x="660" y="320" font-size="12" opacity="0.25" text-anchor="middle">🌲</text>
      <text x="430" y="410" font-size="13" opacity="0.25" text-anchor="middle">🌲</text>
      <!-- River -->
      <path d="M 390,180 Q 400,260 380,350 Q 370,400 360,440"
            fill="none" stroke="rgba(80,140,220,0.25)" stroke-width="3" stroke-linecap="round"/>
      <!-- Small lake -->
      <ellipse cx="530" cy="390" rx="22" ry="12" fill="rgba(80,140,220,0.2)" stroke="rgba(100,160,240,0.3)" stroke-width="1"/>

      <!-- Roads between locations -->
      ${roadLines}

      <!-- Compass rose (bottom right) -->
      <g transform="translate(742,448)" opacity="0.45">
        <circle r="22" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <text y="-9"  text-anchor="middle" font-size="9"  fill="#ccc">N</text>
        <text y="14"  text-anchor="middle" font-size="9"  fill="#ccc">S</text>
        <text x="-12" y="4"  text-anchor="middle" font-size="9" fill="#ccc">W</text>
        <text x="14"  y="4"  text-anchor="middle" font-size="9" fill="#ccc">E</text>
        <line x1="0" y1="-6" x2="0"  y2="-18" stroke="#e8c84a" stroke-width="1.5"/>
        <line x1="0" y1="6"  x2="0"  y2="18"  stroke="#888"    stroke-width="1"/>
        <line x1="-6" y1="0" x2="-18" y2="0"  stroke="#888"    stroke-width="1"/>
        <line x1="6"  y1="0" x2="18"  y2="0"  stroke="#888"    stroke-width="1"/>
        <circle r="3" fill="#e8c84a"/>
      </g>

      <!-- Map title scroll (top left) -->
      <rect x="14" y="14" width="168" height="36" rx="4"
            fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <text x="98" y="37" text-anchor="middle" font-size="13" fill="rgba(232,200,74,0.85)"
            font-style="italic">Arcane Card Kingdom</text>
    </svg>`;
  },

  _getCurrentLocationName() {
    const id  = GameState.progression.currentLocation;
    const loc = this._locations.find(l => l.id === id);
    return loc ? loc.name : id;
  },

  _travel(loc) {
    GameState.progression.currentLocation = loc.id;
    EventBus.emit('screen:push', { screen: SceneScreen_ref, params: { locationId: loc.id } });
  },
};

let SceneScreen_ref = null;
export function setSceneScreenRef(ref) { SceneScreen_ref = ref; }

export default MapScreen;
