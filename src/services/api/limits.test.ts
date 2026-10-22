import { expect, it, vi } from 'vitest';
import { fetchLimits, LIMIT_DEFAULTS } from './limits';
import { ServiceError } from '../contracts';

const item = (configKey: string, configValue: string) => ({
  configKey,
  configValue,
  valueType: 'Integer',
  isPublic: true,
});
const page = (items: unknown[], hasNextPage = false) => ({
  items,
  page: 1,
  pageSize: 100,
  totalCount: items.length,
  totalPages: 1,
  hasNextPage,
  hasPreviousPage: false,
});

it('reads every public page and overrides only known positive integer limits', async () => {
  const get = vi
    .fn()
    .mockResolvedValueOnce(
      page(
        [
          item('face_registry.max_persons_per_registry', '2'),
          item('hybrid_navigation_enabled', 'true'),
          item('emergency.max_contacts_per_user', '0'),
        ],
        true,
      ),
    )
    .mockResolvedValueOnce(
      page([
        item('location.max_saved_locations_per_user', '7'),
        item('face_registry.min_photos_to_activate', '2.5'),
      ]),
    );
  expect(await fetchLimits(get)).toEqual({
    ...LIMIT_DEFAULTS,
    'face_registry.max_persons_per_registry': 2,
    'location.max_saved_locations_per_user': 7,
  });
  expect(get.mock.calls.map((c) => c[0])).toEqual([
    '/api/system-configs/public?page=1&pageSize=100',
    '/api/system-configs/public?page=2&pageSize=100',
  ]);
});

it('falls back to the defaults on request or contract errors', async () => {
  expect(await fetchLimits(vi.fn().mockRejectedValue(new ServiceError('down', 503)))).toEqual(
    LIMIT_DEFAULTS,
  );
  expect(await fetchLimits(vi.fn().mockResolvedValue({ items: 'bad' }))).toEqual(LIMIT_DEFAULTS);
  // A partial first page must not leak into the fallback.
  const partial = vi
    .fn()
    .mockResolvedValueOnce(page([item('emergency.max_contacts_per_user', '9')], true))
    .mockRejectedValueOnce(new ServiceError('down', 503));
  expect(await fetchLimits(partial)).toEqual(LIMIT_DEFAULTS);
});

it('rethrows when the caller aborted', async () => {
  const controller = new AbortController();
  controller.abort();
  const get = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
  await expect(fetchLimits(get, controller.signal)).rejects.toThrow('Aborted');
});
