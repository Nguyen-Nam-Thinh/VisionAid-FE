import { t, msg, useI18n } from '../../i18n';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { ThemeSwitch } from '../../components/ThemeSwitch';
import { useTheme } from '../../stores/theme';
import { Link } from 'react-router-dom';
import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Brand } from '../../components/UI';
import { runtime } from '../../configs/runtime';
import { useSession } from '../../hooks/useService';
// scroll-craft engine (vendored unchanged, MIT): reads data-sc-* attributes and drives them from scroll.
import '../../vendor/scrollcraft/scrollcraft.js';
import engineCss from '../../vendor/scrollcraft/scrollcraft.css?inline';
import './landing.css';

/** Page grounds the scroll engine fades between, per theme (the palette's concrete, ink, tactile). */
const drift = {
  light: { concrete: '#E7E8E2', ink: '#1B1D19', tactile: '#F2C200' },
  dark: { concrete: '#121411', ink: '#1B1D19', tactile: '#F2C200' },
} as const;

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

const steps = [
  [
    msg('Tạo tài khoản người chăm sóc'),
    msg('Đăng ký cho gia đình hoặc đăng nhập bằng tài khoản được trung tâm cấp.'),
  ],
  [
    msg('Liên kết với người thân'),
    msg('Kết nối với người khiếm thị và thiết lập quyền chăm sóc phù hợp.'),
  ],
  [
    msg('Đồng hành mỗi ngày'),
    msg('Theo dõi thông tin được chia sẻ, quản lý địa điểm và phối hợp khi có cảnh báo.'),
  ],
] as const;

