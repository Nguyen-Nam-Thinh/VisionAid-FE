# U5 — Phân phối và kích hoạt key

2026-10-07. FE đã triển khai trên UI Organic hiện có; không đổi tổ chức hoặc caregiver link khi kích hoạt. Chưa nghiệm thu BE thật.

## Cách dùng

1. Đăng nhập CenterAdmin → Kho license `/center-admin/licenses` → **Tạo key cho gia đình**. Đọc tác động một suất, nhập ghi chú tùy chọn, xác nhận.
2. Popup trả key được che mặc định, hạn dùng từ BE. **Hiện key** hoặc **Sao chép key**; tự lưu/chuyển key cho gia đình. Đóng popup vẫn xem lại được trong màn hình này. Reload, rời trang hoặc logout sẽ mất bản key trong bộ nhớ FE.
3. **Tạo key khác** cần xác nhận đã lưu key cũ; thao tác này chỉ bỏ bản hiển thị, không thu hồi key hay hoàn suất. POST tạo key mới chỉ chạy khi xác nhận form tiếp theo.
4. Đăng nhập Caregiver gia đình → License `/license` → **Nhập key kích hoạt** → xác nhận. Thành công tải lại profile, subscription và dữ liệu VIU; trạng thái/thời hạn do máy chủ trả về.
5. Trial/Personal vẫn tối đa ba VIU. Không coi kích hoạt là cộng thêm ngày vào gói cũ; hỏi trung tâm hạn key trước khi dùng. Staff tổ chức không có nút kích hoạt cá nhân.

Giữ các thao tác trong popup tại route đã có thay vì tạo hai route riêng như đề xuất ban đầu. Không thêm menu quản lý key giả: BE chưa có list/detail/revoke key. Assignment VIU ở U4 không phải key phân phối.

## Contract đã đối chiếu source BE

- `POST /api/licenses/distribute`, CenterAdmin: `{ poolId, note: string | null }`, note tối đa 500. Data `{ subscriptionId, licenseKey, expiresAt }`; key hiện sinh dạng bốn nhóm bốn ký tự hex. Preflight GET pool của actor, xác minh org, Active, thời hạn và capacity. FE không gửi poolId từ URL hoặc UUID do người dùng nhập.
- `POST /api/licenses/activate-key`, Caregiver: `{ licenseKey }`, trim/uppercase, bắt buộc và tối đa 100 ký tự. Response `SubscriptionDetailResponse`, cùng schema GET subscription; chỉ hiển thị thành công nếu DTO hợp lệ và status Active. Có thể packageType Business vì key xuất phát từ pool Business.
- Distribute tiêu thụ một suất ngay, tạo subscription Suspended chưa có subscriber. Hạn key và CurrentPeriodEnd theo pool.ExpiresAt. Activate gắn subscriber và cập nhật license của Caregiver; không tiêu thụ thêm suất trong handler hiện tại.
- Refresh sau mutation: session, subscription, pool và cache user của actor. Không tự tính quota hay entitlement, không tự replay POST. HTTP write hiện có cũng không retry 401.
- Key chỉ ở form/component memory, không query string, storage, Query cache, console hoặc analytics. Lỗi POST được đổi sang thông báo cố định để tránh BE echo key. Clipboard chỉ ghi khi bấm Sao chép; không tự gửi email/tin nhắn.
- Lỗi 4xx giữ form. Lỗi mạng/5xx/response sai schema: kết quả chưa rõ, đóng form và khóa gửi lại trong màn hiện tại; tải lại thông tin và liên hệ quản trị viên trước khi thử lại. Không có API khôi phục key nếu response bị mất. Lỗi preflight 5xx cũng dừng bảo thủ; không khẳng định đã tiêu thụ suất.

## Test với hai tài khoản

Dùng dữ liệu test được phép; không mua/chuyển tiền thật để tạo fixture. Ghi số pool trước/sau, không chụp hoặc commit key thật vào bằng chứng công khai.

1. CenterAdmin pool còn suất: tạo key → used tăng một theo GET pool. Đóng/mở popup không phát POST mới. Hiện/ẩn/copy đúng; không có key trong URL/localStorage/sessionStorage. Tạo key khác cần xác nhận.
2. Caregiver gia đình Trial hoặc None: kích hoạt key → profile Active → subscription và expiry đúng key → tạo VIU → link primary → kiểm tra kế thừa và reload. **Cần kiểm tra cả U4 inheritance; fixture FE không chứng minh BE inheritance.**
3. Kích hoạt khi đã Active: xác nhận BE xử lý gói cũ/thời hạn đúng business, không âm thầm làm mất kỳ còn lại. Không hứa tự gia hạn theo gói cũ.
4. Key sai/đã dùng/hết hạn: báo lỗi, giữ form, không đổi entitlement. Hai gia đình tranh một key: chỉ một người được thành công; BE phải kiểm tra concurrency.
5. Pool đầy/Expired/Suspended/ngoài org: không tạo key; race suất cuối chỉ một request thành công; quota đọc lại từ BE. Role Admin/staff/VIU không được phân phối qua API.
6. Mất response sau POST: FE không tự gửi lại, báo chưa rõ kết quả. Nhờ BE tra subscription/pool; không dùng nút thu hồi assignment để thu hồi key.
7. Logout/đổi tài khoản không còn key trước đó. Test 390px, keyboard, Escape, focus, không đóng khi form đang submit; clipboard bị chặn có hướng dẫn copy thủ công.

## BE local cần sửa/xác minh trước nghiệm thu

- `DistributeLicenseCodeHandler` đang log raw LicenseKey và note. Cần bỏ hoặc redact key trong log BE; FE không sửa repository BE.
- `ActivateLicenseKeyHandler` kiểm tra unclaimed trước transaction rồi cập nhật entity; không thấy conditional claim/row lock/concurrency token trong handler/config. Cần test và bảo vệ để hai người không cùng kích hoạt thành công.
- GET subscription chọn CreatedAt mới nhất, không theo ActivatedAt. Key phát trước khi gia đình đăng ký có thể kích hoạt thành công nhưng GET vẫn trả trial tạo sau đó. Handler activate không đóng subscription cũ, không gia hạn theo kỳ cũ và chỉ cập nhật Caregiver, chưa đồng bộ VIU đang liên kết. Cần chốt và sửa tại BE; FE không tự chọn/giả entitlement thay BE.
- BE activate chỉ check role Caregiver, chưa chặn organization_id khác null; FE chỉ mở cho Caregiver gia đình. BE cần enforce scope cuối cùng.
- Distribute check Status Active nhưng không trực tiếp check ExpiresAt; FE preflight timestamp không thay được BE guard. Note chỉ được ghi log ở source hiện tại, không có API đọc lịch sử key/thu hồi/khôi phục; cần BE nếu muốn quản lý đầy đủ.

## Kiểm tra tự động

88 unit tests, 9 E2E U1/U4/U5, lint và build đạt. Đã xem ảnh popup mobile 390px. Tests dùng fixture, không thay nghiệm thu BE thật.

## Bàn giao

AI tiếp theo đọc PLAN.md, api.txt và file này. Chờ user test U5; đợt kế tiếp theo plan là 11a — Emergency Contacts/Standalone khi được yêu cầu. Chính sách riêng tư vẫn chờ. Chỉ push dev, main do người dùng deploy.
