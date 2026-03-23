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
    intro: 'The iron gates of Conjuring Masters swing open before you, revealing a world unlike anything you have known. The courtyard hums with restless energy — students practising incantations, sparks of arcane light tracing patterns in the morning air. You are a scholarship student: no noble bloodline, no legendary mentor. Just potential, and the stubborn belief that it is enough.\n\nThis is where your story begins.',
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
        text: "Sofi's challenge has been circling in your mind. She is skilled — more skilled than she lets on. Accepting means risking humiliation in front of the entire student body. Declining means something worse.",
      },
      {
        sceneId: 'ch2_after_the_duel',
        title: 'After the Duel',
        text: "Win or lose, the duel changes something. Sofi looks at you differently now — with a respect that wasn't there before. On the dueling grounds, stripped of pretence, people show you who they really are.",
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
  {
    id: 'academy_courtyard', name: 'Academy Courtyard', tag: 'Starting Area',
    locationType: 'courtyard', mapPosition: [48, 55],
    description: 'The central hub of Conjuring Masters. Students gather here between classes.',
    icon: '🏛️', bgIcon: '🏛️', bgImage: 'assets/images/CardGameArt/SceneryArt/XtBwQy7.png',
    areas: [
      {
        id: 'plaza', name: 'Plaza', bgIcon: '🏛️',
        description: 'The open plaza at the heart of the Academy.',
        doors: [
          { id: 'plaza_to_garden',      label: 'Garden',      targetAreaId: 'garden',       position: { left: '8%',  bottom: '10%' } },
          { id: 'plaza_to_studyhall',   label: 'Study Hall',  targetAreaId: 'study_hall',   position: { right: '8%', bottom: '10%' } },
          { id: 'plaza_to_dormitory',   label: 'Dormitory',   targetLocationId: 'dormitory', targetAreaId: 'common_room', position: { left: '50%', bottom: '10%', transform: 'translateX(-50%)' } },
        ],
        treasures: [
          { id: 'plaza_chest_1',   icon: '📦', label: 'Abandoned Crate',  position: { left: '22%',  bottom: '18%' }, loot: { type: 'coin',  amount: 40 } },
          { id: 'plaza_pouch_1',   icon: '💰', label: 'Lost Coin Pouch',  position: { right: '25%', bottom: '22%' }, loot: { type: 'coin',  amount: 20 } },
        ],
        barrels: [
          { id: 'plaza_barrel_1',  icon: '🛢️', label: 'Supply Barrel',    position: { left: '45%',  bottom: '16%' }, loot: { type: 'coin',  amount: 15 } },
          { id: 'plaza_barrel_2',  icon: '🛢️', label: 'Old Barrel',       position: { right: '42%', bottom: '20%' }, loot: { type: 'coin',  amount: 10 } },
        ],
      },
      {
        id: 'garden', name: 'Garden', bgIcon: '🌿',
        description: 'A peaceful garden where students rest between lessons.',
        doors: [
          { id: 'garden_to_plaza',     label: 'Back to Plaza',    targetAreaId: 'plaza',      position: { right: '8%', bottom: '10%' } },
        ],
        treasures: [
          { id: 'garden_chest_1',  icon: '🎁', label: 'Hidden Gift',      position: { left: '35%',  bottom: '20%' }, loot: { type: 'coin',  amount: 25 } },
          { id: 'garden_scroll_1', icon: '📜', label: 'Forgotten Scroll', position: { right: '30%', bottom: '25%' }, loot: { type: 'coin',  amount: 30 } },
        ],
        barrels: [
          { id: 'garden_barrel_1', icon: '🛢️', label: 'Garden Barrel',    position: { left: '20%',  bottom: '18%' }, loot: { type: 'coin',  amount: 15 } },
        ],
      },
      {
        id: 'study_hall', name: 'Study Hall Entrance', bgIcon: '🪟',
        description: 'The grand entrance to the Academy study halls.',
        doors: [
          { id: 'studyhall_to_plaza',  label: 'Back to Plaza',    targetAreaId: 'plaza',      position: { left: '8%',  bottom: '10%' } },
        ],
        treasures: [
          { id: 'studyhall_chest_1', icon: '💎', label: 'Arcane Fragment', position: { right: '20%', bottom: '18%' }, loot: { type: 'coin',  amount: 25 } },
        ],
        barrels: [
          { id: 'studyhall_barrel_1', icon: '🛢️', label: 'Storage Barrel', position: { left: '30%', bottom: '16%' }, loot: { type: 'coin',  amount: 20 } },
        ],
      },
    ],
  },
  {
    id: 'library', name: 'Grand Library', tag: 'Study',
    locationType: 'library', mapPosition: [24, 38],
    description: 'Ancient tomes line every shelf. Knowledge awaits those who seek it.',
    icon: '📚', bgIcon: '📚',
    areas: [
      {
        id: 'reading_room', name: 'Reading Room', bgIcon: '📚',
        description: 'Rows of candlelit reading desks fill this quiet hall.',
        doors: [
          { id: 'reading_to_archive',   label: 'Archive',          targetAreaId: 'archive',    position: { right: '8%', bottom: '10%' } },
        ],
      },
      {
        id: 'archive', name: 'Archive', bgIcon: '🗄️',
        description: 'Dusty shelves packed with catalogued scrolls and records.',
        doors: [
          { id: 'archive_to_reading',   label: 'Reading Room',     targetAreaId: 'reading_room', position: { left: '8%',  bottom: '10%' } },
          { id: 'archive_to_rarebooks', label: 'Rare Books Vault', targetAreaId: 'rare_books', position: { right: '8%', bottom: '10%' } },
        ],
      },
      {
        id: 'rare_books', name: 'Rare Books Vault', bgIcon: '📜',
        description: 'A locked vault holding the Library\'s most precious volumes.',
        doors: [
          { id: 'rarebooks_to_archive', label: 'Back to Archive',  targetAreaId: 'archive',    position: { left: '8%',  bottom: '10%' } },
        ],
      },
    ],
  },
  {
    id: 'dueling_grounds', name: 'Dueling Grounds', tag: 'Combat',
    locationType: 'grounds', mapPosition: [72, 34],
    description: 'A ring of ancient stones where students test their spells in controlled duels.',
    icon: '⚔️', bgIcon: '⚔️',
    areas: [
      {
        id: 'practice_ring', name: 'Practice Ring', bgIcon: '⚔️',
        description: 'The outer ring where students warm up and spar.',
        doors: [
          { id: 'practice_to_arena',   label: 'Arena Floor',      targetAreaId: 'arena_floor', position: { right: '8%', bottom: '10%' } },
        ],
      },
      {
        id: 'arena_floor', name: 'Arena Floor', bgIcon: '🏟️',
        description: 'The main arena stage, ringed by ancient standing stones.',
        doors: [
          { id: 'arena_to_practice',   label: 'Practice Ring',    targetAreaId: 'practice_ring', position: { left: '8%', bottom: '10%' } },
        ],
      },
    ],
  },
  {
    id: 'market', name: 'Academy Market', tag: 'Shopping',
    locationType: 'market', mapPosition: [29, 70],
    description: 'Merchants hawking spell components, potions, and rare cards.',
    icon: '🛒', bgIcon: '🛒',
    areas: [
      {
        id: 'main_stalls', name: 'Main Stalls', bgIcon: '🛒',
        description: 'Busy market stalls offering components and card packs.',
        doors: [
          { id: 'stalls_to_potions',   label: 'Potion Row',       targetAreaId: 'potion_row', position: { right: '8%', bottom: '10%' } },
        ],
      },
      {
        id: 'potion_row', name: 'Potion Row', bgIcon: '🧪',
        description: 'A narrow alley lined with bubbling cauldrons and potion bottles.',
        doors: [
          { id: 'potions_to_stalls',   label: 'Main Stalls',      targetAreaId: 'main_stalls', position: { left: '8%', bottom: '10%' } },
        ],
      },
    ],
  },
  {
    id: 'dormitory', name: 'Student Dormitory', tag: 'Rest',
    locationType: 'dormitory', mapPosition: [68, 72],
    description: 'A quiet place to rest and reflect. Your room is here.',
    icon: '🛏️', bgIcon: '🛏️',
    areas: [
      {
        id: 'common_room', name: 'Common Room', bgIcon: '🛋️',
        description: 'Students relax here between classes, playing cards and chatting.',
        doors: [
          { id: 'common_to_yourroom',    label: 'Your Room',        targetAreaId: 'your_room',   position: { right: '8%', bottom: '10%' } },
          { id: 'common_to_courtyard',   label: 'Starting Grounds', targetLocationId: 'academy_courtyard', targetAreaId: 'plaza', position: { left: '8%', bottom: '10%' } },
        ],
      },
      {
        id: 'your_room', name: 'Your Room', bgIcon: '🛏️',
        description: 'Your small but cosy dormitory room. A safe place to think.',
        doors: [
          { id: 'yourroom_to_common',  label: 'Common Room',      targetAreaId: 'common_room', position: { left: '8%', bottom: '10%' } },
        ],
        objects: [
          { id: 'your_room_bed', icon: '🛏️', label: 'Bed', position: { left: '38%', bottom: '22%' }, action: 'rest' },
        ],
      },
    ],
  },
  {
    id: 'headmaster_office', name: "Headmaster's Office", tag: 'Main Quest',
    locationType: 'office', mapPosition: [49, 16],
    description: "The imposing office of the Academy's headmaster. Enter only when summoned.",
    icon: '🗝️', bgIcon: '🗝️',
    areas: [
      {
        id: 'antechamber', name: 'Antechamber', bgIcon: '🚪',
        description: 'A formal waiting room outside the Headmaster\'s inner office.',
        doors: [
          { id: 'ante_to_office',      label: 'Inner Office',     targetAreaId: 'inner_office', position: { right: '8%', bottom: '10%' } },
        ],
      },
      {
        id: 'inner_office', name: 'Inner Office', bgIcon: '🗝️',
        description: "The Headmaster's private study, lined with trophies and arcane artefacts.",
        doors: [
          { id: 'office_to_ante',      label: 'Back to Antechamber', targetAreaId: 'antechamber', position: { left: '8%', bottom: '10%' } },
        ],
      },
    ],
  },
];

export const WORLD_LOCATIONS = [
  {
    id: 'spellcaster_academy',
    name: 'Spellcaster Academy',
    locationType: 'academy',
    tag: 'Academy',
    icon: '🏫',
    description: 'A prestigious academy dedicated to the art of conjuring and card dueling.',
    mapPosition: [48, 50],
    areaIds: ['academy_courtyard', 'library', 'dueling_grounds', 'market', 'dormitory', 'headmaster_office'],
  },
];

