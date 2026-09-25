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
