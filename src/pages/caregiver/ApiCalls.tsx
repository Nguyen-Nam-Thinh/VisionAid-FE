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
import { searchCareRecipients } from '../../services/api/pickers';
const time = (value: string | null) => (value ? formatLocaleDateTime(value) : t('Chưa có'));
export function ApiCalls() {
  const { data: actor } = useSession();
  return actor?.role === 'Caregiver' ? (
    <History key={actor.id + actor.orgId} actor={actor} />
  ) : null;
}
function History({ actor }: { actor: Person }) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CallFilters>({ viuUserId: '', dateFrom: '', dateTo: '' });
  const [selected, setSelected] = useState<CallHistoryItem | null>(null);
  const [viu, setViu] = useState('');
  const result = useQuery({
    queryKey: ['api-calls', actor.id, actor.orgId, page, filters],
    queryFn: ({ signal }) => callsApi.history(actor, page, filters, signal),
    retry: false,
  });
  return (
    <>
      <PageHead
        title={t('Lịch sử cuộc gọi')}
        description={t(
          'Các phiên gọi bạn đã tham gia. Thời gian hiển thị theo múi giờ trình duyệt.',
        )}
      />
      <p className="notice">
        {t(
          'Để bắt đầu gọi, vào Người được chăm sóc và chọn Gọi hỗ trợ. Kết quả dưới đây do máy chủ ghi nhận.',
        )}
      </p>
      <section className="glass card stack">
        <form
          className="row"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setFilters({
              viuUserId: viu,
              dateFrom: String(data.get('dateFrom') || ''),
              dateTo: String(data.get('dateTo') || ''),
            });
            setPage(1);
            setSelected(null);
          }}
        >
          <SearchPicker
            label={t('Người được chăm sóc')}
            placeholder={t('Gõ tên hoặc email; để trống xem tất cả')}
            value={viu}
            onChange={setViu}
            search={searchCareRecipients()}
            queryKey={['call-viu', actor.id, actor.orgId]}
          />
          <label className="field">
            {t('Từ thời điểm')}
            <input name="dateFrom" type="datetime-local" />
          </label>
          <label className="field">
            {t('Đến thời điểm')}
            <input name="dateTo" type="datetime-local" />
          </label>
          <button className="btn primary">{t('Lọc lịch sử')}</button>
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
        </form>
        <State loading={result.isPending} error={result.error} retry={() => result.refetch()}>
          {!result.data?.items.length && <p>{t('Chưa có cuộc gọi phù hợp.')}</p>}
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('Bắt đầu')}</th>
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
                    <dd>{selected.viuUserId || t('Không còn thông tin')}</dd>
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
