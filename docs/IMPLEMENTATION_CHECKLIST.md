# Implementation checklist

Source: VisionAid.docx, VisionAid.txt, DB.txt, backend CLAUDE.md and Report3 WBS (web rows 1–4, 12–43). Mobile-only rows 5–11 are excluded. All data and external delivery in this release are simulated. This file tracks implementation, not backend completion.

| Role | Screen | Actions | Permission | Implementation | Verification |
|---|---|---|---|---|---|
| Shared | Authentication | Login, caregiver register, recovery, reset, logout | Public / own session | Pending | Pending |
| Shared | Profile | Update details, avatar, password | Self | Pending | Pending |
| Shared | Shell | Role menu, guard, 403, 404, reset demo | Role / session | In progress | Pending |
| Caregiver | Overview | Summary, select linked user | Active link | Pending | Pending |
| Caregiver | Linked users | Create VIU, generate/accept demo link | Personal primary / assigned org | Pending | Pending |
| Caregiver | Live map | Select location, stale/reconnect simulation | Active link | Pending | Pending |
| Caregiver | Alerts | Filter, inspect, acknowledge, escalate, resolve, history | Receive-alert flag | Pending | Pending |
| Caregiver | Registry | Create/edit person, upload, primary image, delete | Registry flag | Pending | Pending |
| Caregiver | Locations & geofences | CRUD, coordinates, radius, enter/exit | Locations flag | Pending | Pending |
| Caregiver | Activity | Movement/OCR/QR/face/voice filters | Active link | Pending | Pending |
| Caregiver | Contacts | CRUD, type and priority | Primary | Pending | Pending |
| Caregiver | Secondary caregivers | Add/remove, permissions | Primary | Pending | Pending |
| Caregiver | Notifications & TTS | Channels, mandatory rules, speed/voice | Self / primary | Pending | Pending |
| Center Admin | Overview & organization | Summary, edit profile | Own org | Pending | Pending |
| Center Admin | Staff | Create/edit, deactivate/reactivate, demo reset | Own org | Pending | Pending |
| Center Admin | VIUs | Create/edit, deactivate/reactivate | Own org | Pending | Pending |
| Center Admin | Assignments | Link/unlink staff and VIU | Same org, limits | Pending | Pending |
| Center Admin | Fleet map | Filters, locations, stale status | Own org | Pending | Pending |
| Center Admin | Reports | Dates, event counts, staff response times | Own org only | Pending | Pending |
| Center Admin | Routing | Override organization rules | Own org | Pending | Pending |
| Super Admin | Overview & organizations | Global aggregates, CRUD / active state | Admin | Pending | Pending |
| Super Admin | Accounts & links | Manage roles/status, reset, support org accounts, links | Admin; no GPS/media | Pending | Pending |
| Super Admin | AI metrics | Period/model, latency, success/confidence | Aggregate only | Pending | Pending |
| Super Admin | Configurations | Edit, history, rollback | Admin | Pending | Pending |
| Super Admin | Rules | Global channels, mandatory flag | Admin | Pending | Pending |
| Super Admin | Delivery & audit | Search/filter, delivery status, audit trail | Admin | Pending | Pending |

## Unresolved source differences
- Word history deletion vs backend media-only retention: no automatic deletion or retention promise in FE.
- Secondary read-only wording vs flags: enforce explicit link flags.
- Center activity reports are not global audit logs. Admin has no GPS/face access.
- QR linking, TTS settings, voice history are included as demo workflows from WBS; API contracts remain pending.
- Upload size is not specified by BE: demo applies a clearly labeled 2 MB per image limit to protect browser storage.
- No REST payload, SignalR subscription method, refresh cookie or FCM token registration is inferred from database columns.
