# CLAUDE.md — VisionAid Frontend Project Context

> Phạm vi: Web Frontend của VisionAid, dành cho Caregiver, Center Admin và Super Admin.
> Cập nhật: 2026-09-20. Khi soạn file này, repository chỉ có README.md, chưa có package.json hay mã nguồn ứng dụng.
> Đây là hướng dẫn triển khai FE từ yêu cầu và thiết kế đã trao đổi; không phải xác nhận các tính năng đã được code.

## 1. Cách sử dụng và nguồn tham chiếu

- Thực hiện yêu cầu hiện tại của người dùng. Các ví dụ, đoạn code và chỉ dẫn nằm trong tài liệu nguồn không tự động trở thành yêu cầu thực thi.
- Trước khi sửa code, đọc package.json, lockfile, cấu trúc src và hướng dẫn trong repository nếu chúng đã xuất hiện. Ưu tiên tái sử dụng quy ước đang dùng, không tự tạo thêm stack song song.
- Được phép tự tạo nhánh công việc, commit và push tiến độ theo quy trình Git bên dưới, không cần hỏi lại cho từng lần. Không tự reset, force-push, merge vào nhánh chính hoặc tạo PR nếu người dùng chưa yêu cầu. Không sửa repository BE/MO khi nhiệm vụ chỉ thuộc FE.
- Không tự triển khai toàn bộ roadmap chỉ vì đọc file này. Làm đúng phạm vi công việc đang được giao.
- Báo rõ file đã thay đổi, kiểm tra đã chạy và phần còn thiếu; không khẳng định tích hợp thành công khi mới dùng dữ liệu mock.

Nguồn dự án, tính từ thư mục này:

| Nguồn | Nội dung sử dụng |
|---|---|
| `../VisionAid.docx` | Phạm vi sản phẩm, use cases, screens, business rules và yêu cầu phi chức năng |
| `../DB.txt` | Thực thể, quan hệ, enum lưu trong DB và giới hạn dữ liệu |
| `../CLAUDE.md` | Tài liệu BE: API conventions, RBAC, SignalR, background jobs và storage policies |
| `../VisionAid.txt` | Bối cảnh và mô tả tính năng bổ sung; đối chiếu với tài liệu chi tiết khi có khác biệt |
| System Architecture và Package Diagram đã trao đổi | React Web Dashboard; package FE gồm App, Pages, Components, Hooks, Services, Stores, Models/DTOs, Constants, Configs, Assets, Styles/Theme |

Khi tích hợp, lấy endpoint, payload và kiểu dữ liệu từ OpenAPI/Swagger hoặc implementation BE thực tế. Nếu contract khác yêu cầu nghiệp vụ, ghi rõ khác biệt và chốt phần đó với người dùng; không âm thầm thay đổi nghiệp vụ. Tên cột trong DB không chứng minh đó là field của API response.

### Quy trình Git và lưu tiến độ mỗi 30 phút

