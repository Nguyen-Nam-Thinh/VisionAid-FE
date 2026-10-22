import { t, msg, labelMap } from '../../i18n';
import { ServiceError } from '../contracts';
/** Transport only; callers must supply confirmed endpoints and payload mapping. No retries or mock fallback. */
// Localized text for BE `errorCode` values (ProblemDetails extension), resolved at throw time.
export const errorCodeMessages: Record<string, string> = labelMap({
  // Tài khoản và đăng nhập
  WRONG_CURRENT_PASSWORD: msg('Mật khẩu hiện tại không đúng.'),
  EMAIL_ALREADY_REGISTERED: msg('Email này đã được đăng ký. Dùng email khác hoặc đăng nhập.'),
  ORG_ID_REQUIRED: msg('Cần chọn tổ chức cho tài khoản không phải quản trị hệ thống.'),
  USER_INACTIVE: msg('Tài khoản đang bị vô hiệu hóa.'),
  USER_DELETED: msg('Tài khoản đã bị xóa.'),
  USER_STATUS_UNCHANGED: msg('Tài khoản đã ở trạng thái này.'),
  WRONG_USER_ROLE: msg('Vai trò tài khoản không phù hợp với thao tác này.'),
  CANNOT_DELETE_SELF: msg('Không thể tự xóa tài khoản của mình.'),
  CANNOT_DEACTIVATE_SELF: msg('Không thể tự vô hiệu hóa tài khoản của mình.'),
  // Tổ chức
  ORG_STATUS_UNCHANGED: msg('Tổ chức đã ở trạng thái này.'),
  ORG_MISMATCH: msg('Các tài khoản không cùng tổ chức.'),
  ORG_REQUIRED_FOR_LINK: msg('Liên kết tổ chức cần hai tài khoản thuộc cùng một tổ chức.'),
  TAX_CODE_ALREADY_EXISTS: msg('Mã số thuế đã được dùng cho tổ chức khác.'),
  // Liên kết chăm sóc
  LINK_ALREADY_EXISTS: msg('Hai tài khoản này đã có liên kết đang hoạt động.'),
  SELF_LINK_NOT_ALLOWED: msg('Không thể liên kết một tài khoản với chính nó.'),
  ALREADY_PRIMARY_LINK: msg('Liên kết này đã là người chăm sóc chính.'),
  MAX_CAREGIVERS_REACHED: msg('Người được chăm sóc đã đủ 3 người chăm sóc.'),
  MAX_VIUS_PER_CAREGIVER_REACHED: msg('Bạn đã có tối đa 3 người được chăm sóc.'),
  NO_PRIMARY_CAREGIVER: msg('Người được chăm sóc chưa có người chăm sóc chính.'),
  CAREGIVER_ID_REQUIRED: msg('Cần chọn người chăm sóc.'),
  VIU_ID_REQUIRED: msg('Cần chọn người được chăm sóc.'),
  // Liên hệ, địa điểm
  CONTACT_PRIORITY_TAKEN: msg('Thứ tự ưu tiên đã được dùng cho liên hệ khác. Chọn số khác.'),
  CONTACT_STATUS_UNCHANGED: msg('Liên hệ đã ở trạng thái này.'),
  MAX_EMERGENCY_CONTACTS_REACHED: msg('Đã đủ 5 liên hệ khẩn cấp. Xóa bớt trước khi thêm.'),
  PHONE_REQUIRED: msg('Cần nhập số điện thoại cho loại liên hệ này.'),
  ZALO_LINK_REQUIRED: msg('Cần nhập liên kết Zalo cho loại liên hệ này.'),
  MAX_SAVED_LOCATIONS_REACHED: msg('Đã đủ 20 địa điểm. Xóa bớt trước khi thêm.'),
  // Gương mặt
  FACE_NOT_DETECTED: msg(
    'Không tìm thấy khuôn mặt trong ảnh. Chọn ảnh rõ mặt, đủ sáng và chỉ có một người.',
  ),
  NO_FACE_DETECTED: msg(
    'Không tìm thấy khuôn mặt trong ảnh. Chọn ảnh rõ mặt, đủ sáng và chỉ có một người.',
  ),
  FACE_REGISTRY_FULL: msg('Danh bạ gương mặt đã đủ 20 người.'),
  FACE_SERVICE_UNAVAILABLE: msg(
    'Dịch vụ nhận diện khuôn mặt tạm thời không hoạt động. Thử lại sau.',
  ),
  UNSUPPORTED_IMAGE_TYPE: msg('Chỉ nhận ảnh JPEG, PNG hoặc WebP.'),
  IMAGE_CONTENT_TYPE_MISMATCH: msg('Nội dung tệp không khớp định dạng ảnh đã chọn.'),
  IMAGE_TOO_SMALL: msg('Ảnh quá nhỏ để nhận diện. Chọn ảnh có độ phân giải cao hơn.'),
  // License, gói, thanh toán
  LICENSE_KEY_INVALID: msg('Key không hợp lệ, đã được kích hoạt hoặc đã hết hạn.'),
  LICENSE_KEY_EXPIRED: msg('Key đã hết hạn.'),
  LICENSE_POOL_FULL: msg('Kho license đã hết suất. Mua thêm gói Business.'),
  LICENSE_POOL_NOT_ACTIVE: msg('Kho license không còn hiệu lực. Kiểm tra gói Business.'),
  CANNOT_CANCEL_ORG_SUBSCRIPTION: msg(
    'Gói này được kích hoạt bằng key của trung tâm nên không tự hủy được. Hãy liên hệ quản trị trung tâm.',
  ),
  LICENSE_POOL_NOT_FOUND: msg('Tổ chức chưa có kho license. Mua gói Business trước.'),
  LICENSE_POOL_ALREADY_SUSPENDED: msg(
    'Kho license đã ở trạng thái tạm ngưng. Tải lại để xem trạng thái mới.',
  ),
  LICENSE_POOL_NOT_SUSPENDED: msg(
    'Kho license không còn tạm ngưng. Tải lại để xem trạng thái mới.',
  ),
  VIU_LICENSE_ALREADY_ASSIGNED: msg('Người này đã được cấp license.'),
  GRACE_PERIOD_EXPIRED: msg('Đã quá thời gian gia hạn. Vui lòng mua hoặc gia hạn gói.'),
  WRONG_PACKAGE_TYPE: msg('Loại gói không phù hợp với tài khoản.'),
  PACKAGE_INVALID_PRICE: msg('Giá gói không hợp lệ.'),
  LICENSE_PACKAGE_CODE_EXISTS: msg('Mã gói đã tồn tại.'),
  PAYMENT_NOT_CANCELLABLE: msg('Giao dịch này không thể hủy nữa.'),
  // Cảnh báo, cuộc gọi, cấu hình, thông báo
  INVALID_EVENT_STATUS_TRANSITION: msg(
    'Cảnh báo đã đổi trạng thái. Tải lại để xem trạng thái mới.',
  ),
  EVENT_NOT_ACTIVE: msg('Cảnh báo này không còn đang xử lý.'),
  INVALID_CALL_STATUS_TRANSITION: msg('Cuộc gọi đã kết thúc hoặc đổi trạng thái.'),
  SESSION_ALREADY_ENDED: msg('Cuộc gọi đã kết thúc.'),
  WEBRTC_DISABLED: msg('Tính năng gọi đang tắt trên hệ thống.'),
  NOTIFICATION_RULE_DUPLICATE: msg('Đã có quy tắc cho loại thông báo, kênh và vai trò này.'),
  CONFIG_VALUE_INVALID: msg('Giá trị cấu hình không hợp lệ.'),
  CONFIG_ROLLBACK_NO_PREVIOUS_VALUE: msg('Dòng lịch sử này không có giá trị trước để khôi phục.'),
  INVALID_ICE_SERVER_TYPE: msg('Loại máy chủ kết nối không hợp lệ.'),
});
export async function request<T>(
  url: string,
  init: RequestInit = {},
  transport: typeof fetch = fetch,
  responseType: 'json' | 'blob' = 'json',
): Promise<T | undefined> {
  const response = await transport(url, init);
  if (response.status === 204) return undefined;
  if (response.ok && responseType === 'blob') return (await response.blob()) as T;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    if (response.ok) throw new ServiceError(t('Phản hồi JSON không hợp lệ từ máy chủ.'), 502);
    body = null;
  }
  if (!response.ok) {
    const problem = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const errors =
      problem.errors && typeof problem.errors === 'object'
        ? (problem.errors as Record<string, unknown>)
        : {};
    if (response.status === 402)
      throw new ServiceError(
        t(
          'Máy chủ yêu cầu kiểm tra license cho thao tác này. Phiên đăng nhập vẫn được giữ. Mở mục License để xem trạng thái hoặc tải lại sau khi license được cập nhật.',
        ),
        402,
      );
    let message =
      typeof problem.detail === 'string'
        ? problem.detail
        : typeof problem.title === 'string'
          ? problem.title
          : t('Yêu cầu thất bại. Mã lỗi: {status}.', { status: response.status });
    const code = typeof problem.errorCode === 'string' ? problem.errorCode : undefined;
    // Known BE error codes get a localized message; unknown codes keep the BE detail.
    if (code && errorCodeMessages[code]) message = errorCodeMessages[code];
    if (response.status === 403) message = t('Bạn không có quyền thực hiện thao tác này.');
    if (response.status >= 500)
      message = t(
        'Máy chủ đang gặp sự cố. Vui lòng tải lại dữ liệu để kiểm tra kết quả trước khi thử lại.',
      );
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const seconds =
        retryAfter === null
          ? NaN
          : /^\d+$/.test(retryAfter)
            ? Number(retryAfter)
            : Math.ceil((Date.parse(retryAfter) - Date.now()) / 1000);
      message =
        Number.isFinite(seconds) && seconds > 0
          ? t('Bạn thao tác quá nhanh. Vui lòng thử lại sau {seconds} giây.', { seconds })
          : t('Bạn thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại.');
    }
    throw new ServiceError(
      message,
      response.status,
      Object.fromEntries(
        Object.entries(errors).map(([key, v]) => [key, Array.isArray(v) ? v.join(' ') : String(v)]),
      ),
      code,
    );
  }
  return body as T;
}
