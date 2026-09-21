import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('public home, signup, login and protected dashboard stay separate', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Thêm tự tin.');
  await page.getByRole('link', { name: 'Bắt đầu đồng hành' }).click();
  await expect(page).toHaveURL(/\/auth\/register$/);
  await page.getByRole('link', { name: 'Về trang chủ' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'An tâm hơn khi luôn có nhau.' })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Thêm tự tin.');
  await page.getByRole('banner').getByRole('link', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
});

test('landing is accessible and fits desktop, tablet and narrow screens', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  }
  await page
    .getByRole('navigation', { name: 'Điều hướng trang chủ' })
    .getByRole('link', { name: 'Cách hoạt động' })
    .click();
  await expect(page).toHaveURL(/#how-it-works$/);
  await expect(page.getByRole('heading', { name: 'Cùng nhau, từng bước một.' })).toBeInViewport();
  expect(errors).toEqual([]);
});
