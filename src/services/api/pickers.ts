import type { Person } from '../../models/domain';
import { accountsApi, type Account } from './accounts';
import { organizationsApi } from './organizations';
import { caregivingApi } from './caregiving';

// Search sources for SearchPicker: users pick a record by name/email and the id is sent to BE.
export type PickerOption = { value: string; label: string; detail?: string };
type Scope = Pick<Person, 'id' | 'role' | 'orgId'>;
const options = (items: { id: string; fullName: string; email: string }[]): PickerOption[] =>
  items.map((p) => ({ value: p.id, label: p.fullName, detail: p.email }));

/** Admin: any account; CenterAdmin: accounts of their organization (scoped by accountsApi and BE). */
export const searchAccounts =
  (actor: Scope, role: Account['role'] | '' = '', organizationId = '') =>
  async (term: string, signal?: AbortSignal) =>
    options(
      (
        await accountsApi.list(
          actor,
          { page: 1, search: term, role, active: '', deleted: '', organizationId },
          signal,
        )
      ).items,
    );

/** Admin only. */
export const searchOrganizations =
  (actor: Scope) =>
  async (term: string, signal?: AbortSignal): Promise<PickerOption[]> =>
    (await organizationsApi.list(actor, 1, term, '', '', signal)).items.map((o) => ({
      value: o.id,
      label: o.name,
      detail: o.contactEmail ?? undefined,
    }));

/** Caregiver: care recipients BE returns for the current session's links. */
export const searchCareRecipients = () => async (term: string, signal?: AbortSignal) =>
  options((await caregivingApi.users(1, term, signal)).items);
