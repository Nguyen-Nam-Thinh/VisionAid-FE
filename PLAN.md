# VisionAid Web — Kế hoạch tích hợp API và bàn giao cho AI tiếp theo

Cập nhật: 2026-09-25. Phạm vi: VisionAid-FE. Không sửa BE/Mobile trong nhiệm vụ FE.

## Đọc trước khi làm tiếp

1. Đọc AGENTS.md, CLAUDE.md, PLAN.md (file này), api.txt và docs/API_STAGE_02_TEST.md.
2. Kiểm tra git status/branch/log và fetch origin. Mốc code đã merge: dev tại bec1a1f; đợt 1: 700d748; đợt 2: 1441d10. Không reset về các mốc này nếu có code mới hơn.
3. Code và contract đang chạy quyết định trạng thái. Một số đoạn CLAUDE.md/README/BACKEND_INTEGRATION.md cũ còn ghi toàn bộ là mock: phần đó đã lỗi thời đối với 10 API được đánh dấu DA_NOI trong api.txt.
4. Chỉ làm đợt người dùng yêu cầu. Sau mỗi đợt đưa checklist test, báo các API phụ thuộc nhau, rồi DỪNG chờ người dùng xác nhận trước khi làm đợt tiếp theo. Không coi roadmap này là lệnh thực hiện toàn bộ.
5. Yêu cầu merge/push không tự chứng minh người dùng đã test BE thật. Hiện chưa có báo cáo nghiệm thu từng bước từ người dùng; không ghi “live E2E passed”.

## Trạng thái tại lúc bàn giao

| Đợt | Nội dung | Code | Kiểm thử BE thật |
|---|---|---|---|
| 0 | Base URL, CORS localhost, transport, API mode | Đã làm, merge dev | Đã đọc Swagger và gọi GET /users/me không token nhận 401; chưa chứng minh login |
| 1 | Login, GET hồ sơ, refresh, logout, guards | Đã làm, merge dev | Chờ người dùng xác nhận |
| 2 | PUT hồ sơ, đổi mật khẩu và đăng nhập lại | Đã làm, merge dev | Chờ người dùng xác nhận |
| 3a | Đăng ký Caregiver + logout-all | Merge dev b008a59 | Chờ người dùng test; consent hoãn theo yêu cầu |
| 3b | Quên/reset mật khẩu | Đã nối, nhánh feat/api-password-recovery | Chờ test inbox/SMTP thật |
| 4–14 | Các phần dưới đây | CHƯA NỐI API | Chưa test |

Đã có bằng chứng tự động: 36 unit tests; 5 kịch bản Playwright dùng response giả theo contract; build và lint pass. Playwright Windows có lần treo dọn webServer sau khi cả 5 case đã báo OK và phải dừng tiến trình; không ghi cả test runner exit 0 cho lần đó. Build có cảnh báo chunk khoảng 500 kB, không phải lỗi build.

API mode mở landing, login, register, recover/reset, dashboard thông tin phiên và /profile (có logout-all). Các route nghiệp vụ vẫn hiển thị ApiPending; menu nghiệp vụ bị ẩn. Các màn mock có sẵn không có nghĩa đã tích hợp BE. Không fallback seed khi API lỗi.

## Môi trường và file cần biết

