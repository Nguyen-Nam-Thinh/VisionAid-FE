# VisionAid Web — Plan cập nhật B2C, B2B, License, PayOS và WebRTC

Cập nhật 2026-10-04. Base FE khảo sát U0: dev `5692a87`; BE local mới `e56c545`. Đây là kế hoạch triển khai, không phải lệnh thực hiện mọi đợt. U1–U3a đã triển khai FE; U3b trở đi chưa triển khai.

**Kết quả U0 mới nhất:** đã đọc BE mới và OpenAPI deploy có 140 operations (33 mới, 107 cũ giữ nguyên). Đọc [docs/U0_BACKEND_FINDINGS.md](docs/U0_BACKEND_FINDINGS.md) trước các câu hỏi dự kiến bên dưới; tài liệu đó thay thế những giả định đã được xác minh. U0 mới hoàn tất kiểm kê/khảo sát, còn policy và test thật. Có FCM upsert. Người dùng xác nhận BE đã sửa billing allowlist, Staff exemption và kế thừa license khi first Personal link; local chưa có bản sửa để đối chiếu. Trial/Personal tối đa 3 VIU theo MaxViusPerCaregiver, không enforcement quota theo gói. Không còn cần người dùng gửi lại vị trí BE/Swagger.

## 1. AI tiếp theo bắt đầu ở đâu

1. Đọc AGENTS.md, CLAUDE.md, PLAN.md và api.txt; kiểm tra git status, fetch dev. Giữ thay đổi có sẵn của người dùng tại src/services/api/auth.ts và .env ngoài commit.
2. U2 đã triển khai, chờ test theo docs/API_STAGE_U2_TEST.md. U1 vẫn chưa có xác nhận test live, người dùng đã yêu cầu tiếp U2. Người dùng đã yêu cầu tiếp U3a, hiện đã triển khai FE và chờ test theo docs/API_STAGE_U3A_TEST.md. Đợt kế tiếp là **U3b — Business/pool**, chỉ bắt đầu khi người dùng yêu cầu. Không tiếp tục máy móc từ mục “đợt 6” trong plan cũ.
3. Sau mỗi checkpoint: kiểm thử tự động, bàn giao checklist test thật và API phải chạy cùng nhau, rồi dừng chờ người dùng. Chỉ đổi thứ tự hoặc bỏ qua test khi người dùng cho phép; merge/push không có nghĩa đã nghiệm thu.
4. Mỗi đợt dùng nhánh riêng, commit/push và merge dev sau kiểm tra theo CLAUDE.md. Main/Vercel production do người dùng chủ động phát hành.
5. Cập nhật trạng thái từng đợt trong file này và từng API trong api.txt. Không đánh dấu DA_NOI chỉ vì có menu, mock hoặc tài liệu BE.

## 2. Nguồn và mức độ xác minh

