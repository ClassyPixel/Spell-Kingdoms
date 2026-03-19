const ART_BASE       = 'assets/images/CardGameArt/CardArt/';
const ART_THUMB_BASE = 'assets/images/CardGameArt/CardArt_thumb/';

const _loaded   = new Set();
const _inflight = new Map();
const _failed   = new Set();

function _loadOne(url) {
  if (_loaded.has(url)) return Promise.resolve();
  if (_inflight.has(url)) return _inflight.get(url);
  const p = new Promise(resolve => {
    const img = new Image();
    img.onload  = () => { _loaded.add(url);  _inflight.delete(url); resolve(); };
    img.onerror = () => { _failed.add(url);  _inflight.delete(url); resolve(); };
    img.src = url;
  });
  _inflight.set(url, p);
  return p;
}

function _collectArtFiles(state) {
  const pools = [
    state.playerHand,       state.opponentHand,
    state.playerEliteDeck,  state.opponentEliteDeck,
    state.playerSummonDeck, state.opponentSummonDeck,
    state.playerSpellDeck,
    state.playerChampions,  state.opponentChampions,
  ];
  const files = new Set();
  for (const pool of pools) {
    if (!pool) continue;
    for (const card of pool) {
      if (card?.artFile) files.add(card.artFile);
    }
  }
  return [...files];
}

const CardArtPreloader = {
  async preloadMatchThumbs(state) {
    const files = _collectArtFiles(state);
    const urls  = files.map(f => ART_THUMB_BASE + f.replace(/\.[^.]+$/, '.jpg'));
    await Promise.all(urls.map(_loadOne));
  },

  preloadMatchFullInBackground(state) {
    const files = _collectArtFiles(state);
    for (const f of files) _loadOne(ART_BASE + f);
  },
};

export default CardArtPreloader;
