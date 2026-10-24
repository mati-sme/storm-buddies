/* Storm Buddies - canvas renderer. */
(function (root) {
'use strict';
const D = root.SBData, C = root.SBCore, S = root.SBSprites;
const { T } = C;
const FONT = '"Pixelify Sans", system-ui, sans-serif';
function outlinedText(ctx, text, x, y, fs) {
  ctx.font = `bold ${fs}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, fs / 5); ctx.strokeStyle = '#102038'; ctx.strokeText(text, x, y);
  ctx.fillStyle = '#fff8e8'; ctx.fillText(text, x, y);
}
const IC = (n) => root.SBIcons.get(n);

class Renderer {
  constructor(cv) {
    this.cv = cv; this.ctx = cv.getContext('2d');
    this.w = 1; this.h = 1; this.dpr = 1; this.ts = 16; this.ox = 0; this.camY = 0;
    this.t = 0; this.parts = []; this.pops = []; this.emote = null; this.bubble = null;
    this.arrow = null; this.campView = false; this.railW = 0; this.campRight = 1;
    this.pSwing = 0; this.bSwing = 0; this.cols = D.W;
  }
  resize() {
    const r = this.cv.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.cv.width = Math.round(this.w * this.dpr); this.cv.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }
  landscape() { return this.w > this.h * 1.1; }
  landscapeTs() {
    const cols = this.idealCols();
    return Math.max(10, Math.floor(Math.min(this.w / cols, this.h / 14)));
  }
  idealCols() { return this.landscape() ? Math.max(D.W, Math.min(40, Math.floor(this.w / this.landscapeTs()))) : D.W; }
  layout(W, focusX) {
    this.cols = this.idealCols();
    this.ts = this.landscape() ? this.landscapeTs() : Math.floor(Math.min(this.w / D.W, this.h / 16));
    this.ts = Math.max(8, this.ts);
    const total = this.cols * this.ts;
    this.ox = Math.round((this.w - total) / 2);
    if (focusX != null && this.cols > D.W) {
      const want = focusX * this.ts + this.ts / 2;
      this.ox = Math.round(this.w / 2 - want);
      const minOx = this.w - D.W * this.ts, maxOx = 0;
      this.ox = Math.max(minOx, Math.min(maxOx, this.ox));
    }
  }
  sx(x) { return this.ox + Math.round(x * this.ts * this.dpr) / this.dpr; }
  sy(y) { return Math.round((this.camY - y) * this.ts * this.dpr) / this.dpr; }
  tileAt(px, py) { return { x: Math.floor((px - this.ox) / this.ts), y: Math.floor(this.camY - py / this.ts) }; }
  burst(x, y, n, cols, speed, size) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (0.4 + Math.random()) * (speed || 40);
      this.parts.push({ x: x + 0.5, y: y + 0.5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: 0.5 + Math.random() * 0.5, col: cols[i % cols.length], size: size || 0.12 });
    }
  }
  pop(x, y, text, col, big, icon) { this.pops.push({ x: x + 0.5, y: y + 0.2, text, col, life: 1.2, big, icon }); }
  emo(kind, t) { this.emote = { kind, t: t || 1.6 }; }
  screenOf(x, y) { return { x: this.sx(x) + this.ts / 2, y: this.sy(y) + this.ts / 2 }; }
  event(e, w) {
    if (e.type === 'break') {
      const cols = e.kind === 'scrap' ? ['#ffe066', '#fff3a0', '#a8d4ff'] : e.kind === 'storm' ? ['#a080ff', '#ffe066'] : ['#c8e0f8', '#e8f4fc', '#ffffff'];
      this.burst(e.x, e.y, e.kind === 'scrap' ? 10 : 6, cols, 55, 0.1);
      if (e.kind === 'scrap') this.pop(e.x, e.y, '+' + (e.val || ''), '#ffe066', false, 'cloud');
    } else if (e.type === 'chest') { this.burst(e.x, e.y, 14, ['#ffcc33', '#fff3a0', '#ff9a3c'], 70, 0.14); this.pop(e.x, e.y, 'Chest!', '#ffcc33', true, 'chest'); this.emo('star'); }
    else if (e.type === 'flask') { this.burst(e.x, e.y, 8, ['#4a90e0', '#a8d4ff'], 50); this.pop(e.x, e.y, '+' + Math.round(e.amt) + 's', '#a8d4ff', false, 'wind'); }
    else if (e.type === 'crit') this.pop(e.x, e.y, 'CRIT', '#ff5a5a', true);
    else if (e.type === 'kill') { this.burst(e.x, e.y, 12, ['#b48cff', '#ffe066'], 60); this.pop(e.x, e.y, 'Poof!', '#b48cff'); }
    else if (e.type === 'say' && e.text) this.bubble = { text: e.text, t: 2.8 };
  }

  drawTile(w, x, y, X, Y, ts) {
    const ctx = this.ctx, r = w.row(y), t = r.t[x], s = C.stratumOf(y), v = (x * 7 + y * 13) % 3;
    if (C.passable(t)) {
      // empty sky cell: soft tint
      const P = D.layer(s);
      ctx.fillStyle = s === 0 ? 'rgba(255,255,255,0.05)' : (P.base + '33');
      if (t === T.ICE) {
        ctx.fillStyle = 'rgba(180,220,255,0.35)'; ctx.fillRect(X, Y, ts, ts);
        ctx.fillStyle = 'rgba(220,240,255,0.4)';
        const o = Math.sin(this.t * 2 + x) * ts * 0.04;
        ctx.fillRect(X, Y + ts * 0.3 + o, ts, Math.max(1, ts * 0.05));
      }
      return;
    }
    const kind = t === T.DENSE ? 'dense' : t === T.STORM ? 'storm' : t === T.SCRAP ? 'scrap' : 'cloud';
    ctx.drawImage(S.cloudTex(s, v, kind), X, Y, ts, ts);
    if (t === T.SCRAP) ctx.drawImage(S.scrapTex(r.ore[x] || 0), X, Y, ts, ts);
    else if (t === T.FLASK) ctx.drawImage(S.flaskTex(), X + ts * 0.15, Y + ts * 0.1, ts * 0.7, ts * 0.8);
    else if (t === T.CHEST) ctx.drawImage(S.chestTex(), X + ts * 0.1, Y + ts * 0.15, ts * 0.8, ts * 0.7);
    // sky-dock plank strip at surface
    if (y === 0) {
      ctx.fillStyle = '#8a6a48'; ctx.fillRect(X, Y, ts, ts * 0.18);
      ctx.fillStyle = '#c8a070'; ctx.fillRect(X, Y, ts, ts * 0.07);
      ctx.fillStyle = '#5a4030'; ctx.fillRect(X + ts * 0.45, Y, ts * 0.08, ts * 0.18);
    }
    const ratio = r.hp[x] / (r.max[x] || 1);
    if (ratio < 0.999) {
      ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = Math.max(2, ts / 16);
      ctx.beginPath();
      const m = (a, b) => [X + a * ts, Y + b * ts];
      const lines = [[[0.5, 0.5], [0.25, 0.2]], [[0.5, 0.5], [0.8, 0.35]], [[0.5, 0.5], [0.4, 0.85]], [[0.25, 0.2], [0.1, 0.35]], [[0.8, 0.35], [0.9, 0.7]], [[0.4, 0.85], [0.7, 0.9]]];
      const n = ratio < 0.33 ? 6 : ratio < 0.66 ? 4 : 2;
      for (let i = 0; i < n; i++) { const a = m(...lines[i][0]), b = m(...lines[i][1]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      ctx.stroke();
    }
  }

  drawSky(yTop, yBot) {
    const ctx = this.ctx;
    if (yBot <= 0) return;
    const g = ctx.createLinearGradient(0, Math.min(0, yBot - this.h), 0, yBot);
    g.addColorStop(0, '#6eb0f0'); g.addColorStop(0.55, '#a8d4ff'); g.addColorStop(1, '#ffe0b0');
    ctx.fillStyle = g; ctx.fillRect(0, yTop, this.w, yBot - yTop);
    const ts = this.ts, pu = Math.max(2, Math.round(ts / 10));
    const snap = (v) => Math.round(v / pu) * pu;
    const disc = (cx, cy, r, col) => { ctx.fillStyle = col; for (let dy = -r; dy <= r; dy += pu) { const hw = snap(Math.sqrt(Math.max(0, r * r - dy * dy))); ctx.fillRect(snap(cx) - hw, snap(cy + dy), hw * 2, pu); } };
    const sx = this.w * 0.78, sy = yBot - ts * 5.2;
    disc(sx, sy, ts * 1.2, 'rgba(255,240,170,0.2)'); disc(sx, sy, ts * 0.7, '#fff3b0'); disc(sx - ts * 0.1, sy - ts * 0.1, ts * 0.4, '#fffbe0');
    for (let i = 0; i < 5; i++) {
      const cw = ts * (1.6 + (i % 3) * 0.5), cx = snap(((i * 197 + this.t * (5 + i)) % (this.w + cw * 2)) - cw), cy = snap(yBot - ts * (3.4 + (i % 3)) - (i === 4 ? ts * 2 : 0));
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillRect(cx, cy, snap(cw), snap(ts * 0.34));
      ctx.fillRect(cx + snap(cw * 0.18), cy - snap(ts * 0.24), snap(cw * 0.5), snap(ts * 0.26));
      ctx.fillStyle = 'rgba(190,210,255,0.85)'; ctx.fillRect(cx, cy + snap(ts * 0.34) - pu, snap(cw), pu);
    }
    const hills = (base, amp, freq, col, phase) => {
      ctx.fillStyle = col;
      for (let x = 0; x < this.w + pu; x += pu * 2) {
        const h = snap(amp * (0.55 + 0.45 * Math.sin(x * freq + phase) * Math.sin(x * freq * 0.37 + phase * 2)));
        ctx.fillRect(x, yBot - base - h, pu * 2, base + h + 2);
      }
    };
    // soft cloud islands (not grassy hills)
    hills(ts * 0.55, ts * 1.2, 0.005, 'rgba(255,255,255,0.85)', 1.3);
    hills(ts * 0.2, ts * 0.7, 0.01, 'rgba(200,220,255,0.75)', 0.4);
  }

  drawMeadow(w, surfY) {
    const ctx = this.ctx, ts = this.ts, wide = this.landscape();
    const rail = wide ? (this.railW || 0) : 0, right = wide ? this.w * (this.campRight || 0.64) : this.w;
    const cx = rail + (right - rail) / 2, u = Math.min(ts, (right - rail) / 13);
    // floating dock planks
    ctx.fillStyle = '#6a4a30'; ctx.fillRect(cx - u * 5.5, surfY - u * 0.15, u * 11, u * 0.55);
    ctx.fillStyle = '#c8a070'; ctx.fillRect(cx - u * 5.5, surfY - u * 0.15, u * 11, u * 0.22);
    for (let i = -5; i <= 5; i++) { ctx.fillStyle = '#5a4030'; ctx.fillRect(cx + i * u - u * 0.05, surfY - u * 0.15, u * 0.1, u * 0.55); }
    // rope posts
    ctx.fillStyle = '#d8e8ff'; ctx.fillRect(cx - u * 5.2, surfY - u * 2.2, u * 0.18, u * 2.2); ctx.fillRect(cx + u * 5, surfY - u * 2.2, u * 0.18, u * 2.2);
    ctx.strokeStyle = 'rgba(200,220,255,0.7)'; ctx.lineWidth = Math.max(2, u * 0.08);
    ctx.beginPath(); ctx.moveTo(cx - u * 5.1, surfY - u * 2); ctx.quadraticCurveTo(cx, surfY - u * 2.8, cx + u * 5.1, surfY - u * 2); ctx.stroke();
    // balloon parked
    const bal = S.balloon(w.st.balTier || 0);
    const bw = u * 3.2, bh = bal.height * bw / bal.width;
    ctx.drawImage(bal, Math.round(cx - u * 4.2 - bw / 2), Math.round(surfY - bh + u * 0.2), Math.round(bw), Math.round(bh));
    // pilot
    const bobH = Math.round(Math.sin(this.t * 2.2) * u * 0.03);
    const hero = S.pilot(w.st.armor || 0), hw = u * 2.0, hh = hero.height * hw / hero.width;
    ctx.drawImage(hero, Math.round(cx - u * 1.6 - hw / 2), Math.round(surfY - hh + bobH), Math.round(hw), Math.round(hh));
    // helpers lined up
    const helpers = C.unlockedHelpers(w.save || { pr: {}, up: {} });
    helpers.forEach((h, i) => {
      const spr = S.helper(h.id), pw = u * 1.7, ph = spr.height * pw / spr.width;
      const hop = Math.round(Math.max(0, Math.sin(this.t * 3 + i)) * u * 0.15);
      ctx.drawImage(spr, Math.round(cx + u * (1.6 + i * 1.8) - pw / 2), Math.round(surfY - ph - hop), Math.round(pw), Math.round(ph));
    });
    // soft glow
    const fx = cx + u * 0.2;
    const g = ctx.createRadialGradient(fx, surfY - u, 0, fx, surfY - u, u * 3);
    g.addColorStop(0, 'rgba(168,212,255,0.35)'); g.addColorStop(1, 'rgba(168,212,255,0)');
    ctx.fillStyle = g; ctx.fillRect(fx - u * 4, surfY - u * 4, u * 8, u * 5);
  }

  drawPilot(w, a, ts) {
    const ctx = this.ctx, X = this.sx(a.px), Y = this.sy(a.py);
    const moving = Math.abs(a.x - a.px) + Math.abs(a.y - a.py) > 0.05;
    const bob = moving ? Math.round(Math.abs(Math.sin(this.t * 10)) * ts * 0.06) : Math.round(Math.sin(this.t * 3) * ts * 0.04);
    // balloon above
    const bal = S.balloon(w.st.balTier || 0);
    ctx.drawImage(bal, X + ts * 0.05, Y - ts * 0.85 - bob, ts * 0.9, ts * 0.9);
    const spr = S.pilot(w.st.armor || 0);
    ctx.save();
    ctx.translate(X + ts / 2, Y + ts / 2 - bob);
    if (a.hurtT > 0 && Math.floor(this.t * 20) % 2) ctx.globalAlpha = 0.5;
    ctx.scale(a.face < 0 ? -1 : 1, 1);
    ctx.drawImage(spr, -ts * 0.5, -ts * 0.4, ts, ts);
    ctx.restore();
  }

  drawBuddy(w, b, ts) {
    const ctx = this.ctx, X = this.sx(b.px), Y = this.sy(b.py);
    const moving = Math.abs(b.x - b.px) + Math.abs(b.y - b.py) > 0.05;
    const bob = moving ? Math.abs(Math.sin(this.t * 12)) * ts * 0.1 : Math.sin(this.t * 3) * ts * 0.03;
    const dig = this.bSwing > 0 ? Math.sin(this.t * 60) * ts * 0.05 : 0;
    const hid = b.hid || (w.buddy && w.buddy.hid) || 'kitten';
    ctx.save(); ctx.translate(X + ts / 2 + dig, Y + ts / 2 - bob);
    ctx.scale(b.face < 0 ? -1 : 1, 1);
    ctx.drawImage(S.helper(hid), -ts * 0.48, -ts * 0.4, ts * 0.96, ts * 0.9);
    ctx.restore();
  }

  drawEmote(w, ts) {
    if (!this.emote || this.emote.t <= 0) return;
    const b = w.buddy || w.player, X = this.sx(b.px) + ts / 2, Y = this.sy(b.py) - ts * 0.3;
    const a = Math.min(1, this.emote.t * 3, this.emote.t);
    const ctx = this.ctx; ctx.globalAlpha = a;
    const name = this.emote.kind === 'star' ? 'star' : this.emote.kind === 'heart' ? 'heart' : 'burst';
    ctx.drawImage(IC(name), X - ts * 0.25, Y - ts * 0.5, ts * 0.5, ts * 0.5);
    ctx.globalAlpha = 1;
  }

  drawArrow(ts) {
    if (!this.arrow) return;
    const ctx = this.ctx, X = this.sx(this.arrow.x) + ts / 2, Y = this.sy(this.arrow.y) - ts * 0.2;
    const bob = Math.sin(this.t * 6) * ts * 0.1;
    ctx.fillStyle = '#ffe066'; ctx.beginPath();
    ctx.moveTo(X, Y + bob); ctx.lineTo(X - ts * 0.25, Y - ts * 0.35 + bob); ctx.lineTo(X + ts * 0.25, Y - ts * 0.35 + bob);
    ctx.closePath(); ctx.fill();
  }

  drawBubble(w, ts) {
    if (!this.bubble || this.bubble.t <= 0) return;
    const b = w.buddy || w.player;
    const ctx = this.ctx, text = this.bubble.text;
    const X = this.sx(b.px) + ts / 2, Y = this.sy(b.py) - ts * 0.7;
    ctx.font = `bold ${Math.max(10, ts * 0.45)}px ${FONT}`;
    const mw = ctx.measureText(text).width + ts * 0.5;
    const a = Math.min(1, this.bubble.t * 3, this.bubble.t);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fff8e8'; ctx.strokeStyle = '#102038'; ctx.lineWidth = 2;
    const bx = X - mw / 2, by = Y - ts * 0.7, bh = ts * 0.7;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, mw, bh, 6) : ctx.rect(bx, by, mw, bh); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#102038'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, X, by + bh / 2);
    ctx.globalAlpha = 1;
  }

  draw(w, dt) {
    this.t += dt; this.pSwing = Math.max(0, this.pSwing - dt); this.bSwing = Math.max(0, this.bSwing - dt);
    if (this.emote) this.emote.t -= dt;
    if (this.bubble) this.bubble.t -= dt;
    const ctx = this.ctx, ts = this.ts;
    ctx.clearRect(0, 0, this.w, this.h);

    const focusY = w.player ? w.player.py : 0;
    const viewRows = this.h / ts + 2;
    let targetCam = focusY + viewRows * 0.55;
    if (this.campView) targetCam = viewRows * 0.35;
    if (this.camY == null) this.camY = targetCam;
    this.camY += (targetCam - this.camY) * Math.min(1, dt * 6);

    this.layout(D.W, w.player ? w.player.px : D.W / 2);

    // background gradient by height
    const mid = Math.max(0, Math.floor(this.camY + viewRows / 2));
    const s0 = C.stratumOf(mid);
    const P = D.layer(s0);
    const bg = ctx.createLinearGradient(0, 0, 0, this.h);
    bg.addColorStop(0, P.bg || '#6eb0f0'); bg.addColorStop(1, P.base || '#a8d4ff');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, this.w, this.h);

    const y0 = Math.floor(this.camY - viewRows) - 1, y1 = Math.ceil(this.camY) + 1;
    const surfY = this.sy(0);
    if (surfY > -ts * 8) this.drawSky(0, Math.min(this.h, surfY));

    // tiles
    for (let y = Math.max(0, y0); y <= y1; y++) {
      if (!w.row) continue;
      const r = w.row(y); if (!r) continue;
      for (let x = 0; x < D.W; x++) {
        const X = this.sx(x), Y = this.sy(y);
        if (Y + ts < 0 || Y > this.h || X + ts < 0 || X > this.w) continue;
        this.drawTile(w, x, y, X, Y, ts);
      }
    }

    if (this.campView && surfY > 0) this.drawMeadow(w, surfY);

    // creatures / storm birds
    if (w.creatures) for (const c of w.creatures) {
      if (c.dead) continue;
      const X = this.sx(c.px || c.x), Y = this.sy(c.py || c.y);
      const bob = Math.sin(this.t * 4 + c.x) * ts * 0.08;
      ctx.drawImage(S.bird(c.type || { tint: '#a080ff' }), X, Y + bob, ts, ts);
    }

    if (w.buddies) for (const b of w.buddies) this.drawBuddy(w, b, ts);
    else if (w.buddy) this.drawBuddy(w, w.buddy, ts);
    if (w.player) this.drawPilot(w, w.player, ts);

    this.drawEmote(w, ts);
    this.drawArrow(ts);
    this.drawBubble(w, ts);

    // particles
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt; p.x += (p.vx || 0) * dt / (p.screen ? 1 : ts); p.y += (p.vy || 0) * dt / (p.screen ? 1 : ts); p.vy = (p.vy || 0) + 60 * dt;
      if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.col;
      const sz = (p.size || 0.1) * ts;
      if (p.screen) ctx.fillRect(p.sx, p.sy, sz, sz);
      else ctx.fillRect(this.sx(p.x) - sz / 2, this.sy(p.y) - sz / 2, sz, sz);
      ctx.globalAlpha = 1;
    }
    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i]; p.life -= dt; p.y -= dt * 0.6;
      if (p.life <= 0) { this.pops.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, p.life * 2);
      const fs = (p.big ? 0.55 : 0.4) * ts;
      if (p.icon) { try { ctx.drawImage(IC(p.icon), this.sx(p.x) - fs, this.sy(p.y) - fs / 2, fs, fs); } catch (e) { /* */ } }
      outlinedText(ctx, String(p.text), this.sx(p.x) + (p.icon ? fs * 0.6 : 0), this.sy(p.y), fs);
      ctx.globalAlpha = 1;
    }

    // wind vignette when low
    if (w.oil != null && w.st && w.oil / w.st.oilMax < 0.25 && !w.oilHold) {
      const a = 0.15 + Math.sin(this.t * 6) * 0.05;
      ctx.fillStyle = `rgba(40,60,120,${a})`; ctx.fillRect(0, 0, this.w, this.h);
    }
  }
}
root.SBRenderer = Renderer;
})(typeof self !== 'undefined' ? self : this);
