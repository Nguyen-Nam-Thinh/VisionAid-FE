# Kiểm thử lại API thật — 16/10/2026

Phạm vi: Web local nhánh refactor/desktop-ui-experience và https://api.visionaid.net. Không mock API. Không nghiệm thu Mobile hoặc media thật. Báo cáo này cập nhật kết quả ngày 15/10; không có nghĩa mọi trường hợp biên đã được kiểm tra.

## Cập nhật sau khi người dùng mua gói Business

- Người dùng xác nhận luồng thanh toán đã test thành công ngày 16/10. Đây là xác nhận của người dùng, không phải AI tự chuyển tiền.
- Pool `01a14406-5e43-79d8-b211-75ffa76c9910` Active, tổng 50 suất. Tạo VIU QA bằng CenterAdmin trả 201 và tự cấp 1 suất; GET assignments xác nhận. Thu hồi 200 → user None; cấp lại 200 → user Active. Cuối lượt thu hồi và xóa QA, pool trở về 0 dùng / 50 còn.
- Người dùng cho phép dùng đúng 1 suất test key. POST distribute 200; POST activate-key bằng Caregiver QA 200; GET users/me xác nhận Active. Subscription ID `01a144e3-a93d-7fce-b941-1e5ca9f11644`. Pool sau test: 1 dùng / 49 còn. Không tạo thêm key và không lưu key trong báo cáo.
- Key đã dùng gắn với Caregiver QA `visionaid.qa1792050328276@example.com`. BE chưa có API hoàn lại suất phân phối key; giữ tài khoản QA để tiếp tục kiểm tra.
- Một probe dùng nhầm `/api/licenses/my-subscription` trả 404; endpoint FE đúng là `/api/licenses/subscription`. Không tính 404 của script này là lỗi sản phẩm.
- Script pool ban đầu đọc sai field assignment (`viuUserId` thay vì `viuUser.id`); đã sửa, thu hồi suất tồn của QA, chạy lại toàn bộ thành công. Không tính lỗi harness là lỗi BE.
- Web Push trên cả Edge headless và Chrome headless: supported=true, Notification.permission=granted nhưng đăng ký trả AbortError code 20, `Registration failed - permission denied`; chưa có request PUT fcm-token. Chrome đã thử cho phép background networking và vẫn gặp lỗi. Chưa kết luận lỗi BE; cần đối chiếu browser thông thường của người dùng. Đăng nhập Chrome 200, GET subscription đúng endpoint 200 xác nhận Active, đúng subscription ID nêu trên.
- Bằng chứng mới: `retest-pool.json`, `cleanup-pool.json`, `retest-key.json`, `push-diagnostic.json`, `push-chrome-diagnostic.json` trong test-results/live-audit. Checkpoint key nằm trong test-results ignored và đã loại key sau kích hoạt.

## Kết quả theo nhóm được yêu cầu

| Nhóm | Kết quả thực tế | Giới hạn |
|---|---|---|
| GPS history | GET history của VIU QA trả 200; L01 không còn tái hiện | Dữ liệu QA chưa có tọa độ; chưa xác nhận lịch sử nhiều điểm |
| WebRTC | POST sessions vẫn 500 hai lần, GET history 200 rỗng | Chưa có session để accept/reject/end; chưa đạt L02 |
| TTS | Web chọn VIU chưa cấu hình, mở popup, PUT 200, reload và thấy cấu hình đã lưu; không gọi GET user detail admin-only | Không kiểm tra giọng đọc trên Mobile |
| Sidebar | Cả registry/locations/tts xuất hiện trong API mode, kiểm tra bằng trình duyệt | Không thay đổi role guards |
| Liên kết/quota | Liên kết thứ 3 thành công; VIU thứ 4 của Caregiver và Caregiver thứ 4 của VIU đều bị 422 đúng nghiệp vụ | Chưa test concurrency/quota giữa nhiều request đồng thời |
| Chuyển primary | Chuyển sang caregiver QA mới 200, xác nhận đúng một primary; chuyển lại original bị 409 hai lần | Lỗi mới L06. Đã dọn liên kết tạm, GET xác nhận original primary được khôi phục |
| License | Sau khi mua gói: tự cấp/cấp lại/thu hồi VIU đạt; distribute/activate key đạt, dùng 1 suất được cho phép | Chưa test đầy pool, concurrency, expiry hoặc hoàn suất key vì không có API |
| Thanh toán | Người dùng xác nhận luồng thanh toán thành công; AI đọc được pool Business Active | AI không tự chuyển tiền hoặc giả webhook; không suy ra mọi trường hợp gia hạn/thanh toán lỗi đều đạt |
| Ảnh khuôn mặt | Giữ kết quả trước: metadata CRUD đạt, ảnh trắng bị 422 đúng | Chưa có ảnh khuôn mặt test được phép dùng, chưa nghiệm thu upload hợp lệ/primary/delete ảnh |
| SOS | Tạo fixture bằng tài khoản VIU QA qua HTTP; dismiss 200; manual → acknowledge 200 → escalate 200 → resolve 200; GET currentStatus Resolved | Dismiss là API chỉ dành cho VIU, không phải nút Caregiver Web. Không dùng MO, không gọi điện thật |
| Web Push | Edge và Chrome headless cùng trả AbortError: Registration failed - permission denied, dù quyền granted; chưa phát sinh PUT fcm-token | Chưa nhận được token thật; không dùng token giả để tuyên bố đạt. Chưa chứng minh lỗi production hay giới hạn browser headless; cần kiểm tra browser người dùng |
| System config | PUT cùng giá trị tts.cooldown_seconds → history có entry → rollback 200 → GET giữ đúng giá trị ban đầu | Chỉ kiểm tra đường ghi/history/rollback, chưa kiểm tra thay đổi hành vi runtime hoặc toàn bộ kiểu giá trị |
| ICE | Clone STUN hợp lệ đang có với priority thấp; POST 201, PUT inactive 200, GET 200, DELETE 204 | Không thêm TURN credentials; không nghiệm thu kết nối media |
| Gói license | POST gói QA 201, PUT sửa tên/inactive 200, GET xác nhận inactive | Không có DELETE trong controller hiện tại; thử DELETE trả 405. Gói QA giữ inactive, không mua gói |

