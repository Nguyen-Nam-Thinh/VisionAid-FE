import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('success toast can close, pause while reading and expire', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Địa chỉ email').fill('caregiver@demo.vn');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.locator('main h1')).toBeVisible();
  await page.goto('/profile');
  const save = async () => {
    await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.locator('.feedback-toast')).toBeVisible();
  };
  await save();
  await page.getByRole('button', { name: 'Đóng thông báo' }).click();
  await expect(page.locator('.feedback-toast')).toHaveCount(0);
  await save();
  await page.clock.install();
  await page.locator('.feedback-toast').hover();
  await page.clock.fastForward(9000);
  await expect(page.locator('.feedback-toast')).toBeVisible();
  await page.screenshot({ path: 'test-results/success-toast.png' });
  await page.mouse.move(0, 0);
  await page.clock.fastForward(8100);
  await expect(page.locator('.feedback-toast')).toHaveCount(0);
});

test('sidebar collapses to icons and preserves navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/auth/login');
  await page.getByLabel('Địa chỉ email').fill('caregiver@demo.vn');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('button', { name: 'Thu gọn sidebar' }).click();
  await expect(page.locator('.sidebar')).toHaveCSS('width', '76px');
  const people = page.getByRole('link', { name: 'Người được chăm sóc', exact: true });
  await expect(people).toHaveAttribute('title', 'Người được chăm sóc');
  await people.click();
  await expect(page).toHaveURL(/caregiver\/users/);
  await expect(people).toHaveAttribute('aria-current', 'page');
  await page.screenshot({ path: 'test-results/sidebar-collapsed-1440.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Mở điều hướng' }).click();
  await expect(people).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mở rộng sidebar' })).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Mở rộng sidebar' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.sidebar')).toHaveCSS('width', '232px');
});

test('account dropdown: keyboard, dismiss, profile and logout', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Địa chỉ email').fill('caregiver@demo.vn');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.locator('main h1')).toBeVisible();
  const trigger = page.getByRole('button', { name: 'Menu tài khoản' });
  const popup = page.locator('#account-menu');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(popup).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(popup.getByRole('link')).toBeFocused();
    await page.screenshot({ path: `test-results/account-menu-${width}.png` });
    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.locator('main h1').click();
    await expect(popup).toBeHidden();
  }
  await trigger.click();
  await popup.getByRole('link').click();
  await expect(page).toHaveURL(/profile/);
  await expect(popup).toBeHidden();
  await trigger.click();
  await popup.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/auth\/login/);
});

for (const email of ['caregiver@demo.vn', 'center@demo.vn', 'admin@demo.vn']) {
  test(`final UI sweep: ${email}`, async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/auth/login');
    await page.getByLabel('Địa chỉ email').fill(email);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    const routes = await page
      .locator('.sidebar a[href]')
      .evaluateAll((links) =>
        [...new Set(links.map((link) => link.getAttribute('href')!))].filter(
          (href) => href.startsWith('/') && !href.startsWith('/auth'),
        ),
      );
    expect(routes.length).toBeGreaterThan(5);
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('main h1'), route).toBeVisible();
      await expect(page.getByText('Đang tải dữ liệu…', { exact: true })).toHaveCount(0);
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), {
            message: `${route} at ${width}px`,
          })
          .toBe(true);
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    await expect(page.locator('main h1')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });
}

test('desktop redesign: permission labels and keyboard controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/auth/login');
  await page.getByLabel('Địa chỉ email').fill('caregiver@demo.vn');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto('/caregiver/caregivers');
  await page
    .getByRole('row')
    .filter({ hasText: 'Trần Quốc Bảo' })
    .getByRole('button', { name: 'Quyền', exact: true })
    .click();
  const popup = page.getByRole('dialog');
  const checkbox = popup.getByLabel('Quản lý danh bạ khuôn mặt');
  const original = await checkbox.isChecked();
  await popup.locator('label').filter({ hasText: 'Quản lý danh bạ khuôn mặt' }).click();
  await expect(checkbox).toBeChecked({ checked: !original });
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked({ checked: original });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await page.screenshot({ path: `test-results/redesign-permissions-${width}.png` });
  }
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0);
});

