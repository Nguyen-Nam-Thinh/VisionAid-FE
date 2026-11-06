# VisionAid design system

## Context and goals

Make caregiving operations calm, legible and quick. The Wayfinding system (DESIGN.md) borrows from tactile paving and transit signage: concrete ground, white panels, ink text, one tactile yellow for the next step, and explicit emergency states. No glassmorphism.

## Design tokens and foundations

- `src/styles/theme/index.css` is the only token source; `src/styles/wayfinding.css` is the final visual layer. Concrete #E7E8E2, panel #FFFFFF, ink #1B1D19, ink-muted #50544C, tactile #F2C200 (always paired with ink), signal #B42318, guide #23684A, caution #7A4A00, each signal with a -soft fill.
- Inclusive Sans Variable (locally bundled, Vietnamese subset) for everything; numbers tabular. Body 16 px, tables 15 px, labels 15 px, h1 28–36 px.
- Spacing 4/8/12/16/24/32/48 px; panel padding 24 px desktop and 18 px narrow; radius 6 badge / 10 control / 14 panel / 20 dialog.
- Panels have no shadow; only floating layers (dialogs, menus, popovers, toasts) use the float shadow.

## Component-level rules

- Buttons: label + optional icon; 44 px minimum primary hit target; primary, neutral, destructive variants. Hover changes background and border; keyboard focus is a 3 px ink ring inside a 7 px tactile halo; disabled/pending prevents duplicate submit. Never use unlabeled icon actions.
- Forms: visible label, control, associated error. RHF + Zod; preserve input after error, focus first invalid field. Busy submit has explicit text.
- Tables: caption/headers, overflow within table container, search/status filters reset page, pagination at bottom. Empty state explains how to add/change filters. No page-wide horizontal scroll.
- Dialogs: native modal dialog, titled header, body and cancel/submit; Escape closes; focus returns to opener. Destructive confirmation names the object and impact.
- Badges: label and color; never color alone. Alert actions follow state machine.
- Responsive: sidebar becomes toggled navigation below 760 px; cards wrap without fixed widths. Long values wrap or scroll inside their component.
- Data states: loading, empty, error/retry, forbidden, mutation pending and success live regions. Stale location retains last timestamp.

## Accessibility requirements and testable acceptance criteria

- Target WCAG 2.2 AA, not a certification. Verify 4.5:1 text contrast and 3:1 large text/UI boundaries for actual composited backgrounds.
- Tab through navigation, filters, dialogs and submit; visible focus must remain unobscured. Native dialogs contain focus and restore it.
- Keyboard equivalent to map markers is a location table. Semantic buttons/links/labels; no click-only divs.
- Test 1440, 1024 and 390 px widths; no document overflow. Respect reduced-motion; no decorative auto-animation.
- Status uses polite live region; urgent alerts have textual badges, not repeated intrusive focus changes.

## Content and tone standards

Vietnamese labels use concrete actions: “Lưu thay đổi”, “Xác nhận hỗ trợ”, “Gỡ liên kết”. Errors describe recovery: “Dữ liệu đã thay đổi. Tải lại trước khi xử lý.” External simulation says “Đã mô phỏng yêu cầu email; chưa gửi email thật.” Avoid “Thành công” without context.

## Anti-patterns and prohibited implementations

No low-opacity body text, blur behind forms, unlabeled icons, fake operational buttons, automatic emergency calls, raw HTML from user content or map-only access to location. Migrate ad hoc colors to semantic tokens and ad hoc CRUD dialogs to shared components.

## QA checklist

- [ ] Keyboard: skip link, role navigation, dialogs, forms and map table.
- [ ] Form error announcement and focus; pending buttons prevent repeats.
- [ ] Contrast sampled against composited backgrounds, not just token swatches.
- [ ] Empty/error/forbidden/loading/success states exercised.
- [ ] Desktop/tablet/narrow widths and long Vietnamese names.
- [ ] Reduced motion and consistent tokens; no stacked blur.

### Executed checks (2026-09-21)

- [x] Axe WCAG A/AA checks on login, caregiver dashboard and invalid contact dialog: no automated violations.
- [x] Invalid form focus, Escape dismissal and focus restoration to dialog opener.
- [x] Browser workflows at 1440 px; all 25 role feature routes at 1024 px without document overflow or page errors; navigation/reset at 390 px.
- [x] Error validation, forbidden access, mutation success and stale/reconnect states exercised in workflow tests.

The broader checklist above remains an ongoing review checklist. Automated axe is not WCAG certification or full screen-reader testing. Exhaustive keyboard coverage, contrast sampling of every composited state, reduced-motion visual review and cross-browser/touch testing are not claimed complete.
