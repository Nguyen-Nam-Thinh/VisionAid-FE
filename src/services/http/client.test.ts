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
