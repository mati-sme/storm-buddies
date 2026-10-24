/* Storm Buddies - core: stats, economy, sky world (no DOM). */
(function (root) {
'use strict';
const D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.SBData;
const { W, CHUNK, HP_GROWTH, VAL_GROWTH } = D;

const T = { EMPTY: 0, CLOUD: 1, SCRAP: 2, DENSE: 3, FLASK: 4, CHEST: 5, STORM: 6, ICE: 7, WALL: 9 };
const passable = (t) => t === T.EMPTY || t === T.ICE;

function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + fmt(-n);
  if (n < 1000) return String(Math.floor(n));
  if (n < 1e5) return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + u[i];
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hp0 = (s) => (s === 0 ? 0.92 : Math.pow(HP_GROWTH, s));
const val0 = (tier) => D.COIN * Math.pow(VAL_GROWTH, tier);
const stratumOf = (y) => Math.max(0, Math.floor(y / CHUNK));

const SAVE_V = 1;
function newTally() { return { ore: {}, chests: 0, kills: 0, buys: 0, finds: 0 }; }
function newSave() {
  return { v: SAVE_V, coins: 0, up: {}, relics: 0, pr: {}, bestDepth: 0, bestEver: 0, runs: 0, caveIns: 0,
    coinsShaft: 0, coinsTotal: 0, relicsTotal: 0, muted: false, musicOff: false, autoBuy: false, playTime: 0, seed: 1, seenIntro: false,
    tutDone: false, goal: 0, tally: newTally() };
}
function fixSave(s) {
  const n = newSave();
  if (!s || typeof s !== 'object') return n;
  if (s.v === undefined && s.runs === undefined) return n;
  for (const k in n) if (s[k] === undefined) s[k] = n[k];
  if (!s.tally || typeof s.tally !== 'object') s.tally = newTally();
  for (const k in newTally()) if (s.tally[k] === undefined) s.tally[k] = newTally()[k];
  return s;
}
const lvl = (save, id) => save.up[id] || 0;
const plvl = (save, id) => save.pr[id] || 0;
const UP = {}; D.UPGRADES.forEach((u) => { UP[u.id] = u; });
const PR = {}; D.PRESTIGE.forEach((u) => { PR[u.id] = u; });
const cost = (u, l) => Math.ceil(u.cost * Math.pow(u.g, l));

function helperUnlocked(save, hid) {
  const h = D.HELPERS.find((x) => x.id === hid);
  if (!h) return false;
  if (!h.unlock) return true;
  return plvl(save, h.unlock) > 0;
}
function unlockedHelpers(save) {
  return D.HELPERS.filter((h) => helperUnlocked(save, h.id));
}

function upState(save, id) {
  const u = UP[id], l = lvl(save, id);
  if (u.helper && !helperUnlocked(save, u.helper)) return 'locked';
  if (u.parent && lvl(save, u.parent) < 1) return 'locked';
  if (l >= u.max) return 'maxed';
  return save.coins >= cost(u, l) ? 'affordable' : 'available';
}
function buyUp(save, id) {
  const u = UP[id];
  if (upState(save, id) !== 'affordable') return false;
  save.coins -= cost(u, lvl(save, id));
  save.up[id] = lvl(save, id) + 1;
  return true;
}
function prState(save, id) {
  const u = PR[id], l = plvl(save, id);
  if (u.parent && plvl(save, u.parent) < 1) return 'locked';
  if (l >= u.max) return 'maxed';
  return save.relics >= cost(u, l) ? 'affordable' : 'available';
}
function buyPr(save, id) {
  const u = PR[id];
  if (prState(save, id) !== 'affordable') return false;
  save.relics -= cost(u, plvl(save, id));
  save.pr[id] = plvl(save, id) + 1;
  return true;
}
function autoBuy(save) {
  let n = 0;
  for (;;) {
    let best = null, bc = Infinity;
    for (const u of D.UPGRADES) {
      if (upState(save, u.id) !== 'affordable') continue;
      const c = cost(u, lvl(save, u.id));
      if (c < bc) { bc = c; best = u.id; }
    }
    if (!best) return n;
    buyUp(save, best); n++;
  }
}
function tierOf(save, prefix) { let t = 0; for (let i = 1; i <= 8; i++) if (lvl(save, prefix + i)) t = i; return t; }

function stats(save) {
  const L = (id) => lvl(save, id), P = (id) => plvl(save, id);
  const core = P('p_core');
  const balTier = tierOf(save, 'bal');
  const pack = P('p_team') > 0;
  const s = { balTier, armor: L('armor'), pack };
  s.power = Math.pow(4, balTier) * Math.pow(1.2, L('stitch')) * Math.pow(1.3, P('p_power')) * (1 + 0.1 * L('helmet')) * Math.pow(2, core);
  s.swing = 2.6 * Math.pow(1.08, L('quick')) * Math.pow(1.07, L('gloves'));
  s.crit = 0.03 * L('crit') + 0.05 * L('bluck');
  s.quake = 0.05 * L('quake');
  s.weapon = s.power * 0.8;
  s.attack = 1.3 * Math.pow(1.07, L('gloves'));
  s.bounty = 1 + 0.3 * L('fzap');
  s.oilMax = 15 + 3 * L('tank') + 4 * L('reserve') + 3 * P('p_wind') + 5 * core;
  s.burn = Math.pow(0.96, L('econ')) * Math.pow(0.95, P('p_time'));
  s.light = (2.6 + 0.5 * L('sight')) * (1 + 0.03 * L('helmet'));
  s.flask = 2 + 0.5 * L('gustfind');
  s.flaskChance = 0.012 * (1 + 0.25 * L('gustfind'));
  s.flare = L('gust') > 0; s.flareCd = 25 * Math.pow(0.85, L('gustpow')); s.flareDmg = L('gustpow') * 2;
  s.move = Math.min(16, 3.5 * Math.pow(1.08, L('boots')) * Math.pow(1.06, P('p_speed')));
  s.dmgTaken = Math.pow(0.78, L('armor'));
  s.gasMult = 1 - 0.3 * L('mask');
  s.heat = L('heat');
  s.capacity = Math.floor(10 * Math.pow(1.28, L('bag'))) + 4 * L('kbag') + 5 * L('fpack');
  const bond = Math.pow(1.35, P('p_bond')) * Math.pow(1.08, L('bcheer'));
  s.buddyRate = 0.7 * Math.pow(1.12, L('kdig')) * bond;
  s.buddyRatio = 0.35 + 0.12 * L('kpow');
  s.sniff = L('ksniff');
  s.gemhunt = L('khunt') > 0;
  s.bfight = 0.35 * L('kfight') * bond;
  s.dyn = L('kbolt') > 0; s.dynCd = 30 * Math.pow(0.85, L('kboltpow')); s.dynR = 1 + Math.floor((L('kboltpow') + 1) / 3); s.dynMult = 3 * (1 + 0.25 * L('kboltpow'));
  s.btunnel = L('ktunnel') > 0;
  /* owl */
  s.owl = helperUnlocked(save, 'owl');
  s.owlRate = 0.65 * Math.pow(1.14, L('odig')) * Math.pow(1.1, L('oglide')) * bond;
  s.owlSight = L('osight');
  s.owlSwoop = L('oswoop') > 0; s.owlSwoopCd = 10 * Math.pow(0.85, L('ostorm')); s.owlSwoopR = 1 + Math.floor(L('ostorm') / 2);
  s.owlLoot = 1 + 0.15 * L('oloot');
  /* fox */
  s.fox = helperUnlocked(save, 'fox');
  s.foxRate = 0.7 * Math.pow(1.14, L('fdig')) * bond;
  s.foxZap = 0.4 * L('fzap');
  s.foxSpark = L('fspark');
  s.foxChain = L('fchain') > 0; s.foxChainPow = 1 + 0.3 * L('fstorm');
  /* bunny */
  s.bunny = helperUnlocked(save, 'bunny');
  s.bunnyRate = 0.75 * Math.pow(1.15, L('bdig')) * bond;
  s.bunnyThump = L('bboom') > 0; s.bunnyThumpCd = 12 * Math.pow(0.88, L('bstorm')); s.bunnyThumpR = 1 + Math.floor(L('bstorm') / 2);
  s.bunnyCheer = L('bcheer');
  s.valueMult = Math.pow(1.12, L('appraise')) * (1 + 0.15 * P('p_value')) * (1 + 0.08 * L('merchant')) * s.owlLoot;
  s.depthMult = 1 + 0.5 * L('heightpay');
  s.oreChance = 0.11 * (1 + 0.08 * L('veins'));
  s.chestChance = 0.003 * (1 + 0.6 * L('chests')) * Math.pow(1.5, P('p_luck')) * (1 + 0.2 * L('bstorm'));
  s.gemBoost = (1 + 0.25 * L('gems')) * Math.pow(1.5, P('p_luck'));
  s.relicMult = 1 + 0.2 * P('p_relic');
  s.elevator = 0.2 * P('p_elev');
  s.helpers = unlockedHelpers(save).map((h) => h.id);
  return s;
}

function relicsFor(save) {
  if (save.bestDepth < D.CEILING) return 0;
  return Math.floor(Math.pow((save.bestDepth - D.CEILING + 2 * D.CHUNK) / D.CHUNK, 3) * stats(save).relicMult);
}
function caveIn(save) {
  const gain = relicsFor(save);
  if (gain < 1) return 0;
  save.relics += gain; save.relicsTotal += gain; save.caveIns++;
  const keep = plvl(save, 'p_keep'), old = save.up;
  save.up = {};
  if (keep >= 1) for (let i = 1; i <= 8; i++) if (old['bal' + i]) { save.up['bal' + i] = 1; save.up.stitch = Math.max(save.up.stitch || 0, 1); }
  if (keep >= 2) { if (old.tank) save.up.tank = old.tank; if (old.boots) save.up.boots = Math.max(1, old.boots); }
  if (keep >= 3) { if (old.armor) { save.up.armor = old.armor; save.up.boots = Math.max(1, save.up.boots || 0); } }
  /* keep helper-branch progress if that helper is still unlocked */
  for (const u of D.UPGRADES) {
    if (u.helper && helperUnlocked(save, u.helper) && old[u.id]) save.up[u.id] = old[u.id];
  }
  const ps = plvl(save, 'p_start');
  save.coins = ps ? D.COIN * Math.pow(10, ps + 1) : 0;
  save.bestDepth = 0; save.coinsShaft = 0;
  return gain;
}

const BUDDY_LINES = {
  start: ['Up we go!', 'Sky time!', 'Hold on!', 'I smell scrap!', 'Wheee!'],
  ore: ['Fluffy!', 'Scrap!', 'Got it!', 'Yoink!', 'Soft!'],
  gem: ['A BOLT!!', 'Sparkly!!', 'Lightning!!', 'Wow wow!'],
  chest: ['A sky crate!', 'Treasure!'],
  hurt: ['You okay?!', 'Ouch!', 'Watch the storm!'],
  creature: ['Wisp!', 'Something sparkly-mean!', 'Eek!'],
  kill: ['Paw!', 'Zapped!', 'Cleared!'],
  lowoil: ['Wind is fading...', 'Hurry!', 'Almost out of lift!'],
  record: ['Highest ever!', 'New record!', 'We\'ve never been here!'],
  stratum: ['New sky!', 'Look how high!', 'Different clouds!'],
  bagfull: ['Basket is full!', 'Can\'t carry more!'],
  flask: ['Gust!', 'More lift!'],
  boom: ['BOOM!', 'Whoa!', 'Storm pocket!'],
  sniffs: ['I smell scrap!', '*sniff* Nearby!', 'Wait!'],
  find: ['Look what I found!', 'For you!', 'Treasure!'],
  idle: ['I\'ll check over here!', 'Exploring!', 'Float float...', 'Hmm...', 'I love clouds.', 'What\'s up there?', '*sniff*', 'Best day!']
};

class World {
  constructor(save, seed, width, opts) {
    opts = opts || {};
    this.W = Math.max(D.W, Math.min(40, Math.floor(width || D.W)));
    this.tut = !!opts.tutorial;
    this.oilHold = this.tut;
    this.blocksP = 0; this.chestsN = 0; this.pipFound = 0;
    this.pipFindT = opts.noFind ? Infinity : (this.tut ? 9 : 3.5 + ((seed >>> 3) % 100) / 40);
    this.findTile = null;
    this.save = save;
    this.st = stats(save);
    this.seed = seed >>> 0;
    this.rows = new Map(); this.chunks = new Set();
    this.creatures = [];
    this.ev = [];
    this.time = 0;
    this.oil = this.st.oilMax;
    this.bagN = 0; this.bagV = 0; this.bounty = 0; this.chestV = 0; this.oreTiers = {};
    this.kills = 0; this.blocks = 0;
    this.ended = false;
    this.lowWarned = false; this.recordSaid = save.bestDepth <= 0;
    this.lastStratum = 0;
    this.flareT = 0; this.flareCd = 0; this.dynCd = 0;
    this.owlCd = 0; this.bunnyCd = 0; this.foxSparkT = 0;
    this.sayCd = 2;
    let sy = -1;
    if (this.st.elevator > 0) sy = Math.floor(save.bestDepth * this.st.elevator) - 1;
    const cx = Math.floor(this.W / 2);
    this.startY = sy;
    this.player = this.mkActor(cx, sy);
    /* helpers: kitten always; pack mode = all unlocked; else primary = kitten + unlocked act as extras if pack */
    this.buddies = [];
    const helpers = this.st.helpers.slice();
    if (!this.st.pack) {
      /* only one "active wanderer" besides kitten? Spec: prestige unlocks NEW helpers that work. Use all unlocked. */
    }
    helpers.forEach((hid, i) => {
      const b = this.mkActor(cx - 1 + (i % 3) - 1, sy);
      b.helper = hid;
      b.drillCd = 8; b.gemCd = 1; b.idleT = 0; b.restT = 0.5 + i * 0.3;
      this.buddies.push(b);
    });
    this.buddy = this.buddies[0]; // primary for speech / command
    if (sy >= 0) { this.setT(cx, sy, T.EMPTY); this.setT(cx - 1, sy, T.EMPTY); }
    this.depthMax = Math.max(0, sy + 1);
    this.lastStratum = stratumOf(Math.max(0, sy));
    if (this.tut) this.placeTutorial(cx);
    this.say(this.pick('start'));
  }
  placeTutorial(cx) {
    this.ensure(0);
    const put = (x, y, t, tier) => {
      if (x < 0 || x >= this.W) return;
      const r = this.row(y); r.t[x] = t; r.ore[x] = t === T.SCRAP ? tier : -1;
      const h = (t === T.CHEST ? 1.6 : t === T.SCRAP ? 1.2 : 0.92) * hp0(0);
      r.hp[x] = r.max[x] = h;
    };
    for (let y = 0; y < 14; y++) for (let x = cx - 2; x <= cx + 2; x++) {
      const t = this.tile(x, y);
      if (t === T.DENSE || t === T.CHEST || t === T.FLASK || passable(t)) put(x, y, T.CLOUD);
    }
    this.creatures = this.creatures.filter((c) => c.y > 16);
    for (const [x, y] of [[cx + 1, 2], [cx + 2, 2], [cx + 1, 3], [cx + 2, 3]]) put(x, y, T.SCRAP, 0);
    put(cx - 1, 6, T.CHEST);
    put(cx, 9, T.FLASK);
    this.tutSpots = { ore: { x: cx + 1, y: 2 }, chest: { x: cx - 1, y: 6 } };
  }
  mkActor(x, y) { return { x, y, px: x, py: y, face: 1, moveCd: 0, swingCd: 0, atkCd: 0, goal: null, goalT: 0, dig: null, digT: 0, hurtT: 0 }; }
  pick(k) { const a = BUDDY_LINES[k]; return a[Math.floor(Math.random() * a.length)]; }
  say(text, force) { if (force || this.sayCd <= 0) { this.ev.push({ type: 'say', text }); this.sayCd = 2.5; } }

  ensure(y) { const c = stratumOf(y); if (!this.chunks.has(c)) this.gen(c); }
  row(y) { this.ensure(y); return this.rows.get(y); }
  tile(x, y) {
    if (x < 0 || x >= this.W) return T.WALL;
    if (y < 0) return y < -1 ? T.WALL : T.EMPTY;
    return this.row(y).t[x];
  }
  setT(x, y, t) { const r = this.row(y); r.t[x] = t; }

  gen(c) {
    this.chunks.add(c);
    const st = this.st, rng = mulberry32((this.seed * 2654435761) ^ (c * 40503 + 17));
    const y0 = c * CHUNK, s = c;
    for (let y = y0; y < y0 + CHUNK; y++) {
      const r = { t: new Uint8Array(this.W), hp: new Float32Array(this.W), max: new Float32Array(this.W), ore: new Int8Array(this.W).fill(-1), seen: new Uint8Array(this.W) };
      const base = hp0(s) * (1 + 0.012 * (y - y0));
      for (let x = 0; x < this.W; x++) {
        let t = T.CLOUD, h = base;
        const q = rng();
        let acc = st.oreChance;
        if (q < acc) {
          t = T.SCRAP; h = base * 1.4;
          const g = rng(), p2 = 0.04 * st.gemBoost, p1 = 0.22 * Math.sqrt(st.gemBoost);
          r.ore[x] = s + (g < p2 ? 2 : g < p2 + p1 ? 1 : 0);
        } else if (q < (acc += st.flaskChance)) { t = T.FLASK; }
        else if (q < (acc += st.chestChance) && y > 3) { t = T.CHEST; h = base * 2; }
        else if (s >= 1 && q < (acc += 0.022)) { t = T.STORM; h = base * 0.6; }
        else if (q < (acc += 0.07) && y > 2) { t = T.DENSE; h = base * 5; }
        else if (s >= 2 && q < (acc += 0.04)) { t = T.ICE; h = base * 0.3; }
        r.t[x] = t; r.hp[x] = h; r.max[x] = h;
      }
      if (st.btunnel && y % 10 === 9) {
        for (let x = 0; x < this.W; x++) if (r.t[x] === T.CLOUD || r.t[x] === T.DENSE) {
          r.t[x] = T.SCRAP; r.ore[x] = s + (rng() < 0.2 ? 1 : 0); r.hp[x] = r.max[x] = base * 0.5;
        }
      }
      this.rows.set(y, r);
    }
    const n = Math.round((s === 0 ? 2 : 2 + (rng() < 0.6 ? 1 : 0)) * this.W / D.W);
    for (let i = 0; i < n; i++) {
      const cy = y0 + (s === 0 ? 7 : 2) + Math.floor(rng() * (CHUNK - (s === 0 ? 9 : 4)));
      const cx = Math.floor(rng() * this.W), rx = 1 + Math.floor(rng() * 2), ry = rng() < 0.5 ? 0 : 1;
      for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
        if (x < 0 || x >= this.W || y < y0 || y >= y0 + CHUNK) continue;
        const rr = this.rows.get(y); rr.t[x] = T.EMPTY; rr.ore[x] = -1;
      }
      if (rng() < (s === 0 ? 0.5 : 0.85)) {
        const hp = 3 * Math.pow(6, s);
        this.creatures.push({
          x: cx, y: cy, px: cx, py: cy, hp, max: hp, s,
          type: { name: 'Storm Wisp', sprite: 'wisp', speed: 0.5, fly: true, tint: ['#a080ff', '#7ec8e8', '#ffe066', '#ff80d0'][s % 4] },
          moveCd: rng(), atkCd: 1, awake: false, stun: 0, hitT: 0, dead: false, face: 1
        });
      }
    }
  }

  hitBlock(x, y, dmg, who) {
    const t = this.tile(x, y);
    if (passable(t) || t === T.WALL) return false;
    const r = this.row(y);
    r.hp[x] -= dmg;
    this.ev.push({ type: 'chip', x, y, s: stratumOf(y), who });
    if (r.hp[x] <= 0) { this.breakBlock(x, y, who, dmg); return true; }
    return false;
  }
  breakBlock(x, y, who, dmg) {
    const r = this.row(y), t = r.t[x], s = stratumOf(y);
    const big = r.max[x] > dmg * 3.5 || t === T.DENSE;
    r.t[x] = T.EMPTY; r.hp[x] = 0;
    this.blocks++; if (who === 'p') this.blocksP++;
    this.ev.push({ type: 'break', x, y, s, big, t, who });
    if (t === T.SCRAP) {
      const tier = r.ore[x]; r.ore[x] = -1;
      if (this.bagN < this.st.capacity) {
        this.bagN++; this.bagV += val0(tier); this.oreTiers[tier] = (this.oreTiers[tier] || 0) + 1;
        this.ev.push({ type: 'ore', x, y, tier, gem: tier >= s + 2 });
        if (tier >= s + 2) this.say(this.pick('gem'), true); else if (Math.random() < 0.25) this.say(this.pick('ore'));
      } else { this.ev.push({ type: 'bagfull', x, y }); this.say(this.pick('bagfull')); }
    } else if (t === T.FLASK) {
      this.oil = Math.min(this.st.oilMax, this.oil + this.st.flask); this.ev.push({ type: 'flask', x, y, amt: this.st.flask }); this.say(this.pick('flask'));
    } else if (t === T.CHEST) {
      const f = this.findTile && this.findTile.x === x && this.findTile.y === y;
      const v = val0(s) * (f ? 8 : 12) * this.st.gemBoost; this.chestV += v; this.chestsN++;
      if (f) { this.findTile = null; this.pipFound++; this.ev.push({ type: 'pipfind', x, y, v: v * this.st.valueMult }); this.say(this.pick('find'), true); }
      else { this.ev.push({ type: 'chest', x, y, v: v * this.st.valueMult }); this.say(this.pick('chest'), true); }
    } else if (t === T.STORM) {
      this.explode(x, y, 1, hp0(s) * 1.2, true);
    }
  }
  explode(x, y, R, dmg, gas) {
    this.ev.push({ type: 'boom', x, y, R, gas });
    if (gas) {
      const p = this.player;
      if (Math.abs(p.x - x) <= 2 && Math.abs(p.y - y) <= 2) this.hurt(2.5 * Math.pow(1.08, stratumOf(y)) * this.st.gasMult);
      this.say(this.pick('boom'), true);
    }
    for (let yy = y - R; yy <= y + R; yy++) for (let xx = x - R; xx <= x + R; xx++) {
      if ((xx - x) * (xx - x) + (yy - y) * (yy - y) > R * R + R) continue;
      if (yy < 0 || (xx === x && yy === y)) continue;
      const t = this.tile(xx, yy);
      if (t !== T.WALL && !passable(t)) this.hitBlock(xx, yy, dmg, 'boom');
    }
    for (const c of this.creatures) if (!c.dead && Math.abs(c.x - x) <= R && Math.abs(c.y - y) <= R) this.hitCreature(c, gas ? c.max * 0.5 : dmg);
  }
  hurt(sec) {
    const d = sec * this.st.dmgTaken;
    this.oil -= d; this.player.hurtT = 0.4;
    this.ev.push({ type: 'hurt', amt: d });
    this.say(this.pick('hurt'));
  }
  hitCreature(c, dmg) {
    if (c.dead) return;
    c.hp -= dmg; c.hitT = 0.15; c.awake = true;
    this.ev.push({ type: 'slash', x: c.x, y: c.y });
    if (c.hp <= 0) {
      c.dead = true; this.kills++;
      const v = 3 * val0(c.s) * this.st.bounty; this.bounty += v;
      this.ev.push({ type: 'kill', x: c.x, y: c.y, v: v * this.st.valueMult, s: c.s });
      if (this.st.fox && lvl(this.save, 'fstorm') > 0) this.oil = Math.min(this.st.oilMax, this.oil + 0.5);
      if (Math.random() < 0.5) this.say(this.pick('kill'));
    }
  }
  creatureAt(x, y) { for (const c of this.creatures) if (!c.dead && c.x === x && c.y === y) return c; return null; }

  tryDir(a, dx, dy, power, rate, speed, who) {
    const nx = a.x + dx, ny = a.y + dy;
    if (dx) a.face = dx;
    const t = this.tile(nx, ny);
    if (t === T.WALL) return false;
    if (!passable(t)) {
      a.dig = { x: nx, y: ny }; a.digT = 0.25;
      if (a.swingCd <= 0) {
        a.swingCd = 1 / rate;
        let d = power;
        if (who === 'p' && Math.random() < this.st.crit) { d *= 3; this.ev.push({ type: 'crit', x: nx, y: ny }); }
        this.ev.push({ type: 'swing', who });
        this.hitBlock(nx, ny, d, who);
        if (who === 'p' && this.st.quake > 0 && Math.random() < this.st.quake) {
          const bx = nx + dx, by = ny + dy, bt = this.tile(bx, by);
          if (bt !== T.WALL && !passable(bt) && by >= 0) this.hitBlock(bx, by, d, who);
        }
      }
      return true;
    }
    if (this.creatureAt(nx, ny)) return true;
    if (a.moveCd <= 0) {
      a.x = nx; a.y = ny;
      let slow = 1;
      if (t === T.ICE) slow = 1.5 - 0.2 * this.st.heat;
      a.moveCd = slow / speed;
      if (who === 'p') this.ev.push({ type: 'step', t });
    }
    return true;
  }
  bfsNext(a, gx, gy, maxR) {
    const targets = new Set();
    const key = (x, y) => (y + 2) * this.W + x;
    if (passable(this.tile(gx, gy))) targets.add(key(gx, gy));
    else for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) if (passable(this.tile(gx + dx, gy + dy))) targets.add(key(gx + dx, gy + dy));
    if (!targets.size) return null;
    if (targets.has(key(a.x, a.y))) return { x: 0, y: 0 };
    const prev = new Map(); const q = [[a.x, a.y]]; prev.set(key(a.x, a.y), null);
    const ymin = Math.min(a.y, gy) - maxR, ymax = Math.max(a.y, gy) + maxR;
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (ny < ymin || ny > ymax || prev.has(k)) continue;
        if (!passable(this.tile(nx, ny))) continue;
        prev.set(k, [x, y]);
        if (targets.has(k)) {
          let cur = [nx, ny], p = prev.get(k);
          while (p && !(p[0] === a.x && p[1] === a.y)) { cur = p; p = prev.get(key(p[0], p[1])); }
          return { x: cur[0] - a.x, y: cur[1] - a.y };
        }
        q.push([nx, ny]);
      }
    }
    return null;
  }
  goTo(a, gx, gy, power, rate, speed, who) {
    const md = Math.abs(gx - a.x) + Math.abs(gy - a.y);
    if (md === 0) return 'here';
    if (md === 1) { this.tryDir(a, gx - a.x, gy - a.y, power, rate, speed, who); return 'adj'; }
    if (a.moveCd > 0 && a.swingCd > 0) return 'wait';
    const st = this.bfsNext(a, gx, gy, 6);
    if (st && (st.x || st.y)) { this.tryDir(a, st.x, st.y, power, rate, speed, who); return 'path'; }
    if (st) { this.tryDir(a, Math.sign(gx - a.x) || 0, Math.sign(gy - a.y), power, rate, speed, who); return 'adj'; }
    const dx = gx - a.x, dy = gy - a.y;
    if (Math.abs(dy) >= Math.abs(dx)) this.tryDir(a, 0, Math.sign(dy), power, rate, speed, who);
    else this.tryDir(a, Math.sign(dx), 0, power, rate, speed, who);
    return 'dig';
  }

  useDynamite() {
    if (!this.st.dyn || this.dynCd > 0 || this.ended) return false;
    this.dynCd = this.st.dynCd;
    const p = this.player;
    this.explode(p.x, p.y + 1, this.st.dynR, this.st.power * this.st.dynMult, false);
    this.say('Paw bolt!', true);
    return true;
  }
  useFlare() {
    if (!this.st.flare || this.flareCd > 0 || this.ended) return false;
    this.flareCd = this.st.flareCd; this.flareT = 4;
    const R = 2 + Math.floor(this.st.flareDmg / 2);
    this.explode(this.player.x, this.player.y + 1, R, this.st.power * (1 + this.st.flareDmg), false);
    for (const c of this.creatures) if (!c.dead && Math.abs(c.x - this.player.x) + Math.abs(c.y - this.player.y) <= 9) {
      c.stun = 3; if (this.st.flareDmg) this.hitCreature(c, this.st.weapon * this.st.flareDmg);
    }
    this.ev.push({ type: 'flare' });
    return true;
  }
  commandBuddy(x, y) {
    for (const b of this.buddies) { b.goal = { x, y, kind: 'cmd' }; b.goalT = 12; }
    this.say('On it!', true);
  }
  nearSeen(x, y, r) {
    for (let yy = Math.max(0, y - r); yy <= y + r; yy++) {
      if (!this.rows.has(yy)) continue;
      const row = this.rows.get(yy);
      for (let xx = Math.max(0, x - r); xx <= Math.min(this.W - 1, x + r); xx++) if (row.seen[xx] && Math.abs(xx - x) + Math.abs(yy - y) <= r) return true;
    }
    return y < 0;
  }
  lightR() { return this.st.light + (this.flareT > 0 ? 4 : 0); }
  buddyLeash() { return Math.max(6, this.lightR() + 4); }

  helperPower(b) {
    const st = this.st, hid = b.helper;
    if (hid === 'owl') return { power: st.power * 0.4, rate: st.owlRate, speed: st.move * 0.85 };
    if (hid === 'fox') return { power: st.power * 0.45, rate: st.foxRate, speed: st.move * 0.9 };
    if (hid === 'bunny') return { power: st.power * 0.4, rate: st.bunnyRate, speed: st.move };
    return { power: st.power * st.buddyRatio, rate: st.buddyRate, speed: st.move * 0.8 };
  }

  buddyStep(dt, b) {
    const st = this.st, p = this.player;
    const hp = this.helperPower(b);
    b.moveCd = Math.max(0, b.moveCd - dt);
    b.swingCd = Math.max(0, b.swingCd - dt);
    b.atkCd = Math.max(0, b.atkCd - dt);
    b.digT = Math.max(0, b.digT - dt); if (b.digT <= 0) b.dig = null;
    b.goalT = Math.max(0, b.goalT - dt); if (b.goalT <= 0) b.goal = null;
    b.restT = Math.max(0, b.restT - dt);
    b.idleT += dt;

    const leash = this.buddyLeash();
    const dist = Math.abs(b.x - p.x) + Math.abs(b.y - p.y);
    if (dist > leash + 8) {
      b.x = p.x; b.y = p.y; b.px = p.x; b.py = p.y; b.goal = null;
      this.ev.push({ type: 'warp', who: b.helper });
      return;
    }

    /* combat */
    if (st.bfight > 0 || (b.helper === 'fox' && st.foxZap > 0)) {
      for (const c of this.creatures) {
        if (c.dead || Math.abs(c.x - b.x) + Math.abs(c.y - b.y) > 1) continue;
        if (b.atkCd <= 0) {
          b.atkCd = 1 / Math.max(0.5, st.attack * 0.7);
          const dmg = b.helper === 'fox' ? st.weapon * st.foxZap : st.weapon * st.bfight;
          this.hitCreature(c, dmg);
        }
      }
    }

    /* owl swoop */
    if (b.helper === 'owl' && st.owlSwoop) {
      this.owlCd -= dt;
      if (this.owlCd <= 0) {
        this.owlCd = st.owlSwoopCd;
        const R = st.owlSwoopR;
        for (let yy = b.y; yy <= b.y + R + 2; yy++) this.hitBlock(b.x, yy, hp.power * 2, 'owl');
        this.ev.push({ type: 'swoop', x: b.x, y: b.y });
      }
    }
    /* bunny thumper */
    if (b.helper === 'bunny' && st.bunnyThump) {
      this.bunnyCd -= dt;
      if (this.bunnyCd <= 0) {
        this.bunnyCd = st.bunnyThumpCd;
        this.explode(b.x, b.y, st.bunnyThumpR, hp.power * 2, false);
      }
    }
    /* fox spark trail */
    if (b.helper === 'fox' && st.foxSpark > 0 && (b.x !== b.px || b.y !== b.py)) {
      if (Math.random() < 0.08 * st.foxSpark && this.bagN < st.capacity) {
        this.bagN++; this.bagV += val0(0) * 0.3; this.oreTiers[0] = (this.oreTiers[0] || 0) + 1;
        this.ev.push({ type: 'ore', x: b.x, y: b.y, tier: 0, gem: false });
      }
    }

    if (b.goal) {
      this.goTo(b, b.goal.x, b.goal.y, hp.power, hp.rate, hp.speed, b.helper);
      return;
    }

    /* sniff scrap */
    const sniffR = (b.helper === 'kitten' ? st.sniff : b.helper === 'owl' ? st.owlSight : 0) + (st.gemhunt && b.helper === 'kitten' ? 4 : 0);
    if (sniffR > 0 && b.gemCd <= 0) {
      b.gemCd = 1.2;
      let best = null, bd = 99;
      for (let yy = Math.max(0, b.y - sniffR); yy <= b.y + sniffR; yy++) {
        if (!this.rows.has(yy)) continue;
        const row = this.rows.get(yy);
        for (let xx = Math.max(0, b.x - sniffR); xx <= Math.min(this.W - 1, b.x + sniffR); xx++) {
          if (row.t[xx] !== T.SCRAP && row.t[xx] !== T.CHEST) continue;
          const d = Math.abs(xx - b.x) + Math.abs(yy - b.y);
          if (d < bd) { bd = d; best = { x: xx, y: yy }; }
        }
      }
      if (best && (st.gemhunt || bd <= sniffR)) {
        b.goal = { x: best.x, y: best.y, kind: 'sniff' }; b.goalT = 8;
        if (Math.random() < 0.3) this.say(this.pick('sniffs'));
        return;
      }
    } else b.gemCd = Math.max(0, (b.gemCd || 0) - dt);

    if (b.restT > 0) return;

    /* wander: prefer UP (ascent), random side pops */
    const dirs = [[0, 1], [0, 1], [-1, 0], [1, 0], [0, -1]];
    if (dist > leash) {
      this.goTo(b, p.x, p.y, hp.power, hp.rate, hp.speed, b.helper);
      return;
    }
    if (b.idleT > 1.5 + Math.random()) {
      b.idleT = 0;
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      this.tryDir(b, d[0], d[1], hp.power, hp.rate, hp.speed, b.helper);
      if (Math.random() < 0.08) this.say(this.pick('idle'));
      b.restT = 0.2 + Math.random() * 0.6;
    } else {
      /* keep popping nearby cloud */
      for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
        const t = this.tile(b.x + dx, b.y + dy);
        if (!passable(t) && t !== T.WALL) { this.tryDir(b, dx, dy, hp.power, hp.rate, hp.speed, b.helper); break; }
      }
    }
  }

  markSeen() {
    const p = this.player, R = Math.ceil(this.lightR()) + 1;
    for (let yy = Math.max(0, p.y - R); yy <= p.y + R; yy++) {
      this.ensure(yy);
      const row = this.rows.get(yy);
      for (let xx = Math.max(0, p.x - R); xx <= Math.min(this.W - 1, p.x + R); xx++) {
        if (Math.hypot(xx - p.x, yy - p.y) <= this.lightR() + 0.5) row.seen[xx] = 1;
      }
    }
  }

  tick(dt, input) {
    if (this.ended) return;
    this.time += dt;
    this.sayCd = Math.max(0, this.sayCd - dt);
    this.flareT = Math.max(0, this.flareT - dt);
    this.flareCd = Math.max(0, this.flareCd - dt);
    this.dynCd = Math.max(0, this.dynCd - dt);

    const p = this.player, st = this.st;
    p.moveCd = Math.max(0, p.moveCd - dt);
    p.swingCd = Math.max(0, p.swingCd - dt);
    p.atkCd = Math.max(0, p.atkCd - dt);
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.digT = Math.max(0, p.digT - dt); if (p.digT <= 0) p.dig = null;
    p.goalT = Math.max(0, p.goalT - dt); if (p.goalT <= 0) p.goal = null;

    /* interpolate */
    for (const a of [p, ...this.buddies]) {
      a.px += (a.x - a.px) * Math.min(1, dt * 14);
      a.py += (a.y - a.py) * Math.min(1, dt * 14);
    }
    for (const c of this.creatures) {
      c.px += (c.x - c.px) * Math.min(1, dt * 10);
      c.py += (c.y - c.py) * Math.min(1, dt * 10);
      c.hitT = Math.max(0, c.hitT - dt);
      c.stun = Math.max(0, c.stun - dt);
    }

    if (!this.oilHold) this.oil -= dt * st.burn;
    if (this.oilHold && this.blocksP >= 3) this.oilHold = false;

    if (input) {
      if (p.goal) this.goTo(p, p.goal.x, p.goal.y, st.power, st.swing, st.move, 'p');
      else this.tryDir(p, input.x, input.y, st.power, st.swing, st.move, 'p');
    } else if (p.goal) this.goTo(p, p.goal.x, p.goal.y, st.power, st.swing, st.move, 'p');

    /* auto attack wisps */
    for (const c of this.creatures) {
      if (c.dead || Math.abs(c.x - p.x) + Math.abs(c.y - p.y) > 1) continue;
      if (p.atkCd <= 0) { p.atkCd = 1 / st.attack; this.hitCreature(c, st.weapon); }
    }

    this.depthMax = Math.max(this.depthMax, Math.max(0, p.y + 1));
    const sNow = stratumOf(Math.max(0, p.y));
    if (sNow > this.lastStratum) { this.lastStratum = sNow; this.say(this.pick('stratum'), true); this.ev.push({ type: 'stratum', s: sNow }); }
    if (!this.recordSaid && this.depthMax > this.save.bestDepth && this.save.bestDepth > 0) { this.recordSaid = true; this.say(this.pick('record'), true); this.ev.push({ type: 'record' }); }

    if (this.oil < 5 && !this.lowWarned) { this.lowWarned = true; this.say(this.pick('lowoil'), true); this.ev.push({ type: 'low' }); }

    /* ice slow drain */
    if (this.tile(p.x, p.y) === T.ICE && !this.oilHold) this.oil -= dt * 0.4 * (1 - 0.25 * st.heat);

    this.markSeen();
    for (const b of this.buddies) this.buddyStep(dt, b);

    /* pip find treasure */
    this.pipFindT -= dt;
    if (this.pipFindT <= 0 && !this.findTile) {
      this.pipFindT = 25 + Math.random() * 20;
      const yy = p.y + 4 + Math.floor(Math.random() * 8);
      const xx = Math.max(0, Math.min(this.W - 1, p.x + (Math.random() < 0.5 ? -2 : 2)));
      this.ensure(yy);
      const r = this.row(yy);
      r.t[xx] = T.CHEST; r.hp[xx] = r.max[xx] = hp0(stratumOf(yy)) * 1.5;
      this.findTile = { x: xx, y: yy };
      this.say(this.pick('sniffs'), true);
      this.ev.push({ type: 'sniff', x: xx, y: yy });
    }

    /* creature AI */
    for (const c of this.creatures) {
      if (c.dead || c.stun > 0) continue;
      const d = Math.abs(c.x - p.x) + Math.abs(c.y - p.y);
      if (!c.awake && d <= this.lightR() + 1) { c.awake = true; if (Math.random() < 0.4) this.say(this.pick('creature')); }
      if (!c.awake) continue;
      c.moveCd -= dt; c.atkCd -= dt;
      if (d <= 1 && c.atkCd <= 0) {
        c.atkCd = c.type.speed;
        this.hurt(1.2 * Math.pow(1.1, c.s));
      } else if (c.moveCd <= 0 && d > 1) {
        c.moveCd = c.type.speed;
        const dx = Math.sign(p.x - c.x), dy = Math.sign(p.y - c.y);
        const nx = c.x + (Math.random() < 0.7 ? dx : 0);
        const ny = c.y + (Math.random() < 0.7 ? dy : (Math.random() < 0.5 ? 1 : -1));
        if (passable(this.tile(nx, ny)) && !this.creatureAt(nx, ny) && !(nx === p.x && ny === p.y)) {
          if (nx !== c.x) c.face = Math.sign(nx - c.x) || c.face;
          c.x = nx; c.y = ny;
        }
      }
    }

    if (this.oil <= 0) { this.oil = 0; this.ended = true; this.endReason = 'oil'; this.ev.push({ type: 'end', reason: 'oil' }); }
  }

  result() {
    const st = this.st;
    const ore = Math.floor(this.bagV * st.valueMult);
    const depth = Math.floor(this.depthMax * D.COIN * 0.4 * st.depthMult * st.valueMult);
    const bounty = Math.floor(this.bounty * st.valueMult);
    const chests = Math.floor(this.chestV * st.valueMult);
    const total = ore + depth + bounty + chests;
    return {
      ore, oreN: this.bagN, depth, depthMax: this.depthMax, bounty, kills: this.kills,
      chests, chestsN: this.chestsN, total,
      record: this.depthMax > this.save.bestDepth,
      oreTiers: Object.assign({}, this.oreTiers)
    };
  }
}

