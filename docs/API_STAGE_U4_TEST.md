# U4 — Tạo VIU và quản lý license tổ chức

Ngày 2026-10-07. Đã triển khai FE; chưa nghiệm thu trên BE deploy. Giữ UI Organic theo DESIGN.md. Không triển khai U5 trong đợt này.

## Màn và contract

- CenterAdmin → `/center-admin/licenses`: kho hiện tại và danh sách assignments phân trang 20, lọc chưa thu hồi/đã thu hồi/tất cả. Danh sách bao gồm các kho thuộc tổ chức; không chỉ kho hiện tại.
- `GET /api/licenses/assignments?page=1&pageSize=20&isActive=true`: DTO `id, viuUser { id, fullName, email }, assignedAt, assignedBy, revokedAt, isActive`. `isActive` chỉ nghĩa chưa thu hồi, không chứng minh còn entitlement.
- Popup Cấp license nhận UUID VIU từ chi tiết tài khoản. FE đọc lại `GET /api/users/{id}`, kiểm tra VIU cùng tổ chức, chưa xóa/khóa; đọc lại pool còn hiệu lực và còn suất. `POST /api/licenses/assignments/{viuUserId}/assign` body `{ poolId }`, response data GUID. Cấp lại dùng cùng API, sau khi đã thu hồi.
- Thu hồi có popup xác nhận tên người nhận và tác động. `POST /api/licenses/assignments/{viuUserId}/revoke`, không body. Không DELETE tài khoản, không unlink.
- Thành công hoặc thất bại đều invalidate pool/assignments/account/user cache của actor. Không tự cộng trừ quota hoặc tự gửi lại mutation. Lỗi mạng có thể xảy ra sau commit; tải lại trước khi thử lại.
- Tạo tài khoản CenterAdmin giữ form khi 402/422 và có đường dẫn kho/gói Business. Create/refetch hiển thị licenseStatus/licenseExpiresAt BE trả về, không tự gán Active. Staff không yêu cầu license cá nhân.
- B2C giữ giới hạn ba VIU, giữ UUID tạo thành công nhưng link lỗi trong sessionStorage; không tạo lại tài khoản khi tiếp tục link. Danh sách VIU hiển thị license từ BE; thiếu field hiển thị chưa có thông tin.

## Test lần lượt trên BE thật

Dùng tài khoản test đã được cho phép, ghi lại UUID/email trước khi thao tác. Không thanh toán tiền thật để tạo fixture. Các bước cần dữ liệu BE khác nhau được tách bên dưới.

1. B2C Trial/Personal: tạo VIU đầu tiên → link → reload → kiểm tra primary và license kế thừa trong response. Tạo VIU thứ hai/thứ ba; thứ tư phải bị từ chối. Không dùng maxViuPerLicense của package làm quota B2C.
2. Giả lập lỗi link sau create: reload, tiếp tục bằng UUID cũ, xác nhận chỉ có một tài khoản. Với VIU đã có sẵn và chưa có license: first Personal link phải kế thừa tại BE; VIU có license sẵn phải không bị ghi đè. **Cần bản BE đã sửa inheritance, xem chênh lệch bên dưới.**
3. B2B pool còn suất: ghi used/available → tạo staff → số không đổi → tạo VIU → kiểm tra response và pool used tăng một. Tạo phân công ORGANIZATION ở màn Phân công chăm sóc. Không dùng cấp thủ công lần nữa nếu VIU đã tự được cấp.
4. Thu hồi: chọn VIU test → Hủy không gửi POST; Xác nhận gửi đúng VIU ID → available tăng một theo GET pool. Tài khoản và caregiver link vẫn còn. Kiểm tra quyền thực tế của VIU sau thu hồi bằng Mobile/BE.
5. Lọc đã thu hồi, sao chép UUID → Cấp license → số used tăng theo máy chủ. Cấp trùng phải 409 hoặc lỗi nghiệp vụ, không tăng hai lần.
6. Pool đầy: tạo VIU/cấp thủ công trả lỗi, form giữ dữ liệu, có đường mua thêm. Pool hết hạn/suspended không được cấp. Hai tab tranh suất cuối: chỉ một thành công, tab lỗi tải lại quota. **Cần fixture pool một suất và BE test concurrency.**
7. UUID staff, sai định dạng, người ngoài tổ chức, tài khoản xóa/khóa: FE không cấp. Kiểm tra trực tiếp API bằng bộ test BE để bảo đảm không thể bỏ qua FE. Role khác CenterAdmin không có thao tác cấp/thu hồi.
8. Mobile viewport 390px: bộ lọc và nút không lệch, bảng cuộn ngang trong vùng bảng, popup giữa màn hình; keyboard Tab/Escape hoạt động, không đóng lúc đang submit.

## Chênh lệch BE local cần xử lý/xác minh deploy

Đọc source hiện có, không sửa BE trong nhiệm vụ FE:

- `AssignViuLicenseHandler` kiểm tra pool thuộc tổ chức, trạng thái và quota atomic, nhưng chưa kiểm tra target user là VIU cùng tổ chức, active và chưa xóa. Validator chỉ NotEmpty. FE preflight chỉ bảo vệ luồng UI, không thay authorization của BE. BE cần guard trước mọi thay đổi pool/assignment.
- Handler assign kiểm tra Status Active nhưng không trực tiếp kiểm tra ExpiresAt. FE chặn timestamp đã hết hạn; BE vẫn cần tự kiểm tra để API không phụ thuộc scheduler/đồng hồ client.
- `ViuLicenseService.TryAssignForNewViuAsync` bỏ qua assignment nếu không tìm thấy pool Active. Vì vậy create thành công không đảm bảo đã có license; UI hiển thị trạng thái response. Admin tạo VIU cũng không đi vào autoassign của CenterAdmin. Cần chốt BE có muốn từ chối tạo khi thiếu pool hay không.
- `CreateCaregiverLinkHandler` local chưa có logic inheritance license, khác bản sửa người dùng mô tả. Cần xác minh commit đang deploy hoặc pull bản có sửa; không coi first-link inheritance đã nghiệm thu.
- `RevokeViuLicenseHandler` đọc assignment active rồi giảm used bằng SQL; cần BE kiểm tra hai revoke đồng thời không giảm hai lần. FE không tự retry nhưng không ngăn được hai client khác nhau.

## Kiểm tra tự động

- 86 unit tests đạt, gồm kiểm tra tenant/role/quota/expiry, payload assign/revoke và không retry khi cạnh tranh suất cuối.
- 14 E2E liên quan đạt: 4b, 5b, 5c, U3b, hai test U4. Lượt đầu có một fixture U3b thiếu endpoint mới; đã bổ sung và chạy lại đạt.
- Lint và production build đạt. Đã xem ảnh popup 390px; giữ CSS Organic và native dialog.

## Bàn giao

Kiểm tra tự động chỉ dùng fixture, không chứng minh transaction/tenant/inheritance của BE thật. AI tiếp theo đọc PLAN.md + api.txt + file này; xử lý lỗi U4 nếu user báo, chỉ chuyển U5 khi được yêu cầu. Chính sách riêng tư vẫn chờ nội dung chính thức. Push dev; main do người dùng quyết định deploy.
