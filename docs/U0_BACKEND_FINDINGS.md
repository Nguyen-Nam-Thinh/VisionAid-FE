# U0 Đối chiếu BE mới và Swagger đã deploy

Ngày 2026-10-03. BE local commit e56c545 (merge WebRTC); FE base 5692a87. Đã đọc source và GET OpenAPI công khai https://api.visionaid.net/swagger/v1/swagger.json. Chưa đăng nhập, chưa tạo/sửa dữ liệu, chưa tạo payment/link/call hoặc test Mobile. Không lưu mật khẩu người dùng vào tài liệu.

## Cập nhật sau xác nhận của người dùng 2026-10-03

Các nhận xét source bên dưới là lịch sử tại e56c545, không phải các lỗi vẫn đang chờ quyết định. Nhóm BE xác nhận đã sửa pass-through /api/licenses và exemption Staff Caregiver có organization_id hợp lệ, bổ sung inherit ở first Personal link khi VIU chưa có license. B2C Trial/Personal tối đa 3 VIU, không enforce quota theo gói; nhận định “cần enforce 1 VIU” được rút lại. Local hiện chưa có các fixes nên chưa xác minh source/runtime. Người dùng đã cho phép tạo/sửa dữ liệu test.

## Kết quả kiểm kê

Swagger hiện có **140 operations: giữ 107 cũ, thêm 33, không mất method/path cũ**. Response/behavior của API cũ vẫn cần regression. Danh mục và schema request công khai ở [U0_OPENAPI_2026-10-03.md](U0_OPENAPI_2026-10-03.md). 44 callers FE hiện tại không tăng vì nhiệm vụ này chỉ khảo sát.

Source local đã có License, Payment, WebRTC, entity/config cho Hybrid. Chưa thấy API hoặc implementation decision engine/guidance phục vụ phần Web U7b trong phạm vi rà soát; không coi entity/enum là pipeline đã hoạt động. Không thể suy ra commit đang deploy chỉ từ Swagger.

## Những câu hỏi cũ đã trả lời được bằng source

