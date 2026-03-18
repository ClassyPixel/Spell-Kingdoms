/**
 * QuestSystem — tracks quest state via EventBus listeners.
 * Never imported by screens; communicates only through events.
 *
 * Listens:
 *   quest:trigger          { questId }
 *   quest:objectiveComplete { objectiveId }
 *   cardgame:result        { win, npcId }
 *   dialogue:end           {}
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import { QUESTS } from '../Data.js';

const QuestSystem = {
  _questMap: {},

  init() {
    // Deep-clone quests then apply any editor overrides
    const overrides = this._loadOverrides();
    QUESTS.forEach(q => {
      const clone = JSON.parse(JSON.stringify(q));
      const ov = overrides[q.questId];
      if (ov) {
        if (ov.title)       clone.title       = ov.title;
        if (ov.description) clone.description = ov.description;
        Object.entries(ov.objectives ?? {}).forEach(([objId, ov2]) => {
          const obj = clone.objectives?.find(o => o.id === objId);
          if (obj && ov2.description) obj.description = ov2.description;
        });
      }
      this._questMap[q.questId] = clone;
    });

    EventBus.on('quest:trigger',           (d) => this._trigger(d.questId));
    EventBus.on('quest:objectiveComplete', (d) => this._checkCompletion(d.objectiveId));
    EventBus.on('cardgame:result',         (d) => this._onCardResult(d));
  },

  _trigger(questId) {
    const quest = this._questMap[questId];
    if (!quest) return;

    if (GameState.quests.active.includes(questId) ||
        GameState.quests.completed.includes(questId)) return;

    GameState.quests.active.push(questId);
    EventBus.emit('toast', { message: `Quest started: ${quest.title}`, type: 'info' });
    EventBus.emit('quest:started', { questId });
  },

  _checkCompletion(objectiveId) {
    // Check each active quest to see if all objectives are done
    GameState.quests.active.forEach(questId => {
      const quest = this._questMap[questId];
      if (!quest) return;

      const allDone = (quest.objectives ?? []).every(obj =>
        GameState.getFlag(`obj_done_${obj.id}`)
      );

      if (allDone) this._complete(questId);
    });
  },

  _complete(questId) {
    const quest = this._questMap[questId];
    if (!quest) return;

    const idx = GameState.quests.active.indexOf(questId);
    if (idx !== -1) GameState.quests.active.splice(idx, 1);
    GameState.quests.completed.push(questId);

    // Apply rewards
    const rewards = quest.rewards ?? {};
    if (rewards.gold) {
      GameState.addGold(rewards.gold);
      EventBus.emit('toast', { message: `Reward: ${rewards.gold}g`, type: 'success' });
    }
    (rewards.cards ?? []).forEach(cardId => {
      GameState.addCardToCollection(cardId);
      EventBus.emit('toast', { message: `Card unlocked: ${cardId}`, type: 'success' });
    });
    (rewards.items ?? []).forEach(itemId => {
      GameState.addItem(itemId, 1);
    });
    (rewards.unlockLocations ?? []).forEach(locId => {
      GameState.unlockLocation(locId);
    });

    EventBus.emit('toast', { message: `Quest complete: ${quest.title}!`, type: 'success' });
    EventBus.emit('quest:completed', { questId });
  },

  _loadOverrides() {
    try {
      const raw = localStorage.getItem('sca_quest_overrides');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  },

  _onCardResult({ win, npcId }) {
    if (!win) return;
    // Mark card_victory objectives for active quests
    GameState.quests.active.forEach(questId => {
      const quest = this._questMap[questId];
      if (!quest) return;
      (quest.objectives ?? []).forEach(obj => {
        if (obj.type === 'card_victory' && obj.target?.npcId === npcId) {
          GameState.setFlag(`obj_done_${obj.id}`, true);
          EventBus.emit('quest:objectiveComplete', { objectiveId: obj.id });
        }
      });
    });
  },
};

export default QuestSystem;