- FE: D:/FPT/Ky-9/SEP409/VisionAid-FE; BE tham khảo: ../VisionAid-BE.
- Swagger: http://51.210.176.94:5002/swagger/index.html; OpenAPI: http://51.210.176.94:5002/swagger/v1/swagger.json.
- Đã đối chiếu live OpenAPI ngày 2026-09-25: 107 method + path. api.txt liệt kê đủ 107, kèm nguồn controller, quyền khai báo, request schema và query params.
- .env local: VITE_SERVICE_MODE=api; VITE_API_BASE_URL=http://51.210.176.94:5002. Không commit .env, password hoặc token.
- Chạy npm.cmd run dev; mở http://localhost:5173. CORS đã kiểm tra trước đây cho phép origin này, không cho http://127.0.0.1:5173; xác minh lại khi đổi môi trường. FE HTTPS cần BE HTTPS để tránh mixed content.
- src/services/api/auth.ts: token/session, single-flight refresh, unwrap response, profile mapping. expiresAt của BE là hạn refresh; access expiry đọc JWT exp. Token lưu sessionStorage theo tab; không remember-me, không lưu password, chưa đồng bộ refresh giữa nhiều tab.
- src/services/http/client.ts: transport và lỗi; src/services/api/adapter.ts: 10 API đã nối, hàm khác fail 501.
- src/hooks/useService.ts: session/cache/logout; src/app/App.tsx: route guards/menu/API stage gate; src/app/features.tsx: danh mục route nghiệp vụ.
- src/pages/auth/AuthPage.tsx; src/pages/shared/Profile.tsx; src/pages/shared/ApiSession.tsx: màn đã nối.
- src/services/contracts.ts và models/domain.ts là model nội bộ FE, không gửi nguyên lên BE. Snapshot toàn bộ chỉ là kiến trúc mock; mỗi resource thật cần query key gồm user/org/VIU/filter/page.
- Tests: npm.cmd test; npm.cmd run lint; npm.cmd run build; npm.cmd run test:e2e:api. API fixture port 5176; mock E2E port 5177. Không sửa base URL người dùng để chạy fixture.

## Cách hoàn thành một đợt

- Đọc controller, DTO, validator, handler và authorization của chính endpoint; Swagger có thể không khai báo response schema đầy đủ. Ảnh chỉ chứng minh tên API, không chứng minh payload/quyền.
- Tạo nhánh riêng từ dev mới nhất theo CLAUDE.md. Không ghi đè thay đổi người dùng. Dùng lại auth transport; khi cần đưa authorized request ra dùng chung, refactor tối thiểu kèm regression refresh.
- Chỉ mở route/menu đã nối xong. Không bỏ gate toàn bộ App chỉ để mở một màn.
- Kiểm tra loading/empty/error, 401/403, server validation, pagination, đổi VIU nhanh, org khác và unlinked user. Không tự retry ghi dữ liệu hoặc optimistic quyền/cảnh báo/sinh trắc học.
- Chạy test phù hợp + build/lint. Test fixture và test BE thật phải ghi riêng.
- Đưa checklist, tài khoản/dữ liệu cần có, thứ tự API phải gọi chung. Không tự tạo cảnh báo khẩn cấp hoặc gửi email trên dữ liệu thật để kiểm thử.
- Cập nhật PLAN.md và api.txt: code đã nối, file gọi, kết quả test thật, lỗi còn lại, commit, việc tiếp theo. Lưu/push theo quy trình repo; merge theo quyền đã được người dùng cấp cho công việc đó. Không tự đi sang đợt mới.

## Các đợt còn lại (đánh số tiếp từ đợt 2)

Đây là phân chia bàn giao cho phần chưa làm; không khẳng định các số đợt 3–14 đã được triển khai hay đã nghiệm thu.

### Đợt 3 — Hoàn thiện tài khoản công khai

- 3a: POST /auth/register; POST /auth/accept-privacy-policy nếu luồng đồng ý chính sách đã được chốt; POST /auth/logout-all tại hồ sơ có xác nhận.
- 3b: POST /auth/forgot-password + POST /auth/reset-password. Tách checkpoint nếu mail chưa sẵn sàng.
- Màn: /auth/register, /auth/recover, /auth/reset, /profile. Reuse AuthPage/useAuth; contract hiện là resetPassword(email, code, password); API nhận email/token/newPassword, mock cũng kiểm tra email khớp mã.
- Phụ thuộc: đợt 1; inbox thử nghiệm, SMTP và URL email/reset của BE cho 3b. Register chỉ Caregiver, không tự chọn Admin/CenterAdmin. Device phải nhất quán login/refresh/logout.
- Test 3a: email trùng, password policy, register -> GET me, logout-all -> đăng nhập lại; chỉ ghi consent sau người dùng đồng ý phiên bản cụ thể.
- Test 3b: gửi mail -> lấy token -> đặt mật khẩu -> login; token sai/hết hạn/dùng lại bị từ chối; không hiển thị token giả trong UI API.
- Điểm dừng: người dùng xác nhận từng checkpoint. Không chặn đợt đọc dữ liệu nếu chỉ SMTP đang lỗi và người dùng cho phép đổi thứ tự.

### Đợt 4 — Người được chăm sóc và liên kết cơ bản

