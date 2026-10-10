# Đợt 10 — Contract cần bổ sung trước khi nối quản lý ảnh

Khảo sát 2026-10-10. BE local: `48a7346`. Đã đọc Swagger deploy tại
https://api.visionaid.net/swagger/v1/swagger.json bằng GET không đăng nhập.
Chưa gọi API dữ liệu người dùng hoặc upload ảnh, chưa sửa BE.

## Điểm chặn đã xác minh

Source `FaceRegistryController.cs` và Swagger deploy đều có:

- POST/GET `/api/face-registry/persons`.
- GET/PUT/DELETE `/api/face-registry/persons/{id}`.
- POST `/api/face-registry/persons/{personId}/photos`.
- DELETE `/api/face-registry/persons/{personId}/photos/{photoId}`.
- PATCH `/api/face-registry/persons/{personId}/photos/{photoId}/primary`.

Không tìm thấy GET preview/content ảnh trong controller hoặc danh sách paths Swagger.
Trong source local, `UploadFacePhotoHandler` mã hóa AES rồi ghi MinIO dạng
`{viuId}/{personId}/{imageId}.enc`, content type `application/octet-stream`.
`FaceRegistryImageResponse` trả `storagePath`, embedding và metadata, không trả URL ảnh đã giải mã.
`DecryptAsync` hiện chỉ thấy khai báo và implementation, không thấy caller trong source.

Vì vậy không dùng storagePath làm src của img, không tạo presigned URL trỏ tới .enc,
không chuyển AES key sang FE và không giả lập preview bằng ảnh local sau reload.
Thiếu preview khiến người dùng không thể xác định đúng ảnh trước khi chọn ảnh chính hoặc xóa.
PLAN.md đã quy định thiếu contract media là blocker; đợt 10 vẫn CHƯA NỐI, tổng caller vẫn 80/140.

## Đề xuất gửi người làm BE — chưa phải endpoint đã tồn tại

Bổ sung một endpoint ví dụ:

`GET /api/face-registry/persons/{personId}/photos/{photoId}/content`

Contract tối thiểu để FE tích hợp:

1. Bearer authentication; role Caregiver và active link tới VIU của người trong registry.
   Chốt quyền xem theo chính sách GET registry hiện tại; upload/delete/primary vẫn cần canManageRegistry.
2. Kiểm tra photo thuộc đúng personId, person chưa bị xóa, đúng scope được phép;
   trả 403/404 phù hợp khi không có quyền hoặc resource không còn tồn tại.
3. BE đọc MinIO và giải mã tại server; trả bytes JPEG/PNG/WebP với Content-Type chính xác,
   Cache-Control: private, no-store. Không đưa key hoặc storage credential vào response.
   Chốt cách xác định MIME vì ảnh đang được lưu bằng tên .enc.
4. Quy định 404 khi ảnh đã mất, lỗi giải mã/storage, và hành vi khi link bị thu hồi.
5. Cập nhật Swagger response content/binary. FE sẽ fetch có Authorization, dùng blob URL tạm
   và revoke khi đóng popup, đổi scope hoặc logout; không đặt JWT trong query string.

Nếu BE chọn thumbnail hoặc URL ngắn hạn thay cho endpoint binary, cung cấp contract tương đương
và cơ chế authorization; không mở public bucket ảnh khuôn mặt.

## Hai điểm liên quan cần BE xem cùng

- DELETE photo và PATCH primary nhận personId trên route nhưng controller chỉ truyền photoId
  xuống command. Handler có kiểm tra quyền theo person thực tế của ảnh, nên không kết luận đây
  là bypass quyền; tuy nhiên route không kiểm tra cặp personId/photoId. Nên bổ sung kiểm tra cặp
  này cho tính nhất quán và tránh thao tác nhầm resource.
- DTO ảnh đang chứa embeddingVector. Web quản lý ảnh không cần vector nhận diện. Nên trả DTO
  metadata riêng cho Caregiver, giữ contract Mobile riêng nếu Mobile cần embedding.

## Contract upload đã đọc được

- multipart/form-data, file field `photo`; mỗi request một ảnh.
- JPEG, PNG, WebP; tối đa 10 MiB theo validator local, không phải giới hạn demo 2 MB.
- Field tùy chọn: setAsPrimary, captureAngle, imageQualityScore, embeddingVector, embeddingModel.
  Web không tự tạo embedding hoặc điểm chất lượng để gửi.
- FaceNet không trả embedding vẫn có thể lưu ảnh. isActive/imageCount từ BE không tự chứng minh
  ảnh đã sẵn sàng nhận diện thành công. Sau upload phải GET lại trạng thái authoritative.
- DELETE xóa MinIO trước DB; lỗi phải giữ trạng thái UI và cho tải lại, không optimistic delete.
- Nội dung/version chính sách vẫn chờ người dùng theo quyết định trước đó; không tự tick hoặc
  tạo consent pháp lý. Cần chốt cách xác nhận sử dụng ảnh trước khi mở upload ảnh thật.

## Tiếp tục sau khi BE cập nhật

1. Đọc lại source và Swagger, xác minh endpoint media và quyền, không chỉ dựa vào path được đề xuất.
2. Nối persons CRUD + upload + preview + delete + primary thành một checkpoint có thể test.
3. Test create → upload ít nhất 3 ảnh → GET trạng thái → reload vẫn xem ảnh → primary → delete.
4. Test quyền bị thu hồi, VIU khác, photo không thuộc person, license, file sai định dạng/quá lớn,
   MinIO/FaceNet lỗi, upload một phần và logout trong lúc đang tải ảnh.

Đợt 11b không tự bắt đầu thay đợt 10. Chờ contract BE hoặc chỉ dẫn đổi thứ tự từ người dùng.
