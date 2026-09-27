# Đợt 5a — kiểm thử tổ chức

Chạy npm.cmd run dev, mở http://localhost:5173 (API mode). Cần Admin và CenterAdmin có organizationId hợp lệ. Cần một tổ chức THỬ NGHIỆM và thành viên thử nghiệm; chỉ dùng tổ chức này cho thao tác vô hiệu hóa/xóa.

## Admin: /admin/organizations

1. Login Admin -> menu Tổ chức. GET /api/organizations?page=1&pageSize=10&isDeleted=false. Thử tìm tên/email/mã thuế, lọc hoạt động/ngừng hoạt động, lọc đã xóa; qua trang và quay lại. Lỗi list phải hiện lỗi, không có demo.
2. Tạo tổ chức: tên bắt buộc <=200; mã thuế <=50; địa chỉ <=500; phone/email có thể bỏ trống. POST /api/organizations -> đọc detail GET /{id}. Tạo không sinh CenterAdmin: quản lý tài khoản ở 5b.
3. Thử email/phone sai, mã thuế trùng (409). Tạo/sửa gặp 500/mất phản hồi: kiểm tra danh sách trước khi gửi lại vì BE có thể đã lưu trước khi audit thất bại.
4. Mở chi tiết -> sửa tên/địa chỉ/email/điện thoại. PUT /{id} không có taxCode. Xóa nội dung optional -> gửi chuỗi rỗng. F5 kiểm tra dữ liệu mới. Không tự gửi field DB/mock như phone/email thay vì phoneNumber/contactEmail.
5. Xem thành viên GET /{id}/members; tìm kiếm, lọc Caregiver/CenterAdmin/VisuallyImpaired và active; chuyển trang. Danh sách rỗng cũng hợp lệ. Count staff/VIU lấy lại từ GET sau mutation.
6. Vô hiệu hóa -> Hủy: không PATCH. Xác nhận -> PATCH /{id}/status {isActive:false}. Kiểm tra trạng thái tải lại, thành viên đang active bị inactive, refresh/FCM bị thu hồi. Không thao tác với tổ chức đang dùng để làm việc thật.
7. Kích hoạt -> PATCH {isActive:true}. Tổ chức active, thành viên vẫn inactive; phải kích hoạt riêng qua BE admin/đợt 5b, không kết luận FE lỗi vì họ chưa đăng nhập lại được.
8. Xóa -> Hủy không DELETE. Xác nhận DELETE /{id} nhận 204; danh sách chưa xóa không còn tổ chức. Chọn Đã xóa -> xem chi tiết -> không có sửa/xóa lại; kích hoạt để khôi phục theo contract BE. Không tự mở lại tài khoản thành viên.
9. PATCH/DELETE lỗi 403/422/500: dialog còn lỗi, không giả thành công. Tải lại để xác minh khi có lỗi sau khi lưu.

## Center Admin: /center-admin/organization

1. GET /api/organizations/me, không gọi list toàn cục. Hiện hồ sơ đúng tổ chức cùng danh sách thành viên.
2. Sửa contact -> PUT /{id} đúng orgId. Không có tạo/xóa/vô hiệu hóa/kích hoạt tổ chức; không sửa mã thuế.
3. Thử tài khoản CenterAdmin tổ chức B, đảm bảo không hiển thị dữ liệu A. Đổi phiên/logout phải bỏ cache cũ. Gõ URL /admin/organizations -> forbidden.
4. CenterAdmin thiếu orgId hoặc BE trả org khác: báo lỗi, không có form sửa. BE vẫn cần kiểm tra quyền với request cross-org ngoài UI; FE guard không thay quyền backend.

## Phụ thuộc và điểm dừng

Chuỗi Admin: login/me -> list -> detail -> members; create/update/status/delete -> refetch list/detail/members. CenterAdmin: login/me (user) -> organizations/me -> members/update cùng org.
Muốn test CenterAdmin và >10 thành viên cần seed BE hoặc tài khoản hiện có; Web tạo user tổ chức nằm ở đợt 5b chưa mở. Activity-summary/reports vẫn chờ đợt 12.

Lỗi forgot-password 500 đợt 3b và chính sách riêng tư vẫn để chờ. Test tự động dùng fixture; không khẳng định BE thật đã đạt nếu người dùng chưa xác nhận.

Kiểm tra 5a (2026-09-26): 51 unit tests pass, 14 Playwright API fixture tests pass (exit 0), build/lint pass. Build còn cảnh báo chunk chính ~534 kB. Chưa có kiểm thử ghi trên BE thật.