export const NPCS = [
  {
    id: 'aria', name: 'Sofi', portrait: '🧙‍♀️', portraitImg: 'assets/images/CardGameArt/NPCart/Sofi/Lenadisplay.png', location: 'academy_courtyard',
    description: 'A confident second-year student with fire-elemental magic.',
    deck: ['ember_bolt','ember_bolt','ember_bolt','phoenix_feather','flame_shield','healing_light','frost_shard','thunder_strike','arcane_blast','ember_bolt'],
    matchRewards: [
      { type: 'exp', value: 60 },
      { type: 'lootBox', boxTypeId: 'small', label: '🔥 Fire Booster Pack', icon: '🔥' },
    ],
  },
  {
    id: 'master_aldric', name: 'Master Aldric', portrait: '🧓', location: 'library',
    description: 'The Academy\'s senior arcane theory professor.',
    deck: ['arcane_blast','arcane_blast','arcane_blast','mana_surge','mana_surge','shield_wall','shield_wall','frost_shard','healing_light','arcane_mastery'],
    matchRewards: [
      { type: 'exp', value: 100 },
      { type: 'lootBox', boxTypeId: 'medium', label: '💥 Arcane Booster Pack', icon: '💥' },
    ],
  },
  {
    id: 'zephyr', name: 'Zephyr', portrait: '🧝', location: 'market',
    description: 'A mysterious figure who runs a peculiar stall at the market.',
    deck: ['void_step','frost_shard','frost_shard','shield_wall','arcane_blast','thunder_strike','healing_light','mana_surge','frost_shard','shield_wall'],
    matchRewards: [
      { type: 'exp', value: 80 },
      { type: 'lootBox', boxTypeId: 'small', label: '🌑 Void Booster Pack', icon: '🌑' },
    ],
  },
  {
    id: 'merchant', name: 'The Merchant', portrait: '🧑‍💼', location: 'market',
    description: 'A traveling merchant dealing in rare loot boxes and booster packs.',
    deck: [],
    matchRewards: [],
  },
  {
    id: 'merchant_courtyard', name: 'The Merchant', portrait: '🧑‍💼', portraitImg: 'assets/images/CardGameArt/NPCart/Merchant_A/wizard_npc.png', scenePosition: 'right', location: 'academy_courtyard',
    description: 'A traveling merchant dealing in rare loot boxes and booster packs.',
    deck: [],
    matchRewards: [],
  },
  {
    id: 'training_dummy', name: 'Training Dummy', portrait: '🪆', location: 'dueling_grounds',
    description: 'A magical training construct. Good for practicing card duels.',
    deck: ['ember_bolt','ember_bolt','shield_wall','frost_shard','healing_light','ember_bolt','frost_shard','shield_wall','ember_bolt','frost_shard'],
    matchRewards: [
      { type: 'exp', value: 30 },
    ],
  },
  {
    id: 'innkeeper', name: 'Innkeeper', portrait: '🛎️', location: 'dormitory',
    description: 'The dormitory attendant. Can arrange a room for weary students.',
    deck: [],
    matchRewards: [],
  },
  {
    id: 'narrator',
    name: '',
    portrait: null,
    portraitImg: null,
    location: null,
    description: 'The unseen voice of the story.',
    deck: [],
    matchRewards: [],
  },
  // ── Conjurer NPCs ────────────────────────────────────────────────────────────
  {
    id: 'conj_elder_rook',
    name: 'Elder Rook',
    portrait: '🔮',
    portraitImg: 'assets/images/CardGameArt/CardArt/Conjurers/001C.png',
    location: 'library',
    description: 'A venerable arcane scholar whose mastery of the old magics has made him a living legend at the Academy.',
    deck: [],
    matchRewards: [],
  },
  {
    id: 'conj_lira_solstice',
    name: 'Lira Solstice',
    portrait: '✨',
    portraitImg: 'assets/images/CardGameArt/CardArt/Conjurers/002C.png',
    location: 'academy_courtyard',
    scenePosition: 'right',
    description: 'A talented young conjurer with a radiant golden flame. She specialises in fire-and-light combination magic.',
    deck: [],
    matchRewards: [],
  },
  {
    id: 'conj_malachar',
    name: 'Malachar',
    portrait: '🔥',
    portraitImg: 'assets/images/CardGameArt/CardArt/Conjurers/003C.png',
    location: 'dueling_grounds',
    description: 'A brooding fire conjurer of immense power. His allegiance is hard to earn, but invaluable once gained.',
    deck: [],
    matchRewards: [],
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
  { itemId: 'academy_badge', name: 'Academy Badge', icon: '🎖️', type: 'key_item', usable: false, description: 'Your official student identification badge.' },
];

export const QUESTS = [
  {
    questId: 'main_01', title: 'Enrollment Day', type: 'main',
    description: 'Your first day at Conjuring Masters. Get acquainted with your surroundings and meet your fellow students.',
    objectives: [
      { id: 'm01_obj_01', type: 'dialogue',     description: 'Speak with Sofi in the Courtyard',                    target: { npcId: 'aria',          flag: 'met_aria' } },
      { id: 'm01_obj_02', type: 'dialogue',     description: 'Visit the Grand Library and speak with Master Aldric', target: { npcId: 'master_aldric', flag: 'met_aldric' } },
      { id: 'm01_obj_03', type: 'dialogue',     description: 'Explore the Academy Market and meet Zephyr',           target: { npcId: 'zephyr',        flag: 'met_zephyr' } },
    ],
    rewards: { exp: 100, coin: 50, cards: ['mana_surge'], unlockLocations: ['dueling_grounds','dormitory','headmaster_office'] },
  },
  {
    questId: 'side_01', title: "Sofi's Challenge", type: 'side',
    description: 'Sofi has challenged you to a card duel.',
    objectives: [
      { id: 's01_obj_01', type: 'card_victory', description: 'Defeat Sofi in a card duel', target: { npcId: 'aria' } },
    ],
    rewards: { exp: 60, coin: 30, cards: ['flame_shield'] },
  },
  {
    questId: 'side_02', title: 'The Lost Tome', type: 'side',
    description: 'Master Aldric has lost a precious tome. Help him find it.',
    objectives: [
      { id: 's02_obj_01', type: 'dialogue', description: "Ask Zephyr if they've seen the tome",  target: { npcId: 'zephyr',        flag: 'asked_zephyr_tome' } },
      { id: 's02_obj_02', type: 'dialogue', description: 'Return the tome to Master Aldric',      target: { npcId: 'master_aldric', flag: 'returned_tome' } },
    ],
    rewards: { exp: 80, coin: 40, cards: ['arcane_mastery'] },
  },
];

export const SHOP_STOCK = [
  {
    shopId: 'general_shop', name: "Zephyr's Wares",
    stock: [],
  },
  {
    shopId: 'merchant_shop', name: "The Merchant's Wares",
    stock: [
      { lootBoxId: 'small',  price: 10,  stock: -1 },
      { lootBoxId: 'medium', price: 30,  stock: -1 },
      { lootBoxId: 'large',  price: 100, stock: -1 },
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
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "Oh! A new student? Welcome to Conjuring Masters. I'm Sofi — second year, fire specialisation. Word of advice: don't wander into the Dueling Grounds alone on your first day.",
        choices: [
          { label: 'Thanks for the warning. Nice to meet you!', effects: [{ type: 'setFlag', flag: 'met_aria' }, { type: 'relationship', value: 3 }, { type: 'completeObjective', objectiveId: 'm01_obj_01' }], next: 'aria_intro_response' },
          { label: 'I think I can handle myself.',              effects: [{ type: 'setFlag', flag: 'met_aria' }, { type: 'relationship', value: 1 }, { type: 'completeObjective', objectiveId: 'm01_obj_01' }], next: 'aria_intro_bold' },
        ],
      },
      aria_intro_response: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "Nice to meet you! Hmm, there's something about you... Come find me when you're settled in — I have a feeling we'll be seeing a lot of each other.",
        choices: [
          { label: 'I look forward to it.',  next: null },
          { label: 'Is that a challenge?', effects: [{ type: 'relationship', value: 1 }], next: 'aria_intro_challenge_tease' },
        ],
      },
      aria_intro_bold: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "Ha! Confident. I like that. Most first-years are practically shaking on arrival. Alright, prove it — come find me at the Dueling Grounds sometime.",
        choices: [],
      },
      aria_intro_challenge_tease: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: '*grins* Maybe it is. We\'ll see how strong you are once you\'ve got your bearings.',
        choices: [],
      },
      returning_greeting: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "Hey! Settling in alright? The first week is always overwhelming, but you'll find your footing.",
        choices: [
          { label: 'Tell me about the Academy.',                                                                effects: [{ type: 'relationship', value: 1 }],  next: 'aria_about_academy' },
          { label: 'I want to challenge you to a duel.',                                                       effects: [{ type: 'setFlag', flag: 'aria_challenged' }, { type: 'triggerQuest', questId: 'side_01' }], next: 'aria_challenge_accept' },
          { label: 'You seem really driven. What pushes you to keep going?',       requires: { min_charisma: 20 }, effects: [{ type: 'relationship', value: 2 }],  next: 'aria_charisma_20' },
          { label: "Do you ever let your guard down around anyone?",               requires: { min_charisma: 40 }, effects: [{ type: 'relationship', value: 3 }],  next: 'aria_charisma_40' },
          { label: "I think about you more than I probably should.",               requires: { min_charisma: 60 }, effects: [{ type: 'relationship', value: 4 }],  next: 'aria_charisma_60' },
          { label: "Whatever happens at this Academy — I want to face it with you.", requires: { min_charisma: 80 }, effects: [{ type: 'relationship', value: 5 }], next: 'aria_charisma_80' },
          { label: 'Just checking in.',                                                                         next: null },
          { label: "I don't really have time for this.",                                                        effects: [{ type: 'relationship', value: -2 }], next: 'aria_rebuff' },
        ],
      },
      aria_rebuff: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "...*short pause* Okay. Sure. I'll leave you to it then.",
        choices: [],
      },
      aria_charisma_20: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "*pauses, surprised anyone asked* ...Honestly? I have something to prove. Everyone here knows my sister's name before they know mine. I refuse to let that define me.",
        choices: [
          { label: "You're making your own name. I've noticed.", effects: [{ type: 'relationship', value: 2 }], next: null },
          { label: 'That must be exhausting.', effects: [{ type: 'relationship', value: 1 }], next: null },
        ],
      },
      aria_charisma_40: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "*quiet for a moment* Not easily. I learned early that showing weakness here gets used against you. But... there are maybe one or two people I don't feel like I have to perform for. *glances at you briefly*",
        choices: [
          { label: "I hope I'm one of them.", effects: [{ type: 'relationship', value: 3 }], next: 'aria_charisma_40_response' },
          { label: "That sounds lonely.", effects: [{ type: 'relationship', value: 2 }], next: null },
        ],
      },
      aria_charisma_40_response: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "*small smile, looks away* ...Yeah. You are.",
        choices: [],
      },
      aria_charisma_60: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "*blinks, then laughs quietly* Is that so. I'm not going to pretend I haven't noticed. But I'm not the kind of person who does things halfway — if you mean that, you'd better mean it.",
        choices: [
          { label: 'I mean it.', effects: [{ type: 'relationship', value: 4 }, { type: 'setFlag', flag: 'aria_romance_hint' }], next: 'aria_charisma_60_response' },
          { label: "I just meant as a friend.", effects: [{ type: 'relationship', value: 1 }], next: null },
        ],
      },
      aria_charisma_60_response: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "...Good. *she holds your gaze a moment longer than usual* Don't make me regret trusting you with that.",
        choices: [],
      },
      aria_charisma_80: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "*long breath* You know... when I first saw you, I thought: just another student who'd be gone before midterms. *turns to face you fully* I was very wrong about you. Whatever comes next — I'm not facing it without you either.",
        choices: [{ label: 'Then we face it together.', effects: [{ type: 'relationship', value: 5 }, { type: 'setFlag', flag: 'aria_bonded' }], next: null }],
      },
      aria_about_academy: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "The Academy has four specialisations: Fire, Ice, Arcane, and Light. Most students have a natural affinity, but some are elementally neutral — they can learn from all schools.",
        choices: [
          { label: 'Which is the strongest?', next: 'aria_elements_debate' },
          { label: 'Thanks, that\'s helpful.', effects: [{ type: 'relationship', value: 1 }], next: null },
        ],
      },
      aria_elements_debate: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "Fire, obviously. Speed, aggression, pure damage. Ice is defensive but slow. Arcane is powerful but mana-hungry. Light is healing — useful, but not exactly intimidating.",
        choices: [],
      },
      aria_challenge_accept: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "Oh! Finally! I was starting to think you'd never ask. Let's go — I won't hold back!",
        choices: [
          { label: "Let's duel right now!", effects: [{ type: 'triggerCardGame', npcId: 'aria' }], next: null },
          { label: "I'll come prepared.", next: null },
        ],
      },
      post_challenge_check: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "Still thinking about our duel? I'm ready whenever you are.",
        choices: [
          { label: "Let's duel!", effects: [{ type: 'triggerCardGame', npcId: 'aria' }], next: null },
          { label: 'Not yet.', next: null },
        ],
      },
      friend_greeting: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "I've been thinking... the truth is, I'm trying to prove myself. My older sister was the top student here, and everyone expects me to surpass her. It's a lot of pressure.",
        choices: [
          { label: 'That sounds really hard.', effects: [{ type: 'relationship', value: 3 }], next: 'aria_friend_pressure' },
          { label: 'You should just focus on yourself.', effects: [{ type: 'relationship', value: 2 }], next: 'aria_friend_focus' },
        ],
      },
      aria_friend_pressure: { speaker: 'Sofi', portrait: '🧙‍♀️', text: "Yeah... it really is. But talking to you about it helps. *smiles warmly* You're a good friend.", choices: [] },
      aria_friend_focus:    { speaker: 'Sofi', portrait: '🧙‍♀️', text: "You're right. I should stop competing with her ghost and just be myself.", choices: [] },
      story_scene_greeting: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "I've been looking for you. There's something I need to tell you — about my sister, and why she really left the Academy.",
        effects: [{ type: 'setFlag', flag: 'aria_story_told' }],
        choices: [{ label: 'Tell me everything.', effects: [{ type: 'relationship', value: 5 }], next: 'aria_story_reveal' }],
      },
      aria_story_reveal: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "She was expelled. For forbidden magic. The headmaster covered it up. I think it has something to do with the sealed vault beneath the library.",
        choices: [{ label: "I'll help you find the truth.", effects: [{ type: 'relationship', value: 3 }, { type: 'setFlag', flag: 'vault_investigation' }], next: null }],
      },
      bonded_greeting: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "When I first met you, I thought you were just another wide-eyed first-year. I had no idea you'd become this important to me. Whatever happens — I'm glad you're by my side.",
        choices: [{ label: 'Me too, Sofi. Always.', effects: [{ type: 'relationship', value: 1 }], next: null }],
      },
      post_win: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "*breathless* That was... incredible. I didn't hold back, and you still beat me. I don't hand out compliments lightly, but — well done. Genuinely.",
        choices: [
          { label: 'You pushed me hard. That was a great duel.', effects: [{ type: 'relationship', value: 4 }, { type: 'setFlag', flag: 'beat_aria' }], next: 'aria_post_win_follow' },
          { label: 'I got lucky.', effects: [{ type: 'relationship', value: 2 }, { type: 'setFlag', flag: 'beat_aria' }], next: null },
        ],
      },
      aria_post_win_follow: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "Lucky? No. You read my moves and countered them. You earned this. *pauses* Come find me again soon — I want a rematch.",
        choices: [],
      },
      post_lose: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
        text: "*extends a hand* You fought well. Most first-years don't even land a hit. Don't be discouraged — keep training and come back when you're ready.",
        choices: [
          { label: 'I will. Thank you for the challenge.', effects: [{ type: 'relationship', value: 2 }], next: null },
          { label: 'Next time will be different.', effects: [{ type: 'relationship', value: 1 }], next: 'aria_post_lose_response' },
        ],
      },
      aria_post_lose_response: {
        speaker: 'Sofi', portrait: '🧙‍♀️',
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
          { label: 'I wanted to ask about the lost tome.',                                     requires: { flag_unset: 'asked_zephyr_tome' }, effects: [{ type: 'triggerQuest', questId: 'side_02' }], next: 'aldric_lost_tome' },
          { label: 'Just looking for some guidance.',                                           effects: [{ type: 'relationship', value: 1 }],  next: 'aldric_guidance' },
          { label: 'What made you become a teacher?',                                          requires: { min_charisma: 20 }, effects: [{ type: 'relationship', value: 2 }], next: 'aldric_charisma_20' },
          { label: 'Do you ever regret staying at the Academy all these years?',               requires: { min_charisma: 40 }, effects: [{ type: 'relationship', value: 2 }], next: 'aldric_charisma_40' },
          { label: 'What really happened to the students who were expelled before Sofi\'s sister?', requires: { min_charisma: 60 }, effects: [{ type: 'relationship', value: 3 }], next: 'aldric_charisma_60' },
          { label: "Master Aldric — you're the only person here I genuinely trust.",           requires: { min_charisma: 80 }, effects: [{ type: 'relationship', value: 4 }], next: 'aldric_charisma_80' },
          { label: 'Nothing in particular.',                                                    next: null },
          { label: "Your lectures are a waste of time, frankly.",                               effects: [{ type: 'relationship', value: -3 }], next: 'aldric_rebuff' },
        ],
      },
      aldric_rebuff: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "*long silence* I see. Then I suggest you find somewhere else to waste it. Good day.",
        choices: [],
      },
      aldric_charisma_20: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "*sets down his quill* An unusual question. Most students only want to know what's on the exam. *brief pause* I stayed because I believed knowledge could be protected here. I am... less certain of that than I once was.",
        choices: [
          { label: 'What changed your mind?', effects: [{ type: 'relationship', value: 2 }], next: 'aldric_charisma_20_response' },
          { label: 'I think the right people still care.', effects: [{ type: 'relationship', value: 1 }], next: null },
        ],
      },
      aldric_charisma_20_response: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "Years of watching the institution protect itself rather than its students. But we will speak no more of that today. *returns to his work*",
        choices: [],
      },
      aldric_charisma_40: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "*long silence* There were other paths. A research post in the eastern provinces. A small school of my own, perhaps. I chose this place because I thought I could change it from the inside. *dry exhale* That's the sort of optimism that only survives in young men.",
        choices: [
          { label: "It's not too late to change things.", effects: [{ type: 'relationship', value: 3 }], next: 'aldric_charisma_40_response' },
          { label: 'I understand the regret.', effects: [{ type: 'relationship', value: 2 }], next: null },
        ],
      },
      aldric_charisma_40_response: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "*looks at you for a long moment* ...Perhaps not. *quietly* Perhaps not.",
        choices: [],
      },
      aldric_charisma_60: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "*closes the door, voice lower* There were seven. All asking questions the headmaster considered dangerous. All gone within the same academic year. The official records cite 'conduct violations.' *he doesn't say more. He doesn't need to.*",
        choices: [
          { label: "This goes higher than we thought.", effects: [{ type: 'relationship', value: 3 }, { type: 'setFlag', flag: 'aldric_expulsion_lore' }], next: null },
        ],
      },
      aldric_charisma_80: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "*pauses mid-sentence, visibly moved* ...That is not a statement I take lightly. Nor one I've heard often in this building. *sets his work aside* You have my trust in return. Completely.",
        choices: [{ label: 'Then let\'s use it to set things right.', effects: [{ type: 'relationship', value: 4 }, { type: 'setFlag', flag: 'aldric_final_arc' }], next: null }],
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
        choices: [{ label: "Let's do it.", effects: [{ type: 'relationship', value: 3 }], next: null }],
      },
      aldric_secret_greeting: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "I need to speak with you about something that doesn't leave this library. The sealed vault beneath us contains records the headmaster doesn't want students to find.",
        choices: [{ label: 'What kind of records?', effects: [{ type: 'relationship', value: 3 }], next: 'aldric_vault_records' }],
      },
      aldric_vault_records: {
        speaker: 'Master Aldric', portrait: '🧓',
        text: "Expulsion records. Students who were silenced. I believe Sofi's sister wasn't the only one. I need someone I can trust to help me investigate.",
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
          { label: 'Have you seen a lost tome? Master Aldric is looking for it.',          requires: { flag: 'side_02_active' }, effects: [{ type: 'setFlag', flag: 'asked_zephyr_tome' }, { type: 'completeObjective', objectiveId: 's02_obj_01' }, { type: 'relationship', value: 2 }], next: 'zephyr_tome_info' },
          { label: "I'd like to browse your shop.",                                         effects: [{ type: 'openShop', shopId: 'general_shop', shopName: "Zephyr's Wares" }, { type: 'relationship', value: 1 }], next: null },
          { label: "You're not like any merchant I've met. Where are you actually from?",  requires: { min_charisma: 20 }, effects: [{ type: 'relationship', value: 2 }], next: 'zephyr_charisma_20' },
          { label: "What do you actually want from staying near this place?",              requires: { min_charisma: 40 }, effects: [{ type: 'relationship', value: 3 }], next: 'zephyr_charisma_40' },
          { label: "Do you miss what it felt like to be a student here?",                 requires: { min_charisma: 60 }, effects: [{ type: 'relationship', value: 3 }], next: 'zephyr_charisma_60' },
          { label: "You've been watching this place for years. I think part of you never left.", requires: { min_charisma: 80 }, effects: [{ type: 'relationship', value: 4 }], next: 'zephyr_charisma_80' },
          { label: 'Just passing by.',                                                      next: null },
          { label: "Stop acting like you know me.",                                         effects: [{ type: 'relationship', value: -2 }], next: 'zephyr_rebuff' },
        ],
      },
      farewell: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*glances up briefly* Come back when you need something else.",
        next: null,
      },
      zephyr_rebuff: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*expression flattens* I don't. *goes back to arranging stock, doesn't look up again*",
        choices: [],
      },
      zephyr_charisma_20: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*long pause* Far enough that 'home' stopped meaning anything specific. I've been in a lot of places. *taps the counter* Most of them weren't worth staying in. This one... has its complications.",
        choices: [
          { label: 'What kind of complications?', effects: [{ type: 'relationship', value: 2 }], next: 'zephyr_charisma_20_response' },
          { label: 'I understand that feeling.', effects: [{ type: 'relationship', value: 1 }], next: null },
        ],
      },
      zephyr_charisma_20_response: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "The kind with history. *waves a hand* Come back with more coin and fewer questions.",
        choices: [],
      },
      zephyr_charisma_40: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*still for a moment* That's a better question than most people ask. *quiet* I want to know why. Why I was expelled. Why the vault exists. Why the headmaster is so afraid of what's in it. I've been waiting a long time for someone to help me find out.",
        choices: [
          { label: "Maybe that someone is me.", effects: [{ type: 'relationship', value: 3 }, { type: 'setFlag', flag: 'zephyr_shared_goal' }], next: 'zephyr_charisma_40_response' },
          { label: "That sounds dangerous.", effects: [{ type: 'relationship', value: 1 }], next: null },
        ],
      },
      zephyr_charisma_40_response: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*studies you carefully* ...Don't say things you don't mean. *then, softer* But if you do mean it — I've been waiting a while for someone I could actually work with.",
        choices: [],
      },
      zephyr_charisma_60: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*stops what they're doing* Miss it. *exhales slowly* I miss who I was before I knew what I know. I miss thinking this place was something worth believing in. *beat* That probably sounds pathetic.",
        choices: [
          { label: "It sounds honest. That's rarer.", effects: [{ type: 'relationship', value: 4 }], next: 'zephyr_charisma_60_response' },
          { label: "The Academy still could be worth it — with the right people.", effects: [{ type: 'relationship', value: 2 }], next: null },
        ],
      },
      zephyr_charisma_60_response: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*quiet laugh* ...Yeah. It is rarer. *meets your eyes briefly* You're not what I expected when you first walked up to this stall.",
        choices: [],
      },
      zephyr_charisma_80: {
        speaker: 'Zephyr', portrait: '🧝',
        text: "*doesn't answer for a long moment* ...You're not wrong. I told myself I was just watching. Staying on the edge. But you — *quiet* you pulled me back in. I'm not sure if that's your fault or mine. *looks up* Either way. I'm not leaving.",
        choices: [{ label: "Good. I need you here.", effects: [{ type: 'relationship', value: 5 }, { type: 'setFlag', flag: 'zephyr_final_arc' }], next: null }],
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
          { label: 'Thanks, Zephyr.', effects: [{ type: 'relationship', value: 3 }], next: null },
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

  merchant_courtyard: {
    npcId: 'merchant_courtyard', portrait: '🧑‍💼',
    nodes: {
      start: {
        speaker: 'The Merchant', portrait: '🧑‍💼',
        text: "Ah, a student! You look like someone who appreciates a good deal. Loot boxes — guaranteed B-rank or better per pack. Interested?",
        effects: [{ type: 'setFlag', flag: 'met_merchant_courtyard' }],
        choices: [
          { label: "Let me see your wares.", effects: [{ type: 'openShop', shopId: 'merchant_shop', shopName: "The Merchant's Wares" }], next: null },
          { label: "Maybe another time.", next: null },
        ],
      },
      returning: {
        speaker: 'The Merchant', portrait: '🧑‍💼',
        text: "Welcome back! Stock's the same as always — finest loot boxes around.",
        choices: [
          { label: "Show me what you have.", effects: [{ type: 'openShop', shopId: 'merchant_shop', shopName: "The Merchant's Wares" }], next: null },
          { label: "Not today.", next: null },
        ],
      },
      farewell: {
        speaker: 'The Merchant', portrait: '🧑‍💼',
        text: "Come back anytime — I'll have fresh stock waiting!",
        next: null,
      },
    },
    entries: [
      { requires: { flag: 'met_merchant_courtyard' }, node: 'returning' },
    ],
  },

  merchant: {
    npcId: 'merchant', portrait: '🧑‍💼',
    nodes: {
      start: {
        speaker: 'The Merchant', portrait: '🧑‍💼',
        text: "Welcome, traveller! Finest loot boxes in the Academy — guaranteed B-rank or higher per pack. Take a look?",
        effects: [{ type: 'setFlag', flag: 'met_merchant' }],
        choices: [
          { label: "Let me see your wares.", effects: [{ type: 'openShop', shopId: 'merchant_shop', shopName: "The Merchant's Wares" }], next: null },
          { label: "Maybe another time.", next: null },
        ],
      },
      returning: {
        speaker: 'The Merchant', portrait: '🧑‍💼',
        text: "Back again! Always a pleasure. The stock is fresh — rare finds today.",
        choices: [
          { label: "Show me what you have.", effects: [{ type: 'openShop', shopId: 'merchant_shop', shopName: "The Merchant's Wares" }], next: null },
          { label: "Just browsing.", next: null },
        ],
      },
      farewell: {
        speaker: 'The Merchant', portrait: '🧑‍💼',
        text: "Safe travels! Don't be a stranger.",
        next: null,
      },
    },
    entries: [
      { requires: { flag: 'met_merchant' }, node: 'returning' },
    ],
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

  innkeeper: {
    npcId: 'innkeeper', portrait: '🛎️',
    nodes: {
      start: {
        speaker: 'Innkeeper',
        text: 'Welcome, student. Tired from your studies? I can arrange a room — a full night\'s rest will do you good.',
        choices: [
          {
            label: 'Rest here  ·  10 🪙  (12 hrs)',
            requires: { min_gold: 10 },
            effects: [{ type: 'hotelRest', cost: 10, hours: 12 }],
          },
          { label: 'Maybe later.', next: 'farewell' },
        ],
      },
      farewell: {
        speaker: 'Innkeeper',
        text: 'Rest well whenever you\'re ready. The rooms are always available.',
        choices: [],
      },
    },
  },
};

// ── Grid Card Game Data ───────────────────────────────────────────────────────

// Conjurer cards — named companion characters that serve as deck conjurers (formerly Champions).
// type:'champion' is kept internally so CardSystem continues to work without changes.
export const CHAMPION_CARDS = [
  { cardId: 'conj_elder_rook',    type: 'champion', conjurer: true, name: 'Elder Rook',    hp: 20, maxHp: 20, art: '🔮', cardType: 'Human', rarity: 'S', terrain: 'spell', cardUid: 'C01', artFile: 'Conjurers/001C.png' },
  { cardId: 'conj_lira_solstice', type: 'champion', conjurer: true, name: 'Lira Solstice', hp: 20, maxHp: 20, art: '✨', cardType: 'Human', rarity: 'S', terrain: 'fire',  cardUid: 'C02', artFile: 'Conjurers/002C.png' },
  { cardId: 'conj_malachar',      type: 'champion', conjurer: true, name: 'Malachar',      hp: 20, maxHp: 20, art: '🔥', cardType: 'Human', rarity: 'S', terrain: 'fire',  cardUid: 'C03', artFile: 'Conjurers/003C.png' },
];

// Conjurer companion NPC definitions — used by the companion panel and companion system.
export const CONJURER_COMPANIONS = [
  {
    id: 'conj_elder_rook',
    name: 'Elder Rook',
    portrait: '🔮',
    portraitImg: 'assets/images/CardGameArt/CardArt/Conjurers/001C.png',
    cardId: 'conj_elder_rook',
    friendshipRequired: 5,
    description: 'A venerable arcane scholar whose mastery of the old magics has made him a living legend at the Academy.',
    romanceable: true,
  },
  {
    id: 'conj_lira_solstice',
    name: 'Lira Solstice',
    portrait: '✨',
    portraitImg: 'assets/images/CardGameArt/CardArt/Conjurers/002C.png',
    cardId: 'conj_lira_solstice',
    friendshipRequired: 5,
    description: 'A talented young conjurer with a radiant golden flame. She specialises in fire-and-light combination magic.',
    romanceable: true,
  },
  {
    id: 'conj_malachar',
    name: 'Malachar',
    portrait: '🔥',
    portraitImg: 'assets/images/CardGameArt/CardArt/Conjurers/003C.png',
    cardId: 'conj_malachar',
    friendshipRequired: 5,
    description: 'A brooding fire conjurer of immense power. His allegiance is hard to earn, but invaluable once gained.',
    romanceable: false,
  },
];

export const ELITE_CARD_DECK = [
  { cardId: 'elite_golem',       type: 'elite', name: 'Stone Golem',     hp: 20, power: 4,  art: '🗿',  role: 'defensive', ability: { type: 'heal_per_turn',  amount: 2, desc: 'Heals 2 HP at the start of each turn.' },  cardType: 'Golem',     rarity: 'A', terrain: 'earth', cardUid: '017A', artFile: '017A_img.jpg'  },
  { cardId: 'elite_phoenix',     type: 'elite', name: 'Phoenix',         hp: 7,  power: 9,  art: '🦅',  role: 'offensive', ability: { type: 'kill_bonus',              desc: 'Gains +1 attack for each card destroyed.' }, cardType: 'Beast',     rarity: 'A', terrain: 'fire',  cardUid: '033A', artFile: '033A_img.JPG'  },
  { cardId: 'elite_dragon',      type: 'elite', name: 'Shadow Dragon',   hp: 10, power: 10, art: '🐉',  role: 'support',   ability: { type: 'extended_rally',           desc: 'Rally 2 cells when HP ≤ 50%.' },             cardType: 'Dragon',    rarity: 'S', terrain: 'wind',  cardUid: '031A', artFile: '031A_img.jpg'  },
  { cardId: 'elite_knight',      type: 'elite', name: 'Iron Knight',     hp: 18, power: 5,  art: '🛡️', role: 'defensive', ability: { type: 'heal_per_turn',  amount: 2, desc: 'Heals 2 HP at the start of each turn.' },  cardType: 'Anthro',    rarity: 'A', terrain: 'earth', cardUid: '011A', artFile: '011A_img.jpg'  },
  { cardId: 'elite_witch',       type: 'elite', name: 'Dark Witch',      hp: 8,  power: 9,  art: '🧙',  role: 'offensive', ability: { type: 'kill_bonus',              desc: 'Gains +1 attack for each card destroyed.' }, cardType: 'Fae',       rarity: 'A', terrain: 'spell', cardUid: '003A', artFile: '003A_img.jpeg' },
  { cardId: 'elite_vampire',     type: 'elite', name: 'Vampire Lord',    hp: 7,  power: 10, art: '🧛',  role: 'offensive', ability: { type: 'kill_bonus',              desc: 'Gains +1 attack for each card destroyed.' }, cardType: 'Human',     rarity: 'A', terrain: 'spell', cardUid: '013A', artFile: '013A_img.jpg'  },
  { cardId: 'elite_elemental',   type: 'elite', name: 'Storm Elemental', hp: 9,  power: 9,  art: '⛈️', role: 'support',   ability: { type: 'extended_rally',           desc: 'Rally 2 cells when HP ≤ 50%.' },             cardType: 'Beast',     rarity: 'A', terrain: 'wind',  cardUid: '032A', artFile: '032A_img.JPG'  },
  { cardId: 'elite_paladin',     type: 'elite', name: 'Light Paladin',   hp: 16, power: 6,  art: '⚜️', role: 'defensive', ability: { type: 'heal_per_turn',  amount: 2, desc: 'Heals 2 HP at the start of each turn.' },  cardType: 'Worshiper', rarity: 'A', terrain: 'spell', cardUid: '023A', artFile: '023A_img.JPG'  },
  { cardId: 'elite_assassin',    type: 'elite', name: 'Shadow Assassin', hp: 7,  power: 10, art: '🗡️', role: 'offensive', ability: { type: 'kill_bonus',              desc: 'Gains +1 attack for each card destroyed.' }, cardType: 'Fae',       rarity: 'A', terrain: 'earth', cardUid: '005A', artFile: '005A_img.jpg'  },
  { cardId: 'elite_necromancer', type: 'elite', name: 'Necromancer',     hp: 9,  power: 9,  art: '💀',  role: 'support',   ability: { type: 'extended_rally',           desc: 'Rally 2 cells when HP ≤ 50%.' },             cardType: 'Human',     rarity: 'A', terrain: 'spell', cardUid: '009A', artFile: '009A_img.jpg'  },
];

export const SUMMON_CARD_DECK = [
  // Cost 2 — hardest low roll (1/36) — both have special abilities
  { cardId: 'sum_imp',       type: 'summon', name: 'Fire Imp',       hp: 5, power: 2, summonCost: 2,  art: '👺', role: 'defensive', ability: { type: 'stack_to_any_elite', desc: 'Can be dragged from any Champion\'s stack to any Elite on the field.' }, cardType: 'Demon',  rarity: 'C', terrain: 'fire',  cardUid: '033A' },
  { cardId: 'sum_wisp',      type: 'summon', name: 'Arcane Wisp',    hp: 4, power: 4, summonCost: 2,  art: '✨', role: 'support',   ability: { type: 'heal_parent',       desc: 'Heals parent elite +1 HP each turn.' },                   cardType: 'Beast',  rarity: 'C', terrain: 'spell', cardUid: '037A' },
  // Cost 3 — hard roll (2/36) — both have special abilities
  { cardId: 'sum_sprite',    type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3,  art: '🧊', role: 'defensive', ability: { type: 'return_from_crypt', desc: 'Returns to hand when destroyed.' },                        cardType: 'Fae',    rarity: 'C', terrain: 'ice',   cardUid: '032A' },
  { cardId: 'sum_bat',       type: 'summon', name: 'Shadow Bat',     hp: 2, power: 4, summonCost: 3,  art: '🦇', role: 'offensive', ability: { type: 'void_on_death', desc: 'When destroyed, tears open The Void on a random cell.' }, cardType: 'Human',  rarity: 'C', terrain: 'spell', cardUid: '014A', artFile: '014A_img.jpg'  },
  { cardId: 'sum_sprite',    type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3,  art: '🧊', role: 'defensive', ability: { type: 'return_from_crypt', desc: 'Returns to hand when destroyed.' },                        cardType: 'Fae',    rarity: 'C', terrain: 'ice',   cardUid: '032A' },
  { cardId: 'sum_bat',       type: 'summon', name: 'Shadow Bat',     hp: 2, power: 4, summonCost: 3,  art: '🦇', role: 'offensive', ability: { type: 'void_on_death', desc: 'When destroyed, tears open The Void on a random cell.' }, cardType: 'Human',  rarity: 'C', terrain: 'spell', cardUid: '014A', artFile: '014A_img.jpg'  },
  // Cost 4 (×5)
  { cardId: 'sum_shaman',    type: 'summon', name: 'Earth Shaman',   hp: 5, power: 2, summonCost: 4,  art: '🌿', role: 'defensive', cardType: 'Human',  rarity: 'C', terrain: 'earth', cardUid: '007A', artFile: '007A_img.jpg'  },
  { cardId: 'sum_hawk',      type: 'summon', name: 'Storm Hawk',     hp: 2, power: 4, summonCost: 4,  art: '🦅', role: 'offensive', cardType: 'Beast',  rarity: 'C', terrain: 'wind',  cardUid: '021A', artFile: '021A_img.jpg'  },
  { cardId: 'sum_shaman',    type: 'summon', name: 'Earth Shaman',   hp: 5, power: 2, summonCost: 4,  art: '🌿', role: 'defensive', cardType: 'Human',  rarity: 'C', terrain: 'earth', cardUid: '007A', artFile: '007A_img.jpg'  },
  { cardId: 'sum_hawk',      type: 'summon', name: 'Storm Hawk',     hp: 2, power: 4, summonCost: 4,  art: '🦅', role: 'offensive', cardType: 'Beast',  rarity: 'C', terrain: 'wind',  cardUid: '021A', artFile: '021A_img.jpg'  },
  { cardId: 'sum_hawk',      type: 'summon', name: 'Storm Hawk',     hp: 2, power: 4, summonCost: 4,  art: '🦅', role: 'offensive', cardType: 'Beast',  rarity: 'C', terrain: 'wind',  cardUid: '021A', artFile: '021A_img.jpg'  },
  // Cost 5 (×5)
  { cardId: 'sum_bear',      type: 'summon', name: 'Forest Bear',    hp: 6, power: 2, summonCost: 5,  art: '🐻', role: 'defensive', cardType: 'Beast',  rarity: 'B', terrain: 'earth', cardUid: '019A', artFile: '019A_img.jpg'  },
  { cardId: 'sum_djinn',     type: 'summon', name: 'Fire Djinn',     hp: 2, power: 3, summonCost: 5,  art: '🌋', role: 'offensive', cardType: 'Beast',  rarity: 'B', terrain: 'fire',  cardUid: '036A'  },
  { cardId: 'sum_bear',      type: 'summon', name: 'Forest Bear',    hp: 6, power: 2, summonCost: 5,  art: '🐻', role: 'defensive', cardType: 'Beast',  rarity: 'B', terrain: 'earth', cardUid: '019A', artFile: '019A_img.jpg'  },
  { cardId: 'sum_djinn',     type: 'summon', name: 'Fire Djinn',     hp: 2, power: 3, summonCost: 5,  art: '🌋', role: 'offensive', cardType: 'Beast',  rarity: 'B', terrain: 'fire',  cardUid: '036A'  },
  { cardId: 'sum_bear',      type: 'summon', name: 'Forest Bear',    hp: 6, power: 2, summonCost: 5,  art: '🐻', role: 'defensive', cardType: 'Beast',  rarity: 'B', terrain: 'earth', cardUid: '019A', artFile: '019A_img.jpg'  },
  // Cost 6 (×6)
  { cardId: 'sum_sentinel',  type: 'summon', name: 'Stone Sentinel', hp: 5, power: 1, summonCost: 6,  art: '🗿', role: 'defensive', cardType: 'Golem',  rarity: 'B', terrain: 'earth', cardUid: '018A', artFile: '018A_img.jpg'  },
  { cardId: 'sum_fox',       type: 'summon', name: 'Lightning Fox',  hp: 3, power: 3, summonCost: 6,  art: '🦊', role: 'support',   cardType: 'Beast',  rarity: 'B', terrain: 'wind',  cardUid: '027A', artFile: '027A_img.JPG'  },
  { cardId: 'sum_sentinel',  type: 'summon', name: 'Stone Sentinel', hp: 5, power: 1, summonCost: 6,  art: '🗿', role: 'defensive', cardType: 'Golem',  rarity: 'B', terrain: 'earth', cardUid: '018A', artFile: '018A_img.jpg'  },
  { cardId: 'sum_fox',       type: 'summon', name: 'Lightning Fox',  hp: 3, power: 3, summonCost: 6,  art: '🦊', role: 'support',   cardType: 'Beast',  rarity: 'B', terrain: 'wind',  cardUid: '027A', artFile: '027A_img.JPG'  },
  { cardId: 'sum_sentinel',  type: 'summon', name: 'Stone Sentinel', hp: 5, power: 1, summonCost: 6,  art: '🗿', role: 'defensive', cardType: 'Golem',  rarity: 'B', terrain: 'earth', cardUid: '018A', artFile: '018A_img.jpg'  },
  { cardId: 'sum_fox',       type: 'summon', name: 'Lightning Fox',  hp: 3, power: 3, summonCost: 6,  art: '🦊', role: 'support',   cardType: 'Beast',  rarity: 'B', terrain: 'wind',  cardUid: '027A', artFile: '027A_img.JPG'  },
  // Cost 8 (×5)  [No cost-7 cards — a roll of 7 draws from the spell deck instead]
  { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 3, power: 3, summonCost: 8,  art: '💥', role: 'support',   cardType: 'Anthro', rarity: 'B', terrain: 'spell', cardUid: '015A', artFile: '015A_img.jpg'  },
  { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 3, power: 3, summonCost: 8,  art: '💥', role: 'support',   cardType: 'Anthro', rarity: 'B', terrain: 'spell', cardUid: '015A', artFile: '015A_img.jpg'  },
  { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 3, power: 3, summonCost: 8,  art: '💥', role: 'support',   cardType: 'Anthro', rarity: 'B', terrain: 'spell', cardUid: '015A', artFile: '015A_img.jpg'  },
  { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 3, power: 3, summonCost: 8,  art: '💥', role: 'support',   cardType: 'Anthro', rarity: 'B', terrain: 'spell', cardUid: '015A', artFile: '015A_img.jpg'  },
  { cardId: 'sum_titan',     type: 'summon', name: 'Arcane Titan',   hp: 3, power: 3, summonCost: 8,  art: '💥', role: 'support',   cardType: 'Anthro', rarity: 'B', terrain: 'spell', cardUid: '015A', artFile: '015A_img.jpg'  },
  // Cost 9 (×4)
  { cardId: 'sum_wyrm',      type: 'summon', name: 'Frost Wyrm',     hp: 6, power: 2, summonCost: 9,  art: '🐲', role: 'defensive', cardType: 'Dragon', rarity: 'A', terrain: 'ice',   cardUid: '029A', artFile: '029A_img.jpg'  },
  { cardId: 'sum_wyrm',      type: 'summon', name: 'Frost Wyrm',     hp: 6, power: 2, summonCost: 9,  art: '🐲', role: 'defensive', cardType: 'Dragon', rarity: 'A', terrain: 'ice',   cardUid: '029A', artFile: '029A_img.jpg'  },
  { cardId: 'sum_wyrm',      type: 'summon', name: 'Frost Wyrm',     hp: 6, power: 2, summonCost: 9,  art: '🐲', role: 'defensive', cardType: 'Dragon', rarity: 'A', terrain: 'ice',   cardUid: '029A', artFile: '029A_img.jpg'  },
  { cardId: 'sum_wyrm',      type: 'summon', name: 'Frost Wyrm',     hp: 6, power: 2, summonCost: 9,  art: '🐲', role: 'defensive', cardType: 'Dragon', rarity: 'A', terrain: 'ice',   cardUid: '029A', artFile: '029A_img.jpg'  },
  // Cost 10 (×2)
  { cardId: 'sum_leviathan', type: 'summon', name: 'Void Leviathan', hp: 4, power: 4, summonCost: 10, art: '🌊', role: 'support',   cardType: 'Beast',  rarity: 'A', terrain: 'water', cardUid: '022A', artFile: '022A_img.jpg'  },
  { cardId: 'sum_leviathan', type: 'summon', name: 'Void Leviathan', hp: 4, power: 4, summonCost: 10, art: '🌊', role: 'support',   cardType: 'Beast',  rarity: 'A', terrain: 'water', cardUid: '022A', artFile: '022A_img.jpg'  },
  // Cost 11 — hard roll (2/36) — special ability
  { cardId: 'sum_ephoenix',  type: 'summon', name: 'Elder Phoenix',  hp: 3, power: 5, summonCost: 11, art: '🦅', role: 'offensive', ability: { type: 'return_from_crypt', desc: 'Returns to hand when destroyed.' }, cardType: 'Beast',  rarity: 'S', terrain: 'fire',  cardUid: '034A' },
  // Cost 12 — hardest high roll (1/36) — special ability
  { cardId: 'sum_adragon',   type: 'summon', name: 'Ancient Dragon', hp: 8, power: 4, summonCost: 12, art: '🐉', role: 'defensive', ability: { type: 'heal_parent',       desc: 'Heals parent elite +1 HP each turn.' },   cardType: 'Dragon', rarity: 'S', terrain: 'fire',  cardUid: '031A', artFile: '031A_img.jpg'  },
  // Extra copies to reach minimum 40
  { cardId: 'sum_imp',       type: 'summon', name: 'Fire Imp',       hp: 5, power: 2, summonCost: 2,  art: '👺', role: 'defensive', ability: { type: 'stack_to_any_elite', desc: 'Can be dragged from any Champion\'s stack to any Elite on the field.' }, cardType: 'Demon',  rarity: 'C', terrain: 'fire',  cardUid: '033A' },
  { cardId: 'sum_sprite',    type: 'summon', name: 'Frost Sprite',   hp: 5, power: 2, summonCost: 3,  art: '🧊', role: 'defensive', ability: { type: 'return_from_crypt', desc: 'Returns to hand when destroyed.' },                        cardType: 'Fae',    rarity: 'C', terrain: 'ice',   cardUid: '032A' },
  { cardId: 'sum_shaman',    type: 'summon', name: 'Earth Shaman',   hp: 5, power: 2, summonCost: 4,  art: '🌿', role: 'defensive', cardType: 'Human',  rarity: 'C', terrain: 'earth', cardUid: '007A', artFile: '007A_img.jpg'  },
  { cardId: 'sum_bear',      type: 'summon', name: 'Forest Bear',    hp: 6, power: 2, summonCost: 5,  art: '🐻', role: 'defensive', cardType: 'Beast',  rarity: 'B', terrain: 'earth', cardUid: '019A', artFile: '019A_img.jpg'  },
  { cardId: 'sum_sentinel',  type: 'summon', name: 'Stone Sentinel', hp: 5, power: 1, summonCost: 6,  art: '🗿', role: 'defensive', cardType: 'Golem',  rarity: 'B', terrain: 'earth', cardUid: '018A', artFile: '018A_img.jpg'  },
];

// Rolling a 7 draws from this deck instead of matching summon cards.
// Spell cards have no summonCost, HP, or power — only a special effect.
export const SPELL_CARD_DECK = [
  // ×2 each for most cards, giving a 10-card deck
  { cardId: 'spell_double_roll', type: 'spell', name: 'Second Wind',   art: '🎲', description: 'Roll the dice one more time this turn.',                                  effect: { type: 'extra_roll' }, artFile: '000A_img.jpg' },
  { cardId: 'spell_double_roll', type: 'spell', name: 'Second Wind',   art: '🎲', description: 'Roll the dice one more time this turn.',                                  effect: { type: 'extra_roll' }, artFile: '000A_img.jpg' },
  { cardId: 'spell_revive',      type: 'spell', name: 'Resurrection',  art: '💫', description: 'Return the top card of your crypt to your hand.',                         effect: { type: 'revive' } },
  { cardId: 'spell_revive',      type: 'spell', name: 'Resurrection',  art: '💫', description: 'Return the top card of your crypt to your hand.',                         effect: { type: 'revive' } },
  { cardId: 'spell_draw',        type: 'spell', name: 'Arcane Draw',   art: '📖', description: 'Draw 2 summon cards from your deck.',                                     effect: { type: 'draw_cards', count: 2 }, artFile: '035A_img.JPG' },
  { cardId: 'spell_boost_elite', type: 'spell', name: 'Battle Fury',   art: '⚡', description: 'Target player elite gains +3 power until your next turn.',               effect: { type: 'boost_elite', amount: 3 }, needsTarget: 'player_elite', artFile: '036A_img.JPG' },
  { cardId: 'spell_heal_champ',  type: 'spell', name: 'Mending Light', art: '💚', description: 'Restore 5 HP to target player champion (up to max HP).',                 effect: { type: 'heal_champion', amount: 5 }, needsTarget: 'player_champion', artFile: '037A_img.JPG' },
  { cardId: 'spell_teleport_champ', type: 'spell', name: 'Teleportation', art: '✈️', description: 'Relocate a champion to any open space in your champion row.',           effect: { type: 'teleport_champion' }, needsTarget: 'teleport_champion' },
  { cardId: 'spell_shield',      type: 'spell', name: 'Iron Barrier',  art: '🛡', description: 'Target player elite gains +5 max HP and heals 5 HP.',                   effect: { type: 'shield_elite', amount: 5 }, needsTarget: 'player_elite' },
  { cardId: 'spell_weaken',      type: 'spell', name: 'Hex Curse',     art: '💀', description: 'Target opponent elite loses 3 power until the end of their turn.',       effect: { type: 'weaken_elite', amount: 3 }, needsTarget: 'opponent_elite' },
  // ── Terrain spells ──────────────────────────────────────────────────────────
  { cardId: 'spell_forbidden',   type: 'spell', name: 'Forbidden Spell',   art: '⬛', description: 'Place The Void on any play zone cell. Any elite standing on it is immediately destroyed and banished.',    effect: { type: 'set_terrain', terrain: 'the_void' }, needsTarget: 'any_terrain_cell' },
  { cardId: 'spell_eruption',    type: 'spell', name: 'Volcanic Eruption', art: '🌋', description: 'Randomly place Lava Floor terrain on 3 play zone cells for 3 turns. Fire-type units on these cells gain +1 power.', effect: { type: 'random_terrain', terrain: 'lava_floor', count: 3, duration: 3 }, artFile: '034A_img.JPG' },
  { cardId: 'spell_encampment',  type: 'spell', name: 'Encampment',        art: '⛺', description: 'Place a Camp terrain on any play zone cell. Stacked summons on the elite in that cell restore +1 HP each draw phase.', effect: { type: 'set_terrain', terrain: 'camp' }, needsTarget: 'any_terrain_cell' },
];

// ── Loot box types ────────────────────────────────────────────────────────────
export const LOOT_BOX_TYPES = {
  small:  { id: 'small',  icon: '📦', label: 'Small Loot Box',  packCount: 1,  description: '1 Booster Pack · 6 cards\n✦ Guarantees 1× B rank or higher per pack\n✦ S rank: 5% · A rank: 15% · B rank: 30% · C rank: 50%' },
  medium: { id: 'medium', icon: '🎁', label: 'Medium Loot Box', packCount: 3,  description: '3 Booster Packs · 18 cards total\n✦ Guarantees 1× B rank or higher per pack\n✦ S rank: 5% · A rank: 15% · B rank: 30% · C rank: 50%' },
  large:  { id: 'large',  icon: '🎰', label: 'Large Loot Box',  packCount: 10, description: '10 Booster Packs · 60 cards total\n✦ Guarantees 1× B rank or higher per pack\n✦ S rank: 5% · A rank: 15% · B rank: 30% · C rank: 50%' },
};

// Unique obtainable card pool — built from grid card decks.
// Spells have no rarity field so they are assigned 'B'.
export const BOOSTER_CARD_POOL = (() => {
  const seen = new Set();
  const pool = [];
  const addUnique = (cards, rarityOverride) => {
    for (const c of cards) {
      if (!seen.has(c.cardId)) {
        seen.add(c.cardId);
        pool.push(rarityOverride ? { ...c, rarity: rarityOverride } : { ...c });
      }
    }
  };
  addUnique(SUMMON_CARD_DECK, null);
  addUnique(ELITE_CARD_DECK,  null);
  addUnique(SPELL_CARD_DECK,  'B');
  return pool;
})();

// Rarity drop rates (normal pull).
const _RARITY_WEIGHTS  = [['S', 5], ['A', 15], ['B', 30], ['C', 50]];
// Guaranteed-B-or-higher slot (normalised to 100 within B+).
const _BPLUS_WEIGHTS   = [['S', 10], ['A', 30], ['B', 60]];

function _rollRarity(weights) {
  const roll = Math.random() * 100;
  let acc = 0;
  for (const [r, w] of weights) { acc += w; if (roll < acc) return r; }
  return weights[weights.length - 1][0];
}

function _pickCard(rarity) {
  const tier = BOOSTER_CARD_POOL.filter(c => c.rarity === rarity);
  if (tier.length) return tier[Math.floor(Math.random() * tier.length)];
  // Fallback: step up through rarities
  for (const r of ['B', 'A', 'S']) {
    const fb = BOOSTER_CARD_POOL.filter(c => c.rarity === r);
    if (fb.length) return fb[Math.floor(Math.random() * fb.length)];
  }
  return BOOSTER_CARD_POOL[0];
}

/** Generate one booster pack: 6 cards, slot 1 guaranteed B+. */
export function generateBoosterPack() {
  const cards = [_pickCard(_rollRarity(_BPLUS_WEIGHTS))];
  for (let i = 0; i < 5; i++) cards.push(_pickCard(_rollRarity(_RARITY_WEIGHTS)));
  return cards; // array of full card objects
}

/** Generate all packs for a loot box and return a flat array of card objects grouped by pack. */
export function openLootBox(boxTypeId) {
  const def  = LOOT_BOX_TYPES[boxTypeId];
  const count = def?.packCount ?? 1;
  const packs = [];
  for (let i = 0; i < count; i++) packs.push(generateBoosterPack());
  return packs; // array of arrays
}

// ── Narrator ──────────────────────────────────────────────────────────────────
// The narrator has no portrait or name. Each node is keyed 'area_<areaId>' and
// fires once per playthrough on the first visit to that area.
DIALOGUES.narrator = {
  npcId: 'narrator',
  nodes: {
    // ── Academy Courtyard ──────────────────────────────────────────────────
    area_plaza: {
      speaker: '',
      text: 'The Academy Courtyard stretches before you — cobblestones worn smooth by generations of students who walked these same paths, spell-books tucked under their arms, futures unwritten. Your story begins here.',
    },
    area_garden: {
      speaker: '',
      text: 'The Academy Garden is a rare quiet corner amid the bustle of student life. Enchanted flora sway without wind, and the air carries a faint trace of elemental magic — as if the plants themselves have absorbed decades of spell-casting practice.',
    },
    area_study_hall: {
      speaker: '',
      text: 'The Study Hall Entrance marks the boundary between the open courtyard and the academic heart of the Academy. Notice boards line the walls, pinned thick with class schedules, duel challenges, and rumours that no professor has thought to remove.',
    },
    // ── Grand Library ─────────────────────────────────────────────────────
    area_reading_room: {
      speaker: '',
      text: 'The Reading Room breathes with the quiet industry of scholars. Card tomes lie open on every table — treatises on conjuring theory, match histories, annotated deck blueprints. Knowledge, it seems, is the oldest card in any mage\'s hand.',
    },
    area_archive: {
      speaker: '',
      text: 'The Archive stretches deeper than the building should logically allow. Scrolls cataloguing every official duel fought at this Academy line the shelves — victories, defeats, and a handful of matches whose outcomes were never formally recorded.',
    },
    area_rare_books: {
      speaker: '',
      text: 'The Rare Books Vault. Only a few students ever earn access here. The tomes behind the glass contain conjuring techniques so advanced — or so dangerous — that the Headmaster keeps them locked away from the general curriculum.',
    },
    // ── Dueling Grounds ───────────────────────────────────────────────────
    area_practice_ring: {
      speaker: '',
      text: 'The Practice Ring smells of ozone and ambition. Every great duelist at this Academy started here — running the same drills, making the same rookie mistakes, learning through loss. The sand remembers all of them.',
    },
    area_arena_floor: {
      speaker: '',
      text: 'The Arena Floor falls silent as you step onto it. This is where reputations are made. The stands are empty now, but on match days the roar of the crowd fills this space entirely — and every card played carries the weight of an audience.',
    },
    // ── Academy Market ────────────────────────────────────────────────────
    area_main_stalls: {
      speaker: '',
      text: 'The Academy Market is louder and stranger than it first appears. Merchants from outside the Academy have set up alongside student-run stalls, trading card packs, enchanted trinkets, and information — always information.',
    },
    area_potion_row: {
      speaker: '',
      text: 'Potion Row. The scent of a hundred different brews hangs in the air — some pleasant, some deeply questionable. The vendors here occupy a grey area of Academy regulations that the faculty has chosen, wisely, not to examine too closely.',
    },
    // ── Student Dormitory ─────────────────────────────────────────────────
    area_common_room: {
      speaker: '',
      text: 'The Common Room is where the real Academy education happens — late-night strategy debates, informal duels on the floor between the couches, and the quiet solidarity of students who are all, in their own way, figuring things out.',
    },
    area_your_room: {
      speaker: '',
      text: 'Your room. Small, sparsely furnished, but entirely yours. A place to think, to plan, to rest between the demands of Academy life. The window overlooks the courtyard — the same view, perhaps, that every student before you has stared at in the small hours.',
    },
    // ── Headmaster's Office ───────────────────────────────────────────────
    area_antechamber: {
      speaker: '',
      text: 'The Antechamber outside the Headmaster\'s Office carries a particular stillness. Students do not end up here by accident. Whatever reason brought you to this threshold, it is almost certainly significant.',
    },
    area_inner_office: {
      speaker: '',
      text: 'The Inner Office of the Headmaster. Few students ever see this room. The walls are lined with the portraits of every head of this institution — each one watching, each one waiting to see what the current generation will make of itself.',
    },
  },
};

// ── Conjurer companion dialogues ─────────────────────────────────────────────
DIALOGUES.conj_elder_rook = {
  npcId: 'conj_elder_rook', portrait: '🔮',
  entries: [
    { requires: { flag: 'conj_elder_rook_romanced' }, node: 'romanced_greeting' },
    { requires: { flag: 'conj_elder_rook_companion' }, node: 'companion_greeting' },
    { requires: { flag: 'met_elder_rook' }, node: 'returning' },
  ],
  nodes: {
    start: {
      speaker: 'Elder Rook', portrait: '🔮',
      text: "Hm. A new face lingers near my study. Curiosity? Or perhaps something more deliberate. Either way — I don't mind the company. Ask what you will.",
      choices: [
        { label: 'What do you teach here?',     effects: [{ type: 'setFlag', flag: 'met_elder_rook' }, { type: 'relationship', value: 2 }], next: 'rook_teaching' },
        { label: 'You seem... different from the other professors.', effects: [{ type: 'setFlag', flag: 'met_elder_rook' }, { type: 'relationship', value: 3 }], next: 'rook_different' },
        { label: 'Nothing. Just passing by.',   effects: [{ type: 'setFlag', flag: 'met_elder_rook' }], next: null },
      ],
    },
    rook_teaching: {
      speaker: 'Elder Rook', portrait: '🔮',
      text: "I teach Applied Conjuration — the discipline of binding summoned entities through will alone, rather than relying on circles and incantations. Most consider it old-fashioned. I consider it the only honest way.",
      choices: [{ label: 'Fascinating.', effects: [{ type: 'relationship', value: 1 }], next: null }],
    },
    rook_different: {
      speaker: 'Elder Rook', portrait: '🔮',
      text: "*a faint smile* That's because I arrived here as a student, same as you. Decades ago. I never quite left. Perhaps I should have. But then — where else would I be needed?",
      choices: [{ label: 'I think the Academy is lucky to have you.', effects: [{ type: 'relationship', value: 2 }], next: null }],
    },
    returning: {
      speaker: 'Elder Rook', portrait: '🔮',
      text: "Back again. Good. Stagnation is the enemy of a conjurer's craft. What's on your mind?",
      choices: [
        { label: 'Tell me more about your magic.', effects: [{ type: 'relationship', value: 1 }], next: 'rook_magic_deeper' },
        { label: 'I admire the way you carry yourself.',            requires: { min_charisma: 20 }, effects: [{ type: 'relationship', value: 2 }], next: 'rook_charisma_20' },
        { label: 'Do you ever feel lonely here?',                  requires: { min_charisma: 40 }, effects: [{ type: 'relationship', value: 3 }], next: 'rook_charisma_40' },
        { label: 'I came back because I wanted to see you.',       requires: { min_charisma: 60 }, effects: [{ type: 'relationship', value: 4 }], next: 'rook_charisma_60' },
        { label: 'Just passing by again.', next: null },
      ],
    },
    rook_magic_deeper: {
      speaker: 'Elder Rook', portrait: '🔮',
      text: "True conjuration isn't about power — it's about trust. A summon you force into existence will betray you the moment your will wavers. One that chooses to serve you? That bond is unbreakable.",
      choices: [{ label: 'I want to learn that.', effects: [{ type: 'relationship', value: 2 }], next: null }],
    },
    rook_charisma_20: {
      speaker: 'Elder Rook', portrait: '🔮',
      text: "*surprised pause* ...You're quite perceptive. Most students only see the age, the title. Not many bother to look further. I appreciate that.",
      choices: [{ label: "There's a lot worth seeing.", effects: [{ type: 'relationship', value: 2 }], next: null }],
    },
    rook_charisma_40: {
      speaker: 'Elder Rook', portrait: '🔮',
      text: "*long pause, staring out the window* ...Yes. More than I admit. But loneliness is part of what makes one sharp. You learn to listen to what others cannot hear.",
      choices: [{ label: "Then I'll keep visiting.", effects: [{ type: 'relationship', value: 3 }], next: null }],
    },
    rook_charisma_60: {
      speaker: 'Elder Rook', portrait: '🔮',
      text: "*stillness* ...That is the most honest thing anyone has said to me in a very long time. *quietly* I am... glad you did.",
      choices: [{ label: 'Me too.', effects: [{ type: 'relationship', value: 4 }], next: 'rook_romance_seed' }],
    },
    rook_romance_seed: {
      speaker: 'Elder Rook', portrait: '🔮',
      text: "You are unlike the students I have taught for decades. There is something... uncommon about you. I find myself hoping you will return.",
      choices: [{ label: 'I will.', next: null }],
    },
    companion_greeting: {
      speaker: 'Elder Rook', portrait: '🔮',
      text: "Ah. My favourite distraction. What schemes are we concocting today?",
      choices: [
        { label: 'Just wanted to talk.', effects: [{ type: 'relationship', value: 1 }], next: null },
        { label: 'Tell me more about your past.', effects: [{ type: 'relationship', value: 2 }], next: 'rook_past' },
      ],
    },
    rook_past: {
      speaker: 'Elder Rook', portrait: '🔮',
      text: "I was once a student radical — convinced the Academy was hiding something. I was right. But what I found... changed the questions I was asking. Perhaps I'll tell you more another time.",
      choices: [{ label: 'I look forward to it.', next: null }],
    },
    romanced_greeting: {
      speaker: 'Elder Rook', portrait: '🔮',
      text: "*quiet warmth* You make this old place feel considerably less ancient. Come in.",
      choices: [{ label: 'Always.', effects: [{ type: 'relationship', value: 1 }], next: null }],
    },
  },
};

DIALOGUES.conj_lira_solstice = {
  npcId: 'conj_lira_solstice', portrait: '✨',
  entries: [
    { requires: { flag: 'conj_lira_solstice_romanced' }, node: 'romanced_greeting' },
    { requires: { flag: 'conj_lira_solstice_companion' }, node: 'companion_greeting' },
    { requires: { flag: 'met_lira_solstice' }, node: 'returning' },
  ],
  nodes: {
    start: {
      speaker: 'Lira Solstice', portrait: '✨',
      text: "Oh! Hi there — I didn't hear you approach. I get a little lost in my practice sometimes. I'm Lira. Are you new here?",
      choices: [
        { label: "Yes, just arrived.", effects: [{ type: 'setFlag', flag: 'met_lira_solstice' }, { type: 'relationship', value: 2 }], next: 'lira_welcome' },
        { label: "Not exactly new, but I haven't seen you before.", effects: [{ type: 'setFlag', flag: 'met_lira_solstice' }, { type: 'relationship', value: 2 }], next: 'lira_not_new' },
      ],
    },
    lira_welcome: {
      speaker: 'Lira Solstice', portrait: '✨',
      text: "Welcome! The Academy can be overwhelming at first — so many people, so many expectations. But it gets better, I promise. Find me if you ever need someone to talk to!",
      choices: [{ label: 'Thank you, Lira.', effects: [{ type: 'relationship', value: 1 }], next: null }],
    },
    lira_not_new: {
      speaker: 'Lira Solstice', portrait: '✨',
      text: "Ha — that happens. The Academy is huge and people tend to stick to their circles. I try to wander around and meet everyone, but there's always someone I've missed!",
      choices: [{ label: "I'm glad you didn't miss me.", effects: [{ type: 'relationship', value: 2 }], next: null }],
    },
    returning: {
      speaker: 'Lira Solstice', portrait: '✨',
      text: "Hey! *waves* Good timing — I just finished a breakthrough with my light-to-heat conversion technique. Want to hear about it?",
      choices: [
        { label: "Absolutely.", effects: [{ type: 'relationship', value: 2 }], next: 'lira_technique' },
        { label: "Actually, I just wanted to spend time with you.", requires: { min_charisma: 30 }, effects: [{ type: 'relationship', value: 3 }], next: 'lira_charisma_30' },
        { label: "How are you doing?", effects: [{ type: 'relationship', value: 1 }], next: 'lira_doing' },
        { label: "Maybe later.", next: null },
      ],
    },
    lira_technique: {
      speaker: 'Lira Solstice', portrait: '✨',
      text: "So the trick is — instead of converting at the point of contact, you initiate the phase shift mid-flight! The orb arrives already at combustion temperature. Nobody taught me that; I figured it out on my own.",
      choices: [{ label: "That's brilliant.", effects: [{ type: 'relationship', value: 2 }], next: null }],
    },
    lira_doing: {
      speaker: 'Lira Solstice', portrait: '✨',
      text: "Honestly? Really good lately. I've been sleeping better, my magic flows easier... I think having someone around who actually listens has something to do with it.",
      choices: [{ label: "I'm glad.", effects: [{ type: 'relationship', value: 2 }], next: null }],
    },
    lira_charisma_30: {
      speaker: 'Lira Solstice', portrait: '✨',
      text: "*pause, then a slow smile* ...Yeah? *laughs softly* Okay. Then let's just sit for a bit. No magic. Just us.",
      choices: [{ label: 'Perfect.', effects: [{ type: 'relationship', value: 3 }], next: null }],
    },
    companion_greeting: {
      speaker: 'Lira Solstice', portrait: '✨',
      text: "There you are! I was starting to wonder if you'd gotten lost in the east wing again.",
      choices: [
        { label: 'I have a terrible sense of direction.', effects: [{ type: 'relationship', value: 1 }], next: null },
        { label: 'I wanted to make sure you missed me.', requires: { min_charisma: 40 }, effects: [{ type: 'relationship', value: 2 }], next: 'lira_missed' },
      ],
    },
    lira_missed: {
      speaker: 'Lira Solstice', portrait: '✨',
      text: "*flustered laugh* ...I did. Don't tell anyone.",
      choices: [{ label: 'Your secret is safe.', next: null }],
    },
    romanced_greeting: {
      speaker: 'Lira Solstice', portrait: '✨',
      text: "*lights up* Hi! *small happy wave* I've been thinking about you.",
      choices: [{ label: 'Good things, I hope.', effects: [{ type: 'relationship', value: 1 }], next: null }],
    },
  },
};

DIALOGUES.conj_malachar = {
  npcId: 'conj_malachar', portrait: '🔥',
  entries: [
    { requires: { flag: 'conj_malachar_companion' }, node: 'companion_greeting' },
    { requires: { flag: 'met_malachar' }, node: 'returning' },
  ],
  nodes: {
    start: {
      speaker: 'Malachar', portrait: '🔥',
      text: "...*stares* You're staring at me. Most people know better. What do you want?",
      choices: [
        { label: "I wasn't intimidated — that's rare.", effects: [{ type: 'setFlag', flag: 'met_malachar' }, { type: 'relationship', value: 3 }], next: 'malachar_bold' },
        { label: 'I just wanted to introduce myself.', effects: [{ type: 'setFlag', flag: 'met_malachar' }, { type: 'relationship', value: 1 }], next: 'malachar_intro' },
        { label: 'Nothing. Forget it.', effects: [{ type: 'setFlag', flag: 'met_malachar' }], next: null },
      ],
    },
    malachar_intro: {
      speaker: 'Malachar', portrait: '🔥',
      text: "...Fine. Name's Malachar. I'm not here to make friends. But I respect directness. Don't waste my time and I won't waste yours.",
      choices: [{ label: 'Fair enough.', effects: [{ type: 'relationship', value: 1 }], next: null }],
    },
    malachar_bold: {
      speaker: 'Malachar', portrait: '🔥',
      text: "*long look* ...Hm. You're either reckless or sharp. Might be both. Malachar. Remember it.",
      choices: [{ label: 'I will.', effects: [{ type: 'relationship', value: 2 }], next: null }],
    },
    returning: {
      speaker: 'Malachar', portrait: '🔥',
      text: "You again. *pause* ...I suppose I don't object.",
      choices: [
        { label: 'Still trying to scare people off?', effects: [{ type: 'relationship', value: 2 }], next: 'malachar_facade' },
        { label: 'What are you working on?',          effects: [{ type: 'relationship', value: 1 }], next: 'malachar_work' },
        { label: 'I like your fire magic.',           requires: { min_charisma: 30 }, effects: [{ type: 'relationship', value: 3 }], next: 'malachar_charisma_30' },
        { label: 'Just checking in.',                 next: null },
      ],
    },
    malachar_facade: {
      speaker: 'Malachar', portrait: '🔥',
      text: "*short pause, looks away* ...It saves time. Most people aren't worth the effort of knowing. You seem to be an exception. I haven't decided if that's convenient or irritating.",
      choices: [{ label: "I'll take it.", effects: [{ type: 'relationship', value: 2 }], next: null }],
    },
    malachar_work: {
      speaker: 'Malachar', portrait: '🔥',
      text: "Fire compression — containing an explosion in a sphere no larger than your fist, then releasing it at precisely the right moment. Most conjurers lack the patience for it. I find it... meditative.",
      choices: [{ label: 'Teach me?', effects: [{ type: 'relationship', value: 3 }], next: null }],
    },
    malachar_charisma_30: {
      speaker: 'Malachar', portrait: '🔥',
      text: "*stills* ...It's not for show. *quieter* Fire answers honestly. No politics. No deception. Just heat, or nothing. I respect that.",
      choices: [{ label: 'So do I.', effects: [{ type: 'relationship', value: 3 }], next: null }],
    },
    companion_greeting: {
      speaker: 'Malachar', portrait: '🔥',
      text: "...*nod* You made it back. Good.",
      choices: [
        { label: 'Miss me?', effects: [{ type: 'relationship', value: 1 }], next: 'malachar_missed' },
        { label: 'Always.', effects: [{ type: 'relationship', value: 1 }], next: null },
      ],
    },
    malachar_missed: {
      speaker: 'Malachar', portrait: '🔥',
      text: "...*exhales slowly* Don't push it.",
      choices: [{ label: '*smiles*', next: null }],
    },
  },
};

// ── Dialogue reactions ────────────────────────────────────────────────────────
// Maps "npcId.nodeId" → reaction name.
// Reactions: neutral | happy | sad | scared | mad | shy | aroused
// DialogueSystem looks this up each time a node is shown; nodes can also
// declare a `reaction` field directly to override this table.
export const DIALOGUE_REACTIONS = {
  // ── Aria ──────────────────────────────────────────────────────────────────
  'aria.start':                    'neutral',
  'aria.aria_intro_response':      'happy',
  'aria.aria_intro_bold':          'happy',
  'aria.aria_intro_challenge_tease': 'happy',
  'aria.returning_greeting':       'neutral',
  'aria.aria_rebuff':              'sad',
  'aria.aria_about_academy':       'neutral',
  'aria.aria_elements_debate':     'happy',
  'aria.aria_challenge_accept':    'happy',
  'aria.post_challenge_check':     'neutral',
  'aria.friend_greeting':          'sad',
  'aria.aria_friend_pressure':     'happy',
  'aria.aria_friend_focus':        'neutral',
  'aria.story_scene_greeting':     'sad',
  'aria.aria_story_reveal':        'sad',
  'aria.bonded_greeting':          'happy',
  'aria.post_win':                 'happy',
  'aria.aria_post_win_follow':     'happy',
  'aria.post_lose':                'neutral',
  'aria.aria_post_lose_response':  'happy',
  'aria.aria_charisma_20':            'sad',
  'aria.aria_charisma_40':            'shy',
  'aria.aria_charisma_40_response':   'shy',
  'aria.aria_charisma_60':            'shy',
  'aria.aria_charisma_60_response':   'aroused',
  'aria.aria_charisma_80':            'happy',

  // ── Master Aldric ─────────────────────────────────────────────────────────
  'master_aldric.start':                   'neutral',
  'master_aldric.aldric_eager':            'neutral',
  'master_aldric.aldric_polite':           'neutral',
  'master_aldric.aldric_biting_books':     'neutral',
  'master_aldric.aldric_arcane_theory':    'neutral',
  'master_aldric.aldric_returning':        'neutral',
  'master_aldric.aldric_rebuff':           'mad',
  'master_aldric.aldric_lost_tome':        'sad',
  'master_aldric.aldric_guidance':         'neutral',
  'master_aldric.aldric_tome_return':      'neutral',
  'master_aldric.aldric_tome_returned':    'happy',
  'master_aldric.aldric_tome_done':        'happy',
  'master_aldric.aldric_lessons_greeting': 'happy',
  'master_aldric.aldric_secret_greeting':  'scared',
  'master_aldric.aldric_vault_records':    'scared',
  'master_aldric.aldric_final':            'sad',
  'master_aldric.post_win':               'happy',
  'master_aldric.aldric_post_win_response': 'happy',
  'master_aldric.post_lose':              'neutral',
  'master_aldric.aldric_charisma_20':        'sad',
  'master_aldric.aldric_charisma_20_response': 'sad',
  'master_aldric.aldric_charisma_40':        'sad',
  'master_aldric.aldric_charisma_40_response': 'sad',
  'master_aldric.aldric_charisma_60':        'scared',
  'master_aldric.aldric_charisma_80':        'happy',

  // ── Zephyr ────────────────────────────────────────────────────────────────
  'zephyr.start':                  'neutral',
  'zephyr.zephyr_obvious':         'neutral',
  'zephyr.zephyr_wares':           'neutral',
  'zephyr.zephyr_returning':       'neutral',
  'zephyr.zephyr_rebuff':          'mad',
  'zephyr.zephyr_tome_info':       'neutral',
  'zephyr.zephyr_tip_greeting':    'neutral',
  'zephyr.zephyr_source':          'neutral',
  'zephyr.zephyr_serious':         'neutral',
  'zephyr.zephyr_secret_greeting': 'sad',
  'zephyr.zephyr_final':           'happy',
  'zephyr.post_win':               'happy',
  'zephyr.post_lose':              'neutral',
  'zephyr.zephyr_charisma_20':        'neutral',
  'zephyr.zephyr_charisma_20_response': 'neutral',
  'zephyr.zephyr_charisma_40':        'sad',
  'zephyr.zephyr_charisma_40_response': 'shy',
  'zephyr.zephyr_charisma_60':        'sad',
  'zephyr.zephyr_charisma_60_response': 'shy',
  'zephyr.zephyr_charisma_80':        'happy',

  // ── Merchant ──────────────────────────────────────────────────────────────
  'merchant.start':               'happy',
  'merchant.returning':           'happy',
  'merchant_courtyard.start':     'happy',
  'merchant_courtyard.returning': 'happy',

  // ── Training Dummy ────────────────────────────────────────────────────────
  'training_dummy.start':    'neutral',
  'training_dummy.post_win': 'happy',
  'training_dummy.post_lose': 'neutral',
};

// ── Deck validation ───────────────────────────────────────────────────────────
// Rules: exactly 10 elites, exactly 10 spells, at least 40 summons.
export function validateDeck(deck) {
  const eliteCount  = (deck.elites  ?? []).length;
  const spellCount  = (deck.spells  ?? []).length;
  const summonCount = (deck.summons ?? []).length;
  const errors = [];
  if (eliteCount  !== 10) errors.push(`Elites: ${eliteCount}/10 required`);
  if (spellCount  >   10) errors.push(`Spells: ${spellCount} exceeds max of 10`);
  if (summonCount  < 40)  errors.push(`Summons: ${summonCount}/40 minimum`);
  // Each elite must be unique (no duplicate cardIds)
  const eliteIds = (deck.elites ?? []).map(e => e.cardId);
  const uniqueEliteSet = new Set(eliteIds);
  if (uniqueEliteSet.size !== eliteIds.length) {
    const dups = [...new Set(eliteIds.filter((id, i) => eliteIds.indexOf(id) !== i))];
    errors.push(`Duplicate elites not allowed: ${dups.join(', ')}`);
  }
  // Max 2 copies of any single spell card
  const spellTally = {};
  for (const sp of (deck.spells ?? [])) spellTally[sp.cardId] = (spellTally[sp.cardId] ?? 0) + 1;
  for (const [id, cnt] of Object.entries(spellTally)) {
    if (cnt > 2) errors.push(`Spell "${id}": ${cnt} copies (max 2)`);
  }
  return { valid: errors.length === 0, eliteCount, spellCount, summonCount, errors };
}

// ── Quick Match ───────────────────────────────────────────────────────────────

export const QUICK_MATCH_OPPONENTS = [
  { npcId: 'training_dummy', name: 'Training Dummy', portrait: '🪆', difficulty: 1, difficultyLabel: 'Beginner', description: 'A magical training construct. Perfect for first-timers and warm-up rounds.' },
  { npcId: 'aria',           name: 'Sofi',           portrait: '🧙‍♀️', difficulty: 2, difficultyLabel: 'Medium',   description: 'Aggressive fire specialist. Expects to win fast — do not let her.' },
  { npcId: 'zephyr',         name: 'Zephyr',         portrait: '🧝', difficulty: 2, difficultyLabel: 'Medium',   description: 'Void and ice tactics. Unpredictable and hard to read until it\'s too late.' },
  { npcId: 'master_aldric',  name: 'Master Aldric',  portrait: '🧓', difficulty: 3, difficultyLabel: 'Expert',   description: 'Arcane grandmaster. Controls the board with surgical, patient precision.' },
];

// ── Deck builder helpers ──────────────────────────────────────────────────────
// These avoid duplicating card data inside starter deck definitions.
function _ec(id) { return ELITE_CARD_DECK.find(e => e.cardId === id); }
function _sc(id, n) { const t = SUMMON_CARD_DECK.find(s => s.cardId === id); return Array.from({ length: n }, () => ({ ...t })); }

export const STARTER_DECKS = [
  {
    id: 'blitz_rush', name: 'Blitz Rush', art: '⚡', color: '#8a2010',
    description: 'Overwhelm your foe with relentless aggression. Cheap summons flood the field and high-power elites close out the game fast.',
    champions: CHAMPION_CARDS,
    elites: [
      _ec('elite_assassin'), _ec('elite_witch'),    _ec('elite_dragon'),   _ec('elite_vampire'),
      _ec('elite_necromancer'), _ec('elite_phoenix'), _ec('elite_elemental'), _ec('elite_paladin'),
      _ec('elite_knight'),  _ec('elite_golem'),
    ],
    summons: [
      ..._sc('sum_imp',   5), ..._sc('sum_bat',    6), ..._sc('sum_hawk',  7),
      ..._sc('sum_djinn', 7), ..._sc('sum_fox',    4), ..._sc('sum_titan', 5),
      ..._sc('sum_wyrm',  3), ..._sc('sum_leviathan', 2),
      _sc('sum_adragon', 1)[0],
    ],
    spells: [
      { cardId: 'spell_double_roll',    type: 'spell', name: 'Second Wind',   art: '🎲', description: 'Roll the dice one more time this turn.',                                        effect: { type: 'extra_roll' }, artFile: '000A_img.jpg' },
      { cardId: 'spell_double_roll',    type: 'spell', name: 'Second Wind',   art: '🎲', description: 'Roll the dice one more time this turn.',                                        effect: { type: 'extra_roll' }, artFile: '000A_img.jpg' },
      { cardId: 'spell_boost_elite',    type: 'spell', name: 'Battle Fury',   art: '⚡', description: 'Target player elite gains +3 power until your next turn.',                     effect: { type: 'boost_elite', amount: 3 }, needsTarget: 'player_elite', artFile: '036A_img.JPG' },
      { cardId: 'spell_boost_elite',    type: 'spell', name: 'Battle Fury',   art: '⚡', description: 'Target player elite gains +3 power until your next turn.',                     effect: { type: 'boost_elite', amount: 3 }, needsTarget: 'player_elite', artFile: '036A_img.JPG' },
      { cardId: 'spell_weaken',         type: 'spell', name: 'Hex Curse',     art: '💀', description: 'Target opponent elite loses 3 power until the end of their turn.',             effect: { type: 'weaken_elite', amount: 3 }, needsTarget: 'opponent_elite' },
      { cardId: 'spell_weaken',         type: 'spell', name: 'Hex Curse',     art: '💀', description: 'Target opponent elite loses 3 power until the end of their turn.',             effect: { type: 'weaken_elite', amount: 3 }, needsTarget: 'opponent_elite' },
      { cardId: 'spell_teleport',       type: 'spell', name: 'Arcane Gate',   art: '🌀', description: 'Teleport target player elite to the front of its nearest champion.',           effect: { type: 'teleport_elite' }, needsTarget: 'player_elite' },
      { cardId: 'spell_teleport_champ', type: 'spell', name: 'Teleportation', art: '✈️', description: 'Relocate a champion to any open space in your champion row.',                 effect: { type: 'teleport_champion' }, needsTarget: 'teleport_champion' },
      { cardId: 'spell_revive',         type: 'spell', name: 'Resurrection',  art: '💫', description: 'Return the top card of your crypt to your hand.',                              effect: { type: 'revive' } },
      { cardId: 'spell_heal_champ',     type: 'spell', name: 'Mending Light', art: '💚', description: 'Restore 5 HP to target player champion (up to max HP).',                       effect: { type: 'heal_champion', amount: 5 }, needsTarget: 'player_champion', artFile: '037A_img.JPG' },
    ],
  },
  {
    id: 'iron_bulwark', name: 'Iron Bulwark', art: '🛡️', color: '#0e3060',
    description: 'Outlast your opponent through sheer endurance. Tanky elites absorb punishment while healing keeps your champions standing.',
    champions: CHAMPION_CARDS,
    elites: [
      _ec('elite_golem'), _ec('elite_knight'),    _ec('elite_paladin'),  _ec('elite_dragon'),
      _ec('elite_elemental'), _ec('elite_phoenix'), _ec('elite_vampire'), _ec('elite_necromancer'),
      _ec('elite_witch'), _ec('elite_assassin'),
    ],
    summons: [
      ..._sc('sum_wisp',     5), ..._sc('sum_sprite',  6), ..._sc('sum_shaman',  6),
      ..._sc('sum_bear',     6), ..._sc('sum_sentinel', 6), ..._sc('sum_wyrm',   6),
      ..._sc('sum_leviathan', 3), _sc('sum_ephoenix', 1)[0], _sc('sum_adragon', 1)[0],
    ],
    spells: [
      { cardId: 'spell_revive',         type: 'spell', name: 'Resurrection',  art: '💫', description: 'Return the top card of your crypt to your hand.',                         effect: { type: 'revive' } },
      { cardId: 'spell_revive',         type: 'spell', name: 'Resurrection',  art: '💫', description: 'Return the top card of your crypt to your hand.',                         effect: { type: 'revive' } },
      { cardId: 'spell_heal_champ',     type: 'spell', name: 'Mending Light', art: '💚', description: 'Restore 5 HP to target player champion (up to max HP).',                  effect: { type: 'heal_champion', amount: 5 }, needsTarget: 'player_champion', artFile: '037A_img.JPG' },
      { cardId: 'spell_heal_champ',     type: 'spell', name: 'Mending Light', art: '💚', description: 'Restore 5 HP to target player champion (up to max HP).',                  effect: { type: 'heal_champion', amount: 5 }, needsTarget: 'player_champion', artFile: '037A_img.JPG' },
      { cardId: 'spell_shield',         type: 'spell', name: 'Iron Barrier',  art: '🛡', description: 'Target player elite gains +5 max HP and heals 5 HP.',                    effect: { type: 'shield_elite', amount: 5 }, needsTarget: 'player_elite' },
      { cardId: 'spell_shield',         type: 'spell', name: 'Iron Barrier',  art: '🛡', description: 'Target player elite gains +5 max HP and heals 5 HP.',                    effect: { type: 'shield_elite', amount: 5 }, needsTarget: 'player_elite' },
      { cardId: 'spell_double_roll',    type: 'spell', name: 'Second Wind',   art: '🎲', description: 'Roll the dice one more time this turn.',                                   effect: { type: 'extra_roll' }, artFile: '000A_img.jpg' },
      { cardId: 'spell_teleport_champ', type: 'spell', name: 'Teleportation', art: '✈️', description: 'Relocate a champion to any open space in your champion row.',            effect: { type: 'teleport_champion' }, needsTarget: 'teleport_champion' },
      { cardId: 'spell_boost_elite',    type: 'spell', name: 'Battle Fury',   art: '⚡', description: 'Target player elite gains +3 power until your next turn.',               effect: { type: 'boost_elite', amount: 3 }, needsTarget: 'player_elite', artFile: '036A_img.JPG' },
      { cardId: 'spell_weaken',         type: 'spell', name: 'Hex Curse',     art: '💀', description: 'Target opponent elite loses 3 power until the end of their turn.',       effect: { type: 'weaken_elite', amount: 3 }, needsTarget: 'opponent_elite' },
    ],
  },
  {
    id: 'arcane_balance', name: 'Arcane Balance', art: '🔮', color: '#301858',
    description: 'A versatile toolkit with answers to every situation. Balanced offense and defense backed by the full spell collection.',
    champions: CHAMPION_CARDS,
    elites: ELITE_CARD_DECK,
    summons: SUMMON_CARD_DECK,
    spells: [
      { cardId: 'spell_double_roll',    type: 'spell', name: 'Second Wind',      art: '🎲', description: 'Roll the dice one more time this turn.',                                        effect: { type: 'extra_roll' }, artFile: '000A_img.jpg' },
      { cardId: 'spell_double_roll',    type: 'spell', name: 'Second Wind',      art: '🎲', description: 'Roll the dice one more time this turn.',                                        effect: { type: 'extra_roll' }, artFile: '000A_img.jpg' },
      { cardId: 'spell_revive',         type: 'spell', name: 'Resurrection',     art: '💫', description: 'Return the top card of your crypt to your hand.',                              effect: { type: 'revive' } },
      { cardId: 'spell_boost_elite',    type: 'spell', name: 'Battle Fury',      art: '⚡', description: 'Target player elite gains +3 power until your next turn.',                     effect: { type: 'boost_elite', amount: 3 }, needsTarget: 'player_elite', artFile: '036A_img.JPG' },
      { cardId: 'spell_heal_champ',     type: 'spell', name: 'Mending Light',    art: '💚', description: 'Restore 5 HP to target player champion (up to max HP).',                       effect: { type: 'heal_champion', amount: 5 }, needsTarget: 'player_champion', artFile: '037A_img.JPG' },
      { cardId: 'spell_teleport_champ', type: 'spell', name: 'Teleportation',    art: '✈️', description: 'Relocate a champion to any open space in your champion row.',                 effect: { type: 'teleport_champion' }, needsTarget: 'teleport_champion' },
      { cardId: 'spell_shield',         type: 'spell', name: 'Iron Barrier',     art: '🛡', description: 'Target player elite gains +5 max HP and heals 5 HP.',                          effect: { type: 'shield_elite', amount: 5 }, needsTarget: 'player_elite' },
      { cardId: 'spell_weaken',         type: 'spell', name: 'Hex Curse',        art: '💀', description: 'Target opponent elite loses 3 power until the end of their turn.',             effect: { type: 'weaken_elite', amount: 3 }, needsTarget: 'opponent_elite' },
      { cardId: 'spell_encampment',     type: 'spell', name: 'Encampment',       art: '⛺', description: 'Place a Camp terrain on any play zone cell. Stacked summons on the elite in that cell restore +1 HP each draw phase.', effect: { type: 'set_terrain', terrain: 'camp' }, needsTarget: 'any_terrain_cell' },
      { cardId: 'spell_draw',           type: 'spell', name: 'Arcane Draw',      art: '📖', description: 'Draw 2 summon cards from your deck.',                                          effect: { type: 'draw_cards', count: 2 }, artFile: '035A_img.JPG' },
    ],
  },
];

// Story-mode starter decks — separate from quickmatch; icon art driven by first elite.
export const STORY_STARTER_DECKS = [
  {
    id: 'story_ember_adept', name: 'Ember Adept', art: '🔥', color: '#7a1808',
    description: 'A relentless assault strategy built around fast elites and cheap summons that flood the field before the enemy can react.',
    champions: CHAMPION_CARDS,
    elites: [
      _ec('elite_phoenix'), _ec('elite_dragon'),   _ec('elite_elemental'), _ec('elite_vampire'),
      _ec('elite_witch'),   _ec('elite_assassin'), _ec('elite_necromancer'), _ec('elite_knight'),
      _ec('elite_paladin'), _ec('elite_golem'),
    ],
    summons: [
      ..._sc('sum_imp',   7), ..._sc('sum_bat',      6), ..._sc('sum_hawk',      7),
      ..._sc('sum_djinn', 6), ..._sc('sum_fox',      4), ..._sc('sum_titan',     5),
      ..._sc('sum_wyrm',  3), ..._sc('sum_leviathan', 2), _sc('sum_adragon', 1)[0],
    ],
    spells: [
      { cardId: 'spell_double_roll',    type: 'spell', name: 'Second Wind',   art: '🎲', description: 'Roll the dice one more time this turn.',                                        effect: { type: 'extra_roll' }, artFile: '000A_img.jpg' },
      { cardId: 'spell_double_roll',    type: 'spell', name: 'Second Wind',   art: '🎲', description: 'Roll the dice one more time this turn.',                                        effect: { type: 'extra_roll' }, artFile: '000A_img.jpg' },
      { cardId: 'spell_boost_elite',    type: 'spell', name: 'Battle Fury',   art: '⚡', description: 'Target player elite gains +3 power until your next turn.',                     effect: { type: 'boost_elite', amount: 3 }, needsTarget: 'player_elite', artFile: '036A_img.JPG' },
      { cardId: 'spell_boost_elite',    type: 'spell', name: 'Battle Fury',   art: '⚡', description: 'Target player elite gains +3 power until your next turn.',                     effect: { type: 'boost_elite', amount: 3 }, needsTarget: 'player_elite', artFile: '036A_img.JPG' },
      { cardId: 'spell_weaken',         type: 'spell', name: 'Hex Curse',     art: '💀', description: 'Target opponent elite loses 3 power until the end of their turn.',             effect: { type: 'weaken_elite', amount: 3 }, needsTarget: 'opponent_elite' },
      { cardId: 'spell_weaken',         type: 'spell', name: 'Hex Curse',     art: '💀', description: 'Target opponent elite loses 3 power until the end of their turn.',             effect: { type: 'weaken_elite', amount: 3 }, needsTarget: 'opponent_elite' },
      { cardId: 'spell_eruption',       type: 'spell', name: 'Volcanic Eruption', art: '🌋', description: 'Randomly place Lava Floor terrain on 3 play zone cells for 3 turns. Fire-type units on these cells gain +1 power.', effect: { type: 'random_terrain', terrain: 'lava_floor', count: 3, duration: 3 }, artFile: '034A_img.JPG' },
      { cardId: 'spell_encampment',     type: 'spell', name: 'Encampment',    art: '⛺', description: 'Place a Camp terrain on any play zone cell. Stacked summons on the elite in that cell restore +1 HP each draw phase.', effect: { type: 'set_terrain', terrain: 'camp' }, needsTarget: 'any_terrain_cell' },
      { cardId: 'spell_revive',         type: 'spell', name: 'Resurrection',  art: '💫', description: 'Return the top card of your crypt to your hand.',                              effect: { type: 'revive' } },
      { cardId: 'spell_heal_champ',     type: 'spell', name: 'Mending Light', art: '💚', description: 'Restore 5 HP to target player champion (up to max HP).',                       effect: { type: 'heal_champion', amount: 5 }, needsTarget: 'player_champion', artFile: '037A_img.JPG' },
    ],
  },
  {
    id: 'story_iron_sentinel', name: 'Iron Sentinel', art: '🗿', color: '#0e3a6a',
    description: 'A fortress strategy anchored by high-HP elites and defensive summons that grind down attackers while sustaining your champions.',
    champions: CHAMPION_CARDS,
    elites: [
      _ec('elite_golem'),  _ec('elite_knight'),  _ec('elite_paladin'),  _ec('elite_dragon'),
      _ec('elite_phoenix'), _ec('elite_elemental'), _ec('elite_vampire'), _ec('elite_necromancer'),
      _ec('elite_witch'),   _ec('elite_assassin'),
    ],
    summons: [
      ..._sc('sum_wisp',     6), ..._sc('sum_sprite',   7), ..._sc('sum_bear',      7),
      ..._sc('sum_shaman',   6), ..._sc('sum_sentinel',  6), ..._sc('sum_wyrm',     5),
      ..._sc('sum_leviathan', 2), _sc('sum_ephoenix', 1)[0], _sc('sum_adragon', 1)[0],
    ],
    spells: [
      { cardId: 'spell_revive',         type: 'spell', name: 'Resurrection',  art: '💫', description: 'Return the top card of your crypt to your hand.',                         effect: { type: 'revive' } },
      { cardId: 'spell_revive',         type: 'spell', name: 'Resurrection',  art: '💫', description: 'Return the top card of your crypt to your hand.',                         effect: { type: 'revive' } },
      { cardId: 'spell_heal_champ',     type: 'spell', name: 'Mending Light', art: '💚', description: 'Restore 5 HP to target player champion (up to max HP).',                  effect: { type: 'heal_champion', amount: 5 }, needsTarget: 'player_champion', artFile: '037A_img.JPG' },
      { cardId: 'spell_heal_champ',     type: 'spell', name: 'Mending Light', art: '💚', description: 'Restore 5 HP to target player champion (up to max HP).',                  effect: { type: 'heal_champion', amount: 5 }, needsTarget: 'player_champion', artFile: '037A_img.JPG' },
      { cardId: 'spell_shield',         type: 'spell', name: 'Iron Barrier',  art: '🛡', description: 'Target player elite gains +5 max HP and heals 5 HP.',                    effect: { type: 'shield_elite', amount: 5 }, needsTarget: 'player_elite' },
      { cardId: 'spell_shield',         type: 'spell', name: 'Iron Barrier',  art: '🛡', description: 'Target player elite gains +5 max HP and heals 5 HP.',                    effect: { type: 'shield_elite', amount: 5 }, needsTarget: 'player_elite' },
      { cardId: 'spell_encampment',     type: 'spell', name: 'Encampment',    art: '⛺', description: 'Place a Camp terrain on any play zone cell. Stacked summons on the elite in that cell restore +1 HP each draw phase.', effect: { type: 'set_terrain', terrain: 'camp' }, needsTarget: 'any_terrain_cell' },
      { cardId: 'spell_teleport_champ', type: 'spell', name: 'Teleportation', art: '✈️', description: 'Relocate a champion to any open space in your champion row.',            effect: { type: 'teleport_champion' }, needsTarget: 'teleport_champion' },
      { cardId: 'spell_forbidden',      type: 'spell', name: 'Forbidden Spell', art: '⬛', description: 'Place The Void on any play zone cell. Any elite standing on it is immediately destroyed and banished.', effect: { type: 'set_terrain', terrain: 'the_void' }, needsTarget: 'any_terrain_cell' },
      { cardId: 'spell_weaken',         type: 'spell', name: 'Hex Curse',     art: '💀', description: 'Target opponent elite loses 3 power until the end of their turn.',       effect: { type: 'weaken_elite', amount: 3 }, needsTarget: 'opponent_elite' },
    ],
  },
  {
    id: 'story_void_scholar', name: 'Void Scholar', art: '💀', color: '#1a0840',
    description: 'Command shadow elites and a complete spell arsenal to control the battlefield with knowledge and cunning rather than brute force.',
    champions: CHAMPION_CARDS,
    elites: [
      _ec('elite_necromancer'), _ec('elite_assassin'), _ec('elite_witch'),   _ec('elite_vampire'),
      _ec('elite_elemental'),   _ec('elite_phoenix'),  _ec('elite_dragon'),  _ec('elite_paladin'),
      _ec('elite_knight'),      _ec('elite_golem'),
    ],
    summons: SUMMON_CARD_DECK,
    spells: [
      { cardId: 'spell_forbidden',      type: 'spell', name: 'Forbidden Spell',  art: '⬛', description: 'Place The Void on any play zone cell. Any elite standing on it is immediately destroyed and banished.',    effect: { type: 'set_terrain', terrain: 'the_void' }, needsTarget: 'any_terrain_cell' },
      { cardId: 'spell_forbidden',      type: 'spell', name: 'Forbidden Spell',  art: '⬛', description: 'Place The Void on any play zone cell. Any elite standing on it is immediately destroyed and banished.',    effect: { type: 'set_terrain', terrain: 'the_void' }, needsTarget: 'any_terrain_cell' },
      { cardId: 'spell_weaken',         type: 'spell', name: 'Hex Curse',        art: '💀', description: 'Target opponent elite loses 3 power until the end of their turn.',             effect: { type: 'weaken_elite', amount: 3 }, needsTarget: 'opponent_elite' },
      { cardId: 'spell_weaken',         type: 'spell', name: 'Hex Curse',        art: '💀', description: 'Target opponent elite loses 3 power until the end of their turn.',             effect: { type: 'weaken_elite', amount: 3 }, needsTarget: 'opponent_elite' },
      { cardId: 'spell_revive',         type: 'spell', name: 'Resurrection',     art: '💫', description: 'Return the top card of your crypt to your hand.',                              effect: { type: 'revive' } },
      { cardId: 'spell_revive',         type: 'spell', name: 'Resurrection',     art: '💫', description: 'Return the top card of your crypt to your hand.',                              effect: { type: 'revive' } },
      { cardId: 'spell_double_roll',    type: 'spell', name: 'Second Wind',      art: '🎲', description: 'Roll the dice one more time this turn.',                                        effect: { type: 'extra_roll' }, artFile: '000A_img.jpg' },
      { cardId: 'spell_boost_elite',    type: 'spell', name: 'Battle Fury',      art: '⚡', description: 'Target player elite gains +3 power until your next turn.',                     effect: { type: 'boost_elite', amount: 3 }, needsTarget: 'player_elite', artFile: '036A_img.JPG' },
      { cardId: 'spell_teleport_champ', type: 'spell', name: 'Teleportation',    art: '✈️', description: 'Relocate a champion to any open space in your champion row.',                 effect: { type: 'teleport_champion' }, needsTarget: 'teleport_champion' },
      { cardId: 'spell_heal_champ',     type: 'spell', name: 'Mending Light',    art: '💚', description: 'Restore 5 HP to target player champion (up to max HP).',                       effect: { type: 'heal_champion', amount: 5 }, needsTarget: 'player_champion', artFile: '037A_img.JPG' },
    ],
  },
];
