import { ServiceError } from '../contracts';
/** Transport only; callers must supply confirmed endpoints and payload mapping. No retries or mock fallback. */
export async function request<T>(
  url: string,
  init: RequestInit = {},
  transport: typeof fetch = fetch,
): Promise<T | undefined> {
  const response = await transport(url, init);
  if (response.status === 204) return undefined;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    if (response.ok) throw new ServiceError('Phản hồi JSON không hợp lệ từ máy chủ.', 502);
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
        'Máy chủ yêu cầu kiểm tra license cho thao tác này. Phiên đăng nhập vẫn được giữ. Mở mục License để xem trạng thái hoặc tải lại sau khi license được cập nhật.',
        402,
      );
    throw new ServiceError(
      typeof problem.detail === 'string'
        ? problem.detail
        : typeof problem.title === 'string'
          ? problem.title
          : `Yêu cầu thất bại. Mã lỗi: ${response.status}.`,
      response.status,
      Object.fromEntries(
        Object.entries(errors).map(([key, v]) => [key, Array.isArray(v) ? v.join(' ') : String(v)]),
      ),
    );
  }
  return body as T;
}
