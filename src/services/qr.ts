import jsQR from 'jsqr';
import { ServiceError } from './contracts';
/** Local image decoding only. Never navigates to the decoded content. */
export async function decodeInvitation(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024)
    throw new ServiceError('Chọn ảnh QR JPG/PNG dưới 5 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context)
      throw new ServiceError('Trình duyệt không hỗ trợ đọc ảnh QR. Hãy nhập mã thủ công.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(pixels.data, pixels.width, pixels.height)?.data;
    if (!code || !/^VA-DEMO-[a-f0-9]{8}$/.test(code))
      throw new ServiceError('Không tìm thấy mã liên kết VisionAid demo hợp lệ trong ảnh.');
    return code;
  } finally {
    bitmap.close();
  }
}
