# Báo cáo chất lượng level — Coding Maze Rescue V7.2

Số liệu đo bằng `tests/validate-levels.js` (BFS trên lưới + chạy lời giải bằng chính engine).
"Ngã rẽ/ngõ cụt" = số ô sàn có ≥3 lối đi / số ô sàn chỉ có 1 lối (không tính ô xuất phát và ô đích).
"Khối/Bước/Rẽ" = số khối trong lời giải mẫu / số lệnh robot thực thi / số lần đổi hướng.
"Độ khó dự kiến" là ước lượng của người thiết kế cho trẻ 8–12 tuổi, CHƯA đo bằng playtest thật.
Tất cả 15 lời giải mẫu đều thắng; mọi bẫy và đường thay thế trong validator đều đạt.

| Level | Kích thước | Ngã rẽ/Ngõ cụt | Kỹ năng học | Độ khó dự kiến | Lời giải kiểm tra | Khác biệt |
|---|---|---|---|---|---|---|
| 1 Bước đầu tiên | 5×3 | 0/0 | Đi tới, bấm RUN | Dễ | 3 khối / 3 bước / 0 rẽ — thắng | Giữ V7.1: học thao tác đầu tiên |
| 2 Rẽ phải nào | 5×5 | 0/1 | Rẽ phải theo hướng robot | Dễ | 5 khối / 5 bước / 1 rẽ — thắng | Giữ V7.1 |
| 3 Sửa lệnh đầu tiên | 5×5 | 0/2 | Sửa lỗi: xóa lệnh thừa, quay trái từ đầu | Dễ | 3 khối / 3 bước / 1 rẽ; prefill sai 1 lệnh lá, không thắng | Giữ V7.1; màn sửa lỗi đầu tiên |
| 4 Ngã ba đầu tiên | 8×7 | 4/0 | Chọn đường: hai đường đi đều tới nơi | Dễ–TB | 12 khối / 12 bước / 3 rẽ; đường dưới thay thế cũng thắng | MỚI: lần đầu có lựa chọn thật, không còn hành lang đơn |
| 5 Đường thẳng bị chặn | 7×5 | 1/0 | Quan sát trước khi viết: đường thẳng bị tường chặn, phải đi vòng | TB | 11 khối / 11 bước / 3 rẽ; bẫy đi thẳng đâm tường | MỚI: "nhìn thấy đích" nhưng không đi thẳng được |
| 6 Đường tắt là ngõ cụt | 9×6 | 0/1 | Kiên nhẫn kiểm chứng: đường tắt trông ngắn nhất là ngõ cụt | TB | 17 khối / 17 bước / 6 rẽ; bẫy đường tắt không thắng, sửa lại thắng | MỚI: giải cứu đầu tiên đòi hỏi chọn đường |
| 7 Cái hố đầu tiên | 6×3 | 0/1 | Nhảy qua hố (bắt buộc: đi bộ không tới đích) | Dễ | 2 khối / 2 bước / 0 rẽ — thắng | Giữ V7.1 |
| 8 Nhảy tắt hay đi vòng? | 9×5 | 0/2 | Đánh đổi: nhảy tắt 5 khối hoặc đi vòng 13 khối, đều thắng | TB | 5 khối / 5 bước / 0 rẽ; đường vòng không nhảy cũng thắng | MỚI: nhảy là lựa chọn, không phải bắt buộc |
| 9 Sửa cú nhảy | 7×5 | 0/1 | Sửa lỗi: vị trí nhảy (bước thừa trước khi nhảy → rơi hố) | TB | 9 khối / 9 bước / 2 rẽ; prefill sai 1 lệnh lá, không thắng | Giữ V7.1 |
| 10 Cầu thang ba bậc | 7×6 | 0/0 | Lặp mẫu [đi, rẽ phải, đi, rẽ trái] ×3 + 1 bước đuôi | TB | 6 khối (tối đa 7) / 13 bước / 6 rẽ; viết phẳng cần 13 khối > 7 nên Lặp bị ép thật | MỚI: lặp gắn với cấu trúc cầu thang, không còn hành lang dài |
| 11 Hai gian phòng giống nhau | 8×7 | 0/0 | Xác định phần nào nên lặp: chỉ lặp 2 gian phòng, đoạn cuối đứng ngoài Lặp | TB–Khó | 9 khối (tối đa 10) / 13 bước / 5 rẽ; bẫy nhét đuôi vào Lặp và lặp thừa đều thất bại | MỚI: bài học "phần nào không lặp" |
| 12 Ba nhịp cầu | 15×3 | 0/1 | Lặp mẫu [đi, nhảy, đi] ×3 đúng số lần | TB | 4 khối (tối đa 5) / 9 bước / 0 rẽ; lặp thiếu (×2) dừng giữa đường | MỚI: lặp thiếu là thất bại. Lưu ý: lặp thừa (×4) vẫn thắng vì đã tới đích ở vòng 3 — hệ quả của luật "tới đích là thắng", không phải lỗi |
| 13 Hành trình ba chặng | 12×7 | 4/3 | Tổng hợp: tránh ngõ cụt ở ngã ba, cầu thang lặp, nhảy qua hố cuối | Khó | 15 khối / 18 bước / 6 rẽ — thắng | MỚI: ba vùng, ba kỹ năng trong một màn |
| 14 Sửa hai lỗi | 11×7 | 1/2 | Sửa lỗi phức tạp: sai số lần lặp + sai một lệnh rẽ | Khó | 16 khối / 19 bước / 6 rẽ; prefill cách lời giải 4 lệnh lá, không thắng | MỚI: màn debug khó nhất, hai lỗi độc lập |
| 15 Giải cứu Bạn Sao | 12×12 | 1/2 | Tổng hợp cuối: ngã ba, nhảy, cầu thang lặp, ngõ cụt gần đích | Khó nhất | 22 khối / 24 bước / 8 rẽ — thắng | MỚI: nhiệm vụ cuối chương, không phải bản đồ lớn nhất vì mục đích mà là bài toán tư duy tốt nhất |

## Nhận xét chung

- Từ màn 4 trở đi, mọi màn đều có ít nhất một trong: ngã rẽ, ngõ cụt, đường vòng, đường
  tắt bị chặn, hoặc lựa chọn nhảy/vòng. V7.1 đo cùng công cụ cho 0 ngã rẽ ở mọi màn.
- Không màn nào lặp lại cùng một mô-típ đơn điệu: mỗi màn 4–15 có một "cú twist" riêng
  (hai đường, đường chặn, ngõ cụt, nhảy-tắt-đi-vòng, lặp-thừa-thiếu, hai lỗi, ngõ cụt cuối).
- Độ khó tăng bằng số quyết định và số kỹ năng kết hợp, không tăng bằng độ dài đường đi:
  màn khó nhất (15) có 24 bước nhưng 8 lần đổi hướng và 4 vùng quyết định; màn 15 cũng là
  màn nhiều khối nhất (22 khối) — dài hơn hẳn các màn trước (tối đa 17 khối ở màn 6) nên
  trẻ cần kiên nhẫn xếp chương trình, đổi lại đây là màn cuối chương sau 14 màn làm quen.
- Các màn không ép một lời giải duy nhất: màn 4 và màn 8 có nhiều lời giải thắng hợp lệ;
  validator chỉ khóa các trường hợp làm vô hiệu mục tiêu học tập (bẫy phải thua, đường
  thay thế có chủ đích phải thắng).
