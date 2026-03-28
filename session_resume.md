# Session Resume — Conjuring Masters
**Date:** 2026-03-27
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
- **Object tokens (decorative props) fully removed** from all files: `js/Data.js`, `js/main.js`, `js/screens/SceneScreen.js`, `editor.html`, `style.css`

### Barrel loot state
- On loot: `GameState.setFlag('barrel_${id}', Date.now())` stores real timestamp
- `_isBarrelAvailable(id)`: available if no flag or 24 real-minutes have elapsed (1 game-hour = 1 real-minute)
- **Resting now correctly respawns barrels:** `_doHotelRest()` rolls all `barrel_*` timestamps back by `hours × 60,000 ms` after advancing the game clock — applies to both hotel rest and bed rest
- **Looted barrels fade completely:** `.scene-barrel--empty { opacity: 0 }` with 0.4s transition

---

## Dialogue Screen Polish (completed 2026-03-23)

### NPC character art sizing
- `_updateCharHeight()` in `DialogueScreen.js` now calls `_applyCharSize(img, h)` for both player and NPC images
- `_applyCharSize` reads `img.naturalWidth / img.naturalHeight` to set both `height` and `width` proportionally at 3× the dialogue box height — no more stretching
- If the image hasn't loaded yet, a one-time `load` listener applies sizing after load
- `max-width` removed from `.dlg-char-img` (JS now owns both dimensions)
- NPC sprite: `object-fit: contain`, `height: auto`, `max-height: 480px`, width 240px — fixes cropped portraits (e.g. Lira Solstice)

### Narrator mode
- When an NPC has no entry in `CHAR_BASE`, the overlay gets `dlg-narrator` class
- `.dlg-narrator .dlg-char-wrap { visibility: hidden }` hides **both** player and NPC character panels
- Previously only the NPC wrap was hidden; player art was still visible
- **Sprites do NOT fade** during narrator dialogue — `dlg-active` class is only added when `npcId !== 'narrator'`

### Scene fade during dialogue
- When `dialogue:start` fires, SceneScreen adds `dlg-active` to `.scene-backdrop`
- CSS rule `.scene-backdrop.dlg-active` fades `.scene-npc`, `.scene-barrel`, `.scene-treasure`, `.scene-door` to `opacity: 0; pointer-events: none`
- `opacity 0.4s ease` added to all those elements' transition rules for smooth fade
- When `dialogue:end` fires, `dlg-active` is removed and elements fade back in
- Unsub refs stored in `SceneScreen._unsubDialogue[]`, cleaned up in `unmount()`

### NPC hover
- No more scale-on-hover movement for NPC sprites
- Hover shows glow only: boosted drop-shadow `rgba(124,92,191,0.9)`, no `brightness` filter
- `.npc-sprite` transition: `filter 0.2s ease` only

### Dialogue box layout
- Box uses `display: flex; flex-direction: column; overflow: hidden`
- `.dialogue-text`: `flex: 1 1 auto; overflow-y: auto` — scrolls internally
- Choices capped at **5 max** (`this._choices.slice(0, 5)`)

---

## Friendship Animation (completed 2026-03-25)

- Format: `♥ +N` / `♥ -N` using `.dlg-rel-heart` + `.dlg-rel-delta` spans
- `.dlg-rel-feedback` appended to **NPC portrait wrap** (`.dlg-char-wrap-npc`), not dialogue box
- `z-index: 1` — renders **behind** the NPC portrait image (`.dlg-char-img` is `z-index: 2`)
- `top: 0` — anchored at top of portrait wrap, floats upward
- `@keyframes dlg-rel-fade` (2s total):
  - 0% → fade in, settle from below
  - 10% → fully visible at translateY(0)
  - 50% (1s mark) → still visible at translateY(-21px), **fade-out begins here**
  - 100% → opacity 0, translateY(-52px)
- Timer: 2000ms before `_showRelFeedback` hides element

---

## Dialogue UI Updates (completed 2026-03-19)

### Relationship popup placement + animation
- Relationship gain/loss popup (`.dlg-rel-feedback`) is anchored to the NPC portrait container (`.dlg-char-wrap-npc`)
- Popup animates as **slide up + fade out**
- Popup is layered **behind** the NPC portrait image

### Character/image resizing behavior
- NPC/player portrait sizing is applied at dialogue overlay creation
- Removed additional portrait resizing triggers during node/choice transitions
- Dialogue message box is now fixed-height during conversation (`.dialogue-box`)
- Dialogue text/choices scroll internally instead of resizing the box

---

## Deck Management (completed 2026-03-27)

