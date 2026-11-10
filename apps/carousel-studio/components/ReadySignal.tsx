'use client';
import { useEffect } from 'react';

// Tells the exporter the slide is safe to screenshot: fonts loaded and every image decoded.
export function ReadySignal() {
  useEffect(() => {
    const imgs = Array.from(document.images);
    Promise.all([document.fonts.ready, ...imgs.map((im) => (im.complete ? Promise.resolve() : im.decode().catch(() => undefined)))]).then(() => {
      requestAnimationFrame(() => {
        (window as unknown as { __slideReady: boolean }).__slideReady = true;
      });
    });
  }, []);
  return null;
}
