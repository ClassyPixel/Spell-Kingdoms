/**
 * Data.js — all game data inlined as JS exports.
 * No fetch() calls needed; works from file:// without a server.
 */

// ── Chapters ─────────────────────────────────────────────────────────────────
export const CHAPTERS = [
  {
    chapterId: 'chapter_1',
    number: 1,
    title: 'A Spark of Potential',
    subtitle: 'Every great mage begins somewhere.',
    intro: 'The iron gates of Arcane Card Kingdom swing open before you, revealing a world unlike anything you have known. The courtyard hums with restless energy — students practising incantations, sparks of arcane light tracing patterns in the morning air. You are a scholarship student: no noble bloodline, no legendary mentor. Just potential, and the stubborn belief that it is enough.\n\nThis is where your story begins.',
    triggerFlag: null,
    completionFlag: 'main_01_complete',
    scenes: [
      {
        sceneId: 'ch1_arrival',
        title: 'Arrival',
        text: 'You step through the gates with nothing but a letter of acceptance and a well-worn satchel. The Academy sprawls before you — ancient stone towers wound with ivy, bulletin boards plastered with notices, and the faint scent of sulphur from the dueling grounds drifting on the breeze.',
      },
      {
        sceneId: 'ch1_first_impressions',
        title: 'First Impressions',
        text: 'The other students barely glance at you. You are nobody here — yet. The Academy does not care about where you came from. It only cares about what you can do.',
      },
      {
        sceneId: 'ch1_orientation',
        title: 'Orientation',
        text: "A posted schedule directs new students to the Courtyard for orientation. The headmaster's speech is brief and pointed: \"Magic is not a gift. It is a discipline. Those who treat it as anything else do not last long here.\" The words settle over the crowd like a cold wind.",
      },
    ],
  },
  {
    chapterId: 'chapter_2',
    number: 2,
    title: 'Bonds and Battles',
    subtitle: 'Strength is tested. Friendships are forged.',
    intro: 'Weeks have passed since your arrival. The Academy is no longer a maze of unfamiliar corridors — it is beginning to feel, cautiously, like home. Your spell work has sharpened. Your relationships have deepened. And with them, complications have begun to surface.\n\nNot everyone at the Academy is who they seem. And the friendships you are building carry stakes you are only beginning to understand.',
    triggerFlag: 'main_01_complete',
    completionFlag: 'chapter_2_complete',
    scenes: [
      {
        sceneId: 'ch2_settling_in',
        title: 'Settling In',
        text: "You have found your rhythm. Morning theory lectures with Master Aldric, afternoons at the Dueling Grounds, evenings browsing Zephyr's eclectic stall. The Academy's routines have become your own.",
      },
      {
        sceneId: 'ch2_the_challenge',
        title: 'The Challenge',
        text: "Aria's challenge has been circling in your mind. She is skilled — more skilled than she lets on. Accepting means risking humiliation in front of the entire student body. Declining means something worse.",
      },
      {
        sceneId: 'ch2_after_the_duel',
        title: 'After the Duel',
        text: "Win or lose, the duel changes something. Aria looks at you differently now — with a respect that wasn't there before. On the dueling grounds, stripped of pretence, people show you who they really are.",
      },
    ],
  },
  {
    chapterId: 'chapter_3',
    number: 3,
    title: 'Shadows in the Archive',
    subtitle: 'Some secrets refuse to stay buried.',
    intro: "The Academy's polished surface has begun to crack. A lost tome. A sealed vault. Whispered expulsions that were never supposed to be known. The pieces are assembling themselves into a picture that the headmaster very clearly does not want anyone to see.\n\nYou are not sure when you decided to pull at this thread. But you are certain, now, that you cannot stop.",
    triggerFlag: 'chapter_2_complete',
    completionFlag: 'chapter_3_complete',
    scenes: [
      {
        sceneId: 'ch3_the_lost_tome',
        title: 'The Lost Tome',
        text: 'What began as a small favour for Master Aldric has led somewhere unexpected. The tome was not merely misplaced — it was removed. And whoever removed it knew exactly what they were looking for.',
      },
      {
        sceneId: 'ch3_zephyrs_past',
        title: "Zephyr's Past",
        text: "Zephyr's story lands like a stone dropped into still water. An expelled student, still circling the place that cast them out. What are they waiting for? What do they know that you don't?",
      },
      {
        sceneId: 'ch3_the_vault',
        title: 'The Vault',
        text: 'Beneath the library, behind a door that should not exist, the vault holds records that the Academy has spent years pretending are lost. Someone is going to read them. It might as well be you.',
      },
    ],
  },
];

export const LOCATIONS = [
  { id: 'academy_courtyard', name: 'Academy Courtyard', tag: 'Starting Area', description: 'The central hub of Arcane Card Kingdom. Students gather here between classes.', icon: '🏛️', bgIcon: '🏛️' },
  { id: 'library',           name: 'Grand Library',     tag: 'Study',         description: 'Ancient tomes line every shelf. Knowledge awaits those who seek it.',           icon: '📚', bgIcon: '📚' },
  { id: 'dueling_grounds',   name: 'Dueling Grounds',   tag: 'Combat',        description: 'A ring of ancient stones where students test their spells in controlled duels.', icon: '⚔️', bgIcon: '⚔️' },
  { id: 'market',            name: 'Academy Market',    tag: 'Shopping',      description: 'Merchants hawking spell components, potions, and rare cards.',                  icon: '🛒', bgIcon: '🛒' },
  { id: 'dormitory',         name: 'Student Dormitory', tag: 'Rest',          description: 'A quiet place to rest and reflect. Your room is here.',                        icon: '🛏️', bgIcon: '🛏️' },
  { id: 'headmaster_office', name: "Headmaster's Office", tag: 'Main Quest',  description: "The imposing office of the Academy's headmaster. Enter only when summoned.",   icon: '🗝️', bgIcon: '🗝️' },
];

export const NPCS = [
  {
    id: 'aria', name: 'Aria', portrait: '🧙‍♀️', location: 'academy_courtyard',
    description: 'A confident second-year student with fire-elemental magic.',
    deck: ['ember_bolt','ember_bolt','ember_bolt','phoenix_feather','flame_shield','healing_light','frost_shard','thunder_strike','arcane_blast','ember_bolt'],
    matchRewards: [
      { type: 'exp', value: 60 },
      { type: 'boosterPack', label: '🔥 Fire Booster Pack', cards: ['ember_bolt','ember_bolt','flame_shield','phoenix_feather','ember_bolt'] },
    ],
  },
  {
    id: 'master_aldric', name: 'Master Aldric', portrait: '🧓', location: 'library',
    description: 'The Academy\'s senior arcane theory professor.',
    deck: ['arcane_blast','arcane_blast','arcane_blast','mana_surge','mana_surge','shield_wall','shield_wall','frost_shard','healing_light','arcane_mastery'],
    matchRewards: [
      { type: 'exp', value: 100 },
      { type: 'boosterPack', label: '💥 Arcane Booster Pack', cards: ['arcane_blast','arcane_blast','arcane_mastery','mana_surge','thunder_strike'] },
      { type: 'item', itemId: 'mana_crystal', count: 1 },
    ],
  },
  {
    id: 'zephyr', name: 'Zephyr', portrait: '🧝', location: 'market',
    description: 'A mysterious figure who runs a peculiar stall at the market.',
    deck: ['void_step','frost_shard','frost_shard','shield_wall','arcane_blast','thunder_strike','healing_light','mana_surge','frost_shard','shield_wall'],
    matchRewards: [
      { type: 'exp', value: 80 },
      { type: 'boosterPack', label: '🌑 Void Booster Pack', cards: ['void_step','void_step','frost_shard','ice_barrier','frost_shard'] },
      { type: 'item', itemId: 'spell_scroll_arcane', count: 1 },
    ],
  },
  {
    id: 'training_dummy', name: 'Training Dummy', portrait: '🪆', location: 'dueling_grounds',
    description: 'A magical training construct. Good for practicing card duels.',
    deck: ['ember_bolt','ember_bolt','shield_wall','frost_shard','healing_light','ember_bolt','frost_shard','shield_wall','ember_bolt','frost_shard'],
    matchRewards: [
      { type: 'exp', value: 30 },
      { type: 'item', itemId: 'health_potion', count: 1 },
    ],
  },
];

