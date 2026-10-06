import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { Dialog, Confirm, PageHead, State } from '../../components/UI';
import {
  getMySubscription,
  isPersonalCaregiver,
  subscriptionLabels,
} from '../../services/api/licenses';
import { packagePrice, type LicensePackage } from '../../services/api/packages';
import {
  paymentsApi,
  safeCheckoutUrl,
  paymentLabels,
  orderCode,
  type PaymentLink,
} from '../../services/api/payments';
import type { Person } from '../../models/domain';

export function PersonalCheckout({
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
      title="Thanh toán gói Personal"
      onClose={() => {
        if (!busy.current) onClose();
      }}
    >
      <div className="stack">
        <strong>{item.name}</strong>
        <p>
          Giá đang xem: {packagePrice(item.priceMonthly, item.currency)} · {item.durationDays} ngày.
        </p>
        <p>
          Máy chủ sẽ kiểm tra lại gói và tạo đơn. Chỉ thanh toán khi bạn tiếp tục sang PayOS và xác
          nhận chuyển tiền.
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
                  error instanceof Error ? error : new Error('Không xác nhận được việc tạo đơn.'),
                );
              } finally {
                await cache.invalidateQueries({ queryKey: ['payments', actor.id] });
                busy.current = false;
                setPending(false);
              }
            }}
          >
            {pending ? 'Đang tạo đơn…' : 'Tạo đơn thanh toán'}
          </button>
        )}
        {link && (
          <>
            <p role="status">Đã tạo đơn {link.orderCode}. Chưa xác nhận thanh toán.</p>
            <p>
              Số tiền đơn do máy chủ trả về:{' '}
              <strong>{packagePrice(link.amount, link.currency)}</strong>. Kiểm tra số tiền trên
              PayOS trước khi trả.
            </p>
            <a className="btn primary" href={safeCheckoutUrl(link.checkoutUrl)!} rel="noreferrer">
              Tiếp tục sang PayOS
            </a>
            <Link to={'/payments/return?orderCode=' + link.orderCode}>Kiểm tra trạng thái đơn</Link>
          </>
        )}
        {failure && (
          <p>Yêu cầu có thể đã tạo giao dịch trên máy chủ. Kiểm tra lịch sử trước khi tạo lại.</p>
        )}
        <Link to="/caregiver/payments">Lịch sử thanh toán</Link>
      </div>
    </Dialog>
  );
}
export function ApiPayments({ result = false }: { result?: boolean }) {
  const { data: actor } = useSession();
  const [search] = useSearchParams();
  const location = useLocation();
  if (!actor) return null;
  if (!isPersonalCaregiver(actor))
    return (
      <p className="notice">
        Luồng thanh toán này dành cho Caregiver cá nhân. Thanh toán tổ chức được triển khai ở đợt
        sau.
      </p>
    );
  return result ? (
    <PaymentResult
      key={actor.id + location.pathname + search.toString()}
      actor={actor}
      code={orderCode(search.get('orderCode'))}
      cancelled={location.pathname === '/payments/cancel'}
    />
  ) : (
    <PaymentHistory key={actor.id} actor={actor} />
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
        title="Lịch sử thanh toán"
        description="Trạng thái do máy chủ xác nhận cho tài khoản của bạn."
        actions={
          <Link className="btn" to="/packages">
            Chọn gói Personal
          </Link>
        }
      />
      <section className="glass card stack">
        <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Tải lại lịch sử
        </button>
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          <div className="table-scroll">
            <table>
              <caption className="sr-only">Giao dịch của tôi</caption>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.payosOrderId}</td>
                    <td>{packagePrice(item.amount, item.currency)}</td>
                    <td>{paymentLabels[item.status]}</td>
                    <td>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                    <td>
                      <Link className="btn" to={'/payments/return?orderCode=' + item.payosOrderId}>
                        Xem trạng thái
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {query.data?.items.length === 0 && <p>Chưa có giao dịch trên trang này.</p>}
          {query.data && (
            <footer className="pagination">
              <span>
                {query.data.totalCount} giao dịch · Trang {page}/
                {Math.max(1, query.data.totalPages)}
              </span>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
              >
                Trang trước
              </button>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
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
      void cache.invalidateQueries({ queryKey: ['payments', actor.id, actor.orgId, 'history'] });
    }
  }, [success, actor.id, actor.orgId, cache]);
  const subscription = useQuery({
    queryKey: ['license-subscription', actor.id, actor.orgId],
    queryFn: ({ signal }) => getMySubscription(actor, signal),
    enabled: success,
    retry: false,
  });
  const checkout = payment?.status === 'Pending' ? safeCheckoutUrl(payment.payosCheckoutUrl) : null;
  return (
    <>
      <PageHead
        title="Kiểm tra thanh toán"
        description="Kết quả chỉ được xác nhận qua API của VisionAid."
      />
      <section className="glass card stack">
        {cancelled && (
          <p className="notice">
            Bạn đã quay về từ thao tác hủy trên cổng thanh toán. Trạng thái thực tế được kiểm tra
            bên dưới; trang này không tự hủy đơn.
          </p>
        )}
        {!code ? (
          <p className="notice error">
            Liên kết thiếu mã đơn hợp lệ. Mở giao dịch từ lịch sử thanh toán.
          </p>
        ) : (
          <>
            <p>Mã đơn: {code}</p>
            <button
              className="btn"
              disabled={query.isFetching || cancelling}
              onClick={() => void query.refetch()}
            >
              Kiểm tra lại thanh toán
            </button>
            <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
              {!payment && (
                <p>
                  Chưa tìm thấy giao dịch trong lịch sử của tài khoản này. Hãy kiểm tra tài khoản
                  hoặc tải lại; chưa thể xác nhận thanh toán.
                </p>
              )}
              {payment && (
                <>
                  <p role="status">
                    <strong>{paymentLabels[payment.status]}</strong>
                  </p>
                  <p>{packagePrice(payment.amount, payment.currency)}</p>
                  {payment.status === 'Pending' && (
                    <>
                      <p>
                        {expired
                          ? 'Đã hết thời gian chờ tự động. Nếu đã trả tiền, hãy kiểm tra lại sau; không tạo đơn khác để trả thêm.'
                          : 'Đang chờ máy chủ xác nhận. Webhook có thể đến chậm; không cần thanh toán lại.'}
                      </p>
                      {checkout && !query.isFetching && (
                        <a className="btn primary" href={checkout} rel="noreferrer">
                          Tiếp tục sang PayOS
                        </a>
                      )}
                      {!checkout && (
                        <p>
                          Chưa có liên kết PayOS hợp lệ để tiếp tục. Hãy kiểm tra lại hoặc liên hệ
                          hỗ trợ.
                        </p>
                      )}
                      <button
                        className="btn danger"
                        disabled={query.isFetching || cancelling}
                        onClick={() => setConfirmCancel(true)}
                      >
                        Hủy đơn thanh toán
                      </button>
                    </>
                  )}
                  {payment.paidAt && (
                    <p>Thời điểm thanh toán: {new Date(payment.paidAt).toLocaleString('vi-VN')}</p>
                  )}
                  {payment.status === 'Failed' && (
                    <p>
                      Máy chủ ghi nhận giao dịch thất bại. Kiểm tra lịch sử và liên hệ hỗ trợ nếu
                      tài khoản đã bị trừ tiền.
                    </p>
                  )}
                </>
              )}
            </State>
            {!payment && expired && !query.isError && (
              <p>Đã dừng chờ tự động. Dùng Kiểm tra lại thanh toán hoặc tra cứu lịch sử.</p>
            )}
            {success && (
              <State
                loading={subscription.isPending}
                error={subscription.error}
                retry={() => subscription.refetch()}
              >
                {subscription.data && (
                  <p>
                    Subscription hiện tại: {subscriptionLabels[subscription.data.status]}. Quyền sử
                    dụng do máy chủ quyết định.
                  </p>
                )}
              </State>
            )}
          </>
        )}
        <Link to="/license">Xem license</Link>
        <Link to="/caregiver/payments">Lịch sử thanh toán</Link>
      </section>
      {confirmCancel && payment && (
        <Confirm
          title="Hủy đơn thanh toán"
          description={
            'Hủy đơn ' +
            payment.payosOrderId +
            '? Liên kết thanh toán sẽ không còn sử dụng được nếu máy chủ hủy thành công.'
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
