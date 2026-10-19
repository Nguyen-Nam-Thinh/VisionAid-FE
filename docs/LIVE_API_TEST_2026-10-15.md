# Kiểm thử Web với API thật — 15/10/2026

> Kết quả kiểm thử lại mới hơn: [API_RETEST_2026-10-16.md](./API_RETEST_2026-10-16.md). GPS/TTS đã chạy thành công; WebRTC còn 500; phát hiện thêm lỗi chuyển primary 409. Xem báo cáo mới để biết trạng thái hiện hành thay vì dùng các mục chờ bên dưới như kết luận cuối.

## Cập nhật sửa lỗi ngày 16/10/2026

- L03: FE xác minh VIU qua danh sách được scope theo Caregiver, có phân trang và loại người dùng không hoạt động; không gọi GET user detail admin-only. Giữ kiểm tra liên kết trước đọc/ghi; 403/402/5xx không trở thành cấu hình mặc định.
- L04: Đã thêm registry, locations, tts vào sidebar API mode; giữ route guards hiện có.
- L05: Transport chung dịch 403/429/5xx sang tiếng Việt, đọc Retry-After dạng giây hoặc HTTP-date, không tự retry; giữ status và field errors, không ghi đè thông báo nghiệp vụ 422.
- N01: Source BE mới tại `ViuLicenseService.TryAssignForNewViuAsync` bắt buộc pool Active cho CenterAdmin tạo VIU; không có pool ném BusinessRuleException. `CreateUserHandler` bọc tạo user/cấp suất trong transaction nên thất bại sẽ rollback. FE đã cập nhật hướng dẫn trước khi tạo. Quy tắc này áp dụng nhánh CenterAdmin; source không gọi dịch vụ cấp suất trong nhánh Admin, không suy rộng sang mọi role.
- Source L01 đã chuyển phép lấy tọa độ sang sau materialization; L02 đã dùng EXISTS với alias Value cho kiểm tra link. Đọc source không thay cho xác nhận bản deploy.
- Kiểm tra tự động: 34 file / 163 test đạt; build và lint đạt. Kết quả live sau sửa được ghi riêng bên dưới khi có bằng chứng, không thay thế bằng kết quả unit test.
- Kiểm thử live lại ngày 16/10: Web local báo không kết nối được máy chủ ngay khi login QA; chưa vào được dashboard để xác nhận TTS/menu với API thật. Không đánh dấu L03–L05 đã nghiệm thu live. Chưa xác nhận lại L01/L02 hoặc N01 trên deploy trong lượt này.
- Probe không có credentials: HEAD `/swagger/index.html` và OPTIONS `/api/auth/login` đều trả **504 Gateway Timeout**, Server Cloudflare, lúc khoảng 13:46 giờ Việt Nam. Chưa xác định nguyên nhân bên origin; không kết luận là lỗi CORS hay sai tài khoản.
- Lượt kiểm tra lại theo yêu cầu test 11 nhóm API: khoảng 13:51 ngày 16/10, GET Swagger, OPTIONS login và POST login bằng tài khoản QA vẫn trả 504 qua Cloudflare. Chưa có phiên để tiếp tục các endpoint cần xác thực; không chạy thao tác ghi hoặc đánh dấu thêm nhóm nào đạt. Evidence: `test-results/live-audit/retest-availability-2026-10-16.json`.

## Kết luận

Đã kiểm tra Web local trên nhánh `refactor/desktop-ui-experience` với `https://api.visionaid.net`, không intercept/mock response. Chưa thể nghiệm thu toàn bộ chức năng: có ba lỗi chặn luồng đã tái hiện (GPS history, bắt đầu cuộc gọi, TTS lần đầu), một lỗi điều hướng FE, và các nhóm còn cần fixture/thiết bị bên ngoài.

Không sửa code sản phẩm, không push, không merge và không thay bản main đang deploy. Báo cáo này phân biệt test trực tiếp API, thao tác Web thật, dữ liệu tổng hợp và nghiệm thu thiết bị.

## Các lỗi và nhu cầu theo mẫu bàn giao

### L01 — Lịch sử GPS trả HTTP 500 — ưu tiên cao, BE

**Nhu cầu / lỗi / API nào**

- Caregiver có trial hợp lệ, liên kết Personal hoạt động với VIU QA, có quyền quản lý vị trí.
- Mở `/caregiver/map` → bấm **Vị trí & lịch sử** của VIU QA.
- `GET /api/locations/history?viuId=01a13e86-0e9e-77af-8af6-acee46f86f13&page=1&pageSize=20` trả **500**, message `An unexpected error occurred.`. Tái hiện qua cả HTTP trực tiếp và request từ giao diện.
- VIU này chưa có GPS. `GET /api/locations/live` trả 404 do chưa có cache là trạng thái riêng, không phải bằng chứng lịch sử nên trả 500.

