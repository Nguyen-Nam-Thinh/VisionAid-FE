# Đợt 5c — phân công và quản lý liên kết

Mở http://localhost:5173 ở API mode. Cần Admin, CenterAdmin, Caregiver; tối thiểu hai Caregiver và một VIU đang hoạt động cùng tổ chức để test chuyển chính/phụ. Lấy UUID từ màn tài khoản đợt 5b. Dùng dữ liệu thử nghiệm.

## Admin / Center Admin

1. Vào /admin/links hoặc /center-admin/assignments. GET caregiver-links có page/pageSize=10 và các filter caregiverId/viuId/linkType/isActive. CenterAdmin luôn Organization. Test rỗng, đổi trang, UUID sai, tài khoản/org khác, 403 và lỗi mạng.
2. Tạo liên kết: nhập UUID Caregiver + VIU, chọn quyền, checkbox xác nhận. Admin chọn loại; CenterAdmin ép Organization. GET users/{id} kiểm tra hai tài khoản trước POST. Liên kết Organization phải cùng org, cả hai active/chưa xóa. Sai role/org/inactive: không tạo.
3. Link đầu tiên BE tự primary dù gửi isPrimary=false. Tạo caregiver thứ hai cho VIU -> link phụ. Tạo trùng nhận 409, không nhân đôi. Vượt 3 links mỗi bên nhận lỗi BE. 500/mất phản hồi: tải lại/lọc UUID hai người trước khi gửi lại.
4. Chi tiết -> sửa quyền -> thử bỏ từng cờ false và lưu với checkbox xác nhận. GET detail trước PUT permissions; refresh/reload giữ đúng quyền. 403 giữ form báo lỗi, không giả cập nhật.
5. Chọn link phụ -> Chuyển thành chăm sóc chính -> Hủy không PATCH. Xác nhận GET detail rồi PATCH /{id}/promote-primary không body; reload list của cùng VIU: chỉ một primary, người cũ thành phụ. Quyền không tự đổi chỉ vì primary.
6. Gỡ -> Hủy không DELETE; xác nhận GET detail rồi DELETE 204. Nếu gỡ primary, kiểm tra BE promote liên kết còn hoạt động lâu nhất. Không xóa tài khoản; VIU không còn link thì Caregiver mất quyền qua link đó.
7. Lọc Đã gỡ: chỉ xem, không sửa/promote/gỡ lại. Hai tab cùng thao tác: BE có thể trả 404/422; báo lỗi và tải lại, không optimistic hoặc tự retry.

## Caregiver — /caregiver/caregivers (Liên kết của tôi)

1. Chỉ thấy own links; không có danh sách người chăm sóc phụ khác. Personal active cho sửa 3 quyền/gỡ, Organization chỉ xem. Không có promote-primary ở mọi loại.
2. Tạo bằng UUID VIU đã có -> POST tự gán caregiverId=currentUser, Personal, isPrimary=false. Không được chỉ định người chăm sóc khác. BE kiểm tra VIU/quota vì Caregiver không được GET users/{id}.
3. Sau sửa/gỡ, màn /caregiver/users đợt 4 phải tải lại dữ liệu đúng. Logout/đổi tài khoản không giữ cache của người trước.
4. Không có mời bằng email, QR hoặc quản lý người khác: BE hiện chưa cung cấp contract, không dùng OCR QR thay thế.

## Phụ thuộc và giới hạn

5a tổ chức -> 5b tài khoản active -> 5c POST link -> GET list/detail -> permissions/promote/unlink -> refetch. Chuyển primary và gỡ primary cần hai caregiver cùng VIU để test hành vi BE.
CenterAdmin UI chỉ mở Organization và kiểm tra hai user cùng org. Handler BE hiện kiểm tra caregiver.orgId nhưng không luôn kiểm tra type; FE không mở rộng quyền theo điểm lỏng này.
DTO list link không có orgId; quyền list CenterAdmin do BE enforce, detail/mutation FE xác minh thêm bằng GET user. Người dùng cần test cross-org trên BE thật.
API mới đợt này: PUT permissions, PATCH promote-primary. Các API list/detail/create/delete được dùng lại. Không có SignalR ở đợt này.

Dừng ở 5c để nghiệm thu; đợt tiếp theo 6 là GPS live/history. Quên mật khẩu 500 (3b) và consent vẫn chờ.

Kiểm tra 5c: 60 unit tests, 19 Playwright API fixture tests pass (exit 0), build/lint pass. Helper E2E chờ login hoàn tất trước navigation để bỏ race. Build còn cảnh báo chunk chính ~562 kB. Chưa nghiệm thu BE thật.
