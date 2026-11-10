import { t } from '../../i18n';
import { useState } from 'react';
import { useSession } from '../../hooks/useService';
import { PageHead } from '../../components/UI';
import { SearchPicker } from '../../components/SearchPicker';
import { searchAccounts } from '../../services/api/pickers';
import { ActivityTimeline } from '../caregiver/ActivityTimeline';
import type { Person } from '../../models/domain';

/** Center Admin: the activity trace of a care recipient in the organization (BE checks the org). */
export function ApiCenterActivity() {
  const { data: actor } = useSession();
  return actor?.role === 'CenterAdmin' && actor.orgId ? (
    <CenterActivity key={actor.id + actor.orgId} actor={actor} />
  ) : null;
}

function CenterActivity({ actor }: { actor: Person }) {
  const [viu, setViu] = useState('');
  const [name, setName] = useState('');
  return (
    <>
      <PageHead
        title={t('Truy vết hoạt động')}
        description={t(
          'Xem lại theo thời gian những gì người khiếm thị trong trung tâm đã làm và các chỉ dẫn di chuyển ứng dụng đã đọc cho họ.',
        )}
      />
      <section className="glass card stack">
        <SearchPicker
          label={t('Người được chăm sóc')}
          value={viu}
          onChange={(value, option) => {
            setViu(value);
            setName(option?.label ?? '');
          }}
          search={searchAccounts(actor, 'VisuallyImpaired')}
          queryKey={['center-activity-viu', actor.id, actor.orgId]}
        />
        {!viu && <p className="muted">{t('Chọn một người để xem hoạt động đã được ghi nhận.')}</p>}
      </section>
      {viu && (
        <ActivityTimeline
          key={viu}
          actor={actor}
          viuId={viu}
          name={name || t('Một người được chăm sóc')}
        />
      )}
    </>
  );
}
