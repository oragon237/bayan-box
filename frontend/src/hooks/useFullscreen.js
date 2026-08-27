import { useEffect, useRef } from 'react';

/**
 * Request fullscreen as soon as possible.
 *
 * Browsers require a user gesture for the Fullscreen API, so on mount we try
 * immediately (works when the PWA already has the gesture in some engines)
 * and fall back to requesting on the first pointer/keyboard interaction.
 */
export function useFullscreen() {
  const requested = useRef(false);

  const request = () => {
    const el = document.documentElement;
    if (!el || requested.current) return;
    requested.current = true;

    try {
      const p = el.requestFullscreen?.();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {
      /* gesture required — handled by the interaction listener */
    }
  };

  useEffect(() => {
    request();

    const onGesture = () => request();
    window.addEventListener('pointerdown', onGesture);
    window.addEventListener('keydown', onGesture);
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, []);

  return request;
}