export const CARDS = [
  { cardId: 'ember_bolt',    name: 'Ember Bolt',     type: 'attack',  element: 'fire',   manaCost: 1, power: 3, art: '🔥', description: 'Deals 3 damage.',          effect: { type: 'damage', target: 'opponent', value: 3 } },
  { cardId: 'frost_shard',   name: 'Frost Shard',    type: 'attack',  element: 'ice',    manaCost: 2, power: 4, art: '❄️', description: 'Deals 4 damage.',          effect: { type: 'damage', target: 'opponent', value: 4 } },
  { cardId: 'shield_wall',   name: 'Shield Wall',    type: 'defense', element: 'arcane', manaCost: 1, power: 3, art: '🛡️', description: 'Gain 3 shield.',           effect: { type: 'shield', value: 3 } },
  { cardId: 'healing_light', name: 'Healing Light',  type: 'heal',    element: 'light',  manaCost: 2, power: 4, art: '✨', description: 'Heal 4 HP.',              effect: { type: 'heal',   target: 'self', value: 4 } },
  { cardId: 'arcane_blast',  name: 'Arcane Blast',   type: 'attack',  element: 'arcane', manaCost: 3, power: 6, art: '💥', description: 'Deals 6 damage.',          effect: { type: 'damage', target: 'opponent', value: 6 } },
  { cardId: 'thunder_strike',name: 'Thunder Strike', type: 'attack',  element: 'arcane', manaCost: 3, power: 5, art: '⚡', description: 'Deals 5 damage.',          effect: { type: 'damage', target: 'opponent', value: 5 } },
  { cardId: 'mana_surge',    name: 'Mana Surge',     type: 'utility', element: 'arcane', manaCost: 0, power: 2, art: '🌀', description: 'Gain 2 mana.',             effect: { type: 'mana',   value: 2 } },
  { cardId: 'ice_barrier',   name: 'Ice Barrier',    type: 'defense', element: 'ice',    manaCost: 2, power: 5, art: '🧊', description: 'Gain 5 shield.',           effect: { type: 'shield', value: 5 } },
  { cardId: 'flame_shield',  name: 'Flame Shield',   type: 'defense', element: 'fire',   manaCost: 2, power: 4, art: '🔶', description: 'Gain 4 shield.',           effect: { type: 'shield', value: 4 } },
  { cardId: 'arcane_mastery',name: 'Arcane Mastery', type: 'attack',  element: 'arcane', manaCost: 4, power: 9, art: '🔮', description: 'Deals 9 damage.',          effect: { type: 'damage', target: 'opponent', value: 9 } },
  { cardId: 'phoenix_feather',name:'Phoenix Feather',type: 'heal',    element: 'fire',   manaCost: 3, power: 8, art: '🦅', description: 'Heal 8 HP.',              effect: { type: 'heal',   target: 'self', value: 8 } },
  { cardId: 'void_step',     name: 'Void Step',      type: 'utility', element: 'arcane', manaCost: 2, power: 3, art: '🌑', description: 'Draw 3 cards.',            effect: { type: 'draw',   value: 3 } },
];

export const ITEMS = [
  { itemId: 'health_potion',        name: 'Health Potion',        icon: '🧪', type: 'consumable', usable: true,  description: 'Restores 5 HP.',                       effect: { type: 'heal',    value: 5 } },
  { itemId: 'greater_health_potion',name: 'Greater Health Potion',icon: '💊', type: 'consumable', usable: true,  description: 'Restores 10 HP.',                      effect: { type: 'heal',    value: 10 } },
  { itemId: 'mana_crystal',         name: 'Mana Crystal',         icon: '💎', type: 'consumable', usable: true,  description: 'Restores 3 mana during battle.',        effect: { type: 'mana',    value: 3 } },
  { itemId: 'spell_scroll_arcane',  name: 'Arcane Scroll',        icon: '📜', type: 'consumable', usable: true,  description: 'Adds Arcane Blast to your collection.', effect: { type: 'addCard', cardId: 'arcane_blast' } },
  { itemId: 'tome_of_ice',          name: 'Tome of Ice',          icon: '📘', type: 'consumable', usable: true,  description: 'Adds Ice Barrier to your collection.',  effect: { type: 'addCard', cardId: 'ice_barrier' } },
  { itemId: 'academy_badge',        name: 'Academy Badge',        icon: '🎖️', type: 'key_item',   usable: false, description: 'Your official student identification badge.' },
];

export const QUESTS = [
  {
    questId: 'main_01', title: 'Enrollment Day', type: 'main',
    description: 'Your first day at Arcane Card Kingdom. Get acquainted with your surroundings and meet your fellow students.',
    objectives: [
      { id: 'm01_obj_01', type: 'dialogue',     description: 'Speak with Aria in the Courtyard',                    target: { npcId: 'aria',          flag: 'met_aria' } },
      { id: 'm01_obj_02', type: 'dialogue',     description: 'Visit the Grand Library and speak with Master Aldric', target: { npcId: 'master_aldric', flag: 'met_aldric' } },
      { id: 'm01_obj_03', type: 'dialogue',     description: 'Explore the Academy Market and meet Zephyr',           target: { npcId: 'zephyr',        flag: 'met_zephyr' } },
    ],
    rewards: { gold: 50, cards: ['mana_surge'], unlockLocations: ['dueling_grounds','dormitory','headmaster_office'] },
  },
  {
    questId: 'side_01', title: "Aria's Challenge", type: 'side',
    description: 'Aria has challenged you to a card duel.',
    objectives: [
      { id: 's01_obj_01', type: 'card_victory', description: 'Defeat Aria in a card duel', target: { npcId: 'aria' } },
    ],
    rewards: { gold: 30, cards: ['flame_shield'] },
  },
  {
    questId: 'side_02', title: 'The Lost Tome', type: 'side',
    description: 'Master Aldric has lost a precious tome. Help him find it.',
    objectives: [
      { id: 's02_obj_01', type: 'dialogue', description: "Ask Zephyr if they've seen the tome",  target: { npcId: 'zephyr',        flag: 'asked_zephyr_tome' } },
      { id: 's02_obj_02', type: 'dialogue', description: 'Return the tome to Master Aldric',      target: { npcId: 'master_aldric', flag: 'returned_tome' } },
    ],
    rewards: { gold: 40, cards: ['arcane_mastery'], items: ['greater_health_potion'] },
  },
];

export const SHOP_STOCK = [
  {
    shopId: 'general_shop', name: "Zephyr's Wares",
    stock: [
      { itemId: 'health_potion',        price: 20, stock: -1 },
      { itemId: 'greater_health_potion',price: 40, stock: -1 },
      { itemId: 'mana_crystal',         price: 30, stock: -1 },
      { itemId: 'spell_scroll_arcane',  price: 75, stock: 3 },
      { itemId: 'tome_of_ice',          price: 80, stock: 2 },
    ],
  },
];

