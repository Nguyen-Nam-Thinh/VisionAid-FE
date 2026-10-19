# Desktop UI refactor — 2026-10-13

This is the local experimental visual direction on `refactor/desktop-ui-experience`. The user requested a new Web design independent of the existing design and explicitly requested **no push**. `DESIGN.md` remains preserved as the earlier direction; it is not the visual specification for this experiment.

## Visual authority and implementation

`src/styles/workspace.css` supplies the new tokens and shared overrides. `src/app/main.tsx` imports it after `styles/theme/index.css`, so the existing structural styles remain the foundation while the later stylesheet controls the new appearance. This is a shared visual refactor, not a replacement of every page implementation.

The direction uses white surfaces, a cool light background, dark readable text and teal primary actions. Plus Jakarta Sans is bundled locally for Latin and Vietnamese at weights 400, 600 and 700. Headings use the same family; restrained borders and spacing replace decorative glass, floating transforms and orbit elements.

| Token | Value / use |
|---|---|
| `--background` | `#f4f7f9`, workspace canvas |
| `--surface`, `--glass` | `#fff`, opaque surfaces |
| `--text` | `#172d3b`, primary copy |
| `--muted` | `#536775`, supporting copy |
| `--primary` / `--primary-hover` | `#08736f` / `#075e5a`, primary actions |
| `--primary-soft` | `#e7f4f1`, active navigation |
| `--border` / `--input-border` | `#dbe4e9` / `#9dabb7` |
| `--danger-text` / `--danger-soft` | `#a22931` / `#fff0f1` |
| `--radius` | `14px`; controls use `8px` |

## Desktop dimensions

The reference viewport is **1440 × 900**. The shell allocates 232px to the sidebar and the remaining 1208px to the workspace. The main area has 32px horizontal padding, leaving approximately 1144px for content at this viewport. Its maximum width is 1600px. The topbar has a 76px minimum height; main padding is 30px 32px 48px.

Cards use 24px padding. Standard buttons and form controls have a 44px minimum height; small buttons use 40px and authentication inputs use 48px. Tables use 14px text, 16px cell padding and tabular numerals. Overview cards use two equal columns with a 20px gap. Dialogs retain native modal behavior and use a 16px radius, 24px body padding and a viewport-limited height.

Authentication uses a 0.9:1.1 split: approximately 648px for the story and 792px for the form at 1440px. The form content is capped at 460px. At 1100px and below the sidebar narrows to 208px; at 760px and below the layout stacks, main horizontal padding becomes 16px and overview cards become one column. Mobile support is a responsive fallback, not a separate mobile application.

## Coverage

### Official supplied branding — 2026-10-15

The two user-provided PNGs are preserved in public/branding. The symbol replaces the generic eye in shared Brand and authentication, including collapsed navigation; the full logo appears in the public footer. HTML favicon and Apple touch icon reference the supplied symbol. No recoloring or raster edits were made; the supplied white background is retained. Two browser scenarios covering public/auth, desktop/mobile and sidebar collapse passed; production build passed with its existing bundle warning. No push. Small favicon detail and source whitespace remain limited by the supplied raster artwork.

### Transient feedback toasts — 2026-10-15

Routine successful saves/deletes/updates use a shared Toast in accounts, organizations, links, contacts, places, registry/photos, TTS, notification preferences, packages, ICE servers, license assignments and profile. The existing global mock feedback uses it too. Native manual popover keeps feedback above dialogs, polite status announces the message, a close button dismisses it, and the eight-second timer pauses on hover/focus. Validation, uncertain-write errors, payment/key activation results, recovery instructions and realtime states remain inline. Profile avatar errors now have a separate inline alert rather than expiring with success feedback. Four API fixture regressions passed (registry/photos, accounts, contacts, preferences), plus a toast dismissal/pause/expiry browser test; build/lint passed before the final license-assignment presentation-only conversion. No live mutations or push. Older browsers without Popover API were not tested.

### Palette correction — 2026-10-15

User clarified: retain the original teal accents, only remove the dark green sidebar. Workspace actions/icons use #08736f again with pale teal selection; sidebar stays light gray #e9edf2. The previous blue-accent proposal is superseded. Layout and behavior are unchanged; no push.

### Stone-gray and blue workspace — 2026-10-15