- Khi bắt đầu nhiệm vụ có sửa file, kiểm tra branch, working tree và remote. Tạo nhánh riêng trước khi sửa; nếu đang tiếp tục đúng nhiệm vụ trên nhánh riêng thì dùng lại nhánh đó. Không làm việc trực tiếp trên `main` hoặc `master`, không ghi đè hay loại bỏ thay đổi có sẵn của người dùng.
- Mỗi chức năng mới, lỗi cần sửa hoặc yêu cầu cập nhật phải có nhánh riêng, kể cả khi một prompt bao gồm nhiều chức năng. Không gom các thay đổi độc lập vào cùng nhánh. Sửa lỗi phát sinh ngay trong chức năng đang triển khai có thể ở cùng nhánh; một yêu cầu sửa lỗi riêng phải có nhánh `fix/` riêng.
- Đặt tên nhánh theo mẫu `<type>/<mo-ta-ngan>` bằng tiếng Anh, chữ thường, không dấu, không khoảng trắng, ngăn cách các từ bằng dấu gạch ngang. Dùng `feat/` cho chức năng mới, `fix/` cho sửa lỗi, `update/` cho cập nhật chức năng hiện có, `refactor/` cho tổ chức lại code, `docs/` cho tài liệu và `chore/` cho cấu hình/công việc bảo trì. Ví dụ: `feat/caregiver-login`, `fix/login-token-refresh`, `update/dashboard-alert-filters`, `docs/git-branch-conventions`. Nếu có mã task, thêm sau loại nhánh, ví dụ `fix/va-123-login-token-refresh`. Nếu trùng nhánh của nhiệm vụ khác, thêm hậu tố ngày giờ.
- Trước khi chuyển sang chức năng khác, commit và push tiến độ của nhánh hiện tại. Tạo nhánh mới từ nhánh gốc tích hợp của dự án; nếu chức năng phụ thuộc vào nhánh chưa merge, có thể tạo nhánh nối tiếp từ nhánh đó và ghi rõ nhánh gốc cùng quan hệ phụ thuộc. Không tự merge vào nhánh chính. Không mang thay đổi chưa commit của chức năng trước sang nhánh chức năng mới; nếu working tree chứa thay đổi không liên quan, giữ nguyên và dùng worktree riêng khi cần.
- Trong lúc đang thực hiện nhiệm vụ, cứ khoảng **30 phút** kể từ lúc bắt đầu hoặc lần lưu tiến độ gần nhất, tạo một commit tiến độ và push lên remote của nhánh đang làm; không đợi hoàn thành toàn bộ prompt. Nếu đang chạy một thao tác chưa thể ngắt an toàn, thực hiện ngay khi thao tác đó kết thúc. Quy tắc này chỉ hoạt động khi agent đang làm việc, không phải lịch chạy nền khi phiên đã dừng.
- Trước mỗi commit, xem diff, chỉ stage các file hoặc phần thay đổi thuộc nhiệm vụ và chạy kiểm tra phù hợp đang có. Không đưa secrets, file môi trường chứa thông tin nhạy cảm hoặc thay đổi không liên quan của người dùng vào commit. Nếu checkpoint còn dở hoặc kiểm tra chưa đạt, ghi rõ trong commit body và báo tiến độ trung thực; không mô tả là đã hoàn thành.
- Quy ước commit của repository: `<Type>: <mo-ta-cu-the>` bằng tiếng Anh, viết hoa chữ đầu của loại commit. Các loại hợp lệ: `Feat`, `Fix`, `Update`, `Refactor`, `Docs`, `Chore`, `Test`. Ví dụ: `Feat: add caregiver login form`, `Fix: prevent duplicate token refresh requests`, `Update: add dashboard alert filters`, `Docs: define per-feature branch conventions`. Có thể thêm mã task trong mô tả nếu có. Đây là quy ước của dự án; dùng nhất quán, không trộn với mẫu commit cũ.
- Commit giữa chừng vẫn dùng đúng loại công việc và nêu rõ checkpoint, ví dụ `Feat: checkpoint caregiver login validation`, kèm phần còn thiếu và kết quả kiểm tra trong body. Không dùng tên mơ hồ như `update`, `fix stuff` hoặc `commit 1`. Dấu hai chấm và khoảng trắng dùng trong commit message, không dùng trong tên nhánh Git.
- Lần push đầu thiết lập upstream cho nhánh; các lần sau push về upstream đó. Nếu có nhiều remote và chưa xác định được đích, hỏi người dùng. Nếu không có thay đổi mới thì bỏ qua commit rỗng; nếu commit trước chưa push được thì thử push lại khi phù hợp.
- Khi hoàn thành nhiệm vụ, commit và push phần thay đổi còn lại dù chưa đủ 30 phút. Báo tên nhánh, commit gần nhất, kết quả push và kiểm tra đã chạy. Nếu push bị chặn bởi quyền, xác thực, mạng hoặc xung đột, báo rõ nguyên nhân và giữ commit local; không tự force-push hay khẳng định đã đồng bộ thành công.

## 2. Tổng quan và ranh giới FE

VisionAid — AI-Powered Navigation and Scene Understanding Assistant for Visually Impaired, mã dự án FA26SE013.

- B2C: Caregiver gia đình quản lý người khiếm thị được liên kết.
- B2B/B2G: Trung tâm quản lý nhân viên chăm sóc và người khiếm thị trong cùng tổ chức.
- FE là một React Web Dashboard với giao diện theo vai trò, hỗ trợ desktop và tablet.
- Người khiếm thị dùng ứng dụng React Native / Expo riêng. Không xây mobile app trong repo này.

FE gọi ASP.NET Core qua HTTPS REST API, nhận GPS/cảnh báo qua SignalR, nhận web push qua Firebase FCM và hiển thị bản đồ Mapbox.

