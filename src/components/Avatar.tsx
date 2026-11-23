import { useEffect, useState } from 'react';
import { avatarApi, isProtectedAvatar } from '../services/api/avatar';
import { onSessionEnded } from '../services/sessionLifecycle';

/**
 * A user's picture. The BE route needs the session token, so it is fetched as a blob instead of
 * an <img src>; demo data URLs render directly. Falls back to initials when there is no picture.
 */
export function Avatar({
  url,
  name,
  alt = '',
  className = 'avatar',
  size,
}: {
  url?: string | null;
  name: string;
  alt?: string;
  className?: string;
  size?: number;
}) {
  const [loaded, setLoaded] = useState<{ url: string; src: string } | null>(null);
  const src =
    url && !isProtectedAvatar(url)
      ? url.startsWith('data:image/')
        ? url
        : ''
      : loaded && loaded.url === url
        ? loaded.src
        : '';
  useEffect(() => {
    if (!url || !isProtectedAvatar(url)) return;
    const controller = new AbortController();
    let objectUrl = '';
    const clean = () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    const off = onSessionEnded(() => {
      clean();
      setLoaded(null);
    });
    avatarApi
      .image(url, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setLoaded({ url, src: objectUrl });
      })
      // A missing or forbidden picture is not an error worth showing: keep the initials.
      .catch(() => {});
    return () => {
      off();
      clean();
    };
  }, [url]);
  const initials = name.split(' ').at(-1)?.slice(0, 2).toUpperCase();
  return (
    <span className={className} style={size ? { width: size, height: size } : undefined}>
      {src ? <img src={src} alt={alt} width={size} height={size} /> : initials}
    </span>
  );
}
