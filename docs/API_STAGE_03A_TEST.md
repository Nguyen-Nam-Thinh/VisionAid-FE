# Test checkpoint 3a — Đăng ký và đăng xuất mọi thiết bị

Mở http://localhost:5173/auth/register. Dùng tài khoản/email thử nghiệm của bạn.

1. Nhập mật khẩu và xác nhận khác nhau: form báo lỗi, không gửi đăng ký.
2. Mật khẩu thiếu chữ hoa/thường/số/ký tự đặc biệt: phải báo lỗi; 8–100 ký tự.
3. Email đã có: BE trả lỗi trùng; không vào dashboard và không tạo dữ liệu demo.
4. Email mới: đăng ký thành công -> GET /api/users/me -> dashboard Caregiver; F5 vẫn giữ phiên.
5. Logout bình thường -> login tài khoản mới vẫn được.
6. Vào /profile -> Đăng xuất tất cả thiết bị -> Hủy: vẫn giữ phiên, không gọi logout-all.
7. Mở lại -> Xác nhận: POST /api/auth/logout-all, về login, xóa sessionStorage và cache local.
8. Test một browser khác có cùng tài khoản: sau logout-all, refresh token cũ bị từ chối. Access token còn hạn có thể vẫn truy cập được: đây là hành vi BE hiện tại, không phải FE đã đăng xuất ngay thiết bị đó.
9. Nếu logout-all lỗi mạng: tab hiện tại vẫn thoát, thông báo chưa xác nhận thu hồi trên thiết bị khác; đăng nhập lại để thử lại.

Luồng API cần test chung: register -> GET me -> reload/refresh -> logout-all -> login.
Nếu register đã tạo tài khoản nhưng GET me lỗi, thử login trước khi gửi register lại.

Đồng ý chính sách riêng tư: hoãn theo yêu cầu người dùng vì chưa có nội dung và policyVersion chính thức. Không có API consent tự động hoặc checkbox đồng ý giả.
Quên/reset mật khẩu là checkpoint 3b, chưa triển khai ở đây.

Kiểm thử tự động dùng fixture; chưa tạo tài khoản hoặc thu hồi phiên thật trên BE thay người dùng.

Kết quả tự động: 39 unit tests, 7 Playwright API fixture tests (runner exit 0), build và lint đều đạt. Build còn cảnh báo chunk >500 kB. Chưa test đăng ký/logout-all trên BE thật.
