// QA trình duyệt thật (V7.2 §10): chạy Chromium headless, click DOM thật như trẻ chơi,
// quét 15 màn bằng lời giải mẫu, kiểm tra landscape (RUN + robot cùng nhìn thấy, không cuộn trang),
// chụp ảnh 4 viewport. Chạy: node tests/browser-qa.js
// Yêu cầu: /opt/meta-chromium/chrome (hoặc biến môi trường CHROME_BIN).
'use strict';
var fs = require('fs');
var path = require('path');
var child = require('child_process');
var LEVELS = require(path.join(__dirname, '..', 'js', 'levels.js'));
var list = Array.isArray(LEVELS) ? LEVELS : LEVELS.levels;

var CHROME = process.env.CHROME_BIN || '/opt/meta-chromium/chrome';
var BUNDLE = 'file://' + path.join(__dirname, '..', '..', 'cmr-bundle', 'index.html');
var SHOT_DIR = path.join(__dirname, '..', '..', 'qa-shots');
var PORT = 9223;
var failures = [];
function fail(msg) { failures.push(msg); console.log('FAIL: ' + msg); }
function ok(msg) { console.log('ok: ' + msg); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function CDP(url) {
  this.ws = new WebSocket(url);
  this.id = 0;
  this.pending = {};
  this.consoleErrors = [];
  var self = this;
  this.ws.addEventListener('message', function (ev) {
    var m = JSON.parse(ev.data);
    if (m.id && self.pending[m.id]) {
      var p = self.pending[m.id]; delete self.pending[m.id];
      if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result);
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params && m.params.type === 'error') {
      self.consoleErrors.push((m.params.args || []).map(function (a) { return a.value || a.description || ''; }).join(' '));
    }
    if (m.method === 'Runtime.exceptionThrown') {
      self.consoleErrors.push('exception: ' + ((m.params.exceptionDetails.exception || {}).description || ''));
    }
  });
}
CDP.prototype.ready = function () {
  var self = this;
  return new Promise(function (res) { if (self.ws.readyState === 1) res(); else self.ws.addEventListener('open', res); });
};
CDP.prototype.send = function (method, params) {
  var self = this, id = ++self.id;
  return new Promise(function (res, rej) {
    self.pending[id] = { resolve: res, reject: rej };
    self.ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    setTimeout(function () { if (self.pending[id]) { delete self.pending[id]; rej(new Error('CDP timeout ' + method)); } }, 30000);
  });
};
CDP.prototype.eval = async function (expr) {
  var r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('JS eval lỗi: ' + JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result.value;
};
CDP.prototype.waitFor = async function (expr, timeoutMs, label) {
  var t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await this.eval(expr)) return true;
    await sleep(400);
  }
  fail('hết giờ chờ: ' + label);
  return false;
};

async function httpJson(url, method) {
  var r = await fetch(url, { method: method || 'GET' });
  return r.json();
}
async function waitPort() {
  for (var i = 0; i < 40; i++) {
    try { await httpJson('http://127.0.0.1:' + PORT + '/json/version'); return; } catch (e) { await sleep(500); }
  }
  throw new Error('không kết nối được tới Chrome remote debugging');
}

async function newPage(url, w, h) {
  var t = await httpJson('http://127.0.0.1:' + PORT + '/json/new?' + new URLSearchParams({ url: url }), 'PUT');
  var cdp = new CDP(t.webSocketDebuggerUrl);
  await cdp.ready();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.navigate', { url: url });
  await sleep(1500);
  return cdp;
}

