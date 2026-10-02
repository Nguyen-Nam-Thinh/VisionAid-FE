# Đợt 8c — Chuẩn bị Firebase Web Push

Ngày kiểm tra: 2026-10-02. Trạng thái: CHƯA TRIỂN KHAI PUSH, chờ Firebase Web config/VAPID và chốt vòng đời token với BE. Không coi file này là kết quả tích hợp. REST đã nối vẫn 44/107.

## Người dùng lấy cấu hình

1. Mở Firebase Console, chọn đúng project mà BE dùng để gửi FCM.
2. Project settings → General → Your apps. Chọn ứng dụng Web, hoặc đăng ký ứng dụng Web bằng biểu tượng </>. Có thể dùng Vercel hiện tại, không cần chuyển hosting.
3. Trong SDK setup and configuration, chọn Config; sao chép firebaseConfig gồm apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId (field không có trong cấu hình thực tế thì không tự điền).
4. Project settings → Cloud Messaging → Web configuration → Web Push certificates. Lấy public key hiện có; nếu chưa có thì Generate Key Pair. Không thay key đang dùng chỉ để thêm Web.
5. Gửi firebaseConfig và VAPID public key để nối FE. Không gửi Firebase Admin service-account/private key.
6. Sau khi FE có code đọc cấu hình, sẽ hướng dẫn các biến môi trường tương ứng cho local/Vercel. Hiện chưa thêm biến giả không có consumer. Production vẫn main, chỉ phát hành khi người dùng đưa dev sang main.

Nguồn: [Firebase Web setup](https://firebase.google.com/docs/web/setup), [FCM Web client](https://firebase.google.com/docs/cloud-messaging/web/get-started).

## Contract BE đã đọc trực tiếp

- AuthController: POST login/register nhận device.clientDeviceId, device.fcmToken, device.deviceType = Web.
- LoginHandler: upsert token theo userId + clientDeviceId khi gửi fcmToken không rỗng. Login không gửi token KHÔNG hủy token cũ.
- Refresh chỉ nhận refreshToken + clientDeviceId; không cập nhật FCM token.
- LogoutHandler: deactivate token theo userId + clientDeviceId; logout-all deactivate tất cả của user.
- Chưa thấy endpoint authenticated riêng để upsert/revoke token. Không tự bịa URL.
- FE hiện giữ clientDeviceId/session theo tab; FCM/service worker dùng chung origin. Cần giải quyết trước khi cho nhiều tab/tài khoản đăng ký cùng subscription.
- FcmService gửi cả Notification title/body và Data. Cần kiểm tra background auto-display của SDK, không tự showNotification thêm gây trùng; không dựa hoàn toàn vào guard trong page để chặn nội dung ngoài phiên.

## Chốt trước khi triển khai

Có hai hướng; chưa có lựa chọn từ người dùng:
- BE bổ sung contract authenticated để đăng ký/cập nhật/thu hồi token thiết bị đang dùng; cần method/path/body thật và quy tắc cùng token chuyển tài khoản.
- Giữ contract hiện tại: người dùng chọn nhận push trước đăng nhập, token gửi kèm login/register. Bật push sau đăng nhập hoặc token đổi cần đăng nhập lại. Phải hiển thị giới hạn này; không lưu password hoặc tự login lại.

Cả hai cần xử lý quyền bị từ chối, token đổi, logout thất bại/mất mạng, chuyển tài khoản, nhiều tab và notification đến muộn. Chưa được coi login có field fcmToken là toàn bộ vòng đời đã giải quyết.

## Checklist implementation sau khi đủ điều kiện

- Dùng SDK Firebase tương thích token contract BE; đối chiếu phiên bản trước cài. Tài liệu hiện có hướng FID/register mới, trong khi BE hiện gửi tới registration token; không đổi kiểu token phía FE một mình.
- Xin permission sau thao tác rõ ràng; denied/unsupported/missing config không chặn đăng nhập.
- Đăng ký service worker, foreground listener, chỉ báo đã bật khi BE lưu token thành công.
- Click push chỉ đi route nội bộ, qua auth và resource guard; không mở URL tùy ý từ payload.
- Tránh duplicate với SignalR; lấy dữ liệu thật qua REST có quyền, không dùng payload để bỏ qua quyền.
- Dọn listener/subscription/token khi tắt hoặc logout theo contract đã chốt.
- Test fixture cho denied/unsupported, token failure, logout/account switching, trùng và click.
- Test thật bằng project/tài khoản thử: foreground/background, refresh/reload, token rotation và tắt/logout. Không gửi SOS thật.
- Cập nhật PLAN/api.txt và checklist test; chỉ merge dev khi implementation đạt kiểm tra.

Nguồn API client: [getToken options](https://firebase.google.com/docs/reference/js/messaging.gettokenoptions), [Messaging API](https://firebase.google.com/docs/reference/js/messaging).
