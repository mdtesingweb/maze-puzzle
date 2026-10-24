# CHANGELOG — Coding Maze Rescue V7.2 (so với V7.1)

Ngày bàn giao: 2026-10-24. Triết lý: mê cung khiến trẻ phải suy nghĩ (chọn đường, dự đoán lỗi,
nhận ra quy luật), không phải mê cung chỉ dài hơn. Không viết lại game, không thêm cơ chế mới
(IF/FUNCTION/cảm biến vẫn chưa có).

## 1. Thiết kế lại 15 màn (`js/levels.js` viết lại toàn bộ dữ liệu màn)

- Nhóm 1–3 giữ nguyên V7.1 (học thao tác, màn 3 sửa lỗi đầu tiên).
- Nhóm 4–6 MỚI: màn 4 có hai đường đi thật (đường trên 12 khối, đường dưới 11 khối);
  màn 5 đường thẳng bị tường chặn phải đi vòng; màn 6 đường tắt trông ngắn nhất lại là ngõ cụt.
- Nhóm 7–9: màn 7 giữ nguyên (nhảy bắt buộc); màn 8 MỚI — nhảy tắt (5 khối) hoặc đi vòng
  không cần nhảy (13 khối), trẻ tự chọn; màn 9 giữ nguyên (sửa cú nhảy).
- Nhóm 10–12 MỚI theo cấu trúc lặp thật (không còn hành lang dài + REPEAT ×N MOVE):
  màn 10 cầu thang 3 bậc mẫu [đi, rẽ phải, đi, rẽ trái] (tối đa 7 khối);
  màn 11 hai gian phòng giống nhau + đoạn cuối không được lặp (tối đa 10 khối);
  màn 12 ba nhịp cầu mẫu [đi, nhảy, đi] (tối đa 5 khối, lặp thiếu là dừng giữa đường).
- Nhóm 13–15 MỚI: màn 13 ba chặng (ngã ba + cầu thang lặp + nhảy); màn 14 sửa HAI lỗi
  (sai số lần lặp + sai một lệnh rẽ, prefill cách lời giải 4 lệnh lá); màn 15 tổng hợp 12×12
  (ngã ba + nhảy + cầu thang lặp + ngõ cụt gần đích).
- Kích thước: 5×3 → 15×3 (màn 12) và 12×12 (màn 15). Màn 12 rộng 15 ô nhưng chỉ 3 hàng
  nên vẫn nhìn rõ trên điện thoại ngang (tile ≥ 26px).
- Bạn cần cứu, thứ tự nhóm kỹ năng và số màn (15) giữ nguyên; chỉ đổi bản đồ, lời giải,
  câu chuyện và gợi ý. Vì vậy tiến trình V7.1 (màn đã mở/đã xong, robot đã chọn) vẫn dùng được.

## 2. Hệ thống kiểm tra level mới (`tests/validate-levels.js`)

- BFS đi bộ và BFS có nhảy trên lưới; đếm ngã rẽ (ô có ≥3 lối) và ngõ cụt thật;
  đếm ô trên đường lời giải có ngã rẽ; kiểm tra lời giải bằng chính engine;
  prefill không thắng; lời giải vừa maxBlocks; REPEAT bị ép thật (viết phẳng vượt maxBlocks);
  JUMP bắt buộc thật (màn 7, 9: đi bộ không tới đích).
- Chương trình bẫy (phải KHÔNG thắng): màn 5 đi thẳng vào tường; màn 6 đi đường tắt vào
  ngõ cụt; màn 11 nhét đoạn đuôi vào trong Lặp và lặp thừa 1 vòng; màn 12 lặp thiếu 1 vòng.
- Đường thay thế (phải THẮNG): màn 4 đi đường dưới; màn 8 đi vòng không cần nhảy.
- Kết quả V7.2: VALIDATOR PASS. V7.1 chạy cùng validator cho thấy mọi màn cũ đều có
  0 ngã rẽ trên đường lời giải — bằng chứng định lượng cho chẩn đoán "hành lang đơn".

## 3. Giao diện mobile landscape (`css/style.css`, `index.html`, `js/game.js`)

- Quyết định sản phẩm: ưu tiên điện thoại nằm ngang. Khi ngang và cao viewport ≤ 520px:
  thanh trên thu gọn (ẩn tagline), bố cục 2 cột (mê cung trái, editor phải), mỗi cột cuộn
  độc lập, cụm nút RUN/Từng bước/Làm lại + tốc độ dính đáy cột phải (sticky) nên robot và
  nút RUN luôn nhìn thấy cùng lúc, trang không cuộn tổng thể; tôn trọng safe-area hai bên.