export const DIALOGUES = {
  aria: {
    npcId: 'aria', portrait: '🧙‍♀️',
    entries: [
      { requires: { flag: 'aria_bonded' },       node: 'bonded_greeting' },
      { requires: { flag: 'aria_story_scene' },  node: 'story_scene_greeting' },
      { requires: { flag: 'aria_friend_quest' }, node: 'friend_greeting' },
      { requires: { flag: 'aria_challenged' },   node: 'post_challenge_check' },
      { requires: { flag: 'met_aria' },          node: 'returning_greeting' },
    ],
    nodes: {
      start: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "Oh! A new student? Welcome to Arcane Card Kingdom. I'm Aria — second year, fire specialisation. Word of advice: don't wander into the Dueling Grounds alone on your first day.",
        choices: [
          { label: 'Thanks for the warning. Nice to meet you!', effects: [{ type: 'setFlag', flag: 'met_aria' }, { type: 'relationship', value: 3 }, { type: 'completeObjective', objectiveId: 'm01_obj_01' }], next: 'aria_intro_response' },
          { label: 'I think I can handle myself.',              effects: [{ type: 'setFlag', flag: 'met_aria' }, { type: 'relationship', value: 1 }, { type: 'completeObjective', objectiveId: 'm01_obj_01' }], next: 'aria_intro_bold' },
        ],
      },
      aria_intro_response: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "Nice to meet you! Hmm, there's something about you... Come find me when you're settled in — I have a feeling we'll be seeing a lot of each other.",
        choices: [
          { label: 'I look forward to it.',  next: null },
          { label: 'Is that a challenge?', effects: [{ type: 'relationship', value: 1 }], next: 'aria_intro_challenge_tease' },
        ],
      },
      aria_intro_bold: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "Ha! Confident. I like that. Most first-years are practically shaking on arrival. Alright, prove it — come find me at the Dueling Grounds sometime.",
        choices: [],
      },
      aria_intro_challenge_tease: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: '*grins* Maybe it is. We\'ll see how strong you are once you\'ve got your bearings.',
        choices: [],
      },
      returning_greeting: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "Hey! Settling in alright? The first week is always overwhelming, but you'll find your footing.",
        choices: [
          { label: 'Tell me about the Academy.',        next: 'aria_about_academy' },
          { label: 'I want to challenge you to a duel.', effects: [{ type: 'setFlag', flag: 'aria_challenged' }, { type: 'triggerQuest', questId: 'side_01' }], next: 'aria_challenge_accept' },
          { label: 'Just checking in.',                 next: null },
        ],
      },
      aria_about_academy: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "The Academy has four specialisations: Fire, Ice, Arcane, and Light. Most students have a natural affinity, but some are elementally neutral — they can learn from all schools.",
        choices: [
          { label: 'Which is the strongest?', next: 'aria_elements_debate' },
          { label: 'Thanks, that\'s helpful.', effects: [{ type: 'relationship', value: 1 }], next: null },
        ],
      },
      aria_elements_debate: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "Fire, obviously. Speed, aggression, pure damage. Ice is defensive but slow. Arcane is powerful but mana-hungry. Light is healing — useful, but not exactly intimidating.",
        choices: [],
      },
      aria_challenge_accept: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "Oh! Finally! I was starting to think you'd never ask. Let's go — I won't hold back!",
        choices: [
          { label: "Let's duel right now!", effects: [{ type: 'triggerCardGame', npcId: 'aria' }], next: null },
          { label: "I'll come prepared.", next: null },
        ],
      },
      post_challenge_check: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "Still thinking about our duel? I'm ready whenever you are.",
        choices: [
          { label: "Let's duel!", effects: [{ type: 'triggerCardGame', npcId: 'aria' }], next: null },
          { label: 'Not yet.', next: null },
        ],
      },
      friend_greeting: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "I've been thinking... the truth is, I'm trying to prove myself. My older sister was the top student here, and everyone expects me to surpass her. It's a lot of pressure.",
        choices: [
          { label: 'That sounds really hard.', effects: [{ type: 'relationship', value: 3 }], next: 'aria_friend_pressure' },
          { label: 'You should just focus on yourself.', effects: [{ type: 'relationship', value: 2 }], next: 'aria_friend_focus' },
        ],
      },
      aria_friend_pressure: { speaker: 'Aria', portrait: '🧙‍♀️', text: "Yeah... it really is. But talking to you about it helps. *smiles warmly* You're a good friend.", choices: [] },
      aria_friend_focus:    { speaker: 'Aria', portrait: '🧙‍♀️', text: "You're right. I should stop competing with her ghost and just be myself.", choices: [] },
      story_scene_greeting: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "I've been looking for you. There's something I need to tell you — about my sister, and why she really left the Academy.",
        effects: [{ type: 'setFlag', flag: 'aria_story_told' }],
        choices: [{ label: 'Tell me everything.', effects: [{ type: 'relationship', value: 5 }], next: 'aria_story_reveal' }],
      },
      aria_story_reveal: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "She was expelled. For forbidden magic. The headmaster covered it up. I think it has something to do with the sealed vault beneath the library.",
        choices: [{ label: "I'll help you find the truth.", effects: [{ type: 'relationship', value: 3 }, { type: 'setFlag', flag: 'vault_investigation' }], next: null }],
      },
      bonded_greeting: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "When I first met you, I thought you were just another wide-eyed first-year. I had no idea you'd become this important to me. Whatever happens — I'm glad you're by my side.",
        choices: [{ label: 'Me too, Aria. Always.', effects: [{ type: 'relationship', value: 1 }], next: null }],
      },
      post_win: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "*breathless* That was... incredible. I didn't hold back, and you still beat me. I don't hand out compliments lightly, but — well done. Genuinely.",
        choices: [
          { label: 'You pushed me hard. That was a great duel.', effects: [{ type: 'relationship', value: 4 }, { type: 'setFlag', flag: 'beat_aria' }], next: 'aria_post_win_follow' },
          { label: 'I got lucky.', effects: [{ type: 'relationship', value: 2 }, { type: 'setFlag', flag: 'beat_aria' }], next: null },
        ],
      },
      aria_post_win_follow: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "Lucky? No. You read my moves and countered them. You earned this. *pauses* Come find me again soon — I want a rematch.",
        choices: [],
      },
      post_lose: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "*extends a hand* You fought well. Most first-years don't even land a hit. Don't be discouraged — keep training and come back when you're ready.",
        choices: [
          { label: 'I will. Thank you for the challenge.', effects: [{ type: 'relationship', value: 2 }], next: null },
          { label: 'Next time will be different.', effects: [{ type: 'relationship', value: 1 }], next: 'aria_post_lose_response' },
        ],
      },
      aria_post_lose_response: {
        speaker: 'Aria', portrait: '🧙‍♀️',
        text: "*smiles* I'm counting on it.",
        choices: [],
      },
    },
  },

  master_aldric: {
    npcId: 'master_aldric', portrait: '🧓',
    entries: [
      { requires: { flag: 'aldric_final_arc' }, node: 'aldric_final' },
      { requires: { flag: 'aldric_secret' },    node: 'aldric_secret_greeting' },
      { requires: { flag: 'aldric_lessons' },   node: 'aldric_lessons_greeting' },
      { requires: { flag: 'returned_tome' },    node: 'aldric_tome_done' },
      { requires: { flag: 'asked_zephyr_tome' },node: 'aldric_tome_return' },
      { requires: { flag: 'met_aldric' },       node: 'aldric_returning' },
    ],
    nodes: {
      start: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "Hmm. A new student, wandering into my library without so much as a knock. Most first-years don't find their way here until their second month. You must be curious — that's good. My name is Aldric. I teach Arcane Theory.",
        choices: [
          { label: "I'm eager to learn.", effects: [{ type: 'setFlag', flag: 'met_aldric' }, { type: 'relationship', value: 3 }, { type: 'completeObjective', objectiveId: 'm01_obj_02' }], next: 'aldric_eager' },
          { label: 'Sorry to intrude.',   effects: [{ type: 'setFlag', flag: 'met_aldric' }, { type: 'relationship', value: 1 }, { type: 'completeObjective', objectiveId: 'm01_obj_02' }], next: 'aldric_polite' },
        ],
      },
      aldric_eager: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "Eager. Good. But eagerness without discipline is dangerous. Come to my lectures with an open mind and a closed mouth, and you may yet learn something.",
        choices: [
          { label: 'Can you tell me about Arcane Theory?', next: 'aldric_arcane_theory' },
          { label: "I'll come back when I have a question.", next: null },
        ],
      },
      aldric_polite: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "At least you have the decency to admit it. The library is open to all students. Just be careful with the ancient texts — some of them bite. Metaphorically. Mostly.",
        choices: [{ label: 'Wait — mostly?', next: 'aldric_biting_books' }, { label: "I'll be careful.", next: null }],
      },
      aldric_biting_books: { speaker: 'Master Aldric', portrait: '🧓', text: "The Grimoire of Unbound Shadows is... temperamental. Don't touch the red shelf. *he returns to his reading*", choices: [] },
      aldric_arcane_theory: { speaker: 'Master Aldric', portrait: '🧓', text: "Arcane Theory is the foundation of all magic. Understanding how mana flows and accumulates is the key to mastering any element. Most students ignore this and wonder why their spells fizzle.", choices: [] },
      aldric_returning: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "Ah. Back again. What brings you to the library today?",
        choices: [
          { label: 'I wanted to ask about the lost tome.', requires: { flag_unset: 'asked_zephyr_tome' }, effects: [{ type: 'triggerQuest', questId: 'side_02' }], next: 'aldric_lost_tome' },
          { label: 'Just looking for some guidance.', next: 'aldric_guidance' },
          { label: 'Nothing in particular.', next: null },
        ],
      },
      aldric_lost_tome: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "'Foundations of Elemental Convergence' — irreplaceable. I misplaced it days ago. If you see it in your travels, I'd be most grateful. Perhaps that peculiar merchant at the market has seen it.",
        choices: [],
      },
      aldric_guidance: { speaker: 'Master Aldric', portrait: '🧓', text: "My advice: spend less time socialising and more time in here. Every answer you need is in a book — you just have to know which one to read.", choices: [] },
      aldric_tome_return: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "Have you spoken with Zephyr about the tome yet?",
        choices: [
          { label: 'I have the tome right here.', requires: { flag: 'found_tome' }, effects: [{ type: 'setFlag', flag: 'returned_tome' }, { type: 'relationship', value: 5 }, { type: 'completeObjective', objectiveId: 's02_obj_02' }], next: 'aldric_tome_returned' },
          { label: "Not yet. I'll go ask them.", next: null },
        ],
      },
      aldric_tome_returned: { speaker: 'Master Aldric', portrait: '🧓', text: "My tome! *he clutches it with visible relief* Thank you. Truly. This book represents decades of my research. Your help means more than you know.", choices: [] },
      aldric_tome_done: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "Your assistance with the tome was... exemplary. I'm adjusting my assessment of you upward.",
        choices: [{ label: 'Thank you, Master Aldric.', effects: [{ type: 'relationship', value: 2 }], next: null }],
      },
      aldric_lessons_greeting: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "I've been reviewing your progress. I think you're ready for some advanced theory. *hands you a scroll*",
        choices: [{ label: "Let's do it.", effects: [{ type: 'relationship', value: 3 }, { type: 'addItem', itemId: 'spell_scroll_arcane' }], next: null }],
      },
      aldric_secret_greeting: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "I need to speak with you about something that doesn't leave this library. The sealed vault beneath us contains records the headmaster doesn't want students to find.",
        choices: [{ label: 'What kind of records?', effects: [{ type: 'relationship', value: 3 }], next: 'aldric_vault_records' }],
      },
      aldric_vault_records: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "Expulsion records. Students who were silenced. I believe Aria's sister wasn't the only one. I need someone I can trust to help me investigate.",
        choices: [{ label: "I'll help you.", effects: [{ type: 'setFlag', flag: 'aldric_investigation_partner' }, { type: 'relationship', value: 5 }], next: null }],
      },
      aldric_final: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "In thirty years at this Academy, I have never met a student who reminded me so much of who I was before the politics ground me down. Don't let this place take that from you.",
        choices: [{ label: "I won't. Thank you.", effects: [{ type: 'relationship', value: 2 }], next: null }],
      },
      post_win: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "*sets down his quill* Impressive. You approached the duel with discipline — reading the board before acting. I have nothing further to teach you about patience. *a rare nod*",
        choices: [
          { label: "Your teachings made the difference.", effects: [{ type: 'relationship', value: 3 }], next: null },
          { label: "I had a good teacher.", effects: [{ type: 'relationship', value: 4 }], next: 'aldric_post_win_response' },
        ],
      },
      aldric_post_win_response: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "*slight smile* A good student makes a good teacher. Don't let that go to your head.",
        choices: [],
      },
      post_lose: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "Defeat is not failure — it is data. Analyse what happened. Where did your strategy break down? Come back when you have an answer, and we'll discuss it.",
        choices: [
          { label: "I'll study and return.", effects: [{ type: 'relationship', value: 2 }], next: null },
        ],
      },
    },
  },

  zephyr: {
    npcId: 'zephyr', portrait: '🧝',
    entries: [
      { requires: { flag: 'zephyr_final_arc' }, node: 'zephyr_final' },
      { requires: { flag: 'zephyr_secret' },    node: 'zephyr_secret_greeting' },
      { requires: { flag: 'zephyr_tip' },       node: 'zephyr_tip_greeting' },
      { requires: { flag: 'met_zephyr' },       node: 'zephyr_returning' },
    ],
    nodes: {
      start: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*looks up slowly* A customer. How refreshing. Or are you just browsing? I sell rare components, unique cards, and occasionally... information. Name's Zephyr. You look like a first-year.",
        choices: [
          { label: 'That obvious?',           effects: [{ type: 'setFlag', flag: 'met_zephyr' }, { type: 'relationship', value: 2 }, { type: 'completeObjective', objectiveId: 'm01_obj_03' }], next: 'zephyr_obvious' },
          { label: "I'm new. What do you sell?", effects: [{ type: 'setFlag', flag: 'met_zephyr' }, { type: 'relationship', value: 1 }, { type: 'completeObjective', objectiveId: 'm01_obj_03' }], next: 'zephyr_wares' },
        ],
      },
      zephyr_obvious: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*smiles faintly* The wide eyes. The slightly-lost expression. Obvious isn't the same as unremarkable, though. Come back when you need something.",
        choices: [{ label: 'What do you sell?', next: 'zephyr_wares' }, { label: 'Fair enough. See you around.', next: null }],
      },
      zephyr_wares: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "Potions, mana crystals, spell scrolls, and the occasional tome of dubious provenance. Standard Academy caveats: no questions about my suppliers.",
        choices: [
          { label: "I'd like to see your shop.", effects: [{ type: 'openShop', shopId: 'general_shop', shopName: "Zephyr's Wares" }], next: null },
          { label: 'Maybe later.', next: null },
        ],
      },
      zephyr_returning: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "[Player]. Back again. What is it this time?",
        choices: [
          { label: 'Have you seen a lost tome? Master Aldric is looking for it.', requires: { flag: 'side_02_active' }, effects: [{ type: 'setFlag', flag: 'asked_zephyr_tome' }, { type: 'completeObjective', objectiveId: 's02_obj_01' }, { type: 'relationship', value: 2 }], next: 'zephyr_tome_info' },
          { label: "I'd like to browse your shop.", effects: [{ type: 'openShop', shopId: 'general_shop', shopName: "Zephyr's Wares" }], next: null },
          { label: 'Just passing by.', next: null },
        ],
      },
      zephyr_tome_info: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*reaches under the counter* 'Foundations of Elemental Convergence'? A student left it here two days ago. Here — return it to Aldric with my regards.",
        effects: [{ type: 'setFlag', flag: 'found_tome' }],
        choices: [{ label: 'Thank you, Zephyr.', effects: [{ type: 'relationship', value: 3 }], next: null }],
      },
      zephyr_tip_greeting: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*leans forward* The dueling bracket next month? It's rigged. The finalists are pre-selected. Just thought you should know.",
        choices: [
          { label: 'How do you know that?', effects: [{ type: 'relationship', value: 3 }], next: 'zephyr_source' },
          { label: "That's a serious accusation.", next: 'zephyr_serious' },
        ],
      },
      zephyr_source:  { speaker: 'Zephyr', portrait: '🧝', text: "I have my sources. That's all I'll say.", choices: [] },
      zephyr_serious: { speaker: 'Zephyr', portrait: '🧝', text: "*shrugs* They all are, at a place like this. Just be aware.", choices: [] },
      zephyr_secret_greeting: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*quietly* My name isn't Zephyr. Or rather, it is now, but it wasn't always. I was a student here, years ago. Expelled for asking too many questions about the sealed vault.",
        choices: [{ label: 'I want to know what\'s in that vault.', effects: [{ type: 'setFlag', flag: 'zephyr_ally' }, { type: 'relationship', value: 5 }], next: null }],
      },
      zephyr_final: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*quiet laugh* When I set up this stall, I told myself I was just watching. Not getting involved again. You ruined that rather thoroughly. I'm glad you did.",
        choices: [{ label: 'So am I, Zephyr.', effects: [{ type: 'relationship', value: 2 }], next: null }],
      },
      post_win: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*leans back, impressed* Hm. You actually won. I had... well, let's say I didn't bet against you. *slides something across the counter* A small bonus for the entertainment.",
        choices: [
          { label: 'Thanks, Zephyr.', effects: [{ type: 'relationship', value: 3 }, { type: 'addItem', itemId: 'mana_crystal', quantity: 2 }], next: null },
        ],
      },
      post_lose: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*doesn't look up* I saw you fight. The cards weren't with you today. Come back, restock, try again. *taps the counter* That's what the shop is for.",
        choices: [
          { label: "I'll be back better prepared.", effects: [{ type: 'relationship', value: 1 }], next: null },
        ],
      },
    },
  },

  training_dummy: {
    npcId: 'training_dummy', portrait: '🪆',
    nodes: {
      start: {
        speaker: 'Training Dummy', portrait: '🪆',
        text: "*The training dummy pulses with magical energy. A sign reads: 'Practice Duels — sharpen your skills!'*",
        choices: [
          { label: 'Start a practice duel.', effects: [{ type: 'triggerCardGame', npcId: 'training_dummy' }], next: null },
          { label: 'Leave it alone.', next: null },
        ],
      },
      post_win: {
        speaker: 'Training Dummy', portrait: '🪆',
        text: "*The dummy's enchanted eyes glow briefly. A chime sounds — Victory recorded. Congratulations, duelist. Your performance has been logged.*",
        choices: [
          { label: 'Train again.', effects: [{ type: 'triggerCardGame', npcId: 'training_dummy' }], next: null },
          { label: 'Leave.', next: null },
        ],
      },
      post_lose: {
        speaker: 'Training Dummy', portrait: '🪆',
        text: "*The dummy resets with a soft click. A chime sounds — Defeat recorded. Do not be discouraged. Every loss is a lesson.*",
        choices: [
          { label: 'Try again.', effects: [{ type: 'triggerCardGame', npcId: 'training_dummy' }], next: null },
          { label: 'Leave.', next: null },
        ],
      },
    },
  },
};

