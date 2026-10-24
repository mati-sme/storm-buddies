/* Storm Buddies - game data (sky layers, upgrades, prestige helpers, goals). */
(function (root) {
'use strict';

const W = 11;
const CHUNK = 25;
const HP_GROWTH = 7.5;
const VAL_GROWTH = 2.15;
const COIN = 10;
const CEILING = 100; // height to punch the storm ceiling (prestige)

const LAYERS = [
  { name: 'Dock Breeze',     base: '#7ec8e8', dark: '#4a9ec4', light: '#b8e4f8', speck: '#ffffff', bg: '#5ab0d8' },
  { name: 'Cotton Clouds',  base: '#c8dce8', dark: '#8a9eac', light: '#e8f4fc', speck: '#ffffff', bg: '#6a98b8' },
  { name: 'Wind Shear',     base: '#6a8ab0', dark: '#3a5a78', light: '#9ab8d0', speck: '#d0e8ff', bg: '#3a5878' },
  { name: 'Storm Shelf',    base: '#4a5a88', dark: '#2a3458', light: '#7a8ab8', speck: '#a8c0ff', bg: '#1e2848' },
  { name: 'Thunder Deck',   base: '#3a3a68', dark: '#222244', light: '#6a6a98', speck: '#ffe066', bg: '#14142e' },
  { name: 'Anvil Tops',     base: '#2e3860', dark: '#181e38', light: '#586888', speck: '#ff9a3c', bg: '#0c1020' },
  { name: 'Jet Stream',     base: '#2a4868', dark: '#142838', light: '#4a7898', speck: '#8ff0ff', bg: '#08141e' },
  { name: 'Aurora Veil',    base: '#2a4060', dark: '#142438', light: '#48a888', speck: '#a0ffc8', bg: '#06141a' },
  { name: 'Star Shoals',    base: '#1e2858', dark: '#101838', light: '#4850a0', speck: '#fff6a0', bg: '#04081a' },
  { name: 'Storm Ceiling',  base: '#3a2060', dark: '#1e1038', light: '#7050a8', speck: '#e0a0ff', bg: '#0a0618' },
  { name: 'Above the Gale', base: '#201848', dark: '#100c28', light: '#5040a0', speck: '#ff80d0', bg: '#060410' },
  { name: 'Relic Winds',    base: '#401848', dark: '#240c28', light: '#8040a0', speck: '#ffc080', bg: '#100418' }
];
function layer(s) {
  if (s < LAYERS.length) return LAYERS[s];
  const p = LAYERS[8 + (s % 4)];
  return Object.assign({}, p, { name: 'Sky Void ' + (s - LAYERS.length + 1) });
}

const LOOT = [
  { name: 'Cloud Scrap',  color: '#e8f4fc', hi: '#ffffff' },
  { name: 'Soft Fluff',   color: '#c8e0f0', hi: '#ffffff' },
  { name: 'Wind Silk',    color: '#a8d0ff', hi: '#e0f0ff' },
  { name: 'Storm Thread', color: '#7a9cff', hi: '#c0d0ff' },
  { name: 'Spark Orb',    color: '#ffe066', hi: '#fff8c0' },
  { name: 'Bolt Shard',   color: '#ffcc2e', hi: '#fff3a0' },
  { name: 'Thunder Gem',  color: '#ff9a3c', hi: '#ffd08a' },
  { name: 'Gale Pearl',   color: '#8ff0ff', hi: '#e0ffff' },
  { name: 'Aurora Dust',  color: '#7dffb0', hi: '#d0ffe0' },
  { name: 'Star Fluff',   color: '#fff27a', hi: '#ffffff' },
  { name: 'Ceiling Shard',color: '#d0a0ff', hi: '#f0e0ff' },
  { name: 'Relic Scrap',  color: '#ff80d0', hi: '#ffd0f0' }
];
function loot(tier) { return LOOT[Math.min(tier, LOOT.length - 1)]; }

/* Helpers: start with kitten; Relic Map unlocks the rest. Each has its own Upgrade Map branch. */
const HELPERS = [
  { id: 'kitten', name: 'Storm Kitten', br: 'kitten', body: '#f0a868', belly: '#ffe0b8', accent: '#ff9ab8', unlock: null },
  { id: 'owl',    name: 'Wind Owl',     br: 'owl',    body: '#c8b090', belly: '#f0e8d0', accent: '#7ec8e8', unlock: 'h_owl' },
  { id: 'fox',    name: 'Thunder Fox',  br: 'fox',    body: '#e08040', belly: '#ffd0a0', accent: '#ffe066', unlock: 'h_fox' },
  { id: 'bunny',  name: 'Storm Bunny',  br: 'bunny',  body: '#e8e0f0', belly: '#ffffff', accent: '#b48cff', unlock: 'h_bunny' }
];

const B = {
  balloon: 'Balloon', wind: 'Wind', gear: 'Gear', loot: 'Loot',
  kitten: 'Kitten', owl: 'Wind Owl', fox: 'Thunder Fox', bunny: 'Storm Bunny'
};
const BR_COL = {
  balloon: '#ffb347', wind: '#7ec8e8', gear: '#7fd1ff', loot: '#7dffa0',
  kitten: '#ff9ab8', owl: '#c8b090', fox: '#e08040', bunny: '#b48cff'
};
const BR_ICON = {
  balloon: 'balloon', wind: 'wind', gear: 'bag', loot: 'coinbag',
  kitten: 'kitten', owl: 'owl', fox: 'fox', bunny: 'bunny'
};

const UPGRADES = [
  /* Balloon */
  { id: 'stitch', br: 'balloon', name: 'Stitch', icon: 'needle', x: -6, y: 1, parent: null, max: 30, cost: 8, g: 1.75, desc: '+20% pop power per level' },
  { id: 'bal1', br: 'balloon', name: 'Canvas Bag', icon: 'balloon:#e0874c', x: -6, y: 2, parent: 'stitch', max: 1, cost: 40, g: 1, desc: 'Pop power x4', tier: 1 },
  { id: 'quick', br: 'balloon', name: 'Quick Pop', icon: 'wind', x: -7, y: 2, parent: 'bal1', max: 20, cost: 60, g: 1.85, desc: '+8% pop speed per level' },
  { id: 'bal2', br: 'balloon', name: 'Silk Bag', icon: 'balloon:#e8f4fc', x: -6, y: 3, parent: 'bal1', max: 1, cost: 1200, g: 1, desc: 'Pop power x4', tier: 2 },
  { id: 'crit', br: 'balloon', name: 'Lucky Gust', icon: 'clover', x: -5, y: 3, parent: 'bal2', max: 15, cost: 900, g: 2.1, desc: '+3% chance for a x3 critical pop' },
  { id: 'bal3', br: 'balloon', name: 'Storm Silk', icon: 'balloon:#7a9cff', x: -6, y: 4, parent: 'bal2', max: 1, cost: 36000, g: 1, desc: 'Pop power x4', tier: 3 },
  { id: 'bal4', br: 'balloon', name: 'Thunder Hide', icon: 'balloon:#ffe066', x: -6, y: 5, parent: 'bal3', max: 1, cost: 1.08e6, g: 1, desc: 'Pop power x4', tier: 4 },
  { id: 'quake', br: 'balloon', name: 'Shockwave', icon: 'burst', x: -7, y: 5, parent: 'bal4', max: 10, cost: 4e5, g: 2.6, desc: '+5% chance a pop also cracks the cloud above' },
  { id: 'bal5', br: 'balloon', name: 'Aurora Bag', icon: 'balloon:#7dffb0', x: -6, y: 6, parent: 'bal4', max: 1, cost: 3.24e7, g: 1, desc: 'Pop power x4', tier: 5 },
  { id: 'bal6', br: 'balloon', name: 'Star Silk', icon: 'balloon:#fff27a', x: -6, y: 7, parent: 'bal5', max: 1, cost: 9.72e8, g: 1, desc: 'Pop power x4', tier: 6 },
  { id: 'bal7', br: 'balloon', name: 'Ceiling Weave', icon: 'balloon:#d0a0ff', x: -6, y: 8, parent: 'bal6', max: 1, cost: 2.916e10, g: 1, desc: 'Pop power x4', tier: 7 },
  { id: 'bal8', br: 'balloon', name: 'Relic Balloon', icon: 'balloon:#ff80d0', x: -6, y: 9, parent: 'bal7', max: 1, cost: 8.748e11, g: 1, desc: 'Pop power x4', tier: 8 },

  /* Wind (timed-run resource) */
  { id: 'tank', br: 'wind', name: 'Bigger Sails', icon: 'sail', x: -2, y: 1, parent: null, max: 20, cost: 5, g: 1.42, desc: '+3 s of wind lift per level' },
  { id: 'sight', br: 'wind', name: 'Clear Sight', icon: 'eye', x: -3, y: 2, parent: 'tank', max: 8, cost: 30, g: 2.1, desc: 'See further through the clouds' },
  { id: 'gustfind', br: 'wind', name: 'Gust Finder', icon: 'flask', x: -2, y: 2, parent: 'tank', max: 12, cost: 120, g: 1.9, desc: 'More gust flasks in the sky, +1 s each' },
  { id: 'gust', br: 'wind', name: 'Boost Gust', icon: 'sparkle', x: -1, y: 3, parent: 'gustfind', max: 1, cost: 3000, g: 1, desc: 'Button: a burst of lift that clears nearby clouds' },
  { id: 'reserve', br: 'wind', name: 'Reserve Breeze', icon: 'flask', x: -2, y: 3, parent: 'gustfind', max: 5, cost: 2500, g: 3, desc: '+4 s wind per level' },
  { id: 'gustpow', br: 'wind', name: 'Mega Gust', icon: 'burst', x: -1, y: 4, parent: 'gust', max: 6, cost: 5e4, g: 3, desc: 'Boost Gust recharges faster and hits harder' },
  { id: 'econ', br: 'wind', name: 'Soft Drift', icon: 'hourglass', x: -2, y: 4, parent: 'reserve', max: 5, cost: 1e5, g: 4, desc: 'Wind fades 4% slower' },

  /* Gear */
  { id: 'boots', br: 'gear', name: 'Glide Boots', icon: 'boots', x: 1, y: 1, parent: null, max: 15, cost: 15, g: 1.85, desc: '+8% move speed' },
  { id: 'bag', br: 'gear', name: 'Bigger Basket', icon: 'bag', x: 0, y: 2, parent: 'boots', max: 30, cost: 20, g: 1.5, desc: '+28% basket space for scrap' },
  { id: 'armor', br: 'gear', name: 'Rain Cape', icon: 'shield', x: 1, y: 2, parent: 'boots', max: 6, cost: 150, g: 6, desc: 'Storm pockets drain 22% less wind', tierNames: true },
  { id: 'mask', br: 'gear', name: 'Goggles', icon: 'mask', x: 2, y: 3, parent: 'armor', max: 3, cost: 2000, g: 8, desc: 'Turbulence drains 30% less wind' },
  { id: 'heat', br: 'gear', name: 'Warm Coat', icon: 'boots:#ff6a3a', x: 1, y: 3, parent: 'armor', max: 3, cost: 5e4, g: 10, desc: 'Icy clouds slow you less' },
  { id: 'helmet', br: 'gear', name: 'Pilot Cap', icon: 'helmet', x: 0, y: 4, parent: 'heat', max: 10, cost: 2e5, g: 2.6, desc: '+10% pop power and +3% sight' },
  { id: 'gloves', br: 'gear', name: 'Grip Gloves', icon: 'hand:#c8a070', x: 1, y: 4, parent: 'heat', max: 12, cost: 4e5, g: 2.5, desc: '+7% pop and attack speed' },

  /* Loot */
  { id: 'appraise', br: 'loot', name: 'Appraiser', icon: 'magnifier', x: 4, y: 1, parent: null, max: 40, cost: 20, g: 1.6, desc: '+12% scrap value' },
  { id: 'heightpay', br: 'loot', name: 'Height Bonus', icon: 'ruler', x: 3, y: 2, parent: 'appraise', max: 20, cost: 70, g: 2.2, desc: '+50% coins for height reached' },
  { id: 'veins', br: 'loot', name: 'Rich Clouds', icon: 'ore', x: 4, y: 2, parent: 'appraise', max: 15, cost: 250, g: 2.4, desc: '+8% more scrap in the clouds' },
  { id: 'chests', br: 'loot', name: 'Sky Map', icon: 'map', x: 5, y: 3, parent: 'veins', max: 10, cost: 3500, g: 2.3, desc: 'More floating treasure crates' },
  { id: 'gems', br: 'loot', name: 'Orb Eye', icon: 'eye', x: 4, y: 3, parent: 'veins', max: 10, cost: 1e4, g: 2.4, desc: 'Lightning orbs appear more often' },
  { id: 'merchant', br: 'loot', name: 'Haggler', icon: 'coinbag', x: 4, y: 4, parent: 'gems', max: 15, cost: 1.5e5, g: 2.4, desc: '+8% sell price' },

  /* Storm Kitten branch (always unlocked) */
  { id: 'kdig', br: 'kitten', name: 'Kitten Claws', icon: 'paw', x: 7, y: 1, parent: null, max: 25, cost: 12, g: 1.75, desc: 'Kitten pops clouds 12% faster', helper: 'kitten' },
  { id: 'kpow', br: 'kitten', name: 'Kitten Strength', icon: 'fist:#ff9ab8', x: 6, y: 2, parent: 'kdig', max: 10, cost: 80, g: 2.8, desc: 'Kitten hits harder (+12% of your pop)', helper: 'kitten' },
  { id: 'ksniff', br: 'kitten', name: 'Scrap Sniff', icon: 'nose', x: 7, y: 2, parent: 'kdig', max: 6, cost: 200, g: 2.6, desc: 'Kitten smells scrap in the fog (+1 tile)', helper: 'kitten' },
  { id: 'kbag', br: 'kitten', name: 'Kitten Pouch', icon: 'bag:#ff9ab8', x: 8, y: 2, parent: 'kdig', max: 15, cost: 150, g: 1.9, desc: 'Kitten carries +4 extra scrap', helper: 'kitten' },
  { id: 'khunt', br: 'kitten', name: 'Orb Hunter', icon: 'gem', x: 7, y: 3, parent: 'ksniff', max: 1, cost: 4000, g: 1, desc: 'Kitten dashes off to pop scrap it smells', helper: 'kitten' },
  { id: 'kfight', br: 'kitten', name: 'Brave Kitten', icon: 'fist:#ff6b6b', x: 8, y: 3, parent: 'kbag', max: 10, cost: 3000, g: 2.4, desc: 'Kitten swats storm wisps', helper: 'kitten' },
  { id: 'kbolt', br: 'kitten', name: 'Paw Bolt', icon: 'bolt', x: 7, y: 4, parent: 'khunt', max: 1, cost: 2.5e4, g: 1, desc: 'Button: Kitten fires a bolt that pops a hole', helper: 'kitten' },
  { id: 'kboltpow', br: 'kitten', name: 'Bigger Bolt', icon: 'bolt:#ffe066', x: 6, y: 5, parent: 'kbolt', max: 8, cost: 2e5, g: 3, desc: 'Paw Bolt is stronger and recharges faster', helper: 'kitten' },
  { id: 'ktunnel', br: 'kitten', name: 'Side Gusts', icon: 'arrowslr', x: 8, y: 5, parent: 'kbolt', max: 1, cost: 5e5, g: 1, desc: 'Every 10 m Kitten opens a sideways scrap lane', helper: 'kitten' },

  /* Wind Owl branch (unlocked via Relic h_owl) */
  { id: 'odig', br: 'owl', name: 'Owl Wings', icon: 'feather', x: 10, y: 1, parent: null, max: 20, cost: 80, g: 1.8, desc: 'Owl pops clouds 14% faster', helper: 'owl' },
  { id: 'osight', br: 'owl', name: 'Night Eyes', icon: 'eye:#c8b090', x: 9, y: 2, parent: 'odig', max: 8, cost: 200, g: 2.2, desc: 'Owl reveals fog +1 tile', helper: 'owl' },
  { id: 'oglide', br: 'owl', name: 'Silent Glide', icon: 'feather:#7ec8e8', x: 10, y: 2, parent: 'odig', max: 12, cost: 250, g: 1.9, desc: 'Owl moves 10% faster', helper: 'owl' },
  { id: 'oswoop', br: 'owl', name: 'Swoop', icon: 'burst:#c8b090', x: 11, y: 3, parent: 'oglide', max: 1, cost: 8000, g: 1, desc: 'Owl periodically swoops a column of clouds', helper: 'owl' },
  { id: 'oloot', br: 'owl', name: 'Owl Cache', icon: 'bag:#c8b090', x: 10, y: 3, parent: 'osight', max: 10, cost: 5000, g: 2.3, desc: 'Owl finds +15% scrap value', helper: 'owl' },
  { id: 'ostorm', br: 'owl', name: 'Storm Call', icon: 'wind:#7ec8e8', x: 10, y: 4, parent: 'oswoop', max: 6, cost: 8e4, g: 2.8, desc: 'Swoop recharges faster and hits wider', helper: 'owl' },

  /* Thunder Fox branch (unlocked via Relic h_fox) */
  { id: 'fdig', br: 'fox', name: 'Fox Paws', icon: 'paw:#e08040', x: 13, y: 1, parent: null, max: 20, cost: 200, g: 1.85, desc: 'Fox pops clouds 14% faster', helper: 'fox' },
  { id: 'fzap', br: 'fox', name: 'Static Fur', icon: 'bolt', x: 12, y: 2, parent: 'fdig', max: 10, cost: 600, g: 2.4, desc: 'Fox shocks wisps (40% of your hit)', helper: 'fox' },
  { id: 'fspark', br: 'fox', name: 'Spark Trail', icon: 'sparkle:#ffe066', x: 13, y: 2, parent: 'fdig', max: 8, cost: 800, g: 2.2, desc: 'Fox leaves scrap sparks when moving', helper: 'fox' },
  { id: 'fchain', br: 'fox', name: 'Chain Bolt', icon: 'bolt:#ffe066', x: 14, y: 3, parent: 'fzap', max: 1, cost: 2e4, g: 1, desc: 'Fox bolts jump between nearby clouds', helper: 'fox' },
  { id: 'fpack', br: 'fox', name: 'Fox Pack', icon: 'bag:#e08040', x: 13, y: 3, parent: 'fspark', max: 12, cost: 1.2e4, g: 2.1, desc: 'Fox carries +5 scrap', helper: 'fox' },
  { id: 'fstorm', br: 'fox', name: 'Thunder Run', icon: 'burst:#ffe066', x: 13, y: 4, parent: 'fchain', max: 5, cost: 2e5, g: 3, desc: 'Chain Bolt stronger; +wind on kills', helper: 'fox' },

  /* Storm Bunny branch (unlocked via Relic h_bunny) */
  { id: 'bdig', br: 'bunny', name: 'Bunny Hop', icon: 'bunny', x: 16, y: 1, parent: null, max: 18, cost: 500, g: 1.9, desc: 'Bunny hops and pops 15% faster', helper: 'bunny' },
  { id: 'bluck', br: 'bunny', name: 'Lucky Foot', icon: 'clover', x: 15, y: 2, parent: 'bdig', max: 10, cost: 1500, g: 2.3, desc: '+5% crit for everyone', helper: 'bunny' },
  { id: 'bfluff', br: 'bunny', name: 'Fluff Magnet', icon: 'heart:#b48cff', x: 16, y: 2, parent: 'bdig', max: 8, cost: 2000, g: 2.4, desc: 'Scrap pulls toward the balloon a little', helper: 'bunny' },
  { id: 'bboom', br: 'bunny', name: 'Thumper', icon: 'burst:#b48cff', x: 17, y: 3, parent: 'bluck', max: 1, cost: 5e4, g: 1, desc: 'Bunny stomps a ring of clouds every few seconds', helper: 'bunny' },
  { id: 'bcheer', br: 'bunny', name: 'Cheer', icon: 'heart', x: 16, y: 3, parent: 'bfluff', max: 8, cost: 4e4, g: 2.5, desc: 'All helpers pop 8% faster', helper: 'bunny' },
  { id: 'bstorm', br: 'bunny', name: 'Storm Hop', icon: 'star', x: 16, y: 4, parent: 'bboom', max: 5, cost: 4e5, g: 3, desc: 'Thumper bigger; +coins from crates', helper: 'bunny' }
];

/* Prestige = Storm Relics. Helper unlocks open new Upgrade Map branches. */
const PRESTIGE = [
  { id: 'p_value', name: 'Sky Lore', icon: 'scroll', x: 0, y: 1, parent: null, max: 40, cost: 2, g: 1.22, desc: '+15% coins (adds up)' },
  { id: 'p_power', name: 'Gale Strength', icon: 'volcano', x: -2, y: 1, parent: null, max: 60, cost: 2, g: 1.17, desc: '+30% pop power' },
  { id: 'p_wind', name: 'Eternal Breeze', icon: 'wind', x: 2, y: 1, parent: null, max: 8, cost: 4, g: 1.7, desc: '+3 s wind lift' },
  { id: 'p_start', name: 'Savings Jar', icon: 'jar', x: -1, y: 2, parent: 'p_value', max: 6, cost: 10, g: 2.6, desc: 'Start each new ascent with coins (x10 per level)' },
  { id: 'h_owl', name: 'Wind Owl', icon: 'owl', x: 0, y: 2.5, parent: 'p_value', max: 1, cost: 25, g: 1, desc: 'Unlock helper: Wind Owl + its Upgrade Map branch', helper: 'owl' },
  { id: 'p_speed', name: 'Light Feet', icon: 'feather', x: 2, y: 2, parent: 'p_wind', max: 10, cost: 6, g: 1.8, desc: '+6% move speed' },
  { id: 'p_relic', name: 'Relic Hunter', icon: 'column', x: -2, y: 2.5, parent: 'p_power', max: 12, cost: 15, g: 1.7, desc: '+20% Relics from ceiling punches' },
  { id: 'p_elev', name: 'Sky Elevator', icon: 'elevator', x: 1, y: 3.5, parent: 'h_owl', max: 4, cost: 80, g: 3, desc: 'Start runs part-way up (20% of record per level)' },
  { id: 'p_keep', name: 'Gear Locker', icon: 'lock', x: -1, y: 3.5, parent: 'h_owl', max: 3, cost: 150, g: 6, desc: 'Keep balloon tiers after a ceiling punch (one per level)' },
  { id: 'h_fox', name: 'Thunder Fox', icon: 'fox', x: 0, y: 4.5, parent: 'h_owl', max: 1, cost: 600, g: 1, desc: 'Unlock helper: Thunder Fox + its Upgrade Map branch', helper: 'fox' },
  { id: 'p_bond', name: 'Buddy Bond', icon: 'heart', x: 2, y: 4.5, parent: 'h_fox', max: 12, cost: 60, g: 1.75, desc: 'All helpers pop 35% faster' },
  { id: 'p_auto', name: 'Pilot Notes', icon: 'notebook', x: -2, y: 4.5, parent: 'h_fox', max: 1, cost: 400, g: 1, desc: 'Unlocks Auto-buy on the Upgrade Map' },
  { id: 'h_bunny', name: 'Storm Bunny', icon: 'bunny', x: 0, y: 5.5, parent: 'h_fox', max: 1, cost: 4000, g: 1, desc: 'Unlock helper: Storm Bunny + its Upgrade Map branch', helper: 'bunny' },
  { id: 'p_time', name: 'Long Gust', icon: 'hourglass', x: 2, y: 5.5, parent: 'h_bunny', max: 5, cost: 1000, g: 2.2, desc: 'Wind fades 5% slower' },
  { id: 'p_luck', name: 'Lucky Charm', icon: 'clover', x: -2, y: 5.5, parent: 'h_bunny', max: 8, cost: 800, g: 1.6, desc: 'Crates and orbs are worth +50%' },
  { id: 'p_team', name: 'Sky Pack', icon: 'star', x: 0, y: 6.5, parent: 'h_bunny', max: 1, cost: 12000, g: 1, desc: 'All unlocked helpers work at once (pack mode)' },
  { id: 'p_core', name: 'Heart of the Storm', icon: 'heart:#ff8a3c', x: 0, y: 7.5, parent: 'p_team', max: 5, cost: 20000, g: 1.5, desc: 'Pop power x2 and +5 s wind' }
];

UPGRADES.forEach((u) => { u.cost *= COIN; });

const GOALS = [
  { id: 'h8',     kind: 'height', n: 8,  text: 'Rise 8 m high', icon: 'height', reward: 30 },
  { id: 'sc5',    kind: 'ore', tier: 0, n: 5, text: 'Collect 5 Cloud Scrap', icon: 'ore:#e8f4fc', reward: 40 },
  { id: 'buy1',   kind: 'buys', n: 1, text: 'Buy an upgrade', icon: 'rails', reward: 40 },
  { id: 'chest1', kind: 'chests', n: 1, text: 'Open a sky crate', icon: 'chest', reward: 60 },
  { id: 'h18',    kind: 'height', n: 18, text: 'Reach 18 m', icon: 'height', reward: 80 },
  { id: 'buy3',   kind: 'buys', n: 3, text: 'Buy 3 upgrades', icon: 'rails', reward: 100 },
  { id: 'cotton', kind: 'height', n: 25, text: 'Reach Cotton Clouds (25 m)', icon: 'cloud', reward: 150 },
  { id: 'bal1',   kind: 'up', up: 'bal1', text: 'Buy the Canvas Bag', icon: 'balloon:#e0874c', reward: 200 },
  { id: 'fl5',    kind: 'ore', tier: 1, n: 5, text: 'Collect 5 Soft Fluff', icon: 'ore:#c8e0f0', reward: 300 },
  { id: 'kill1',  kind: 'kills', n: 1, text: 'Clear a storm wisp', icon: 'bolt', reward: 300 },
  { id: 'h35',    kind: 'height', n: 35, text: 'Reach 35 m', icon: 'height', reward: 600 },
  { id: 'ksniff', kind: 'up', up: 'ksniff', text: 'Teach Kitten Scrap Sniff', icon: 'nose', reward: 800 },
  { id: 'shear',  kind: 'height', n: 50, text: 'Reach Wind Shear (50 m)', icon: 'cloud', reward: 2500 },
  { id: 'bal2',   kind: 'up', up: 'bal2', text: 'Buy the Silk Bag', icon: 'balloon:#e8f4fc', reward: 4000 },
  { id: 'storm',  kind: 'height', n: 75, text: 'Reach Storm Shelf (75 m)', icon: 'bolt', reward: 30000 },
  { id: 'h100',   kind: 'height', n: 100, text: 'Reach 100 m to punch the Ceiling', icon: 'relic', reward: 100000 },
  { id: 'ceil1',  kind: 'caveins', n: 1, text: 'Punch the Storm Ceiling once', icon: 'relic', reward: 0 },
  { id: 'owl1',   kind: 'helper', helper: 'owl', text: 'Unlock Wind Owl on the Relic Map', icon: 'owl', reward: 50000 }
];

const API = { W, CHUNK, HP_GROWTH, VAL_GROWTH, COIN, CEILING, GOALS, LAYERS, layer, LOOT, loot, HELPERS, UPGRADES, PRESTIGE, B, BR_COL, BR_ICON };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SBData = API;
})(typeof self !== 'undefined' ? self : this);
