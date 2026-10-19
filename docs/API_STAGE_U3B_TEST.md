# U3b — Thanh toán Business và kho license

Cập nhật 2026-10-06. Đã triển khai FE, chưa nghiệm thu BE/PayOS thật. UI theo DESIGN.md: giữ nền giấy, xanh rêu, Fraunces/Nunito và native dialog. U3a còn chờ test live; người dùng yêu cầu tiếp U3b.

## Phạm vi

- CenterAdmin có organizationId: menu Kho license tại /center-admin/licenses; Thanh toán tại /center-admin/payments; chọn gói Business ở /packages.
- GET /api/licenses/pool: đọc đúng organizationId của phiên; hiển thị gói, tổng/đã dùng/còn lại, trạng thái Active/Expired/Suspended, ngày mua/hết hạn. 404 là chưa có kho; 403/500 và DTO sai hiển thị lỗi, không giả số 0.
- Tái sử dụng POST /api/payments/create-link, GET /api/payments/history, DELETE /api/payments/{id}/cancel. Không tăng số caller REST cho API đã có ở U3a.
- Callback /payments/return và /payments/cancel dùng chung. Success phải do lịch sử BE xác nhận mới đọc lại kho; CenterAdmin không gọi subscription cá nhân.
- Không cộng quota tại FE, không tự quyết định LicensePurchase/LicenseTopup. Staff/Admin/CenterAdmin thiếu tổ chức không mua Business hoặc đọc kho.
- Chưa có cấp/thu hồi license và tạo VIU consume pool: thuộc U4. Không tự làm U4.

## Điểm BE cần lưu ý trước thanh toán

Source đã đối chiếu: LicensePoolController, GetOrganizationLicensePoolHandler, CreatePaymentLinkHandler, GetPaymentHistoryHandler, CancelPaymentHandler, HandlePayOsWebhookHandler.

BE chọn pool không Suspended cho topup. Topup dùng pool.Package.IncludedLicenses và pool.Package.DurationDays, không dùng gói mới đã chọn; ExpiresAt được đặt bằng thời điểm hiện tại cộng DurationDays, không cộng dồn thời gian còn lại. FE vì vậy đọc lại pool trước POST và chặn chọn khác packageId khi pool Active/Expired. Đây chỉ là kiểm tra trước gửi; BE vẫn phải thực thi nhất quán nếu pool thay đổi đồng thời. API pool trả active trước/recent sau, trong khi payment chọn non-Suspended mới nhất; cần BE kiểm tra trường hợp có nhiều pool, đặc biệt một pool Suspended mới nhất và pool cũ khác. Không tự suy ra số license sẽ thêm hoặc thời hạn tương lai trên FE.

Lịch sử transaction không có organizationId trong DTO: BE phải filter theo org trong JWT. FE tra đơn trong lịch sử được cấp, không có endpoint detail để kiểm tra ownership độc lập. Kiểm thử fixture không chứng minh cách ly tenant của deployment.

## Test từng bước

Chuẩn bị CenterAdmin có tổ chức, Staff, hai tổ chức nếu có thể và gói Business active có giá nguyên dương VND. Xác nhận môi trường PayOS và khoản tiền được phép trước khi trả; các test tự động không chuyển tiền thật.

- [ ] Đăng nhập CenterAdmin -> Kho license. Đối chiếu số liệu/thời hạn với BE. Staff không thấy menu và không gọi GET pool qua URL trực tiếp.
- [ ] Tổ chức chưa có kho: thấy thông báo chưa có, vẫn mở danh mục Business được.
- [ ] Chọn Business -> popup giữa màn hình -> Tạo đơn. Request chỉ có packageId và callback cùng origin; nhấn đôi không tạo lặp trong popup.
- [ ] Kho Active/Expired: chọn cùng gói để bổ sung/gia hạn. Chọn khác gói phải báo chưa hỗ trợ, không POST. Nếu Active, xác nhận thời hạn tính lại từ ngày thanh toán đúng nghiệp vụ mong muốn trước khi trả tiền.
- [ ] Mở PayOS, hoàn tất thanh toán đã được phép -> callback trước webhook vẫn Pending. Query status=PAID không tự cấp license.
- [ ] Sau webhook Success: Web đọc lại pool, đối chiếu tổng/đã dùng/còn lại/hết hạn. Không gọi GET subscription cho CenterAdmin. Nếu pool lỗi, payment vẫn hiện Success và kho có lỗi/tải lại riêng.
- [ ] Xem Lịch sử thanh toán -> chọn đơn -> reload vẫn đúng trạng thái; chưa đăng nhập thì đăng nhập rồi quay lại đơn.
- [ ] Cancel callback không tự hủy; nhấn Hủy đơn -> popup xác nhận -> DELETE -> Cancelled. Không hủy đơn thành công hoặc không nằm trong lịch sử được cấp.
- [ ] Hai org không xem/hủy đơn nhau; pool trả sai organizationId bị ẩn và báo lỗi.
- [ ] 404/403/500/mất mạng: không hiện dữ liệu thành công giả; có tải lại. Pending sau 60 giây ngừng polling, còn kiểm tra thủ công.
- [ ] Desktop/tablet/mobile: không tràn ngang, label rõ, dialog dùng keyboard/Escape và không đóng lúc đang ghi.

## Bàn giao

Tổng hiện tại 53/140 operations có caller Web: U3b thêm GET pool. API payment dùng lại U3a. Giới hạn tra history 1000 bản ghi, revalidate catalog 400 gói và thiếu idempotency BE giữ nguyên — xem API_STAGE_U3A_TEST.md. Web không gọi webhook.

Đã có kiểm thử U3b trong src/app/e2e/api-auth.spec.ts, payments.test.ts, licenses.test.ts. Kiểm thử dùng API fixture. Người dùng test live rồi báo kết quả hoặc yêu cầu U4.

Kiểm chứng 2026-10-06: 84 unit tests pass; 21 ca E2E U1/U2/U3a/U3b pass qua hai lượt, gồm 6 ca U3b. Lint và production build pass; cảnh báo chunk chính >500 kB còn tồn tại. Đã xem ảnh mobile 375px và kiểm tra không tràn ở 768/1440px.
