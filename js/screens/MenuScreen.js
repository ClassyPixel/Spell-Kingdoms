/**
 * MenuScreen — Save / Load overlay.
 * Pushed on top of the current screen; popping returns to game.
 */
import EventBus  from '../EventBus.js';
import SaveSystem from '../SaveSystem.js';

const MenuScreen = {
  _container: null,

  mount(container) {
    this._container = container;
    this._render();
  },

  unmount() {
    this._container = null;
  },

  _render() {
    const c = this._container;
    c.innerHTML = '';

    const overlay = document.createElement('div');
    overlay.className = 'menu-screen fade-in';

    const panel = document.createElement('div');
    panel.className = 'menu-panel';

    const title = document.createElement('h2');
    title.textContent = '— Save / Load —';
    panel.appendChild(title);

    const list = document.createElement('div');
    list.className = 'menu-items';

    // Save Game
    const saveEl = document.createElement('div');
    saveEl.className = 'menu-item';
    saveEl.innerHTML = `<span class="menu-item-icon">💾</span><span>Save Game</span>`;
    saveEl.addEventListener('click', () => this._openSlotPicker('save'));
    list.appendChild(saveEl);

    // Load Game
    const loadEl = document.createElement('div');
    loadEl.className = 'menu-item';
    loadEl.innerHTML = `<span class="menu-item-icon">📂</span><span>Load Game</span>`;
    loadEl.addEventListener('click', () => this._openSlotPicker('load'));
    list.appendChild(loadEl);

    // Divider
    const div = document.createElement('div');
    div.className = 'menu-divider';
    list.appendChild(div);

    // Return to Title
    const titleEl = document.createElement('div');
    titleEl.className = 'menu-item';
    titleEl.style.color = 'var(--color-text-dim)';
    titleEl.innerHTML = `<span class="menu-item-icon">🚪</span><span>Return to Title</span>`;
    titleEl.addEventListener('click', () => EventBus.emit('game:returnToTitle'));
    list.appendChild(titleEl);

    panel.appendChild(list);

    // Resume
    const closeBtn = document.createElement('button');
    closeBtn.className = 'back-btn';
    closeBtn.textContent = '← Resume';
    closeBtn.style.cssText = 'margin-top:14px;width:100%';
    closeBtn.addEventListener('click', () => EventBus.emit('screen:pop'));
    panel.appendChild(closeBtn);

    overlay.appendChild(panel);
    overlay.addEventListener('click', e => { if (e.target === overlay) EventBus.emit('screen:pop'); });
    c.appendChild(overlay);
  },

  _openSlotPicker(mode) {
    const slots = SaveSystem.getSlotsInfo();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const box = document.createElement('div');
    box.className = 'modal-box';
    box.style.width = '340px';

    const h = document.createElement('h3');
    h.textContent = mode === 'save' ? 'Save Game' : 'Load Game';
    box.appendChild(h);

    slots.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'save-slot' + (s.empty ? ' empty' : '');
      btn.style.cssText = 'width:100%;display:flex;flex-direction:column;align-items:flex-start;margin-bottom:8px;padding:10px 14px;background:var(--color-bg2);border:1px solid var(--color-border);border-radius:8px;cursor:pointer;color:var(--color-text)';

      if (s.empty) {
        btn.innerHTML = `<span style="font-weight:600;color:var(--color-text-dim)">Slot ${s.slot + 1} — Empty</span>`;
        if (mode === 'load') btn.disabled = true;
      } else {
        btn.innerHTML = `
          <span style="font-weight:600;color:var(--color-accent2)">Slot ${s.slot + 1} — ${s.playerName}</span>
          <span style="font-size:0.8em;color:var(--color-text-dim)">${s.location ?? ''} · ${SaveSystem.formatTimestamp(s.timestamp)}</span>
          <span style="font-size:0.75em;color:var(--color-text-dim)">${SaveSystem.formatPlaytime(s.playtime)}</span>
        `;
      }

      btn.addEventListener('click', () => {
        if (mode === 'save') {
          SaveSystem.save(s.slot);
          overlay.remove();
          EventBus.emit('toast', { message: `Saved to Slot ${s.slot + 1}`, type: 'success' });
        } else {
          if (SaveSystem.load(s.slot)) {
            overlay.remove();
            EventBus.emit('screen:pop'); // close menu
            EventBus.emit('game:loaded');
          }
        }
      });
      box.appendChild(btn);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => overlay.remove());
    box.appendChild(cancelBtn);

    overlay.appendChild(box);
    this._container.appendChild(overlay);
  },

  update(dt) {},
};

export default MenuScreen;
