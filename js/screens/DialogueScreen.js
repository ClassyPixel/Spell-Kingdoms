/**
 * DialogueScreen — typewriter conversation UI with branching choices.
 * Player art (left) and NPC art (right) flank a bottom dialogue box.
 *
 * Events listened:
 *   dialogue:show  { speaker, portrait, text, choices, canContinue }
 *   dialogue:end   {}
 *
 * Events emitted:
 *   dialogue:choice  { index }
 *   dialogue:advance {}
 */
import EventBus  from '../EventBus.js';
import GameState from '../GameState.js';

const TEXT_SPEEDS = { slow: 20, normal: 40, fast: 80, instant: Infinity };

const CHAR_IMAGES = {
  aria:           'assets/images/characters/aria.svg',
  master_aldric:  'assets/images/characters/master_aldric.svg',
  zephyr:         'assets/images/characters/zephyr.svg',
  training_dummy: 'assets/images/characters/training_dummy.svg',
};
const PLAYER_IMAGE = 'assets/images/characters/player.svg';

const DialogueScreen = {
  _container:      null,
  _typewriterTimer: null,
  _fullText:       '',
  _charIdx:        0,
  _isDone:         false,
  _choices:        [],
  _canContinue:    false,
  _unsub:          [],
  _npcId:          null,

  mount(container, params = {}) {
    this._container = container;
    this._npcId     = params.npcId ?? null;
    this._render();
    this._bindEvents();
  },

  unmount() {
    this._clearTypewriter();
    this._unsub.forEach(fn => fn());
    this._unsub   = [];
    this._container = null;
  },

  _render() {
    const c = this._container;
    c.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'dialogue-screen';

    // ── Scene background ───────────────────────────────────────────────
    const bg = document.createElement('div');
    bg.className = 'dialogue-scene-bg';
    screen.appendChild(bg);

    // ── Character art layer ────────────────────────────────────────────
    const chars = document.createElement('div');
    chars.className = 'dialogue-chars';

    const playerImg = document.createElement('img');
    playerImg.className = 'dialogue-char dialogue-char-player';
    playerImg.id  = 'dlg-char-player';
    playerImg.src = PLAYER_IMAGE;
    playerImg.alt = 'Player';
    chars.appendChild(playerImg);

    const npcImg = document.createElement('img');
    npcImg.className = 'dialogue-char dialogue-char-npc';
    npcImg.id  = 'dlg-char-npc';
    npcImg.src = CHAR_IMAGES[this._npcId] ?? CHAR_IMAGES.training_dummy;
    npcImg.alt = this._npcId ?? 'NPC';
    chars.appendChild(npcImg);

    screen.appendChild(chars);

    // ── Dialogue box ───────────────────────────────────────────────────
    const box = document.createElement('div');
    box.className = 'dialogue-box';
    box.id = 'dlg-box';

    const speaker = document.createElement('div');
    speaker.className = 'dialogue-speaker';
    speaker.id = 'dlg-speaker';

    const text = document.createElement('div');
    text.className = 'dialogue-text';
    text.id = 'dlg-text';

    const continueHint = document.createElement('div');
    continueHint.className = 'dialogue-continue hidden';
    continueHint.id = 'dlg-continue';
    continueHint.textContent = '▼ Click to continue';

    const choices = document.createElement('div');
    choices.className = 'dialogue-choices hidden';
    choices.id = 'dlg-choices';

    box.appendChild(speaker);
    box.appendChild(text);
    box.appendChild(continueHint);
    box.appendChild(choices);
    screen.appendChild(box);

    // Click anywhere on screen (not a choice button) to advance
    screen.addEventListener('click', (e) => {
      if (e.target.classList.contains('choice-btn')) return;
      this._handleAdvance();
    });

    c.appendChild(screen);
  },

  _bindEvents() {
    this._unsub.push(
      EventBus.on('dialogue:show', (data) => this._showNode(data)),
      EventBus.on('dialogue:end',  ()     => this._handleEnd()),
    );
  },

  _showNode({ speaker, portrait, text, choices = [], canContinue = false }) {
    this._choices     = choices;
    this._canContinue = canContinue;
    this._fullText    = text ?? '';
    this._charIdx     = 0;
    this._isDone      = false;

    const speakerEl  = document.getElementById('dlg-speaker');
    const textEl     = document.getElementById('dlg-text');
    const contEl     = document.getElementById('dlg-continue');
    const choicesEl  = document.getElementById('dlg-choices');

    if (speakerEl) speakerEl.textContent = speaker ?? '';
    if (textEl)    textEl.textContent    = '';
    if (contEl)    contEl.classList.add('hidden');
    if (choicesEl) { choicesEl.innerHTML = ''; choicesEl.classList.add('hidden'); }

    // NPC is speaking — highlight NPC, dim player
    this._setSpeaking('npc');

    const speed = TEXT_SPEEDS[GameState.settings.textSpeed] ?? 40;
    if (speed === Infinity) {
      if (textEl) textEl.textContent = this._fullText;
      this._finishTypewriter();
    } else {
      this._startTypewriter(textEl, speed);
    }
  },

  _setSpeaking(who) {
    const playerEl = document.getElementById('dlg-char-player');
    const npcEl    = document.getElementById('dlg-char-npc');
    if (who === 'player') {
      playerEl?.classList.add('speaking');
      npcEl?.classList.remove('speaking');
    } else {
      npcEl?.classList.add('speaking');
      playerEl?.classList.remove('speaking');
    }
  },

  _startTypewriter(textEl, speed) {
    this._clearTypewriter();
    const interval = 1000 / speed;
    this._typewriterTimer = setInterval(() => {
      if (this._charIdx >= this._fullText.length) {
        this._clearTypewriter();
        this._finishTypewriter();
        return;
      }
      this._charIdx++;
      if (textEl) textEl.textContent = this._fullText.slice(0, this._charIdx);
    }, interval);
  },

  _clearTypewriter() {
    if (this._typewriterTimer) {
      clearInterval(this._typewriterTimer);
      this._typewriterTimer = null;
    }
  },

  _finishTypewriter() {
    this._isDone = true;
    const textEl    = document.getElementById('dlg-text');
    const contEl    = document.getElementById('dlg-continue');
    const choicesEl = document.getElementById('dlg-choices');

    if (textEl) textEl.textContent = this._fullText;

    if (this._choices.length > 0) {
      // Player's turn to choose
      this._setSpeaking('player');
      this._renderChoices(choicesEl);
      choicesEl?.classList.remove('hidden');
    } else {
      // No choices: show continue hint whether there's a next node or not
      if (contEl) {
        contEl.textContent = this._canContinue ? '▼ Click to continue' : '▼ Click to close';
        contEl.classList.remove('hidden');
      }
    }
  },

  _renderChoices(container) {
    if (!container) return;
    container.innerHTML = '';

    this._choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn' + (choice.locked ? ' locked' : '');

      const label = document.createElement('span');
      label.textContent = choice.label;
      btn.appendChild(label);

      if (choice.requirementText) {
        const req = document.createElement('span');
        req.className = 'choice-req';
        req.textContent = choice.requirementText;
        btn.appendChild(req);
      }

      if (!choice.locked) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          EventBus.emit('dialogue:choice', { index: i });
        });
      }

      container.appendChild(btn);
    });
  },

  _handleAdvance() {
    if (!this._isDone) {
      // Skip typewriter animation
      this._clearTypewriter();
      this._finishTypewriter();
    } else if (this._choices.length === 0) {
      // Always advance when there are no choices (ends the dialogue if no next node)
      EventBus.emit('dialogue:advance');
    }
  },

  _handleEnd() {
    EventBus.emit('screen:pop');
  },

  update(dt) {},
};

export default DialogueScreen;
