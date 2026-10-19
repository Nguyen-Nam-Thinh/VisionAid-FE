# Kiểm thử API Web với BE thật — 18/10/2026

Phạm vi: nhánh `refactor/desktop-ui-experience`, gọi trực tiếp `https://api.visionaid.net` (BE `main` e049cfa) bằng script HTTP theo đúng path/payload mà `src/services/api/*` gửi. Không mock. Không đăng nhập qua giao diện trình duyệt, không nghiệm thu Mobile, SignalR, FCM hay media WebRTC.

Tài khoản: 4 tài khoản seed do người dùng cung cấp (Admin, CenterAdmin, Caregiver, VIU) và dữ liệu QA tạo tạm trong lượt test (Caregiver tự đăng ký trial, VIU B2C, staff + VIU tổ chức, org QA). Không ghi mật khẩu/token vào tài liệu.

## Tổng quan

- Khoảng 150 request, 4 role. Phần lớn API Web trả đúng mã và dữ liệu.
- Lỗi BE N1, N2, N3, N5, N6, N7 (FE đã tránh N1, N3, N7); N4 là dữ liệu tài khoản seed; 2 câu hỏi cần người dùng chốt.
- Dọn dẹp: QA users/links/contacts/places/registry/rules/ICE/org đã xóa (user là soft delete). Kho Business trở về 1 dùng / 49 còn như trước test. Giao dịch PayOS QA đã hủy, không mở checkout.

## Lỗi và nhu cầu

### N1 — Lọc ngày có offset +07:00 trả 500 — BE (FE đã tránh)

**Nhu cầu / lỗi / API nào:** Admin lọc theo ngày ở Nhật ký kiểm toán, Thông báo thất bại, Nhật ký Hybrid. `GET /api/audit-logs`, `GET /api/notifications/failed`, `GET /api/navigation/guidance/logs` với `dateFrom=2026-09-01T00:00:00+07:00` hoặc `dateTo=...+07:00` trả **500**. Cùng khoảng thời gian dạng UTC (`...Z`) hoặc chỉ ngày trả 200. `GET /api/notifications/status` nhận offset bình thường.

**Thêm mới / bổ sung / chỉnh sửa gì:**
- BE: các query `DateTimeOffset` này cần `.ToUniversalTime()` trước khi so sánh với cột timestamptz (Npgsql chỉ chấp nhận offset 0). Source tham chiếu: `GetAuditLogsHandler.cs` dòng 30–34; kiểm tra tương tự cho failed notifications và guidance logs.
- FE (đã sửa): `src/services/api/monitoring.ts` gửi mốc ngày Việt Nam dưới dạng UTC (`2026-10-10T17:00:00.000Z` → `2026-10-11T16:59:59.9999999Z`), cùng thời điểm như trước. Đã gọi lại API thật: cả 3 endpoint 200.

**Kết quả kỳ vọng:** Mọi ISO 8601 hợp lệ có offset đều trả 200 với cùng kết quả như dạng UTC; không có 500.

### N2 — Ảnh không có khuôn mặt vẫn được lưu và kích hoạt người — BE

**Nhu cầu / lỗi / API nào:** `POST /api/face-registry/persons/{personId}/photos` với PNG 1×1 pixel (không có mặt) trả **201**, `embeddingModel=null`. Tải 3 ảnh như vậy → `GET /api/face-registry/persons/{id}`: `imageCount=3`, `isActive=true`. Người “đang hoạt động” nhưng không có embedding nên Mobile không thể nhận diện. Báo cáo 16/10 từng ghi ảnh trắng bị 422.

**Thêm mới / bổ sung / chỉnh sửa gì:** `UploadFacePhotoHandler.cs` dòng 62–72: khi FaceNet trả null (không thấy mặt hoặc service lỗi) vẫn lưu ảnh và tính vào ngưỡng kích hoạt. BE cần phân biệt “không có khuôn mặt” (422, không lưu) với “FaceNet tạm lỗi” (503 hoặc lưu trạng thái chờ xử lý và không tính vào ngưỡng 3 ảnh). Kiểm tra FaceNet service trên deploy còn chạy không.

**Kết quả kỳ vọng:** Ảnh không có mặt bị từ chối rõ ràng; `isActive=true` chỉ khi có ít nhất 3 ảnh đã có embedding.

### N3 — Sai mật khẩu hiện tại bị hiển thị “không có quyền” — BE + FE (FE đã sửa)

**Nhu cầu / lỗi / API nào:** `POST /api/auth/change-password` với mật khẩu hiện tại sai trả **403** `Current password is incorrect.`. Transport chung (sửa L05 ngày 16/10) đổi mọi 403 thành “Bạn không có quyền thực hiện thao tác này.”, nên người dùng không biết mình gõ sai mật khẩu.

**Thêm mới / bổ sung / chỉnh sửa gì:**
- FE (đã sửa): `auth.ts` `changePassword` đổi 403 của endpoint này thành “Mật khẩu hiện tại không đúng.”.
- BE (đề xuất): trả 400/422 kèm field `currentPassword` thay 403, vì đây là lỗi dữ liệu nhập, không phải thiếu quyền.

**Kết quả kỳ vọng:** Popup đổi mật khẩu báo đúng “Mật khẩu hiện tại không đúng.”, không đăng xuất, nhập lại được.

### N4 — Tài khoản seed Caregiver không có license — dữ liệu/BE

**Nhu cầu / lỗi / API nào:** `caregiver@gmail.com`: `GET /api/users/me` có `licenseStatus=null`; `GET /api/licenses/subscription` 404. Vì vậy `GET /api/caregiver-links`, `GET /api/users`, `GET /api/notifications/preferences` đều **402** “Chưa có license”. Toàn bộ màn Caregiver (người được chăm sóc, bản đồ, danh bạ, địa điểm, khuôn mặt, TTS, lịch sử) không dùng được bằng tài khoản này. `viu@visionaid.vn` cũng `licenseStatus=null` và không có liên kết.

