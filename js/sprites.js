/* Storm Buddies - procedural pixel art (balloon, helpers, clouds). */
(function (root) {
'use strict';
const D = root.SBData;
const TS = 16;

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function fromRows(rows, pal) {
  const h = rows.length, w = rows[0].length, c = canvas(w, h), x = c.getContext('2d');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const ch = rows[j][i]; if (ch === '.' || !pal[ch]) continue;
    x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1);
  }
  return c;
}
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

const PILOT = [
  '....HHHH....',
  '...HHHHHHL..',
  '...hhhhhh...',
  '...SSSSSS...',
  '...SSESSE...',
  '...SSSSSS...',
  '....SrrS....',
  '..BBBBBBBB..',
  '.SBBbBBbBBS.',
  '.SBBBBBBBBS.',
  '...PPPPPP...',
  '...PP..PP...',
  '..KKK..KKK..'
];
const PILOT_PAL = { H: '#5a8ad0', h: '#3a6ab0', L: '#c0e0ff', S: '#ffd2a6', E: '#2a1a10', r: '#e0806a', B: '#e07040', b: '#b05028', P: '#6b4a2b', K: '#3a2a1e' };

const BALLOON = [
  '....RRRR....',
  '...RRRRRR...',
  '..RRWwRRRR..',
  '..RRwwRRRR..',
  '..RRRRRRRR..',
  '...RRRRRR...',
  '....RRRR....',
  '.....ss.....',
  '....s..s....',
  '...s....s...',
  '..BBBBBBBB..',
  '..B......B..',
  '...BBBBBB...'
];

const KITTEN = [
  '............',
  '..A......A..',
  '..AA.MM.AA..',
  '...MMMMMM...',
  '..MWEWMWEWM.',
  '..MEEWMEEWM.',
  '..MMMMNMMM..',
  '...MCCCCM...',
  '..MCCCCCCM..',
  '..MMCCCCMM..',
  '.PPMMMMMMPP.',
  '............'
];
const OWL = [
  '............',
  '...WW..WW...',
  '..W.MMMM.W..',
  '.WWMMMMMMWW.',
  '.MMYEEMYEEM.',
  '.MMEEEMEEEM.',
  '..MMMMMMMM..',
  '..MMCCCCMM..',
  '...MCCCCM...',
  '...MM..MM...',
  '...PP..PP...',
  '............'
];
const FOX = [
  '............',
  '.A........A.',
  '.AA.MMMM.AA.',
  '..MMMMMMMM..',
  '.MWEWMWEWMM.',
  '.MEEWMEEWMM.',
  '.MMMMNNMMMM.',
  '..MMCCCCMM..',
  '..MCCCCCCM..',
  '...MCCCCM...',
  '..PPMMMMPP..',
  '........AA..'
];
const BUNNY = [
  '............',
  '..A......A..',
  '..AA....AA..',
  '..A.MMMM.A..',
  '...MMMMMM...',
  '..MWEWMWEWM.',
  '..MEEWMEEWM.',
  '..MMMMNMMM..',
  '...MCCCCM...',
  '..MMCCCCMM..',
  '.PPMMMMMMPP.',
  '............'
];
const WISP = [
  '............',
  '.....MM.....',
  '....MMMM....',
  '...MWEWEM...',
  '...MEEEEE...',
  '..MMTTTTMM..',
  '..MMMMMMMM..',
  '...MMTTMM...',
  '....MMMM....',
  '.....MM.....',
  '............',
  '............'
];

const cache = {};
function pilot(armorTier) {
  const key = 'p:' + armorTier;
  if (cache[key]) return cache[key];
  const shirts = ['#e07040', '#9a6a3a', '#9aa0aa', '#c8ccd4', '#8ff0ff', '#3aa060', '#fff27a'];
  const pal = Object.assign({}, PILOT_PAL, { B: shirts[Math.min(armorTier, shirts.length - 1)], b: shade(shirts[Math.min(armorTier, shirts.length - 1)], -0.3) });
  return (cache[key] = fromRows(PILOT, pal));
}
function balloon(tier) {
  const key = 'bal:' + tier;
  if (cache[key]) return cache[key];
  const cols = ['#e07040', '#e0874c', '#e8f4fc', '#7a9cff', '#ffe066', '#7dffb0', '#fff27a', '#d0a0ff', '#ff80d0'];
  const c = cols[Math.min(tier, cols.length - 1)];
  return (cache[key] = fromRows(BALLOON, { R: c, r: shade(c, -0.25), W: '#ffffff', w: shade(c, 0.4), s: '#8a6a40', B: '#6b4a2b', b: '#4a3018' }));
}
function helper(hid) {
  const key = 'h:' + hid;
  if (cache[key]) return cache[key];
  const h = D.HELPERS.find((x) => x.id === hid) || D.HELPERS[0];
  const pal = { M: h.body, C: h.belly, W: '#ffffff', E: '#1a1010', N: h.accent, P: h.accent, A: shade(h.body, -0.25), Y: '#ffe066', T: '#ffffff' };
  const rows = hid === 'owl' ? OWL : hid === 'fox' ? FOX : hid === 'bunny' ? BUNNY : KITTEN;
  return (cache[key] = fromRows(rows, pal));
}
function wisp(type) {
  const key = 'w:' + (type.tint || 'x');
  if (cache[key]) return cache[key];
  const m = type.tint || '#a080ff';
  return (cache[key] = fromRows(WISP, { M: m, L: shade(m, 0.35), W: '#ffffff', E: '#1a1010', T: shade(m, 0.5) }));
}

