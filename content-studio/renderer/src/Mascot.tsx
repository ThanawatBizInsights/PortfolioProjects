import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Mood } from './types';

// A simple, original "chart tile" mascot drawn in code (owned asset, no licence needed).
// Colours come from the brand theme so each brand can restyle or disable it.
export const Mascot: React.FC<{ mood: Mood; color: string; belly: string; bars: string; ink: string; size?: number }> = ({
  mood,
  color,
  belly,
  bars: barColor,
  ink,
  size = 230,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 9, stiffness: 160 } });
  const bob = Math.sin(frame / 9) * 6;
  const bounce = mood === 'happy' ? -Math.abs(Math.sin(frame / 5)) * 18 : 0;
  const tilt = mood === 'think' ? interpolate(pop, [0, 1], [0, -9]) : mood === 'surprised' ? Math.sin(frame / 2) * 2 : 0;
  const scale = mood === 'surprised' ? interpolate(pop, [0, 1], [0.85, 1.06]) : interpolate(pop, [0, 1], [0.9, 1]);

  // blink roughly every 2.5s
  const blinkPhase = frame % Math.round(fps * 2.5);
  const blink = blinkPhase < 4 && mood !== 'surprised' ? 0.15 : 1;

  const eyeR = mood === 'surprised' ? 17 : 13;
  const look = mood === 'think' ? { x: 4, y: -5 } : { x: 0, y: 0 };

  const mouth =
    mood === 'happy'
      ? 'M78 118 Q100 140 122 118'
      : mood === 'surprised'
        ? ''
        : mood === 'think'
          ? 'M84 124 Q96 120 112 126'
          : 'M82 120 Q100 132 118 120';

  const bars = [14, 30, 22].map((h, i) => {
    const grow = mood === 'happy' ? 1 + 0.2 * Math.abs(Math.sin(frame / 6 + i)) : 1;
    return { h: h * grow, x: 70 + i * 22 };
  });

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `translateY(${bob + bounce}px) rotate(${tilt}deg) scale(${scale})`,
        transformOrigin: '50% 90%',
      }}
    >
      <svg viewBox="0 0 200 220" width={size} height={size * 1.1}>
        <ellipse cx="100" cy="212" rx="58" ry="7" fill="rgba(0,0,0,0.25)" />
        <rect x="28" y="28" width="144" height="176" rx="40" fill={color} />
        {/* eyes */}
        {[72, 128].map((cx) => (
          <g key={cx}>
            <ellipse cx={cx} cy="82" rx={eyeR + 5} ry={(eyeR + 5) * blink} fill="#fff" />
            <circle cx={cx + look.x} cy={82 + look.y} r={eyeR * 0.55 * Math.max(blink, 0.3)} fill={ink} />
          </g>
        ))}
        {/* mouth */}
        {mouth ? (
          <path d={mouth} stroke={ink} strokeWidth="6" fill="none" strokeLinecap="round" />
        ) : (
          <ellipse cx="100" cy="124" rx="10" ry="12" fill={ink} />
        )}
        {/* bar-chart belly */}
        <rect x="58" y="150" width="84" height="42" rx="10" fill={belly} />
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={186 - Math.min(b.h, 32)} width="14" height={Math.min(b.h, 32)} rx="3" fill={barColor} />
        ))}
      </svg>
      {mood === 'think' || mood === 'surprised' ? (
        <div
          style={{
            position: 'absolute',
            right: -18,
            top: -26,
            fontFamily: 'Heading',
            fontWeight: 700,
            fontSize: 74,
            color,
            opacity: interpolate(pop, [0, 1], [0, 1]),
            transform: `scale(${pop})`,
          }}
        >
          {mood === 'think' ? '?' : '!'}
        </div>
      ) : null}
    </div>
  );
};
