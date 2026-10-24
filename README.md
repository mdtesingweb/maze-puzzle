# Coding Maze Rescue — Robot Bíp giải cứu bạn

Game giải đố mê cung kết hợp lập trình trực quan cho trẻ 8–12 tuổi (bản prototype V7.1, phát triển từ nghiên cứu Muse V7 — concept thắng giải C1 "Đội Cứu Hộ Lệnh": khung giải cứu bạn + màn sửa lỗi là một thể loại màn chính thức).

Trẻ chạm để xếp các khối lệnh (Đi tới, Rẽ trái, Rẽ phải, Nhảy, Lặp lại), bấm **RUN** và xem Robot Bíp chạy chương trình qua mê cung để giải cứu người bạn bị kẹt trong bong bóng ở cuối đường. Sai thì robot phản ứng dễ thương, khối lệnh gây lỗi sáng đỏ — sửa lại rồi chạy tiếp, không phạt, không giới hạn số lần thử.

## Cách chạy

**Cách 1 (đơn giản nhất):** mở thẳng file `index.html` bằng Chrome (nhấp đúp, hoặc kéo thả file vào cửa sổ Chrome). Không cần server, không cần Internet, không cần cài gì thêm.

**Cách 2 (nếu muốn chạy qua server tĩnh):** trong thư mục này, chạy `python3 -m http.server 8000` rồi mở `http://localhost:8000`.

Tiến trình (màn đã mở, màn đã cứu, tắt/bật tiếng) được lưu tự động bằng LocalStorage trên chính trình duyệt/thiết bị đang chơi.

## Cách chơi

0. Lần đầu mở game: chọn bạn robot đồng hành (Robot Nam áo xanh / Robot Nữ hồng có nơ và váy) và đặt tên cho bạn ấy. Từ đó mọi câu chuyện, gợi ý và thông báo trong game đều gọi robot bằng tên em đặt — ví dụ chọn robot Nam tên "Muse" thì lời dẫn thành "…hãy dẫn Muse đi thẳng tới cứu bạn ấy nhé!" — và hình robot trên bàn chơi cũng đổi theo lựa chọn. Muốn đổi bạn khác hoặc sửa tên: bấm nút "🤖 Đổi robot" trên đầu trang.
1. Đọc câu chuyện của màn: bạn nào đang cần cứu, gợi ý ở khung vàng.
2. Chạm các nút lệnh màu để thêm khối vào chương trình. Chạm vào một khối đã thêm để chọn nó, rồi dùng thanh công cụ: **◀ Trước / Sau ▶** đổi thứ tự, **✕ Xóa lệnh**, với khối Lặp: **− / + Lặp** đổi số lần, **➜ Thêm lệnh vào Lặp này** để các lệnh bấm tiếp theo chui vào trong khối Lặp.
3. Bấm **▶ RUN** xem Robot chạy — khối đang chạy sáng lên, khối Lặp hiện "vòng x/y". **⏸ Tạm dừng / Chạy tiếp** bất cứ lúc nào. **👣 Từng bước** để xem từng lệnh một. **↺ Làm lại** đưa Robot về vạch xuất phát. Tốc độ 1×/2×.
4. Thắng màn: bong bóng vỡ, bạn được cứu nhảy mừng, mở khóa màn tiếp theo. Nút **🗺️ Chọn màn** xem bản đồ 15 màn và thành tích.

## 15 màn chơi

| Nhóm | Màn | Nội dung |
|---|---|---|
| Làm quen | 1–3 | Đi tới; rẽ phải; màn 3 là **màn sửa lỗi** đầu tiên (chương trình có sẵn bị sai) |
| Giải mê cung | 4–6 | Hành lang quanh co, ngõ cụt đánh lừa, đi vòng quanh hồ — cứu bạn thứ 5 |
| Thử thách mới | 7–9 | Xuất hiện **hố** và lệnh **Nhảy**; màn 9 là màn sửa lỗi cú nhảy |
| Khám phá vòng lặp | 10–12 | Giới thiệu **Lặp lại** trực quan; màn 11 (tối đa 6 khối) và 12 (tối đa 5 khối) buộc trẻ tự khám phá vì sao Lặp lại tiện hơn |
| Kết hợp kỹ năng | 13–15 | Mê cung dài; màn 14 **sửa lỗi vòng lặp**; màn 15 giải cứu Bạn Sao dùng mọi kỹ năng |

Có đúng 3 màn sửa lỗi (3, 9, 14) theo thiết kế. Không màn nào giới hạn số lệnh tùy tiện: chỉ màn 11/12 có giới hạn khối và gợi ý trong game giải thích rõ lý do (để học Lặp lại), lời giải mẫu luôn vừa giới hạn.

## Kiến trúc

Toàn bộ là JavaScript thuần, không framework, không thư viện ngoài, không tài nguyên mạng — mọi hình ảnh vẽ bằng Canvas vector, âm thanh tổng hợp bằng WebAudio.

**Robot là của riêng em**: chọn Nam/Nữ + đặt tên ở intro đầu game, lưu cùng tiến trình chơi. Toàn bộ chữ "Robot" trong lời dẫn/gợi ý/thông báo được thay bằng tên đã đặt tại một điểm duy nhất trong code (`personalize()` ở game.js) — không phải sửa dữ liệu 15 màn và không sót chỗ nào. Tên để trống thì nhận tên gợi ý (Nam: Bíp, Nữ: Bông), tối đa 12 ký tự.

