/**
 * RelationshipSystem — reacts to relationship changes and unlocks content.
 *
 * Listens:
 *   relationship:changed { npcId }
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';

const TIER_NAMES  = ['Stranger', 'Acquaintance', 'Friend', 'Close Friend', 'Bonded'];
const TIER_REWARDS = {
  // npcId → { tier → reward }
  aria: {
    1: { message: 'Aria thinks of you as an acquaintance.' },
    2: { message: 'Aria considers you a friend!', unlockFlag: 'aria_friend_quest' },
    3: { message: 'Aria opens up to you about her past.', unlockFlag: 'aria_story_scene' },
    4: { message: 'You and Aria share a deep bond.', card: 'phoenix_feather', unlockFlag: 'aria_final_arc' },
  },
  master_aldric: {
    1: { message: 'Master Aldric acknowledges your progress.' },
    2: { message: 'Master Aldric agrees to give you extra lessons.', unlockFlag: 'aldric_lessons' },
    3: { message: 'Master Aldric reveals secrets of the Academy.', unlockFlag: 'aldric_secret' },
    4: { message: 'Master Aldric bestows a rare spell upon you.', card: 'arcane_mastery', unlockFlag: 'aldric_final_arc' },
  },
  zephyr: {
    1: { message: 'Zephyr gives you a knowing nod.' },
    2: { message: 'Zephyr shares a mysterious tip.', unlockFlag: 'zephyr_tip' },
    3: { message: 'Zephyr trusts you with a secret.', unlockFlag: 'zephyr_secret' },
    4: { message: 'Zephyr reveals their true identity.', card: 'void_step', unlockFlag: 'zephyr_final_arc' },
  },
};

const RelationshipSystem = {
  _prevTiers: {},

  init() {
    // Record initial tiers
    Object.entries(GameState.relationships).forEach(([npcId, rel]) => {
      this._prevTiers[npcId] = rel.tier;
    });

    EventBus.on('relationship:changed', (d) => this._onChanged(d.npcId));
  },

  _onChanged(npcId) {
    const rel = GameState.getRelationship(npcId);
    if (!rel) return;

    const prevTier = this._prevTiers[npcId] ?? 0;
    const newTier  = rel.tier;

    if (newTier > prevTier) {
      this._prevTiers[npcId] = newTier;
      this._applyTierReward(npcId, newTier);
    }
  },

  _applyTierReward(npcId, tier) {
    const tierName = TIER_NAMES[tier] ?? `Tier ${tier}`;
    const reward = TIER_REWARDS[npcId]?.[tier];

    EventBus.emit('toast', {
      message: `${GameState.relationships[npcId]?.name ?? npcId}: ${tierName}!`,
      type: 'success',
    });

    if (reward) {
      if (reward.message) {
        // Could show as a special notification
        console.log(`[RelationshipSystem] ${reward.message}`);
      }
      if (reward.unlockFlag) {
        GameState.setFlag(reward.unlockFlag);
      }
      if (reward.card) {
        GameState.addCardToCollection(reward.card);
        EventBus.emit('toast', { message: `New card: ${reward.card}!`, type: 'success' });
      }
    }

    EventBus.emit('relationship:tierUp', { npcId, tier, tierName });
  },
};

export default RelationshipSystem;