The user approved replacing the green sidebar with a softer stone-gray and blue palette. Workspace-scoped tokens now use #f6f7f9 canvas, #e9edf2 sidebar, #3b5ccc primary actions and pale blue active navigation. Sidebar text, hover and focus, table surfaces, avatars, notices and icon tiles follow that palette. Public/auth colors remain unchanged. This supersedes the earlier dark-sidebar/teal workspace palette. Six browser scenarios passed, covering selected automated WCAG checks, desktop/mobile layouts, sidebar collapse and keyboard interaction. Desktop dashboard, mobile dashboard and collapsed sidebar screenshots were inspected. CSS-only change; no API behavior or live integration checks, no push.

### Dashboard harmony revision — 2026-10-15

The user approved a calmer palette and operational dashboard layout. The workspace canvas is now neutral #f0f2f2, sidebar muted #263f43, with teal actions and restrained selected/hover surfaces. This supersedes the previous blue-gray palette. Demo dashboard removes the promotional hero and duplicate alert summary, compresses metrics into one divided strip, groups people beneath location, and keeps alerts alongside on desktop and before location on mobile. API dashboard retains real license/payment/alert queries and only receives the shared palette; no simulated map/data is introduced there. Tests waiting for the deleted hero now wait for dashboard statistics. Four redesign scenarios and four U8b role fixtures passed; the dashboard axe check passed after updating that obsolete assertion. Build/lint passed before the test-only update. Desktop/mobile captures inspected. No push or live integration test.

### Collapsible sidebar — 2026-10-15

Desktop navigation toggles between full width and a 76px icon rail. Link text remains accessible to assistive technology; native title hints identify icons. API-only secondary navigation now also has icons. The active route stays highlighted, route navigation preserves collapse state, and mobile retains its full-label drawer. Expanded call workspace offset follows the collapsed rail. State is in memory, so reloading returns to expanded. No persistence or API changes were added. Dedicated collapse/navigation/keyboard/mobile test and desktop visual checks cover the change; no push.

### Header account dropdown — 2026-10-15

Profile and logout moved from the sidebar into a native auto popover opened from the header name/avatar. The existing logout pending guard and API call remain intact. Escape and outside click dismiss the popover; profile navigation closes it. CSS anchors position it beneath the trigger in supporting browsers, with fixed desktop/mobile fallback positions. Tests that use these actions now open the account dropdown first. Three focused mock browser scenarios passed; the dedicated keyboard/mobile/profile/logout scenario passed again after alignment refinement. Build passed with the existing chunk warning. Live API logout and older-browser fallback positioning were not revalidated. No push.

### Workspace color revision — 2026-10-15

Following the user's feedback that the workspace was too white, the shell now uses a blue-gray canvas (#e8eff2), dark blue-green sidebar (#173b47), pale teal selected navigation, and tinted table headers/alternating rows. Content remains light. Sidebar text, buttons, hover and keyboard focus colors are scoped to the dark surface. This supersedes the earlier white-sidebar description; public/auth surfaces keep their existing colors. Four redesign browser scenarios passed including selected axe checks, desktop/mobile layout and keyboard dialog controls. Dashboard and staff screenshots were inspected. CSS only; no API changes and no push.

### Completion batch 4 — final regression and handoff (2026-10-15)

The four planned UI completion batches are finished locally. The final pass preserves the approved design and adds three menu-sweep regressions for Caregiver, CenterAdmin and Admin. Every sidebar route exposed in mock mode is checked for a visible page heading and document overflow at 1440px and 390px; keyboard activation of the skip link must focus the main content. These three scenarios passed. Existing 17 browser scenarios also passed, including tablet routes, mobile navigation, forms, dialogs, selected WCAG checks and public pages. Desktop people/staff and mobile dashboard captures were inspected without a new material layout defect.

All 156 unit tests passed across 33 files. Lint, production build and git diff whitespace checks passed; the build retains the existing approximately 867 kB main JavaScript chunk warning. The first unit run could not read sandbox temporary cache files; running outside that sandbox passed. The initial supplemental browser run shared a server that stopped with the earlier suite and pressed Tab before the dashboard loaded. The test now waits for the page heading; the independent rerun passed all three roles. No production behavior was changed in this final batch.

