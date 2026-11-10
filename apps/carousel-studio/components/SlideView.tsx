// One 1080×1350 slide in the Balena Studio design system.
// Channel identity (logo, royal blue / sky / violet, navy text, light backgrounds) stays constant;
// the topic provider (Claude, ChatGPT, …) supplies the accent colours and the mascot.
// Pure component (no hooks) so it renders identically in the editor and the exporter.
import type { CSSProperties, ReactNode } from 'react';
import { findProvider, slideProvider, type Config, type Post, type Provider, type Registry, type Slide } from '@/lib/schema';
import { ChartSvg } from './ChartSvg';
import { Icon } from './Icon';

export const W = 1080;
export const H = 1350;
const L = 72; // side margin

type Props = { slide: Slide; index: number; post: Post; config: Config; registry: Registry; editing?: boolean };

const FALLBACK: Provider = {
  id: 'general', name: 'AI', maker: '', accent: '#2F5BFF', accentText: '#2F5BFF', accentSoft: '#EEF1FF', accentSoft2: '#DFE5FF',
  mascot: null, logos: [], rules: [], disclaimer: '',
};

/** "**phrase**" → topic-colour highlight, "\n" → line break. */
function Rich({ text, color }: { text: string; color: string }) {
  return (
    <>
      {text.split('\n').map((line, li) => (
        <span key={li} style={{ display: 'block' }}>
          {line.split('**').map((part, pi) => (pi % 2 ? <span key={pi} style={{ color }}>{part}</span> : <span key={pi}>{part}</span>))}
        </span>
      ))}
    </>
  );
}

function thaiDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00+07:00` : iso);
  return isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(d);
}
const domain = (u: string) => {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; }
};

export const assetUrl = (brand: string, file: string) => `/api/brand-asset/${brand}/${file.split('/').map(encodeURIComponent).join('/')}`;

/** The approved mascot pose for a provider, or a clearly labelled text treatment when none is assigned. */
export function MascotArt({ brand, provider, pose, height, editing }: { brand: string; provider: Provider; pose: string; height: number; editing?: boolean }) {
  const p = provider.mascot?.poses.find((x) => x.id === pose) ?? provider.mascot?.poses.find((x) => x.id === 'default');
  if (provider.mascot && p) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={assetUrl(brand, p.file)} alt="" style={{ height, width: 'auto', display: 'block', imageRendering: 'pixelated' }} />;
  }
  return (
    <div style={{ height, display: 'grid', placeItems: 'center' }}>
      <div style={{ border: `4px dashed ${provider.accent}`, borderRadius: 28, padding: '14px 26px', background: provider.accentSoft, fontFamily: 'Heading', fontWeight: 700, fontSize: Math.round(height / 4.2), color: provider.accentText, textAlign: 'center', lineHeight: 1.2 }}>
        {provider.name}
        {editing ? <div style={{ fontFamily: 'Body', fontWeight: 600, fontSize: 18, color: '#B42318' }}>no mascot assigned</div> : null}
      </div>
    </div>
  );
}

export function SlideView({ slide, index, post, config, registry, editing }: Props) {
  const c = config.colors;
  const prov = findProvider(registry, slideProvider(post, slide)) ?? findProvider(registry, 'general') ?? FALLBACK;
  const A = prov.accent;
  const AT = prov.accentText;
  const total = post.slides.length;
  const isLast = index === total - 1;
  const imgUrl = slide.image ? `/api/files/${post.brand}/${post.id}/images/${encodeURIComponent(slide.image)}` : '';

  const h = (size: number): CSSProperties => ({ fontFamily: 'Heading', fontWeight: 700, fontSize: size, lineHeight: 1.22, color: c.ink, margin: 0 });
  const body = (size = 40): CSSProperties => ({ fontFamily: 'Body', fontWeight: 400, fontSize: size, lineHeight: 1.55, color: c.muted, margin: 0 });
  const card: CSSProperties = { background: c.card, border: `2px solid ${c.line}`, borderRadius: 32 };
  const Title = ({ text, size = 72 }: { text: string; size?: number }) => (
    <h2 style={{ ...h(size), marginBottom: 30 }}>
      <Rich text={text} color={A} />
    </h2>
  );
  const iconBubble = (name: string, size = 76, tint = c.accent1, bg = '#EEF1FF') => (
    <div style={{ width: size, height: size, flex: 'none', borderRadius: size * 0.32, background: bg, display: 'grid', placeItems: 'center' }}>
      <Icon name={name} size={size * 0.55} color={tint} />
    </div>
  );

  const illustration = (height: number, style: CSSProperties = {}): ReactNode => (
    <div style={{ ...card, height, overflow: 'hidden', position: 'relative', background: prov.accentSoft, ...style }}>
      {imgUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : editing ? (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'Body', fontSize: 30, color: c.muted }}>ภาพประกอบ · upload in the editor</div>
      ) : null}
    </div>
  );

  const chatMock = (user: string, reply: string) => {
    const mascotPose = prov.mascot?.poses.find((p) => p.id === 'default');
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '26px 34px', gap: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {['#F0B4A0', '#F4D58D', '#A8DDB5'].map((col) => <span key={col} style={{ width: 16, height: 16, borderRadius: 99, background: col }} />)}
          <span style={{ marginLeft: 10, fontFamily: 'Body', fontSize: 24, color: c.muted }}>แชทกับ {prov.name} · ตัวอย่างประกอบ</span>
        </div>
        <div style={{ alignSelf: 'flex-end', maxWidth: '78%', background: c.accent1, color: '#fff', borderRadius: '30px 30px 8px 30px', padding: '20px 28px', fontFamily: 'Body', fontSize: 32, lineHeight: 1.45 }}>
          {user || 'ข้อความของเรา'}
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', maxWidth: '86%' }}>
          {mascotPose ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl(post.brand, mascotPose.file)} alt="" style={{ height: 46, marginTop: 10, imageRendering: 'pixelated' }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 18, background: A, flex: 'none' }} />
          )}
          <div style={{ background: '#fff', border: `2px solid ${prov.accentSoft2}`, borderRadius: '30px 30px 30px 8px', padding: '20px 28px', fontFamily: 'Body', fontSize: 30, lineHeight: 1.5, color: c.ink }}>
            {reply || <span style={{ color: c.muted }}>คำตอบจาก {prov.name}…</span>}
          </div>
        </div>
      </div>
    );
  };

  let content: ReactNode = null;
  let overlay: ReactNode = null;
  let reserve = 130; // free space at the bottom (footer, overlays, mascot)
  let justify: CSSProperties['justifyContent'] = 'center';

  switch (slide.type) {
    case 'cover': {
      justify = 'flex-start';
      const visualH = 470;
      content = (
        <>
          {slide.kicker ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '12px 26px', borderRadius: 999, background: prov.accentSoft, border: `2px solid ${prov.accentSoft2}`, marginBottom: 30 }}>
              <span style={{ width: 18, height: 18, background: A }} />
              <span style={{ fontFamily: 'Heading', fontWeight: 600, fontSize: 30, color: AT }}>{slide.kicker}</span>
            </div>
          ) : null}
          <h1 style={h(94)}>
            <Rich text={slide.title} color={A} />
          </h1>
          {slide.subtitle ? <p style={{ ...body(38), marginTop: 22 }}>{slide.subtitle}</p> : null}
        </>
      );
      if (slide.visual !== 'none') {
        overlay = (
          <div style={{ position: 'absolute', left: L, right: L, bottom: 130, height: visualH }}>
            {slide.visual === 'image' || slide.image ? illustration(visualH) : <div style={{ ...card, height: visualH, position: 'relative', background: '#FBFBFE' }}>{chatMock(slide.chat.user, slide.chat.reply)}</div>}
          </div>
        );
        reserve = 130 + visualH + 30;
      }
      break;
    }

    case 'concept': {
      const n = slide.points.length;
      const cols = n === 4 ? 2 : Math.min(Math.max(n, 1), 3);
      content = (
        <>
          <Title text={slide.title} />
          {slide.definition ? (
            <div style={{ background: prov.accentSoft, borderRadius: 32, padding: '34px 40px', borderLeft: `14px solid ${A}`, marginBottom: 30 }}>
              <div style={{ fontFamily: 'Heading', fontWeight: 600, fontSize: 28, color: AT, marginBottom: 8 }}>สรุปสั้น ๆ</div>
              <p style={{ ...body(40), color: c.ink }}><Rich text={slide.definition} color={AT} /></p>
            </div>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 22 }}>
            {slide.points.map((p, i) => (
              <div key={i} style={{ ...card, padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {iconBubble(p.icon)}
                <div style={{ fontFamily: 'Heading', fontWeight: 700, fontSize: 34, color: c.ink }}>{p.label}</div>
                <div style={{ ...body(28) }}>{p.text}</div>
              </div>
            ))}
          </div>
        </>
      );
      break;
    }

    case 'flow':
      content = (
        <>
          <Title text={slide.title} />
          {slide.intro ? <p style={{ ...body(34), marginTop: -12, marginBottom: 26 }}><Rich text={slide.intro} color={AT} /></p> : null}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {slide.steps.map((s, i) => (
              <div key={i}>
                <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 26, padding: '24px 30px' }}>
                  <div style={{ width: 78, height: 78, flex: 'none', borderRadius: 99, background: c.accent1, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'Heading', fontWeight: 700, fontSize: 40 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Heading', fontWeight: 700, fontSize: 38, color: c.ink }}>{s.label}</div>
                    <div style={{ ...body(29) }}>{s.text}</div>
                  </div>
                  {iconBubble(s.icon, 72, A, prov.accentSoft)}
                </div>
                {i < slide.steps.length - 1 ? (
                  <div style={{ height: 40, display: 'flex', justifyContent: 'flex-start', paddingLeft: 58 }}>
                    <svg width="44" height="40" viewBox="0 0 44 40"><path d="M22 2v28 M12 22l10 12 10-12" stroke={c.accent1} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      );
      break;

    case 'example': {
      // underline each annotated quote inside the prompt and tag it with its number
      const parts: ReactNode[] = [];
      let rest = slide.prompt;
      slide.annotations.forEach((a, i) => {
        const at = a.quote ? rest.indexOf(a.quote) : -1;
        if (at < 0) return;
        parts.push(<span key={`t${i}`}>{rest.slice(0, at)}</span>);
        parts.push(
          <span key={`q${i}`} style={{ borderBottom: `6px solid ${A}`, paddingBottom: 2 }}>
            {a.quote}
            <sup style={{ display: 'inline-grid', placeItems: 'center', width: 34, height: 34, borderRadius: 99, background: A, color: '#fff', fontFamily: 'Heading', fontSize: 22, marginLeft: 4, marginRight: 8, verticalAlign: 'super' }}>{i + 1}</sup>
          </span>,
        );
        rest = rest.slice(at + a.quote.length);
      });
      parts.push(<span key="end">{rest}</span>);
      const mascotPose = prov.mascot?.poses.find((p) => p.id === 'default');
      content = (
        <>
          <Title text={slide.title} size={66} />
          <div style={{ fontFamily: 'Heading', fontWeight: 600, fontSize: 26, color: c.muted, marginBottom: 10 }}>ข้อความที่พิมพ์</div>
          <div style={{ background: c.accent1, color: '#fff', borderRadius: '32px 32px 10px 32px', padding: '26px 32px', fontFamily: 'Body', fontSize: 36, lineHeight: 1.75 }}>{parts}</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(slide.annotations.length || 1, 3)}, 1fr)`, gap: 16, margin: '22px 0' }}>
            {slide.annotations.map((a, i) => (
              <div key={i} style={{ ...card, padding: '20px 22px', borderColor: prov.accentSoft2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 36, height: 36, flex: 'none', borderRadius: 99, background: A, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'Heading', fontWeight: 700, fontSize: 22 }}>{i + 1}</span>
                  <span style={{ fontFamily: 'Heading', fontWeight: 700, fontSize: 30, color: AT }}>{a.label}</span>
                </div>
                <div style={{ ...body(26), marginTop: 6 }}>{a.text}</div>
              </div>
            ))}
          </div>
          {slide.reply.length ? (
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              {mascotPose ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(post.brand, mascotPose.file)} alt="" style={{ height: 50, marginTop: 14, imageRendering: 'pixelated' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 18, background: A, flex: 'none' }} />
              )}
              <div style={{ flex: 1, background: prov.accentSoft, borderRadius: '32px 32px 32px 10px', padding: '22px 30px' }}>
                {slide.replyNote ? <div style={{ fontFamily: 'Heading', fontWeight: 600, fontSize: 24, color: AT, marginBottom: 6 }}>{slide.replyNote}</div> : null}
                {slide.reply.map((r, i) => <div key={i} style={{ ...body(30), color: c.ink }}>• {r}</div>)}
              </div>
            </div>
          ) : null}
        </>
      );
      break;
    }

    case 'howto':
      content = (
        <>
          <Title text={slide.title} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {slide.items.map((it, i) => (
              <div key={i} style={{ ...card, display: 'flex', alignItems: 'center', gap: 28, padding: '26px 30px' }}>
                {/* a small mock of the UI control the step refers to */}
                <div style={{ width: 250, flex: 'none', background: '#F6F7FC', border: `2px solid ${c.line}`, borderRadius: 24, padding: '22px 16px', display: 'grid', placeItems: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', border: `2px solid ${prov.accentSoft2}`, borderRadius: 999, padding: '12px 20px', boxShadow: '0 6px 14px rgba(22,27,61,0.08)' }}>
                    <Icon name={it.icon} size={30} color={AT} />
                    <span style={{ fontFamily: 'Heading', fontWeight: 600, fontSize: 26, color: c.ink, whiteSpace: 'nowrap' }}>{it.ui || it.label}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Heading', fontWeight: 700, fontSize: 36, color: c.ink }}>{it.label}</div>
                  <div style={{ ...body(29) }}>{it.text}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      );
      break;

    case 'compare': {
      const avoid = slide.style === 'avoid-better';
      const ncol = Math.max(slide.columns.length, 2);
      const hasLabels = slide.rows.some((r) => r.label);
      const tmpl = `${hasLabels ? '200px ' : ''}repeat(${ncol}, 1fr)`;
      content = (
        <>
          <Title text={slide.title} />
          <div style={{ display: 'grid', gridTemplateColumns: tmpl, gap: 14 }}>
            {hasLabels ? <div /> : null}
            {slide.columns.map((col, i) => {
              const good = avoid && i === 1;
              const bad = avoid && i === 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderRadius: 24, background: good ? '#E6ECFF' : bad ? '#F0F1F5' : c.ink, color: good ? c.accent1 : bad ? c.muted : '#fff' }}>
                  {avoid ? <Icon name={good ? 'check' : 'cross'} size={34} color={good ? c.accent1 : c.muted} stroke={3} /> : null}
                  <span style={{ fontFamily: 'Heading', fontWeight: 700, fontSize: 32 }}>{col}</span>
                </div>
              );
            })}
            {slide.rows.map((r, ri) => (
              <div key={ri} style={{ display: 'contents' }}>
                {hasLabels ? <div style={{ fontFamily: 'Heading', fontWeight: 700, fontSize: 30, color: c.ink, alignSelf: 'center' }}>{r.label}</div> : null}
                {Array.from({ length: ncol }).map((_, ci) => {
                  const good = avoid && ci === 1;
                  return (
                    <div key={ci} style={{ ...card, padding: '24px 24px', background: avoid && !good ? '#FAFAFC' : '#FFFFFF', borderColor: good ? '#C9D4FF' : c.line, fontFamily: 'Body', fontSize: 30, lineHeight: 1.5, color: avoid && ci === 0 ? c.muted : c.ink }}>
                      <Rich text={r.cells[ci] ?? ''} color={AT} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      );
      break;
    }

    case 'recap':
      content = (
        <>
          <Title text={slide.title} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {slide.items.map((it, i) => (
              <div key={i} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: 16, padding: '22px 22px' }}>
                <span style={{ width: 46, height: 46, flex: 'none', borderRadius: 99, background: '#E6ECFF', display: 'grid', placeItems: 'center' }}>
                  <Icon name="check" size={28} color={c.accent1} stroke={3} />
                </span>
                <span style={{ ...body(30), color: c.ink, lineHeight: 1.45 }}><Rich text={it} color={AT} /></span>
              </div>
            ))}
          </div>
        </>
      );
      break;

    case 'chart':
      content = (
        <>
          <Title text={slide.title} size={64} />
          {slide.subtitle ? <p style={{ ...body(32), marginTop: -16 }}>{slide.subtitle}</p> : null}
          <div style={{ marginTop: 30 }}><ChartSvg chart={slide} config={config} /></div>
          {slide.note ? <p style={{ ...body(28), marginTop: 6 }}>{slide.note}</p> : null}
        </>
      );
      break;

    case 'statement':
      content = (
        <>
          <Title text={slide.title} size={76} />
          {slide.body ? <p style={body(42)}><Rich text={slide.body} color={AT} /></p> : null}
          {slide.imagePrompt || slide.image ? <div style={{ marginTop: 36 }}>{illustration(440)}</div> : null}
        </>
      );
      break;

    case 'step':
      content = (
        <>
          <div style={{ width: 110, height: 110, borderRadius: 36, background: c.accent1, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'Heading', fontWeight: 700, fontSize: 56, marginBottom: 36 }}>{slide.number ?? index}</div>
          <Title text={slide.title} />
          {slide.body ? <p style={body(42)}><Rich text={slide.body} color={AT} /></p> : null}
          {slide.imagePrompt || slide.image ? <div style={{ marginTop: 36 }}>{illustration(420)}</div> : null}
        </>
      );
      break;

    case 'prompt':
      content = (
        <>
          <Title text={slide.title} size={64} />
          <div style={{ background: c.dark, borderRadius: 40, padding: '40px 46px' }}>
            <div style={{ fontFamily: 'Heading', fontWeight: 600, fontSize: 26, color: '#AFC0FF', marginBottom: 18 }}>คัดลอกไปใช้ได้เลย</div>
            <p style={{ fontFamily: 'Body', fontSize: 34, lineHeight: 1.6, color: '#F4F5FF', margin: 0, whiteSpace: 'pre-wrap' }}>{slide.prompt}</p>
          </div>
          {slide.note ? <p style={{ ...body(34), marginTop: 26 }}>{slide.note}</p> : null}
        </>
      );
      break;

    case 'summary':
      content = (
        <>
          <Title text={slide.title} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {slide.bullets.map((b, i) => (
              <div key={i} style={{ ...card, display: 'flex', gap: 18, alignItems: 'center', padding: '20px 26px' }}>
                <Icon name="check" size={34} color={c.accent1} stroke={3} />
                <span style={{ ...body(38), color: c.ink }}><Rich text={b} color={AT} /></span>
              </div>
            ))}
          </div>
        </>
      );
      break;
  }

  // ---- CTA (recap / summary) ----
  const cta = slide.type === 'recap' || slide.type === 'summary' ? slide.cta : '';

  // ---- mascot (composited approved asset) ----
  let mascotNode: ReactNode = null;
  const mascotH = 150;
  if (slide.mascot) {
    const mp = findProvider(registry, slide.mascot.provider || prov.id) ?? prov;
    const say = slide.mascot.say;
    const pose = mp.mascot?.poses.find((x) => x.id === slide.mascot!.pose) ?? mp.mascot?.poses[0];
    const mascotW = mp.mascot ? mascotH * (pose?.aspect ?? 1.486) : 240;
    if (slide.mascot.placement === 'corner' && slide.type === 'cover') {
      mascotNode = (
        <div style={{ position: 'absolute', right: L + 34, bottom: 130 + 28 }}>
          <MascotArt brand={post.brand} provider={mp} pose={slide.mascot.pose} height={mascotH} editing={editing} />
        </div>
      );
    } else {
      const bottom = cta ? 140 : 112;
      const bubbleBottom = cta ? bottom + mascotH + 14 : bottom + 30;
      mascotNode = (
        <>
          {say ? (
            <div style={{ position: 'absolute', right: cta ? L : L + mascotW + 18, bottom: bubbleBottom, maxWidth: 560, background: '#fff', border: `3px solid ${mp.accentSoft2}`, borderRadius: 28, padding: '16px 26px', fontFamily: 'Body', fontWeight: 600, fontSize: 30, lineHeight: 1.4, color: c.ink }}>
              {say}
            </div>
          ) : null}
          <div style={{ position: 'absolute', right: L, bottom, display: 'flex', justifyContent: 'flex-end' }}>
            <MascotArt brand={post.brand} provider={mp} pose={slide.mascot.pose} height={mascotH} editing={editing} />
          </div>
        </>
      );
      reserve = Math.max(reserve, cta ? 140 + mascotH + (say ? 90 : 20) : 112 + mascotH + 26);
    }
  }
  const ctaNode = cta ? (
    <div style={{ position: 'absolute', left: L, right: slide.mascot ? L + 300 : L, bottom: 140, textAlign: 'center', padding: '28px 30px', borderRadius: 999, background: c.accent1, color: '#fff', fontFamily: 'Heading', fontWeight: 700, fontSize: [...cta].length > 20 ? 34 : 40, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {cta}
    </div>
  ) : null;
  if (cta) reserve = Math.max(reserve, 140 + 116 + 30);

  const sources = [...new Set(post.sources.map((s) => domain(s.url)).filter(Boolean))].slice(0, 3).join(', ');
  const logoH = 60;

  return (
    <div
      data-slide
      style={{
        position: 'relative', width: W, height: H, overflow: 'hidden', fontFamily: 'Body', color: c.ink,
        background: `radial-gradient(42% 30% at 100% 0%, ${c.sky}22, transparent 70%), radial-gradient(40% 30% at 0% 100%, ${c.accent2}1F, transparent 70%), linear-gradient(180deg, ${c.bg} 0%, ${c.bg2} 100%)`,
      }}
    >
      {/* header: real logo + topic chip + slide number */}
      <div style={{ position: 'absolute', top: 50, left: L, right: L, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {config.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetUrl(post.brand, config.logo.file)} alt={config.displayName} style={{ height: logoH, width: (logoH * config.logo.width) / config.logo.height }} />
        ) : (
          <span style={{ fontFamily: 'Heading', fontWeight: 700, fontSize: 34, color: c.accent1 }}>{config.displayName}</span>
        )}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {prov.id !== 'general' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'Heading', fontWeight: 600, fontSize: 24, color: AT, background: prov.accentSoft, border: `2px solid ${prov.accentSoft2}`, borderRadius: 999, padding: '6px 18px' }}>
              <span style={{ width: 14, height: 14, background: A }} />
              {prov.name}
            </span>
          ) : null}
          <span style={{ fontFamily: 'Heading', fontWeight: 600, fontSize: 24, color: c.muted, background: '#fff', border: `2px solid ${c.line}`, borderRadius: 999, padding: '6px 18px' }}>
            {index + 1}/{total}
          </span>
        </div>
      </div>

      {/* content */}
      <div data-area="content" style={{ position: 'absolute', top: 150, bottom: reserve, left: L, right: L, display: 'flex', flexDirection: 'column', justifyContent: justify, overflow: 'hidden' }}>
        <div style={{ width: '100%' }}>{content}</div>
      </div>
      {overlay}
      {ctaNode}
      {mascotNode}

      {/* footer */}
      <div style={{ position: 'absolute', bottom: 48, left: L, right: L, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: 'Body', fontSize: 24, color: c.muted, gap: 20 }}>
        <span style={{ lineHeight: 1.35 }}>
          {isLast ? (
            <>
              ข้อมูล ณ {thaiDate(post.dataAsOf)}{sources ? ` · ที่มา: ${sources}` : ''}
              {prov.disclaimer ? <><br />{prov.disclaimer}</> : null}
            </>
          ) : index === 0 && prov.disclaimer ? (
            prov.disclaimer
          ) : (
            config.instagramHandle || config.displayName
          )}
        </span>
        {!isLast ? <span style={{ fontFamily: 'Heading', fontWeight: 600, color: c.accent1, whiteSpace: 'nowrap' }}>ปัดต่อ →</span> : null}
      </div>
    </div>
  );
}

/** Scaled preview wrapper for the editor and lists. */
export function ScaledSlide(props: Props & { scale: number }) {
  const { scale, ...rest } = props;
  return (
    <div style={{ width: W * scale, height: H * scale, overflow: 'hidden', borderRadius: Math.max(6, 36 * scale), boxShadow: '0 8px 30px rgba(20,20,60,0.12)', flex: 'none' }}>
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <SlideView {...rest} />
      </div>
    </div>
  );
}
