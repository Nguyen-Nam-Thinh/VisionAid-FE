# Đợt 11a — Liên hệ khẩn cấp và kiểm thử Standalone

Ngày 2026-10-07. Đã triển khai FE; chưa nghiệm thu với BE/Mobile thật. Nhánh triển khai `feat/emergency-contacts-11a`, phát hành qua dev; main do người dùng chọn thời điểm cập nhật.

## Phạm vi và contract

- Màn `/caregiver/contacts`, dùng chung cho Caregiver cá nhân và Staff Caregiver. Chọn VIU từ danh sách API, xác minh active link trước đọc/ghi; cùng tổ chức chưa đủ quyền. Secondary có link cũng được quản lý, không yêu cầu primary hoặc các permission flags GPS/alerts.
- GET và POST `/api/users/{userId}/emergency-contacts`; GET/PUT/DELETE `/{contactId}`; PATCH `/{contactId}/status` với `{isActive}`. Hai GET `/me` dành cho Mobile, chưa nối Web.
- GET list trả mảng trong ApiResponse, không phải paged response. DTO: id, visuallyImpairedUserId, contactName, contactType, phoneNumber, zaloDeepLink, priorityOrder, isActive, notes, createdAt, updatedAt. Enum đúng là Phone/Zalo/Both. FE kiểm tra DTO và scope response.
- Tối đa 5 liên hệ chưa xóa, kể cả inactive. Priority nguyên dương, không trùng, thứ tự nhỏ đứng trước. Name tối đa 200, Zalo/notes 500. PUT partial: null giữ giá trị cũ; FE gửi chuỗi rỗng để xóa trường không còn dùng. DELETE trả 204.
- Thêm/sửa mở Dialog; đổi trạng thái/xóa mở Confirm. Không có hành động tự gọi điện, mở Zalo hoặc phát SOS. Refetch dữ liệu sau thao tác; không tự retry mutation. Khi không rõ kết quả lưu, tải lại trước khi gửi lại để tránh tạo trùng.

## Điểm cần BE xử lý

Source đọc tại `VisionAid-BE/src/Modules/VisionAid.Modules.Users`: EmergencyContactsController, DTOs, validators và handlers create/update/status/delete/list/detail. Validator hiện chỉ nhận số di động Việt Nam cho Phone/Both. **112/115, số bàn và quốc tế chưa được hỗ trợ theo source này.** FE không áp regex di động cứng; BE vẫn có thể trả lỗi và form phải giữ dữ liệu. Không đánh dấu yêu cầu hotline/Standalone hoàn tất chỉ vì Web đã có CRUD.

## Bạn test theo thứ tự

1. Chạy API mode trên dev với tài khoản Caregiver có VIU đã liên kết. Mở Liên hệ khẩn cấp, tìm/chọn VIU; thấy tên đúng, loading/empty/error rõ ràng. Chuyển người hoặc trang danh sách không giữ popup của người cũ.
2. Thêm Phone với số di động test hợp lệ, tên và priority 1. Lưu rồi tải lại trang: dữ liệu vẫn còn. Không phát sinh cuộc gọi. Tạo Zalo và Both, kiểm tra trường bắt buộc theo loại.
3. Sửa Both thành Phone: Zalo cũ được xóa sau reload. Xóa notes rồi lưu: notes thực sự trống. Nhập priority trùng, số lẻ, 0, tên rỗng hoặc quá dài: thông báo lỗi, không mất dữ liệu form.
4. Tạo đủ 5; nút thêm bị khóa. Tạm ngưng một liên hệ vẫn không tạo thêm được. Xóa một liên hệ với xác nhận rồi mới thêm lại. Hủy Confirm không gọi mutation; lỗi server không báo thành công giả.
5. Mở hai tab cùng sửa ưu tiên; kiểm tra BE từ chối trùng và refresh hiển thị dữ liệu thật. Mất mạng/5xx khi lưu: tải lại để kiểm tra trước khi bấm lưu lại. Test 112/115 chỉ nhập/lưu, không gọi; ghi lại lỗi validator để nhóm BE sửa.
6. CenterAdmin tạo VIU có license qua U4, phân công Staff qua 5c. Staff đăng nhập, chọn VIU và CRUD contacts như trên. Staff secondary cũng phải dùng được khi có link. Cùng org nhưng chưa phân công phải bị từ chối.
7. Giữ popup mở, nhờ CenterAdmin gỡ link rồi lưu: bị từ chối và không tiếp tục hiển thị danh bạ khi refetch thất bại. Thử VIU ngoài phạm vi: BE phải trả 403/404; FE guard không thay kiểm tra quyền server.
8. Trên điện thoại và desktop: popup nằm giữa, cuộn được, Tab/Escape và nút đóng hoạt động, nút lưu khóa khi đang gửi. Xóa/đổi trạng thái chỉ chạy một lần khi xác nhận.

## API phải test cùng nhau

Chuỗi Standalone: license/pool U4 → tạo VIU → caregiver-links 5c → contacts 11a → Mobile GET danh bạ → emergency event test → Staff nhận/xử lý cảnh báo đợt 7/8a. Contacts CRUD có thể test trước mà không cần Mobile. End-to-end cảnh báo cần nhóm Mobile/BE và môi trường test cô lập, không phát SOS thật hoặc gọi số khẩn cấp. Chưa chạy chuỗi này trong đợt triển khai FE.

## Kiểm tra tự động

- Unit: 90 tests đạt, gồm scope/link/DTO, CRUD/204, enum và validation contacts. Vitest trong sandbox lỗi cache tạm; chạy lại ngoài sandbox đạt.
- Lint và production build đạt; còn cảnh báo bundle lớn có sẵn.
- E2E: 4 kịch bản hồi quy 4b/5c đạt; kịch bản contacts đạt sau sửa selector select trong test, gồm giữ form khi 409, CRUD, hủy xác nhận, mất link và popup mobile 390px. Fixture không chứng minh BE live chấp nhận hotline hoặc Standalone hoạt động.

Đợt tiếp theo: **8c — FCM web push**, chỉ triển khai khi người dùng yêu cầu tiếp.
