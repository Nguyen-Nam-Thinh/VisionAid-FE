# Đợt 8a — Test SignalR

## Cấu hình và điều kiện

- VITE_API_BASE_URL trỏ BE đúng môi trường. Có thể để VITE_SIGNALR_URL trống (dùng API base + /hubs/location) hoặc đặt URL đầy đủ, ví dụ https://api.visionaid.net/hubs/location. Vite cần restart local/redeploy Vercel khi đổi env.
- Web HTTPS cần Hub HTTPS. CORS của BE phải cho origin Web và credentials (BE source đã AllowCredentials). Proxy cần hỗ trợ negotiate và WebSocket upgrade. Lỗi CORS được xác nhận trước đó vẫn cần nhóm BE sửa trên VPS.
- JWT dùng chung login/refresh REST. Hub tự gán caregiver_{id}, org_{orgId}; không cần endpoint subscribe và không gửi orgId tùy ý từ Web.
- Caregiver có link VIU; CenterAdmin có org. Cần Mobile gửi GPS và dữ liệu cảnh báo thử nghiệm từ BE. Không tạo SOS thật để test.

## Checklist

1. Login Caregiver/CenterAdmin: thanh trạng thái chuyển Đang kết nối -> Đã kết nối realtime. Network có POST /hubs/location/negotiate và kết nối WebSocket (SDK có thể fallback transport). Admin không mở Hub. Đừng gửi ảnh URL WebSocket chứa access_token cho người khác.
2. Mở map, Mobile gửi GPS: LocationUpdated kích hoạt GET locations và dữ liệu cập nhật không phải đợi 30s. Nhãn cũ/mới theo recorded/cached timestamp, kết nối Hub không chứng minh thiết bị online. Event chỉ kích hoạt refetch, không sửa cache trực tiếp.
3. Mở caregiver/alerts, tạo event test theo BE: EmergencyAlert/EscalationSuggestion kích hoạt GET list/detail/quyền; không tự acknowledge/escalate/resolve. Suggestion chỉ tải lại dữ liệu trong checkpoint này, không có toast hoặc cuộc gọi tự động.
4. Ngắt mạng ngắn rồi nối lại: trạng thái reconnecting; khi connected tải lại REST + session. Nếu initial connection thất bại hoặc hết lượt retry, có nút Kết nối lại realtime. Polling REST vẫn hoạt động nếu chỉ Hub lỗi. Không hiển thị connected khi start thất bại.
5. Logout: connection đóng, không GET từ callback cũ. Login tài khoản/org khác: connection mới, scope cache mới. Gỡ liên kết/quyền: dữ liệu thực tế lấy lại REST có authorization, 403 được UI xử lý; FE không render payload nhạy cảm từ Hub.
6. Event lặp/cũ không rollback UI; event sai UUID/thời gian bị bỏ qua. Nhiều event gom refetch 250ms; nếu GET đang chạy không cancel để tránh starvation, polling/reconnect tiếp tục đồng bộ. Bộ nhớ dedupe tối đa 512 key; key bị loại có thể gây một REST refetch thừa nhưng không ghi dữ liệu cũ vào cache.
7. JWT hết hạn: SignalR lấy access token mới từ cùng refresh single-flight của REST khi cần kết nối. Refresh thất bại không giữ token cũ để retry vô hạn. Connection hiện hữu không được BE tự revalidate claims liên tục; session polling/REST hỗ trợ phát hiện mất quyền, không phải bảo đảm thu hồi socket tức thì.

## Giới hạn BE và phạm vi

BE hiện không phát event cho mọi thay đổi trạng thái cảnh báo hoặc quyền liên kết, giữ polling 30s. ArrivalNotification dành Mobile, không subscribe trên Web. Bản đồ nền Mapbox/FCM chưa thuộc đợt này. Không thêm REST operation (vẫn 38/107).

Nguồn kiểm tra: LocationHub.cs, LocationHubService.cs, ILocationHubService.cs, RecordGpsLocationHandler, EmergencyEventDispatcher, BoundaryMonitor, EscalationSuggestionJob. Hướng dẫn SDK: https://learn.microsoft.com/en-us/aspnet/core/signalr/javascript-client?view=aspnetcore-10.0

Chưa nghiệm thu Hub/VPS thật. Chỉ merge/push dev, người dùng tự đưa main lên production.

Kiểm tra đợt 8a: 71 unit tests / 15 files; 5 Playwright fixture GPS/cảnh báo/SignalR pass; build/lint pass. Build có cảnh báo chunk khoảng 647 kB; chưa kiểm chứng Hub thật.
