import { t, formatLocaleDateTime } from '../../i18n';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import {
  callsApi,
  callEndReason,
  callStatuses,
  callTriggers,
  type CallFilters,
  type CallHistoryItem,
} from '../../services/api/calls';
import { PageHead, State, Dialog } from '../../components/UI';
import type { Person } from '../../models/domain';
import { SearchPicker } from '../../components/SearchPicker';
import { searchAccounts, searchCareRecipients } from '../../services/api/pickers';
import { FilterPanel } from '../../components/FilterPanel';
import { caregivingApi } from '../../services/api/caregiving';
import { accountsApi } from '../../services/api/accounts';
const time = (value: string | null) => (value ? formatLocaleDateTime(value) : t('Chưa có'));
export function ApiCalls() {
  const { data: actor } = useSession();
  return actor?.role === 'Caregiver' || actor?.role === 'CenterAdmin' ? (
    <History key={actor.id + actor.orgId} actor={actor} />
  ) : null;
}
function History({ actor }: { actor: Person }) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CallFilters>({ viuUserId: '', dateFrom: '', dateTo: '' });
  const [selected, setSelected] = useState<CallHistoryItem | null>(null);
  const [viu, setViu] = useState('');
  const center = actor.role === 'CenterAdmin';
  const result = useQuery({
    queryKey: ['api-calls', actor.id, actor.orgId, page, filters],
    queryFn: ({ signal }) => callsApi.history(actor, page, filters, signal),
    retry: false,
  });
  // Calls only carry the VIU id; show a name when the person is in the first page of the scope.
  const people = useQuery({
    queryKey: ['call-people', actor.id, actor.orgId],
    queryFn: async ({ signal }) =>
      center
        ? (
            await accountsApi.list(
              actor,
              {
                page: 1,
                search: '',
                role: 'VisuallyImpaired',
                active: '',
                deleted: '',
                organizationId: '',
              },
              signal,
            )
          ).items
        : (await caregivingApi.users(1, '', signal)).items,
    retry: false,
  });
  const nameOf = (id: string | null) =>
    id
      ? (people.data?.find((person) => person.id === id)?.fullName ?? id)
      : t('Không còn thông tin');
  return (
    <>
      <PageHead
        title={t('Lịch sử cuộc gọi')}
        description={
          center
            ? t('Các cuộc gọi của người khiếm thị thuộc trung tâm. Chỉ xem, không gọi từ đây.')
            : t('Các cuộc gọi bạn đã thực hiện hoặc nhận.')
        }
      />
      <section className="glass card stack">
        {!center && (
          <p className="notice">
            {t(
              'Để bắt đầu gọi, vào Người được chăm sóc và chọn Gọi hỗ trợ. Kết quả dưới đây do máy chủ ghi nhận.',
            )}
          </p>
        )}
        <FilterPanel
          active={[filters.viuUserId, filters.dateFrom, filters.dateTo].filter(Boolean).length}
          submitLabel={t('Lọc lịch sử')}
          onApply={(form) => {
            const data = new FormData(form);
            setFilters({
              viuUserId: viu,
              dateFrom: String(data.get('dateFrom') || ''),
              dateTo: String(data.get('dateTo') || ''),
            });
            setPage(1);
            setSelected(null);
          }}
          onReset={() => {
            setViu('');
            setFilters({ viuUserId: '', dateFrom: '', dateTo: '' });
            setPage(1);
            setSelected(null);
          }}
          tools={
            <button
              type="button"
              className="btn"
              disabled={result.isFetching}
              onClick={() => {
                setSelected(null);
                void result.refetch();
              }}
            >
              {t('Tải lại')}
            </button>
          }
        >
          <SearchPicker
            wide
            label={center ? t('Người khiếm thị') : t('Người được chăm sóc')}
            placeholder={t('Gõ tên hoặc email')}
            value={viu}
            onChange={setViu}
            search={center ? searchAccounts(actor, 'VisuallyImpaired') : searchCareRecipients()}
            queryKey={['call-viu', actor.id, actor.orgId]}
          />
          <div className="filter-range wide">
            <label className="field">
              {t('Từ thời điểm')}
              <input name="dateFrom" type="datetime-local" />
            </label>
            <label className="field">
              {t('Đến thời điểm')}
              <input name="dateTo" type="datetime-local" />
            </label>
          </div>
        </FilterPanel>
        <State loading={result.isPending} error={result.error} retry={() => result.refetch()}>
          {!result.data?.items.length && <p>{t('Chưa có cuộc gọi phù hợp.')}</p>}
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('Bắt đầu')}</th>
                  <th>{center ? t('Người khiếm thị') : t('Người được chăm sóc')}</th>
                  <th>{t('Loại cuộc gọi')}</th>
                  <th>{t('Trạng thái')}</th>
                  <th>{t('Thời lượng')}</th>
                  <th>{t('Thao tác')}</th>
                </tr>
              </thead>
              <tbody>
                {result.data?.items.map((call) => (
                  <tr key={call.sessionId}>
                    <td>{time(call.startedAt)}</td>
                    <td>{nameOf(call.viuUserId)}</td>
                    <td>{callTriggers[call.triggerType]}</td>
                    <td>{callStatuses[call.status]}</td>
                    <td>
                      {call.durationSeconds === null
                        ? t('Chưa có')
                        : t('{durationSeconds} giây', { durationSeconds: call.durationSeconds })}
                    </td>
                    <td>
                      <button className="btn small" onClick={() => setSelected(call)}>
                        {t('Chi tiết')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row pagination">
            <span>
              {t('{p0} cuộc gọi · Trang {page}/{p4}', {
                p0: result.data?.totalCount ?? 0,
                page,
                p4: Math.max(1, result.data?.totalPages ?? 1),
              })}
            </span>
            <button
              className="btn"
              disabled={!result.data?.hasPreviousPage || result.isFetching}
              onClick={() => {
                setPage(page - 1);
                setSelected(null);
              }}
            >
              {t('Trang trước')}
            </button>
            <button
              className="btn"
              disabled={!result.data?.hasNextPage || result.isFetching}
              onClick={() => {
                setPage(page + 1);
                setSelected(null);
              }}
            >
              {t('Trang sau')}
            </button>
          </div>
          {selected && (
            <Dialog title={t('Chi tiết cuộc gọi')} onClose={() => setSelected(null)}>
              <div className="stack" style={{ overflowWrap: 'anywhere' }}>
                <dl className="record-details">
                  <div>
                    <dt>{t('Mã phiên')}</dt>
                    <dd>{selected.sessionId}</dd>
                  </div>
                  <div>
                    <dt>{t('Người được chăm sóc')}</dt>
                    <dd>{nameOf(selected.viuUserId)}</dd>
                  </div>
                  <div>
                    <dt>{t('Trạng thái')}</dt>
                    <dd>{callStatuses[selected.status]}</dd>
                  </div>
                  <div>
                    <dt>{t('Bắt đầu')}</dt>
                    <dd>{time(selected.startedAt)}</dd>
                  </div>
                  <div>
                    <dt>{t('Chấp nhận')}</dt>
                    <dd>{time(selected.connectedAt)}</dd>
                  </div>
                  <div>
                    <dt>{t('Kết thúc')}</dt>
                    <dd>{time(selected.endedAt)}</dd>
                  </div>
                  <div>
                    <dt>{t('Lý do')}</dt>
                    <dd>{callEndReason(selected.endReason)}</dd>
                  </div>
                </dl>
                <p className="muted">
                  {t(
                    'Trạng thái chấp nhận do máy chủ ghi nhận không chứng minh âm thanh hoặc hình ảnh đã kết nối.',
                  )}
                </p>
              </div>
            </Dialog>
          )}
        </State>
      </section>
    </>
  );
}