## L02 ở lượt trước — tạo cuộc gọi 500 (xem cập nhật cuối tài liệu)

**Nhu cầu / lỗi / API nào:** POST /api/webrtc/sessions với viuUserId 01a13e86-0e9e-77af-8af6-acee46f86f13, triggerType CaregiverInitiated trả 500 hai lần. Cả hai tài khoản QA đăng nhập thành công; history không có phiên.

**Thêm mới / bổ sung / chỉnh sửa gì:** BE xem log exception và đối chiếu bản deploy. Sửa EXISTS trong source chưa đủ để kết luận toàn bộ InitiateCallHandler hoạt động; cần kiểm tra truy vấn tên người gọi, insert và signaling. Không khẳng định nguyên nhân khi chưa có server log.

**Kết quả kỳ vọng:** Tạo phiên hợp lệ trả sessionId; sau đó mới test accept/reject/end. Lỗi nghiệp vụ trả mã cụ thể thay 500.

## L06 ở lượt trước — chuyển primary trở lại bị 409 (xem cập nhật cuối tài liệu)

**Nhu cầu / lỗi / API nào:** PATCH /api/caregiver-links/{id}/promote-primary. Chuyển từ original 01a13e86-122a-7ed6-98fa-1b5de0b756c3 sang QA link 01a143d3-07fa-72e0-84a5-6b204bdac01a thành công. Chuyển lại original trả 409 “A record with this value already exists.”, tái hiện hai lần.

**Thêm mới / bổ sung / chỉnh sửa gì:** BE kiểm tra unique constraint và thứ tự UPDATE trong PromotePrimaryLinkHandler. Source đổi hai IsPrimary rồi SaveChanges một lần; cần đảm bảo hạ primary cũ và nâng primary mới atomically, không vi phạm unique constraint giữa các câu UPDATE. Đây là hướng điều tra, chưa xác nhận bằng server log.

**Kết quả kỳ vọng:** Chuyển qua lại giữa hai liên kết hợp lệ thành công, mỗi VIU luôn có đúng một primary sau commit; rollback toàn bộ nếu lỗi.

## Dữ liệu sau kiểm thử

- Đã xóa các tài khoản/liên kết phụ QA của lượt kiểm tra primary và quota. Xóa user là soft delete theo BE.
- Original link đã được GET xác nhận isPrimary=true; quyền canReceiveAlerts được khôi phục false sau SOS.
- VIU2 QA hiện đã có cấu hình TTS; không còn là fixture trống như ngày 15/10.
- Hai SOS QA được giữ trong lịch sử: 949d2131-6fb2-4139-80cf-3a564318faa8 Dismissed; 409d98b6-e888-4fcf-834f-ec087b0838fa Resolved. Không có API xóa history.
- ICE QA 01a143d1-ae44-7c58-b94e-e2025aeabd00 đã DELETE 204.
- Gói QA 5c6e83f2-78e8-41fd-ab1a-67fb157d34a9 đã inactive. Backend không cung cấp DELETE gói.
- Ghi/rollback cấu hình cùng giá trị tạo audit/history, không thay giá trị vận hành.
- Web Push đã gọi cleanup trên browser test. Không log token/credential.
- Một log script ghi nhãn “promote and restore primary pass” quá sớm dù HTTP restore 409. Báo cáo dùng HTTP status và GET cuối cùng để kết luận; không coi nhãn script đó là bằng chứng restore thành công.

