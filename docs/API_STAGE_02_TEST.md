# Kiểm thử tích hợp đợt 2: Hồ sơ và mật khẩu

Phụ thuộc: đăng nhập thành công ở đợt 0–1. Dùng tài khoản BE thử nghiệm.

1. Chạy `npm.cmd run dev`, mở http://localhost:5173/auth/login (không dùng 127.0.0.1 do CORS).
2. Đăng nhập, mở `/profile`. Sửa họ tên và số điện thoại, lưu rồi F5: dữ liệu phải được giữ.
3. Thử tên chỉ có khoảng trắng hoặc số điện thoại sai: phải báo lỗi, không báo lưu thành công.
4. Nhập sai mật khẩu hiện tại và mật khẩu mới hợp lệ: BE báo lỗi, vẫn ở trang hồ sơ.
5. Nhập mật khẩu xác nhận khác: form phải chặn.
6. Đổi mật khẩu đúng: quay về đăng nhập. Đăng nhập bằng mật khẩu mới thành công; mật khẩu cũ thất bại.

API: GET/PUT `/api/users/me`, POST `/api/auth/change-password`. Payload hồ sơ chỉ gồm fullName và phoneNumber; avatar không bị ghi đè. BE thu hồi refresh token sau đổi mật khẩu; FE xóa phiên và cache.

Chưa nối đăng ký, quên/reset mật khẩu, upload avatar hoặc các màn nghiệp vụ. Phiên API dùng sessionStorage theo tab; chưa hỗ trợ đồng bộ refresh giữa nhiều tab.

Kiểm thử tự động dùng response giả lập theo contract BE, không thay đổi tài khoản trên server. Người dùng cần xác nhận các bước trên với BE thật trước đợt tiếp theo.
