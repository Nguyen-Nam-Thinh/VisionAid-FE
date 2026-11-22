import { labelMap, msg, t } from '../i18n';

// Plain-language copy for the English enum values and model labels the backend stores
// (BE enums, YOLO/COCO object classes). Unknown values fall back to the raw text so nothing is hidden.

export const resultLabels: Record<string, string> = labelMap({
  // OcrResultStatus / CommandStatus
  Success: msg('Thành công'),
  Failed: msg('Thất bại'),
  LowConfidence: msg('Chưa chắc chắn'),
  Unrecognized: msg('Không nhận ra lệnh'),
  Confirmed: msg('Đã xác nhận'),
  Cancelled: msg('Đã hủy'),
  Retried: msg('Đã thử lại'),
  // RecognitionResult
  Matched: msg('Nhận ra người quen'),
  NotMatched: msg('Người lạ'),
  Error: msg('Lỗi'),
  Spoof: msg('Ảnh chụp hoặc màn hình, không phải người thật'),
  // Obstacle rows of the activity timeline
  Alerted: msg('Đã cảnh báo bằng giọng nói'),
  Detected: msg('Chỉ ghi nhận'),
  // AlertStatus
  Sent: msg('Đã gửi'),
  Acknowledged: msg('Đã tiếp nhận'),
  Escalated: msg('Đã chuyển cấp'),
  Resolved: msg('Đã xử lý xong'),
  Dismissed: msg('Đã bỏ qua'),
  Called: msg('Đã gọi'),
  // Detection mode
  Full: msg('Đầy đủ'),
  Minimal: msg('Tối giản'),
});

export const distanceLabels: Record<string, string> = labelMap({
  Near: msg('ở gần'),
  Medium: msg('ở khoảng vừa'),
  Far: msg('ở xa'),
});

export const decisionLabels: Record<string, string> = labelMap({
  STOP: msg('Dừng lại'),
  TURN_LEFT: msg('Rẽ trái'),
  TURN_RIGHT: msg('Rẽ phải'),
  PROCEED: msg('Đi tiếp'),
});

export const engineLabels: Record<string, string> = labelMap({
  Jev: msg('Máy chủ (AI)'),
  Groq: msg('Máy chủ (AI dự phòng)'),
  RuleBased: msg('Máy chủ (theo quy tắc)'),
  OnDeviceRules: msg('Điện thoại tự quyết định'),
});

export const detectionMethodLabels: Record<string, string> = labelMap({
  AccelerometerCamera: msg('Tự phát hiện té ngã'),
  Manual: msg('Bấm nút khẩn cấp'),
  VoiceCommand: msg('Gọi bằng giọng nói'),
  Gesture: msg('Cử chỉ'),
});

export const boundaryLabels: Record<string, string> = labelMap({
  Entered: msg('Đi vào vùng an toàn'),
  Exited: msg('Ra khỏi vùng an toàn'),
  Arrived: msg('Đến địa điểm đã lưu'),
});

// Voice command codes matched by the phone (VisionAid-MO src/constants/voiceCommands.ts).
export const voiceCommandLabels: Record<string, string> = labelMap({
  START_NAVIGATION: msg('Bắt đầu dẫn đường'),
  STOP_NAVIGATION: msg('Dừng dẫn đường'),
  READ_TEXT: msg('Đọc chữ'),
  SCAN_QR: msg('Quét mã QR'),
  RECOGNIZE_FACE: msg('Nhận diện gương mặt'),
  WHERE_AM_I: msg('Hỏi vị trí hiện tại'),
  EMERGENCY: msg('Gọi khẩn cấp'),
  MODE_MINIMAL: msg('Chuyển chế độ tối giản'),
  MODE_FULL: msg('Chuyển chế độ đầy đủ'),
  I_AM_OK: msg('Báo đang ổn'),
  SPEED_UP: msg('Đọc nhanh hơn'),
  SLOW_DOWN: msg('Đọc chậm hơn'),
  VOICE_MALE: msg('Đổi sang giọng nam'),
  VOICE_FEMALE: msg('Đổi sang giọng nữ'),
  VOLUME_UP: msg('Tăng âm lượng'),
  VOLUME_DOWN: msg('Giảm âm lượng'),
  HELP: msg('Trợ giúp'),
  REPEAT: msg('Nhắc lại'),
  ASK_PHOTO: msg('Hỏi về hình ảnh'),
  CALL_CAREGIVER: msg('Gọi người chăm sóc'),
  END_CALL: msg('Kết thúc cuộc gọi'),
  RETRY: msg('Thử lại'),
});

