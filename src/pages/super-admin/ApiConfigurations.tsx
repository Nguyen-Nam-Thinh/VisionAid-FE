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
import {
  configCategory,
  configCategoryValues,
  configHint,
  configName,
  configValue,
} from '../../constants/configLabels';
import type { Person } from '../../models/domain';
import { collectPages, containsText, pageOf } from '../../services/api/textSearch';

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
      {(data.hasPreviousPage || data.hasNextPage) && (
        <button
          className="btn"
          disabled={busy || !data.hasPreviousPage}
          onClick={() => change(data.page - 1)}
        >
          {t('Trang trước')}
        </button>
      )}
      {(data.hasPreviousPage || data.hasNextPage) && (
        <button
          className="btn"
          disabled={busy || !data.hasNextPage}
          onClick={() => change(data.page + 1)}
        >
          {t('Trang sau')}
        </button>
      )}
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
        <strong>{configName(config.configKey)}</strong>
        <dl className="record-details">
          <div>
            <dt>{t('Giá trị hiện tại')}</dt>
            <dd>{configValue(config)}</dd>
          </div>
          <div>
            <dt>{t('Giới hạn')}</dt>
            <dd>
              {config.minValue === null && config.maxValue === null
                ? t('Không giới hạn')
                : t('Từ {min} đến {max}', {
                    min:
                      config.minValue === null
                        ? '…'
                        : configValue({ ...config, configValue: config.minValue }),
                    max:
                      config.maxValue === null
                        ? '…'
                        : configValue({ ...config, configValue: config.maxValue }),
                  })}
            </dd>
          </div>
        </dl>
        {history && (
          <p>
            {t('Khôi phục về giá trị trước lần thay đổi lúc {p1}:', {
              p1: formatTime(history.changedAt),
            })}{' '}
            <strong>{configValue({ ...config, configValue: history.oldValue ?? '' })}</strong>
            {t('. Một bản ghi lịch sử mới sẽ được tạo.')}
          </p>
        )}
        {uncertain ? (
          <p className="notice error" role="alert">
            {t(
              'Chưa xác nhận được kết quả ghi. Đóng hộp thoại và tải lại cấu hình cùng lịch sử trước khi gửi lại.',
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
    // updatedAt: a saved value always loads a fresh history instead of the cached one.
    queryKey: ['api-config-history', actor.id, config.id, config.updatedAt, page],
    queryFn: ({ signal }) => configurationsApi.history(actor, config, page, signal),
    retry: false,
    gcTime: 0,
  });
  return (
    <div className="stack">
      <h3>{configName(config.configKey)}</h3>
      <p style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
        {configHint(config.configKey) || config.description || t('Chưa có mô tả.')}
      </p>
      <dl className="record-details">
        <div>
          <dt>{t('Giá trị hiện tại')}</dt>
          <dd style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
            {configValue(config)}
          </dd>
        </div>
        <div>
          <dt>{t('Nhóm')}</dt>
          <dd>{configCategory(config.category)}</dd>
        </div>
        <div>
          <dt>{t('Giới hạn')}</dt>
          <dd>
            {config.minValue === null && config.maxValue === null
              ? t('Không giới hạn')
              : t('Từ {min} đến {max}', {
                  min:
                    config.minValue === null
                      ? '…'
                      : configValue({ ...config, configValue: config.minValue }),
                  max:
                    config.maxValue === null
                      ? '…'
                      : configValue({ ...config, configValue: config.maxValue }),
                })}
          </dd>
        </div>
        <div>
          <dt>{t('Nơi sử dụng')}</dt>
          <dd>{config.isPublic ? t('Ứng dụng di động đọc được') : t('Chỉ máy chủ dùng')}</dd>
        </div>
        <div>
          <dt>{t('Mã kỹ thuật')}</dt>
          <dd style={{ overflowWrap: 'anywhere' }}>
            <code>{config.configKey}</code>
          </dd>
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
        <div className="table-scroll" tabIndex={0} role="region" aria-label={t('Lịch sử cấu hình')}>
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
              {history.data?.items.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatTime(entry.changedAt)}</td>
                  <td style={{ overflowWrap: 'anywhere' }}>
                    {entry.oldValue === null
                      ? t('Chưa có')
                      : configValue({ ...config, configValue: entry.oldValue })}{' '}
                    → {configValue({ ...config, configValue: entry.newValue })}
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
          {!history.data?.items.length && <p className="empty">{t('Chưa có lịch sử thay đổi.')}</p>}
        </div>
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
function ConfigDetail({
  actor,
  id,
  seed,
  close,
}: {
  actor: Person;
  id: string;
  /** The row from the list, so the first history page loads together with the detail. */
  seed?: SystemConfig;
  close: () => void;
}) {
  const cache = useQueryClient();
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: ['api-config-detail', actor.id, id],
    queryFn: ({ signal }) => configurationsApi.detail(actor, id, signal),
    retry: false,
    gcTime: 0,
  });
  // Same key as the panel's first history page: the dialog opens once, fully filled, instead of
  // growing from a loading line to the details and then to the history table.
  const base = query.data ?? seed;
  const firstHistory = useQuery({
    queryKey: ['api-config-history', actor.id, id, base?.updatedAt, 1],
    queryFn: ({ signal }) => configurationsApi.history(actor, base!, 1, signal),
    enabled: !!base,
    retry: false,
    gcTime: 0,
  });
  // A failed history page refetches when the panel mounts; that must not send the dialog back to
  // "loading", so only the first answer holds it.
  const [historyAnswered, setHistoryAnswered] = useState(false);
  if (!historyAnswered && (firstHistory.isSuccess || firstHistory.isError))
    setHistoryAnswered(true);
  return (
    <Dialog title={t('Chi tiết cấu hình')} onClose={close}>
      <State
        loading={query.isPending || (!!base && firstHistory.isPending && !historyAnswered)}
        error={query.error}
        retry={() => query.refetch()}
      >
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
              setNotice(t('Đã lưu cấu hình. Điện thoại áp dụng ở lần đồng bộ tiếp theo.'));
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
    // Search runs on the names people see ("Chặn nhận diện bằng ảnh chụp…") and the technical
    // key; the server only knows the technical key.
    queryFn: async ({ signal }) => {
      if (!filters.search) return configurationsApi.list(actor, page, '', filters.category, signal);
      const rows = await collectPages((p) =>
        configurationsApi.list(actor, p, '', filters.category, signal, 100),
      );
      return pageOf(
        rows.filter((config) =>
          containsText(
            filters.search,
            // The name people see and the technical key; hints would match unrelated words.
            configName(config.configKey),
            config.configKey,
          ),
        ),
        page,
      );
    },
    retry: false,
    gcTime: 0,
  });
  return (
    <>
      <PageHead
        title={t('Cấu hình hệ thống')}
        description={t(
          'Xem và chỉnh các thiết lập chung của hệ thống; có thể quay lại giá trị trước đó.',
        )}
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
            <input
              name="search"
              onChange={(e) => {
                // Emptying the box shows every configuration again without pressing Search.
                if (!e.target.value && filters.search) {
                  setFilters((f) => ({ ...f, search: '' }));
                  setPage(1);
                }
              }}
            />
          </label>
          <label className="field">
            {t('Nhóm cấu hình')}
            <select
              name="category"
              defaultValue=""
              onChange={(e) => {
                // Picking a group filters right away, together with the words in the search box.
                const search = String(
                  new FormData(e.currentTarget.form!).get('search') || '',
                ).trim();
                setFilters({ search, category: e.target.value });
                setPage(1);
                setSelected('');
              }}
            >
              <option value="">{t('Tất cả nhóm')}</option>
              {configCategoryValues.map((value) => (
                <option key={value} value={value}>
                  {configCategory(value)}
                </option>
              ))}
            </select>
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
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label={t('Danh sách cấu hình')}
          >
            <table style={{ minWidth: 650 }}>
              <thead>
                <tr>
                  <th>{t('Cấu hình')}</th>
                  <th>{t('Giá trị')}</th>
                  <th>{t('Thao tác')}</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ overflowWrap: 'anywhere' }}>
                      <strong>{configName(item.configKey)}</strong>
                      <p className="muted">{configCategory(item.category)}</p>
                    </td>
                    <td style={{ overflowWrap: 'anywhere' }}>
                      {item.reviewed ? configValue(item) : t('Chưa hỗ trợ xem trên Web')}
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
            {!query.data?.items.length && <p className="empty">{t('Chưa có cấu hình phù hợp.')}</p>}
          </div>
          {query.data && <Pager data={query.data} busy={query.isFetching} change={setPage} />}
          {selected && (
            <ConfigDetail
              actor={actor}
              id={selected}
              seed={query.data?.items.find((item) => item.id === selected)}
              close={() => setSelected('')}
            />
          )}
        </State>
      </section>
    </>
  );
}
