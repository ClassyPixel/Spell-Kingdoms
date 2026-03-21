# Session Resume — Conjuring Masters
**Date:** 2026-03-21
**Repo:** https://github.com/ClassyPixel/Spell-Kingdoms (private)
**Branch:** master
**Last committed:** `2eea9d8` feat: visual overhaul, dialogue overlay, font system, UI improvements
**Current session:** Uncommitted — editor.html improvements added locally

---

## Project Overview

Browser game: **Conjuring Masters** — card game + dating sim hybrid.
*(Formerly known as "Spellcaster Academy" / "Spell Kingdoms")*
- Vanilla JS + ES Modules, no framework, no build system
- Open `index.html` directly in browser
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
  - Row 0 = **Enemy HQ** (opponent champions) — labeled in UI
  - Row 1 = opponent elite row
  - Rows 2–3 = battle zone
  - Row 4 = player elite row
  - Row 5 = **Your HQ** (player champions) — labeled in UI
- **Phase order:** initialize → draw → conjure → strategy → regroup → end
- **Right panel:** sidebar (phase instructions + match log) stacked above deck zone

---

## Changes Made This Session

### 1. editor.html — Reload NPC button
- Added `↻ Reload NPC` button in the topbar
- `refreshNpc()` re-clones DIALOGUES source, clears dirty NPC set, re-applies saved localStorage overrides, rebuilds sidebar, and re-renders the current NPC panel if open

### 2. editor.html — Add / Remove dialogue choices
- Each NPC dialogue node now has a **＋ Add Choice** button at the bottom of its choices list
- Each choice row has an **× remove** button; clicking it splices the choice out and re-renders the list with correct numbering
- Add/remove changes are persisted through the existing localStorage save/load flow (full choices array saved and restored)

### 3. editor.html — Choice result tag (positive / negative / neutral)
- Three small pill buttons on each choice row: **▲ Positive** (green), **● Neutral** (gray), **▼ Negative** (red)
- Saves as `result: 'positive' | 'neutral' | 'negative'` on the choice object
- Existing source choices default to `neutral` if no result is set

### 4. editor.html — Dialogue node disabled checkbox
- **Skip** checkbox in each dialogue node's card header
- When checked: node title gets strikethrough, card body dims and goes non-interactive
- Saved as `disabled: true` on the node; game can check this to skip to the next dialogue node
- The toggle itself stays fully clickable even when the node is disabled

### 5. Game title renamed → Conjuring Masters
- All "Spell Kingdoms" references in `editor.html` updated: browser tab title, topbar subtitle, export file comment header

---

## Key New CSS Classes (editor.html)

| Class | Purpose |
|-------|---------|
| `.node-disabled` | Applied to card when Skip is checked — dims body, strikes through title |
| `.node-disabled-toggle` | The Skip label/checkbox in card header |
| `.choice-result` | Wrapper for the three result pill buttons |
| `.result-btn.pos/.neu/.neg` | Individual result buttons with active state colors |
| `.choice-remove` | × button on each choice row |
| `.choice-add` | Dashed ＋ Add Choice button below choices list |

---

## Current Known State / Pending

- **Modified (not yet committed):** `editor.html` (all editor improvements + title rename)
- **Other modified files:** `index.html`, `js/Data.js`, `js/GameState.js`, `js/main.js`, `js/screens/CardGameScreen.js`, `js/screens/DeckBuilderScreen.js`, `js/screens/DialogueScreen.js`, `js/screens/MapScreen.js`, `js/screens/SceneScreen.js`, `js/screens/SettingsScreen.js`, `js/systems/CardSystem.js`, `js/systems/DialogueSystem.js`, `serve.ps1`, `style.css`
- **Untracked:** `Strategies/`, `assets/images/`, `session_resume.md`
- **No known bugs**

---

## How to Resume

1. Open a new chat with Claude Code
2. Set working directory to `C:\Users\Mr. Robot\Documents\Test1\SpellcasterAcademy`
3. Reference this file
4. Key files for editor work:
   - `editor.html`
5. Key files for game logic:
   - `js/systems/CardSystem.js`
   - `js/screens/CardGameScreen.js`
   - `js/Data.js`
   - `style.css`
