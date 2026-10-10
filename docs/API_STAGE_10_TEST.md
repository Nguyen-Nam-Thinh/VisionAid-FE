# Đợt 10 — Gương mặt thân quen

Triển khai 2026-10-10, bàn giao 2026-10-11, BE local `f277b6a`; Swagger deploy đã có GET ảnh. FE tại `/caregiver/registry`, nhánh `feat/face-registry-stage10`. Chờ nghiệm thu BE thật, không coi fixture là kết quả FaceNet.

## Chuẩn bị

- Đăng nhập Caregiver có active link tới VIU. Muốn thêm/sửa/xóa cần `canManageRegistry=true`; Primary không tự thay quyền này.
- VIU đã tạo/liên kết ở đợt 4; account/license cho phép gọi API. Chuẩn bị ảnh test được phép sử dụng, có JPEG/PNG/WebP, dưới 10 MiB, và tối thiểu 3 ảnh khác nhau của cùng người cho thử nhận diện.
- Các API phải chạy cùng nhau: GET users + caregiver-links → GET/POST persons → GET/PUT persons/{id} → POST photos → GET ảnh binary → PATCH primary/DELETE photo → GET person/list. MinIO, AES và FaceNet do BE phụ trách; Mobile cần đồng bộ lại để test nhận diện.
- Không dùng `persons/me`, `identify` hoặc POST recognition logs từ Web. Không có MinIO/AES secrets ở FE.

## Test theo thứ tự

1. Mở Gương mặt thân quen, tìm và chọn VIU. Danh bạ rỗng hiển thị rõ; đổi VIU không còn dữ liệu/popup/ảnh của người trước. Danh sách người dùng có phân trang; danh bạ gương mặt trả mảng, tối đa 20 người.
2. Thêm người thân trong popup: tên bắt buộc ≤200 ký tự, quan hệ ≤100, ghi chú ≤1000. Lưu → reload trang vẫn có bản ghi. Thử sửa và xóa trắng quan hệ/ghi chú → reload giữ đúng nội dung.
3. Quản lý ảnh → chọn một ảnh → Tải ảnh lên. Kiểm tra Network multipart `photo` và `setAsPrimary`, không gửi vector/model. Upload từng ảnh, đợi kết quả trước ảnh tiếp theo.
4. Upload 3 ảnh. Sau mỗi lần, số ảnh và trạng thái phải khớp GET từ server. Với 3 ảnh, thử Mobile nhận diện; trạng thái Hoạt động không chứng minh FaceNet đã tạo đủ embedding.
5. Đóng popup rồi mở lại/reload trang: ảnh vẫn xem được qua GET có Authorization Bearer, không gọi `.enc` hoặc storagePath trực tiếp. Kiểm tra PNG/WebP hiển thị đúng dù bản BE hiện trả MIME JPEG.
6. Chọn ảnh chính → reload chỉ có đúng một ảnh chính. Xóa ảnh chính → server chọn ảnh thay thế. Xóa từ 3 còn 2 → trạng thái chuyển Chưa hoạt động theo BE.
7. Xóa ảnh/người luôn qua popup xác nhận. Hủy không gửi DELETE. BE trả lỗi thì giữ dữ liệu, có thông báo; tải lại trước khi thử lại nếu không rõ kết quả.
8. Dùng link chỉ xem: xem danh bạ/chi tiết/ảnh, không có upload/sửa/xóa. Thu hồi quyền trong lúc popup đang mở: lần ghi tiếp theo bị chặn, không dựa vào quyền cache. Unlink → tải lại phải 403 và không giữ gallery.
9. Thử ảnh rỗng, >10 MiB, SVG/HTML đổi đuôi PNG: bị chặn. Thử mất mạng/upload500: có lỗi, không tự POST lần hai. Tải lại để xác minh ảnh có được lưu trước khi gửi lại. GET ảnh403/404/500 phải có lỗi và nút thử lại, không hiện ảnh giả.
10. Logout lúc ảnh đang tải → ảnh không xuất hiện lại; login tài khoản khác không thấy ảnh cũ. License402 giữ phiên và hiển thị lỗi; không tự gửi lại thao tác ghi.
11. Desktop/tablet/mobile375: popup giữa viewport, nội dung cuộn, các nút không tràn; Escape/Đóng trả về danh sách. Trong lúc upload không đóng popup hoặc nhấn gửi lần hai.

## Bằng chứng tự động

- 122 unit tests: contract/payload, quyền đọc/ghi, chống sai VIU/person/photo, stripping vector/path, signature/size, không retry mutation, binary401 refresh/no-store, discard response sau logout.
- 4 Playwright fixture tests chọn lọc: đợt10 CRUD/upload3ảnh/primary/delete failure/revoked permission/revoke blob URL, auth Caregiver, 2 luồng địa điểm đợt9.
- Lint/build đạt. Đã xem screenshot popup desktop và mobile375; ảnh thử là PNG 1 pixel, không dùng ảnh người thật. Build còn cảnh báo chunk >500 kB như trước.

## Giới hạn và bàn giao

- Chưa upload ảnh người thật, chưa nghiệm thu MinIO/AES/FaceNet/Mobile trên deploy. Người dùng test checklist trên rồi phản hồi bước lỗi, HTTP status và response đã che thông tin riêng tư.
- BE hardcode MIME JPEG; FE sửa type theo chữ ký JPEG/PNG/WebP và để trình duyệt decode, không xác minh AI/chất lượng ảnh. BE nên trả Content-Type đúng.
- Upload một ảnh/lần; không có batch, crop hoặc nhận diện trực tiếp trên Web. Không tự tạo embeddings/quality scores.
- Nội dung/version chính sách vẫn chờ theo yêu cầu trước đó; không giả consent, không gọi accept-privacy-policy.
- Tổng 89/144 operations có caller Web; xem api.txt và OPENAPI_2026-10-10.md. Đợt kế tiếp 11b — TTS chỉ khi người dùng yêu cầu.
