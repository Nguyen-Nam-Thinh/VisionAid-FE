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
        {data.totalCount} kết quả · Trang {data.page}/{Math.max(1, data.totalPages)}
      </span>
      <button
        className="btn"
        disabled={busy || !data.hasPreviousPage}
        onClick={() => change(data.page - 1)}
      >
        Trang trước
      </button>
      <button
        className="btn"
        disabled={busy || !data.hasNextPage}
        onClick={() => change(data.page + 1)}
      >
        Trang sau
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
    <Dialog title={history ? 'Xác nhận khôi phục cấu hình' : 'Điều chỉnh cấu hình'} onClose={close}>
      <div className="stack">
        <strong>{config.configKey}</strong>
        <dl className="record-details">
          <div>
            <dt>Giá trị hiện tại</dt>
            <dd>{config.configValue}</dd>
          </div>
          <div>
            <dt>Kiểu dữ liệu</dt>
            <dd>{config.valueType}</dd>
          </div>
          <div>
            <dt>Giới hạn</dt>
            <dd>
              {config.minValue ?? 'Không có'} — {config.maxValue ?? 'Không có'}
            </dd>
          </div>
        </dl>
        {history && (
          <p>
            Khôi phục về giá trị trước lần thay đổi lúc {formatTime(history.changedAt)}:{' '}
            <strong>{history.oldValue}</strong>. Một bản ghi lịch sử mới sẽ được tạo.
          </p>
        )}
        <p className="notice">
          Thay đổi có thể ảnh hưởng toàn hệ thống. Lưu trên máy chủ không xác nhận thiết bị đã áp
          dụng.
        </p>
        {uncertain ? (
          <p className="notice error" role="alert">
            Chưa xác nhận được kết quả ghi. Đóng popup và tải lại cấu hình cùng lịch sử trước khi
            gửi lại.
          </p>
        ) : (
          <Form
            fields={[
              ...(!history
                ? [
                    {
                      key: 'value',
                      label: 'Giá trị mới',
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
                              { value: 'true', label: 'Bật' },
                              { value: 'false', label: 'Tắt' },
                            ]
                          : undefined,
                    },
                  ]
                : []),
              { key: 'reason', label: 'Lý do thay đổi', type: 'textarea', max: 500 },
            ]}
            initial={{ value: config.configValue, reason: '' }}
            submit={history ? 'Xác nhận khôi phục' : 'Lưu cấu hình'}
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
        {config.description || 'Chưa có mô tả.'}
      </p>
      <dl className="record-details">
        <div>
          <dt>Giá trị hiện tại</dt>
          <dd style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{config.configValue}</dd>
        </div>
        <div>
          <dt>Kiểu / nhóm</dt>
          <dd>
            {config.valueType} / {config.category}
          </dd>
        </div>
        <div>
          <dt>Giới hạn</dt>
          <dd>
            {config.minValue ?? 'Không có'} — {config.maxValue ?? 'Không có'}
          </dd>
        </div>
        <div>
          <dt>Phạm vi đọc</dt>
          <dd>{config.isPublic ? 'Công khai' : 'Quản trị'}</dd>
        </div>
        <div>
          <dt>Cập nhật lúc</dt>
          <dd>{formatTime(config.updatedAt)}</dd>
        </div>
      </dl>
      <button className="btn primary" onClick={() => setChange('edit')}>
        Điều chỉnh
      </button>
      <h3>Lịch sử thay đổi</h3>
      <State loading={history.isPending} error={history.error} retry={() => history.refetch()}>
        {history.data?.items.length ? (
          <div className="table-scroll" tabIndex={0} role="region" aria-label="Lịch sử cấu hình">
            <table style={{ minWidth: 650 }}>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Trước → Sau</th>
                  <th>Lý do / người thay đổi</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {history.data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatTime(entry.changedAt)}</td>
                    <td style={{ overflowWrap: 'anywhere' }}>
                      {entry.oldValue ?? 'Chưa có'} → {entry.newValue}
                    </td>
                    <td style={{ overflowWrap: 'anywhere' }}>
                      {entry.reason || 'Không ghi lý do'}
                      <p>
                        {entry.changedByName
                          ? entry.changedByName +
                            (entry.changedByEmail ? ' · ' + entry.changedByEmail : '')
                          : entry.changedBy || 'Hệ thống'}
                      </p>
                    </td>
                    <td>
                      <button
                        className="btn small"
                        disabled={entry.oldValue === null}
                        onClick={() => setChange(entry)}
                      >
                        Khôi phục
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Chưa có lịch sử thay đổi.</p>
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
    <Dialog title="Chi tiết cấu hình" onClose={close}>
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
              setNotice('Đã lưu cấu hình trên máy chủ. Thiết bị áp dụng khi đồng bộ lại.');
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
        title="Cấu hình hệ thống"
        description="Tra cứu, điều chỉnh và khôi phục các thông số đã được duyệt cho Web."
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
            Tìm cấu hình
            <input name="search" />
          </label>
          <label className="field">
            Nhóm cấu hình
            <input name="category" placeholder="Ví dụ: AI, WEBRTC" />
          </label>
          <button className="btn primary">Tìm kiếm</button>
          <button
            type="button"
            className="btn"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Tải lại cấu hình
          </button>
        </form>
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          {query.data?.items.length ? (
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Danh sách cấu hình"
            >
              <table style={{ minWidth: 650 }}>
                <thead>
                  <tr>
                    <th>Khóa / nhóm</th>
                    <th>Giá trị</th>
                    <th>Thao tác</th>
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
                        {item.reviewed ? item.configValue : 'Chưa duyệt hiển thị trên Web'}
                      </td>
                      <td>
                        <button
                          className="btn small"
                          disabled={!item.reviewed}
                          onClick={() => setSelected(item.id)}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Chưa có cấu hình phù hợp.</p>
          )}
          {query.data && <Pager data={query.data} busy={query.isFetching} change={setPage} />}
          {selected && <ConfigDetail actor={actor} id={selected} close={() => setSelected('')} />}
        </State>
      </section>
    </>
  );
}