- Điện thoại dọc: hiện banner gợi ý xoay ngang (không chặn chơi); bấm "Đã hiểu" thì tắt hẳn
  các lần sau (cờ `cmr.hideRotate` trong LocalStorage, tách khỏi tiến trình game).
- Desktop/tablet không đổi (media query landscape chỉ bật khi cao ≤ 520px).

## 4. Dữ liệu lưu (`js/storage.js`, `js/game.js`)

- Thêm trường `levelsVersion` (giữ khi hợp lệ, loại khi hỏng). Lần đầu mở V7.2, game đóng
  dấu `levelsVersion = 2` mà KHÔNG xóa màn đã mở/đã xong hay robot đã chọn (thứ tự màn
  và nhóm kỹ năng giữ nguyên nên dấu hoàn thành cũ vẫn có nghĩa).
- Thêm 1 test storage cho `levelsVersion`.

## 5. Cảm giác giải đố (§8 brief) — dùng lại cơ chế đã có, không thêm hiệu ứng mới

- Robot đã có biểu cảm ngạc nhiên (dizzy) khi đâm tường, hoảng sợ thu nhỏ (fall) khi rơi hố;
  khối gây lỗi tô đỏ; STEP cho thấy robot sai từ bước nào; bạn được cứu nhảy mừng khi thắng.
  Các cơ chế này được kiểm chứng lại trong browser QA trên màn mới (đặc biệt màn 6 bẫy
  đường tắt: robot đâm tường + thông báo lỗi, sửa lại thì thắng).

## 6. Không đổi (bảo toàn V7.1)

Engine, luật MOVE/TURN/JUMP/REPEAT (kể cả REPEAT lồng nhau tối đa 2 cấp), intro chọn robot
+ đặt tên, kéo khối sắp xếp, RUN/PAUSE/STEP/RESET/tốc độ, mỹ thuật và nhân vật, hệ thống
âm thanh WebAudio. Không regression: toàn bộ test V7.1 (đã cập nhật 2 kỳ vọng theo dữ liệu
màn mới: màn 5 không còn xuất phát hướng Nam; nút REPEAT ở màn 10 không còn là nút thứ 2
trong bảng lệnh) vẫn PASS.

## 7. Kết quả kiểm thử V7.2 (đã chạy thật)

- `node tests/run-tests.js`: **50 passed, 0 failed** (49 cũ + 1 test `levelsVersion` mới).
- `node tests/run-ui-test.js`: **23 passed, 0 failed**.
- `node tests/validate-levels.js`: **PASS** (bảng đầy đủ trong `docs/LEVEL_QUALITY.md`).
- `node tests/browser-qa.js` (Chromium headless, click DOM thật, bản bundle 1 file):
  **PASS** — intro đóng được; 15/15 màn thắng bằng lời giải mẫu; màn 6 bẫy không thắng rồi
  sửa lại thắng; STEP thắng màn 1; 0 console error; 4 viewport (640×360, 844×390, 915×412,
  1280×720) đều: robot + nút RUN cùng trong màn hình, landscape không cuộn trang.
  Ảnh chụp trong `qa-shots/` (kèm trong ZIP).

## 8. Chưa làm / chưa kiểm chứng (trung thực)

- Chưa playtest với trẻ 8–12 tuổi và chưa thử trên điện thoại Android thật (chỉ mới QA bằng
  Chromium headless với viewport của điện thoại). Đây vẫn là cổng kiểm chứng quan trọng nhất.
- Chưa làm video demo (brief ghi "nếu có thể"); đã có ảnh chụp 4 viewport thay thế.
- Không có camera/pan riêng cho mê cung lớn: màn 12×12 ở điện thoại ngang cần cuộn cột mê
  cung để thấy hết bản đồ (robot và nút RUN vẫn luôn thấy; cấu trúc tổng thể xem được bằng
  cách cuộn cột trái). Nếu playtest cho thấy trẻ bị lạc, bản sau sẽ thêm thu nhỏ toàn cảnh.
- Màn 12: lặp THỪA (×4) vẫn thắng vì robot đã tới đích ở vòng 3 — chỉ có lặp thiếu mới
  thất bại. Đây là hệ quả tự nhiên của luật "tới đích là thắng", không phải lỗi; đã ghi rõ
  trong báo cáo chất lượng.
- Màn 8: đi vòng không cần nhảy là lựa chọn có chủ đích (nhảy = đường tắt), không phải
  lỗ hổng thiết kế.
