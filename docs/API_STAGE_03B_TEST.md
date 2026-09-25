# Test checkpoint 3b — Quên và đặt lại mật khẩu

Phụ thuộc: tài khoản BE có email bạn đọc được; BE chạy SMTP và Redis. Không dùng email người khác.

1. Mở http://localhost:5173/auth/recover; nhập email tài khoản thử nghiệm, gửi một lần.
2. Thông báo phải là “Nếu email này đã đăng ký…”; không hiển thị mã demo và không khẳng định email tồn tại.
3. Kiểm tra inbox/spam. BE hiện gửi liên kết visionaid://reset-password dành cho Mobile, hạn 15 phút.
4. Sao chép địa chỉ liên kết “Reset Password” trong email (không chỉ chữ hiển thị).
5. Mở http://localhost:5173/auth/reset, nhập đúng email, dán toàn bộ liên kết vào ô mã hoặc nhập token thô.
6. Nhập mật khẩu mới có 8–100 ký tự, chữ hoa/thường/số/ký tự đặc biệt và xác nhận khớp.
7. Thành công phải về login. Mật khẩu mới đăng nhập được, mật khẩu cũ bị từ chối.
8. Thử token đã dùng/hết hạn: phải báo lỗi, không báo đổi thành công. Yêu cầu email mới để lấy token mới nhất.
9. Email không khớp deep link hoặc URL không phải visionaid://reset-password: chặn trước khi gọi BE.
10. SMTP/mạng/429 lỗi: phải hiện lỗi, không hiện mã demo, không tự gửi lại liên tục.

Luồng API phải test chung: forgot-password -> BE gửi mail/Redis lưu token -> reset-password -> login -> GET me.
Nếu nhận thông báo chung nhưng chưa có mail, cần kiểm tra inbox/spam và cấu hình/log SMTP trên BE; FE không chứng minh mail đã giao.
BE thu hồi refresh token khi reset, nhưng access token còn hạn ở thiết bị khác có thể tiếp tục tới lúc hết hạn.

Token và mật khẩu không được lưu localStorage/sessionStorage, không thêm vào URL Web hoặc log. Khi báo lỗi, che token/password.
Không sửa BE trong checkpoint này. Đổi email link sang HTTPS Web là việc BE cần thống nhất riêng; hiện Web hỗ trợ sao chép/dán.
Consent tiếp tục hoãn. Chưa triển khai đợt 4.

Đã kiểm thử tự động: 42 unit, 8 API fixture E2E, 1 mock recovery regression; build/lint đạt. Chưa gửi mail thật hoặc đổi mật khẩu thật thay người dùng.
