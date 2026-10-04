# U3a — Kiểm thử thanh toán Personal

Cập nhật 2026-10-04. Đã triển khai FE; CHƯA nghiệm thu BE/PayOS thật. Người dùng yêu cầu tiếp U3a khi U1/U2 còn chờ test live. Chưa biết PayOS đang thử nghiệm hay thanh toán thật: kiểm thử tự động chỉ dùng fixture, không chuyển tiền hoặc gọi webhook.

## Phạm vi và API

- Caregiver cá nhân (không organizationId): `/packages` chọn gói Personal, tạo đơn trong popup; `/caregiver/payments` xem lịch sử phân trang.
- POST `/api/payments/create-link`: chỉ gửi packageId, returnUrl, cancelUrl. Giá và loại mua mới/gia hạn do BE quyết định. Kiểm tra lại gói active/giá trước POST; chặn nhấn đôi, không tự retry POST.
- GET `/api/payments/history`: danh sách và tra trạng thái theo payosOrderId trong lịch sử của chính tài khoản.
- DELETE `/api/payments/{id}/cancel`: kiểm tra lại Pending/đơn thuộc lịch sử tài khoản và yêu cầu xác nhận trong popup.
- `/payments/return` và `/payments/cancel`: chỉ đọc orderCode hợp lệ, không tin status=PAID/cancel=true. Nếu cần đăng nhập, quay lại đúng đơn sau đăng nhập (kể cả reload trang login).
- Success từ BE mới refetch `/api/users/me` và `/api/licenses/subscription`. Hiển thị riêng trạng thái payment và subscription; không tự gán Active.
- Staff/CenterAdmin/Admin không sử dụng luồng Personal. Business/pool thuộc U3b.

## Chuẩn bị test live

1. Checkout bản dev này; dùng API HTTPS đúng môi trường. Production main vẫn do người dùng tự cập nhật.
2. Xác nhận với BE môi trường PayOS, khoản tiền được phép dùng, return/cancel URL, webhook đã cấu hình. Không chuyển tiền thật chỉ để hoàn tất checklist nếu chưa thống nhất.
3. Dùng Caregiver cá nhân và gói Personal active có giá nguyên dương bằng VND. Cần BE license middleware cho phép `/api/licenses` và `/api/payments` khi NONE/EXPIRED; nếu trả 402, ghi response cho BE, không bỏ qua license ở FE.
4. Có thể dùng Staff và tài khoản Caregiver khác để kiểm tra quyền. Không ghi token, mật khẩu hoặc dữ liệu thẻ vào báo cáo.

## Các bước và kết quả mong đợi

- [ ] Mở Gói dịch vụ, chọn Personal. Popup hiển thị giá; tạo đơn một lần. Nhấn đôi không gửi POST trùng trong lần mở popup đó.
- [ ] Giá/active bị Admin đổi trước khi tạo: FE báo tải lại gói, không gửi POST bằng dữ liệu cũ.
- [ ] Sau tạo, đọc số tiền BE trả về. Chỉ nút Tiếp tục sang PayOS mới mở cổng thanh toán; chưa hiện thanh toán thành công.
- [ ] Quay về trước webhook: Pending, có kiểm tra lại; URL thêm status=PAID không thay kết quả.
- [ ] Sau thanh toán đã được phép và webhook hợp lệ: history Success, profile/subscription đọc lại; kiểm tra license thực tế và quyền dùng tính năng. Nếu subscription còn chưa cập nhật, tải lại hoặc gửi BE kiểm tra.
- [ ] F5/đóng rồi mở lại lịch sử vẫn thấy đơn. Mở return khi chưa đăng nhập, đăng nhập xong quay về đúng orderCode.
- [ ] Quay về cancel không tự gọi DELETE. Bấm Hủy đơn, xác nhận mới hủy; BE báo Cancelled thì bỏ nút tiếp tục thanh toán.
- [ ] Đơn đã Success không hủy được. Đơn tài khoản khác không được hiển thị khi BE trả lịch sử đúng scope.
- [ ] Mất mạng/lỗi tạo: không tự gửi lại; kiểm tra lịch sử trước khi mở popup tạo đơn khác. Lỗi hủy giữ thông báo và cho tải lại.
- [ ] Pending quá 60 giây: dừng tự kiểm tra, vẫn có nút thủ công; không tự chuyển sang Failed/Expired.
- [ ] Staff không có nút mua Personal và không gọi API payment khi vào URL trực tiếp.

## Giới hạn đã biết / bàn giao AI tiếp theo

- BE chưa có GET detail/status theo ID/orderCode. `payments.ts` tra tối đa 10 trang x 100 giao dịch; vượt giới hạn báo chưa tìm được. Khi BE có endpoint detail, thay việc quét history bằng endpoint có kiểm tra ownership.
- Kiểm tra gói tối đa 20 trang x 20 bản ghi vì detail chỉ dành cho Admin. Cần BE endpoint đọc gói cho buyer nếu catalog vượt 400 gói.
- Checkout hiện giới hạn VND nguyên dương <= 2.147.483.647 phù hợp giới hạn PayOS cast int của BE. Không tự hỗ trợ giá thập phân/ngoại tệ/yearly.
- Enum BE: Pending, Success, Failed, Refunded, Cancelled; không có Expired. Hết thời gian chờ chỉ là trạng thái UI.
- Chặn lặp trong một popup không thay thế idempotency phía BE, không đảm bảo chống trùng giữa nhiều tab. Khi mất response phải kiểm tra lịch sử.
- Checkout chỉ chấp nhận HTTPS host `pay.payos.vn`, `next.pay.payos.vn`, không credentials/query/hash/port tùy ý. Đối chiếu ví dụ chính thức: https://payos.vn/docs/api/ và https://payos.vn/docs/sdks/front-end/script-js/ . Nếu gateway thay đổi, xác minh trước khi mở rộng allowlist.
- Không tự gọi `/api/payments/payos-webhook`. Signature, duplicate webhook, atomic activation và race cancel/payment cần BE kiểm thử.
- U3b chưa triển khai. Chờ người dùng test hoặc yêu cầu tiếp, không tự triển khai roadmap.

## Kiểm chứng tự động

Xem các test U3a trong src/app/e2e/api-auth.spec.ts và src/services/api/payments.test.ts. Đây là kiểm chứng với API fixture, không chứng minh PayOS/deploy đang hoạt động.

Kết quả 2026-10-04: 82 unit tests pass; 22 ca E2E riêng biệt pass (9 U1/U2, 6 U3a, 7 auth/recovery; chạy hai lượt có 4 ca U3a lặp). Lint và production build pass; build còn cảnh báo chunk chính >500 kB.