Backend phụ trách PostgreSQL/PostGIS/pgvector, Redis, MinIO, mã hóa AES-256, VietOCR/FaceNet, gửi email qua MailKit và các hosted background jobs. FE không kết nối trực tiếp DB/Redis, không giữ credentials MinIO, không chạy job retention hoặc mã hóa/giải mã ảnh khuôn mặt bằng khóa backend.

YOLOv8n offline, Whisper offline, TTS audio-first và cảm biến phát hiện té ngã thuộc Mobile. Web chỉ cấu hình/theo dõi theo quyền và API được cung cấp.

Không thêm các thành phần từ sơ đồ mẫu: Driver/Owner App, payOS, VietQR, Cloudinary, FPT.AI, Hangfire, Seq, Contabo hoặc Nginx. Tài liệu chỉ chốt VPS / Docker Compose ở mức hệ thống. Không có thanh toán, turn-by-turn navigation hay scene captioning tổng quát trong phạm vi hiện tại.

## 3. Công nghệ: đã chốt và chưa chốt

| Hạng mục | Trạng thái |
|---|---|
| React Web | Đã chốt trong tài liệu |
| ASP.NET Core REST, SignalR, Mapbox, Firebase FCM | Đã xác định là các tích hợp FE cần dùng |
| TypeScript, build tool, router | Chưa được chốt bởi mã nguồn hoặc tài liệu đã gửi |
| HTTP client, server-state library, store library | Chưa chốt; không mặc định dự án đã có Axios, TanStack Query, Redux hoặc Zustand |
| UI library, form/validation library, CSS framework | Chưa chốt; không mặc định Tailwind, Ant Design, shadcn hay glassmorphism |
| Test runner, E2E tool, package manager | Chưa chốt; dùng công cụ phù hợp stack khi scaffold và ghi lại quyết định |

Khi được giao khởi tạo FE, có thể đề xuất React + TypeScript + Vite làm nền tảng. Đây là đề xuất kỹ thuật, không phải stack đã được người dùng xác nhận. Không cài dependency chỉ để viết tài liệu. Khi chọn stack trong nhiệm vụ triển khai, ghi rõ lựa chọn và cập nhật mục này cùng package.json/lockfile. Không ghi phiên bản "latest" như một cam kết tương thích.

## 4. Cấu trúc package FE

Cấu trúc đề xuất từ Package Diagram, chưa phải thư mục đã tồn tại:

```text
src/
  app/                 # Bootstrap, router, providers, route guards, layouts
  pages/
    auth/              # Login, caregiver registration, password recovery
    caregiver/         # Linked users, map, alerts, registry, locations, history
    center-admin/      # Organization, staff, VIUs, assignments, fleet map, reports
    super-admin/       # Organizations, users, configs, AI metrics, routing, audit
    shared/            # Profile, forbidden, not-found
  components/          # Reusable forms, tables, dialogs, map and alert components
  hooks/               # Data fetching, mutations, subscriptions, reusable UI logic
  services/
    http/              # HTTP client, auth refresh, API error normalisation
    api/               # Resource-specific calls based on the actual API contract
    realtime/          # SignalR connection and event adapters
    notifications/     # FCM browser integration
    maps/              # Mapbox client integration
  stores/              # Shared client state; no library assumed
  models/              # API DTOs, client models, explicit mapping functions
  constants/           # Role labels, route identifiers, enum display mappings
  configs/             # Validated public runtime/build configuration
  assets/              # Icons, images, fonts
  styles/              # Theme, typography, global and component styles
```

Quy tắc phụ thuộc:

- `app → pages`; `pages → components/hooks`; `hooks → services/stores`; `services → models/configs`.
- Components dùng styles/assets; components nghiệp vụ có thể dùng hook riêng khi cần, components dùng chung nên nhận props rõ ràng.
- Models/constants không import pages hoặc components. Services không import UI để hiển thị toast.
- Pages điều phối màn hình, không rải fetch/refresh-token/SignalR handlers trong từng component.
- Phân biệt server state với UI state. Không giữ nhiều bản sao độc lập của cùng dữ liệu API trong các store khác nhau.
- `Models / DTOs` là dữ liệu FE/API; không sao chép EF entities, password_hash hoặc embedding vectors sang client.
- Có thể thêm thư mục theo toolchain đã chọn; cập nhật sơ đồ/mô tả nếu thay đổi cấu trúc đáng kể. Không tạo thư mục rỗng hàng loạt nếu chưa dùng.

