import { expect, it, vi } from 'vitest';
import { authSessionKey, createApiAuth, type AuthStorage } from './auth';
const jwt = (seconds = 600) =>
  'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })) + '.signature';
const pair = (seconds = 600) => ({
  accessToken: jwt(seconds),
  refreshToken: 'refresh-test',
  expiresAt: '2099-01-01T00:00:00Z',
});
const user = {
  id: '01900000-0000-7000-8000-000000000001',
  email: 'test@example.test',
  fullName: 'API Test',
  role: 'Caregiver',
  organizationId: null,
  isActive: true,
};
const ok = (data: unknown) => Response.json({ success: true, data });

it('authenticated binary photos refresh once, use no-store, preserve HTTP errors and discard late logout responses', async () => {
  const storage = memory();
  const initial = pair();
  storage.setItem(authSessionKey, JSON.stringify(initial));
  let attempts = 0;
  let release!: (response: Response) => void;
  const fetcher = vi.fn<typeof fetch>(async (url) => {
    if (String(url).endsWith('/refresh')) return ok(pair());
    if (String(url).endsWith('/logout')) return ok(null);
    if (String(url).endsWith('/late'))
      return new Promise<Response>((resolve) => {
        release = resolve;
      });
    if (String(url).endsWith('/forbidden'))
      return Response.json({ detail: 'No access' }, { status: 403 });
    if (attempts++ === 0) return Response.json({ detail: 'expired' }, { status: 401 });
    return new Response('bytes', { headers: { 'Content-Type': 'image/png' } });
  });
  const auth = createApiAuth('http://example.test', storage, fetcher);
  const blob = (await auth.blob('/photo')) as Blob;
  expect(await blob.text()).toBe('bytes');
  expect(attempts).toBe(2);
  expect(fetcher.mock.calls[0][1]).toMatchObject({
    cache: 'no-store',
    headers: { Authorization: `Bearer ${initial.accessToken}` },
  });
  await expect(auth.blob('/forbidden')).rejects.toMatchObject({ status: 403 });
  const late = auth.blob('/late');
  await auth.logout();
  release(new Response('private photo'));
  await expect(late).rejects.toMatchObject({ status: 401 });
});

