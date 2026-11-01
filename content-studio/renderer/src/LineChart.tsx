import React from 'react';
import { interpolate, useCurrentFrame, Easing } from 'remotion';
import { ChartDef, Theme } from './types';

// Two-or-more series line chart that draws itself in. Values are normalised per chart.
export const LineChart: React.FC<{ chart: ChartDef; theme: Theme; startFrame?: number; drawFrames?: number }> = ({
  chart,
  theme,
  startFrame = 6,
  drawFrames = 36,
}) => {
  const frame = useCurrentFrame();
  const W = 900;
  const H = 400;
  const pad = { l: 20, r: 230, t: 30, b: 50 };
  const all = chart.series.flatMap((s) => s.values);
  const max = Math.max(...all) * 1.08;
  const min = Math.min(0, ...all);
  const progress = interpolate(frame, [startFrame, startFrame + drawFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const palette = [theme.colors.accent, theme.colors.accent2, theme.colors.good];
  const yOf = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - (v - min) / (max - min));
  // End labels: keep at least 56px apart so lines that rise together stay readable.
  const order = chart.series
    .map((s, i) => ({ i, y: yOf(s.values[s.values.length - 1]) }))
    .sort((a, b) => a.y - b.y);
  const labelY: number[] = [];
  order.forEach((o, k) => {
    const prev = k > 0 ? labelY[order[k - 1].i] : -Infinity;
    labelY[o.i] = Math.max(o.y, prev + 56);
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* baseline + light grid */}
      {[0.33, 0.66].map((g) => (
        <line key={g} x1={pad.l} x2={W - pad.r} y1={pad.t + (H - pad.t - pad.b) * g} y2={pad.t + (H - pad.t - pad.b) * g} stroke={theme.colors.muted} strokeOpacity={0.18} strokeWidth={2} />
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke={theme.colors.muted} strokeOpacity={0.6} strokeWidth={3} />
      {chart.series.map((s, si) => {
        const color = s.color ?? palette[si % palette.length];
        const pts = s.values.map((v, i) => {
          const x = pad.l + ((W - pad.l - pad.r) * i) / (s.values.length - 1);
          const y = yOf(v);
          return [x, y] as const;
        });
        const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
        const last = pts[pts.length - 1];
        const len = 2000;
        return (
          <g key={s.label}>
            <path d={d} fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - progress)} />
            <circle cx={last[0]} cy={last[1]} r={15 * progress} fill={color} />
            <text
              x={last[0] + 26}
              y={labelY[si] + 14}
              fill={color}
              fontFamily="Heading"
              fontWeight={700}
              fontSize={42}
              opacity={interpolate(progress, [0.7, 1], [0, 1], { extrapolateLeft: 'clamp' })}
            >
              {s.label}
            </text>
          </g>
        );
      })}
      {chart.note ? (
        <text x={pad.l} y={H - 8} fill={theme.colors.muted} fontFamily="Body" fontSize={34}>
          {chart.note}
        </text>
      ) : null}
    </svg>
  );
};
