/**
 * SettingsScreen — audio volumes, text speed, display toggles.
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import SaveSystem from '../SaveSystem.js';

const TEXT_SPEEDS = ['slow', 'normal', 'fast', 'instant'];

const SettingsScreen = {
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
    screen.className = 'settings-screen fade-in';

    // Header
    const header = document.createElement('div');
    header.className = 'screen-header';
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back';
    backBtn.textContent = '← Back';
    backBtn.addEventListener('click', () => {
      SaveSystem.saveSettings();
      EventBus.emit('screen:pop');
    });
    const title = document.createElement('h2');
    title.textContent = '⚙️ Settings';
    header.appendChild(backBtn);
    header.appendChild(title);
    screen.appendChild(header);

    const body = document.createElement('div');
    body.className = 'settings-body';

    // Audio
    const audioGroup = this._makeGroup('Audio');
    audioGroup.appendChild(this._makeSlider('Music Volume', 'musicVolume', 0, 1, 0.05));
    audioGroup.appendChild(this._makeSlider('SFX Volume', 'sfxVolume', 0, 1, 0.05));
    body.appendChild(audioGroup);

    // Gameplay
    const gameGroup = this._makeGroup('Gameplay');
    gameGroup.appendChild(this._makeTextSpeed());
    body.appendChild(gameGroup);

    // Data
    const dataGroup = this._makeGroup('Data');
    dataGroup.appendChild(this._makeClearDataBtn());
    body.appendChild(dataGroup);

    screen.appendChild(body);
    c.appendChild(screen);
  },

  _makeGroup(label) {
    const g = document.createElement('div');
    g.className = 'settings-group';
    const h = document.createElement('h3');
    h.textContent = label;
    g.appendChild(h);
    return g;
  },

  _makeSlider(label, key, min, max, step) {
    const row = document.createElement('div');
    row.className = 'setting-row';

    const lbl = document.createElement('span');
    lbl.className = 'setting-label';
    lbl.textContent = label;

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.alignItems = 'center';
    right.style.gap = '8px';

    const val = document.createElement('span');
    val.className = 'setting-value';
    val.textContent = Math.round(GameState.settings[key] * 100) + '%';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'settings-slider';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = GameState.settings[key];
    slider.addEventListener('input', () => {
      GameState.settings[key] = parseFloat(slider.value);
      val.textContent = Math.round(GameState.settings[key] * 100) + '%';
      EventBus.emit('settings:changed', { key, value: GameState.settings[key] });
    });

    right.appendChild(val);
    right.appendChild(slider);
    row.appendChild(lbl);
    row.appendChild(right);
    return row;
  },

  _makeTextSpeed() {
    const row = document.createElement('div');
    row.className = 'setting-row';

    const lbl = document.createElement('span');
    lbl.className = 'setting-label';
    lbl.textContent = 'Text Speed';

    const select = document.createElement('select');
    select.style.cssText = 'background:var(--color-panel);border:1px solid var(--color-border);color:var(--color-text);padding:4px 8px;border-radius:4px;cursor:pointer';
    TEXT_SPEEDS.forEach(speed => {
      const opt = document.createElement('option');
      opt.value = speed;
      opt.textContent = speed.charAt(0).toUpperCase() + speed.slice(1);
      if (GameState.settings.textSpeed === speed) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => {
      GameState.settings.textSpeed = select.value;
    });

    row.appendChild(lbl);
    row.appendChild(select);
    return row;
  },

  _makeClearDataBtn() {
    const row = document.createElement('div');
    row.className = 'setting-row';

    const lbl = document.createElement('span');
    lbl.className = 'setting-label';
    lbl.style.color = 'var(--color-danger)';
    lbl.textContent = 'Clear All Save Data';

    const btn = document.createElement('button');
    btn.className = 'btn-secondary';
    btn.style.borderColor = 'var(--color-danger)';
    btn.style.color = 'var(--color-danger)';
    btn.textContent = 'Clear';
    btn.addEventListener('click', () => {
      if (confirm('Delete ALL save data? This cannot be undone.')) {
        for (let i = 0; i < 3; i++) localStorage.removeItem(`sca_save_${i}`);
        localStorage.removeItem('sca_autosave');
        EventBus.emit('toast', { message: 'All save data cleared.', type: 'info' });
      }
    });

    row.appendChild(lbl);
    row.appendChild(btn);
    return row;
  },

  update(dt) {},
};

export default SettingsScreen;
