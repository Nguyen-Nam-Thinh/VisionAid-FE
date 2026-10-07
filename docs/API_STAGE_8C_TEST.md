# Đợt 8c — FCM Web Push

2026-10-08. FE đã triển khai; chưa xác nhận giao nhận FCM thật. Nhánh `feat/fcm-web-push-8c`; chỉ merge/push dev, main do người dùng phát hành.

## Đã nối và cách dùng

- Vào **Hồ sơ → Thông báo trên trình duyệt → Bật thông báo trình duyệt**. Chỉ xin permission sau click. Denied/unsupported không ngăn dùng Dashboard.
- PUT `/api/auth/fcm-token`, body `fcmToken`, `clientDeviceId` giống phiên login/logout, `deviceType: Web`, `deviceModel: VisionAid Web`, `appVersion: 0.1.0`. Call tại `src/services/api/push.ts`; không gửi token rỗng, không tự retry ghi khi 401.
- Firebase public config và VAPID đã nhận từ người dùng nằm tại `src/configs/firebase.ts`; có thể override API key/VAPID qua biến Vite tương ứng trong `.env.example`. Không dùng Analytics, Firebase Auth, Firestore hay service-account. Chỉ hai module SDK App/Messaging được lazy-load.
- Service worker `/firebase-messaging-sw.js`, scope mặc định của Firebase `/firebase-cloud-messaging-push-scope`. Dùng Native Push API xử lý delivery, không để Firebase SW tự hiển thị tiêu đề/nội dung chứa dữ liệu riêng tư. File phải trả JavaScript, không phải SPA HTML.
- Foreground: refetch REST cho tài khoản, không thêm toast trùng SignalR. Background: một lời nhắc chung, không tên/GPS/payload; tag cố định gộp lời nhắc. Click mở `/dashboard` qua auth/role guards, không dùng URL trong payload. Đây không phải inbox lịch sử notification.
- Đồng bộ token khi reload/focus/online nếu phiên này đang sở hữu push. Không tự xin lại quyền hoặc giành quyền của tab khác. PUT thành công chỉ chứng minh đăng ký BE, chưa chứng minh đã nhận push.

## Lifecycle và giới hạn đã chọn

Một browser profile/origin chỉ nhận push cho một phiên. Bật ở tab khác thay owner và hủy subscription cũ trước đăng ký mới. Web Locks tuần tự hóa thay đổi giữa các tab. Logout, đổi tài khoản, clear session do refresh lỗi, đổi/reset mật khẩu đều yêu cầu cleanup. Logout ở bất kỳ tab nào tắt push của browser đó; tab còn đăng nhập phải chủ động bật lại. Không đồng nghĩa đăng xuất các tab khác.

Nút tắt xóa cờ delivery, đóng lời nhắc và hủy native subscription; gọi Firebase deleteToken best effort. Nếu Firebase offline, native unsubscribe vẫn là cơ chế dừng local. BE chưa có API revoke riêng nên bản ghi token trên BE có thể còn active nhưng token cũ không còn dùng được. Logout BE có deactivate theo user/device; logout-all theo user. Nếu cleanup local thất bại, chặn Notification trong cài đặt site. Đóng mọi tab không phải logout: push nền vẫn có thể hiển thị lời nhắc chung. Permission bị thu hồi được nhận biết ở lần focus/online tiếp theo. Chính sách remote logout-all ở thiết bị khác cần BE ngừng gửi; browser không thể biết ngay khi offline.

## Điểm cần nhóm BE xác minh trước test end-to-end

Source local `Infrastructure/BackgroundJobs/NotificationSender.cs` SELECT **device_token** trong `fcm_device_tokens`, nhưng `Modules.Auth/Infrastructure/Persistence/FcmDeviceTokenConfiguration.cs` map **fcm_token**. Nếu schema deploy theo EF mapping, job sẽ lỗi trước gửi. Nhóm BE cần đối chiếu DB/migration và sửa query nếu cần; FE chưa sửa BE. Ngoài ra cần Firebase Admin/service account đúng project, FCM Registration API bật, notification rule/preference và worker hoạt động. Không gọi SOS thật để kiểm tra push.

## Checklist test thật

1. Deploy dev lên môi trường HTTPS bạn chọn. Kiểm tra URL service worker trả 200 JavaScript. Vào Hồ sơ: chưa click thì không có permission prompt và không PUT token.
2. Cho phép notification rồi bật. Network: PUT 200 với clientDeviceId giống login; không chép token vào báo cáo công khai. Reload/focus: đồng bộ cùng device, không tạo subscription lặp. Kiểm tra BE chỉ một record user/device.
3. Dùng Firebase Console gửi **test message không chứa dữ liệu cá nhân** tới token vừa đăng ký lấy từ Network trên máy của bạn. Foreground không bật toast hệ điều hành; dữ liệu REST được refetch. Chuyển tất cả tab VisionAid ra nền: có lời nhắc chung; click về Dashboard. SDK đã được stub trong E2E, nên bước này bắt buộc để xác minh FCM thật.
4. Test từ chối quyền, unsupported, offline lúc bật, API 401/402/403/500: không báo đăng ký thành công, không mất phiên vì 402, Dashboard vẫn dùng được theo quyền. Bật lại sau khi cấp quyền trong browser settings.
5. Tắt push rồi gửi test vào token cũ: không nhận. Đăng xuất khi mạng lỗi: không còn cờ delivery và subscription local; BE revoke có thể chưa xác nhận. Đăng nhập tài khoản khác và bật: token/owner mới, không thấy dữ liệu tài khoản cũ.
6. Hai tab cùng browser: bật tab A, rồi bật tab B; chỉ owner sau cùng active. Logout A phải tắt push browser, B không tự bật lại. Kiểm tra đăng nhập lại/duplicate tab/refresh đồng thời. Hai browser profile riêng không ảnh hưởng nhau.
7. Thu hồi permission tại site settings rồi focus trang; trạng thái tắt. Gửi cùng sự kiện qua SignalR và FCM: foreground chỉ REST refresh, không hai toast; background gộp thông báo chung. Click notification khi phiên hết hạn đi qua đăng nhập.
8. Sau khi nhóm BE xác minh query token, dùng event test trong môi trường cô lập để chạy worker → FCM → browser. Payment/license reminder chỉ test khi BE job/payload tương ứng sẵn sàng; không chuyển tiền thật hoặc phát emergency thật.

## Kiểm chứng kỹ thuật

- 93 unit tests đạt, gồm permission, token failure, logout giữa getToken, đổi owner, native unsubscribe offline và SW generic/click/foreground.
- 6 E2E fixture đạt: opt-in/PUT đúng device/reload/tắt/logout, auth ba role và GPS hai role. Firebase SDK được stub; service worker được đăng ký thật tại localhost trong test.
- Lint/build đạt; cảnh báo bundle lớn có sẵn. npm audit còn cảnh báo source-map-js của toolchain cũ, không nằm trong hai module Firebase mới; chưa mở rộng đợt này sang nâng toolchain.
- API Web hiện 65/140 operations. Chưa xác nhận gửi/nhận live và lifecycle nhiều tab bằng FCM thật.

Tham khảo SDK: [Firebase Messaging API](https://firebase.google.com/docs/reference/js/messaging), [Firebase Web setup](https://firebase.google.com/docs/cloud-messaging/web/get-started). Contract BE dựa source local, không suy từ tài liệu SDK.

Tiếp theo: **U6a — WebRTC**, phải đối chiếu signaling/session/TURN/Mobile trước triển khai. Dừng ở đây để người dùng test 8c.
