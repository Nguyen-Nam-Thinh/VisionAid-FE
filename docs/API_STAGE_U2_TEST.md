# U2 — Danh mục gói và quản trị package

Ngày triển khai: 2026-10-03. API mode, BE HTTPS hiện hành. U1 chưa có xác nhận nghiệm thu live; người dùng đã yêu cầu tiếp U2.

## Màn hình và API

- Admin: sidebar **Gói dịch vụ** -> /admin/packages.
- Caregiver cá nhân, CenterAdmin: **Gói dịch vụ** -> /packages; cũng mở được từ trang License.
- Staff Caregiver thuộc tổ chức không có danh mục mua cá nhân; truy cập /packages không gọi API gói.
- GET /api/licenses/packages?page=1&pageSize=20[&isActive=true|false]: phân trang BE; chỉ Admin gửi isActive.
- GET /api/licenses/packages/{id}: chỉ Admin, mở popup chi tiết/sửa.
- POST /api/licenses/packages: chỉ Admin, tạo gói.
- PUT /api/licenses/packages/{id}: chỉ Admin, sửa và bật/tắt isActive. Không có DELETE.

## Test Admin (dùng gói test riêng)

1. Đăng nhập Admin; mở Gói dịch vụ, đối chiếu list với Swagger.
2. Thêm gói: tên, mã unique chữ in hoa/số/gạch dưới, loại Personal hoặc Business, giá tháng, currency, số license, cấu hình VIU, số ngày và flags.
3. Giá tháng không âm, giá năm để trống hoặc >0, tối đa 2 chữ số thập phân và 9.999.999.999,99 (BE numeric(12,2)); số lượng/ngày là số nguyên, trial có thể 0.
4. Flags ví dụ {"webrtc":true,"fleet_map":false}. JSON sai, mảng hoặc giá trị không boolean bị chặn trước gửi.
5. Tạo thành công: popup đóng, thông báo đã lưu, list tải lại. Trùng mã/400/409: popup giữ dữ liệu, không báo thành công.
6. Mở Chi tiết / Sửa: kiểm tra GET detail; mã và loại chỉ đọc, PUT không gửi các field này.
7. Đổi giá, thời hạn, flags; lưu và mở lại/F5 để đối chiếu dữ liệu server.
8. Bỏ “Đang mở bán”, lưu; lọc “Ngừng mở”. Mở lại bật gói và xác nhận list cập nhật.
9. Giá năm đã tồn tại không thể xóa qua API hiện tại (null bị BE bỏ qua); FE giải thích và yêu cầu giữ giá hoặc nhập giá mới.
10. Popup căn giữa desktop/tablet, cuộn trong popup, Escape đóng và trả focus; khi submit không đóng hay gửi trùng.

## Test danh mục theo vai trò

- Caregiver cá nhân thấy gói Personal active, CenterAdmin thấy Business active. Giá/currency/thời hạn từ server.
- Personal luôn giải thích tối đa 3 VIU theo MaxViusPerCaregiver; không chuyển thành 1 chỉ vì maxViuPerLicense của package.
- BE không có filter packageType: FE lọc loại trong mỗi trang BE. Có trang không có gói phù hợp; dùng Trang sau nếu còn, không tự báo danh mục toàn hệ thống rỗng.
- Admin cập nhật giá/trạng thái -> ở tài khoản khác bấm Tải lại danh mục hoặc chờ refetch 60 giây khi tab hoạt động.
- Gói inactive không hiện cho người dùng thường; không có nút tạo/sửa. Truy cập /admin/packages bằng non-admin bị chặn.
- Đổi tài khoản/org không lẫn cache. API 402/403/5xx hiển thị lỗi, không fallback dữ liệu mock.

## Giới hạn / đợt tiếp theo

- Không tạo payment, mua, refund, yearly checkout hoặc tự unlock feature. U3a mới nối PayOS.
- Khi triển khai checkout phải kiểm tra lại giá/trạng thái gói từ server; danh mục đang xem không phải giá cam kết thanh toán.
- Feature flags được Admin chỉnh như boolean config; không tự triển khai/chặn mọi UI bằng cờ. Không lưu secret vào flags.
- Chưa nghiệm thu authenticated BE runtime của U2. Test tự động dùng fixture; không thay đổi gói production.
- BE local đối chiếu: controller, DTO, validators, handlers và cấu hình numeric(12,2); PUT không hỗ trợ xóa priceYearly.

## Kết quả kiểm tra tự động
- 79 unit tests đạt; lint và production build đạt (còn cảnh báo bundle >500 kB).
- 9/9 Playwright U1–U2 đạt trong cùng lượt chạy; riêng U2 có 4 kịch bản Admin/Caregiver/CenterAdmin/Staff.
- Popup đã kiểm tra vị trí và ảnh chụp tại 1440px/768px; ảnh tablet đã được kiểm tra trực quan.
- Chưa chạy lại toàn bộ API E2E cũ trong đợt này; không coi fixture là test production.
