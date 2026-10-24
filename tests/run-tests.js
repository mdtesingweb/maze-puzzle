// Test cho Coding Maze Rescue — Node thuần, không dependency.
// Chạy: node tests/run-tests.js
'use strict';

var assert = require('node:assert');

var CMEngine = null, CMStorage = null, CMLevels = null;
var engineErr = null, storageErr = null, levelsErr = null;
try { CMEngine = require('../js/engine.js'); } catch (e) { engineErr = e; }
try { CMStorage = require('../js/storage.js'); } catch (e) { storageErr = e; }
try { CMLevels = require('../js/levels.js'); } catch (e) { levelsErr = e; }

var passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('PASS ' + name);
  } catch (e) {
    failed++;
    console.log('FAIL ' + name + ' :: ' + (e && e.message ? e.message : e));
  }
}
function E() { assert.ok(CMEngine, 'js/engine.js chua nap duoc: ' + engineErr); return CMEngine; }
function S() { assert.ok(CMStorage, 'js/storage.js chua nap duoc: ' + storageErr); return CMStorage; }

function lvl(grid, startDir) { return { grid: grid, startDir: startDir || 'E' }; }
function run(level, program) { return E().runProgram(level, program); }
function ends(events) { return events.filter(function (e) { return e.kind === 'end'; }); }

/* ---------- Nap module ---------- */

test('module: engine.js nap duoc va du API', function () {
  var e = E();
  ['parseLevel', 'createExecutor', 'runProgram', 'countBlocks'].forEach(function (k) {
    assert.strictEqual(typeof e[k], 'function', 'thieu ' + k);
  });
  assert.strictEqual(e.MAX_STEPS, 1000);
});

test('module: storage.js nap duoc', function () {
  assert.strictEqual(typeof S().create, 'function');
});

/* ---------- parseLevel ---------- */

test('parseLevel: kich thuoc, start, goal, cell()', function () {
  var p = E().parseLevel(lvl(['#H.', 'S.F'], 'S'));
  assert.strictEqual(p.w, 3);
  assert.strictEqual(p.h, 2);
  assert.deepStrictEqual(p.start, { x: 0, y: 1, dir: 2 });
  assert.deepStrictEqual(p.goal, { x: 2, y: 1 });
  assert.strictEqual(p.cell(0, 0), 'wall');
  assert.strictEqual(p.cell(1, 0), 'pit');
  assert.strictEqual(p.cell(2, 0), 'floor');
  assert.strictEqual(p.cell(0, 1), 'floor'); // S la san
  assert.strictEqual(p.cell(2, 1), 'goal');
  assert.strictEqual(p.cell(-1, 0), 'out');
  assert.strictEqual(p.cell(3, 0), 'out');
  assert.strictEqual(p.cell(0, 2), 'out');
});

/* ---------- MOVE / TURN ---------- */

test('MOVE: di toi dich thi thang, event cuoi co win:true, khong co end', function () {
  var r = run(lvl(['S.F']), [{ type: 'MOVE' }, { type: 'MOVE' }]);
  assert.strictEqual(r.result, 'win');
  assert.strictEqual(r.error, null);
  assert.deepStrictEqual(r.finalState, { x: 2, y: 0, dir: 1 });
  assert.strictEqual(r.steps, 2);
  assert.strictEqual(r.events.length, 2);
  assert.strictEqual(r.events[1].kind, 'move');
  assert.strictEqual(r.events[1].win, true);
  assert.strictEqual(ends(r.events).length, 0);
});

test('TURN LEFT: du 4 huong quay ve huong cu', function () {
  var r = run(lvl(['SF'], 'E'), [
    { type: 'LEFT' }, { type: 'LEFT' }, { type: 'LEFT' }, { type: 'LEFT' }
  ]);
  var dirs = r.events.filter(function (e) { return e.kind === 'turn'; }).map(function (e) { return e.to.dir; });
  assert.deepStrictEqual(dirs, [0, 3, 2, 1]); // E -> N -> W -> S -> E
  assert.strictEqual(r.finalState.dir, 1);
  assert.strictEqual(r.result, 'incomplete');
});