it('maps nullable license fields and preserves session without refresh/replay on 402 reads and writes', async () => {
  const storage = memory();
  const calls: string[] = [];
  const auth = createApiAuth('http://example.test', storage, async (url) => {
    const path = new URL(String(url)).pathname;
    calls.push(path);
    if (path === '/api/auth/login') return ok(pair());
    if (path === '/api/users/me')
      return ok({ ...user, licenseStatus: 'Expired', licenseExpiresAt: '2026-10-01T00:00:00Z' });
    return Response.json({ detail: 'Payment Required' }, { status: 402 });
  });
  expect(await auth.login(user.email, 'Password@1')).toMatchObject({
    licenseStatus: 'Expired',
    licenseExpiresAt: '2026-10-01T00:00:00Z',
  });
  await expect(auth.get('/api/blocked')).rejects.toMatchObject({ status: 402 });
  await expect(auth.write('/api/blocked', { method: 'POST' })).rejects.toMatchObject({
    status: 402,
  });
  expect(calls.filter((p) => p === '/api/blocked')).toHaveLength(2);
  expect(calls).not.toContain('/api/auth/refresh');
  expect(storage.getItem(authSessionKey)).not.toBeNull();
  expect((await auth.session())?.id).toBe(user.id);
});
function memory() {
  const data = new Map<string, string>();
  const storage: AuthStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
  return storage;
}
it('maps BE profile, restores on reload and uses the same device for logout', async () => {
  const storage = memory();
  const bodies: Record<string, unknown>[] = [];
  const fetcher = vi.fn<typeof fetch>(async (url, init) => {
    if (init?.body) bodies.push(JSON.parse(String(init.body)));
    return String(url).endsWith('/me')
      ? ok(user)
      : String(url).endsWith('/logout')
        ? ok(null)
        : ok(pair());
  });
  const auth = createApiAuth('http://example.test', storage, fetcher);
  expect(await auth.session()).toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
  expect(await auth.login(' test@example.test ', 'Password@1')).toMatchObject({
    name: 'API Test',
    orgId: '',
    role: 'Caregiver',
  });
  const restored = createApiAuth('http://example.test', storage, fetcher);
  expect((await restored.session())?.id).toBe(user.id);
  await restored.logout();
  expect(bodies[0]).toMatchObject({ email: user.email, device: { deviceType: 'Web' } });
  expect(bodies.at(-1)?.clientDeviceId).toBe(
    (bodies[0].device as Record<string, unknown>).clientDeviceId,
  );
  expect(storage.getItem(authSessionKey)).toBeNull();
  expect(await restored.session()).toBeNull();
});
it('uses JWT exp, rotates expired access once for concurrent session checks', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair(-5)));
  let refreshes = 0;
  const auth = createApiAuth('http://example.test', storage, async (url) => {
    if (String(url).endsWith('/refresh')) {
      refreshes++;
      return ok({ ...pair(), refreshToken: 'rotated' });
    }
    return ok(user);
  });
  await Promise.all([auth.session(), auth.session(), auth.session()]);
  expect(refreshes).toBe(1);
  expect(JSON.parse(storage.getItem(authSessionKey)!).refreshToken).toBe('rotated');
});
it('refreshes once after 401 then stops and clears a rejected session', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair()));
  let refreshes = 0;
  const auth = createApiAuth('http://example.test', storage, async (url) => {
    if (String(url).endsWith('/refresh')) {
      refreshes++;
      return ok(pair());
    }
    return Response.json({ detail: 'Expired' }, { status: 401 });
  });
  await expect(auth.session()).rejects.toMatchObject({ status: 401 });
  expect(refreshes).toBe(1);
  expect(await auth.session()).toBeNull();
});
it('treats a revoked refresh token (403) as an ended session, not a permission error', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair()));
  const auth = createApiAuth('http://example.test', storage, async (url) =>
    String(url).endsWith('/refresh')
      ? Response.json({ detail: 'Invalid refresh token.' }, { status: 403 })
      : Response.json({ detail: 'Expired' }, { status: 401 }),
  );
  await expect(auth.session()).rejects.toMatchObject({
    status: 401,
    message: expect.stringContaining('Phiên đăng nhập đã hết hạn'),
  });
  expect(await auth.session()).toBeNull();
});
it('reports a wrong current password instead of a permission error', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair()));
  const auth = createApiAuth('http://example.test', storage, async (url) =>
    String(url).endsWith('/change-password')
      ? Response.json({ detail: 'Current password is incorrect.' }, { status: 403 })
      : ok(user),
  );
  await expect(auth.changePassword('Wrong-Pass1!', 'New-Pass1!')).rejects.toMatchObject({
    status: 403,
    message: 'Mật khẩu hiện tại không đúng.',
  });
  expect(await auth.session()).not.toBeNull();
});
it('maps the current BE 422 wrong-password response and keeps other 422 messages', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair()));
  let detail = 'Current password is incorrect.';
  const auth = createApiAuth('http://example.test', storage, async (url) =>
    String(url).endsWith('/change-password')
      ? Response.json({ detail }, { status: 422 })
      : ok(user),
  );
  await expect(auth.changePassword('Wrong-Pass1!', 'New-Pass1!')).rejects.toMatchObject({
    status: 422,
    message: 'Mật khẩu hiện tại không đúng.',
  });
  detail = 'Password was used recently.';
  await expect(auth.changePassword('Wrong-Pass1!', 'New-Pass1!')).rejects.toMatchObject({
    message: 'Password was used recently.',
  });
  expect(await auth.session()).not.toBeNull();
});
it('never refreshes on profile 403 and rejects mobile/unknown roles', async () => {
  for (const role of ['VisuallyImpaired', 'UnexpectedRole']) {
    const auth = createApiAuth('http://example.test', memory(), async (url) =>
      String(url).endsWith('/login') ? ok(pair()) : ok({ ...user, role }),
    );
    await expect(auth.login(user.email, 'Password@1')).rejects.toBeInstanceOf(Error);
    expect(await auth.session()).toBeNull();
  }
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair()));
  const fetcher = vi.fn<typeof fetch>(async () =>
    Response.json({ detail: 'Disabled' }, { status: 403 }),
  );
  await expect(
    createApiAuth('http://example.test', storage, fetcher).session(),
  ).rejects.toMatchObject({ status: 403 });
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('clears local session when logout is unreachable', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair()));
  const auth = createApiAuth('http://example.test', storage, async () => {
    throw new TypeError('offline');
  });
  await expect(auth.logout()).rejects.toMatchObject({ status: 503 });
  expect(await auth.session()).toBeNull();
  expect(storage.getItem(authSessionKey)).toBeNull();
});
it('does not replay refresh after a lost rotation response', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair(-5)));
  const fetcher = vi.fn<typeof fetch>(async () => {
    throw new TypeError('lost response');
  });
  const auth = createApiAuth('http://example.test', storage, fetcher);
  await expect(auth.session()).rejects.toMatchObject({ status: 503 });
  expect(await auth.session()).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('rejects malformed success payloads and never retries wrong credentials or rate limits', async () => {
  for (const status of [401, 429]) {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({ detail: 'Rejected' }, { status }),
    );
    await expect(
      createApiAuth('http://example.test', memory(), fetcher).login('a', 'b'),
    ).rejects.toMatchObject({ status });
    expect(fetcher).toHaveBeenCalledTimes(1);
  }
  await expect(
    createApiAuth('http://example.test', memory(), async () => ok({})).login('a', 'b'),
  ).rejects.toMatchObject({ status: 502 });
  await expect(createApiAuth('', memory()).login('a', 'b')).rejects.toMatchObject({ status: 501 });
});
it('updates only editable profile fields and clears session only after password success', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair()));
  let fail = true;
  const bodies: unknown[] = [];
  const auth = createApiAuth('http://example.test', storage, async (url, init) => {
    if (init?.body) bodies.push(JSON.parse(String(init.body)));
    if (String(url).endsWith('/change-password'))
      return fail
        ? Response.json({ detail: 'Current password is incorrect.' }, { status: 403 })
        : ok(null);
    return ok({ ...user, fullName: 'Updated' });
  });
  expect((await auth.profile({ name: ' Updated ', phone: '', avatar: 'ignored' })).name).toBe(
    'Updated',
  );
  expect(bodies[0]).toEqual({ fullName: 'Updated', phoneNumber: '' });
  await expect(auth.changePassword('Wrong@123', 'NewPassword@2')).rejects.toMatchObject({
    status: 403,
  });
  expect(storage.getItem(authSessionKey)).not.toBeNull();
  await expect(auth.changePassword('Wrong@123', 'weak')).rejects.toMatchObject({ status: 400 });
  fail = false;
  await auth.changePassword('OldPassword@1', 'NewPassword@2');
  expect(bodies.at(-1)).toEqual({ currentPassword: 'OldPassword@1', newPassword: 'NewPassword@2' });
  expect(storage.getItem(authSessionKey)).toBeNull();
});

