# U6a — Luồng cuộc gọi và lịch sử

Source contract: BE `48a7346`, kiểm tra tại `../VisionAid-BE`. Web đã triển khai, chưa nghiệm thu Mobile/TURN/BE deploy. Không tự chuyển main.

## Phần đã nối

- Caregiver vào **Người được chăm sóc → Gọi hỗ trợ → Bắt đầu gọi**. Xác minh active link, xin micro, POST tạo phiên; Web không bật camera.
- Mobile nhận cuộc gọi, chấp nhận và gửi SDP offer. Web gửi SDP answer + ICE qua cùng Hub đang dùng cho GPS/cảnh báo.
- Popup toàn Shell nhận cuộc gọi đến sau kiểm tra phiên bằng history. Bấm Nhận mới mở micro và POST accept; Từ chối/Escape gửi reject. Có hỗ trợ payload voice/SOS cơ bản, không tự nhận SOS.
- Mute, phát media khi autoplay bị chặn, end; phân biệt trạng thái API chấp nhận và RTCPeerConnection thực sự connected.
- `/caregiver/calls`: history phân trang 20, lọc VIU/thời gian, chi tiết popup. Giờ hiển thị theo trình duyệt; lọc gửi ISO UTC.
- Không persist SDP/ICE/TURN credential/video/audio. Dọn track/peer/handlers khi kết thúc, mất signaling, đổi phiên hoặc unmount. Logout/unmount cố gửi end nếu còn phiên; không đảm bảo server nhận được khi đóng tab hoặc mất mạng.
- Một cuộc gọi tại một thời điểm trên tab; Web Lock theo tài khoản ngăn hai tab cùng mở media. Incoming lặp không mở lại phiên đã đóng. Giữ ICE trước offer và signaling đến trước REST response; bỏ session khác.

## Chuỗi API phải test cùng nhau

1. GET users + GET caregiver-links: lấy VIU có active link.
2. POST `/api/webrtc/sessions` `{viuUserId,triggerType:"CaregiverInitiated"}` → `{sessionId,status,myRole,iceServers}`.
3. Mobile POST `/{sessionId}/accept` → SignalR `WebRtcCallAccepted` → Mobile `RelayOffer` → Web `RelayAnswer`; hai phía `RelayIceCandidate`.
4. POST `/api/webrtc/sessions/{id}/end` `{reason:"user_hangup"}` → `WebRtcCallEnded` → GET history.
5. Với incoming: `WebRtcIncomingCall` → GET history xác minh receiver → user Nhận → GET links → POST accept. Từ chối gọi POST reject, không xin micro.

GET `/api/webrtc/ice-servers/public` không cần gọi riêng: initiate/accept đã trả ICE. Không ghi TURN secret vào env.

## Bạn test trên BE/Mobile thật

- BE deploy phải chứa fix membership `48a7346`; HTTPS/WSS, cấu hình STUN/TURN hợp lệ, Mobile có cùng event/method/DTO.
- Dùng Caregiver có active link và Mobile đăng nhập VIU đó. Cho phép micro sau click.
- Gọi đi → Mobile nhận/accept → Web thấy camera VIU, hai bên nghe được → mute/unmute → end từ Web, sau đó lặp lại end từ Mobile → history đúng.
- Mobile từ chối; Mobile không online/không trả lời: RingTimeout job chuyển Missed, FE đọc lại history mỗi 10 giây khi có phiên.
- Incoming voice/SOS: người dùng chủ động nhận hoặc từ chối. Không tạo SOS thật chỉ để test giao diện; dùng môi trường/dữ liệu test được kiểm soát.
- Đổi sang mạng di động/Wi-Fi khác nhau, kiểm tra candidate pair loại relay để nghiệm thu TURN. Peer trong cùng máy không chứng minh TURN hoạt động.
- Cấm quyền micro, rút micro, đóng popup khi trình duyệt đang hỏi quyền, mất mạng/SignalR, reload/logout, mở hai tab. Micro phải dừng và không tự bật lại sau reconnect.
- Gỡ link trong khi gọi: lần xác minh tiếp theo dừng media. Thử tài khoản không liên quan/cross-org gửi offer/ICE cùng sessionId: BE phải từ chối.
- Kiểm tra thiếu quyền/license 402, end API lỗi và accept đã được thiết bị khác xử lý. Không tự retry POST; xem lại history khi kết quả không chắc chắn.
- Desktop và 375px: popup giữa viewport, cuộn được, các nút và Escape dùng bằng bàn phím; focus quay lại nút mở.

## Giới hạn cần biết

- Live media/Mobile/TURN, nội dung consent chính thức, SOS background/khóa màn hình/FCM phối hợp thuộc nghiệm thu U6b; chưa kết luận đạt.
- Chưa có GET session-detail: phiên đang gọi/incoming được đối chiếu trong 20 bản ghi mới nhất theo VIU hoặc tài khoản; nếu không xác minh được thì đóng cục bộ. Không tự khôi phục media sau reload/reconnect.
- Watchdog local 60 giây chỉ giới hạn chờ setup. Không tự ghi Missed; trạng thái đó do BE quyết định. Mất signaling dừng media, yêu cầu người dùng gọi lại.
- Link được FE kiểm tra trước gọi/nhận và mỗi 10 giây khi phiên hoạt động. BE mới kiểm tra membership trong session; cần BE quyết định và thực thi thu hồi quyền ngay giữa phiên, không dựa vào FE làm hàng rào bảo mật.
- BE hiện có `webrtc_max_duration_minutes` ở seeder nhưng chưa thấy consumer áp dụng trong source đã rà. Initiate cũng chưa thấy guard busy giữa nhiều thiết bị. Web Lock chỉ bảo vệ cùng trình duyệt, không thay kiểm soát đồng thời/thời lượng ở BE.
- Credentials ICE lấy trực tiếp từ API; chưa xác minh rotation/expiry TURN ở server deploy. Không coi credential từ API là bằng chứng đã dùng TURN tạm thời.

## Kiểm thử tự động

- Unit: state machine signaling, early ICE/offer, foreign session, dedup, permission, mic denied, late media/REST cancellation, disconnect, cleanup, multi-tab denial, accept conflict, REST contract/history scope.
- Playwright: outgoing với hai RTCPeerConnection native cục bộ và API/SignalR fixture; incoming/Escape/reject/dedup; mic denied; regression SignalR GPS/cảnh báo.
- Đây là fixture và media trong cùng trình duyệt, không phải test BE production hoặc Mobile/TURN thật. Kết quả: lint/build đạt; 106 unit đạt; 5 E2E đạt gồm 3 U6a, auth Caregiver và SignalR regression. Outgoing E2E đã kiểm tra frame video 320px bằng native peer cục bộ. Vitest/Playwright chạy ngoài sandbox vì sandbox gây lỗi ENOENT cache tạm và không khởi động browser/server ổn định. Build còn cảnh báo bundle chính trên 500 kB.

Bước tiếp theo: người dùng test U6a theo chuỗi trên; chỉ tiếp U6b khi được yêu cầu. Không tự làm các đợt 9–13.
