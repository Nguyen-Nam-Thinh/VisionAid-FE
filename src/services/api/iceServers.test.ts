import { expect, it, vi } from 'vitest';
import { createIceServersApi, validateIceInput } from './iceServers';
const actor = { role: 'Admin' as const };
const id = '01900000-0000-7000-8000-000000000001';
const server = {
  id,
  serverType: 'Turn' as const,
  url: 'turn:relay.test:3478?transport=udp',
  username: 'admin',
  priority: 100,
  isActive: true,
  createdAt: '2026-10-11T00:00:00Z',
  updatedAt: '2026-10-11T00:00:00Z',
};
const input = {
  serverType: 'Turn',
  url: server.url,
  username: 'admin',
  credential: ' new-value ',
  priority: 100,
  isActive: true,
};
const filter = { page: 1, active: '' };
const paged = (items: unknown[]) => ({
  items,
  page: 1,
  pageSize: 20,
  totalCount: items.length,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});
it('guards all ICE operations before network', async () => {
  const get = vi.fn();
  const write = vi.fn();
  const api = createIceServersApi(get, write);
  const actor = { role: 'CenterAdmin' as const };
  await expect(api.list(actor, filter)).rejects.toMatchObject({ status: 403 });
  await expect(api.save(actor, input)).rejects.toMatchObject({ status: 403 });
  await expect(api.remove(actor, server, filter)).rejects.toMatchObject({ status: 403 });
  expect(get).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
});
it('validates host, protocol/type, ports, priority and TURN credentials', () => {
  for (const url of [
    'https://relay.test',
    'turn:',
    'turn://relay.test',
    'turn:user:password@relay.test',
    'turn:relay.test/path',
    'turn:relay.test:0',
    'turn:relay.test:65536',
    'turn:relay.test?token=x',
    'stun:relay.test',
  ])
    expect(() => validateIceInput({ ...input, url })).toThrow();
  for (const priority of [0, 1001, 1.5, NaN])
    expect(() => validateIceInput({ ...input, priority })).toThrow();
  for (const credential of ['', ' ', 'x'.repeat(201)])
    expect(() => validateIceInput({ ...input, credential })).toThrow();
  expect(
    validateIceInput({ ...input, url: 'turns:[2001:db8::1]:5349?transport=tcp' }).credential,
  ).toBe(' new-value ');
  expect(
    validateIceInput({ ...input, serverType: 'Stun', url: 'stun:relay.test:3478' }),
  ).toMatchObject({ username: null, credential: null });
});
it('strips existing credentials from list and forwards paging, active and cancellation', async () => {
  const get = vi.fn().mockResolvedValue(paged([{ ...server, credential: 'SECRET' }]));
  const api = createIceServersApi(get);
  const signal = new AbortController().signal;
  const result = await api.list(actor, { page: 2, active: 'false' }, signal);
  expect(JSON.stringify(result)).not.toContain('SECRET');
  expect(result.items[0]).not.toHaveProperty('credential');
  expect(get).toHaveBeenCalledWith(
    '/api/webrtc/ice-servers?page=2&pageSize=10&isActive=false',
    signal,
  );
  await expect(api.list(actor, { page: 0, active: '' })).rejects.toMatchObject({ status: 400 });
});
it('creates with server-side active default and never returns credentials', async () => {
  const write = vi.fn().mockResolvedValue({ ...server, credential: 'new-value' });
  const result = await createIceServersApi(vi.fn(), write).save(actor, input);
  expect(write.mock.calls[0][0]).toBe('/api/webrtc/ice-servers');
  expect(write.mock.calls[0][1].method).toBe('POST');
  expect(JSON.parse(write.mock.calls[0][1].body)).toEqual({
    serverType: 'Turn',
    url: input.url,
    username: 'admin',
    credential: ' new-value ',
    priority: 100,
  });
  expect(result).not.toHaveProperty('credential');
});
it('updates only after snapshot recheck and requires explicitly supplied TURN credential', async () => {
  const get = vi.fn().mockResolvedValue(paged([server]));
  const write = vi.fn().mockResolvedValue({ ...server, priority: 101 });
  const api = createIceServersApi(get, write);
  await expect(api.save(actor, { ...input, credential: '' }, server, filter)).rejects.toMatchObject(
    { status: 400 },
  );
  expect(write).not.toHaveBeenCalled();
  await api.save(actor, { ...input, priority: 101 }, server, filter);
  expect(write.mock.calls[0][0]).toBe('/api/webrtc/ice-servers/' + id);
  expect(write.mock.calls[0][1].method).toBe('PUT');
  expect(JSON.parse(write.mock.calls[0][1].body)).toEqual({ ...input, priority: 101 });
  get.mockResolvedValue(paged([{ ...server, updatedAt: '2026-10-11T01:00:00Z' }]));
  await expect(api.save(actor, input, server, filter)).rejects.toMatchObject({ status: 409 });
  expect(write).toHaveBeenCalledTimes(1);
});
it('deletes with snapshot check and sanitizes ambiguous write errors without retry', async () => {
  const get = vi.fn().mockResolvedValue(paged([server]));
  const write = vi.fn().mockResolvedValue(undefined);
  const api = createIceServersApi(get, write);
  await api.remove(actor, server, filter);
  expect(write).toHaveBeenCalledWith('/api/webrtc/ice-servers/' + id, { method: 'DELETE' });
  write.mockRejectedValue(new Error('credential SECRET'));
  await expect(api.save(actor, input)).rejects.toMatchObject({ status: 0 });
  await expect(api.save(actor, input)).rejects.not.toThrow('SECRET');
  expect(write).toHaveBeenCalledTimes(3);
});