Handoff: review the local branch `refactor/desktop-ui-experience` in the app, especially call expand/minimize, care-recipient selection, add/edit/delete dialogs and long tables at 1440px. The route sweep uses mock navigation, not every API-only route or every possible data state; API-specific fixture coverage is documented in the preceding batches. Live backend, payment, GPS, FCM and real Mobile/TURN acceptance remain separate checks. No push, merge, deployment or backend changes were performed. Only push when the user explicitly requests it.

### Completion batch 3 — tracking, alerts and administration (2026-10-14)

Tracking/history and alert tables now use focusable scroll regions with readable minimum widths. Filter actions are emphasized. Alert details use labeled rows for identity, detection, timestamp, coordinates and notes; status remains server-derived. Monitoring detail dialogs and monitoring/ICE pagers follow shared layout conventions. Existing stale-location logic, permissions, confirmations and emergency transitions are unchanged. No map provider or realtime contract was added.

Ten fixture regressions passed covering two-role GPS, two conflict/non-conflict alert flows, metrics/audit/delivery, Hybrid and ICE administration with unauthorized-role checks. Alert scenarios passed again after making fixture history IDs unique and adding desktop/mobile screenshots. Monitoring, ICE and alert screenshots were inspected. Lint/build passed before the fixture-only follow-up. No live GPS, emergency action, notification delivery or TURN acceptance was performed. No push or merge. Remaining completion batch: whole-Web layout/accessibility regression and handoff.

### Completion batch 2 — registry, photos and places (2026-10-14)

Registry and place tables use keyboard-focusable scroll regions with readable minimum widths; names and secondary metadata follow the shared hierarchy. Place coordinates explicitly name latitude/longitude and radius. Photo count/activation guidance and GPS-dependent behavior are notices. Photo upload has a separated section and the shared accessible checkbox layout. Read-only person/place details use definition lists; place selection and resource pagination use shared alignment. Upload validation, authorized blob loading/cleanup, server activation state, permissions and destructive confirmations remain unchanged.

All three fixture regressions passed: registry CRUD/photos with revoked permissions and recoverable failures, saved locations, and geofences with read-only/revoked permissions, license and delete failures. Desktop/mobile screenshots were inspected; fixture photo images are not real face samples. Lint and build passed before formatting-only cleanup. Live MinIO/FaceNet/Mobile/GPS behavior remains unverified, and this pass does not add a map coordinate picker. No push or merge.

### Completion batch 1 — care recipients, assignments and contacts (2026-10-14)

API care-recipient, managed-link and emergency-contact tables now use keyboard-focusable scroll regions and readable minimum widths. Row actions have deliberate spacing, names are emphasized and secondary contact metadata is quieter. Assignment and contact pagers use shared spacing. Linked-user and managed-link dialogs remove redundant nested card surfaces and use labeled definition lists for identities and permissions. Creating a linked user now names the actual account/link step, including uncertain-account recovery, without changing persistence or submission logic. Existing account administration and mock pages retain the shared redesign already applied.

Nine relevant API-fixture regressions passed across recipient read/search/paging, 403 handling, partial creation recovery, Admin/CenterAdmin accounts, three-role link management, and contacts with conflicts/revoked access. Eight passed initially; the recipient read test passed after narrowing its empty-state locator so it did not also select call availability status. Desktop 1440px and mobile 390px screenshots of recipients, contacts and link details were inspected. Lint/build passed; only formatting and the test locator changed afterward. No API contracts, permissions, destructive confirmations or call behavior were changed. No live account/contact mutation, push or merge was performed.

- `App.tsx`: shared shell, role navigation and feature icons. Existing role and runtime visibility rules remain in place.
- `UI.tsx`: common page headings, with a dedicated class for the action area; existing state and native dialog behavior remains available to callers.
- `AuthPage.tsx`: authentication presentation and shared layout for login, registration and recovery/reset.
- `Dashboard.tsx`: mock dashboard presentation, with shared hero, statistics and quick-link styling.
- `ApiSession.tsx`: API overview presentation and account/quick-link sections, retaining `DashboardOverview` and existing session data.
- `DashboardOverview.tsx`: open alerts appear before billing and license information; three independent status groups share one desktop row and stack below 1000px. Existing role guards, query keys and independent failure handling are preserved.
- Shared table search places its icon inside the field while retaining its accessible label and filtering behavior.
- `workspace.css`: public landing page, authentication, shell, headings, cards, buttons, fields, notices, badges, tables, pagination and dialogs across existing routes.

