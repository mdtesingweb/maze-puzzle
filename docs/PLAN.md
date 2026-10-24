# Coding Maze Rescue — Implementation Plan

> Theo Superpowers (writing-plans) + Ponytail full. User đã duyệt hướng trong brief V7.1 và yêu cầu bắt đầu ngay, tự quyết định chi tiết nhỏ (đã ghi trong SPEC.md và README).

**Goal:** Game prototype HTML5 chơi ngay (file:// hoặc server tĩnh): robot chạy chương trình khối lệnh qua 15 mê cung, giải cứu bạn; RUN/STEP/PAUSE/RESET, REPEAT, JUMP, debug, lưu tiến trình.

**Architecture:** Script thường, namespace toàn cục theo SPEC.md. Engine thuần logic (test bằng Node), levels là dữ liệu, art/audio tách khỏi luật chơi, game.js là controller + animation theo event trace của executor.

## Tasks
- [ ] T1 Engine + Storage + unit tests (Agent 1) — `js/engine.js`, `js/storage.js`, `tests/run-tests.js`.
- [ ] T2 Levels (Agent 2) — `js/levels.js`: 15 màn đúng thiết kế trong brief giao việc, mỗi màn có solution; 3 màn debug (3, 9, 14) có prefill không thắng.
- [ ] T3 Art + Audio (Agent 3) — `js/art.js`, `js/audio.js` theo API trong SPEC.
- [ ] T4 Tích hợp (Agent 6 = main) — `index.html`, `css/style.css`, `js/editor.js`, `js/game.js`.
- [ ] T5 QA (Agent 5 = main + tests) — chạy tests (gồm kiểm chứng solution 15/15), `node --check` mọi file JS, kiểm tra responsive bằng CSS breakpoints 360/390/desktop, sửa lỗi.
- [ ] T6 Đóng gói — ZIP, README.md, KNOWN_ISSUES.md, bàn giao.

**Quyết định đã chốt (Ponytail):** không framework/bundler; canvas cho bàn chơi, DOM cho khối lệnh; tap-to-add thay drag-and-drop; âm thanh tổng hợp WebAudio thay file; REPEAT không lồng nhau ở prototype; giới hạn khối chỉ đặt ở màn 11 (6 khối) và 12 (5 khối) để dạy REPEAT, solution mẫu phải vừa giới hạn.
