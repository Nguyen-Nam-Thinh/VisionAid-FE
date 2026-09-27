import { test, expect, type Page } from '@playwright/test';
const id = '01900000-0000-7000-8000-000000000001';
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
  const dialog = page.getByRole('dialog');
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
  await page.getByRole('dialog').getByLabel('Email liên hệ').fill('center@example.test');
  await page.getByRole('button', { name: 'Lưu tổ chức' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
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
  const dialog = page.getByRole('dialog');
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
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('Vai trò tài khoản')).toHaveCount(0);
  await expect(page.getByRole('dialog').getByLabel('Mã tổ chức', { exact: true })).toHaveCount(0);
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
      const dialog = page.getByRole('dialog');
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
  await page.getByRole('dialog').getByLabel('Nhận cảnh báo').uncheck();
  await page.getByRole('dialog').getByLabel('Tôi xác nhận cập nhật các quyền trên').check();
  await page.getByRole('button', { name: 'Lưu quyền liên kết' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(link.canReceiveAlerts).toBe(false);
  link = { ...link, linkType: 'Organization' };
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
