---
version: alpha
name: VisionAid Organic
description: Warm, accessible care dashboard
colors:
  primary: "#5D7052"
  primary-hover: "#46563D"
  on-primary: "#F3F4F1"
  secondary: "#C18C5D"
  secondary-text: "#875831"
  background: "#FDFCF8"
  surface: "#FEFEFA"
  foreground: "#2C2C24"
  muted: "#646458"
  stone: "#F0EBE5"
  accent: "#E6DCCD"
  border: "#DED8CF"
  control-border: "#918D80"
  destructive: "#A85448"
typography:
  display:
    fontFamily: Fraunces Variable
    fontSize: 64px
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: -0.03em
  heading:
    fontFamily: Fraunces Variable
    fontSize: 36px
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: -0.02em
  body:
    fontFamily: Nunito Variable
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: Nunito Variable
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.5
rounded:
  md: 16px
  lg: 24px
  xl: 32px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  section: 112px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    height: 48px
  input:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.full}"
    height: 48px
---

# VisionAid — Organic / Natural

## Overview

Phong cách theo prompt người dùng ngày 2026-10-05: ấm, tĩnh, thân thiện và gắn kết. Áp dụng cho landing, auth, shell và các component dùng chung của Caregiver, CenterAdmin, Admin. React/Vite, CSS hiện có, Lucide và native dialog được tái sử dụng. Không đổi API, quyền hoặc nghiệp vụ. Nhánh refactor/organic-ui-ux độc lập; không merge/push dev nếu chưa được người dùng yêu cầu.

Tài liệu tuân theo D:/FPT/Ky-9/design.md/docs/spec.md. Skill ui-ux-pro-max được dùng để rà soát phong cách Organic Biophilic, responsive và accessibility; bảng màu/font của prompt được ưu tiên hơn các gợi ý tự sinh.

## Colors

Xanh rêu là CTA và trạng thái điều hướng. Nền giấy, stone và sand tạo lớp nhẹ. Terracotta dùng viền/trang trí; chữ outline dùng secondary-text đậm hơn để đảm bảo độ tương phản. Muted cũng được làm đậm hơn màu #78786C trong prompt để đọc trên nền stone. Lỗi giữ sắc đỏ đất và nhãn văn bản; không chỉ dùng màu để truyền đạt trạng thái.

Nguồn runtime: src/styles/theme/index.css :root. Không đưa màu xanh dương cũ trở lại các component. Màu bản đồ/biểu đồ có ý nghĩa riêng phải được đánh giá trước khi đổi.

## Typography

Fraunces Variable cho heading; Nunito Variable cho nội dung và thao tác. Font được bundle local qua Fontsource, có glyph tiếng Việt. Giữ JetBrains Mono cho mã kỹ thuật. Heading co giãn bằng clamp; không dùng letter-spacing âm mạnh làm dính dấu tiếng Việt. Body 16px; bảng/form 15px; metadata tối thiểu 12px, không áp 112px khoảng cách marketing vào dashboard.

## Layout

Landing tối đa 1200px, section rộng và thoáng, hero hai cột xuống một cột trên mobile. Header nổi bo tròn, mobile có menu mở/đóng rõ ràng. Dashboard giữ sidebar/grid có trật tự, bảng cuộn trong container. Nhãn và nút lọc căn theo đáy input. Page header được wrap; không ép nút vào một hàng khi hết chỗ.

## Elevation & Depth

Shadow xanh rêu 0 4px 20px -2px ở 12% và shadow đất 0 10px 40px -10px ở 20%. Grain SVG inline 3.5%, pointer-events none, không yêu cầu tải ảnh ngoài. Modal native ở top layer, backdrop tách nội dung nền. Không áp blur nặng lên bảng dữ liệu.

## Shapes

Button/input pill, textarea 16px, card/dialog 24–32px. Blob và góc bất đối xứng dành cho hero/auth/feature. Không làm méo bảng, input hay vùng tương tác. Không cần hình raster: minh họa sản phẩm hiện có bằng SVG/CSS giữ đúng nội dung VisionAid.

## Components

- Button chính xanh rêu, outline chữ đất đậm, chiều cao 48px; nút nhỏ/icon tối thiểu 44px.
- Input có label, viền control-border đủ rõ, focus outline 3px. Giữ validation và dữ liệu form khi lỗi.
- Card nền surface; state loading/empty/error giữ text rõ ràng.
- Navigation active vừa có nền khác vừa dùng aria-current của NavLink.
- Dialog căn giữa viewport bằng showModal, scroll nội dung dài, Escape và trả focus khi đóng.
- Chuyển động nhẹ chỉ cho hover/press. prefers-reduced-motion tắt animation/transition.
- Không thêm testimonial, giá hay số liệu giả để trang trông đầy hơn.

## Do's and Don'ts

- Dùng token chung và CSS hiện có; không thêm UI framework hoặc animation library.
- Giữ tương phản và focus quan trọng hơn màu/hiệu ứng trang trí trong prompt.
- Kiểm tra desktop, tablet, mobile 375px, modal và keyboard.
- Không xem test mock như nghiệm thu API thật.
- Không tự merge hoặc push dev/main trong nhiệm vụ này.