| File | Vai trò |
|---|---|
| `index.html` | Khung trang, thứ tự nạp script |
| `css/style.css` | Giao diện responsive: ≥900px mê cung trái + editor phải; <900px mê cung trên + editor dưới, vùng chương trình cuộn riêng, không cuộn ngang |
| `js/engine.js` | Maze engine + trình thông dịch chương trình thuần logic, xác định, giới hạn 1000 bước chống treo. Không chứa animation |
| `js/levels.js` | Dữ liệu 15 màn: lưới, bạn cần cứu, gợi ý, chương trình sai sẵn (màn sửa lỗi), lời giải mẫu đã kiểm chứng |
| `js/editor.js` | Trình soạn khối lệnh tap-to-add, kéo để sắp xếp, chọn/xóa khối, khối Lặp và giới hạn số khối |
| `js/art.js` | Vẽ ô mê cung, Robot Bíp (biểu cảm idle/run/happy/dizzy/fall) và các bạn (5 biến thể) bằng Canvas |
| `js/audio.js` | Âm thanh WebAudio: click, bước, quay, nhảy, lỗi, thắng, vỡ bong bóng; nút tắt/bật tiếng |
| `js/game.js` | Controller: RUN/PAUSE/STEP/RESET, animation theo dòng event của engine, tô sáng khối đang chạy, tiến trình và mở khóa màn |
| `js/storage.js` | Lưu tiến trình vào LocalStorage, tự phục hồi mặc định nếu dữ liệu hỏng |
| `tests/run-tests.js` | Bộ test Node (không cần cài dependency) |

Đặc tả trạng thái/lệnh thống nhất mà mọi module tuân theo: `docs/SPEC.md`. Kế hoạch triển khai: `docs/PLAN.md`.

## Kiểm thử

Chạy: `node tests/run-tests.js` (logic + lời giải) và `node tests/run-ui-test.js` (hồi quy giao diện bằng DOM stub: vị trí/hướng của Robot ngay khi mở màn và khi chuyển màn).

Bao phủ: MOVE / TURN LEFT / TURN RIGHT (đủ 4 hướng), JUMP hợp lệ và 3 kiểu JUMP không hợp lệ, REPEAT (kèm số vòng), chạm tường, rơi hố, chạy hết chương trình chưa tới đích, hoàn thành màn, reset/chạy lại sau khi sửa lệnh, tính xác định (cùng đầu vào → cùng kết quả), giới hạn bước chống treo, lưu/mở khóa level, dữ liệu lưu hỏng, và **kiểm chứng lời giải mẫu của cả 15 màn bằng chính engine của game** (kèm kiểm tra chương trình sai sẵn ở 3 màn sửa lỗi không thắng được, và lời giải vừa giới hạn khối ở màn 11/12).

Kết quả tại thời điểm bàn giao: xem `KNOWN_ISSUES.md` và phần bàn giao trong chat — chỉ những gì đã chạy thật mới được ghi PASS.

## Quyết định thiết kế đã tự chốt (ghi theo yêu cầu)

- **Thêm lệnh bằng chạm (tap-to-add), đổi thứ tự bằng kéo**: chạm để thêm khối vì thao tác này tin cậy nhất trên điện thoại; đổi thứ tự bằng cách giữ và kéo khối (chuột kéo trực tiếp trên khối, cảm ứng nắm tay cầm ⋮⋮ ở đầu khối để không lẫn với cuộn trang), kéo vào/ra khối Lặp cũng được. Nút Trước/Sau vẫn giữ làm cách dự phòng.
- **REPEAT lồng nhau tối đa 2 cấp**: engine vốn chạy bằng ngăn xếp khung lặp nên thực thi vòng-lồng-vòng đã đúng sẵn; bản đầu khóa tính năng này ở editor cho đơn giản, nay mở theo yêu cầu thực tế — trẻ bấm/kéo thả REPEAT vào trong REPEAT được, cấp 3 bị chặn để chương trình không rối. Sự kiện chạy mang thông tin vòng lặp trong nhất (huy hiệu "vòng i/n" hiện ở khối Lặp con khi đang chạy trong nó).
- **Không sao/điểm, không phạt lời giải dài** (đúng khuyến nghị V7): phần thưởng là cứu được bạn và mở màn mới.
- **Giới hạn khối chỉ ở màn 11/12** và luôn có lời giải thích trong gợi ý của màn.
- Robot tên **Bíp**; 15 người bạn là các con vật/bạn nhỏ vẽ vector gốc (Gà Mơ, Mèo Miu, Thỏ Bông, …, Bạn Sao ở màn cuối).

## Mở rộng về sau

Engine tách khỏi trình diễn nên có thể thêm: lệnh IF/cảm biến, FUNCTION, thêm màn (chỉ cần thêm dữ liệu vào `js/levels.js` và một lời giải mẫu — bộ test sẽ tự kiểm chứng), chế độ 2 robot, và bản Android đóng gói từ cùng bộ file này.
