/**
 * SoundSystem — Procedural Web Audio sound effects (no audio files needed).
 */
const SoundSystem = {
  _ctx: null,

  _get() {
    if (!this._ctx) {
      try { this._ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    return this._ctx;
  },

  _run(fn) {
    const ctx = this._get();
    if (!ctx) return;
    try { fn(ctx); } catch {}
  },

  // Rising tone: card drawn from deck
  drawCard() {
    this._run(ctx => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    });
  },

  // Short click pop
  click() {
    this._run(ctx => {
      const buf    = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data   = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src    = ctx.createBufferSource();
      const gain   = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass'; filter.frequency.value = 1800;
      src.buffer = buf;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      src.start(ctx.currentTime);
    });
  },

  // Upward sweep: drag start
  dragStart() {
    this._run(ctx => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.13);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    });
  },

  // Downward thud: card dropped
  drop() {
    this._run(ctx => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(130, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    });
  },

  // Soft slide: card moved/rallied
  move() {
    this._run(ctx => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(260, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.10, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.16);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.16);
    });
  },

  // Low punch + noise burst: attack
  attack() {
    this._run(ctx => {
      // Low punch
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(55, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
      // Noise burst
      const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src   = ctx.createBufferSource();
      const ngain = ctx.createGain();
      src.buffer = buf;
      src.connect(ngain); ngain.connect(ctx.destination);
      ngain.gain.setValueAtTime(0.18, ctx.currentTime);
      src.start(ctx.currentTime);
    });
  },

  // Rising arpeggio: victory
  victory() {
    this._run(ctx => {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.13;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
        gain.gain.linearRampToValueAtTime(0, t + 0.28);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    });
  },

  // Descending tones: defeat
  defeat() {
    this._run(ctx => {
      const notes = [392, 311, 247, 196];
      notes.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        const t = ctx.currentTime + i * 0.18;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
        gain.gain.linearRampToValueAtTime(0, t + 0.32);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    });
  },
};

export default SoundSystem;
