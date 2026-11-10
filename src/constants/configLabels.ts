import { msg, t, formatNumber, type MessageId } from '../i18n';

// Plain names for the system configuration keys seeded by BE DbSeeder. The technical key stays
// visible only in the detail dialog, for support conversations with the backend team.
type ConfigCopy = { name: MessageId; hint: MessageId; unit?: MessageId };
const copy: Record<string, ConfigCopy> = {
  'ai.yolo.confidence_threshold': {
    name: msg('Độ tin cậy tối thiểu khi nhận diện vật cản'),
    hint: msg('Vật cản chỉ được báo khi điểm tin cậy đạt mức này (từ 0 đến 1).'),
  },
  'ai.facenet.similarity_threshold': {
    name: msg('Mức giống tối thiểu khi nhận diện gương mặt'),
    hint: msg('Gương mặt chỉ được xem là trùng khi mức giống đạt mức này (từ 0 đến 1).'),
  },
  ocr_confidence_threshold: {
    name: msg('Độ tin cậy tối thiểu khi đọc chữ'),
    hint: msg('Kết quả đọc chữ thấp hơn mức này được đánh dấu là chưa chắc chắn (từ 0 đến 1).'),
  },
  'caregiving.max_caregivers_per_viu': {
    name: msg('Số người chăm sóc tối đa cho một người khiếm thị'),
    hint: msg('Số người chăm sóc đang liên kết cùng lúc với một người khiếm thị.'),
    unit: msg('người'),
  },
  'caregiving.max_vius_per_caregiver': {
    name: msg('Số người khiếm thị tối đa cho một người chăm sóc'),
    hint: msg('Số người khiếm thị một người chăm sóc được liên kết cùng lúc.'),
    unit: msg('người'),
  },
  'caregiving.invitation_ttl_minutes': {
    name: msg('Thời hạn mã QR mời người chăm sóc'),
    hint: msg('Mã QR mời chỉ dùng được một lần và hết hạn sau khoảng thời gian này.'),
    unit: msg('phút'),
  },
  'face_registry.min_photos_to_activate': {
    name: msg('Số ảnh tối thiểu để nhận diện một người'),
    hint: msg('Người trong danh bạ gương mặt chỉ được nhận diện khi có đủ số ảnh này.'),
    unit: msg('ảnh'),
  },
  'face_registry.max_persons_per_registry': {
    name: msg('Số người tối đa trong danh bạ gương mặt'),
    hint: msg('Số người mỗi người khiếm thị được lưu trong danh bạ gương mặt.'),
    unit: msg('người'),
  },
  'location.max_saved_locations_per_user': {
    name: msg('Số địa điểm quen thuộc tối đa'),
    hint: msg('Số địa điểm mỗi người khiếm thị được lưu.'),
    unit: msg('địa điểm'),
  },
  'emergency.max_contacts_per_user': {
    name: msg('Số liên hệ khẩn cấp tối đa'),
    hint: msg('Số liên hệ khẩn cấp mỗi người khiếm thị được lưu.'),
    unit: msg('liên hệ'),
  },
  'location.geofence.default_radius_meters': {
    name: msg('Bán kính mặc định của vùng an toàn'),
    hint: msg('Bán kính được điền sẵn khi tạo vùng an toàn mới.'),
    unit: msg('mét'),
  },
  'location.geofence.default_arrival_radius_meters': {
    name: msg('Bán kính mặc định để báo đã đến nơi'),
    hint: msg('Khi vào trong bán kính này của địa điểm quen thuộc, hệ thống xem là đã đến nơi.'),
    unit: msg('mét'),
  },
  'location.retention_days': {
    name: msg('Thời gian lưu lịch sử vị trí'),
    hint: msg('Lịch sử vị trí cũ hơn số ngày này sẽ bị xóa.'),
    unit: msg('ngày'),
  },
  'retention.ocr_image_days': {
    name: msg('Thời gian lưu ảnh đọc chữ'),
    hint: msg('Ảnh chụp khi đọc chữ bị xóa sau số ngày này; kết quả chữ vẫn được giữ.'),
    unit: msg('ngày'),
  },
  'retention.alert_snapshot_months': {
    name: msg('Thời gian lưu ảnh cảnh báo khẩn cấp'),
    hint: msg('Ảnh chụp kèm cảnh báo bị xóa sau số tháng này; thông tin cảnh báo vẫn được giữ.'),
    unit: msg('tháng'),
  },
  'retention.fcm_token_inactive_days': {
    name: msg('Ngừng gửi thông báo cho thiết bị không hoạt động'),
    hint: msg('Thiết bị không mở ứng dụng quá số ngày này sẽ thôi nhận thông báo đẩy.'),
    unit: msg('ngày'),
  },
  'retention.face_log_days': {
    name: msg('Thời gian lưu lịch sử nhận diện gương mặt'),
    hint: msg('Lịch sử nhận diện gương mặt cũ hơn số ngày này sẽ bị xóa.'),
    unit: msg('ngày'),
  },
  'retention.activity_log_days': {
    name: msg('Thời gian lưu nhật ký hoạt động'),
    hint: msg('Nhật ký vật cản, dẫn đường và lệnh giọng nói cũ hơn số ngày này sẽ bị xóa.'),
    unit: msg('ngày'),
  },
  'retention.notification_days': {
    name: msg('Thời gian lưu lịch sử gửi thông báo'),
    hint: msg('Lịch sử thông báo đã gửi hoặc gửi lỗi cũ hơn số ngày này sẽ bị xóa.'),
    unit: msg('ngày'),
  },
  'tts.cooldown_seconds': {
    name: msg('Khoảng nghỉ giữa hai lần đọc thông báo'),
    hint: msg('Ứng dụng di động chờ ít nhất ngần này giữa hai lần đọc to thông báo.'),
    unit: msg('giây'),
  },
  license_validation_cache_ttl_seconds: {
    name: msg('Thời gian ghi nhớ trạng thái gói dịch vụ'),
    hint: msg('Máy chủ kiểm tra lại trạng thái gói của tài khoản sau khoảng thời gian này.'),
    unit: msg('giây'),
  },
  license_grace_period_days: {
    name: msg('Số ngày gia hạn sau khi gói hết hạn'),
    hint: msg('Sau khi gói hết hạn, tài khoản vẫn dùng được thêm số ngày này rồi mới bị giới hạn.'),
    unit: msg('ngày'),
  },
  'license.auto_renew.reminder_days_before_expiry': {
    name: msg('Nhắc gia hạn trước khi gói hết hạn'),
    hint: msg('Gửi lời nhắc kèm liên kết thanh toán trước ngày hết hạn số ngày này.'),
    unit: msg('ngày'),
  },
  hybrid_navigation_enabled: {
    name: msg('Dẫn đường bằng AI trên máy chủ'),
    hint: msg('Khi bật, ứng dụng di động gửi hình ảnh lên máy chủ để nhận hướng dẫn đi đường.'),
  },
  hybrid_navigation_engine: {
    name: msg('Bộ xử lý dẫn đường đang dùng'),
    hint: msg('Chọn bộ xử lý tạo hướng dẫn đi đường: JEV, Groq hoặc theo quy tắc.'),
  },
  navigation_near_threshold_ms: {
    name: msg('Thời gian chờ tối đa khi dẫn đường'),
    hint: msg('Nếu máy chủ trả lời chậm hơn mức này, ứng dụng chuyển sang dẫn đường theo quy tắc.'),
    unit: msg('mili giây'),
  },
  webrtc_enabled: {
    name: msg('Gọi thoại và video'),
    hint: msg('Khi tắt, ứng dụng ẩn chức năng gọi thoại và video.'),
  },
  webrtc_stun_fallback_url: {
    name: msg('Máy chủ kết nối cuộc gọi dự phòng'),
    hint: msg('Dùng khi chưa có máy chủ kết nối cuộc gọi nào đang bật.'),
  },
  webrtc_max_duration_minutes: {
    name: msg('Thời lượng tối đa của một cuộc gọi'),
    hint: msg('Cuộc gọi tự kết thúc khi đạt thời lượng này.'),
    unit: msg('phút'),
  },
  webrtc_ring_timeout_seconds: {
    name: msg('Thời gian đổ chuông'),
    hint: msg('Cuộc gọi không được trả lời sau ngần này sẽ được ghi là gọi nhỡ.'),
    unit: msg('giây'),
  },
  payos_enabled: {
    name: msg('Thanh toán trực tuyến'),
    hint: msg(
      'Khi tắt, không tạo được liên kết thanh toán mới; giao dịch đang chờ vẫn được xử lý.',
    ),
  },
};

