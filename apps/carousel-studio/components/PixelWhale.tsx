// Original pixel-art whale mascot for balena studio ("balena" = whale).
// Owned asset drawn in code; colours come from the brand config.
// Pure component (no hooks): the animated wrapper lives in MascotBuddy.tsx.
import type { CSSProperties, ReactElement } from 'react';

export type Mood = 'idle' | 'happy' | 'think' | 'talk' | 'surprised';
export const MOODS: Mood[] = ['idle', 'happy', 'think', 'talk', 'surprised'];

// 18 x 10 body grid. B = body, L = belly. Head faces right, tail flicks up-left.
const GRID = [
  'B.................',
  'BB.....BBBBBBBB...',
  'BBB...BBBBBBBBBBB.',
  '.BBB.BBBBBBBBBBBBB',
  '..BBBBBBBBBBBBBBBB',
  '...BBBBBBBBBBBBBBB',
  '....BBBBBBBBBBBBBB',
  '.....BLLLLLLLLLLLB',
  '......BLLLLLLLLLB.',
  '........BB...BB...',
];
const COLS = 18;
const TOP = -3; // extra rows above for the water spout
const ROWS = GRID.length - TOP;

export type WhaleProps = {
  mood?: Mood;
  /** Where the eyes look, -1..1 on each axis (x: left/right, y: up/down). */
  look?: { x: number; y: number };
  size?: number; // rendered width in px
  blink?: boolean;
  mouthOpen?: boolean; // for talking animation
  tilt?: number; // degrees
  colors: { body: string; belly: string; ink: string };
  style?: CSSProperties;
};

export function PixelWhale({ mood = 'idle', look = { x: 0, y: 0 }, size = 200, blink = false, mouthOpen, tilt = 0, colors, style }: WhaleProps) {
  const cells: ReactElement[] = [];
  GRID.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={ch === 'L' ? colors.belly : colors.body} />);
    }),
  );

  // Eyes: think mode glances up-right unless told where to look.
  const lk = mood === 'think' && look.x === 0 && look.y === 0 ? { x: 0.7, y: -0.8 } : look;
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  const ink = colors.ink;
  let eye: ReactElement;
  if (mood === 'happy') {
    // squint: an upside-down U
    eye = (
      <g fill={ink}>
        <rect x={13} y={3.6} width={2} height={0.5} />
        <rect x={13} y={4.1} width={0.5} height={0.6} />
        <rect x={14.5} y={4.1} width={0.5} height={0.6} />
      </g>
    );
  } else if (blink) {
    eye = <rect x={13} y={3.85} width={2} height={0.35} fill={ink} />;
  } else {
    const big = mood === 'surprised';
    const s = big ? 2.4 : 2;
    const p = big ? 0.8 : 1.1;
    const sx = 14 - s / 2;
    const sy = 4 - s / 2;
    const px = 14 + clamp(lk.x) * ((s - p) / 2) - p / 2;
    const py = 4 + clamp(lk.y) * ((s - p) / 2) - p / 2;
    eye = (
      <g>
        <rect x={sx} y={sy} width={s} height={s} fill="#ffffff" />
        <rect x={px} y={py} width={p} height={p} fill={ink} style={{ transition: 'x 0.35s ease, y 0.35s ease' }} />
      </g>
    );
  }

  let mouth: ReactElement;
  const open = mouthOpen ?? mood === 'talk';
  switch (mood) {
    case 'happy':
      mouth = (
        <g fill={ink}>
          <rect x={14.8} y={6} width={0.5} height={0.5} />
          <rect x={15.3} y={6.4} width={1.2} height={0.5} />
          <rect x={16.5} y={6} width={0.5} height={0.5} />
        </g>
      );
      break;
    case 'surprised':
      mouth = <rect x={15.4} y={5.9} width={1} height={1} fill={ink} />;
      break;
    case 'think':
      mouth = <rect x={15.4} y={6.3} width={1} height={0.4} fill={ink} />;
      break;
    default:
      mouth = open ? (
        <g>
          <rect x={15.1} y={5.9} width={1.6} height={1.3} fill={ink} />
          <rect x={15.4} y={6.7} width={1} height={0.5} fill="#FF8FB1" />
        </g>
      ) : (
        <rect x={15.1} y={6.2} width={1.6} height={0.45} fill={ink} />
      );
  }

  const spout =
    mood === 'happy' || mood === 'surprised' ? (
      <g fill="#8FD3FF">
        <rect x={11.5} y={-1} width={1} height={1} />
        <rect x={10.5} y={-2} width={1} height={1} />
        <rect x={12.5} y={-2} width={1} height={1} />
        <rect x={9.5} y={-3} width={1} height={1} opacity={0.7} />
        <rect x={13.5} y={-3} width={1} height={1} opacity={0.7} />
      </g>
    ) : null;

  const blush = mood === 'happy' || mood === 'talk' ? <rect x={11.4} y={5} width={1.2} height={0.6} fill="#FF8FB1" opacity={0.7} /> : null;

  return (
    <svg
      viewBox={`0 ${TOP} ${COLS} ${ROWS}`}
      width={size}
      height={(size * ROWS) / COLS}
      shapeRendering="crispEdges"
      style={{ overflow: 'visible', transform: tilt ? `rotate(${tilt}deg)` : undefined, transformOrigin: '50% 80%', ...style }}
      aria-hidden
    >
      <ellipse cx={10} cy={10.2} rx={6.5} ry={0.45} fill="rgba(20,20,60,0.12)" />
      {spout}
      {cells}
      {blush}
      {eye}
      {mouth}
      {mood === 'think' ? (
        <text x={17.2} y={-0.6} fontFamily="Heading" fontWeight={700} fontSize={3.2} fill={colors.body}>?</text>
      ) : mood === 'surprised' ? (
        <text x={17.2} y={-0.6} fontFamily="Heading" fontWeight={700} fontSize={3.2} fill={colors.body}>!</text>
      ) : null}
    </svg>
  );
}

export const whaleHeight = (width: number) => (width * ROWS) / COLS;
