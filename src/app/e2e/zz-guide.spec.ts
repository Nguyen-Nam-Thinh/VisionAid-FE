// TEMPORARY: screenshots for Report 6 (user guide). Fixture data only; delete after use.
import { test, expect, type Page } from '@playwright/test';

test.setTimeout(180000);
const OUT = process.env.GUIDE_OUT ?? 'test-results';
const uid = (n: number) => '01900000-0000-7000-8000-' + String(n).padStart(12, '0');
const ORG = uid(900);
const ME = { Caregiver: uid(1), CenterAdmin: uid(2), Admin: uid(3) } as const;
type Role = keyof typeof ME;
const AN = uid(11);
const BINH = uid(12);
const CUONG = uid(13);
const now = Date.now();
const ago = (min: number) => new Date(now - min * 60000).toISOString();
const later = (days: number) => new Date(now + days * 86400000).toISOString();
const day = (offset: number) => new Date(now - offset * 86400000).toISOString().slice(0, 10);
const paged = (items: unknown[], pageSize = 20) => ({
  items,
  page: 1,
  pageSize,
  totalCount: items.length,
  totalPages: items.length ? 1 : 0,
  hasNextPage: false,
  hasPreviousPage: false,
});
const token = () =>
  'header.' +
  Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url') +
  '.signature';
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

const meData = (role: Role) => ({
  id: ME[role],
  email: { Caregiver: 'minhanh@example.test', CenterAdmin: 'quanly@anhsang.test', Admin: 'admin@visionaid.test' }[role],
  fullName: { Caregiver: 'Nguyễn Minh Anh', CenterAdmin: 'Phạm Thu Hà', Admin: 'Quản trị VisionAid' }[role],
  role,
  isActive: true,
  organizationId: role === 'CenterAdmin' ? ORG : null,
  phoneNumber: '0909123456',
});

