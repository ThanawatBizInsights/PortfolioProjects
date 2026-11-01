import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { LineChart } from './LineChart';
import { Mascot } from './Mascot';
import { Props, Scene, Theme } from './types';

// ---------- fonts (loaded from public/fonts, registered as "Heading" / "Body") ----------
const useFonts = (theme: Theme) => {
  const [handle] = useState(() => delayRender('Loading Thai fonts'));
  useEffect(() => {
    const faces: FontFace[] = [];
    (['heading', 'body'] as const).forEach((role) => {
      const alias = role === 'heading' ? 'Heading' : 'Body';
      theme.fonts[role].files.forEach((f) => {
        faces.push(new FontFace(alias, `url(${staticFile('fonts/' + f.file)})`, { weight: String(f.weight) }));
      });
    });
    Promise.all(faces.map((f) => f.load().then((ff) => document.fonts.add(ff))))
      .then(() => continueRender(handle))
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle, theme]);
};

// ---------- small animation helpers ----------
const useEnter = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 140 } });
};

const Reveal: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const p = useEnter(delay);
  return (
    <div style={{ opacity: p, transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px)`, ...style }}>{children}</div>
  );
};

// Text with one highlighted phrase; the marker sweeps in behind it.
const Highlighted: React.FC<{ text: string; highlight?: string; color: string; delay: number }> = ({ text, highlight, color, delay }) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [delay, delay + 12], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  if (!highlight || !text.includes(highlight)) return <>{text}</>;
  const [a, b] = text.split(highlight);
  return (
    <>
      {a}
      <span
        style={{
          backgroundImage: `linear-gradient(${color}, ${color})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${sweep}% 42%`,
          backgroundPosition: '0 88%',
          padding: '0 6px',
        }}
      >
        {highlight}
      </span>
      {b}
    </>
  );
};

const lines = (s: string) => s.split('\n');

// ---------- scenes ----------
const SceneView: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  const c = theme.colors;
  const H1: React.CSSProperties = { fontFamily: 'Heading', fontWeight: 700, fontSize: 96, lineHeight: 1.35, color: c.text };
  const H2: React.CSSProperties = { fontFamily: 'Heading', fontWeight: 600, fontSize: 64, lineHeight: 1.4, color: c.text };
  const Kicker: React.CSSProperties = { fontFamily: 'Heading', fontWeight: 600, fontSize: 50, lineHeight: 1.4, color: c.accent };
  const Body: React.CSSProperties = { fontFamily: 'Body', fontWeight: 600, fontSize: 52, lineHeight: 1.5, color: c.muted };
  const frame = useCurrentFrame();

  switch (scene.type) {
    case 'hook':
      return (
        <>
          <Reveal>
            <div style={Kicker}>{scene.kicker}</div>
          </Reveal>
          {scene.chart ? (
            <Reveal delay={2} style={{ margin: '24px 0 10px' }}>
              <LineChart chart={scene.chart} theme={theme} startFrame={4} drawFrames={30} />
            </Reveal>
          ) : null}
          {lines(scene.headline).map((l, i) => (
            <Reveal key={i} delay={26 + i * 6}>
              <div style={H1}>
                <Highlighted text={l} highlight={scene.highlight} color={c.accent + '88'} delay={40} />
              </div>
            </Reveal>
          ))}
        </>
      );

    case 'chart':
      return (
        <>
          <Reveal>
            <div style={H2}>{scene.heading}</div>
          </Reveal>
          <Reveal delay={4} style={{ margin: '28px 0 18px' }}>
            <LineChart chart={scene.chart} theme={theme} startFrame={10} drawFrames={40} />
          </Reveal>
          {(scene.lines ?? []).map((l, i) => (
            <Reveal key={i} delay={30 + i * 18}>
              <div style={{ ...H2, fontSize: 60 }}>{l}</div>
            </Reveal>
          ))}
        </>
      );

    case 'cause': {
      const strike = interpolate(frame, [36, 48], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const node = useEnter(56);
      const arrows = interpolate(frame, [66, 82], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const effectsIn = useEnter(76);
      const pill = (text: string, bg: string, fg: string, size = 54): React.ReactNode => (
        <div style={{ background: bg, color: fg, fontFamily: 'Heading', fontWeight: 700, fontSize: size, padding: '18px 34px', borderRadius: 999, whiteSpace: 'nowrap' }}>
          {text}
        </div>
      );
      return (
        <>
          <Reveal>
            <div style={{ ...H1, fontSize: 88, position: 'relative', display: 'inline-block' }}>
              {scene.question}
              <div style={{ position: 'absolute', left: -8, top: '54%', height: 10, width: `${strike}%`, background: c.warn, borderRadius: 6 }} />
            </div>
          </Reveal>
          <Reveal delay={50}>
            <div style={{ ...Kicker, marginTop: 40 }}>{scene.answerLead}</div>
          </Reveal>
          <div style={{ position: 'relative', height: 460, marginTop: 20 }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, transform: `translateX(-50%) scale(${node})`, opacity: node }}>
              {pill(scene.cause, c.accent, c.bg, 72)}
            </div>
            <svg width="900" height="460" style={{ position: 'absolute', left: 0, top: 0 }}>
              {[220, 680].map((x, i) => (
                <g key={i} opacity={arrows}>
                  <line x1={450} y1={120} x2={450 + (x - 450) * arrows} y2={120 + 170 * arrows} stroke={c.accent} strokeWidth={9} strokeLinecap="round" />
                </g>
              ))}
            </svg>
            <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', opacity: effectsIn, transform: `translateY(${interpolate(effectsIn, [0, 1], [30, 0])}px)` }}>
              {pill(scene.effects[0], c.surface, c.text, 50)}
              {pill(scene.effects[1], c.surface, c.text, 50)}
            </div>
          </div>
        </>
      );
    }

    case 'define':
      return (
        <>
          {scene.items.map((it, i) => (
            <Reveal key={i} delay={i * 48} style={{ marginBottom: 44 }}>
              <div style={{ background: c.surface, borderRadius: 36, padding: '40px 46px', borderLeft: `14px solid ${i === 0 ? c.accent2 : c.accent}` }}>
                <div style={{ fontFamily: 'Heading', fontWeight: 700, fontSize: 80, color: i === 0 ? c.accent2 : c.accent }}>{it.term}</div>
                <div style={{ ...H2, fontSize: 58, marginTop: 6 }}>{it.meaning}</div>
              </div>
            </Reveal>
          ))}
        </>
      );

    case 'list':
      return (
        <>
          {lines(scene.heading).map((l, i) => (
            <Reveal key={i} delay={i * 5}>
              <div style={H2}>{l}</div>
            </Reveal>
          ))}
          <div style={{ marginTop: 34 }}>
            {scene.items.map((it, i) => (
              <Reveal key={i} delay={18 + i * 16} style={{ marginBottom: 24 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 26, background: c.surface, borderRadius: 28, padding: '20px 38px' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 99, background: c.accent }} />
                  <div style={{ ...H2, fontSize: 62, fontWeight: 700 }}>{it}</div>
                </div>
              </Reveal>
            ))}
          </div>
          {scene.footer ? (
            <Reveal delay={18 + scene.items.length * 16 + 10}>
              <div style={{ ...Body, marginTop: 26, color: c.text }}>{lines(scene.footer).map((l, i) => <div key={i}>{l}</div>)}</div>
            </Reveal>
          ) : null}
        </>
      );

    case 'question':
      return (
        <>
          <Reveal>
            <div style={Kicker}>{scene.kicker}</div>
          </Reveal>
          <div style={{ marginTop: 26 }}>
            {lines(scene.question).map((l, i) => (
              <Reveal key={i} delay={8 + i * 7}>
                <div style={H1}>
                  <Highlighted text={l} highlight={scene.highlight} color={c.accent + '88'} delay={30} />
                </div>
              </Reveal>
            ))}
          </div>
        </>
      );

    case 'cta': {
      const icon = useEnter(4);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 80 }}>
          <div style={{ transform: `scale(${icon}) rotate(${interpolate(icon, [0, 1], [-20, 0])}deg)` }}>
            <svg width="190" height="230" viewBox="0 0 38 46">
              <path d="M4 3 h30 a2 2 0 0 1 2 2 v38 l-17 -10 l-17 10 v-38 a2 2 0 0 1 2 -2z" fill={c.accent} />
            </svg>
          </div>
          {lines(scene.action).map((l, i) => (
            <Reveal key={i} delay={12 + i * 6}>
              <div style={{ ...H1, fontSize: 84, marginTop: i === 0 ? 40 : 0 }}>{l}</div>
            </Reveal>
          ))}
          {scene.sub ? (
            <Reveal delay={30}>
              <div style={{ ...Body, marginTop: 30 }}>{scene.sub}</div>
            </Reveal>
          ) : null}
        </div>
      );
    }
  }
};

// Fade each scene out over its last few frames for a clean cut.
const SceneShell: React.FC<{ scene: Scene; theme: Theme; frames: number; safe: Props['spec']['safeZone'] }> = ({ scene, theme, frames, safe }) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [frames - 7, frames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {/* content is centred inside the safe zone, nudged up to leave room for the mascot */}
      <div
        style={{
          position: 'absolute',
          top: safe.top + 20,
          bottom: safe.bottom + 140,
          left: safe.left + 30,
          right: safe.right + 30,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div>
          <SceneView scene={scene} theme={theme} />
        </div>
      </div>
      {theme.mascot?.enabled && scene.mascot ? (
        <div style={{ position: 'absolute', left: safe.left + 10, bottom: safe.bottom - 70 }}>
          <Mascot mood={scene.mascot} color={theme.mascot.color} belly={theme.mascot.belly} bars={theme.colors.accent} ink={theme.colors.bg} size={200} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const ShortVideo: React.FC<Props> = ({ spec, theme }) => {
  useFonts(theme);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const c = theme.colors;
  let cursor = 0;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 25%, ${c.bg2} 0%, ${c.bg} 70%)` }}>
      {/* subtle drifting grid for a "data" feel */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${c.muted}14 2px, transparent 2px), linear-gradient(90deg, ${c.muted}14 2px, transparent 2px)`,
          backgroundSize: '90px 90px',
          backgroundPosition: `0 ${-(frame * 0.6) % 90}px`,
        }}
      />
      {spec.scenes.map((s) => {
        const frames = Math.round(s.durationSec * fps);
        const from = cursor;
        cursor += frames;
        return (
          <Sequence key={s.id} from={from} durationInFrames={frames} name={s.id}>
            <SceneShell scene={s} theme={theme} frames={frames} safe={spec.safeZone} />
          </Sequence>
        );
      })}
      {/* progress bar + brand tag (non-essential, may sit under platform UI) */}
      <div style={{ position: 'absolute', top: 0, left: 0, height: 10, width: `${(frame / durationInFrames) * 100}%`, background: c.accent }} />
      <div style={{ position: 'absolute', top: spec.safeZone.top - 70, left: spec.safeZone.left + 30, fontFamily: 'Heading', fontWeight: 600, fontSize: 34, color: c.muted, letterSpacing: 1 }}>
        {theme.brandName}
      </div>
      {spec.showSafeZone ? (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: spec.safeZone.top, background: 'rgba(255,0,0,0.25)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: spec.safeZone.bottom, background: 'rgba(255,0,0,0.25)' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: spec.safeZone.left, background: 'rgba(255,0,0,0.25)' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: spec.safeZone.right, background: 'rgba(255,0,0,0.25)' }} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
