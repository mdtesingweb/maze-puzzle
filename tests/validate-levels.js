// Kiểm tra chất lượng 15 level (V7.2, §6 brief): dùng engine thật + BFS trên lưới.
// Chạy: node tests/validate-levels.js — in bảng chỉ số từng màn, exit 1 nếu có lỗi CỨNG.
// "Lỗi cứng" = màn không chơi được hoặc mục tiêu học tập bị vô hiệu (lời giải sai, prefill thắng,
// maxBlocks vi phạm, JUMP bắt buộc nhưng đi bộ cũng tới, REPEAT bắt buộc nhưng viết phẳng vẫn đủ khối).
'use strict';
var path = require('path');
var E = require(path.join(__dirname, '..', 'js', 'engine.js'));
var LEVELS = require(path.join(__dirname, '..', 'js', 'levels.js'));
var list = Array.isArray(LEVELS) ? LEVELS : LEVELS.levels;

function M() { return { type: 'MOVE' }; }
function L() { return { type: 'LEFT' }; }
function R() { return { type: 'RIGHT' }; }
function J() { return { type: 'JUMP' }; }
function REP(c, b) { return { type: 'REPEAT', count: c, body: b }; }

var DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
function key(x, y) { return x + ',' + y; }
function walkable(cell) { return cell === 'floor' || cell === 'goal'; }
function bfs(parsed, allowJump) {
  var seen = {}, q = [[parsed.start.x, parsed.start.y]];
  seen[key(parsed.start.x, parsed.start.y)] = true;
  while (q.length) {
    var cur = q.shift(), x = cur[0], y = cur[1];
    DIRS.forEach(function (d) {
      var nx = x + d[0], ny = y + d[1], c = parsed.cell(nx, ny);
      if (walkable(c) && !seen[key(nx, ny)]) { seen[key(nx, ny)] = true; q.push([nx, ny]); }
      if (allowJump && c === 'pit') {
        var lx = x + d[0] * 2, ly = y + d[1] * 2, lc = parsed.cell(lx, ly);
        if (walkable(lc) && !seen[key(lx, ly)]) { seen[key(lx, ly)] = true; q.push([lx, ly]); }
      }
    });
  }
  return seen;
}
function neighbors(parsed, x, y) {
  var n = 0;
  DIRS.forEach(function (d) { if (walkable(parsed.cell(x + d[0], y + d[1]))) n += 1; });
  return n;
}
function leaves(program) {
  var out = [];
  (program || []).forEach(function (b) {
    if (b.type === 'REPEAT') { for (var i = 0; i < b.count; i++) out = out.concat(leaves(b.body || [])); }
    else out.push(b.type);
  });
  return out;
}
function lev(a, b) { // khoảng cách Levenshtein trên 2 dãy lệnh lá
  var dp = [];
  for (var i = 0; i <= a.length; i++) { dp[i] = [i]; }
  for (var j = 0; j <= b.length; j++) { dp[0][j] = j; }
  for (var x = 1; x <= a.length; x++) for (var y = 1; y <= b.length; y++) {
    dp[x][y] = Math.min(dp[x - 1][y] + 1, dp[x][y - 1] + 1, dp[x - 1][y - 1] + (a[x - 1] === b[y - 1] ? 0 : 1));
  }
  return dp[a.length][b.length];
}
function pathCells(run) { // các ô robot đã đi qua (từ event from/to)
  var cells = [];
  run.events.forEach(function (e) {
    if (e.from) cells.push(key(e.from.x, e.from.y));
    if (e.to) cells.push(key(e.to.x, e.to.y));
  });
  return cells;
}

// Chương trình bẫy / đường thay thế, kiểm chứng mục tiêu học tập của từng màn (không nằm trong levels.js).
var TRAPS = { // phải KHÔNG thắng (bẫy thiết kế đúng thì chương trình sai này thất bại)
  5: [[M(), M(), M()]], // đi thẳng vào tường chặn đường tắt
  6: [[M(), M(), M(), M(), M(), M(), R(), M(), M()]], // đi theo đường trên rồi đâm ngõ cụt
  11: [[REP(2, [M(), M(), R(), M(), L(), R(), M(), M()])], // nhét đoạn đuôi vào trong Lặp → vòng 1 đâm tường
       [REP(3, [M(), M(), R(), M(), L()]), R(), M(), M()]], // lặp thừa 1 vòng → đâm tường
  12: [[REP(2, [M(), J(), M()])]] // lặp thiếu 1 vòng → dừng giữa đường
};
var ALTS = { // phải THẮNG (chứng minh có lựa chọn/đường thay thế thật)
  4: [[R(), M(), M(), M(), M(), L(), M(), M(), M(), M(), M()]], // đường vòng phía dưới thay cho đường trên
  8: [[R(), M(), M(), L(), M(), M(), M(), M(), M(), M(), L(), M(), M()]] // đi vòng không cần Nhảy
};
var JUMP_REQUIRED = { 7: true, 9: true }; // các màn này đi bộ không tới đích được (Nhảy là bắt buộc)

var failures = [];
function fail(n, msg) { failures.push('Màn ' + n + ': ' + msg); }
function row(cols) { console.log(cols.join(' | ')); }