// Xây chương trình bằng click DOM thật (như trẻ bấm nút lệnh).
async function buildProgram(cdp, program) {
  for (var i = 0; i < program.length; i++) {
    var b = program[i];
    if (b.type === 'REPEAT') {
      await cdp.eval("document.querySelector('.pal-REPEAT').click()");
      for (var k = 2; k < b.count; k++) await cdp.eval("document.getElementById('actPlus').click()");
      for (var j = 0; j < b.body.length; j++) {
        await cdp.eval("document.querySelector('.pal-" + b.body[j].type + "').click()");
      }
      // chọn lại khối Lặp rồi tắt chế độ "thêm vào Lặp này"
      await cdp.eval("(function(){ var els = document.querySelectorAll('.blk-repeat'); els[els.length-1].querySelector('.blk-head').click(); document.getElementById('actTarget').click(); })()");
    } else {
      await cdp.eval("document.querySelector('.pal-" + b.type + "').click()");
    }
  }
}
async function loadLevel(cdp, n) {
  await cdp.eval("document.getElementById('btnLevels').click()");
  await sleep(300);
  var opened = await cdp.eval("(function(){ var b = document.querySelectorAll('#levelGrid button')[" + (n - 1) + "]; if (b.disabled) return 'locked'; b.click(); return 'ok'; })()");
  if (opened !== 'ok') { fail('màn ' + n + ' bị khóa (chưa mở khóa)'); return false; }
  await sleep(300);
  return true;
}

