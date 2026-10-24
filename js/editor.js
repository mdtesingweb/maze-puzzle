// Coding Maze Rescue — trình soạn chương trình khối lệnh (tap-to-add, thân thiện mobile).
// Global: CMEditor.create(els, callbacks)
(function () {
  'use strict';

  var LABELS = { MOVE: 'Đi tới', LEFT: 'Rẽ trái', RIGHT: 'Rẽ phải', JUMP: 'Nhảy', REPEAT: 'Lặp lại' };
  var ICONS = {
    MOVE: '<svg viewBox="0 0 24 24"><path d="M12 2.5 L19 11.5 L14.6 11.5 L14.6 21.5 L9.4 21.5 L9.4 11.5 L5 11.5 Z"/></svg>',
    LEFT: '<svg viewBox="0 0 24 24"><path d="M11 3 L4 10 L11 17 L11 12.6 C15.2 12.6 17.3 14.6 18.1 18.5 L21.2 18.5 C20.6 12.2 17 8.6 11 8.4 Z"/></svg>',
    RIGHT: '<svg viewBox="0 0 24 24"><g transform="translate(24,0) scale(-1,1)"><path d="M11 3 L4 10 L11 17 L11 12.6 C15.2 12.6 17.3 14.6 18.1 18.5 L21.2 18.5 C20.6 12.2 17 8.6 11 8.4 Z"/></g></svg>',
    JUMP: '<svg viewBox="0 0 24 24"><path d="M12 1.5 L17 7.5 L14.2 7.5 L14.2 12.5 L9.8 12.5 L9.8 7.5 L7 7.5 Z"/><rect x="2.5" y="17" width="7.5" height="3.4" rx="1.7"/><rect x="14" y="17" width="7.5" height="3.4" rx="1.7"/></svg>',
    REPEAT: '<svg viewBox="0 0 24 24"><path d="M19.6 12 A7.6 7.6 0 1 1 12 4.4 L12 1.8 L17.8 6 L12 10.2 L12 7.2 A4.9 4.9 0 1 0 16.9 12 Z"/></svg>'
  };
  var GRIP = '<span class="blk-handle" title="Giữ và kéo để di chuyển khối"><svg viewBox="0 0 10 16"><circle cx="2.6" cy="3" r="1.7"/><circle cx="7.4" cy="3" r="1.7"/><circle cx="2.6" cy="8" r="1.7"/><circle cx="7.4" cy="8" r="1.7"/><circle cx="2.6" cy="13" r="1.7"/><circle cx="7.4" cy="13" r="1.7"/></svg></span>';

  function findInList(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return { block: list[i], list: list, index: i };
      if (list[i].type === 'REPEAT') { var r = findInList(list[i].body || [], id); if (r) return r; }
    }
    return null;
  }
  var MAX_NEST = 2; // REPEAT lồng nhau tối đa 2 cấp — đủ dạy "vòng trong vòng", UI vẫn dễ nhìn cho trẻ
  function subtreeHas(block, id) {
    if (!block) return false;
    if (block.id === id) return true;
    if (block.type === 'REPEAT') return (block.body || []).some(function (b) { return subtreeHas(b, id); });
    return false;
  }
  function repeatDepth(block) { // khối thường = 0, REPEAT phẳng = 1, REPEAT chứa REPEAT = 2
    if (!block || block.type !== 'REPEAT') return 0;
    var m = 0;
    (block.body || []).forEach(function (b) { m = Math.max(m, repeatDepth(b)); });
    return 1 + m;
  }
  function blockLevel(list, id, level) { // cấp lồng của khối có id (cấp cao nhất = 1); 0 = không thấy
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return level;
      if (list[i].type === 'REPEAT') { var r = blockLevel(list[i].body || [], id, level + 1); if (r) return r; }
    }
    return 0;
  }
  // Di chuyển 1 khối sang danh sách đích (null = cấp cao nhất, hoặc id của khối REPEAT đích).
  // index = vị trí chèn trong danh sách đích SAU khi đã lấy khối ra khỏi chỗ cũ.
  // Trả false khi: thả vào chính nó/ruột của nó, hoặc lồng quá MAX_NEST cấp.
  function moveBlock(program, id, destOwnerId, index) {
    var src = findInList(program, id);
    if (!src || destOwnerId === id) return false;
    var destList;
    if (destOwnerId == null) {
      destList = program;
    } else {
      var owner = findInList(program, destOwnerId);
      if (!owner || owner.block.type !== 'REPEAT') return false;
      if (subtreeHas(src.block, destOwnerId)) return false;
      if (blockLevel(program, destOwnerId, 1) + repeatDepth(src.block) > MAX_NEST) return false;
      destList = owner.block.body;
    }
    src.list.splice(src.index, 1);
    var at = Math.max(0, Math.min(index, destList.length));
    destList.splice(at, 0, src.block);
    return true;
  }

  function countBlocks(program) {
    var n = 0;
    program.forEach(function (b) { n += 1 + (b.type === 'REPEAT' ? countBlocks(b.body || []) : 0); });
    return n;
  }

  function create(els, cb) {
    var level = null;
    var program = [];
    var seq = 0;
    var selectedId = null;
    var targetId = null; // id của REPEAT đang nhận lệnh mới
    var locked = false;

    function nid() { seq += 1; return 'b' + seq; }
    function cloneWithIds(blocks) {
      return blocks.map(function (b) {
        var c = { id: nid(), type: b.type };
        if (b.type === 'REPEAT') { c.count = b.count || 2; c.body = cloneWithIds(b.body || []); }
        return c;
      });
    }
    function find(id, list) {
      list = list || program;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) return { block: list[i], list: list, index: i };
        if (list[i].type === 'REPEAT') {
          var r = find(id, list[i].body);
          if (r) return r;
        }
      }
      return null;
    }
    function total() { return countBlocks(program); }

    // ---------- render ----------
    function renderPalette() {
      els.palette.innerHTML = '';
      level.tools.forEach(function (type) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pal-btn pal-' + type;
        btn.innerHTML = ICONS[type] + '<span>' + LABELS[type] + '</span>';
        btn.addEventListener('click', function () { addBlock(type, btn); });
        els.palette.appendChild(btn);
      });
    }

    function blockEl(b, inRepeat) {
      var el = document.createElement('div');
      el.className = 'blk blk-' + b.type + (inRepeat ? ' blk-child' : '');
      el.dataset.id = b.id;
      if (b.id === selectedId) el.classList.add('selected');
      if (b.type === 'REPEAT') {
        el.classList.add('blk-repeat');
        if (b.id === targetId) el.classList.add('is-target');
        var head = document.createElement('div');
        head.className = 'blk-head';
        head.innerHTML = GRIP + ICONS.REPEAT + '<span>Lặp lại</span>' +
          '<span class="rep-count">×' + b.count + '</span>' +
          '<span class="rep-iter hidden"></span>' +
          (b.id === targetId ? '<span class="rep-target-tag">đang thêm vào đây</span>' : '');
        head.addEventListener('click', function (e) { e.stopPropagation(); select(b.id); });
        el.appendChild(head);
        var body = document.createElement('div');
        body.className = 'blk-body';
        body.dataset.owner = b.id;
        if (!b.body.length) body.innerHTML = '<span class="blk-empty">Chạm nút lệnh ở trên để thêm vào đây</span>';
        b.body.forEach(function (child) { body.appendChild(blockEl(child, true)); });
        el.appendChild(body);
      } else {
        el.innerHTML = GRIP + ICONS[b.type] + '<span>' + LABELS[b.type] + '</span>';
        el.addEventListener('click', function (e) { e.stopPropagation(); select(b.id); });
      }
      return el;
    }

    function render() {
      els.program.innerHTML = '';
      if (!program.length) {
        els.program.innerHTML = '<p class="program-empty">Chưa có lệnh nào.<br>Chạm vào các nút lệnh ở trên để thêm nhé!</p>';
      } else {
        program.forEach(function (b) { els.program.appendChild(blockEl(b, false)); });
      }
      var t = total();
      els.blockCount.textContent = 'Số khối: ' + t + (level.maxBlocks ? ' / tối đa ' + level.maxBlocks : '');
      els.blockCount.classList.toggle('over', !!(level.maxBlocks && t > level.maxBlocks));
      renderSelBar();
      renderTargetNote();
    }

    function renderTargetNote() {
      var f = targetId ? find(targetId) : null;
      if (f) {
        els.targetNote.textContent = 'Đang thêm lệnh vào khối Lặp ×' + f.block.count + '. Bấm nút lệnh là lệnh chui vào trong Lặp. Bấm lại nút "Thêm lệnh vào Lặp này" để thoát.';
        els.targetNote.classList.remove('hidden');
      } else {
        els.targetNote.classList.add('hidden');
      }
    }

    function renderSelBar() {
      var f = selectedId ? find(selectedId) : null;
      if (!f) { els.selBar.classList.add('hidden'); return; }
      els.selBar.classList.remove('hidden');
      els.selName.textContent = 'Đã chọn: ' + LABELS[f.block.type] + (f.block.type === 'REPEAT' ? ' ×' + f.block.count : '');
      var isRep = f.block.type === 'REPEAT';
      els.actMinus.classList.toggle('hidden', !isRep);
      els.actPlus.classList.toggle('hidden', !isRep);
      els.actTarget.classList.toggle('hidden', !isRep);
      els.actTarget.textContent = targetId === f.block.id ? '✓ Đang thêm vào Lặp này' : '➜ Thêm lệnh vào Lặp này';
      els.actLeft.disabled = f.index <= 0;
      els.actRight.disabled = f.index >= f.list.length - 1;
    }

    // ---------- actions ----------
    function select(id) { if (locked) return; selectedId = id; render(); }
    function changed() { render(); if (cb.onChange) cb.onChange(); }

    function addBlock(type, btn) {
      if (locked || !level) return;
      if (level.maxBlocks && total() + 1 > level.maxBlocks) {
        if (cb.onTooMany) cb.onTooMany(level.maxBlocks);
        if (btn) { btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); }
        return;
      }
      if (window.CMAudio) CMAudio.click();
      var b = { id: nid(), type: type };
      if (type === 'REPEAT') {
        b.count = 2; b.body = [];
        var destR = program;
        if (targetId) { // đang thêm vào trong 1 REPEAT và chưa quá MAX_NEST cấp thì REPEAT mới chui vào đó (lồng nhau)
          var tf = find(targetId);
          if (tf && blockLevel(program, targetId, 1) < MAX_NEST) destR = tf.block.body;
        }
        destR.push(b);
        selectedId = b.id; targetId = b.id;
      } else {
        var dest = program;
        if (targetId) { var f = find(targetId); if (f) dest = f.block.body; else targetId = null; }
        dest.push(b);
        selectedId = b.id;
      }
      changed();
    }

    function moveSelected(dir) {
      var f = selectedId ? find(selectedId) : null;
      if (!f) return;
      var j = f.index + dir;
      if (j < 0 || j >= f.list.length) return;
      var tmp = f.list[f.index]; f.list[f.index] = f.list[j]; f.list[j] = tmp;
      if (window.CMAudio) CMAudio.click();
      changed();
    }
    function changeCount(d) {
      var f = selectedId ? find(selectedId) : null;
      if (!f || f.block.type !== 'REPEAT') return;
      f.block.count = Math.min(9, Math.max(2, f.block.count + d));
      changed();
    }
    function toggleTarget() {
      var f = selectedId ? find(selectedId) : null;
      if (!f || f.block.type !== 'REPEAT') return;
      targetId = targetId === f.block.id ? null : f.block.id;
      changed();
    }
    function deleteSelected() {
      var f = selectedId ? find(selectedId) : null;
      if (!f) return;
      if (f.block.type === 'REPEAT' && targetId === f.block.id) targetId = null;
      f.list.splice(f.index, 1);
      selectedId = null;
      if (targetId && !find(targetId)) targetId = null;
      changed();
    }

    els.actLeft.addEventListener('click', function () { moveSelected(-1); });
    els.actRight.addEventListener('click', function () { moveSelected(1); });
    els.actMinus.addEventListener('click', function () { changeCount(-1); });
    els.actPlus.addEventListener('click', function () { changeCount(1); });
    els.actTarget.addEventListener('click', toggleTarget);
    els.actDelete.addEventListener('click', deleteSelected);

    // ---------- kéo để sắp xếp lại khối (Pointer Events: chuột + cảm ứng) ----------
    // Chuột: kéo từ bất cứ đâu trên khối. Cảm ứng: kéo bằng tay cầm (dấu chấm ở đầu khối),
    // phần còn lại của khối vẫn để cuộn danh sách và chạm chọn như cũ.
    var drag = null;
    var suppressClick = false;
    els.program.addEventListener('click', function (e) {
      if (suppressClick) { suppressClick = false; e.stopPropagation(); e.preventDefault(); }
    }, true);
    els.program.addEventListener('pointerdown', function (e) {
      if (locked || drag || !e.target.closest) return;
      var blk = e.target.closest('.blk');
      if (!blk || !els.program.contains(blk)) return;
      var isHandle = !!e.target.closest('.blk-handle');
      if (e.pointerType && e.pointerType !== 'mouse' && !isHandle) return;
      drag = { id: blk.dataset.id, el: blk, startX: e.clientX, startY: e.clientY, active: false, placeholder: null, destOwner: undefined };
      window.addEventListener('pointermove', onDragMove);
      window.addEventListener('pointerup', onDragUp);
      window.addEventListener('pointercancel', onDragUp);
    });
    function onDragMove(e) {
      if (!drag) return;
      if (!drag.active) {
        if (Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) < 9) return;
        drag.active = true;
        var ph = document.createElement('div');
        ph.className = 'blk-placeholder';
        ph.style.height = Math.max(36, drag.el.offsetHeight - 6) + 'px';
        drag.el.parentNode.insertBefore(ph, drag.el);
        drag.placeholder = ph;
        drag.el.classList.add('drag-src');
        selectedId = drag.id; renderSelBar();
      }
      if (e.cancelable) e.preventDefault();
      placePlaceholder(e.clientX, e.clientY);
    }
    function placePlaceholder(x, y) {
      var src = find(drag.id);
      var lists = [{ el: els.program, owner: null }];
      els.program.querySelectorAll('.blk-body').forEach(function (b) { lists.push({ el: b, owner: b.dataset.owner }); });
      var cand = null, candArea = Infinity;
      lists.forEach(function (L) {
        if (L.owner === drag.id) return;
        if (L.owner !== null && src) { // cùng luật với moveBlock: không vào ruột của chính nó, không lồng quá MAX_NEST
          if (subtreeHas(src.block, L.owner)) return;
          if (blockLevel(program, L.owner, 1) + repeatDepth(src.block) > MAX_NEST) return;
        }
        var r = L.el.getBoundingClientRect();
        if (x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 12 && y <= r.bottom + 12) {
          var area = (r.right - r.left) * (r.bottom - r.top);
          if (area < candArea) { candArea = area; cand = L; }
        }
      });
      if (!cand) return;
      var before = null;
      Array.prototype.forEach.call(cand.el.children, function (c) {
        if (before || c === drag.el || c === drag.placeholder || !c.classList || !c.classList.contains('blk')) return;
        var cr = c.getBoundingClientRect();
        if (y < cr.top + cr.height / 2) before = c;
      });
      if (before) cand.el.insertBefore(drag.placeholder, before);
      else cand.el.appendChild(drag.placeholder);
      drag.destOwner = cand.owner;
    }
    function onDragUp() {
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', onDragUp);
      window.removeEventListener('pointercancel', onDragUp);
      if (!drag) return;
      var d = drag; drag = null;
      if (!d.active) return;
      suppressClick = true;
      var parent = d.placeholder.parentNode;
      var idx = 0;
      for (var i = 0; i < parent.children.length; i++) {
        var c = parent.children[i];
        if (c === d.placeholder) break;
        if (c !== d.el && c.classList && c.classList.contains('blk')) idx++;
      }
      var destOwner = parent === els.program ? null : (parent.dataset.owner || null);
      d.placeholder.remove();
      d.el.classList.remove('drag-src');
      if (moveBlock(program, d.id, destOwner, idx)) {
        selectedId = d.id;
        if (window.CMAudio) CMAudio.click();
        changed();
      } else {
        render();
      }
    }

    // ---------- public API ----------
    return {
      loadLevel: function (lv) {
        level = lv;
        program = cloneWithIds(lv.prefill || []);
        selectedId = null; targetId = null;
        renderPalette();
        render();
      },
      getProgram: function () { return JSON.parse(JSON.stringify(program)); },
      isEmpty: function () { return program.length === 0; },
      clear: function () { if (locked) return; program = []; selectedId = null; targetId = null; changed(); },
      setLocked: function (b) {
        locked = b;
        els.palette.querySelectorAll('button').forEach(function (x) { x.disabled = b; });
        els.program.classList.toggle('locked', b);
        els.selBar.classList.toggle('hidden', b || !selectedId);
      },
      highlight: function (blockId, repeat) {
        els.program.querySelectorAll('.blk.running').forEach(function (x) { x.classList.remove('running'); });
        els.program.querySelectorAll('.rep-iter').forEach(function (x) { x.classList.add('hidden'); });
        if (!blockId) return;
        var el = els.program.querySelector('[data-id="' + blockId + '"]');
        if (el) {
          el.classList.add('running');
          if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        if (repeat && repeat.blockId) {
          var rep = els.program.querySelector('[data-id="' + repeat.blockId + '"] .rep-iter');
          if (rep) { rep.textContent = 'vòng ' + repeat.iter + '/' + repeat.count; rep.classList.remove('hidden'); }
        }
      },
      clearHighlight: function () {
        els.program.querySelectorAll('.blk.running').forEach(function (x) { x.classList.remove('running'); });
        els.program.querySelectorAll('.rep-iter').forEach(function (x) { x.classList.add('hidden'); });
      }
    };
  }

  window.CMEditor = { create: create, countBlocks: countBlocks, moveBlock: moveBlock, LABELS: LABELS };
  if (typeof module !== 'undefined' && module.exports) module.exports = window.CMEditor;
})();
