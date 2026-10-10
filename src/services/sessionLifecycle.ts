const listeners = new Set<() => void>();
export const sessionEnded = () => listeners.forEach((listener) => listener());
export function onSessionEnded(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
