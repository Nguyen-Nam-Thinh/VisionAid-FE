# U6b — Voice/SOS incoming trên Web

FE đã bổ sung khôi phục lời mời từ GET /api/webrtc/sessions khi SignalR kết nối, cửa sổ focus hoặc push của đúng tài khoản đến. Chỉ nhận phiên Initiated/Ringing có receiverId của tài khoản hiện tại. Không tự accept, không bật mic/camera khi nhận thông báo.

SignalR và recovery dùng chung sessionId, loại phiên đã kết thúc/từ chối. Cuộc gọi khác không thay thế phiên đang hoạt động; Web báo có cuộc gọi cần kiểm tra và truy vấn lại khi đóng phiên hiện tại. Bấm push focus cửa sổ sẵn có, không reload làm ngắt media; nếu chưa có cửa sổ thì mở /dashboard qua auth guard.

## Test với Mobile và BE deploy
1. VIU gọi bằng giọng nói: Caregiver nhận một popup, mic chưa bật. Nhận cuộc gọi rồi kiểm tra video VIU, audio hai chiều, mute và kết thúc.
2. Tạo SOS bằng tài khoản test: popup ghi SOS; cảnh báo vẫn xuất hiện trong màn cảnh báo. Từ chối hoặc lỗi media không resolve/dismiss cảnh báo khẩn cấp.
3. Mở Web sau khi VIU đã gọi; Web khôi phục phiên còn Ringing mà không cần lại SignalR invitation. Thử push và SignalR trùng nhau: chỉ một popup, không POST tạo thêm phiên.
4. Đang gọi, bấm thông báo hệ thống: cửa sổ được focus, media không ngắt. Có cuộc gọi thứ hai: phiên đầu không bị thay thế; đóng phiên đầu để kiểm tra phiên thứ hai còn chờ hay đã Missed.
5. Từ chối hoặc kết thúc trước khi nhận invitation trễ: không mở lại phiên. Phiên được thiết bị khác nhận phải đóng lời mời tại Web sau đồng bộ trạng thái.
6. Đăng xuất rồi bấm push: không thấy dữ liệu cuộc gọi trước khi đăng nhập. Đổi tài khoản: không khôi phục phiên thuộc tài khoản cũ.
7. Từ chối quyền mic, mất mạng, link bị thu hồi: mic dừng; không tự nhận lại. Kiểm tra cảnh báo và danh bạ vẫn dùng được theo quyền BE.
8. Test Caregiver Personal hết license và Staff tổ chức, cả foreground/background/khóa màn hình trên Mobile, kết nối khác mạng qua TURN. Không dùng test fixture để kết luận các bước này đã đạt.

## Giới hạn đã xác minh
- BE local 48a7346: history DTO và incoming payload chưa có emergencyEventId. FE không đoán liên kết SOS theo VIU hoặc thời gian. Cần BE bổ sung field nếu muốn mở đúng cảnh báo từ cuộc gọi.
- Recovery kiểm tra 20 phiên mới nhất vì API hiện là history phân trang, chưa có pending endpoint; không bảo đảm tìm thấy lời mời cũ nằm ngoài trang này.
- BE middleware có pass-through /api/webrtc/sessions và /api/emergency-events khi NONE/EXPIRED. Chưa xác minh cấu hình deploy hay mọi handler/contacts dưới license hết hạn.
- Không bảo đảm FCM là kênh đánh thức riêng cho mọi cuộc gọi: SW dùng thông báo chung, recovery khi focus/kết nối không phụ thuộc payload chứa sessionId.
- BE busy/max duration và thử nghiệm Mobile/TURN vẫn theo checklist U6a. Nội dung/version privacy vẫn chờ chủ dự án.

## Kiểm tra tự động
Unit tests kiểm tra khôi phục voice, chống trùng, terminal-before-incoming, sai receiver, lỗi 402 không mutation, cuộc gọi thứ hai không ngắt media. Worker test kiểm tra focus không navigate. Browser fixture kiểm tra recovery SOS không auto-mic và hồi quy native peer U6a.

Điểm bàn giao: FE U6b đã triển khai; chờ nghiệm thu Mobile/FCM/TURN thật. Đợt tiếp theo là 9 khi người dùng yêu cầu; không tự triển khai.

Kết quả tự động: 109 unit tests, 5 browser tests chọn lọc, lint và build đạt. Browser dùng fixture và native peer cục bộ; chưa chạy Mobile/FCM/TURN thật.
