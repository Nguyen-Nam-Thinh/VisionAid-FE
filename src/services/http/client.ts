import { ServiceError } from '../contracts';
/** Transport only; callers must supply confirmed endpoints and payload mapping. No retries or mock fallback. */
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
    let message =
      typeof problem.detail === 'string'
        ? problem.detail
        : typeof problem.title === 'string'
          ? problem.title
          : `Yêu cầu thất bại. Mã lỗi: ${response.status}.`;
    if (response.status === 403) message = 'Bạn không có quyền thực hiện thao tác này.';
    if (response.status >= 500)
      message =
        'Máy chủ đang gặp sự cố. Vui lòng tải lại dữ liệu để kiểm tra kết quả trước khi thử lại.';
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
          ? `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${seconds} giây.`
          : 'Bạn thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại.';
    }
    throw new ServiceError(
      message,
      response.status,
      Object.fromEntries(
        Object.entries(errors).map(([key, v]) => [key, Array.isArray(v) ? v.join(' ') : String(v)]),
      ),
    );
  }
  return body as T;
}
