import { t, intlLocale } from '../../i18n';
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/UI';
import { useSession } from '../../hooks/useService';
import { DashboardOverview } from './DashboardOverview';

export function ApiSession() {
  const { data: user } = useSession();
  return (
    <>
      <PageHead
        title={t('Xin chào{p0}.', { p0: user ? ', ' + user.name.split(' ').at(-1) : '' })}
        description={
          user?.role === 'Admin'
            ? t('Tình hình toàn hệ thống hôm nay.')
            : user?.role === 'CenterAdmin'
              ? t('Tình hình trung tâm của bạn hôm nay.')
              : t('Tình hình những người bạn đang chăm sóc.')
        }
        actions={
          <span className="badge">
            {new Intl.DateTimeFormat(intlLocale(), {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              timeZone: 'Asia/Ho_Chi_Minh',
            }).format(new Date())}
          </span>
        }
      />
      {user && <DashboardOverview key={user.id + user.orgId + user.role} actor={user} />}
    </>
  );
}
export function ApiPending() {
  return (
    <section className="glass card stack">
      <h1>{t('Chức năng chưa sẵn sàng')}</h1>
      <p>{t('Màn hình này chưa được kết nối với máy chủ.')}</p>
      <Link className="btn" to="/dashboard">
        {t('Về thông tin phiên')}
      </Link>
    </section>
  );
}
