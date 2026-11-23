import { t, msg, labelMap, type MessageId } from '../../i18n';

/**
 * Plain Vietnamese for the English sentences the server sends back (ProblemDetails `detail` and
 * validation messages). Known sentences get their own wording; any other English sentence is
 * replaced by a general message for its HTTP status, so people never read raw English.
 */

/** Error codes added after the main table in client.ts, kept here with their wording. */
export const extraCodeMessages: Record<string, string> = labelMap({
  CANNOT_ACCEPT_OWN_INVITATION: msg('Bạn không thể tự nhận lời mời do chính mình tạo.'),
  INVITATION_INVALID_OR_EXPIRED: msg(
    'Lời mời không đúng, đã được dùng hoặc đã hết hạn. Hãy xin người mời tạo mã mới.',
  ),
  CLIENT_EVENT_ID_CONFLICT: msg('Cảnh báo này đã được tạo trước đó.'),
  DOWNGRADE_MUST_BE_SCHEDULED: msg(
    'Gói này rẻ hơn gói hiện tại nên chỉ đổi được vào cuối kỳ đã thanh toán. Hãy hẹn đổi gói.',
  ),
  NOT_A_DOWNGRADE: msg(
    'Chỉ hẹn đổi được sang gói rẻ hơn. Gia hạn hoặc nâng cấp thì thanh toán trực tiếp.',
  ),
  NO_SCHEDULED_CHANGE: msg('Kho suất sử dụng này chưa có lịch đổi gói nào.'),
  FACE_PERSON_NOT_IN_REGISTRY: msg('Người này không có trong danh bạ gương mặt.'),
  FEATURE_NOT_IN_PLAN: msg('Gói hiện tại không có tính năng này. Hãy nâng cấp gói.'),
  INVALID_DATE_RANGE: msg('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'),
  REPORT_RANGE_TOO_LARGE: msg('Khoảng ngày quá dài. Hãy chọn khoảng ngắn hơn.'),
  LICENSE_KEY_ALREADY_ACTIVATED: msg(
    'Mã kích hoạt này đã được một gia đình dùng nên không thu hồi được nữa.',
  ),
  LICENSE_KEY_ALREADY_REVOKED: msg('Mã kích hoạt này đã được thu hồi trước đó.'),
  LICENSE_KEY_STATE_CHANGED: msg(
    'Mã kích hoạt vừa được dùng hoặc thay đổi trong lúc bạn thu hồi. Hãy tải lại danh sách.',
  ),
  LICENSE_POOL_EXPIRED: msg('Kho suất sử dụng đã hết hạn. Hãy gia hạn gói trước khi cấp suất.'),
  NOTIFICATION_RETRY_IN_PROGRESS: msg('Thông báo này đang được gửi lại, hãy chờ một chút.'),
  ORGANIZATION_INACTIVE: msg(
    'Tổ chức của tài khoản này đang bị vô hiệu hóa. Hãy kích hoạt lại tổ chức trước.',
  ),
  PACKAGE_IN_USE: msg('Gói đã có người mua hoặc đang được dùng, hãy ngừng bán thay vì xóa.'),
  PACKAGE_PROTECTED: msg('Gói mặc định của hệ thống không xóa được. Hãy ngừng bán nếu không dùng.'),
  PAYMENT_PROVIDER_REJECTED: msg(
    'Cổng thanh toán đang tạm ngưng nhận đơn. Chưa có tiền nào bị trừ. Vui lòng thử lại sau hoặc liên hệ quản trị hệ thống.',
  ),
  RESTORE_WINDOW_EXPIRED: msg('Đã quá thời hạn khôi phục tài khoản này.'),
  SPOOF_DETECTED: msg('Đây có vẻ là ảnh chụp hoặc màn hình, không phải người thật.'),
  USER_NOT_DELETED: msg('Tài khoản này chưa bị xóa nên không cần khôi phục.'),
});

