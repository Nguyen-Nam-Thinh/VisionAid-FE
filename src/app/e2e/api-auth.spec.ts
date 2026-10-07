import { test, expect, type Page } from '@playwright/test';
const actionDialog = (page: Page) =>
  page.getByRole('dialog').filter({
    hasNot: page.locator(':scope > header > h2').filter({
      hasText:
        /^(Chi tiết tổ chức|Chi tiết tài khoản|Thông tin liên kết|Chi tiết người được chăm sóc)$/,
    }),
  });
const id = '01900000-0000-7000-8000-000000000001';
test('8c: opt-in push registers the login device, survives reload and revokes on logout', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['notifications']);
  await stubApi(page);
  await page.route('**/node_modules/.vite/deps/@firebase_messaging.js*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
      export const isSupported = async () => true;
      export const getMessaging = () => ({});
      export const deleteToken = async () => true;
      export const getToken = async () => {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {scope: '/firebase-cloud-messaging-push-scope'});
        if (!registration.active) await new Promise(resolve => {
          const worker = registration.installing || registration.waiting;
          worker.addEventListener('statechange', () => { if (worker.state === 'activated') resolve(); });
        });
        return 'fixture-fcm-token';
      };
    `,
    }),
  );
  let registrations = 0;
  await page.route('**/api/auth/fcm-token', async (route) => {
    const deviceId = await page.evaluate(() => sessionStorage.getItem('visionaid.api.device.v1'));
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toEqual({
      fcmToken: 'fixture-fcm-token',
      clientDeviceId: deviceId,
      deviceType: 'Web',
      deviceModel: 'VisionAid Web',
      appVersion: '0.1.0',
    });
    registrations++;
    await route.fulfill({ json: { success: true, data: null } });
  });
  await login(page);
  await page.goto('/profile');
  expect(registrations).toBe(0);
  await page.getByRole('button', { name: 'Bật thông báo trình duyệt', exact: true }).click();
  await expect(
    page.getByText('Đã đăng ký nhận push cho phiên này.', { exact: true }),
  ).toBeVisible();
  expect(registrations).toBe(1);
  await page.screenshot({ path: 'test-results/8c-push-profile.png', fullPage: true });
  await page.reload();
  // Focus can also sync; every upsert above must use the same login device.
  await expect.poll(() => registrations).toBeGreaterThanOrEqual(2);
  await page.getByRole('button', { name: 'Tắt push trên trình duyệt', exact: true }).click();
  await expect(page.getByText('Chưa đăng ký push cho phiên này.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Bật thông báo trình duyệt', exact: true }).click();
  await expect(
    page.getByText('Đã đăng ký nhận push cho phiên này.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/auth\/login/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('visionaid.push.owner.v1')))
    .toBeNull();
  await expect
    .poll(() =>
      page.evaluate(
        async () => !!(await (await caches.open('visionaid-push-v1')).match('/push-enabled')),
      ),
    )
    .toBe(false);
});
const token = () =>
  'header.' +
  Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 })).toString('base64url') +
  '.signature';
async function stubApi(page: Page, role = 'Caregiver', organizationId: string | null = null) {
  const calls: string[] = [];
  await page.route('http://localhost:5176/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    calls.push(path);
    if (path === '/api/auth/login' || path === '/api/auth/refresh')
      return route.fulfill({
        json: {
          success: true,
          data: {
            accessToken: token(),
            refreshToken: 'test-rotation',
            expiresAt: '2099-01-01T00:00:00Z',
          },
        },
      });
    if (path === '/api/users/me')
      return route.fulfill({
        json: {
          success: true,
          data: {
            id,
            email: 'api@example.test',
            fullName: 'Người dùng API',
            role,
            isActive: true,
            organizationId,
          },
        },
      });
    if (path === '/api/auth/logout') return route.fulfill({ json: { success: true, data: null } });
    return route.fulfill({ status: 500, json: { detail: 'Unexpected endpoint' } });
  });
  return calls;
}
async function login(page: Page, succeeds = true) {
  await page.goto('/auth/login');
  await expect(page.getByLabel('Địa chỉ email')).toHaveValue('');
  await expect(page.getByLabel('Chọn tài khoản demo')).toHaveCount(0);
  await page.getByLabel('Địa chỉ email').fill('api@example.test');
  await page.getByLabel('Mật khẩu *', { exact: true }).fill('Password@1');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  if (succeeds) await expect(page).toHaveURL(/\/dashboard$/);
}
for (const role of ['Caregiver', 'CenterAdmin', 'Admin']) {
  test(`API ${role}: login, reload, refresh, stage boundary and logout`, async ({ page }) => {
    const calls = await stubApi(page, role);
    await login(page);
    await expect(
      page.getByRole('heading', { name: 'Đã đăng nhập bằng tài khoản BE' }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Đã đăng nhập bằng tài khoản BE' }),
    ).toBeVisible();
    await page.evaluate(() => {
      const key = 'visionaid.api.session.v1';
      const data = JSON.parse(sessionStorage.getItem(key)!);
      data.accessToken = 'header.' + btoa(JSON.stringify({ exp: 1 })) + '.signature';
      sessionStorage.setItem(key, JSON.stringify(data));
    });
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Đã đăng nhập bằng tài khoản BE' }),
    ).toBeVisible();
    expect(calls.filter((p) => p === '/api/auth/refresh')).toHaveLength(1);
    const path =
      role === 'Admin'
        ? '/admin/metrics'
        : role === 'CenterAdmin'
          ? '/center-admin/reports'
          : '/caregiver/registry';
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Chưa tích hợp trong đợt này' })).toBeVisible();
    expect(
      calls.every((p) => ['/api/auth/login', '/api/users/me', '/api/auth/refresh'].includes(p)),
    ).toBe(true);
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/login$/);
    expect(
      await page.evaluate(() => sessionStorage.getItem('visionaid.api.session.v1')),
    ).toBeNull();
    expect(calls).toContain('/api/auth/logout');
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login$/);
  });
}
test('API login errors do not fall back to demo and failed logout still clears the tab', async ({
  page,
}) => {
  await stubApi(page);
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({ status: 401, json: { detail: 'Invalid email or password.' } }),
  );
  await login(page, false);
  await expect(page.getByRole('alert')).toContainText('Invalid email or password.');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await page.unroute('**/api/auth/login');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Đã đăng nhập bằng tài khoản BE' })).toBeVisible();
  await page.route('**/api/auth/logout', (route) => route.abort('failed'));
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole('status')).toContainText('chưa xác nhận');
  expect(await page.evaluate(() => sessionStorage.getItem('visionaid.api.session.v1'))).toBeNull();
});

test('profile save, reload, password rejection and successful change', async ({ page }) => {
  await stubApi(page);
  let fullName = 'Người dùng API';
  await page.route('**/api/users/me', async (route) => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON();
      expect(body).toEqual({ fullName: 'Tên mới', phoneNumber: '0901234567' });
      fullName = body.fullName;
    }
    await route.fulfill({
      json: {
        success: true,
        data: {
          id,
          email: 'api@example.test',
          fullName,
          phoneNumber: '0901234567',
          role: 'Caregiver',
          isActive: true,
          organizationId: null,
        },
      },
    });
  });
  let accepted = false;
  await page.route('**/api/auth/change-password', (route) =>
    route.fulfill(
      accepted
        ? { json: { success: true } }
        : { status: 403, json: { detail: 'Current password is incorrect.' } },
    ),
  );
  await login(page);
  await expect(page).toHaveURL(/dashboard$/);
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ', exact: true }).click();
  await page.getByLabel('Họ và tên').fill('Tên mới');
  await page.getByLabel('Số điện thoại').fill('0901234567');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('status')).toContainText('Đã cập nhật hồ sơ');
  await page.reload();
  await expect(page.getByText('Tên mới · 0901234567', { exact: true })).toBeVisible();
  await expect(page.locator('input[type=file]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
  await page.getByLabel('Mật khẩu hiện tại').fill('WrongPassword@1');
  await page.getByLabel('Mật khẩu mới', { exact: false }).first().fill('NewPassword@2');
  await page.getByLabel('Nhập lại mật khẩu mới').fill('NewPassword@2');
  await actionDialog(page).getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Current password is incorrect.');
  await expect(page).toHaveURL(/profile$/);
  accepted = true;
  await actionDialog(page).getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
  await expect(page).toHaveURL(/auth\/login$/);
  await expect(page.getByRole('status')).toContainText('Đã đổi mật khẩu');
  expect(await page.evaluate(() => sessionStorage.getItem('visionaid.api.session.v1'))).toBeNull();
});

test('register caregiver, reject duplicate email, then confirm logout all', async ({ page }) => {
  await stubApi(page);
  let duplicate = true;
  let registrations = 0;
  let logouts = 0;
  await page.route('**/api/auth/register', (route) => {
    registrations++;
    expect(route.request().postDataJSON()).toMatchObject({
      fullName: 'Caregiver Test',
      email: 'new@example.test',
      device: { deviceType: 'Web' },
    });
    expect(route.request().postDataJSON()).not.toHaveProperty('role');
    return route.fulfill(
      duplicate
        ? { status: 409, json: { detail: 'Email already registered.' } }
        : { json: { success: true, data: { accessToken: token(), refreshToken: 'new-refresh' } } },
    );
  });
  await page.route('**/api/auth/logout-all', (route) => {
    logouts++;
    return route.fulfill({ json: { success: true } });
  });
  await page.goto('/auth/register');
  await page.getByLabel('Họ và tên').fill('Caregiver Test');
  await page.getByLabel('Địa chỉ email').fill('new@example.test');
  await page.getByLabel('Mật khẩu *', { exact: true }).fill('Password@1');
  await page.getByLabel('Nhập lại mật khẩu').fill('Different@1');
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('không khớp');
  expect(registrations).toBe(0);
  await page.getByLabel('Nhập lại mật khẩu').fill('Password@1');
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Email already registered.');
  expect(registrations).toBe(1);
  duplicate = false;
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page).toHaveURL(/dashboard$/);
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Đăng xuất tất cả thiết bị', exact: true }).click();
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(logouts).toBe(0);
  await page.getByRole('button', { name: 'Đăng xuất tất cả thiết bị', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page).toHaveURL(/auth\/login$/);
  expect(logouts).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem('visionaid.api.session.v1'))).toBeNull();
});
test('failed logout all reports uncertainty and still clears local session', async ({ page }) => {
  await stubApi(page);
  await login(page);
  await expect(page).toHaveURL(/dashboard$/);
  await page.route('**/api/auth/logout-all', (route) => route.abort('failed'));
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Đăng xuất tất cả thiết bị', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page).toHaveURL(/auth\/login$/);
  await expect(page.getByRole('status')).toContainText('chưa xác nhận');
  expect(await page.evaluate(() => sessionStorage.getItem('visionaid.api.session.v1'))).toBeNull();
});

test('recovery email, expired token, pasted link and login after reset', async ({ page }) => {
  await stubApi(page);
  let emails = 0;
  let resets = 0;
  let expired = true;
  await page.route('**/api/auth/forgot-password', (route) => {
    emails++;
    expect(route.request().postDataJSON()).toEqual({ email: 'api@example.test' });
    return route.fulfill({ json: { success: true } });
  });
  await page.route('**/api/auth/reset-password', (route) => {
    resets++;
    expect(route.request().postDataJSON()).toEqual({
      email: 'api@example.test',
      token: 'abc+def/ghi==',
      newPassword: 'NewPassword@2',
    });
    return route.fulfill(
      expired ? { status: 403, json: { detail: 'Expired' } } : { json: { success: true } },
    );
  });
  await page.goto('/auth/login');
  await page.getByRole('link', { name: 'Quên mật khẩu?' }).click();
  await page.getByLabel('Địa chỉ email').fill('api@example.test');
  await page.getByRole('button', { name: 'Tạo yêu cầu khôi phục' }).click();
  await expect(page.getByRole('status')).toContainText('Nếu email này đã đăng ký');
  expect(emails).toBe(1);
  await expect(page.getByText('Mã demo', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Nhập mã khôi phục' })).toHaveCount(0);
  await page.goto('/reset-password?token=abc%2Bdef%2Fghi%3D%3D&email=api%40example.test');
  await page.getByLabel('Mật khẩu mới *', { exact: true }).fill('NewPassword@2');
  await page.getByLabel('Nhập lại mật khẩu mới').fill('Different@2');
  await page.getByRole('button', { name: 'Đặt mật khẩu', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('không khớp');
  expect(resets).toBe(0);
  await page.getByLabel('Nhập lại mật khẩu mới').fill('NewPassword@2');
  await page.getByRole('button', { name: 'Đặt mật khẩu', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('hết hạn');
  expect(resets).toBe(1);
  expired = false;
  await page.getByRole('button', { name: 'Đặt mật khẩu', exact: true }).click();
  await expect(page).toHaveURL(/auth\/login$/);
  await expect(page.getByRole('status')).toContainText('Đã đặt lại mật khẩu');
  await page.getByLabel('Địa chỉ email').fill('api@example.test');
  await page.getByLabel('Mật khẩu *', { exact: true }).fill('NewPassword@2');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/dashboard$/);
});

test('caregiver reads paginated users, link permissions, search and revoked access without mutations', async ({
  page,
}) => {
  await stubApi(page);
  const viuId = '01900000-0000-7000-8000-000000000002';
  const linkId = '01900000-0000-7000-8000-000000000003';
  const person = {
    id: viuId,
    fullName: 'Người thân BE',
    email: 'viu@example.test',
    phoneNumber: null,
    role: 'VisuallyImpaired',
    organizationId: null,
    isActive: true,
  };
  const link = {
    id: linkId,
    caregiverId: id,
    visuallyImpairedUserId: viuId,
    viuFullName: person.fullName,
    isPrimary: false,
    linkType: 'Personal',
    canReceiveAlerts: true,
    canManageRegistry: false,
    canManageLocations: true,
    linkedAt: '2026-09-26T00:00:00Z',
    unlinkedAt: null,
  };
  let revoked = false;
  const data = (items: unknown[], totalCount = items.length) => ({
    items,
    page: 1,
    pageSize: 10,
    totalCount,
    totalPages: Math.ceil(totalCount / 10),
    hasNextPage: totalCount > 10,
    hasPreviousPage: false,
  });
  await page.route('**/api/users?*', (route) => {
    expect(route.request().method()).toBe('GET');
    const query = new URL(route.request().url()).searchParams;
    expect(query.get('role')).toBe('VisuallyImpaired');
    const empty = revoked || query.get('search') === 'Không tìm thấy' || query.get('page') === '2';
    return route.fulfill({
      json: {
        success: true,
        data: { ...data(empty ? [] : [person], empty ? 0 : 11), page: Number(query.get('page')) },
      },
    });
  });
  await page.route('**/api/caregiver-links?*', (route) => {
    expect(new URL(route.request().url()).searchParams.get('viuId')).toBe(viuId);
    return route.fulfill({ json: { success: true, data: data([link]) } });
  });
  await page.route('**/api/caregiver-links/' + linkId, (route) =>
    route.fulfill({ json: { success: true, data: link } }),
  );
  await login(page);
  await expect(page).toHaveURL(/dashboard$/);
  await page.getByRole('link', { name: 'Người được chăm sóc', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Người thân BE', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thêm người thân' })).toHaveCount(0);
  await page.getByLabel('Người được chăm sóc trên trang này').selectOption(viuId);
  await page.getByRole('button', { name: 'Xem quyền liên kết' }).click();
  await expect(page.getByRole('heading', { name: 'Quyền liên kết', exact: true })).toBeVisible();
  await expect(page.locator('dl')).toContainText('Quản lý gương mặtKhông');
  await page
    .getByRole('dialog', { name: 'Chi tiết người được chăm sóc', exact: true })
    .getByRole('button', { name: 'Đóng hộp thoại' })
    .click();
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quyền liên kết', exact: true })).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Không có người dùng phù hợp');
  await page.getByLabel('Tìm người được chăm sóc').fill('Không tìm thấy');
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Không có người dùng phù hợp');
  await page.getByLabel('Tìm người được chăm sóc').fill('');
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await page.getByLabel('Người được chăm sóc trên trang này').selectOption(viuId);
  revoked = true;
  await page
    .getByRole('dialog', { name: 'Chi tiết người được chăm sóc', exact: true })
    .getByRole('button', { name: 'Đóng hộp thoại' })
    .click();
  await page.getByRole('button', { name: 'Tải lại', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Liên kết với Người thân BE' })).toHaveCount(0);
});
test('caregiver users 403 is visible with retry and no demo fallback', async ({ page }) => {
  await stubApi(page);
  await page.route('**/api/users?*', (route) =>
    route.fulfill({ status: 403, json: { detail: 'Access denied.' } }),
  );
  await login(page);
  await expect(page).toHaveURL(/dashboard$/);
  await page.goto('/caregiver/users');
  await expect(page.getByRole('alert')).toContainText('Access denied.');
  await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(0);
});

test('4b: partial link failure survives reload; unlink requires confirmation and preserves errors', async ({
  page,
}) => {
  await stubApi(page);
  const viuId = '01900000-0000-7000-8000-000000000002';
  const linkId = '01900000-0000-7000-8000-000000000003';
  const person = {
    id: viuId,
    fullName: 'VIU mới',
    email: 'new@example.test',
    phoneNumber: '',
    role: 'VisuallyImpaired',
    organizationId: null,
    isActive: true,
  };
  const link = {
    id: linkId,
    caregiverId: id,
    visuallyImpairedUserId: viuId,
    viuFullName: person.fullName,
    isPrimary: true,
    linkType: 'Personal',
    canReceiveAlerts: true,
    canManageRegistry: false,
    canManageLocations: false,
    linkedAt: '2026-09-26',
    unlinkedAt: null,
  };
  let creates = 0,
    links = 0,
    deletes = 0,
    linked = false;
  const paged = (items: unknown[]) => ({
    items,
    page: 1,
    pageSize: 10,
    totalCount: items.length,
    totalPages: items.length ? 1 : 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  await page.route('**/api/users?*', (route) =>
    route.fulfill({ json: { success: true, data: paged(linked ? [person] : []) } }),
  );
  await page.route('**/api/users', (route) => {
    creates++;
    return route.fulfill({ status: 201, json: { success: true, data: person } });
  });
  await page.route('**/api/caregiver-links**', (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      links++;
      if (links === 1) return route.fulfill({ status: 503, json: { detail: 'Liên kết tạm lỗi' } });
      linked = true;
      return route.fulfill({ status: 201, json: { success: true, data: link } });
    }
    if (method === 'DELETE') {
      deletes++;
      if (deletes === 1) return route.fulfill({ status: 403, json: { detail: 'Chưa thể gỡ' } });
      linked = false;
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({
      json: {
        success: true,
        data: new URL(route.request().url()).pathname.endsWith(linkId)
          ? link
          : paged(linked ? [link] : []),
      },
    });
  });
  await login(page);
  await page.goto('/caregiver/users');
  await page.getByRole('button', { name: 'Thêm người được chăm sóc', exact: true }).click();
  await page.getByLabel('Họ và tên', { exact: false }).fill(person.fullName);
  await page.getByLabel('Email *', { exact: true }).fill(person.email);
  await page.getByLabel('Mật khẩu *', { exact: true }).fill('Test123!');
  await page.getByLabel('Nhập lại mật khẩu').fill('Test123!');
  await page.getByRole('button', { name: 'Bước 1: Tạo tài khoản VIU' }).click();
  await expect(page.getByText(viuId, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Bước 2: Tạo liên kết' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Tiếp tục liên kết người được chăm sóc' }).click();
  await expect(page.getByText(viuId, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(sessionStorage))).not.toContain('Test123!');
  await page.getByRole('button', { name: 'Bước 2: Tạo liên kết' }).click();
  await actionDialog(page).getByRole('button', { name: 'Đóng hộp thoại' }).click();
  await page.getByRole('button', { name: 'Xem liên kết của VIU mới' }).click();
  await page.getByRole('button', { name: 'Gỡ liên kết', exact: true }).click();
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(deletes).toBe(0);
  await page.getByRole('button', { name: 'Gỡ liên kết', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(actionDialog(page).getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(actionDialog(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Xem liên kết của VIU mới' })).toHaveCount(0);
  expect(creates).toBe(1);
  expect(links).toBe(2);
  expect(deletes).toBe(2);
});

const organizationId = '01900000-0000-7000-8000-000000000021';
const organizationFixture = {
  id: organizationId,
  name: 'Trung tâm thử nghiệm',
  taxCode: 'TEST-123',
  address: 'Địa chỉ test',
  phoneNumber: null,
  contactEmail: null,
  isActive: true,
  deletedAt: null as string | null,
  createdAt: '2026-09-26',
  updatedAt: '2026-09-26',
  staffCount: 0,
  viuCount: 0,
  centerAdminName: null,
};
const organizationPage = (items: unknown[], page = 1, totalCount = items.length) => ({
  items,
  page,
  pageSize: 10,
  totalCount,
  totalPages: Math.ceil(totalCount / 10),
  hasPreviousPage: page > 1,
  hasNextPage: page * 10 < totalCount,
});
test('5a Admin: create, detail, update, status, delete and restore with confirmations', async ({
  page,
}) => {
  await stubApi(page, 'Admin');
  let org = { ...organizationFixture };
  let exists = false,
    writes = 0,
    failStatus = true;
  const bodies: { method: string; body: Record<string, unknown> | null }[] = [];
  await page.route('http://localhost:5176/api/organizations**', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method !== 'GET') {
      writes++;
      bodies.push({ method, body: request.postDataJSON() });
    }
    if (method === 'POST') {
      exists = true;
      org = { ...org, ...request.postDataJSON() };
    }
    if (method === 'PUT') org = { ...org, ...request.postDataJSON() };
    if (method === 'PATCH') {
      if (failStatus) {
        failStatus = false;
        return route.fulfill({
          status: 403,
          json: { detail: 'Không đủ quyền thay đổi trạng thái' },
        });
      }
      org = { ...org, isActive: request.postDataJSON().isActive, deletedAt: null };
      return route.fulfill({ json: { success: true, data: null } });
    }
    if (method === 'DELETE') {
      org = { ...org, isActive: false, deletedAt: '2026-09-26' };
      return route.fulfill({ status: 204 });
    }
    if (url.pathname.endsWith('/members'))
      return route.fulfill({ json: { success: true, data: organizationPage([]) } });
    if (method === 'GET' && url.pathname === '/api/organizations') {
      const filter = url.searchParams.get('isDeleted');
      return route.fulfill({
        json: {
          success: true,
          data: organizationPage(
            exists && (filter === null || (filter === 'true') === !!org.deletedAt) ? [org] : [],
          ),
        },
      });
    }
    return route.fulfill({
      status: method === 'POST' ? 201 : 200,
      json: { success: true, data: org },
    });
  });
  await login(page);
  await page.goto('/admin/organizations');
  await page.getByRole('button', { name: 'Tạo tổ chức', exact: true }).click();
  const dialog = actionDialog(page);
  await dialog.getByLabel('Tên tổ chức').fill(org.name);
  await dialog.getByLabel('Mã số thuế / giấy phép').fill('TEST-123');
  await dialog.getByRole('button', { name: 'Tạo tổ chức', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('heading', { name: org.name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sửa tổ chức', exact: true }).click();
  await expect(dialog.getByLabel('Mã số thuế / giấy phép')).toHaveCount(0);
  await dialog.getByLabel('Địa chỉ', { exact: true }).fill('Địa chỉ mới');
  await dialog.getByRole('button', { name: 'Lưu tổ chức' }).click();
  await expect(dialog).toHaveCount(0);
  expect(bodies.find((b) => b.method === 'PUT')?.body).not.toHaveProperty('taxCode');
  await page.getByRole('button', { name: 'Vô hiệu hóa tổ chức', exact: true }).click();
  await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(writes).toBe(2);
  await page.getByRole('button', { name: 'Vô hiệu hóa tổ chức', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Không đủ quyền');
  await dialog.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Kích hoạt tổ chức', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa tổ chức', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByLabel('Dữ liệu xóa').selectOption('true');
  await page.getByRole('button', { name: 'Xem tổ chức ' + org.name }).click();
  await expect(page.getByRole('button', { name: 'Sửa tổ chức', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Kích hoạt tổ chức', exact: true }).click();
  await expect(dialog).toContainText('thành viên vẫn cần được kích hoạt riêng');
  await dialog.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sửa tổ chức', exact: true })).toBeVisible();
});
test('5a CenterAdmin: own profile, member paging/filter and no platform mutations', async ({
  page,
}) => {
  await stubApi(page, 'CenterAdmin', organizationId);
  let org = { ...organizationFixture };
  const calls: string[] = [];
  await page.route('http://localhost:5176/api/organizations**', (route) => {
    const request = route.request(),
      url = new URL(request.url());
    calls.push(request.method() + ' ' + url.pathname + url.search);
    if (url.pathname.endsWith('/members')) {
      const pageNumber = Number(url.searchParams.get('page'));
      const member = {
        id,
        fullName: 'Nhân viên trang ' + pageNumber,
        email: 'staff@example.test',
        phoneNumber: null,
        role: 'Caregiver',
        isActive: true,
        lastLoginAt: null,
        createdAt: '2026-09-26',
      };
      return route.fulfill({
        json: { success: true, data: organizationPage([member], pageNumber, 11) },
      });
    }
    if (request.method() === 'PUT') org = { ...org, ...request.postDataJSON() };
    return route.fulfill({ json: { success: true, data: org } });
  });
  await login(page);
  await page.goto('/center-admin/organization');
  await expect(page.getByRole('heading', { name: org.name, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tạo tổ chức', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Xóa tổ chức', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Vô hiệu hóa tổ chức', exact: true })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: 'Trang sau' }).click();
  await expect(page.getByText('Nhân viên trang 2', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Vai trò', exact: true }).selectOption('Caregiver');
  await expect(page.getByText('Nhân viên trang 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sửa tổ chức', exact: true }).click();
  await actionDialog(page).getByLabel('Email liên hệ').fill('center@example.test');
  await page.getByRole('button', { name: 'Lưu tổ chức' }).click();
  await expect(actionDialog(page)).toHaveCount(0);
  expect(calls.some((c) => c === 'GET /api/organizations/me')).toBe(true);
  expect(calls.some((c) => c.startsWith('GET /api/organizations?'))).toBe(false);
  expect(calls.some((c) => c.includes('role=Caregiver'))).toBe(true);
  await page.goto('/admin/organizations');
  await expect(page).toHaveURL(/forbidden$/);
});
test('5a CenterAdmin rejects a response from another organization', async ({ page }) => {
  await stubApi(page, 'CenterAdmin', organizationId);
  await page.route('**/api/organizations/me', (route) =>
    route.fulfill({ json: { success: true, data: { ...organizationFixture, id } } }),
  );
  await login(page);
  await page.goto('/center-admin/organization');
  await expect(page.getByRole('alert')).toContainText('không thuộc phiên');
  await expect(page.getByRole('button', { name: 'Sửa tổ chức', exact: true })).toHaveCount(0);
});

test('5b Admin: create/edit/status/reset/delete accounts without changing identity fields', async ({
  page,
}) => {
  await stubApi(page, 'Admin');
  const targetId = '01900000-0000-7000-8000-000000000031';
  let account = {
    id: targetId,
    fullName: 'Tài khoản mới',
    email: 'managed@example.test',
    role: 'Caregiver',
    organizationId,
    phoneNumber: '',
    avatarUrl: '',
    isActive: true,
    deletedAt: null as string | null,
    lastLoginAt: null,
    createdAt: '2026-09-26',
    updatedAt: '2026-09-26',
  };
  let created = false,
    resets = 0,
    deletes = 0;
  const writes: { method: string; path: string; body: Record<string, unknown> | null }[] = [];
  await page.route('http://localhost:5176/api/organizations/' + organizationId, (route) =>
    route.fulfill({ json: { success: true, data: organizationFixture } }),
  );
  await page.route('http://localhost:5176/api/users**', (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      method = req.method();
    if (url.pathname === '/api/users/me') return route.fallback();
    if (method !== 'GET') writes.push({ method, path: url.pathname, body: req.postDataJSON() });
    if (method === 'POST') {
      created = true;
      const body = req.postDataJSON();
      account = {
        ...account,
        fullName: body.fullName,
        email: body.email,
        role: body.role,
        organizationId: body.organizationId,
      };
    }
    if (method === 'PUT') account = { ...account, ...req.postDataJSON() };
    if (url.pathname.endsWith('/reset-password')) {
      resets++;
      return route.fulfill({ json: { success: true, data: null } });
    }
    if (url.pathname.endsWith('/status'))
      account = { ...account, isActive: req.postDataJSON().isActive };
    if (method === 'DELETE') {
      deletes++;
      if (deletes === 1)
        return route.fulfill({ status: 403, json: { detail: 'Không cho phép xóa' } });
      account = { ...account, isActive: false, deletedAt: '2026-09-26' };
      return route.fulfill({ status: 204 });
    }
    const isList = method === 'GET' && url.pathname === '/api/users';
    return route.fulfill({
      status: method === 'POST' ? 201 : 200,
      json: {
        success: true,
        data: isList ? organizationPage(created && !account.deletedAt ? [account] : []) : account,
      },
    });
  });
  await login(page);
  await page.goto('/admin/accounts');
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const dialog = actionDialog(page);
  await dialog.getByLabel('Họ và tên').fill(account.fullName);
  await dialog.getByLabel('Email', { exact: false }).fill(account.email);
  await dialog.getByLabel('Mật khẩu mới').fill('Password@1');
  await dialog.getByLabel('Nhập lại mật khẩu').fill('Password@1');
  await dialog.getByLabel('Vai trò tài khoản').selectOption('Caregiver');
  await dialog.getByLabel('Mã tổ chức', { exact: true }).fill(organizationId);
  await dialog.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Sửa hồ sơ tài khoản', exact: true }).click();
  await expect(dialog.getByLabel('Vai trò tài khoản')).toHaveCount(0);
  await dialog.getByLabel('Họ và tên').fill('Tài khoản đã sửa');
  await dialog.getByRole('button', { name: 'Lưu hồ sơ' }).click();
  await expect(dialog).toHaveCount(0);
  expect(writes.find((w) => w.method === 'PUT')?.body).toEqual({
    fullName: 'Tài khoản đã sửa',
    phoneNumber: '',
    avatarUrl: '',
  });
  await page.getByRole('button', { name: 'Vô hiệu hóa tài khoản', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Kích hoạt tài khoản', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true }).click();
  await dialog.getByLabel('Mật khẩu mới').fill('Another@123');
  await dialog.getByLabel('Nhập lại mật khẩu').fill('Another@123');
  await dialog.getByRole('button', { name: 'Xác nhận đặt lại mật khẩu' }).click();
  await expect(dialog.getByRole('alert')).toContainText('xác nhận');
  expect(resets).toBe(0);
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Xác nhận đặt lại mật khẩu' }).click();
  await expect(dialog).toHaveCount(0);
  expect(resets).toBe(1);
  expect(await page.evaluate(() => JSON.stringify(sessionStorage))).not.toContain('Another@123');
  await page.getByRole('button', { name: 'Xóa tài khoản', exact: true }).click();
  await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(deletes).toBe(0);
  await page.getByRole('button', { name: 'Xóa tài khoản', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Không cho phép');
  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Xem tài khoản ' + account.email })).toHaveCount(0);
});
test('5b CenterAdmin: fixed role and own organization, no delete; cross-org response is hidden', async ({
  page,
}) => {
  await stubApi(page, 'CenterAdmin', organizationId);
  let wrongOrg = false;
  const account = {
    id: '01900000-0000-7000-8000-000000000031',
    fullName: 'Nhân viên trung tâm',
    email: 'staff@example.test',
    role: 'Caregiver',
    organizationId,
    phoneNumber: null,
    avatarUrl: null,
    isActive: true,
    deletedAt: null,
    lastLoginAt: null,
    createdAt: '2026-09-26',
    updatedAt: '2026-09-26',
  };
  const queries: URL[] = [];
  await page.route('http://localhost:5176/api/users**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/users/me') return route.fallback();
    queries.push(url);
    return route.fulfill({
      json: {
        success: true,
        data:
          url.pathname === '/api/users'
            ? organizationPage([
                {
                  ...account,
                  role: url.searchParams.get('role'),
                  organizationId: wrongOrg ? id : organizationId,
                },
              ])
            : account,
      },
    });
  });
  await login(page);
  await page.goto('/center-admin/staff');
  await page.getByRole('button', { name: 'Xem tài khoản ' + account.email }).click();
  await expect(
    page.getByRole('button', { name: 'Sửa hồ sơ tài khoản', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xóa tài khoản', exact: true })).toHaveCount(0);
  await page
    .getByRole('dialog', { name: 'Chi tiết tài khoản', exact: true })
    .getByRole('button', { name: 'Đóng hộp thoại' })
    .click();
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(actionDialog(page).getByLabel('Vai trò tài khoản')).toHaveCount(0);
  await expect(actionDialog(page).getByLabel('Mã tổ chức', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Đóng hộp thoại' }).click();
  expect(queries[0].searchParams.get('role')).toBe('Caregiver');
  expect(queries[0].searchParams.get('organizationId')).toBe(organizationId);
  await page.goto('/center-admin/users');
  await expect(page.getByRole('button', { name: 'Xem tài khoản ' + account.email })).toBeVisible();
  expect(queries.at(-1)?.searchParams.get('role')).toBe('VisuallyImpaired');
  wrongOrg = true;
  await page.getByRole('button', { name: 'Tải lại', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Không có quyền');
  await expect(page.getByRole('button', { name: 'Xem tài khoản ' + account.email })).toHaveCount(0);
});

const cgLinkId = '01900000-0000-7000-8000-000000000041';
const linkedViuId = '01900000-0000-7000-8000-000000000042';
const managedLink = {
  id: cgLinkId,
  caregiverId: id,
  caregiverFullName: 'Nhân viên',
  caregiverEmail: 'cg@example.test',
  visuallyImpairedUserId: linkedViuId,
  viuFullName: 'VIU test',
  viuEmail: 'viu@example.test',
  linkType: 'Organization',
  isPrimary: false,
  canReceiveAlerts: true,
  canManageRegistry: false,
  canManageLocations: false,
  linkedAt: '2026-09-26',
  unlinkedAt: null as string | null,
};
for (const actorRole of ['Admin', 'CenterAdmin']) {
  test(
    '5c ' + actorRole + ': create, permission errors, primary promotion and unlink',
    async ({ page }) => {
      await stubApi(page, actorRole, actorRole === 'CenterAdmin' ? organizationId : null);
      let current = { ...managedLink },
        exists = false,
        failPermission = true,
        writes = 0;
      await page.route('http://localhost:5176/api/users/*', (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith('/me')) return route.fallback();
        const cg = path.endsWith(id);
        return route.fulfill({
          json: {
            success: true,
            data: {
              id: cg ? id : linkedViuId,
              role: cg ? 'Caregiver' : 'VisuallyImpaired',
              organizationId,
              isActive: true,
              deletedAt: null,
            },
          },
        });
      });
      await page.route('http://localhost:5176/api/caregiver-links**', (route) => {
        const req = route.request(),
          url = new URL(req.url()),
          method = req.method();
        if (method !== 'GET') writes++;
        if (method === 'POST') {
          exists = true;
          current = { ...current, ...req.postDataJSON() };
        }
        if (method === 'PUT') {
          if (failPermission) {
            failPermission = false;
            return route.fulfill({ status: 403, json: { detail: 'Quyền đã thay đổi' } });
          }
          current = { ...current, ...req.postDataJSON() };
        }
        if (method === 'PATCH') current = { ...current, isPrimary: true };
        if (method === 'DELETE') {
          current = { ...current, unlinkedAt: '2026-09-26', isPrimary: false };
          return route.fulfill({ status: 204 });
        }
        return route.fulfill({
          status: method === 'POST' ? 201 : 200,
          json: {
            success: true,
            data:
              method === 'GET' && url.pathname === '/api/caregiver-links'
                ? organizationPage(exists && !current.unlinkedAt ? [current] : [])
                : current,
          },
        });
      });
      await login(page);
      await page.goto(actorRole === 'Admin' ? '/admin/links' : '/center-admin/assignments');
      await page.getByRole('button', { name: 'Tạo liên kết', exact: true }).click();
      const dialog = actionDialog(page);
      await dialog.getByLabel('Mã Caregiver').fill(id);
      await dialog.getByLabel('Mã VIU').fill(linkedViuId);
      await dialog.getByLabel('Tôi xác nhận tạo liên kết giữa các tài khoản trên').check();
      await dialog.getByRole('button', { name: 'Tạo liên kết', exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Chi tiết liên kết' })).toBeVisible();
      await page.getByRole('button', { name: 'Sửa quyền liên kết', exact: true }).click();
      await dialog.getByLabel('Quản lý gương mặt').check();
      await dialog.getByLabel('Tôi xác nhận cập nhật các quyền trên').check();
      await dialog.getByRole('button', { name: 'Lưu quyền liên kết' }).click();
      await expect(dialog.getByRole('alert')).toContainText('Quyền đã thay đổi');
      await dialog.getByRole('button', { name: 'Lưu quyền liên kết' }).click();
      await expect(dialog).toHaveCount(0);
      await page.getByRole('button', { name: 'Chuyển thành chăm sóc chính' }).click();
      await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
      expect(writes).toBe(3);
      await page.getByRole('button', { name: 'Chuyển thành chăm sóc chính' }).click();
      await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Chuyển thành chăm sóc chính' })).toHaveCount(
        0,
      );
      await page.getByRole('button', { name: 'Gỡ liên kết', exact: true }).click();
      await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Chi tiết liên kết' })).toHaveCount(0);
      expect(writes).toBe(5);
    },
  );
}
test('5c Caregiver: own Personal permissions only, Organization read-only and no promote', async ({
  page,
}) => {
  await stubApi(page);
  let link = { ...managedLink, linkType: 'Personal' };
  await page.route('http://localhost:5176/api/caregiver-links**', (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'PUT') link = { ...link, ...route.request().postDataJSON() };
    return route.fulfill({
      json: {
        success: true,
        data: url.pathname === '/api/caregiver-links' ? organizationPage([link]) : link,
      },
    });
  });
  await login(page);
  await page.goto('/caregiver/caregivers');
  await page.getByRole('button', { name: 'Xem liên kết ' + cgLinkId }).click();
  await expect(page.getByRole('button', { name: 'Chuyển thành chăm sóc chính' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sửa quyền liên kết', exact: true }).click();
  await actionDialog(page).getByLabel('Nhận cảnh báo').uncheck();
  await actionDialog(page).getByLabel('Tôi xác nhận cập nhật các quyền trên').check();
  await page.getByRole('button', { name: 'Lưu quyền liên kết' }).click();
  await expect(actionDialog(page)).toHaveCount(0);
  expect(link.canReceiveAlerts).toBe(false);
  link = { ...link, linkType: 'Organization' };
  await page
    .getByRole('dialog', { name: 'Thông tin liên kết', exact: true })
    .getByRole('button', { name: 'Đóng hộp thoại' })
    .click();
  await page.getByRole('button', { name: 'Tải lại', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sửa quyền liên kết', exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole('button', { name: 'Gỡ liên kết', exact: true })).toHaveCount(0);
});

for (const role of ['Caregiver', 'CenterAdmin']) {
  test(`API ${role}: GPS history, missing live data and revoked access`, async ({ page }) => {
    const org = '01900000-0000-7000-8000-000000000009';
    const viu = '01900000-0000-7000-8000-000000000002';
    await stubApi(page, role, role === 'CenterAdmin' ? org : null);
    const historyCalls: URL[] = [];
    let forbidden = false;
    const gpsWrites: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/api/locations/') && r.method() !== 'GET') gpsWrites.push(r.url());
    });
    await page.route('http://localhost:5176/api/users?*', async (route) => {
      const q = new URL(route.request().url()).searchParams;
      expect(q.get('role')).toBe('VisuallyImpaired');
      if (role === 'CenterAdmin') expect(q.get('organizationId')).toBe(org);
      return route.fulfill({
        json: {
          success: true,
          data: organizationPage([
            {
              id: viu,
              fullName: 'GPS Test VIU',
              email: 'viu@test.test',
              phoneNumber: null,
              role: 'VisuallyImpaired',
              organizationId: role === 'CenterAdmin' ? org : null,
              isActive: true,
              avatarUrl: null,
              deletedAt: null,
              lastLoginAt: null,
              createdAt: '2026-09-26',
              updatedAt: '2026-09-26',
            },
          ]),
        },
      });
    });
    await page.route('http://localhost:5176/api/locations/live?*', (route) =>
      route.fulfill({
        status: forbidden ? 403 : 404,
        json: { detail: forbidden ? 'GPS access denied' : 'No GPS cache' },
      }),
    );
    await page.route('http://localhost:5176/api/locations/history?*', (route) => {
      const url = new URL(route.request().url());
      historyCalls.push(url);
      expect(url.searchParams.get('viuId')).toBe(viu);
      expect(url.searchParams.get('pageSize')).toBe('20');
      return route.fulfill({
        json: {
          success: true,
          data: {
            items: [
              {
                id: viu,
                latitude: 0,
                longitude: 0,
                accuracyMeters: null,
                altitude: -2,
                speedMps: 0,
                heading: null,
                batteryLevel: 0,
                networkStatus: null,
                recordedAt: '2026-09-26T00:00:00Z',
                sessionId: null,
              },
            ],
            page: 1,
            pageSize: 20,
            totalCount: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });
    });
    await login(page);
    await page.goto(role === 'Caregiver' ? '/caregiver/map' : '/center-admin/map');
    await expect(page.getByText('Chưa có vị trí khả dụng', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Xem GPS của GPS Test VIU', exact: true }).click();
    await expect(page.getByRole('cell', { name: '0 %', exact: true })).toBeVisible();
    await expect(
      page.getByRole('cell', { name: '0.000000 / 0.000000', exact: true }),
    ).toBeVisible();
    await page.getByLabel('Từ thời gian').fill('2026-09-26T08:00');
    await page.getByLabel('Đến thời gian').fill('2026-09-25T08:00');
    await page.getByRole('button', { name: 'Lọc lịch sử', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Thời gian kết thúc');
    expect(historyCalls.every((url) => !url.searchParams.has('dateFrom'))).toBe(true);
    await page.getByLabel('Đến thời gian').fill('2026-09-27T08:00');
    await page.getByRole('button', { name: 'Lọc lịch sử', exact: true }).click();
    await expect
      .poll(() => historyCalls.some((url) => url.searchParams.has('dateFrom')))
      .toBe(true);
    expect(
      historyCalls.find((url) => url.searchParams.has('dateFrom'))!.searchParams.get('dateFrom'),
    ).toMatch(/Z$/);
    forbidden = true;
    await page.getByRole('button', { name: 'Tải lại vị trí', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Lịch sử di chuyển', exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByRole('cell', { name: '0.000000 / 0.000000', exact: true })).toHaveCount(
      0,
    );
    expect(gpsWrites).toEqual([]);
  });
}

test('email reset URL is public and preserves encoded token on reload', async ({ page }) => {
  await stubApi(page);
  let resets = 0;
  await page.route('**/api/auth/reset-password', (route) => {
    resets++;
    expect(route.request().postDataJSON()).toEqual({
      email: 'api@example.test',
      token: 'abc+def/ghi==',
      newPassword: 'NewPassword@2',
    });
    return route.fulfill({ json: { success: true } });
  });
  await page.goto('/reset-password?token=abc%2Bdef%2Fghi%3D%3D&email=api%40example.test');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Đặt mật khẩu mới', exact: true })).toBeVisible();
  await expect(page.getByLabel('Địa chỉ email')).toHaveCount(0);
  await expect(page.getByLabel('Mã hoặc liên kết khôi phục')).toHaveCount(0);
  expect(resets).toBe(0);
  await page.getByLabel('Mật khẩu mới *', { exact: true }).fill('NewPassword@2');
  await page.getByLabel('Nhập lại mật khẩu mới').fill('NewPassword@2');
  await page.getByRole('button', { name: 'Đặt mật khẩu', exact: true }).click();
  await expect(page).toHaveURL(/auth\/login$/);
  expect(resets).toBe(1);
});

for (const simulateConflict of [false, true]) {
  test(`7 alerts: confirm, conflict=${simulateConflict}, escalation, resolve and revoked permission`, async ({
    page,
  }) => {
    await stubApi(page);
    const viu = '01900000-0000-7000-8000-000000000002';
    let state = 'Sent';
    let writes = 0;
    let conflict = false;
    let denied = false;
    const history: {
      id: string;
      fromStatus: string;
      toStatus: string;
      changedBy: string;
      changedAt: string;
      reason: string | null;
    }[] = [];
    const event = () => ({
      id,
      visuallyImpairedUserId: viu,
      viuFullName: 'VIU test',
      detectionMethod: 'Manual',
      currentStatus: state,
      latitude: null,
      longitude: null,
      notes: null,
      snapshotPath: null,
      detectedAt: '2026-10-01T00:00:00Z',
      gracePeriodEndsAt: null,
      sentAt: null,
      acknowledgedAt: null,
      acknowledgedBy: null,
      escalatedAt: null,
      resolvedAt: null,
      resolvedBy: null,
      dismissedAt: null,
    });
    await page.route('http://localhost:5176/api/caregiver-links?*', (route) =>
      route.fulfill({
        json: {
          success: true,
          data: organizationPage([
            {
              id,
              caregiverId: id,
              visuallyImpairedUserId: viu,
              viuFullName: 'VIU test',
              linkType: 'Personal',
              isPrimary: false,
              canReceiveAlerts: !denied,
              canManageLocations: false,
              canManageRegistry: false,
              linkedAt: '2026-10-01',
              unlinkedAt: null,
            },
          ]),
        },
      }),
    );
    await page.route('http://localhost:5176/api/emergency-events**', (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (req.method() === 'GET')
        return route.fulfill({
          json: {
            success: true,
            data:
              url.pathname === '/api/emergency-events'
                ? { ...organizationPage([event()]), pageSize: 20 }
                : { ...event(), statusHistory: history },
          },
        });
      expect(req.method()).toBe('PUT');
      writes++;
      if (conflict) {
        conflict = false;
        state = 'Acknowledged';
        return route.fulfill({ status: 409, json: { detail: 'Already acknowledged' } });
      }
      const from = state;
      state = url.pathname.endsWith('/escalate')
        ? 'Escalated'
        : url.pathname.endsWith('/resolve')
          ? 'Resolved'
          : 'Acknowledged';
      history.push({
        id: viu,
        fromStatus: from,
        toStatus: state,
        changedBy: id,
        changedAt: '2026-10-01T01:00:00Z',
        reason: req.postDataJSON().notes,
      });
      return route.fulfill({
        json: {
          success: true,
          data:
            state === 'Escalated'
              ? {
                  eventId: id,
                  currentStatus: state,
                  escalatedAt: '2026-10-01T01:00:00Z',
                  emergencyContacts: [
                    {
                      id: viu,
                      contactName: 'Test contact',
                      contactType: 'Phone',
                      phoneNumber: '0900000000',
                      zaloDeepLink: null,
                      priorityOrder: 1,
                    },
                  ],
                }
              : null,
        },
      });
    });
    await login(page);
    await page.goto('/caregiver/alerts');
    await page.getByRole('button', { name: 'Xem chi tiết' }).click();
    await expect(page.getByText('Không có ảnh chụp sự kiện.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Tiếp nhận cảnh báo', exact: true }).click();
    expect(writes).toBe(0);
    conflict = simulateConflict;
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.getByRole('status')).toContainText(
      simulateConflict ? 'Chưa xác nhận thành công' : 'Máy chủ đã xác nhận cập nhật.',
    );
    await expect(page.getByRole('button', { name: 'Tiếp nhận cảnh báo', exact: true })).toHaveCount(
      0,
    );
    await page.getByLabel('Ghi chú xử lý').fill('Need assistance');
    await page.getByRole('button', { name: 'Chuyển cấp hỗ trợ', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.getByText(/Test contact/)).toBeVisible();
    await page.getByRole('button', { name: 'Đánh dấu đã giải quyết', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Đánh dấu đã giải quyết', exact: true }),
    ).toHaveCount(0);
    expect(writes).toBe(3);
    denied = true;
    state = 'Sent';
    await page.reload();
    await page.getByRole('button', { name: 'Xem chi tiết' }).click();
    await expect(
      page.getByText('Bạn có quyền xem nhưng không có quyền xử lý cảnh báo.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tiếp nhận cảnh báo', exact: true })).toHaveCount(
      0,
    );
  });
}

test('8a SignalR: receives event, refreshes REST and stops after logout', async ({ page }) => {
  await stubApi(page);
  let send: ((data: string) => void) | undefined;
  let closed = false;
  let reads = 0;
  await page.route('http://localhost:5176/hubs/location/negotiate?*', (route) =>
    route.fulfill({
      json: {
        negotiateVersion: 1,
        connectionId: 'fixture',
        connectionToken: 'fixture',
        availableTransports: [{ transport: 'WebSockets', transferFormats: ['Text', 'Binary'] }],
      },
    }),
  );
  await page.routeWebSocket(/\/hubs\/location\?/, (ws) => {
    send = (data) => ws.send(data);
    ws.onMessage((data) => {
      if (String(data).includes('"protocol"')) ws.send('{}\x1e');
    });
    ws.onClose(() => {
      closed = true;
    });
  });
  await page.route('http://localhost:5176/api/emergency-events?*', (route) => {
    reads++;
    return route.fulfill({ json: { success: true, data: organizationPage([]) } });
  });
  await login(page);
  await expect.poll(() => typeof send).toBe('function');
  await expect(page.getByText(/Đã kết nối realtime/)).toHaveCount(0);
  await page.goto('/caregiver/alerts');
  await expect.poll(() => typeof send).toBe('function');
  await expect(page.getByText(/Đã kết nối realtime/)).toHaveCount(0);
  await expect(page.getByText('Không có cảnh báo phù hợp.')).toBeVisible();
  await page.waitForTimeout(400);
  const before = reads;
  send!(
    JSON.stringify({
      type: 1,
      target: 'EmergencyAlert',
      arguments: [{ viuId: id, eventId: id, sentAt: '2026-10-01T12:00:00Z' }],
    }) + '\x1e',
  );
  await expect.poll(() => reads).toBeGreaterThan(before);
  const after = reads;
  send!(
    JSON.stringify({
      type: 1,
      target: 'EmergencyAlert',
      arguments: [{ viuId: id, eventId: id, sentAt: '2026-10-01T12:00:00Z' }],
    }) + '\x1e',
  );
  await page.waitForTimeout(400);
  expect(reads).toBe(after);
  closed = false;
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/auth\/login$/);
  await expect.poll(() => closed).toBe(true);
});

test('stage 8b preferences save false, reload and surface failure without success', async ({
  page,
}) => {
  await stubApi(page);
  let enabled = true;
  let fail = false;
  await page.route('**/api/notifications/preferences', async (route) => {
    if (route.request().method() === 'PUT') {
      if (fail) return route.fulfill({ status: 403, json: { detail: 'Preference denied' } });
      expect(route.request().postDataJSON()).toEqual({
        preferences: [{ notificationType: 'SystemAlert', channel: 'Email', isEnabled: false }],
      });
      enabled = false;
    }
    return route.fulfill({
      json: {
        success: true,
        data: [
          {
            id,
            userId: id,
            notificationType: 'SystemAlert',
            channel: 'Email',
            isEnabled: enabled,
            updatedAt: '2026-10-02T00:00:00Z',
          },
        ],
      },
    });
  });
  await login(page);
  await page.goto('/caregiver/notifications');
  await expect(page.getByText('Thông báo bắt buộc vẫn được gửi', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  await page.getByLabel('Bật nhận khi không bắt buộc').uncheck();
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(actionDialog(page)).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('cell', { name: 'Tắt nếu không bắt buộc' })).toBeVisible();
  fail = true;
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(actionDialog(page).getByRole('alert')).toHaveText('Preference denied');
});
for (const role of ['Admin', 'CenterAdmin']) {
  test('stage 8b ' + role + ' rule scope, create conflict, flags and delete', async ({ page }) => {
    const org = '01900000-0000-7000-8000-000000000002';
    const ruleId = '01900000-0000-7000-8000-000000000003';
    await stubApi(page, role, role === 'CenterAdmin' ? org : null);
    const base = {
      id,
      organizationId: null as string | null,
      notificationType: 'FallDetected',
      channel: 'Email',
      targetRole: 'Caregiver',
      isMandatory: true,
      isActive: true,
      createdAt: '',
      updatedAt: '',
      updatedBy: null,
    };
    let items = [base];
    let conflict = true;
    await page.route('**/api/notifications/rules**', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        if (conflict)
          return route.fulfill({ status: 409, json: { detail: 'Rule already exists' } });
        expect(req.postDataJSON().organizationId).toBe(role === 'CenterAdmin' ? org : null);
        const item = { ...base, ...req.postDataJSON(), id: ruleId };
        items.push(item);
        return route.fulfill({ status: 201, json: { success: true, data: item } });
      }
      if (req.method() === 'PUT') {
        expect(req.postDataJSON()).toEqual({ isMandatory: true, isActive: false });
        items = items.map((i) => (i.id === ruleId ? { ...i, ...req.postDataJSON() } : i));
        return route.fulfill({ json: { success: true, data: items.find((i) => i.id === ruleId) } });
      }
      if (req.method() === 'DELETE') {
        expect(new URL(req.url()).pathname).toBe('/api/notifications/rules/' + ruleId);
        items = items.filter((i) => i.id !== ruleId);
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({
        json: {
          success: true,
          data: {
            items,
            page: 1,
            pageSize: 10,
            totalCount: items.length,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        },
      });
    });
    await login(page);
    await page.goto(role === 'Admin' ? '/admin/rules' : '/center-admin/routing');
    const global = page
      .getByRole('row')
      .filter({ has: page.getByRole('cell', { name: 'Toàn hệ thống', exact: true }) });
    if (role === 'CenterAdmin') {
      await expect(global.getByText('Chỉ xem')).toBeVisible();
      await expect(global.getByRole('button')).toHaveCount(0);
    }
    await page.getByRole('button', { name: 'Thêm quy tắc', exact: true }).click();
    let dialog = actionDialog(page);
    await dialog.getByLabel('Loại thông báo').selectOption('SystemAlert');
    await dialog.getByLabel('Kênh thông báo').selectOption('Email');
    await dialog.getByLabel('Vai trò nhận').selectOption('Caregiver');
    await dialog.getByLabel('Tôi xác nhận').check();
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(dialog.getByRole('alert')).toHaveText('Rule already exists');
    conflict = false;
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(dialog).toHaveCount(0);
    const row = page.getByRole('row').filter({ hasText: 'Thông báo hệ thống' });
    await row.getByRole('button', { name: 'Chỉnh sửa' }).click();
    dialog = actionDialog(page);
    await dialog.getByLabel('Bắt buộc nhận').check();
    await dialog.getByLabel('Đang áp dụng').uncheck();
    await dialog.getByLabel('Tôi xác nhận').check();
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(row).toContainText('Ngừng áp dụng');
    await row.getByRole('button', { name: 'Xóa', exact: true }).click();
    await actionDialog(page).getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(row).toHaveCount(0);
  });
}

test('reset without email link cannot submit a password', async ({ page }) => {
  await stubApi(page);
  await page.goto('/auth/reset');
  await expect(page.getByRole('alert')).toContainText('Liên kết khôi phục thiếu');
  await expect(page.getByRole('button', { name: 'Đặt mật khẩu', exact: true })).toHaveCount(0);
});

test('layout: filter control baseline and centered organization popup on desktop and tablet', async ({
  page,
}) => {
  await stubApi(page, 'Admin');
  await page.route('http://localhost:5176/api/organizations**', (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith('/members')
      ? organizationPage([])
      : path.endsWith(organizationId)
        ? organizationFixture
        : organizationPage([organizationFixture]);
    return route.fulfill({ json: { success: true, data } });
  });
  await login(page);
  await page.goto('/admin/organizations');
  for (const width of [1440, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    const input = await page.getByLabel('Tìm tổ chức').boundingBox();
    const search = await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).boundingBox();
    if (width === 1440)
      expect(Math.abs(input!.y + input!.height - search!.y - search!.height)).toBeLessThan(2);
    await page.getByRole('button', { name: 'Xem tổ chức ' + organizationFixture.name }).click();
    const dialog = page.getByRole('dialog', { name: 'Chi tiết tổ chức', exact: true });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(Math.abs(box!.x + box!.width / 2 - width / 2)).toBeLessThan(2);
    expect(Math.abs(box!.y + box!.height / 2 - 500)).toBeLessThan(2);
    expect(box!.height).toBeLessThanOrEqual(900);
    await page.screenshot({ path: 'test-results/organization-popup-' + width + '.png' });
    await dialog.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Xem tổ chức ' + organizationFixture.name }),
    ).toBeFocused();
  }
});

test('U1: trial, 402 keeps session, subscription recovery and refreshed status', async ({
  page,
}) => {
  const calls = await stubApi(page);
  let status = 'Trial';
  let expiry = new Date(Date.now() + 2 * 86400000).toISOString();
  let subscriptionBlocked = true;
  await page.route('**/api/users/me', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          id,
          email: 'api@example.test',
          fullName: 'Người dùng API',
          role: 'Caregiver',
          isActive: true,
          organizationId: null,
          licenseStatus: status,
          licenseExpiresAt: expiry,
        },
      },
    }),
  );
  await page.route('**/api/licenses/subscription', (route) =>
    subscriptionBlocked
      ? route.fulfill({ status: 402, json: { detail: 'License required' } })
      : route.fulfill({
          json: {
            success: true,
            data: {
              id,
              status: 'Active',
              package: { id, name: 'Personal', code: 'PERSONAL', packageType: 'Personal' },
              startedAt: '2026-10-01T00:00:00Z',
              trialEndsAt: null,
              currentPeriodStart: '2026-10-01T00:00:00Z',
              currentPeriodEnd: expiry,
              autoRenew: false,
              daysRemaining: 30,
            },
          },
        }),
  );
  await login(page);
  await expect(page.getByRole('complementary', { name: 'Thông tin license' })).toHaveCount(0);
  await page.goto('/license');
  await expect(page.getByRole('region', { name: 'Thông tin license' })).toContainText(
    'Đang dùng thử',
  );
  await expect(page.getByRole('alert')).toContainText('Phiên đăng nhập vẫn được giữ');
  expect(
    await page.evaluate(() => sessionStorage.getItem('visionaid.api.session.v1')),
  ).not.toBeNull();
  expect(calls).not.toContain('/api/auth/refresh');
  status = 'Active';
  expiry = new Date(Date.now() + 30 * 86400000).toISOString();
  subscriptionBlocked = false;
  await page.getByRole('button', { name: 'Tải lại thông tin license' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Thông tin license' })).toContainText(
    'License đang hoạt động',
  );
  await expect(page.getByText('Personal', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByText('Personal', { exact: true })).toHaveCount(0);
});

for (const role of ['Staff', 'Admin', 'CenterAdmin']) {
  test(`U1: ${role} does not request a personal subscription or require a purchase`, async ({
    page,
  }) => {
    const calls = await stubApi(page, role === 'Staff' ? 'Caregiver' : role, id);
    await login(page);
    await page.getByRole('link', { name: 'License', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Trạng thái tài khoản' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Thông tin license' })).toContainText(
      'không yêu cầu license cá nhân',
    );
    await expect(page.getByRole('heading', { name: 'Subscription cá nhân' })).toHaveCount(0);
    expect(calls).not.toContain('/api/licenses/subscription');
  });
}

test('U1: missing license, expired grace and failed subscription never display fake Active data', async ({
  page,
}) => {
  await stubApi(page);
  await login(page);
  await expect(page.getByRole('complementary', { name: 'Thông tin license' })).toHaveCount(0);
  await page.goto('/license');
  await expect(page.getByRole('region', { name: 'Thông tin license' })).toContainText(
    'Chưa xác định',
  );
  await page.route('**/api/users/me', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          id,
          email: 'api@example.test',
          fullName: 'Người dùng API',
          role: 'Caregiver',
          isActive: true,
          organizationId: null,
          licenseStatus: 'Expired',
          licenseExpiresAt: new Date(Date.now() - 86400000).toISOString(),
        },
      },
    }),
  );
  await page.route('**/api/licenses/subscription', (route) =>
    route.fulfill({ status: 404, json: { detail: 'Not found' } }),
  );
  await page.goto('/license');
  await expect(page.getByRole('region', { name: 'Thông tin license' })).toContainText(
    'gia hạn 3 ngày',
  );
  await expect(
    page.getByText('Máy chủ chưa tìm thấy subscription cho tài khoản này.'),
  ).toBeVisible();
  await page.route('**/api/licenses/subscription', (route) =>
    route.fulfill({ status: 503, json: { detail: 'Server unavailable' } }),
  );
  await page.getByRole('button', { name: 'Tải lại thông tin license' }).click();
  await expect(page.getByRole('alert')).toContainText('Server unavailable');
  await expect(page.getByText('Đang hoạt động', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Hồ sơ của tôi' }).click();
  await expect(page).toHaveURL(/\/profile$/);
});

const u2Package = (packageType = 'Personal', isActive = true) => ({
  id: packageType === 'Personal' ? id : '01900000-0000-7000-8000-000000000002',
  name: packageType + ' test',
  code: packageType.toUpperCase(),
  packageType,
  priceMonthly: 123000,
  priceYearly: null,
  currency: 'VND',
  maxViuPerLicense: 1,
  includedLicenses: 1,
  trialDays: 7,
  durationDays: 30,
  isActive,
  featureFlags: { webrtc: true },
  createdAt: '2026-10-03T00:00:00Z',
  updatedAt: '2026-10-03T00:00:00Z',
});
test('U2 Admin: create, detail popup, immutable fields, server errors and deactivate', async ({
  page,
}) => {
  await stubApi(page, 'Admin');
  let items = [u2Package()];
  let fail = false;
  let writes = 0;
  await page.route('http://localhost:5176/api/licenses/packages**', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === 'GET') {
      const data = url.pathname.endsWith('/packages')
        ? {
            ...organizationPage(
              items.filter(
                (p) =>
                  !url.searchParams.has('isActive') ||
                  String(p.isActive) === url.searchParams.get('isActive'),
              ),
            ),
            pageSize: 20,
          }
        : items.find((p) => url.pathname.endsWith(p.id));
      return route.fulfill({ json: { success: true, data } });
    }
    writes++;
    if (fail) return route.fulfill({ status: 409, json: { detail: 'Package conflict test' } });
    const body = req.postDataJSON();
    if (req.method() === 'POST') {
      expect(body).not.toHaveProperty('isActive');
      const created = { ...u2Package(), ...body, id: '01900000-0000-7000-8000-000000000003' };
      items.push(created);
      return route.fulfill({ status: 201, json: { success: true, data: created } });
    }
    expect(req.method()).toBe('PUT');
    expect(body).not.toHaveProperty('code');
    expect(body).not.toHaveProperty('packageType');
    items = items.map((p) => (url.pathname.endsWith(p.id) ? { ...p, ...body } : p));
    return route.fulfill({
      json: { success: true, data: items.find((p) => url.pathname.endsWith(p.id)) },
    });
  });
  await login(page);
  await page.getByRole('link', { name: 'Gói dịch vụ', exact: true }).click();
  await expect(page).toHaveURL(/admin\/packages$/);
  await page.getByRole('button', { name: 'Thêm gói', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Mã gói').fill('NEW_TEST');
  await dialog.getByLabel('Loại gói').selectOption('Personal');
  await dialog.getByLabel('Tên gói').fill('New package test');
  await dialog.getByLabel('Giá tháng *', { exact: true }).fill('99000');
  await dialog.getByLabel('Đơn vị tiền tệ').fill('VND');
  await dialog.getByRole('button', { name: 'Tạo gói', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('New package test', { exact: true })).toBeVisible();
  expect(writes).toBe(1);
  await page.getByRole('button', { name: 'Chi tiết Personal test', exact: true }).click();
  await expect(dialog.getByText(/PERSONAL.*Personal.*không thể thay đổi/)).toBeVisible();
  await expect(dialog.getByLabel('Mã gói')).toHaveCount(0);
  await dialog.getByLabel('Giá tháng *', { exact: true }).fill('234000');
  await dialog.getByLabel('Đang mở bán').uncheck();
  fail = true;
  await dialog.getByRole('button', { name: 'Lưu gói', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Package conflict test');
  await expect(dialog.getByLabel('Giá tháng *', { exact: true })).toHaveValue('234000');
  fail = false;
  await dialog.getByRole('button', { name: 'Lưu gói', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByLabel('Trạng thái gói').selectOption('false');
  await expect(page.getByText('Personal test', { exact: true })).toBeVisible();
  await expect(page.getByText('New package test', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Chi tiết Personal test', exact: true }).click();
  await expect(dialog.getByLabel('Đang mở bán')).not.toBeChecked();
  for (const width of [1440, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box!.x + box!.width / 2 - width / 2)).toBeLessThan(3);
    await page.screenshot({ path: 'test-results/u2-editor-' + width + '.png', fullPage: true });
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
for (const role of ['Caregiver', 'CenterAdmin']) {
  test('U2 catalog scope and forbidden admin: ' + role, async ({ page }) => {
    await stubApi(page, role, role === 'CenterAdmin' ? id : null);
    let available = true;
    let calls = 0;
    await page.route('http://localhost:5176/api/licenses/packages**', (route) => {
      calls++;
      expect(route.request().method()).toBe('GET');
      expect(new URL(route.request().url()).pathname).toBe('/api/licenses/packages');
      return route.fulfill({
        json: {
          success: true,
          data: {
            ...organizationPage(
              available
                ? [
                    u2Package(),
                    u2Package('Business'),
                    {
                      ...u2Package(),
                      id: '01900000-0000-7000-8000-000000000003',
                      name: 'Hidden inactive',
                      isActive: false,
                    },
                  ]
                : [],
            ),
            pageSize: 20,
          },
        },
      });
    });
    await login(page);
    await page.getByRole('link', { name: 'Gói dịch vụ', exact: true }).click();
    const name = role === 'Caregiver' ? 'Personal test' : 'Business test';
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await expect(
      page.getByText(role === 'Caregiver' ? 'Business test' : 'Personal test', { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText('Hidden inactive')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Thêm gói' })).toHaveCount(0);
    available = false;
    await page.getByRole('button', { name: 'Tải lại danh mục' }).click();
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
    await expect(page.getByText('Chưa có gói phù hợp trên trang này.')).toBeVisible();
    const count = calls;
    await page.goto('/admin/packages');
    await expect(page).toHaveURL(/forbidden$/);
    expect(calls).toBe(count);
  });
}
test('U2 Staff has no personal catalog and makes no package request', async ({ page }) => {
  const calls = await stubApi(page, 'Caregiver', id);
  await login(page);
  await expect(page.getByRole('link', { name: 'Gói dịch vụ' })).toHaveCount(0);
  await page.goto('/packages');
  await expect(page.getByText(/License do tổ chức quản lý/)).toBeVisible();
  expect(calls.some((c) => c.includes('/licenses/packages'))).toBe(false);
});

const u3Order = '1791000000000';
test('U3a: pending polling stops after one minute and manual refresh remains available', async ({
  page,
}) => {
  await stubApi(page);
  let reads = 0;
  await page.route('http://localhost:5176/api/payments/history?*', (route) => {
    reads++;
    return route.fulfill({ json: { success: true, data: organizationPage([u3Transaction()]) } });
  });
  await login(page);
  await page.clock.install();
  await page.goto('/payments/return?orderCode=' + u3Order);
  await expect(page.getByRole('status')).toHaveText('Đang chờ thanh toán');
  await page.clock.fastForward(61000);
  await expect(page.getByText(/Đã hết thời gian chờ tự động/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kiểm tra lại thanh toán' })).toBeEnabled();
  const stopped = reads;
  await page.clock.fastForward(30000);
  expect(reads).toBe(stopped);
  await page.getByRole('button', { name: 'Kiểm tra lại thanh toán' }).click();
  await expect.poll(() => reads).toBe(stopped + 1);
});
test('U3a: staff cannot read personal payments', async ({ page }) => {
  const calls = await stubApi(page, 'Caregiver', id);
  await login(page);
  await page.goto('/payments/return?orderCode=' + u3Order);
  await expect(page.getByText(/Luồng thanh toán này dành cho Caregiver cá nhân/)).toBeVisible();
  expect(calls.some((path) => path.startsWith('/api/payments'))).toBe(false);
});
const u3Transaction = (status = 'Pending') => ({
  id,
  payosOrderId: u3Order,
  transactionType: 'SubscriptionRenew',
  status,
  amount: 123000,
  currency: 'VND',
  payosCheckoutUrl: 'https://pay.payos.vn/web/test-payment',
  failureReason: null,
  paidAt: status === 'Success' ? '2026-10-03T00:00:00Z' : null,
  createdAt: '2026-10-03T00:00:00Z',
});
test('U3a: one create, safe checkout, spoofed PAID ignored, delayed success refreshes license', async ({
  page,
}) => {
  await stubApi(page);
  let created = 0;
  let status = 'Pending';
  let profileReads = 0;
  let subReads = 0;
  await page.route('http://localhost:5176/api/users/me', (route) => {
    profileReads++;
    return route.fulfill({
      json: {
        success: true,
        data: {
          id,
          fullName: 'Test caregiver',
          email: 'api@example.test',
          role: 'Caregiver',
          isActive: true,
          organizationId: null,
          licenseStatus: status === 'Success' ? 'Active' : 'Expired',
          licenseExpiresAt: '2026-11-03T00:00:00Z',
        },
      },
    });
  });
  await page.route('http://localhost:5176/api/licenses/packages**', (route) =>
    route.fulfill({ json: { success: true, data: organizationPage([u2Package()]) } }),
  );
  await page.route('http://localhost:5176/api/payments/create-link', async (route) => {
    created++;
    expect(route.request().postDataJSON()).toEqual({
      packageId: id,
      returnUrl: 'http://localhost:5176/payments/return',
      cancelUrl: 'http://localhost:5176/payments/cancel',
    });
    await route.fulfill({
      json: {
        success: true,
        data: {
          transactionId: id,
          checkoutUrl: u3Transaction().payosCheckoutUrl,
          paymentLinkId: 'test-payment',
          orderCode: Number(u3Order),
          amount: 123000,
          currency: 'VND',
        },
      },
    });
  });
  await page.route('http://localhost:5176/api/payments/history?*', (route) =>
    route.fulfill({ json: { success: true, data: organizationPage([u3Transaction(status)]) } }),
  );
  await page.route('http://localhost:5176/api/licenses/subscription', (route) => {
    subReads++;
    return route.fulfill({
      json: {
        success: true,
        data: {
          id,
          status: 'Active',
          package: { id, name: 'Personal', code: 'PERSONAL', packageType: 'Personal' },
          startedAt: '2026-10-03T00:00:00Z',
          trialEndsAt: null,
          currentPeriodStart: '2026-10-03T00:00:00Z',
          currentPeriodEnd: '2026-11-03T00:00:00Z',
          autoRenew: false,
          daysRemaining: 30,
        },
      },
    });
  });
  await login(page);
  await page.goto('/packages');
  await page.getByRole('button', { name: 'Chọn gói Personal test' }).click();
  await page
    .getByRole('button', { name: 'Tạo đơn thanh toán', exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  await expect(page.getByRole('link', { name: 'Tiếp tục sang PayOS' })).toHaveAttribute(
    'href',
    'https://pay.payos.vn/web/test-payment',
  );
  expect(created).toBe(1);
  await page.goto('/payments/return?orderCode=' + u3Order + '&status=PAID');
  await expect(page.getByRole('status')).toHaveText('Đang chờ thanh toán');
  expect(subReads).toBe(0);
  const before = profileReads;
  status = 'Success';
  await page.getByRole('button', { name: 'Kiểm tra lại thanh toán' }).click();
  await expect(page.getByText('Thanh toán thành công', { exact: true })).toBeVisible();
  await expect(page.getByText(/Subscription hiện tại: Đang hoạt động/)).toBeVisible();
  await expect.poll(() => profileReads).toBeGreaterThan(before);
  expect(subReads).toBeGreaterThan(0);
  await page.reload();
  await expect(page.getByText('Thanh toán thành công', { exact: true })).toBeVisible();
  expect(created).toBe(1);
});
test('U3a: cancel return is read-only until confirmed, history restores pending order', async ({
  page,
}) => {
  await stubApi(page);
  let status = 'Pending';
  let cancelled = 0;
  await page.route('http://localhost:5176/api/payments/history?*', (route) =>
    route.fulfill({ json: { success: true, data: organizationPage([u3Transaction(status)]) } }),
  );
  await page.route('http://localhost:5176/api/payments/' + id + '/cancel', (route) => {
    expect(route.request().method()).toBe('DELETE');
    cancelled++;
    status = 'Cancelled';
    return route.fulfill({ json: { success: true, message: 'Cancelled' } });
  });
  await login(page);
  await page.goto('/caregiver/payments');
  await page.getByRole('link', { name: 'Xem trạng thái', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Đang chờ thanh toán');
  await page.goto('/payments/cancel?orderCode=' + u3Order + '&cancel=true');
  await expect(page.getByRole('status')).toHaveText('Đang chờ thanh toán');
  expect(cancelled).toBe(0);
  await page.getByRole('button', { name: 'Hủy đơn thanh toán', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Đã hủy');
  expect(cancelled).toBe(1);
  await expect(page.getByRole('link', { name: 'Tiếp tục sang PayOS' })).toHaveCount(0);
});
test('U3a: login resumes order; another accounts order and URL status confer no success', async ({
  page,
}) => {
  await stubApi(page);
  await page.route('http://localhost:5176/api/payments/history?*', (route) =>
    route.fulfill({ json: { success: true, data: organizationPage([]) } }),
  );
  await page.goto('/payments/return?orderCode=' + u3Order + '&status=PAID');
  await expect(page).toHaveURL(/auth\/login$/);
  await page.reload();
  await page.getByLabel('Địa chỉ email').fill('api@example.test');
  await page.getByLabel('Mật khẩu *', { exact: true }).fill('Password@1');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/payments/return\\?orderCode=' + u3Order + '$'));
  await expect(page.getByText(/Chưa tìm thấy giao dịch trong lịch sử/)).toBeVisible();
  await expect(page.getByText('Thanh toán thành công', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Hủy đơn thanh toán', exact: true })).toHaveCount(
    0,
  );
});
test('U3a: uncertain create is not retried and unsafe checkout is not opened', async ({ page }) => {
  await stubApi(page);
  let writes = 0;
  await page.route('http://localhost:5176/api/licenses/packages**', (route) =>
    route.fulfill({ json: { success: true, data: organizationPage([u2Package()]) } }),
  );
  await page.route('http://localhost:5176/api/payments/create-link', (route) => {
    writes++;
    return route.fulfill({
      json: {
        success: true,
        data: {
          transactionId: id,
          checkoutUrl: 'https://evil.example/pay',
          paymentLinkId: 'x',
          orderCode: Number(u3Order),
          amount: 123000,
          currency: 'VND',
        },
      },
    });
  });
  await login(page);
  await page.goto('/packages');
  await page.getByRole('button', { name: 'Chọn gói Personal test' }).click();
  await page.getByRole('button', { name: 'Tạo đơn thanh toán', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('không thuộc PayOS');
  await expect(
    page.getByRole('button', { name: 'Tạo đơn thanh toán', exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Tiếp tục sang PayOS' })).toHaveCount(0);
  expect(writes).toBe(1);
});

const u3Pool = (status = 'Active', total = 50) => ({
  id,
  organizationId: id,
  package: {
    id: u2Package('Business').id,
    name: 'Business test',
    code: 'BUSINESS',
    packageType: 'Business',
  },
  totalLicenses: total,
  usedLicenses: 3,
  availableLicenses: total - 3,
  status,
  purchasedAt: '2026-10-06T00:00:00Z',
  expiresAt: '2026-11-05T00:00:00Z',
});
test('11a: staff manages contacts with conflict recovery, confirmations and revoked-link protection', async ({
  page,
}) => {
  await stubApi(page, 'Caregiver', id);
  const viuId = '01900000-0000-7000-8000-000000000061';
  let linked = true;
  let exists = false;
  let conflict = true;
  const writes: string[] = [];
  let contact = {
    id,
    visuallyImpairedUserId: viuId,
    contactName: 'Liên hệ test',
    contactType: 'Both',
    phoneNumber: '0901234567',
    zaloDeepLink: 'https://zalo.me/0901234567',
    priorityOrder: 1,
    isActive: true,
    notes: '',
    createdAt: '2026-10-07T00:00:00Z',
    updatedAt: '2026-10-07T00:00:00Z',
  };
  await page.route('**/api/caregiver-links?**', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: organizationPage(
          linked
            ? [
                {
                  id,
                  caregiverId: id,
                  visuallyImpairedUserId: viuId,
                  viuFullName: 'VIU test',
                  isPrimary: false,
                  linkType: 'Organization',
                  canReceiveAlerts: false,
                  canManageRegistry: false,
                  canManageLocations: false,
                  linkedAt: '',
                  unlinkedAt: null,
                },
              ]
            : [],
        ),
      },
    }),
  );
  await page.route('**/api/users?**', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: organizationPage([
          {
            id: viuId,
            fullName: 'VIU test',
            email: 'viu@example.test',
            phoneNumber: null,
            role: 'VisuallyImpaired',
            organizationId: id,
            isActive: true,
          },
        ]),
      },
    }),
  );
  await page.route(`**/api/users/${viuId}/emergency-contacts**`, (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== 'GET') {
      writes.push(request.method());
      if (request.method() === 'POST' && conflict)
        return route.fulfill({ status: 409, json: { detail: 'Ưu tiên đã được dùng.' } });
      if (request.method() === 'DELETE') {
        exists = false;
        return route.fulfill({ status: 204 });
      }
      contact = { ...contact, ...request.postDataJSON() };
      exists = true;
    }
    return route.fulfill({
      json: {
        success: true,
        data:
          request.method() === 'GET' && path.endsWith('/emergency-contacts')
            ? exists
              ? [contact]
              : []
            : contact,
      },
    });
  });
  await login(page);
  await page.getByRole('link', { name: 'Liên hệ khẩn cấp', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Người được chăm sóc', exact: true })
    .selectOption(viuId);
  await page.getByRole('button', { name: 'Thêm liên hệ', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tên liên hệ').fill('Liên hệ test');
  await dialog.getByLabel('Loại liên hệ').selectOption('Both');
  await dialog.getByLabel('Số điện thoại').fill('0901234567');
  await dialog.getByLabel('Liên kết Zalo').fill('https://zalo.me/0901234567');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Ưu tiên đã được dùng');
  await expect(dialog.getByLabel('Tên liên hệ')).toHaveValue('Liên hệ test');
  conflict = false;
  await dialog.getByLabel('Thứ tự ưu tiên').fill('2');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  await dialog.getByLabel('Loại liên hệ').selectOption('Phone');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog).toHaveCount(0);
  expect(contact.zaloDeepLink).toBe('');
  await page.getByRole('button', { name: 'Tạm ngưng', exact: true }).click();
  await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(writes).not.toContain('PATCH');
  await page.getByRole('button', { name: 'Tạm ngưng', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Kích hoạt', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/11a-confirm-mobile.png' });
  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByText('Chưa có liên hệ khẩn cấp.', { exact: true })).toBeVisible();
  linked = false;
  await page.getByRole('button', { name: 'Thêm liên hệ', exact: true }).click();
  await dialog.getByLabel('Tên liên hệ').fill('Không được tạo');
  await dialog.getByLabel('Số điện thoại').fill('0901234567');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('alert')).toContainText('không còn liên kết');
  await expect(page.getByRole('button', { name: 'Thêm liên hệ', exact: true })).toHaveCount(0);
  expect(writes).toEqual(['POST', 'POST', 'PUT', 'PATCH', 'DELETE']);
  expect(await page.locator('a[href^="tel:"], a[href^="zalo:"]').count()).toBe(0);
});
test('U5: distribute once, mask/copy key, then family activates and refreshes entitlement', async ({
  page,
  context,
}) => {
  const key = 'ABCD-1234-EFAB-5678';
  await stubApi(page, 'CenterAdmin', id);
  let issued = false;
  let writes = 0;
  await page.route('**/api/licenses/pool', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { ...u3Pool(), availableLicenses: issued ? 46 : 47, usedLicenses: issued ? 4 : 3 },
      },
    }),
  );
  await page.route('**/api/licenses/assignments?**', (route) =>
    route.fulfill({ json: { success: true, data: organizationPage([]) } }),
  );
  await page.route('**/api/licenses/distribute', async (route) => {
    writes++;
    expect(route.request().postDataJSON()).toEqual({ poolId: id, note: 'Gia đình test' });
    await new Promise((resolve) => setTimeout(resolve, 200));
    issued = true;
    await route.fulfill({
      json: {
        success: true,
        data: { subscriptionId: id, licenseKey: key, expiresAt: u3Pool().expiresAt },
      },
    });
  });
  await login(page);
  await page.goto('/center-admin/licenses');
  await page.getByRole('button', { name: 'Tạo key cho gia đình', exact: true }).click();
  await page.getByLabel('Ghi chú').fill('Gia đình test');
  await page.getByRole('button', { name: 'Xác nhận tạo key' }).click();
  await expect(page.getByLabel('Key vừa tạo')).toHaveValue('••••-••••-••••-••••');
  expect(writes).toBe(1);
  await page.getByRole('button', { name: 'Hiện key', exact: true }).click();
  await expect(page.getByLabel('Key vừa tạo')).toHaveValue(key);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Sao chép key', exact: true }).click();
  await expect(page.getByText('Đã sao chép key.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(key);
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]))).not.toContain(
    key,
  );
  expect(page.url()).not.toContain(key);
  await page.getByRole('button', { name: 'Đóng hộp thoại' }).click();
  const pool = page.getByRole('region', { name: 'Kho license tổ chức' });
  await expect(
    pool
      .locator('div')
      .filter({ has: page.locator('dt', { hasText: 'Còn lại' }) })
      .last(),
  ).toContainText('46');
  await page.getByRole('button', { name: 'Xem key vừa tạo' }).click();
  await expect(page.getByLabel('Key vừa tạo')).toHaveValue('••••-••••-••••-••••');
  await page.getByRole('button', { name: 'Đóng hộp thoại' }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await page.unrouteAll();
  await stubApi(page);
  let activated = false;
  const subscription = () => ({
    id,
    status: activated ? 'Active' : 'Trial',
    package: { id, name: 'Gói được cấp', code: 'BUSINESS', packageType: 'Business' },
    startedAt: '2026-10-07T00:00:00Z',
    trialEndsAt: '2026-10-14T00:00:00Z',
    currentPeriodStart: '2026-10-07T00:00:00Z',
    currentPeriodEnd: u3Pool().expiresAt,
    autoRenew: false,
    daysRemaining: 29,
  });
  await page.route('**/api/users/me', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          id,
          email: 'api@example.test',
          fullName: 'Gia đình',
          role: 'Caregiver',
          organizationId: null,
          isActive: true,
          licenseStatus: activated ? 'Active' : 'Trial',
          licenseExpiresAt: u3Pool().expiresAt,
        },
      },
    }),
  );
  await page.route('**/api/licenses/subscription', (route) =>
    route.fulfill({ json: { success: true, data: subscription() } }),
  );
  await page.route('**/api/licenses/activate-key', (route) => {
    expect(route.request().postDataJSON()).toEqual({ licenseKey: key });
    activated = true;
    return route.fulfill({ json: { success: true, data: subscription() } });
  });
  await login(page);
  await page.goto('/license');
  await page.getByRole('button', { name: 'Nhập key kích hoạt' }).click();
  await page.getByLabel('Key license').fill(key.toLowerCase());
  await page.getByRole('button', { name: 'Xác nhận kích hoạt' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Thông tin license', exact: true })).toContainText(
    'License đang hoạt động',
  );
  await expect(page.getByRole('region', { name: 'Kích hoạt key', exact: true })).toContainText(
    'Máy chủ đã xác nhận kích hoạt',
  );
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]))).not.toContain(
    key,
  );
});

test('U5: invalid key retains form; unknown distribution blocks replay; staff cannot activate', async ({
  page,
}) => {
  await stubApi(page);
  await page.route('**/api/licenses/subscription', (route) =>
    route.fulfill({ status: 404, json: { detail: 'Not found' } }),
  );
  await page.route('**/api/licenses/activate-key', (route) =>
    route.fulfill({ status: 422, json: { detail: 'Invalid ABCD-1234-EFAB-5678' } }),
  );
  await login(page);
  await page.goto('/license');
  await page.getByRole('button', { name: 'Nhập key kích hoạt' }).click();
  await page.getByLabel('Key license').fill('ABCD-1234-EFAB-5678');
  await page.getByRole('button', { name: 'Xác nhận kích hoạt' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).not.toContainText('ABCD');
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Kiểm tra key');
  await expect(page.getByLabel('Key license')).toHaveValue('ABCD-1234-EFAB-5678');
  await page.setViewportSize({ width: 390, height: 844 });
  const bounds = await page.getByRole('dialog').boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/u5-activate-mobile.png' });
  await page.getByRole('button', { name: 'Đóng hộp thoại' }).click();
  await page.unrouteAll();
  await stubApi(page, 'CenterAdmin', id);
  let writes = 0;
  await page.route('**/api/licenses/pool', (route) =>
    route.fulfill({ json: { success: true, data: u3Pool() } }),
  );
  await page.route('**/api/licenses/assignments?**', (route) =>
    route.fulfill({ json: { success: true, data: organizationPage([]) } }),
  );
  await page.route('**/api/licenses/distribute', (route) => {
    writes++;
    return route.abort('failed');
  });
  await page.goto('/center-admin/licenses');
  await page.reload();
  await page.getByRole('button', { name: 'Tạo key cho gia đình', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận tạo key' }).click();
  await expect(
    page.getByRole('button', { name: 'Tạo key cho gia đình', exact: true }),
  ).toBeDisabled();
  expect(writes).toBe(1);
  await page.unrouteAll();
  const calls = await stubApi(page, 'Caregiver', id);
  await page.goto('/license');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Nhập key kích hoạt' })).toHaveCount(0);
  expect(calls).not.toContain('/api/licenses/activate-key');
});
test('U4: create VIU quota error keeps account form and provides license management link', async ({
  page,
}) => {
  await stubApi(page, 'CenterAdmin', organizationId);
  await page.route('**/api/organizations/me', (route) =>
    route.fulfill({ json: { success: true, data: organizationFixture } }),
  );
  let posts = 0;
  await page.route('**/api/users**', (route) => {
    if (new URL(route.request().url()).pathname === '/api/users/me') return route.fallback();
    if (route.request().method() === 'POST') {
      posts++;
      expect(route.request().postDataJSON().role).toBe('VisuallyImpaired');
      return route.fulfill({ status: 422, json: { detail: 'Kho không còn license.' } });
    }
    return route.fulfill({ json: { success: true, data: organizationPage([]) } });
  });
  await login(page);
  await page.goto('/center-admin/users');
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Họ và tên').fill('VIU giữ form');
  await dialog.getByLabel('Email').fill('quota@example.test');
  await dialog.getByLabel('Mật khẩu mới', { exact: false }).fill('Password@123');
  await dialog.getByLabel('Nhập lại mật khẩu').fill('Password@123');
  await dialog.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Kho không còn license');
  await expect(dialog.getByLabel('Họ và tên')).toHaveValue('VIU giữ form');
  await expect(dialog.getByRole('link', { name: 'Xem kho license' })).toHaveAttribute(
    'href',
    '/center-admin/licenses',
  );
  expect(posts).toBe(1);
});

test('U4: revoke confirmation and reassign refresh server quota; quota errors retain popup input', async ({
  page,
}) => {
  await stubApi(page, 'CenterAdmin', id);
  const viuId = '01900000-0000-7000-8000-000000000044';
  let active = true;
  let conflict = false;
  const writes: string[] = [];
  await page.route('**/api/licenses/pool', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { ...u3Pool(), usedLicenses: active ? 1 : 0, availableLicenses: active ? 49 : 50 },
      },
    }),
  );
  await page.route('**/api/users/' + viuId, (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          id: viuId,
          fullName: 'VIU U4',
          email: 'u4@example.test',
          organizationId: id,
          role: 'VisuallyImpaired',
          isActive: true,
          phoneNumber: null,
          avatarUrl: null,
          deletedAt: null,
          lastLoginAt: null,
          createdAt: '',
          updatedAt: '',
        },
      },
    }),
  );
  await page.route('**/api/licenses/assignments**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === 'POST') {
      writes.push(url.pathname);
      if (url.pathname.endsWith('/assign')) {
        expect(req.postDataJSON()).toEqual({ poolId: id });
        if (conflict)
          return route.fulfill({ status: 422, json: { detail: 'Suất cuối đã được sử dụng.' } });
        active = true;
      } else active = false;
      return route.fulfill({ json: { success: true, data: active ? id : null } });
    }
    const filter = url.searchParams.get('isActive');
    const items =
      filter === null || filter === String(active)
        ? [
            {
              id,
              viuUser: { id: viuId, fullName: 'VIU U4', email: 'u4@example.test' },
              assignedAt: '2026-10-01T00:00:00Z',
              assignedBy: id,
              revokedAt: active ? null : '2026-10-07T00:00:00Z',
              isActive: active,
            },
          ]
        : [];
    return route.fulfill({
      json: { success: true, data: { ...organizationPage(items), pageSize: 20 } },
    });
  });
  await login(page);
  await page.goto('/center-admin/licenses');
  const pool = page.getByRole('region', { name: 'Kho license tổ chức' });
  await page.getByRole('button', { name: 'Thu hồi', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(
    'Tài khoản và phân công chăm sóc vẫn được giữ',
  );
  expect(writes).toHaveLength(0);
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await page.getByRole('button', { name: 'Thu hồi', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(
    pool
      .locator('div')
      .filter({ has: page.locator('dt', { hasText: 'Còn lại' }) })
      .last(),
  ).toContainText('50');
  await page.getByLabel('Trạng thái cấp').selectOption('false');
  await expect(page.getByRole('cell', { name: /Đã thu hồi/ })).toBeVisible();
  await page.getByRole('button', { name: 'Cấp license', exact: true }).click();
  await page.getByLabel('Mã người được chăm sóc').fill(viuId);
  conflict = true;
  await page.getByRole('button', { name: 'Xác nhận cấp license' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Suất cuối');
  await expect(page.getByLabel('Mã người được chăm sóc')).toHaveValue(viuId);
  conflict = false;
  await page.getByRole('button', { name: 'Xác nhận cấp license' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Trạng thái cấp').selectOption('true');
  await expect(page.getByRole('button', { name: 'Thu hồi', exact: true })).toBeVisible();
  expect(writes).toEqual([
    `/api/licenses/assignments/${viuId}/revoke`,
    `/api/licenses/assignments/${viuId}/assign`,
    `/api/licenses/assignments/${viuId}/assign`,
  ]);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Cấp license', exact: true }).click();
  const bounds = await page.getByRole('dialog').boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391);
  await page.screenshot({ path: 'test-results/u4-assign-mobile.png', fullPage: true });
});
for (const initial of ['None', 'Active', 'Expired']) {
  test(`U3b: ${initial} pool checkout waits for server success and refreshes organization quota`, async ({
    page,
  }) => {
    const calls = await stubApi(page, 'CenterAdmin', id);
    let paid = false;
    let writes = 0;
    await page.route('http://localhost:5176/api/licenses/pool', (route) => {
      if (!paid && initial === 'None')
        return route.fulfill({ status: 404, json: { detail: 'No pool' } });
      return route.fulfill({
        json: { success: true, data: u3Pool(paid ? 'Active' : initial, paid ? 100 : 50) },
      });
    });
    await page.route('http://localhost:5176/api/licenses/packages?*', (route) =>
      route.fulfill({ json: { success: true, data: organizationPage([u2Package('Business')]) } }),
    );
    await page.route('http://localhost:5176/api/payments/create-link', (route) => {
      writes++;
      expect(route.request().postDataJSON()).toEqual({
        packageId: u2Package('Business').id,
        returnUrl: 'http://localhost:5176/payments/return',
        cancelUrl: 'http://localhost:5176/payments/cancel',
      });
      return route.fulfill({
        json: {
          success: true,
          data: {
            transactionId: id,
            checkoutUrl: 'https://pay.payos.vn/web/test-payment',
            paymentLinkId: 'x',
            orderCode: Number(u3Order),
            amount: 123000,
            currency: 'VND',
          },
        },
      });
    });
    await page.route('http://localhost:5176/api/payments/history?*', (route) =>
      route.fulfill({
        json: {
          success: true,
          data: organizationPage([
            {
              ...u3Transaction(paid ? 'Success' : 'Pending'),
              transactionType: initial === 'None' ? 'LicensePurchase' : 'LicenseTopup',
            },
          ]),
        },
      }),
    );
    await login(page);
    await page.goto('/center-admin/licenses');
    if (initial === 'None')
      await expect(page.getByText(/Tổ chức chưa có kho license/)).toBeVisible();
    else
      await expect(page.getByRole('region', { name: 'Kho license tổ chức' })).toContainText('50');
    await page.getByRole('link', { name: 'Chọn gói Business' }).click();
    await page.getByRole('button', { name: 'Chọn gói Business test' }).click();
    await page.getByRole('button', { name: 'Tạo đơn thanh toán', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Tiếp tục sang PayOS' })).toBeVisible();
    await page.getByRole('link', { name: 'Kiểm tra trạng thái đơn' }).click();
    await expect(page.getByText('Đang chờ thanh toán', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Kho license tổ chức' })).toHaveCount(0);
    paid = true;
    await page.getByRole('button', { name: 'Kiểm tra lại thanh toán' }).click();
    await expect(page.getByText('Thanh toán thành công', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Kho license tổ chức' })).toContainText('100');
    expect(writes).toBe(1);
    expect(calls).not.toContain('/api/licenses/subscription');
    await page.getByRole('link', { name: 'Lịch sử thanh toán', exact: true }).click();
    await expect(page).toHaveURL(/center-admin\/payments$/);
    await expect(page.getByText('Thanh toán thành công', { exact: true })).toBeVisible();
  });
}
test('U3b: foreign pool and server errors are visible without exposing data; responsive pool layout', async ({
  page,
}) => {
  await stubApi(page, 'CenterAdmin', id);
  await page.route('**/api/licenses/assignments?**', (route) =>
    route.fulfill({ json: { success: true, data: { ...organizationPage([]), pageSize: 20 } } }),
  );
  let mode = 'foreign';
  await page.route('http://localhost:5176/api/licenses/pool', (route) =>
    mode === 'error'
      ? route.fulfill({ status: 500, json: { detail: 'Không đọc được kho' } })
      : route.fulfill({
          json: {
            success: true,
            data: {
              ...u3Pool(),
              organizationId: mode === 'foreign' ? '01900000-0000-7000-8000-000000000002' : id,
            },
          },
        }),
  );
  await login(page);
  await page.goto('/center-admin/licenses');
  await expect(page.getByRole('alert')).toContainText('không thuộc tổ chức');
  await expect(page.getByText('Business test', { exact: true })).toHaveCount(0);
  mode = 'error';
  await page.getByRole('button', { name: 'Tải lại kho license' }).click();
  await expect(page.getByRole('alert')).toContainText('Không đọc được kho');
  mode = 'valid';
  await page.getByRole('button', { name: 'Tải lại kho license' }).click();
  await expect(page.getByText('Business test', { exact: true })).toBeVisible();
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.screenshot({ path: 'test-results/u3b-pool-mobile.png', fullPage: true });
});

test('U3b: organization cancel requires confirmation; other organizations order is not actionable', async ({
  page,
}) => {
  await stubApi(page, 'CenterAdmin', id);
  let status = 'Pending';
  let cancelled = 0;
  let own = true;
  await page.route('http://localhost:5176/api/payments/history?*', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: organizationPage(
          own ? [{ ...u3Transaction(status), transactionType: 'LicenseTopup' }] : [],
        ),
      },
    }),
  );
  await page.route('http://localhost:5176/api/payments/' + id + '/cancel', (route) => {
    expect(route.request().method()).toBe('DELETE');
    cancelled++;
    status = 'Cancelled';
    return route.fulfill({ json: { success: true, data: null } });
  });
  await login(page);
  await page.goto('/payments/cancel?orderCode=' + u3Order);
  await expect(page.getByText('Đang chờ thanh toán', { exact: true })).toBeVisible();
  expect(cancelled).toBe(0);
  await page.getByRole('button', { name: 'Hủy đơn thanh toán', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByText('Đã hủy', { exact: true })).toBeVisible();
  expect(cancelled).toBe(1);
  own = false;
  await page.reload();
  await expect(page.getByText(/Chưa tìm thấy giao dịch trong lịch sử/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hủy đơn thanh toán', exact: true })).toHaveCount(
    0,
  );
});
test('U3b: CenterAdmin without organization cannot query payments or pool', async ({ page }) => {
  const calls = await stubApi(page, 'CenterAdmin');
  await login(page);
  await page.goto('/center-admin/licenses');
  await expect(
    page.getByText('Chỉ quản trị trung tâm có tổ chức được xem kho license.'),
  ).toBeVisible();
  await page.goto('/center-admin/payments');
  await expect(page.getByText(/Luồng thanh toán này dành cho/)).toBeVisible();
  expect(
    calls.some((path) => path.startsWith('/api/payments') || path === '/api/licenses/pool'),
  ).toBe(false);
});
