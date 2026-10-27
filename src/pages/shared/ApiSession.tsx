import { t } from '../../i18n';
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
        description={t('Một nơi để kết nối, chăm sóc và cùng nhau an tâm hơn.')}
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
