# Implementation checklist

Source: VisionAid.docx, VisionAid.txt, DB.txt, backend CLAUDE.md and Report3 WBS (web rows 1–4, 12–43). Mobile-only rows 5–11 are excluded. All data and external delivery in this release are simulated. This file tracks implementation, not backend completion.

| Role | Screen | Actions | Permission | Implementation | Verification |
|---|---|---|---|---|---|
| Shared | Authentication | Login, caregiver register, recovery, reset, logout | Public / own session | Implemented (mock) | Typecheck; browser QA pending |
| Shared | Profile | Update details, avatar, password | Self | Implemented (mock) | Typecheck; browser QA pending |
| Shared | Shell | Role menu, guard, 403, 404, reset demo | Role / session | Implemented (mock) | Login smoke passed; full browser QA pending |
| Caregiver | Overview | Summary, select linked user | Active link | Implemented (mock) | Typecheck; browser QA pending |
| Caregiver | Linked users | Create VIU, generate/accept demo link | Personal primary / assigned org | Implemented (mock) | Typecheck; browser QA pending |
| Caregiver | Live map | Select location, stale/reconnect simulation | Active link | Implemented (mock) | Typecheck; browser QA pending |
| Caregiver | Alerts | Filter, inspect, acknowledge, escalate, resolve, history | Receive-alert flag | Implemented (mock) | Typecheck; browser QA pending |
| Caregiver | Registry | Create/edit person, upload, primary image, delete | Registry flag | Implemented (mock) | Typecheck; browser QA pending |
| Caregiver | Locations & geofences | CRUD, coordinates, radius, enter/exit | Locations flag | Implemented (mock) | Typecheck; browser QA pending |
| Caregiver | Activity | Movement/OCR/QR/face/voice filters | Active link | Implemented (mock) | Typecheck; browser QA pending |
| Caregiver | Contacts | CRUD, type and priority | Primary | Implemented (mock) | Typecheck; browser QA pending |
| Caregiver | Secondary caregivers | Add/remove, permissions | Primary | Implemented (mock) | Typecheck; browser QA pending |
| Caregiver | Notifications & TTS | Channels, mandatory rules, speed/voice | Self / primary | Implemented (mock) | Typecheck; browser QA pending |
| Center Admin | Overview & organization | Summary, edit profile | Own org | Implemented (mock) | Typecheck; browser QA pending |
| Center Admin | Staff | Create/edit, deactivate/reactivate, demo reset | Own org | Implemented (mock) | Typecheck; browser QA pending |
| Center Admin | VIUs | Create/edit, deactivate/reactivate | Own org | Implemented (mock) | Typecheck; browser QA pending |
| Center Admin | Assignments | Link/unlink staff and VIU | Same org, limits | Implemented (mock) | Typecheck; browser QA pending |
| Center Admin | Fleet map | Filters, locations, stale status | Own org | Implemented (mock) | Typecheck; browser QA pending |
| Center Admin | Reports | Dates, event counts, staff response times | Own org only | Implemented (mock) | Typecheck; browser QA pending |
| Center Admin | Routing | Override organization rules | Own org | Implemented (mock) | Typecheck; browser QA pending |
| Super Admin | Overview & organizations | Global aggregates, CRUD / active state | Admin | Implemented (mock) | Typecheck; browser QA pending |
| Super Admin | Accounts & links | Manage roles/status, reset, support org accounts, links | Admin; no GPS/media | Implemented (mock) | Typecheck; browser QA pending |
| Super Admin | AI metrics | Period/model, latency, success/confidence | Aggregate only | Implemented (mock) | Typecheck; browser QA pending |
| Super Admin | Configurations | Edit, history, rollback | Admin | Implemented (mock) | Typecheck; browser QA pending |
| Super Admin | Rules | Global channels, mandatory flag | Admin | Implemented (mock) | Typecheck; browser QA pending |
| Super Admin | Delivery & audit | Search/filter, delivery status, audit trail | Admin | Implemented (mock) | Typecheck; browser QA pending |

## Unresolved source differences
- Word history deletion vs backend media-only retention: no automatic deletion or retention promise in FE.
- Secondary read-only wording vs flags: enforce explicit link flags.
- Center activity reports are not global audit logs. Admin has no GPS/face access.
- QR linking, TTS settings, voice history are included as demo workflows from WBS; API contracts remain pending.
- Upload size is not specified by BE: demo applies a clearly labeled 2 MB per image limit to protect browser storage.
- No REST payload, SignalR subscription method, refresh cookie or FCM token registration is inferred from database columns.