### Custom deck limit
- Max **40 custom decks** enforced in both `DeckBuilderScreen` and `InventoryScreen`
- `DeckBuilderScreen._createDeck()`: hard guard — returns early if `customDecks.length >= 40`
- `DeckBuilderScreen._renderCreateBtn()`: when at limit, button reads `✦ Deck Limit Reached (40/40) ✦`, is disabled (50% opacity) with tooltip "Delete a custom deck to make space."
- Inventory Decks section title shows `X decks · custom N / 40` when custom decks exist

### Delete confirmation (two-tap)
- First tap on `🗑 Delete Deck` changes button text to `Delete "DeckName"?` and turns it red (`#8b1a1a`)
- Second tap confirms deletion; any other action (Cancel / click outside) dismisses without deleting
- Starter decks never show the delete button

### Inventory deck modal actions
- Clicking a deck in Inventory opens actions:
  - `⭐ Set As Main Deck` (or `✓ Main Deck` if already active)
  - `✏️ Edit Deck`
  - `🗑 Delete Deck` (custom decks only, two-tap confirm)
  - `Cancel`

### Main deck behavior
- Setting a deck as main updates:
  - `GameState.deck.activeDeckId`
  - `GameState.deck.activeDeck` (flattened cardId list)
- Sidebar deck label: `Main deck:`
- Sidebar deck name lookup supports custom decks in addition to starter decks

### Match system compatibility
- `CardSystem` active deck resolution supports custom decks via `activeDeckId`

### DeckBuilder save behavior
- `Save Changes` overwrites the edited custom deck only (no fallback new-deck creation)

---

## Starter Deck Rebalance (completed 2026-03-27)

All 6 starter decks (3 quickmatch + 3 story) rebalanced so summon cards favour the most frequently rolled dice numbers.

### Dice probability tiers
| Tier | Costs | Probability |
|------|-------|-------------|
| Top | 6 & 8 | 5/36 each |
| High | 5 & 9 | 4/36 each |
| Mid | 4 & 10 | 3/36 each |
| Low | 3 & 11 | 2/36 each |
| Worst | 2 & 12 | 1/36 each |

Note: cost 7 draws from the **spell** deck, not summon deck.

### New deck compositions (all 40 summon cards each)

| Deck | Top (6+8) | High (5+9) | Mid (4+10) | Tail |
|------|-----------|------------|------------|------|
| **Blitz Rush** | Fox×9, Titan×9 | Djinn×7, Wyrm×4 | Hawk×6, Leviathan×2 | Bat×2, Imp×1 |
| **Iron Bulwark** | Sentinel×10, Titan×8 | Bear×7, Wyrm×6 | Shaman×5, Leviathan×2 | Sprite×1, Wisp×1 |
| **Arcane Balance** | Fox×8, Titan×8 | Bear×6, Wyrm×6 | Shaman×4, Leviathan×4 | Bat×2, Wisp×1, EPhoenix×1 |
| **Ember Adept** | Fox×9, Titan×9 | Djinn×7, Wyrm×4 | Hawk×6, Leviathan×2 | Bat×2, Imp×1 |
| **Iron Sentinel** | Sentinel×10, Titan×8 | Bear×7, Wyrm×6 | Shaman×5, Leviathan×2 | Sprite×1, Wisp×1 |
| **Void Scholar** | Fox×8, Titan×8 | Bear×6, Wyrm×6 | Shaman×4, Leviathan×4 | Bat×2, Wisp×1, EPhoenix×1 |

Top-tier share raised from ~15–22% → **40–45%** across all decks. Worst-tier (2+12) reduced from ~20–31% → **2.5–5%**.

---

## Deck Builder UI Redesign (completed 2026-03-27)

### Background
- `assets/images/CardGameArt/smokebg.jpg` applied to `.db-screen`
- Dark overlay: `linear-gradient(rgba(5,3,18,0.72), rgba(5,3,18,0.72))` stacked on top; `background-attachment: fixed`

### Sub-deck tile panels (deck-of-cards shape)
- Tiles redesigned to look like a physical deck of cards using CSS pseudo-elements:
  - `.db-tile::before` — third card in pile, rotated -3°, translated left + down 9px
  - `.db-tile::after` — second card in pile, rotated +3.5°, translated right + down 6px
- Tile uses `isolation: isolate` so pseudo-elements stack correctly behind it
- Glassmorphic front face: `backdrop-filter: blur(10px)` + semi-transparent gradient background
- Active state: purple glow (`box-shadow: 0 0 18px rgba(124,92,191,0.55)`)
- Complete state: green-tinted gradient + green border
- **Icon art removed:** `.db-tile-icon` (big emoji) and `.db-tile-arts` (card art preview strip) no longer rendered in `_buildTile()`
- Tiles now show only: **Label → Count → Hint → ✓ Ready → Select Cards button**