## 5. Vai trò, permissions và multi-tenant

| Vai trò hiển thị | Vai trò trong tài liệu BE | Phạm vi chính |
|---|---|---|
| Caregiver | `Caregiver` | Người khiếm thị có active link; quyền thao tác phụ thuộc link |
| Center Admin | `CenterAdmin` | Tổ chức của tài khoản, cùng organization_id |
| Super Admin | `Admin` | Quản trị nền tảng, không mặc định được xem GPS/ảnh khuôn mặt |
| Visually Impaired User | `VisuallyImpaired` | Mobile; không mở web dashboard đặc quyền |

DB dùng `ADMIN`, `CENTER_ADMIN`, `CAREGIVER`, `VISUALLY_IMPAIRED`; tài liệu JWT dùng tên khác như bảng trên. Enum JSON thực tế chưa xác nhận. Map ở một adapter duy nhất theo contract, không rải so sánh chuỗi/giá trị số trong UI. Vai trò không nhận biết phải bị từ chối truy cập, không fallback thành Admin.

- Guard cả route, menu và action. Ẩn button là UX; backend vẫn là nơi thực thi authorization.
- Không lấy organization_id từ URL/localStorage rồi coi đó là quyền truy cập đáng tin cậy. Backend xác định scope từ phiên đăng nhập.
- Caregiver B2C: scope theo active caregiver link, dù organization_id là null.
- Caregiver thuộc tổ chức: cả giới hạn tổ chức và liên kết được phân công đều cần được tôn trọng; cùng tổ chức không đồng nghĩa được xem mọi VIU.
- Center Admin được xem fleet map trong tổ chức. Không mặc định có quyền quản lý face registry: ma trận BE hiện chỉ cấp cho Caregiver có link và permission.
- Link có `is_primary`, `can_receive_alerts`, `can_manage_registry`, `can_manage_locations`. Primary quản lý secondary theo contract; không cho mọi secondary quyền sửa mặc định.
- `PERSONAL` và `ORGANIZATION` là hai kiểu liên kết. Assignment của trung tâm phải cùng organization_id và do Center Admin quản lý.
- Account deactivated/unlinked/permission changed: tải lại quyền, loại bỏ dữ liệu không còn được phép, hủy subscription tương ứng.
- Logout, đổi tài khoản hoặc đổi scope: xóa query cache/store nhạy cảm, selection và notification state; không để dữ liệu phiên trước xuất hiện.
- Query/cache keys phải chứa user/scope, VIU được chọn và filter liên quan để tránh trộn dữ liệu.

## 6. Nhóm màn hình cần triển khai

### 6.1 Authentication và profile

- Login; tự đăng ký cho Caregiver gia đình, không có self-register Super Admin/Center Admin/VIU.
- Profile, đổi mật khẩu, logout; recovery/reset password khi backend có contract tương ứng.
- Redirect theo role sau khi đăng nhập; xử lý return URL nội bộ an toàn, không tạo open redirect.

### 6.2 Caregiver

- Linked Users: chọn VIU đang theo dõi, xem profile, tạo tài khoản VIU B2C theo quyền.
- Live Map: vị trí hiện tại, last updated, độ chính xác, pin và network khi API cung cấp.
- Alerts: danh sách/filter, chi tiết GPS/snapshot/history, acknowledge, resolve, escalation.
- Face Registry: danh sách/tìm người, thêm/sửa tên và quan hệ, upload nhiều ảnh, chọn primary photo, xóa ảnh/người có xác nhận.
- Saved Locations / Geofences: chọn tọa độ, bán kính, tên, message đến nơi, active toggle và alert-on-enter/exit.
- Activity History: movement, OCR/QR, face recognition và emergency history. Voice history/export chỉ bật khi API và quyền hỗ trợ.
- Emergency Contacts: PHONE/ZALO/BOTH, sắp xếp priority; không tự gọi khi chỉ đang xem contact.
- Secondary Caregivers: thêm/xóa và chỉnh quyền theo Primary Caregiver workflow.
- Notification Preferences: theo loại/kênh, thể hiện rule bắt buộc.

### 6.3 Center Admin

