# Session Resume — Conjuring Masters
**Date:** 2026-03-23
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
- **Opt-in unlock via dialogue:** When friendship meets `friendshipRequired`, `RelationshipSystem` sets `${npcId}_offer_available` and shows a hint toast. The conjurer will then open with a `companion_invite` node on next conversation. Player can accept or defer — if deferred, the invite opens every subsequent conversation until accepted.
- Accepting fires the `companionUnlock` dialogue effect → `GameState.unlockCompanion()` → sets `${npcId}_companion` flag and unlocks card in Key Items.
- Friendship threshold to trigger invite: **5 points** (low, for easy testing)

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
- Entry conditions: romanced → companion greeting → companion_invite (if offer available) → returning → fresh start

### Conjurer art in dialogue
- `CHAR_BASE` in `DialogueScreen.js` maps all 3 conjurer NPC IDs to their card art PNGs
- Art is displayed as the NPC character panel (right side) during dialogue conversations

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

## Interactable Objects (completed 2026-03-23)

- `assets/images/CardGameArt/ObjectArt/barrel.png` assigned to all barrel objects (`img` field in Data.js)
- `assets/images/CardGameArt/ObjectArt/chest1.png` assigned to all treasure objects
- Scene renders `<img class="scene-barrel-img">` / `<img class="scene-treasure-img">` when `obj.img` is set, emoji fallback otherwise
- Editor (`editor.html`) shows interactable objects list per area with add/remove controls and image preview
- Sidebar coin value now updates immediately when looting barrels/treasures (DOM update after `GameState.addCoin()`)

---

## Dialogue Screen Polish (completed 2026-03-23)

### NPC character art sizing
- `_updateCharHeight()` in `DialogueScreen.js` now calls `_applyCharSize(img, h)` for both player and NPC images
- `_applyCharSize` reads `img.naturalWidth / img.naturalHeight` to set both `height` and `width` proportionally at 3× the dialogue box height — no more stretching
- If the image hasn't loaded yet, a one-time `load` listener applies sizing after load
- `max-width` removed from `.dlg-char-img` (JS now owns both dimensions)

### Narrator mode
- When an NPC has no entry in `CHAR_BASE`, the overlay gets `dlg-narrator` class
- `.dlg-narrator .dlg-char-wrap { visibility: hidden }` hides **both** player and NPC character panels
- Previously only the NPC wrap was hidden; player art was still visible

### Scene fade during dialogue
- When `dialogue:start` fires, SceneScreen adds `dlg-active` to `.scene-backdrop`
- CSS rule `.scene-backdrop.dlg-active` fades `.scene-npc`, `.scene-barrel`, `.scene-treasure`, `.scene-door`, `.scene-prop` to `opacity: 0; pointer-events: none`
- `opacity 0.4s ease` added to all those elements' transition rules for smooth fade
- When `dialogue:end` fires, `dlg-active` is removed and elements fade back in
- Unsub refs stored in `SceneScreen._unsubDialogue[]`, cleaned up in `unmount()`

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
   - `js/screens/DialogueScreen.js` — dialogue overlay, character art sizing, narrator mode
   - `js/screens/CardGameScreen.js` — card match UI
   - `style.css` — all styling