| Nội dung | Contract/hành vi đã đọc | Nguồn BE tương đối từ src/ |
|---|---|---|
| License trong hồ sơ | UserResponse, login/register/refresh có licenseStatus và licenseExpiresAt; cần map nullable vào FE | Modules/VisionAid.Modules.Users/Application/DTOs/UserResponse.cs; Modules/VisionAid.Modules.Auth/Application/DTOs/AuthTokenResponse.cs |
| Trial | RegisterCaregiver gọi ActivateTrial; lấy PERSONAL active, trialDays của package hoặc fallback; trả token; trial không có key | Modules/VisionAid.Modules.Auth/Application/Commands/RegisterCaregiver/RegisterCaregiverHandler.cs; Modules/VisionAid.Modules.License/Application/Commands/ActivateTrial/ActivateTrialHandler.cs |
| VIU B2C | Tạo VIU bằng Caregiver kế thừa license cache của caregiver, không yêu cầu chờ payment nếu trial hợp lệ | Modules/VisionAid.Modules.Users/Application/Commands/CreateUser/CreateUserHandler.cs |
| Key và pool | POST distribute nhận poolId/note, trừ một suất ngay khi phát; subscription Suspended, subscriber null; key/subscription hết hạn cùng pool | Modules/VisionAid.Modules.License/Application/Commands/DistributeLicenseCode/DistributeLicenseCodeHandler.cs |
| Activate key | POST activate-key nhận licenseKey, chỉ Caregiver; đổi subscriber/status/cache, không đổi org; thời hạn giữ theo pool | Modules/VisionAid.Modules.License/Application/Commands/ActivateLicenseKey/ActivateLicenseKeyHandler.cs |
| Thu hồi | **POST /api/licenses/assignments/{viuUserId}/revoke**, không phải DELETE với assignmentId như TXT | Modules/VisionAid.Modules.License/Presentation/LicensePoolController.cs |
| Gán lại license | POST /api/licenses/assignments/{viuUserId}/assign, body poolId; đọc pool/assignments có API | Modules/VisionAid.Modules.License/Presentation/LicensePoolController.cs |
| Payment | POST create-link nhận packageId, returnUrl?, cancelUrl?; trả transactionId/checkoutUrl/paymentLinkId/orderCode/amount/currency | Modules/VisionAid.Modules.Payment/Presentation/PaymentController.cs; Application/DTOs/PaymentLinkResponse.cs trong cùng module |
| Payment read/cancel | GET /api/payments/history phân trang; DELETE /api/payments/{id}/cancel. Chưa có GET transaction detail/status theo ID trong Swagger | Modules/VisionAid.Modules.Payment/Presentation/PaymentController.cs |
| Return routes mặc định | Handler fallback /payment/success và /payment/cancel (số ít); config deployment có thể override. FE phải thống nhất với BE hoặc gửi URLs được chấp nhận | Modules/VisionAid.Modules.Payment/Application/Commands/CreatePaymentLink/CreatePaymentLinkHandler.cs |
| Kỳ gia hạn/topup | Handler webhook dùng now + package.DurationDays; không thấy cộng từ max(now, expiry). Checkout lấy PriceMonthly; chưa có lựa chọn yearly trong request | Modules/VisionAid.Modules.Payment/Application/Commands/HandlePayOsWebhook/HandlePayOsWebhookHandler.cs |
| FCM | **PUT /api/auth/fcm-token**: fcmToken, clientDeviceId, deviceType?, deviceModel?, appVersion?; upsert theo user/device và active=true | Modules/VisionAid.Modules.Auth/Presentation/AuthController.cs; Application/Commands/UpdateFcmToken/UpdateFcmTokenHandler.cs |
| WebRTC REST | POST session; POST accept/reject/end; GET history. Initiate dành Caregiver/VIU; CenterAdmin/Admin không được gọi chỉ vì ICE role trả viewer | Modules/VisionAid.Modules.WebRTC/Presentation/WebRtcSessionsController.cs; Application/Commands/InitiateCall/InitiateCallHandler.cs |
| Signaling | /hubs/location: RelayOffer(sessionId,sdp), RelayAnswer(sessionId,sdp), RelayIceCandidate(sessionId,candidateJson); events WebRtcOffer/WebRtcAnswer/WebRtcIceCandidate | Modules/VisionAid.Modules.Location/Presentation/LocationHub.cs |
| ICE | GET /api/webrtc/ice-servers/public cần auth, bypass license; role + iceServers. Admin CRUD qua route ICE riêng, cần handler permission checks | Modules/VisionAid.Modules.WebRTC/Presentation/WebRtcController.cs |

Các kết luận trên là static contract review; chưa chứng minh database, Redis, PayOS, TURN hoặc notification delivery của server thật đang hoạt động.

## Policy license đang được code thực thi

Nguồn: Shared/VisionAid.Shared/Middleware/LicenseValidationMiddleware.cs; API/VisionAid.API/Program.cs dùng middleware sau authorization.

- Admin và CenterAdmin bypass license. Caregiver thuộc org **không** có exemption riêng trong middleware.
- Auth, users/me prefix, hubs, Swagger/health, public ICE và PayOS webhook được skip; toàn bộ payments được phép cả None/Expired.
- Active/Trial pass. Expired trong grace 3 ngày pass, trả X-License-Warning. Grace là BusinessRules constant ở code đang đọc, chưa thấy middleware đọc system-config động.
- Expired quá grace: navigation, emergency-events và payments pass; API khác 402, bao gồm GET. Không phải dashboard read-only đầy đủ.
- None/null: emergency-events/payments + các skip pass; navigation bị 402. LicenseStatusReader lấy cache của chính user, không suy ra license của org khi đọc.
- Chưa thấy /api/licenses được allowlist: **packages/subscription/activate-key bị 402 đối với Caregiver None hoặc quá grace**. Dù payments vẫn mở, người dùng có thể không đọc được gói để mua và không kích hoạt được key.
- Middleware lỗi đọc Redis/DB log rồi pass; FE không được coi request thành công là bằng chứng entitlement Active.

## Những điểm nhóm BE cần xác nhận hoặc sửa trước checkpoint phụ thuộc