## Bằng chứng local

Trong test-results/live-audit (ignored): retest-2026-10-16.json, fixes-2026-10-16.json, tts-fixed.png, extended-2026-10-16.json (primary attempt/cleanup), retest-quota.json, retest-sos-config.json, push-retest.json. ICE/package có output của lượt retest-extended; file log lượt đó bị lượt primary ghi đè trước khi helper được sửa để đặt tên riêng, nên không tuyên bố có file JSON độc lập cho lượt ICE/package.

Chưa push/merge. Không yêu cầu BE tạo fixture; người dùng đã tự mua gói và xác nhận thanh toán. AI dùng đúng một suất key được cho phép; không tự chuyển tiền.

## Cập nhật sau bản sửa BE — 16/10, khoảng 20:40–20:43 UTC+7

Kết quả dưới đây thay thế trạng thái L02/L06/ảnh ở các lượt trước. Gọi trực tiếp API deploy https://api.visionaid.net bằng tài khoản QA, không mock; đã đọc source BE local mới. Không sửa BE và không push FE.

### L02: tạo và chuyển trạng thái cuộc gọi đã đạt; lịch sử còn lỗi

- POST /api/webrtc/sessions: 200 cho cả hai phiên.
- VIU reject: 200, session 118203fe-9d2b-4de5-be8c-585fa51abf7f.
- VIU accept rồi Caregiver end: đều 200, session 0d35d417-1e9f-42f0-824a-86696a83e906.
- GET /api/webrtc/sessions?viuUserId=01a13e86-0e9e-77af-8af6-acee46f86f13: 500. Thử lại thêm page=1&pageSize=20 vẫn 500.

**Nhu cầu / lỗi / API nào:** GET lịch sử cuộc gọi lỗi 500 sau khi tạo được phiên. Chưa xác nhận trạng thái lưu qua API đọc lịch sử.

**Thêm mới / bổ sung / chỉnh sửa gì:** BE đối chiếu deployment/migration với GetCallHistoryHandler và enum mapping WebrtcSession, xem exception server theo thời điểm và session ID trên. Source local đã materialize trước khi gọi enum.ToString(); chưa có server log nên chưa kết luận nguyên nhân cụ thể.

**Kết quả kỳ vọng:** GET trả 200 với hai phiên vừa thử và trạng thái tương ứng. Chưa nghiệm thu âm thanh/video hay SDP/ICE qua thiết bị thật.

### L06: chưa hết lỗi, chuyển trở lại hiện trả 500

**Nhu cầu / lỗi / API nào:** PATCH /api/caregiver-links/{id}/promote-primary. Chuyển original sang QA link 01a144f0-da48-7ce0-9f9f-5f3ba932eeb7 trả 200 và GET xác nhận đúng một primary. Chuyển trở lại original 01a13e86-122a-7ed6-98fa-1b5de0b756c3 trả 500 hai lần.

**Thêm mới / bổ sung / chỉnh sửa gì:** Source mới dùng một UPDATE đổi hai hàng nhưng vẫn dùng partial unique index không deferred. Một UPDATE không bảo đảm tránh va chạm uniqueness giữa các hàng. Hướng sửa: transaction, tuần tự hạ primary cũ rồi nâng primary mới, khóa theo VIU để tránh hai request đồng thời, rollback toàn bộ khi lỗi. Đối chiếu exception DB trước khi khẳng định đây là nguyên nhân deploy.

**Kết quả kỳ vọng:** Chuyển qua lại nhiều lần đều thành công, luôn đúng một primary sau commit.

Cleanup: xóa QA link và tài khoản phụ đều 204; GET original xác nhận isPrimary=true. Không đụng liên kết người dùng thật.

### Ảnh người dùng cung cấp: từng ảnh hợp lệ; thêm nhiều ảnh cùng người bị chặn