test('TURN RIGHT: du 4 huong quay ve huong cu', function () {
  var r = run(lvl(['SF'], 'N'), [
    { type: 'RIGHT' }, { type: 'RIGHT' }, { type: 'RIGHT' }, { type: 'RIGHT' }
  ]);
  var dirs = r.events.filter(function (e) { return e.kind === 'turn'; }).map(function (e) { return e.to.dir; });
  assert.deepStrictEqual(dirs, [1, 2, 3, 0]); // N -> E -> S -> W -> N
  assert.strictEqual(r.finalState.dir, 0);
});

test('MOVE cham tuong: loi wall, robot dung yen, chuong trinh dung', function () {
  var r = run(lvl(['S#F']), [{ type: 'MOVE' }, { type: 'MOVE' }]);
  assert.strictEqual(r.result, 'error');
  assert.strictEqual(r.error, 'wall');
  assert.deepStrictEqual(r.finalState, { x: 0, y: 0, dir: 1 });
  assert.strictEqual(r.events.length, 1);
  assert.strictEqual(r.events[0].kind, 'error');
  assert.strictEqual(r.events[0].error, 'wall');
  assert.deepStrictEqual(r.events[0].to, r.events[0].from);
});

test('MOVE ra ngoai luoi: loi wall', function () {
  var r = run(lvl(['SF'], 'W'), [{ type: 'MOVE' }, { type: 'MOVE' }]);
  assert.strictEqual(r.result, 'error');
  assert.strictEqual(r.error, 'wall');
  assert.strictEqual(r.finalState.x, 0);
});

test('MOVE vao ho: loi pit, to la o ho', function () {
  var r = run(lvl(['SHF']), [{ type: 'MOVE' }]);
  assert.strictEqual(r.result, 'error');
  assert.strictEqual(r.error, 'pit');
  assert.strictEqual(r.events[0].kind, 'error');
  assert.deepStrictEqual(r.events[0].to, { x: 1, y: 0, dir: 1 });
  assert.strictEqual(r.finalState.x, 1);
});

/* ---------- JUMP ---------- */

test('JUMP hop le qua ho, di tiep toi dich', function () {
  var r1 = run(lvl(['SH.F']), [{ type: 'JUMP' }]);
  assert.strictEqual(r1.result, 'incomplete');
  assert.strictEqual(r1.events[0].kind, 'jump');
  assert.deepStrictEqual(r1.events[0].to, { x: 2, y: 0, dir: 1 });

  var r2 = run(lvl(['SH.F']), [{ type: 'JUMP' }, { type: 'MOVE' }]);
  assert.strictEqual(r2.result, 'win');
  assert.strictEqual(r2.events[1].win, true);
});

test('JUMP thang toi dich: thang', function () {
  var r = run(lvl(['SHF']), [{ type: 'JUMP' }]);
  assert.strictEqual(r.result, 'win');
  assert.strictEqual(r.events[0].kind, 'jump');
  assert.strictEqual(r.events[0].win, true);
});

test('JUMP khi o truoc khong phai ho: loi jump-no-pit, dung yen', function () {
  var r = run(lvl(['S.F']), [{ type: 'JUMP' }]);
  assert.strictEqual(r.result, 'error');
  assert.strictEqual(r.error, 'jump-no-pit');
  assert.deepStrictEqual(r.finalState, { x: 0, y: 0, dir: 1 });
});

test('JUMP dap tuong / ho / ngoai luoi: loi jump-bad-land', function () {
  var r1 = run(lvl(['SH#F']), [{ type: 'JUMP' }]);
  assert.strictEqual(r1.error, 'jump-bad-land');
  assert.strictEqual(r1.finalState.x, 0);

  var r2 = run(lvl(['SHHF']), [{ type: 'JUMP' }]);
  assert.strictEqual(r2.error, 'jump-bad-land');

  var r3 = run(lvl(['SH', '..', '.F']), [{ type: 'JUMP' }]);
  assert.strictEqual(r3.error, 'jump-bad-land');
});

/* ---------- REPEAT ---------- */