- 4a (đọc): GET /users + GET /caregiver-links + GET /caregiver-links/{id}; /caregiver/users và selector VIU dùng dữ liệu thật.
- 4b (ghi): POST /users tạo VIU B2C rồi POST /caregiver-links; DELETE link khi được phép. Hai request không atomic: tạo user thành công/link thất bại phải giữ ID, báo rõ bước thất bại và cho thử lại link, không tạo user trùng.
- Caregiver không được GET /users/{id} theo controller; lấy dữ liệu được phép từ danh sách/DTO link, không mở quyền bằng FE. Chưa có link có thể khiến user mới không còn trong danh sách: giữ ID từ response tạo.
- Phụ thuộc: tài khoản Caregiver + VIU thử nghiệm; primary/secondary; một VIU không liên kết để test cấm.
- Test: rỗng, phân trang/search, tạo + link + reload, gỡ link -> mất quyền/cache, không thấy VIU/org khác. Hoàn thành 4a trước 4b.

### Đợt 5 — Tổ chức, tài khoản, phân công

- 5a: /admin/organizations và /center-admin/organization: organizations list/me/detail/create/update/status/delete/members theo quyền; không cấp CenterAdmin delete/status tổ chức.
- 5b: /admin/accounts, /center-admin/staff, /center-admin/users: users list/detail/create/update/status/reset-password; DELETE users chỉ Admin.
- 5c: /center-admin/assignments, /admin/links, /caregiver/caregivers: caregiver-links create/detail/permissions/promote-primary/delete theo contract.
- Phụ thuộc: 4 + tổ chức có CenterAdmin/staff/VIU, thêm tài khoản org khác. Tạo organization -> user đúng role/org -> link Organization -> test quyền.
- Caregiver API chỉ đọc own links, không mặc định thấy danh sách mọi secondary. promote-primary chỉ Admin/CenterAdmin. QR invitation và add-secondary bằng email trong mock chưa có contract tương đương: giữ khóa phần đó và báo người dùng, không dùng /ocr/qr-scans thay thế.
- Test riêng từng checkpoint: cross-org bị chặn, deactivate mất phiên, reset mật khẩu, thay primary không có hai primary, quyền đổi phải refetch. Các thao tác xóa/vô hiệu hóa cần xác nhận UI.

### Đợt 6 — GPS và bản đồ đọc dữ liệu

- GET /locations/live + /locations/history -> /caregiver/map và /center-admin/map; history còn dùng ở /caregiver/activity.
- Phụ thuộc: 4 (Caregiver), 5 (fleet tổ chức), Mobile gửi POST /locations/gps, public Mapbox token. POST GPS không do Web giả gửi.
- Test: VIU đang có GPS, VIU mất kết nối, không có dữ liệu, timestamp/lat-lng/accuracy nullable, đổi VIU, scope org. Không gọi vị trí cũ là realtime. Chưa có Mapbox token thì báo rõ giới hạn bản đồ, không tuyên bố đã nối SDK.

### Đợt 7 — Cảnh báo và xử lý

- GET /emergency-events, GET detail, PUT acknowledge/escalate/resolve -> /caregiver/alerts; dùng cùng dữ liệu cho fleet/report phù hợp.
- Phụ thuộc: 4/5 và Mobile hoặc BE fixture có event test. POST event và PUT dismiss là Mobile, không thêm vào Web.
- Test bắt buộc theo chuỗi: list -> detail -> acknowledge -> resolve; nhánh escalate theo state hợp lệ. Test event đã được người khác xử lý, quyền bị gỡ, snapshot thiếu, không ghi thành công khi lỗi.
- Không tự suy ra state machine từ mock, không tự gọi 115, không invent endpoint history nếu detail đã chứa history.

### Đợt 8 — Realtime, thông báo và quy tắc