it('registers a caregiver with the tab device then loads profile and logs out all', async () => {
  const storage = memory();
  const calls: { path: string; body: unknown }[] = [];
  const auth = createApiAuth('http://example.test', storage, async (url, init) => {
    const path = new URL(String(url)).pathname;
    calls.push({ path, body: init?.body ? JSON.parse(String(init.body)) : null });
    return path.endsWith('/me') ? ok(user) : path.endsWith('/logout-all') ? ok(null) : ok(pair());
  });
  expect((await auth.register(' API Test ', ' test@example.test ', 'Password@1')).role).toBe(
    'Caregiver',
  );
  expect(calls[0]).toMatchObject({
    path: '/api/auth/register',
    body: {
      fullName: 'API Test',
      email: user.email,
      password: 'Password@1',
      device: { deviceType: 'Web' },
    },
  });
  expect(calls[1].path).toBe('/api/users/me');
  expect(calls[0].body).not.toHaveProperty('role');
  expect(calls[0].body).not.toHaveProperty('organizationId');
  await auth.logoutAll();
  expect(calls.at(-1)).toEqual({ path: '/api/auth/logout-all', body: null });
  expect(storage.getItem(authSessionKey)).toBeNull();
});
it('does not retry conflicting registration or invalid input, and clears failed logout-all locally', async () => {
  const storage = memory();
  const transport = vi.fn<typeof fetch>(async () =>
    Response.json({ detail: 'Email already registered.' }, { status: 409 }),
  );
  const auth = createApiAuth('http://example.test', storage, transport);
  await expect(auth.register('Name', user.email, 'weak')).rejects.toMatchObject({ status: 400 });
  expect(transport).not.toHaveBeenCalled();
  await expect(auth.register('Name', user.email, 'Password@1')).rejects.toMatchObject({
    status: 409,
  });
  expect(transport).toHaveBeenCalledTimes(1);
  storage.setItem(authSessionKey, JSON.stringify(pair()));
  const offline = createApiAuth('http://example.test', storage, async () => {
    throw Error('offline');
  });
  await expect(offline.logoutAll()).rejects.toMatchObject({ status: 503 });
  expect(storage.getItem(authSessionKey)).toBeNull();
});
it('tells the user to try login if registration succeeded but profile loading failed', async () => {
  const storage = memory();
  const transport = vi.fn<typeof fetch>(async (url) =>
    String(url).endsWith('/register')
      ? ok(pair())
      : Response.json({ detail: 'Unavailable' }, { status: 503 }),
  );
  const auth = createApiAuth('http://example.test', storage, transport);
  await expect(auth.register('Name', user.email, 'Password@1')).rejects.toThrow(
    'hãy thử đăng nhập',
  );
  expect(transport).toHaveBeenCalledTimes(2);
  expect(storage.getItem(authSessionKey)).toBeNull();
});