// ── Grid Card Game Data ───────────────────────────────────────────────────────

export const CHAMPION_CARDS = [
  { cardId: 'champ_arcane', type: 'champion', name: 'Arcane Champion', hp: 20, maxHp: 20, art: '🔮' },
  { cardId: 'champ_fire',   type: 'champion', name: 'Fire Champion',   hp: 20, maxHp: 20, art: '🔥' },
  { cardId: 'champ_frost',  type: 'champion', name: 'Frost Champion',  hp: 20, maxHp: 20, art: '❄️' },
];

export const ELITE_CARD_DECK = [
  { cardId: 'elite_golem',   type: 'elite', name: 'Stone Golem',   hp: 20, power: 4, art: '🗿' },
  { cardId: 'elite_phoenix', type: 'elite', name: 'Phoenix',       hp: 10, power: 7, art: '🦅' },
  { cardId: 'elite_dragon',  type: 'elite', name: 'Shadow Dragon', hp: 12, power: 8, art: '🐉' },
  { cardId: 'elite_knight',  type: 'elite', name: 'Iron Knight',   hp: 18, power: 5, art: '🛡️' },
  { cardId: 'elite_witch',   type: 'elite', name: 'Dark Witch',    hp: 8,  power: 9, art: '🧙' },
  { cardId: 'elite_golem',   type: 'elite', name: 'Stone Golem',   hp: 20, power: 4, art: '🗿' },
  { cardId: 'elite_phoenix', type: 'elite', name: 'Phoenix',       hp: 10, power: 7, art: '🦅' },
  { cardId: 'elite_dragon',  type: 'elite', name: 'Shadow Dragon', hp: 12, power: 8, art: '🐉' },
  { cardId: 'elite_knight',  type: 'elite', name: 'Iron Knight',   hp: 18, power: 5, art: '🛡️' },
  { cardId: 'elite_witch',   type: 'elite', name: 'Dark Witch',    hp: 8,  power: 9, art: '🧙' },
];