for (const [email, route] of [
  ['center@demo.vn', '/center-admin/staff'],
  ['admin@demo.vn', '/admin/organizations'],
]) {
  test(`desktop redesign: ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/auth/login');
    await page.getByLabel('Địa chỉ email').fill(email);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto(route);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByText('Đang tải dữ liệu…', { exact: true })).toHaveCount(0);
    await expect(page.locator('tbody tr').first()).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await page.screenshot({
      path: `test-results/redesign-${route.split('/').at(-1)}.png`,
      fullPage: true,
    });
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
    ).toEqual([]);
  });
}

test('desktop redesign: public pages and workspace at 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of ['/', '/auth/login']) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await page.screenshot({
      path: `test-results/redesign-${route === '/' ? 'landing' : 'login'}.png`,
      fullPage: true,
    });
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
    ).toEqual([]);
  }
  await page.getByLabel('Địa chỉ email').fill('caregiver@demo.vn');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  for (const route of [
    '/dashboard',
    '/caregiver/users',
    '/caregiver/registry',
    '/caregiver/contacts',
  ]) {
    await page.goto(route);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByText('Đang tải dữ liệu…', { exact: true })).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await page.screenshot({
      path: `test-results/redesign-${route.split('/').at(-1)}.png`,
      fullPage: true,
    });
  }
  await page.getByRole('button', { name: 'Thêm mới', exact: true }).click();
  const popup = page.getByRole('dialog');
  await expect(popup).toBeVisible();
  const box = await popup.boundingBox();
  expect(Math.abs(box!.x + box!.width / 2 - 720)).toBeLessThan(2);
  await page.screenshot({ path: 'test-results/redesign-dialog.png' });
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.getByText('Đang tải dữ liệu…', { exact: true })).toHaveCount(0);
  await expect(page.locator('.dashboard-stats')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({ path: 'test-results/redesign-mobile.png', fullPage: true });
});

test('status pages: standalone 404, in-shell 404, 403 and a crashed screen recover', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Signed out: a mistyped address shows a 404 instead of redirecting to login.
  await page.goto('/khong-ton-tai');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Đăng nhập' })).toBeVisible();
  expect(await new AxeBuilder({ page }).include('.status-page').analyze()).toMatchObject({
    violations: [],
  });
  await page.screenshot({ path: 'test-results/status-404-standalone.png' });

  await page.goto('/auth/login');
  await page.getByLabel('Địa chỉ email').fill('caregiver@demo.vn');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.locator('main h1')).toBeVisible();

  // Signed in: 404 keeps the sidebar so the user can continue.
  await page.goto('/caregiver/khong-ton-tai');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
  await page.screenshot({ path: 'test-results/status-404-shell.png' });
  await page.getByRole('link', { name: 'Về tổng quan' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // Another role's route.
  await page.goto('/admin/configurations');
  await expect(page).toHaveURL(/forbidden$/);
  await expect(
    page.getByRole('heading', { name: 'Bạn không có quyền xem trang này' }),
  ).toBeVisible();

  // A screen that throws while rendering is contained; navigation still works.
  await page.route('**/src/pages/shared/Profile.tsx*', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: 'export function Profile() { throw new Error("QA crash"); }',
    }),
  );
  await page.goto('/profile');
  const crash = page.getByRole('alert').filter({ hasText: 'Màn hình này gặp sự cố' });
  await expect(crash).toBeVisible();
  await expect(crash.getByRole('button', { name: 'Tải lại trang' })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
  await page.screenshot({ path: 'test-results/status-error-shell.png' });
  await page.getByRole('link', { name: 'Tổng quan', exact: true }).first().click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(crash).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/khong-ton-tai-nua');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/status-404-mobile.png' });
});
