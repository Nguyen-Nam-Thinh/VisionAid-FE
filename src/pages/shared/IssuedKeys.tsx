import { t, formatLocaleDateTime } from '../../i18n';
import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { Badge, Confirm, State } from '../../components/UI';
import {
  keyStateLabels,
  keyStates,
  licenseKeysApi,
  type IssuedKey,
  type KeyState,
} from '../../services/api/licenseKeys';
import { isOrganizationBuyer } from '../../services/api/licenses';
import type { Person } from '../../models/domain';

const tones = { Unused: 'amber', Activated: 'green', Expired: 'gray', Revoked: 'red' } as const;
const masked = '••••-••••-••••-••••';

/** Keys already handed out from the pool: look one up again, or take back one sent by mistake. */
export function IssuedKeys({ actor }: { actor: Person }) {
  const cache = useQueryClient();
  const [state, setState] = useState<KeyState | ''>('');
  const [typed, setTyped] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [shown, setShown] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const [revoking, setRevoking] = useState<IssuedKey | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(typed.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [typed]);
  const query = useQuery({
    queryKey: ['license-keys', actor.id, actor.orgId, state, search, page],
    queryFn: ({ signal }) => licenseKeysApi.list(actor, { state, search, page }, signal),
    enabled: isOrganizationBuyer(actor),
    placeholderData: keepPreviousData,
    retry: false,
  });
  if (!isOrganizationBuyer(actor)) return null;
  const data = query.data;
  const pages = Math.max(1, data?.totalPages ?? 1);
  return (
    // Lives inside the "Key cho gia đình" card, under the create button.
    <div className="stack issued-keys" role="group" aria-labelledby="issued-keys-title">
      <div className="row between">
        <h3 id="issued-keys-title">{t('Key đã phát')}</h3>
        <button
          className="btn small"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={16} aria-hidden="true" />
          {t('Tải lại')}
        </button>
      </div>
      <p>
        {t(
          'Xem lại key đã tạo và thu hồi key chưa dùng nếu phát nhầm. Thu hồi trả suất về kho; key đã kích hoạt hoặc đã hết hạn không thu hồi được.',
        )}
      </p>
      <div className="row">
        <label className="table-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">{t('Tìm theo key, ghi chú hoặc người kích hoạt')}</span>
          <input
            className="search"
            placeholder={t('Tìm theo key, ghi chú hoặc người kích hoạt')}
            value={typed}
            maxLength={100}
            onChange={(e) => setTyped(e.target.value)}
          />
        </label>
        <label className="field inline">
          <span className="sr-only">{t('Trạng thái key')}</span>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value as KeyState | '');
              setPage(1);
            }}
          >
            <option value="">{t('Tất cả trạng thái')}</option>
            {keyStates.map((value) => (
              <option key={value} value={value}>
                {keyStateLabels[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {copied && <p role="status">{copied}</p>}
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">{t('Key đã phát')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('Key')}</th>
                <th scope="col">{t('Trạng thái')}</th>
                <th scope="col">{t('Ghi chú')}</th>
                <th scope="col">{t('Ngày tạo')}</th>
                <th scope="col">{t('Hạn dùng')}</th>
                <th scope="col">{t('Người kích hoạt')}</th>
                <th scope="col">{t('Thao tác')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <code>{shown === item.id ? item.licenseKey : masked}</code>
                  </td>
                  <td>
                    <Badge tone={tones[item.state]}>{keyStateLabels[item.state]}</Badge>
                  </td>
                  <td>{item.note || '—'}</td>
                  <td>{formatLocaleDateTime(item.createdAt)}</td>
                  <td>
                    {item.state === 'Activated' && item.periodEnd
                      ? formatLocaleDateTime(item.periodEnd)
                      : item.keyExpiresAt
                        ? formatLocaleDateTime(item.keyExpiresAt)
                        : '—'}
                  </td>
                  <td>
                    {item.activatedBy ? (
                      <>
                        {item.activatedBy.fullName}
                        <br />
                        <small>{item.activatedBy.email}</small>
                      </>
                    ) : item.revokedAt ? (
                      t('Thu hồi lúc {time}', { time: formatLocaleDateTime(item.revokedAt) })
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <div className="row">
                      <button
                        className="btn small"
                        aria-pressed={shown === item.id}
                        onClick={() => setShown(shown === item.id ? null : item.id)}
                      >
                        {shown === item.id ? t('Ẩn key') : t('Hiện key')}
                      </button>
                      <button
                        className="btn small"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(item.licenseKey);
                            setCopied(t('Đã sao chép key.'));
                          } catch {
                            setCopied(
                              t('Không sao chép được. Nhấn Hiện key để sao chép thủ công.'),
                            );
                          }
                        }}
                      >
                        {t('Sao chép key')}
                      </button>
                      {item.state === 'Unused' && (
                        <button className="btn small danger" onClick={() => setRevoking(item)}>
                          {t('Thu hồi')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.items.length && (
            <p className="empty">
              {search || state
                ? t('Không có key phù hợp với bộ lọc.')
                : t('Chưa phát key nào từ kho này.')}
            </p>
          )}
        </div>
        <footer className="pagination">
          <span>
            {t('{length} kết quả · Trang {current}/{pages}', {
              length: data?.totalCount ?? 0,
              current: page,
              pages,
            })}
          </span>
          <div className="row">
            <button
              className="btn small"
              aria-label={t('Trang trước')}
              disabled={!data?.hasPreviousPage || query.isFetching}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn small"
              aria-label={t('Trang sau')}
              disabled={!data?.hasNextPage || query.isFetching}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </State>
      {revoking && (
        <Confirm
          title={t('Thu hồi key')}
          description={t(
            'Thu hồi key có ghi chú "{note}", tạo lúc {time}. Gia đình sẽ không kích hoạt được key này nữa và một suất được trả về kho.',
            {
              note: revoking.note || t('không có ghi chú'),
              time: formatLocaleDateTime(revoking.createdAt),
            },
          )}
          onClose={() => setRevoking(null)}
          onConfirm={async () => {
            try {
              await licenseKeysApi.revoke(actor, revoking);
              setNotice(t('Đã thu hồi key và trả một suất về kho.'));
            } finally {
              // Refetch either way: another admin may have revoked it, or the family just activated it.
              await cache.invalidateQueries({
                predicate: (q) =>
                  ['license-keys', 'license-pool'].includes(String(q.queryKey[0])) &&
                  q.queryKey[1] === actor.id,
              });
            }
          }}
        />
      )}
    </div>
  );
}
