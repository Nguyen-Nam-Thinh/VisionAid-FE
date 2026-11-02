import { useSyncExternalStore } from 'react';
import { getLicenseWarning, onLicenseWarning } from '../services/licenseWarning';

/** Latest personal license warning reported by the BE (header or 402), cleared on sign-out. */
export const useLicenseWarning = () =>
  useSyncExternalStore(onLicenseWarning, getLicenseWarning, getLicenseWarning);
