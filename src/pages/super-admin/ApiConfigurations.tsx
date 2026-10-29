import { RefreshCw } from 'lucide-react';
import { t } from '../../i18n';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import {
  configurationsApi,
  type SystemConfig,
  type ConfigHistory,
} from '../../services/api/configurations';
import { PageHead, State, Dialog, Toast } from '../../components/UI';
import { Form } from '../../components/Form';
import { formatTime } from '../../constants/labels';
import type { Person } from '../../models/domain';

type PageInfo = {
  page: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
function Pager({
  data,
  busy,
  change,
}: {
  data: PageInfo;
  busy: boolean;
  change: (page: number) => void;
}) {
  return (
    <div className="row pagination">
      <span>
        {t('{totalCount} kết quả · Trang {page}/{p4}', {
          totalCount: data.totalCount,
          page: data.page,
          p4: Math.max(1, data.totalPages),
        })}
      </span>
      <button
        className="btn"
        disabled={busy || !data.hasPreviousPage}
        onClick={() => change(data.page - 1)}
      >
        {t('Trang trước')}
      </button>
      <button
        className="btn"
        disabled={busy || !data.hasNextPage}
        onClick={() => change(data.page + 1)}
      >
        {t('Trang sau')}
      </button>
    </div>
  );
}
function Change({
  actor,
  config,
  history,
  page,
  close,
  saved,
}: {
  actor: Person;
  config: SystemConfig;
  history?: ConfigHistory;
  page: number;
  close: () => void;
  saved: () => Promise<void>;
}) {
  const [uncertain, setUncertain] = useState(false);
  return (
    <Dialog
      title={history ? t('Xác nhận khôi phục cấu hình') : t('Điều chỉnh cấu hình')}
      onClose={close}
    >
      <div className="stack">
        <strong>{config.configKey}</strong>
        <dl className="record-details">
          <div>
            <dt>{t('Giá trị hiện tại')}</dt>
            <dd>{config.configValue}</dd>
          </div>
          <div>
            <dt>{t('Kiểu dữ liệu')}</dt>
            <dd>{config.valueType}</dd>
          </div>
          <div>
            <dt>{t('Giới hạn')}</dt>
            <dd>
              {config.minValue ?? t('Không có')} — {config.maxValue ?? t('Không có')}
            </dd>
          </div>
        </dl>
        {history && (
          <p>
            {t('Khôi phục về giá trị trước lần thay đổi lúc {p1}:', {
              p1: formatTime(history.changedAt),
            })}{' '}
            <strong>{history.oldValue}</strong>
            {t('. Một bản ghi lịch sử mới sẽ được tạo.')}
          </p>
        )}
        {uncertain ? (
          <p className="notice error" role="alert">
            {t(
              'Chưa xác nhận được kết quả ghi. Đóng popup và tải lại cấu hình cùng lịch sử trước khi gửi lại.',
            )}
          </p>
        ) : (
          <Form
            fields={[
              ...(!history
                ? [
                    {
                      key: 'value',
                      label: t('Giá trị mới'),
                      type:
                        config.valueType === 'Boolean'
                          ? ('select' as const)
                          : config.valueType === 'Json'
                            ? ('textarea' as const)
                            : ('text' as const),
                      required: true,
                      options:
                        config.valueType === 'Boolean'
                          ? [
                              { value: 'true', label: t('Bật') },
                              { value: 'false', label: t('Tắt') },
                            ]
                          : undefined,
                    },
                  ]
                : []),
              { key: 'reason', label: t('Lý do thay đổi'), type: 'textarea', max: 500 },
            ]}
            initial={{ value: config.configValue, reason: '' }}
            submit={history ? t('Xác nhận khôi phục') : t('Lưu cấu hình')}
            onSubmit={async (values) => {
              try {
                if (history)
                  await configurationsApi.rollback(
                    actor,
                    config,
                    history,
                    page,
                    String(values.reason || ''),
                  );
                else
                  await configurationsApi.save(
                    actor,
                    config,
                    String(values.value),
                    String(values.reason || ''),
                  );
              } catch (error) {
                const status = (error as { status?: number }).status;
                if (status === undefined || status === 0 || status >= 500) setUncertain(true);
                throw error;
              }
              await saved();
              close();
            }}
          />
        )}
      </div>
    </Dialog>
  );
}
function ConfigPanel({
  actor,
  config,
  refresh,
}: {
  actor: Person;
  config: SystemConfig;
  refresh: () => Promise<void>;
}) {
  const [page, setPage] = useState(1);
  const [change, setChange] = useState<'edit' | ConfigHistory | null>(null);
  const history = useQuery({
    queryKey: ['api-config-history', actor.id, config.id, page],
    queryFn: ({ signal }) => configurationsApi.history(actor, config, page, signal),
    retry: false,
    gcTime: 0,
  });
  return (
    <div className="stack">
      <h3>{config.configKey}</h3>
      <p style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
        {config.description || t('Chưa có mô tả.')}
      </p>
      <dl className="record-details">
        <div>
          <dt>{t('Giá trị hiện tại')}</dt>
          <dd style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{config.configValue}</dd>
        </div>
        <div>
          <dt>{t('Kiểu / nhóm')}</dt>
          <dd>
            {config.valueType} / {config.category}
          </dd>
        </div>
        <div>
          <dt>{t('Giới hạn')}</dt>
          <dd>
            {config.minValue ?? t('Không có')} — {config.maxValue ?? t('Không có')}
          </dd>
        </div>
        <div>
          <dt>{t('Phạm vi đọc')}</dt>
          <dd>{config.isPublic ? t('Công khai') : t('Quản trị')}</dd>
        </div>
        <div>
          <dt>{t('Cập nhật lúc')}</dt>
          <dd>{formatTime(config.updatedAt)}</dd>
        </div>
      </dl>
      <button className="btn primary" onClick={() => setChange('edit')}>
        {t('Điều chỉnh')}
      </button>
      <h3>{t('Lịch sử thay đổi')}</h3>
      <State loading={history.isPending} error={history.error} retry={() => history.refetch()}>
        {history.data?.items.length ? (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label={t('Lịch sử cấu hình')}
          >
            <table style={{ minWidth: 650 }}>
              <thead>
                <tr>
                  <th>{t('Thời gian')}</th>
                  <th>{t('Trước → Sau')}</th>
                  <th>{t('Lý do / người thay đổi')}</th>
                  <th>{t('Thao tác')}</th>
                </tr>
              </thead>
              <tbody>
                {history.data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatTime(entry.changedAt)}</td>
                    <td style={{ overflowWrap: 'anywhere' }}>
                      {entry.oldValue ?? t('Chưa có')} → {entry.newValue}
                    </td>
                    <td style={{ overflowWrap: 'anywhere' }}>
                      {entry.reason || t('Không ghi lý do')}
                      <p>
                        {entry.changedByName
                          ? entry.changedByName +
                            (entry.changedByEmail ? ' · ' + entry.changedByEmail : '')
                          : entry.changedBy || t('Hệ thống')}
                      </p>
                    </td>
                    <td>
                      <button
                        className="btn small"
                        disabled={entry.oldValue === null}
                        onClick={() => setChange(entry)}
                      >
                        {t('Khôi phục')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{t('Chưa có lịch sử thay đổi.')}</p>
        )}
        {history.data && <Pager data={history.data} busy={history.isFetching} change={setPage} />}
      </State>
      {change && (
        <Change
          actor={actor}
          config={config}
          history={change === 'edit' ? undefined : change}
          page={page}
          close={() => setChange(null)}
          saved={refresh}
        />
      )}
    </div>
  );
}
function ConfigDetail({ actor, id, close }: { actor: Person; id: string; close: () => void }) {
  const cache = useQueryClient();
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: ['api-config-detail', actor.id, id],
    queryFn: ({ signal }) => configurationsApi.detail(actor, id, signal),
    retry: false,
    gcTime: 0,
  });
  return (
    <Dialog title={t('Chi tiết cấu hình')} onClose={close}>
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data && (
          <ConfigPanel
            key={query.data.updatedAt}
            actor={actor}
            config={query.data}
            refresh={async () => {
              await Promise.all([
                cache.invalidateQueries({ queryKey: ['api-configs', actor.id] }),
                cache.invalidateQueries({ queryKey: ['api-config-history', actor.id, id] }),
                query.refetch(),
              ]);
              setNotice(t('Đã lưu cấu hình trên máy chủ. Thiết bị áp dụng khi đồng bộ lại.'));
            }}
          />
        )}
      </State>
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
    </Dialog>
  );
}
export function ApiConfigurations() {
  const { data: actor } = useSession();
  return actor?.role === 'Admin' ? <Configurations key={actor.id} actor={actor} /> : null;
}
function Configurations({ actor }: { actor: Person }) {
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState('');
  const query = useQuery({
    queryKey: ['api-configs', actor.id, filters, page],
    queryFn: ({ signal }) =>
      configurationsApi.list(actor, page, filters.search, filters.category, signal),
    retry: false,
    gcTime: 0,
  });
  return (
    <>
      <PageHead
        title={t('Cấu hình hệ thống')}
        description={t('Xem, điều chỉnh và khôi phục các thông số vận hành của hệ thống.')}
      />
      <section className="glass card stack">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setFilters({
              search: String(form.get('search') || '').trim(),
              category: String(form.get('category') || '').trim(),
            });
            setPage(1);
            setSelected('');
          }}
        >
          <label className="field">
            {t('Tìm cấu hình')}
            <input name="search" />
          </label>
          <label className="field">
            {t('Nhóm cấu hình')}
            <input name="category" placeholder={t('Ví dụ: AI, WEBRTC')} />
          </label>
          <button className="btn primary">{t('Tìm kiếm')}</button>
          <button
            type="button"
            className="btn"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {t('Tải lại cấu hình')}
          </button>
        </form>
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          {query.data?.items.length ? (
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label={t('Danh sách cấu hình')}
            >
              <table style={{ minWidth: 650 }}>
                <thead>
                  <tr>
                    <th>{t('Khóa / nhóm')}</th>
                    <th>{t('Giá trị')}</th>
                    <th>{t('Thao tác')}</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ overflowWrap: 'anywhere' }}>
                        <strong>{item.configKey}</strong>
                        <p>{item.category}</p>
                      </td>
                      <td style={{ overflowWrap: 'anywhere' }}>
                        {item.reviewed ? item.configValue : t('Chưa duyệt hiển thị trên Web')}
                      </td>
                      <td>
                        <button
                          className="btn small"
                          disabled={!item.reviewed}
                          onClick={() => setSelected(item.id)}
                        >
                          {t('Chi tiết')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>{t('Chưa có cấu hình phù hợp.')}</p>
          )}
          {query.data && <Pager data={query.data} busy={query.isFetching} change={setPage} />}
          {selected && <ConfigDetail actor={actor} id={selected} close={() => setSelected('')} />}
        </State>
      </section>
    </>
  );
}
