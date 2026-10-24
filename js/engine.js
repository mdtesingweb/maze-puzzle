// Coding Maze Rescue — engine thuan logic (khong phu thuoc animation/DOM).
// Theo docs/SPEC.md: CMEngine { parseLevel, createExecutor, runProgram, countBlocks, MAX_STEPS }.
(function () {
  'use strict';

  var MAX_STEPS = 1000;
  var DIRS = [
    { x: 0, y: -1 }, // 0 Bac
    { x: 1, y: 0 },  // 1 Dong
    { x: 0, y: 1 },  // 2 Nam
    { x: -1, y: 0 }  // 3 Tay
  ];
  var DIR_FROM_CHAR = { N: 0, E: 1, S: 2, W: 3 };

  function parseLevel(level) {
    var grid = (level && level.grid) || [];
    var h = grid.length;
    var w = h > 0 ? grid[0].length : 0;
    var dir = DIR_FROM_CHAR[level && level.startDir];
    var start = { x: 0, y: 0, dir: dir == null ? 0 : dir };
    var goal = null;
    var x, y, ch;
    for (y = 0; y < h; y++) {
      for (x = 0; x < grid[y].length; x++) {
        ch = grid[y].charAt(x);
        if (ch === 'S') { start.x = x; start.y = y; }
        if (ch === 'F') { goal = { x: x, y: y }; }
      }
    }
    function cell(cx, cy) {
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) return 'out';
      ch = grid[cy].charAt(cx);
      if (ch === '#') return 'wall';
      if (ch === 'H') return 'pit';
      if (ch === 'F') return 'goal';
      return 'floor'; // '.', 'S' va cac o con lai la san
    }
    return { w: w, h: h, start: start, goal: goal, cell: cell };
  }

  function createExecutor(level, program) {
    var parsed = parseLevel(level);
    var state = { x: parsed.start.x, y: parsed.start.y, dir: parsed.start.dir };
    // Stack khung lenh: khung REPEAT mang repeat {blockId, iter, count} cho cac lenh trong body.
    var stack = [{ blocks: program || [], index: 0, repeat: null }];

    var ex = {
      state: state,
      steps: 0,
      done: false,
      won: false,
      failed: false,
      error: null,
      next: next
    };

    function snapshot() { return { x: state.x, y: state.y, dir: state.dir }; }

    function currentRepeat() {
      for (var i = stack.length - 1; i >= 0; i--) {
        if (stack[i].repeat) return stack[i].repeat;
      }
      return null;
    }

    // Dua stack toi lenh co ban tiep theo (bo qua/mo khung REPEAT); tra null khi het chuong trinh.
    function nextBlock() {
      while (stack.length > 0) {
        var frame = stack[stack.length - 1];
        if (frame.index >= frame.blocks.length) {
          stack.pop();
          if (frame.repeat && frame.repeat.iter < frame.repeat.count) {
            frame.index = 0;
            frame.repeat.iter += 1;
            stack.push(frame);
          }
          continue;
        }
        var block = frame.blocks[frame.index];
        frame.index += 1;
        if (block && block.type === 'REPEAT') {
          var count = Math.floor(Number(block.count)) || 0;
          if (count > 0 && block.body && block.body.length > 0) {
            stack.push({ blocks: block.body, index: 0, repeat: { blockId: block.id, iter: 1, count: count } });
          }
          continue;
        }
        return block;
      }
      return null;
    }

    function makeEvent(kind, block, from, to, repeat) {
      var ev = { kind: kind, cmd: block.type, blockId: block.id, from: from, to: to };
      if (repeat) ev.repeat = repeat;
      return ev;
    }

    function failEvent(block, code, from, to, repeat) {
      ex.failed = true;
      ex.error = code;
      ex.done = true;
      var ev = makeEvent('error', block, from, to, repeat);
      ev.error = code;
      return ev;
    }

    function next() {
      if (ex.done) return null;
      while (true) {
        var block = nextBlock();
        if (!block) {
          ex.done = true;
          return { kind: 'end' };
        }
        if (block.type !== 'MOVE' && block.type !== 'LEFT' && block.type !== 'RIGHT' && block.type !== 'JUMP') {
          continue; // lenh la/khong hop le trong SPEC: bo qua
        }
        var rep = currentRepeat();
        var repeat = rep ? { blockId: rep.blockId, iter: rep.iter, count: rep.count } : null;
        if (ex.steps >= MAX_STEPS) {
          var s0 = snapshot();
          return failEvent(block, 'step-limit', s0, snapshot(), repeat);
        }
        ex.steps += 1;
        var from = snapshot();
        var d = DIRS[state.dir];
        var ev, c;

        if (block.type === 'LEFT' || block.type === 'RIGHT') {
          state.dir = (state.dir + (block.type === 'LEFT' ? 3 : 1)) % 4;
          return makeEvent('turn', block, from, snapshot(), repeat);
        }

        if (block.type === 'MOVE') {
          c = parsed.cell(state.x + d.x, state.y + d.y);
          if (c === 'wall' || c === 'out') {
            return failEvent(block, 'wall', from, snapshot(), repeat);
          }
          state.x += d.x;
          state.y += d.y;
          if (c === 'pit') {
            return failEvent(block, 'pit', from, snapshot(), repeat);
          }
          ev = makeEvent('move', block, from, snapshot(), repeat);
          if (c === 'goal') { ev.win = true; ex.won = true; ex.done = true; }
          return ev;
        }

        // JUMP
        if (parsed.cell(state.x + d.x, state.y + d.y) !== 'pit') {
          return failEvent(block, 'jump-no-pit', from, snapshot(), repeat);
        }
        c = parsed.cell(state.x + d.x * 2, state.y + d.y * 2);
        if (c === 'wall' || c === 'pit' || c === 'out') {
          return failEvent(block, 'jump-bad-land', from, snapshot(), repeat);
        }
        state.x += d.x * 2;
        state.y += d.y * 2;
        ev = makeEvent('jump', block, from, snapshot(), repeat);
        if (c === 'goal') { ev.win = true; ex.won = true; ex.done = true; }
        return ev;
      }
    }

    return ex;
  }

  function runProgram(level, program) {
    var ex = createExecutor(level, program);
    var events = [];
    var ev;
    while ((ev = ex.next()) !== null) events.push(ev);
    return {
      events: events,
      result: ex.won ? 'win' : (ex.failed ? 'error' : 'incomplete'),
      error: ex.error || null,
      finalState: { x: ex.state.x, y: ex.state.y, dir: ex.state.dir },
      steps: ex.steps
    };
  }

  function countBlocks(program) {
    var n = 0;
    var list = program || [];
    for (var i = 0; i < list.length; i++) {
      n += 1;
      if (list[i] && list[i].type === 'REPEAT') n += countBlocks(list[i].body);
    }
    return n;
  }

  var CMEngine = {
    MAX_STEPS: MAX_STEPS,
    parseLevel: parseLevel,
    createExecutor: createExecutor,
    runProgram: runProgram,
    countBlocks: countBlocks
  };

  globalThis.CMEngine = CMEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = CMEngine;
})();