const categories: Record<string, MessageId> = {
  AI: msg('Trí tuệ nhân tạo'),
  AI_NAVIGATION: msg('Dẫn đường'),
  Caregiving: msg('Chăm sóc'),
  FaceRegistry: msg('Danh bạ gương mặt'),
  Location: msg('Vị trí'),
  Emergency: msg('Khẩn cấp'),
  DataRetention: msg('Lưu trữ dữ liệu'),
  TTS: msg('Đọc thông báo'),
  BusinessRules: msg('Gói dịch vụ'),
  WEBRTC: msg('Cuộc gọi'),
  PAYMENT: msg('Thanh toán'),
};

export const configName = (key: string) => (copy[key] ? t(copy[key].name) : key);
export const configHint = (key: string) => (copy[key] ? t(copy[key].hint) : null);
export const configCategory = (category: string) =>
  categories[category] ? t(categories[category]) : category;
export const configCategoryValues = Object.keys(categories);

/** Value as a person reads it: "Bật", "300 mét", "0,75". */
export function configValue(config: { configKey: string; configValue: string; valueType: string }) {
  const { configKey, configValue: raw, valueType } = config;
  if (valueType === 'Boolean') return raw === 'true' ? t('Bật') : raw === 'false' ? t('Tắt') : raw;
  if (configKey === 'hybrid_navigation_engine')
    return raw === 'RULE_BASED' ? t('Theo quy tắc') : raw === 'GROQ' ? 'Groq' : raw;
  if (valueType === 'Integer' || valueType === 'Decimal') {
    const value = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(value)) return raw;
    const unit = copy[configKey]?.unit;
    return unit ? `${formatNumber(value)} ${t(unit)}` : formatNumber(value);
  }
  return raw;
}
