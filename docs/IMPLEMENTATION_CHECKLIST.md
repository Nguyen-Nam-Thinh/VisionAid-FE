# Implementation checklist

Source: VisionAid.docx, VisionAid.txt, DB.txt, backend CLAUDE.md and Report3 WBS (web rows 1–4, 12–43). Mobile-only rows 5–11 are excluded. All data and external delivery in this release are simulated. This file tracks implementation, not backend completion.

| Role | Screen | Actions | Permission | Implementation | Verification |
|---|---|---|---|---|---|
| Shared | Authentication | Login, caregiver register, recovery, reset, logout | Public / own session | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Shared | Profile | Update details, avatar, password | Self | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Shared | Shell | Role menu, guard, 403, 404, reset demo | Role / session | Implemented (mock) | Role routes, guards, logout/reset and narrow navigation passed |
| Caregiver | Overview | Summary, select linked user | Active link | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Caregiver | Linked users | Create VIU, generate/accept demo link | Personal primary / assigned org | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Caregiver | Live map | Select location, stale/reconnect simulation | Active link | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Caregiver | Alerts | Filter, inspect, acknowledge, escalate, resolve, history | Receive-alert flag | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Caregiver | Registry | Create/edit person, upload, primary image, delete | Registry flag | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Caregiver | Locations & geofences | CRUD, coordinates, radius, enter/exit | Locations flag | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Caregiver | Activity | Movement/OCR/QR/face/voice filters | Active link | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Caregiver | Contacts | CRUD, type and priority | Primary | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Caregiver | Secondary caregivers | Add/remove, permissions | Primary | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Caregiver | Notifications & TTS | Channels, mandatory rules, speed/voice | Self / primary | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Center Admin | Overview & organization | Summary, edit profile | Own org | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Center Admin | Staff | Create/edit, deactivate/reactivate, demo reset | Own org | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Center Admin | VIUs | Create/edit, deactivate/reactivate | Own org | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Center Admin | Assignments | Link/unlink staff and VIU | Same org, limits | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Center Admin | Fleet map | Filters, locations, stale status | Own org | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Center Admin | Reports | Dates, event counts, staff response times | Own org only | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Center Admin | Routing | Override organization rules | Own org | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Super Admin | Overview & organizations | Global aggregates, CRUD / active state | Admin | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Super Admin | Accounts & links | Manage roles/status, reset, support org accounts, links | Admin; no GPS/media | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Super Admin | AI metrics | Period/model, latency, success/confidence | Aggregate only | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Super Admin | Configurations | Edit, history, rollback | Admin | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Super Admin | Rules | Global channels, mandatory flag | Admin | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |
| Super Admin | Delivery & audit | Search/filter, delivery status, audit trail | Admin | Implemented (mock) | Typecheck + role-route smoke; detailed evidence below |

## Unresolved source differences
- Word history deletion vs backend media-only retention: no automatic deletion or retention promise in FE.
- Secondary read-only wording vs flags: enforce explicit link flags.
- Center activity reports are not global audit logs. Admin has no GPS/face access.
- QR linking, TTS settings, voice history are included as demo workflows from WBS; API contracts remain pending.
- Upload size is not specified by BE: demo applies a clearly labeled 2 MB per image limit to protect browser storage.
- No REST payload, SignalR subscription method, refresh cookie or FCM token registration is inferred from database columns.

## Verification evidence — 2026-09-21

All 25 role feature routes passed tablet render, page-error and document-overflow smoke checks. This does not mean every action on every route has an individual E2E assertion. Profile persistence rollback is unit-tested; profile avatar/password UI is not separately covered by E2E.

| Test source | Detailed coverage |
|---|---|
| `src/app/e2e/flows.spec.ts` | Contacts CRUD/validation, alert acknowledge/resolve/history, map stale/reconnect; face uploads/activation/primary/delete; VIU creation and secondary permissions; center staff/VIU/assignments and org scope; config history/rollback; mandatory preferences, TTS, geofence validation; all role routes and narrow navigation/reset |
| `src/app/e2e/accessibility.spec.ts` | Login/dashboard/contact dialog axe checks, Escape/focus restoration; register/recover/reset/login/logout without reload |
| `src/app/e2e/qr.spec.ts` | Decode generated invitation image and link secondary caregiver |
| `src/services/*.test.ts`, `src/configs/*.test.ts` | Policy/scope, limits, primary transfer, 409 transitions, persistence rollback, API fail-closed, HTTP parsing, notification denied/unsupported, realtime cleanup/reconnect and other business rules |

Final run: 28 unit tests and 11 E2E tests passed; typecheck, lint and build passed. See [delivery report](DELIVERY_REPORT.md) for limits and integration status.

