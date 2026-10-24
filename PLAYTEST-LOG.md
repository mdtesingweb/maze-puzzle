# Nhật ký playtest — Coding Maze Rescue

Mục đích duy nhất: đo **cổng huỷ số 1 của V7** — con có TỰ MỞ game chơi tiếp không.

**Cổng huỷ:** trong 14 ngày, con tự mở game vào **≥ 4 ngày kể từ ngày 4 trở đi**.
- "Tự mở" = không ai rủ, không ai nhắc, không ai giao bài. Được nhắc mới mở thì ghi "không".
- Ngày 1–3 là tuần trăng mật (tò mò ban đầu), không tính vào cổng — nhưng vẫn ghi để có bối cảnh.

**Luật của bố/mẹ trong 14 ngày:** đưa điện thoại, rồi thôi. Không ngồi cạnh dạy, không giao "chơi cho hết màn X". Càng can thiệp, số liệu càng mất giá trị.

**Ngày 1** = ngày đầu con chơi bản mới trên điện thoại (dự kiến T7 24/10 — nếu con đã chơi tối 22/10 thì dời cả bảng lên, giữ nguyên thứ tự).

| Ngày | Tự mở? | Chơi tới màn | Ghi chú 1 dòng |
|---|---|---|---|
| 1 — T7 24/10 | (ngày đầu, chưa tính) | | |
| 2 — CN 25/10 | (chưa tính) | | |
| 3 — T2 26/10 | (chưa tính) | | |
| 4 — T3 27/10 | | | |
| 5 — T4 28/10 | | | |
| 6 — T5 29/10 | | | |
| 7 — T6 30/10 | | | |
| 8 — T7 31/10 | | | |
| 9 — CN 1/11 | | | |
| 10 — T2 2/11 | | | |
| 11 — T3 3/11 | | | |
| 12 — T4 4/11 | | | |
| 13 — T5 5/11 | | | |
| 14 — T6 6/11 | | | |

**5 điều để ý trong 2–3 buổi đầu** (mỗi buổi 1 dòng, không cần ghi chép nặng):
1. Màn 2–3: trái/phải theo hướng robot có làm con lúng túng không? Màn 3 (sửa chương trình sai) con tự tìm ra chỗ sai hay thử-sai ngẫu nhiên? Có bấm "Từng bước"?
2. Màn 10–12: con có thấy "lặp tay mệt quá" TRƯỚC khi dùng khối Lặp lại không (đúng ý đồ thiết kế), hay coi khối Lặp là rắc rối thêm?
3. Khi robot đâm tường/thua: con bấm chạy lại ngay hay bỏ xuống? Nhớ màn đầu tiên con nản.
4. Cuối buổi: con có đòi chơi tiếp / hỏi "mai chơi nữa không"?
5. Tay cầm kéo ⋮⋮ trên điện thoại: con có tự phát hiện ra cách kéo không, hay loay hoay?

**Đọc kết quả sau ngày 14 (6/11):** đếm số ngày "Tự mở = có" từ ngày 4 → 14. ≥ 4: cổng qua. < 4: cổng huỷ kích hoạt — dừng mở rộng 100 màn, quay lại quyết định hướng đi.
