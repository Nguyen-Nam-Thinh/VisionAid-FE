# Đợt 9 — Địa điểm đã lưu và vùng an toàn

Ngày: 2026-10-10. FE: feat/saved-locations-geofences-stage9. Contract BE local: 48a7346.
Route: /caregiver/locations, API mode. Mock mode giữ luồng demo cũ.

## Đã nối

10 REST operations: POST/GET collection và GET/PUT/DELETE theo id cho /api/saved-locations và /api/geofences.
Caller: src/services/api/places.ts; UI: src/pages/caregiver/ApiPlaces.tsx; route: src/app/App.tsx.
Tổng có caller Web: 80/140 operations theo inventory U0, không phải mọi operation đều thuộc Web.

- Chọn VIU trong danh sách phân trang, tìm theo tên/email; đổi VIU remount scope và hủy GET cũ qua AbortSignal.
- Hai tab riêng, lọc isActive, phân trang phía BE, tổng số lấy từ response.
- GET cần active link; thêm/sửa/xóa cần canManageLocations, kể cả Primary. Kiểm tra mới trước mỗi mutation. Backend quyết định tenant và entitlement cuối cùng.
- Detail/list/response mutation phải khớp visuallyImpairedUserId; detail phải khớp id. Không gửi mutation vào resource trả về của VIU khác.
- Popup native thêm/sửa/xóa, giữ form khi lỗi có thể sửa; xóa cần xác nhận, không xóa optimistic. PUT gửi đầy đủ các field của loại resource, DELETE xử lý 204.
- Tọa độ mới để trống. Latitude [-90,90], longitude [-180,180], chấp nhận 0. Bán kính nguyên: saved 10–5000 m, geofence 50–50000 m; default 50/300 m.
- Saved có description, ttsAnnouncement tối đa 500 ký tự. Geofence có alertOnEnter/alertOnExit. isActive chỉnh khi sửa; POST để BE mặc định true.
- Saved tối đa 20 cả active/inactive do BE enforce. Geofence không tự áp quota suy đoán.
- 402 giữ phiên và liên kết trang license. 403/404/409/5xx hiện lỗi, tải lại danh sách; không tự retry POST, không fallback dữ liệu giả.

## Bạn cần chuẩn bị

1. Một Caregiver có active link tới VIU và canManageLocations=true; thử cả Personal và Staff tổ chức nếu có.
2. Một Caregiver chỉ có quyền xem và một VIU không có quyền truy cập để kiểm tra quyền.
3. License hợp lệ cho luồng CRUD; tài khoản NONE/EXPIRED để kiểm tra 402 theo chính sách BE. Không dùng quyền Admin thay Caregiver.
4. Mobile có GPS và boundary/arrival worker hoạt động để thử cảnh báo sau CRUD. Không cần Mobile để test lưu/sửa/xóa trước.

## Chuỗi test cùng nhau

1. Đăng nhập → Địa điểm và vùng an toàn → chọn VIU → tab Địa điểm đã lưu.
2. Thêm địa điểm: nhập tên, latitude/longitude chính xác, bán kính 50 m, mô tả, lời nhắc. Lưu → mở Xem và sửa → reload trang và chọn lại VIU: dữ liệu phải còn.
3. Sửa tên/tọa độ/lời nhắc; xóa trắng mô tả/lời nhắc; tạm ngưng. Lọc Hoạt động/Tạm ngưng phải đúng. Không tự đổi active trên UI trước khi BE thành công.
4. Xóa → Hủy: vẫn còn. Xóa → Xác nhận: biến mất sau response. Thử BE lỗi: bản ghi không bị xóa trên UI như thành công.
5. Tab Vùng an toàn: tạo tâm/bán kính 300 m, cảnh báo ra=true/vào=false → sửa bật vào → reload → kiểm tra cả hai cờ và isActive → xóa có confirm.
6. Thử latitude 91, longitude 181, để trống tọa độ, radius 1 hoặc số lẻ: không gửi mutation. Thử tọa độ 0 để chắc không bị hiểu là trống.
7. Thu hồi canManageLocations sau khi mở popup nhưng trước khi Lưu: không ghi dữ liệu; tải lại để thấy chỉ xem. Gỡ active link: nội dung bị ẩn khi đồng bộ quyền. Thử đổi VIU khi đang tải chậm: không trộn danh sách hoặc mở detail của VIU cũ.
8. License hết hạn: kiểm tra response 402, phiên không bị logout và màn license vẫn truy cập được. Khôi phục license rồi tải lại.
9. Với dữ liệu test đủ nhiều, thử phân trang, lọc và xóa bản ghi cuối trang. Không suy ra tổng số từ số dòng trang hiện tại.
10. Sau CRUD mới test Mobile: GPS đi ra/đi vào geofence đang active → worker → cảnh báo/SignalR/FCM theo cấu hình. Đến saved location → lời nhắc TTS trên Mobile. Vùng inactive không được xử lý như active. Đây là test liên thông với các đợt 6/7/8 và Mobile, không phải FE tự phát cảnh báo.

## Bằng chứng và giới hạn

- 117 unit tests đạt, gồm 8 test mới cho hai resource: CRUD exact payload, scope, read-only/revocation, radius/coordinates, 402 và không replay 500.
- 4 browser tests chọn lọc đạt: hai luồng CRUD mới, hồi quy login và contacts 11a. Kiểm tra popup 375px và desktop bằng screenshot; popup dài cuộn bên trong.
- Lint và build đạt. Browser dùng API fixture; chưa nghiệm thu BE deploy/Mobile/worker/FCM thật.
- Đợt này dùng nhập tọa độ; không có Mapbox picker hoặc preview địa lý. Bản đồ nền ở đợt GPS vẫn chờ cấu hình/xác minh, không dùng sơ đồ demo để ghi tọa độ thật.
- Không sửa BE, không triển khai CenterAdmin location UI ngoài phạm vi /caregiver/locations, dù controller BE có hỗ trợ role đó.
- API PUT không có ETag/version precondition; hai người cùng sửa có thể ghi đè theo hành vi BE. Detail được đọc lại trước ghi để kiểm tra scope, không bảo đảm khóa cập nhật đồng thời.

Điểm dừng: user test đợt 9. Đợt tiếp theo 10 — Face Registry; phải kiểm tra consent và contract preview ảnh được authorize trước khi triển khai.
