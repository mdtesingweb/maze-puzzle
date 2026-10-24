// Coding Maze Rescue — âm thanh tổng hợp WebAudio (không file ngoài).
(function () {
  'use strict';

  var ac = null;
  var on = true;

  // Tạo lười AudioContext; chỉ resume được sau thao tác người dùng, lỗi thì im lặng.
  function ctx() {
    if (!on) return null;
    try {
      if (!ac) {
        var AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return null;
        ac = new AC();
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    } catch (e) {
      return null;
    }
  }

  // Một nốt: freq -> freqEnd (trượt tần nếu có), bắt đầu sau delay giây.
  function tone(freq, freqEnd, dur, type, vol, delay) {
    var a = ctx();
    if (!a) return;
    try {
      var t0 = a.currentTime + (delay || 0);
      var osc = a.createOscillator();
      var gain = a.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain); gain.connect(a.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
    } catch (e) { /* im lặng an toàn */ }
  }

  var CMAudio = {
    isOn: function () { return on; },
    toggle: function () { on = !on; if (on) ctx(); return on; },
    click: function () { tone(880, null, 0.06, 'triangle', 0.15, 0); },
    step: function () { tone(560, 660, 0.07, 'sine', 0.12, 0); },
    turn: function () { tone(420, 640, 0.09, 'triangle', 0.12, 0); },
    jump: function () { tone(300, 920, 0.18, 'sine', 0.16, 0); },
    // 2 nốt trầm mềm, không chói tai trẻ.
    error: function () { tone(220, null, 0.13, 'triangle', 0.16, 0); tone(175, null, 0.18, 'triangle', 0.16, 0.13); },
    win: function () {
      var notes = [523, 659, 784, 1047];
      for (var i = 0; i < notes.length; i++) tone(notes[i], null, 0.16, 'triangle', 0.18, i * 0.09);
    },
    pop: function () { tone(760, 180, 0.08, 'sine', 0.2, 0); tone(1150, null, 0.06, 'sine', 0.1, 0.05); }
  };

  globalThis.CMAudio = CMAudio;
  if (typeof module !== 'undefined' && module.exports) module.exports = CMAudio;
})();