- Cả ba ảnh tải riêng vào người QA mới đều POST 201; GET bytes ảnh đều 200 (2.964.155 / 3.115.941 / 558.181 bytes).
- Sau ảnh đầu tiên, GET person có images.length=1 nhưng imageCount=0 và isActive=false.
- Thêm ảnh thứ hai cho cùng người, setAsPrimary=false: 409 “A record with this value already exists.”.
- Ảnh thứ hai tải riêng lại thành công, nên không quy lỗi cho chất lượng ảnh.
- PATCH primary trên ảnh đang là primary: 200. Đây chỉ là kiểm tra gọi lại ảnh chính hiện tại, CHƯA chứng minh đổi primary giữa nhiều ảnh.
- DELETE ảnh riêng: 204, đọc lại images=[]; DELETE các person QA: 204. Không giữ ảnh gốc trong repository.

**Nhu cầu / lỗi / API nào:** POST /api/face-registry/persons/{personId}/photos và GET person trả số lượng không đồng bộ; không thêm đủ ba ảnh để kích hoạt.

**Thêm mới / bổ sung / chỉnh sửa gì:** Kiểm tra trigger fn_maintain_image_count và migration trên DB deploy. UploadFacePhotoHandler không tự tăng count, Reload rồi dùng ImageCount==0 để đánh dấu ảnh đầu tiên. Khi count vẫn 0, ảnh tiếp theo cũng bị đánh dấu primary và có thể va chạm uq_primary_face_image. Cần bảo đảm cập nhật số ảnh đúng khi thêm/xóa, xác định ảnh đầu tiên chính xác, chỉ một primary và kích hoạt/ngừng kích hoạt theo ngưỡng. Đây là hướng nguyên nhân từ source và response; chưa truy cập DB/server log.

**Kết quả kỳ vọng:** Thêm lần lượt ba ảnh trả 201, count 1→2→3, đủ ba ảnh isActive=true; đổi ảnh chính thành công; xóa xuống hai ảnh cập nhật count và trạng thái đúng.

Bằng chứng ignored: test-results/live-audit/retest-l02-l06-photos.json, retest-three-photos.json, retest-photo-isolated.json. Không ghi token hoặc ICE credentials. API upload thành công không chứng minh độ chính xác nhận diện khuôn mặt.

## Kết quả mới nhất — đối chiếu BE local c1b3262

Lượt này thay thế kết luận lỗi còn mở ở trên; gọi lại API deploy bằng QA, không sửa source và không push.

- **L02 đạt phạm vi API:** tạo/reject và tạo/accept/end đều 200. GET history 200, xác nhận session 66b62cd4-494a-49ae-bed4-50d6fd1a4d6a Rejected và 9cc01a31-3c8b-4f54-83b4-aad774f73e8a Ended, cũng đọc được các phiên trước.
- **L06 đạt tuần tự:** chuyển qua lại bốn lần đều 200; mỗi lần GET xác nhận đúng một primary và đúng ID mong đợi. Đã khôi phục original, xóa QA link/user phụ 204. Chưa test cạnh tranh đồng thời.
- **Ảnh:** upload ba bản ghi đều 201; GET ảnh bytes 200; images.length lần lượt 1/2/3. isActive false/false/true. Đổi ảnh chính sang ảnh thứ ba 200, GET xác nhận duy nhất ảnh đó là primary. Xóa ảnh không phải primary 204, còn hai ảnh và isActive=false. Xóa person QA cuối lượt 204.
- Ảnh JPG chính diện không còn ở đường dẫn đã cung cấp. Lượt này dùng hai PNG còn tồn tại và lặp lại PNG đầu cho bản ghi thứ ba; chỉ nghiệm thu thao tác/số bản ghi, không nghiệm thu ba góc chụp hay chất lượng nhận diện.

### Còn lỗi BE: imageCount luôn bằng 0

**Nhu cầu / lỗi / API nào:** GET /api/face-registry/persons/{id} vẫn trả imageCount=0 dù images có 1, 2 hoặc 3 phần tử; sau xóa còn 2 ảnh vẫn count=0. Person thử: 01a14579-e2a6-7b7e-8873-d19c63d8909b, đã dọn.

**Thêm mới / bổ sung / chỉnh sửa gì:** Upload handler mới đếm bảng ảnh để quyết định primary và kích hoạt nhưng không cập nhật ImageCount; DTO vẫn đọc person.ImageCount. BE cần đồng bộ trường đếm/trigger trên deploy hoặc tính số ảnh thực trong response, đồng thời rà các nhánh delete còn dựa vào count lưu sẵn. Không sửa FE để che dữ liệu sai. Chưa truy cập DB để xác nhận trigger thiếu hay không hoạt động.

**Kết quả kỳ vọng:** imageCount luôn bằng số ảnh thực sau thêm/xóa (1→2→3→2), trạng thái và ảnh chính nhất quán. Chưa xác nhận xóa ảnh chính sẽ tự chọn lại ảnh khác hoặc xóa từ 4 xuống 3 vẫn giữ active; source delete còn phụ thuộc count nên cần BE kiểm tra thêm.