/** Hero planes, back to front. Each is its own layer so scroll separates them into depth. */
function HeroScene() {
  return (
    <>
      <div className="lp-plane lp-plane-sky" aria-hidden="true" />
      <svg
        className="lp-plane lp-plane-far"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        data-sc-parallax="-0.4"
      >
        <path
          d="M0 610V520h70v-60h50v40h60v-90h80v110h40v-50h90v-70h60v90h70v-40h60v70h90v-120h70v100h60v-40h80v60h70v-90h60v80h70v-50h90v100h70v-40h90v120Z"
          fill="var(--lp-far)"
        />
      </svg>
      <svg
        className="lp-plane lp-plane-mid"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMaxYMax slice"
        aria-hidden="true"
        data-sc-parallax="-0.9"
      >
        <g fill="var(--lp-mid)">
          <rect x="-20" y="420" width="250" height="260" />
          <rect x="260" y="470" width="170" height="210" />
          <rect x="980" y="380" width="230" height="300" />
          <rect x="1230" y="450" width="240" height="230" />
        </g>
        <g fill="var(--tactile-soft)">
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`a${row}${col}`}
                x={24 + col * 70}
                y={450 + row * 52}
                width="34"
                height="24"
                opacity={(row + col) % 3 === 0 ? 1 : 0.35}
              />
            )),
          )}
          {[0, 1, 2, 3, 4].map((row) =>
            [0, 1].map((col) => (
              <rect
                key={`b${row}${col}`}
                x={1016 + col * 96}
                y={412 + row * 50}
                width="44"
                height="24"
                opacity={(row + col) % 2 === 0 ? 1 : 0.35}
              />
            )),
          )}
        </g>
      </svg>
      <div className="lp-plane lp-plane-ground" data-sc-parallax="-1.3" aria-hidden="true">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMaxYMax slice">
          <path d="M-40 680H1480V980H-40Z" fill="var(--lp-walk)" />
          <path d="M-40 678H1480" stroke="var(--line-strong)" strokeWidth="3" />
          {/* Guiding strip in perspective, the walker's feet on it. */}
          <path d="M1020 680h100l290 300H780Z" fill="var(--tactile)" />
          <g stroke="var(--lp-bar)" strokeWidth="8" strokeLinecap="round">
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M${1034 + i * 24} 692L${860 + i * 150} 960`} />
            ))}
          </g>
          {/* Pictogram walker, signage-style: head, body, chest-strapped phone, white cane. */}
          <g transform="translate(1080 392)">
            <circle cx="104" cy="44" r="30" fill="var(--ink)" />
            <path
              d="M70 92h66q22 0 26 24l14 108-24 4-14-86v266h-32V280h-10v128H64V142l-12 86-24-4 16-108q4-24 26-24Z"
              fill="var(--ink)"
            />
            <rect x="86" y="118" width="38" height="56" rx="7" fill="var(--panel)" />
            <circle cx="105" cy="132" r="7" fill="var(--tactile)" />
            <path d="M44 226L-30 408" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" />
            <path
              d="M-14 368L-30 408"
              stroke="var(--signal)"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>
      <div className="lp-plane lp-plane-front" data-sc-parallax="-2.2" aria-hidden="true">
        <svg className="lp-lamp" viewBox="0 0 80 900" preserveAspectRatio="xMidYMax meet">
          <rect x="30" y="80" width="20" height="840" fill="var(--ink)" />
          <rect x="6" y="56" width="68" height="34" rx="8" fill="var(--ink)" />
          <rect x="16" y="88" width="48" height="10" fill="var(--tactile)" />
        </svg>
        <div className="lp-domes" />
      </div>
    </>
  );
}

/** Signature move: an obstacle walks toward the user through three detection bands. */
function RangeRings() {
  return (
    <svg
      className="lp-rings"
      viewBox="0 0 400 440"
      role="img"
      aria-label={t('Minh họa: vật cản tiến lại gần qua ba vùng nhận biết.')}
    >
      <g fill="none" strokeWidth="2">
        <path className="lp-band lp-band-far" d="M-110 400a310 310 0 0 1 620 0" />
        <path className="lp-band lp-band-mid" d="M-10 400a210 210 0 0 1 420 0" />
        <path className="lp-band lp-band-near" d="M90 400a110 110 0 0 1 220 0" />
      </g>
      <g className="lp-band-labels" fontSize="13" fontWeight="700">
        <text x="200" y="104" textAnchor="middle" className="lp-band-far">
          {t('Xa')} · {t('Máy chủ')}
        </text>
        <text x="200" y="204" textAnchor="middle" className="lp-band-mid">
          {t('Trung bình')} · {t('Máy chủ')}
        </text>
        <text x="200" y="304" textAnchor="middle" className="lp-band-near">
          {t('Gần')} · {t('Trên điện thoại')}
        </text>
      </g>
      <path
        className="lp-route"
        d="M200 384V300Q200 262 244 250Q274 240 270 200V40"
        pathLength="1"
      />
      <g className="lp-obstacle">
        <rect x="170" y="40" width="60" height="26" rx="5" />
        <path d="M170 53h60" />
      </g>
      <circle cx="200" cy="400" r="22" className="lp-user" />
      <circle cx="200" cy="400" r="8" className="lp-user-dot" />
    </svg>
  );
}

export function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  // A signed-in visitor goes straight back to their workspace instead of being offered sign-in.
  const { data: user } = useSession();
  const { locale } = useI18n();
  // Drift colours are read when the engine mounts, so a theme change remounts the page too.
  const theme = useTheme();
  const ground = drift[theme];
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const engine = window.ScrollCraft;
    if (!engine || !root.current) return;
    // The engine's stylesheet resets html/body/img globally, so it lives in a low cascade layer
    // and only while the public home is on screen.
    const style = document.createElement('style');
    style.dataset.scrollcraft = '';
    style.textContent = `@layer scrollcraft {${engineCss}}`;
    document.head.prepend(style);
    const instance = engine.mount(root.current);
    return () => {
      instance.destroy();
      style.remove();
      // Drift writes the page ground onto <html>; leave nothing behind for the workspace.
      document.documentElement.style.removeProperty('--sc-canvas');
    };
    // Kinetic lines split text nodes, so a new language remounts the page (see key below).
  }, [locale, theme]);
  const start = user ? (
    <Link className="btn primary" to="/dashboard">
      {t('Vào không gian chăm sóc')} <ArrowRight size={18} aria-hidden="true" />
    </Link>
  ) : (
    <Link className="btn primary" to="/auth/register">
      {t('Tạo tài khoản người chăm sóc')} <ArrowRight size={18} aria-hidden="true" />
    </Link>
  );
  return (
    <div className="landing" ref={root} key={locale + theme}>
      <a className="skip" href="#landing-main">
        {t('Đến nội dung chính')}
      </a>
      <header className="landing-header">
        <div className="landing-header-inner landing-wrap">
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
            <ThemeSwitch />
            <LanguageSwitch className="landing-lang" />
            {user ? (
              <Link className="btn" to="/dashboard">
                {t('Tổng quan')} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ) : (
              <Link className="btn" to="/auth/login">
                {t('Đăng nhập')} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
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
        </div>
      </header>

      <main id="landing-main" tabIndex={-1}>
        {/* 1 · Recognition: the street, in layers. */}
        <section
          className="lp-hero"
          data-sc-act="pin"
          data-sc-span="1.9"
          data-sc-drift={ground.concrete}
          aria-labelledby="landing-title"
        >
          <div className="sc-stage lp-hero-stage">
            <div
              className="lp-scene"
              role="img"
              aria-label={t(
                'Người khiếm thị đi trên vỉa hè có gạch dẫn hướng, cầm gậy trắng và đeo điện thoại trước ngực.',
              )}
            >
              <HeroScene />
            </div>
            <div className="lp-hero-copy landing-wrap" data-sc-cue="0 0.82 0">
              <h1 id="landing-title">
                <span>{t('Biết người thân đang ở đâu.')}</span>
                <span>{t('Nhận cảnh báo khi họ cần.')}</span>
              </h1>
              <p>
                {t(
                  'Người khiếm thị dùng ứng dụng VisionAid trên điện thoại để tránh vật cản, đọc chữ và gọi trợ giúp. Người chăm sóc dùng trang Web này để xem vị trí, nhận cảnh báo và quản lý thông tin hỗ trợ.',
                )}
              </p>
              <div className="landing-actions">
                {start}
                <a className="landing-text-link" href="#how-it-works">
                  {t('Xem cách hoạt động')}
                </a>
              </div>
              <p className="landing-assurance">
                {t('Dành cho gia đình và các trung tâm chăm sóc')}
              </p>
            </div>
            <p className="lp-voice" data-sc-cue="0.42 0.96">
              {t('Phía trước có bậc thềm,')} <strong>{t('cách khoảng 2 mét.')}</strong>
            </p>
          </div>
        </section>

        {/* 2 · Tension: two people at either end of the same walk. */}
        <section
          className="lp-two"
          data-sc-act="pin"
          data-sc-span="2.4"
          data-sc-drift={ground.ink}
          aria-labelledby="two-title"
        >
          <div className="sc-stage lp-two-stage">
            <div className="lp-bars" aria-hidden="true" />
            <div className="lp-two-copy landing-wrap">
              <h2
                id="two-title"
                className="lp-two-line"
                data-sc-cue="0 0.4 0"
                data-sc-kinetic="words"
              >
                {t('Một người bước đi với gậy trắng và điện thoại đeo trước ngực.')}
              </h2>
              <p className="lp-two-line" data-sc-cue="0.32 0.7" data-sc-kinetic="words">
                {t('Một người ở xa muốn biết họ có an toàn không.')}
              </p>
              <p className="lp-two-line is-turn" data-sc-cue="0.62 1 0.3 0" data-sc-kinetic="words">
                {t('VisionAid nối hai đầu của cùng một hành trình.')}
              </p>
            </div>
          </div>
        </section>

        {/* 3 · Peak: the detection rings. Scroll walks the obstacle in. */}
        <section
          className="lp-peak"
          data-sc-act="pin"
          data-sc-span="3.6"
          data-sc-drift={ground.tactile}
          aria-labelledby="hybrid-title"
        >
          <div className="sc-stage lp-peak-stage">
            <div className="lp-peak-grid landing-wrap">
              <div className="lp-peak-copy">
                <h2 id="hybrid-title">{t('Nhận biết trên thiết bị. Kết nối khi cần.')}</h2>
                <p className="lp-peak-lede">
                  {t(
                    'Hybrid AI kết hợp xử lý trên điện thoại và máy chủ. Web là nơi người chăm sóc theo dõi và phối hợp hỗ trợ, không phải công cụ chỉ đường trực tiếp.',
                  )}
                </p>
                <div className="lp-peak-notes">
                  <div className="lp-note" data-sc-cue="0.08 0.76">
                    <h3>{t('Vật thể ở khoảng cách trung bình và xa')}</h3>
                    <p>
                      {t(
                        'Khi có kết nối và tính năng được bật, dữ liệu nhận biết được gửi đến máy chủ để xử lý hướng dẫn. Chất lượng camera, mạng và cấu hình có thể ảnh hưởng kết quả.',
                      )}
                    </p>
                  </div>
                  <div className="lp-note" data-sc-cue="0.74 0.92">
                    <h3>{t('Vật thể ở gần')}</h3>
                    <p>
                      {t(
                        'Theo thiết kế, điện thoại xử lý cảnh báo gần bằng YOLOv8n ngay trên thiết bị, để không phụ thuộc phản hồi từ máy chủ cho phần này.',
                      )}
                    </p>
                  </div>
                  <div className="lp-note" data-sc-cue="0.86 1 0.15 0">
                    <h3>{t('Trao đổi với người chăm sóc')}</h3>
                    <p>
                      {t(
                        'Luồng gọi âm thanh/video giúp hai bên phối hợp khi được cấp quyền và thiết bị hỗ trợ. Cần cho phép micro hoặc camera khi bắt đầu; đây không phải dịch vụ cứu hộ.',
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <figure className="lp-peak-figure">
                <RangeRings />
                <figcaption>{t('Minh họa, không phải dữ liệu thật.')}</figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* 4 · Range: what the caregiver does, laid out sideways. */}
        <section
          id="features"
          className="lp-features"
          data-sc-act="pan"
          data-sc-span="4.2"
          data-sc-drift={ground.concrete}
          aria-labelledby="features-title"
        >
          <div className="sc-stage lp-features-stage">
            <div className="lp-rail" data-sc-pan="0.06">
              <div className="lp-rail-head">
                <h2 id="features-title">{t('Người chăm sóc làm gì trên Web.')}</h2>
                <p>
                  {t(
                    'Mọi thao tác đều theo quyền mà người khiếm thị hoặc trung tâm đã cấp cho bạn.',
                  )}
                </p>
              </div>
              {capabilities.map(({ title, text }) => (
                <article className="lp-card" key={title}>
                  <span className="lp-card-mark" aria-hidden="true" />
                  <h3>{t(title)}</h3>
                  <p>{t(text)}</p>
                </article>
              ))}
              <p className="lp-rail-note notice">
                {t(
                  'VisionAid đang trong giai đoạn kiểm thử liên thông. Hybrid AI, cuộc gọi và thông báo cần được xác minh cùng ứng dụng di động trước khi sử dụng thực tế; trang này không cam kết mọi tính năng đã sẵn sàng trên mọi thiết bị.',
                )}
              </p>
            </div>
          </div>
        </section>

        {/* 5 · Substance: three steps, wiped in along a guiding strip. */}
        <section
          id="how-it-works"
          className="lp-steps landing-wrap"
          data-sc-act="flow"
          aria-labelledby="steps-title"
        >
          <div className="lp-steps-head" data-sc-in>
            <h2 id="steps-title">{t('Bắt đầu trong ba bước.')}</h2>
            <p>
              {t(
                'Ứng dụng di động dành cho người khiếm thị. Không gian Web dành cho những người đồng hành.',
              )}
            </p>
          </div>
          <div className="lp-strip" data-sc-reveal="right" aria-hidden="true" />
          <ol className="lp-step-list" data-sc-in data-sc-stagger="90">
            {steps.map(([title, text], i) => (
              <li key={title}>
                <span className="lp-step-dome" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{t(title)}</h3>
                <p>{t(text)}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 6 · Choice: who it is for. */}
        <section
          id="for-you"
          className="lp-audience landing-wrap"
          data-sc-act="flow"
          aria-labelledby="audience-title"
        >
          <div className="lp-audience-head" data-sc-in>
            <h2 id="audience-title">{t('Dành cho gia đình và trung tâm.')}</h2>
            <p>
              {t(
                'Gia đình sử dụng Personal; trung tâm sử dụng Business. Đăng nhập để xem gói, giá và quyền lợi hiện được cung cấp cho tài khoản của bạn.',
              )}
            </p>
            <Link className="btn" to="/auth/login">
              {t('Đăng nhập để xem gói')}
            </Link>
          </div>
          <div className="lp-audience-list" data-sc-in data-sc-stagger="80">
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
        </section>

        {/* 7 · Care: what to prepare, said plainly. */}
        <section className="lp-usage" data-sc-act="flow" aria-labelledby="usage-title">
          <div className="lp-usage-inner landing-wrap">
            <div data-sc-in>
              <h2 id="usage-title">{t('Chuẩn bị trước mỗi hành trình.')}</h2>
              <p>
                {t(
                  'VisionAid là công cụ hỗ trợ. Tiếp tục sử dụng gậy trắng và thiết bị hỗ trợ phù hợp; không dựa hoàn toàn vào camera hoặc một cảnh báo trên ứng dụng để di chuyển.',
                )}
              </p>
            </div>
            <ul data-sc-in data-sc-stagger="70">
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

        {/* 8 · Commitment: the path ends at a field of domes, and one action. */}
        <section
          className="lp-close"
          data-sc-act="pin"
          data-sc-span="1.5"
          data-sc-drift={ground.ink}
          aria-labelledby="cta-title"
        >
          <div className="sc-stage lp-close-stage">
            <div className="lp-close-domes" aria-hidden="true" />
            <div className="lp-close-copy landing-wrap landing-cta" data-sc-cue="0 1 0 0">
              <h2 id="cta-title">{t('Liên kết người thân đầu tiên.')}</h2>
              <p>
                {t('Sau khi đăng ký, bạn liên kết với người khiếm thị và chọn quyền chăm sóc.')}
              </p>
              <span className="lp-magnet" data-sc-magnet="0.3">
                <Link className="btn primary" to={user ? '/dashboard' : '/auth/register'}>
                  {user ? t('Vào không gian chăm sóc') : t('Tạo tài khoản')}{' '}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </span>
            </div>
          </div>
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
        <Link to={user ? '/dashboard' : '/auth/login'}>
          {user ? t('Vào không gian chăm sóc') : t('Đăng nhập')}{' '}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
