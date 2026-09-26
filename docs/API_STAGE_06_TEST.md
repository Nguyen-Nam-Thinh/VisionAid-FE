# Đợt 6 — Test GPS live và lịch sử

## Chuẩn bị

Chạy `npm.cmd run dev`, mở http://localhost:5173 trong API mode. Dùng Caregiver có active link với VIU hoặc CenterAdmin có VIU cùng tổ chức. Quyền đọc không yêu cầu canManageLocations. Admin không có quyền API GPS.

Cần Mobile đã gửi GPS cho VIU để có dữ liệu. Web đợt này chỉ GET, không POST /api/locations/gps. Có thể có lịch sử nhưng live cache đã hết/mất. Không cần Mapbox token để test tọa độ và lịch sử; bản đồ nền chưa triển khai do chưa có token. Không có SignalR, vị trí tải lại mỗi 30 giây khi tab hoạt động.

## Thứ tự và checklist

1. Đăng nhập -> /caregiver/map hoặc /center-admin/map. GET /users lấy VIU được phép; CenterAdmin gửi organizationId của phiên và role VisuallyImpaired. Kiểm tra không xuất hiện VIU khác scope. Thử tìm kiếm và phân trang người dùng.
2. Mỗi VIU trên trang gọi GET /locations/live?viuId=... (tối đa 10 người/trang). So sánh tọa độ/địa chỉ với BE. Nhấn Tải lại vị trí. Lỗi từng người không làm mất toàn bộ danh sách.
3. Kiểm tra nhãn dữ liệu cũ khi cachedAt quá 2 phút. cachedAt là lúc thiết bị ghi GPS; updatedAt là lúc server cập nhật. Upload offline có thể làm điểm cache cũ hơn lịch sử mới nhất; nhãn độ mới không khẳng định thiết bị online/offline.
4. Chọn Vị trí & lịch sử -> GET /locations/history?viuId=...&page=1&pageSize=20. Kiểm tra null hiện Không có dữ liệu, số 0 vẫn hiện 0 (pin/tốc độ/tọa độ), độ cao âm hợp lệ. Mạng/pin là tại bản ghi lịch sử, live không trả các trường này.
5. Chọn từ/đến thời gian, lọc. Input dùng múi giờ trình duyệt được ghi trên màn hình; request gửi ISO UTC. BE lấy cả hai biên. Đến trước từ báo lỗi và không gửi query sai. Chuyển trang lịch sử; đổi người/tìm kiếm/trang người dùng không trộn dữ liệu.
6. Live 404 hiện chưa có vị trí, vẫn xem được lịch sử. 403 sau khi gỡ liên kết/đổi scope phải ẩn tọa độ và lịch sử ở lần tải lại; không fallback dữ liệu demo. Lỗi server có nút thử lại. Kiểm tra logout/login người khác không giữ dữ liệu trước.
7. Xác nhận Network không có POST /locations/gps từ Web. Không kỳ vọng bản đồ nền hoặc realtime ở bản này.

## Bằng chứng tự động

64 unit tests / 13 files pass; build và lint pass. Build có cảnh báo chunk >500 kB (khoảng 576 kB). Playwright: 19 case cũ pass trong lần chạy toàn bộ; 2 case GPS mới pass khi chạy lại sau sửa assertion (cho phép GET refetch cùng tham số, vẫn cấm gửi range không hợp lệ). Không thay thế test BE thật.

Chưa có tài khoản để nghiệm thu BE thật. Khi test lỗi, gửi endpoint/status/response (ẩn token) và role/VIU đang chọn. Sau checkpoint này mới làm đợt 7 theo yêu cầu.
