import { expect, it, vi } from 'vitest';
import { request } from './client';

it.each([403, 429, 500, 503])(
  'localizes HTTP %s without retrying or losing status',
  async (status) => {
    const transport = vi.fn(
      async () => new Response(JSON.stringify({ detail: 'Internal server error' }), { status }),
    );
    await expect(request('/test', {}, transport)).rejects.toMatchObject({ status });
    await expect(request('/test', {}, transport)).rejects.not.toThrow('Internal server error');
    expect(transport).toHaveBeenCalledTimes(2);
  },
);

it('shows Retry-After seconds and dates, with a fallback for invalid headers', async () => {
  for (const [header, expected] of [
    ['60', '60 giây'],
    [new Date(Date.now() + 60000).toUTCString(), '60 giây'],
    ['invalid', 'chờ một lát'],
  ]) {
    await expect(
      request(
        '/test',
        {},
        async () => new Response(null, { status: 429, headers: { 'Retry-After': header } }),
      ),
    ).rejects.toThrow(expected);
  }
});

it('preserves specific business and validation errors', async () => {
  await expect(
    request(
      '/test',
      {},
      async () =>
        new Response(
          JSON.stringify({
            detail: 'Tổ chức chưa có gói license.',
            errors: { name: ['Tên không hợp lệ'] },
          }),
          { status: 422 },
        ),
    ),
  ).rejects.toMatchObject({
    status: 422,
    message: 'Tổ chức chưa có gói license.',
    fields: { name: 'Tên không hợp lệ' },
  });
});

it('keeps the BE errorCode and translates known codes, leaving unknown ones as sent', async () => {
  const reply = (body: object, status: number) => async () =>
    new Response(JSON.stringify(body), { status });
  await expect(
    request(
      '/test',
      {},
      reply({ detail: 'Current password is incorrect.', errorCode: 'WRONG_CURRENT_PASSWORD' }, 422),
    ),
  ).rejects.toMatchObject({
    status: 422,
    code: 'WRONG_CURRENT_PASSWORD',
    message: 'Mật khẩu hiện tại không đúng.',
  });
  await expect(
    request('/test', {}, reply({ detail: 'Something new.', errorCode: 'NEW_CODE' }, 409)),
  ).rejects.toMatchObject({ code: 'NEW_CODE', message: 'Something new.' });
  await expect(request('/test', {}, reply({ detail: 'No code.' }, 422))).rejects.toMatchObject({
    code: undefined,
    message: 'No code.',
  });
});
it('reports 413 with a fixed message without reading the proxy body', async () => {
  const html = vi.fn(
    async () =>
      new Response('<html>413 Request Entity Too Large</html>', {
        status: 413,
        headers: { 'Content-Type': 'text/html' },
      }),
  );
  await expect(request('/upload', {}, html)).rejects.toMatchObject({
    status: 413,
    code: 'PAYLOAD_TOO_LARGE',
    message: 'Tệp vượt quá giới hạn tải lên của máy chủ.',
  });
});

it('keeps the localized message of a known errorCode on 403', async () => {
  const forbid = (errorCode?: string) => async () =>
    new Response(JSON.stringify({ title: 'Forbidden', status: 403, errorCode }), { status: 403 });
  await expect(request('/test', {}, forbid('NOT_PRIMARY_CAREGIVER'))).rejects.toMatchObject({
    status: 403,
    code: 'NOT_PRIMARY_CAREGIVER',
    message: 'Chỉ người chăm sóc chính mới thêm được người chăm sóc khác.',
  });
  await expect(request('/test', {}, forbid())).rejects.toMatchObject({
    status: 403,
    message: 'Bạn không có quyền thực hiện thao tác này.',
  });
  await expect(request('/test', {}, forbid('SOMETHING_NEW'))).rejects.toMatchObject({
    message: 'Bạn không có quyền thực hiện thao tác này.',
  });
});
it('402 shows whose license blocks the action and keeps the code', async () => {
  const pay = (errorCode?: string) => async () =>
    new Response(JSON.stringify({ title: 'Payment Required', status: 402, errorCode }), {
      status: 402,
    });
  await expect(
    request('/api/webrtc/sessions', {}, pay('VIU_LICENSE_EXPIRED')),
  ).rejects.toMatchObject({
    status: 402,
    code: 'VIU_LICENSE_EXPIRED',
    message: expect.stringContaining('người được chăm sóc đã hết hạn'),
  });
  await expect(request('/x', {}, pay('LICENSE_REQUIRED'))).rejects.toMatchObject({
    code: 'LICENSE_REQUIRED',
    message: expect.stringContaining('chưa có license'),
  });
  await expect(request('/x', {}, pay())).rejects.toMatchObject({
    status: 402,
    message: expect.stringContaining('Phiên đăng nhập vẫn được giữ'),
  });
});
