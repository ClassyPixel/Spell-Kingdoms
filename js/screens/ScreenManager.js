/**
 * ScreenManager — stack-based screen router.
 * Each screen implements: mount(container, params), unmount(), update?(dt)
 *
 * push(screen, params) — navigate to a new screen
 * pop()               — go back to previous screen
 * replace(screen, params) — replace current without adding to history
 * clear(screen, params)   — clear stack entirely, set root screen
 */
import EventBus from '../EventBus.js';

const ScreenManager = {
  _stack: [],
  _container: null,

  init(container) {
    this._container = container;
    EventBus.on('screen:push',    ({ screen, params }) => this.push(screen, params));
    EventBus.on('screen:pop',     ()                   => this.pop());
    EventBus.on('screen:replace', ({ screen, params }) => this.replace(screen, params));
    EventBus.on('screen:clear',   ({ screen, params }) => this.clear(screen, params));
  },

  /** Navigate to a new screen, pushing previous onto the stack. */
  push(screen, params = {}) {
    const current = this._current();
    if (current) current.unmount?.();

    this._stack.push({ screen, params });
    this._mount(screen, params);
    EventBus.emit('screen:changed', { screen, params, depth: this._stack.length });
  },

  /** Return to the previous screen. */
  pop() {
    if (this._stack.length <= 1) return;
    const { screen: current } = this._stack.pop();
    current.unmount?.();

    const { screen, params } = this._stack[this._stack.length - 1];
    this._mount(screen, params);
    EventBus.emit('screen:changed', { screen, params, depth: this._stack.length });
  },

  /** Replace current screen without modifying stack depth. */
  replace(screen, params = {}) {
    const current = this._current();
    if (current) current.unmount?.();

    this._stack[this._stack.length - 1] = { screen, params };
    this._mount(screen, params);
    EventBus.emit('screen:changed', { screen, params, depth: this._stack.length });
  },

  /** Clear all screens and set a new root. */
  clear(screen, params = {}) {
    while (this._stack.length > 0) {
      const { screen: s } = this._stack.pop();
      s.unmount?.();
    }
    this._stack.push({ screen, params });
    this._mount(screen, params);
    EventBus.emit('screen:changed', { screen, params, depth: 1 });
  },

  update(dt) {
    const entry = this._stack[this._stack.length - 1];
    if (entry?.screen?.update) {
      entry.screen.update(dt);
    }
  },

  _current() {
    return this._stack[this._stack.length - 1]?.screen ?? null;
  },

  _mount(screen, params) {
    this._container.innerHTML = '';
    screen.mount(this._container, params);
  },

  canGoBack() {
    return this._stack.length > 1;
  },
};

export default ScreenManager;