// The 80 COCO classes YOLOv8 reports on the phone.
const objects: Record<string, string> = labelMap({
  person: msg('Người'),
  bicycle: msg('Xe đạp'),
  car: msg('Ô tô'),
  motorcycle: msg('Xe máy'),
  airplane: msg('Máy bay'),
  bus: msg('Xe buýt'),
  train: msg('Tàu hỏa'),
  truck: msg('Xe tải'),
  boat: msg('Thuyền'),
  'traffic light': msg('Đèn giao thông'),
  'fire hydrant': msg('Trụ cứu hỏa'),
  'stop sign': msg('Biển dừng'),
  'parking meter': msg('Cột thu phí đỗ xe'),
  bench: msg('Ghế dài'),
  bird: msg('Chim'),
  cat: msg('Mèo'),
  dog: msg('Chó'),
  horse: msg('Ngựa'),
  sheep: msg('Cừu'),
  cow: msg('Bò'),
  elephant: msg('Voi'),
  bear: msg('Gấu'),
  zebra: msg('Ngựa vằn'),
  giraffe: msg('Hươu cao cổ'),
  backpack: msg('Ba lô'),
  umbrella: msg('Ô (dù)'),
  handbag: msg('Túi xách'),
  tie: msg('Cà vạt'),
  suitcase: msg('Vali'),
  frisbee: msg('Đĩa ném'),
  skis: msg('Ván trượt tuyết'),
  snowboard: msg('Ván trượt'),
  'sports ball': msg('Quả bóng'),
  kite: msg('Diều'),
  'baseball bat': msg('Gậy bóng chày'),
  'baseball glove': msg('Găng bóng chày'),
  skateboard: msg('Ván trượt'),
  surfboard: msg('Ván lướt sóng'),
  'tennis racket': msg('Vợt tennis'),
  bottle: msg('Chai'),
  'wine glass': msg('Ly rượu'),
  cup: msg('Cốc'),
  fork: msg('Nĩa'),
  knife: msg('Dao'),
  spoon: msg('Thìa'),
  bowl: msg('Bát'),
  banana: msg('Chuối'),
  apple: msg('Táo'),
  sandwich: msg('Bánh mì kẹp'),
  orange: msg('Cam'),
  broccoli: msg('Bông cải xanh'),
  carrot: msg('Cà rốt'),
  'hot dog': msg('Xúc xích kẹp'),
  pizza: msg('Pizza'),
  donut: msg('Bánh vòng'),
  cake: msg('Bánh ngọt'),
  chair: msg('Ghế'),
  couch: msg('Ghế sofa'),
  'potted plant': msg('Chậu cây'),
  bed: msg('Giường'),
  'dining table': msg('Bàn ăn'),
  toilet: msg('Bồn cầu'),
  tv: msg('Tivi'),
  laptop: msg('Máy tính xách tay'),
  mouse: msg('Chuột máy tính'),
  remote: msg('Điều khiển từ xa'),
  keyboard: msg('Bàn phím'),
  'cell phone': msg('Điện thoại'),
  microwave: msg('Lò vi sóng'),
  oven: msg('Lò nướng'),
  toaster: msg('Máy nướng bánh'),
  sink: msg('Bồn rửa'),
  refrigerator: msg('Tủ lạnh'),
  book: msg('Sách'),
  clock: msg('Đồng hồ'),
  vase: msg('Bình hoa'),
  scissors: msg('Kéo'),
  'teddy bear': msg('Gấu bông'),
  'hair drier': msg('Máy sấy tóc'),
  toothbrush: msg('Bàn chải đánh răng'),
});

// Fixed English reasons the BE writes into alert status history (EmergencyEventDispatcher etc.).
const historyReasons: Record<string, string> = labelMap({
  'Auto-dispatched: grace period expired': msg(
    'Hệ thống tự gửi cảnh báo vì hết thời gian chờ hủy.',
  ),
  'Auto-sent: no grace period for manual/voice/gesture emergency': msg(
    'Hệ thống gửi ngay vì cảnh báo do người dùng chủ động bấm, nói hoặc ra hiệu.',
  ),
  'Dismissed by user': msg('Người khiếm thị đã hủy cảnh báo.'),
});
export const historyReason = (reason: string | null | undefined) =>
  reason ? (historyReasons[reason.trim()] ?? reason) : '';
/** 1758 minutes → "1 ngày 5 giờ"; short spans stay in minutes. */
export function elapsedText(minutes: number) {
  const m = Math.max(0, Math.floor(minutes));
  if (m < 60) return t('{m} phút', { m });
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? t('{h} giờ {m} phút', { h, m: m % 60 }) : t('{h} giờ', { h });
  const d = Math.floor(h / 24);
  return h % 24 ? t('{d} ngày {h} giờ', { d, h: h % 24 }) : t('{d} ngày', { d });
}
export const serverValue = (value: string | null | undefined, map: Record<string, string>) =>
  value ? (map[value] ?? value) : '';
export const objectLabel = (name: string) => objects[name.trim().toLowerCase()] ?? name;
export const obstacleLabel = (objectClass: string, distance: string) => {
  const where = distanceLabels[distance];
  return where ? `${objectLabel(objectClass)} ${where}` : objectLabel(objectClass);
};

/** "laptop (Near)" → "Máy tính xách tay ở gần"; other activity types use their own enum maps. */
export function timelineDetail(type: string, detail: string | null) {
  if (!detail) return '';
  if (type === 'ObstacleDetection') {
    const match = /^(.*) \((\w+)\)$/.exec(detail);
    return match ? obstacleLabel(match[1], match[2]) : objectLabel(detail);
  }
  if (type === 'NavigationGuidance') return serverValue(detail, decisionLabels);
  if (type === 'VoiceCommand') {
    // "transcript → COMMAND" (the command is '?' when nothing matched)
    const [spoken, command = ''] = detail.split(' → ');
    const label =
      command === '?' ? t('Không nhận ra lệnh') : serverValue(command, voiceCommandLabels);
    return label ? t('"{spoken}" → {command}', { spoken: spoken.trim(), command: label }) : detail;
  }
  if (type === 'Emergency' || type === 'BoundaryEvent') {
    const [head, ...rest] = detail.split(': ');
    const map = type === 'Emergency' ? detectionMethodLabels : boundaryLabels;
    const label = map[head];
    if (!label) return detail;
    const tail = rest.join(': ').trim();
    return tail ? t('{label}: {detail}', { label, detail: tail }) : label;
  }
  return detail;
}
export function timelineResult(type: string, result: string | null) {
  if (!result) return '';
  return type === 'NavigationGuidance'
    ? serverValue(result, engineLabels)
    : serverValue(result, resultLabels);
}