**Thêm mới / bổ sung / chỉnh sửa gì:** Tài khoản được seed trước khi có trial (tạo 19/09). BE seed bổ sung trial/Personal cho tài khoản này, hoặc người dùng mua gói Personal, hoặc dùng Caregiver tự đăng ký (tự có trial 7 ngày — đã xác minh). FE giữ hành vi 402 hiện tại.

**Kết quả kỳ vọng:** Tài khoản demo Caregiver có license hợp lệ và ít nhất 1 VIU liên kết để demo đủ luồng.

### N5 — 429 không kèm Retry-After — BE, thấp

**Nhu cầu / lỗi / API nào:** `POST /api/auth/login` quá 5 lần/phút/IP trả 429 nhưng không có header `Retry-After`, dù message nói “retry after the indicated wait time”. FE chỉ hiển thị được “chờ một lát”.

**Thêm mới / bổ sung / chỉnh sửa gì:** SlidingWindow limiter không cấp metadata RetryAfter; BE đặt `Retry-After` cố định (ví dụ 10 giây theo segment) khi không có metadata.

**Kết quả kỳ vọng:** 429 luôn có `Retry-After` để FE báo số giây cụ thể.

### N6 — SOS thủ công không phát sự kiện SignalR `EmergencyAlert` — BE

**Nhu cầu / lỗi / API nào:** VIU QA `POST /api/emergency-events` (`detectionMethod=Manual`) → 201, trạng thái Sent ngay. Caregiver đang kết nối `/hubs/location` (có `canReceiveAlerts=true`) **không nhận `EmergencyAlert`** trong 8 giây; chỉ nhận `WebRtcIncomingCall` (SosAuto). Cùng phiên vẫn nhận `LocationUpdated` bình thường, nên kết nối hub không lỗi.

**Thêm mới / bổ sung / chỉnh sửa gì:** `CreateEmergencyEventHandler.cs` với Manual/Voice/Gesture chỉ tạo notification FCM và gọi SOS WebRTC; `SendEmergencyAlertAsync` chỉ được gọi trong `EmergencyEventDispatcher` cho sự kiện ngã (Detected sau 15 giây). BE cần gọi `SendEmergencyAlertAsync` sau commit cho sự kiện vào thẳng Sent (caregiver có `canReceiveAlerts` + nhóm org). FE giữ polling 30 giây ở trang Cảnh báo nên hiện tại danh sách chậm tối đa 30 giây.

**Kết quả kỳ vọng:** Mọi sự kiện chuyển sang Sent (ngã sau grace, thủ công, giọng nói, cử chỉ) đều phát `EmergencyAlert` {eventId, viuId, sentAt…} tới caregiver nhận cảnh báo; trang Cảnh báo cập nhật ngay.

### N7 — Refresh token đã thu hồi trả 403 — BE + FE (FE đã sửa)

**Nhu cầu / lỗi / API nào:** Sau `POST /api/auth/logout` hoặc `logout-all`, `POST /api/auth/refresh` với token cũ trả **403** `Invalid refresh token.`. FE đã xóa phiên đúng, nhưng thông báo hiển thị là “Bạn không có quyền thực hiện thao tác này.” khi phiên bị đăng xuất từ thiết bị khác.

**Thêm mới / bổ sung / chỉnh sửa gì:**
- FE (đã sửa): `auth.ts` `refresh()` chuyển 401/403 thành 401 “Phiên đăng nhập đã hết hạn hoặc đã bị đăng xuất. Vui lòng đăng nhập lại.”; thêm unit test.
- BE (đề xuất): refresh token không hợp lệ/hết hạn/bị thu hồi trả 401 theo chuẩn.

**Kết quả kỳ vọng:** Người dùng thấy thông báo hết phiên và về trang đăng nhập.

### Ghi chú thêm (không chặn)

- Phiên SOS WebRTC tự tạo khi VIU gửi SOS mà không ai nhận vẫn ở trạng thái `Initiated` trong lịch sử cuộc gọi. Nên có job timeout chuyển Missed/Ended.
- `imageQualityScore` và `captureAngle` luôn null sau upload ảnh thật; FE đã xử lý nullable.

## Lượt 2 — dữ liệu thật (18/10, chiều)

Người dùng xác nhận đã tự test thanh toán thật và quên/đặt lại mật khẩu. Lượt này dùng tài khoản QA2 mới (Caregiver trial + VIU) và 3 ảnh khuôn mặt người dùng cung cấp.

| Nhóm | Kết quả |
|---|---|
| Ảnh khuôn mặt thật | 3 ảnh đều 201, `embeddingModel=vggface2+mtcnn`; count 1→2→3, active ở ảnh thứ 3; tải bytes 3 ảnh 200; đổi ảnh chính 200; xóa 1 ảnh → count 2, inactive, còn đúng 1 ảnh chính; xóa người 204 |
| Nhận diện (API Mobile) | `POST /api/face-registry/identify` cả 3 ảnh: recognized=true, đúng người, similarity 1, TTS “Đây là QA Thịnh, Bạn”, 0,7–1,2 giây; recognition logs của VIU = 3. Xác nhận FaceNet deploy đang chạy; N2 chỉ xảy ra với ảnh không có khuôn mặt |
| GPS + SignalR | Mobile gửi GPS 200 → Caregiver nhận `LocationUpdated` (có địa chỉ Mapbox); live 200; history 1 bản ghi |
| Cảnh báo | SOS thủ công → danh sách/chi tiết Sent; acknowledge 200, acknowledge lặp 422; escalate 200; resolve 200; lịch sử Detected→Sent→Acknowledged→Escalated→Resolved; đếm theo trạng thái đúng. Thiếu `EmergencyAlert` (N6) |
| Cuộc gọi + signaling | Caregiver gọi → VIU nhận `WebRtcIncomingCall`; VIU accept → Caregiver nhận `WebRtcCallAccepted`; end → hai bên nhận `WebRtcCallEnded`; gọi lần 2 → reject → `WebRtcCallRejected`; lịch sử Ended/Rejected; gọi VIU không liên kết 403. Chưa thử SDP/ICE/media thật |
| Logout | logout và logout-all đều 200; refresh sau đó bị từ chối (403, xem N7) |