Pages using these shared classes inherit the new visual system. Specialized workflows—maps, emergency handling, registry uploads, payments, licenses, calls, reports and administration—have **not each received a separate workflow redesign or individual visual acceptance review**. Their existing forms, data contracts, permissions and actions remain the functional basis. Shared styling coverage must not be described as proof that every workflow was independently redesigned or verified.

## Verification snapshot

The coordinating implementation run reported 14 existing mock E2E tests passing. Lint and production build passed before the final navigation update; production build also passed after that update.

`src/app/e2e/redesign.spec.ts` adds three redesign checks covering public pages, a caregiver workspace, center staff and admin organizations at 1440 × 900; it also exercises a centered dialog and a 390 × 844 dashboard fallback. All three passed after review fixes, including selected axe checks and horizontal-overflow assertions. The visual reviewer scored alert priority, Vietnamese contact instructions and decorative landing labels resolved. The Impeccable detector was unavailable due to launcher error `cache_directory_failed`.

No live backend, payment provider, Mobile, TURN, FCM or production integration acceptance was performed for this visual refactor. Mock checks and selected accessibility scans do not establish full application accessibility conformance or live integration correctness.

The work remains local under the user's no-push instruction. No new backend functionality or API contract is established by this document.

## Form and administration follow-up

## Package catalog and license summary — 2026-10-14

System configuration follow-up: detail and edit dialogs reuse the shared definition-list layout for current values, types and bounds; the system-wide impact note is visually separated. Search is the primary filter action, configuration keys are emphasized, and both pagers use the shared layout. Existing validation, hidden unreviewed values, rollback confirmation and uncertain-write handling are preserved. The 13a fixture scenario passed and desktop/mobile editor screenshots were inspected. Production build passed with the existing bundle warning. No production configuration was changed.

Center report follow-up: report/member filter submissions now have primary emphasis, the UTC explanation is a notice, summary counts align right with tabular numerals, and the coverage caveat has a readable line length. Member names and pagination follow shared conventions. Existing date semantics, independent member filters, counts and scope checks are unchanged. The 12b API-fixture regression passed, including invalid date rejection, pagination and organization-scope errors. Desktop/mobile screenshots were inspected; lint/build passed. No live reporting-data verification was performed. Work remains local, without push or merge.

Organization pool follow-up: assignments now precede family-key distribution. The assignment filter uses the shared field layout, names are emphasized above secondary email/ID, the table has an accessible caption, and pagination follows the shared layout. A 680px minimum table width preserves readable columns with container scrolling on narrow screens. No API, quota, key or revoke behavior changed. Lint/build passed before the final table-width adjustment; U4 quota-form and revoke/reassign scenarios passed (the latter rerun after an initial login-page timeout and again after the mobile correction). Desktop/mobile screenshots were inspected. No live license or key mutation was performed; no push or merge.

Payment follow-up: checkout uses the shared semantic label/value summary for package, displayed price and duration. Payment results emphasize server status and amount; pending copy removes implementation jargon, and history uses the shared row pagination layout. Existing create-once, safe-URL, server-confirmation and cancellation guards remain unchanged. Lint/build passed. Five U3a scenarios passed initially; the remaining scenario passed after fixing its subscription-read assertion to compare against prior dashboard reads rather than an absolute zero. Checkout screenshots were inspected at 1440px and 390px. No real PayOS transaction was created; the existing bundle-size warning remains.

Package rows now emphasize the monthly price and visually subordinate package metadata, trial duration and the annual reference price. License summaries use simple separators instead of nested shaded blocks. Personal subscription headings and missing-record messages use Vietnamese wording. Prices, eligibility, API contracts and checkout behavior are unchanged.

Verification: lint and production build passed. Eight of nine targeted U1/U2 API-fixture scenarios passed in the initial run; the remaining scenario passed after updating its stale text expectation to match the new copy. Caregiver and CenterAdmin catalog screenshots were inspected at 1440 × 900. No live payment, PayOS transaction or backend mutation was tested. The existing large-bundle warning remains. Changes remain local on `refactor/desktop-ui-experience`, without push or merge.

## Approved call workspace — 2026-10-14

The user approved the interactive prototype in `docs/previews/call-workspace.html`. `CallPanel.tsx` now renders an expanded call workspace with a persistent video element, microphone control and explicit end button. Minimize and Escape keep the call alive; internal navigation minimizes it and browser Back does not reopen it automatically. The expanded workspace makes the covered main content inert while leaving navigation available, then restores it on minimize/unmount. Incoming calls use a compact native dialog with explicit Accept/Reject; Escape does not reject and no media is acquired before acceptance. Historical detail dialogs are unchanged by this call-workspace integration.

