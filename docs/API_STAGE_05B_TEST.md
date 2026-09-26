# Đợt 5b — quản lý tài khoản

Chạy npm.cmd run dev và mở http://localhost:5173 (API mode). Cần Admin, CenterAdmin của tổ chức active, UUID tổ chức từ màn Tổ chức và email tài khoản thử nghiệm mới. Không dùng tài khoản quan trọng để thử reset/xóa.

## Admin — /admin/accounts

1. GET users: tìm tên/email/phone, lọc role/active/deleted/org UUID, phân trang. GET users/{id} khi chọn. Thử 403/500/response sai: báo lỗi, không fallback demo.
2. Tạo tài khoản: tên/email/password mạnh/nhập lại/role. Non-Admin bắt buộc mã tổ chức active. Web GET organization/{id} trước POST users; Admin có thể không thuộc tổ chức. Email trùng 409, org không tồn tại/inactive bị chặn. POST thành công -> xem detail, reload vẫn có.
3. Sửa tên/phone/avatarUrl -> GET detail kiểm tra trước PUT. Payload KHÔNG có email/role/org; để trống phone/avatar sẽ gửi chuỗi rỗng. F5 kiểm tra dữ liệu lưu. URL ảnh chỉ là văn bản, không upload ảnh ở đợt này.
4. Vô hiệu hóa -> Hủy không PATCH; Xác nhận -> GET detail, PATCH status {isActive:false}; reload đúng trạng thái. BE thu hồi refresh/FCM. Kích hoạt lại khi tổ chức cũng active. Tài khoản hiện tại không có nút tự vô hiệu hóa/xóa.
5. Đặt lại mật khẩu: nhập mạnh + nhập lại + checkbox xác nhận -> GET detail rồi PATCH reset-password {newPassword}. Không gọi forgot-password, không gửi mail. Thử mật khẩu yếu/không khớp/chưa xác nhận, đảm bảo không ghi. Dùng tài khoản test đăng nhập bằng mật khẩu mới; refresh cũ bị thu hồi. Nếu reset chính mình, Web logout sau thành công.
6. Xóa -> Hủy không DELETE; Xác nhận GET detail rồi DELETE 204 -> refetch/ẩn dòng. Lỗi DELETE giữ dialog và dữ liệu, cho biết chưa thành công. Chọn filter Đã xóa -> chỉ xem, không sửa/reset/status/restore. Chưa có API khôi phục user.

## CenterAdmin — /center-admin/staff và /center-admin/users

1. Hai màn lần lượt role Caregiver và VisuallyImpaired cố định. GET users gửi organizationId của phiên; BE cũng enforce own org. Kiểm tra không thấy tài khoản org B.
2. Tạo staff hoặc VIU: không chọn Admin/CenterAdmin, không nhập org ngoài; GET organizations/me xác minh active rồi POST users trong đúng tổ chức. Tạo user không tự phân công caregiver-link (đợt 5c).
3. Sửa/status/reset trong own org. Không có nút DELETE. Thử BE từ chối quyền: không thông báo thành công, không thay UI giả.
4. Logout rồi vào org B: không còn cache/chi tiết org A. Truy cập /admin/accounts phải forbidden.

## Lỗi và phụ thuộc

- Chuỗi tạo: login/me -> tổ chức active (5a) -> POST users -> GET list/detail. Phân công liên kết chưa mở, chờ 5c.
- Mutation tài khoản có sẵn: GET detail xác minh scope -> PUT/PATCH/DELETE -> refetch list/detail và số thành viên tổ chức.
- 500/mất phản hồi có thể xảy ra sau BE commit/audit. Đặc biệt POST: tìm email và tải lại trước khi gửi lại. Không tự retry mutation. Reset-password có thể đã đổi nếu mất phản hồi; xác minh trước khi tiếp tục.
- Reset admin không dùng SMTP nên không bị chặn bởi lỗi forgot-password 500 của 3b. Privacy consent vẫn để chờ.
- Kiểm thử tự động dùng fixture, chưa nghiệm thu BE thật. Dừng ở 5b để người dùng test trước 5c.

Kiểm tra 5b: 55 unit tests và 16 Playwright API fixture tests pass (exit 0); build/lint pass. Build còn cảnh báo chunk chính ~548 kB. Chưa ghi dữ liệu/test nghiệm thu BE thật.
