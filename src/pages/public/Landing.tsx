import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  HeartHandshake,
  MapPin,
  ScanText,
  ShieldCheck,
  Smartphone,
  Users,
  Volume2,
} from 'lucide-react';
import { Brand } from '../../components/UI';
import './landing.css';

const capabilities = [
  {
    icon: MapPin,
    title: 'Một kết nối, bớt những lo âu.',
    text: 'Theo dõi vị trí được chia sẻ, lưu địa điểm quen thuộc và nhận biết khi người thân ra khỏi vùng an toàn.',
    label: 'VỊ TRÍ & VÙNG AN TOÀN',
  },
  {
    icon: BellRing,
    title: 'Có mặt khi người thân cần.',
    text: 'Tiếp nhận cảnh báo khẩn cấp, phối hợp hỗ trợ và theo dõi lịch sử xử lý trong một không gian chung.',
    label: 'CẢNH BÁO & HỖ TRỢ',
  },
  {
    icon: ScanText,
    title: 'Thế giới dễ tiếp cận hơn.',
    text: 'Ứng dụng di động hỗ trợ nhận diện vật thể, đọc văn bản và nhận diện gương mặt quen thuộc bằng AI.',
    label: 'HỖ TRỢ TRÊN DI ĐỘNG',
  },
];

