import { t, formatLocaleDateTime } from '../../i18n';
import { RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OrganizationPool } from './ApiLicensePool';
import { useSession } from '../../hooks/useService';
import { Dialog, Confirm, PageHead, State, CardActions } from '../../components/UI';
import {
  getMySubscription,
  isPersonalCaregiver,
  isOrganizationBuyer,
  subscriptionLabels,
} from '../../services/api/licenses';
import { packagePrice, type LicensePackage } from '../../services/api/packages';
import {
  paymentsApi,
  canPay,
  paymentHistoryPath,
  safeCheckoutUrl,
  paymentLabels,
  orderCode,
  type PaymentLink,
} from '../../services/api/payments';
import type { Person } from '../../models/domain';

export function PackageCheckout({
  actor,
  item,
  onClose,
}: {
  actor: Person;
  item: LicensePackage;
  onClose: () => void;
}) {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [failure, setFailure] = useState<Error | null>(null);
  const [link, setLink] = useState<PaymentLink | null>(null);
  const cache = useQueryClient();
  return (
    <Dialog
      title={
        isOrganizationBuyer(actor) ? t('Thanh toán gói Business') : t('Thanh toán gói Personal')
      }
      onClose={() => {
        if (!busy.current) onClose();
      }}
    >
      <div className="stack">
        <dl className="record-details">
          <div>
            <dt>{t('Gói đã chọn')}</dt>
            <dd>
              <strong>{item.name}</strong>
            </dd>
          </div>
          <div>
            <dt>{t('Giá đang xem')}</dt>
            <dd>
              <strong>{packagePrice(item.priceMonthly, item.currency)}</strong>
            </dd>
          </div>
          <div>
            <dt>{t('Thời hạn')}</dt>
            <dd>{t('{durationDays} ngày', { durationDays: item.durationDays })}</dd>
          </div>
        </dl>
        {isOrganizationBuyer(actor) && (
          <p>
            {t(
              'Mua mới hoặc bổ sung license do máy chủ quyết định. Khi gia hạn kho hiện có, thời hạn được tính lại từ ngày thanh toán; chưa hỗ trợ đổi sang gói khác.',
            )}
          </p>
        )}
        <p>
          {t(
            'Máy chủ sẽ kiểm tra lại gói và tạo đơn. Chỉ thanh toán khi bạn tiếp tục sang PayOS và xác nhận chuyển tiền.',
          )}
        </p>
        {failure && (
          <State error={failure}>
            <span />
          </State>
        )}
        {!link && (
          <button
            className="btn primary"
            disabled={pending || attempted}
            onClick={async () => {
              if (busy.current || attempted) return;
              busy.current = true;
              setPending(true);
              setAttempted(true);
              setFailure(null);
              try {
                setLink(await paymentsApi.create(actor, item, window.location.origin));
              } catch (error) {
                setFailure(
                  error instanceof Error
                    ? error
                    : new Error(t('Không xác nhận được việc tạo đơn.')),
                );
              } finally {
                await cache.invalidateQueries({ queryKey: ['payments', actor.id] });
                busy.current = false;
                setPending(false);
              }
            }}
          >
            {pending ? t('Đang tạo đơn…') : t('Tạo đơn thanh toán')}
          </button>
        )}
        {link && (
          <>
            <p role="status">
              {t('Đã tạo đơn {orderCode}. Chưa xác nhận thanh toán.', {
                orderCode: link.orderCode,
              })}
            </p>
            <p>
              {t('Số tiền đơn do máy chủ trả về:')}{' '}
              <strong>{packagePrice(link.amount, link.currency)}</strong>
              {t('. Kiểm tra số tiền trên PayOS trước khi trả.')}
            </p>
            <a className="btn primary" href={safeCheckoutUrl(link.checkoutUrl)!} rel="noreferrer">
              {t('Tiếp tục sang PayOS')}
            </a>
            <Link to={'/payments/return?orderCode=' + link.orderCode}>
              {t('Kiểm tra trạng thái đơn')}
            </Link>
          </>
        )}
        {failure && (
          <p>
            {t('Yêu cầu có thể đã tạo giao dịch trên máy chủ. Kiểm tra lịch sử trước khi tạo lại.')}
          </p>
        )}
        <Link to={paymentHistoryPath(actor)}>{t('Lịch sử thanh toán')}</Link>
      </div>
    </Dialog>
  );
}
export function ApiPayments({ result = false }: { result?: boolean }) {
  const { data: actor } = useSession();
  const [search] = useSearchParams();
  const location = useLocation();
  if (!actor) return null;
  if (!canPay(actor))
    return (
      <p className="notice">
        {t('Luồng thanh toán này dành cho Caregiver cá nhân hoặc quản trị trung tâm có tổ chức.')}
      </p>
    );
  return result ? (
    <PaymentResult
      key={actor.id + actor.orgId + location.pathname + search.toString()}
      actor={actor}
      code={orderCode(search.get('orderCode'))}
      cancelled={location.pathname === '/payments/cancel'}
    />
  ) : (
    <PaymentHistory key={actor.id + actor.orgId} actor={actor} />
  );
}
function PaymentHistory({ actor }: { actor: Person }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['payments', actor.id, actor.orgId, 'history', page],
    queryFn: ({ signal }) => paymentsApi.list(actor, page, signal),
  });
  return (
    <>
      <PageHead
        title={t('Lịch sử thanh toán')}
        description={t('Các đơn thanh toán gói dịch vụ của bạn.')}
      />
      <section className="glass card stack">
        <CardActions>
          {
            <>
              <button
                className="btn small"
                aria-label={t('Tải lại lịch sử')}
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                <RefreshCw size={16} aria-hidden="true" /> {t('Tải lại')}
              </button>
              <Link className="btn" to="/packages">
                {isOrganizationBuyer(actor) ? t('Chọn gói Business') : t('Chọn gói Personal')}
              </Link>
            </>
          }
        </CardActions>
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          <div className="table-scroll">
            <table>
              <caption className="sr-only">{t('Giao dịch của tôi')}</caption>
              <thead>
                <tr>
                  <th>{t('Mã đơn')}</th>
                  <th>{t('Số tiền')}</th>
                  <th>{t('Trạng thái')}</th>
                  <th>{t('Ngày tạo')}</th>
                  <th>{t('Thao tác')}</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.payosOrderId}</td>
                    <td>{packagePrice(item.amount, item.currency)}</td>
                    <td>{paymentLabels[item.status]}</td>
                    <td>{formatLocaleDateTime(item.createdAt)}</td>
                    <td>
                      <Link className="btn" to={'/payments/return?orderCode=' + item.payosOrderId}>
                        {t('Xem trạng thái')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {query.data?.items.length === 0 && <p>{t('Chưa có giao dịch trên trang này.')}</p>}
          {query.data && (
            <footer className="row pagination">
              <span>
                {t('{totalCount} giao dịch · Trang {page}/{p4}', {
                  totalCount: query.data.totalCount,
                  page,
                  p4: Math.max(1, query.data.totalPages),
                })}
              </span>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('Trang trước')}
              </button>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('Trang sau')}
              </button>
            </footer>
          )}
        </State>
      </section>
    </>
  );
}
function PaymentResult({
  actor,
  code,
  cancelled,
}: {
  actor: Person;
  code: string | null;
  cancelled: boolean;
}) {
  const cache = useQueryClient();
  const [expired, setExpired] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setExpired(true), 60000);
    return () => window.clearTimeout(timer);
  }, []);
  const query = useQuery({
    queryKey: ['payments', actor.id, actor.orgId, 'result', code],
    queryFn: ({ signal }) => paymentsApi.find(actor, code!, signal),
    enabled: !!code,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: (q) =>
      !expired &&
      !cancelling &&
      !q.state.error &&
      (!q.state.data || q.state.data.status === 'Pending')
        ? 5000
        : false,
    retry: false,
  });
  const payment = query.data;
  const success = !query.isError && payment?.status === 'Success';
  useEffect(() => {
    if (success) {
      void cache.invalidateQueries({ queryKey: ['session'] });
      void cache.invalidateQueries({ queryKey: ['license-subscription', actor.id] });
      void cache.invalidateQueries({ queryKey: ['license-pool', actor.id, actor.orgId] });
      void cache.invalidateQueries({ queryKey: ['payments', actor.id, actor.orgId, 'history'] });
    }
  }, [success, actor.id, actor.orgId, cache]);
  const subscription = useQuery({
    queryKey: ['license-subscription', actor.id, actor.orgId],
    queryFn: ({ signal }) => getMySubscription(actor, signal),
    enabled: success && isPersonalCaregiver(actor),
    retry: false,
  });
  const checkout = payment?.status === 'Pending' ? safeCheckoutUrl(payment.payosCheckoutUrl) : null;
  return (
    <>
      <PageHead
        title={t('Kiểm tra thanh toán')}
        description={t('Theo dõi trạng thái đơn và xác nhận thanh toán từ VisionAid.')}
      />
      <section className="glass card stack">
        {cancelled && (
          <p className="notice">
            {t(
              'Bạn đã quay về từ thao tác hủy trên cổng thanh toán. Trạng thái thực tế được kiểm tra bên dưới; trang này không tự hủy đơn.',
            )}
          </p>
        )}
        {!code ? (
          <p className="notice error">
            {t('Liên kết thiếu mã đơn hợp lệ. Mở giao dịch từ lịch sử thanh toán.')}
          </p>
        ) : (
          <>
            <p>{t('Mã đơn: {code}', { code })}</p>
            <button
              className="btn"
              disabled={query.isFetching || cancelling}
              onClick={() => void query.refetch()}
            >
              {t('Kiểm tra lại thanh toán')}
            </button>
            <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
              {!payment && (
                <p>
                  {t(
                    'Chưa tìm thấy giao dịch trong lịch sử của tài khoản này. Hãy kiểm tra tài khoản hoặc tải lại; chưa thể xác nhận thanh toán.',
                  )}
                </p>
              )}
              {payment && (
                <>
                  <p role="status" className="payment-status">
                    <strong>{paymentLabels[payment.status]}</strong>
                  </p>
                  <p className="payment-amount">{packagePrice(payment.amount, payment.currency)}</p>
                  {payment.status === 'Pending' && (
                    <>
                      <p>
                        {expired
                          ? t(
                              'Đã hết thời gian chờ tự động. Nếu đã trả tiền, hãy kiểm tra lại sau; không tạo đơn khác để trả thêm.',
                            )
                          : t(
                              'Đang chờ xác nhận thanh toán. Việc cập nhật có thể mất một lúc; không cần thanh toán lại.',
                            )}
                      </p>
                      {checkout && !query.isFetching && (
                        <a className="btn primary" href={checkout} rel="noreferrer">
                          {t('Tiếp tục sang PayOS')}
                        </a>
                      )}
                      {!checkout && (
                        <p>
                          {t(
                            'Chưa có liên kết PayOS hợp lệ để tiếp tục. Hãy kiểm tra lại hoặc liên hệ hỗ trợ.',
                          )}
                        </p>
                      )}
                      <button
                        className="btn danger"
                        disabled={query.isFetching || cancelling}
                        onClick={() => setConfirmCancel(true)}
                      >
                        {t('Hủy đơn thanh toán')}
                      </button>
                    </>
                  )}
                  {payment.paidAt && (
                    <p>
                      {t('Thời điểm thanh toán: {p1}', {
                        p1: formatLocaleDateTime(payment.paidAt),
                      })}
                    </p>
                  )}
                  {payment.status === 'Failed' && (
                    <p>
                      {t(
                        'Máy chủ ghi nhận giao dịch thất bại. Kiểm tra lịch sử và liên hệ hỗ trợ nếu tài khoản đã bị trừ tiền.',
                      )}
                    </p>
                  )}
                </>
              )}
            </State>
            {!payment && expired && !query.isError && (
              <p>{t('Đã dừng chờ tự động. Dùng Kiểm tra lại thanh toán hoặc tra cứu lịch sử.')}</p>
            )}
            {success && isPersonalCaregiver(actor) && (
              <State
                loading={subscription.isPending}
                error={subscription.error}
                retry={() => subscription.refetch()}
              >
                {subscription.data && (
                  <p>
                    {t('Gói sử dụng hiện tại: {p1}. Quyền sử dụng do máy chủ quyết định.', {
                      p1: subscriptionLabels[subscription.data.status],
                    })}
                  </p>
                )}
              </State>
            )}
          </>
        )}
        {success && isOrganizationBuyer(actor) && <OrganizationPool actor={actor} embedded />}
        <Link to={isOrganizationBuyer(actor) ? '/center-admin/licenses' : '/license'}>
          {t('Xem license')}
        </Link>
        <Link to={paymentHistoryPath(actor)}>{t('Lịch sử thanh toán')}</Link>
      </section>
      {confirmCancel && payment && (
        <Confirm
          title={t('Hủy đơn thanh toán')}
          description={
            t('Hủy đơn ') +
            payment.payosOrderId +
            t('? Liên kết thanh toán sẽ không còn sử dụng được nếu máy chủ hủy thành công.')
          }
          onClose={() => {
            if (!cancelling) setConfirmCancel(false);
          }}
          onConfirm={async () => {
            setCancelling(true);
            try {
              await paymentsApi.cancel(actor, payment);
              setConfirmCancel(false);
            } finally {
              await cache.invalidateQueries({ queryKey: ['payments', actor.id] });
              setCancelling(false);
            }
          }}
        />
      )}
    </>
  );
}