/** Known English sentences (matched loosely, case-insensitive) and their Vietnamese wording. */
const sentences: [RegExp, MessageId][] = [
  [/invalid email or password/i, msg('Email hoặc mật khẩu không đúng.')],
  [/account is deactivated/i, msg('Tài khoản đã bị khóa. Hãy liên hệ quản trị viên.')],
  [/current password is incorrect/i, msg('Mật khẩu hiện tại không đúng.')],
  [/new password must be different/i, msg('Mật khẩu mới phải khác mật khẩu hiện tại.')],
  [/already registered/i, msg('Email này đã được đăng ký. Dùng email khác hoặc đăng nhập.')],
  [
    /invalid or expired reset token/i,
    msg('Mã khôi phục không đúng hoặc đã hết hạn. Hãy yêu cầu email mới.'),
  ],
  [
    /refresh token (has expired|reuse)|invalid refresh token/i,
    msg('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'),
  ],
  [
    /password must/i,
    msg('Mật khẩu cần 8–100 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.'),
  ],
  [
    /(password|email|full name|policy version) is required/i,
    msg('Vui lòng nhập đủ các ô bắt buộc.'),
  ],
  [/invalid email format/i, msg('Email chưa đúng, ví dụ ten@gmail.com.')],
  [/full name must/i, msg('Họ và tên cần từ 2 đến 200 ký tự.')],
  [
    /phone number must be a valid/i,
    msg('Nhập số di động Việt Nam 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.'),
  ],
  [/license pool is full/i, msg('Kho đã hết suất sử dụng. Hãy mua thêm gói Business rồi thử lại.')],
  [
    /license pool is not active|license pool has expired/i,
    msg('Kho suất sử dụng không còn hiệu lực. Hãy kiểm tra gói Business.'),
  ],
  [/license key has expired/i, msg('Mã kích hoạt đã hết hạn. Hãy xin trung tâm mã mới.')],
  [
    /online payment is currently disabled/i,
    msg('Thanh toán trực tuyến đang tạm ngưng. Vui lòng thử lại sau.'),
  ],
  [/grace period has expired/i, msg('Đã quá thời gian chờ hủy; cảnh báo khẩn cấp đã được gửi đi.')],
  [/only jpeg, png,? and webp/i, msg('Chỉ nhận ảnh JPEG, PNG hoặc WebP.')],
  [
    /image (file is too small|content does not match)/i,
    msg('Ảnh bị hỏng hoặc không đúng định dạng. Hãy chọn ảnh khác.'),
  ],
  [
    /no_face_detected|no face/i,
    msg('Không tìm thấy gương mặt trong ảnh. Chọn ảnh rõ mặt, đủ sáng và chỉ có một người.'),
  ],
  [/priority/i, msg('Thứ tự ưu tiên này đã được dùng cho liên hệ khác. Chọn số khác.')],
  [/already exists/i, msg('Thông tin này đã tồn tại. Hãy kiểm tra lại để tránh tạo trùng.')],
  [/cannot be linked to themselves/i, msg('Không thể tự liên kết với chính mình.')],
  [
    /dateFrom must be on or before dateTo/i,
    msg('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'),
  ],
  [/ended session/i, msg('Phiên này đã kết thúc.')],
  [/accounts can only be restored within/i, msg('Đã quá thời hạn khôi phục tài khoản này.')],
  [
    /cannot change status of a deleted user/i,
    msg('Tài khoản đã bị xóa nên không đổi được trạng thái.'),
  ],
  [/must belong to an organization/i, msg('Tài khoản cần thuộc một tổ chức.')],
  [/no package change is scheduled/i, msg('Kho suất sử dụng này chưa có lịch đổi gói nào.')],
  [/^(only |access denied)/i, msg('Bạn không có quyền thực hiện thao tác này.')],
];

const hasVietnamese = (text: string) => /[À-ỹĐđ]/.test(text);

/** General wording by status for an English sentence nobody has translated yet. */
function byStatus(status: number) {
  if (status === 400) return t('Thông tin chưa hợp lệ. Hãy kiểm tra lại các ô đã nhập.');
  if (status === 401) return t('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  if (status === 403) return t('Bạn không có quyền thực hiện thao tác này.');
  if (status === 404) return t('Không tìm thấy dữ liệu. Có thể nó đã bị xóa; hãy tải lại.');
  if (status === 409) return t('Dữ liệu vừa được thay đổi ở nơi khác. Hãy tải lại rồi thử lại.');
  if (status === 422) return t('Không thực hiện được thao tác này. Hãy kiểm tra lại thông tin.');
  return t('Không thực hiện được. Vui lòng thử lại sau.');
}

/** The server's sentence in plain Vietnamese; Vietnamese sentences are kept as they are. */
export function localizeServerMessage(text: string, status: number) {
  const trimmed = text.trim();
  if (!trimmed || hasVietnamese(trimmed)) return trimmed || byStatus(status);
  const known = sentences.find(([pattern]) => pattern.test(trimmed));
  return known ? t(known[1]) : byStatus(status);
}

/** A validation message under one field, in Vietnamese. */
export function localizeFieldMessage(text: string) {
  const trimmed = text.trim();
  if (!trimmed || hasVietnamese(trimmed)) return trimmed;
  const known = sentences.find(([pattern]) => pattern.test(trimmed));
  return known ? t(known[1]) : t('Giá trị chưa hợp lệ.');
}
