# VisionAid design system

## Context and goals
Make caregiving operations calm, legible and quick with restrained frosted surfaces, strong hierarchy and explicit emergency states. Glassmorphism is selected by the user; readability takes priority over blur.

## Design tokens and foundations
- `src/styles/theme/index.css` is the token source. Primary #1856FF; secondary #3A344E; text #141414; surface white; muted #526077.
- Brand success #07CA6B, warning #E89558, danger #EA2143 are accents. Text uses darker success #12663A, warning #82400D, danger #B21532 on pale backgrounds.
- Plus Jakarta Sans (locally bundled Vietnamese/Latin); JetBrains Mono for identifiers. Body 16 px, compact table 13.3 px, title 26–36 px. Do not use mono for paragraphs.
- Spacing 4/8/12/16/20/24/32 px; cards 24 px desktop and 18 px narrow; radius 12 px controls / 22 px surfaces.
- Glass alpha .82, blur 12 px, one main frosted layer. Tables/forms use opaque light fills; never stack blur over dense text.

## Component-level rules
- Buttons: label + optional icon; 44 px minimum primary hit target; primary, neutral, destructive variants. Hover changes background; keyboard outline 3 px with 4 px offset; disabled/pending prevents duplicate submit. Never use unlabeled icon actions.
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
