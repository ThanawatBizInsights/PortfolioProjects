// One 1080x1350 slide. Used for the editor preview (scaled down) and the export page (full size).
// Pure component: no hooks, so it renders on the server and the client the same way.
import type { CSSProperties, ReactNode } from 'react';
import type { Config, Post, Slide } from '@/lib/schema';

export const W = 1080;
export const H = 1350;

type Props = { slide: Slide; index: number; post: Post; config: Config; editing?: boolean };

/** "**word**" → gradient highlight, "\n" → line break. */
function Rich({ text, gradient }: { text: string; gradient: string }) {
  return (
    <>
      {text.split('\n').map((line, li) => (
        <span key={li} style={{ display: 'block' }}>
          {line.split('**').map((part, pi) =>
            pi % 2 === 1 ? (
              <span key={pi} style={{ backgroundImage: gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                {part}
              </span>
            ) : (
              <span key={pi}>{part}</span>
            ),
          )}
        </span>
      ))}
    </>
  );
}

function thaiDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00+07:00` : iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(d);
}

const domain = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

export function SlideView({ slide, index, post, config, editing }: Props) {
  const c = config.colors;
  const gradient = `linear-gradient(120deg, ${c.accent1}, ${c.accent2})`;
  const total = post.slides.length;
  const isLast = index === total - 1;
  const imgUrl = slide.image ? `/api/files/${post.brand}/${post.id}/images/${encodeURIComponent(slide.image)}` : '';

  const title = (size: number): CSSProperties => ({ fontFamily: 'Heading', fontWeight: 700, fontSize: size, lineHeight: 1.22, color: c.ink, margin: 0 });
  const body: CSSProperties = { fontFamily: 'Body', fontWeight: 400, fontSize: 44, lineHeight: 1.6, color: c.muted, margin: 0 };

  const imageBox = (height: number, extra: CSSProperties = {}): ReactNode => (
    <div
      style={{
        position: 'absolute', left: 72, right: 72, bottom: 128, height, borderRadius: 48, overflow: 'hidden',
        background: `radial-gradient(60% 70% at 30% 30%, ${c.accent1}55, transparent 70%), radial-gradient(60% 70% at 75% 70%, ${c.accent2}55, transparent 70%), ${c.card}`,
        border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 30px 80px rgba(47,60,160,0.18)', ...extra,
      }}
    >
      {imgUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : editing ? (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'Body', fontSize: 36, color: c.muted }}>
          ยังไม่มีภาพ · upload in the editor
        </div>
      ) : null}
    </div>
  );

  let content: ReactNode = null;
  let overlay: ReactNode = null; // positioned against the whole slide (images, CTA)
  let reserve = 130; // space kept free at the bottom for the footer / overlay
  switch (slide.type) {
    case 'cover':
      content = (
        <>
          {slide.kicker ? (
            <div style={{ display: 'inline-block', padding: '14px 30px', borderRadius: 999, background: gradient, color: '#fff', fontFamily: 'Heading', fontWeight: 600, fontSize: 32, marginBottom: 34 }}>
              {slide.kicker}
            </div>
          ) : null}
          <h1 style={title(100)}>
            <Rich text={slide.title} gradient={gradient} />
          </h1>
          {slide.subtitle ? <p style={{ ...body, fontSize: 42, marginTop: 26 }}>{slide.subtitle}</p> : null}
        </>
      );
      overlay = imageBox(440);
      reserve = 440 + 128 + 40;
      break;

    case 'statement':
      content = (
        <>
          <h2 style={title(76)}>
            <Rich text={slide.title} gradient={gradient} />
          </h2>
          {slide.body ? (
            <p style={{ ...body, marginTop: 34 }}>
              <Rich text={slide.body} gradient={gradient} />
            </p>
          ) : null}
        </>
      );
      if (slide.imagePrompt || slide.image) { overlay = imageBox(470); reserve = 470 + 128 + 40; }
      break;

    case 'step':
      content = (
        <>
          <div style={{ width: 128, height: 128, borderRadius: 40, background: gradient, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'Heading', fontWeight: 700, fontSize: 64, boxShadow: `0 20px 50px ${c.accent1}55`, marginBottom: 44 }}>
            {slide.number ?? index}
          </div>
          <h2 style={title(74)}>
            <Rich text={slide.title} gradient={gradient} />
          </h2>
          {slide.body ? (
            <p style={{ ...body, marginTop: 30 }}>
              <Rich text={slide.body} gradient={gradient} />
            </p>
          ) : null}
        </>
      );
      if (slide.imagePrompt || slide.image) { overlay = imageBox(430); reserve = 430 + 128 + 40; }
      break;

    case 'prompt':
      content = (
        <>
          <h2 style={title(66)}>
            <Rich text={slide.title} gradient={gradient} />
          </h2>
          <div style={{ marginTop: 40, background: c.dark, borderRadius: 44, padding: '44px 50px', boxShadow: '0 30px 70px rgba(22,22,58,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              {[c.accent1, c.accent2, '#ffffff66'].map((col) => (
                <span key={col} style={{ width: 18, height: 18, borderRadius: 99, background: col, display: 'inline-block' }} />
              ))}
              <span style={{ marginLeft: 12, fontFamily: 'Heading', fontWeight: 600, fontSize: 28, color: '#B9B6FF' }}>คัดลอกไปใช้ได้เลย</span>
            </div>
            <p style={{ fontFamily: 'Body', fontSize: 36, lineHeight: 1.6, color: '#F4F3FF', margin: 0, whiteSpace: 'pre-wrap' }}>{slide.prompt}</p>
          </div>
          {slide.note ? <p style={{ ...body, fontSize: 38, marginTop: 34 }}>{slide.note}</p> : null}
        </>
      );
      break;

    case 'summary':
      content = (
        <>
          <h2 style={title(74)}>
            <Rich text={slide.title} gradient={gradient} />
          </h2>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 26 }}>
            {slide.bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 26, background: c.card, borderRadius: 32, padding: '24px 30px', border: '2px solid rgba(255,255,255,0.9)' }}>
                <span style={{ flex: '0 0 52px', height: 52, borderRadius: 99, background: gradient, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 30, fontFamily: 'Heading', fontWeight: 700, marginTop: 6 }}>✓</span>
                <span style={{ ...body, color: c.ink, fontSize: 42, lineHeight: 1.5 }}>
                  <Rich text={b} gradient={gradient} />
                </span>
              </div>
            ))}
          </div>
        </>
      );
      overlay = slide.cta ? (
            <div style={{ position: 'absolute', left: 72, right: 72, bottom: 140, textAlign: 'center', padding: '30px 40px', borderRadius: 999, background: gradient, color: '#fff', fontFamily: 'Heading', fontWeight: 700, fontSize: 46, boxShadow: `0 24px 60px ${c.accent2}55` }}>
              {slide.cta}
            </div>
          ) : null;
      if (slide.cta) reserve = 140 + 140 + 30;
      break;
  }

  const sources = [...new Set(post.sources.map((s) => domain(s.url)).filter(Boolean))].slice(0, 2).join(', ');

  return (
    <div
      style={{
        position: 'relative', width: W, height: H, overflow: 'hidden', fontFamily: 'Body', color: c.ink,
        background: `radial-gradient(55% 40% at 95% 5%, ${c.accent2}33, transparent 70%), radial-gradient(50% 40% at 0% 100%, ${c.accent1}2E, transparent 70%), linear-gradient(165deg, ${c.bg} 0%, ${c.bg2} 100%)`,
      }}
    >
      {/* soft orbs, like the Page cover */}
      <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: 99, right: 120, top: 210, background: `radial-gradient(circle at 35% 35%, #fff, ${c.accent1}88)`, opacity: 0.55, filter: 'blur(1px)' }} />
      <div style={{ position: 'absolute', width: 70, height: 70, borderRadius: 99, left: 40, top: 640, background: `radial-gradient(circle at 35% 35%, #fff, ${c.accent2}88)`, opacity: 0.45 }} />

      {/* header */}
      <div style={{ position: 'absolute', top: 56, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Heading', fontWeight: 700, fontSize: 36, backgroundImage: gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', letterSpacing: -0.5 }}>
          {config.displayName}
        </span>
        <span style={{ fontFamily: 'Heading', fontWeight: 600, fontSize: 28, color: c.muted, background: c.card, borderRadius: 999, padding: '8px 22px', border: '2px solid rgba(255,255,255,0.9)' }}>
          {index + 1}/{total}
        </span>
      </div>

      {/* content */}
      <div style={{ position: 'absolute', top: slide.type === 'cover' ? 170 : 150, bottom: reserve, left: 72, right: 72, display: 'flex', flexDirection: 'column', justifyContent: slide.type === 'cover' ? 'flex-start' : 'center', alignItems: 'flex-start' }}>
        <div style={{ width: '100%' }}>{content}</div>
      </div>
      {overlay}

      {/* footer */}
      <div style={{ position: 'absolute', bottom: 56, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Body', fontSize: 28, color: c.muted }}>
        <span>{isLast ? `ข้อมูล ณ ${thaiDate(post.dataAsOf)}${sources ? ` · ที่มา: ${sources}` : ''}` : config.instagramHandle || config.pageName.split(' - ')[0]}</span>
        {!isLast ? <span style={{ fontFamily: 'Heading', fontWeight: 600, color: c.accent1 }}>ปัดต่อ →</span> : null}
      </div>
    </div>
  );
}

/** Scaled preview wrapper for the editor and lists. */
export function ScaledSlide(props: Props & { scale: number }) {
  const { scale, ...rest } = props;
  return (
    <div style={{ width: W * scale, height: H * scale, overflow: 'hidden', borderRadius: 18 * (scale * 2), boxShadow: '0 8px 30px rgba(20,20,60,0.12)', flex: 'none' }}>
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <SlideView {...rest} />
      </div>
    </div>
  );
}
