---
version: beta
name: VisionAid Wayfinding
description: Legible, high-contrast care dashboard drawn from accessibility infrastructure
colors:
  concrete: '#E7E8E2'
  panel: '#FFFFFF'
  panel-sunk: '#F3F4EF'
  ink: '#1B1D19'
  ink-muted: '#50544C'
  line: '#CDD0C7'
  line-strong: '#7E8279'
  tactile: '#F2C200'
  tactile-soft: '#FBEDB0'
  signal: '#B42318'
  signal-soft: '#FCE8E6'
  guide: '#23684A'
  guide-soft: '#E1EFE7'
  caution: '#7A4A00'
  caution-soft: '#F6E9CF'
typography:
  display:
    fontFamily: Inclusive Sans Variable
    fontSize: 76px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.035em
  h1:
    fontFamily: Inclusive Sans Variable
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: -0.02em
  body:
    fontFamily: Inclusive Sans Variable
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: Inclusive Sans Variable
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: 6px
  md: 10px
  lg: 14px
  xl: 20px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  section: 112px
components:
  button-primary:
    backgroundColor: '{colors.tactile}'
    borderColor: '{colors.ink}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    height: 44px
  input:
    backgroundColor: '{colors.panel}'
    borderColor: '{colors.line-strong}'
    rounded: '{rounded.md}'
    height: 46px
---

# VisionAid — Wayfinding

## Overview

Thiết kế lại từ đầu trên nhánh `refactor/visual-redesign` (2026-11-05), không dựa vào giao diện
trước. Chất liệu lấy từ hạ tầng tiếp cận mà người khiếm thị dùng hằng ngày: gạch lát xúc giác
vàng (chấm cảnh báo và thanh dẫn hướng), dải đỏ trên gậy trắng, biển chỉ dẫn nhà ga chữ đậm
tương phản cao. Mục tiêu: người chăm sóc mệt mỏi đọc được màn hình trong một cái nhìn, kể cả trên
điện thoại và khi đang có cảnh báo.

Design system nguồn (token, brand book, cover) nằm ngoài repo tại
`D:/FPT/Ky-9/SEP409/Design/visionaid-ds`, mở bằng skill `claude-design-system`.

## Colors

- Nền trang `concrete` (xám vỉa hè); nội dung trên `panel` trắng, viền 1px `line`, không đổ bóng.
- `tactile` (vàng gạch xúc giác) là màu thương hiệu duy nhất, đánh dấu "bước tiếp theo": nút
  chính, quầng focus, icon của trang đang mở. Vàng chỉ đạt 1,4:1 trên nền nên luôn đi kèm `ink`:
  nút chính có viền và chữ mực (10:1).
- `ink` là chữ và cấu trúc mạnh; mục menu đang mở là ô mực, chữ trắng, icon vàng.
- `signal` (đỏ) chỉ cho khẩn cấp/xóa; `guide` (xanh lá) cho an toàn/hoàn tất; `caution` cho dữ
  liệu cũ/cảnh báo. Mỗi màu trạng thái luôn kèm chữ; badge thông tin dùng viền mực.
- Nguồn runtime duy nhất: `src/styles/theme/index.css :root`. Tên biến cũ (`--primary`,
  `--surface`, `--text`…) được giữ làm API cho component, giá trị trỏ về bảng mới.

## Typography

Inclusive Sans Variable (300–700, có dải tiếng Việt), một họ chữ cho mọi vai trò. Atkinson
Hyperlegible Next đã được cân nhắc nhưng thiếu dải U+1EA0–1EF1 (ạ, ầ, ố, ự…). Số dùng tabular;
số 0 có gạch là thiết kế của font để phân biệt với chữ O. Không viết hoa toàn bộ nhãn, không dùng
eyebrow, không tô màu riêng một vế tiêu đề.

## Layout

Sidebar 252px cùng nền concrete, ngăn bằng một đường line. Topbar trong suốt trên concrete. Nội
dung tối đa 1600px, đệm 40px desktop / 24px tablet / 16px mobile. Landing tối đa 1200px.

## Elevation & Depth

Không shadow cho panel. Chỉ lớp nổi (dialog, menu, popover, toast) dùng `--shadow-float`.
Overlay dialog là ink 55%.

## Shapes

Bo góc tăng theo kích thước: badge 6, control 10, panel 14, dialog/khối lớn 20.

## Pattern

Hoa văn chấm cảnh báo + thanh dẫn hướng chỉ xuất hiện ở hero landing và panel đăng nhập, không
nằm sau chữ. Trong không gian làm việc không dùng hoa văn.

## Components

- Nút chính vàng viền mực; nút thường trắng viền `line-strong`; nút xóa chữ `signal`. Tối thiểu
  44px.
- Input trắng viền 1,5px `line-strong`, chữ 16px; hover viền đậm hơn.
- Bảng: header `panel-sunk` chữ thường (không viết hoa), dòng hover `panel-sunk`, không zebra.
- Link trong văn bản (không có class) luôn gạch chân; link dạng component tự có affordance.
- Focus: vòng mực 3px trong quầng vàng 7px, đặt cuối `wayfinding.css` với `!important` để không
  component nào che được.
- Chuyển động chỉ phản hồi thao tác (dialog, menu, switch); tôn trọng prefers-reduced-motion.

## Do's and Don'ts

- Dùng token; không đưa lại màu viết cứng. `wayfinding.css` là lớp trình bày cuối; sửa component
  ở đó hoặc trong `workspace.css` bằng token.
- Không dùng glassmorphism, gradient trang trí, viền trái dày làm điểm nhấn, chữ nghiêng nhấn.
- Kiểm tra desktop, tablet, mobile 375px, dialog và bàn phím.
- Không xem test mock như nghiệm thu API thật.