- Nghiệp vụ mới: `C:/Users/thinh/Downloads/VisionAid_Update_Report.docx`, báo cáo đề ngày 28/9/2026; và `C:/Users/thinh/Downloads/Luồng B2C - B2B.txt` do người dùng gửi 03/10/2026. Nội dung cần thiết để tiếp tục được tổng hợp ngay trong plan này, không phụ thuộc việc AI sau còn truy cập Downloads.
- Code FE: src/app/App.tsx, src/services/api/*, src/models/domain.ts, src/pages/*; đã đối chiếu route đang mở và DTO hiện tại.
- BE local ../VisionAid-BE/src đã cập nhật e56c545, có License/Payment/WebRTC. Chưa thấy API/pipeline Hybrid Guidance tương ứng trong phạm vi rà soát. Có entity không chứng minh tính năng chạy đầy đủ.
- Swagger deploy: https://api.visionaid.net/swagger/index.html; đã GET schema public /swagger/v1/swagger.json. Source và endpoint đã đối chiếu trong báo cáo U0, chưa test authenticated runtime.
- api.txt giữ snapshot 107 REST cũ và bổ sung U1–U3a, tổng 52 caller Web; [snapshot U0](docs/U0_OPENAPI_2026-10-03.md) kiểm kê 140 operations. SignalR không tính như REST. Không suy ra DTO/quyền chỉ từ tên bảng DB.
- Lịch sử triển khai và checklist cũ được giữ tại [docs/PLAN_LEGACY_2026-10-03.md](docs/PLAN_LEGACY_2026-10-03.md). File đó chỉ tra cứu lịch sử; thứ tự thực hiện hiện hành là plan này.

## 3. Phần đã làm và phần cần điều chỉnh

| Mốc cũ | Trạng thái code tại dev | Việc cần làm theo scope mới |
|---|---|---|
| 0–2 | Transport, auth/refresh/guards, hồ sơ, đổi mật khẩu đã nối | Bổ sung entitlement/license vào DTO theo contract; xử lý 402 riêng |
| 3a | Đăng ký Caregiver, logout-all đã nối | Kiểm tra trial tự kích hoạt và login sau đăng ký; consent vẫn chờ nội dung/version |
| 3b | Forgot/reset đã nối; email reset flow sửa ở 51c0a2b | Test email -> /reset-password -> mật khẩu mới -> login. Không còn form nhập mã thủ công trong API mode |
| 4a–4b | Danh sách VIU, tạo VIU + link, gỡ link cá nhân đã nối | Giữ phục hồi bước link; giữ giới hạn tối đa 3 VIU; kiểm tra kế thừa license khi tạo và first Personal link |
| 5a–5c | Tổ chức, tài khoản, staff, VIU, phân công đã nối | Tạo VIU B2B consume pool; tạo staff không consume; quyền Staff vẫn theo link/org |
| 6 | GPS live/history đã nối | Bản đồ nền/Mapbox chưa được xác nhận hoàn tất; không gọi dữ liệu cũ là trực tiếp |
| 7 | Cảnh báo đọc/acknowledge/escalate/resolve đã nối | Kiểm tra safety exception của license và liên kết WebRTC |
| 8a–8b | SignalR vị trí/cảnh báo, preferences/rules đã nối | Bổ sung delivery cho license/payment khi BE có; không dùng rules UI để suy ra push đã gửi |
| Sửa UI | Merge dev 88ab163: reset link, căn hàng, popup chi tiết/form | Giữ Dialog/Confirm dùng chung, focus và pending guard khi thêm màn mới |
| 8c | FCM mới chuẩn bị; config/VAPID đã nhận | BE có PUT /api/auth/fcm-token; gỡ blocker upsert, còn test logout/revoke/nhiều tab |
| 9–14 | Các route nghiệp vụ tương ứng còn ApiPending trong API mode | Giữ backlog, sắp lại thứ tự bên dưới; mock không phải API đã nối |
| License/PayOS/WebRTC/Hybrid | U1: profile license, trang /license chỉ đọc và UX 402; Personal PayOS U3a đã có; Business/WebRTC/Hybrid chưa làm | U2–U9 bên dưới |

Bằng chứng gần nhất: 74 unit tests; lint/build đạt; 30 kịch bản API fixture có kết quả đạt qua các lượt chạy và chạy lại; mock notifications/TTS/geofence/keyboard đạt; kiểm tra popup 1440/768px. Không phải live BE E2E. Email đã được người dùng nhận trong trao đổi trước, nên lỗi SMTP 500 cũ chỉ là lịch sử, không kết luận đang hỏng. Chưa có xác nhận nghiệm thu toàn bộ luồng reset hoặc CORS hiện tại.

## 4. Nghiệp vụ mới dùng để thiết kế

### B2C cá nhân

Caregiver tự đăng ký -> BE cấp token và trial 7 ngày -> tạo VIU -> tạo personal primary link. TXT cho phép tạo trong trial; Word mô tả tạo sau thanh toán, cần U0 xác nhận luồng chính thức. Trial/Personal quản lý tối đa 3 VIU theo MaxViusPerCaregiver; đây là quyết định nghiệp vụ, không enforce quota B2C theo gói. Hết hạn có grace 3 ngày; sau grace cần mua/gia hạn để dùng các tính năng bị giới hạn. Personal mặc định 99.000 VND/tháng. Giá và feature flags lấy từ API gói; giới hạn B2C theo MaxViusPerCaregiver = 3, không suy ra quota từ maxViuPerLicense trong package.

Chuỗi thanh toán: chọn packageId -> BE tạo giao dịch PENDING và checkoutUrl -> người dùng thanh toán PayOS -> BE xác minh webhook và kích hoạt/gia hạn -> Web đọc lại transaction và license. Return URL, query success hoặc đóng tab PayOS không chứng minh đã thanh toán.

### B2B nội bộ trung tâm

Super Admin tạo organization -> tạo CenterAdmin thuộc org -> CenterAdmin mua Business -> BE tạo pool -> CenterAdmin tạo staff/VIU -> phân công staff có link ORGANIZATION. Business mặc định 4.500.000 VND/tháng, 50 VIUs. Staff không tiêu thụ license; mỗi VIU consume 1. CenterAdmin không cần subscription cá nhân; không chặn CenterAdmin mua pool chỉ vì license_status=NONE.

Hết pool: BE có thể trả 422 khi tạo VIU; UI giữ dữ liệu form và chỉ rõ cần mua thêm/thu hồi. Topup, thời hạn, số dùng/còn lại do BE trả về. Thu hồi assignment có xác nhận, không đồng nghĩa xóa VIU hoặc caregiver link. Test hai admin tạo đồng thời ở suất cuối; FE không tự tăng/giảm số pool để quyết định quyền.

### B2B mở rộng cho gia đình

CenterAdmin phân phối key từ pool -> gia đình nhận key -> Caregiver kích hoạt -> dùng theo subscription B2C. Gia đình bên ngoài không tự trở thành thành viên org, không mặc định cấp trung tâm quyền GPS/ảnh/contacts. Key chưa có người nhận, chủ subscription, thời điểm consume pool và hết hạn cần contract rõ. Không tự gửi key qua email/Zalo; hiển thị/copy cho thao tác đã được người dùng yêu cầu.

### Standalone và Hybrid AI

Standalone là VIU thuộc trung tâm với Staff Caregiver phụ trách, không phải role mới hoặc tài khoản không có người hỗ trợ. Dùng luồng phân công sẵn có; contacts theo cấu hình trung tâm, không hardcode chỉ 115.

YOLOv8n on-device xử lý NEAR ngay; Mobile gửi JSON MEDIUM/FAR cho BE; BE dùng JEV/Groq hoặc rule-based và map decision qua template TTS. Web chỉ quản trị cấu hình, xem log/metrics theo quyền; không chạy camera detection, decision engine hoặc thay Mobile phát TTS. Không đợi phản hồi cloud cho cảnh báo NEAR.

### WebRTC

Ba trigger: CAREGIVER_INITIATED, VIU_VOICE_COMMAND, SOS_AUTO. Caregiver xem video VIU và trao đổi audio; VIU chủ yếu nghe audio. Signaling dự kiến qua SignalR, media qua WebRTC/STUN/TURN. Phải xác minh Hub method/event/DTO và quyền session trước khi triển khai. Tự mở stream do SOS phụ thuộc consent, permission, trạng thái Mobile/browser; không hứa browser tự bật mic/camera hoặc bỏ qua thao tác nhận cuộc gọi.

## 5. Các điểm phải xác nhận ở U0

| Vấn đề | Nguồn/chênh lệch | Cách xử lý trong plan |
|---|---|---|
| BE mới nằm đâu | ĐÃ XÁC MINH local e56c545 + Swagger HTTPS 140 operations | Không hỏi lại; xem báo cáo U0 cho các chênh lệch contract cụ thể |
| Giới hạn B2C | ĐÃ CHỐT: Trial/Personal tối đa 3 VIU, không quota enforcement theo gói | Giữ MaxViusPerCaregiver=3; test đủ 3 và từ chối link thứ 4 |
| Dashboard sau grace | Word: read-only; TXT: middleware trả 402 dashboard/features | Chốt GET nào còn được phép, payload 402, allowlist billing/auth/SOS/navigation; FE không thể giữ read-only nếu BE chặn mọi GET |
| NONE và Navigation | Bảng Word chặn Navigation khi NONE; kết luận “không bao giờ block” | Chốt riêng NONE so với EXPIRED. Giữ SOS; không tự chốt policy thay BE |
| Trial và tạo VIU | ĐÃ ĐỌC: RegisterCaregiver gọi ActivateTrial; CreateUser cho kế thừa license caregiver | Có thể tạo trong trial theo source; chờ test thật, cần PERSONAL active seed |
| Chủ license/quyền staff | BE xác nhận Staff Caregiver có organization_id hợp lệ bypass license cá nhân | Kế thừa lúc tạo VIU đã có; first Personal link chỉ inherit khi VIU chưa có license. Chờ đối chiếu source/deploy mới |
| Key distribution | ĐÃ ĐỌC: trừ pool ngay khi phát key, Suspended/subscriber null, hạn theo pool | Activate gắn subscriber; còn kiểm tra cạnh tranh, reclaim/quản lý key và middleware allowlist |
| Phân công B2B | Ví dụ POST link TXT thiếu caregiverId | Theo DTO/handler thực tế để chọn đúng staff, không dùng CenterAdmin làm caregiver mặc định |
| Gia hạn/topup | TXT có now+30 ngày và cộng 50; Word có yearly/auto_renew | Chốt kỳ, còn hạn mua thêm, tháng vs 30 ngày, số lượng, cancel/refund; không tạo toggle auto-renew chỉ từ cột DB |
| Hybrid NEAR | Mô tả NEAR luôn offline; config near_threshold_ms nói fallback sau chờ | NEAR không chờ cloud; hỏi BE ý nghĩa config trước khi mở editor |
| PayOS môi trường | Báo cáo ghi sandbox | Cần xác nhận môi trường test thực sự được hỗ trợ/cấu hình; không giả định có sandbox hoặc thử chuyển tiền thật |
| WebRTC/SOS | Chưa có session API, Hub contract và credential lifecycle | Chốt state transitions, ai được gọi/nhận, privacy/consent, TURN và quyền trên điện thoại trước test tích hợp |

Các blocker chỉ dừng phần phụ thuộc; vẫn có thể làm các đợt cũ độc lập khi người dùng chọn. Không tự nâng các ví dụ JSON/tên bảng trong báo cáo thành contract đã xác minh.

## 6. Thứ tự đợt mới và điều kiện test

Giữ mã cũ 0–14 để không làm hỏng checklist/api.txt. Dùng U0–U9 cho scope cập nhật. Đề xuất: **U0 -> U1 -> U2 -> U3a -> U3b -> U4 -> U5 -> 11a -> 8c -> U6a -> U6b -> 9 -> 10 -> 11b -> 12 -> 13/U7 -> U8 -> U9**. Sau từng checkpoint phải bàn giao và dừng. 8c có thể làm sớm hơn nếu contract token đã đủ; không cần FCM để nghiệm thu core license/payment qua REST.

### U0 — Kiểm kê contract và dữ liệu test [ĐÃ KHẢO SÁT; CHỜ CHỐT POLICY/TEST]

- Đối chiếu OpenAPI/controller/DTO/validator/handler/authorization/middleware/jobs và deployment đang dùng. Kiểm kê thêm packages, subscriptions, pools, assignments, transactions, keys, WebRTC, ICE, guidance.
- Cập nhật api.txt: method/path, role, query/body/response/error, màn FE, source, trạng thái. Xác định đường đọc trạng thái license và thanh toán; bảng DB không thay API.
- Chốt ma trận 402, kế thừa entitlement, giới hạn gói, trạng thái cũ; migration/seeding/package IDs và backward compatibility do nhóm BE phụ trách.
- Dữ liệu cần: B2C mới/trial/active/expired trong và ngoài grace/NONE; 2 org; staff có/không link; pool rỗng/đầy/hết hạn; key chưa dùng/đã dùng/hết hạn; VIU được phép và ngoài scope.
- Test/bàn giao: bảng contract + mẫu response đã bỏ dữ liệu nhạy cảm + danh sách câu hỏi đã giải quyết. Người dùng xác nhận BE version và tài khoản test trước U1.

### U1 — Entitlement và xử lý 402 [ĐÃ TRIỂN KHAI FE; CHỜ USER TEST]

- Chạm auth.ts/profileSchema, models/domain hoặc DTO riêng, HTTP adapter và Shell/guards theo contract; tránh rải check license ở từng trang.
- Hiển thị trial, ngày hết hạn/grace và CTA phù hợp role; không biến thiếu field thành ACTIVE/NONE giả. Quyền thực thi do BE quyết định; đồng hồ UI chỉ hiển thị.
- 402 không logout hoặc refresh lặp; không auto retry mutation. Billing/auth/logout và luồng safety theo allowlist đã xác minh vẫn truy cập được; không dùng toàn bộ Guard để chặn mọi route.
- Refetch sau đăng ký/thanh toán/kích hoạt key/thu hồi/thay đổi scope; không lưu feature flags trong JWT/UI mãi mà không đồng bộ.
- Test cùng nhau: register -> me/entitlement; login -> entitlement -> request bị 402 -> billing; hết grace khi tab đang mở; đổi account/org; CenterAdmin NONE và staff org; safety exceptions; server unavailable không giả license hợp lệ.
- Đã nối GET /api/licenses/subscription chỉ cho Caregiver cá nhân; GET /api/users/me ánh xạ licenseStatus/licenseExpiresAt. Route /license; banner trạng thái; refetch profile/subscription mỗi 60 giây và nút tải lại. Checkout/key chưa có nên không tạo CTA mua giả. Không thêm license guard chặn route; 402 giữ phiên, không tự replay mutation. Các flow payment/key/revoke sẽ invalidation ở đợt triển khai tương ứng.
- Kiểm tra: 77 unit tests, lint/build đạt; 5 E2E U1 fixture đạt (không thay live BE nghiệm thu). Checklist: docs/API_STAGE_U1_TEST.md. Điểm dừng: người dùng test từng trạng thái, đặc biệt 402 và role exemption.

### U2 — Danh mục gói và quản trị package [ĐÃ TRIỂN KHAI FE; CHỜ USER TEST]

- Màn đề xuất /admin/packages: list/detail/create/update/active nếu có contract; validation giá, currency, thời hạn, included licenses, VIU limit, feature flags theo schema cho phép.
- Caregiver gia đình chọn gói cá nhân, CenterAdmin chọn gói tổ chức; staff không bị đưa sang mua Personal mặc định. Giá/default lấy từ server.
- Không tự thêm DELETE, refund, yearly checkout hoặc “mọi feature flag đều điều khiển UI tự động” nếu BE chưa hỗ trợ. Gói mới không cần code riêng, nhưng feature mới vẫn cần implementation.
- Test: Admin CRUD -> danh sách mua gói cập nhật; non-admin bị cấm; gói inactive/giá đổi giữa lúc xem và checkout; package scope khác role; không expose secrets trong flags.
- Đã nối 4 API packages (GET list/detail, POST, PUT); route /admin/packages và /packages. Dialog thêm/sửa, immutable code/type, validation numeric(12,2)/integer/boolean flags; chỉ Admin ghi. Caregiver cá nhân/CenterAdmin lọc Personal/Business active trong từng trang BE; Staff không vào danh mục mua cá nhân. PUT null priceYearly không xóa giá, đã chặn và giải thích.
- Điểm dừng: người dùng xác nhận gói và số liệu theo docs/API_STAGE_U2_TEST.md trước nối payment. Chưa test live U2; người dùng đã yêu cầu tiếp U3a.

### U3a — Checkout và trạng thái payment B2C [ĐÃ TRIỂN KHAI FE; CHỜ USER TEST]

- Đã dùng /license (không thêm alias subscription), /packages, /caregiver/payments, /payments/return và /payments/cancel. Đã nối 3 API create/history/cancel; BE chưa có detail nên tra history có giới hạn. Xem docs/API_STAGE_U3A_TEST.md cho dependency, test và giới hạn.
- POST /api/payments/create-link với packageId theo contract; khóa double-submit; chỉ mở checkoutUrl hợp lệ theo gateway được cấu hình. Không gửi giá/quyền tự tính làm nguồn tin cậy.
- Return/cancel refetch trạng thái từ BE với polling có giới hạn và nút tải lại; hết chờ hiển thị đang xác minh. ReturnUrl/cancelUrl phải dùng origin Web được BE cho phép, có cơ chế về đúng giao dịch sau login.
- Pending/failed/cancelled/expired/success theo enum thực; query status=PAID không tự unlock. Refetch license sau SUCCESS; xử lý webhook đến chậm. Không lưu token/key trên URL/log ngoài điều kiện contract bắt buộc.
- Test chuỗi: tạo link -> PayOS môi trường test -> BE webhook -> GET transaction -> GET subscription/entitlement -> sử dụng lại tính năng. Test quay lại trước webhook, đóng trình duyệt, F5, hủy, double-click, giao dịch người khác. Webhook duplicate/signature/atomic là test BE phối hợp, Web không gọi webhook để giả success.
- Điểm dừng: nghiệm thu mua/gia hạn Personal, không chuyển tiền thật trong kiểm thử tự động.

### U3b — Checkout Business và kho license [CHƯA LÀM; U3a]

- Tái sử dụng checkout; /center-admin/licenses và /center-admin/payments đề xuất. Đọc pool, used/available/expiry và lịch sử giao dịch theo org.
- Mua lần đầu vs topup/renew do BE quyết định, không dựa một cờ UI tự suy ra transactionType. Không tự cộng quota từ thông báo thanh toán.
- Test: CenterAdmin chưa có pool -> mua -> pool có quota; pool hết hạn -> gia hạn; pool còn hạn -> topup theo rule U0; 2 org không xem giao dịch/pool nhau; staff không có quyền mua nếu contract không cấp.
- Điểm dừng: người dùng thấy pool đúng và transaction đúng trước tạo VIU có consume license.

### U4 — Sửa tạo VIU, assignment và thu hồi [CHƯA LÀM; U1/U3b]

- ApiCreateLinkedUser.tsx/caregiving.ts: giữ giới hạn 3 VIU cho Trial/Personal; không thêm quota theo gói. Giữ UUID khi create thành công nhưng link lỗi, không tạo trùng. Test inherit lúc tạo và first Personal link khi VIU chưa có license; không ghi đè license sẵn có.
- ApiAccounts.tsx/ApiLinks.tsx: staff org không consume; VIU org consume tại BE; refetch pool sau create/revoke. Hết quota 422/402 giữ form, chỉ dẫn mua thêm; không client-side giảm số pool.
- Danh sách assignments + thu hồi có Confirm, mô tả ảnh hưởng quyền. Không unlink/delete account thay revoke. Khả năng gán lại phải có API đã xác minh.
- Test B2C: trial -> VIU -> primary link -> reload; VIU thứ hai/thứ ba được link, thứ tư bị từ chối; link failure recovery và license inheritance. Test B2B: tạo staff -> quota không đổi -> tạo VIU -> used+1 -> phân công -> revoke -> available+1; hai tab cạnh tranh suất cuối, cross-org, hết hạn và lỗi giữa chừng.
- Điểm dừng: người dùng test cả gia đình lẫn trung tâm, không chỉ test form tạo user.

### U5 — Phân phối và kích hoạt key [CHƯA LÀM; U3b/U4]

- /center-admin/license-distribution và /caregiver/activate-license đề xuất. Dùng POST distribute/activate-key theo contract cùng API list/detail/status nếu có. Nếu không có API quản lý danh sách thì ghi giới hạn, không hứa dashboard đầy đủ.
- Hiển thị key có chủ đích, mask mặc định nếu phù hợp; không log, analytics hoặc lưu key trong query string. Không tự gửi cho người khác.
- Kích hoạt thành công refetch subscription/entitlement; không tự đổi organizationId hoặc tạo caregiver link. Cần biết key dùng trial đang có, gia hạn và giới hạn VIU xử lý thế nào.
- Test cả chuỗi: trung tâm có pool -> distribute -> gia đình kích hoạt -> đọc license -> tạo VIU -> link. Key đã dùng/sai/hết hạn, double-submit, hai gia đình tranh một key, pool thiếu, revoke và quyền ngoài org.
- Điểm dừng: người dùng test bằng 2 tài khoản; đối chiếu pool với số key được cấp/kích hoạt theo rule U0.

### 11a — Contacts và nghiệm thu Standalone [CHƯA NỐI; đưa lên sớm sau U4]

- Giữ contract cũ GET/POST /users/{userId}/emergency-contacts và detail/PUT/DELETE/PATCH status; đối chiếu lại BE mới. Số khẩn cấp/hotline flexible theo khu vực, không tự gọi khi lưu hoặc xem.
- Luồng liên hoàn: CenterAdmin tạo VIU có license -> phân công Staff -> Staff cấu hình contacts -> Mobile phát event test -> Staff nhận/xử lý. Cùng org nhưng không có link không tự được xem/sửa.
- Test CRUD/priority/type/phone, gỡ link mất quyền, ngoài org; số ngắn 112/115 cần validator BE hỗ trợ, không ép regex số di động cho mọi contact.
- Điểm dừng: phối hợp Mobile/BE; không tạo sự kiện SOS thật để test.

### 8c — FCM web push [CHƯA LÀM; config và API upsert đã có]

- Đã xác minh PUT /api/auth/fcm-token upsert theo user/device; không cần đăng nhập lại chỉ để cập nhật token. Đối chiếu logout và xử lý tắt push/nhiều tab; chưa có revoke riêng trong Swagger. Không gửi token rỗng để giả deactivate.
- Permission sau click rõ ràng, denied/unsupported vẫn dùng Web; service worker, foreground/background, click qua guards; tránh trùng với SignalR.
- Test token/device lifecycle, logout/đổi account/nhiều tab, permission revoked, offline/reconnect. License/payment reminder cần BE jobs và payload thật; API preferences không chứng minh notification đến thiết bị.
- Điểm dừng: người dùng test HTTPS trên domain và thiết bị được phép.

### U6a — Cuộc gọi chủ động và lịch sử [CHƯA LÀM; U0/U1/U4 + Mobile/TURN]

Đã có REST session + ICE và RelayOffer/RelayAnswer/RelayIceCandidate ở /hubs/location; xem U0_BACKEND_FINDINGS.md. Chưa kiểm thử Mobile/media/TURN, không còn giả định chưa có signaling code.

- Nút gọi người đang được liên kết; UI cuộc gọi/modal hoặc panel riêng đủ video/audio/status, accept/reject/end theo contract. Không chỉ tạo một POST “call” rồi báo kết nối.
- Dùng RTCPeerConnection/getUserMedia và SignalR đã có nếu đáp ứng contract; không thêm peer library khi native đủ. Hub signaling không thay media transport.
- Xác minh REST session/ICE/log, Hub offer/answer/candidate/hangup, call IDs, thứ tự event, reconnect, timeout/busy, duration limit; không đoán tên method từ location Hub.
- BE kiểm tra quyền người tham gia và cấp ICE credentials phù hợp; không đưa TURN admin secret/static master credential vào VITE_* hoặc repo. Cleanup track/peer/handler khi kết thúc/logout/đổi tài khoản.
- Test: Caregiver gọi -> Mobile nhận -> video VIU/audio 2 chiều -> kết thúc -> history; reject/missed/busy, mic denied/no device, autoplay restrictions, mất mạng/reconnect, hết thời gian; hai mạng khác nhau để bắt buộc TURN; revoked link/other org bị chặn.
- Điểm dừng: Web + Mobile + TURN thực sự hoạt động, không coi fixture signaling là media E2E.

### U6b — Cuộc gọi VIU voice và SOS [CHƯA LÀM; U6a/7/8a]

- Nhận trigger VIU_VOICE_COMMAND/SOS_AUTO theo contract; gắn emergencyEventId khi hợp lệ, dedup và không tạo nhiều cuộc gọi vì cả FCM/SignalR tới.
- Phối hợp Mobile về consent/mic/camera/background/locked screen; xử lý không kết nối được bằng trạng thái rõ ràng, vẫn giữ luồng cảnh báo và contacts. Không tự nhận thay người dùng khi chưa có quyền/chính sách đã chốt.
- Test 3 trigger, duplicate/out-of-order, nhiều staff nhận cùng event, quyền bị gỡ giữa cuộc gọi, FCM click khi logout; SOS không bị gián đoạn vì checkout/license expired hoặc lỗi WebRTC.
- Điểm dừng: nghiệm thu riêng từng trigger; privacy nội dung/version vẫn cần người dùng cung cấp, không tự tạo đồng ý pháp lý.

### 9, 10, 11b, 12 — Hoàn thiện tính năng đã có UI mock [CHƯA NỐI]

| Đợt | Màn và API phải nối cùng nhau | Phụ thuộc và test trước bàn giao |
|---|---|---|
| 9 | /caregiver/locations: saved-locations CRUD + geofences CRUD | Quyền link + entitlement + GPS/map; create/read/update/reload/delete, tọa độ/radius; cảnh báo vào/ra cần Mobile + boundary worker + 7/8 |
| 10 | /caregiver/registry: persons CRUD + upload/delete/primary photos | Consent ảnh, MinIO/AI, endpoint preview có authorization; create -> upload -> GET trạng thái -> primary/delete; không render file .enc trực tiếp, thiếu contract media là blocker |
| 11b | /caregiver/tts: GET/PUT preferences theo userId | VIU scope; map volume BE 0–1 nếu vẫn đúng; save -> reload -> Mobile đọc lại; không dùng me để sửa VIU được chọn |
| 12a | /caregiver/activity: GET navigation/OCR/QR/recognition/voice list/detail/events | Dữ liệu Mobile và quyền; pagination/timezone/retention, không gửi các POST Mobile từ Web |
| 12b | /center-admin/reports: organization activity-summary/members | Dữ liệu org + quyền; không gán số tổng bằng đếm trang đầu, không đưa face gallery Caregiver sang CenterAdmin |

Mỗi dòng là một checkpoint riêng, không triển khai chung rồi mới cho test. Giữ checklist cũ trong docs và bổ sung trạng thái license trong test regression.

### 13/U7 — Quản trị và theo dõi Hybrid/WebRTC [CHƯA NỐI]

- 13a: system-configs list/detail/update/history/rollback. Bổ sung config license/trial/grace/PayOS/WebRTC/Hybrid khi API cung cấp; validation theo type/range, quyền Admin, confirm rollback. Không đưa PayOS checksum/API secret lên Web.
- 13b: ai-metrics, audit-logs, notifications status/failed theo quyền; không gọi success rate là accuracy khi không có ground truth.
- U7a: quản trị ICE servers theo API được xác minh; credential write/rotate được kiểm soát và không trả secret hiện hữu toàn bộ vào UI. Test STUN/TURN priority/active, invalid URL, rotate, non-admin cấm; không cài Coturn từ FE.
- U7b: Hybrid guidance log/metrics và cấu hình engine nếu có GET API. Hiển thị decision, engine, latency, fallback, thời gian theo contract; không expose scene/GPS của VIU cho role chưa được cấp. JEV/Groq prices/latency trong báo cáo chỉ là giả định nguồn, không hứa SLA hoặc hardcode giá hiện hành.
- Test: BE rule-based fallback, engine unavailable/config rollback qua môi trường test; Mobile NEAR vẫn cảnh báo độc lập. Web không tạo hướng dẫn tránh vật hoặc mô phỏng safety như hệ thống thật.
- Điểm dừng: từng 13a/13b/U7a/U7b có checklist riêng; không cần chờ toàn bộ mới test.

### U8 — Landing, nội dung sản phẩm và dashboard [CHƯA LÀM]

- Cập nhật landing mô tả Hybrid AI, gói Personal/Business, hỗ trợ gọi, Standalone theo chức năng đã nghiệm thu. Gói/giá lấy API public nếu có, nếu chưa có contract thì không tạo checkout công khai giả.
- Ghi chest strap bắt buộc theo báo cáo, camera có điểm mù/hạn chế ánh sáng/mưa và cần dùng cùng gậy trắng/IoT; không quảng bá thay thế hoàn toàn dụng cụ hỗ trợ.
- Đợt 14 cũ: dashboard theo role tổng hợp dữ liệu thật, trial/grace/quota, alert open và payment pending từ nguồn authoritative. Không bịa /api/dashboard hoặc số liệu từ trang đầu. Staff không thấy billing cá nhân không liên quan.
- Test desktop/tablet, keyboard/focus/contrast, form/modal/dialog pending, empty/error; thông tin marketing khớp feature flags và trạng thái triển khai.

### U9 — Nghiệm thu liên thông và phát hành [CHƯA LÀM; thay phần đóng đợt 14]

- Chạy đủ B2C trial -> mua/gia hạn -> hết grace; B2B mua pool -> staff/VIU -> phân công -> topup/revoke; B2B Extended distribute -> activate; Standalone contacts -> cảnh báo -> cuộc gọi.
- Test data isolation user/org/VIU, refresh/logout/nhiều tab, payment webhook chậm/trùng, license cache stale, safety ngoại lệ, FCM trùng SignalR, Mobile offline NEAR và WebRTC TURN.
- Regression 44 API cũ với BE mới; build/lint/unit/E2E fixture tách bằng chứng khỏi test server thật. Cập nhật tổng API mới sau kiểm kê, không đặt mục tiêu sai “107/107 trên Web” vì có API Mobile/webhook.
- Kiểm tra HTTPS/CORS, Vercel SPA fallback/reset/payment return routes, env theo môi trường, backend redirect allowlist và cache. Push dev sau kiểm tra; người dùng đưa main/deploy và xác nhận production.

## 7. Bàn giao sau mỗi đợt

Ghi trong bảng dưới: commit FE + BE/OpenAPI version đã dùng; route/API đã mở; fixture nào đạt; dữ liệu/account role cần để test; chuỗi API phải test cùng nhau; lỗi/contract thiếu; trạng thái test thật; bước tiếp theo. Không ghi tài khoản/password/token/key thật vào tài liệu.

| Checkpoint | Code | Contract | Fixture | Người dùng test thật | Việc tiếp |
|---|---|---|---|---|---|
| U0 | Đã khảo sát source/OpenAPI, chưa runtime | Đã có 140 endpoints; báo cáo U0 ghi chênh lệch | Chỉ kiểm tra tài liệu | Chưa test authenticated | Ba quyết định đã chốt; chờ source/deploy fixes và regression; đã được phép tạo/sửa dữ liệu test |
| U1 | Đã triển khai FE | Đọc profile/subscription, xử lý 402 | 77 unit + 5 U1 E2E fixture, lint/build đạt | Chưa test live | Dừng theo docs/API_STAGE_U1_TEST.md |
| U2 | Đã triển khai FE | 4 API packages theo source BE | Xem docs/API_STAGE_U2_TEST.md | Chưa test live | Dừng cho user test |
| U3a | Đã triển khai FE | 3 API payment Personal | Xem docs/API_STAGE_U3A_TEST.md | Chưa test live PayOS | Dừng cho user test; môi trường PayOS chưa xác nhận |
| U3b–U5 | Chưa làm | Contract đã kiểm kê U0 | Chưa chạy | Chưa test | Theo thứ tự mục 6 |
| 8c | Chuẩn bị config, chưa runtime | Có upsert mới; revoke/logout/nhiều tab cần test | Chưa chạy push | Chưa test | Dùng PUT auth/fcm-token, kiểm tra lifecycle |
| U6a/U6b | Chưa làm | Chờ WebRTC + Mobile + TURN | Chưa chạy | Chưa test | Sau U4 và hợp đồng signaling |
| 9–13, U7–U9 | Chưa nối theo phạm vi trên | API cũ cần đối chiếu lại; API mới chờ U0 | Chưa chạy phạm vi mới | Chưa test | Thực hiện từng checkpoint |

Riêng consent chính sách vẫn CHỜ theo yêu cầu trước đó. Không tự đặt version, tự tick đồng ý hoặc giả định tài liệu nghiệp vụ là nội dung chính sách đã được chấp thuận.

## Xác nhận nghiệp vụ và fixes từ nhóm BE — 2026-10-03

- Trial/Personal: ≤3 VIU (MaxViusPerCaregiver=3). Không triển khai enforcement theo package.maxViuPerLicense cho B2C. Business vẫn theo pool.
- Nhóm BE xác nhận /api/licenses pass-through khi None/Expired ngoài grace; Caregiver có organization_id hợp lệ bypass license cá nhân. Đây không phải bypass authorization/link/org.
- Tạo VIU kế thừa license đã có; bổ sung first Personal link kế thừa nếu VIU chưa có license. Không tự áp dụng cho mọi link/ghi đè license khác.
- Bản local đọc trong lượt này chưa có các đoạn fixes; trạng thái là BE xác nhận, chưa source/runtime verified. U1 có thể bắt đầu; test các đường đã sửa sau khi source/deploy cập nhật.
- Người dùng đã cho phép tạo/sửa dữ liệu bằng tài khoản test. Không hỏi lại quyền này; không lưu credentials vào repo. PayOS/media test vẫn theo phạm vi từng checkpoint.

Tài liệu Word: docs/VisionAid_Update_Report_Revised.docx là bản sửa nội dung từ file người dùng gửi, giữ nguyên bản gốc ở Downloads. Đã thay 4 đoạn (Trial/Personal và mô tả giới hạn) sang ≤3 VIU/MaxViusPerCaregiver. Kiểm tra XML đạt; chưa kiểm tra bố cục qua render vì môi trường không có LibreOffice/soffice. VisionAid.docx ở thư mục SEP409 đã được rà, không có mô tả Personal/Trial 1 VIU cần thay. BE CLAUDE.md §21 đã sửa đúng 2 dòng Plans tại local, chưa commit/push repository BE.
