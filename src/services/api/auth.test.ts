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
