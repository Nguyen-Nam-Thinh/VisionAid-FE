import { useSession, useSnapshot } from './useService';
import { uiStore, useUI } from '../stores/ui';
import { canWrite, linkPermission } from '../services/policy';
export function useWorkspace() {
  const query = useSnapshot();
  const { data: user } = useSession();
  const { selectedViu } = useUI();
  const users = query.data?.people.filter((p) => p.role === 'VisuallyImpaired' && p.active) ?? [];
  const selected = users.find((p) => p.id === selectedViu) ?? users[0];
  return {
    query,
    db: query.data,
    user: user!,
    users,
    selected,
    setSelected: (id: string) => uiStore.set({ selectedViu: id }),
    canWrite: (
      ...args: Parameters<typeof canWrite> extends [unknown, unknown, ...infer R] ? R : never
    ) => !!query.data && !!user && canWrite(query.data, user, ...args),
    permission: (flag: 'primary' | 'alerts' | 'registry' | 'locations') =>
      !!query.data && !!user && !!selected && linkPermission(query.data, user, selected.id, flag),
  };
}