- Organization profile; quản lý staff Caregiver và VIU cùng tổ chức.
- Tạo/cập nhật/deactivate/reactivate/reset theo API và permission thực tế; không tự suy rộng mọi action cho mọi role.
- Gán/gỡ/chuyển người phụ trách cho VIU; hiển thị giới hạn và lỗi cross-organization.
- Organization Live Fleet Map: toàn bộ VIU được phép trong tổ chức, lọc cảnh báo/trạng thái kết nối.
- Organization Reports: lịch sử cảnh báo tổng hợp, hoạt động xử lý của staff theo contract.
- Organization Notification Routing: rule override trong tổ chức; không sửa rule global.

### 6.4 Super Admin

- Organizations, Center Admin accounts, user management và caregiver linkage.
- Luồng hỗ trợ tạo Staff/VIU phải chọn organization theo API; không giả định Admin có org mặc định.
- AI Metrics: số liệu tổng hợp theo model/version/date khi API hỗ trợ. Confidence/success rate không được gắn nhãn "accuracy" nếu không có metric ground-truth tương ứng.
- System Configurations: xem/sửa, validation theo value_type/min/max, change history và rollback.
- Global Notification Rules, delivery status, failed notifications, audit logs chỉ đọc.
- Không thêm live map/GPS/face gallery toàn hệ thống chỉ vì có role Admin.

Các URL màn hình (ví dụ `/caregiver/...`, `/center-admin/...`, `/admin/...`) là routing FE đề xuất, không phải backend endpoints đã có.

## 7. Business rules ảnh hưởng UI

Các số dưới đây là mặc định trong tài liệu; lấy cấu hình/limits từ API nếu được cung cấp. Backend luôn quyết định cuối cùng.

| Quy tắc | Mặc định / hành vi |
|---|---|
| VIUs trên một Caregiver | Tối đa 3 active links |
| Caregivers trên một VIU | Tối đa 3: 1 primary + 2 secondary |
| Primary Caregiver | Một primary active; quy trình gỡ/chuyển không để UI giả tạo hoàn thành khi backend từ chối |
| Face registry | Tối đa 20 người/VIU; ít nhất 3 ảnh để active |
| File ảnh khuôn mặt | JPG/JPEG/PNG; size limit lấy từ contract, không tự bịa |
| Saved locations | Tối đa 20/VIU; arrival radius mặc định 50 m |
| Emergency contacts | Tối đa 5/VIU; priority > 0, không trùng trong danh sách active |
| Contact type | PHONE: có phone, không Zalo; ZALO: có Zalo, không phone; BOTH: có cả hai |
| Phát hiện té ngã | Grace period 15 giây thuộc hệ thống/Mobile, không chạy dispatcher trong FE |
| Chưa acknowledge | Sau 5 phút kể từ sent_at, gợi ý liên hệ/gọi 115; không tự gọi |
| Thông tin tài khoản | Email bắt buộc/duy nhất; password tối thiểu 8; tên 2–200 ký tự; phone tùy chọn nhưng hợp lệ nếu nhập |

- Không dùng boolean UI để tự active người trong registry; hiển thị `image_count`/`is_active` server trả về.
- Xóa ảnh/người là thao tác phá hủy: xác nhận rõ tên/đối tượng. Chỉ cập nhật thành công sau API; không optimistic delete vì backend phải xóa MinIO trước DB.
- AES-256 thực hiện ở backend. Hiển thị ảnh qua endpoint/URL có authorization theo contract; không lưu khóa hay đường dẫn nội bộ storage trong public client.
- Geofence là hình tròn; bán kính dương, tọa độ hợp lệ. Backend dùng PostGIS để quyết định vi phạm; FE không coi kiểm tra preview trên map là cảnh báo chính thức.
- Rule `is_mandatory=true`: người nhận không thể tắt preference. Ưu tiên org override/global do backend resolve; không gửi trùng vì FE tự merge hai bộ rules.

## 8. REST API và xử lý lỗi

Theo tài liệu BE, prefix `/api/`, không mặc định thêm `/api/v1/`. Các resource đã được mô tả: auth, users, organizations, caregiver-links, face-registry, ocr, locations, geofences, emergency-events, voice-commands, notifications, system-configs, audit-logs.