(async function main() {
  if (!fs.existsSync(CHROME)) { console.log('BỎ QUA browser QA: không thấy ' + CHROME); process.exit(0); }
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  try { fs.rmSync('/tmp/cr-qa-profile', { recursive: true, force: true }); } catch (e) {}
  var chrome = child.spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/cr-qa-profile', 'about:blank'], { stdio: 'ignore' });
  try {
    await waitPort();
    // ---- 1) Quét 15 màn ở viewport landscape ưu tiên 844x390 ----
    var cdp = await newPage(BUNDLE, 844, 390);
    var introOpen = await cdp.eval("!document.getElementById('introModal').classList.contains('hidden')");
    if (introOpen) {
      await cdp.eval("document.getElementById('introBoy').click()");
      await cdp.eval("document.getElementById('robotNameInput').value = 'Test'");
      await cdp.eval("document.getElementById('btnStartIntro').click()");
      await sleep(500);
    }
    var introClosed = await cdp.eval("document.getElementById('introModal').classList.contains('hidden')");
    if (!introClosed) fail('intro không đóng sau khi chọn robot');
    else ok('intro chọn robot đóng được, vào game');
    await cdp.eval("document.getElementById('spd2').click()"); // chạy nhanh 2x cho kịp quét
    for (var n = 1; n <= 15; n++) {
      if (!await loadLevel(cdp, n)) continue;
      var lv = list[n - 1];
      await cdp.eval("document.getElementById('btnClear').click()"); // xóa chương trình sẵn (màn debug) trước khi xếp lời giải
      await buildProgram(cdp, lv.solution);
      await cdp.eval("document.getElementById('btnRun').click()");
      var won = await cdp.waitFor("!document.getElementById('winPanel').classList.contains('hidden')", 30000, 'thắng màn ' + n);
      if (won) ok('màn ' + n + ' (' + lv.name + '): lời giải mẫu thắng trong trình duyệt thật');
      await cdp.eval("document.getElementById('btnCloseLevels').click().catch(function(){})").catch(function () {});
    }
    // ---- 2) Bẫy màn 6 + sửa và chạy lại ----
    if (await loadLevel(cdp, 6)) {
      await cdp.eval("document.getElementById('btnReset').click()");
      await buildProgram(cdp, [{ type: 'MOVE' }, { type: 'MOVE' }, { type: 'MOVE' }, { type: 'MOVE' }, { type: 'MOVE' }, { type: 'MOVE' }, { type: 'RIGHT' }, { type: 'MOVE' }, { type: 'MOVE' }]);
      await cdp.eval("document.getElementById('btnRun').click()");
      await sleep(4000);
      var trapWon = await cdp.eval("!document.getElementById('winPanel').classList.contains('hidden')");
      var status = await cdp.eval("document.getElementById('statusMsg').textContent");
      if (!trapWon && status) ok('màn 6 bẫy đường tắt: không thắng, có thông báo lỗi (' + status.slice(0, 40) + ')');
      else fail('màn 6 bẫy đường tắt: kết quả bất ngờ (thắng=' + trapWon + ', status=' + status + ')');
      await cdp.eval("document.getElementById('btnReset').click()");
      await sleep(300);
      await cdp.eval("document.getElementById('btnClear').click()");
      await buildProgram(cdp, list[5].solution);
      await cdp.eval("document.getElementById('btnRun').click()");
      if (await cdp.waitFor("!document.getElementById('winPanel').classList.contains('hidden')", 30000, 'sửa và thắng lại màn 6')) {
        ok('màn 6: sửa chương trình và chạy lại thì thắng');
      }
    }
    // ---- 3) STEP từng bước thắng màn 1 ----
    if (await loadLevel(cdp, 1)) {
      await cdp.eval("document.getElementById('btnReset').click()");
      await cdp.eval("document.getElementById('btnClear').click()");
      await buildProgram(cdp, list[0].solution);
      for (var s = 0; s < 3; s++) { await cdp.eval("document.getElementById('btnStep').click()"); await sleep(900); }
      var stepWon = await cdp.eval("!document.getElementById('winPanel').classList.contains('hidden')");
      if (stepWon) ok('STEP từng bước: thắng màn 1 sau 3 lần bấm');
      else fail('STEP từng bước không thắng màn 1');
    }
    var errs = cdp.consoleErrors.filter(function (m) { return m.indexOf('AudioContext') === -1 && m.indexOf('user gesture') === -1; });
    if (errs.length) fail('console errors trong lúc quét: ' + errs.slice(0, 3).join(' || '));
    else ok('không có console error trong lúc quét 15 màn (trừ cảnh báo âm thanh headless nếu có)');
    // ---- 4) Layout 4 viewport: RUN + robot cùng nhìn thấy, không cuộn trang ----
    var viewports = [[640, 360], [844, 390], [915, 412], [1280, 720]];
    for (var v = 0; v < viewports.length; v++) {
      var w = viewports[v][0], h = viewports[v][1];
      var p = await newPage(BUNDLE, w, h);
      await p.eval("document.getElementById('btnLevels').click()");
      await sleep(300);
      await p.eval("(function(){ var b = document.querySelectorAll('#levelGrid button')[14]; if (!b.disabled) b.click(); })()");
      await sleep(500);
      var shot = await p.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SHOT_DIR, 'v72-' + w + 'x' + h + '.png'), Buffer.from(shot.data, 'base64'));
      var vis = await p.eval("(function(){ function r(id){ var e = document.getElementById(id).getBoundingClientRect(); return {top: e.top, bottom: e.bottom}; } var board = r('board'), run = r('btnRun'); return {board: board, run: run, vh: window.innerHeight, scrollH: document.documentElement.scrollHeight}; })()");
      var bothVisible = vis.board.top < vis.vh && vis.board.bottom > 0 && vis.run.top < vis.vh && vis.run.bottom > 0;
      var noPageScroll = vis.scrollH <= vis.vh + 2;
      if (bothVisible) ok('viewport ' + w + 'x' + h + ': robot + nút RUN cùng trong màn hình');
      else fail('viewport ' + w + 'x' + h + ': robot/RUN khuất (board ' + JSON.stringify(vis.board) + ', run ' + JSON.stringify(vis.run) + ', vh ' + vis.vh + ')');
      if (w <= 915 && vis.vh <= 520) {
        if (noPageScroll) ok('viewport ' + w + 'x' + h + ': không cuộn cả trang (scrollH=' + vis.scrollH + ')');
        else fail('viewport ' + w + 'x' + h + ': trang vẫn cuộn (scrollH=' + vis.scrollH + ' > vh=' + vis.vh + ')');
      }
      p.ws.close();
    }
    cdp.ws.close();
  } catch (e) {
    fail('browser QA crash: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e));
  } finally {
    try { chrome.kill('SIGKILL'); } catch (e) {}
  }
  console.log('');
  if (failures.length) { console.log('BROWSER QA: ' + failures.length + ' LỖI'); process.exit(1); }
  console.log('BROWSER QA: PASS');
})().catch(function (e) { console.error(e); process.exit(1); });
