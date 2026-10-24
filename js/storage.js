// Coding Maze Rescue — luu tien trinh (localStorage), theo docs/SPEC.md: CMStorage.create(backend).
(function () {
  'use strict';

  var KEY = 'codingMazeRescue.progress.v1';

  function normalize(p) {
    var out = { unlocked: 1, done: [], sound: true };
    if (p && typeof p === 'object') {
      if (typeof p.unlocked === 'number' && isFinite(p.unlocked) && p.unlocked >= 1) {
        out.unlocked = Math.floor(p.unlocked);
      }
      if (Array.isArray(p.done)) {
        out.done = p.done.filter(function (n) { return typeof n === 'number' && isFinite(n); });
      }
      if (typeof p.sound === 'boolean') out.sound = p.sound;
      if (p.robot && typeof p.robot === 'object' &&
          (p.robot.gender === 'boy' || p.robot.gender === 'girl') &&
          typeof p.robot.name === 'string' && p.robot.name.trim()) {
        out.robot = { gender: p.robot.gender, name: p.robot.name.slice(0, 24) };
      }
    }
    return out;
  }

  function memoryBackend() {
    var m = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); }
    };
  }

  function create(backend) {
    if (!backend) {
      try {
        backend = typeof localStorage !== 'undefined' ? localStorage : memoryBackend();
      } catch (e) {
        backend = memoryBackend();
      }
    }

    function load() {
      try {
        var raw = backend.getItem(KEY);
        if (!raw) return normalize(null);
        return normalize(JSON.parse(raw));
      } catch (e) {
        return normalize(null);
      }
    }

    function save(progress) {
      var p = normalize(progress);
      try { backend.setItem(KEY, JSON.stringify(p)); } catch (e) { /* shortcut: het quota/bi chan thi bo qua, game van choi tiep */ }
      return p;
    }

    function reset() { return save(null); }

    return { load: load, save: save, reset: reset };
  }

  var CMStorage = { create: create };
  globalThis.CMStorage = CMStorage;
  if (typeof module !== 'undefined' && module.exports) module.exports = CMStorage;
})();
