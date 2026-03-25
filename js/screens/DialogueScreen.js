/**
 * DialogueScreen — typewriter conversation overlay.
 * Renders as a fixed overlay on document.body, staying on top of the current screen.
 * A semi-transparent grayout blocks interaction with the scene behind it.
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

const CHAR_BASE = {
  aria:                'assets/images/CardGameArt/NPCart/Sofi/Lenadisplay.png',
  master_aldric:       'assets/images/characters/master_aldric.svg',
  zephyr:              'assets/images/characters/zephyr.svg',
  training_dummy:      'assets/images/characters/training_dummy.svg',
  merchant:            'assets/images/CardGameArt/NPCart/Merchant_A/wizard_npc.png',
  merchant_courtyard:  'assets/images/CardGameArt/NPCart/Merchant_A/wizard_npc.png',
  conj_elder_rook:     'assets/images/CardGameArt/CardArt/Conjurers/001C.png',
  conj_lira_solstice:  'assets/images/CardGameArt/CardArt/Conjurers/002C.png',
  conj_malachar:       'assets/images/CardGameArt/CardArt/Conjurers/003C.png',
};
const PLAYER_IMAGE = 'assets/images/CardGameArt/MainPlayerArt/mage_npc.png';

const DialogueScreen = {
  _overlayEl:       null,
  _typewriterTimer: null,
  _fullText:        '',
  _charIdx:         0,
  _isDone:          false,
  _choices:         [],
  _canContinue:     false,
  _unsub:           [],
  _npcId:           null,

  // Called directly by DialogueSystem (not via ScreenManager)
  showOverlay(npcId) {
    this._npcId = npcId ?? null;
    this._render();
    this._bindEvents();
  },

  // Legacy mount — in case ScreenManager ever calls it
  mount(container, params = {}) {
    this.showOverlay(params.npcId ?? null);
  },

  unmount() {
    this._clearTypewriter();
    clearTimeout(this._relFeedbackTimer);
    this._unsub.forEach(fn => fn());
    this._unsub = [];
    if (this._overlayEl) {
      this._overlayEl.remove();
      this._overlayEl = null;
    }
    this._npcId = null;
  },

  _render() {
    // Remove any existing overlay
    if (this._overlayEl) this._overlayEl.remove();

    const overlay = document.createElement('div');
    overlay.className = 'dlg-overlay';

    // ── Grayout — blocks all clicks on scene behind ────────────────────
    const grayout = document.createElement('div');
    grayout.className = 'dlg-grayout';
    overlay.appendChild(grayout);

    // ── Panel — characters flanking the dialogue box ───────────────────
    const panel = document.createElement('div');
    panel.className = 'dlg-panel';

    // Player character (left)
    const playerWrap = document.createElement('div');
    playerWrap.className = 'dlg-char-wrap dlg-char-wrap-player';
    const playerImg = document.createElement('img');
    playerImg.className = 'dlg-char-img';
    playerImg.id  = 'dlg-char-player';
    playerImg.src = PLAYER_IMAGE;
    playerImg.alt = 'Player';
    playerWrap.appendChild(playerImg);
    panel.appendChild(playerWrap);

    // ── Dialogue box (center) ──────────────────────────────────────────
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

    // Click inside the box (not on a choice) to advance
    box.addEventListener('click', (e) => {
      if (e.target.classList.contains('choice-btn')) return;
      this._handleAdvance();
    });

    panel.appendChild(box);

    // NPC character (right)
    const npcWrap = document.createElement('div');
    npcWrap.className = 'dlg-char-wrap dlg-char-wrap-npc';

    const relFeedback = document.createElement('div');
    relFeedback.className = 'dlg-rel-feedback hidden';
    relFeedback.id = 'dlg-rel-feedback';
    npcWrap.appendChild(relFeedback);

    const npcImg = document.createElement('img');
    npcImg.className = 'dlg-char-img';
    npcImg.id  = 'dlg-char-npc';
    npcImg.alt = this._npcId ?? 'NPC';
    const charSrc = CHAR_BASE[this._npcId];
    if (charSrc) {
      npcImg.src = charSrc;
      npcWrap.appendChild(npcImg);
    } else {
      npcWrap.style.visibility = 'hidden'; // narrator / no portrait
    }
    panel.appendChild(npcWrap);

    // narrator mode — italic text styling
    overlay.classList.toggle('dlg-narrator', !charSrc);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    this._overlayEl = overlay;

    // Size characters to 3× the dialogue box height once layout is known
    requestAnimationFrame(() => this._updateCharHeight());
  },

  _updateCharHeight() {
    const box    = document.getElementById('dlg-box');
    const player = document.getElementById('dlg-char-player');
    const npc    = document.getElementById('dlg-char-npc');
    if (!box || !player || !npc) return;
    const h = box.offsetHeight * 3;
    this._applyCharSize(player, h);
    this._applyCharSize(npc,    h);
  },

  _applyCharSize(img, h) {
    if (!img) return;
    const applyNow = () => {
      const aspect = img.naturalWidth / img.naturalHeight;
      img.style.height = h + 'px';
      img.style.width  = (aspect > 0 ? Math.round(h * aspect) : h) + 'px';
    };
    if (img.naturalWidth > 0) {
      applyNow();
    } else {
      img.addEventListener('load', applyNow, { once: true });
    }
  },

  _bindEvents() {
    this._unsub.push(
      EventBus.on('dialogue:show',        (data) => this._showNode(data)),
      EventBus.on('dialogue:end',         ()     => this._handleEnd()),
      EventBus.on('relationship:changed', (data) => this._showRelFeedback(data)),
      EventBus.on('shop:open',            ()     => this._hideOverlay()),
      EventBus.on('dialogue:npcSwitch',   ({ npcId }) => this._switchNpc(npcId)),
    );
  },

  _hideOverlay() {
    if (this._overlayEl) this._overlayEl.style.display = 'none';
  },

  _showOverlayEl() {
    if (this._overlayEl) this._overlayEl.style.display = '';
  },

  _switchNpc(npcId) {
    this._npcId = npcId;
    const npcWrap = this._overlayEl?.querySelector('.dlg-char-wrap-npc');
    const npcEl   = document.getElementById('dlg-char-npc');
    const src     = CHAR_BASE[npcId];
    if (npcWrap) npcWrap.style.visibility = src ? '' : 'hidden';
    if (npcEl && src) { npcEl.src = src; npcEl.alt = npcId; }
    if (this._overlayEl) this._overlayEl.classList.toggle('dlg-narrator', !src);
  },

  _showNode({ speaker, portrait, text, choices = [], canContinue = false, reaction = 'neutral' }) {
    this._showOverlayEl();
    this._choices     = choices;
    this._canContinue = canContinue;
    this._fullText    = text ?? '';
    this._charIdx     = 0;
    this._isDone      = false;

    const speakerEl  = document.getElementById('dlg-speaker');
    const textEl     = document.getElementById('dlg-text');
    const contEl     = document.getElementById('dlg-continue');
    const choicesEl  = document.getElementById('dlg-choices');

    if (speakerEl) {
      speakerEl.textContent = speaker ?? '';
      speakerEl.classList.toggle('hidden', !speaker);
    }
    if (textEl)    textEl.textContent    = '';
    if (contEl)    contEl.classList.add('hidden');
    if (choicesEl) { choicesEl.innerHTML = ''; choicesEl.classList.add('hidden'); }

    this._setReaction(reaction);
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
      this._setSpeaking('player');
      this._renderChoices(choicesEl);
      choicesEl?.classList.remove('hidden');
    } else {
      if (contEl) {
        contEl.textContent = this._canContinue ? '▼ Click to continue' : '▼ Click to close';
        contEl.classList.remove('hidden');
      }
    }
  },

  _renderChoices(container) {
    if (!container) return;
    container.innerHTML = '';

    this._choices.slice(0, 5).forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn' + (choice.locked ? ' locked' : '') + (choice.charismaLocked ? ' charisma-locked' : '');

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
      this._clearTypewriter();
      this._finishTypewriter();
    } else if (this._choices.length === 0) {
      EventBus.emit('dialogue:advance');
    }
  },

  _setReaction(reaction) {
    if (!CHAR_BASE[this._npcId]) return; // narrator / no portrait NPC
    const npcEl = document.getElementById('dlg-char-npc');
    if (!npcEl) return;

    const base   = CHAR_BASE[this._npcId] ?? CHAR_BASE.training_dummy;
    const target = (!reaction || reaction === 'neutral')
      ? base
      : base.replace(/(\.[^.]+)$/, `_${reaction}$1`);

    if (npcEl.src.endsWith(target)) return;

    npcEl.classList.add('reacting');
    setTimeout(() => {
      npcEl.onerror = () => { npcEl.src = base; npcEl.onerror = null; };
      npcEl.src = target;
      npcEl.classList.remove('reacting');
      this._updateReactionBadge(reaction);
    }, 120);
  },

  _updateReactionBadge(reaction) {
    const existing = document.getElementById('dlg-reaction-badge');
    if (existing) existing.remove();
    if (!reaction || reaction === 'neutral') return;

    const ICONS = {
      happy:   '😊', sad:     '😢', scared:  '😨',
      mad:     '😠', shy:     '😳', aroused: '😍',
    };
    const icon = ICONS[reaction];
    if (!icon) return;

    const badge = document.createElement('div');
    badge.id        = 'dlg-reaction-badge';
    badge.className = `dlg-reaction-badge reaction-${reaction}`;
    badge.textContent = icon;

    const panel = document.querySelector('.dlg-panel');
    if (panel) panel.appendChild(badge);

    setTimeout(() => badge.remove(), 1500);
  },

  _handleEnd() {
    this.unmount();
  },

  _showRelFeedback({ npcId, delta }) {
    if (!delta || delta === 0) return;
    const el = document.getElementById('dlg-rel-feedback');
    if (!el) return;

    const positive = delta > 0;
    const sign = positive ? `+${delta}` : `${delta}`;
    el.innerHTML = `<span class="dlg-rel-heart">♥</span><span class="dlg-rel-delta">${sign}</span>`;
    el.className = `dlg-rel-feedback ${positive ? 'rel-positive' : 'rel-negative'}`;

    clearTimeout(this._relFeedbackTimer);
    this._relFeedbackTimer = setTimeout(() => {
      el.className = 'dlg-rel-feedback hidden';
    }, 1800);
  },

  update(dt) {},
};

export default DialogueScreen;
