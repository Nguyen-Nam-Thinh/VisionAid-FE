# Backend integration handoff

## Trạng thái hiện tại

Release này triển khai Web bằng mock. `VisionService` trong `src/services/contracts.ts` là interface nghiệp vụ nội bộ FE; `Command`, `Person`, `Snapshot` không phải REST DTO. Không gửi nguyên các model này lên BE. `models/dto/README.md` ghi rõ ranh giới đó.

`services/index.ts` chọn mode một lần từ cấu hình build. Giá trị không hợp lệ bị từ chối. API adapter hiện báo 501 khi contract chưa được triển khai; không dùng seed làm fallback, không bịa endpoint, cookie hoặc SignalR payload.

## Cấu hình

| Biến | Hiện tại | Cần khi tích hợp |
|---|---|---|
| VITE_SERVICE_MODE | mock hoặc api | Chọn api sau khi adapter có contract thật |
| VITE_API_BASE_URL | Đọc vào runtime, adapter chưa gọi API | Public base URL và CORS |
| VITE_SIGNALR_URL | Dự phòng | Hub URL, auth, subscription/event contract |
| VITE_MAPBOX_PUBLIC_TOKEN | Dự phòng, chưa khởi tạo SDK | Public token giới hạn origin/scope và style |

Chưa có cấu hình Firebase vì chưa có project/VAPID/token registration contract. Không thêm Firebase Admin credentials vào FE. Biến Vite được chèn khi build, không tự đổi theo môi trường của static host.

## Ma trận tích hợp

| Nhóm | Mock đang làm | Contract cần xác nhận |
|---|---|---|
| Auth/profile | Session local, register/recovery/reset/password/avatar | Request/response, JSON casing, JWT claims, cookies, refresh rotation, revoke/device ID, avatar upload |
| Users/organizations | CRUD/status/reset theo role và org | Endpoints, role enum, pagination, filters, status transition, validation |
| Caregiver links/QR | Quota, primary transfer, flags, invitation một lần/10 phút | Atomic reassignment, invite format/expiry, QR exchange, permission revocation |
| Locations/geofences | Tọa độ, radius, enter/exit, schematic preview | DTO [lng,lat], search, geocoding, bounds, server limits |
| Emergency | State machine và history/version conflict | Allowed actions, version/ETag, snapshot authorization, timestamp, 409 payload |
| Face registry | Nhiều ảnh, primary, >=3 active, delete confirmation | Multipart/presigned flow, MIME/size/count, authorized image URLs, delete MinIO-before-DB behavior |
| Contacts/TTS/preferences | Validation, mandatory channel, remote settings demo | Types, limits, priorities, voices, mobile sync status, resolved effective rules |
| History/reports | Local filtering và aggregates trên seed | Date range/timezone, server pagination, retention/media cleanup, report aggregation |
| Config/rules | Revision history, rollback, org override | Typed schema/min/max, concurrency, rollback audit, rule resolution ở BE |
| Metrics/audit/delivery | Chỉ đọc, filter, aggregate AI | Model/version units, weighted aggregates, actor scope, delivery enums, pagination |
| SignalR | Tick 15s, disconnect/reconnect/refetch, cleanup | Event ID/version, payload, subscribe/unsubscribe, auth and group policy |
| FCM | Browser permission theo nút bấm, denied/unsupported | SDK config, service worker, token registration/rotation/revoke, dedup với SignalR |
| Mapbox | Sơ đồ tọa độ + bảng tương đương | SDK/style/token, failed-load state, attribution, coordinate mapping |

Các endpoint/hub được mô tả trong tài liệu nguồn vẫn phải đối chiếu OpenAPI/implementation. Không suy ra subpath từ tên bảng DB. Không coi Mapbox token hay URL đơn lẻ là đủ contract cho toàn bộ tính năng.

## State, cache và lifecycle

- Mock trả một snapshot đã lọc theo quyền. Query key gồm user và organization; chọn VIU/filter là phép lọc local trong snapshot đó. UI store không giữ bản sao dữ liệu nghiệp vụ.
- Khi tách sang truy vấn resource thật, key phải thêm VIU/filter/page, truyền AbortSignal và tránh response cũ ghi lên scope mới. Server phải tự xác định tenant từ session.
- Logout thay session query, xóa các query còn lại và selection; subscription hủy khi unmount. Không dùng `queryClient.clear()` làm mất session observer đang hoạt động.
- Session 401/403 đưa về trạng thái chưa đăng nhập; unknown role bị chặn. Các thao tác quyền/ảnh/cảnh báo không optimistic. Conflict 409 refetch trước khi tiếp tục.
- Mock realtime refetch sau reconnect và hủy timer khi cleanup. `acceptVersion` là helper kiểm tra version, chưa phải event pipeline SignalR thực tế.

## HTTP và auth cần hoàn thiện

Transport hiện hỗ trợ URL rõ ràng, cancellation, 204 không parse JSON, lỗi Problem Details và lỗi response JSON hỏng. Không có endpoint tự suy đoán hoặc retry ghi tự động.

Sau khi có contract: thêm DTO mappers, wrapper/pagination mapping, field validation mapping; single-flight refresh và chính sách memory/cookie theo BE; CORS/CSRF khi cookie cross-origin; Retry-After cho 429; xử lý revoke/logout nhiều tab. Không lưu refresh token dài hạn theo giả định. Cần test bằng BE thật cho các mục này.

## Trình tự nối BE

1. Thu thập OpenAPI và ví dụ success/error/204/409, role claims, upload và realtime contracts; giải quyết các khác biệt tại mục 13 của CLAUDE.md.
2. Triển khai auth/session và DTO mapping ở adapter; thêm contract tests, xác minh permission ở server.
3. Nối từng resource, thay snapshot bằng query phù hợp; kiểm tra org khác, unlinked/deactivated user và thay đổi quyền khi đang mở trang.
4. Nối ảnh, maps, SignalR và FCM với cleanup/dedup/reconnect. Không bật subscription không được BE cấp quyền.
5. Kiểm tra emergency concurrency, stale GPS, upload/delete lỗi, token rotation, offline, delivery và timezone trên staging.
6. Build API mode với cấu hình public; host HTTPS/SPA fallback; kiểm tra refresh deep-link và không có mock fallback trước khi phát hành.

Không có AES key, MinIO credentials, DB URL hoặc SMTP password trong FE. Browser demo storage không mã hóa; chỉ dùng dữ liệu thử. Retention và xóa media thuộc BE, không chạy cleanup job trong trình duyệt.
