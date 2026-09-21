# VisionAid Web Frontend

Dashboard tiếng Việt cho Caregiver, Center Admin và Super Admin, dùng React + TypeScript + Vite và giao diện glassmorphism. Bản hiện tại chạy độc lập bằng dữ liệu demo, có CRUD, phân quyền và các luồng nghiệp vụ; chưa kết nối backend hoặc dịch vụ bên ngoài.

## Chạy ứng dụng

Đã kiểm tra với Node.js 24.14.1 và npm 11.11.0. Cài dependency theo lockfile:

```powershell
npm.cmd ci
npm.cmd run dev
```

Mở http://127.0.0.1:5173. Trên shell khác có thể dùng `npm` thay `npm.cmd`; dùng `.cmd` trên PowerShell nếu execution policy chặn `npm.ps1`. Không cần đổi execution policy.

Mặc định là `mock`, không cần `.env`. Nếu cần cấu hình, sao chép `.env.example` thành `.env.local`. Biến `VITE_*` là dữ liệu public trong bản build, không chứa secret.

Trang chủ công khai ở `/` giới thiệu VisionAid, tính năng và cách bắt đầu. Đăng nhập/đăng ký thành công chuyển đến `/dashboard` có bảo vệ phiên. Các đường dẫn nghiệp vụ theo vai trò giữ nguyên; trang đăng nhập có liên kết quay về trang chủ.

## Tài khoản demo

Mật khẩu ban đầu: `Demo@123`. Có thể chọn nhanh tài khoản trên màn hình đăng nhập.

| Email | Vai trò / phạm vi |
|---|---|
| caregiver@demo.vn | Caregiver gia đình, primary |
| secondary@demo.vn | Secondary, một số quyền sửa bị tắt |
| center@demo.vn | Center Admin của tổ chức mẫu |
| staff@demo.vn | Caregiver được phân công trong tổ chức |
| nam@demo.vn | Caregiver khác trong cùng tổ chức |
| admin@demo.vn | Super Admin, không được xem GPS/ảnh khuôn mặt |

Dữ liệu lưu ở localStorage của trình duyệt, gồm cả thông tin đăng nhập demo và ảnh upload. Chỉ dùng dữ liệu giả, không dùng mật khẩu thật hoặc ảnh cá nhân thật. Nút **Reset demo** có xác nhận, khôi phục dữ liệu ban đầu và đăng xuất. Demo dành cho một tab, không bảo đảm đồng bộ nhiều tab/thiết bị. Khi đầy bộ nhớ, thao tác báo lỗi và giữ dữ liệu trước đó.

## Chức năng

- **Chung:** đăng nhập, đăng ký Caregiver, khôi phục mật khẩu demo, hồ sơ/avatar, đổi mật khẩu, logout, guard và trang lỗi.
- **Caregiver:** liên kết VIU bằng mã/ảnh QR, tạo VIU, bản đồ sơ đồ, cảnh báo và lịch sử xử lý, face registry, địa điểm/geofence, liên hệ khẩn cấp, secondary permissions, lịch sử hoạt động, notification preferences và TTS.
- **Center Admin:** hồ sơ tổ chức, staff/VIU, phân công, fleet map, báo cáo, notification routing trong tổ chức.
- **Super Admin:** tổ chức, tài khoản/liên kết, AI metrics tổng hợp, cấu hình/history/rollback, rules, delivery logs và audit logs.

Chi tiết hành động, quyền và bằng chứng kiểm tra: [Implementation checklist](docs/IMPLEMENTATION_CHECKLIST.md).

## Kiến trúc mã nguồn

`app → pages → components/hooks → services`; `models`, `constants`, `configs` dùng chung. TanStack Query giữ dữ liệu truy vấn; `stores/ui.ts` chỉ giữ selection/thông báo UI. Forms dùng React Hook Form + Zod. Theme và responsive CSS nằm ở `src/styles/theme/index.css`; Tailwind được cấu hình qua Vite. Các trang nghiệp vụ và QR decoder tải theo nhu cầu.

`services/index.ts` chọn adapter duy nhất. `mocks/` chứa dữ liệu và quy tắc demo; `api/` là ranh giới tích hợp chưa có contract. Chọn `VITE_SERVICE_MODE=api` sẽ báo thiếu contract (501), **không chuyển ngầm sang mock**. Đặt URL/token chưa đủ để bật tích hợp thật.

## Kiểm tra và build

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

E2E dùng Microsoft Edge đã cài, chạy headless qua Playwright, tự khởi động Vite tại port 5173. Nếu dùng máy khác, cài Edge hoặc cấu hình browser phù hợp trong `playwright.config.ts`. Báo cáo nằm ở `playwright-report/`; trace lỗi ở `test-results/`. Không commit các thư mục này.

Nếu Windows bị kẹt ở bước đóng web server sau khi test xong, mở `npm.cmd run dev` trong terminal riêng rồi chạy E2E ở terminal thứ hai. Playwright sẽ dùng server đang có; đóng terminal Vite sau khi kiểm tra.

Build tạo `dist/`. Host SPA cần fallback route về `index.html`, phục vụ HTTPS và cấu hình cache phù hợp. Đây là bản demo, chưa phải bản tích hợp production.

## Giới hạn và tài liệu

Bản đồ là sơ đồ tọa độ, không có đường thật/Mapbox. GPS, reconnect, SOS và delivery là mô phỏng. Chưa có SignalR/FCM, email thật, MinIO/mã hóa ảnh, JWT refresh hoặc đồng bộ TTS với Mobile. Upload demo giới hạn 2 MB/ảnh; QR hỗ trợ ảnh PNG/JPG, không có camera trực tiếp. Quyền FE giúp kiểm tra UX, không thay thế authorization của BE.

- [Hướng dẫn dự án cho agent](CLAUDE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Ranh giới và việc cần làm khi tích hợp BE](docs/BACKEND_INTEGRATION.md)
- [Báo cáo bàn giao và kiểm thử](docs/DELIVERY_REPORT.md)
