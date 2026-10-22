import { z } from 'zod';
import { apiGet } from './adapter';

// Defaults mirror BE BusinessRules; BE reads the same keys and stays authoritative.
export const LIMIT_DEFAULTS = {
  'caregiving.max_vius_per_caregiver': 3,
  'caregiving.max_caregivers_per_viu': 3,
  'face_registry.max_persons_per_registry': 20,
  'face_registry.min_photos_to_activate': 3,
  'location.max_saved_locations_per_user': 20,
  'emergency.max_contacts_per_user': 5,
} as const;
export type LimitKey = keyof typeof LIMIT_DEFAULTS;
export type Limits = Record<LimitKey, number>;

const pageSchema = z.object({
  items: z.array(z.object({ configKey: z.string(), configValue: z.string() })),
  hasNextPage: z.boolean(),
});
const MAX_PAGES = 10;

/** Reads every page of GET /api/system-configs/public; any failure falls back to the defaults. */
export async function fetchLimits(get = apiGet, signal?: AbortSignal): Promise<Limits> {
  const limits: Limits = { ...LIMIT_DEFAULTS };
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const query = new URLSearchParams({ page: String(page), pageSize: '100' });
      const data = pageSchema.parse(await get(`/api/system-configs/public?${query}`, signal));
      for (const { configKey, configValue } of data.items) {
        const value = Number(configValue);
        if (configKey in LIMIT_DEFAULTS && /^\d+$/.test(configValue.trim()) && value > 0)
          limits[configKey as LimitKey] = value;
      }
      if (!data.hasNextPage) break;
    }
  } catch (error) {
    if (signal?.aborted) throw error;
    return { ...LIMIT_DEFAULTS };
  }
  return limits;
}
