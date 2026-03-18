/**
 * SceneScreen — shows the location backdrop and NPC sprites.
 * Clicking an NPC starts a dialogue.
 * Bottom bar: location name + "Open Map" button.
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import { NPCS, LOCATIONS } from '../Data.js';

const SceneScreen = {
  _container: null,
  _locationId: null,

  mount(container, params = {}) {
    this._container = container;
    this._locationId = params.locationId ?? GameState.progression.currentLocation;

    const [npcs, locations] = [NPCS, LOCATIONS];

    const location = locations.find(l => l.id === this._locationId) ?? {
      id: this._locationId,
      name: this._locationId,
      description: '',
      icon: '🏛️',
      bgIcon: '🏛️',
    };

    const locationNpcs = npcs.filter(n => n.location === this._locationId);
    this._render(location, locationNpcs);
  },

  unmount() {
    this._container = null;
  },

  _render(location, npcs) {
    const c = this._container;
    c.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'scene-screen fade-in';

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

    const menuBtn = document.createElement('button');
    menuBtn.className = 'btn-scene';
    menuBtn.textContent = '☰ Menu';
    menuBtn.addEventListener('click', () => EventBus.emit('menu:open'));

    actions.appendChild(mapBtn);
    actions.appendChild(menuBtn);
    bar.appendChild(actions);
    screen.appendChild(bar);

    c.appendChild(screen);
  },

  _talkTo(npc) {
    EventBus.emit('dialogue:start', { npcId: npc.id });
  },
};

export default SceneScreen;