const viu = (id: string, name: string, email: string, phone: string, org: string | null = null) => ({
  id,
  fullName: name,
  email,
  phoneNumber: phone,
  role: 'VisuallyImpaired',
  organizationId: org,
  isActive: true,
  licenseStatus: 'Active',
  licenseExpiresAt: later(24),
  avatarUrl: null,
  deletedAt: null,
  lastLoginAt: ago(30),
  createdAt: '2026-10-05T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
});
const familyVius = [
  viu(AN, 'Nguyễn Văn An', 'van.an@example.test', '0912345678'),
  viu(BINH, 'Trần Thị Bình', 'thi.binh@example.test', '0987654321'),
];
const centerVius = [
  viu(AN, 'Lê Văn Đức', 'duc.le@anhsang.test', '0911222333', ORG),
  viu(BINH, 'Hoàng Thị Mai', 'mai.hoang@anhsang.test', '0922333444', ORG),
  viu(CUONG, 'Võ Minh Tuấn', 'tuan.vo@anhsang.test', '0933444555', ORG),
];
const staff = [
  ['Trần Quốc Bảo', 'bao.tran@anhsang.test'],
  ['Ngô Thanh Hương', 'huong.ngo@anhsang.test'],
].map(([name, email], i) => ({
  ...viu(uid(21 + i), name, email, '090' + (1234560 + i)),
  role: 'Caregiver',
  organizationId: ORG,
  licenseStatus: null,
  licenseExpiresAt: null,
}));
const link = (viuId: string, name: string, i: number, type = 'Personal') => ({
  id: uid(31 + i),
  caregiverId: type === 'Personal' ? ME.Caregiver : staff[i % 2].id,
  visuallyImpairedUserId: viuId,
  viuFullName: name,
  isPrimary: true,
  linkType: type,
  canReceiveAlerts: true,
  canManageRegistry: true,
  canManageLocations: true,
  linkedAt: '2026-10-05',
  unlinkedAt: null,
});
const fall = {
  id: uid(41),
  visuallyImpairedUserId: AN,
  detectionMethod: 'AccelerometerCamera',
  currentStatus: 'Sent',
  latitude: 10.7769,
  longitude: 106.7009,
  notes: null,
  snapshotPath: 'snapshots/' + uid(41) + '.png',
  detectedAt: ago(7),
  gracePeriodEndsAt: ago(6),
  sentAt: ago(6),
  acknowledgedAt: null,
  acknowledgedBy: null,
  escalatedAt: null,
  resolvedAt: null,
  resolvedBy: null,
  dismissedAt: null,
};
const sos = {
  ...fall,
  id: uid(42),
  visuallyImpairedUserId: BINH,
  detectionMethod: 'Manual',
  currentStatus: 'Resolved',
  snapshotPath: null,
  detectedAt: ago(1500),
  gracePeriodEndsAt: null,
  sentAt: ago(1500),
  acknowledgedAt: ago(1497),
  acknowledgedBy: ME.Caregiver,
  resolvedAt: ago(1480),
  resolvedBy: ME.Caregiver,
};
const inbox = [
  ['FallDetected', 'EmergencyEvent', AN, 'Nguyễn Văn An', 6],
  ['GeofenceBreach', 'LocationBoundaryEvent', BINH, 'Trần Thị Bình', 95],
  ['SystemAlert', 'System', null, null, 1440],
].map(([type, source, v, name, min], i) => ({
  id: uid(51 + i),
  notificationType: type,
  sourceType: source,
  emergencyEventId: type === 'FallDetected' ? fall.id : null,
  locationBoundaryEventId: null,
  visuallyImpairedUserId: v,
  visuallyImpairedUserName: name,
  title: null,
  body: null,
  deliveries: ['Fcm'],
  createdAt: ago(min as number),
  sentAt: ago(min as number),
  readAt: i === 2 ? ago(1000) : null,
}));
const payment = (order: string, type: string, amount: number, days: number, i: number, status = 'Success') => ({
  id: uid(61 + i),
  payosOrderId: order,
  transactionType: type,
  status,
  amount,
  currency: 'VND',
  payosCheckoutUrl: null,
  failureReason: null,
  paidAt: status === 'Success' ? ago(days * 1440) : null,
  createdAt: ago(days * 1440 + 5),
});
const faces = [
  ['Nguyễn Thị Lan', 'Mẹ', 4],
  ['Nguyễn Văn Hùng', 'Anh trai', 3],
  ['Cô Mai', 'Hàng xóm', 1],
].map(([name, rel, count], i) => ({
  id: uid(71 + i),
  visuallyImpairedUserId: AN,
  displayName: name,
  relationship: rel,
  notes: null,
  imageCount: count,
  isActive: (count as number) >= 3,
  images: Array.from({ length: count as number }, (_, k) => ({
    id: uid(700 + i * 10 + k),
    personId: uid(71 + i),
    isPrimaryImage: k === 0,
    uploadedAt: '2026-11-02T03:00:00Z',
  })),
}));
const place = (i: number, name: string, lat: number, lng: number) => ({
  id: uid(81 + i),
  visuallyImpairedUserId: AN,
  name,
  latitude: lat,
  longitude: lng,
  isActive: true,
  createdAt: '2026-10-10T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
});
const saved = [
  { ...place(0, 'Nhà', 10.7769, 106.7009), description: 'Nhà riêng', arrivalRadiusMeters: 50, ttsAnnouncement: 'Bạn đã về đến nhà.' },
  { ...place(1, 'Chợ Bến Thành', 10.7725, 106.698), description: null, arrivalRadiusMeters: 80, ttsAnnouncement: 'Bạn đã đến chợ Bến Thành.' },
  { ...place(2, 'Bệnh viện Mắt', 10.7797, 106.6893), description: 'Khám định kỳ', arrivalRadiusMeters: 60, ttsAnnouncement: 'Bạn đã đến bệnh viện.' },
];
const zones = [
  { ...place(5, 'Khu vực quanh nhà', 10.7769, 106.7009), radiusMeters: 300, alertOnExit: true, alertOnEnter: false },
  { ...place(6, 'Công viên Tao Đàn', 10.7744, 106.6925), radiusMeters: 200, alertOnExit: false, alertOnEnter: true },
];
const contacts = [
  ['Nguyễn Minh Anh (con gái)', 'Both', '0909123456', 'https://zalo.me/0909123456', 1],
  ['Trần Văn Nam (hàng xóm)', 'Phone', '0918765432', null, 2],
  ['Cấp cứu', 'Phone', '115', null, 3],
].map(([name, type, phone, zalo, prio], i) => ({
  id: uid(91 + i),
  visuallyImpairedUserId: AN,
  contactName: name,
  contactType: type,
  phoneNumber: phone,
  zaloDeepLink: zalo,
  priorityOrder: prio,
  isActive: true,
  notes: null,
  createdAt: '2026-10-10T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
}));
const timeline = [
  ['ObstacleDetection', 'Phát hiện vật cản', 'motorcycle (Near)', 'Alerted', 0.91, 'Phía trước có xe máy, hãy dừng lại', 12],
  ['NavigationGuidance', 'Hướng dẫn dẫn đường', 'TURN_LEFT', 'Jev', null, 'Phía trước có ghế, hãy đi sang trái', 14],
  ['Ocr', 'Đọc chữ', 'Hiệu thuốc Long Châu', 'Success', 0.88, 'Hiệu thuốc Long Châu', 40],
  ['FaceRecognition', 'Nhận diện', 'Nguyễn Thị Lan', 'Matched', 0.93, 'Đây là Nguyễn Thị Lan', 75],
  ['VoiceCommand', 'Lệnh giọng nói', 'tôi đang ở đâu → WHERE_AM_I', 'Success', null, 'Bạn đang ở 12 Lê Lợi, Quận 1', 90],
  ['QrScan', 'Quét QR', 'https://visionaid.net', 'Success', null, 'Mã QR chứa đường dẫn visionaid.net', 130],
].map(([type, label, detail, result, score, spoken, min], i) => ({
  occurredAt: ago(min as number),
  activityType: type,
  activityLabel: label,
  sourceId: uid(300 + i),
  detail,
  result,
  score,
  spokenText: spoken,
  latitude: 10.7769,
  longitude: 106.7009,
  actorId: null,
  actorName: null,
}));
const history = Array.from({ length: 6 }, (_, i) => ({
  id: uid(400 + i),
  latitude: 10.7769 - i * 0.0006,
  longitude: 106.7009 - i * 0.0004,
  accuracyMeters: 6 + i,
  altitude: 8,
  speedMps: 1.1,
  heading: 210,
  batteryLevel: 82 - i,
  networkStatus: 'Wifi',
  recordedAt: ago(2 + i * 5),
  sessionId: null,
}));
const calls = [
  ['CaregiverInitiated', 'Ended', 185, 60, AN],
  ['ViuVoiceCommand', 'Ended', 92, 400, BINH],
  ['SosAuto', 'Missed', null, 1500, AN],
].map(([trigger, status, dur, min, v], i) => ({
  sessionId: uid(500 + i),
  triggerType: trigger,
  status,
  durationSeconds: dur,
  startedAt: ago(min as number),
  connectedAt: dur ? ago((min as number) - 0.2) : null,
  endedAt: ago((min as number) - (dur ? (dur as number) / 60 : 1)),
  endReason: dur ? 'Normal' : 'Timeout',
  initiatorId: trigger === 'CaregiverInitiated' ? ME.Caregiver : v,
  receiverId: trigger === 'CaregiverInitiated' ? v : ME.Caregiver,
  viuUserId: v,
  emergencyEventId: null,
}));
const pkg = (i: number, name: string, code: string, type: string, price: number, licenses: number) => ({
  id: uid(600 + i),
  name,
  code,
  packageType: type,
  priceMonthly: price,
  priceYearly: price * 10,
  currency: 'VND',
  maxViuPerLicense: 1,
  includedLicenses: licenses,
  trialDays: type === 'Personal' ? 7 : 0,
  durationDays: 30,
  featureFlags: { webrtc: true, ai_navigation: true, face_recognition: true, ocr: true },
  isActive: true,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
});
const packages = [
  pkg(0, 'Gói gia đình', 'PERSONAL', 'Personal', 99000, 3),
  pkg(1, 'Gói trung tâm', 'BUSINESS', 'Business', 4500000, 50),
];
const pool = {
  id: uid(650),
  organizationId: ORG,
  package: { id: packages[1].id, name: 'Gói trung tâm', code: 'BUSINESS', packageType: 'Business' },
  totalLicenses: 50,
  usedLicenses: 3,
  availableLicenses: 47,
  status: 'Active',
  purchasedAt: ago(10 * 1440),
  expiresAt: later(20),
  suspendedReason: null,
};
const org = (i: number, name: string, tax: string, addr: string, admin: string | null, staffCount: number, viuCount: number) => ({
  id: i === 0 ? ORG : uid(910 + i),
  name,
  taxCode: tax,
  address: addr,
  phoneNumber: '028' + (38123450 + i),
  contactEmail: 'lienhe' + i + '@trungtam.test',
  isActive: true,
  deletedAt: null,
  createdAt: '2026-09-20T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
  staffCount,
  viuCount,
  centerAdminName: admin,
});
const orgs = [
  org(0, 'Trung tâm Ánh Sáng', '0312345678', '12 Nguyễn Đình Chiểu, Quận 3, TP. Hồ Chí Minh', 'Phạm Thu Hà', 2, 3),
  org(1, 'Hội Người mù Hà Nội', '0109876543', '45 Láng Hạ, Đống Đa, Hà Nội', 'Lê Quang Vinh', 5, 18),
  org(2, 'Trường Nguyễn Đình Chiểu', '0401122334', '81 Trần Phú, Hải Châu, Đà Nẵng', null, 0, 0),
];
const config = (i: number, key: string, value: string, type: string, cat: string, min: string | null, max: string | null) => ({
  id: uid(800 + i),
  configKey: key,
  configValue: value,
  valueType: type,
  category: cat,
  description: null,
  minValue: min,
  maxValue: max,
  isPublic: true,
  updatedAt: ago(3000 + i * 100),
  updatedBy: ME.Admin,
});
const configs = [
  config(0, 'ai.yolo.confidence_threshold', '0.5', 'Decimal', 'AI', '0', '1'),
  config(1, 'ai.facenet.similarity_threshold', '0.75', 'Decimal', 'AI', '0', '1'),
  config(2, 'ai.vision_assist.enabled', 'true', 'Boolean', 'AI', null, null),
  config(3, 'hybrid_navigation_enabled', 'true', 'Boolean', 'AI_NAVIGATION', null, null),
  config(4, 'navigation_near_threshold_ms', '1500', 'Integer', 'AI_NAVIGATION', '100', '10000'),
  config(5, 'caregiving.max_vius_per_caregiver', '3', 'Integer', 'Caregiving', '1', '10'),
  config(6, 'face_registry.min_photos_to_activate', '3', 'Integer', 'FaceRegistry', '1', '10'),
  config(7, 'location.geofence.default_radius_meters', '300', 'Integer', 'Location', '50', '50000'),
  config(8, 'webrtc_ring_timeout_seconds', '45', 'Integer', 'WEBRTC', '10', '120'),
  config(9, 'payos_enabled', 'true', 'Boolean', 'PAYMENT', null, null),
];
const metrics = [
  ['YOLOv8n', '8.1', 'obstacle_detection_sessions', 1240, 1228, 0.86, 38, 72, 95],
  ['FaceNet', '1.0', 'face_recognition_logs', 312, 301, 0.91, 210, 380, 520],
  ['VietOCR', '0.3', 'ocr_requests', 186, 179, 0.84, 640, 1100, 1450],
  ['Gemini', '3.5-flash-lite', 'ocr_requests', 140, 137, null, 1850, 3200, 4100],
].map(([model, ver, source, total, ok, conf, avg, p95, p99], i) => ({
  id: uid(850 + i),
  modelName: model,
  modelVersion: ver,
  metricDate: day(1),
  sourceTable: source,
  totalRequests: total,
  successfulRequests: ok,
  failedRequests: (total as number) - (ok as number),
  avgConfidence: conf,
  avgLatencyMs: avg,
  p95LatencyMs: p95,
  p99LatencyMs: p99,
  errorCount: (total as number) - (ok as number),
  aggregatedBy: 'system',
  recordedAt: ago(600),
}));
const audit = [
  ['UpdateSystemConfig', 'system_configurations', 50],
  ['CreateOrganization', 'organizations', 300],
  ['CreateUser', 'users', 420],
  ['UpdateLicensePackage', 'license_packages', 1300],
].map(([action, table, min], i) => ({
  id: uid(870 + i),
  actorId: ME.Admin,
  actorName: 'Quản trị VisionAid',
  actorEmail: 'admin@visionaid.test',
  actionType: action,
  targetTable: table,
  targetRecordId: uid(880 + i),
  performedAt: ago(min as number),
}));
const revenue = {
  dateFrom: day(30),
  dateTo: day(0),
  groupBy: 'Month',
  currency: 'VND',
  summary: {
    grossRevenue: 14094000,
    refundedAmount: 0,
    netRevenue: 14094000,
    paidTransactions: 26,
    pendingTransactions: 2,
    failedTransactions: 1,
    cancelledTransactions: 3,
    payingCaregivers: 22,
    payingOrganizations: 2,
    averageOrderValue: 542077,
  },
  byChannel: [
    { channel: 'B2B', revenue: 9000000, transactions: 2 },
    { channel: 'B2C', revenue: 5094000, transactions: 24 },
  ],
  byTransactionType: [
    { transactionType: 'LicensePurchase', revenue: 9000000, transactions: 2 },
    { transactionType: 'SubscriptionNew', revenue: 2970000, transactions: 15 },
    { transactionType: 'SubscriptionRenew', revenue: 2124000, transactions: 9 },
  ],
  byPackage: [
    { packageId: packages[1].id, packageName: 'Gói trung tâm', packageType: 'Business', revenue: 9000000, transactions: 2 },
    { packageId: packages[0].id, packageName: 'Gói gia đình', packageType: 'Personal', revenue: 5094000, transactions: 24 },
  ],
  timeline: [
    { period: day(40).slice(0, 7), periodStart: day(40).slice(0, 8) + '01', revenue: 6120000, transactions: 11 },
    { period: day(0).slice(0, 7), periodStart: day(0).slice(0, 8) + '01', revenue: 7974000, transactions: 15 },
  ],
  topOrganizations: [
    { organizationId: ORG, organizationName: 'Trung tâm Ánh Sáng', revenue: 4500000, transactions: 1 },
    { organizationId: orgs[1].id, organizationName: 'Hội Người mù Hà Nội', revenue: 4500000, transactions: 1 },
  ],
};