export const SUMMON_CARD_DECK = [
  // Cost 2 (×2)
  { cardId: 'sum_imp',       type: 'summon', name: 'Fire Imp',       hp: 4, power: 3, summonCost: 2,  art: '👺' },
  { cardId: 'sum_wisp',      type: 'summon', name: 'Arcane Wisp',    hp: 5, power: 3, summonCost: 2,  art: '✨' },
  // Cost 3 (×4)
  { cardId: 'sum_sprite',    type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3,  art: '🧊' },
  { cardId: 'sum_bat',       type: 'summon', name: 'Shadow Bat',     hp: 3, power: 3, summonCost: 3,  art: '🦇' },
  { cardId: 'sum_sprite',    type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3,  art: '🧊' },
  { cardId: 'sum_bat',       type: 'summon', name: 'Shadow Bat',     hp: 3, power: 3, summonCost: 3,  art: '🦇' },
  // Cost 4 (×5)
  { cardId: 'sum_shaman',    type: 'summon', name: 'Earth Shaman',   hp: 4, power: 2, summonCost: 4,  art: '🌿' },
  { cardId: 'sum_hawk',      type: 'summon', name: 'Storm Hawk',     hp: 3, power: 3, summonCost: 4,  art: '🦅' },
  { cardId: 'sum_shaman',    type: 'summon', name: 'Earth Shaman',   hp: 4, power: 2, summonCost: 4,  art: '🌿' },
  { cardId: 'sum_hawk',      type: 'summon', name: 'Storm Hawk',     hp: 3, power: 3, summonCost: 4,  art: '🦅' },
  { cardId: 'sum_hawk',      type: 'summon', name: 'Storm Hawk',     hp: 3, power: 3, summonCost: 4,  art: '🦅' },
  // Cost 5 (×5)
  { cardId: 'sum_bear',      type: 'summon', name: 'Forest Bear',    hp: 4, power: 1, summonCost: 5,  art: '🐻' },
  { cardId: 'sum_djinn',     type: 'summon', name: 'Fire Djinn',     hp: 2, power: 3, summonCost: 5,  art: '🌋' },
  { cardId: 'sum_bear',      type: 'summon', name: 'Forest Bear',    hp: 4, power: 1, summonCost: 5,  art: '🐻' },
  { cardId: 'sum_djinn',     type: 'summon', name: 'Fire Djinn',     hp: 2, power: 3, summonCost: 5,  art: '🌋' },
  { cardId: 'sum_bear',      type: 'summon', name: 'Forest Bear',    hp: 4, power: 1, summonCost: 5,  art: '🐻' },
  // Cost 6 (×6)
  { cardId: 'sum_sentinel',  type: 'summon', name: 'Stone Sentinel', hp: 3, power: 1, summonCost: 6,  art: '🗿' },
  { cardId: 'sum_fox',       type: 'summon', name: 'Lightning Fox',  hp: 2, power: 2, summonCost: 6,  art: '🦊' },
  { cardId: 'sum_sentinel',  type: 'summon', name: 'Stone Sentinel', hp: 3, power: 1, summonCost: 6,  art: '🗿' },
  { cardId: 'sum_fox',       type: 'summon', name: 'Lightning Fox',  hp: 2, power: 2, summonCost: 6,  art: '🦊' },
  { cardId: 'sum_sentinel',  type: 'summon', name: 'Stone Sentinel', hp: 3, power: 1, summonCost: 6,  art: '🗿' },
  { cardId: 'sum_fox',       type: 'summon', name: 'Lightning Fox',  hp: 2, power: 2, summonCost: 6,  art: '🦊' },
  // Cost 8 (×5)  [No cost-7 cards — a roll of 7 draws from the spell deck instead]
  { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 2, power: 2, summonCost: 8,  art: '💥' },
  { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 2, power: 2, summonCost: 8,  art: '💥' },
  { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 2, power: 2, summonCost: 8,  art: '💥' },
  { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 2, power: 2, summonCost: 8,  art: '💥' },
  { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 2, power: 2, summonCost: 8,  art: '💥' },
  // Cost 9 (×4)
  { cardId: 'sum_wyrm',      type: 'summon', name: 'Frost Wyrm',     hp: 4, power: 1, summonCost: 9,  art: '🐲' },
  { cardId: 'sum_wyrm',      type: 'summon', name: 'Frost Wyrm',     hp: 4, power: 1, summonCost: 9,  art: '🐲' },
  { cardId: 'sum_wyrm',      type: 'summon', name: 'Frost Wyrm',     hp: 4, power: 1, summonCost: 9,  art: '🐲' },
  { cardId: 'sum_wyrm',      type: 'summon', name: 'Frost Wyrm',     hp: 4, power: 1, summonCost: 9,  art: '🐲' },
  // Cost 10 (×2)
  { cardId: 'sum_leviathan', type: 'summon', name: 'Void Leviathan', hp: 3, power: 3, summonCost: 10, art: '🌊' },
  { cardId: 'sum_leviathan', type: 'summon', name: 'Void Leviathan', hp: 3, power: 3, summonCost: 10, art: '🌊' },
  // Cost 11 (×1)
  { cardId: 'sum_ephoenix',  type: 'summon', name: 'Elder Phoenix',  hp: 3, power: 3, summonCost: 11, art: '🦅' },
  // Cost 12 (×1)
  { cardId: 'sum_adragon',   type: 'summon', name: 'Ancient Dragon', hp: 5, power: 3, summonCost: 12, art: '🐉' },
  // Extra copies to reach minimum 40
  { cardId: 'sum_imp',       type: 'summon', name: 'Fire Imp',       hp: 4, power: 3, summonCost: 2,  art: '👺' },
  { cardId: 'sum_sprite',    type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3,  art: '🧊' },
  { cardId: 'sum_shaman',    type: 'summon', name: 'Earth Shaman',   hp: 4, power: 2, summonCost: 4,  art: '🌿' },
  { cardId: 'sum_bear',      type: 'summon', name: 'Forest Bear',    hp: 4, power: 1, summonCost: 5,  art: '🐻' },
  { cardId: 'sum_sentinel',  type: 'summon', name: 'Stone Sentinel', hp: 3, power: 1, summonCost: 6,  art: '🗿' },
];

// Rolling a 7 draws from this deck instead of matching summon cards.
// Spell cards have no summonCost, HP, or power — only a special effect.
export const SPELL_CARD_DECK = [
  // ×2 each for most cards, giving a 10-card deck
  { cardId: 'spell_double_roll', type: 'spell', name: 'Second Wind',   art: '🎲', description: 'Roll the dice one more time this turn.',                                  effect: { type: 'extra_roll' } },
  { cardId: 'spell_double_roll', type: 'spell', name: 'Second Wind',   art: '🎲', description: 'Roll the dice one more time this turn.',                                  effect: { type: 'extra_roll' } },
  { cardId: 'spell_revive',      type: 'spell', name: 'Resurrection',  art: '💫', description: 'Return the top card of your crypt to your hand.',                         effect: { type: 'revive' } },
  { cardId: 'spell_revive',      type: 'spell', name: 'Resurrection',  art: '💫', description: 'Return the top card of your crypt to your hand.',                         effect: { type: 'revive' } },
  { cardId: 'spell_draw',        type: 'spell', name: 'Arcane Draw',   art: '📖', description: 'Draw 2 summon cards from your deck.',                                     effect: { type: 'draw_cards', count: 2 } },
  { cardId: 'spell_boost_elite', type: 'spell', name: 'Battle Fury',   art: '⚡', description: 'Target player elite gains +3 power until your next turn.',               effect: { type: 'boost_elite', amount: 3 }, needsTarget: 'player_elite' },
  { cardId: 'spell_heal_champ',  type: 'spell', name: 'Mending Light', art: '💚', description: 'Restore 5 HP to target player champion (up to max HP).',                 effect: { type: 'heal_champion', amount: 5 }, needsTarget: 'player_champion' },
  { cardId: 'spell_teleport',    type: 'spell', name: 'Arcane Gate',   art: '🌀', description: 'Teleport target player elite to the front of its nearest champion.',     effect: { type: 'teleport_elite' }, needsTarget: 'player_elite' },
  { cardId: 'spell_shield',      type: 'spell', name: 'Iron Barrier',  art: '🛡', description: 'Target player elite gains +5 max HP and heals 5 HP.',                   effect: { type: 'shield_elite', amount: 5 }, needsTarget: 'player_elite' },
  { cardId: 'spell_weaken',      type: 'spell', name: 'Hex Curse',     art: '💀', description: 'Target opponent elite loses 3 power until the end of their turn.',       effect: { type: 'weaken_elite', amount: 3 }, needsTarget: 'opponent_elite' },
];

