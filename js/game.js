// Coding Maze Rescue — controller: vòng đời game, animation theo event của engine, tiến trình.
// Luật chơi nằm ở engine.js; file này chỉ trình diễn và điều phối.
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var DIRS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
  var DIR_ANGLE = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
  var ERR_MSG = {
    'wall': 'Ối! Robot đụng vào tường rồi. Hãy nhìn khối lệnh đang sáng và sửa lại nhé!',
    'pit': 'Tõm! Robot rơi xuống hố. Muốn qua hố, em hãy dùng lệnh Nhảy nhé!',
    'jump-no-pit': 'Ơ, phía trước không có hố nào để nhảy qua cả!',
    'jump-bad-land': 'Nhảy tới chỗ đó không an toàn đâu! Chỗ đáp phải là sàn trống nhé.',
    'step-limit': 'Chương trình dài quá, Robot mệt rồi! Hãy thử dùng Lặp lại cho ngắn nhé.'
  };

  // ---------- trạng thái ----------
  var store = null;
  try { store = CMStorage.create(window.localStorage); } catch (e) { store = CMStorage.create(null); }
  var progress = store.load();
  if (progress.levelsVersion !== 2) { // V7.2: đánh dấu dữ liệu đã sang bộ màn mới (giữ nguyên màn đã mở/đã xong, robot đã chọn)
    progress.levelsVersion = 2;
    store.save(progress);
  }
  var robot = progress.robot || null; // {gender:'boy'|'girl', name} — trẻ chọn ở intro
  var level = null, parsed = null, levelIdx = 0;
  var editor = null;
  var executor = null, running = false, paused = false, stepBusy = false, runSeq = 0;
  var speed = 1;
  var rx = 0, ry = 0, angle = 0, mood = 'idle', lift = 0, rescued = false, wonPose = false;
  var particles = [];
  var loading = false;

  var canvas = $('board'), ctx = canvas.getContext('2d');
  var tile = 40;

  // ---------- âm thanh ----------
  function syncSoundBtn() { $('btnSound').textContent = CMAudio.isOn() ? '🔊 Tiếng: Bật' : '🔇 Tiếng: Tắt'; }
  if (progress.sound === false && CMAudio.isOn()) CMAudio.toggle();

  // ---------- editor ----------
  editor = CMEditor.create({
    palette: $('palette'), program: $('program'), blockCount: $('blockCount'),
    targetNote: $('targetNote'), selBar: $('selBar'), selName: $('selName'),
    actLeft: $('actLeft'), actRight: $('actRight'), actMinus: $('actMinus'),
    actPlus: $('actPlus'), actTarget: $('actTarget'), actDelete: $('actDelete')
  }, {
    onChange: function () {
      if (loading) return;
      if (executor || rescued) { stopRun(); setStatus('Đã sửa chương trình — bấm RUN để Robot thử lại nhé!'); }
      hideWin();
    },
    onTooMany: function (max) {
      setStatus('Màn này chỉ được dùng tối đa ' + max + ' khối thôi. Hãy dùng khối Lặp lại để gom các lệnh giống nhau nhé!');
      CMAudio.error();
    }
  });

  // ---------- level ----------
  function firstUnfinished() {
    for (var i = 0; i < CMLevels.length; i++) if (progress.done.indexOf(CMLevels[i].n) === -1) return i;
    return 0;
  }
  function loadLevel(idx) {
    loading = true;
    stopRun();
    levelIdx = Math.max(0, Math.min(CMLevels.length - 1, idx));
    level = CMLevels[levelIdx];
    parsed = CMEngine.parseLevel(level);
    robotToStart(); // đặt robot về ô xuất phát của màn MỚI (stopRun ở trên chỉ biết màn cũ)
    editor.loadLevel(level);
    $('levelTitle').textContent = 'Màn ' + level.n + ': ' + level.name;
    var badges = ['Bạn cần cứu: ' + level.friend];
    if (level.prefill) badges.push('✎ Màn sửa lỗi');
    if (level.maxBlocks) badges.push('⎘ Tối đa ' + level.maxBlocks + ' khối');
    $('levelBadge').textContent = badges.join('  •  ');
    $('storyText').textContent = personalize(level.story);
    $('hintText').textContent = personalize(level.hint);
    hideWin();
    fitCanvas();
    setStatus(level.prefill
      ? 'Chương trình có sẵn đang bị sai. Bấm RUN xem Robot sai ở đâu, rồi sửa lại nhé!'
      : 'Sẵn sàng! Thêm lệnh ở bên phải (hoặc bên dưới), rồi bấm RUN nhé.');
    $('repeatStatus').textContent = '';
    loading = false;
  }
  function robotToStart() {
    rx = parsed.start.x; ry = parsed.start.y;
    angle = DIR_ANGLE[parsed.start.dir];
    mood = 'idle'; lift = 0; rescued = false; wonPose = false; particles = [];
  }

  // ---------- canvas ----------
  function fitCanvas() {
    if (!parsed) return;
    var boxW = $('canvasBox').clientWidth - 4;
    tile = Math.max(26, Math.min(Math.floor(boxW / Math.max(parsed.w, parsed.h)), 72));
    var dpr = window.devicePixelRatio || 1;
    canvas.width = tile * parsed.w * dpr;
    canvas.height = tile * parsed.h * dpr;
    canvas.style.width = tile * parsed.w + 'px';
    canvas.style.height = tile * parsed.h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', fitCanvas);

  function draw(now) {
    if (parsed) {
      var t = now / 1000;
      ctx.clearRect(0, 0, tile * parsed.w, tile * parsed.h);
      for (var y = 0; y < parsed.h; y++) for (var x = 0; x < parsed.w; x++) {
        CMArt.drawTile(ctx, parsed.cell(x, y), x * tile, y * tile, tile, t);
      }
      var gx = (parsed.goal.x + 0.5) * tile, gy = (parsed.goal.y + 0.5) * tile;
      if (wonPose) gx += tile * 0.26;
      CMArt.drawFriend(ctx, gx, gy, tile * 0.32, (level.n - 1) % 5, rescued, t);
      var px = (rx + 0.5) * tile, py = (ry + 0.5) * tile;
      if (wonPose) px -= tile * 0.24;
      CMArt.drawRobot(ctx, px, py, tile * 0.34, angle, mood, lift, robot ? robot.gender : 'boy');
      drawParticles(now);
    }
    requestAnimationFrame(draw);
  }
  function drawParticles(now) {
    particles = particles.filter(function (p) { return now - p.born < p.life; });
    particles.forEach(function (p) {
      var dt = (now - p.born) / 1000;
      var x = p.x + p.vx * dt, y = p.y + p.vy * dt + 130 * dt * dt;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - (now - p.born) / p.life);
      ctx.fillStyle = p.color;
      ctx.translate(x, y); ctx.rotate(p.rot + dt * 4);
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
      ctx.restore();
    });
  }
  function confetti(cx, cy) {
    var colors = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#eab308'];
    for (var i = 0; i < 60; i++) {
      particles.push({
        x: cx, y: cy, born: performance.now(), life: 1100 + Math.random() * 700,
        vx: (Math.random() - 0.5) * 260, vy: -(90 + Math.random() * 190),
        s: 6 + Math.random() * 7, rot: Math.random() * 3, color: colors[i % colors.length]
      });
    }
  }

  // ---------- danh tính robot ----------
  // Mọi câu chữ trong game viết sẵn với từ "Robot" (dữ liệu màn, thông báo) —
  // hàm này thay bằng tên trẻ đã đặt, tại đúng một chỗ nên không sót chỗ nào.
  function personalize(text) {
    if (!text) return text;
    var name = robot ? robot.name : 'Robot';
    return String(text).split('Robot Bíp').join(name).split('Robot').join(name);
  }
  function applyIdentity() {
    if (!robot) return;
    $('tagline').textContent = 'Lập trình cho ' + robot.name + ', giải cứu các bạn!';
    $('runTitle').textContent = '3. Cho ' + robot.name + ' chạy!';
  }
  var introSel = 'boy';
  function defaultName(g) { return g === 'girl' ? 'Bông' : 'Bíp'; }
  function markIntroSel() {
    $('introBoy').classList.toggle('selected', introSel === 'boy');
    $('introGirl').classList.toggle('selected', introSel === 'girl');
    $('robotNameInput').placeholder = 'Tên gợi ý: ' + defaultName(introSel);
  }
  function drawPreviews() {
    [['introCvBoy', 'boy'], ['introCvGirl', 'girl']].forEach(function (pair) {
      var cv = $(pair[0]);
      var c2 = cv.getContext('2d');
      c2.clearRect(0, 0, cv.width, cv.height);
      CMArt.drawRobot(c2, cv.width / 2, cv.height / 2 + 6, 30, -0.45, 'happy', 0, pair[1]);
    });
  }
  function openIntro() {
    introSel = robot ? robot.gender : 'boy';
    $('robotNameInput').value = robot ? robot.name : '';
    $('btnStartIntro').textContent = robot ? '✓ Lưu và chơi tiếp' : '▶ Bắt đầu phiêu lưu!';
    markIntroSel();
    $('introModal').classList.remove('hidden');
    drawPreviews();
  }
  function closeIntroSave() {
    var name = $('robotNameInput').value.trim().replace(/[<>]/g, '').slice(0, 12);
    if (!name) name = defaultName(introSel);
    robot = { gender: introSel, name: name };
    progress.robot = robot;
    store.save(progress);
    $('introModal').classList.add('hidden');
    applyIdentity();
    loadLevel(levelIdx); // nạp lại màn để story/gợi ý/thông báo dùng ngay tên mới
    CMAudio.pop();
  }
  $('introBoy').addEventListener('click', function () { introSel = 'boy'; markIntroSel(); CMAudio.click(); });
  $('introGirl').addEventListener('click', function () { introSel = 'girl'; markIntroSel(); CMAudio.click(); });
  $('btnStartIntro').addEventListener('click', closeIntroSave);
  $('btnChangeRobot').addEventListener('click', function () { CMAudio.click(); openIntro(); });

  // Gợi ý xoay ngang: chỉ hiện ở điện thoại dọc (CSS), bấm "Đã hiểu" là tắt hẳn các lần sau.
  try {
    if (localStorage.getItem('cmr.hideRotate') === '1') $('rotateHint').classList.add('hidden');
  } catch (e) {}
  $('btnHideRotate').addEventListener('click', function () {
    $('rotateHint').classList.add('hidden');
    try { localStorage.setItem('cmr.hideRotate', '1'); } catch (e) {}
  });

  // ---------- thực thi ----------
  function setStatus(msg) { $('statusMsg').textContent = personalize(msg); }
  function setRunLabel() {
    $('btnRun').textContent = running ? (paused ? '▶ Chạy tiếp' : '⏸ Tạm dừng') : '▶ RUN';
  }
  function dur(base) { return base / speed; }

  function tween(ms, fn, token) {
    return new Promise(function (resolve) {
      var start = null, pauseAt = null, pauseAcc = 0;
      function frame(ts) {
        if (token !== runSeq) { resolve(false); return; }
        if (paused) { if (pauseAt === null) pauseAt = ts; requestAnimationFrame(frame); return; }
        if (pauseAt !== null) { pauseAcc += ts - pauseAt; pauseAt = null; }
        if (start === null) start = ts;
        var k = (ts - start - pauseAcc) / ms;
        if (k >= 1) { fn(1); resolve(true); return; }
        fn(Math.max(0, k));
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  function animateEvent(ev, token, quick) {
    var f = ev.from, to = ev.to || ev.from;
    var cmdLabel = CMEditor.LABELS[ev.cmd] || ev.cmd;
    var extra = ev.repeat ? ' (Lặp: vòng ' + ev.repeat.iter + '/' + ev.repeat.count + ')' : '';
    $('repeatStatus').textContent = 'Đang chạy lệnh: ' + cmdLabel + extra;
    editor.highlight(ev.blockId, ev.repeat);

    if (ev.kind === 'turn') {
      var a0 = DIR_ANGLE[f.dir], a1 = DIR_ANGLE[to.dir];
      var delta = ((a1 - a0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      CMAudio.turn();
      return tween(dur(quick ? 160 : 240), function (k) { angle = a0 + delta * k; mood = 'run'; }, token)
        .then(function (ok) { if (ok) { angle = a1; mood = 'idle'; } return ok; });
    }
    if (ev.kind === 'jump') {
      CMAudio.jump();
      return tween(dur(quick ? 220 : 400), function (k) {
        rx = f.x + (to.x - f.x) * k; ry = f.y + (to.y - f.y) * k;
        lift = Math.sin(Math.PI * k) * 0.85; mood = 'run';
      }, token).then(function (ok) { if (ok) { rx = to.x; ry = to.y; lift = 0; mood = 'idle'; } return ok; });
    }
    if (ev.kind === 'error') {
      return animateError(ev, token, quick);
    }
    // move thường
    CMAudio.step();
    return tween(dur(quick ? 200 : 320), function (k) {
      rx = f.x + (to.x - f.x) * k; ry = f.y + (to.y - f.y) * k; mood = 'run';
    }, token).then(function (ok) { if (ok) { rx = to.x; ry = to.y; mood = 'idle'; } return ok; });
  }

  function animateError(ev, token, quick) {
    var f = ev.from;
    var vec = DIRS[f.dir];
    if (ev.error === 'wall') {
      var bx = f.x + vec.x * 0.32, by = f.y + vec.y * 0.32;
      return tween(dur(quick ? 240 : 420), function (k) {
        var s = Math.sin(Math.PI * Math.min(1, k * 1.15));
        rx = f.x + (bx - f.x) * s; ry = f.y + (by - f.y) * s;
        mood = k > 0.35 ? 'dizzy' : 'run';
      }, token).then(function (ok) { if (ok) { rx = f.x; ry = f.y; } return ok; });
    }
    if (ev.error === 'pit') {
      var p = ev.to || { x: f.x + vec.x, y: f.y + vec.y };
      return tween(dur(quick ? 260 : 460), function (k) {
        rx = f.x + (p.x - f.x) * k; ry = f.y + (p.y - f.y) * k;
        mood = k > 0.45 ? 'fall' : 'run';
      }, token).then(function (ok) { return ok; });
    }
    // jump-no-pit / jump-bad-land / step-limit: nhún tại chỗ + choáng
    return tween(dur(quick ? 240 : 420), function (k) {
      lift = Math.sin(Math.PI * k) * 0.35; mood = k > 0.4 ? 'dizzy' : 'run';
    }, token).then(function (ok) { if (ok) lift = 0; return ok; });
  }

  function startExecutor() {
    if (editor.isEmpty()) {
      setStatus('Chương trình chưa có lệnh nào. Hãy chạm vào các nút lệnh để thêm trước nhé!');
      return false;
    }
    runSeq += 1;
    robotToStart();
    executor = CMEngine.createExecutor(level, editor.getProgram());
    editor.setLocked(true);
    hideWin();
    paused = false;
    return true;
  }
  function stopRun() {
    runSeq += 1;
    executor = null; running = false; paused = false; stepBusy = false;
    editor.setLocked(false);
    editor.clearHighlight();
    if (parsed) robotToStart();
    setRunLabel();
  }
  function finishRun() {
    executor = null; running = false; paused = false;
    editor.setLocked(false);
    setRunLabel();
  }

  async function playLoop(token) {
    running = true; setRunLabel();
    while (executor && token === runSeq) {
      if (paused) { await new Promise(function (r) { setTimeout(r, 90); }); continue; }
      var ev = executor.next();
      if (!ev) break;
      if (ev.kind === 'end') { onIncomplete(); break; }
      var ok = await animateEvent(ev, token, false);
      if (!ok || token !== runSeq) return;
      if (ev.kind === 'error') { onError(ev); break; }
      if (ev.win) { onWin(); break; }
    }
    if (token === runSeq && running && !executor) { running = false; setRunLabel(); }
    if (token === runSeq) { running = false; setRunLabel(); }
  }

  function onError(ev) {
    CMAudio.error();
    mood = ev.error === 'pit' ? 'fall' : 'dizzy';
    setStatus(ERR_MSG[ev.error] || 'Robot gặp lỗi rồi. Hãy sửa chương trình và thử lại nhé!');
    $('repeatStatus').textContent = 'Lệnh gây lỗi đang được tô sáng màu đỏ. Sửa xong bấm RUN lại nhé!';
    finishRun();
  }
  function onIncomplete() {
    mood = 'idle';
    setStatus('Robot đã chạy hết lệnh nhưng chưa tới được chỗ bạn. Hãy thêm lệnh, hoặc sửa lại chương trình nhé!');
    $('repeatStatus').textContent = '';
    finishRun();
  }
  function onWin() {
    mood = 'happy'; rescued = true; wonPose = true;
    CMAudio.pop();
    setTimeout(function () { CMAudio.win(); }, 120);
    confetti((parsed.goal.x + 0.5) * tile, (parsed.goal.y + 0.5) * tile);
    if (progress.done.indexOf(level.n) === -1) progress.done.push(level.n);
    progress.unlocked = Math.max(progress.unlocked, Math.min(CMLevels.length, level.n + 1));
    progress.sound = CMAudio.isOn();
    store.save(progress);
    setStatus('Tuyệt vời! Robot đã tới nơi an toàn!');
    $('repeatStatus').textContent = '';
    $('winText').textContent = 'Em đã cứu được ' + level.friend + '! Đã cứu ' + progress.done.length + '/' + CMLevels.length + ' bạn.';
    $('btnNext').style.display = level.n >= CMLevels.length ? 'none' : '';
    if (level.n >= CMLevels.length) $('winText').textContent += ' Em đã hoàn thành tất cả các màn — nhà lập trình nhí siêu đẳng!';
    finishRun();
    setTimeout(function () { $('winPanel').classList.remove('hidden'); }, 700);
  }
  function hideWin() { $('winPanel').classList.add('hidden'); }

  // ---------- nút điều khiển ----------
  $('btnRun').addEventListener('click', function () {
    if (stepBusy) return;
    if (!executor) { if (!startExecutor()) return; playLoop(runSeq); return; }
    if (running && !paused) { paused = true; setRunLabel(); setStatus('Đã tạm dừng. Bấm "Chạy tiếp" khi em sẵn sàng.'); return; }
    if (paused) { paused = false; setRunLabel(); return; }
    playLoop(runSeq); // tiếp tục sau khi dùng Từng bước
  });
  $('btnStep').addEventListener('click', async function () {
    if (running || stepBusy) return;
    if (!executor) { if (!startExecutor()) return; }
    stepBusy = true;
    var token = runSeq;
    var ev = executor.next();
    if (!ev || ev.kind === 'end') { onIncomplete(); stepBusy = false; return; }
    var ok = await animateEvent(ev, token, true);
    stepBusy = false;
    if (!ok) return;
    if (ev.kind === 'error') { onError(ev); return; }
    if (ev.win) { onWin(); return; }
    setStatus('Đang ở ô (' + (executor.state.x + 1) + ', ' + (executor.state.y + 1) + '). Bấm Từng bước để đi tiếp, hoặc RUN để chạy hết.');
  });
  $('btnReset').addEventListener('click', function () {
    stopRun(); hideWin();
    setStatus('Đã đưa Robot về chỗ xuất phát. Sửa chương trình rồi bấm RUN nhé!');
    $('repeatStatus').textContent = '';
  });
  $('btnClear').addEventListener('click', function () { editor.clear(); });
  $('spd1').addEventListener('click', function () { speed = 1; $('spd1').classList.add('on'); $('spd2').classList.remove('on'); });
  $('spd2').addEventListener('click', function () { speed = 2; $('spd2').classList.add('on'); $('spd1').classList.remove('on'); });
  $('btnSound').addEventListener('click', function () {
    var on = CMAudio.toggle();
    progress.sound = on; store.save(progress); syncSoundBtn();
    if (on) CMAudio.click();
  });
  $('btnNext').addEventListener('click', function () { CMAudio.click(); loadLevel(levelIdx + 1); });
  $('btnReplay').addEventListener('click', function () { CMAudio.click(); loadLevel(levelIdx); });

  // ---------- chọn màn ----------
  function renderLevelGrid() {
    $('progressText').textContent = 'Đã cứu ' + progress.done.length + '/' + CMLevels.length + ' bạn • Đã mở ' + progress.unlocked + ' màn';
    var grid = $('levelGrid'); grid.innerHTML = '';
    CMLevels.forEach(function (lv, i) {
      var b = document.createElement('button');
      b.type = 'button';
      var lockedLv = lv.n > progress.unlocked;
      var done = progress.done.indexOf(lv.n) !== -1;
      b.className = 'lv-btn' + (done ? ' done' : '') + (i === levelIdx ? ' current' : '');
      b.disabled = lockedLv;
      b.innerHTML = '<span class="lv-num">' + (lockedLv ? '🔒' : lv.n) + '</span>' +
        '<span class="lv-name">' + lv.name + '</span>' +
        '<span class="lv-friend">' + (done ? '✓ Đã cứu ' : 'Bạn: ') + lv.friend + '</span>';
      b.addEventListener('click', function () { $('levelModal').classList.add('hidden'); loadLevel(i); });
      grid.appendChild(b);
    });
  }
  $('btnLevels').addEventListener('click', function () { renderLevelGrid(); $('levelModal').classList.remove('hidden'); CMAudio.click(); });
  $('btnCloseLevels').addEventListener('click', function () { $('levelModal').classList.add('hidden'); });
  $('levelModal').addEventListener('click', function (e) { if (e.target === this) this.classList.add('hidden'); });

  // ---------- khởi động ----------
  syncSoundBtn();
  loadLevel(firstUnfinished());
  applyIdentity();
  requestAnimationFrame(draw);
  if (!robot) openIntro(); // lần đầu chơi: chọn robot + đặt tên trước khi bắt đầu
})();
