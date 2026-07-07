import { useEffect } from 'react';

/**
 * Locks background page scrolling while a full-screen sheet or modal is open.
 *
 * On iOS Safari, `overflow: hidden` on <body> does NOT stop touch scrolling,
 * which is why the app "bounces around" behind open sheets. The reliable fix is
 * to pin the body with `position: fixed` and restore the scroll offset on close.
 * Paired with `overscroll-behavior-y: none` (index.html) this removes the
 * rubber-band chaining entirely.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
