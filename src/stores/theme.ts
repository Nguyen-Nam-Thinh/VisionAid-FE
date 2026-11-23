import { useSyncExternalStore } from 'react';

/** Light or dark workspace. Saved per browser; without a saved choice it follows the system. */
export type Theme = 'light' | 'dark';
const key = 'visionaid.theme';
const listeners = new Set<() => void>();

function saved(): Theme | null {
  try {
    const value = localStorage.getItem(key);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}
function system(): Theme {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}
let current: Theme = saved() ?? system();

/** Writes the theme on <html> so every token re-resolves; call before the first render. */
export function applyTheme(theme: Theme = current) {
  current = theme;
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme;
}
export function setTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(key, theme);
  } catch {
    // Storage blocked (private mode): the choice lasts for this tab only.
  }
  listeners.forEach((listener) => listener());
}
export const getTheme = () => current;
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function useTheme() {
  return useSyncExternalStore(subscribe, getTheme, getTheme);
}
// Follow the system while the user has not picked a theme.
if (typeof matchMedia === 'function')
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (!saved()) {
      applyTheme(system());
      listeners.forEach((listener) => listener());
    }
  });
