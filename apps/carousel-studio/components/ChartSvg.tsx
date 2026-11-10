// Single-series chart for 1080x1350 slides, following the dataviz skill:
// one highlighted mark in the brand accent, the rest in a validated de-emphasis tint,
// thin recessive baseline/grid, text in ink tokens (never the series colour),
// and a value label on every bar (the tint is < 3:1 vs the surface, so labels are required).
// Mark specs are scaled ~2.5x because the slide is viewed at ~40% on phones.
import type { Config } from '@/lib/schema';

export type ChartData = {
  chartKind: 'bar' | 'line';
  data: { label: string; value: number }[];
  highlight: number;
  valuePrefix: string;
  valueSuffix: string;
};

export const CHART_W = 936;
export const CHART_H = 560;
const DEEMPH = '#8197F5'; // validated: ΔE 18.4 vs #2F5BFF, lightness band OK; contrast 2.47:1 → labels on every mark

// Non-integers show 2 decimals (money reads "$0.50", not "$0.5").
const fmt = (v: number, pre: string, suf: string) =>
  `${pre}${new Intl.NumberFormat('en-US', Number.isInteger(v) ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}${suf}`;

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

/** x position (in chart coordinates) of each data point's centre. Used to aim the mascot's eyes. */
export function pointX(chart: ChartData, i: number) {
  const n = Math.max(chart.data.length, 1);
  if (chart.chartKind === 'bar') return (CHART_W / n) * (i + 0.5);
  const padL = 90;
  const padR = 40;
  return n === 1 ? padL : padL + ((CHART_W - padL - padR) * i) / (n - 1);
}

export function ChartSvg({ chart, config }: { chart: ChartData; config: Config }) {
  const c = config.colors;
  const ink = c.ink;
  const muted = c.muted;
  const grid = '#DAD7EA';
  const n = chart.data.length;
  if (!n) return null;
  const maxV = Math.max(...chart.data.map((d) => d.value), 0);
  const hi = chart.highlight;

  if (chart.chartKind === 'bar') {
    const padT = 70;
    const padB = 80;
    const plotH = CHART_H - padT - padB;
    const band = CHART_W / n;
    const bw = Math.min(band * 0.5, 72);
    const r = 10;
    return (
      <svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img">
        <line x1={0} x2={CHART_W} y1={CHART_H - padB} y2={CHART_H - padB} stroke={grid} strokeWidth={3} />
        {chart.data.map((d, i) => {
          const h = maxV ? Math.max((d.value / maxV) * plotH, d.value > 0 ? 6 : 0) : 0;
          const x = band * (i + 0.5) - bw / 2;
          const y = CHART_H - padB - h;
          const rr = Math.min(r, h / 2, bw / 2);
          // rounded data-end, square at the baseline
          const path = h > 0 ? `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + bw - rr} Q${x + bw},${y} ${x + bw},${y + rr} V${y + h} Z` : '';
          const isHi = i === hi;
          return (
            <g key={i}>
              {path ? <path d={path} fill={isHi ? c.accent1 : DEEMPH} /> : null}
              <text x={band * (i + 0.5)} y={y - 18} textAnchor="middle" fontFamily="Heading" fontWeight={isHi ? 700 : 600} fontSize={isHi ? 42 : 34} fill={isHi ? ink : muted}>
                {fmt(d.value, chart.valuePrefix, chart.valueSuffix)}
              </text>
              <text x={band * (i + 0.5)} y={CHART_H - padB + 46} textAnchor="middle" fontFamily="Body" fontWeight={isHi ? 600 : 400} fontSize={30} fill={isHi ? ink : muted}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // line
  const padL = 90;
  const padR = 40;
  const padT = 60;
  const padB = 80;
  const top = niceMax(maxV);
  const ticks = [0, top / 2, top];
  const yOf = (v: number) => padT + (CHART_H - padT - padB) * (1 - v / top);
  const pts = chart.data.map((d, i) => [pointX(chart, i), yOf(d.value)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${yOf(0)} L${pts[0][0]},${yOf(0)} Z`;
  const labelIdx = new Set([hi, n - 1]);
  return (
    <svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={CHART_W - padR} y1={yOf(t)} y2={yOf(t)} stroke={grid} strokeWidth={t === 0 ? 3 : 2} />
          <text x={padL - 16} y={yOf(t) + 10} textAnchor="end" fontFamily="Body" fontSize={26} fill={muted}>
            {fmt(t, chart.valuePrefix, '')}
          </text>
        </g>
      ))}
      <path d={area} fill={c.accent1} opacity={0.1} />
      <path d={line} fill="none" stroke={c.accent1} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === hi ? 16 : 11} fill={c.accent1} stroke={c.bg} strokeWidth={5} />
          {labelIdx.has(i) ? (
            <text x={x} y={y - 30} textAnchor="middle" fontFamily="Heading" fontWeight={i === hi ? 700 : 600} fontSize={i === hi ? 40 : 32} fill={i === hi ? ink : muted}>
              {fmt(chart.data[i].value, chart.valuePrefix, chart.valueSuffix)}
            </text>
          ) : null}
          <text x={x} y={CHART_H - padB + 46} textAnchor="middle" fontFamily="Body" fontSize={28} fill={i === hi ? ink : muted} fontWeight={i === hi ? 600 : 400}>
            {chart.data[i].label}
          </text>
        </g>
      ))}
    </svg>
  );
}
