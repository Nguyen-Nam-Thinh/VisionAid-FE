# U8a — Landing và nội dung sản phẩm

Ngày 2026-10-12. Checkpoint đầu của U8; U8b dashboard dữ liệu thật chưa triển khai.

## Phạm vi

- Trang `/`, `src/pages/public/Landing.tsx`, giữ hệ thống Organic trong DESIGN.md và bố cục hiện có.
- Giới thiệu Personal cho gia đình, Business cho trung tâm và Standalone là mô hình trong tổ chức, không phải role/gói riêng.
- Giải thích Hybrid xử lý gần trên thiết bị, trung bình/xa qua máy chủ khi kết nối và tính năng được bật; gọi âm thanh/video phụ thuộc quyền và thiết bị. Ghi rõ đang kiểm thử liên thông, không tuyên bố đã nghiệm thu Mobile/AI/cuộc gọi.
- Bổ sung yêu cầu đai đeo ngực theo báo cáo dự án, điểm mù camera/thiếu sáng/mưa, tiếp tục dùng gậy trắng và thiết bị hỗ trợ phù hợp. Không đưa ra cam kết an toàn hoặc thay thế dụng cụ hỗ trợ.
- CTA xem gói đi đến đăng nhập. BE local f277b6a: LicensePackagesController có [Authorize], chưa có API giá công khai. Không thêm fetch bảo vệ khi chưa đăng nhập, không hardcode giá/quota/trial, không checkout công khai.
- Footer phân biệt mock và api mode; API không bị ghi nhầm là dữ liệu mô phỏng. Minh họa điện thoại vẫn có chú thích minh họa.
- Không thêm REST operation: vẫn **117/144**. Không thay authentication, dashboard hoặc hành vi thanh toán.

## Checklist

1. Chưa đăng nhập, mở `/`: nội dung Hybrid, Personal/Business/Standalone và chuẩn bị hành trình hiện đầy đủ; không có giá/gói giả hoặc cam kết mọi tính năng đã sẵn sàng.
2. Bắt đầu đồng hành/Tạo tài khoản đi đến đăng ký Caregiver; Đăng nhập để xem gói đi đến login. Sau đăng nhập dùng menu Gói dịch vụ để xem giá/feature flags từ BE theo quyền.
3. Trong Network, landing không gọi packages/payments/guidance được bảo vệ. Không xin quyền micro/camera/thông báo hoặc tự mở checkout.
4. Footer mock ghi dữ liệu mô phỏng; API ghi bản thử nghiệm và kiểm thử liên thông.
5. Desktop1440, tablet1024/768, mobile375 không tràn ngang; menu mobile đóng khi chọn liên kết, anchor đến đúng section. Kiểm tra bàn phím, focus và khả năng đọc.

## Bằng chứng

Ba E2E đã đạt: hai test landing mock gồm điều hướng/auth và axe ở 4 kích thước; một test API mode kiểm tra footer và không gọi API bảo vệ. Lint/build đạt, còn cảnh báo bundle lớn có sẵn. Đã rà ảnh desktop/mobile. Không chạy lại unit suite vì đợt này chỉ cập nhật nội dung và nhánh hiển thị mode đã được E2E kiểm tra. Không chạy test liên thông Mobile/AI/BE thật trong checkpoint nội dung này.

Tiếp theo **U8b — dashboard theo role**: tái sử dụng API authoritative cho trạng thái license/pool, cảnh báo và payment pending; không lấy số tổng từ trang đầu. Staff không hiện billing cá nhân. Chỉ chuyển sang U9 sau U8b, không coi U8a là hoàn thành toàn bộ U8.