test('REPEAT: chay dung so lan, event co repeat.iter tang dung', function () {
  var program = [
    { id: 'r1', type: 'REPEAT', count: 2, body: [{ id: 'm1', type: 'MOVE' }] },
    { type: 'MOVE' },
    { type: 'MOVE' }
  ];
  var r = run(lvl(['S...F']), program);
  assert.strictEqual(r.result, 'win');
  assert.strictEqual(r.steps, 4);
  var moves = r.events.filter(function (e) { return e.kind === 'move'; });
  assert.strictEqual(moves.length, 4);
  assert.deepStrictEqual(moves[0].repeat, { blockId: 'r1', iter: 1, count: 2 });
  assert.deepStrictEqual(moves[1].repeat, { blockId: 'r1', iter: 2, count: 2 });
  assert.strictEqual(moves[0].blockId, 'm1');
  assert.strictEqual(moves[2].repeat, undefined);
  assert.strictEqual(moves[3].win, true);
});

test('REPEAT: lap TURN du 4 lan ve huong cu', function () {
  var r = run(lvl(['SF'], 'E'), [{ type: 'REPEAT', count: 4, body: [{ type: 'LEFT' }] }]);
  assert.strictEqual(r.result, 'incomplete');
  assert.strictEqual(r.steps, 4);
  assert.strictEqual(r.finalState.dir, 1);
});

test('REPEAT body nhieu lenh: moi lenh deu mang repeat dung iter', function () {
  var program = [{ id: 'r', type: 'REPEAT', count: 3, body: [{ type: 'LEFT' }, { type: 'RIGHT' }] }];
  var r = run(lvl(['SF'], 'E'), program);
  assert.strictEqual(r.steps, 6);
  var iters = r.events.filter(function (e) { return e.kind === 'turn'; }).map(function (e) { return e.repeat.iter; });
  assert.deepStrictEqual(iters, [1, 1, 2, 2, 3, 3]);
});

test('REPEAT long nhau (nested): vong trong chay lai tu dau moi vong ngoai, thang duoc man 1', function () {
  var program = [{ id: 'o', type: 'REPEAT', count: 2, body: [{ id: 'i', type: 'REPEAT', count: 2, body: [{ id: 'm', type: 'MOVE' }] }] }];
  var r = run(lvl(['#####', '#S..F', '#####'], 'E'), program);
  assert.strictEqual(r.result, 'win'); // 3 MOVE la toi dich (buoc thua khong chay vi da thang)
  assert.strictEqual(r.steps, 3);
  var reps = r.events.filter(function (e) { return e.kind === 'move'; }).map(function (e) { return e.repeat.blockId + '#' + e.repeat.iter; });
  assert.deepStrictEqual(reps, ['i#1', 'i#2', 'i#1']); // vong trong reset iter khi vong ngoai sang luot moi
});

/* ---------- Ket thuc chuong trinh / gioi han buoc ---------- */

test('Het chuong trinh chua toi dich: incomplete + dung 1 event end o cuoi', function () {
  var r = run(lvl(['S.F']), [{ type: 'MOVE' }]);
  assert.strictEqual(r.result, 'incomplete');
  assert.strictEqual(r.error, null);
  assert.strictEqual(ends(r.events).length, 1);
  assert.strictEqual(r.events[r.events.length - 1].kind, 'end');
});

test('Chuong trinh rong: incomplete, chi 1 event end', function () {
  var r = run(lvl(['S.F']), []);
  assert.strictEqual(r.result, 'incomplete');
  assert.strictEqual(r.events.length, 1);
  assert.strictEqual(r.events[0].kind, 'end');
});

test('MAX_STEPS: REPEAT count 99999 bi chan step-limit, khong treo', function () {
  var r = run(lvl(['S...F']), [{ type: 'REPEAT', count: 99999, body: [{ type: 'LEFT' }] }]);
  assert.strictEqual(r.result, 'error');
  assert.strictEqual(r.error, 'step-limit');
  assert.strictEqual(r.steps, E().MAX_STEPS);
  assert.ok(r.events.length <= E().MAX_STEPS + 1);
});

/* ---------- Executor tung buoc / reset / chay lai ---------- */

test('createExecutor: next() tung buoc, state cap nhat, xong thi tra null', function () {
  var ex = E().createExecutor(lvl(['S.F']), [{ type: 'MOVE' }, { type: 'MOVE' }]);
  assert.deepStrictEqual(ex.state, { x: 0, y: 0, dir: 1 });
  var e1 = ex.next();
  assert.strictEqual(e1.kind, 'move');
  assert.deepStrictEqual(ex.state, { x: 1, y: 0, dir: 1 });
  assert.strictEqual(ex.done, false);
  var e2 = ex.next();
  assert.strictEqual(e2.win, true);
  assert.strictEqual(ex.won, true);
  assert.strictEqual(ex.done, true);
  assert.strictEqual(ex.next(), null);
  assert.strictEqual(ex.next(), null);
});

