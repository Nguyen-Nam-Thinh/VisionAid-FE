# Đợt 13a — Cấu hình hệ thống

Ngày 2026-10-11. Đối chiếu BE local f277b6a: SystemConfigsController, DTO, update/rollback handlers và DbSeeder.

## Phạm vi đã nối

Admin vào **Cấu hình hệ thống**, route `/admin/configurations`. Service `src/services/api/configurations.ts`, UI `src/pages/super-admin/ApiConfigurations.tsx`.

| API | Nơi sử dụng |
|---|---|
| GET /api/system-configs | Danh sách, tìm kiếm, category, phân trang 20 |
| GET /api/system-configs/{id} | Popup chi tiết và kiểm tra lại trước khi ghi |
| PUT /api/system-configs/{id} | Popup sửa, body configValue và reason |
| GET /api/system-configs/{id}/history | Lịch sử phân trang 20 |
| POST /api/system-configs/{id}/rollback | Xác nhận khôi phục, body historyId và reason |

Thêm 5 operations, tổng **108/144** có caller Web. Không tạo/xóa key hoặc sửa isPublic. GET public không được dùng hay tính thêm.

Kiểm tra Admin, UUID, response DTO, scope ID/key, type Integer/Decimal/Boolean/String/Json và min/max. Boolean gửi chuỗi true/false; reason tối đa 500 ký tự. Khôi phục **oldValue** của dòng lịch sử, không phải newValue; oldValue null không được khôi phục. Lỗi ghi không rõ kết quả không tự gửi lại, cần đóng và tải lại để đối chiếu.

## Giới hạn cần biết

- Chỉ các key seed đã duyệt trong service được hiện giá trị, xem lịch sử và sửa. Key chưa duyệt bị xóa value/description/bounds trước khi vào query cache. Muốn mở key mới phải rà nguồn BE trước.
- BE hiện trả giá trị cấu hình nguyên bản. Allowlist FE không che secret trong raw response ở Network: BE phải loại hoặc che secret phía server, kể cả lịch sử/audit. Không lưu secret vào cấu hình có response công khai.
- FE đọc lại value, updatedAt, type và bounds trước khi ghi để phát hiện snapshot cũ; đây không phải kiểm soát đồng thời nguyên tử. BE cần version/ETag để loại race giữa lần đọc và ghi.
- BE rollback chưa validate type/range; FE đã kiểm tra nhưng client khác có thể bỏ qua. Cần sửa BE nếu muốn bảo đảm mọi caller.
- Lưu thành công không chứng minh mọi runtime consumer hoặc Mobile áp dụng ngay. Cần xác minh code đọc config và cache; không suy ra mọi BusinessRules đã dùng DB.

## Checklist test thật

Ưu tiên staging hoặc dữ liệu cô lập vì đây là cấu hình toàn hệ thống. Chưa có thao tác ghi cấu hình production trong đợt này. Ghi lại giá trị ban đầu và thống nhất thời điểm trước khi thử thay đổi live.

1. Đăng nhập Admin, mở danh sách; đối chiếu search/category, totalCount, chuyển trang với Swagger. Tài khoản khác không có menu và BE phải từ chối request trái quyền.
2. Mở chi tiết key đã duyệt, kiểm tra value/type/bounds và thời gian. Key chưa duyệt không hiện giá trị hoặc cho mở chi tiết.
3. Mở sửa: thử số vượt min/max, Integer có phần thập phân, JSON lỗi và reason quá 500. Không được gửi mutation. Boolean dùng dropdown; PayOS environment và Hybrid engine phải thuộc giá trị cho phép.
4. Chọn key an toàn trên staging, thay giá trị hợp lệ và nhập lý do. Đối chiếu PUT, chi tiết tải lại và dòng lịch sử mới. Không dùng giá trị cấu hình an toàn khẩn cấp để thử tùy ý trên production.
5. Chọn lịch sử có oldValue, đọc giá trị khôi phục trong popup trước khi xác nhận. Đối chiếu POST historyId, giá trị sau lưu và lịch sử mới. Khôi phục giá trị ban đầu sau test; oldValue null phải bị chặn.
6. Hai Admin mở cùng bản ghi: người thứ hai sửa sau người thứ nhất phải nhận báo dữ liệu đã đổi khi pre-read phát hiện. Race đồng thời rất sát vẫn cần BE version để bảo đảm.
7. Kiểm tra 403/404/500/mất mạng: không hiện thành công giả, không tự retry ghi. Với kết quả không rõ, tải lại chi tiết/lịch sử trước thao tác tiếp.
8. Kiểm tra desktop và mobile 375px, popup nằm giữa, cuộn được nội dung, bảng cuộn ngang, Escape/focus và trạng thái đang lưu. Đăng xuất/đổi tài khoản không dùng cache của người trước.

## Kiểm tra tự động và bàn giao

143 unit tests và 2 E2E fixtures chọn lọc cấu hình/auth Admin đạt; lint/build đạt. Đã xem desktop/mobile screenshots. Build vẫn có cảnh báo bundle lớn. Fixture không thay nghiệm thu BE thật.

Đợt tiếp theo **13b — metrics, audit và giám sát notification**, rồi U7a/U7b theo PLAN; chỉ làm khi người dùng yêu cầu. Chính sách riêng tư vẫn chờ nội dung/version.
