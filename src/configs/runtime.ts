export function parseMode(value?: string): 'mock' | 'api' {
  if (!value || value === 'mock') return 'mock';
  if (value === 'api') return 'api';
  throw new Error('VITE_SERVICE_MODE phải là mock hoặc api.');
}
export const runtime = {
  mode: parseMode(import.meta.env.VITE_SERVICE_MODE),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  signalRUrl: import.meta.env.VITE_SIGNALR_URL || '',
  mapboxToken: import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '',
};