**Thêm mới / bổ sung / chỉnh sửa gì**

- BE kiểm tra log exception cho endpoint trên, truy vấn permission và truy vấn `LocationHistory`, mapping tọa độ/PostGIS, migration và cấu hình DB thực tế.
- Source tham chiếu: `GetMovementHistoryHandler.cs`, `LocationPermissionHelper.cs`. Chưa có server log nên chưa khẳng định nguyên nhân SQL/migration cụ thể.
- FE nên dùng thông báo tiếng Việt dễ hiểu thay message tiếng Anh thô.

**Kết quả kỳ vọng**

- Người có quyền nhận 200 + phân trang rỗng nếu chưa có GPS; có dữ liệu thì trả đúng lịch sử theo VIU và khoảng ngày.
- Người không có quyền nhận 403. Không phát sinh 500 với VIU mới hợp lệ.

### L02 — Không bắt đầu được cuộc gọi — ưu tiên cao, BE

**Nhu cầu / lỗi / API nào**

- Caregiver QA và VIU QA đều có trial; có liên kết hoạt động. Web đã hiển thị kết nối cuộc gọi sẵn sàng; SignalR negotiate thành công.
- `/caregiver/users` → **Gọi hỗ trợ** VIU QA → **Bắt đầu gọi**.
- `POST /api/webrtc/sessions`, body `{ "viuUserId": "01a13e86-0e9e-77af-8af6-acee46f86f13", "triggerType": "CaregiverInitiated" }` trả **500**, message `An unexpected error occurred.`.
- Tái hiện bằng API và Web. GET history sau các lần kiểm tra không có session mới. Chưa nhận được sessionId để test accept/reject/end.

**Thêm mới / bổ sung / chỉnh sửa gì**

- BE kiểm tra exception trong `InitiateCallHandler`, truy vấn kiểm tra liên kết/tên người gọi, insert phiên và gửi SignalR.
- Source local có các truy vấn raw SQL; cần đối chiếu log và bản deploy trước khi kết luận nguyên nhân.
- FE giữ cách xử lý kết quả chưa xác nhận, không tự gọi lại. Bổ sung thông báo tiếng Việt và thông tin tra cứu lỗi nếu BE cung cấp.

**Kết quả kỳ vọng**

- Liên kết hợp lệ tạo đúng một phiên, trả sessionId/status/myRole/ICE theo contract; bên nhận nhận event tương ứng.
- Sau đó mới kiểm tra accept/reject/end, media hai chiều và TURN trên thiết bị thật.
- Nếu người nhận offline hoặc tính năng bị tắt, trả trạng thái/lỗi nghiệp vụ rõ ràng thay 500.

### L03 — TTS lần đầu bị chặn bởi API kiểm tra người dùng — ưu tiên cao, FE/contract

**Nhu cầu / lỗi / API nào**

- Tạo VIU QA mới chưa có TTS, liên kết với Caregiver trial; mở `/caregiver/tts` và chọn VIU.
- `GET /api/users/01a13e8c-9e91-7fd6-bc5f-7363e748169f/tts-preferences` trả **404** như dự kiến vì chưa có cấu hình.
- FE gọi tiếp `GET /api/users/{id}` để kiểm tra target. Endpoint đó chỉ cho Admin/CenterAdmin, nên Caregiver nhận **403** và không thấy form tạo cấu hình.
- Bằng chứng source: `src/services/api/tts.ts`, nhánh catch 404 trong `read`; quyền tại `UsersController.GetById` của BE local.
- `PUT /api/users/{id}/tts-preferences` rồi GET trên VIU QA thứ nhất đã thành công; lỗi ở nhánh khởi tạo lần đầu của FE.

**Thêm mới / bổ sung / chỉnh sửa gì**

- FE xác minh VIU bằng danh sách linked users được phép hoặc API scope phù hợp, không gọi endpoint admin-only trong nhánh 404.
- Giữ kiểm tra liên kết/quyền; không mở rộng quyền chi tiết người dùng toàn hệ thống chỉ để bỏ lỗi.
- Thêm regression cho chuỗi 404 TTS → hiển thị form → PUT → tải lại.

**Kết quả kỳ vọng**

- VIU hợp lệ chưa có TTS được hiển thị giá trị mặc định và nút tạo. Lưu xong reload vẫn có cấu hình.
- VIU không có liên kết vẫn bị chặn đúng quyền.

