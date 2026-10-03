# U1 — License status và xử lý 402

Triển khai FE ngày 2026-10-03. Dừng ở U1 để người dùng test; chưa làm U2/checkout.
Dùng API mode với BE HTTPS đã deploy. Không lưu password, token hoặc response cá nhân vào báo cáo.

## Cách test trên Web

1. Đăng nhập Caregiver cá nhân. Kiểm tra banner và mở **Xem license** hoặc mục **License** trong sidebar.
2. Đối chiếu trạng thái/thời hạn với GET /api/users/me; tên gói/trạng thái subscription với GET /api/licenses/subscription.
3. Với tài khoản Trial, kiểm tra số ngày còn lại; Active có nhãn đang hoạt động. Thời hạn hiển thị kèm múi giờ.
4. Với Expired trong 3 ngày: banner khoảng gia hạn. Sau 3 ngày: nhãn hết hạn. Đồng hồ UI chỉ diễn giải thời hạn; BE quyết định quyền. Có thể cần BE chuẩn bị tài khoản test từng trạng thái, không đổi đồng hồ máy production.
5. Với None: hiện chưa có license. Nếu profile thiếu/null/giá trị chưa nhận diện: hiện chưa xác định, không hiển thị Active giả.
6. Khi thao tác được BE trả 402: thông báo kiểm tra license; vẫn giữ phiên, không quay lại đăng nhập, không tự gửi lại thao tác ghi. Mở /license được. Chức năng safety chỉ hoạt động khi BE cho phép; FE không thêm chặn toàn trang.
7. Sau khi BE cập nhật license qua kênh được hỗ trợ, nhấn **Tải lại thông tin license**. Banner và subscription cập nhật. Profile/subscription tự refetch mỗi 60 giây khi tab hoạt động; không tự replay thao tác đã thất bại.
8. Đăng nhập Staff Caregiver thuộc tổ chức: banner được tổ chức bao phủ, không yêu cầu mua cá nhân; Network không gọi GET /api/licenses/subscription.
9. Admin/CenterAdmin: không yêu cầu subscription cá nhân, không gọi endpoint trên.
10. Đăng xuất rồi đổi tài khoản/org: không còn subscription của tài khoản cũ. Hồ sơ, bản đồ/cảnh báo vẫn theo quyền hiện hành.

## Lỗi cần thử

- Subscription 404: thông báo chưa tìm thấy subscription.
- 402: giữ phiên, có hướng dẫn xem license.
- 5xx hoặc DTO subscription không hợp lệ: báo lỗi; không hiện dữ liệu Active giả.
- Profile không tải được: giữ cách báo lỗi phiên hiện tại; không coi cache cũ là bằng chứng license hợp lệ.
- Tải lại sau lỗi để xác nhận dữ liệu hồi phục; không tăng số request mutation.

## Phạm vi và bằng chứng

- 77 unit tests đạt; lint và production build đạt. Có cảnh báo bundle >500 kB hiện hữu.
- 5 E2E U1 dùng fixture đạt: Trial/402/recovery, Staff/Admin/CenterAdmin exemptions, missing/Expired/404/503.
- Chưa nghiệm thu U1 với authenticated BE thật. Các fixes middleware /api/licenses, Staff org và kế thừa first Personal link do người dùng xác nhận, chưa đối chiếu runtime.
- Không mua/gia hạn, activate key, sửa pool hay tạo thanh toán trong U1. Các nút đó sẽ triển khai ở đợt tương ứng.
- Trial/Personal tối đa 3 VIU theo MaxViusPerCaregiver, không quota enforcement theo gói.
- Báo kết quả test kèm role, trạng thái license, endpoint + HTTP status (che thông tin cá nhân và token).

Hồi quy API fixture: lượt đầy đủ đạt 34/35, ca alert conflict=true timeout do nút xác nhận bị detach; chạy lại riêng đạt 1/1. Tổng 35 kịch bản đã có kết quả đạt qua các lượt; chưa khẳng định suite ổn định tuyệt đối. Không thay code alert trong U1.
