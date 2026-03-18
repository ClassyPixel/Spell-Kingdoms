/**
 * GameEngine — drives the main game loop and wires all systems together.
 * Calls ScreenManager.update(dt) each frame; systems that need ticking
 * register themselves via EventBus 'engine:tick'.
 */
import EventBus from './EventBus.js';
import GameState from './GameState.js';

const GameEngine = {
  _running: false,
  _lastTime: 0,
  _rafId: null,
  _fpsTarget: 60,
  _minDt: 1 / 60,
  _maxDt: 0.1,   // clamp to 100ms to avoid spiral-of-death

  screenManager: null,

  init(screenManager) {
    this.screenManager = screenManager;
    console.log('[GameEngine] Initialized');
  },

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame(this._loop.bind(this));
    console.log('[GameEngine] Loop started');
  },

  stop() {
    this._running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  },

  _loop(now) {
    if (!this._running) return;

    const dt = Math.min((now - this._lastTime) / 1000, this._maxDt);
    this._lastTime = now;

    // Update current screen
    if (this.screenManager) {
      this.screenManager.update(dt);
    }

    // Notify any systems that subscribed for per-frame ticks
    EventBus.emit('engine:tick', { dt, now });

    this._rafId = requestAnimationFrame(this._loop.bind(this));
  },
};

export default GameEngine;