Bằng chứng: test-results/live-audit/retest-be-c1b3262.json và retest-photos-c1b3262.json (ignored). Không test âm thanh/video thật, không xác nhận mọi nhánh concurrency. Không giữ ảnh thử trên danh bạ QA sau cleanup.

## Cập nhật 17/10/2026 — lỗi imageCount đã đạt retest

Đối chiếu source BE local commit 6ebbc9e và gọi API deploy thật. DTO hiện đếm danh sách ảnh; DeleteFacePhoto đếm ảnh còn lại trực tiếp thay vì phụ thuộc ImageCount lưu sẵn.

- Thêm bốn bản ghi ảnh: mỗi POST 201; GET chi tiết imageCount và images.length đúng 1→2→3→4. isActive tương ứng false/false/true/true. GET bytes cả bốn ảnh 200.
- PATCH đổi ảnh chính sang ảnh thứ ba 200; GET xác nhận duy nhất ảnh này là primary.
- Xóa ảnh chính, còn ba ảnh: DELETE 204, count=3, vẫn active=true và tự chọn đúng một ảnh chính khác.
- Xóa tiếp xuống hai, một, không ảnh: mỗi DELETE 204; count=2→1→0 và active=false. Mỗi bước đối chiếu cả GET chi tiết và GET danh sách. Còn ảnh thì đúng một primary; hết ảnh thì không có primary.
- Kết thúc xóa người QA 01a145ae-0f18-7036-b16c-395398b8d1b7 trả 204. Không để lại ảnh thử trong danh bạ.

**Kết luận:** Lỗi số ảnh trả về và các nhánh xóa/activation/primary được thử đã đạt. L02/L06 giữ kết quả đạt ở lượt trước, không chạy lại vì bản cập nhật này chỉ thay đổi xử lý ảnh.

Bằng chứng ignored: test-results/live-audit/retest-photos-6ebbc9e.json. Dùng hai PNG được người dùng cung cấp, mỗi ảnh tải hai lần để kiểm tra bốn bản ghi; không đánh giá độ chính xác nhận diện hoặc chất lượng bốn góc chụp. Chưa test đồng thời nhiều request hay thao tác trực tiếp UI ở lượt này. Chưa push/merge.

## Web Push — 17/10/2026: đăng ký và nhận thật đạt trên trình duyệt trong ứng dụng

- Mở localhost:5173/profile, đăng nhập Caregiver QA và bấm Bật thông báo trình duyệt. UI xác nhận đăng ký trên máy chủ thành công; không dùng token giả.
- Tạo cảnh báo Manual bằng VIU QA sau khi GET xác nhận chỉ có Caregiver QA nhận cảnh báo. Hai event thử: ab6336b6-8965-435d-8494-b2023fb87266 và 8bb354ca-8ed5-45e2-a2f8-f37472007d59. Không gửi tới tài khoản người dùng thật.
- Popup cuộc gọi SOS xuất hiện qua luồng realtime, nhưng không dùng popup đó làm bằng chứng FCM.
- Trang chẩn đoán tạm chỉ nghe message visionaid-push từ service worker firebase-messaging-sw.js, không tạo push giả và không kết nối SignalR. Trang xác nhận nhận Web Push thật lúc 2026-10-17 01:29:15.704 UTC+7, sau event thứ hai lúc 01:29:13.247 UTC+7. Đây là bằng chứng đường BE → dịch vụ push → service worker hoạt động.
- Bằng chứng ảnh: test-results/live-audit/push-received.png. Log HTTP lần gửi thứ hai: test-results/live-audit/push-real-send.json; lần chạy sau ghi đè log script lần đầu, không tuyên bố có log riêng đầy đủ cho lần đầu.
- Hai cảnh báo đã acknowledge/resolve 200, quyền canReceiveAlerts khôi phục giá trị ban đầu, từ chối cuộc gọi QA phát sinh. Bấm Tắt push, UI xác nhận đã tắt. Trang chẩn đoán tạm đã xóa, tab đã đóng. Không thay đổi code sản phẩm, không push.

Giới hạn: xác nhận nhận push khi trình duyệt đang mở; chưa nghiệm thu banner hệ điều hành khi đóng/ẩn toàn bộ cửa sổ, click banner, hoặc origin production visionaid.net. Kết quả này thay thế trạng thái bị chặn đăng ký trên Chrome/Edge headless ở lượt trước, không chứng minh mọi trình duyệt đều hoạt động.
