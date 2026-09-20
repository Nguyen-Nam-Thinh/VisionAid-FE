import { test, expect } from '@playwright/test';
test('decodes an invitation image and links a secondary caregiver once', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Xin chào/ })).toBeVisible();
  await page.goto('/caregiver/users');
  await page.getByRole('button', { name: 'Tạo mã QR demo' }).nth(1).click();
  const qr = await page.getByRole('dialog').locator('svg').last().screenshot();
  await page.getByRole('button', { name: 'Đóng hộp thoại' }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Chào mừng trở lại.' })).toBeVisible();
  await page.getByLabel('Địa chỉ email').fill('secondary@demo.vn');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Xin chào/ })).toBeVisible();
  await page.goto('/caregiver/users');
  await page.getByRole('button', { name: 'Nhập mã liên kết' }).click();
  await page
    .getByLabel('Đọc mã từ ảnh QR')
    .setInputFiles({ name: 'invitation.png', mimeType: 'image/png', buffer: qr });
  await expect(page.getByLabel('Mã VA-DEMO từ người chăm sóc chính')).toHaveValue(/^VA-DEMO-/);
  await page.getByRole('dialog').getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('cell', { name: 'Nguyễn Thị Lan', exact: true })).toBeVisible();
});