console.log('BẢNG CHẤT LƯỢNG LEVEL (V7.2)');
row(['Màn', 'Kích thước', 'Ngã rẽ/Ngõ cụt', 'Khối/Bước/Rẽ', 'Lặp?', 'Đi bộ tới?/Nhảy tới?', 'Ghi chú']);
list.forEach(function (lv) {
  var n = lv.n;
  var grid = lv.grid || [];
  var w = grid.length ? grid[0].length : 0, h = grid.length;
  var flat = grid.join('\n');
  var sCount = (flat.match(/S/g) || []).length, fCount = (flat.match(/F/g) || []).length;
  if (grid.some(function (r) { return r.length !== w; })) fail(n, 'lưới không chữ nhật');
  if (sCount !== 1 || fCount !== 1) fail(n, 'phải có đúng 1 ô S và 1 ô F (có S=' + sCount + ', F=' + fCount + ')');
  var parsed = E.parseLevel({ grid: grid, startDir: lv.startDir || 'E' });
  var walkSeen = bfs(parsed, false), jumpSeen = bfs(parsed, true);
  var goalKey = key(parsed.goal.x, parsed.goal.y);
  var walkReach = !!walkSeen[goalKey], jumpReach = !!jumpSeen[goalKey];
  if (!jumpReach) fail(n, 'đích không tới được ngay cả khi dùng Nhảy');
  if (JUMP_REQUIRED[n] && walkReach) fail(n, 'Nhảy phải bắt buộc nhưng đi bộ cũng tới đích');
  var junctions = 0, deadEnds = 0;
  Object.keys(walkSeen).forEach(function (k) {
    var parts = k.split(','), x = +parts[0], y = +parts[1];
    if (k === key(parsed.start.x, parsed.start.y) || k === goalKey) return;
    var deg = neighbors(parsed, x, y);
    if (deg >= 3) junctions += 1;
    if (deg === 1) deadEnds += 1;
  });
  var sol = E.runProgram({ grid: grid, startDir: lv.startDir || 'E' }, lv.solution || []);
  if (sol.result !== 'win') fail(n, 'lời giải mẫu KHÔNG thắng (kết quả: ' + sol.result + ', lỗi: ' + sol.error + ')');
  var blocks = E.countBlocks(lv.solution || []);
  var leaf = leaves(lv.solution || []);
  var turns = leaf.filter(function (t) { return t === 'LEFT' || t === 'RIGHT'; }).length;
  var usesRepeat = JSON.stringify(lv.solution || []).indexOf('REPEAT') !== -1;
  if (lv.maxBlocks && blocks > lv.maxBlocks) fail(n, 'lời giải ' + blocks + ' khối vượt maxBlocks=' + lv.maxBlocks);
  if (lv.maxBlocks && leaf.length <= lv.maxBlocks) fail(n, 'REPEAT không bị ép: viết phẳng chỉ cần ' + leaf.length + ' khối ≤ maxBlocks=' + lv.maxBlocks);
  var preNote = '-';
  if (lv.prefill) {
    var pre = E.runProgram({ grid: grid, startDir: lv.startDir || 'E' }, lv.prefill);
    if (pre.result === 'win') fail(n, 'prefill (chương trình sẵn) lại THẮNG — màn debug hỏng');
    preNote = 'prefill cách lời giải ' + lev(leaves(lv.prefill), leaf) + ' lệnh lá, không thắng';
  }
  var pcells = pathCells(sol);
  var forks = 0;
  pcells.forEach(function (k) {
    var parts = k.split(','), x = +parts[0], y = +parts[1];
    if (neighbors(parsed, x, y) >= 3) forks += 1;
  });
  (TRAPS[n] || []).forEach(function (trap, i) {
    var r = E.runProgram({ grid: grid, startDir: lv.startDir || 'E' }, trap);
    if (r.result === 'win') fail(n, 'bẫy #' + (i + 1) + ' lại THẮNG — mục tiêu học tập bị vô hiệu');
  });
  (ALTS[n] || []).forEach(function (alt, i) {
    var r = E.runProgram({ grid: grid, startDir: lv.startDir || 'E' }, alt);
    if (r.result !== 'win') fail(n, 'đường thay thế #' + (i + 1) + ' KHÔNG thắng (' + r.result + ') — lựa chọn không có thật');
  });
  var unused = (lv.tools || []).filter(function (t) { return leaf.indexOf(t) === -1 && !(t === 'REPEAT' && usesRepeat); });
  row(['M' + n + ' ' + lv.name, w + '×' + h, junctions + '/' + deadEnds, blocks + '/' + sol.steps + '/' + turns, usesRepeat ? 'có' : 'không',
    (walkReach ? 'có' : 'không') + '/' + (jumpReach ? 'có' : 'không'),
    'ô đi qua có ngã rẽ: ' + forks + '; ' + preNote + (unused.length ? '; lệnh chưa dùng trong lời giải: ' + unused.join(',') : '')]);
});

// Trùng lặp giữa các màn
for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) {
  if (list[i].grid.join('\n') === list[j].grid.join('\n')) fail(list[j].n, 'lưới trùng màn ' + list[i].n);
  if (leaves(list[i].solution || []).join(',') === leaves(list[j].solution || []).join(',')) {
    console.log('Chú ý: màn ' + list[i].n + ' và màn ' + list[j].n + ' có dãy lệnh lá lời giải giống nhau');
  }
}
console.log('');
if (failures.length) { console.log('LỖI CỨNG (' + failures.length + '):'); failures.forEach(function (f) { console.log(' - ' + f); }); process.exit(1); }
console.log('VALIDATOR: PASS — mọi kiểm tra cứng đều đạt.');
