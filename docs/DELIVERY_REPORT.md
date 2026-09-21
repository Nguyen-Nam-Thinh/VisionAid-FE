# VisionAid FE — bàn giao bản demo

Ngày kiểm tra: 2026-09-21. Phạm vi: Web FE cho ba vai trò; không sửa BE/Mobile. Tất cả chức năng trong [checklist](IMPLEMENTATION_CHECKLIST.md) có implementation mock. README có hướng dẫn chạy và tài khoản.

## Kết quả kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| TypeScript / ESLint | Pass |
| Vitest | 28 tests / 7 files pass |
| Playwright trên Microsoft Edge | 11 tests pass |
| Vite production build | Pass; route và QR decoder tải riêng |
| Responsive | 1440 px workflows, 1024 px toàn bộ 25 role routes, 390 px navigation/reset |
| JavaScript errors / overflow | Không có page errors hoặc document overflow trong route smoke tests |
| Accessibility | Axe không phát hiện vi phạm ở login/dashboard/contact dialog; có kiểm tra focus/validation/Escape |
| API mode | Kiểm tra thủ công báo thiếu contract, không có demo selector/fallback; unit test fail-closed |

Các lệnh: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run test:e2e`, `npm.cmd run build`. Node 24.14.1, npm 11.11.0. Build chính khoảng 480 kB / 151 kB gzip; QR decoder khoảng 131 kB tải khi cần. Không đặt mục tiêu coverage phần trăm hoặc tuyên bố đạt chứng nhận WCAG.

Đã sửa các lỗi phát hiện khi chạy luồng: session observer bị mất sau logout/reset; accessible name của form; restore focus; rollback khi lưu demo thất bại; guard vai trò không hỗ trợ; cleanup timer/reconnect. Tất cả đều nằm trong lịch sử Git và các test phù hợp.

## Git và tổ chức công việc

Mỗi chức năng được tách nhánh, commit và push; các phần đã kiểm tra merge thông thường vào dev. Không force-push, không merge main, không tạo PR. Nhánh tài liệu bàn giao: `docs/frontend-handoff`; nhánh sửa cuối: `fix/mock-state-integrity` (commit `5410420`, merge `e4f0cbd`). Commit cuối của tài liệu và merge xem `git log -5 --oneline dev` để tránh ghi hash tự tham chiếu.

Các nhánh implementation đã tích hợp:

```text
feat/app-shell                  feat/domain-services
feat/auth-pages                 feat/caregiver-linked-users
feat/live-map                   feat/caregiver-alerts
feat/face-registry              feat/saved-locations
feat/emergency-contacts         feat/caregiver-permissions
feat/activity-history           feat/notification-preferences
feat/tts-preferences            feat/center-organization
feat/center-staff               feat/center-vius
feat/center-assignments         feat/center-fleet-map
feat/center-reports             feat/center-routing
feat/admin-organizations        feat/admin-accounts
feat/admin-linkage              feat/system-configurations
feat/global-notification-rules  feat/ai-metrics
feat/delivery-monitoring        feat/audit-logs
feat/role-dashboards            feat/qr-image-linking
fix/frontend-flow-verification  fix/mock-state-integrity
refactor/route-loading
```

## Giới hạn bàn giao

- Đây là demo có dữ liệu local và các thao tác nghiệp vụ hoạt động; authorization thật phải ở BE. Không dùng dữ liệu cá nhân hoặc mật khẩu thật trong mock storage.
- REST DTOs/endpoints, JWT refresh, SignalR, FCM, Mapbox, upload MinIO, mã hóa ảnh, email và mobile sync chưa tích hợp. API mode cố ý báo thiếu contract thay vì giả thành công.
- Bản đồ là sơ đồ; GPS/realtime/SOS/delivery mô phỏng. QR đọc file ảnh, chưa có camera trực tiếp. TTS chỉ lưu cấu hình demo.
- Một tab/trình duyệt; không bảo đảm multi-tab/multi-device persistence. Browser storage có quota; 2 MB/ảnh là giới hạn demo.
- E2E kiểm tra các luồng chính và render tất cả role routes, không bao phủ mọi tổ hợp action. Chưa kiểm tra Safari/Firefox, screen reader đầy đủ hoặc tải production.

Việc còn lại để nối hệ thống thật được tách rõ tại [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md). Không cần thay cấu trúc UI chỉ để chuyển mode; cần triển khai adapter/DTO và xác minh quyền, session, subscription bằng contract BE thực tế.