export function Landing() {
  return (
    <div className="landing">
      <a className="skip" href="#landing-main">
        Đến nội dung chính
      </a>
      <header className="landing-header landing-wrap">
        <Link to="/" aria-label="VisionAid — Trang chủ">
          <Brand />
        </Link>
        <nav aria-label="Điều hướng trang chủ" className="landing-nav">
          <a href="#features">Tính năng</a>
          <a href="#how-it-works">Cách hoạt động</a>
          <a href="#for-you">Dành cho ai?</a>
        </nav>
        <Link className="btn" to="/auth/login">
          Đăng nhập <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <main id="landing-main" tabIndex={-1}>
        <section className="landing-hero landing-wrap" aria-labelledby="landing-title">
          <div className="landing-intro">
            <span className="landing-kicker">
              <span /> CÔNG NGHỆ VÌ SỰ TỰ LẬP
            </span>
            <h1 id="landing-title">
              Thêm tự tin.
              <br />
              Thêm kết nối.
              <br />
              <span>Thêm an tâm.</span>
            </h1>
            <p>
              Đồng hành cùng người khiếm thị trong cuộc sống mỗi ngày. VisionAid kết nối người thân
              và người chăm sóc, để mỗi bước đi luôn có sự sẻ chia.
            </p>
            <div className="row landing-actions">
              <Link className="btn primary" to="/auth/register">
                Bắt đầu đồng hành <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a className="landing-text-link" href="#how-it-works">
                Khám phá VisionAid <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="landing-assurance">
              <HeartHandshake size={21} aria-hidden="true" />
              <span>Dành cho gia đình và các trung tâm chăm sóc</span>
            </div>
          </div>
          <div
            className="landing-visual"
            role="img"
            aria-label="Minh họa kết nối giữa ứng dụng di động và người chăm sóc, với vị trí và thông báo hỗ trợ."
          >
            <div className="landing-orbit orbit-outer" />
            <div className="landing-orbit orbit-inner" />
            <div className="landing-phone">
              <div className="phone-speaker" />
              <div className="row between">
                <span className="eyebrow">VISIONAID</span>
                <ShieldCheck size={18} />
              </div>
              <p className="phone-greeting">
                Một ngày mới,
                <br />
                <strong>nhiều tự tin hơn.</strong>
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
                    stroke="#1856ff"
                    strokeWidth="4"
                    strokeDasharray="6 6"
                  />
                  <circle cx="115" cy="150" r="19" fill="#1856ff" fillOpacity=".15" />
                  <circle cx="115" cy="150" r="7" fill="#1856ff" stroke="white" strokeWidth="3" />
                  <circle cx="180" cy="48" r="6" fill="#1856ff" />
                </svg>
                <span>
                  <MapPin size={14} /> Địa điểm quen thuộc
                </span>
              </div>
              <div className="phone-voice">
                <Volume2 size={21} />
                <div>
                  <strong>Lắng nghe. Khám phá.</strong>
                  <small>Hỗ trợ bằng giọng nói</small>
                </div>
              </div>
              <div className="phone-home" />
            </div>
            <div className="landing-float float-location glass">
              <span className="icon-tile">
                <MapPin size={23} />
              </span>
              <div>
                <strong>Kết nối với người thân</strong>
                <small>Gần bên, dù ở nơi đâu</small>
              </div>
            </div>
            <div className="landing-float float-support glass">
              <span className="icon-tile">
                <HeartHandshake size={23} />
              </span>
              <div>
                <strong>Sẵn sàng sẻ chia</strong>
                <small>Cùng nhau chăm sóc</small>
              </div>
            </div>
            <span className="visual-caption">Minh họa trải nghiệm VisionAid</span>
          </div>
        </section>

        <div className="landing-values landing-wrap">
          <span>
            <Smartphone size={19} aria-hidden="true" /> Hỗ trợ sự tự lập
          </span>
          <span>
            <Users size={19} aria-hidden="true" /> Kết nối người chăm sóc
          </span>
          <span>
            <ShieldCheck size={19} aria-hidden="true" /> Chia sẻ theo quyền truy cập
          </span>
        </div>

        <section
          className="landing-section landing-wrap"
          id="features"
          aria-labelledby="features-title"
        >
          <div className="landing-section-head">
            <p className="eyebrow">ĐỒNG HÀNH MỖI NGÀY</p>
            <h2 id="features-title">Sự quan tâm, được kết nối.</h2>
            <p>
              Từ những hành trình quen thuộc đến những lúc cần hỗ trợ, cùng xây dựng một cuộc sống
              chủ động hơn.
            </p>
          </div>
          <div className="landing-feature-grid">
            {capabilities.map(({ icon: Icon, title, text, label }, i) => (
              <article key={label} className="glass landing-feature">
                <div className="row between">
                  <span className="icon-tile">
                    <Icon size={25} aria-hidden="true" />
                  </span>
                  <span className="landing-index">0{i + 1}</span>
                </div>
                <p className="eyebrow">{label}</p>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="landing-section landing-wrap"
          id="how-it-works"
          aria-labelledby="steps-title"
        >
          <div className="landing-how glass">
            <div>
              <p className="eyebrow">BẮT ĐẦU TỪ MỘT KẾT NỐI</p>
              <h2 id="steps-title">
                Cùng nhau,
                <br />
                từng bước một.
              </h2>
              <p>
                Ứng dụng di động dành cho người khiếm thị. Không gian Web dành cho những người đồng
                hành.
              </p>
              <Link className="landing-text-link" to="/auth/login">
                Vào không gian chăm sóc <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <ol className="landing-steps">
              {[
                [
                  'Tạo tài khoản người chăm sóc',
                  'Đăng ký cho gia đình hoặc đăng nhập bằng tài khoản được trung tâm cấp.',
                ],
                [
                  'Liên kết với người thân',
                  'Kết nối với người khiếm thị và thiết lập quyền chăm sóc phù hợp.',
                ],
                [
                  'Đồng hành mỗi ngày',
                  'Theo dõi thông tin được chia sẻ, quản lý địa điểm và phối hợp khi có cảnh báo.',
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
            <p className="eyebrow">MỖI VAI TRÒ, MỘT SỰ ĐỒNG HÀNH</p>
            <h2 id="audience-title">Một không gian cho sự quan tâm.</h2>
          </div>
          <div className="landing-audiences">
            <article>
              <HeartHandshake size={30} aria-hidden="true" />
              <h3>Gia đình & người chăm sóc</h3>
              <p>
                Hiểu hơn hành trình của người thân, quản lý thông tin hỗ trợ và chia sẻ trách nhiệm
                chăm sóc.
              </p>
            </article>
            <article>
              <Users size={30} aria-hidden="true" />
              <h3>Trung tâm chăm sóc</h3>
              <p>
                Phân công nhân viên, theo dõi người được chăm sóc trong tổ chức và tổng hợp hoạt
                động hỗ trợ.
              </p>
            </article>
            <article>
              <Smartphone size={30} aria-hidden="true" />
              <h3>Người khiếm thị</h3>
              <p>
                Sử dụng ứng dụng di động với các công cụ hỗ trợ nhận biết và tương tác bằng giọng
                nói.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-wrap landing-cta" aria-labelledby="cta-title">
          <div>
            <p className="eyebrow">VISIONAID · CÙNG BẠN TIẾN BƯỚC</p>
            <h2 id="cta-title">
              Sự an tâm bắt đầu
              <br />
              từ một kết nối.
            </h2>
            <p>Tạo tài khoản người chăm sóc và khám phá không gian dành cho bạn.</p>
          </div>
          <Link className="btn" to="/auth/register">
            Tạo tài khoản <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <footer className="landing-footer landing-wrap">
        <div>
          <Brand />
          <p>Đồng hành cùng sự tự lập mỗi ngày.</p>
        </div>
        <p>
          VisionAid · Dự án FA26SE013
          <br />
          <span>Bản trải nghiệm sử dụng dữ liệu mô phỏng.</span>
        </p>
        <Link to="/auth/login">
          Đăng nhập <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