test('createExecutor: loi thi failed=true va next() tra null', function () {
  var ex = E().createExecutor(lvl(['S#F']), [{ type: 'MOVE' }]);
  var e1 = ex.next();
  assert.strictEqual(e1.kind, 'error');
  assert.strictEqual(ex.failed, true);
  assert.strictEqual(ex.error, 'wall');
  assert.strictEqual(ex.next(), null);
});

test('createExecutor: end chi phat 1 lan', function () {
  var ex = E().createExecutor(lvl(['S.F']), [{ type: 'MOVE' }]);
  ex.next(); // move
  var eEnd = ex.next();
  assert.strictEqual(eEnd.kind, 'end');
  assert.strictEqual(ex.next(), null);
});

test('Reset/chay lai: runProgram thuan, khong sua program, sua lenh roi thang', function () {
  var level = lvl(['S.F']);
  var sai = [{ type: 'MOVE' }];
  var snapshot = JSON.stringify(sai);
  var r1 = run(level, sai);
  assert.strictEqual(r1.result, 'incomplete');
  assert.strictEqual(JSON.stringify(sai), snapshot); // khong bi sua

  var dung = [{ type: 'MOVE' }, { type: 'MOVE' }];
  var r2 = run(level, dung);
  assert.strictEqual(r2.result, 'win');
  // chay lai lan nua tu trang thai ban dau (nhu RESET) van thang
  var r3 = run(level, dung);
  assert.strictEqual(r3.result, 'win');
  assert.deepStrictEqual(r3.finalState, { x: 2, y: 0, dir: 1 });
});

test('Tinh xac dinh: cung input chay 2 lan cho events bang nhau', function () {
  var level = lvl(['SH.F']);
  var program = [
    { id: 'j', type: 'JUMP' },
    { id: 'r', type: 'REPEAT', count: 2, body: [{ type: 'LEFT' }, { type: 'RIGHT' }] },
    { type: 'MOVE' }
  ];
  var a = run(level, program);
  var b = run(level, program);
  assert.strictEqual(a.result, 'win');
  assert.deepStrictEqual(a.events, b.events);
  assert.deepStrictEqual(a.finalState, b.finalState);
  assert.strictEqual(a.steps, b.steps);
});

/* ---------- countBlocks ---------- */

test('countBlocks: tinh ca REPEAT va lenh con', function () {
  var e = E();
  assert.strictEqual(e.countBlocks([]), 0);
  assert.strictEqual(e.countBlocks([{ type: 'MOVE' }, { type: 'LEFT' }]), 2);
  assert.strictEqual(e.countBlocks([
    { type: 'REPEAT', count: 3, body: [{ type: 'MOVE' }, { type: 'JUMP' }] },
    { type: 'MOVE' }
  ]), 4);
  assert.strictEqual(e.countBlocks([{ type: 'REPEAT', count: 2, body: [] }]), 1);
});

/* ---------- Storage ---------- */

function fakeBackend() {
  var store = {};
  return {
    store: store,
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); }
  };
}

test('storage: chua co du lieu -> mac dinh', function () {
  var st = S().create(fakeBackend());
  assert.deepStrictEqual(st.load(), { unlocked: 1, done: [], sound: true });
});

test('storage: save/load va mo khoa level', function () {
  var st = S().create(fakeBackend());
  st.save({ unlocked: 3, done: [1, 2], sound: false });
  assert.deepStrictEqual(st.load(), { unlocked: 3, done: [1, 2], sound: false });
  st.save({ unlocked: 4, done: [1, 2, 3], sound: false });
  assert.strictEqual(st.load().unlocked, 4);
});

test('storage: save thieu truong -> merge mac dinh', function () {
  var st = S().create(fakeBackend());
  st.save({ unlocked: 5 });
  assert.deepStrictEqual(st.load(), { unlocked: 5, done: [], sound: true });
});

test('storage: du lieu hong -> tra mac dinh, khong nem loi', function () {
  var b = fakeBackend();
  var st = S().create(b);
  st.save({ unlocked: 9, done: [1], sound: false });
  Object.keys(b.store).forEach(function (k) { b.store[k] = 'khong-phai-json{{{'; });
  assert.deepStrictEqual(st.load(), { unlocked: 1, done: [], sound: true });
});

