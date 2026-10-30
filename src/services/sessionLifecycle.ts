const listeners = new Set<(expired: boolean) => void>();
export const sessionEnded = (expired = false) => listeners.forEach((listener) => listener(expired));
export function onSessionEnded(listener: (expired: boolean) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
