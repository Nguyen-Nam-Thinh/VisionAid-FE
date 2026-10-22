import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '../services/api/accounts';
import { organizationsApi } from '../services/api/organizations';
import type { FieldSpec } from '../components/Form';
import type { Person } from '../models/domain';

// Picker data for CenterAdmin forms; Admin (all organizations) and large orgs use name/email search.
export function useOrgPeople(
  actor: Person,
  role: 'Caregiver' | 'VisuallyImpaired',
  enabled = true,
) {
  return useQuery({
    queryKey: ['api-org-people', actor.id, actor.orgId, role],
    queryFn: ({ signal }) => accountsApi.options(actor, role, signal),
    enabled: enabled && actor.role === 'CenterAdmin',
    retry: false,
    gcTime: 0,
  });
}

// A select when the full active list is known, otherwise a name/email search field.
export function personField(
  field: FieldSpec,
  people: ReturnType<typeof useOrgPeople>,
  emptyHint: string,
  search: Pick<FieldSpec, 'search' | 'searchKey'>,
): FieldSpec {
  const data = people.data;
  if (!data?.complete) return { ...field, ...search, type: 'search' };
  if (!data.items.length) return { ...field, type: 'select', options: [], hint: emptyHint };
  return {
    ...field,
    type: 'select',
    hint: undefined,
    options: data.items.map((p) => ({ value: p.id, label: `${p.fullName} · ${p.email}` })),
  };
}

// CenterAdmin's own organization name for display instead of its UUID; shares the organization page cache.
export function useOwnOrgName(actor: Person) {
  const org = useQuery({
    queryKey: ['api-organization', actor.id, actor.orgId, 'me'],
    queryFn: ({ signal }) => organizationsApi.me(actor, signal),
    enabled: actor.role === 'CenterAdmin' && !!actor.orgId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  return org.data?.name;
}
