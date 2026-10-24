# Vấn đề đã biết — Coding Maze Rescue (prototype V7.1)

## Chưa kiểm chứng với người dùng thật
- Chưa playtest với trẻ 8–12 tuổi. Đây là cổng kiểm chứng quan trọng nhất theo nghiên cứu V7 (trẻ có tự quay lại chơi không, có hiểu Rẽ trái/phải theo hướng của Robot không, màn sửa lỗi có vui không) — cần buổi thử thật trước khi làm tiếp 100 màn.
- Đã kiểm thử tự động bằng Node (toàn bộ logic + lời giải 15 màn) và smoke test art/audio bằng canvas stub trong Node; đã kiểm tra tĩnh mọi tham chiếu DOM/file. Chưa mở thử thành công trong trình duyệt thật: công cụ trình duyệt của môi trường phát triển bị lỗi hạ tầng khi kiểm chứng (không kết nối được tới máy chủ game và không mở được tab kiểm thử) — lần mở `index.html` của người dùng sẽ là kiểm chứng trình duyệt thật đầu tiên. Chưa kiểm chứng trên điện thoại Android thật.

## Giới hạn chủ đích của prototype (không phải lỗi)
- REPEAT lồng nhau tối đa 2 cấp (chặn cấp 3 để chương trình không rối mắt trẻ); chưa có IF/ELSE, FUNCTION, cảm biến (kiến trúc đã để mở).
- Thêm lệnh vẫn là tap-to-add (không kéo từ bảng lệnh vào chương trình); đổi thứ tự thì đã có kéo khối trực tiếp + nút Trước/Sau dự phòng. Kéo trên cảm ứng dùng tay cầm ⋮⋮ ở đầu khối; chưa có tự cuộn danh sách khi kéo sát mép trên/dưới (danh sách tối đa ~15 khối, cuộn tay trước khi kéo là đủ cho prototype).
- Không có sao/điểm số và không phạt lời giải dài.
- Nút "Xóa hết" xóa ngay không hỏi lại — trẻ bấm nhầm sẽ phải xếp lại chương trình. Cân nhắc thêm xác nhận 2 chạm ở bản sau nếu playtest cho thấy trẻ hay bấm nhầm.
- Âm thanh chỉ phát sau thao tác chạm/bấm đầu tiên (chính sách autoplay của trình duyệt), và cần bật loa; đã có nút tắt/bật tiếng.

## Hạn chế kỹ thuật nhỏ
- Hiệu ứng rơi hố: Robot di chuyển vào ô hố với biểu cảm "fall" (thu nhỏ, mắt hoảng) chứ không có animation chìm dần từng khung hình.
- Khi chương trình đang chạy, editor bị khóa (đúng thiết kế để giữ tính xác định); muốn sửa phải Tạm dừng vẫn không sửa được — cần bấm Làm lại hoặc chờ chạy xong/thất bại. Đây là đánh đổi có chủ đích cho prototype; bản sau có thể cho sửa nóng khi đang tạm dừng.
- Canvas vẽ lại mỗi khung hình (60fps) kể cả khi đứng yên — đủ nhẹ cho mê cung tối đa 15×7 ô của 15 màn này, nhưng nếu mở rộng bản đồ lớn cần chuyển sang chỉ vẽ lại khi có thay đổi.
- Tiến trình lưu theo trình duyệt (LocalStorage): đổi trình duyệt/thiết bị hoặc xóa dữ liệu duyệt web là mất tiến trình. Không có tài khoản/đồng bộ ở prototype (đúng phạm vi).