test('storage: du lieu thieu truong khi load -> merge mac dinh', function () {
  var b = fakeBackend();
  var st = S().create(b);
  st.save({ unlocked: 2, done: [1], sound: false });
  Object.keys(b.store).forEach(function (k) {
    b.store[k] = JSON.stringify({ unlocked: 7, done: [1] }); // mat truong sound
  });
  assert.deepStrictEqual(st.load(), { unlocked: 7, done: [1], sound: true });
});

test('storage: reset -> ve mac dinh', function () {
  var st = S().create(fakeBackend());
  st.save({ unlocked: 8, done: [1, 2, 3], sound: false });
  st.reset();
  assert.deepStrictEqual(st.load(), { unlocked: 1, done: [], sound: true });
});

test('storage: levelsVersion hop le duoc giu, gia tri hong bi loai (V7.2)', function () {
  var st = S().create(fakeBackend());
  st.save({ unlocked: 3, done: [1], sound: true, levelsVersion: 2 });
  assert.strictEqual(st.load().levelsVersion, 2);
  st.save({ unlocked: 3, done: [1], sound: true, levelsVersion: 'x' });
  assert.strictEqual(st.load().levelsVersion, undefined);
});

test('storage: create() khong backend (Node, khong localStorage) van chay', function () {
  var st = S().create();
  assert.deepStrictEqual(st.load(), { unlocked: 1, done: [], sound: true });
  st.save({ unlocked: 2, done: [1], sound: true });
  assert.strictEqual(st.load().unlocked, 2);
});

/* ---------- Solutions cua 15 level (js/levels.js) ---------- */

test('levels: file js/levels.js nap duoc, co dung 15 man', function () {
  assert.ok(CMLevels, 'js/levels.js chua nap duoc: ' + levelsErr);
  var list = Array.isArray(CMLevels) ? CMLevels : CMLevels.levels;
  assert.ok(Array.isArray(list), 'CMLevels phai la mang level');
  assert.strictEqual(list.length, 15);
});

function levelList() {
  assert.ok(CMLevels, 'js/levels.js chua nap duoc: ' + levelsErr);
  var list = Array.isArray(CMLevels) ? CMLevels : CMLevels.levels;
  assert.ok(Array.isArray(list));
  return list;
}

function usedTypes(program, acc) {
  (program || []).forEach(function (b) {
    acc[b.type] = true;
    if (b.type === 'REPEAT') usedTypes(b.body, acc);
  });
  return acc;
}

for (var li = 0; li < 15; li++) {
  (function (idx) {
    test('level ' + (idx + 1) + ': grid hop le, solution thang, prefill khong thang, dung tools', function () {
      var lv = levelList()[idx];
      assert.ok(lv, 'thieu level thu ' + (idx + 1));
      var w = lv.grid[0].length;
      lv.grid.forEach(function (row) { assert.strictEqual(row.length, w, 'grid khong chu nhat'); });
      var joined = lv.grid.join('');
      assert.strictEqual(joined.split('S').length - 1, 1, 'phai co dung 1 S');
      assert.strictEqual(joined.split('F').length - 1, 1, 'phai co dung 1 F');

      assert.ok(Array.isArray(lv.solution) && lv.solution.length > 0, 'thieu solution');
      var r = E().runProgram(lv, lv.solution);
      assert.strictEqual(r.result, 'win', 'solution khong thang: ' + JSON.stringify(r.error));

      if (lv.maxBlocks != null) {
        assert.ok(E().countBlocks(lv.solution) <= lv.maxBlocks,
          'solution vuot maxBlocks: ' + E().countBlocks(lv.solution) + ' > ' + lv.maxBlocks);
      }
      if (lv.prefill) {
        var rp = E().runProgram(lv, lv.prefill);
        assert.notStrictEqual(rp.result, 'win', 'prefill khong duoc thang');
      }
      var used = usedTypes(lv.solution, {});
      if (lv.prefill) usedTypes(lv.prefill, used);
      Object.keys(used).forEach(function (t) {
        assert.ok(lv.tools.indexOf(t) !== -1, 'lenh ' + t + ' khong nam trong tools cua level');
      });
    });
  })(li);
}

/* ---------- Tong ket ---------- */

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