### L04 — Ba chức năng đã nối API bị ẩn khỏi sidebar — FE

**Nhu cầu / lỗi / API nào**

- API mode không có mục Gương mặt thân quen, Địa điểm & vùng an toàn, Giọng đọc hỗ trợ trong sidebar Caregiver.
- Các URL `/caregiver/registry`, `/caregiver/locations`, `/caregiver/tts` tồn tại; nhập URL trực tiếp tải được và có caller thật.
- API liên quan: `/api/face-registry/persons*`, `/api/saved-locations*`, `/api/geofences*`, `/api/users/{userId}/tts-preferences`.
- Nguyên nhân FE xác định được: allowlist trong `Shell` ở `src/app/App.tsx` thiếu `registry`, `locations`, `tts`.

**Thêm mới / bổ sung / chỉnh sửa gì**

- Bổ sung ba mục vào điều hướng API mode theo role, giữ guard và kiểm tra quyền ở màn đích.
- Kiểm tra cả sidebar mở rộng/thu gọn và mobile.

**Kết quả kỳ vọng**

- Caregiver truy cập các chức năng đã triển khai qua menu, không cần biết URL nội bộ.

### L05 — Thông báo lỗi chưa đồng nhất tiếng Việt — FE

**Nhu cầu / lỗi / API nào**

- Web đang hiển thị nguyên văn `An unexpected error occurred.`, `You do not have permission to access this resource.` và thông báo rate limit tiếng Anh.
- Quan sát trên lịch sử GPS, cuộc gọi, TTS và login khi lượt kiểm thử chạm giới hạn.

**Thêm mới / bổ sung / chỉnh sửa gì**

- Chuẩn hóa thông báo 403/429/5xx ở transport/error mapping, ưu tiên error code ổn định; giữ thông tin kỹ thuật cho tra cứu thay vì đưa toàn bộ vào UI.
- 429 hiển thị thời gian chờ khi có Retry-After, không retry vòng lặp.

**Kết quả kỳ vọng**

- Người dùng biết không có quyền, cần chờ hay cần thử lại; không bị hiểu nhầm là sai mật khẩu hoặc mất mạng.

### N01 — Tạo VIU tổ chức khi chưa có pool — cần chốt nghiệp vụ

**Nhu cầu / lỗi / API nào**

- CenterAdmin hiện có `GET /api/licenses/pool` → 404, chưa có pool.
- `POST /api/users` với role VisuallyImpaired cùng tổ chức vẫn trả **201**, licenseStatus null; tạo phân công Organization sau đó cũng thành công.
- Đây là hành vi thực tế đã tái hiện, chưa tự kết luận là bug vì tài liệu hiện có chưa chốt có cho tạo tài khoản trước khi mua pool hay không.

**Thêm mới / bổ sung / chỉnh sửa gì**

- Chốt cho phép tạo VIU chưa có license hay bắt buộc pool còn suất.
- Nếu bắt buộc: BE từ chối trước khi tạo tài khoản, trả 422 có lý do; FE giữ form và dẫn tới mua pool.
- Nếu cho phép: FE ghi rõ tài khoản đã tạo nhưng chưa được cấp quyền sử dụng, không coi tạo thành công đồng nghĩa có license.

**Kết quả kỳ vọng**

- Quy tắc tạo VIU, quota và trạng thái hiển thị thống nhất; không có tình huống người quản trị tưởng VIU đã dùng được trong khi chưa có entitlement.

## Ma trận thực tế đã kiểm tra

