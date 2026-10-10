# Đợt 11b — Giọng đọc hỗ trợ

2026-10-11. FE `/caregiver/tts`; source BE `f277b6a`, TtsPreferencesController + GetTtsPreferenceHandler + UpsertTtsPreferenceHandler/Validator. Nhánh `feat/tts-preferences-stage11b`. Đã triển khai FE, chờ test live.

## Chuỗi API cần test cùng nhau

GET users → chọn VIU → GET caregiver-links → GET users/{userId}/tts-preferences → popup → GET caregiver-links kiểm quyền mới nhất → PUT users/{userId}/tts-preferences → GET đọc lại. Nếu GET TTS404, thêm GET users/{id} xác minh VIU còn tồn tại; không tự tạo khi chỉ mở trang.

Mobile: đăng nhập đúng VIU → GET /api/users/me/tts-preferences → áp dụng cài đặt lên engine TTS thiết bị. Web không gọi /me thay cho VIU và không có xác nhận thiết bị đã áp dụng.

## Checklist người dùng

1. Đăng nhập Caregiver có active link, mở Giọng đọc hỗ trợ, chọn VIU. Secondary với các permission flags false vẫn được đọc/ghi theo handler BE. Người khác không có link phải bị từ chối.
2. Chưa có preference: hiện thông báo và nút tạo. Popup đề xuất Female, speed1, volume80%, Full, vi-VN; chưa lưu cho tới khi nhấn Lưu. VIU bị xóa hoặc server lỗi không được giả thành chưa có preference.
3. Tạo/sửa giọng Nam/Nữ, tốc độ từ 0.5 đến2, âm lượng0/80/100%, chế độ Minimal/Full và ngôn ngữ. Kiểm Network volumeLevel phải là0/0.8/1, không phải80/100. Tốc độ ngoài khoảng, volume ngoài0–100, ngôn ngữ chính rỗng hoặc chuỗi dài hơn10 bị chặn.
4. Lưu → đóng popup → reload trang → chọn lại đúng VIU: giữ đúng dữ liệu server, đặc biệt volume0. Ngôn ngữ phụ ban đầu en-US → xóa trắng → lưu/reload phải trống; gửi chuỗi rỗng, không gửi null vì null giữ dữ liệu cũ trong BE.
5. Gỡ link khi popup đang mở → nhấn lưu: không gửi PUT, hiển thị lỗi liên kết. Đổi VIU không giữ popup/cấu hình của VIU trước. Logout/đổi account không rò cache.
6. PUT400/403/402/500 hoặc mất mạng: popup giữ dữ liệu và báo lỗi, không tự gửi lại. Khi không rõ kết quả lưu, đóng popup và tải lại trước khi thử lại. GET402 giữ phiên và link xem license; không hiện nút tạo mặc định để né lỗi.
7. Popup desktop/tablet/mobile375: nằm giữa viewport, cuộn được toàn bộ form, Escape/Đóng trả focus, nút lưu khóa lúc request đang chạy.
8. Trên Mobile đúng VIU, tải lại preference và thử thực tế voice/speed/volume/language/detection. Giọng khả dụng phụ thuộc TTS engine và ngôn ngữ cài trên thiết bị. Web lưu thành công không đảm bảo Mobile áp dụng ngay; đặc biệt kiểm volume0 chỉ theo policy thiết bị đối với cảnh báo an toàn.

## Contract và giới hạn

- GET/PUT userId cho phép Admin/CenterAdmin/Caregiver ở BE; phạm vi đợt này chỉ UI Caregiver linked VIU. Không tạo thêm UI quản trị toàn hệ thống.
- GET404 có thể do thiếu preference hoặc user; FE xác minh userId/role bằng GET user trước khi đề xuất tạo. 403/402/5xx/sai DTO không dùng default để che lỗi.
- PUT upsert; null field giữ nguyên hoặc dùng default khi tạo. FE gửi các field của form, secondary trống gửi "". Không có DELETE hoặc reset ngầm.
- BE language validator chỉ kiểm không rỗng cho primary và tối đa10 ký tự; không có danh mục giọng/ngôn ngữ khả dụng. Web không tự khẳng định engine hỗ trợ mọi tag.
- Không có version/ETag cho cạnh tranh chỉnh sửa; BE nhận lần ghi sau cùng. Tải lại trước khi chỉnh nếu nhiều Caregiver cùng quản lý.
- Không thêm phát thử bằng Web Speech vì không đại diện giọng Mobile; không sửa BE/Mobile, không tự nghiệm thu đồng bộ.

## Bằng chứng tự động

126 unit tests đạt: percent0/80/100, body chính xác, quyền secondary/revoked, foreign user DTO, 404 kiểm target, lỗi khác không default, enum/range, không retry.
2 E2E fixture đạt: TTS tạo/sửa/reload/xóa language/lỗi ghi/revoked/402 và hồi quy auth Caregiver. Lint/build đạt, đã xem screenshot desktop/mobile375; build còn cảnh báo chunk lớn như trước.
Chưa gọi API ghi trên tài khoản deploy hoặc test TTS engine/Mobile thật. Tổng91/144 operations có caller Web; đợt tiếp theo12a khi người dùng yêu cầu.
