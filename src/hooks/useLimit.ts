import { useQuery } from '@tanstack/react-query';
import { service } from '../services';
import { fetchLimits, LIMIT_DEFAULTS, type LimitKey } from '../services/api/limits';

/** Admin-configurable limit for UX hints; BE still enforces it. Uses the default until loaded or on error. */
export function useLimit(key: LimitKey): number {
  const { data } = useQuery({
    queryKey: ['public-limits'],
    queryFn: ({ signal }) => fetchLimits(undefined, signal),
    enabled: service.mode === 'api',
    staleTime: 5 * 60_000,
    retry: false,
  });
  return data?.[key] ?? LIMIT_DEFAULTS[key];
}