Auth flows đã được mô tả: POST `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, `/api/auth/logout`. Request fields, cookies và response tokens vẫn phải kiểm chứng từ BE. Không suy ra method/subpath chỉ từ tên resource.

Tài liệu mô tả success wrapper `ApiResponse<T>` với Success, Message, Data, Errors và pagination với Items, Page, PageSize, TotalCount, TotalPages, HasNextPage, HasPreviousPage. JSON casing/serialization cần đối chiếu contract. Error có thể là Problem Details với type/title/status/detail/errors; không ép tất cả response vào success wrapper.

- Có một HTTP adapter chung: base URL, auth, cancellation, parsing và chuẩn hóa lỗi.
- 204 không parse JSON. Kiểm tra response trước khi hiển thị toast thành công.
- 400 map validation vào field; 401 xử lý phiên; 403 hiện không có quyền; 404 không tìm thấy; 409 conflict/refetch; 422 business rule; 429 tôn trọng thời gian retry; 5xx thông báo lỗi và cho thử lại hợp lý.
- Không retry vô hạn; không tự replay thao tác ghi không idempotent hoặc hành động khẩn cấp.
- Hủy/loại bỏ response cũ khi đổi VIU, filter hoặc unmount. Debounce search; paginate ở server khi API hỗ trợ.
- Không mock endpoint thành "đã triển khai". Đặt mock riêng, dữ liệu giả được nhận diện rõ, production không tự fallback sang mock khi API lỗi.
- Backend chưa có contract: triển khai UI/types tạm có ghi chú, chốt đúng câu hỏi integration còn thiếu; không bịa endpoint hoặc payload.

## 9. Authentication và dữ liệu nhạy cảm

- JWT access token ngắn hạn và refresh-token rotation theo BE. Tài liệu mặc định access 15 phút, refresh 30 ngày; không tự kéo dài ở FE.
- Cách lưu/truyền refresh token chưa được chốt. Ưu tiên access token trong memory và refresh qua cookie HttpOnly/Secure nếu BE hỗ trợ; cookie cross-origin cần thống nhất CORS, SameSite và CSRF. FE không thể tự tạo HttpOnly cookie.
- Không mặc định lưu refresh token dài hạn trong localStorage. Nếu BE chỉ hỗ trợ token trong body, nêu rõ hợp đồng cần thống nhất trước khi làm persistent session; không giả lập cookie flow.
- Coalesce các yêu cầu refresh đồng thời; xem xét đồng bộ nhiều tab để không reuse refresh token cũ. Không refresh lặp trên lỗi refresh/login hoặc 403.
- Logout revoke theo client_device_id khi API yêu cầu, deactivate/unregister FCM phù hợp, stop SignalR và xóa state/cache nhạy cảm tại client kể cả khi request logout lỗi. Báo trung thực nếu server revoke chưa xác nhận.
- Không log token, password, ảnh khuôn mặt, OCR text hoặc tọa độ cá nhân vào console/analytics.
- Render OCR/QR/user text như text, không inject HTML. Không mở URL/deep link tùy ý tự động; chỉ cho phép scheme và hành động hợp lệ.
- Mọi biến cấu hình build public đều đọc được trên trình duyệt. Không đưa JWT secret, AES key, SMTP password, DB URL hay Firebase Admin service-account vào FE.

## 10. SignalR, FCM và Mapbox

### SignalR

- Hub được tài liệu BE xác định là `/hubs/location`; dùng client tương thích backend, URL qua config.
- Events đã nêu: `LocationUpdated`, `EmergencyAlert`, `EscalationSuggestion`, `GeofenceBreach`, `ArrivalNotification`. Event cuối chủ yếu dành cho Mobile; không tự subscribe/cấp quyền web.
- Payload, subscribe methods và permission checks chưa được cung cấp: lấy từ BE trước khi tích hợp.
- Nhóm server: `caregiver_{caregiverId}`, `org_{organizationId}`, `viu_{userId}`. Đây không phải quyền tự join nhóm tùy ý từ FE; membership phải do backend xác thực.
- Quản lý connection lifecycle tập trung, tránh đăng ký handler nhiều lần qua rerender/Strict Mode. Cleanup khi logout/unmount/scope change.
- Hiển thị reconnect/disconnected. Sau reconnect: đồng bộ subscription được phép và refetch trạng thái hiện tại; không mặc định đã nhận mọi event lúc mất kết nối.
- Loại trùng bằng event ID/version theo payload; bảo vệ khỏi out-of-order update. Nếu payload chưa đủ, refetch thay vì đoán state.

### Firebase FCM

- Luồng push: Backend → FCM → Web client. FE dùng browser SDK/service worker; không dùng FirebaseAdmin.
- Xin notification permission sau hành động rõ ràng của người dùng, xử lý denied/unsupported mà dashboard vẫn hoạt động.
- Đăng ký token gắn user/device theo API; xử lý token đổi và logout. Không giả định browser đóng vẫn nhận được mọi thông báo.
- Foreground/background notifications tránh trùng với SignalR; click notification phải qua auth/permission guard.

### Mapbox và trạng thái realtime

- Web render map; reverse geocoding chính được tài liệu đặt ở backend. Dùng public Mapbox token được giới hạn phạm vi theo triển khai; không lộ secret token.
- Thống nhất `[longitude, latitude]` ở adapter theo SDK/API; không đảo lat/lng. Valid ranges: latitude [-90,90], longitude [-180,180].
- Hiển thị last recorded time và stale/offline rõ ràng. Không biến vị trí cũ thành "đang trực tiếp" khi mất SignalR/GPS.
- Pin/network/accuracy là giá trị nullable nếu API chưa có; không hiển thị giá trị 0 giả.
- Map load failure/không có quyền vị trí/dữ liệu rỗng đều có trạng thái UI; có danh sách tương đương để thao tác bằng bàn phím.
- Mốc giờ API xử lý nhất quán theo timezone hợp đồng; hiển thị múi giờ cho lịch sử/filter. Không trộn giờ local không offset với timestamp UTC.

## 11. Emergency và trạng thái cảnh báo

Giá trị nghiệp vụ trong DB: `DETECTED`, `DISMISSED`, `SENT`, `ACKNOWLEDGED`, `ESCALATED`, `RESOLVED`, `CALLED`. Map JSON enum theo BE; nhãn UI có thể dịch nhưng không thay enum bằng New/Viewed/Resolved.

- Fall: DETECTED → DISMISSED hoặc SENT sau grace period; SENT → ACKNOWLEDGED; các bước ESCALATED/RESOLVED/CALLED theo state machine được BE thực thi.
- Manual/voice/gesture bắt đầu SENT, không áp grace period của fall.
- Tài liệu BE cho phép escalate từ SENT hoặc ACKNOWLEDGED. Không suy ra mọi trạng thái đều chuyển qua lại được.
- Chỉ hiện action được quyền và hợp lệ với state; khóa submit đang chạy, lấy response authoritative sau mutation.
- 409 do người khác vừa xử lý: refetch và thông báo trạng thái mới, không ghi đè âm thầm.
- History hiển thị from/to, actor, timestamp; system actor có thể null.
- Browser không tự chuyển DETECTED → SENT, tự resolve hoặc tự đánh dấu CALLED. `tel:115` mở dialer không chứng minh cuộc gọi đã diễn ra.
- Escalation suggestion không phải emergency call tự động. Snapshot đã cleanup/không có camera hiển thị placeholder, không báo hỏng toàn bộ alert.

## 12. UX, accessibility và quy ước code

- Giao diện dashboard đơn giản, nhất quán; chưa có visual theme được chốt. Không tự áp glassmorphism, icon mẫu hoặc framework UI vào sản phẩm khi không có yêu cầu.
- Mọi trang có loading, empty, error, forbidden và pending states thích hợp; không dùng màn hình trắng khi lỗi.
- Bảng có pagination/filter, trạng thái và action rõ ràng. Không ẩn dữ liệu bằng màu đơn thuần.
- Theo yêu cầu WCAG 2.1 trong báo cáo: semantic HTML, labels, keyboard navigation, visible focus, contrast và text thay thế phù hợp. Đây là mục tiêu, không tự tuyên bố đạt chuẩn khi chưa kiểm tra.
- Dialog quản lý focus và trả focus khi đóng. Live alert dùng live-region hợp lý, không liên tục giật focus hoặc spam thông báo.
- Confirm trước xóa registry, gỡ liên kết, deactivate account, rollback config và thay đổi có tác động lớn; mô tả đối tượng cụ thể.
- Tách DTO ↔ view model; tránh `any` nếu dùng TypeScript. Validation FE cải thiện UX, không thay validation BE.
- Không duplicate role/permission checks: dùng một policy helper/hook chung, kiểm tra đúng resource/link.
- Không optimistic update trạng thái khẩn cấp/quyền/xóa dữ liệu sinh trắc học. Thao tác UI ít rủi ro có thể optimistic nếu có rollback.
- Không đưa thư viện chỉ để dùng một hàm nhỏ khi nền tảng đã đáp ứng. Không tạo abstraction vượt nhu cầu hiện tại.
- Giữ ngôn ngữ giao diện nhất quán; tiếng Việt phù hợp người dùng mục tiêu, tên kỹ thuật trong code dùng tiếng Anh. Không làm i18n đa ngôn ngữ vượt phạm vi nếu chưa yêu cầu.

## 13. Những điểm tài liệu chưa thống nhất

Không tự xem các vấn đề sau là đã giải quyết:

| Vấn đề | Cách xử lý FE |
|---|---|
| .NET 8 so với .NET 9 | FE ghi ASP.NET Core, không phụ thuộc tên phiên bản trong UI |
| OCR/emergency retention | Word yêu cầu xóa history sau hạn; DB.txt và BE giữ row, cleanup media sau 90 ngày/12 tháng. Không tự xóa row trên FE hay hứa retention khác backend; chốt trước khi làm retention settings |
| GPS chỉ linked Caregiver so với Center Admin fleet map | Hiển thị quyền Center Admin theo org như ma trận BE và chức năng fleet map; xác minh endpoint authorization thực tế |
| Secondary read-only so với permission flags | Dùng permissions resource thực tế; không tự cấp write chỉ vì là Caregiver hoặc tự cấm mọi secondary khi đã được backend cấp quyền |
| Audit logs của Center Admin | Báo cáo tổ chức có activity logs, ma trận BE dành system audit cho Super Admin. Tách organization activity khỏi global system audit |
| Chính xác một primary so với account bị deactivate | Cần trạng thái chờ reassignment do BE trả về; không giả tạo caregiver thay thế |
| Enum casing, DTOs, uploads, refresh cookie, FCM APIs | Chưa có contract thực tế; ghi rõ TODO integration, không coi thiết kế DB là API spec |

## 14. Kiểm tra và điều kiện hoàn thành

Chỉ chạy lệnh được định nghĩa trong package.json/toolchain thực tế. Hiện chưa có build/dev/test commands; không báo `npm run build` đã pass khi chưa scaffold.

Các kiểm tra quan trọng khi tính năng tương ứng đã tồn tại:

1. Role routing và resource permissions: B2C/B2B, primary/secondary, org khác, Admin không xem GPS/registry.
2. Hết phiên, refresh đồng thời, logout cleanup, đổi tài khoản không rò cache.
3. SignalR reconnect, handler không trùng, stale GPS, duplicate/out-of-order alert.
4. Emergency action hợp lệ, conflict 409, escalation không tự gọi 115.
5. Registry dưới 3 ảnh, upload lỗi, delete API fail giữ nguyên dữ liệu; file format và giới hạn đúng contract.
6. Form validation, pagination/filter race, 204 response, permission denied và thiếu media.
7. Keyboard/focus/dialog, desktop/tablet, notification denied, map unavailable.

Ưu tiên unit/integration tests cho permission mapping, API adapter và state logic; component/E2E cho luồng chính theo công cụ đã chọn. Kiểm tra build/typecheck/lint khi có scripts. Không áp số coverage backend 70% thành cam kết FE chưa được thống nhất.

## 15. Thứ tự triển khai đề xuất

1. Chốt toolchain và API contract cơ bản; scaffold packages, routing, layouts, configs.
2. Auth/profile, role/resource guards, HTTP adapter và session lifecycle.
3. Linked users, organization/staff/VIU management, assignments.
4. Live map, SignalR và trạng thái reconnect/stale.
5. Emergency alerts, history, FCM và notification preferences.
6. Face registry, saved locations/geofences, emergency contacts, activity history.
7. Center reports/routing; Super Admin configs, AI metrics, audit và delivery monitoring.
8. Kiểm tra integration, permissions, accessibility và production build theo môi trường thực tế.

Roadmap này không phải lệnh tự động tạo toàn bộ hệ thống. Cập nhật file khi người dùng chốt stack, API contracts hoặc thay đổi scope; giữ rõ ranh giới giữa yêu cầu, đề xuất và implementation đã kiểm chứng.
