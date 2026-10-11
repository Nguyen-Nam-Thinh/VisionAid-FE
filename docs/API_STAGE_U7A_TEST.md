# U7a — Quản trị máy chủ ICE

Ngày 2026-10-11, đối chiếu BE local f277b6a: WebRtcController, Get/Create/Update/DeleteIceServer handlers, validators, DTO, EF configuration và GetPublicIceServersHandler.

Admin → **Máy chủ cuộc gọi**, route `/admin/ice-servers`. Service `src/services/api/iceServers.ts`; UI `src/pages/super-admin/ApiIceServers.tsx`.

| API | Sử dụng |
|---|---|
| GET /api/webrtc/ice-servers | Danh sách phân trang20, isActive; đọc lại snapshot trước sửa/xóa |
| POST /api/webrtc/ice-servers | Popup thêm Stun/Turn, priority; BE luôn tạo isActive=true |
| PUT /api/webrtc/ice-servers/{id} | Popup sửa loại, URI, username, credential, priority và isActive |
| DELETE /api/webrtc/ice-servers/{id} | Popup xác nhận, response204 |

Thêm 4 operations, **116/144** callers Web. Public ICE endpoint không gọi thêm: luồng U6 lấy ICE trong initiate/accept. Không cài Coturn, không tự gọi thử hoặc bật camera/mic.

## Contract và giới hạn

- Admin được kiểm tra trong handler BE và FE; controller chỉ Authorize, không suy quyền từ controller đó. Query key theo actor/filter/page, AbortSignal, gcTime0, không retry mutation.
- URI cần đúng loại: Stun dùng stun:host:port; Turn dùng turn:/turns:, có thể ?transport=udp hoặc tcp. IPv6 dùng ngoặc vuông. Không nhận HTTP, userinfo, path, query lạ, cổng0 hoặc >65535. BE chưa hỗ trợ stuns:. Priority số nguyên1–1000, số nhỏ được xếp trước; không cam kết thứ tự relay thực tế của browser ICE.
- TURN cần username và credential mỗi lần PUT, kể cả chỉ đổi priority hoặc tắt máy chủ. Không có contract giữ credential khi bỏ trống. Ô credential mở trống, autocomplete=new-password; không đưa credential cũ vào cache/form, không echo lỗi BE có thể chứa credential. STUN gửi hai trường này null, chuyển TURN sang STUN sẽ xóa thông tin đăng nhập.
- Username/credential tối đa200 theo EF; URI tối đa300. Credential gửi nguyên văn, không trim làm đổi mật khẩu. Có xác nhận trước mọi ghi vì thay đổi ảnh hưởng kết nối.
- BE GET/POST/PUT vẫn trả plaintext credential; FE chỉ loại khỏi dữ liệu cache/UI, **raw response vẫn có**. BE nên tách DTO quản trị với credential write-only/hasCredential, hỗ trợ update giữ giá trị hiện hữu và chính sách TURN credential ngắn hạn. Public ICE và session config cần thông tin để client kết nối, phải xem lại cơ chế phát credential phía BE nếu dùng shared static secret.
- Thay credential tại Web chỉ cập nhật DB của BE, không rotate tài khoản trên TURN server. Quản trị viên phải phối hợp cấu hình TURN thật; không dùng credential ví dụ trong production.
- FE đọc lại cùng trang/filter và so snapshot trước sửa/xóa; dòng mất/chuyển trang/thay đổi báo409. Đây không phải CAS nguyên tử; BE cần ETag/version để xử lý race giữa đọc và ghi. Không có GET detail riêng.
- BE chưa chặn xóa/tắt máy chủ hoạt động cuối cùng. FE có xác nhận tác động, không đoán số máy chủ từ một trang. Cần chính sách BE nếu muốn bắt buộc luôn có relay dự phòng. Lưu không chứng minh máy chủ reachable, TLS/DNS/credential hợp lệ hoặc mọi cuộc gọi đang diễn ra đã dùng cấu hình mới.
- Kết quả ghi không rõ, lỗi mạng/5xx hoặc response không khớp: form ngừng submit; đóng và tải lại danh sách trước khi gửi lại. Không tự retry tạo/xóa.

## Checklist test thật

Chỉ test ghi với môi trường TURN thử nghiệm hoặc cấu hình đã được thống nhất. Không sửa/xóa relay production đang phục vụ để thử. Đợt này không ghi cấu hình BE live.

1. Admin mở menu, list/sort priority, lọc bật/tắt, trang sau khi >20. Caregiver/CenterAdmin không có menu, URL bị forbidden; BE cũng phải từ chối token sai quyền.
2. Thêm STUN hợp lệ, xác nhận, đối chiếu POST không có isActive, BE trả true. Thử URL sai/type mismatch/port sai/priority lẻ: không ghi. Ô username/credential không dùng cho STUN.
3. Thêm TURN thử nghiệm với credential đúng. Mở sửa phải thấy credential trống; chỉ đổi priority mà chưa nhập credential phải bị chặn. Nhập credential muốn áp dụng, đổi priority/trạng thái và lưu. Kiểm tra body PUT và danh sách tải lại.
4. Kiểm tra đổi mật khẩu có phối hợp TURN thật. Tạo cuộc gọi U6 giữa Web và Mobile ở hai mạng khác nhau để xác minh STUN/TURN relay; có thể cần môi trường buộc relay riêng khi nghiệm thu. UI không cung cấp nút tự test hoặc thay ICE policy của luồng U6.
5. Xóa popup có URL đúng. Hủy/Escape không gửi DELETE; xác nhận gọi đúng ID,204 xóa dòng sau tải lại. Không xóa server chính trong test.
6. Hai Admin sửa: snapshot đổi báo409 trước ghi. Test403/422/500/mạng đứt, form không tự replay; lỗi raw không echo secret. Đối chiếu trạng thái sau lỗi trước lần gửi tiếp.
7. Desktop/mobile375, popup giữa viewport và cuộn được xuống nút lưu, keyboard/Escape trả focus, table cuộn ngang. Logout/đổi role không còn dữ liệu Admin.

## Kiểm tra và bàn giao

155 unit tests và 3 E2E chọn lọc đạt qua các lượt chạy; lint/build đạt. Build còn cảnh báo bundle lớn vốn có. Browser tests dùng fixture kiểm tra CRUD, credential không prefill, lỗi ghi không rõ, CenterAdmin bị chặn và hồi quy form13a. Chưa nghiệm thu TURN/BE/Mobile thật. Detector giao diện vẫn lỗi launcher cache_directory_failed; rà bằng ảnh desktop/mobile và DESIGN.md.

Tiếp theo **U7b — theo dõi Hybrid guidance** khi người dùng yêu cầu; kiểm tra contract và quyền trước triển khai. Chính sách riêng tư vẫn chờ nội dung/version.
