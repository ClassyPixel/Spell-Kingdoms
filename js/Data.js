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
    intro: 'The iron gates of Spellcaster Academy swing open before you, revealing a world unlike anything you have known. The courtyard hums with restless energy — students practising incantations, sparks of arcane light tracing patterns in the morning air. You are a scholarship student: no noble bloodline, no legendary mentor. Just potential, and the stubborn belief that it is enough.\n\nThis is where your story begins.',
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
  { id: 'academy_courtyard', name: 'Academy Courtyard', tag: 'Starting Area', description: 'The central hub of Spellcaster Academy. Students gather here between classes.', icon: '🏛️', bgIcon: '🏛️' },
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
  },
  {
    id: 'master_aldric', name: 'Master Aldric', portrait: '🧓', location: 'library',
    description: 'The Academy\'s senior arcane theory professor.',
    deck: ['arcane_blast','arcane_blast','arcane_blast','mana_surge','mana_surge','shield_wall','shield_wall','frost_shard','healing_light','arcane_mastery'],
  },
  {
    id: 'zephyr', name: 'Zephyr', portrait: '🧝', location: 'market',
    description: 'A mysterious figure who runs a peculiar stall at the market.',
    deck: ['void_step','frost_shard','frost_shard','shield_wall','arcane_blast','thunder_strike','healing_light','mana_surge','frost_shard','shield_wall'],
  },
  {
    id: 'training_dummy', name: 'Training Dummy', portrait: '🪆', location: 'dueling_grounds',
    description: 'A magical training construct. Good for practicing card duels.',
    deck: ['ember_bolt','ember_bolt','shield_wall','frost_shard','healing_light','ember_bolt','frost_shard','shield_wall','ember_bolt','frost_shard'],
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
    description: 'Your first day at Spellcaster Academy. Get acquainted with your surroundings and meet your fellow students.',
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
        text: "Oh! A new student? Welcome to Spellcaster Academy. I'm Aria — second year, fire specialisation. Word of advice: don't wander into the Dueling Grounds alone on your first day.",
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
    },
  },
};
