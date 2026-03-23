# Session Resume — Conjuring Masters
**Date:** 2026-03-22
**Repo:** https://github.com/ClassyPixel/Spell-Kingdoms (private)
**Branch:** master
**Last committed:** see `git log --oneline -5`

---

## Project Overview

Browser game: **Conjuring Masters** — card game + dating sim hybrid.
*(Formerly known as "Spellcaster Academy" / "Spell Kingdoms")*
- Vanilla JS + ES Modules, no framework, no build system
- Open `index.html` directly in browser or via GitHub Pages
- Working directory: `C:\Users\Mr. Robot\Documents\Test1\SpellcasterAcademy`

---

## Architecture Summary

| File | Role |
|------|------|
| `js/main.js` | Boot, HUD, quick-match UI, event wiring |
| `js/GameState.js` | Single source of truth (player, deck, inventory, progression) |
| `js/systems/CardSystem.js` | All card game logic (no rendering) |
| `js/screens/CardGameScreen.js` | Card game UI renderer (DOM-based) |
| `js/Data.js` | Static data: NPCS, CARDS, ITEMS, LOCATIONS, starter decks, `validateDeck()` |
| `style.css` | All CSS |
| `js/EventBus.js` | Pub/sub |
| `editor.html` | Story / NPC dialogue editor tool |
| `Strategies/strategy_manual.md` | AI training strategy manual (user-filled) |

---

## Card Game Layout (current)

```
[Phase bar — top]
[Opp crypt | Opp hand (face-down) | Opp deck zone]
[Dice zone | Grid + Hand area | Right panel: Sidebar + Deck zone]
[Crypt zone | Log bar (hidden)]
```

- **Grid:** 6 rows × 5 cols
  - Row 0 = **Enemy HQ** (opponent conjurers) — labeled in UI
  - Row 1 = opponent elite row
  - Rows 2–3 = battle zone
  - Row 4 = player elite row
  - Row 5 = **Your HQ** (player conjurers) — labeled in UI
- **Phase order:** initialize → draw → conjure → strategy → regroup → end
- **Right panel:** sidebar (phase instructions + match log) stacked above deck zone

---

## Mobile Support (completed)

All mobile work is committed and live on GitHub Pages.

### index.html changes
- `viewport-fit=cover` added to viewport meta
- `user-scalable=no` added
- `mobile-web-app-capable` / `apple-mobile-web-app-capable` meta tags
- `apple-mobile-web-app-status-bar-style: black-translucent`
- `theme-color: #0d0d1a`
- `#rotate-overlay` div added (shown via CSS when phone is in portrait)

### style.css additions (end of file)
- `touch-action: manipulation` on all interactive elements (prevent double-tap zoom)
- `.cg-touch-selected` — highlight class for tap-to-place selected card
- `@media (max-width: 768px)` — tablet layout
- `@media (max-width: 480px)` — phone layout
- `@media (max-width: 360px)` — very small phone
- `@supports (height: 100dvh)` — fixes mobile Chrome URL bar overflow
- `@supports (padding: env(safe-area-inset-top))` — notch / home bar padding
- `#rotate-overlay` styles + animation — fullscreen portrait blocker

---

## Conjurer Companion System (completed 2026-03-22)

### Concept
- "Champions" renamed to **Conjurers** throughout the UI
- Three named conjurers replace generic champion cards: **Elder Rook**, **Lira Solstice**, **Malachar**
- Conjurer art lives in `assets/images/CardGameArt/CardArt/Conjurers/` (001C.png, 002C.png, 003C.png — transparent PNGs)
- All 7 starter decks (story + quickmatch) include all 3 conjurers automatically via `CHAMPION_CARDS`

### Card rendering
- **In play zone:** frameless — full-bleed art + HP circle + stack badge (`.cg-conjurer-cell`)
- **In hand:** normal framed card panel like any other card
- All conjurers have `hp: 20, maxHp: 20`

### Companion system
- `GameState.companions` tracks `{ friendshipPoints, isCompanion, cardUnlocked, romanced }` per conjurer
- `GameState.relationships` includes all 3 conjurers with `isConjurer: true`
- Helper methods: `addCompanionFriendship()`, `unlockCompanion()`, `setCompanionRomanced()`
- **Auto-unlock:** `RelationshipSystem._onChanged()` checks `friendshipRequired` on every relationship change; calls `unlockCompanion()` + fires a toast when threshold is reached
- Friendship threshold to unlock: **5 points** (low, for easy testing)

### Conjurer locations (in-world NPCs)
| Conjurer | Location |
|----------|----------|
| Elder Rook | Grand Library |
| Lira Solstice | Academy Courtyard (right side) |
| Malachar | Dueling Grounds |

### Dialogue trees
- Full dialogue in `Data.js`: `DIALOGUES.conj_elder_rook`, `DIALOGUES.conj_lira_solstice`, `DIALOGUES.conj_malachar`
- Charisma-gated romance paths for Elder Rook and Lira Solstice
- Malachar: companion path only (not romanceable)
- Entry conditions: romanced → companion greeting → returning → fresh start

### Companions sidebar panel
- 👥 button in SceneScreen sidebar opens companion panel overlay
- Shows active companions with portrait art, friendship bar, hover tooltip
- Click to initiate dialogue

### Key Items tab
- Inventory → Key Items shows unlocked conjurer cards with portrait + description
- Unlocked via `GameState.companions[id].cardUnlocked === true`

---

## World Map Buttons (completed 2026-03-22)

- **Scene backdrop:** `🌍 World Map` button, top-right of the location backdrop area (`.scene-worldmap-btn`)
- **Area Map panel:** `🌍 World Map` button, bottom-right of the area map overlay (`.area-map-worldmap-btn`)
- Both navigate to `MapScreen` via `EventBus.emit('screen:push', { screen: MapScreen })`
- Area Map button also closes its overlay before navigating

---

## All Locations Unlocked

`GameState.progression.unlockedLocations` defaults to all 6 locations:
`academy_courtyard`, `library`, `dueling_grounds`, `market`, `dormitory`, `headmaster_office`

---

## Current Known State / Pending

- **All changes committed and pushed** to `origin/master`
- **No known bugs**
- Potential next areas: conjurer side quests, romance scene writing, card match rewards for conjurer friendship

---

## How to Resume

1. Open a new chat with Claude Code
2. Set working directory to `C:\Users\Mr. Robot\Documents\Test1\SpellcasterAcademy`
3. Reference this file (`session_resume.md`)
4. Key files for game logic:
   - `js/Data.js` — all static data, NPC/card/location definitions, dialogue trees
   - `js/GameState.js` — mutable game state + helper methods
   - `js/systems/RelationshipSystem.js` — relationship + companion unlock logic
   - `js/screens/SceneScreen.js` — world exploration, NPC interaction, companion panel
   - `js/screens/CardGameScreen.js` — card match UI
   - `style.css` — all styling
