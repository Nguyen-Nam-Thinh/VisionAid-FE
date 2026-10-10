# Đợt 12b — Báo cáo tổ chức

Ngày 2026-10-11; đối chiếu BE local f277b6a, OrganizationsController, GetOrganizationActivitySummaryHandler và GetOrganizationMembersHandler.

## Đã triển khai

CenterAdmin mở **Báo cáo hoạt động** từ sidebar, route `/center-admin/reports`.

- GET `/api/organizations/{id}/activity-summary`: 1 operation mới, tổng **103/144** Web callers.
- GET `/api/organizations/{id}/members`: tái sử dụng caller đợt 5a, không đếm thêm. Tìm kiếm, role, trạng thái và phân trang10 độc lập bộ lọc ngày.
- Service `src/services/api/organizations.ts`; UI `src/pages/center-admin/ApiReports.tsx`. Scope lấy từ phiên, không nhập orgId tùy ý; CenterAdmin chỉ org của mình. Query key actor/org/filter/page; AbortSignal; gcTime0. Response summary kiểm tra organizationId và khoảng ngày phản hồi.
- Loading/error/empty tách biệt; 0 là số thật từ response. Không đếm trang thành viên đầu tiên để tạo thống kê. Không thêm ghi dữ liệu, export hoặc gallery nhận diện cho CenterAdmin.

## Ý nghĩa số liệu và thời gian

BE nhận `DateOnly` dạng YYYY-MM-DD, lọc **ngày UTC**, gồm toàn ngày kết thúc. Ví dụ ngày 2026-10-11 tính từ 07:00 ngày 11 đến ngay trước 07:00 ngày 12 theo giờ Việt Nam. FE gửi nguyên ngày, không chuyển UTC+7 như lịch sử Caregiver. Muốn báo cáo theo ngày Việt Nam cần BE đổi contract/handler, không thể sửa bằng dịch chuỗi DateOnly phía FE.

- `emergencyEventCount`: mọi emergency events, không có bộ lọc trạng thái/type.
- `geofenceBreachCount`: thực tế handler đếm mọi LocationBoundaryEvent, không lọc EventType; UI ghi sự kiện ranh giới vùng an toàn.
- `ocrRequestCount`: mọi OcrRequest, gồm QR vì ProcessQrScan tạo OcrRequest loại QrCode.
- `faceRecognitionCount`: số log nhận diện, gồm cả chưa nhận diện được/lỗi; không phải độ chính xác AI.

Các truy vấn scope theo VIU **hiện thuộc org và chưa bị xóa**. Không phải báo cáo membership tại thời điểm sự kiện; chuyển/xóa thành viên có thể làm số lịch sử thay đổi. Không cộng 4 số thành tổng duy nhất vì có thể chồng lặp. Không có response time/nhân viên xử lý trong DTO; không giữ số liệu mock về hiệu suất nhân viên.

## Chuẩn bị và test thật

1. Đăng nhập CenterAdmin có org, vào Báo cáo hoạt động. Chuẩn bị VIU thuộc org có hoạt động Mobile đã đồng bộ; dữ liệu phụ thuộc retention BE.
2. Để trống ngày, đối chiếu 4 số với GET summary cùng org và token trong Swagger. 0 phải hiển thị 0.
3. Lọc một ngày có sự kiện sát 07:00 giờ Việt Nam; đối chiếu theo UTC. Lọc from > to phải báo lỗi và không gửi HTTP.
4. Bỏ một đầu ngày và test khoảng mở; thử không có hoạt động. Không coi lỗi API là số 0.
5. Có hơn10 thành viên để test trang sau. Tìm tên/email, lọc role/isActive, kiểm tra reset về trang1 và totalCount từ BE; đổi ngày báo cáo không lọc thành viên.
6. Test CenterAdmin khác org: token phía BE phải chặn truy vấn org ngoài phạm vi. DTO members không chứa organizationId nên FE không thể xác minh tenant từng dòng độc lập, phải dựa quyền handler BE.
7. Test 403/404/500/mạng: lỗi rõ ràng, nút tải lại; summary lỗi không hiện tổng cũ. Đăng xuất/đổi tài khoản không giữ báo cáo org trước.
8. Desktop và mobile375: filter wrap, bảng thành viên cuộn ngang bằng chạm hoặc focus bàn phím. Không có thao tác chỉnh sửa trong báo cáo.

## Kiểm tra và bàn giao

137 unit tests, 2 browser fixtures chọn lọc báo cáo/auth CenterAdmin, lint/build đạt; fixture không thay nghiệm thu deploy/Mobile thật. Build vẫn có cảnh báo bundle lớn vốn có. Đã rà desktop/mobile.

Đợt tiếp theo **13a — cấu hình hệ thống** theo PLAN, chỉ thực hiện khi người dùng yêu cầu. Chính sách riêng tư vẫn chờ nội dung/version; U7/Hybrid và dashboard chưa tự triển khai.