### Transparent panels
- `.db-subdeck-row`: 45% transparent dark background
- `.db-picker-header`: 60% dark + `backdrop-filter: blur(8px)`
- `.db-picker-actions`: 60% dark + `backdrop-filter: blur(8px)`
- `.db-create-area`: 55% dark + `backdrop-filter: blur(8px)`
- `.db-right-panel`: 55% dark + `backdrop-filter: blur(14px)`

### Right panel card buttons
- `.db-right-entry`: **42% transparent** (`rgba(26,18,58,0.42)`) + `backdrop-filter: blur(4px)` — smoke bg bleeds through
- Pending entries: 28% transparent green tint

---

## Editor Improvements (completed 2026-03-23–25)

### Voice-to-text (Chrome only)
- `VoiceInput` module in `editor.html` uses `webkitSpeechRecognition`
- Each text input/textarea gets a 🎤 mic button wrapped in `.field-ctrl`
- Fixed: `makeField()` must do `wrap.appendChild(VoiceInput.wrap(el))` — calling `wrap()` without appending returned wrapper caused inputs to be detached from DOM (invisible text)

### Map preview overlay guides
- `renderMapPreview()` shows sidebar (12% width) and header (4.4% height) overlay guides
- Helps align NPC/object placement accurately in editor

### Sprite Inspector
- Panel `#sprite-inspector` in editor sidebar
- Shows X/Y axis preview of selected sprite with scale and rotation controls
- Scale slider + number input (0.1–3.0), Rotation° slider + number input (0–360)
- Live-syncs to map preview token transform
- Reset button restores scale=1, rotation=0

### NPC position editing
- Editor stores NPC pixel positions as `mapNpcPos` in area data
- Saved to `sca_map_overrides` localStorage as `npcPositions`
- `main.js` reads and stores on `window._mapNpcPositions`
- `SceneScreen.js` applies stored positions as absolute CSS on NPC elements

---

## NPC Sprite Positioning (completed 2026-03-23)

- `_applySpriteTransform(el, obj)` — module-level helper in `SceneScreen.js`
- Appends `scale(N) rotate(Ndeg)` to element's existing transform
- Applied to barrels, treasures, and positioned NPCs
- `.scene-npc--positioned { position: absolute; transform: translateX(-50%); }` class applied when stored position exists

---

## Title Screen (completed 2026-03-25)

- Font: **PistonBlack-Regular.ttf** (`assets/fonts/PistonBlack-Regular.ttf`)
- `@font-face` declares `'Piston Black'` family
- `.title-screen h1 { font-family: 'Piston Black', sans-serif !important; }` — `!important` overrides `body.font-*` global font preference rules
- **Autoplay music fix:** `MusicPlayer.play()` called on mount; if autoplay is blocked, a pulsing `"🔊 Click anywhere to enable music"` hint (`.title-audio-hint`) appears at the bottom of the title screen after 100ms, dismissing itself on first `pointerdown` or `keydown`

---

## MusicPlayer (js/systems/MusicPlayer.js)

- Singleton BGM manager
- `play(src)`: stops previous track, starts new one; if autoplay blocked, queues `_pending` and retries on first `pointerdown`/`keydown` (each `{ once: true }`)
- `stop()`: pauses and clears current track
- Volume default: 0.5, loop: true

---

## Localhost / Cache Behavior

- `serve.ps1` sends no-cache headers: `Cache-Control: no-store`, `Pragma: no-cache`, `Expires: 0`
- If UI appears stale during local testing: hard refresh (`Ctrl+Shift+R`) or DevTools → Network → "Disable cache"

---

## Pending / Next Areas

- Card match init phase: add deal animation to summon/elite cards during `place_champions` / `place_elites` substeps (`CardGameScreen.js` ~line 939, 975)
- Opponent card animations: draw card slide into hand, dice roll visual, summon/elite card play animation from hand to grid
- Conjurer side quests, romance scene writing
- Card match rewards for conjurer friendship

---

## How to Resume

1. Open a new chat with Claude Code
2. Set working directory to `C:\Users\Mr. Robot\Documents\Test1\SpellcasterAcademy`
3. Reference this file (`session_resume.md`)
4. Key files for game logic:
   - `js/Data.js` — all static data, NPC/card/location definitions, dialogue trees, starter decks
   - `js/GameState.js` — mutable game state + helper methods
   - `js/systems/RelationshipSystem.js` — relationship + companion unlock logic
   - `js/screens/SceneScreen.js` — world exploration, NPC interaction, companion panel
   - `js/screens/DialogueScreen.js` — dialogue overlay, character art sizing, narrator mode
   - `js/screens/CardGameScreen.js` — card match UI
   - `js/screens/DeckBuilderScreen.js` — deck creation/editing UI
   - `js/screens/InventoryScreen.js` — inventory, decks tab, loot boxes
   - `js/systems/MusicPlayer.js` — BGM singleton with autoplay retry
   - `style.css` — all styling
