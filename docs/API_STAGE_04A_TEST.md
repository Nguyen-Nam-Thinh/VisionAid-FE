# Test checkpoint 4a — Đọc người được chăm sóc và liên kết

Chuẩn bị: Caregiver BE có VIU/link đang hoạt động. Nếu tài khoản mới chưa có link thì danh sách rỗng là hợp lệ; 4b mới có tạo tài khoản/liên kết. Không cần đợt 3b hoạt động để test 4a, dùng tài khoản có sẵn.

1. Đăng nhập tại http://localhost:5173/auth/login bằng Caregiver, mở menu Người được chăm sóc (/caregiver/users).
2. Danh sách chỉ gồm VIU được phép; kiểm tra tên/email/điện thoại/trạng thái theo BE.
3. Tìm theo tên/email/điện thoại, thử chuỗi không có kết quả; chuyển trang nếu đủ dữ liệu.
4. Chọn người trong dropdown hoặc Xem liên kết. Danh sách link hiển thị chính/phụ và Gia đình/Tổ chức.
5. Bấm Xem quyền liên kết: kiểm tra nhận cảnh báo, quản lý gương mặt, quản lý địa điểm khớp BE. Không suy quyền từ role chính/phụ.
6. Đổi trang/tìm kiếm/đổi người: không giữ chi tiết của người cũ. Dropdown chỉ chứa người của trang hiện tại.
7. Nếu có người BE hỗ trợ, gỡ link thử nghiệm ở BE rồi Tải lại: người/chi tiết không còn được hiển thị. Không gỡ trên dữ liệu thực quan trọng.
8. Logout -> tài khoản Caregiver khác: không thấy dữ liệu phiên cũ. CenterAdmin/Admin không được mở route Caregiver.
9. Lỗi 403/mạng phải hiện lỗi và nút Thử lại; không fallback demo. Danh sách rỗng không được giả thành lỗi server.

Request cần xem trong Network:
GET /api/users?page=...&pageSize=10&role=VisuallyImpaired&isDeleted=false&search=...
GET /api/caregiver-links?page=...&pageSize=10&viuId=...&isActive=true
GET /api/caregiver-links/{id}

Không có POST/PUT/DELETE nghiệp vụ ở đợt này, không GET /users/{id} vì Caregiver không có quyền. Quyền liên kết chỉ được xem, chưa có quản lý secondary/QR/Map.
Bộ test tự động dùng fixture; phạm vi dữ liệu/permissions thực phải xác nhận với BE thật.
Đợt 3b hoãn theo người dùng: HTTP 500 forgot-password chưa được giải quyết; cần log Redis/SMTP/DB trên BE.

Kiểm tra 4a: 44 unit tests, 10 Playwright API fixture tests exit 0, build và lint đạt. Chưa nghiệm thu BE thật; build còn cảnh báo chunk >500 kB.