async function stub(page: Page, role: Role) {
  const unknown: string[] = [];
  await page.route(/^https:\/\/([a-z0-9-]+\.)*mapbox\.com\//, (route) =>
    /\/styles\//.test(route.request().url())
      ? route.fulfill({
          json: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#e9f2ef' } }] },
        })
      : route.abort(),
  );
  await page.route('http://localhost:5176/api/**', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    const q = url.searchParams;
    const ok = (data: unknown) => route.fulfill({ json: { success: true, data } });
    const center = role === 'CenterAdmin';
    const vius = center ? centerVius : familyVius;
    if (p === '/api/auth/login' || p === '/api/auth/refresh')
      return ok({ accessToken: token(), refreshToken: 'guide', expiresAt: '2099-01-01T00:00:00Z' });
    if (p === '/api/users/me') return ok(meData(role));
    if (req.method() !== 'GET') return ok(null);
    if (p === '/api/notifications/inbox/unread-count') return ok(2);
    if (p === '/api/notifications/inbox') return ok(paged(inbox));
    if (p === '/api/system-configs/public') return ok(paged([], 100));
    if (p === '/api/users') {
      const r = q.get('role');
      if (role === 'Admin' && !r) return ok(paged([...staff, ...centerVius, ...familyVius.slice(0, 1)], 10));
      if (r === 'Caregiver') return ok(paged(staff, 10));
      return ok(paged(vius, 10));
    }
    if (/^\/api\/users\/[^/]+\/emergency-contacts/.test(p)) return ok(paged(contacts, 10));
    if (/^\/api\/users\/[^/]+\/tts-preferences/.test(p))
      return ok({
        id: uid(95),
        userId: AN,
        voiceGender: 'Female',
        speedRate: 1,
        volumeLevel: 0.8,
        detectionMode: 'Full',
        primaryLanguage: 'vi-VN',
        secondaryLanguage: 'en-US',
        updatedAt: ago(3000),
      });
    if (p === '/api/caregiver-links') {
      const v = q.get('viuId');
      const all = center
        ? centerVius.map((x, i) => link(x.id, x.fullName, i, 'Organization'))
        : familyVius.map((x, i) => link(x.id, x.fullName, i));
      return ok(paged(v ? all.filter((l) => l.visuallyImpairedUserId === v) : all, 10));
    }
    if (p === '/api/caregiver-links/invitations')
      return ok([
        {
          id: uid(96),
          state: 'Accepted',
          invitedBy: ME.Caregiver,
          invitedByName: 'Nguyễn Minh Anh',
          canReceiveAlerts: true,
          canManageRegistry: false,
          canManageLocations: false,
          createdAt: ago(4000),
          expiresAt: ago(3970),
          acceptedBy: uid(97),
          acceptedByName: 'Nguyễn Văn Hùng',
          acceptedAt: ago(3990),
          resultingLinkId: uid(98),
          revokedAt: null,
        },
      ]);
    if (p.startsWith('/api/emergency-events/') && p.endsWith('/snapshot'))
      return route.fulfill({ status: 200, contentType: 'image/png', body: png });
    if (p.startsWith('/api/emergency-events/'))
      return ok({
        ...fall,
        statusHistory: [
          { id: uid(99), fromStatus: 'Detected', toStatus: 'Sent', changedBy: null, changedAt: ago(6), reason: 'Auto-dispatched: grace period expired', changedByName: null },
        ],
        acknowledgedByName: null,
        resolvedByName: null,
        notifications: [
          { id: uid(100), notificationType: 'FallDetected', channel: 'Fcm', status: 'Sent', recipientId: ME.Caregiver, recipientName: 'Nguyễn Minh Anh', recipientRole: 'Caregiver', caregiverLinkId: uid(31), createdAt: ago(6), sentAt: ago(6), readAt: null, failureReason: null },
        ],
      });
    if (p === '/api/emergency-events') {
      const s = q.get('status');
      const items = [fall, sos].filter((e) => !s || e.currentStatus === s);
      return ok(paged(items));
    }
    if (p === '/api/licenses/subscription')
      return ok({
        id: uid(101),
        status: 'Active',
        package: { id: packages[0].id, name: 'Gói gia đình', code: 'PERSONAL', packageType: 'Personal' },
        startedAt: '2026-10-05T00:00:00Z',
        trialEndsAt: null,
        currentPeriodStart: ago(6 * 1440),
        currentPeriodEnd: later(24),
        autoRenew: true,
        daysRemaining: 24,
      });
    if (p === '/api/licenses/packages') return ok(paged(packages, 10));
    if (p === '/api/licenses/pool') return ok(pool);
    if (p === '/api/licenses/pools') return ok(paged([{ ...pool, organizationName: 'Trung tâm Ánh Sáng' }], 10));
    if (p === '/api/licenses/assignments')
      return ok(
        paged(
          centerVius.map((v, i) => ({
            id: uid(110 + i),
            viuUser: { id: v.id, fullName: v.fullName, email: v.email },
            assignedAt: ago(9000 - i * 100),
            assignedBy: ME.CenterAdmin,
            revokedAt: null,
            isActive: true,
          })),
        ),
      );
    if (p === '/api/licenses/keys')
      return ok(
        paged(
          [
            { id: uid(120), poolId: pool.id, licenseKey: 'A3F9-7C21-B8E4-50D6', state: 'Activated', note: 'Gia đình bác Năm', createdAt: ago(5000), keyExpiresAt: later(20), activatedAt: ago(4800), activatedBy: { id: uid(121), fullName: 'Nguyễn Văn Năm', email: 'nam@example.test' }, periodEnd: later(20), revokedAt: null },
            { id: uid(122), poolId: pool.id, licenseKey: 'D1E2-9A8B-4C3F-77A0', state: 'Unused', note: 'Gia đình cô Hạnh', createdAt: ago(600), keyExpiresAt: later(20), activatedAt: null, activatedBy: null, periodEnd: null, revokedAt: null },
          ],
          10,
        ),
      );
    if (p === '/api/licenses/pool/change-quote')
      return ok({
        changeType: 'Renewal', poolId: pool.id, currentPackage: pool.package, targetPackage: pool.package, amount: 4500000, currency: 'VND', daysLeft: 20, currentDailyPrice: 150000, targetDailyPrice: 150000, effectiveAt: later(20), currentExpiresAt: later(20), newExpiresAt: later(50), currentTotalLicenses: 50, newTotalLicenses: 50, usedLicenses: 3, seatsToRelease: 0, canProceed: true, blockedCode: null, explanation: '',
      });
    if (p === '/api/payments/history')
      return ok(
        paged(
          center
            ? [payment('1791000000201', 'LicensePurchase', 4500000, 10, 0)]
            : [payment('1791000000101', 'SubscriptionRenew', 99000, 6, 0), payment('1791000000088', 'SubscriptionNew', 99000, 36, 1)],
          10,
        ),
      );
    if (p === '/api/payments/revenue-report') return ok(revenue);
    if (p === '/api/locations/live') {
      const v = q.get('viuId');
      return ok({
        userId: v,
        latitude: v === BINH ? 10.7626 : 10.7769,
        longitude: v === BINH ? 106.6602 : 106.7009,
        formattedAddress: v === BINH ? '45 Nguyễn Tri Phương, Quận 10, TP. Hồ Chí Minh' : '12 Lê Lợi, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        street: null,
        district: null,
        city: null,
        geocodeProvider: 'Mapbox',
        cachedAt: ago(2),
        updatedAt: ago(2),
      });
    }
    if (p === '/api/locations/history') return ok(paged(history));
    if (p === '/api/locations/boundary-events') return ok(paged([]));
    if (p === '/api/locations/fleet')
      return ok(
        centerVius.map((v, i) => ({
          viuId: v.id,
          fullName: v.fullName,
          latitude: 10.7769 + i * 0.004,
          longitude: 106.7009 - i * 0.005,
          formattedAddress: ['12 Lê Lợi, Quận 1', '80 Pasteur, Quận 3', '25 Nguyễn Trãi, Quận 5'][i],
          cachedAt: ago(2 + i * 3),
          hasOpenAlert: i === 0,
        })),
      );
    if (p === '/api/face-registry/persons') return ok(faces);
    if (/^\/api\/face-registry\/persons\/[^/]+\/images\//.test(p))
      return route.fulfill({ status: 200, contentType: 'image/png', body: png });
    if (p === '/api/saved-locations') return ok(paged(saved, 10));
    if (p === '/api/geofences') return ok(paged(zones, 10));
    if (p === '/api/activity-history/timeline') return ok(paged(timeline));
    if (p === '/api/webrtc/sessions') return ok(paged(calls));
    if (p === '/api/notifications/preferences')
      return ok(
        ['FallDetected', 'EmergencyManual', 'GeofenceBreach', 'ArrivalNotification', 'SystemAlert'].flatMap((t, i) =>
          ['Fcm', 'Email'].map((c, k) => ({
            id: uid(130 + i * 2 + k),
            userId: ME.Caregiver,
            notificationType: t,
            channel: c,
            isEnabled: c === 'Fcm' || t === 'FallDetected',
            updatedAt: ago(5000),
          })),
        ),
      );
    if (p === '/api/organizations/me' || p === '/api/organizations/' + ORG) return ok(orgs[0]);
    if (p === '/api/organizations') return ok(paged(orgs, 10));
    if (/^\/api\/organizations\/[^/]+\/members/.test(p))
      return ok(paged([...staff, ...centerVius].map((m) => ({ id: m.id, fullName: m.fullName, email: m.email, phoneNumber: m.phoneNumber, role: m.role, isActive: true, lastLoginAt: m.lastLoginAt, createdAt: m.createdAt })), 10));
    if (/^\/api\/organizations\/[^/]+\/activity-summary/.test(p))
      return ok({ organizationId: ORG, dateFrom: null, dateTo: null, emergencyEventCount: 4, geofenceBreachCount: 7, ocrRequestCount: 63, faceRecognitionCount: 28 });
    if (/^\/api\/organizations\/[^/]+\/caregiver-activity/.test(p))
      return ok(paged([{ changedAt: ago(300), caregiverId: staff[0].id, caregiverName: staff[0].fullName, emergencyEventId: uid(140), viuId: AN, viuName: 'Lê Văn Đức', fromStatus: 'Sent', toStatus: 'Acknowledged', reason: null }]));
    if (p === '/api/system-configs') return ok(paged(configs, 50));
    if (/^\/api\/system-configs\/[^/]+\/history/.test(p)) return ok(paged([]));
    if (p === '/api/ai-metrics') return ok(paged(metrics));
    if (p === '/api/audit-logs') return ok(paged(audit));
    if (p === '/api/notifications/failed') return ok(paged([]));
    if (p === '/api/notifications/status') {
      const period = { totalSent: 128, totalFailed: 2, totalPending: 1, byChannel: [{ channel: 'Fcm', sent: 120, failed: 2 }, { channel: 'Email', sent: 8, failed: 0 }] };
      return ok({ last24Hours: period, last7Days: { ...period, totalSent: 812, totalFailed: 9 } });
    }
    if (p === '/api/webrtc/ice-servers')
      return ok(
        paged([
          { id: uid(150), serverType: 'Stun', url: 'stun:stun.l.google.com:19302', username: null, hasCredential: false, priority: 10, isActive: true, createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' },
          { id: uid(151), serverType: 'Turn', url: 'turn:turn.visionaid.net:3478?transport=udp', username: null, hasCredential: false, priority: 20, isActive: true, createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' },
        ]),
      );
    unknown.push(p + url.search);
    return route.fulfill({ status: 404, json: { detail: 'Not in guide fixture' } });
  });
  return unknown;
}

async function login(page: Page, role: Role) {
  await page.goto('/auth/login');
  await page.getByLabel('Địa chỉ email').fill(meData(role).email);
  await page.getByLabel('Mật khẩu *', { exact: true }).fill('Password@1');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function settle(page: Page) {
  const skip = page.getByRole('button', { name: 'Để sau', exact: true });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.waitForTimeout(1200);
}
async function shot(page: Page, name: string, full = false) {
  await settle(page);
  await page.screenshot({ path: `${OUT}/g-${name}.png`, fullPage: full });
}
async function open(page: Page, path: string, name: string, full = false) {
  await page.goto(path);
  await shot(page, name, full);
}
async function choose(page: Page, id: string) {
  const picker = page.getByRole('combobox', { name: 'Người được chăm sóc', exact: true }).first();
  if (await picker.isVisible().catch(() => false)) await picker.selectOption(id).catch(() => {});
}
async function tab(page: Page, name: string) {
  await page.getByRole('tab', { name, exact: true }).click();
}
async function click(page: Page, name: string | RegExp) {
  await page.getByRole('button', { name }).first().click();
}

test('public pages', async ({ page }) => {
  await page.route('http://localhost:5176/api/**', (route) => route.fulfill({ status: 401, json: { detail: 'x' } }));
  await page.goto('/auth/login');
  await page.getByLabel('Địa chỉ email').fill('minhanh@example.test');
  await shot(page, 'login');
  await page.goto('/auth/register');
  await page.getByLabel('Họ và tên').fill('Nguyễn Minh Anh');
  await page.getByLabel('Địa chỉ email').fill('minhanh@example.test');
  await shot(page, 'register');
});

test('caregiver pages', async ({ page }) => {
  const unknown = await stub(page, 'Caregiver');
  await login(page, 'Caregiver');
  await shot(page, 'cg-dashboard', true);
  await open(page, '/profile', 'profile');
  await tab(page, 'Mật khẩu và đăng nhập');
  await shot(page, 'profile-password');

  await open(page, '/caregiver/users', 'cg-users');
  await click(page, 'Thêm người được chăm sóc');
  await page.getByRole('dialog').getByLabel('Họ và tên').fill('Lê Văn Cường');
  await page.getByRole('dialog').getByLabel('Số điện thoại').fill('0934567890');
  await shot(page, 'cg-add-viu');
  await page.keyboard.press('Escape');

  await open(page, '/caregiver/caregivers', 'cg-invite');
  await choose(page, AN);
  await shot(page, 'cg-invite');

  await open(page, '/caregiver/map', 'cg-map');
  await page.getByRole('button', { name: /^Xem GPS của|Vị trí & lịch sử/ }).first().click().catch(() => {});
  await shot(page, 'cg-map-history');

  await open(page, '/caregiver/alerts', 'cg-alerts');
  await click(page, 'Xem chi tiết');
  await shot(page, 'cg-alert-detail');
  await page.keyboard.press('Escape');

  await open(page, '/caregiver/registry', 'x');
  await choose(page, AN);
  await shot(page, 'cg-registry');
  await click(page, 'Quản lý ảnh');
  await shot(page, 'cg-registry-photos');
  await page.keyboard.press('Escape');

  await open(page, '/caregiver/locations', 'x');
  await choose(page, AN);
  await shot(page, 'cg-places');
  await click(page, 'Thêm vùng an toàn');
  await shot(page, 'cg-zone-form');
  await page.keyboard.press('Escape');

  await open(page, '/caregiver/contacts', 'x');
  await choose(page, AN);
  await shot(page, 'cg-contacts');
  await click(page, 'Thêm liên hệ');
  await shot(page, 'cg-contact-form');
  await page.keyboard.press('Escape');

  await open(page, '/caregiver/activity', 'x');
  await choose(page, AN);
  await shot(page, 'cg-activity');

  await open(page, '/caregiver/tts', 'x');
  await choose(page, AN);
  await shot(page, 'cg-tts');

  await open(page, '/caregiver/notifications', 'cg-notifications');
  await open(page, '/inbox', 'cg-inbox');
  await open(page, '/caregiver/calls', 'cg-calls');

  await open(page, '/packages', 'cg-packages');
  await click(page, /Chọn gói/);
  await shot(page, 'cg-checkout');
  await page.keyboard.press('Escape');
  await open(page, '/license', 'cg-license');
  await tab(page, 'Kích hoạt bằng mã');
  await shot(page, 'cg-license-key');
  await open(page, '/caregiver/payments', 'cg-payments');
  console.log('UNKNOWN caregiver', JSON.stringify([...new Set(unknown)]));
});

test('center admin pages', async ({ page }) => {
  const unknown = await stub(page, 'CenterAdmin');
  await login(page, 'CenterAdmin');
  await shot(page, 'ca-dashboard', true);
  await open(page, '/center-admin/organization', 'ca-organization');
  await open(page, '/center-admin/staff', 'ca-staff');
  await click(page, 'Tạo tài khoản');
  await shot(page, 'ca-staff-create');
  await page.keyboard.press('Escape');
  await open(page, '/center-admin/users', 'ca-vius');
  await open(page, '/center-admin/assignments', 'ca-assignments');
  await open(page, '/center-admin/map', 'ca-fleet');
  await open(page, '/center-admin/alerts', 'ca-alerts');
  await open(page, '/center-admin/licenses', 'ca-pool');
  await tab(page, 'Suất đã cấp');
  await shot(page, 'ca-pool-assigned');
  await click(page, 'Cấp suất sử dụng');
  await shot(page, 'ca-pool-assign');
  await page.keyboard.press('Escape');
  await tab(page, 'Mã kích hoạt cho gia đình');
  await shot(page, 'ca-keys');
  await open(page, '/packages', 'ca-packages');
  await open(page, '/center-admin/reports', 'ca-reports');
  await open(page, '/center-admin/payments', 'ca-payments');
  console.log('UNKNOWN center', JSON.stringify([...new Set(unknown)]));
});

test('admin pages', async ({ page }) => {
  const unknown = await stub(page, 'Admin');
  await login(page, 'Admin');
  await shot(page, 'ad-dashboard', true);
  await open(page, '/admin/organizations', 'ad-orgs');
  await click(page, 'Tạo tổ chức');
  await shot(page, 'ad-org-create');
  await page.keyboard.press('Escape');
  await open(page, '/admin/accounts', 'ad-accounts');
  await click(page, 'Tạo tài khoản');
  await shot(page, 'ad-account-create');
  await page.keyboard.press('Escape');
  await open(page, '/admin/packages', 'ad-packages');
  await open(page, '/admin/configurations', 'ad-configs');
  await open(page, '/admin/revenue', 'ad-revenue');
  await open(page, '/admin/license-pools', 'ad-pools');
  await open(page, '/admin/metrics', 'ad-metrics');
  await open(page, '/admin/delivery', 'ad-delivery');
  await open(page, '/admin/audit', 'ad-audit');
  await open(page, '/admin/ice-servers', 'ad-ice');
  console.log('UNKNOWN admin', JSON.stringify([...new Set(unknown)]));
});
