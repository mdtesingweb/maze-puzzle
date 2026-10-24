// Coding Maze Rescue — test hồi quy giao diện bằng DOM stub (Node thuần, không dependency).
// Kiểm tra vị trí robot ngay khi mở màn và khi chuyển màn (lỗi 2026-10-23:
// robot nằm trên tường ở màn 1, nằm đè lên bạn ở màn 3 vì loadLevel không đặt lại robot).
// Chạy: node tests/run-ui-test.js
'use strict';
var path = require('path');
var ROOT = path.join(__dirname, '..');

var results = [];
function check(name, cond, extra) {
  results.push({ name: name, ok: !!cond });
  console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : (extra ? ' — ' + extra : '')));
}

// ---------- DOM stub tối thiểu ----------
var CTX = { clearRect: function () {}, save: function () {}, restore: function () {}, translate: function () {}, rotate: function () {}, fillRect: function () {}, setTransform: function () {} };
function El(tag) {
  this.tagName = tag || 'div'; this.children = []; this.listeners = {}; this.style = {};
  this.dataset = {}; this._classes = new Set(); this.textContent = ''; this.innerHTML = '';
  this.disabled = false; this.clientWidth = 600; this.width = 0; this.height = 0;
  var self = this;
  this.classList = {
    add: function () { for (var i = 0; i < arguments.length; i++) self._classes.add(arguments[i]); },
    remove: function () { for (var i = 0; i < arguments.length; i++) self._classes.delete(arguments[i]); },
    toggle: function (c, f) { if (f === undefined) f = !self._classes.has(c); if (f) self._classes.add(c); else self._classes.delete(c); return f; },
    contains: function (c) { return self._classes.has(c); }
  };
}
El.prototype.appendChild = function (c) { this.children.push(c); return c; };
El.prototype.addEventListener = function (t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); };
El.prototype.click = function () { var self = this; (this.listeners.click || []).slice().forEach(function (f) { f({ target: self }); }); };
El.prototype.querySelectorAll = function () { return []; };
El.prototype.querySelector = function () { return null; };
El.prototype.scrollIntoView = function () {};
El.prototype.getContext = function () { return CTX; };
Object.defineProperty(El.prototype, 'className', {
  get: function () { return Array.from(this._classes).join(' '); },
  set: function (v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
});
Object.defineProperty(El.prototype, 'innerHTML', {
  get: function () { return this._html || ''; },
  set: function (v) { this._html = String(v); if (!v) this.children.length = 0; } // gán '' là xóa con, như DOM thật
});

var byId = {};
var documentStub = {
  getElementById: function (id) { if (!byId[id]) byId[id] = new El(id === 'board' ? 'canvas' : 'div'); return byId[id]; },
  createElement: function (t) { return new El(t); }
};

var rafQ = [];
globalThis.window = globalThis;
globalThis.document = documentStub;
globalThis.devicePixelRatio = 1;
globalThis.addEventListener = function () {};
globalThis.requestAnimationFrame = function (cb) { rafQ.push(cb); return rafQ.length; };
globalThis.localStorage = {
  _d: {}, 
  getItem: function (k) { return k in this._d ? this._d[k] : null; },
  setItem: function (k, v) { this._d[k] = String(v); },
  removeItem: function (k) { delete this._d[k]; }
};
// Mở khóa cả 15 màn để test chuyển màn tự do
globalThis.localStorage.setItem('codingMazeRescue.progress.v1', JSON.stringify({ unlocked: 15, done: [], sound: true }));

// ---------- nạp module thật, thay art/audio bằng bản ghi ----------
require(path.join(ROOT, 'js/engine.js'));
require(path.join(ROOT, 'js/levels.js'));
require(path.join(ROOT, 'js/storage.js'));
var robotCalls = [];
globalThis.CMArt = {
  drawTile: function () {},
  drawFriend: function () {},
  drawRobot: function (ctx, cx, cy, r, angle, mood, lift, variant) { robotCalls.push({ cx: cx, cy: cy, angle: angle, mood: mood, variant: variant }); }
};
globalThis.CMAudio = { isOn: function () { return true; }, toggle: function () { return true; }, click: function () {}, step: function () {}, turn: function () {}, jump: function () {}, error: function () {}, win: function () {}, pop: function () {} };
require(path.join(ROOT, 'js/editor.js'));
require(path.join(ROOT, 'js/game.js'));

function pumpFrame(ts) {
  var cbs = rafQ.splice(0, rafQ.length);
  cbs.forEach(function (cb) { cb(ts); });
}
function lastRobot() { return robotCalls[robotCalls.length - 1]; }
// tile ở stub: canvasBox clientWidth 600 → tile = min(floor(596/max(w,h)), 72) = 72 với mọi màn ở đây
var TILE = 72;
function center(x, y) { return { cx: (x + 0.5) * TILE, cy: (y + 0.5) * TILE }; }

// 1) Ngay khi mở game (màn 1): robot phải đứng ở ô xuất phát (1,1), quay mặt Đông
pumpFrame(1000);
var r1 = lastRobot(), c1 = center(1, 1);
check('Mở game: robot ở ô xuất phát màn 1 (không phải góc tường 0,0)',
  r1 && r1.cx === c1.cx && r1.cy === c1.cy && Math.abs(r1.angle - 0) < 1e-9,
  r1 ? 'robot tại (' + r1.cx + ',' + r1.cy + ') góc ' + r1.angle : 'chưa vẽ robot');

// 2) Chuyển sang màn 3: robot phải về ô xuất phát màn 3 (1,3) — không nằm đè lên bạn ở (1,1)
byId.btnLevels.click();
var gridBtns = byId.levelGrid.children.slice(-15);
gridBtns[2].click();
pumpFrame(2000);
var r3 = lastRobot(), c3 = center(1, 3);
check('Chuyển màn 3: robot ở ô xuất phát (1,3), không đè lên Thỏ Bông ở (1,1)',
  r3 && r3.cx === c3.cx && r3.cy === c3.cy,
  r3 ? 'robot tại (' + r3.cx + ',' + r3.cy + '), kỳ vọng (' + c3.cx + ',' + c3.cy + ')' : 'chưa vẽ robot');

// 3) Chuyển sang màn 5 (xuất phát quay mặt Nam): robot đúng ô + đúng hướng Nam
byId.btnLevels.click();
gridBtns = byId.levelGrid.children.slice(-15);
gridBtns[4].click();
pumpFrame(3000);
var r5 = lastRobot(), c5 = center(1, 1);
check('Chuyển màn 5: robot ở ô xuất phát và quay mặt Nam',
  r5 && r5.cx === c5.cx && r5.cy === c5.cy && Math.abs(r5.angle - Math.PI / 2) < 1e-9,
  r5 ? 'robot tại (' + r5.cx + ',' + r5.cy + ') góc ' + r5.angle : 'chưa vẽ robot');

// 4) moveBlock (hàm lõi của tính năng kéo khối): đổi thứ tự + chuyển giữa các danh sách
var MB = globalThis.CMEditor.moveBlock;
function mkProg() {
  return [
    { id: 'a', type: 'MOVE' },
    { id: 'r', type: 'REPEAT', count: 2, body: [{ id: 'b', type: 'MOVE' }, { id: 'c', type: 'JUMP' }] },
    { id: 'd', type: 'LEFT' }
  ];
}
function ids(list) { return list.map(function (b) { return b.id; }).join(','); }
var p1 = mkProg();
check('moveBlock: kéo khối lên đầu danh sách', MB(p1, 'd', null, 0) && ids(p1) === 'd,a,r', ids(p1));
function repBody(p, id) { var found = null; (function walk(l) { l.forEach(function (b) { if (b.id === id) found = b; if (b.type === 'REPEAT') walk(b.body || []); }); })(p); return found ? ids(found.body) : 'NONE'; }
var p2 = mkProg();
check('moveBlock: kéo khối vào trong REPEAT', MB(p2, 'a', 'r', 1) && repBody(p2, 'r') === 'b,a,c' && ids(p2) === 'r,d', ids(p2) + ' | body: ' + repBody(p2, 'r'));
var p3 = mkProg();
check('moveBlock: kéo khối từ REPEAT ra ngoài', MB(p3, 'c', null, 1) && ids(p3) === 'a,c,r,d' && repBody(p3, 'r') === 'b', ids(p3));
var p4 = mkProg();
check('moveBlock: chặn thả REPEAT vào chính nó', MB(p4, 'r', 'r', 0) === false && ids(p4) === 'a,r,d', ids(p4));
var p5 = [{ id: 'r1', type: 'REPEAT', count: 2, body: [] }, { id: 'r2', type: 'REPEAT', count: 2, body: [] }];
check('moveBlock: REPEAT phẳng kéo vào REPEAT phẳng = lồng 2 cấp, được phép', MB(p5, 'r2', 'r1', 0) === true && repBody(p5, 'r1') === 'r2' && ids(p5) === 'r1', ids(p5) + ' | body r1: ' + repBody(p5, 'r1'));
function mkNested() {
  return [
    { id: 'o', type: 'REPEAT', count: 2, body: [{ id: 'i', type: 'REPEAT', count: 2, body: [{ id: 'm', type: 'MOVE' }] }] },
    { id: 'f', type: 'REPEAT', count: 2, body: [] },
    { id: 'x', type: 'MOVE' }
  ];
}
var p8 = mkNested();
check('moveBlock: chặn cấp 3 — REPEAT phẳng vào REPEAT đã lồng sẵn', MB(p8, 'f', 'i', 0) === false && ids(p8) === 'o,f,x', ids(p8));
var p9 = mkNested();
check('moveBlock: chặn cấp 3 — REPEAT đã lồng vào REPEAT khác', MB(p9, 'o', 'f', 0) === false && ids(p9) === 'o,f,x', ids(p9));
var p10 = mkNested();
check('moveBlock: chặn thả REPEAT vào ruột của chính nó', MB(p10, 'o', 'i', 0) === false && ids(p10) === 'o,f,x', ids(p10));
var p11 = mkNested();
check('moveBlock: lệnh thường vào REPEAT cấp 2 vẫn được', MB(p11, 'x', 'i', 1) === true && repBody(p11, 'i') === 'm,x', repBody(p11, 'i'));
var p12 = mkNested();
check('moveBlock: kéo REPEAT con ra cấp cao nhất vẫn được', MB(p12, 'i', null, 2) === true && ids(p12) === 'o,f,i,x', ids(p12));
var p6 = mkProg();
check('moveBlock: index quá lớn thì kẹp về cuối', MB(p6, 'a', null, 99) && ids(p6) === 'r,d,a', ids(p6));
var p7 = mkProg();
check('moveBlock: đổi thứ tự ngay trong thân REPEAT', MB(p7, 'c', 'r', 0) && repBody(p7, 'r') === 'c,b', repBody(p7, 'r'));

// 5) Intro chọn robot + đặt tên: hiện khi chưa chọn, lưu lựa chọn, thay tên vào story, robot đổi hình
check('Intro: mở game lần đầu có vẽ xem trước cả robot Nữ (intro tự mở)',
  robotCalls.some(function (c) { return c.variant === 'girl'; }),
  'không thấy lần vẽ nào với variant girl');
byId.introGirl.click();
byId.robotNameInput.value = 'Miu';
byId.btnStartIntro.click();
var saved = JSON.parse(globalThis.localStorage.getItem('codingMazeRescue.progress.v1'));
check('Intro: lựa chọn robot được lưu vào tiến trình',
  saved.robot && saved.robot.gender === 'girl' && saved.robot.name === 'Miu',
  JSON.stringify(saved.robot));
check('Intro: story dùng tên trẻ đặt thay cho chữ Robot',
  byId.storyText.textContent.indexOf('Miu') !== -1 && byId.storyText.textContent.indexOf('Robot') === -1,
  byId.storyText.textContent);
check('Intro: đóng intro sau khi lưu', byId.introModal._classes.has('hidden'), 'intro vẫn mở');
pumpFrame(4000);
var rG = lastRobot();
check('Intro: robot trên bàn chơi đã đổi sang hình Nữ', rG && rG.variant === 'girl', rG ? 'variant=' + rG.variant : 'chưa vẽ');
// Đổi lại robot Nam, để trống tên → nhận tên gợi ý mặc định
byId.btnChangeRobot.click();
byId.introBoy.click();
byId.robotNameInput.value = '';
byId.btnStartIntro.click();
var saved2 = JSON.parse(globalThis.localStorage.getItem('codingMazeRescue.progress.v1'));
check('Intro: đổi robot + tên trống thì dùng tên gợi ý (Bíp)',
  saved2.robot && saved2.robot.gender === 'boy' && saved2.robot.name === 'Bíp' && byId.tagline.textContent.indexOf('Bíp') !== -1,
  JSON.stringify(saved2.robot) + ' | tagline: ' + byId.tagline.textContent);

// 6) Thêm REPEAT vào trong REPEAT qua bảng lệnh thật (màn 10, tools: MOVE + REPEAT)
byId.btnLevels.click();
byId.levelGrid.children[9].click(); // sang màn 10
var palRep = byId.palette.children[1]; // nút REPEAT
function topBlocks() { return byId.program.children.filter(function (c) { return (c.className || '').indexOf('blk ') === 0; }); }
function bodyBlocks(repEl) { return repEl.children[1].children.filter(function (c) { return (c.className || '').indexOf('blk ') === 0; }); }
palRep.click(); // REPEAT ngoài, editor tự đặt nó làm đích thêm lệnh
palRep.click(); // REPEAT thứ hai phải chui vào trong cái đầu (lồng cấp 2)
var tops1 = topBlocks();
check('Lồng nhau: bấm REPEAT lần 2 khi đang ở trong Lặp → tạo REPEAT con bên trong',
  tops1.length === 1 && bodyBlocks(tops1[0]).length === 1,
  'top=' + tops1.length + (tops1.length ? ', con=' + bodyBlocks(tops1[0]).length : ''));
palRep.click(); // đang ở trong REPEAT cấp 2 → không lồng cấp 3, REPEAT mới ra cấp cao nhất
check('Lồng nhau: chặn cấp 3 khi thêm bằng bảng lệnh (REPEAT mới ra ngoài)',
  topBlocks().length === 2, 'top=' + topBlocks().length);

var failed = results.filter(function (r) { return !r.ok; }).length;
console.log('\n' + (results.length - failed) + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
