# Đợt 13b — Giám sát quản trị

Ngày 2026-10-11; đối chiếu BE local `f277b6a`, controllers, DTO, handlers và AiMetricsAggregator. Chỉ Admin, chỉ đọc. Service `src/services/api/monitoring.ts`; giao diện `src/pages/super-admin/ApiMonitoring.tsx`.

| API | Màn hình | Bộ lọc |
|---|---|---|
| GET /api/ai-metrics | /admin/metrics | modelName chính xác, dateFrom/dateTo DateOnly UTC, page/pageSize |
| GET /api/audit-logs | /admin/audit | actorId, actionType, targetTable, targetRecordId, dateFrom/dateTo, page/pageSize |
| GET /api/notifications/status | /admin/delivery | Không có; hai cửa sổ 24 giờ và 7 ngày |
| GET /api/notifications/failed | /admin/delivery | channel, dateFrom/dateTo, page/pageSize |

Thêm 4 callers, tổng **112/144**. Phân trang server 20; query key theo actor, loại, bộ lọc và trang. AbortSignal, không retry tự động, không dùng mock nếu API lỗi. Popup chi tiết dùng bản ghi của danh sách vì BE không có detail endpoint riêng.

## Ý nghĩa số liệu

- Metrics dùng ngày UTC, bắt đầu 07:00 giờ Việt Nam; job tổng hợp ngày hôm trước lúc 00:00 UTC. Không phải realtime. Tên model/version giữ nguyên response, không tự đổi Tesseract thành VietOCR. Local aggregator đang gán tên Tesseract cho nguồn ocr_requests, YOLOv8 cho obstacle_detection_events, SpeechRecognition cho voice offline.
- totalRequests/successfulRequests/failedRequests là số từ BE. Không cộng trang đang xem thành tổng toàn bộ, không tính trung bình P95/P99 giữa các dòng. Null hiển thị chưa có dữ liệu; 0 vẫn là 0. Confidence hiển thị phần trăm từ tỷ lệ 0–1, latency là ms, không gọi các số này là accuracy.
- YOLO aggregator hiện gán failed=0; FaceNet chỉ Error là thất bại; voice offline tính Failed/Unrecognized; Hybrid tính thiếu latency là thất bại. Thành công thống kê không chứng minh nhận diện đúng hoặc dẫn đường an toàn. Hybrid management U7b chưa triển khai.
- Notification status chỉ đếm AlertNotification theo CreatedAt trong 24h/7d, gộp Sent và Delivered vào totalSent. Không phải toàn bộ email giao dịch/FCM và không xác nhận đọc. Các cửa sổ chồng lặp, không cộng hai kỳ. ByChannel không có pending theo từng kênh, chỉ trả kênh có sent/failed.
- Failed list không bị giới hạn theo cửa sổ thống kê; bộ lọc chỉ áp dụng danh sách. Audit/failed lọc cả ngày Việt Nam với offset +07:00 và độ chính xác cuối ngày đến 7 chữ số phần giây, hiển thị UTC+7. Các thống kê và danh sách tải lại độc lập.

## Dữ liệu nhạy cảm và giới hạn

Audit chỉ đưa metadata đã chọn vào cache/UI: ID, actor, action, target table/ID, thời gian. Không giữ oldData/newData/notes/IP/userAgent trong query cache vì payload thô có thể có secret/dữ liệu cá nhân. **Raw API response vẫn nhận các trường này**; FE không thay BE redaction. Muốn mở chi tiết thay đổi cần BE có DTO đã loại secret theo từng loại thao tác.

FailureReason hiển thị như text, không chạy HTML hoặc link. Không có nút retry thông báo, xóa audit, export hay ghi API. Authorization thật vẫn phụ thuộc BE; việc ẩn menu không thay kiểm tra quyền server. Không thay đổi BE trong đợt này.

## Checklist test live

1. Admin mở ba menu; Caregiver/CenterAdmin không thấy menu và mở URL phải về forbidden. Thử token không phải Admin gọi API phải bị BE từ chối.
2. Metrics: có dữ liệu được job tổng hợp, lọc tên đúng từ response và ngày UTC; đối chiếu với Swagger. Trang sau khi >20 dòng, lọc mới trở về trang 1. Giá trị null/0 khác nhau, mở Chi tiết để xem confidence/P95/P99/nguồn/thời gian.
3. Audit: dùng thao tác cấu hình ở 13a hoặc quản lý tài khoản đã thực hiện, đối chiếu actor UUID, action, target table/ID và ngày. UUID sai hoặc khoảng ngày ngược phải báo lỗi trước HTTP. Mở popup chỉ có metadata.
4. Delivery: đối chiếu totalSent/totalFailed/totalPending và ByChannel với response. Có Failed trong AlertNotification mới có bản ghi; đừng cố tạo sự cố cảnh báo thật chỉ để sinh test. Chuẩn bị fixture staging hoặc log lỗi có sẵn.
5. Lọc Fcm/SignalR/Email, ngày Việt Nam và chuyển trang failed; đối chiếu sự kiện sát nửa đêm. Mở chi tiết xem người nhận, event ID, reason. Không có retry mutation.
6. Thử API trả lỗi/mất mạng/response sai: có trạng thái lỗi và tải lại, không biến thành 0. Status lỗi vẫn tra cứu failed được và ngược lại. Kiểm tra chuyển filter nhanh, logout/đổi tài khoản không giữ dữ liệu trước.
7. Desktop/mobile375: bộ lọc wrap, bảng cuộn ngang trong vùng, popup giữa viewport, Escape đóng và trả focus. Nội dung reason có HTML phải hiện chữ nguyên dạng.

## Bàn giao

149 unit tests và 3 E2E chọn lọc đạt qua các lượt chạy: luồng giám sát, chặn CenterAdmin và auth Admin. Lint/build đạt; đã xem ảnh desktop/mobile375 và popup. Detector giao diện không chạy do lỗi launcher cache_directory_failed; dùng kiểm tra ảnh và DESIGN.md. Build còn cảnh báo bundle lớn vốn có.

Chưa nghiệm thu dữ liệu BE deploy hoặc job tổng hợp thật; kiểm thử fixture không chứng minh delivery thành công. Không gửi thông báo hay sửa dữ liệu production trong đợt này. Tiếp theo **U7a — quản trị ICE servers** khi người dùng yêu cầu; phải kiểm tra lại BE contract và cách xử lý TURN credentials. Chính sách riêng tư tiếp tục chờ nội dung/version.