function applyRun(save, res) {
  save.coins += res.total;
  save.coinsShaft += res.total;
  save.coinsTotal += res.total;
  save.runs++;
  if (res.depthMax > save.bestDepth) save.bestDepth = res.depthMax;
  if (res.depthMax > save.bestEver) save.bestEver = res.depthMax;
  const t = save.tally;
  for (const k in res.oreTiers) t.ore[k] = (t.ore[k] || 0) + res.oreTiers[k];
  t.chests += res.chestsN; t.kills += res.kills;
}

function goalProgress(save, world) {
  const g = D.GOALS[Math.min(save.goal, D.GOALS.length - 1)] || D.GOALS[D.GOALS.length - 1];
  let cur = 0, n = g.n || 1;
  if (g.kind === 'height') cur = Math.max(save.bestEver, world ? world.depthMax : 0);
  else if (g.kind === 'ore') cur = (save.tally.ore[g.tier] || 0) + (world && world.oreTiers[g.tier] || 0);
  else if (g.kind === 'buys') cur = save.tally.buys;
  else if (g.kind === 'chests') cur = save.tally.chests + (world ? world.chestsN : 0);
  else if (g.kind === 'kills') cur = save.tally.kills + (world ? world.kills : 0);
  else if (g.kind === 'up') cur = lvl(save, g.up) > 0 ? 1 : 0;
  else if (g.kind === 'caveins') cur = save.caveIns;
  else if (g.kind === 'helper') cur = helperUnlocked(save, g.helper) ? 1 : 0;
  return { g, cur: Math.min(cur, n), n };
}
function checkGoals(save, world) {
  const done = [];
  while (save.goal < D.GOALS.length) {
    const p = goalProgress(save, world);
    if (p.cur < p.n) break;
    const g = D.GOALS[save.goal];
    if (g.reward) { save.coins += g.reward; save.coinsTotal += g.reward; }
    done.push(g); save.goal++;
  }
  return done;
}

/* gradual map reveal */
function upVis(save, id) {
  const u = UP[id];
  if (u.helper && !helperUnlocked(save, u.helper)) return 'hide';
  if (!u.parent) return 'show';
  if (lvl(save, u.parent) > 0) return 'show';
  const p = UP[u.parent];
  if (!p.parent || lvl(save, p.parent) > 0 || upState(save, u.parent) !== 'locked') return 'tease';
  return 'hide';
}
function prVis(save, id) {
  const u = PR[id];
  if (!u.parent) return 'show';
  if (plvl(save, u.parent) > 0) return 'show';
  const p = PR[u.parent];
  if (!p.parent || plvl(save, p.parent) > 0 || prState(save, u.parent) !== 'locked') return 'tease';
  return 'hide';
}

const API = {
  T, passable, fmt, mulberry32, hp0, val0, stratumOf, SAVE_V, newSave, fixSave, newTally,
  lvl, plvl, UP, PR, cost, upState, buyUp, prState, buyPr, autoBuy, tierOf, stats,
  relicsFor, caveIn, World, applyRun, goalProgress, checkGoals, upVis, prVis,
  helperUnlocked, unlockedHelpers
};
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SBCore = API;
})(typeof self !== 'undefined' ? self : this);
