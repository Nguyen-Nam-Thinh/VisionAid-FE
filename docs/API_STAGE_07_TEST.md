# Đợt 7 — Cảnh báo Caregiver

## Điều kiện test BE thật

- BE phải cho phép CORS origin đang dùng. Lỗi OPTIONS thiếu header ngày 2026-10-01 vẫn cần sửa cấu hình VPS; FE không khắc phục được bằng thay đổi màn hình.
- Đăng nhập Caregiver có active link với VIU; quyền xem chỉ cần link. Xử lý cần canReceiveAlerts=true, không bắt buộc primary.
- Cần cảnh báo test do Mobile/BE tạo. Web không POST SOS hoặc dismiss. Chỉ test cảnh báo thử nghiệm đã thống nhất với nhóm, không tạo cảnh báo khẩn cấp thật để thử.

## Thứ tự API và checklist

1. /caregiver/alerts -> GET /api/emergency-events (pageSize=20). Lọc trạng thái, mã VIU, từ/đến theo múi giờ trình duyệt; khoảng thời gian gửi ISO UTC. Chuyển trang, dữ liệu rỗng và retry lỗi.
2. Xem chi tiết -> GET /api/emergency-events/{id}; GET /api/caregiver-links theo VIU kiểm tra canReceiveAlerts. Kiểm tra GPS null không thành 0 giả, lịch sử có actor null hiển thị Hệ thống. API chưa trả tên VIU, hiện mã UUID.
3. Sent -> nhấn Tiếp nhận -> xác nhận -> PUT acknowledge với notes hoặc null -> GET lại list/detail. Chỉ thông báo cập nhật khi BE trả thành công.
4. Acknowledged -> Resolve, và dùng cảnh báo test khác cho nhánh Sent/Acknowledged -> Escalate -> Resolve. PUT escalate trả danh sách liên hệ; chỉ hiển thị thông tin, không tự gọi/mở Zalo, không tự đặt Called.
5. Khi người khác đã xử lý: GET kiểm tra trước ghi hoặc BE trả 409/422; tải lại trạng thái và báo chưa xác nhận thành công. Không retry mutation tự động khi timeout/401/500. GET trước PUT không thay thế khóa/concurrency ở BE; vẫn có cửa sổ race cần BE xử lý.
6. Gỡ quyền canReceiveAlerts: vẫn xem nhưng ẩn nút xử lý; gỡ link: GET detail/list 403 phải ẩn dữ liệu. Đổi phiên không giữ cache người trước. Admin không mở route. CenterAdmin endpoints có quyền BE nhưng UI trung tâm chưa mở trong checkpoint này.
7. Detected/Dismissed/Resolved/Called không có nút chuyển trạng thái. Resolve chỉ Sent/Acknowledged/Escalated; acknowledge chỉ Sent. Notes không bị FE tự áp giới hạn BE chưa quy định.
8. Không có snapshot: placeholder. SnapshotPath hiện là objectName từ MinioService.UploadAsync, chưa có endpoint/presigned URL tải ảnh trong contract này; không tự ghép URL hoặc công khai bucket.

## Phạm vi và bàn giao

5 API mới, tổng 38/107 operations Web. Caller: src/services/api/emergencies.ts; UI: src/pages/shared/ApiAlerts.tsx. Polling 30 giây khi tab hoạt động, chưa SignalR/FCM. Mã VIU có thể lấy từ trang người được chăm sóc; không ép tải toàn bộ danh bạ để lọc.

Unit tests, build/lint và Playwright fixture được chạy trước merge. Chưa nghiệm thu tài khoản BE thật. Production là main: chỉ push dev, người dùng tự đưa sang main. Đợt tiếp theo 8a: SignalR; không tự triển khai trước khi người dùng yêu cầu.

Kiểm tra đợt 7: 66 unit tests / 14 files pass; 2 Playwright API fixture (chuỗi thành công và conflict) pass; build/lint pass. Build còn cảnh báo chunk >500 kB. Chưa test BE thật.
