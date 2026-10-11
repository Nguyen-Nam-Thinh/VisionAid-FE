# U7b — Theo dõi Hybrid

Ngày 2026-10-11. Contract đối chiếu BE local `f277b6a`: NavigationGuidanceController, GetNavigationGuidanceLogs handler/query/validator, NavigationGuidanceLogResponse, ProcessNavigationGuidanceHandler, AiMetricsAggregator và DbSeeder. Không thay BE/Mobile.

Admin → **Nhật ký Hybrid**, `/admin/hybrid`. Tái sử dụng `src/pages/super-admin/ApiMonitoring.tsx` và `src/services/api/monitoring.ts`.

## API và phạm vi

| API | Nơi sử dụng |
|---|---|
| GET /api/navigation/guidance/logs | Bảng và popup chi tiết metadata tại /admin/hybrid; page/pageSize=20, userId, sessionId, engineUsed, isOfflineFallback, dateFrom/dateTo |
| GET /api/ai-metrics | Đã nối 13b tại /admin/metrics; link từ Hybrid, modelName chính xác JEV, Groq, RuleBased; ngày UTC |
| GET /api/system-configs; GET/PUT /api/system-configs/{id}; GET /api/system-configs/{id}/history; POST /api/system-configs/{id}/rollback | Đã nối 13a tại /admin/configurations; không thêm mutation tại Hybrid |

Thêm **1 REST caller**, tổng **117/144** operations đã kiểm kê. Không gọi POST /api/navigation/guidance của Mobile, không tạo dữ liệu điều hướng giả trên BE. Metrics và cấu hình không được đếm lại thành API mới.

## Ý nghĩa và giới hạn

- BE cho Admin đọc toàn bộ logs; CenterAdmin giới hạn tổ chức, Caregiver liên kết, VIU bản thân. U7b chỉ mở UI quản trị Admin; không tự mở lịch sử cảnh vật/GPS toàn hệ thống hoặc thêm UI Caregiver/CenterAdmin ngoài scope này.
- Giữ id/sessionId/userId/frameId, decision, engineUsed, isOfflineFallback, latencyMs, createdAt. Loại detectedObjectsJson/ttsText khỏi dữ liệu trả về adapter và query cache; **raw HTTP response vẫn chứa các trường này**. Nếu cần data minimization ở đường truyền, BE phải cung cấp DTO metadata riêng. Mã người dùng/phiên vẫn là dữ liệu định danh, chỉ Admin truy cập.
- Query key chứa actor/kind/filter/page, gcTime=0, AbortSignal, không tự retry. UUID, engine và boolean query được kiểm tra trước HTTP. Các response enum chưa biết hiển thị nguyên văn như text; không suy ra hành động.
- Engine query: Jev, Groq, RuleBased. Filter ngày bao gồm trọn ngày Việt Nam, dateTo đến 23:59:59.9999999+07:00. createdAt hiển thị UTC+7; metrics dùng DateOnly UTC riêng.
- Decision STOP/TURN_LEFT/TURN_RIGHT/PROCEED là lịch sử được BE ghi, không là chỉ dẫn realtime trên Web. Không phát TTS hay tự mở camera/mic.
- isOfflineFallback=true được BE đặt khi chọn RuleBased, kể cả cấu hình trực tiếp RULE_BASED. Groq thành công sau JEV lỗi có thể vẫn false; cờ này không liệt kê mọi bước fallback và không chứng minh Mobile offline.
- latencyMs nullable; null hiển thị chưa có dữ liệu, 0 vẫn là 0ms. BE có thể trả thời gian engine cuối hoặc ngưỡng timeout, không nhất thiết tổng thời gian request trên Mobile.
- AiMetricsAggregator nhóm theo engine/ngày UTC; failed_requests đếm latency_ms IS NULL, avg_confidence luôn null cho nguồn navigation_guidance_logs. RuleBased đã trả quyết định vẫn có thể bị tính vào failed. Không gọi đây là accuracy, độ an toàn hay tỷ lệ hướng dẫn sai; không tự tính tổng từ 20 dòng đang xem.
- Cấu hình đã có từ 13a: hybrid_navigation_enabled Boolean; hybrid_navigation_engine JEV/GROQ/RULE_BASED; navigation_near_threshold_ms Integer100–2000 theo seed, validation theo response. Sửa/rollback ở popup cấu hình hiện có. Lưu không xác nhận Mobile đã áp dụng hoặc engine ngoài đang hoạt động. Không gửi secret JEV/Groq từ FE.

## Test thật theo chuỗi

1. Admin mở Nhật ký Hybrid; kiểm tra Network GET logs và dữ liệu BE. Caregiver/CenterAdmin không có menu, URL chuyển forbidden, không phát GET từ route này. Backend vẫn phải tự thực thi RBAC.
2. Cần Mobile có phiên điều hướng và gửi POST guidance hợp lệ trước. Lấy userId/sessionId từ dữ liệu test, lọc đúng UUID, engine, fallback, ngày Việt Nam; test qua nửa đêm và >20 bản ghi. Không dùng Web gửi POST thay Mobile.
3. Popup hiển thị decision/engine/latency/fallback, null latency không đổi thành0. Không thấy detectedObjectsJson/ttsText trong UI. Kiểm tra desktop/mobile375, cuộn bảng, dialog giữa viewport, Escape và focus.
4. Chuyển **Xem số liệu AI**, nhập modelName JEV/Groq/RuleBased. Chờ job tổng hợp ngày trước, đối chiếu ngày UTC và nguồn navigation_guidance_logs. Không so tổng ngày với trang logs đầu tiên hoặc hiểu failed như AI trả quyết định sai.
5. Trong môi trường test được thống nhất, **Cấu hình engine** → tìm ba khóa trên → sửa qua popup, xem history, rollback. Mobile gửi yêu cầu mới và kiểm tra log engine sau cấu hình. Không tắt engine production để thử nghiệm.
6. BE/Mobile phối hợp giả lập JEV timeout, JEV lỗi→Groq, Groq lỗi→RuleBased; kiểm tra engine và cờ theo semantics nêu trên. Mobile NEAR phải hoạt động độc lập; Web không chứng minh điều này.
7. Kiểm tra API403/500, mất mạng, empty, đổi filter nhanh, logout/đổi role. Không lộ dữ liệu phiên trước, không biến lỗi thành bảng trống thành công.

## Bằng chứng và bàn giao

156 unit tests, lint/build và 4 E2E chọn lọc đã đạt: 2 U7b, 2 hồi quy 13b. Fixture gồm filter/page/date, guard, null timing, loại scene/TTS, popup mobile, empty/error. Đã rà ảnh desktop và mobile375. Build còn cảnh báo bundle lớn có sẵn. Detector launcher lỗi cache_directory_failed từ phiên này, dùng DESIGN.md và ảnh để rà.

Chưa gọi ghi live, chưa nghiệm thu Mobile/JEV/Groq hoặc job tổng hợp thực tế. Sau checkpoint này là **U8 — landing/nội dung/dashboard** khi người dùng yêu cầu; chỉ quảng bá chức năng đã nghiệm thu, chính sách riêng tư vẫn chờ nội dung/version.