Dọn dẹp: người/ảnh QA đã xóa (BE xóa ảnh MinIO), link gỡ, 2 tài khoản QA2 xóa mềm. Không lưu ảnh của người dùng vào repository.


## Lượt 3 — đối chiếu thay đổi BE #55 (EndCall) và #30 (EmergencyAlert)

Người dùng thông báo BE đã đổi: cúp máy khi chưa nghe → `Missed` + `endReason="Cancelled"`; `EmergencyAlert` phát cho cả Manual/VoiceCommand/Gesture. Kiểm tra lúc ~17:35 ngày 18/10: GitHub `main` vẫn là e049cfa (16/10) và lần deploy cuối là commit đó, không có nhánh nào chứa thay đổi này. Kết quả trên deploy hiện tại:

| Trường hợp | Kết quả deploy |
|---|---|
| Cúp trước khi nghe, gửi `reason=Cancelled` | `Missed`, endReason `Cancelled`, hub `WebRtcCallEnded.reason=Cancelled` |
| Cúp trước khi nghe, gửi `user_hangup` hoặc không gửi reason | `Ended`, endReason `user_hangup` (chưa có thay đổi #55) |
| Nghe rồi cúp | `Ended`, `user_hangup` |
| SOS Manual / VoiceCommand / Gesture | Không nhận `EmergencyAlert` (chưa có thay đổi #30, N6 còn mở) |

FE đã chỉnh để đúng cả với bản deploy hiện tại lẫn bản BE mới:
- `src/services/realtime/calls.ts`: cúp máy khi cuộc gọi đi đang đổ chuông/chuẩn bị gửi `Cancelled` (trước là `user_hangup`); hủy khi phản hồi tạo phiên đến muộn gửi `Cancelled` (trước là `client_cancelled`). Đã xác nhận trên deploy → `Missed`/`Cancelled`.
- `src/services/api/calls.ts` + `src/pages/caregiver/ApiCalls.tsx`: lịch sử cuộc gọi hiển thị lý do kết thúc bằng tiếng Việt (`Cancelled` → “Hủy trước khi được nghe máy”, `user_hangup` → “Người dùng cúp máy”…), giá trị lạ vẫn hiện nguyên văn. Không có chỗ nào trên Web kiểm tra `endReason == "user_hangup"`.
- `EmergencyAlert`: Web chỉ dùng sự kiện để tải lại danh sách, không lọc theo loại; trang Cảnh báo đã có nhãn Thủ công / Giọng nói / Cử chỉ / Cảm biến-camera. Không cần sửa giao diện; thêm unit test chấp nhận payload đủ 4 loại.

**Cần BE:** push/deploy hai thay đổi #55, #30 để test lại N6 và trường hợp cúp máy không kèm reason.


## Lượt 4 — thao tác giao diện (Caregiver, người dùng tự đăng nhập)

Người dùng tự đăng nhập tài khoản Caregiver thật (license Personal Active, 1 VIU) trong trình duyệt của app; AI không nhập mật khẩu. Chỉ thao tác đọc, mở/đóng popup, lọc; không lưu hay xóa dữ liệu thật.

- Duyệt 15 trang trong menu Caregiver + Hồ sơ ở 1440×900 và 390×844: không lỗi console, không cuộn ngang, không thông báo lỗi; mọi API trả 200 (live GPS 404 hiển thị đúng “Chưa có vị trí khả dụng”; TTS 404 hiển thị “Chưa có cấu hình”).
- Lọc Nhật ký hoạt động theo ngày gửi mốc UTC đúng, trả 200. Popup Thêm người thân/Thêm liên hệ: Escape đóng và trả focus về nút mở; submit trống báo lỗi tại trường, không gửi API.

| Mã | Vấn đề giao diện | Đã sửa |
|---|---|---|
| G1 | Mỗi trang (Gương mặt, Địa điểm, Liên hệ, Giọng đọc, Nhật ký) bắt chọn lại người được chăm sóc, kể cả khi chỉ có 1 người | Dùng chung lựa chọn qua `uiStore` (xóa khi đăng xuất); tự chọn khi chỉ có đúng 1 người |
| G2 | Trang Tùy chọn thông báo hiện chữ nội bộ “Phần FCM sẽ tích hợp ở đợt 8c” | Đổi thành hướng dẫn bật thông báo ở Hồ sơ |
| G3 | Popup liên hệ nói BE chặn hotline/số ngắn, nhưng BE đã nhận 112–115 và 1800/1900 | Cập nhật mô tả theo validator BE |
| G4 | Danh mục gói của khách hiển thị gói QA `QA1792139175094 UPDATED` (2.000đ) | Dữ liệu: tắt gói QA hoặc đổi tên khi demo — chờ người dùng quyết |
| G5 | Giao dịch 08:13 5/10 vẫn “Đang chờ thanh toán” sau 13 ngày, dashboard vẫn nhắc | BE nên hết hạn giao dịch PayOS chờ quá thời hạn link |
| G6 | Popup mở focus vào nút Đóng thay vì ô nhập đầu tiên | Góp ý nhỏ, chưa sửa |

### Admin (người dùng tự đăng nhập)

- 13 trang menu Admin ở 1440×900 và 390×844: không lỗi, không cuộn ngang, mọi API 200.
- Lọc ngày ở Nhật ký kiểm toán, Theo dõi thông báo, Nhật ký Hybrid gửi mốc UTC và trả 200 (xác nhận bản sửa N1 trên giao diện thật).
- Tìm tài khoản, phân trang, popup chi tiết tài khoản/tổ chức/liên kết/cấu hình/gói/hiệu năng AI mở đúng, vừa màn hình; không lưu thay đổi nào. Confidence FaceNet 0,1 hiển thị 10% đúng dữ liệu BE.
- Góp ý nhỏ (chưa sửa): tên menu khác tiêu đề trang — “Liên kết chăm sóc” / “Phân công chăm sóc”, “Máy chủ cuộc gọi” / “Máy chủ kết nối cuộc gọi”, “Gói dịch vụ” / “Quản lý gói license”. Nhật ký kiểm toán chỉ hiện mã người thực hiện, chưa có tên. Xóa tài khoản ghi audit là `UserDeactivated` (BE).

### CenterAdmin (người dùng tự đăng nhập)

- 12 trang menu ở 1440×900 và 390×844: không lỗi, không cuộn ngang, mọi API 200. Kho license khớp API (50 tổng, 1 đã dùng do key, 49 còn). Báo cáo lọc ngày UTC 200.
- Popup Tạo tài khoản, Tạo liên kết, Thêm quy tắc, Cấp license mở đúng, vừa màn hình; không lưu, không tạo key.

| Mã | Vấn đề giao diện | Đề xuất |
|---|---|---|
| G7 | Định dạng ngày giờ không thống nhất: “16:23:50 GMT+7 16/10/2026” (License, Kho) và “16:23 15/11/26 · UTC+7” (Tổng quan) | Dùng chung một hàm định dạng |
| G8 | CenterAdmin phải gõ tay UUID ở “Tạo liên kết” (Caregiver + VIU) và “Cấp license” (VIU) | Chọn từ danh sách nhân viên/VIU của trung tâm (API users đã có lọc organizationId) |
| G9 | Popup Tạo tài khoản hiện “Tổ chức: <UUID>” thay vì tên trung tâm | Hiện tên từ organizations/me |
| G10 | Lời chào lấy từ cuối họ tên: “Xin chào, HCM.” / “Xin chào, Admin.” | Hợp tên người Việt, nhưng tài khoản quản trị nên dùng họ tên đầy đủ |
| G11 | Kho ghi “Đã sử dụng 1” nhưng danh sách License đã cấp trống (suất dùng cho key gia đình) | Ghi chú số suất dùng cho key, hoặc BE cung cấp API danh sách key |

**Đã sửa G8, G9 (theo yêu cầu người dùng):**
- G8: “Tạo liên kết” (CenterAdmin) có ô chọn Nhân viên chăm sóc và Người được chăm sóc; “Cấp license” có ô chọn Người được chăm sóc. Danh sách lấy từ `GET /api/users` (role, isActive=true, isDeleted=false, organizationId, pageSize 100, tối đa 5 trang). Nếu tổ chức có hơn 500 người hoặc tải lỗi, form quay về ô nhập UUID như cũ. Admin vẫn nhập UUID vì làm việc trên nhiều tổ chức. Đã kiểm tra trên dữ liệu thật: tổ chức hiện chưa có nhân viên/VIU nên ô chọn trống kèm hướng dẫn tạo trước.
- G9: popup Tạo tài khoản và chi tiết tài khoản hiện tên trung tâm (“Trung tâm Hỗ trợ Người Khiếm thị HCM”) thay vì UUID, dùng chung cache `organizations/me`.

G7, G10, G11 chưa sửa.


## Lượt 5 — bấm lưu thật trên giao diện (Caregiver, người dùng tự đăng nhập)

Tài khoản Caregiver thật của người dùng, VIU `thinh060824@gmail.com`. Mọi dữ liệu QA đã xóa lại; ảnh dùng 3 ảnh người dùng cung cấp, chỉ phục vụ lúc test (đã xóa khỏi `public/` và người QA đã xóa trên BE).

| Màn | Thao tác qua giao diện | API | Kết quả |
|---|---|---|---|
| Liên hệ khẩn cấp | Thêm Điện thoại, 115, Zalo; sửa sang Điện thoại và Zalo; tạm ngưng/kích hoạt; xóa 3 liên hệ | POST 201 ×3, PUT 200, PATCH status 200 ×2, DELETE 204 ×3 | Đạt. Tự chọn VIU duy nhất (G1) |
| Liên hệ — trùng ưu tiên | Thêm liên hệ ưu tiên 1 khi đã có | POST 409 | Trước: hiện tiếng Anh “Priority order 1 is already used…”. Đã sửa FE (G12) và kiểm tra lại: “Thứ tự ưu tiên 1 đã được dùng cho liên hệ khác. Chọn số khác.” |
| Địa điểm | Thêm, xem và sửa (bán kính 80, tạm ngưng), xóa; nhập vĩ độ 95/bán kính 5 bị chặn tại form | POST 201, PUT 200, DELETE 204 | Đạt |
| Vùng an toàn | Thêm (ra: bật), sửa (vào+ra, 500 m), xóa | POST 201, PUT 200, DELETE 204 | Đạt |
| Gương mặt | Thêm người; tải 3 ảnh thật (count 1→2→3, kích hoạt ở ảnh 3); ảnh hiển thị; đổi ảnh chính; xóa 1 ảnh (còn 2, ngừng kích hoạt, đúng 1 ảnh chính); sửa người; xóa người | POST 201 ×4, GET ảnh 200, PATCH primary 200, PUT 200, DELETE 204 ×2 | Đạt |
| Tùy chọn thông báo | Tắt rồi bật lại Té ngã/Email | PUT 200 ×2 | Đạt, đã khôi phục |
| Hồ sơ | Thêm số điện thoại, xóa lại; số sai bị chặn tại form | PUT users/me 200 ×2 | Đạt, đã khôi phục |
| Gói + thanh toán | Chọn Personal → Tạo đơn (không mở PayOS) → Kiểm tra trạng thái → Hủy đơn | POST create-link 200, GET history 200, DELETE cancel 200 | Đạt, đơn QA ở trạng thái Đã hủy |
| Cuộc gọi | Gọi hỗ trợ → Bắt đầu gọi | — | Không test được: trình duyệt trong app chặn micro; FE báo “Bạn chưa cho phép micro” và không tạo phiên (đúng). Cần thử trên Chrome thường |

Không bấm: tạo VIU/người được chăm sóc (tạo tài khoản), tạo cấu hình giọng đọc (BE không có API xóa), kích hoạt key (tốn suất).

### G12 — Lỗi trùng ưu tiên hiện tiếng Anh — FE đã sửa, BE nên Việt hóa

**Nhu cầu / lỗi / API nào:** `POST /api/users/{viuId}/emergency-contacts` trùng thứ tự ưu tiên trả 409 “Priority order 1 is already used by another contact.” và Web hiện nguyên văn tiếng Anh trong popup.

**Thêm mới / bổ sung / chỉnh sửa gì:** FE `contacts.ts` đổi 409 có chữ “priority” thành thông báo tiếng Việt và đánh dấu ô Thứ tự ưu tiên (đã thêm unit test). BE nên trả message tiếng Việt hoặc mã lỗi (`errorCode`) để FE không phải dò chuỗi; các 400/409/422 khác của BE cũng đang là tiếng Anh.

**Kết quả kỳ vọng:** Người dùng thấy lỗi tiếng Việt ngay tại ô Thứ tự ưu tiên, sửa số rồi lưu được.


## Lượt 6 — bấm lưu thật trên giao diện (CenterAdmin, người dùng tự đăng nhập)

Nhân viên và VIU QA được tạo bằng script gọi API (không tạo tài khoản qua giao diện), sau đó mọi thao tác dưới đây làm trên giao diện. Cuối lượt: thu hồi suất, Admin xóa mềm 2 tài khoản QA; kho về 1 dùng / 49 còn như trước.

| Màn | Thao tác qua giao diện | API | Kết quả |
|---|---|---|---|
| Kho license | Thu hồi suất VIU QA (2→1); Cấp license chọn VIU từ ô chọn mới (1→2) | POST revoke 200, POST assign 200, GET users pageSize=100 200 | Đạt; ô chọn G8 hoạt động với dữ liệu thật |
| Phân công | Tạo liên kết chọn nhân viên + VIU từ ô chọn; sửa quyền (bật quản lý gương mặt); gỡ liên kết | POST 201, PUT permissions 200, DELETE 204 | Đạt |
| Nhân viên | Sửa họ tên + điện thoại; vô hiệu hóa; kích hoạt lại | PUT 200, PATCH status 200 ×2 | Đạt; tên trung tâm hiện đúng (G9) |
| Hồ sơ trung tâm | Lưu lại đúng giá trị cũ | PUT 200 | Đạt |
| Quy tắc thông báo | Thêm quy tắc riêng (ngừng áp dụng), sửa thành bắt buộc, xóa | POST 201, PUT 200, DELETE 204 | Đạt; phát hiện G13, G14 |

Không bấm: tạo tài khoản qua giao diện, đặt lại mật khẩu (nhập mật khẩu), tạo key gia đình (tốn suất), mua gói.

| Mã | Vấn đề | Đã sửa |
|---|---|---|
| G13 | Cột Phạm vi và hộp xác nhận xóa quy tắc hiện UUID tổ chức | Hiện “Riêng trung tâm / <tên trung tâm>” cho CenterAdmin (dùng chung hook `useOwnOrgName`, cache 5 phút) |
| G14 | Xóa quy tắc vẫn báo “Đã lưu trên máy chủ…” | Báo “Đã xóa quy tắc trên máy chủ.” |
| — | Mở “Sửa quyền liên kết” tải lại danh sách nhân viên/VIU không cần thiết | Chỉ tải khi tạo liên kết mới |


## Lượt 7 — bấm lưu thật trên giao diện (Admin, người dùng tự đăng nhập)

Caregiver/VIU QA tạo bằng script trong trung tâm HCM (BE bắt buộc tài khoản không phải Admin phải thuộc tổ chức — đúng nghiệp vụ), thao tác còn lại trên giao diện; cuối lượt đã xóa qua giao diện.

| Màn | Thao tác qua giao diện | API | Kết quả |
|---|---|---|---|
| Tổ chức | Tạo, sửa tên/địa chỉ, vô hiệu hóa, xóa mềm tổ chức QA | POST 201, PUT 200, PATCH status 200, DELETE 204 | Đạt; phát hiện G15, G16 |
| Cấu hình | Nhập 99 (ngoài 1–30) bị chặn tại form; lưu cùng giá trị 3; khôi phục dòng lịch sử | PUT 200, POST rollback 200 | Đạt; G17 không có thông báo thành công (đã sửa) |
| Máy chủ cuộc gọi | Thêm STUN ưu tiên 999, sửa ưu tiên 998 + tắt, xóa (cần tick xác nhận) | POST 201, PUT 200, DELETE 204 | Đạt. Không thêm TURN (không nhập credential) |
| Quy tắc toàn hệ thống | Thêm (ngừng áp dụng), sửa thành bắt buộc, xóa | POST 201, PUT 200, DELETE 204 | Đạt |
| Gói | Sửa tên + ngày dùng thử gói QA; giá -1 bị chặn tại form; khôi phục giá trị cũ | PUT 200 ×2 | Đạt, đã khôi phục |
| Liên kết | Tạo liên kết bằng UUID (Admin), sửa quyền, gỡ | POST 201, PUT 200, DELETE 204 | Đạt |
| Tài khoản | Tìm “qa.adm”, sửa hồ sơ, vô hiệu hóa/kích hoạt, xóa mềm 2 tài khoản | PUT 200, PATCH status 200 ×2, DELETE 204 ×2 | Đạt |

| Mã | Vấn đề | Xử lý |
|---|---|---|
| G15 | Toast sau khi tạo tổ chức: “Tạo tài khoản Center Admin thuộc đợt 5b.” (chữ nội bộ); trang chưa nối API ghi “sẽ được ghép API ở đợt tiếp theo” | Đã sửa câu chữ |
| G16 | Số điện thoại tổ chức chỉ nhận số di động (BE `^(0[3|5|7|8|9])[0-9]{8}$`, FE giống); số bàn trung tâm như 028… bị từ chối, và FE báo một câu chung cho mọi trường | FE đã báo lỗi đúng từng ô. **BE cần quyết định** có nhận số bàn/hotline cho tổ chức không; nếu có, sửa validator BE rồi FE nới regex theo |
| G17 | Lưu/khôi phục cấu hình không có thông báo thành công | Đã thêm toast “Đã lưu cấu hình trên máy chủ…” |
| — | Lịch sử cấu hình và audit chỉ hiện UUID người thay đổi | Góp ý (cần API trả tên hoặc tra cứu), chưa sửa |


## Lượt 8 — test lại sau bản sửa BE (19/10/2026)

BE `main` 5b31a5a (deploy thành công 09:04 19/10) và e10928b. Test bằng script gọi API thật với tài khoản QA mới (đã dọn: xóa người + ảnh, gỡ link, xóa mềm 2 tài khoản).

| Mã | Kết quả | Ghi chú |
|---|---|---|
| N1 | **Đạt** — audit-logs, notifications/failed, guidance/logs với `+07:00` đều 200 | FE vẫn gửi UTC, không ảnh hưởng |
| N2 | **Đạt** — ảnh 1×1 không mặt 422 “No face detected…”, không lưu; 3 ảnh thật 201 có embedding, đủ 3 ảnh thì active | FE đã Việt hóa thông báo 422 này |
| N3 | **Đạt phía BE** — 422 “Current password is incorrect.” | FE trước chỉ bắt 403 nên sẽ hiện tiếng Anh; đã sửa để bắt cả 422 |
| N4 | **Chưa sửa** — `caregiver@gmail.com` vẫn `licenseStatus=null`, subscription 404, links/prefs 402 | Dữ liệu seed |
| N5 | **Chưa sửa** — 429 vẫn không có `Retry-After` | Program.cs chỉ đặt header khi lease có metadata; SlidingWindow không có |
| N6 | **Đạt** — Manual, VoiceCommand, Gesture đều phát `EmergencyAlert` (có detectionMethod, tọa độ, sentAt) | |
| N7 | **Đạt một phần** — refresh sau logout trả 401 | Phát hiện N8 bên dưới |
| #55 EndCall | **Đạt** — cúp khi chưa nghe: không gửi reason → Missed/Cancelled; gửi `user_hangup` → Missed/user_hangup; đã nghe → Ended/user_hangup | |

### N8 — Token bị thu hồi do đăng xuất bị coi là “dùng lại token”, thu hồi mọi phiên — BE

**Nhu cầu / lỗi / API nào:** Sau `POST /api/auth/logout`, gọi `POST /api/auth/refresh` bằng refresh token cũ (ví dụ tab khác còn giữ) trả 401 “Refresh token reuse detected. All sessions have been revoked.”. Theo `RefreshTokenHandler`, token đã thu hồi mà `ReplacedBy == null` (thu hồi do logout) rơi vào nhánh reuse và chạy lệnh thu hồi **toàn bộ** refresh token của user.

**Thêm mới / bổ sung / chỉnh sửa gì:** Phân biệt token bị thu hồi do đăng xuất (lưu lý do thu hồi, ví dụ `RevokedReason = Logout`) với token đã được xoay vòng. Token thu hồi do logout chỉ trả 401 “Invalid refresh token.” và không đụng các phiên khác; chỉ token đã xoay vòng bị dùng lại sau 60 giây mới bị coi là reuse.

**Kết quả kỳ vọng:** Đăng xuất trên một trình duyệt không làm đăng xuất các thiết bị khác của cùng tài khoản; vẫn chặn đúng trường hợp token bị đánh cắp và dùng lại.


## Lượt 9 — test lại BE f6df5b3 (19/10/2026)

Danh sách gửi BE được đánh số lại N1–N7 (N1 seed caregiver, N2 Retry-After, N3 logout cô lập phiên, N4 số bàn tổ chức, N5 errorCode, N6 phiên gọi treo, N7 tên người thực hiện). BE `main` f6df5b3 deploy thành công. Test bằng script API thật; dữ liệu QA (2 tài khoản, 5 tổ chức QA, liên hệ, người) đã xóa.

| Mã | Kết quả |
|---|---|
| N1 seed `caregiver@gmail.com` | **Bỏ (người dùng chốt 19/10):** tài khoản này phải mua gói Personal như người dùng thật; bị 402 khi chưa có license là đúng nghiệp vụ. Ghi chú cũ: — vẫn licenseStatus null, subscription 404, liên kết/tùy chọn 402. `DbSeeder.MigrateAndSeedAsync` thoát sớm khi không phải môi trường Development (`if (!env.IsDevelopment()) return;`), nên `EnsureDevCaregiverLicenseAsync` không chạy trên production |
| N2 429 Retry-After | **Đạt** — `Retry-After: 10` |
| N3 đăng xuất cô lập | **Đạt** — token đã logout: 401 “Session has been logged out…”; thiết bị khác của cùng tài khoản vẫn refresh 200 |
| N4 số điện thoại tổ chức | **Đạt** — 02812345678, 0241234567, 19001234, di động: 201; 12345: 400 |
| N5 errorCode | **Đạt phần chính** — WRONG_CURRENT_PASSWORD, CONTACT_PRIORITY_TAKEN, FACE_NOT_DETECTED có `errorCode`. Các BusinessRule khác (ví dụ tạo user thiếu tổ chức, 422) chưa có mã |
| N6 phiên gọi treo | **Đạt** — sau ~57 giây cả phiên SosAuto và CaregiverInitiated thành Missed/RingTimeout, có WebRtcCallEnded |
| N7 tên người thực hiện | **Đạt** — audit có actorName/actorEmail, lịch sử cấu hình có changedByName/changedByEmail |

FE (nhánh `fix/be-retest-2026-10-19`): đọc `errorCode` vào `ServiceError.code` và dịch mã đã biết tại transport; contacts/registry/auth ưu tiên mã, vẫn giữ dò câu cho deploy cũ; số điện thoại tổ chức theo đúng validator BE mới; Nhật ký kiểm toán hiện cột Người thực hiện (fallback mã), lịch sử cấu hình hiện tên + email.


## Lượt 10 — N5 errorCode (BE 6c704e8) và màn yêu cầu gói dịch vụ (19/10/2026)

**N5 đạt.** Gọi API thật 14 tình huống: ORG_ID_REQUIRED, EMAIL_ALREADY_REGISTERED (tạo user và tự đăng ký), ORG_STATUS_UNCHANGED, NOTIFICATION_RULE_DUPLICATE, LICENSE_KEY_INVALID, WRONG_CURRENT_PASSWORD, LINK_ALREADY_EXISTS, CONTACT_PRIORITY_TAKEN, CONTACT_STATUS_UNCHANGED, FACE_NOT_DETECTED, INVALID_CALL_STATUS_TRANSITION đều có `errorCode`. Lỗi validation 400 (theo từng trường) và 403 không có mã — đúng thiết kế. Dữ liệu QA đã xóa. FE dịch toàn bộ mã BE đang phát ra (khoảng 55 mã) sang tiếng Việt tại `client.ts`.

**Màn yêu cầu gói dịch vụ.** Theo `LicenseValidationMiddleware`, Caregiver cá nhân không có license (hoặc hết hạn quá 3 ngày) bị 402 ở mọi API trừ auth, `users/me`, emergency-events, webrtc/sessions, payments, licenses. FE ánh xạ sang trang:

| Cần gói (hiện màn “Cần gói dịch vụ”, khóa trên sidebar) | Không cần gói |
|---|---|
| Người được chăm sóc, Bản đồ theo dõi, Gương mặt thân quen, Địa điểm & vùng an toàn, Liên hệ khẩn cấp, Liên kết của tôi, Nhật ký hoạt động, Giọng đọc hỗ trợ, Tùy chọn thông báo | Tổng quan, Cảnh báo khẩn cấp, Lịch sử cuộc gọi, License, Thanh toán, Gói dịch vụ, Hồ sơ |

Màn có nút “Chọn gói Personal” (/packages) và “Kích hoạt bằng key” (/license); hết hạn quá 3 ngày thì nút là “Gia hạn gói Personal”. Nhân viên thuộc tổ chức, Active, Trial và Expired trong 3 ngày gia hạn không bị khóa. Nếu hồ sơ không có trường license (BE cũ) thì không khóa để tránh đoán sai; BE vẫn chặn 402 và màn lỗi 402 có thêm nút “Chọn gói dịch vụ”. Tài khoản kiểm tra: `caregiver@gmail.com` (chưa thanh toán) và `thinh0754@gmail.com` (đã thanh toán).

## Đã đạt (API thật)

| Nhóm | Kết quả |
|---|---|
| Auth | login 4 role; register → Trial 7 ngày; refresh xoay token; change-password; PUT users/me |
| B2C | Tạo VIU kế thừa Trial; link đầu tiên tự thành primary; quyền link; CenterAdmin bị 403 với VIU ngoài org |
| Danh bạ | CRUD, PATCH status, Phone/Zalo/Both; **hotline 115 nay được chấp nhận** (trước bị chặn); trùng priority 409 |
| Địa điểm/geofence | CRUD đầy đủ |
| Face registry | CRUD người; recognition logs 200 |
| TTS | GET 404 lần đầu → PUT 200 → GET 200 |
| GPS/lịch sử | live 404 khi chưa có GPS; history, navigation, OCR, QR, voice, recognition 200 với ngày UTC |
| WebRTC | ICE public; tạo phiên + end 200; history 200 |
| Thanh toán | packages; create-link 200 → cancel 200; history; key sai 422 |
| CenterAdmin | org me/PUT, members, activity-summary; staff không tốn suất; VIU org tốn 1 suất; revoke trả suất; rules org; status/reset-password staff |
| Admin | users/links/orgs CRUD; packages; system-config PUT/history/rollback cùng giá trị; ICE CRUD + TURN thiếu credential 400; rules global; ai-metrics; status; failed; hybrid logs |
| Phân quyền | Admin 403 GPS/registry/emergency; CA 403 config/audit/org khác; Caregiver 403 pool; VIU 403 org |

Ghi chú không phải lỗi: refresh token cũ dùng lại trong 60 giây vẫn 200 là thiết kế “benign retry” của BE; GET organizations trả cả tổ chức đã xóa mềm (có `deletedAt`), FE đã hiển thị “Đã xóa”; CenterAdmin không xóa được tài khoản (chỉ Admin), FE cũng chỉ hiện nút cho Admin.

## Chưa kiểm tra

API Web chưa gọi trong các lượt 18/10 (đa số đã đạt ở lượt 16–17/10 hoặc người dùng tự test):

| API | Lý do |
|---|---|
| POST /api/auth/forgot-password, reset-password | Người dùng tự test |
| POST /api/payments/create-link (thanh toán thật), payment return | Người dùng tự test; AI chỉ tạo và hủy link |
| POST /api/licenses/distribute, activate-key hợp lệ | Tốn 1 suất không hoàn lại; đã đạt 16/10 |
| PUT /api/auth/fcm-token | Cần trình duyệt thật; đã đạt 17/10 |
| PATCH /api/caregiver-links/{id}/promote-primary | Đã đạt 16/10, không chạy lại |
| POST /api/licenses/packages | Đã đạt 16/10; không tạo thêm gói |
| GET /api/navigation/sessions/{id}, /events; /api/ocr/requests/{id}; /api/ocr/qr-scans/{id}; /api/voice-commands/{id} | Danh sách rỗng, chưa có dữ liệu Mobile |
| GET /api/face-registry/recognition-logs/{id} | Có log ở lượt 2 nhưng chưa gọi chi tiết |
| Hub RelayOffer / RelayAnswer / RelayIceCandidate | Cần media WebRTC thật |

Ngoài API:

Phát key (tốn 1 suất không hoàn lại), FCM token (cần trình duyệt), media WebRTC thật (SDP/ICE/TURN, âm thanh/video), thao tác trên giao diện trình duyệt. Thanh toán thật và quên/đặt lại mật khẩu do người dùng tự test.

## Thay đổi FE trong lượt này

- `src/services/api/monitoring.ts`: mốc ngày gửi UTC (N1).
- `src/services/api/auth.ts`: thông báo sai mật khẩu hiện tại (N3); refresh bị thu hồi (403) báo hết phiên (N7).
- `src/services/api/auth.test.ts`: 2 unit test cho N3/N7.
- `src/services/api/monitoring.test.ts`, `src/app/e2e/api-auth.spec.ts`: cập nhật định dạng ngày và các kỳ vọng thông báo 403/5xx đã cũ sau thay đổi transport L05.
- `src/services/realtime/calls.ts`, `src/services/api/calls.ts`, `src/pages/caregiver/ApiCalls.tsx`: lý do `Cancelled` khi cúp trước khi nghe và nhãn lý do kết thúc (lượt 3).
- `src/services/realtime/calls.test.ts`, `src/services/realtime/signalr.test.ts`: test cúp trước khi nghe và payload `EmergencyAlert` 4 loại.
- `src/services/api/auth.test.ts`: sửa test cũ so sánh token sinh theo giây (thỉnh thoảng lỗi khi qua mốc giây).
- `src/pages/caregiver/ApiContacts.tsx`, `ApiRegistry.tsx`, `ApiPlaces.tsx`, `ApiTts.tsx`, `ApiActivity.tsx`: dùng chung lựa chọn người được chăm sóc (G1); `ApiContacts.tsx` mô tả số hợp lệ (G3).
- `src/pages/shared/ApiNotifications.tsx`: bỏ chữ nội bộ đợt 8c (G2).
- `src/services/api/accounts.ts` (+ test): `options()` lấy danh sách tài khoản hoạt động của tổ chức cho ô chọn (G8).
- `src/hooks/useOrgPeople.ts` (mới), `src/pages/shared/ApiLinks.tsx`, `src/pages/shared/LicenseAssignments.tsx`: ô chọn nhân viên/VIU (G8).
- `src/pages/shared/ApiAccounts.tsx`: tên tổ chức (G9).
- `src/app/e2e/api-auth.spec.ts`: test 5c/U4 dùng ô chọn với CenterAdmin.
- `src/services/api/contacts.ts` (+ test): thông báo tiếng Việt khi trùng thứ tự ưu tiên (G12).
- `src/hooks/useOrgPeople.ts`, `src/pages/shared/ApiNotifications.tsx`, `ApiAccounts.tsx`, `ApiLinks.tsx`: tên trung tâm ở quy tắc thông báo (G13), thông báo xóa (G14), bớt tải lại danh sách.
- `src/pages/shared/ApiOrganizations.tsx`, `ApiSession.tsx`: bỏ chữ nội bộ “đợt” (G15). `src/services/api/organizations.ts`: lỗi theo từng ô (G16). `src/pages/super-admin/ApiConfigurations.tsx`: toast lưu cấu hình (G17).
- Lượt 8 (nhánh `fix/be-retest-2026-10-19`): `src/services/api/auth.ts` (+ test) bắt cả 422 sai mật khẩu; `src/services/api/registry.ts` (+ test) Việt hóa 422 ảnh không có khuôn mặt.
- Lượt 9: `src/services/contracts.ts`, `src/services/http/client.ts` (+ test) errorCode; `auth.ts`, `contacts.ts`, `registry.ts` dùng mã; `organizations.ts` (+ test), `ApiOrganizations.tsx` số bàn/tổng đài; `monitoring.ts`, `ApiMonitoring.tsx`, `configurations.ts`, `ApiConfigurations.tsx` tên người thực hiện.
- Lượt 10: `src/services/http/client.ts` dịch mã lỗi BE; `src/services/api/licenses.ts` (+ test) quy tắc khóa; `src/pages/shared/LicenseGate.tsx` (mới), `StatusPage.tsx`, `src/app/App.tsx`, `src/components/UI.tsx`, `src/styles/workspace.css` màn yêu cầu gói và khóa sidebar; `src/app/e2e/api-auth.spec.ts` test khóa, `redesign.spec.ts` sửa test chờ đăng nhập.
