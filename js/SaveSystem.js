/**
 * SaveSystem — localStorage persistence.
 * Slots: sca_save_0, sca_save_1, sca_save_2 (manual)
 *        sca_autosave                         (auto)
 *        sca_settings                         (settings only)
 */
import GameState from './GameState.js';

const KEYS = {
  manual: (i) => `sca_save_${i}`,
  auto:   'sca_autosave',
  settings: 'sca_settings',
};

const SLOT_COUNT = 3;
const CURRENT_VERSION = 1;

const SaveSystem = {
  /** Save to a manual slot (0–2). */
  save(slotIndex) {
    if (slotIndex < 0 || slotIndex >= SLOT_COUNT) throw new Error(`Invalid slot: ${slotIndex}`);
    const data = {
      ...GameState.serialize(),
      meta: {
        timestamp: Date.now(),
        playerName: GameState.player.name,
        location: GameState.progression.currentLocation,
        playtime: this._getPlaytime(),
      },
    };
    try {
      localStorage.setItem(KEYS.manual(slotIndex), JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('[SaveSystem] Save failed:', e);
      return false;
    }
  },

  /** Load from a manual slot. Returns true on success. */
  load(slotIndex) {
    const raw = localStorage.getItem(KEYS.manual(slotIndex));
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      const migrated = this.migrate(data);
      GameState.deserialize(migrated);
      return true;
    } catch (e) {
      console.error('[SaveSystem] Load failed:', e);
      return false;
    }
  },

  /** Auto-save. */
  autosave() {
    const data = {
      ...GameState.serialize(),
      meta: {
        timestamp: Date.now(),
        playerName: GameState.player.name,
        location: GameState.progression.currentLocation,
        playtime: this._getPlaytime(),
      },
    };
    try {
      localStorage.setItem(KEYS.auto, JSON.stringify(data));
    } catch (e) {
      console.error('[SaveSystem] Autosave failed:', e);
    }
  },

  /** Load autosave. */
  loadAutosave() {
    const raw = localStorage.getItem(KEYS.auto);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      const migrated = this.migrate(data);
      GameState.deserialize(migrated);
      return true;
    } catch (e) {
      return false;
    }
  },

  /** Delete a save slot. */
  deleteSave(slotIndex) {
    localStorage.removeItem(KEYS.manual(slotIndex));
  },

  /** Return metadata for all slots (for UI display). */
  getSlotsInfo() {
    return Array.from({ length: SLOT_COUNT }, (_, i) => {
      const raw = localStorage.getItem(KEYS.manual(i));
      if (!raw) return { slot: i, empty: true };
      try {
        const data = JSON.parse(raw);
        return {
          slot: i,
          empty: false,
          playerName: data.meta?.playerName ?? 'Unknown',
          location:   data.meta?.location   ?? '?',
          timestamp:  data.meta?.timestamp  ?? 0,
          playtime:   data.meta?.playtime   ?? 0,
        };
      } catch {
        return { slot: i, empty: true };
      }
    });
  },

  /** Check if any save exists (for new-game vs continue). */
  hasSave() {
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (localStorage.getItem(KEYS.manual(i))) return true;
    }
    return !!localStorage.getItem(KEYS.auto);
  },

  /** Save settings only. */
  saveSettings() {
    localStorage.setItem(KEYS.settings, JSON.stringify(GameState.settings));
  },

  /** Load settings. */
  loadSettings() {
    const raw = localStorage.getItem(KEYS.settings);
    if (!raw) return;
    try {
      const settings = JSON.parse(raw);
      Object.assign(GameState.settings, settings);
    } catch {}
  },

  /** Forward-only migration: apply patches when save version is older. */
  migrate(data) {
    let v = data.version ?? 0;
    // v0 → v1: (initial release — nothing to do)
    if (v < 1) { v = 1; }
    data.version = v;
    return data;
  },

  // Track play session start
  _sessionStart: Date.now(),
  _savedPlaytime: 0,

  _getPlaytime() {
    return this._savedPlaytime + Math.floor((Date.now() - this._sessionStart) / 1000);
  },

  formatPlaytime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  },

  formatTimestamp(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString();
  },
};

export default SaveSystem;