function cloudTex(s, v, kind) {
  const key = 'c:' + s + ':' + v + ':' + kind;
  if (cache[key]) return cache[key];
  const P = D.layer(s), c = canvas(TS, TS), x = c.getContext('2d'), r = rng(s * 97 + v * 13 + (kind === 'dense' ? 5000 : 0));
  let base = kind === 'dense' ? shade(P.base, -0.2) : kind === 'storm' ? shade(P.base, -0.35) : kind === 'ice' ? shade(P.light, 0.1) : P.base;
  if (kind === 'scrap') base = shade(P.light, 0.15);
  x.fillStyle = base; x.fillRect(0, 0, TS, TS);
  for (let i = 0; i < 50; i++) {
    const q = r(); x.fillStyle = q < 0.4 ? shade(base, -0.12) : q < 0.8 ? shade(base, 0.1) : P.speck;
    x.fillRect(Math.floor(r() * TS), Math.floor(r() * TS), q < 0.85 ? 2 : 1, 1);
  }
  x.fillStyle = 'rgba(255,255,255,0.22)'; x.fillRect(0, 0, TS, 1); x.fillRect(0, 0, 1, TS);
  x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, TS - 1, TS, 1); x.fillRect(TS - 1, 0, 1, TS);
  if (kind === 'storm') {
    for (let i = 0; i < 5; i++) { x.fillStyle = i % 2 ? '#ffe066' : '#a080ff'; x.fillRect(2 + Math.floor(r() * 11), 2 + Math.floor(r() * 11), 2, 2); }
  }
  if (kind === 'ice') {
    x.fillStyle = 'rgba(200,240,255,0.35)'; x.fillRect(1, 1, TS - 2, TS - 2);
  }
  return (cache[key] = c);
}
function scrapTex(tier) {
  const key = 'sc:' + tier;
  if (cache[key]) return cache[key];
  const o = D.loot(tier), c = canvas(TS, TS), x = c.getContext('2d');
  x.fillStyle = shade(o.color, -0.3); x.fillRect(0, 0, TS, TS);
  x.fillStyle = o.color; x.fillRect(3, 3, 10, 10);
  x.fillStyle = o.hi; x.fillRect(5, 5, 4, 4); x.fillRect(4, 4, 2, 1);
  x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(0, 0, TS, 1);
  return (cache[key] = c);
}
function flaskTex() {
  if (cache.flask) return cache.flask;
  const c = canvas(TS, TS), x = c.getContext('2d');
  x.fillStyle = '#4a90e0'; x.fillRect(5, 2, 6, 2); x.fillRect(4, 4, 8, 10);
  x.fillStyle = '#a8d4ff'; x.fillRect(6, 5, 4, 6);
  x.fillStyle = '#ffe066'; x.fillRect(7, 7, 2, 3);
  return (cache.flask = c);
}
function chestTex() {
  if (cache.chest) return cache.chest;
  const c = canvas(TS, TS), x = c.getContext('2d');
  x.fillStyle = '#8a5a32'; x.fillRect(2, 5, 12, 9);
  x.fillStyle = '#c08a4c'; x.fillRect(2, 5, 12, 3);
  x.fillStyle = '#ffcc33'; x.fillRect(7, 7, 2, 3);
  x.fillStyle = '#5a3a18'; x.fillRect(2, 8, 12, 1);
  return (cache.chest = c);
}

root.SBSprites = { pilot, balloon, helper, wisp, cloudTex, scrapTex, flaskTex, chestTex, shade, fromRows, canvas };
})(self);
