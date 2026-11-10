// Small stroked icon set (24×24) drawn in code, so diagrams never depend on external assets.
const P: Record<string, string> = {
  chat: 'M4 5h16v11H9l-5 4z',
  file: 'M6 3h8l4 4v14H6z M14 3v4h4',
  upload: 'M12 16V4 M7 9l5-5 5 5 M4 20h16',
  plus: 'M12 5v14 M5 12h14',
  pencil: 'M4 20l4-1 11-11-3-3L5 16z M14 6l3 3',
  globe: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18',
  phone: 'M8 2h8v20H8z M11 18h2',
  desktop: 'M3 4h18v12H3z M9 20h6 M12 16v4',
  spark: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  check: 'M5 12l5 5 9-10',
  cross: 'M6 6l12 12 M18 6L6 18',
  warning: 'M12 3l10 18H2z M12 10v5 M12 18h.01',
  lock: 'M6 11h12v10H6z M8 11V7a4 4 0 0 1 8 0v4',
  search: 'M10 4a6 6 0 1 0 0 12a6 6 0 1 0 0-12 M15 15l6 6',
  list: 'M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
  user: 'M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8 M4 21c1-4 5-6 8-6s7 2 8 6',
  target: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8',
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 7v5l3 3',
  bulb: 'M9 18h6 M10 21h4 M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10',
  image: 'M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 6 M15 9h.01',
  code: 'M8 7l-5 5 5 5 M16 7l5 5-5 5',
  refresh: 'M20 12a8 8 0 1 1-3-6 M20 4v5h-5',
  book: 'M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z M12 6v14',
  folder: 'M3 6h6l2 2h10v11H3z',
  shield: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
  money: 'M3 7h18v10H3z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
};
export const ICONS = Object.keys(P);

export function Icon({ name, size = 40, color = 'currentColor', stroke = 2.2 }: { name: string; size?: number; color?: string; stroke?: number }) {
  const d = P[name] ?? P.spark;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {d.split(' M').map((seg, i) => <path key={i} d={(i ? 'M' : '') + seg} />)}
    </svg>
  );
}
