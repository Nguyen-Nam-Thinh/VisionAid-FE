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
