# Test đợt 4b — tạo VIU và liên kết chăm sóc

Chạy npm.cmd run dev, mở http://localhost:5173 ở API mode. Dùng Caregiver cá nhân (organizationId null), còn dưới 3 liên kết hoạt động và email VIU thử nghiệm chưa tồn tại. Không dùng tài khoản thật của người khác.

1. Vào Người được chăm sóc (/caregiver/users). Nhập tên/email/password mạnh/nhập lại/điện thoại. Bấm Bước 1. Network: GET caregiver-links kiểm tra số lượng rồi POST users (role VisuallyImpaired, organizationId null). Chưa POST link tự động.
2. Ghi lại UUID hiển thị. F5: vẫn ở Bước 2; không POST users lần nữa. Chọn quyền và tạo liên kết. Network POST caregiver-links; GET users tải lại và hiển thị VIU.
3. Xem liên kết/quyền. BE tự quyết định primary; không coi checkbox quyền là bằng chứng cấp quyền trước khi BE thành công.
4. Tạo link thất bại: giữ mã VIU, sửa nguyên nhân rồi thử lại Bước 2. Không tạo lại tài khoản. 409 sẽ đọc lại link đúng scope; nếu không thấy link, vẫn báo lỗi. Nếu POST users trả 500/mất phản hồi: nhờ admin kiểm tra email/ID, nhập UUID đã xác minh để tiếp tục.
5. Gỡ liên kết -> Hủy: không DELETE. Xác nhận: GET detail kiểm tra quyền/type rồi DELETE. 204: mất dòng và lựa chọn; tải lại vẫn không thấy. Không xóa tài khoản VIU. Nếu DELETE lỗi: dialog báo lỗi, không giả thành công; tải lại để xác minh khi lỗi có thể xảy ra sau commit.
6. Link Organization không có nút gỡ. Caregiver tổ chức không có form tạo VIU B2C. Kiểm tra tài khoản khác không thấy tiến độ của caregiver cũ.
7. Tối đa 3 link: không tạo tài khoản mới. BE vẫn là nguồn quyết định khi có thay đổi đồng thời.
8. Kiểm tra email trùng, password yếu, phone sai, link hết quyền/403, 401 hết phiên. Không có retry tự động POST/DELETE; đăng nhập lại khi cần.

API phụ thuộc: login + GET me -> GET links (quota) -> POST users -> giữ userId -> POST caregiver-links -> GET users/links/detail. Gỡ cần linkId, không phải userId.

Kiểm thử tự động dùng fixture; chưa kiểm thử ghi trên BE thật. Đợt 3b forgot-password 500 và chính sách riêng tư vẫn đang chờ, không chặn bài test 4b này.

Tự động: 48 unit pass; build/lint pass; 11 kịch bản API fixture pass qua lần chạy chính và chạy lại 1 case Edge crash trước newPage.
