# U8b — Dashboard theo vai trò

Ngày 2026-10-12. Đây là checkpoint UI dùng các API đã có; không thêm endpoint dashboard mới.

## Đã nối

- Caregiver cá nhân: `GET /api/licenses/subscription`, `GET /api/payments/history?page=1&pageSize=10`.
- CenterAdmin có tổ chức: `GET /api/licenses/pool`, payment history cùng giới hạn 10 bản ghi.
- Caregiver thuộc tổ chức: chỉ hiển thị phạm vi chăm sóc và gọi emergency theo quyền tổ chức; không gọi billing cá nhân.
- Caregiver/CenterAdmin: emergency được đếm riêng theo `Sent`, `Acknowledged`, `Escalated` bằng `totalCount`; không cộng các snapshot thành một số tổng.
- Admin: `GET /api/notifications/status`, hiển thị thống kê 24 giờ và ghi rõ “đã gửi” không có nghĩa người nhận đã đọc.

## Cách test với BE thật

Đăng nhập từng role và mở `/dashboard`. Với Caregiver cá nhân kiểm tra license, hết hạn/trial và lịch sử thanh toán; với CenterAdmin kiểm tra đúng `organizationId`, tổng/đã cấp/còn lại của pool; với Staff Caregiver xác nhận không có request subscription/payment và chỉ thấy VIU được phân công; với Admin kiểm tra số liệu delivery.

Tạo emergency ở các trạng thái Sent/Acknowledged/Escalated, tải lại dashboard và xác nhận từng ô đổi độc lập. Khi có SignalR alert, dashboard phải invalidate các ô tương ứng. Tạo hơn 10 payment records và xác nhận UI gọi trang đầu, ghi rõ giao dịch cũ chưa được xét; UI không được gọi checkout hay mutation.

## Giới hạn cần ghi nhận khi nghiệm thu

- API emergency không có endpoint count tổng nguyên tử, nên ba trạng thái có thể thay đổi giữa các request.
- API payment chưa có bộ lọc `status=Pending`; “đang chờ” chỉ là các record Pending trong 10 giao dịch mới nhất, không phải tổng lịch sử.
- Fixture E2E, lint, build và unit test không thay thế test BE thật, phân quyền organization, SignalR, payment webhook hoặc dữ liệu Mobile.

## Bằng chứng tự động

U8b fixture E2E kiểm tra bốn phạm vi role, số 0 hợp lệ, lỗi riêng từng nhóm, không gọi dữ liệu GPS/face ngoài phạm vi và responsive 375px. Unit suite hiện có 156 test; lint/build đạt. Cần người dùng test live trước khi đánh dấu nghiệm thu U8b.