- 8a: SignalR /hubs/location cho map/alerts; kiểm tra source Hub + nơi phát events và quyền groups trước khi viết client. Kết nối hai chiều không phải REST endpoint trong api.txt.
- 8b: GET/PUT /notifications/preferences -> /caregiver/notifications; rules CRUD -> /admin/rules, /center-admin/routing.
- 8c: FCM web push sau khi có Firebase public config, VAPID, service worker và contract token lifecycle. Login/register device.fcmToken có thể nhận token; chưa thấy endpoint độc lập cập nhật token, không bịa URL refresh FCM.
- Phụ thuộc: 6/7, dữ liệu sự kiện, account đúng org. GET rules chỉ Admin/CenterAdmin; caregiver preference DTO không mặc định có thông tin mandatory: cần BE cung cấp hoặc chốt cách thể hiện.
- Test từng checkpoint: reconnect/refetch, không nhân đôi handler, logout cleanup, dedup alert/push, quyền notifications denied; rule org không thay rule global trái phép.

### Đợt 9 — Địa điểm và vùng an toàn

- saved-locations CRUD + geofences CRUD -> /caregiver/locations; CenterAdmin được controller cho phép nhưng route quản lý tương ứng chưa có: chỉ thêm khi người dùng chọn scope.
- Phụ thuộc: 4/5, quyền CanManageLocations; 6 để chọn tọa độ/map.
- Test: tạo -> GET -> sửa -> reload -> xóa; radius/coordinate validation, active/enter/exit, user ngoài link bị cấm. Test alert đi vào/ra cần Mobile GPS + boundary worker + đợt 7/8, không kết luận từ lưu form.

### Đợt 10 — Gương mặt thân quen

- persons CRUD + upload/delete/primary photos -> /caregiver/registry.
- Phụ thuộc: 4, CanManageRegistry, storage/AI BE, ảnh thử có consent. Luồng: tạo person -> upload từng ảnh -> GET trạng thái -> chọn primary -> xóa ảnh/person.
- Cần xác minh URL đọc ảnh/ủy quyền giải mã: đường dẫn .enc không phải ảnh browser; chưa có endpoint giải mã được xác nhận. Có thể nối metadata trước, chặn preview/upload nếu contract chưa đủ và ghi blocker riêng.
- Test: dưới/đủ ngưỡng ảnh theo BE, upload lỗi không báo thành công, MIME/size theo validator thật, quyền gỡ giữa chừng, primary/delete, media bị cleanup. Không đưa AES key/MinIO credentials vào FE.

### Đợt 11 — Liên hệ khẩn cấp và TTS

- 11a: /users/{userId}/emergency-contacts list/detail/create/update/status/delete -> /caregiver/contacts.
- 11b: GET/PUT /users/{userId}/tts-preferences -> /caregiver/tts.
- Phụ thuộc: 4 và quyền BE cho VIU; luồng me chủ yếu phục vụ Mobile, không dùng me để sửa cài đặt của VIU được chọn.
- Test: CRUD contacts, priority/channel validation; TTS save -> reload -> Mobile đọc lại. BE volume 0–1, UI mock 0–100 cần map; lưu server không chứng minh thiết bị đã phát giọng mới.

### Đợt 12 — Lịch sử và báo cáo

- GET navigation sessions/detail/events, OCR requests/detail, QR scans/detail, recognition logs/detail, voice commands/detail, location history -> /caregiver/activity.
- /center-admin/reports: GET organizations/{id}/activity-summary, members và dữ liệu được phép; không kéo face recognition của Caregiver sang CenterAdmin trái quyền.
- Phụ thuộc: 4/5 và dữ liệu do Mobile tạo. Các POST OCR/QR/voice/recognition/navigation không thuộc Web.
- Test theo từng tab, pagination/date timezone, empty, detail ngoài scope, media hết retention, export chỉ nếu có contract hoặc xuất tập đã tải với giới hạn nêu rõ.

### Đợt 13 — Quản trị hệ thống

- /admin/configurations: configs list/detail/update/history/rollback; /admin/metrics: GET ai-metrics; /admin/audit: GET audit-logs; /admin/delivery: GET notifications/status + failed.
- Phụ thuộc: Admin, dữ liệu jobs/logs; 8 để test kết quả notification thực. Không tự tạo CRUD/rerun job không có API.
- Test: quyền non-admin bị chặn, filter/page, config validation -> history -> rollback; metrics đơn vị/weighted aggregates, trạng thái thông báo không giả thành đã nhận ở thiết bị.

### Đợt 14 — Dashboard tổng hợp và nghiệm thu