| Nhóm | Bằng chứng đã chạy | Giới hạn / phần còn lại |
|---|---|---|
| Login, profile, dashboard theo role | Admin, CenterAdmin, Caregiver đăng nhập Web; profile GET/PUT và đọc lại; trang tổng quan thật | VIU dùng app riêng; lượt login VIU cũ trong sweep gặp 429, không kết luận sai mật khẩu; VIU QA login API thành công |
| Đăng ký/trial | Đăng ký Caregiver bằng form thật, subscription 200; tạo VIU hai bước trên Web; VIU kế thừa Trial | Chưa nghiệm thu hết trial/grace/NONE theo ma trận thời gian |
| Password, refresh, logout-all | Đổi mật khẩu QA → login bằng mật khẩu mới → khôi phục → login → refresh 200 → logout-all 200 → refresh cũ 403 | Không đổi mật khẩu tài khoản seed; luồng quên/đặt lại mật khẩu được người dùng xác nhận test thành công ngày 16/10/2026, không phải lượt kiểm thử trực tiếp của AI |
| Liên kết cá nhân | Create qua Web, list/detail và sửa permissions qua API | Chưa thử đầy quota, secondary promotion, cạnh tranh giữa hai tab |
| Tài khoản Admin | Create/read/update/status/reset password/delete trên tài khoản tạm | Không thử thay đổi tài khoản seed |
| Tổ chức | Create/detail/update/status/members/summary/delete trên org tạm | Không sửa thông tin org seed |
| Staff và phân công CenterAdmin | Tạo staff/VIU, link Organization, GET/PUT permissions/DELETE link; staff không có license cá nhân vẫn đọc được links/preferences | Pool vắng; N01 cần chốt |
| Cách ly scope | Caregiver QA truy cập contacts của VIU tổ chức QA bị 403 | Là một mẫu âm tính, không phải audit toàn bộ phân quyền |
| License | Trial subscription và inheritance; seed NONE 404/402; key sai bị 422; danh mục gói đọc được | Chưa có pool/key hợp lệ, assignment/revoke/distribute/activate thành công chưa chạy |
| PayOS | API và Web tạo link 200; đọc history; hủy 200; đọc lại Cancelled | Không mở/chi trả PayOS; webhook/Success/gia hạn/pool chưa nghiệm thu |
| Địa điểm/vùng an toàn | POST/GET detail/PUT/readback/DELETE thật; form thêm địa điểm thật thành công | Geofence worker/arrival TTS trên điện thoại chưa chạy |
| Contacts | Create/detail/update/status/delete thật; form thêm thật thành công | Không gọi số điện thoại test, không mở Zalo |
| Face Registry | Metadata CRUD thật, form thêm thật; upload PNG trắng bị 422 “Không tìm thấy khuôn mặt” | Cần ảnh test có consent để nghiệm thu upload thành công, preview, primary, xóa ảnh và ngưỡng ba ảnh |
| TTS | PUT/GET cấu hình có sẵn thành công; lỗi lần đầu đã tái hiện L03 | Chưa nghe giọng đọc/app áp dụng thay đổi |
| GPS | Trang/list/live thiếu cache xử lý được; history L01 | Chưa nghiệm thu vị trí/live thật; Mapbox token local đang trống |
| Cảnh báo khẩn cấp | List/filter trạng thái từ dashboard/trang cảnh báo gọi API thật | Không tạo SOS trên môi trường dùng chung; thiếu alert QA để test ack/escalate/resolve và conflict |
| Notifications | Preferences GET/PUT; rule scoped org QA create/update/delete; delivery/status đọc được | FCM end-to-end cần trình duyệt/điện thoại cho phép nhận và token thật |
| SignalR/cuộc gọi | Web negotiate 200, hiển thị sẵn sàng; create L02 | Accept/reject/end/media/TURN chưa chạy vì không tạo được session; browser dùng mic giả khi tái hiện UI |
| Lịch sử hoạt động | Tạo metadata tổng hợp riêng VIU QA qua API Mobile: navigation+event+end, OCR, QR, voice, recognition. Adapter FE list/detail cả năm loại đều đạt; navigation events đạt | Đây là fixture trên BE thật, không chứng minh camera/Whisper/AI nhận dạng thật |
| Báo cáo tổ chức | GET summary và members từ Web, org tạm | Dữ liệu org seed ít, chưa kiểm chứng mọi phép tổng hợp trên dữ liệu lớn |
| Cấu hình hệ thống | List và detail/history 20 cấu hình trong response đầu đều 200 | Không sửa/rollback cấu hình global đang phục vụ người dùng; cần staging hoặc khóa QA riêng |
| Metrics/audit/delivery/Hybrid | Mở các trang Admin, gọi list/status/filter mặc định không có lỗi UI | Chưa xác nhận tính đúng của pipeline tổng hợp/AI thực tế và mọi bộ lọc |
| ICE/package admin | List và package detail bằng Admin thành công | Không thêm/sửa/xóa ICE global hoặc thay giá gói đang bán; cần staging để nghiệm thu ghi |
| Trang công khai/reset | Landing/auth có sẵn; đăng ký thật đã chạy | Người dùng xác nhận luồng quên → đặt lại mật khẩu thành công ngày 16/10/2026; policy vẫn chờ nội dung/version chính thức |

## Những phản hồi không được tính là bug