The real media client, SignalR messages, authorization and end/cleanup logic are reused. No simulated timer or connection status from the prototype is displayed. Autoplay failures expose a playback retry. The user-facing layout supports desktop and narrow screens; no new dependency was added.

Final verification: four U6a browser scenarios passed after the route-history and focus fixes, including unchanged video identity across navigation, live microphone while minimized, explicit end stopping tracks, incoming rejection, acceptance and denied microphone access. The earlier 16 realtime/API call unit tests passed. Screenshots are under `test-results/u6a-call-desktop.png`, `u6a-call-mobile.png`, and `call-workspace-*.png`; their video source is a local test canvas, not a real participant. Real Mobile/TURN/network acceptance remains outstanding. The branch remains local with no push or merge.

History-detail follow-up: activity and call-history dialogs now use a shared semantic definition-list layout, with aligned label/value rows on desktop and stacked rows below 760px. Values retain whitespace and wrap long text/IDs. Activity and call pagers use the shared pagination styling. Existing API queries, redaction, ownership checks and display formatters remain unchanged. The 12a activity regression and U6a outgoing-call regression passed; U6a additionally opens call details, captures 1440px/390px and checks Escape dismissal and document overflow. Lint and build passed. Call verification uses local simulated media and API fixtures, not real Mobile/TURN sessions.

TTS follow-up: API voice preferences use a three-column definition list at desktop width and one column below 760px. The Mobile synchronization limitation remains visible as a notice; selecting a care recipient is explained before settings appear. TTS and notification-rule pagination now use the shared pagination style. API payloads, access checks and save behavior are unchanged. The existing TTS regression additionally captures populated settings at 1440px and 390px and checks document overflow.

TTS verification: all four TTS/notification API-fixture regressions passed, along with lint and build. Visual review requested one mobile refinement: put the pagination count on its own line so previous/next buttons stay together. That shared CSS correction was applied, then the TTS regression passed again with refreshed screenshots. The first rerun was delayed by the approval system's usage limit; the subsequent approved run completed successfully. No live Mobile synchronization or notification delivery was tested.

Profile follow-up: personal information now uses labeled name/email/phone rows, with password settings alongside at desktop width and notifications below. Mobile stacks the sections and resets shared page-heading alignment to stretch so headings do not drift right. New-password fields use the matching browser autocomplete hint. Existing API profile persistence, rejected/successful password changes and logout-all regression checks passed; desktop/mobile screenshots were inspected. Lint and build passed before the final one-rule mobile alignment correction, then the profile E2E was rerun. No live FCM or real-account mutations were performed.

Shared `Form` checkbox fields now place the native 20px control beside a 44px-high clickable label; hints and errors align below the label. Existing IDs, validation, disabled state and form submissions are unchanged. This reaches permission forms, notification settings and other existing checkbox callers without per-page copies.

API account and organization tables now use the shared scrollable table surface and pagination styling, including organization member tables. Query, mutation and authorization behavior is unchanged.

Verification: permission-label click and Space-key interaction, Escape dismissal, 1440px/390px screenshots and selected axe checks passed. The linked-user/secondary-permission workflow and six API-fixture organization/account/layout regressions passed. A separate read-only visual review found no material issues. These checks do not replace live backend or screen-reader acceptance.

Follow-up verification: all four U8b API-fixture role checks passed after the alert-priority update. Lint, production build and all three desktop redesign checks passed after the shared search-field adjustment. The API screenshots include deliberately simulated partial failures; these are fixture states, not evidence of a live backend outage. The build still reports a JavaScript chunk over 500 kB; bundle splitting is outside this visual pass.

## Transparent branding — 2026-10-15

Supersedes the earlier white-background branding decision: both public/branding PNGs now use transparent backgrounds generated with the built-in imagegen editor from the supplied originals. Prompt requested background removal, preserved symbol/colors/text, white AI lettering and iris highlight, and transparent negative space. The shared brand-icon CSS no longer paints a white background. Existing sidebar, landing, authentication and favicon consumers reuse the same paths. Generated artwork is not guaranteed pixel-identical to the originals. No push or merge.

