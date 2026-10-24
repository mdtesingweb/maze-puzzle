// Coding Maze Rescue — vẽ canvas vector (không ảnh ngoài, không emoji).
(function () {
  'use strict';

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function ellipse(ctx, cx, cy, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  }

  // ---- Ô mê cung ----
  function drawTile(ctx, kind, px, py, tile, t) {
    var gx = Math.round(px / tile), gy = Math.round(py / tile);
    var even = ((gx + gy) & 1) === 0;
    // Sàn cỏ 2 tông xen kẽ (dùng cả cho nền của hố và đích).
    ctx.fillStyle = even ? '#93d67e' : '#87cb6e';
    ctx.fillRect(px, py, tile, tile);
    // Chấm cỏ nhỏ xác định theo vị trí ô (không nhấp nháy theo t).
    if (((gx * 7 + gy * 13) % 3) === 0) {
      ctx.strokeStyle = 'rgba(70,140,60,0.5)';
      ctx.lineWidth = Math.max(1, tile * 0.03);
      var bx = px + tile * 0.22, by = py + tile * 0.78;
      ctx.beginPath();
      ctx.moveTo(bx, by); ctx.lineTo(bx - tile * 0.05, by - tile * 0.14);
      ctx.moveTo(bx + tile * 0.09, by); ctx.lineTo(bx + tile * 0.11, by - tile * 0.16);
      ctx.stroke();
    }
    if (kind === 'floor') return;

    if (kind === 'wall') {
      // Bụi cây/khối đá bo góc, sáng ở trên, tối ở dưới cho có chiều sâu.
      var m = tile * 0.05;
      ctx.fillStyle = 'rgba(40,90,40,0.35)';
      rr(ctx, px + m, py + m + tile * 0.07, tile - 2 * m, tile - 2 * m, tile * 0.22); ctx.fill();
      var g = ctx.createLinearGradient(px, py, px, py + tile);
      g.addColorStop(0, '#5cb85e'); g.addColorStop(1, '#35803c');
      ctx.fillStyle = g;
      rr(ctx, px + m, py + m, tile - 2 * m, tile - 2 * m, tile * 0.22); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ellipse(ctx, px + tile * 0.36, py + tile * 0.3, tile * 0.16, tile * 0.1); ctx.fill();
      ellipse(ctx, px + tile * 0.66, py + tile * 0.22, tile * 0.11, tile * 0.07); ctx.fill();
      ctx.fillStyle = '#ff8fa3';
      ellipse(ctx, px + tile * 0.72, py + tile * 0.68, tile * 0.055, tile * 0.055); ctx.fill();
      ellipse(ctx, px + tile * 0.24, py + tile * 0.62, tile * 0.045, tile * 0.045); ctx.fill();
      return;
    }

    if (kind === 'pit') {
      ctx.fillStyle = '#9c6b3f';
      ellipse(ctx, px + tile / 2, py + tile / 2, tile * 0.42, tile * 0.32); ctx.fill();
      ctx.fillStyle = '#3a2a44';
      ellipse(ctx, px + tile / 2, py + tile / 2, tile * 0.35, tile * 0.25); ctx.fill();
      ctx.fillStyle = '#211631';
      ellipse(ctx, px + tile / 2, py + tile * 0.54, tile * 0.22, tile * 0.15); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = Math.max(1, tile * 0.03);
      ctx.beginPath();
      ctx.ellipse(px + tile / 2, py + tile / 2, tile * 0.38, tile * 0.28, 0, Math.PI * 1.15, Math.PI * 1.6);
      ctx.stroke();
      return;
    }

    if (kind === 'goal') {
      var pulse = 0.5 + 0.5 * Math.sin(t / 320);
      ctx.fillStyle = 'rgba(255,205,60,' + (0.25 + 0.2 * pulse).toFixed(3) + ')';
      ellipse(ctx, px + tile / 2, py + tile / 2, tile * (0.4 + 0.05 * pulse), tile * (0.4 + 0.05 * pulse)); ctx.fill();
      ctx.strokeStyle = '#ffb400';
      ctx.lineWidth = Math.max(2, tile * 0.06);
      ellipse(ctx, px + tile / 2, py + tile / 2, tile * 0.32, tile * 0.32); ctx.stroke();
      ctx.fillStyle = '#ffe066';
      ellipse(ctx, px + tile / 2, py + tile / 2, tile * 0.2, tile * 0.2); ctx.fill();
      // Lấp lánh 4 cánh ở 2 góc, luân phiên theo t.
      sparkle(ctx, px + tile * 0.22, py + tile * 0.24, tile * 0.09 * (0.6 + 0.4 * pulse));
      sparkle(ctx, px + tile * 0.8, py + tile * 0.74, tile * 0.09 * (1 - 0.4 * pulse));
    }
  }

  function sparkle(ctx, cx, cy, s) {
    if (s <= 0.5) return;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s * 0.28, cy - s * 0.28);
    ctx.lineTo(cx + s, cy); ctx.lineTo(cx + s * 0.28, cy + s * 0.28);
    ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s * 0.28, cy + s * 0.28);
    ctx.lineTo(cx - s, cy); ctx.lineTo(cx - s * 0.28, cy - s * 0.28);
    ctx.closePath(); ctx.fill();
  }

  // ---- Robot ----
  // variant: 'boy' (xanh dương) | 'girl' (hồng, nơ + váy) — trẻ chọn ở màn hình intro.
  function drawRobot(ctx, cx, cy, r, angleRad, mood, lift01, variant) {
    var girl = variant === 'girl';
    var accent = girl ? '#f472b6' : '#38a1ff';
    var lift = Math.max(0, Math.min(1, lift01 || 0));
    var now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    var shrink = mood === 'fall' ? 0.68 : 1;
    var hop = mood === 'happy' ? Math.abs(Math.sin(now / 160)) * r * 0.14 : 0;
    var tilt = mood === 'dizzy' ? Math.sin(now / 110) * 0.16 : 0;
    var yOff = -lift * r * 0.95 - hop;

    // Bóng dưới chân: nhỏ và mờ dần khi robot nhấc lên.
    ctx.fillStyle = 'rgba(30,60,30,' + (0.28 - 0.15 * lift).toFixed(3) + ')';
    ellipse(ctx, cx, cy + r * 0.98, r * (1.05 - 0.45 * lift), r * (0.26 - 0.1 * lift)); ctx.fill();

    ctx.save();
    ctx.translate(cx, cy + yOff);
    ctx.rotate(tilt);
    ctx.scale(shrink, shrink);

    // Chân.
    ctx.fillStyle = '#5b7d99';
    rr(ctx, -r * 0.52, r * 0.78, r * 0.4, r * 0.24, r * 0.1); ctx.fill();
    rr(ctx, r * 0.12, r * 0.78, r * 0.4, r * 0.24, r * 0.1); ctx.fill();
    // Tay.
    ctx.fillStyle = accent;
    ellipse(ctx, -r * 0.88, r * 0.42, r * 0.16, r * 0.3); ctx.fill();
    ellipse(ctx, r * 0.88, mood === 'happy' ? r * 0.05 : r * 0.42, r * 0.16, r * 0.3); ctx.fill();
    // Thân.
    var bg = ctx.createLinearGradient(0, -r * 0.1, 0, r * 0.9);
    bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#dceefc');
    ctx.fillStyle = bg;
    rr(ctx, -r * 0.72, r * 0.05, r * 1.44, r * 0.82, r * 0.3); ctx.fill();
    ctx.fillStyle = girl ? '#ffd3e8' : '#bfe3ff';
    rr(ctx, -r * 0.4, r * 0.28, r * 0.8, r * 0.42, r * 0.18); ctx.fill();
    if (girl) { // váy hồng xòe ở thân dưới
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, r * 0.58); ctx.lineTo(r * 0.5, r * 0.58);
      ctx.lineTo(r * 0.8, r * 0.92); ctx.lineTo(-r * 0.8, r * 0.92);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = mood === 'dizzy' ? '#ff9f43' : '#2ee6a8';
    ellipse(ctx, 0, r * 0.49, r * 0.11, r * 0.11); ctx.fill();
    // Tai nghe hai bên đầu.
    ctx.fillStyle = accent;
    rr(ctx, -r * 1.02, -r * 0.62, r * 0.2, r * 0.52, r * 0.09); ctx.fill();
    rr(ctx, r * 0.82, -r * 0.62, r * 0.2, r * 0.52, r * 0.09); ctx.fill();
    // Ăng-ten + bóng đèn.
    ctx.strokeStyle = '#5b7d99'; ctx.lineWidth = r * 0.09;
    ctx.beginPath(); ctx.moveTo(0, -r * 1.02); ctx.lineTo(0, -r * 1.3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,217,61,0.35)';
    ellipse(ctx, 0, -r * 1.42, r * 0.26, r * 0.26); ctx.fill();
    ctx.fillStyle = '#ffd93d';
    ellipse(ctx, 0, -r * 1.42, r * 0.15, r * 0.15); ctx.fill();
    // Đầu.
    var hg = ctx.createLinearGradient(0, -r * 1.05, 0, r * 0.15);
    hg.addColorStop(0, '#ffffff'); hg.addColorStop(1, '#e3f1fd');
    ctx.fillStyle = hg;
    rr(ctx, -r * 0.85, -r * 1.05, r * 1.7, r * 1.2, r * 0.38); ctx.fill();
    // Màn hình mặt.
    ctx.fillStyle = '#22344a';
    rr(ctx, -r * 0.66, -r * 0.88, r * 1.32, r * 0.9, r * 0.28); ctx.fill();

    drawFace(ctx, r, angleRad, mood);
    if (girl) { // nơ hồng ở góc trên đầu
      ctx.fillStyle = '#ec4899';
      ellipse(ctx, r * 0.37, -r * 1.15, r * 0.16, r * 0.1); ctx.fill();
      ellipse(ctx, r * 0.69, -r * 1.15, r * 0.16, r * 0.1); ctx.fill();
      ctx.fillStyle = '#db2777';
      ellipse(ctx, r * 0.53, -r * 1.15, r * 0.085, r * 0.085); ctx.fill();
    }
    ctx.restore();
  }

  function drawFace(ctx, r, angleRad, mood) {
    // Mắt lệch theo hướng nhìn để trẻ thấy robot đang ngó đường nào.
    var lx = Math.cos(angleRad) * r * 0.13, ly = Math.sin(angleRad) * r * 0.09;
    var ex = r * 0.32, ey = -r * 0.48;
    ctx.strokeStyle = '#7ef0ff'; ctx.fillStyle = '#7ef0ff';
    ctx.lineWidth = r * 0.1; ctx.lineCap = 'round';
    if (mood === 'happy') {
      ctx.beginPath(); ctx.arc(-ex + lx, ey + ly + r * 0.08, r * 0.15, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      ctx.beginPath(); ctx.arc(ex + lx, ey + ly + r * 0.08, r * 0.15, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      ctx.beginPath(); ctx.arc(lx, -r * 0.3 + ly, r * 0.16, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    } else if (mood === 'dizzy') {
      xEye(ctx, -ex + lx, ey + ly, r * 0.13);
      xEye(ctx, ex + lx, ey + ly, r * 0.13);
      ctx.beginPath(); ctx.arc(lx, -r * 0.18 + ly, r * 0.08, 0, Math.PI * 2); ctx.stroke();
    } else if (mood === 'fall') {
      ellipse(ctx, -ex + lx, ey + ly, r * 0.13, r * 0.17); ctx.fill();
      ellipse(ctx, ex + lx, ey + ly, r * 0.13, r * 0.17); ctx.fill();
      ctx.beginPath(); ctx.arc(lx, -r * 0.16 + ly, r * 0.09, 0, Math.PI * 2); ctx.stroke();
    } else {
      var eh = mood === 'run' ? r * 0.13 : r * 0.19; // run: mắt vui hơi nheo
      rr(ctx, -ex + lx - r * 0.09, ey + ly - eh / 2, r * 0.18, eh, r * 0.09); ctx.fill();
      rr(ctx, ex + lx - r * 0.09, ey + ly - eh / 2, r * 0.18, eh, r * 0.09); ctx.fill();
      ctx.beginPath(); ctx.arc(lx, -r * 0.32 + ly, r * 0.12, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
    }
    // Mũi/đèn chỉ hướng trên mặt: tam giác nhỏ quay theo angleRad.
    ctx.save();
    ctx.translate(lx * 0.4, -r * 0.42 + ly * 0.4);
    ctx.rotate(angleRad);
    ctx.fillStyle = '#ffb020';
    ctx.beginPath();
    ctx.moveTo(r * 0.55, 0); ctx.lineTo(r * 0.34, -r * 0.11); ctx.lineTo(r * 0.34, r * 0.11);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function xEye(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s);
    ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s);
    ctx.stroke();
  }

  // ---- Nhân vật bạn ----
  // variant: 0 tai tròn, 1 tai nhọn, 2 tai dài thỏ, 3 tai gấu, 4 sừng nhỏ.
  var FRIEND_COLORS = ['#f9a8c9', '#8fe3c0', '#c3b2f7', '#ffc59e', '#9fd8ff'];
  var FRIEND_BELLY = ['#ffe3ee', '#dcf7ec', '#e9e2ff', '#ffecdc', '#dff2ff'];

  function drawFriend(ctx, cx, cy, r, variant, rescued, t) {
    var v = ((variant % 5) + 5) % 5;
    var bob = rescued
      ? -Math.abs(Math.sin(t / 280 + v)) * r * 0.22
      : Math.sin(t / 480 + v * 1.7) * r * 0.05;
    var y = cy + bob;

    // Bóng.
    ctx.fillStyle = 'rgba(30,60,30,0.22)';
    ellipse(ctx, cx, cy + r * 0.92, r * 0.8, r * 0.2); ctx.fill();

    // Tai (vẽ sau thân).
    ctx.fillStyle = FRIEND_COLORS[v];
    if (v === 0 || v === 3) {
      var er = v === 3 ? r * 0.34 : r * 0.28;
      ellipse(ctx, cx - r * 0.62, y - r * 0.68, er, er); ctx.fill();
      ellipse(ctx, cx + r * 0.62, y - r * 0.68, er, er); ctx.fill();
      ctx.fillStyle = FRIEND_BELLY[v];
      ellipse(ctx, cx - r * 0.62, y - r * 0.68, er * 0.5, er * 0.5); ctx.fill();
      ellipse(ctx, cx + r * 0.62, y - r * 0.68, er * 0.5, er * 0.5); ctx.fill();
    } else if (v === 1) {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.78, y - r * 0.45); ctx.lineTo(cx - r * 0.5, y - r * 1.15); ctx.lineTo(cx - r * 0.18, y - r * 0.62);
      ctx.moveTo(cx + r * 0.78, y - r * 0.45); ctx.lineTo(cx + r * 0.5, y - r * 1.15); ctx.lineTo(cx + r * 0.18, y - r * 0.62);
      ctx.closePath(); ctx.fill();
    } else if (v === 2) {
      ellipse(ctx, cx - r * 0.38, y - r * 1.05, r * 0.2, r * 0.52); ctx.fill();
      ellipse(ctx, cx + r * 0.38, y - r * 1.05, r * 0.2, r * 0.52); ctx.fill();
      ctx.fillStyle = FRIEND_BELLY[v];
      ellipse(ctx, cx - r * 0.38, y - r * 1.05, r * 0.1, r * 0.32); ctx.fill();
      ellipse(ctx, cx + r * 0.38, y - r * 1.05, r * 0.1, r * 0.32); ctx.fill();
    } else {
      ctx.fillStyle = '#ffd93d';
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.62, y - r * 0.55); ctx.quadraticCurveTo(cx - r * 0.85, y - r * 1.05, cx - r * 0.4, y - r * 1.0);
      ctx.moveTo(cx + r * 0.62, y - r * 0.55); ctx.quadraticCurveTo(cx + r * 0.85, y - r * 1.05, cx + r * 0.4, y - r * 1.0);
      ctx.closePath(); ctx.fill();
    }
    // Thân tròn + bụng sáng.
    ctx.fillStyle = FRIEND_COLORS[v];
    ellipse(ctx, cx, y, r * 0.82, r * 0.88); ctx.fill();
    ctx.fillStyle = FRIEND_BELLY[v];
    ellipse(ctx, cx, y + r * 0.34, r * 0.48, r * 0.42); ctx.fill();
    // Tay vẫy khi đã cứu.
    ctx.fillStyle = FRIEND_COLORS[v];
    if (rescued) {
      ellipse(ctx, cx - r * 0.9, y - r * 0.35, r * 0.15, r * 0.26); ctx.fill();
      ellipse(ctx, cx + r * 0.9, y - r * 0.35, r * 0.15, r * 0.26); ctx.fill();
    }
    // Mặt cười.
    ctx.fillStyle = '#4a3444';
    ellipse(ctx, cx - r * 0.3, y - r * 0.18, r * 0.085, r * 0.12); ctx.fill();
    ellipse(ctx, cx + r * 0.3, y - r * 0.18, r * 0.085, r * 0.12); ctx.fill();
    ctx.strokeStyle = '#4a3444'; ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, y + r * 0.02, r * 0.26, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
    ctx.fillStyle = 'rgba(255,110,140,0.55)';
    ellipse(ctx, cx - r * 0.52, y + r * 0.08, r * 0.13, r * 0.08); ctx.fill();
    ellipse(ctx, cx + r * 0.52, y + r * 0.08, r * 0.13, r * 0.08); ctx.fill();

    if (!rescued) {
      // Bong bóng kính bao quanh + điểm sáng.
      ctx.fillStyle = 'rgba(180,225,255,0.16)';
      ellipse(ctx, cx, cy - r * 0.1, r * 1.3, r * 1.3); ctx.fill();
      ctx.strokeStyle = 'rgba(230,248,255,0.85)';
      ctx.lineWidth = Math.max(1.5, r * 0.06);
      ellipse(ctx, cx, cy - r * 0.1, r * 1.3, r * 1.3); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = Math.max(2, r * 0.09);
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.1, r * 1.14, r * 1.14, 0, Math.PI * 1.15, Math.PI * 1.5);
      ctx.stroke();
    }
  }

  var CMArt = { drawTile: drawTile, drawRobot: drawRobot, drawFriend: drawFriend };
  globalThis.CMArt = CMArt;
  if (typeof module !== 'undefined' && module.exports) module.exports = CMArt;
})();
