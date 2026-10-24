# SPEC THỐNG NHẤT — Coding Maze Rescue (mọi agent phải theo đúng)

## Lưới và ô
- Level `grid`: mảng chuỗi bằng nhau. Ký tự: `#` tường, `.` sàn, `H` hố, `S` ô xuất phát (sàn), `F` ô bạn bị kẹt (đích).
- Tọa độ: x = cột (trái→phải), y = hàng (trên→xuống), gốc (0,0) ở góc trên-trái.
- Hướng: 0=Bắc (0,-1), 1=Đông (1,0), 2=Nam (0,1), 3=Tây (-1,0). `startDir` là một ký tự `N|E|S|W`.

## Khối lệnh (program)
- Program = mảng block. Block cơ bản: `{id?, type:'MOVE'|'LEFT'|'RIGHT'|'JUMP'}`.
- Block lặp: `{id?, type:'REPEAT', count:2..9 (editor), body:[block]}` — REPEAT lồng nhau tối đa 2 cấp (editor chặn cấp 3; engine chạy bằng ngăn xếp khung lặp nên thực thi đúng với cấu trúc lồng hợp lệ, event.repeat = khung lặp trong nhất).
- `countBlocks(program)` = tổng số block, tính cả REPEAT (1) + từng block con (1 mỗi cái).

## Luật thực thi (engine, xác định, không phụ thuộc animation)
- MOVE: ô trước mặt là tường/ngoài lưới → lỗi `wall` (robot đứng yên, chương trình dừng). Là hố → lỗi `pit` (robot rơi xuống hố, `to` = ô hố). Là sàn/đích → đi tới; nếu đích thì thắng.
- LEFT/RIGHT: quay 90° tại chỗ, không bao giờ lỗi.
- JUMP: ô trước mặt KHÔNG phải hố → lỗi `jump-no-pit`. Ô đáp (cách 2 ô) là tường/hố/ngoài lưới → lỗi `jump-bad-land`. Ngược lại nhảy tới ô đáp; đích thì thắng.
- REPEAT: chạy body `count` lần. Mỗi lệnh cơ bản thực thi phát 1 event kèm `repeat:{blockId, iter (1-based), count}` nếu đang ở trong REPEAT.
- Hết chương trình mà chưa thắng/chưa lỗi → kết quả `incomplete`.
- Giới hạn `MAX_STEPS = 1000` lệnh cơ bản; vượt → lỗi `step-limit` (chống treo).

## API engine (`js/engine.js`, global `CMEngine`, đồng thời `module.exports` khi ở Node)
- `parseLevel(level)` → `{w, h, start:{x,y,dir}, goal:{x,y}, cell(x,y)}` với `cell` trả `'wall'|'floor'|'pit'|'goal'|'out'`.
- `createExecutor(level, program)` → executor `{state:{x,y,dir}, steps, done, won, failed, error, next()}`.
  `next()` trả event hoặc `null` khi đã xong. Event: `{kind:'move'|'turn'|'jump'|'error'|'end', cmd, blockId, from:{x,y,dir}, to:{x,y,dir}, error?, win?, repeat?}`.
  Khi thắng, event di chuyển cuối có `win:true`. Khi hết chương trình, `next()` trả `{kind:'end'}` đúng 1 lần.
- `runProgram(level, program)` → `{events, result:'win'|'error'|'incomplete', error, finalState:{x,y,dir}, steps}`.
- `countBlocks(program)`, `MAX_STEPS`.

## Level (`js/levels.js`, global `CMLevels`, `module.exports` khi ở Node)
Mỗi level: `{n, name, friend, story, hint, grid, startDir, tools:[type...], maxBlocks?, prefill?, solution}`.
`prefill`/`solution` là program không có `id`. Màn debug có `prefill` không thắng được.

## Art (`js/art.js`, global `CMArt`)
- `drawTile(ctx, kind, px, py, tile, t)` — kind `'wall'|'floor'|'pit'|'goal'`, px/py là tọa độ pixel góc trên-trái ô.
- `drawRobot(ctx, cx, cy, r, angleRad, mood, lift01, variant)` — mood `'idle'|'run'|'happy'|'dizzy'|'fall'`; angleRad 0 = hướng Đông, tăng theo chiều kim đồng hồ (màn hình). variant `'boy'|'girl'` do trẻ chọn ở intro (girl: điểm nhấn hồng, váy, nơ), mặc định `'boy'`. Tên robot do trẻ đặt được lưu trong progress (`robot:{gender, name}`) và game thay mọi chữ "Robot" trong story/gợi ý/thông báo bằng tên đó khi hiển thị.
- `drawFriend(ctx, cx, cy, r, variant, rescued, t)` — variant 0..4 (màu/tai khác nhau), chưa cứu thì có bong bóng kẹt bao quanh.
- Toàn bộ vẽ bằng canvas vector, không ảnh ngoài, không emoji.

## Audio (`js/audio.js`, global `CMAudio`)
`{isOn(), toggle(), click(), step(), turn(), jump(), error(), win(), pop()}` — WebAudio tổng hợp, không file ngoài, tự resume sau thao tác chạm đầu tiên, im lặng an toàn khi bị tắt hoặc không có AudioContext.

## Storage (`js/storage.js`, global `CMStorage`)
- `CMStorage.create(backend)` — backend có `getItem/setItem` (mặc định localStorage khi có). Trả `{load(), save(progress), reset()}`.
- Progress: `{unlocked: số level cao nhất đã mở (1-based), done: [n...], sound: bool, robot?: {gender:'boy'|'girl', name}}`. Mặc định `{unlocked:1, done:[], sound:true}` (chưa có `robot` cho tới khi trẻ qua intro; normalize giữ `robot` khi hợp lệ, loại khi hỏng).
- `load()` luôn trả progress hợp lệ kể cả khi dữ liệu hỏng/thiếu (merge với mặc định).

## Quy tắc chung
- JavaScript thuần, script thường (không module, không build) để mở `index.html` bằng file:// được.
- Mỗi file JS: bọc trong IIFE, `'use strict'`, cuối file có dòng xuất `module.exports` có điều kiện cho Node test.
- Không thư viện ngoài, không tài nguyên mạng. Mọi chuỗi hiển thị cho trẻ: tiếng Việt, ngắn, thân thiện.