- CORS cho `http://localhost:5173` và `https://visionaid.net` hợp lệ; cổng QA 5181 không thuộc allowlist. Đã chuyển test về 5173, không tắt bảo vệ trình duyệt.
- Caregiver seed chưa có subscription: 402 trên các API bị license gate là điều kiện dữ liệu test, không phải bằng chứng backend hỏng.
- Pool/subscription chưa tồn tại trả 404; giao diện có xử lý trạng thái này.
- `GET /api/users/{id}` bằng Caregiver và `GET /api/licenses/packages/{id}` bằng Caregiver trả 403 đúng contract hiện tại. Chỉ nhánh TTS gọi nhầm endpoint admin-only là L03; checkout FE dùng list để xác minh gói nên không mắc lỗi package-detail.
- CenterAdmin DELETE user bị 403 đúng quyền; UI chỉ cho Admin xóa. Đã dùng Admin dọn đúng hai user B2B QA.
- `ERR_ABORTED` của GET khi StrictMode/remount/chuyển trang không được tự tính là lỗi API nếu lượt kế tiếp hoàn tất bình thường.
- Refresh cũ sau logout-all bị 403 là kết quả mong đợi.
- 429 từng xuất hiện khi nhiều lượt đăng nhập kiểm thử trong một phút; không spam retry. Cần cải thiện thông báo UI, không gỡ rate limit.

## Dữ liệu và bằng chứng

- Run marker: `QA1792050328276`.
- Giữ Caregiver QA `visionaid.qa1792050328276@example.com`, ID `01a13e85-fa08-77ba-9e78-bf2cc88048b8`.
- VIU có TTS: `viu.qa1792050328276@example.com`, ID `01a13e86-0e9e-77af-8af6-acee46f86f13`.
- VIU chưa có TTS để tái hiện L03: `viu2.qa1792050328276@example.com`, ID `01a13e8c-9e91-7fd6-bc5f-7363e748169f`.
- Email `example.com` là địa chỉ dữ liệu tổng hợp, không phải hộp thư nhận email. Không dùng bộ này để kết luận email reset đã hoạt động.
- Đã xóa các địa điểm, vùng an toàn, contacts, registry metadata/ảnh trắng thử, rule/org/user B2B tạm. Xóa user/org là soft delete theo API, audit vẫn còn.
- Hai giao dịch QA được tạo ở hai lượt kiểm tra đều đã hủy; không chuyển tiền.
- Các tài khoản QA, hai personal links, subscription trial, TTS/preferences và nhật ký tổng hợp được giữ để tái hiện. API không có thao tác xóa các loại history đó. Không coi dữ liệu này là hoạt động người dùng thật khi xem metrics.
- Không lưu JWT/refresh token/credential TURN trong báo cáo. Không commit các script chạy thử có mật khẩu.

Evidence local (thư mục ignored, chưa push): `test-results/live-audit/`:

- `browser-sweep.json`: đăng nhập và navigation theo role bằng API thật.
- `functional.json`, `selected-ui.json`, `deep-ui.json`: CRUD, chọn VIU và form Web.
- `b2b.json`: staff, phân công, kiểm tra scope, cleanup bị từ chối đúng quyền.
- `authorized-flows.json`: password/refresh/logout-all, PayOS, lỗi WebRTC.
- `final-probes.json`: checkout/call qua Web, ảnh trắng 422, Admin cleanup, config detail/history.
- `history.json`, `history-read.json`: tạo metadata tổng hợp và đọc bằng adapter FE.
- `gps-history-error.png`, `tts-first-time.png`, `call-error.png`, `checkout-created.png`, `history-populated.png`: ảnh chụp tái hiện.

## Để hoàn tất phần chưa test

1. Sửa L01/L02 ở BE và L03/L04 ở FE rồi chạy lại bằng bộ QA đang giữ. Chưa tự sửa trong lượt audit này.
2. Cung cấp pool Business test hợp lệ, key hợp lệ và fixture các trạng thái license/quota để kiểm tra U4/U5; không chuyển tiền để tạo fixture.
3. Điện thoại có app để phối hợp FCM/media/TTS. Chỉ gửi push/gọi tới đối tượng test đã thống nhất. Luồng quên → đặt lại mật khẩu đã được người dùng xác nhận test thành công ngày 16/10/2026, không còn chờ email test cho luồng này.
4. Một ảnh khuôn mặt test có quyền sử dụng; không lấy ảnh người thật ngẫu nhiên từ Internet.
5. Môi trường staging hoặc dữ liệu biệt lập cho global config/rollback, ICE, package mutations và alert lifecycle; không thay cấu hình production đang hoạt động chỉ để đạt số lượng test.

Đây là báo cáo mức đã kiểm tra, không phải tuyên bố 117/117 caller hay toàn bộ hệ thống đã đạt. Các script probe có một vài lỗi selector/origin ban đầu đã được chỉnh và chạy lại; kết luận chỉ dựa trên lượt tái hiện thành công và request thực tế nêu trên.
