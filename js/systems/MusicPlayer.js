/**
 * MusicPlayer — singleton BGM manager.
 * Only one track plays at a time; calling play() stops the previous one.
 * If autoplay is blocked by the browser, retries on the first user gesture.
 */
const MusicPlayer = {
  _audio:    null,
  _pending:  null,  // src waiting for user gesture unlock

  play(src) {
    if (this._audio) {
      this._audio.pause();
      this._audio = null;
    }
    this._pending = null;
    this._audio = new Audio(src);
    this._audio.loop   = true;
    this._audio.volume = 0.5;
    this._audio.play().catch(() => {
      // Autoplay blocked — queue src and retry on first user interaction
      this._pending = src;
      const unlock = () => {
        if (this._pending === src) {
          this._pending = null;
          this.play(src);
        }
      };
      document.addEventListener('pointerdown', unlock, { once: true });
      document.addEventListener('keydown',     unlock, { once: true });
    });
  },

  stop() {
    this._pending = null;
    if (this._audio) {
      this._audio.pause();
      this._audio.currentTime = 0;
      this._audio = null;
    }
  },
};

export default MusicPlayer;