1. **Billing và activate-key khi hết hạn (U1/U3/U5):** allowlist đúng endpoint đọc gói/subscription/kích hoạt nếu đó là luồng khôi phục quyền dự kiến. FE không nên gọi ẩn danh hoặc hardcode packageId để lách middleware. Cần thống nhất read-only hay 402 cho dashboard; source hiện là 402.
2. **ĐÃ CHỐT — không phải lỗi quota (U4):** Mô tả 1 VIU trong tài liệu sai; Trial/Personal tối đa 3 VIU. Nhận xét khảo sát ban đầu: CreateUserHandler chưa kiểm quota gói; CreateCaregiverLinkHandler dùng BusinessRules.MaxViusPerCaregiver=3. MaxViuPerLicense có trong package CRUD nhưng chưa thấy enforcement ở create/link. Cần BE xác định primary/secondary nào consume quota và expose usage; FE không tự thay mọi giới hạn 3 thành 1.
3. **Staff Caregiver và org chưa có pool (U1/U4):** tạo staff không set license; null được reader coi None, middleware có thể chặn staff. ViuLicenseService trả về không gán khi không tìm thấy active pool nên có thể tạo VIU chưa có license thay vì từ chối. Cần chốt hành vi này; chỉ pool full khi đã có active pool mới đi vào handler gán.
4. **Gia hạn trước hạn (U3):** now + DurationDays có thể làm mất ngày còn lại nếu mua sớm; topup cũng đặt expiry theo now. Đề nghị BE xác nhận có chủ ý hay đổi công thức. Không hứa “cộng thêm tháng còn lại” trên Web hiện tại.
5. **Payment status và key management (U3/U5):** chưa có GET payment theo ID/filter ID, chỉ history page/pageSize; chưa thấy API list distributed keys theo org. Web có thể đọc lịch sử nhưng không suy ra một payment mất khỏi trang đầu là failed/success. Chốt bổ sung contract hoặc giới hạn chức năng rõ ràng trước triển khai màn tương ứng.
6. **Quyền mua và URLs (U3):** CreatePaymentLinkHandler xét role Caregiver mà chưa loại staff có org; validator returnUrl/cancelUrl mới kiểm length, chưa thấy origin/scheme allowlist. Cần nhóm BE kiểm soát theo policy triển khai; FE chỉ dùng URLs nội bộ được cấu hình.
7. **FCM lifecycle (8c):** blocker thiếu upsert đã gỡ; handler upsert luôn active=true, chưa có deactivate riêng trong API mới. Cần test logout/device/multiple tabs và tắt push; không gửi token rỗng để giả revoke. Explicit deviceType Web vì handler mặc định Android khi null.
8. **WebRTC và privacy (U6):** xác nhận Mobile đã thực hiện offer/answer/candidate, incoming call, permissions và SOS_AUTO. GET public ICE trả credential từ DB; chưa chứng minh credential ngắn hạn/encrypted-at-rest hoặc TURN đang hoạt động. Không đưa credential này vào docs/log/.env public. REST accept/state chưa chứng minh media đã kết nối.

Phạm vi này là các điểm ảnh hưởng plan, chưa phải audit toàn bộ backend. Không sửa BE trong nhiệm vụ khảo sát FE. Cần test thật có kiểm soát để xác nhận lỗi runtime; không khẳng định những phát hiện source đã được tái hiện trên production.

## Việc còn cần người dùng cung cấp

- ĐÃ ĐƯỢC PHÉP tạo/sửa dữ liệu bằng tài khoản test; tới test cách ly cần thêm một tổ chức + Staff/VIU khác org. Chưa lưu hoặc sử dụng credentials trong khảo sát này.
- Trước U3: PayOS đã cấu hình tạo-link/webhook chưa, cách test không chuyển tiền thật hoặc giao dịch test được phê duyệt; chỉ cần tình trạng, không gửi secret keys.
- Trước U6: Mobile đã có WebRTC chưa, có thiết bị thử và TURN endpoint được cấu hình chưa; không cần gửi TURN secret qua chat.
- Chính sách read-only/NONE/quota/gia hạn ở trên cần người dùng hoặc nhóm BE quyết định. Có thể bắt đầu phần U1 đọc profile license + xử lý 402, nhưng chưa nghiệm thu flow billing/activation/quota hoàn chỉnh trước khi chốt các điểm liên quan.

## Bàn giao

U0: đã kiểm kê 140 routes và khảo sát contract trọng yếu; **chưa hoàn tất** vì còn policy/dữ liệu test và đối chiếu response thật. U1 chưa bắt đầu. 8c có thể ưu tiên sau khi xác minh logout/revoke; không còn yêu cầu đăng nhập lại chỉ để đăng ký FCM token.
