import { t, msg } from '../../i18n';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowRight, MapPin, ShieldCheck, Volume2, Menu, X } from 'lucide-react';
import { Brand } from '../../components/UI';
import { runtime } from '../../configs/runtime';
import './landing.css';

const capabilities = [
  {
    title: msg('Vị trí và vùng an toàn'),
    text: msg(
      'Theo dõi vị trí được chia sẻ, lưu địa điểm quen thuộc và nhận biết khi người thân ra khỏi vùng an toàn.',
    ),
  },
  {
    title: msg('Cảnh báo khẩn cấp'),
    text: msg(
      'Tiếp nhận cảnh báo khẩn cấp, phối hợp hỗ trợ và theo dõi lịch sử xử lý trong một không gian chung.',
    ),
  },
  {
    title: msg('Ứng dụng của người khiếm thị'),
    text: msg(
      'Ứng dụng di động được thiết kế để hỗ trợ nhận biết vật thể, đọc văn bản và nhận diện gương mặt quen thuộc. Khả năng hoạt động còn phụ thuộc thiết bị và điều kiện sử dụng.',
    ),
  },
];

export function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="landing">
      <a className="skip" href="#landing-main">
        {t('Đến nội dung chính')}
      </a>
      <header className="landing-header landing-wrap">
        <Brand />
        <nav
          id="landing-navigation"
          aria-label={t('Điều hướng trang chủ')}
          className={'landing-nav' + (menuOpen ? ' is-open' : '')}
          onClick={() => setMenuOpen(false)}
        >
          <a href="#features">{t('Tính năng')}</a>
          <a href="#how-it-works">{t('Cách hoạt động')}</a>
          <a href="#for-you">{t('Gói & mô hình')}</a>
          <LanguageSwitch className="landing-lang-menu" />
        </nav>
        <div className="landing-header-actions">
          <LanguageSwitch className="landing-lang" />
          <Link className="btn" to="/auth/login">
            {t('Đăng nhập')} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <button
          className="btn landing-mobile-menu"
          aria-label={menuOpen ? t('Đóng menu') : t('Mở menu')}
          aria-expanded={menuOpen}
          aria-controls="landing-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </header>

      <main id="landing-main" tabIndex={-1}>
        <section className="landing-hero landing-wrap" aria-labelledby="landing-title">
          <div className="landing-intro">
            <h1 id="landing-title">
              <span>{t('Biết người thân đang ở đâu.')}</span>
              <span>{t('Nhận cảnh báo khi họ cần.')}</span>
            </h1>
            <p>
              {t(
                'Người khiếm thị dùng ứng dụng VisionAid trên điện thoại để tránh vật cản, đọc chữ và gọi trợ giúp. Người chăm sóc dùng trang Web này để xem vị trí, nhận cảnh báo và quản lý thông tin hỗ trợ.',
              )}
            </p>
            <div className="row landing-actions">
              <Link className="btn primary" to="/auth/register">
                {t('Tạo tài khoản người chăm sóc')} <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a className="landing-text-link" href="#how-it-works">
                {t('Xem cách hoạt động')}
              </a>
            </div>
            <p className="landing-assurance">{t('Dành cho gia đình và các trung tâm chăm sóc')}</p>
          </div>
          <div
            className="landing-visual"
            role="img"
            aria-label={t(
              'Minh họa kết nối giữa ứng dụng di động và người chăm sóc, với vị trí và thông báo hỗ trợ.',
            )}
          >
            <div className="landing-phone">
              <div className="phone-speaker" />
              <div className="row between">
                <span className="eyebrow">VISIONAID</span>
                <ShieldCheck size={18} />
              </div>
              <p className="phone-greeting">
                {t('Phía trước có bậc thềm,')}
                <br />
                <strong>{t('cách khoảng 2 mét.')}</strong>
              </p>
              <div className="landing-map">
                <svg viewBox="0 0 260 200" aria-hidden="true">
                  <path
                    d="M-10 50H110V210M180 -10V115H270M-10 155H60V-10"
                    fill="none"
                    stroke="white"
                    strokeWidth="14"
                  />
                  <path
                    d="M115 150V92Q115 78 130 78H180V48"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="4"
                    strokeDasharray="6 6"
                  />
                  <circle cx="115" cy="150" r="19" fill="var(--primary)" fillOpacity=".15" />
                  <circle
                    cx="115"
                    cy="150"
                    r="7"
                    fill="var(--primary)"
                    stroke="white"
                    strokeWidth="3"
                  />
                  <circle cx="180" cy="48" r="6" fill="var(--primary)" />
                </svg>
                <span>
                  <MapPin size={14} /> {t('Địa điểm quen thuộc')}
                </span>
              </div>
              <div className="phone-voice">
                <Volume2 size={21} />
                <div>
                  <strong>{t('Đang dẫn đường')}</strong>
                  <small>{t('Hỗ trợ bằng giọng nói')}</small>
                </div>
              </div>
              <div className="phone-home" />
            </div>
            <div className="landing-float float-location">
              <strong>{t('Đã đến nơi')}</strong>
              <small>{t('Nhà văn hóa phường')}</small>
            </div>
            <div className="landing-float float-support">
              <strong>{t('Cảnh báo đã được tiếp nhận')}</strong>
              <small>{t('bởi người chăm sóc chính')}</small>
            </div>
            <span className="visual-caption">{t('Minh họa trải nghiệm VisionAid')}</span>
          </div>
        </section>

        <section
          className="landing-section landing-wrap"
          id="features"
          aria-labelledby="features-title"
        >
          <div className="landing-features">
            <div className="landing-section-head">
              <h2 id="features-title">{t('Người chăm sóc làm gì trên Web.')}</h2>
              <p>
                {t('Mọi thao tác đều theo quyền mà người khiếm thị hoặc trung tâm đã cấp cho bạn.')}
              </p>
            </div>
            <dl className="landing-feature-list">
              {capabilities.map(({ title, text }) => (
                <div key={title}>
                  <dt>{t(title)}</dt>
                  <dd>{t(text)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="notice">
            {t(
              'VisionAid đang trong giai đoạn kiểm thử liên thông. Hybrid AI, cuộc gọi và thông báo cần được xác minh cùng ứng dụng di động trước khi sử dụng thực tế; trang này không cam kết mọi tính năng đã sẵn sàng trên mọi thiết bị.',
            )}
          </p>
        </section>

        <section className="landing-section landing-wrap" aria-labelledby="hybrid-title">
          <div className="landing-how glass">
            <div>
              <h2 id="hybrid-title">{t('Nhận biết trên thiết bị. Kết nối khi cần.')}</h2>
              <p>
                {t(
                  'Hybrid AI kết hợp xử lý trên điện thoại và máy chủ. Web là nơi người chăm sóc theo dõi và phối hợp hỗ trợ, không phải công cụ chỉ đường trực tiếp.',
                )}
              </p>
            </div>
            <div className="stack">
              <h3>{t('Vật thể ở gần')}</h3>
              <p>
                {t(
                  'Theo thiết kế, điện thoại xử lý cảnh báo gần bằng YOLOv8n ngay trên thiết bị, để không phụ thuộc phản hồi từ máy chủ cho phần này.',
                )}
              </p>
              <h3>{t('Vật thể ở khoảng cách trung bình và xa')}</h3>
              <p>
                {t(
                  'Khi có kết nối và tính năng được bật, dữ liệu nhận biết được gửi đến máy chủ để xử lý hướng dẫn. Chất lượng camera, mạng và cấu hình có thể ảnh hưởng kết quả.',
                )}
              </p>
              <h3>{t('Trao đổi với người chăm sóc')}</h3>
              <p>
                {t(
                  'Luồng gọi âm thanh/video giúp hai bên phối hợp khi được cấp quyền và thiết bị hỗ trợ. Cần cho phép micro hoặc camera khi bắt đầu; đây không phải dịch vụ cứu hộ.',
                )}
              </p>
            </div>
          </div>
        </section>

        <section
          className="landing-section landing-wrap"
          id="how-it-works"
          aria-labelledby="steps-title"
        >
          <div className="landing-how glass">
            <div>
              <h2 id="steps-title">{t('Bắt đầu trong ba bước.')}</h2>
              <p>
                {t(
                  'Ứng dụng di động dành cho người khiếm thị. Không gian Web dành cho những người đồng hành.',
                )}
              </p>
              <Link className="landing-text-link" to="/auth/login">
                {t('Vào không gian chăm sóc')} <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <ol className="landing-steps">
              {[
                [
                  t('Tạo tài khoản người chăm sóc'),
                  t('Đăng ký cho gia đình hoặc đăng nhập bằng tài khoản được trung tâm cấp.'),
                ],
                [
                  t('Liên kết với người thân'),
                  t('Kết nối với người khiếm thị và thiết lập quyền chăm sóc phù hợp.'),
                ],
                [
                  t('Đồng hành mỗi ngày'),
                  t(
                    'Theo dõi thông tin được chia sẻ, quản lý địa điểm và phối hợp khi có cảnh báo.',
                  ),
                ],
              ].map(([title, text], i) => (
                <li key={title}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="landing-section landing-wrap"
          id="for-you"
          aria-labelledby="audience-title"
        >
          <div className="landing-section-head">
            <h2 id="audience-title">{t('Dành cho gia đình và trung tâm.')}</h2>
            <p>
              {t(
                'Gia đình sử dụng Personal; trung tâm sử dụng Business. Đăng nhập để xem gói, giá và quyền lợi hiện được cung cấp cho tài khoản của bạn.',
              )}
            </p>
          </div>
          <div className="landing-audiences">
            <article>
              <h3>{t('Personal · Gia đình')}</h3>
              <p>
                {t(
                  'Người chăm sóc quản lý người thân được liên kết, thông tin hỗ trợ và quyền sử dụng dành cho gia đình. Tạo tài khoản người chăm sóc để bắt đầu.',
                )}
              </p>
            </article>
            <article>
              <h3>{t('Business · Trung tâm')}</h3>
              <p>
                {t(
                  'Trung tâm quản lý kho license, phân công nhân viên và theo dõi người được chăm sóc trong tổ chức. Nhân viên dùng tài khoản do trung tâm cấp.',
                )}
              </p>
            </article>
            <article>
              <h3>{t('Standalone · Trung tâm đồng hành')}</h3>
              <p>
                {t(
                  'Người khiếm thị thuộc tổ chức được nhân viên chăm sóc hỗ trợ qua ứng dụng di động và danh bạ khẩn cấp. Đây là mô hình sử dụng trong tổ chức, không phải một vai trò tài khoản hoặc gói mua riêng.',
                )}
              </p>
            </article>
          </div>
          <Link className="btn" to="/auth/login">
            {t('Đăng nhập để xem gói')}
          </Link>
        </section>

        <section className="landing-section landing-wrap" aria-labelledby="usage-title">
          <div className="landing-how glass">
            <div>
              <h2 id="usage-title">{t('Chuẩn bị trước mỗi hành trình.')}</h2>
              <p>
                {t(
                  'VisionAid là công cụ hỗ trợ. Tiếp tục sử dụng gậy trắng và thiết bị hỗ trợ phù hợp; không dựa hoàn toàn vào camera hoặc một cảnh báo trên ứng dụng để di chuyển.',
                )}
              </p>
            </div>
            <ul className="stack">
              <li>
                <strong>{t('Bắt buộc dùng đai đeo ngực.')}</strong>{' '}
                {t(
                  'Cố định điện thoại bằng chest strap để camera hướng về phía trước khi dùng chức năng nhận biết trên hành trình.',
                )}
              </li>
              <li>
                <strong>{t('Camera có điểm mù.')}</strong>{' '}
                {t(
                  'Thiếu sáng, mưa hoặc ống kính bị che có thể làm giảm khả năng nhận biết. Không coi việc không có cảnh báo là đường đi an toàn.',
                )}
              </li>
              <li>
                <strong>{t('Kiểm tra thiết bị và liên hệ hỗ trợ.')}</strong>{' '}
                {t(
                  'Chuẩn bị pin, quyền truy cập cần thiết và danh bạ khẩn cấp; tính năng dùng máy chủ hoặc gọi cần kết nối phù hợp.',
                )}
              </li>
            </ul>
          </div>
        </section>

        <section className="landing-wrap landing-cta" aria-labelledby="cta-title">
          <div>
            <h2 id="cta-title">{t('Liên kết người thân đầu tiên.')}</h2>
            <p>{t('Sau khi đăng ký, bạn liên kết với người khiếm thị và chọn quyền chăm sóc.')}</p>
          </div>
          <Link className="btn" to="/auth/register">
            {t('Tạo tài khoản')} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <footer className="landing-footer landing-wrap">
        <div>
          <Link to="/" aria-label={t('VisionAid · Trang chủ')}>
            <img
              className="brand-full"
              src="/branding/visionaid-logo.png"
              alt="VisionAid: AI solutions for visually impaired"
              width={200}
              height={200}
              loading="lazy"
            />
          </Link>
          <p>{t('Trang Web dành cho người chăm sóc người khiếm thị.')}</p>
        </div>
        <p>
          {t('VisionAid · Dự án FA26SE013')}
          <br />
          <span>
            {runtime.mode === 'mock'
              ? t('Bản trải nghiệm sử dụng dữ liệu mô phỏng.')
              : t('Bản thử nghiệm · Các tính năng liên thông đang được kiểm thử.')}
          </span>
        </p>
        <Link to="/auth/login">
          {t('Đăng nhập')} <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
