/**
 * MusicPlayer — singleton BGM manager.
 * Only one track plays at a time; calling play() stops the previous one.
 */
const MusicPlayer = {
  _audio: null,

  play(src) {
    if (this._audio) {
      this._audio.pause();
      this._audio = null;
    }
    this._audio = new Audio(src);
    this._audio.loop   = true;
    this._audio.volume = 0.5;
    this._audio.play().catch(() => {});
  },

  stop() {
    if (this._audio) {
      this._audio.pause();
      this._audio.currentTime = 0;
      this._audio = null;
    }
  },
};

export default MusicPlayer;