- Thay dashboard phiên bằng dữ liệu thực từ API đã nối theo từng role. Không có dashboard endpoint chuyên biệt trong 107 API: không bịa /api/dashboard hoặc số liệu thống kê từ trang đầu của danh sách.
- Kiểm tra toàn bộ enabled routes, HTTP errors, refresh, đổi account/VIU, org isolation, responsive/accessibility, realtime/FCM và deployment HTTPS/SPA fallback.
- Chỉ bỏ stage gates cho phần đã được nghiệm thu. Ghi mọi chức năng thiếu contract riêng; “UI có sẵn” không phải tiêu chí hoàn thành.

## Việc bắt đầu tiếp theo

Khi người dùng yêu cầu tiếp tục: xử lý lỗi test 3b nếu có, rồi làm checkpoint 4a (đọc users/links) theo scope được giao. Người dùng đã yêu cầu để consent chờ do chưa có nội dung/phiên bản; không tự đặt policyVersion hoặc gửi consent. Nếu người dùng ưu tiên người được chăm sóc, có thể chuyển 4a vì không phụ thuộc register/mail; ghi lại thay đổi thứ tự. Không tự gửi mail hay thay mật khẩu tài khoản thật để tạo bằng chứng test.

## Nhật ký để AI tiếp theo cập nhật

| Đợt/checkpoint | Trạng thái code | Test fixture | Test BE thật/người xác nhận | Commit | Blocker/việc tiếp |
|---|---|---|---|---|---|
| 0–1 | Merge dev | Đạt | Chưa có xác nhận chi tiết | 700d748 / bec1a1f | Theo dõi lỗi login thực tế nếu người dùng báo |
| 2 | Merge dev | Đạt | Chưa có xác nhận chi tiết | 1441d10 / bec1a1f | Checklist docs/API_STAGE_02_TEST.md |
| 3a | Merge dev | Xem docs/API_STAGE_03A_TEST.md | Chờ người dùng | 401b264 / b008a59 | Consent hoãn: chưa có nội dung/phiên bản chính thức |

| 3b | Đã nối forgot/reset | 42 unit + 8 API E2E + 1 mock regression đạt | Chờ inbox/SMTP thật | Nhánh feat/api-password-recovery | Email Mobile deep link, Web hỗ trợ dán |

Không đánh dấu một đợt hoàn thành chỉ vì đã commit hoặc push. Sau mỗi thay đổi, cập nhật từng API ở api.txt và bảng này để AI khác không làm lại hoặc bỏ sót.

### Checkpoint 3a

Đã nối POST register và POST logout-all; tổng 8 operations Web. Đăng ký -> GET me dùng cùng deviceId với login/refresh. Logout-all luôn xóa local session/cache, kể cả lỗi, và báo chưa xác nhận server khi cần. BE chỉ revoke refresh/FCM; access token thiết bị khác có thể còn hiệu lực tới hạn. Consent chưa triển khai theo câu trả lời người dùng; không chặn test register/logout-all. Checklist: docs/API_STAGE_03A_TEST.md.

Kiểm tra checkpoint 3a: 39 unit tests, 7 Playwright fixture tests exit 0, build/lint đạt. Chưa có nghiệm thu BE thật. Chờ người dùng test trước 3b.

### Checkpoint 3b

Đã nối POST /auth/forgot-password và POST /auth/reset-password. Tổng 10 operations Web.
BE email hiện chứa visionaid://reset-password?token=...&email=... (Mobile), chưa có Web link.
FE nhận token thô hoặc nguyên deep link sao chép từ email; chỉ parse đúng scheme/host và email khớp,
không tự mở URL, không lưu token/password vào storage. Người dùng nhập email tại /auth/reset.
Thông báo forgot dùng câu chung; 403 reset được báo mã sai/đã dùng/hết hạn; không retry mutation.
Sau reset thành công xóa session/cache, về login. SMTP/inbox/Redis và token TTL 15 phút phải test BE thật.
Consent vẫn hoãn theo yêu cầu. Checklist: docs/API_STAGE_03B_TEST.md. Chưa thực hiện 4a.

Kiểm tra 3b: 42 unit, 8 API fixture E2E (chạy riêng, exit 0), 1 mock recovery regression, build/lint đạt. Lần đầu chạy song song hai bộ Playwright bị xung đột thư mục trace; không chạy hai bộ cùng outputDir đồng thời.
