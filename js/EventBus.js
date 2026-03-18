/**
 * EventBus — lightweight pub/sub for decoupled system communication.
 * Systems never import each other; they communicate exclusively via events.
 */
const EventBus = {
  _listeners: {},

  /** Subscribe to an event. Returns an unsubscribe function. */
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return () => this.off(event, callback);
  },

  /** Subscribe to an event exactly once. */
  once(event, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  },

  /** Unsubscribe a specific callback. */
  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  },

  /** Emit an event with optional data. */
  emit(event, data) {
    if (!this._listeners[event]) return;
    // Shallow copy to avoid mutation during iteration
    [...this._listeners[event]].forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error(`[EventBus] Error in listener for "${event}":`, err);
      }
    });
  },

  /** Remove all listeners (useful for testing or screen teardown). */
  clear(event) {
    if (event) {
      delete this._listeners[event];
    } else {
      this._listeners = {};
    }
  }
};

export default EventBus;
