import { test, expect, type Page } from '@playwright/test';
const id = '01900000-0000-7000-8000-000000000001';
const token = () =>
  'header.' +
  Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 })).toString('base64url') +
  '.signature';
async function stubApi(page: Page, role = 'Caregiver') {
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
            organizationId: null,
          },
        },
      });
    if (path === '/api/auth/logout') return route.fulfill({ json: { success: true, data: null } });
    return route.fulfill({ status: 500, json: { detail: 'Unexpected endpoint' } });
  });
  return calls;
}
async function login(page: Page) {
  await page.goto('/auth/login');
  await expect(page.getByLabel('Địa chỉ email')).toHaveValue('');
  await expect(page.getByLabel('Chọn tài khoản demo')).toHaveCount(0);
  await page.getByLabel('Địa chỉ email').fill('api@example.test');
  await page.getByLabel('Mật khẩu *', { exact: true }).fill('Password@1');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
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
        ? '/admin/accounts'
        : role === 'CenterAdmin'
          ? '/center-admin/staff'
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
  await login(page);
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
  await page.getByLabel('Họ và tên').fill('Tên mới');
  await page.getByLabel('Số điện thoại').fill('0901234567');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('status')).toContainText('Đã cập nhật hồ sơ');
  await page.reload();
  await expect(page.getByLabel('Họ và tên')).toHaveValue('Tên mới');
  await expect(page.locator('input[type=file]')).toHaveCount(0);
  await page.getByLabel('Mật khẩu hiện tại').fill('WrongPassword@1');
  await page.getByLabel('Mật khẩu mới', { exact: false }).first().fill('NewPassword@2');
  await page.getByLabel('Nhập lại mật khẩu mới').fill('NewPassword@2');
  await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Current password is incorrect.');
  await expect(page).toHaveURL(/profile$/);
  accepted = true;
  await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
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
  await page.getByRole('link', { name: 'Nhập mã khôi phục' }).click();
  await page.getByLabel('Địa chỉ email').fill('api@example.test');
  await page
    .getByLabel('Mã hoặc liên kết khôi phục')
    .fill('visionaid://reset-password?token=abc%2Bdef%2Fghi%3D%3D&email=api%40example.test');
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
  await page.getByLabel('Họ và tên', { exact: false }).fill(person.fullName);
  await page.getByLabel('Email *', { exact: true }).fill(person.email);
  await page.getByLabel('Mật khẩu *', { exact: true }).fill('Test123!');
  await page.getByLabel('Nhập lại mật khẩu').fill('Test123!');
  await page.getByRole('button', { name: 'Bước 1: Tạo tài khoản VIU' }).click();
  await expect(page.getByText(viuId, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Bước 2: Tạo liên kết' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.reload();
  await expect(page.getByText(viuId, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(sessionStorage))).not.toContain('Test123!');
  await page.getByRole('button', { name: 'Bước 2: Tạo liên kết' }).click();
  await page.getByRole('button', { name: 'Xem liên kết của VIU mới' }).click();
  await page.getByRole('button', { name: 'Gỡ liên kết', exact: true }).click();
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(deletes).toBe(0);
  await page.getByRole('button', { name: 'Gỡ liên kết', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Xem liên kết của VIU mới' })).toHaveCount(0);
  expect(creates).toBe(1);
  expect(links).toBe(2);
  expect(deletes).toBe(2);
});
