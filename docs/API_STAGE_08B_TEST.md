# Đợt 8b — Tùy chọn và quy tắc thông báo

Ngày 2026-10-02. Chạy API mode, đăng nhập tài khoản thử nghiệm. Cần BE/CORS hoạt động; Web HTTPS phải gọi BE HTTPS. Không cần Firebase để test lưu cấu hình ở đợt này.

## Chuẩn bị và API phụ thuộc

- Caregiver: GET/PUT /api/notifications/preferences, chỉ tài khoản hiện tại.
- Admin hoặc CenterAdmin có organizationId: GET/POST /api/notifications/rules, PUT/DELETE /api/notifications/rules/{id}.
- Admin tạo rule riêng trung tâm: lấy UUID có thật từ trang Tổ chức (đợt 5a).
- Tạo/sửa/xóa -> GET list -> F5 xác nhận. Không có GET detail rule riêng.
- Dùng tổ chức thử nghiệm. Thay đổi quy tắc có thể ảnh hưởng việc gửi cảnh báo trong phạm vi đó.

## Test Caregiver

1. Mở /caregiver/notifications. Danh sách trống hiện chưa lưu tùy chọn; không giả định đã bật/tắt mọi cặp.
2. Bấm **Thiết lập tùy chọn**, chọn **Thông báo hệ thống**, **Email**, bật nhận và lưu.
3. F5, kiểm tra đúng cặp, đúng giá trị. Chỉnh sửa tắt, lưu, F5: hiện **Tắt nếu không bắt buộc**.
4. Thử cặp khác để xác nhận lưu một cặp không ghi đè cặp trước.
5. Mất mạng hoặc 403: hiện lỗi, không báo thành công. Tải lại để xác minh trước thử lại.
6. Đăng xuất, đổi tài khoản: không thấy tùy chọn tài khoản trước. Đây là tùy chọn người nhận, không chọn VIU.

API chưa trả isMandatory cho Caregiver và không cho Caregiver đọc rules. UI giải thích tùy chọn không vô hiệu hóa rule bắt buộc, không tự gán nhãn mandatory cho từng cặp. FCM chưa đăng ký trên browser; lưu Push không đồng nghĩa nhận được web push.

## Test quy tắc

1. Admin mở /admin/rules; CenterAdmin mở /center-admin/routing.
2. Kiểm tra phân trang và lọc loại/kênh/vai trò/trạng thái. CenterAdmin chỉ thấy global + own org; global có **Chỉ xem**, không nút sửa/xóa.
3. Tạo cặp chưa tồn tại, ví dụ SystemAlert + Email + Caregiver trên org thử. Admin nhập UUID org (để trống là global); CenterAdmin tự dùng org phiên. Xác nhận trước lưu.
4. Tạo lại cùng type/channel/role/org: BE trả 409 và giữ form, không báo thành công. Không retry mutation tự động.
5. Sửa rule: chỉ **Bắt buộc nhận** và **Đang áp dụng**, không sửa type/channel/role/org. Lưu, F5 kiểm tra.
6. Xóa rule thử: xác nhận rõ loại/kênh/vai trò/phạm vi; sau 204 mới làm mới danh sách.
7. CenterAdmin không org bị chặn. Response rule org khác bị từ chối; backend phải chặn sửa/xóa trái quyền kể cả gọi ngoài UI.
8. 403/404/409/5xx hoặc mất kết nối: hiện lỗi. Đóng form, tải lại trước gửi lại. Không có version/concurrency token nên chưa bảo đảm tránh ghi đè khi hai quản trị viên sửa đồng thời.

## Giới hạn và kiểm tra BE riêng

Không kết luận FCM/email/SignalR gửi đúng từ test lưu cấu hình. Delivery cần dữ liệu sự kiện, recipients, worker, SMTP/Firebase và tài khoản thử; không phát SOS thật chỉ để test form.

BE local có các điểm cần nhóm BE kiểm tra:
- EmergencyEventDispatcher.cs truy vấn global_notification_rules.is_enabled; GlobalNotificationRuleConfiguration.cs map IsActive sang is_active.
- Worker đẩy SignalR trực tiếp trước rules; SQL lấy rules chưa lọc target_role. Cần xác minh trên bản server deploy.
- Tắt preference/rule không đồng nghĩa ngắt GPS SignalR; kết nối 8a vẫn phục vụ GPS và REST refresh.

GET preferences/{userId} (của người khác) chưa mở UI; status/failed chờ đợt 13. Không sửa BE.
Tiếp theo 8c: cần Firebase public web config, VAPID và contract token lifecycle. Không đưa Firebase Admin private key vào FE.

## Bằng chứng tự động

- npm.cmd test: 74 tests / 16 files đạt.
- npm.cmd run test:e2e:api -- --grep "stage 8b": 3 scenario fixture Caregiver/Admin/CenterAdmin đạt.
- Build và lint đạt; build còn cảnh báo chunk >500 kB.
- Chưa test BE thật hoặc gửi thông báo thật. Chỉ push dev; người dùng đưa sang main khi muốn phát hành.
