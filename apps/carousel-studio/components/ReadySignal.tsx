'use client';
import { useEffect } from 'react';

// Tells the exporter the slide is safe to capture (fonts loaded, images decoded)
// and reports layout problems: text overflowing its area or elements leaving the slide.
export function ReadySignal() {
  useEffect(() => {
    const imgs = Array.from(document.images);
    Promise.all([document.fonts.ready, ...imgs.map((im) => (im.complete ? Promise.resolve() : im.decode().catch(() => undefined)))]).then(() => {
      requestAnimationFrame(() => {
        const issues: string[] = [];
        document.querySelectorAll<HTMLElement>('[data-area]').forEach((el) => {
          if (el.scrollHeight > el.clientHeight + 2) issues.push(`Content is ${el.scrollHeight - el.clientHeight}px taller than its area, so text is cut off. Shorten it or split the slide.`);
        });
        const slide = document.querySelector<HTMLElement>('[data-slide]')?.getBoundingClientRect();
        document.querySelectorAll<HTMLElement>('[data-slide] *').forEach((el) => {
          if (!slide || el.closest('[data-area]')) return;
          const r = el.getBoundingClientRect();
          if (r.width && (r.left < slide.left - 1 || r.right > slide.right + 1 || r.bottom > slide.bottom + 1)) issues.push('An element sticks out of the slide edge.');
        });
        const broken = imgs.filter((im) => !im.naturalWidth).length;
        if (broken) issues.push(`${broken} image(s) failed to load.`);
        const w = window as unknown as { __slideReady: boolean; __slideIssues: string[] };
        w.__slideIssues = [...new Set(issues)];
        w.__slideReady = true;
      });
    });
  }, []);
  return null;
}
