/**
 * DialogueScreen — typewriter conversation UI with branching choices.
 * Controlled by DialogueSystem; this screen is purely presentational.
 *
 * Events listened:
 *   dialogue:show  { speaker, portrait, text, choices, canContinue }
 *   dialogue:end   {}
 *
 * Events emitted:
 *   dialogue:choice  { index }
 *   dialogue:advance {}
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';

// Text speed in chars/sec
const TEXT_SPEEDS = { slow: 20, normal: 40, fast: 80, instant: Infinity };

const DialogueScreen = {
  _container: null,
  _typewriterTimer: null,
  _fullText: '',
  _displayedText: '',
  _charIdx: 0,
  _isDone: false,
  _choices: [],
  _canContinue: false,
  _unsub: [],

  mount(container, params = {}) {
    this._container = container;
    this._render();
    this._bindEvents();
  },

  unmount() {
    this._clearTypewriter();
    this._unsub.forEach(fn => fn());
    this._unsub = [];
    this._container = null;
  },

  _render() {
    const c = this._container;
    c.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'dialogue-screen';

    // Background (inherited scene)
    const bg = document.createElement('div');
    bg.className = 'dialogue-scene-bg';

    const portraitArea = document.createElement('div');
    portraitArea.className = 'dialogue-portrait-area';

    const portrait = document.createElement('div');
    portrait.className = 'dialogue-portrait';
    portrait.id = 'dlg-portrait';
    portrait.textContent = '🧙';
    portraitArea.appendChild(portrait);
    bg.appendChild(portraitArea);
    screen.appendChild(bg);

    // Dialogue box
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

    // Click anywhere on screen to advance
    screen.addEventListener('click', (e) => {
      // Don't advance if clicking a choice button
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
    this._choices = choices;
    this._canContinue = canContinue;
    this._fullText = text ?? '';
    this._charIdx = 0;
    this._isDone = false;

    const speakerEl  = document.getElementById('dlg-speaker');
    const portraitEl = document.getElementById('dlg-portrait');
    const textEl     = document.getElementById('dlg-text');
    const contEl     = document.getElementById('dlg-continue');
    const choicesEl  = document.getElementById('dlg-choices');

    if (speakerEl)  speakerEl.textContent = speaker ?? '';
    if (portraitEl) portraitEl.textContent = portrait ?? '🧙';
    if (textEl)     textEl.textContent = '';
    if (contEl)     contEl.classList.add('hidden');
    if (choicesEl)  { choicesEl.innerHTML = ''; choicesEl.classList.add('hidden'); }

    const speed = TEXT_SPEEDS[GameState.settings.textSpeed] ?? 40;
    if (speed === Infinity) {
      if (textEl) textEl.textContent = this._fullText;
      this._finishTypewriter();
    } else {
      this._startTypewriter(textEl, speed);
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
      this._renderChoices(choicesEl);
      choicesEl?.classList.remove('hidden');
    } else if (this._canContinue) {
      contEl?.classList.remove('hidden');
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
      // Skip typewriter — show full text immediately
      this._clearTypewriter();
      this._finishTypewriter();
    } else if (this._canContinue && this._choices.length === 0) {
      EventBus.emit('dialogue:advance');
    }
  },

  _handleEnd() {
    // Pop dialogue screen; underlying scene screen remounts automatically
    EventBus.emit('screen:pop');
  },

  update(dt) {},
};

export default DialogueScreen;
