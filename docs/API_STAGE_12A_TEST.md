# Đợt 12a — Lịch sử hoạt động của người được chăm sóc

Ngày: 2026-10-11. FE dựa trên BE local f277b6a, controller + DTO + handler. Đã có caller thật; kiểm thử tự động dùng fixture, chưa nghiệm thu BE deploy/Mobile.

## Phạm vi và điểm tiếp tục

- Caregiver vào **Nhật ký hoạt động** ở sidebar hoặc `/caregiver/activity`.
- Chọn VIU đang liên kết; xem 5 loại lịch sử, lọc ngày, phân trang và popup chi tiết.
- Chỉ đọc 11 REST operations, tổng Web hiện tại **102/144**. Không tạo hoạt động giả hoặc gửi POST dành cho Mobile.
- Tiếp theo là **12b — báo cáo tổ chức** khi người dùng yêu cầu. Chính sách riêng tư vẫn chờ nội dung/version, không tự triển khai.

## API và phụ thuộc

| Loại | Danh sách | Chi tiết / phụ thuộc |
|---|---|---|
| Di chuyển | GET `/api/navigation/sessions` | GET `/{id}` và GET `/{id}/events` |
| Đọc chữ | GET `/api/ocr/requests` | GET `/{id}` |
| Quét QR | GET `/api/ocr/qr-scans` | GET `/{id}` |
| Nhận diện | GET `/api/face-registry/recognition-logs` | GET `/{id}` |
| Giọng nói | GET `/api/voice-commands` | GET `/{id}` |

Đường dẫn chi tiết nối vào đường dẫn danh sách cùng hàng. Selector dùng GET users, xác minh quyền dùng GET caregiver-links với caregiverId + viuId + isActive. Các API này đã tích hợp trước 12a, không đếm thêm.

Nhận diện lọc `viuId`; bốn loại còn lại lọc `userId`. Tất cả dùng `page/pageSize=20`, `dateFrom/dateTo` tùy chọn. Ngày UI chuyển UTC+7 đầu ngày và cuối ngày 23:59:59.999 sang UTC. List mới nhất trước: StartedAt / RequestedAt / ScannedAt / RecognizedAt / ExecutedAt tương ứng. Events cũ nhất trước, phân trang riêng, đọc toàn phiên không áp lại bộ lọc ngày của list phiên.

Tất cả yêu cầu Caregiver active link, không cần primary hoặc các cờ ghi registry/locations. Handler BE vẫn là nơi thực thi quyền. FE kiểm tra owner của mọi DTO; events kiểm tra thêm sessionId và xác minh owner phiên trước khi đọc. Chi tiết kiểm tra đúng id. Query key có actor/org/VIU/type/filter/page, bỏ cache lịch sử khi không dùng, truyền AbortSignal và refetch 30 giây khi đang xem. Lỗi đọc không biến thành mảng rỗng.

## Chuẩn bị test thật

1. Đăng nhập Caregiver có liên kết đang hoạt động với VIU có dữ liệu Mobile. Cần license hợp lệ hoặc org coverage theo BE.
2. Trên Mobile tạo phiên di chuyển kèm phát hiện, yêu cầu OCR, quét QR, nhận diện và lệnh giọng nói. Chờ Mobile đồng bộ lên BE. Nếu chưa có Mobile/data, chỉ nghiệm thu được empty/error states, không kết luận đủ 5 luồng.
3. Chuẩn bị hơn 20 bản ghi hoặc phiên hơn 20 phát hiện để test trang sau. Không dùng thao tác quản trị ghi dữ liệu ngoài phạm vi tài khoản test được phép.

## Checklist người dùng

- [ ] Mở từ sidebar, chọn đúng VIU; đổi người hoặc tìm kiếm không giữ dữ liệu người trước.
- [ ] Đổi cả 5 loại; danh sách và tổng số khớp Swagger với cùng userId/viuId và bộ lọc.
- [ ] Lọc một ngày có hoạt động sát 00:00 và 23:59 giờ Việt Nam. Khoảng ngày đảo ngược báo lỗi, không gửi request mới.
- [ ] Trang trước/sau giữ loại, người và ngày. Tổng số lấy từ BE, không cộng trang đầu của nhiều loại.
- [ ] Chi tiết mở giữa màn hình, cuộn được trên mobile375; Escape/đóng trả về danh sách.
- [ ] Phiên di chuyển có số phát hiện/cảnh báo, thời gian kết thúc nullable; events phân trang riêng đúng session.
- [ ] OCR hiển thị raw/processed text; QR chỉ hiện nội dung, không tự mở URL. Chuỗi giống HTML không được thực thi.
- [ ] Nhận diện không khớp vẫn hiện bản ghi; tên/score thiếu hiện “Chưa có”. Voice score=0 hiển thị 0%, offline hiển thị đúng.
- [ ] Không có ảnh công khai từ imageStoragePath, không có phát âm thanh giả hoặc suy đoán tọa độ khi null.
- [ ] Gỡ liên kết ở phiên khác: lần tải lại/mở chi tiết tiếp theo bị chặn. Kiểm tra 402, 403, 404 và lỗi mạng hiển thị lỗi, không giả “không có lịch sử”.
- [ ] Đăng xuất/đăng nhập tài khoản khác không thấy cache lịch sử cũ; CenterAdmin/Admin không truy cập route Caregiver.

## Đã kiểm tra tự động

- Unit: schema/owner/id, nhầm phiên, nullable/zero, bỏ storage path, quyền active link, ngày UTC+7, phân trang, 402/403/404/500 và abort. Toàn bộ 135 tests đạt.
- Browser fixture: 5 loại, list/detail, pagination list/events, ngày, popup desktop/mobile, nội dung không thực thi, mất quyền và sai owner; hồi quy auth Caregiver.
- Lint và build. Build còn cảnh báo bundle lớn vốn có.

## Giới hạn

Không nghiệm thu dữ liệu BE/Mobile thật trong đợt này. Lịch sử phụ thuộc thời hạn lưu trữ trên BE; một danh sách rỗng không chứng minh không có hoạt động. Không tổng hợp một timeline giả từ 5 trang đầu. Chưa nối navigation guidance logs mới, không xuất dữ liệu, không dựng đường đi từ detection events và không đọc ảnh OCR bằng storage path. Bộ lọc nâng cao riêng từng engine/status chưa đưa vào UI; phạm vi hiện tại là loại + ngày + người.
