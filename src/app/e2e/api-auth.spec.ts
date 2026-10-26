import { test, expect, type Locator, type Page } from '@playwright/test';
for (const [role, org] of [
  ['Caregiver', null],
  ['Caregiver', '01900000-0000-7000-8000-000000000002'],
  ['CenterAdmin', '01900000-0000-7000-8000-000000000002'],
  ['Admin', null],
] as const) {
  test(`U8b: dashboard ${role} ${org ? 'organization' : 'personal'} scope and counts`, async ({
    page,
  }) => {
    const calls = await stubApi(page, role, org);
    const seen: string[] = [];
    let failed = false;
    await page.route('http://localhost:5176/api/**', (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      if (
        ![
          '/api/emergency-events',
          '/api/licenses/subscription',
          '/api/licenses/pool',
          '/api/payments/history',
          '/api/notifications/status',
        ].includes(path)
      )
        return route.fallback();
      seen.push(path);
      expect(route.request().method()).toBe('GET');
      if (failed) return route.fulfill({ status: 500, json: { detail: 'Dashboard tạm thời lỗi' } });
      const paged = {
        items: [],
        page: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      let data: unknown;
      if (path === '/api/emergency-events')
        data = {
          ...paged,
          totalCount: url.searchParams.get('status') === 'Sent' ? 45 : 0,
          totalPages: url.searchParams.get('status') === 'Sent' ? 3 : 0,
        };
      if (path === '/api/licenses/subscription')
        data = {
          id,
          status: 'Trial',
          package: { id, name: 'Gói gia đình', code: 'PERSONAL', packageType: 'Personal' },
          startedAt: '2026-10-12T00:00:00Z',
          trialEndsAt: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          autoRenew: false,
          daysRemaining: null,
        };
      if (path === '/api/licenses/pool')
        data = {
          id,
          organizationId: org,
          package: { id, name: 'Gói trung tâm', code: 'BUSINESS', packageType: 'Business' },
          totalLicenses: 50,
          usedLicenses: 50,
          availableLicenses: 0,
          status: 'Active',
          purchasedAt: '2026-10-12T00:00:00Z',
          expiresAt: null,
        };
      if (path === '/api/payments/history')
        data = { ...paged, pageSize: 10, totalCount: 11, totalPages: 2, hasNextPage: true };
      if (path === '/api/notifications/status') {
        const period = { totalSent: 7, totalFailed: 0, totalPending: 2, byChannel: [] };
        data = { last24Hours: period, last7Days: period };
      }
      return route.fulfill({ json: { success: true, data } });
    });
    await login(page);
    if (role === 'Admin') {
      await expect(page.getByRole('heading', { name: 'Gửi cảnh báo trong 24 giờ' })).toBeVisible();
      await expect(page.getByText('Đã gửi không xác nhận', { exact: false })).toBeVisible();
      expect([...new Set(seen)]).toEqual(['/api/notifications/status']);
    } else {
      await expect(page.getByRole('group', { name: 'Đã gửi', exact: true })).toContainText(
        '45 cảnh báo',
      );
      await expect(page.getByRole('group', { name: 'Đã tiếp nhận', exact: true })).toContainText(
        '0 cảnh báo',
      );
      if (role === 'Caregiver' && org) {
        await expect(page.getByRole('heading', { name: 'Phạm vi chăm sóc' })).toBeVisible();
        expect(seen.every((path) => path === '/api/emergency-events')).toBe(true);
      } else {
        await expect(page.getByRole('region', { name: 'Thanh toán gần đây' })).toContainText(
          'Còn giao dịch cũ hơn',
        );
        await expect(page.getByRole('region', { name: 'Thanh toán gần đây' })).toContainText(
          '10 giao dịch gần nhất',
        );
        if (org)
          await expect(page.getByRole('region', { name: 'Kho license tổ chức' })).toContainText(
            'Gói trung tâm',
          );
        else
          await expect(page.getByRole('region', { name: 'License cá nhân' })).toContainText(
            'Chưa có dữ liệu',
          );
      }
      failed = true;
      await page.getByRole('button', { name: 'Tải lại đã gửi', exact: true }).click();
      await expect(page.getByRole('group', { name: 'Đã gửi', exact: true })).toContainText(
        'Máy chủ đang gặp sự cố',
      );
      await expect(page.getByRole('group', { name: 'Đã gửi', exact: true })).not.toContainText(
        '0 cảnh báo',
      );
    }
    expect(calls.some((path) => /locations|face-registry/.test(path))).toBe(false);
    await page.screenshot({
      path: `test-results/U8b-${role}-${org ? 'org' : 'personal'}.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await page.screenshot({
      path: `test-results/U8b-${role}-${org ? 'org' : 'personal'}-mobile.png`,
      fullPage: true,
    });
  });
}
test('U8a: public landing states integration limits without requesting protected packages', async ({
  page,
}) => {
  const calls: string[] = [];
  await page.route('**/api/**', (route) => {
    if (!new URL(route.request().url()).pathname.startsWith('/api/')) return route.continue();
    calls.push(route.request().url());
    return route.fulfill({ status: 401, json: { message: 'Not authenticated' } });
  });
  await page.goto('/');
  await expect(
    page.getByText('Bản thử nghiệm · Các tính năng liên thông đang được kiểm thử.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Bản trải nghiệm sử dụng dữ liệu mô phỏng.', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Nhận biết trên thiết bị. Kết nối khi cần.' }),
  ).toBeVisible();
  await expect(page.getByText('Bắt buộc dùng đai đeo ngực.', { exact: true })).toBeVisible();
  await expect(page.getByRole('main')).not.toContainText('99.000');
  await expect(page.getByRole('main')).not.toContainText('4.500.000');
  expect(calls).toEqual([]);
  await page.getByRole('link', { name: 'Đăng nhập để xem gói', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  expect(calls.some((url) => /packages|payments|guidance/.test(url))).toBe(false);
});

test('U7b: Hybrid filters, pagination, metadata dialog and errors', async ({ page }) => {
  await stubApi(page, 'Admin');
  await stubPeopleSearch(page, { VisuallyImpaired: id });
  const requests: URL[] = [];
  let failed = false;
  await page.route('**/api/navigation/guidance/logs?*', (route) => {
    expect(route.request().method()).toBe('GET');
    const url = new URL(route.request().url());
    requests.push(url);
    if (failed) return route.fulfill({ status: 500, json: { detail: 'Nhật ký tạm thời lỗi' } });
    const current = Number(url.searchParams.get('page'));
    const empty = url.searchParams.get('engineUsed') === 'Groq';
    return route.fulfill({
      json: {
        success: true,
        data: {
          items: empty
            ? []
            : [
                {
                  id,
                  sessionId: id,
                  userId: id,
                  frameId: 0,
                  decision: 'STOP',
                  engineUsed: 'RuleBased',
                  isOfflineFallback: true,
                  latencyMs: null,
                  createdAt: '2026-10-11T00:00:00Z',
                  detectedObjectsJson: 'PRIVATE_SCENE',
                  ttsText: 'PRIVATE_SPEECH',
                },
              ],
          page: current,
          pageSize: 20,
          totalCount: empty ? 0 : 21,
          totalPages: empty ? 0 : 2,
          hasNextPage: !empty && current === 1,
          hasPreviousPage: current > 1,
        },
      },
    });
  });
  await login(page);
  await page.getByRole('link', { name: 'Nhật ký Hybrid', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Dừng lại', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Chưa có dữ liệu', exact: true })).toBeVisible();
  await pick(page, 'Người dùng', 'VIU', /VIU mẫu/);
  await page.getByRole('combobox', { name: 'Engine', exact: true }).selectOption('RuleBased');
  await page.getByRole('combobox', { name: 'Fallback', exact: true }).selectOption('true');
  await page.getByLabel('Từ ngày Việt Nam').fill('2026-10-11');
  await page.getByLabel('Đến ngày Việt Nam').fill('2026-10-11');
  await page.getByRole('button', { name: 'Lọc bản ghi' }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.get('userId')).toBe(id);
  expect(requests.at(-1)?.searchParams.get('engineUsed')).toBe('RuleBased');
  expect(requests.at(-1)?.searchParams.get('isOfflineFallback')).toBe('true');
  expect(requests.at(-1)?.searchParams.get('dateTo')).toBe('2026-10-11T16:59:59.9999999Z');
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Trang 2/2');
  await page.screenshot({ path: 'test-results/stageU7b-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('RuleBased');
  await expect(dialog).not.toContainText('PRIVATE_');
  await dialog.getByRole('button', { name: 'Xem cùng phiên điều hướng' }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.get('sessionId')).toBe(id);
  expect(requests.at(-1)?.searchParams.get('userId')).toBe(id);
  await page.getByRole('button', { name: 'Bỏ lọc này' }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.has('sessionId')).toBe(false);
  await page.setViewportSize({ width: 375, height: 812 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await page.screenshot({ path: 'test-results/stageU7b-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await page.screenshot({ path: 'test-results/stageU7b-dialog-mobile.png', fullPage: false });
  await page.keyboard.press('Escape');
  await page.getByRole('combobox', { name: 'Engine', exact: true }).selectOption('Groq');
  await page.getByRole('button', { name: 'Lọc bản ghi' }).click();
  await expect(page.getByText('Không có bản ghi phù hợp.')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Trang' })).toContainText('Trang 1/1');
  await expect(page.getByRole('link', { name: 'Xem số liệu AI' })).toHaveAttribute(
    'href',
    '/admin/metrics',
  );
  await expect(page.getByRole('link', { name: 'Cấu hình engine', exact: true })).toHaveAttribute(
    'href',
    '/admin/configurations',
  );
  failed = true;
  await page.getByRole('button', { name: 'Tải lại', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Máy chủ đang gặp sự cố');
});

test('U7b: non-admin cannot open Hybrid administration', async ({ page }) => {
  const calls = await stubApi(page, 'CenterAdmin', '01900000-0000-7000-8000-000000000002');
  await login(page);
  await expect(page.getByRole('link', { name: 'Nhật ký Hybrid' })).toHaveCount(0);
  await page.goto('/admin/hybrid');
  await expect(page).toHaveURL(/forbidden$/);
  expect(calls.some((path) => path.includes('/navigation/guidance'))).toBe(false);
});

test('U7a: ICE CRUD, credential exclusion and uncertain writes', async ({ page }) => {
  await stubApi(page, 'Admin');
  let servers = [
    {
      id,
      serverType: 'Turn',
      url: 'turn:relay.test:3478',
      username: 'relay-user',
      credential: 'EXISTING_SECRET',
      priority: 100,
      isActive: true,
      createdAt: '2026-10-11T00:00:00Z',
      updatedAt: '2026-10-11T00:00:00Z',
    },
  ];
  const writes: { method: string; body: Record<string, unknown> }[] = [];
  let ambiguous = false;
  await page.route('**/api/webrtc/ice-servers**', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === 'GET') {
      const active = url.searchParams.get('isActive');
      const items = servers.filter((server) => !active || String(server.isActive) === active);
      return route.fulfill({
        json: {
          success: true,
          data: {
            items,
            page: 1,
            pageSize: 20,
            totalCount: items.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });
    }
    const body = method === 'DELETE' ? {} : request.postDataJSON();
    writes.push({ method, body });
    if (ambiguous) return route.fulfill({ status: 500, json: { detail: 'SECRET_IN_ERROR' } });
    if (method === 'DELETE') {
      servers = [];
      return route.fulfill({ status: 204 });
    }
    const updated = {
      ...servers[0],
      ...body,
      id,
      createdAt: '2026-10-11T00:00:00Z',
      isActive: method === 'POST' ? true : body.isActive,
      updatedAt: '2026-10-11T01:00:00Z',
    };
    servers = [updated];
    return route.fulfill({ json: { success: true, data: updated } });
  });
  await login(page);
  await page.getByRole('link', { name: 'Máy chủ cuộc gọi' }).click();
  await expect(page.getByRole('cell', { name: 'turn:relay.test:3478', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Credential TURN muốn áp dụng')).toHaveValue('');
  await expect(dialog.getByLabel('Credential TURN muốn áp dụng')).toHaveAttribute(
    'autocomplete',
    'new-password',
  );
  await expect(page.getByText('EXISTING_SECRET')).toHaveCount(0);
  await dialog.getByLabel('Tôi xác nhận').check();
  await dialog.getByRole('button', { name: 'Lưu máy chủ' }).click();
  await expect(dialog.getByRole('alert')).toContainText('TURN cần');
  expect(writes).toHaveLength(0);
  await dialog.getByLabel('Credential TURN muốn áp dụng').fill('replacement');
  await dialog.getByLabel('Độ ưu tiên').fill('25');
  await dialog.getByLabel('Bật máy chủ').uncheck();
  await page.screenshot({ path: 'test-results/stageU7a-edit-desktop.png', fullPage: false });
  await dialog.getByRole('button', { name: 'Lưu máy chủ' }).click();
  await expect(dialog).toHaveCount(0);
  expect(writes[0]).toMatchObject({
    method: 'PUT',
    body: { credential: 'replacement', isActive: false, priority: 25 },
  });
  await page.getByRole('combobox', { name: /Trạng thái máy chủ/ }).selectOption('false');
  await expect(page.getByRole('cell', { name: 'Đang tắt', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/stageU7a-list-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'test-results/stageU7a-list-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  await page.keyboard.press('Escape');
  expect(writes).toHaveLength(1);
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  await dialog.getByLabel('Tôi xác nhận').check();
  await dialog.getByRole('button', { name: 'Xác nhận xóa' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Không có máy chủ phù hợp.')).toBeVisible();
  await page.getByRole('combobox', { name: /Trạng thái máy chủ/ }).selectOption('');
  await page.getByRole('button', { name: 'Thêm máy chủ', exact: true }).click();
  await dialog.getByLabel('Địa chỉ máy chủ').fill('https://wrong.test');
  await dialog.getByLabel('Tôi xác nhận').check();
  await dialog.getByRole('button', { name: 'Lưu máy chủ' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Địa chỉ phải');
  expect(writes).toHaveLength(2);
  await dialog.getByLabel('Địa chỉ máy chủ').fill('stun:relay.test:3478');
  await page.screenshot({ path: 'test-results/stageU7a-create-mobile.png', fullPage: false });
  await dialog.getByRole('button', { name: 'Lưu máy chủ' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'stun:relay.test:3478', exact: true })).toBeVisible();
  expect(writes[2]).toMatchObject({ method: 'POST', body: { credential: null, username: null } });
  expect(writes[2].body).not.toHaveProperty('isActive');
  await page.getByRole('button', { name: 'Thêm máy chủ', exact: true }).click();
  await dialog.getByLabel('Địa chỉ máy chủ').fill('stun:another.test:3478');
  await dialog.getByLabel('Tôi xác nhận').check();
  ambiguous = true;
  await dialog.getByRole('button', { name: 'Lưu máy chủ' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Chưa xác nhận kết quả ghi');
  await expect(dialog.getByRole('button', { name: 'Lưu máy chủ' })).toHaveCount(0);
  await expect(page.getByText('SECRET_IN_ERROR')).toHaveCount(0);
  expect(writes).toHaveLength(4);
});
test('U7a: ICE admin route denies CenterAdmin', async ({ page }) => {
  const calls = await stubApi(page, 'CenterAdmin', '01900000-0000-7000-8000-000000000002');
  await login(page);
  await expect(page.getByRole('link', { name: 'Máy chủ cuộc gọi' })).toHaveCount(0);
  await page.goto('/admin/ice-servers');
  await expect(page).toHaveURL(/forbidden$/);
  expect(calls.some((path) => path.includes('ice-servers'))).toBe(false);
});
test('13b: metrics, audit and delivery filters, details and independent errors', async ({
  page,
}) => {
  await stubApi(page, 'Admin');
  const people = await stubPeopleSearch(page, { Admin: id });
  const at = '2026-10-11T00:00:00Z';
  const metric = {
    id,
    modelName: 'Tesseract',
    modelVersion: '1.0',
    metricDate: '2026-10-10',
    sourceTable: 'ocr_requests',
    totalRequests: 10,
    successfulRequests: 8,
    failedRequests: 2,
    avgConfidence: null,
    avgLatencyMs: 0,
    p95LatencyMs: null,
    p99LatencyMs: 50,
    errorCount: 2,
    aggregatedBy: 'AiMetricsAggregator',
    recordedAt: at,
  };
  const audit = {
    id,
    actorId: null,
    actionType: 'ConfigChanged',
    targetTable: 'system_configurations',
    targetRecordId: id,
    performedAt: at,
    oldData: 'DO_NOT_DISPLAY_SECRET',
    newData: 'DO_NOT_DISPLAY_SECRET',
    notes: 'DO_NOT_DISPLAY_SECRET',
  };
  const failure = {
    id,
    sourceType: 'Emergency',
    emergencyEventId: id,
    locationBoundaryEventId: null,
    recipientId: id,
    notificationType: 'FallDetected',
    channel: 'Fcm',
    status: 'Failed',
    failureReason: '<script>not executable</script>',
    createdAt: at,
  };
  const calls: URL[] = [];
  let statusError = false;
  await page.route('**/api/ai-metrics?*', (route) => {
    const url = new URL(route.request().url());
    calls.push(url);
    expect(route.request().method()).toBe('GET');
    const next = url.searchParams.get('page') === '2';
    return route.fulfill({
      json: {
        success: true,
        data: {
          items: next ? [] : [metric],
          page: next ? 2 : 1,
          pageSize: 20,
          totalCount: 21,
          totalPages: 2,
          hasNextPage: !next,
          hasPreviousPage: next,
        },
      },
    });
  });
  const paged = (item: unknown) => ({
    items: [item],
    page: 1,
    pageSize: 20,
    totalCount: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  await page.route('**/api/audit-logs?*', (route) => {
    calls.push(new URL(route.request().url()));
    return route.fulfill({ json: { success: true, data: paged(audit) } });
  });
  await page.route('**/api/notifications/failed?*', (route) => {
    calls.push(new URL(route.request().url()));
    return route.fulfill({ json: { success: true, data: paged(failure) } });
  });
  await page.route('**/api/notifications/status', (route) => {
    const period = {
      totalSent: 0,
      totalFailed: 1,
      totalPending: 2,
      byChannel: [{ channel: 'Fcm', sent: 0, failed: 1 }],
    };
    return route.fulfill(
      statusError
        ? { status: 500, json: { detail: 'Thống kê tạm thời lỗi' } }
        : { json: { success: true, data: { last24Hours: period, last7Days: period } } },
    );
  });
  await login(page);
  await page.goto('/admin/metrics');
  await expect(page.getByRole('cell', { name: 'Tesseract', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '0 ms', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Trang sau' }).click();
  await expect(page.getByText('Không có bản ghi phù hợp.')).toBeVisible();
  await page.getByLabel('Tên mô hình').fill('Tesseract');
  await page.getByLabel('Từ ngày UTC').fill('2026-10-10');
  await page.getByRole('button', { name: 'Lọc bản ghi' }).click();
  await expect(page.getByRole('cell', { name: 'Tesseract', exact: true })).toBeVisible();
  expect(calls.at(-1)?.searchParams.get('page')).toBe('1');
  expect(calls.at(-1)?.searchParams.get('dateFrom')).toBe('2026-10-10');
  await page.screenshot({ path: 'test-results/stage13b-metrics-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Chưa có dữ liệu');
  await page.keyboard.press('Escape');
  await page.goto('/admin/audit');
  await expect(page.getByRole('cell', { name: 'ConfigChanged', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: /Mã/ })).toHaveCount(0);
  await pick(page, 'Người thực hiện', 'quản', /Quản trị mẫu/);
  expect(people.at(-1)?.searchParams.get('search')).toBe('quản');
  await page.getByLabel('Đến ngày Việt Nam').fill('2026-10-11');
  await page.getByRole('button', { name: 'Lọc bản ghi' }).click();
  await expect(page.getByRole('cell', { name: 'ConfigChanged', exact: true })).toBeVisible();
  expect(calls.at(-1)?.searchParams.get('dateTo')).toBe('2026-10-11T16:59:59.9999999Z');
  expect(calls.at(-1)?.searchParams.get('actorId')).toBe(id);
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('ConfigChanged');
  await expect(page.getByText('DO_NOT_DISPLAY_SECRET')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/stage13b-audit-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Xem các thao tác trên đối tượng này' }).click();
  await expect.poll(() => calls.at(-1)?.searchParams.get('targetRecordId')).toBe(id);
  expect(calls.at(-1)?.searchParams.get('targetTable')).toBe('system_configurations');
  await expect(page.getByText('Đang xem các thao tác trên một bản ghi')).toBeVisible();
  await page.getByRole('button', { name: 'Bỏ lọc này' }).click();
  await expect.poll(() => calls.at(-1)?.searchParams.has('targetRecordId')).toBe(false);
  await page.goto('/admin/delivery');
  await expect(page.getByRole('cell', { name: 'FallDetected', exact: true })).toBeVisible();
  await expect(page.getByText('24 giờ gần nhất', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: /Kênh gửi/ }).selectOption('Fcm');
  await page.getByRole('button', { name: 'Lọc bản ghi' }).click();
  await expect.poll(() => calls.at(-1)?.searchParams.get('channel')).toBe('Fcm');
  await page.screenshot({ path: 'test-results/stage13b-delivery-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'test-results/stage13b-delivery-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('<script>not executable</script>');
  await page.screenshot({ path: 'test-results/stage13b-dialog-mobile.png', fullPage: false });
  await page.keyboard.press('Escape');
  statusError = true;
  await page.getByRole('button', { name: 'Tải lại thống kê' }).click();
  await expect(page.getByRole('alert')).toContainText('Máy chủ đang gặp sự cố');
  await expect(page.getByRole('cell', { name: 'FallDetected', exact: true })).toBeVisible();
});

test('13b: non-admin cannot access global monitoring routes', async ({ page }) => {
  const calls = await stubApi(page, 'CenterAdmin', '01900000-0000-7000-8000-000000000002');
  await login(page);
  for (const path of ['metrics', 'audit', 'delivery']) {
    await page.goto('/admin/' + path);
    await expect(page).toHaveURL(/forbidden$/);
  }
  expect(
    calls.some((path) => /ai-metrics|audit-logs|notifications\/(status|failed)/.test(path)),
  ).toBe(false);
});

test('13a: config edit, rollback old value, unknown key hidden and ambiguous write', async ({
  page,
}) => {
  await stubApi(page, 'Admin');
  const historyId = '01900000-0000-7000-8000-000000000094';
  let config = {
    id,
    configKey: 'trial_days_default',
    configValue: '7',
    valueType: 'Integer',
    category: 'BusinessRules',
    description: 'Số ngày dùng thử',
    minValue: '1',
    maxValue: '30',
    isPublic: false,
    updatedAt: '2026-10-11T00:00:00Z',
    updatedBy: null,
  };
  const history = {
    id: historyId,
    configId: id,
    configKey: config.configKey,
    oldValue: '5',
    newValue: '7',
    changedBy: null,
    changedAt: config.updatedAt,
    reason: 'Seed',
  };
  const writes: { method: string; body: Record<string, unknown> }[] = [];
  let fail = false;
  await page.route('**/api/system-configs**', async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (method === 'PUT' || method === 'POST') {
      const body = route.request().postDataJSON();
      writes.push({ method, body });
      if (fail) return route.fulfill({ status: 500, json: { detail: 'Failed' } });
      config = {
        ...config,
        configValue: method === 'POST' ? history.oldValue : body.configValue,
        updatedAt: method === 'POST' ? '2026-10-11T00:02:00Z' : '2026-10-11T00:01:00Z',
      };
      return route.fulfill({ json: { success: true, data: config } });
    }
    const data = url.pathname.endsWith('/history')
      ? organizationPage([history])
      : url.pathname === '/api/system-configs'
        ? organizationPage([
            config,
            {
              ...config,
              id: historyId,
              configKey: 'payos_checksum_key',
              configValue: 'SECRET-FIXTURE',
              description: 'SECRET-FIXTURE',
            },
          ])
        : config;
    return route.fulfill({ json: { success: true, data } });
  });
  await login(page);
  await page.getByRole('link', { name: 'Cấu hình hệ thống', exact: true }).click();
  await expect(page.getByText('SECRET-FIXTURE')).toHaveCount(0);
  await expect(
    page.getByRole('row').filter({ hasText: 'payos_checksum_key' }).getByRole('button'),
  ).toBeDisabled();
  await page
    .getByRole('row')
    .filter({ hasText: 'trial_days_default' })
    .getByRole('button', { name: 'Chi tiết' })
    .click();
  const detail = page.getByRole('dialog', { name: 'Chi tiết cấu hình', exact: true });
  await detail.getByRole('button', { name: 'Điều chỉnh', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Điều chỉnh cấu hình', exact: true });
  await editor.getByLabel('Giá trị mới').fill('31');
  await editor.getByRole('button', { name: 'Lưu cấu hình' }).click();
  await expect(editor.getByRole('alert')).toContainText('giới hạn');
  expect(writes).toHaveLength(0);
  await editor.getByLabel('Giá trị mới').fill('8');
  await editor.getByLabel('Lý do thay đổi').fill('Test update');
  await page.screenshot({ path: 'test-results/stage13a-desktop.png' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'test-results/stage13a-mobile.png' });
  const box = await editor.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(376);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await editor.getByRole('button', { name: 'Lưu cấu hình' }).click();
  await expect(editor).toHaveCount(0);
  expect(writes[0]).toEqual({ method: 'PUT', body: { configValue: '8', reason: 'Test update' } });
  await detail.getByRole('button', { name: 'Khôi phục', exact: true }).click();
  const rollback = page.getByRole('dialog', { name: 'Xác nhận khôi phục cấu hình', exact: true });
  await expect(rollback).toContainText('giá trị trước');
  await rollback.getByRole('button', { name: 'Xác nhận khôi phục', exact: true }).click();
  await expect(rollback).toHaveCount(0);
  expect(writes[1]).toEqual({ method: 'POST', body: { historyId, reason: null } });
  expect(config.configValue).toBe('5');
  fail = true;
  await detail.getByRole('button', { name: 'Điều chỉnh', exact: true }).click();
  await editor.getByLabel('Giá trị mới').fill('9');
  await editor.getByRole('button', { name: 'Lưu cấu hình' }).click();
  await expect(editor.getByRole('alert')).toContainText('Chưa xác nhận');
  await expect(editor.getByRole('button', { name: 'Lưu cấu hình' })).toHaveCount(0);
  expect(writes).toHaveLength(3);
});
test('12b: organization report totals, UTC days, member pagination and scope errors', async ({
  page,
}) => {
  const orgId = '01900000-0000-7000-8000-000000000093';
  await stubApi(page, 'CenterAdmin', orgId);
  let wrongOrg = false;
  let failure = 0;
  const requests: URL[] = [];
  await page.route(`**/api/organizations/${orgId}/activity-summary?**`, (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    if (failure)
      return route.fulfill({
        status: failure,
        json: { detail: 'Báo cáo tạm thời không khả dụng.' },
      });
    return route.fulfill({
      json: {
        success: true,
        data: {
          organizationId: wrongOrg ? id : orgId,
          dateFrom: url.searchParams.get('dateFrom'),
          dateTo: url.searchParams.get('dateTo'),
          emergencyEventCount: 101,
          geofenceBreachCount: 0,
          ocrRequestCount: 302,
          faceRecognitionCount: 4,
        },
      },
    });
  });
  await page.route(`**/api/organizations/${orgId}/members?**`, (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    const current = Number(url.searchParams.get('page'));
    return route.fulfill({
      json: {
        success: true,
        data: {
          ...organizationPage([
            {
              id,
              fullName: current === 1 ? 'Thành viên trang một' : 'Thành viên trang hai',
              email: 'member@example.test',
              phoneNumber: null,
              role: 'VisuallyImpaired',
              isActive: true,
              lastLoginAt: null,
              createdAt: '2026-10-11T00:00:00Z',
            },
          ]),
          page: current,
          totalCount: 11,
          totalPages: 2,
          hasPreviousPage: current === 2,
          hasNextPage: current === 1,
        },
      },
    });
  });
  await login(page);
  await page.getByRole('link', { name: 'Báo cáo hoạt động', exact: true }).click();
  await expect(page.getByRole('cell', { name: '101', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '0', exact: true })).toBeVisible();
  await expect(page.getByText('11 thành viên · Trang 1/2')).toBeVisible();
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByText('Thành viên trang hai')).toBeVisible();
  await page.getByLabel('Từ ngày UTC').fill('2026-10-01');
  await page.getByLabel('Đến ngày UTC').fill('2026-10-11');
  await page.getByRole('button', { name: 'Xem báo cáo', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('2026-10-01 → 2026-10-11');
  expect(
    requests.some(
      (url) =>
        url.searchParams.get('dateFrom') === '2026-10-01' &&
        url.searchParams.get('dateTo') === '2026-10-11',
    ),
  ).toBe(true);
  await page.getByLabel('Tìm thành viên', { exact: true }).fill('test');
  await page
    .getByRole('combobox', { name: 'Vai trò', exact: true })
    .selectOption('VisuallyImpaired');
  await page.getByRole('button', { name: 'Lọc thành viên', exact: true }).click();
  await expect(page.getByText('Thành viên trang một')).toBeVisible();
  expect(
    requests.some(
      (url) =>
        url.searchParams.get('search') === 'test' &&
        url.searchParams.get('role') === 'VisuallyImpaired' &&
        url.searchParams.get('page') === '1' &&
        !url.searchParams.has('dateFrom'),
    ),
  ).toBe(true);
  await page.screenshot({ path: 'test-results/stage12b-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'test-results/stage12b-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const previous = requests.length;
  await page.getByLabel('Từ ngày UTC').fill('2026-10-12');
  await page.getByRole('button', { name: 'Xem báo cáo', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('ngày kết thúc');
  expect(requests).toHaveLength(previous);
  wrongOrg = true;
  await page.getByLabel('Từ ngày UTC').fill('2026-10-01');
  await page.getByRole('button', { name: 'Xem báo cáo', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('không thuộc tổ chức');
  await expect(page.getByRole('cell', { name: '101', exact: true })).toHaveCount(0);
  wrongOrg = false;
  failure = 403;
  await page.getByRole('button', { name: 'Tải lại báo cáo', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Bạn không có quyền thực hiện thao tác này.');
});
test('12a: scoped activity history, dates, pagination, all details and revoked access', async ({
  page,
}) => {
  await stubApi(page);
  const viuId = '01900000-0000-7000-8000-000000000092';
  const at = '2026-10-11T00:00:00Z';
  const base = { id, userId: viuId, latitude: null, longitude: null };
  const ocrBase = {
    ...base,
    requestedAt: at,
    triggerMethod: 'Manual',
    ocrEngine: 'VietOCR',
    processingTimeMs: null,
    resultStatus: 'Success',
    errorMessage: null,
    ttsAnnounced: false,
    imageStoragePath: 'private/secret.jpg',
  };
  const rows: Record<string, Record<string, unknown>> = {
    '/api/navigation/sessions': {
      ...base,
      startedAt: at,
      endedAt: null,
      detectionMode: 'Full',
      totalDetections: 2,
      totalAlertsIssued: 0,
      deviceModel: null,
      appVersion: null,
      isActive: true,
    },
    '/api/ocr/requests': {
      ...ocrBase,
      requestType: 'Text',
      rawText: '<script>alert(1)</script>',
      processedText: null,
      confidenceScore: null,
      languageDetected: null,
    },
    '/api/ocr/qr-scans': {
      ...ocrBase,
      ocrRequestId: id,
      qrContent: 'javascript:alert(1)',
      qrType: null,
      isUrl: true,
      urlDomain: null,
      scannedAt: at,
    },
    '/api/face-registry/recognition-logs': {
      id,
      visuallyImpairedUserId: viuId,
      matchedPersonId: null,
      matchedPersonName: null,
      similarityScore: null,
      recognitionResult: 'NotMatched',
      estimatedDistance: null,
      processingTimeMs: null,
      recognizedAt: at,
      errorMessage: null,
    },
    '/api/voice-commands': {
      ...base,
      rawTranscript: 'Đọc văn bản',
      matchedCommand: null,
      recognitionEngine: 'Whisper',
      confidenceScore: 0,
      executionStatus: 'Unrecognized',
      requiredConfirmation: false,
      confirmedAt: null,
      processingTimeMs: null,
      audioDurationMs: null,
      isOffline: true,
      executedAt: at,
    },
  };
  let revoked = false;
  let wrongOwner = false;
  let failure = 0;
  const urls: URL[] = [];
  const methods: string[] = [];
  await page.route('**/api/users?**', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: organizationPage([
          {
            id: viuId,
            fullName: 'VIU lịch sử',
            email: 'history@example.test',
            phoneNumber: null,
            role: 'VisuallyImpaired',
            organizationId: null,
            isActive: true,
          },
        ]),
      },
    }),
  );
  await page.route('**/api/caregiver-links?**', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: organizationPage(
          revoked
            ? []
            : [
                {
                  id,
                  caregiverId: id,
                  visuallyImpairedUserId: viuId,
                  viuFullName: 'VIU lịch sử',
                  isPrimary: false,
                  linkType: 'Personal',
                  canReceiveAlerts: false,
                  canManageRegistry: false,
                  canManageLocations: false,
                  linkedAt: '',
                  unlinkedAt: null,
                },
              ],
        ),
      },
    }),
  );
  await page.route(
    /\/api\/(navigation\/sessions|ocr\/(requests|qr-scans)|face-registry\/recognition-logs|voice-commands)/,
    (route) => {
      const url = new URL(route.request().url());
      urls.push(url);
      methods.push(route.request().method());
      if (failure)
        return route.fulfill({ status: failure, json: { detail: 'Không thể tải lịch sử.' } });
      const root = Object.keys(rows).find((path) => url.pathname.startsWith(path))!;
      let row = { ...rows[root] };
      if (wrongOwner) row = { ...row, userId: id, visuallyImpairedUserId: id };
      if (url.pathname.endsWith('/events')) {
        const current = Number(url.searchParams.get('page'));
        return route.fulfill({
          json: {
            success: true,
            data: {
              ...organizationPage([
                {
                  ...base,
                  sessionId: id,
                  objectClass: current === 1 ? 'chair' : 'door',
                  confidenceScore: 0.9,
                  distanceRange: 'Near',
                  alertIssued: false,
                  inferenceTimeMs: null,
                  detectedAt: at,
                },
              ]),
              page: current,
              pageSize: 20,
              totalCount: 21,
              totalPages: 2,
              hasNextPage: current === 1,
              hasPreviousPage: current === 2,
            },
          },
        });
      }
      const current = Number(url.searchParams.get('page') || 1);
      return route.fulfill({
        json: {
          success: true,
          data:
            url.pathname === root
              ? {
                  ...organizationPage([row]),
                  page: current,
                  pageSize: 20,
                  totalCount: 21,
                  totalPages: 2,
                  hasNextPage: current === 1,
                  hasPreviousPage: current === 2,
                }
              : row,
        },
      });
    },
  );
  await login(page);
  await page.getByRole('link', { name: 'Nhật ký hoạt động', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Người được chăm sóc', exact: true })
    .selectOption(viuId);
  await expect(page.getByText('21 kết quả · Trang 1/2')).toBeVisible();
  await page.getByLabel('Từ ngày', { exact: true }).fill('2026-10-11');
  await page.getByLabel('Đến ngày', { exact: true }).fill('2026-10-11');
  await page.getByRole('button', { name: 'Lọc lịch sử' }).click();
  await expect
    .poll(() =>
      urls.some(
        (url) =>
          url.searchParams.get('dateFrom') === '2026-10-10T17:00:00.000Z' &&
          url.searchParams.get('dateTo') === '2026-10-11T16:59:59.999Z',
      ),
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Trang sau', exact: true }).last().click();
  await expect(page.getByText('21 kết quả · Trang 2/2')).toBeVisible();
  await page.screenshot({ path: 'test-results/stage12a-list-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'test-results/stage12a-list-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('chair', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Trang sau' }).click();
  await expect(dialog.getByText('door', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  for (const [kind, content] of [
    ['ocr', '<script>alert(1)</script>'],
    ['qr', 'javascript:alert(1)'],
    ['recognition', 'Chưa nhận diện được'],
    ['voice', 'Đọc văn bản'],
  ]) {
    await page.getByRole('combobox', { name: 'Loại hoạt động', exact: true }).selectOption(kind);
    await expect(page.getByText('21 kết quả · Trang 1/2')).toBeVisible();
    await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
    await expect(dialog.getByText(content, { exact: true })).toBeVisible();
    await expect(dialog.getByText('private/secret.jpg')).toHaveCount(0);
    await expect(dialog.locator('a[href^="javascript:"]')).toHaveCount(0);
    if (kind === 'qr') {
      await page.screenshot({ path: 'test-results/stage12a-desktop.png' });
      await page.setViewportSize({ width: 375, height: 812 });
      await page.screenshot({ path: 'test-results/stage12a-mobile.png' });
      const box = await dialog.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(376);
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await page.keyboard.press('Escape');
  }
  expect(
    urls.some(
      (url) =>
        url.pathname === '/api/face-registry/recognition-logs' &&
        url.searchParams.get('viuId') === viuId &&
        !url.searchParams.has('userId'),
    ),
  ).toBe(true);
  wrongOwner = true;
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('không thuộc');
  await page.keyboard.press('Escape');
  wrongOwner = false;
  failure = 404;
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByText('Đọc văn bản', { exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  failure = 0;
  revoked = true;
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('không còn liên kết');
  expect(methods.every((method) => method === 'GET')).toBe(true);
});
type CallHarness = {
  peer: RTCPeerConnection;
  mic: MediaStream;
  ice: RTCIceCandidateInit[];
  pending: RTCIceCandidateInit[];
  mediaRequests: number;
};
declare global {
  interface Window {
    callHarness: CallHarness;
  }
}

async function callFixture(page: Page, incoming = false, denied = false) {
  await stubApi(page);
  const viuId = '01900000-0000-7000-8000-000000000002';
  const sessionId = '01900000-0000-7000-8000-000000000003';
  let status = 'Ringing';
  const writes: string[] = [];
  const messages: string[] = [];
  let send: (data: string) => void = () => {
    throw Error('Hub not connected');
  };
  await page.addInitScript(
    ({ denied }) => {
      const audio = new AudioContext();
      const mic = audio.createMediaStreamDestination().stream;
      const peer = new RTCPeerConnection({ iceServers: [] });
      const harness = {
        peer,
        mic,
        ice: [] as RTCIceCandidateInit[],
        pending: [] as RTCIceCandidateInit[],
        mediaRequests: 0,
      };
      window.callHarness = harness;
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: async (constraints: MediaStreamConstraints) => {
          harness.mediaRequests++;
          if (constraints.video !== false) throw Error('Web must never request a camera');
          if (denied) throw new DOMException('Denied', 'NotAllowedError');
          return mic;
        },
      });
      peer.onicecandidate = (event) => {
        if (event.candidate) harness.ice.push(event.candidate.toJSON());
      };
    },
    { denied },
  );
  await page.route('**/hubs/location/negotiate?*', (route) =>
    route.fulfill({
      json: {
        negotiateVersion: 1,
        connectionId: 'calls',
        connectionToken: 'calls',
        availableTransports: [{ transport: 'WebSockets', transferFormats: ['Text', 'Binary'] }],
      },
    }),
  );
  await page.routeWebSocket(/\/hubs\/location\?/, (ws) => {
    send = (data) => ws.send(data);
    ws.onMessage(async (raw) => {
      for (const part of String(raw).split('\x1e').filter(Boolean)) {
        const message = JSON.parse(part);
        if (message.protocol) {
          ws.send('{}\x1e');
          continue;
        }
        if (message.type !== 1) continue;
        messages.push(message.target);
        if (message.target === 'RelayAnswer')
          await page.evaluate(async (sdp) => {
            const h = window.callHarness;
            await h.peer.setRemoteDescription({ type: 'answer', sdp });
            for (const candidate of h.pending.splice(0)) await h.peer.addIceCandidate(candidate);
          }, message.arguments[1]);
        if (message.target === 'RelayIceCandidate')
          await page.evaluate(async (json) => {
            const h = window.callHarness;
            const candidate = JSON.parse(json);
            if (h.peer.remoteDescription) await h.peer.addIceCandidate(candidate);
            else h.pending.push(candidate);
          }, message.arguments[1]);
        ws.send(JSON.stringify({ type: 3, invocationId: message.invocationId }) + '\x1e');
      }
    });
  });
  await page.route('**/api/users?*', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: organizationPage([
          {
            id: viuId,
            fullName: 'VIU gọi thử',
            email: 'viu@example.test',
            phoneNumber: null,
            role: 'VisuallyImpaired',
            organizationId: null,
            isActive: true,
          },
        ]),
      },
    }),
  );
  await page.route('**/api/caregiver-links?*', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: organizationPage([
          {
            id,
            caregiverId: id,
            visuallyImpairedUserId: viuId,
            viuFullName: 'VIU gọi thử',
            isPrimary: true,
            linkType: 'Personal',
            canReceiveAlerts: true,
            canManageRegistry: true,
            canManageLocations: true,
            linkedAt: '',
            unlinkedAt: null,
          },
        ]),
      },
    }),
  );
  await page.route('**/api/webrtc/sessions**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'GET')
      return route.fulfill({
        json: {
          success: true,
          data: organizationPage([
            {
              sessionId,
              status,
              triggerType: incoming ? 'SosAuto' : 'CaregiverInitiated',
              durationSeconds: null,
              startedAt: '2026-10-10T00:00:00Z',
              connectedAt: null,
              endedAt: null,
              endReason: null,
              initiatorId: incoming ? null : id,
              receiverId: incoming ? id : viuId,
              viuUserId: viuId,
            },
          ]),
        },
      });
    writes.push(path);
    if (path.endsWith('/end')) status = 'Ended';
    if (path.endsWith('/reject')) status = 'Rejected';
    if (path.endsWith('/accept')) status = 'Connected';
    return route.fulfill({
      json: {
        success: true,
        data:
          path.endsWith('/end') || path.endsWith('/reject')
            ? null
            : { sessionId, status, myRole: 'video_viewer_audio_sender', iceServers: [] },
      },
    });
  });
  const notify = (target: string, payload: object = {}) =>
    send(JSON.stringify({ type: 1, target, arguments: [{ sessionId, ...payload }] }) + '\x1e');
  return {
    writes,
    messages,
    sessionId,
    notify,
    connected: () => {
      status = 'Connected';
    },
  };
}

test('U6a: outgoing call negotiates native local media, mutes, ends and refreshes history', async ({
  page,
}) => {
  const f = await callFixture(page);
  await login(page);
  await page.getByRole('link', { name: 'Người được chăm sóc', exact: true }).click();
  const call = page.getByRole('button', { name: 'Gọi VIU gọi thử', exact: true });
  await expect(call).toBeEnabled();
  await call.click();
  await page.getByRole('button', { name: 'Bắt đầu gọi', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đang đổ chuông' })).toBeVisible();
  f.connected();
  f.notify('WebRtcCallAccepted', { receiverRole: 'video_viewer_audio_sender' });
  const sdp = await page.evaluate(async () => {
    const h = window.callHarness;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    canvas.getContext('2d')!.fillRect(0, 0, 320, 240);
    const video = canvas.captureStream(5);
    setInterval(() => canvas.getContext('2d')!.fillRect(0, 0, 320, 240), 100);
    video.getTracks().forEach((track) => h.peer.addTrack(track, video));
    const audio = new AudioContext().createMediaStreamDestination().stream;
    audio.getTracks().forEach((track) => h.peer.addTrack(track, audio));
    const offer = await h.peer.createOffer();
    await h.peer.setLocalDescription(offer);
    return offer.sdp!;
  });
  f.notify('WebRtcOffer', { sdp });
  await expect.poll(() => f.messages.includes('RelayAnswer')).toBe(true);
  await expect.poll(() => page.evaluate(() => window.callHarness.ice.length)).toBeGreaterThan(0);
  const candidates = await page.evaluate(() => window.callHarness.ice);
  candidates.forEach((candidate) =>
    f.notify('WebRtcIceCandidate', { candidateJson: JSON.stringify(candidate) }),
  );
  await expect(
    page.getByRole('status').filter({ hasText: 'Âm thanh và hình ảnh đã kết nối.' }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.locator('video').evaluate((element) => (element as HTMLVideoElement).videoWidth),
    )
    .toBe(320);
  const originalVideo = await page.locator('video').elementHandle();
  await expect(page.locator('#main')).toHaveAttribute('inert', '');
  await page.getByRole('button', { name: 'Menu tài khoản' }).click();
  await page.getByRole('link', { name: 'Hồ sơ của tôi', exact: true }).click();
  await expect(page.locator('.call-workspace')).toHaveClass(/is-minimized/);
  await expect(page.locator('#main')).not.toHaveAttribute('inert', '');
  await page.goBack();
  await expect(page.locator('.call-workspace')).toHaveClass(/is-minimized/);
  await page.getByRole('button', { name: 'Mở rộng cuộc gọi', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.call-workspace')).toHaveClass(/is-minimized/);
  expect(f.writes.some((path) => path.endsWith('/end'))).toBe(false);
  await page.getByRole('button', { name: 'Menu tài khoản' }).click();
  await page.getByRole('link', { name: 'Hồ sơ của tôi', exact: true }).click();
  await expect(page).toHaveURL(/profile$/);
  expect(
    await originalVideo!.evaluate(
      (node) => node === document.querySelector('.call-workspace video'),
    ),
  ).toBe(true);
  expect(await page.evaluate(() => window.callHarness.mic.getAudioTracks()[0].readyState)).toBe(
    'live',
  );
  await page.screenshot({ path: 'test-results/call-workspace-minimized-1440.png', fullPage: true });
  await page.getByRole('button', { name: 'Mở rộng cuộc gọi', exact: true }).click();
  await expect(page.locator('.call-workspace')).not.toHaveClass(/is-minimized/);
  await page.getByRole('button', { name: 'Tắt micro', exact: true }).click();
  expect(await page.evaluate(() => window.callHarness.mic.getAudioTracks()[0].enabled)).toBe(false);
  await page.screenshot({ path: 'test-results/u6a-call-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole('button', { name: 'Kết thúc cuộc gọi', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/u6a-call-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Kết thúc cuộc gọi', exact: true }).click();
  await expect.poll(() => f.writes.some((path) => path.endsWith('/end'))).toBe(true);
  expect(await page.evaluate(() => window.callHarness.mic.getAudioTracks()[0].readyState)).toBe(
    'ended',
  );
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('link', { name: 'Lịch sử cuộc gọi', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Đã kết thúc', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
  const historyDialog = page.getByRole('dialog', { name: 'Chi tiết cuộc gọi' });
  await expect(historyDialog.locator('.record-details dd')).toHaveCount(7);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(historyDialog).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await page.screenshot({ path: `test-results/redesign-call-detail-${width}.png` });
  }
  await page.keyboard.press('Escape');
  await expect(historyDialog).toHaveCount(0);
});

test('U6a: incoming SOS stays silent, Escape does not reject and explicit rejection closes it', async ({
  page,
}) => {
  const f = await callFixture(page, true);
  await login(page);
  // Recovery must work even when the original SignalR invitation was missed.
  await expect(page.getByRole('button', { name: 'Nhận cuộc gọi', exact: true })).toBeVisible();
  const payload = {
    callerName: 'VIU gọi thử',
    triggerType: 'SosAuto',
    receiverRole: 'video_viewer_audio_sender',
  };
  f.notify('WebRtcIncomingCall', payload);
  await expect(page.getByRole('button', { name: 'Nhận cuộc gọi', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.callHarness.mediaRequests)).toBe(0);
  await expect(page.locator('video')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/call-workspace-incoming-1440.png', fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Nhận cuộc gọi', exact: true })).toBeVisible();
  expect(f.writes.some((path) => path.endsWith('/reject'))).toBe(false);
  await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
  await expect.poll(() => f.writes.some((path) => path.endsWith('/reject'))).toBe(true);
  f.notify('WebRtcIncomingCall', payload);
  await expect(page.getByRole('button', { name: 'Nhận cuộc gọi', exact: true })).toHaveCount(0);
});

test('U6a: accepting incoming call opens workspace and minimize keeps microphone live', async ({
  page,
}) => {
  const f = await callFixture(page, true);
  await login(page);
  await page.getByRole('button', { name: 'Nhận cuộc gọi', exact: true }).click();
  await expect(page.locator('.incoming-call')).toHaveCount(0);
  await expect(page.locator('.call-workspace')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.callHarness.mediaRequests)).toBe(1);
  await page.getByRole('button', { name: 'Thu nhỏ cuộc gọi', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Kết thúc cuộc gọi', exact: true })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({ path: 'test-results/call-workspace-minimized-390.png', fullPage: true });
  expect(await page.evaluate(() => window.callHarness.mic.getAudioTracks()[0].readyState)).toBe(
    'live',
  );
  expect(f.writes.some((path) => path.endsWith('/end'))).toBe(false);
  await page.getByRole('button', { name: 'Kết thúc cuộc gọi', exact: true }).click();
  await expect.poll(() => f.writes.some((path) => path.endsWith('/end'))).toBe(true);
  expect(await page.evaluate(() => window.callHarness.mic.getAudioTracks()[0].readyState)).toBe(
    'ended',
  );
});

test('U6a: microphone denial never creates a call', async ({ page }) => {
  const f = await callFixture(page, false, true);
  await login(page);
  await page.getByRole('link', { name: 'Người được chăm sóc', exact: true }).click();
  await page.getByRole('button', { name: 'Gọi VIU gọi thử', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu gọi', exact: true }).click();
  await expect(page.getByText('Bạn chưa cho phép micro. Hãy cấp quyền rồi thử lại.')).toBeVisible();
  expect(f.writes).toEqual([]);
});
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
  await page.getByRole('button', { name: 'Menu tài khoản' }).click();
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

test('11b: TTS create/update, percent mapping, cleared language, revoked link and license', async ({
  page,
}) => {
  await stubApi(page);
  const viuId = '01900000-0000-7000-8000-000000000082';
  let exists = false;
  let revoked = false;
  let failWrite = false;
  let expired = false;
  const bodies: Record<string, unknown>[] = [];
  const user = {
    id: viuId,
    fullName: 'VIU giọng đọc',
    email: 'viu@example.test',
    phoneNumber: null,
    role: 'VisuallyImpaired',
    organizationId: null,
    isActive: true,
  };
  const preference = {
    id,
    userId: viuId,
    voiceGender: 'Female',
    speedRate: 1,
    volumeLevel: 0.8,
    detectionMode: 'Full',
    primaryLanguage: 'vi-VN',
    secondaryLanguage: null,
    updatedAt: '2026-10-11T00:00:00Z',
  };
  await page.route('**/api/users?**', (route) =>
    route.fulfill({ json: { success: true, data: organizationPage([user]) } }),
  );
  await page.route(`**/api/users/${viuId}`, (route) =>
    route.fulfill({ json: { success: true, data: user } }),
  );
  await page.route('**/api/caregiver-links?**', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: organizationPage(
          revoked
            ? []
            : [
                {
                  id,
                  caregiverId: id,
                  visuallyImpairedUserId: viuId,
                  viuFullName: user.fullName,
                  isPrimary: false,
                  linkType: 'Personal',
                  canReceiveAlerts: false,
                  canManageRegistry: false,
                  canManageLocations: false,
                  linkedAt: '',
                  unlinkedAt: null,
                },
              ],
        ),
      },
    }),
  );
  await page.route(`**/api/users/${viuId}/tts-preferences`, (route) => {
    if (expired) return route.fulfill({ status: 402, json: { detail: 'License test' } });
    if (route.request().method() === 'PUT') {
      bodies.push(route.request().postDataJSON());
      if (failWrite) return route.fulfill({ status: 500, json: { detail: 'unavailable' } });
      Object.assign(preference, bodies.at(-1));
      exists = true;
    }
    return exists
      ? route.fulfill({ json: { success: true, data: preference } })
      : route.fulfill({ status: 404, json: { detail: 'TtsPreference not found' } });
  });
  await login(page);
  await page.goto('/caregiver/tts');
  await page
    .getByRole('combobox', { name: 'Người được chăm sóc', exact: true })
    .selectOption(viuId);
  await expect(page.getByText('Chưa có cấu hình giọng đọc.', { exact: false })).toBeVisible();
  expect(bodies).toHaveLength(0);
  await page.getByRole('button', { name: 'Tạo cấu hình giọng đọc', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Âm lượng')).toHaveValue('80');
  await dialog.getByLabel('Âm lượng').fill('101');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog.getByRole('alert')).toContainText('tối đa');
  expect(bodies).toHaveLength(0);
  await dialog.getByLabel('Âm lượng').fill('0');
  await dialog.getByLabel('Giọng đọc', { exact: false }).selectOption('Male');
  await dialog.getByLabel('Tốc độ đọc').fill('1.5');
  await dialog.getByLabel('Chế độ phát hiện').selectOption('Minimal');
  await dialog.getByLabel('Ngôn ngữ phụ').fill('en-US');
  await page.screenshot({ path: 'test-results/stage11b-desktop.png' });
  await page.setViewportSize({ width: 375, height: 812 });
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  await page.screenshot({ path: 'test-results/stage11b-mobile.png' });
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog).toHaveCount(0);
  expect(bodies[0]).toMatchObject({
    volumeLevel: 0,
    voiceGender: 'Male',
    speedRate: 1.5,
    detectionMode: 'Minimal',
    secondaryLanguage: 'en-US',
  });
  expect(bodies[0]).not.toHaveProperty('volumePercent');
  await expect(page.locator('.settings-details dd')).toHaveCount(6);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await page.screenshot({ path: `test-results/redesign-tts-${width}.png`, fullPage: true });
  }
  await page.reload();
  await page
    .getByRole('combobox', { name: 'Người được chăm sóc', exact: true })
    .selectOption(viuId);
  await page.getByRole('button', { name: 'Chỉnh sửa giọng đọc', exact: true }).click();
  await expect(dialog.getByLabel('Âm lượng')).toHaveValue('0');
  await expect(dialog.getByLabel('Ngôn ngữ phụ')).toHaveValue('en-US');
  await dialog.getByLabel('Ngôn ngữ phụ').fill('');
  await dialog.getByLabel('Âm lượng').fill('80');
  failWrite = true;
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog.getByRole('alert')).toContainText('tải lại cấu hình');
  await expect(dialog.getByLabel('Âm lượng')).toHaveValue('80');
  expect(bodies).toHaveLength(2);
  failWrite = false;
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog).toHaveCount(0);
  expect(bodies.at(-1)).toMatchObject({ volumeLevel: 0.8, secondaryLanguage: '' });
  await page.getByRole('button', { name: 'Chỉnh sửa giọng đọc', exact: true }).click();
  revoked = true;
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog.getByRole('alert')).toContainText('không còn liên kết');
  expect(bodies).toHaveLength(3);
  await page.keyboard.press('Escape');
  revoked = false;
  expired = true;
  await page.getByRole('button', { name: 'Tải lại cấu hình', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Xem trạng thái license', exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/caregiver\/tts$/);
  await expect(
    page.getByRole('button', { name: 'Tạo cấu hình giọng đọc', exact: true }),
  ).toHaveCount(0);
});

test('10: registry CRUD, authenticated photos, revoked permissions and recoverable failures', async ({
  page,
}) => {
  await stubApi(page);
  const viuId = '01900000-0000-7000-8000-000000000081';
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7XkAAAAASUVORK5CYII=',
    'base64',
  );
  let canManage = true;
  let exists = false;
  let failUpload = true;
  let failDelete = true;
  const writes: string[] = [];
  const person = {
    id,
    visuallyImpairedUserId: viuId,
    displayName: 'Người thân test',
    relationship: 'Gia đình',
    notes: '',
    isActive: false,
    imageCount: 0,
    images: [] as { id: string; personId: string; isPrimaryImage: boolean; uploadedAt: string }[],
  };
  await page.route('**/api/users?**', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: organizationPage([
          {
            id: viuId,
            fullName: 'VIU danh bạ',
            email: 'viu@example.test',
            phoneNumber: null,
            role: 'VisuallyImpaired',
            organizationId: null,
            isActive: true,
          },
        ]),
      },
    }),
  );
  await page.route('**/api/caregiver-links?**', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: organizationPage([
          {
            id,
            caregiverId: id,
            visuallyImpairedUserId: viuId,
            viuFullName: 'VIU danh bạ',
            isPrimary: false,
            linkType: 'Personal',
            canReceiveAlerts: false,
            canManageRegistry: canManage,
            canManageLocations: false,
            linkedAt: '',
            unlinkedAt: null,
          },
        ]),
      },
    }),
  );
  await page.route('**/api/face-registry/**', (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const method = req.method();
    if (method !== 'GET') writes.push(method + ' ' + path);
    if (path.includes('/photos')) {
      if (method === 'GET') {
        expect(req.headers().authorization).toContain('Bearer ');
        expect(req.url()).not.toContain('token');
        return route.fulfill({
          body: png,
          contentType: 'image/jpeg',
          headers: { 'Cache-Control': 'private, no-store' },
        });
      }
      if (method === 'POST') {
        expect(req.headers()['content-type']).toContain('multipart/form-data');
        expect(req.postData()).not.toContain('embeddingVector');
        if (failUpload)
          return route.fulfill({ status: 500, json: { detail: 'Upload unavailable' } });
        const photo = {
          id: `01900000-0000-7000-8000-00000000009${person.images.length}`,
          personId: id,
          isPrimaryImage: !person.images.length,
          uploadedAt: '2026-10-10T00:00:00Z',
        };
        person.images.push(photo);
        person.imageCount = person.images.length;
        person.isActive = person.imageCount >= 3;
        return route.fulfill({ json: { success: true, data: photo } });
      }
      if (method === 'PATCH') {
        const photoId = path.split('/').at(-2);
        person.images.forEach((p) => {
          p.isPrimaryImage = p.id === photoId;
        });
        return route.fulfill({
          json: { success: true, data: person.images.find((p) => p.id === photoId) },
        });
      }
      if (failDelete)
        return route.fulfill({ status: 500, json: { detail: 'Không thể xóa ảnh lúc này.' } });
      person.images = person.images.filter((p) => p.id !== path.split('/').at(-1));
      person.imageCount = person.images.length;
      person.isActive = person.imageCount >= 3;
      return route.fulfill({ status: 204 });
    }
    if (method === 'POST' || method === 'PUT') {
      Object.assign(person, req.postDataJSON());
      exists = true;
    }
    if (method === 'DELETE') {
      exists = false;
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({
      json: {
        success: true,
        data: path.endsWith('/persons') && method === 'GET' ? (exists ? [person] : []) : person,
      },
    });
  });
  await login(page);
  await page.goto('/caregiver/registry');
  await page
    .getByRole('combobox', { name: 'Người được chăm sóc', exact: true })
    .selectOption(viuId);
  await page.getByRole('button', { name: 'Thêm người thân', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tên người thân').fill('Người thân test');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  await dialog.getByLabel('Mối quan hệ').fill('Gia đình');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Quản lý ảnh', exact: true }).click();
  const upload = async () => {
    await dialog
      .getByLabel('Chọn ảnh người thân')
      .setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: png });
    await dialog.getByRole('button', { name: 'Tải ảnh lên', exact: true }).click();
  };
  await upload();
  await expect(dialog.getByRole('alert')).toContainText('tránh trùng');
  expect(person.images).toHaveLength(0);
  failUpload = false;
  for (let i = 1; i <= 3; i++) {
    await upload();
    await expect(dialog.getByRole('img')).toHaveCount(i);
  }
  await expect(dialog.getByText('3 ảnh · Hoạt động.', { exact: false })).toBeVisible();
  await expect(dialog.getByRole('img').first()).toHaveJSProperty('naturalWidth', 1);
  await dialog.getByRole('button', { name: 'Đặt ảnh chính', exact: true }).last().click();
  await expect(dialog.getByText('Đã đổi ảnh chính.', { exact: true })).toBeVisible();
  expect(person.images[2].isPrimaryImage).toBe(true);
  await page.screenshot({ path: 'test-results/stage10-photos-desktop.png' });
  await page.setViewportSize({ width: 375, height: 812 });
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  await page.screenshot({ path: 'test-results/stage10-photos-mobile.png' });
  await dialog.getByRole('button', { name: 'Xóa ảnh', exact: true }).first().click();
  const confirm = page.getByRole('dialog', { name: 'Xóa ảnh người thân', exact: true });
  await confirm.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(confirm.getByRole('alert')).toContainText('Máy chủ đang gặp sự cố');
  expect(person.images).toHaveLength(3);
  failDelete = false;
  await confirm.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(confirm).toHaveCount(0);
  await expect(dialog.getByText('2 ảnh · Chưa hoạt động.', { exact: false })).toBeVisible();
  const blobUrl = await dialog.getByRole('img').first().getAttribute('src');
  await dialog.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    await page.evaluate(async (url) => {
      try {
        await fetch(url!);
        return true;
      } catch {
        return false;
      }
    }, blobUrl),
  ).toBe(false);
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  canManage = false;
  const count = writes.length;
  await dialog.getByLabel('Tên người thân').fill('Không được sửa');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText('Bạn có quyền xem.', { exact: false })).toBeVisible();
  expect(writes).toHaveLength(count);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Thêm người thân', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Quản lý ảnh', exact: true }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('img')).toHaveCount(2);
  await expect(dialog.getByRole('button', { name: 'Tải ảnh lên', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  canManage = true;
  await page.getByRole('button', { name: 'Tải lại danh bạ', exact: true }).click();
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByText('Chưa có người thân phù hợp.', { exact: true })).toBeVisible();
});
// People pickers search /api/users by name/email (pageSize 10) and send the chosen id.
async function stubPeopleSearch(page: Page, people: Record<string, string>) {
  const searches: URL[] = [];
  await page.route(
    (url) => url.pathname === '/api/users' && url.searchParams.get('pageSize') === '10',
    (route) => {
      const url = new URL(route.request().url());
      searches.push(url);
      const role = url.searchParams.get('role');
      const items = Object.entries(people)
        .filter(([r]) => !role || r === role)
        .map(([r, personId]) => ({
          id: personId,
          fullName:
            r === 'Caregiver' ? 'Nhân viên mẫu' : r === 'Admin' ? 'Quản trị mẫu' : 'VIU mẫu',
          email: personId.slice(-4) + '@example.test',
          phoneNumber: null,
          role: r,
          organizationId: r === 'Admin' ? null : organizationId,
          isActive: true,
          avatarUrl: null,
          deletedAt: null,
          lastLoginAt: null,
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z',
        }));
      return route.fulfill({ json: { success: true, data: organizationPage(items) } });
    },
  );
  return searches;
}
async function pick(scope: Page | Locator, label: string, term: string, option: RegExp) {
  await scope.getByRole('combobox', { name: label, exact: true }).fill(term);
  await scope.getByRole('option', { name: option }).click();
}
// Tests never reach Mapbox: styles get an offline background-only style (no tiles, sprites or
// fonts) and every other *.mapbox.com request fails fast. A test may override either route.
const mapboxHost = /^https:\/\/([a-z0-9-]+\.)*mapbox\.com\//;
const mapboxStyles = /^https:\/\/api\.mapbox\.com\/styles\//;
const offlineStyle = {
  version: 8,
  sources: {},
  layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#e9f2ef' } }],
};
async function stubApi(page: Page, role = 'Caregiver', organizationId: string | null = null) {
  await page.route(mapboxHost, (route) => route.abort());
  await page.route(mapboxStyles, (route) => route.fulfill({ json: offlineStyle }));
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
    const path = role === 'Admin' ? '/admin/metrics' : '/dashboard';
    await page.goto(path);
    await expect(
      page.getByRole('heading', {
        name: role !== 'Admin' ? 'Đã đăng nhập bằng tài khoản BE' : 'Hiệu năng AI',
      }),
    ).toBeVisible();
    expect(
      calls.every((p) =>
        [
          '/api/auth/login',
          '/api/users/me',
          '/api/auth/refresh',
          '/api/ai-metrics',
          ...(role === 'Caregiver'
            ? ['/api/licenses/subscription', '/api/payments/history', '/api/emergency-events']
            : role === 'Admin'
              ? ['/api/notifications/status']
              : []),
        ].includes(p),
      ),
    ).toBe(true);
    await page.getByRole('button', { name: 'Menu tài khoản' }).click();
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
  await page.getByRole('button', { name: 'Menu tài khoản' }).click();
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
  await expect(page.locator('.profile-details dd').filter({ hasText: 'Tên mới' })).toBeVisible();
  await expect(page.locator('.profile-details dd').filter({ hasText: '0901234567' })).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await page.screenshot({ path: `test-results/redesign-profile-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('input[type=file]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
  await expect(page.getByLabel('Nhập lại mật khẩu mới')).toHaveAttribute(
    'autocomplete',
    'new-password',
  );
  await page.getByLabel('Mật khẩu hiện tại').fill('WrongPassword@1');
  await page.getByLabel('Mật khẩu mới', { exact: false }).first().fill('NewPassword@2');
  await page.getByLabel('Nhập lại mật khẩu mới').fill('NewPassword@2');
  await actionDialog(page).getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Mật khẩu hiện tại không đúng.');
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
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'test-results/care-users-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/care-users-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 900 });
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
  await expect(
    page.getByRole('status').filter({ hasText: 'Không có người dùng phù hợp' }),
  ).toBeVisible();
  await page.getByLabel('Tìm người được chăm sóc').fill('Không tìm thấy');
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Không có người dùng phù hợp' }),
  ).toBeVisible();
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
  await expect(page.getByRole('alert')).toContainText('Bạn không có quyền thực hiện thao tác này.');
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
  await page.route('http://localhost:5176/api/licenses/pool?*', (route) =>
    route.fulfill({ status: 404, json: { detail: 'License pool not found' } }),
  );
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
  await expect(dialog.getByRole('alert')).toContainText(
    'Bạn không có quyền thực hiện thao tác này.',
  );
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
test('UC-130 Admin: suspend with reason, conflict reload and reactivate to expired', async ({
  page,
}) => {
  await stubApi(page, 'Admin');
  const poolId = '01900000-0000-7000-8000-000000000061';
  let pool = {
    id: poolId,
    organizationId,
    package: { id: poolId, name: 'Business 50', code: 'BUSINESS_50', packageType: 'Business' },
    totalLicenses: 50,
    usedLicenses: 20,
    availableLicenses: 30,
    status: 'Active',
    purchasedAt: '2026-09-01T00:00:00Z',
    expiresAt: '2099-01-01T00:00:00Z',
    suspendedReason: null as string | null,
    suspendedAt: null as string | null,
  };
  const writes: URL[] = [];
  let conflict = false;
  await page.route('http://localhost:5176/api/organizations**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/members'))
      return route.fulfill({ json: { success: true, data: organizationPage([]) } });
    return route.fulfill({
      json: {
        success: true,
        data:
          url.pathname === '/api/organizations'
            ? organizationPage([organizationFixture])
            : organizationFixture,
      },
    });
  });
  await page.route('http://localhost:5176/api/licenses/pool**', (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'GET') {
      expect(url.searchParams.get('organizationId')).toBe(organizationId);
      return route.fulfill({ json: { success: true, data: pool } });
    }
    writes.push(url);
    if (url.pathname.endsWith('/suspend')) {
      pool = {
        ...pool,
        status: 'Suspended',
        suspendedReason: url.searchParams.get('reason'),
        suspendedAt: '2026-10-22T03:00:00Z',
      };
      return route.fulfill({ json: { success: true, data: null } });
    }
    if (conflict) {
      // Another admin reactivated first.
      pool = { ...pool, status: 'Active', suspendedReason: null, suspendedAt: null };
      return route.fulfill({
        status: 422,
        json: { detail: 'License pool is not suspended', errorCode: 'LICENSE_POOL_NOT_SUSPENDED' },
      });
    }
    pool = {
      ...pool,
      status: 'Expired',
      expiresAt: '2026-10-01T00:00:00Z',
      suspendedReason: null,
      suspendedAt: null,
    };
    return route.fulfill({ json: { success: true, data: null } });
  });
  await login(page);
  await page.goto('/admin/organizations');
  await page.getByRole('button', { name: 'Xem tổ chức ' + organizationFixture.name }).click();
  const section = page.getByRole('region', { name: 'Kho license' });
  await expect(section).toContainText('Đang hoạt động');
  await expect(section).toContainText('20/50 suất · còn 30');
  await section.getByRole('button', { name: 'Tạm ngưng kho' }).click();
  const dialog = actionDialog(page);
  await expect(dialog).toContainText('Chưa có license cho tới khi kích hoạt lại');
  await dialog.getByLabel('Lý do tạm ngưng').fill('Chưa thanh toán & vi phạm');
  await dialog.getByRole('button', { name: 'Xác nhận tạm ngưng' }).click();
  await expect(dialog).toHaveCount(0);
  expect(writes.at(-1)?.pathname).toBe(`/api/licenses/pool/${poolId}/suspend`);
  expect(writes.at(-1)?.searchParams.get('reason')).toBe('Chưa thanh toán & vi phạm');
  await expect(page.getByText('Đã tạm ngưng kho license.')).toBeVisible();
  await expect(section).toContainText('Tạm ngưng');
  await expect(section).toContainText('Chưa thanh toán & vi phạm');
  await page.screenshot({ path: 'test-results/uc130-pool-suspended.png', fullPage: true });
  conflict = true;
  await section.getByRole('button', { name: 'Kích hoạt lại kho' }).click();
  await dialog.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Kho license không còn tạm ngưng');
  await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(section.getByRole('button', { name: 'Tạm ngưng kho' })).toBeVisible();
  conflict = false;
  await section.getByRole('button', { name: 'Tạm ngưng kho' }).click();
  await dialog.getByRole('button', { name: 'Xác nhận tạm ngưng' }).click();
  await expect(dialog).toHaveCount(0);
  expect(writes.at(-1)?.searchParams.has('reason')).toBe(false);
  await section.getByRole('button', { name: 'Kích hoạt lại kho' }).click();
  await dialog.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(dialog).toHaveCount(0);
  expect(writes.at(-1)?.pathname).toBe(`/api/licenses/pool/${poolId}/reactivate`);
  await expect(page.getByText('kho đã quá hạn nên ở trạng thái Đã hết hạn')).toBeVisible();
  await expect(section).toContainText('Đã hết hạn');
  expect(writes).toHaveLength(4);
});
test('WF-04 Admin: manual pool renewal validates, maps BE errors and shows the new expiry', async ({
  page,
}) => {
  await stubApi(page, 'Admin');
  const poolId = '01900000-0000-7000-8000-000000000062';
  const day = (offset: number) =>
    new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  let pool = {
    id: poolId,
    organizationId,
    package: { id: poolId, name: 'Business 50', code: 'BUSINESS_50', packageType: 'Business' },
    totalLicenses: 50,
    usedLicenses: 20,
    availableLicenses: 30,
    status: 'Active',
    purchasedAt: '2026-09-01T00:00:00Z',
    expiresAt: new Date(Date.now() + 10 * 86400000).toISOString(),
    suspendedReason: null as string | null,
    suspendedAt: null as string | null,
    autoRenew: true,
  };
  const bodies: { newExpiresAt: string; additionalSeats: number }[] = [];
  await page.route('http://localhost:5176/api/organizations**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/members'))
      return route.fulfill({ json: { success: true, data: organizationPage([]) } });
    return route.fulfill({
      json: {
        success: true,
        data:
          url.pathname === '/api/organizations'
            ? organizationPage([organizationFixture])
            : organizationFixture,
      },
    });
  });
  await page.route('http://localhost:5176/api/licenses/pool**', (route) => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill({ json: { success: true, data: pool } });
    if (request.method() === 'PATCH') {
      expect(new URL(request.url()).pathname).toBe(`/api/licenses/pool/${poolId}/auto-renew`);
      pool = { ...pool, autoRenew: request.postDataJSON().autoRenew };
      return route.fulfill({ json: { success: true, data: pool } });
    }
    expect(new URL(request.url()).pathname).toBe(`/api/licenses/pool/${poolId}/renew`);
    const body = request.postDataJSON();
    bodies.push(body);
    if (bodies.length === 1)
      return route.fulfill({
        status: 422,
        json: { detail: 'Not after current', errorCode: 'NEW_EXPIRY_NOT_AFTER_CURRENT' },
      });
    pool = {
      ...pool,
      expiresAt: body.newExpiresAt,
      totalLicenses: pool.totalLicenses + body.additionalSeats,
      availableLicenses: pool.availableLicenses + body.additionalSeats,
    };
    return route.fulfill({ json: { success: true, data: pool } });
  });
  await login(page);
  await page.goto('/admin/organizations');
  await page.getByRole('button', { name: 'Xem tổ chức ' + organizationFixture.name }).click();
  const section = page.getByRole('region', { name: 'Kho license' });
  await section.getByRole('button', { name: 'Gia hạn thủ công' }).click();
  const dialog = actionDialog(page);
  await expect(dialog).toContainText('mọi mã đã phát cho gia đình');
  // Not after the current expiry: blocked in the browser, nothing sent.
  await dialog.getByLabel('Ngày hết hạn mới').fill(day(5));
  await dialog.getByRole('button', { name: 'Xác nhận gia hạn' }).click();
  await expect(dialog).toContainText('phải sau ngày hết hạn hiện tại');
  expect(bodies).toHaveLength(0);
  await dialog.getByLabel('Ngày hết hạn mới').fill(day(40));
  await dialog.getByLabel('Số suất thêm').fill('10');
  await dialog.getByRole('button', { name: 'Xác nhận gia hạn' }).click();
  await expect(dialog).toContainText('Tải lại kho để xem hạn mới nhất');
  await dialog.getByRole('button', { name: 'Xác nhận gia hạn' }).click();
  await expect(dialog).toHaveCount(0);
  expect(bodies).toHaveLength(2);
  expect(bodies[1].additionalSeats).toBe(10);
  expect(Date.parse(bodies[1].newExpiresAt)).toBeGreaterThan(Date.now() + 39 * 86400000);
  await expect(page.getByText('Đã gia hạn kho license đến')).toBeVisible();
  await expect(section).toContainText('20/60 suất · còn 40');
  await page.screenshot({ path: 'test-results/wf04-pool-renewed.png', fullPage: true });
  // A suspended pool offers reactivation only, never renewal.
  pool = { ...pool, status: 'Suspended', suspendedAt: '2026-10-22T03:00:00Z' };
  await section.getByRole('button', { name: 'Tải lại kho license' }).click();
  await expect(section.getByRole('button', { name: 'Kích hoạt lại kho' })).toBeVisible();
  await expect(section.getByRole('button', { name: 'Gia hạn thủ công' })).toHaveCount(0);
  // BR-57: Admin can toggle auto-renew on any pool, suspended included.
  const toggle = section.getByRole('switch', { name: 'Tự gia hạn kho' });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(section.getByText('Đã tắt tự gia hạn kho.')).toBeVisible();
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
  await page.route('http://localhost:5176/api/organizations?*', (route) =>
    route.fulfill({ json: { success: true, data: organizationPage([organizationFixture]) } }),
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
  await pick(dialog, 'Tổ chức', 'Trung tâm', /Trung tâm thử nghiệm/);
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
  await expect(dialog.getByRole('alert')).toContainText(
    'Bạn không có quyền thực hiện thao tác này.',
  );
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
  await expect(actionDialog(page).getByLabel('Tổ chức', { exact: true })).toHaveCount(0);
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

// CenterAdmin pickers read active organization accounts from GET /api/users?role=...
async function stubOrgPeople(page: Page, people: { id: string; role: string; orgId: string }[]) {
  await page.route(
    (url) => url.pathname === '/api/users' && url.searchParams.get('pageSize') === '100',
    (route) => {
      const role = new URL(route.request().url()).searchParams.get('role');
      const items = people
        .filter((p) => p.role === role)
        .map((p) => ({
          id: p.id,
          fullName: role === 'Caregiver' ? 'Nhân viên mẫu' : 'VIU mẫu',
          email: p.id.slice(-4) + '@example.test',
          phoneNumber: null,
          role,
          organizationId: p.orgId,
          isActive: true,
          avatarUrl: null,
          deletedAt: null,
          lastLoginAt: null,
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z',
        }));
      return route.fulfill({
        json: { success: true, data: { ...organizationPage(items), pageSize: 100 } },
      });
    },
  );
}

for (const actorRole of ['Admin', 'CenterAdmin']) {
  test(
    '5c ' + actorRole + ': create, permission errors, primary promotion and unlink',
    async ({ page }) => {
      await stubApi(page, actorRole, actorRole === 'CenterAdmin' ? organizationId : null);
      await stubOrgPeople(page, [
        { id, role: 'Caregiver', orgId: organizationId },
        { id: linkedViuId, role: 'VisuallyImpaired', orgId: organizationId },
      ]);
      await stubPeopleSearch(page, { Caregiver: id, VisuallyImpaired: linkedViuId });
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
      if (actorRole === 'CenterAdmin') {
        await dialog.getByLabel('Nhân viên chăm sóc').selectOption(id);
        await dialog.getByLabel('Người được chăm sóc').selectOption(linkedViuId);
      } else {
        await pick(dialog, 'Người chăm sóc *', 'Nhân', /Nhân viên mẫu/);
        await pick(dialog, 'Người được chăm sóc *', 'VIU', /VIU mẫu/);
      }
      await dialog.getByLabel('Tôi xác nhận tạo liên kết giữa các tài khoản trên').check();
      await dialog.getByRole('button', { name: 'Tạo liên kết', exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Chi tiết liên kết' })).toBeVisible();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.screenshot({ path: `test-results/care-link-${actorRole}-desktop.png` });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: `test-results/care-link-${actorRole}-mobile.png` });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.getByRole('button', { name: 'Sửa quyền liên kết', exact: true }).click();
      await dialog.getByLabel('Quản lý gương mặt').check();
      await dialog.getByLabel('Tôi xác nhận cập nhật các quyền trên').check();
      await dialog.getByRole('button', { name: 'Lưu quyền liên kết' }).click();
      await expect(dialog.getByRole('alert')).toContainText(
        'Bạn không có quyền thực hiện thao tác này.',
      );
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
test('5c Caregiver (UC-32–34): primary manages a secondary; secondary only cancels own link', async ({
  page,
}) => {
  await stubApi(page);
  const secondaryId = '01900000-0000-7000-8000-000000000043';
  const secondaryLinkId = '01900000-0000-7000-8000-000000000044';
  let mine = { ...managedLink, linkType: 'Personal', isPrimary: true };
  let secondary = {
    ...managedLink,
    id: secondaryLinkId,
    caregiverId: secondaryId,
    caregiverFullName: 'Người chăm sóc phụ',
    caregiverEmail: 'sub@example.test',
    linkType: 'Personal',
  };
  const writes: { method: string; path: string }[] = [];
  await page.route('http://localhost:5176/api/caregiver-links**', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    // BE scopes a caregiver itself; the Web must not pin caregiverId for the list.
    if (url.pathname === '/api/caregiver-links')
      expect(url.searchParams.has('caregiverId')).toBe(false);
    if (req.method() !== 'GET') writes.push({ method: req.method(), path: url.pathname });
    if (req.method() === 'PUT') secondary = { ...secondary, ...req.postDataJSON() };
    if (req.method() === 'DELETE') {
      if (url.pathname.endsWith(secondaryLinkId))
        secondary = { ...secondary, unlinkedAt: '2026-10-22' };
      else mine = { ...mine, unlinkedAt: '2026-10-22' };
      return route.fulfill({ status: 204 });
    }
    const visible = [mine, ...(mine.isPrimary ? [secondary] : [])].filter((l) => !l.unlinkedAt);
    return route.fulfill({
      json: {
        success: true,
        data:
          url.pathname === '/api/caregiver-links'
            ? organizationPage(visible)
            : url.pathname.includes(secondaryLinkId)
              ? secondary
              : mine,
      },
    });
  });
  await login(page);
  await page.goto('/caregiver/caregivers');
  await page.getByRole('button', { name: 'Xem liên kết ' + secondaryLinkId }).click();
  const info = page.getByRole('dialog', { name: 'Thông tin liên kết', exact: true });
  await expect(info).toContainText('Người chăm sóc phụ');
  await expect(info.getByRole('button', { name: 'Chuyển thành chăm sóc chính' })).toHaveCount(0);
  await info.getByRole('button', { name: 'Sửa quyền liên kết', exact: true }).click();
  await actionDialog(page).getByLabel('Quản lý gương mặt').check();
  await actionDialog(page).getByLabel('Tôi xác nhận cập nhật các quyền trên').check();
  await page.getByRole('button', { name: 'Lưu quyền liên kết' }).click();
  await expect(actionDialog(page)).toHaveCount(0);
  expect(secondary.canManageRegistry).toBe(true);
  await info.getByRole('button', { name: 'Gỡ liên kết', exact: true }).click();
  await actionDialog(page).getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(writes.map((w) => w.method)).toEqual(['PUT', 'DELETE']);
  // Own primary link: always full permissions, so no edit; leaving is still possible.
  await page.getByRole('button', { name: 'Xem liên kết ' + cgLinkId }).click();
  await expect(info.getByRole('button', { name: 'Sửa quyền liên kết', exact: true })).toHaveCount(
    0,
  );
  await expect(info.getByRole('button', { name: 'Hủy liên kết của tôi' })).toBeVisible();
  await info.getByRole('button', { name: 'Đóng hộp thoại' }).click();
  // As a secondary: only cancel own link, permissions decided by the primary.
  mine = { ...mine, isPrimary: false };
  await page.getByRole('button', { name: 'Tải lại', exact: true }).click();
  await page.getByRole('button', { name: 'Xem liên kết ' + cgLinkId }).click();
  await expect(info).toContainText('Bạn là người chăm sóc phụ');
  await expect(info.getByRole('button', { name: 'Sửa quyền liên kết', exact: true })).toHaveCount(
    0,
  );
  await info.getByRole('button', { name: 'Hủy liên kết của tôi' }).click();
  await actionDialog(page).getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(writes.at(-1)).toEqual({ method: 'DELETE', path: '/api/caregiver-links/' + cgLinkId });
});

test('FE-17: Mapbox map shows live positions, stale state and selects a person', async ({
  page,
}) => {
  await stubApi(page);
  const styles: URL[] = [];
  await page.route(mapboxStyles, (route) => {
    styles.push(new URL(route.request().url()));
    return route.fulfill({ json: offlineStyle });
  });
  const fresh = '01900000-0000-7000-8000-000000000051';
  const old = '01900000-0000-7000-8000-000000000052';
  const person = (viuId: string, fullName: string) => ({
    id: viuId,
    fullName,
    email: viuId.slice(-4) + '@test.test',
    phoneNumber: null,
    role: 'VisuallyImpaired',
    organizationId: null,
    isActive: true,
    avatarUrl: null,
    deletedAt: null,
    lastLoginAt: null,
    createdAt: '2026-09-26',
    updatedAt: '2026-09-26',
  });
  await page.route('http://localhost:5176/api/users?*', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: organizationPage([
          person(fresh, 'Người mới cập nhật'),
          person(old, 'Người dữ liệu cũ'),
        ]),
      },
    }),
  );
  await page.route('http://localhost:5176/api/locations/live?*', (route) => {
    const viuId = new URL(route.request().url()).searchParams.get('viuId')!;
    const at = new Date(Date.now() - (viuId === fresh ? 30_000 : 10 * 60_000)).toISOString();
    return route.fulfill({
      json: {
        success: true,
        data: {
          userId: viuId,
          latitude: viuId === fresh ? 10.7769 : 10.7626,
          longitude: viuId === fresh ? 106.7009 : 106.6602,
          formattedAddress: 'Địa chỉ thử',
          street: null,
          district: null,
          city: null,
          geocodeProvider: null,
          cachedAt: at,
          updatedAt: at,
        },
      },
    });
  });
  await page.route('http://localhost:5176/api/locations/history?*', (route) =>
    route.fulfill({ json: { success: true, data: { ...organizationPage([]), pageSize: 20 } } }),
  );
  await login(page);
  await page.goto('/caregiver/map');
  const map = page.getByRole('region', { name: /Bản đồ vị trí/ });
  await expect(map).toBeVisible();
  await expect(map.locator('canvas.mapboxgl-canvas')).toHaveCount(1);
  const freshMarker = page.getByRole('button', {
    name: 'Người mới cập nhật · Ghi nhận trong 2 phút gần đây',
  });
  const oldMarker = page.getByRole('button', { name: 'Người dữ liệu cũ · Dữ liệu cũ hơn 2 phút' });
  await expect(freshMarker).toBeVisible();
  await expect(oldMarker).toHaveClass(/stale/);
  expect(styles[0]?.pathname).toContain('/styles/v1/mapbox/streets-v12');
  await page.screenshot({ path: 'test-results/fe17-map-desktop.png', fullPage: true });
  await oldMarker.click();
  await expect(
    page.getByRole('heading', { name: 'Người dữ liệu cũ — vị trí & lịch sử' }),
  ).toBeVisible();
  await expect(oldMarker).toHaveClass(/selected/);
  // Popup content is plain text from the live API (address and recorded time).
  const popup = page.locator('.mapboxgl-popup');
  await expect(popup).toContainText('Người dữ liệu cũ');
  await expect(popup).toContainText('Địa chỉ thử');
  await expect(popup).toContainText('Ghi nhận GPS:');
  await page.locator('.gps-map').screenshot({ path: 'test-results/fe17-map-popup.png' });
  await expect(page.getByRole('alert')).toHaveCount(0);
  // Satellite toggle swaps the style, keeps markers and is remembered for this viewer.
  const types = page.getByRole('group', { name: 'Kiểu bản đồ' });
  await types.getByRole('button', { name: 'Vệ tinh' }).click();
  await expect
    .poll(() => styles.at(-1)?.pathname)
    .toContain('/styles/v1/mapbox/satellite-streets-v12');
  await expect(types.getByRole('button', { name: 'Vệ tinh' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(oldMarker).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('group', { name: 'Kiểu bản đồ' }).getByRole('button', { name: 'Vệ tinh' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => styles.at(-1)?.pathname).toContain('satellite-streets-v12');
  await expect(freshMarker).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await page.screenshot({ path: 'test-results/fe17-map-mobile.png', fullPage: true });
});

test('FE-17: Mapbox failure keeps the coordinate table usable', async ({ page }) => {
  await stubApi(page);
  const viuId = '01900000-0000-7000-8000-000000000053';
  await page.route('http://localhost:5176/api/users?*', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: organizationPage([
          {
            id: viuId,
            fullName: 'Người thử lỗi bản đồ',
            email: 'map@test.test',
            phoneNumber: null,
            role: 'VisuallyImpaired',
            organizationId: null,
            isActive: true,
            avatarUrl: null,
            deletedAt: null,
            lastLoginAt: null,
            createdAt: '2026-09-26',
            updatedAt: '2026-09-26',
          },
        ]),
      },
    }),
  );
  await page.route('http://localhost:5176/api/locations/live?*', (route) =>
    route.fulfill({ status: 404, json: { detail: 'No GPS cache' } }),
  );
  await page.route(mapboxStyles, (route) =>
    route.fulfill({ status: 401, json: { message: 'Not Authorized - Invalid Token' } }),
  );
  await login(page);
  await page.goto('/caregiver/map');
  await expect(page.getByRole('alert')).toContainText('Không tải được bản đồ Mapbox (401)');
  await expect(page.getByRole('cell', { name: /Người thử lỗi bản đồ/ }).first()).toBeVisible();
  await expect(page.getByText('Chưa có vị trí khả dụng', { exact: true })).toBeVisible();
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
          : url.pathname.endsWith('/called')
            ? 'Called'
            : 'Acknowledged';
      history.push({
        id: `01900000-0000-7000-8000-${String(history.length + 10).padStart(12, '0')}`,
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
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: 'test-results/refactor-alert-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'test-results/refactor-alert-mobile.png' });
    await page.setViewportSize({ width: 1440, height: 900 });
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
    // WF-01: confirming a call is manual and final; it is not offered after Called.
    state = 'Escalated';
    await page.reload();
    await page.getByRole('button', { name: 'Xem chi tiết' }).click();
    await page.getByRole('button', { name: 'Xác nhận đã gọi hỗ trợ', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Xác nhận đã gọi hỗ trợ' })).toContainText(
      'Web không tự gọi',
    );
    expect(writes).toBe(3);
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Máy chủ đã xác nhận cập nhật.');
    await expect(
      page.getByRole('button', { name: 'Xác nhận đã gọi hỗ trợ', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Đánh dấu đã giải quyết', exact: true }),
    ).toHaveCount(0);
    expect(writes).toBe(4);
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

test('BR-29: Sent alert past 5 minutes shows the 115 banner and opens the alert to escalate', async ({
  page,
}) => {
  await stubApi(page);
  const viu = '01900000-0000-7000-8000-000000000002';
  let state = 'Sent';
  const sentAt = new Date(Date.now() - 7 * 60000).toISOString();
  const event = () => ({
    id,
    visuallyImpairedUserId: viu,
    detectionMethod: 'Manual',
    currentStatus: state,
    latitude: null,
    longitude: null,
    notes: null,
    snapshotPath: null,
    detectedAt: sentAt,
    gracePeriodEndsAt: null,
    sentAt,
    acknowledgedAt: null,
    acknowledgedBy: null,
    escalatedAt: null,
    resolvedAt: null,
    resolvedBy: null,
    dismissedAt: null,
  });
  const statusQueries: (string | null)[] = [];
  await page.route('http://localhost:5176/api/emergency-events**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname !== '/api/emergency-events')
      return route.fulfill({ json: { success: true, data: { ...event(), statusHistory: [] } } });
    const status = url.searchParams.get('status');
    statusQueries.push(status);
    const items = !status || status === state ? [event()] : [];
    return route.fulfill({
      json: { success: true, data: { ...organizationPage(items), pageSize: 20 } },
    });
  });
  await login(page);
  await page.goto('/caregiver/alerts');
  const banner = page.getByRole('region', { name: 'Gợi ý chuyển cấp lên 115' });
  await expect(banner).toContainText('Chưa có ai tiếp nhận sau 7 phút — cân nhắc gọi 115.');
  await expect(banner.getByRole('status')).toHaveText(
    '1 cảnh báo chưa có ai tiếp nhận sau hơn 5 phút.',
  );
  await expect(banner.getByRole('link', { name: 'Mở trình gọi 115' })).toHaveAttribute(
    'href',
    'tel:115',
  );
  expect(statusQueries).toContain('Sent');
  await page.screenshot({ path: 'test-results/br29-escalation-banner.png', fullPage: true });
  await banner.getByRole('button', { name: 'Xem và chuyển cấp' }).click();
  await expect(page.getByRole('dialog', { name: 'Chi tiết cảnh báo' })).toBeVisible();
  await page.keyboard.press('Escape');
  // Once someone acknowledges, the next refresh drops the suggestion.
  state = 'Acknowledged';
  await page.getByRole('button', { name: 'Tải lại cảnh báo' }).click();
  await expect(banner).toHaveCount(0);
});
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
  await page.getByRole('button', { name: 'Menu tài khoản' }).click();
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
  await expect(actionDialog(page).getByRole('alert')).toHaveText(
    'Bạn không có quyền thực hiện thao tác này.',
  );
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
  await page.route('http://localhost:5176/api/licenses/pool?*', (route) =>
    route.fulfill({ status: 404, json: { detail: 'License pool not found' } }),
  );
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
    // .dialog caps at 100dvh - 64px and scrolls its body.
    expect(box!.height).toBeLessThanOrEqual(1000 - 64);
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
  await page.getByRole('button', { name: 'Menu tài khoản' }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByText('Personal', { exact: true })).toHaveCount(0);
});

test('UC-80: cancel renewal confirms, maps org-key error and keeps access until period end', async ({
  page,
}) => {
  await stubApi(page);
  const expiry = new Date(Date.now() + 20 * 86400000).toISOString();
  let cancelledAt = '';
  let deletes = 0;
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
          licenseStatus: 'Active',
          licenseExpiresAt: expiry,
        },
      },
    }),
  );
  await page.route('**/api/licenses/subscription', (route) => {
    if (route.request().method() === 'DELETE') {
      deletes++;
      return deletes === 1
        ? route.fulfill({
            status: 422,
            json: { detail: 'Org plan', errorCode: 'CANNOT_CANCEL_ORG_SUBSCRIPTION' },
          })
        : ((cancelledAt = '2026-10-22T03:00:00Z'),
          route.fulfill({ json: { success: true, data: null } }));
    }
    return route.fulfill({
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
          autoRenew: !cancelledAt,
          daysRemaining: 20,
          ...(cancelledAt ? { cancelledAt } : {}),
        },
      },
    });
  });
  await login(page);
  await page.goto('/license');
  await page.getByRole('button', { name: 'Hủy gia hạn', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Hủy gia hạn gói' });
  await expect(dialog).toContainText('Hủy gia hạn gói Personal?');
  await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(deletes).toBe(0);
  await page.getByRole('button', { name: 'Hủy gia hạn', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(dialog.getByRole('alert')).toContainText('key của trung tâm');
  await dialog.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(dialog).toHaveCount(0);
  expect(deletes).toBe(2);
  await expect(
    page.getByRole('status').filter({ hasText: 'Sau đó gói không tự gia hạn' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hủy gia hạn', exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/uc80-cancelled.png', fullPage: true });
  await expect(page.locator('.license-details')).toContainText('Tắt');
  // After reload only the BE-provided cancelledAt keeps the button hidden.
  await page.reload();
  await expect(
    page.getByRole('status').filter({ hasText: 'Sau đó gói không tự gia hạn' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hủy gia hạn', exact: true })).toHaveCount(0);
  expect(deletes).toBe(2);
});

test('auto-renew switch: off/on via PATCH, resumes a cancelled plan, maps BE error, Trial disabled', async ({
  page,
}) => {
  await stubApi(page);
  const expiry = new Date(Date.now() + 20 * 86400000).toISOString();
  let sub = {
    id,
    status: 'Active',
    package: { id, name: 'Personal', code: 'PERSONAL', packageType: 'Personal' },
    startedAt: '2026-10-01T00:00:00Z',
    trialEndsAt: null as string | null,
    currentPeriodStart: '2026-10-01T00:00:00Z',
    currentPeriodEnd: expiry as string | null,
    autoRenew: true,
    daysRemaining: 20,
    cancelledAt: null as string | null,
    isOrgIssued: false,
  };
  const patches: boolean[] = [];
  let fail = false;
  await page.route('**/api/licenses/subscription**', (route) => {
    const request = route.request();
    if (request.method() === 'PATCH') {
      expect(new URL(request.url()).pathname).toBe(`/api/licenses/subscription/${id}/auto-renew`);
      const { autoRenew } = request.postDataJSON();
      patches.push(autoRenew);
      if (fail)
        return route.fulfill({
          status: 422,
          json: { detail: 'not active', errorCode: 'SUBSCRIPTION_NOT_ACTIVE' },
        });
      sub = { ...sub, autoRenew, ...(autoRenew ? { cancelledAt: null } : {}) };
      return route.fulfill({ json: { success: true, data: sub } });
    }
    if (request.method() === 'DELETE') {
      sub = { ...sub, autoRenew: false, cancelledAt: '2026-10-22T03:00:00Z' };
      return route.fulfill({ json: { success: true, data: null } });
    }
    return route.fulfill({ json: { success: true, data: sub } });
  });
  await login(page);
  await page.goto('/license');
  const toggle = page.getByRole('switch', { name: 'Tự gia hạn' });
  await expect(toggle).toBeChecked();
  await expect(page.locator('#auto-renew-hint')).toContainText('Không tự trừ tiền');
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(page.getByText('Đã tắt tự gia hạn.')).toBeVisible();
  // Cancel, then turning it back on resumes the plan and brings the cancel button back.
  await page.getByRole('button', { name: 'Hủy gia hạn', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Hủy gia hạn gói' })
    .getByRole('button', { name: 'Xác nhận' })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Sau đó gói không tự gia hạn' }),
  ).toBeVisible();
  await expect(page.locator('#auto-renew-hint')).toContainText('Bật lại để tiếp tục');
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(page.getByRole('button', { name: 'Hủy gia hạn', exact: true })).toBeVisible();
  expect(patches).toEqual([false, true]);
  fail = true;
  await toggle.click();
  await expect(page.getByRole('alert')).toContainText('Gói không còn hiệu lực');
  await expect(toggle).toBeChecked();
  await page.screenshot({ path: 'test-results/auto-renew-switch.png', fullPage: true });
  // Trial: switch disabled with the reason; no request.
  fail = false;
  sub = { ...sub, status: 'Trial', autoRenew: false, trialEndsAt: expiry, currentPeriodEnd: null };
  await page.reload();
  await expect(toggle).toBeDisabled();
  await expect(page.locator('#auto-renew-hint')).toContainText('Gói dùng thử không tự gia hạn');
  await expect(page.getByRole('button', { name: 'Hủy gia hạn', exact: true })).toHaveCount(0);
  expect(patches).toHaveLength(3);
});
test('UC-80: org-issued personal plan shows no cancel-renewal button', async ({ page }) => {
  await stubApi(page);
  await page.route('**/api/licenses/subscription', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          id,
          status: 'Active',
          package: { id, name: 'Personal', code: 'PERSONAL', packageType: 'Personal' },
          startedAt: '2026-10-01T00:00:00Z',
          trialEndsAt: null,
          currentPeriodStart: '2026-10-01T00:00:00Z',
          currentPeriodEnd: new Date(Date.now() + 20 * 86400000).toISOString(),
          autoRenew: false,
          daysRemaining: 20,
          cancelledAt: null,
          isOrgIssued: true,
        },
      },
    }),
  );
  await login(page);
  await page.goto('/license');
  await expect(page.getByText('key của trung tâm. Liên hệ quản trị trung tâm')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hủy gia hạn', exact: true })).toHaveCount(0);
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
    await expect(page.getByRole('heading', { name: 'Gói sử dụng cá nhân' })).toHaveCount(0);
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
    page.getByText('Máy chủ chưa tìm thấy thông tin gói sử dụng cho tài khoản này.'),
  ).toBeVisible();
  await page.route('**/api/licenses/subscription', (route) =>
    route.fulfill({ status: 503, json: { detail: 'Server unavailable' } }),
  );
  await page.getByRole('button', { name: 'Tải lại thông tin license' }).click();
  await expect(page.getByRole('alert')).toContainText('Máy chủ đang gặp sự cố');
  await expect(page.getByText('Đang hoạt động', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Menu tài khoản' }).click();
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
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: `test-results/redesign-packages-${role}.png`, fullPage: true });
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
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'test-results/redesign-checkout-1440.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/redesign-checkout-390.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
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
  const subscriptionReadsBeforeReturn = subReads;
  await page.goto('/payments/return?orderCode=' + u3Order + '&status=PAID');
  await expect(page.getByRole('status')).toHaveText('Đang chờ thanh toán');
  expect(subReads).toBe(subscriptionReadsBeforeReturn);
  const before = profileReads;
  status = 'Success';
  await page.getByRole('button', { name: 'Kiểm tra lại thanh toán' }).click();
  await expect(page.getByText('Thanh toán thành công', { exact: true })).toBeVisible();
  await expect(page.getByText(/Gói sử dụng hiện tại: Đang hoạt động/)).toBeVisible();
  await expect.poll(() => profileReads).toBeGreaterThan(before);
  expect(subReads).toBeGreaterThan(subscriptionReadsBeforeReturn);
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
test('BR-57: CenterAdmin toggles pool auto-renew, failure keeps the server value', async ({
  page,
}) => {
  await stubApi(page, 'CenterAdmin', id);
  let pool = { ...u3Pool(), autoRenew: false };
  const patches: boolean[] = [];
  let fail = false;
  await page.route('**/api/licenses/pool**', (route) => {
    const request = route.request();
    if (request.method() === 'PATCH') {
      expect(new URL(request.url()).pathname).toBe(`/api/licenses/pool/${id}/auto-renew`);
      const { autoRenew } = request.postDataJSON();
      patches.push(autoRenew);
      if (fail) return route.fulfill({ status: 403, json: { detail: 'Forbidden' } });
      pool = { ...pool, autoRenew };
      return route.fulfill({ json: { success: true, data: pool } });
    }
    return route.fulfill({ json: { success: true, data: pool } });
  });
  await page.route('**/api/licenses/assignments?**', (route) =>
    route.fulfill({ json: { success: true, data: organizationPage([]) } }),
  );
  await login(page);
  await page.goto('/center-admin/licenses');
  const toggle = page.getByRole('switch', { name: 'Tự gia hạn kho' });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(page.getByText('Đã bật tự gia hạn kho.')).toBeVisible();
  await page.screenshot({ path: 'test-results/br57-pool-auto-renew.png', fullPage: true });
  fail = true;
  await toggle.click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(toggle).toBeChecked();
  expect(patches).toEqual([true, false]);
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
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'test-results/care-contacts-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/care-contacts-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 900 });
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
  await page.getByRole('button', { name: 'Menu tài khoản' }).click();
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
  await stubOrgPeople(page, [{ id: viuId, role: 'VisuallyImpaired', orgId: id }]);
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
  await expect(page.getByRole('cell', { name: /VIU U4/ })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'test-results/redesign-license-pool-1440.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/redesign-license-pool-390.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
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
  await page.getByLabel('Người được chăm sóc').selectOption(viuId);
  conflict = true;
  await page.getByRole('button', { name: 'Xác nhận cấp license' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Suất cuối');
  await expect(page.getByLabel('Người được chăm sóc')).toHaveValue(viuId);
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
  await expect(page.getByRole('alert')).toContainText('Máy chủ đang gặp sự cố');
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

for (const kind of ['saved-locations', 'geofences'] as const) {
  test(`9: ${kind} CRUD, read-only/revoked permissions, license and delete failures`, async ({
    page,
  }) => {
    await stubApi(page);
    const viuId = '01900000-0000-7000-8000-000000000071';
    const zone = kind === 'geofences';
    let canManage = false;
    let exists = false;
    let failDelete = true;
    let expired = false;
    const writes: string[] = [];
    let item: Record<string, unknown> = {
      id,
      visuallyImpairedUserId: viuId,
      name: 'Nhà test',
      latitude: 0,
      longitude: 106.81,
      isActive: true,
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
      ...(zone
        ? { radiusMeters: 300, alertOnExit: true, alertOnEnter: false }
        : { arrivalRadiusMeters: 50, description: '', ttsAnnouncement: '' }),
    };
    await page.route('**/api/users?**', (route) =>
      route.fulfill({
        json: {
          success: true,
          data: organizationPage([
            {
              id: viuId,
              fullName: 'VIU địa điểm',
              email: 'viu@example.test',
              phoneNumber: null,
              role: 'VisuallyImpaired',
              organizationId: null,
              isActive: true,
            },
          ]),
        },
      }),
    );
    await page.route('**/api/caregiver-links?**', (route) =>
      route.fulfill({
        json: {
          success: true,
          data: organizationPage([
            {
              id,
              caregiverId: id,
              visuallyImpairedUserId: viuId,
              viuFullName: 'VIU địa điểm',
              isPrimary: false,
              linkType: 'Personal',
              canReceiveAlerts: false,
              canManageRegistry: false,
              canManageLocations: canManage,
              linkedAt: '',
              unlinkedAt: null,
            },
          ]),
        },
      }),
    );
    await page.route(/\/api\/(saved-locations|geofences)/, (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const list = url.pathname === `/api/${kind}`;
      if (expired)
        return route.fulfill({ status: 402, json: { detail: 'License hết hạn thử nghiệm.' } });
      if (request.method() !== 'GET') {
        writes.push(request.method());
        if (request.method() === 'DELETE') {
          if (failDelete)
            return route.fulfill({ status: 500, json: { detail: 'Không thể xóa lúc này.' } });
          exists = false;
          return route.fulfill({ status: 204 });
        }
        item = { ...item, ...request.postDataJSON() };
        exists = true;
      }
      const matches =
        !url.searchParams.has('isActive') ||
        String(item.isActive) === url.searchParams.get('isActive');
      return route.fulfill({
        json: {
          success: true,
          data:
            request.method() === 'GET' && list
              ? organizationPage(exists && matches ? [item] : [])
              : url.pathname.endsWith('/' + id) || request.method() !== 'GET'
                ? item
                : organizationPage([]),
        },
      });
    });
    await login(page);
    await page.goto('/caregiver/locations');
    await page
      .getByRole('combobox', { name: 'Người được chăm sóc', exact: true })
      .selectOption(viuId);
    if (zone) await page.getByRole('button', { name: 'Vùng an toàn', exact: true }).click();
    const add = page.getByRole('button', {
      name: zone ? 'Thêm vùng an toàn' : 'Thêm địa điểm',
      exact: true,
    });
    await expect(add).toBeDisabled();
    await expect(page.getByText('Bạn có quyền xem.', { exact: false })).toBeVisible();
    canManage = true;
    await page.getByRole('button', { name: 'Tải lại địa điểm', exact: true }).click();
    await expect(add).toBeEnabled();
    await add.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Vĩ độ')).toHaveValue('');
    await dialog.getByLabel('Tên', { exact: false }).fill('Nhà test');
    await dialog.getByLabel('Vĩ độ').fill('0');
    await dialog.getByLabel('Kinh độ').fill('106.81');
    await dialog.getByLabel('Bán kính').fill('1');
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(dialog.getByRole('alert')).toContainText('tối thiểu');
    expect(writes).toEqual([]);
    await dialog.getByLabel('Bán kính').fill(zone ? '300' : '50');
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('cell', { name: 'Nhà test', exact: !zone })).toBeVisible();
    await page.getByRole('button', { name: 'Xem và sửa' }).click();
    await expect(dialog.getByLabel('Vĩ độ')).toHaveValue('0');
    await dialog.getByLabel('Hoạt động', { exact: true }).uncheck();
    if (zone) await dialog.getByLabel('Cảnh báo khi đi vào').check();
    else await dialog.getByLabel('Lời nhắc khi đến nơi').fill('Đã đến nhà.');
    await page.screenshot({ path: `test-results/stage9-${kind}-desktop.png` });
    await page.setViewportSize({ width: 375, height: 812 });
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
    await page.screenshot({ path: `test-results/stage9-${kind}-mobile.png` });
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(dialog).toHaveCount(0);
    await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).selectOption('true');
    await expect(page.getByText('Chưa có địa điểm phù hợp.', { exact: true })).toBeVisible();
    await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).selectOption('false');
    await expect(page.getByRole('button', { name: 'Xem và sửa' })).toBeVisible();
    await page.getByRole('button', { name: 'Xóa', exact: true }).click();
    await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
    expect(writes).toEqual(['POST', 'PUT']);
    await page.getByRole('button', { name: 'Xóa', exact: true }).click();
    await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    expect(exists).toBe(true);
    failDelete = false;
    await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('Chưa có địa điểm phù hợp.', { exact: true })).toBeVisible();
    await add.click();
    await dialog.getByLabel('Tên', { exact: false }).fill('Không được tạo');
    await dialog.getByLabel('Vĩ độ').fill('10');
    await dialog.getByLabel('Kinh độ').fill('106');
    canManage = false;
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByText('Bạn có quyền xem.', { exact: false })).toBeVisible();
    expect(writes).toEqual(['POST', 'PUT', 'DELETE', 'DELETE']);
    await page.keyboard.press('Escape');
    expired = true;
    await page.getByRole('button', { name: 'Tải lại địa điểm', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Xem trạng thái license' })).toBeVisible();
    await expect(page).toHaveURL(/caregiver\/locations/);
  });
}

test('license gate: unpaid caregiver is sent to plans, paid caregiver opens licensed screens', async ({
  page,
}) => {
  await stubApi(page);
  let license: { licenseStatus: string | null; licenseExpiresAt: string | null } = {
    licenseStatus: null,
    licenseExpiresAt: null,
  };
  const linkedCalls: string[] = [];
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
          ...license,
        },
      },
    }),
  );
  await page.route('**/api/caregiver-links?*', (route) => {
    linkedCalls.push(route.request().url());
    return route.fulfill({ json: { success: true, data: organizationPage([]) } });
  });
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Unpaid: licensed screen shows the plan screen and calls no blocked API.
  await page.goto('/caregiver/contacts');
  await expect(
    page.getByRole('heading', { name: 'Cần gói dịch vụ để dùng chức năng này' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Chọn gói Personal' })).toHaveAttribute(
    'href',
    '/packages',
  );
  await expect(page.getByRole('link', { name: 'Kích hoạt bằng key' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Liên hệ khẩn cấp \(cần gói dịch vụ\)/ }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Cảnh báo khẩn cấp \(cần gói/ })).toHaveCount(0);
  expect(linkedCalls).toHaveLength(0);
  await page.screenshot({ path: 'test-results/license-gate-unpaid.png' });

  // Expired past grace: renewal wording.
  license = {
    licenseStatus: 'Expired',
    licenseExpiresAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  };
  await page.reload();
  await expect(page.getByRole('link', { name: 'Gia hạn gói Personal' })).toBeVisible();

  // Paid: the same screen loads normally.
  license = {
    licenseStatus: 'Active',
    licenseExpiresAt: new Date(Date.now() + 20 * 86400000).toISOString(),
  };
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Liên hệ khẩn cấp' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Cần gói dịch vụ để dùng chức năng này' }),
  ).toHaveCount(0);
  await expect(page.getByRole('link', { name: /\(cần gói dịch vụ\)/ })).toHaveCount(0);
});