// ── Deck validation ───────────────────────────────────────────────────────────
// Rules: exactly 10 elites, exactly 10 spells, at least 40 summons.
export function validateDeck(deck) {
  const eliteCount  = (deck.elites  ?? []).length;
  const spellCount  = (deck.spells  ?? []).length;
  const summonCount = (deck.summons ?? []).length;
  const errors = [];
  if (eliteCount  !== 10) errors.push(`Elites: ${eliteCount}/10 required`);
  if (spellCount  !== 10) errors.push(`Spells: ${spellCount}/10 required`);
  if (summonCount  < 40)  errors.push(`Summons: ${summonCount}/40 minimum`);
  return { valid: errors.length === 0, eliteCount, spellCount, summonCount, errors };
}

// ── Quick Match ───────────────────────────────────────────────────────────────

export const QUICK_MATCH_OPPONENTS = [
  { npcId: 'training_dummy', name: 'Training Dummy', portrait: '🪆', difficulty: 1, difficultyLabel: 'Beginner', description: 'A magical training construct. Perfect for first-timers and warm-up rounds.' },
  { npcId: 'aria',           name: 'Aria',           portrait: '🧙‍♀️', difficulty: 2, difficultyLabel: 'Medium',   description: 'Aggressive fire specialist. Expects to win fast — do not let her.' },
  { npcId: 'zephyr',         name: 'Zephyr',         portrait: '🧝', difficulty: 2, difficultyLabel: 'Medium',   description: 'Void and ice tactics. Unpredictable and hard to read until it\'s too late.' },
  { npcId: 'master_aldric',  name: 'Master Aldric',  portrait: '🧓', difficulty: 3, difficultyLabel: 'Expert',   description: 'Arcane grandmaster. Controls the board with surgical, patient precision.' },
];

