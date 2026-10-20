import { t } from '../../i18n';
import { PeopleManager } from '../../components/PeopleManager';
export function Staff() {
  return <PeopleManager role="Caregiver" title={t('Nhân viên chăm sóc')} />;
}