it('recovers without revealing account existence and resets with decoded mobile email link', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair()));
  const calls: { url: string; body: unknown }[] = [];
  const auth = createApiAuth('http://example.test', storage, async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
    return ok(null);
  });
  expect(await auth.recover(' test@example.test ')).toContain('Nếu email này đã đăng ký');
  const token = 'abc+def/ghi==';
  await auth.resetPassword(
    user.email,
    'visionaid://reset-password?token=' +
      encodeURIComponent(token) +
      '&email=' +
      encodeURIComponent(user.email),
    'NewPassword@2',
  );
  expect(calls.map((c) => c.body)).toEqual([
    { email: user.email },
    { email: user.email, token, newPassword: 'NewPassword@2' },
  ]);
  expect(storage.getItem(authSessionKey)).toBeNull();
});
it('rejects invalid links locally, reports expired tokens and never retries reset or email requests', async () => {
  const transport = vi.fn<typeof fetch>(async () =>
    Response.json({ detail: 'Invalid token.' }, { status: 403 }),
  );
  const auth = createApiAuth('http://example.test', memory(), transport);
  await expect(
    auth.resetPassword(user.email, 'https://unknown.test/?token=abc', 'NewPassword@2'),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    auth.resetPassword(
      user.email,
      'visionaid://reset-password?token=abc&email=other@example.test',
      'NewPassword@2',
    ),
  ).rejects.toMatchObject({ status: 400 });
  expect(transport).not.toHaveBeenCalled();
  await expect(auth.resetPassword(user.email, 'expired-token', 'NewPassword@2')).rejects.toThrow(
    'hết hạn',
  );
  expect(transport).toHaveBeenCalledTimes(1);
  transport.mockImplementation(async () =>
    Response.json({ detail: 'Too many requests.' }, { status: 429 }),
  );
  await expect(auth.recover(user.email)).rejects.toMatchObject({ status: 429 });
  expect(transport).toHaveBeenCalledTimes(2);
});

it('never automatically replays a resource write on 401', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair()));
  const fetcher = vi.fn<typeof fetch>(async () =>
    Response.json({ detail: 'Unauthorized' }, { status: 401 }),
  );
  const auth = createApiAuth('http://example.test', storage, fetcher);
  await expect(auth.write('/api/users', { method: 'POST', body: '{}' })).rejects.toMatchObject({
    status: 401,
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('SignalR token and REST share one refresh and reject tokens after logout', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair(-1)));
  const fresh = pair();
  const fetcher = vi.fn<typeof fetch>(async (url) =>
    String(url).endsWith('/refresh') ? ok(fresh) : ok(null),
  );
  const auth = createApiAuth('http://example.test', storage, fetcher);
  const [token] = await Promise.all([auth.accessToken(), auth.get('/api/test')]);
  expect(token).toBe(fresh.accessToken);
  expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/refresh'))).toHaveLength(1);
  await auth.logout();
  await expect(auth.accessToken()).rejects.toMatchObject({ status: 401 });
});
it('separates request timeouts from dropped connections', async () => {
  const timeout = createApiAuth('http://example.test', memory(), async () => {
    throw new DOMException('signal timed out', 'TimeoutError');
  });
  await expect(timeout.login(user.email, 'Password@1')).rejects.toMatchObject({
    status: 504,
    code: 'REQUEST_TIMEOUT',
  });
  const offline = createApiAuth('http://example.test', memory(), async () => {
    throw new TypeError('Failed to fetch');
  });
  await expect(offline.login(user.email, 'Password@1')).rejects.toMatchObject({
    status: 503,
    code: 'NETWORK_ERROR',
    message: 'Không kết nối được máy chủ. Kiểm tra mạng và địa chỉ Web.',
  });
});
it('BR-10: register and profile reject full names shorter than 2 characters before calling the BE', async () => {
  const fetcher = vi.fn<typeof fetch>();
  const auth = createApiAuth('http://example.test', memory(), fetcher);
  await expect(auth.register(' A ', user.email, 'Password@1')).rejects.toMatchObject({
    status: 400,
    message: 'Họ tên phải có từ 2 đến 200 ký tự.',
  });
  await expect(auth.profile({ name: 'B', phone: '', avatar: '' })).rejects.toMatchObject({
    status: 400,
  });
  expect(fetcher).not.toHaveBeenCalled();
});