export const STARTER_DECKS = [
  {
    id: 'blitz_rush', name: 'Blitz Rush', art: '⚡', color: '#8a2010',
    description: 'Overwhelm your foe with relentless aggression. Cheap summons flood the field and high-power elites close out the game fast.',
    champions: CHAMPION_CARDS,
    elites: [
      { cardId: 'elite_phoenix', type: 'elite', name: 'Phoenix',       hp: 10, power: 7, art: '🦅' },
      { cardId: 'elite_phoenix', type: 'elite', name: 'Phoenix',       hp: 10, power: 7, art: '🦅' },
      { cardId: 'elite_phoenix', type: 'elite', name: 'Phoenix',       hp: 10, power: 7, art: '🦅' },
      { cardId: 'elite_phoenix', type: 'elite', name: 'Phoenix',       hp: 10, power: 7, art: '🦅' },
      { cardId: 'elite_dragon',  type: 'elite', name: 'Shadow Dragon', hp: 12, power: 8, art: '🐉' },
      { cardId: 'elite_dragon',  type: 'elite', name: 'Shadow Dragon', hp: 12, power: 8, art: '🐉' },
      { cardId: 'elite_witch',   type: 'elite', name: 'Dark Witch',    hp: 8,  power: 9, art: '🧙' },
      { cardId: 'elite_witch',   type: 'elite', name: 'Dark Witch',    hp: 8,  power: 9, art: '🧙' },
      { cardId: 'elite_witch',   type: 'elite', name: 'Dark Witch',    hp: 8,  power: 9, art: '🧙' },
      { cardId: 'elite_witch',   type: 'elite', name: 'Dark Witch',    hp: 8,  power: 9, art: '🧙' },
    ],
    summons: [
      { cardId: 'sum_imp',   type: 'summon', name: 'Fire Imp',      hp: 4, power: 3, summonCost: 2, art: '👺' },
      { cardId: 'sum_imp',   type: 'summon', name: 'Fire Imp',      hp: 4, power: 3, summonCost: 2, art: '👺' },
      { cardId: 'sum_imp',   type: 'summon', name: 'Fire Imp',      hp: 4, power: 3, summonCost: 2, art: '👺' },
      { cardId: 'sum_imp',   type: 'summon', name: 'Fire Imp',      hp: 4, power: 3, summonCost: 2, art: '👺' },
      { cardId: 'sum_imp',   type: 'summon', name: 'Fire Imp',      hp: 4, power: 3, summonCost: 2, art: '👺' },
      { cardId: 'sum_imp',   type: 'summon', name: 'Fire Imp',      hp: 4, power: 3, summonCost: 2, art: '👺' },
      { cardId: 'sum_bat',   type: 'summon', name: 'Shadow Bat',    hp: 3, power: 3, summonCost: 3, art: '🦇' },
      { cardId: 'sum_bat',   type: 'summon', name: 'Shadow Bat',    hp: 3, power: 3, summonCost: 3, art: '🦇' },
      { cardId: 'sum_bat',   type: 'summon', name: 'Shadow Bat',    hp: 3, power: 3, summonCost: 3, art: '🦇' },
      { cardId: 'sum_bat',   type: 'summon', name: 'Shadow Bat',    hp: 3, power: 3, summonCost: 3, art: '🦇' },
      { cardId: 'sum_bat',   type: 'summon', name: 'Shadow Bat',    hp: 3, power: 3, summonCost: 3, art: '🦇' },
      { cardId: 'sum_bat',   type: 'summon', name: 'Shadow Bat',    hp: 3, power: 3, summonCost: 3, art: '🦇' },
      { cardId: 'sum_hawk',  type: 'summon', name: 'Storm Hawk',    hp: 3, power: 3, summonCost: 4, art: '🦅' },
      { cardId: 'sum_hawk',  type: 'summon', name: 'Storm Hawk',    hp: 3, power: 3, summonCost: 4, art: '🦅' },
      { cardId: 'sum_hawk',  type: 'summon', name: 'Storm Hawk',    hp: 3, power: 3, summonCost: 4, art: '🦅' },
      { cardId: 'sum_hawk',  type: 'summon', name: 'Storm Hawk',    hp: 3, power: 3, summonCost: 4, art: '🦅' },
      { cardId: 'sum_hawk',  type: 'summon', name: 'Storm Hawk',    hp: 3, power: 3, summonCost: 4, art: '🦅' },
      { cardId: 'sum_hawk',  type: 'summon', name: 'Storm Hawk',    hp: 3, power: 3, summonCost: 4, art: '🦅' },
      { cardId: 'sum_djinn', type: 'summon', name: 'Fire Djinn',    hp: 2, power: 3, summonCost: 5, art: '🌋' },
      { cardId: 'sum_djinn', type: 'summon', name: 'Fire Djinn',    hp: 2, power: 3, summonCost: 5, art: '🌋' },
      { cardId: 'sum_djinn', type: 'summon', name: 'Fire Djinn',    hp: 2, power: 3, summonCost: 5, art: '🌋' },
      { cardId: 'sum_djinn', type: 'summon', name: 'Fire Djinn',    hp: 2, power: 3, summonCost: 5, art: '🌋' },
      { cardId: 'sum_djinn', type: 'summon', name: 'Fire Djinn',    hp: 2, power: 3, summonCost: 5, art: '🌋' },
      { cardId: 'sum_djinn', type: 'summon', name: 'Fire Djinn',    hp: 2, power: 3, summonCost: 5, art: '🌋' },
      { cardId: 'sum_fox',   type: 'summon', name: 'Lightning Fox', hp: 2, power: 2, summonCost: 6, art: '🦊' },
      { cardId: 'sum_fox',   type: 'summon', name: 'Lightning Fox', hp: 2, power: 2, summonCost: 6, art: '🦊' },
      { cardId: 'sum_fox',   type: 'summon', name: 'Lightning Fox', hp: 2, power: 2, summonCost: 6, art: '🦊' },
      { cardId: 'sum_fox',   type: 'summon', name: 'Lightning Fox', hp: 2, power: 2, summonCost: 6, art: '🦊' },
      { cardId: 'sum_fox',   type: 'summon', name: 'Lightning Fox', hp: 2, power: 2, summonCost: 6, art: '🦊' },
      { cardId: 'sum_titan', type: 'summon', name: 'Arcane Titan',  hp: 2, power: 2, summonCost: 8, art: '💥' },
      { cardId: 'sum_titan', type: 'summon', name: 'Arcane Titan',  hp: 2, power: 2, summonCost: 8, art: '💥' },
      { cardId: 'sum_titan', type: 'summon', name: 'Arcane Titan',  hp: 2, power: 2, summonCost: 8, art: '💥' },
      { cardId: 'sum_titan', type: 'summon', name: 'Arcane Titan',  hp: 2, power: 2, summonCost: 8, art: '💥' },
      { cardId: 'sum_titan', type: 'summon', name: 'Arcane Titan',  hp: 2, power: 2, summonCost: 8, art: '💥' },
      { cardId: 'sum_wyrm',  type: 'summon', name: 'Frost Wyrm',   hp: 4, power: 1, summonCost: 9, art: '🐲' },
      { cardId: 'sum_wyrm',  type: 'summon', name: 'Frost Wyrm',   hp: 4, power: 1, summonCost: 9, art: '🐲' },
      { cardId: 'sum_wyrm',  type: 'summon', name: 'Frost Wyrm',   hp: 4, power: 1, summonCost: 9, art: '🐲' },
      { cardId: 'sum_leviathan', type: 'summon', name: 'Void Leviathan', hp: 3, power: 3, summonCost: 10, art: '🌊' },
      { cardId: 'sum_leviathan', type: 'summon', name: 'Void Leviathan', hp: 3, power: 3, summonCost: 10, art: '🌊' },
      { cardId: 'sum_adragon',   type: 'summon', name: 'Ancient Dragon', hp: 5, power: 3, summonCost: 12, art: '🐉' },
    ],
    spells: [
      { cardId: 'spell_double_roll', type: 'spell', name: 'Second Wind', art: '🎲', description: 'Roll the dice one more time this turn.', effect: { type: 'extra_roll' } },
      { cardId: 'spell_double_roll', type: 'spell', name: 'Second Wind', art: '🎲', description: 'Roll the dice one more time this turn.', effect: { type: 'extra_roll' } },
      { cardId: 'spell_double_roll', type: 'spell', name: 'Second Wind', art: '🎲', description: 'Roll the dice one more time this turn.', effect: { type: 'extra_roll' } },
      { cardId: 'spell_double_roll', type: 'spell', name: 'Second Wind', art: '🎲', description: 'Roll the dice one more time this turn.', effect: { type: 'extra_roll' } },
      { cardId: 'spell_draw',        type: 'spell', name: 'Arcane Draw', art: '📖', description: 'Draw 2 summon cards from your deck.', effect: { type: 'draw_cards', count: 2 } },
      { cardId: 'spell_draw',        type: 'spell', name: 'Arcane Draw', art: '📖', description: 'Draw 2 summon cards from your deck.', effect: { type: 'draw_cards', count: 2 } },
      { cardId: 'spell_boost_elite', type: 'spell', name: 'Battle Fury', art: '⚡', description: 'Target player elite gains +3 power until your next turn.', effect: { type: 'boost_elite', amount: 3 }, needsTarget: 'player_elite' },
      { cardId: 'spell_boost_elite', type: 'spell', name: 'Battle Fury', art: '⚡', description: 'Target player elite gains +3 power until your next turn.', effect: { type: 'boost_elite', amount: 3 }, needsTarget: 'player_elite' },
      { cardId: 'spell_boost_elite', type: 'spell', name: 'Battle Fury', art: '⚡', description: 'Target player elite gains +3 power until your next turn.', effect: { type: 'boost_elite', amount: 3 }, needsTarget: 'player_elite' },
      { cardId: 'spell_weaken',      type: 'spell', name: 'Hex Curse',   art: '💀', description: 'Target opponent elite loses 3 power until the end of their turn.', effect: { type: 'weaken_elite', amount: 3 }, needsTarget: 'opponent_elite' },
    ],
  },
  {
    id: 'iron_bulwark', name: 'Iron Bulwark', art: '🛡️', color: '#0e3060',
    description: 'Outlast your opponent through sheer endurance. Tanky elites absorb punishment while healing keeps your champions standing.',
    champions: CHAMPION_CARDS,
    elites: [
      { cardId: 'elite_golem',  type: 'elite', name: 'Stone Golem', hp: 20, power: 4, art: '🗿' },
      { cardId: 'elite_golem',  type: 'elite', name: 'Stone Golem', hp: 20, power: 4, art: '🗿' },
      { cardId: 'elite_golem',  type: 'elite', name: 'Stone Golem', hp: 20, power: 4, art: '🗿' },
      { cardId: 'elite_golem',  type: 'elite', name: 'Stone Golem', hp: 20, power: 4, art: '🗿' },
      { cardId: 'elite_knight', type: 'elite', name: 'Iron Knight', hp: 18, power: 5, art: '🛡️' },
      { cardId: 'elite_knight', type: 'elite', name: 'Iron Knight', hp: 18, power: 5, art: '🛡️' },
      { cardId: 'elite_knight', type: 'elite', name: 'Iron Knight', hp: 18, power: 5, art: '🛡️' },
      { cardId: 'elite_knight', type: 'elite', name: 'Iron Knight', hp: 18, power: 5, art: '🛡️' },
      { cardId: 'elite_phoenix', type: 'elite', name: 'Phoenix',    hp: 10, power: 7, art: '🦅' },
      { cardId: 'elite_dragon',  type: 'elite', name: 'Shadow Dragon', hp: 12, power: 8, art: '🐉' },
    ],
    summons: [
      { cardId: 'sum_wisp',     type: 'summon', name: 'Arcane Wisp',    hp: 5, power: 3, summonCost: 2, art: '✨' },
      { cardId: 'sum_wisp',     type: 'summon', name: 'Arcane Wisp',    hp: 5, power: 3, summonCost: 2, art: '✨' },
      { cardId: 'sum_wisp',     type: 'summon', name: 'Arcane Wisp',    hp: 5, power: 3, summonCost: 2, art: '✨' },
      { cardId: 'sum_wisp',     type: 'summon', name: 'Arcane Wisp',    hp: 5, power: 3, summonCost: 2, art: '✨' },
      { cardId: 'sum_sprite',   type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3, art: '🧊' },
      { cardId: 'sum_sprite',   type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3, art: '🧊' },
      { cardId: 'sum_sprite',   type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3, art: '🧊' },
      { cardId: 'sum_sprite',   type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3, art: '🧊' },
      { cardId: 'sum_sprite',   type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3, art: '🧊' },
      { cardId: 'sum_sprite',   type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3, art: '🧊' },
      { cardId: 'sum_shaman',   type: 'summon', name: 'Earth Shaman',   hp: 4, power: 2, summonCost: 4, art: '🌿' },
      { cardId: 'sum_shaman',   type: 'summon', name: 'Earth Shaman',   hp: 4, power: 2, summonCost: 4, art: '🌿' },
      { cardId: 'sum_shaman',   type: 'summon', name: 'Earth Shaman',   hp: 4, power: 2, summonCost: 4, art: '🌿' },
      { cardId: 'sum_shaman',   type: 'summon', name: 'Earth Shaman',   hp: 4, power: 2, summonCost: 4, art: '🌿' },
      { cardId: 'sum_shaman',   type: 'summon', name: 'Earth Shaman',   hp: 4, power: 2, summonCost: 4, art: '🌿' },
      { cardId: 'sum_shaman',   type: 'summon', name: 'Earth Shaman',   hp: 4, power: 2, summonCost: 4, art: '🌿' },
      { cardId: 'sum_bear',     type: 'summon', name: 'Forest Bear',    hp: 4, power: 1, summonCost: 5, art: '🐻' },
      { cardId: 'sum_bear',     type: 'summon', name: 'Forest Bear',    hp: 4, power: 1, summonCost: 5, art: '🐻' },
      { cardId: 'sum_bear',     type: 'summon', name: 'Forest Bear',    hp: 4, power: 1, summonCost: 5, art: '🐻' },
      { cardId: 'sum_bear',     type: 'summon', name: 'Forest Bear',    hp: 4, power: 1, summonCost: 5, art: '🐻' },
      { cardId: 'sum_bear',     type: 'summon', name: 'Forest Bear',    hp: 4, power: 1, summonCost: 5, art: '🐻' },
      { cardId: 'sum_bear',     type: 'summon', name: 'Forest Bear',    hp: 4, power: 1, summonCost: 5, art: '🐻' },
      { cardId: 'sum_sentinel', type: 'summon', name: 'Stone Sentinel', hp: 3, power: 1, summonCost: 6, art: '🗿' },
      { cardId: 'sum_sentinel', type: 'summon', name: 'Stone Sentinel', hp: 3, power: 1, summonCost: 6, art: '🗿' },
      { cardId: 'sum_sentinel', type: 'summon', name: 'Stone Sentinel', hp: 3, power: 1, summonCost: 6, art: '🗿' },
      { cardId: 'sum_sentinel', type: 'summon', name: 'Stone Sentinel', hp: 3, power: 1, summonCost: 6, art: '🗿' },
      { cardId: 'sum_sentinel', type: 'summon', name: 'Stone Sentinel', hp: 3, power: 1, summonCost: 6, art: '🗿' },
      { cardId: 'sum_sentinel', type: 'summon', name: 'Stone Sentinel', hp: 3, power: 1, summonCost: 6, art: '🗿' },
      { cardId: 'sum_wyrm',     type: 'summon', name: 'Frost Wyrm',     hp: 4, power: 1, summonCost: 9, art: '🐲' },
      { cardId: 'sum_wyrm',     type: 'summon', name: 'Frost Wyrm',     hp: 4, power: 1, summonCost: 9, art: '🐲' },
      { cardId: 'sum_wyrm',     type: 'summon', name: 'Frost Wyrm',     hp: 4, power: 1, summonCost: 9, art: '🐲' },
      { cardId: 'sum_wyrm',     type: 'summon', name: 'Frost Wyrm',     hp: 4, power: 1, summonCost: 9, art: '🐲' },
      { cardId: 'sum_wyrm',     type: 'summon', name: 'Frost Wyrm',     hp: 4, power: 1, summonCost: 9, art: '🐲' },
      { cardId: 'sum_wyrm',     type: 'summon', name: 'Frost Wyrm',     hp: 4, power: 1, summonCost: 9, art: '🐲' },
      { cardId: 'sum_leviathan', type: 'summon', name: 'Void Leviathan', hp: 3, power: 3, summonCost: 10, art: '🌊' },
      { cardId: 'sum_leviathan', type: 'summon', name: 'Void Leviathan', hp: 3, power: 3, summonCost: 10, art: '🌊' },
      { cardId: 'sum_leviathan', type: 'summon', name: 'Void Leviathan', hp: 3, power: 3, summonCost: 10, art: '🌊' },
      { cardId: 'sum_ephoenix',  type: 'summon', name: 'Elder Phoenix',  hp: 3, power: 3, summonCost: 11, art: '🦅' },
      { cardId: 'sum_ephoenix',  type: 'summon', name: 'Elder Phoenix',  hp: 3, power: 3, summonCost: 11, art: '🦅' },
      { cardId: 'sum_adragon',   type: 'summon', name: 'Ancient Dragon', hp: 5, power: 3, summonCost: 12, art: '🐉' },
    ],
    spells: [
      { cardId: 'spell_revive',     type: 'spell', name: 'Resurrection',  art: '💫', description: 'Return the top card of your crypt to your hand.', effect: { type: 'revive' } },
      { cardId: 'spell_revive',     type: 'spell', name: 'Resurrection',  art: '💫', description: 'Return the top card of your crypt to your hand.', effect: { type: 'revive' } },
      { cardId: 'spell_revive',     type: 'spell', name: 'Resurrection',  art: '💫', description: 'Return the top card of your crypt to your hand.', effect: { type: 'revive' } },
      { cardId: 'spell_heal_champ', type: 'spell', name: 'Mending Light', art: '💚', description: 'Restore 5 HP to target player champion.', effect: { type: 'heal_champion', amount: 5 }, needsTarget: 'player_champion' },
      { cardId: 'spell_heal_champ', type: 'spell', name: 'Mending Light', art: '💚', description: 'Restore 5 HP to target player champion.', effect: { type: 'heal_champion', amount: 5 }, needsTarget: 'player_champion' },
      { cardId: 'spell_heal_champ', type: 'spell', name: 'Mending Light', art: '💚', description: 'Restore 5 HP to target player champion.', effect: { type: 'heal_champion', amount: 5 }, needsTarget: 'player_champion' },
      { cardId: 'spell_shield',     type: 'spell', name: 'Iron Barrier',  art: '🛡', description: 'Target player elite gains +5 max HP and heals 5 HP.', effect: { type: 'shield_elite', amount: 5 }, needsTarget: 'player_elite' },
      { cardId: 'spell_shield',     type: 'spell', name: 'Iron Barrier',  art: '🛡', description: 'Target player elite gains +5 max HP and heals 5 HP.', effect: { type: 'shield_elite', amount: 5 }, needsTarget: 'player_elite' },
      { cardId: 'spell_double_roll', type: 'spell', name: 'Second Wind',  art: '🎲', description: 'Roll the dice one more time this turn.', effect: { type: 'extra_roll' } },
      { cardId: 'spell_double_roll', type: 'spell', name: 'Second Wind',  art: '🎲', description: 'Roll the dice one more time this turn.', effect: { type: 'extra_roll' } },
    ],
  },
  {
    id: 'arcane_balance', name: 'Arcane Balance', art: '🔮', color: '#301858',
    description: 'A versatile toolkit with answers to every situation. Balanced offense and defense backed by the full spell collection.',
    champions: CHAMPION_CARDS,
    elites: ELITE_CARD_DECK,
    summons: [
      { cardId: 'sum_imp',       type: 'summon', name: 'Fire Imp',       hp: 4, power: 3, summonCost: 2,  art: '👺' },
      { cardId: 'sum_wisp',      type: 'summon', name: 'Arcane Wisp',    hp: 5, power: 3, summonCost: 2,  art: '✨' },
      { cardId: 'sum_imp',       type: 'summon', name: 'Fire Imp',       hp: 4, power: 3, summonCost: 2,  art: '👺' },
      { cardId: 'sum_wisp',      type: 'summon', name: 'Arcane Wisp',    hp: 5, power: 3, summonCost: 2,  art: '✨' },
      { cardId: 'sum_imp',       type: 'summon', name: 'Fire Imp',       hp: 4, power: 3, summonCost: 2,  art: '👺' },
      { cardId: 'sum_wisp',      type: 'summon', name: 'Arcane Wisp',    hp: 5, power: 3, summonCost: 2,  art: '✨' },
      { cardId: 'sum_sprite',    type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3,  art: '🧊' },
      { cardId: 'sum_bat',       type: 'summon', name: 'Shadow Bat',     hp: 3, power: 3, summonCost: 3,  art: '🦇' },
      { cardId: 'sum_sprite',    type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3,  art: '🧊' },
      { cardId: 'sum_bat',       type: 'summon', name: 'Shadow Bat',     hp: 3, power: 3, summonCost: 3,  art: '🦇' },
      { cardId: 'sum_sprite',    type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3,  art: '🧊' },
      { cardId: 'sum_bat',       type: 'summon', name: 'Shadow Bat',     hp: 3, power: 3, summonCost: 3,  art: '🦇' },
      { cardId: 'sum_shaman',    type: 'summon', name: 'Earth Shaman',   hp: 4, power: 2, summonCost: 4,  art: '🌿' },
      { cardId: 'sum_hawk',      type: 'summon', name: 'Storm Hawk',     hp: 3, power: 3, summonCost: 4,  art: '🦅' },
      { cardId: 'sum_shaman',    type: 'summon', name: 'Earth Shaman',   hp: 4, power: 2, summonCost: 4,  art: '🌿' },
      { cardId: 'sum_hawk',      type: 'summon', name: 'Storm Hawk',     hp: 3, power: 3, summonCost: 4,  art: '🦅' },
      { cardId: 'sum_shaman',    type: 'summon', name: 'Earth Shaman',   hp: 4, power: 2, summonCost: 4,  art: '🌿' },
      { cardId: 'sum_hawk',      type: 'summon', name: 'Storm Hawk',     hp: 3, power: 3, summonCost: 4,  art: '🦅' },
      { cardId: 'sum_bear',      type: 'summon', name: 'Forest Bear',    hp: 4, power: 1, summonCost: 5,  art: '🐻' },
      { cardId: 'sum_djinn',     type: 'summon', name: 'Fire Djinn',     hp: 2, power: 3, summonCost: 5,  art: '🌋' },
      { cardId: 'sum_bear',      type: 'summon', name: 'Forest Bear',    hp: 4, power: 1, summonCost: 5,  art: '🐻' },
      { cardId: 'sum_djinn',     type: 'summon', name: 'Fire Djinn',     hp: 2, power: 3, summonCost: 5,  art: '🌋' },
      { cardId: 'sum_bear',      type: 'summon', name: 'Forest Bear',    hp: 4, power: 1, summonCost: 5,  art: '🐻' },
      { cardId: 'sum_djinn',     type: 'summon', name: 'Fire Djinn',     hp: 2, power: 3, summonCost: 5,  art: '🌋' },
      { cardId: 'sum_sentinel',  type: 'summon', name: 'Stone Sentinel', hp: 3, power: 1, summonCost: 6,  art: '🗿' },
      { cardId: 'sum_fox',       type: 'summon', name: 'Lightning Fox',  hp: 2, power: 2, summonCost: 6,  art: '🦊' },
      { cardId: 'sum_sentinel',  type: 'summon', name: 'Stone Sentinel', hp: 3, power: 1, summonCost: 6,  art: '🗿' },
      { cardId: 'sum_fox',       type: 'summon', name: 'Lightning Fox',  hp: 2, power: 2, summonCost: 6,  art: '🦊' },
      { cardId: 'sum_sentinel',  type: 'summon', name: 'Stone Sentinel', hp: 3, power: 1, summonCost: 6,  art: '🗿' },
      { cardId: 'sum_fox',       type: 'summon', name: 'Lightning Fox',  hp: 2, power: 2, summonCost: 6,  art: '🦊' },
      { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 2, power: 2, summonCost: 8,  art: '💥' },
      { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 2, power: 2, summonCost: 8,  art: '💥' },
      { cardId: 'sum_wyrm',      type: 'summon', name: 'Frost Wyrm',     hp: 4, power: 1, summonCost: 9,  art: '🐲' },
      { cardId: 'sum_wyrm',      type: 'summon', name: 'Frost Wyrm',     hp: 4, power: 1, summonCost: 9,  art: '🐲' },
      { cardId: 'sum_leviathan', type: 'summon', name: 'Void Leviathan', hp: 3, power: 3, summonCost: 10, art: '🌊' },
      { cardId: 'sum_leviathan', type: 'summon', name: 'Void Leviathan', hp: 3, power: 3, summonCost: 10, art: '🌊' },
      { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 2, power: 2, summonCost: 8,  art: '💥' },
      { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 2, power: 2, summonCost: 8,  art: '💥' },
      { cardId: 'sum_ephoenix',  type: 'summon', name: 'Elder Phoenix',  hp: 3, power: 3, summonCost: 11, art: '🦅' },
      { cardId: 'sum_adragon',   type: 'summon', name: 'Ancient Dragon', hp: 5, power: 3, summonCost: 12, art: '🐉' },
    ],
    spells: SPELL_CARD_DECK,
  },
];
