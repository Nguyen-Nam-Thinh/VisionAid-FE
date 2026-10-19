# Organic UI/UX — 2026-10-05

- Nhánh riêng: refactor/organic-ui-ux, base dev a70d8f4. Không merge/push dev hoặc main theo yêu cầu hiện tại.
- Dùng ui-ux-pro-max và prompt Organic/Natural của người dùng. DESIGN.md theo cấu trúc spec.md là nguồn thiết kế; màu, font và trạng thái dùng chung ở src/styles/theme/index.css.
- Phạm vi: landing/menu mobile, auth, sidebar, dashboard mock/API, bảng, form, button, badge, modal và state dùng chung. Giữ luồng/API/RBAC hiện tại, không triển khai đợt U3b.
- Giữ các cải tiến layout local có sẵn ở theme/landing, đổi phần trình bày theo thiết kế mới. Thay đổi có sẵn src/services/api/auth.ts không thuộc commit này.
- Kiểm tra: build và lint pass; 4 E2E landing/auth/accessibility pass (axe, 375/768/1024/1440px); 7 E2E API layout/U3a pass. Kiểm tra thêm modal 375/768px, căn giữa và reduced-motion bằng Playwright; đã xem screenshot landing/login/dashboard/modal.
- Đây là kiểm tra UI với fixture/demo. Không nghiệm thu API live/PayOS thật; không khẳng định toàn bộ ứng dụng đạt WCAG. Build vẫn có cảnh báo chunk JS >500kB.
- Không thêm thư viện UI/animation. Thêm font Fraunces/Nunito bundle local; không cần tải font từ dịch vụ bên ngoài khi mở trang.
