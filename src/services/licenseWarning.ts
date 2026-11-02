import { onSessionEnded } from './sessionLifecycle';

/**
 * Personal license state as the BE last reported it on a response. The grace length is a server
 * config (license_grace_period_days), so the Web never computes it: `grace` comes from the
 * `X-License-Warning: expiring-in-{n}d` header, `expired` from a 402 LICENSE_EXPIRED answer.
 */
export type LicenseWarning = { kind: 'grace'; daysLeft: number } | { kind: 'expired' } | null;

let state: LicenseWarning = null;
const listeners = new Set<() => void>();

export const getLicenseWarning = () => state;
export function onLicenseWarning(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function setLicenseWarning(next: LicenseWarning) {
  if (
    state?.kind === next?.kind &&
    (state?.kind !== 'grace' || next?.kind !== 'grace' || state.daysLeft === next.daysLeft)
  )
    return;
  state = next;
  listeners.forEach((listener) => listener());
}
/** Reads the header value; unknown formats are ignored rather than guessed. */
export function noteLicenseHeader(value: string | null) {
  const match = value ? /^expiring-in-(\d+)d$/.exec(value.trim()) : null;
  if (match) setLicenseWarning({ kind: 'grace', daysLeft: Number(match[1]) });
}

onSessionEnded(() => setLicenseWarning(null));
