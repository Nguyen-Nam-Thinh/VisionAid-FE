import { expect, it, vi } from 'vitest';
import { createConfigurationsApi, validateConfigValue, type SystemConfig } from './configurations';
const id = '01900000-0000-7000-8000-000000000001';
const other = '01900000-0000-7000-8000-000000000002';
const actor = { role: 'Admin' as const };
const config: SystemConfig = {
  id,
  configKey: 'trial_days_default',
  configValue: '7',
  valueType: 'Integer',
  category: 'BusinessRules',
  description: null,
  minValue: '1',
  maxValue: '30',
  isPublic: false,
  updatedAt: '2026-10-11T00:00:00Z',
  updatedBy: null,
  reviewed: true,
};
const entry = {
  id: other,
  configId: id,
  configKey: config.configKey,
  oldValue: '5' as string | null,
  newValue: '7',
  changedBy: null,
  changedAt: config.updatedAt,
  reason: null,
};
const paged = (items: unknown[]) => ({
  items,
  page: 1,
  pageSize: 20,
  totalCount: items.length,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});
function fixture() {
  const row = { ...config };
  const history = { ...entry };
  const get = vi.fn<NonNullable<Parameters<typeof createConfigurationsApi>[0]>>(async (path) =>
    path.includes('/history?')
      ? paged([history])
      : path.startsWith('/api/system-configs?')
        ? paged([row])
        : row,
  );
  const write = vi.fn<NonNullable<Parameters<typeof createConfigurationsApi>[1]>>(
    async (_path, init) => ({
      ...row,
      configValue:
        init.method === 'POST' ? history.oldValue : JSON.parse(String(init.body)).configValue,
    }),
  );
  return { api: createConfigurationsApi(get, write), get, write, row, history };
}
it('configuration filters and cancellation are sent to server; unknown keys are redacted before cache', async () => {
  const f = fixture(),
    signal = new AbortController().signal;
  await f.api.list(actor, 1, 'trial', 'BusinessRules', signal);
  expect(f.get).toHaveBeenCalledWith(
    '/api/system-configs?page=1&pageSize=10&search=trial&category=BusinessRules',
    signal,
  );
  f.row.configKey = 'payos_checksum_key';
  f.row.configValue = 'SECRET';
  f.row.description = 'SECRET';
  const item = (await f.api.list(actor, 1, '', '')).items[0];
  expect(item.configValue).toBe('');
  expect(item.description).toBeNull();
  expect(item.reviewed).toBe(false);
  await expect(f.api.detail(actor, id)).rejects.toMatchObject({ status: 403 });
  await expect(
    f.api.history(actor, { ...config, configKey: f.row.configKey }, 1),
  ).rejects.toMatchObject({ status: 403 });
});
it('non-admin cannot read/write and invalid identifiers are rejected', async () => {
  const f = fixture();
  await expect(f.api.list({ role: 'Caregiver' }, 1, '', '')).rejects.toMatchObject({ status: 403 });
  await expect(f.api.save({ role: 'CenterAdmin' }, config, '8', '')).rejects.toMatchObject({
    status: 403,
  });
  await expect(f.api.detail(actor, 'bad')).rejects.toMatchObject({ status: 400 });
  expect(f.get).not.toHaveBeenCalled();
  expect(f.write).not.toHaveBeenCalled();
});
it('validates integer, decimal bounds, boolean, JSON and enum strings without coercion', () => {
  for (const value of ['0', '31', '2.5', '2147483648', 'NaN', ''])
    expect(() => validateConfigValue(config, value)).toThrow();
  expect(() => validateConfigValue(config, '8')).not.toThrow();
  const decimal = { ...config, valueType: 'Decimal' as const, minValue: '0', maxValue: '1' };
  for (const value of ['1.1', '0,5', 'Infinity'])
    expect(() => validateConfigValue(decimal, value)).toThrow();
  expect(() => validateConfigValue(decimal, '0')).not.toThrow();
  expect(() => validateConfigValue({ ...config, valueType: 'Boolean' }, 'TRUE')).toThrow();
  expect(() => validateConfigValue({ ...config, valueType: 'Boolean' }, 'false')).not.toThrow();
  expect(() => validateConfigValue({ ...config, valueType: 'Json' }, '{bad}')).toThrow();
  expect(() =>
    validateConfigValue({ ...config, valueType: 'Json' }, '{"enabled":true}'),
  ).not.toThrow();
  expect(() =>
    validateConfigValue({ ...config, valueType: 'String', configKey: 'payos_environment' }, 'prod'),
  ).toThrow();
});
it('save sends exact string and reason, rechecks snapshot and validates returned identity', async () => {
  const f = fixture();
  await f.api.save(actor, config, '8', '  review  ');
  expect(f.write).toHaveBeenCalledWith(
    `/api/system-configs/${id}`,
    expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ configValue: '8', reason: 'review' }),
    }),
  );
  f.row.configValue = '9';
  await expect(f.api.save(actor, config, '8', '')).rejects.toMatchObject({ status: 409 });
  expect(f.write).toHaveBeenCalledTimes(1);
  f.row.configValue = '7';
  f.write.mockResolvedValue({ ...config, id: other, configValue: '8' });
  await expect(f.api.save(actor, config, '8', '')).rejects.toMatchObject({ status: 502 });
});
it('rollback targets oldValue, verifies history ownership and revalidates current constraints', async () => {
  const f = fixture();
  const result = await f.api.rollback(actor, config, entry, 1, 'rollback');
  expect(result.configValue).toBe('5');
  expect(f.write).toHaveBeenCalledWith(
    `/api/system-configs/${id}/rollback`,
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ historyId: other, reason: 'rollback' }),
    }),
  );
  f.history.oldValue = null;
  await expect(f.api.rollback(actor, config, entry, 1, '')).rejects.toMatchObject({ status: 409 });
  f.history.oldValue = '99';
  await expect(
    f.api.rollback(actor, config, { ...entry, oldValue: '99' }, 1, ''),
  ).rejects.toMatchObject({ status: 400 });
  f.history.configId = other;
  await expect(f.api.history(actor, config, 1)).rejects.toMatchObject({ status: 403 });
  expect(f.write).toHaveBeenCalledTimes(1);
});
it('does not retry ambiguous writes or treat server errors as empty history', async () => {
  const f = fixture();
  f.write.mockRejectedValue(new Error('network'));
  await expect(f.api.save(actor, config, '8', '')).rejects.toThrow('network');
  expect(f.write).toHaveBeenCalledTimes(1);
  f.get.mockRejectedValue(new Error('server'));
  await expect(f.api.history(actor, config, 1)).rejects.toThrow('server');
});
