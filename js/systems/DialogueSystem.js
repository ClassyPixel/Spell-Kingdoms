/**
 * DialogueSystem — parses per-NPC dialogue JSON, evaluates conditions,
 * applies effects, and drives DialogueScreen via EventBus.
 *
 * Listens:
 *   dialogue:start    { npcId }
 *   dialogue:advance  {}
 *   dialogue:choice   { index }
 *
 * Emits:
 *   dialogue:show  { speaker, portrait, text, choices, canContinue }
 *   dialogue:end   {}
 *   + any effect events (cardgame:start, shop:open, quest:trigger, ...)
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import SaveSystem from '../SaveSystem.js';
import { DIALOGUES, DIALOGUE_REACTIONS } from '../Data.js';

const TIER_NAMES = ['Stranger', 'Acquaintance', 'Friend', 'Close Friend', 'Bonded'];

// Load saved editor overrides from localStorage and merge onto base data
function loadOverrides() {
  try {
    const raw = localStorage.getItem('sca_dialogue_overrides');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function loadDialogue(npcId) {
  const base = DIALOGUES[npcId] ?? { npcId, nodes: { start: { speaker: npcId, text: '...', choices: [] } } };
  const overrides = loadOverrides();
  if (!overrides?.[npcId]) return base;

  // Deep-merge: only text/speaker/choice labels are overridable; logic (effects, requires) is preserved
  const merged = JSON.parse(JSON.stringify(base));
  Object.entries(overrides[npcId].nodes ?? {}).forEach(([nodeId, ov]) => {
    const node = merged.nodes[nodeId];
    if (!node) return;
    if (ov.speaker !== undefined) node.speaker = ov.speaker;
    if (ov.text    !== undefined) node.text    = ov.text;
    (ov.choices ?? []).forEach((ch, i) => {
      if (node.choices?.[i] && ch.label !== undefined) node.choices[i].label = ch.label;
    });
  });
  return merged;
}

const DialogueSystem = {
  _npcId:        null,
  _nodes:        null,
  _currentNode:  null,
  _npcPortrait:  null,
  _shopPending:  false,

  init() {
    EventBus.on('dialogue:start',   (d) => this._start(d.npcId, d.nodeOverride));
    EventBus.on('dialogue:advance', ()  => this._advance());
    EventBus.on('dialogue:choice',  (d) => this._choose(d.index));
  },

  _start(npcId, nodeOverride) {
    const data = loadDialogue(npcId);
    this._npcId       = npcId;
    this._nodes       = data.nodes ?? {};
    this._shopPending = false;
    this._npcPortrait = data.portrait ?? GameState.relationships[npcId]?.portrait ?? '🧙';

    // Mount dialogue overlay (registers its listeners before dialogue:show fires)
    DialogueScreen_ref.showOverlay(npcId);

    // Now start dialogue — dialogue:show will be caught by the overlay
    const entryNode = nodeOverride ?? this._resolveEntry(data);
    this._goTo(entryNode);
  },

  _resolveEntry(data) {
    // Allow NPCs to declare conditional entry points
    if (data.entries) {
      for (const entry of data.entries) {
        if (this._checkRequires(entry.requires)) return entry.node;
      }
    }
    return 'start';
  },

  _goTo(nodeId) {
    if (!nodeId || !this._nodes[nodeId]) {
      this._end();
      return;
    }
    this._currentNode = nodeId;
    const node = this._nodes[nodeId];

    // Apply on-enter effects
    if (node.effects) node.effects.forEach(e => this._applyEffect(e));

    // Build choices visible to player
    const choices = (node.choices ?? []).map(ch => {
      const locked = !this._checkRequires(ch.requires);
      return {
        label:           ch.label,
        locked,
        charmLocked:     locked && ch.requires?.min_charm !== undefined,
        requirementText: locked ? this._requirementLabel(ch.requires) : null,
        _raw:            ch,
      };
    }).filter(ch => !ch._raw.hidden || !ch.locked);

    const canContinue = !choices.length && !!node.next;

    // Reaction: node-level override first, then lookup table, then neutral
    const reaction = node.reaction
      ?? DIALOGUE_REACTIONS[`${this._npcId}.${nodeId}`]
      ?? 'neutral';

    EventBus.emit('dialogue:show', {
      speaker:     node.speaker ?? this._npcId,
      portrait:    node.portrait ?? this._npcPortrait,
      text:        node.text ?? '',
      choices,
      canContinue,
      reaction,
    });
  },

  _advance() {
    const node = this._nodes[this._currentNode];
    if (!node) { this._end(); return; }
    if (node.next) {
      this._goTo(node.next);
    } else {
      this._end();
    }
  },

  _choose(index) {
    const node = this._nodes[this._currentNode];
    if (!node) return;
    const choices = (node.choices ?? []).filter(ch => !ch.hidden || this._checkRequires(ch.requires));
    const choice  = choices[index];
    if (!choice || !this._checkRequires(choice.requires)) return;

    // Apply choice effects
    (choice.effects ?? []).forEach(e => this._applyEffect(e));

    if (choice.next) {
      this._goTo(choice.next);
    } else if (!this._shopPending) {
      this._end();
    }
  },

  _end() {
    // Autosave after every dialogue completion
    SaveSystem.autosave();
    EventBus.emit('dialogue:end');
  },

  // ──────────────────────────────────────────
  // Condition evaluation
  // ──────────────────────────────────────────

  _checkRequires(req) {
    if (!req) return true;

    if (req.flag !== undefined) {
      const expected = req.flag_value ?? true;
      if (GameState.getFlag(req.flag) !== expected) return false;
    }

    if (req.flag_unset) {
      if (GameState.getFlag(req.flag_unset)) return false;
    }

    if (req.relationship_tier !== undefined) {
      const rel = GameState.getRelationship(this._npcId);
      if (!rel || rel.tier < req.relationship_tier) return false;
    }

    if (req.has_item) {
      if (!GameState.hasItem(req.has_item)) return false;
    }

    if (req.min_gold !== undefined) {
      if (GameState.player.coin < req.min_gold) return false;
    }

    if (req.quest_active) {
      if (!GameState.quests.active.includes(req.quest_active)) return false;
    }

    if (req.quest_completed) {
      if (!GameState.quests.completed.includes(req.quest_completed)) return false;
    }

    if (req.min_charm !== undefined) {
      if ((GameState.player.charm ?? 0) < req.min_charm) return false;
    }

    return true;
  },

  _requirementLabel(req) {
    if (!req) return null;
    if (req.min_charm !== undefined) {
      return `(Lv.${req.min_charm} Charm Required)`;
    }
    if (req.relationship_tier !== undefined) {
      return `[${TIER_NAMES[req.relationship_tier] ?? `Tier ${req.relationship_tier}`} needed]`;
    }
    if (req.flag) return `[Requires: ${req.flag}]`;
    if (req.has_item) return `[Need: ${req.has_item}]`;
    if (req.min_gold !== undefined) return `[Need: ${req.min_gold} coins]`;
    return '[Locked]';
  },

  // ──────────────────────────────────────────
  // Effect execution
  // ──────────────────────────────────────────

  _applyEffect(effect) {
    switch (effect.type) {
      case 'relationship': {
        const delta = effect.value ?? 1;
        GameState.addRelationshipPoints(effect.npcId ?? this._npcId, delta);
        EventBus.emit('relationship:changed', { npcId: effect.npcId ?? this._npcId, delta });
        break;
      }

      case 'setFlag':
        GameState.setFlag(effect.flag, effect.value ?? true);
        break;

      case 'addItem':
        GameState.addItem(effect.itemId, effect.quantity ?? 1);
        EventBus.emit('toast', { message: `Received: ${effect.itemId}`, type: 'info' });
        break;

      case 'addGold':
      case 'addCoin':
        GameState.addCoin(effect.amount ?? 0);
        EventBus.emit('toast', { message: `Received ${effect.amount} coins`, type: 'success' });
        break;

      case 'triggerCardGame':
        // End dialogue, then start card game
        EventBus.emit('cardgame:start', { npcId: effect.npcId ?? this._npcId });
        break;

      case 'openShop': {
        this._shopPending = true;
        EventBus.emit('shop:open', { shopId: effect.shopId, shopName: effect.shopName });
        const _unsubShop = EventBus.on('shop:closed', () => {
          _unsubShop();
          this._shopPending = false;
          // Defer by one tick so ScreenManager finishes re-mounting DialogueScreen
          // before we emit dialogue:show / dialogue:end.
          setTimeout(() => {
            if (this._nodes?.farewell) {
              this._goTo('farewell');
            } else {
              this._end();
            }
          }, 0);
        });
        break;
      }

      case 'triggerQuest':
        EventBus.emit('quest:trigger', { questId: effect.questId });
        break;

      case 'completeObjective':
        GameState.setFlag(`obj_done_${effect.objectiveId}`, true);
        EventBus.emit('quest:objectiveComplete', { objectiveId: effect.objectiveId });
        break;

      case 'unlockLocation':
        GameState.unlockLocation(effect.locationId);
        EventBus.emit('toast', { message: `New location: ${effect.locationId}`, type: 'info' });
        break;

      default:
        console.warn('[DialogueSystem] Unknown effect type:', effect.type);
    }
  },
};

let DialogueScreen_ref = null;
export function setDialogueScreenRef(ref) { DialogueScreen_ref = ref; }

export default DialogueSystem;
