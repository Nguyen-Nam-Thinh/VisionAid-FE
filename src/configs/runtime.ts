import { t } from '../i18n';
export function parseMode(value?: string): 'mock' | 'api' {
  if (!value || value === 'mock') return 'mock';
  if (value === 'api') return 'api';
  throw new Error(t('VITE_SERVICE_MODE phải là mock hoặc api.'));
}
/**
 * Number the "call 115" buttons dial. Production leaves it unset (115); a test deployment can set a
 * team phone so pressing call never reaches the real emergency line. The button text stays "115".
 */
export function parseEmergencyNumber(value?: string) {
  const number = (value || '').replace(/[\s.-]/g, '');
  return /^\+?[0-9]{3,15}$/.test(number) ? number : '115';
}
export const runtime = {
  mode: parseMode(import.meta.env.VITE_SERVICE_MODE),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  signalRUrl: import.meta.env.VITE_SIGNALR_URL || '',
  mapboxToken: import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '',
  emergencyDialHref: 'tel:' + parseEmergencyNumber(import.meta.env.VITE_EMERGENCY_DIAL_NUMBER),
};
