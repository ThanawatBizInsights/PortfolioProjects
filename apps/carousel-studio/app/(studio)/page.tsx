import Link from 'next/link';
import { DEFAULT_BRAND, getConfig, getQueue, listPosts } from '@/lib/store';
import { STATUSES } from '@/lib/schema';
import { bkkDate, formatBkk, isoToBkkInput, upcomingBkkDays } from '@/lib/time';
import { ScaledSlide } from '@/components/SlideView';

export const dynamic = 'force-dynamic';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const brand = (await searchParams).brand ?? DEFAULT_BRAND;
  const [config, posts, queue] = await Promise.all([getConfig(brand), listPosts(brand), getQueue(brand)]);
  const days = upcomingBkkDays(14);

  return (
    <div className="col" style={{ gap: 22 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1>{config.displayName} · content calendar</h1>
          <div className="muted small">
            {config.pageName} · writing: <b>{config.modes.generation}</b> · images: <b>{config.modes.images}</b> · posting: <b>{config.modes.publishing}</b> ·
            auto-publish: <b>{config.automation.enabled ? 'on' : 'off'}</b>
          </div>
        </div>
        <Link className="btn primary" href="/posts/new">+ New carousel</Link>
      </div>

      <section>
        <h2>Next 14 days</h2>
        <div className="cal">
          {days.map((d) => {
            const dayPosts = posts.filter((p) => p.scheduledAt && bkkDate(p.scheduledAt) === d.date);
            const slots = config.slots.filter((s) => s.day === d.day);
            return (
              <div className="day" key={d.date}>
                <div className="small"><b>{d.day}</b> <span className="muted">{d.date.slice(5)}</span></div>
                {slots.map((s) => {
                  const p = dayPosts.find((x) => isoToBkkInput(x.scheduledAt).slice(11) === s.time);
                  return p ? null : (
                    <Link key={s.time} className="slot" href={`/posts/new?date=${d.date}&time=${s.time}`}>{s.time} · free slot</Link>
                  );
                })}
                {dayPosts.map((p) => (
                  <Link key={p.id} className="slot filled" href={`/posts/${p.id}`}>
                    {isoToBkkInput(p.scheduledAt).slice(11)} · {p.title.slice(0, 40)} <span className={`badge s-${p.status}`}>{p.status}</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2>All carousels</h2>
        {posts.length === 0 ? <p className="muted">No carousels yet.</p> : null}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {posts
            .slice()
            .sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status))
            .map((p) => (
              <Link key={p.id} href={`/posts/${p.id}`} className="card row" style={{ alignItems: 'flex-start', color: 'inherit' }}>
                {p.slides[0] ? <ScaledSlide slide={p.slides[0]} index={0} post={p} config={config} scale={0.08} /> : null}
                <div className="col" style={{ gap: 4, minWidth: 0 }}>
                  <span className={`badge s-${p.status}`} style={{ alignSelf: 'flex-start' }}>{p.status}</span>
                  <b style={{ fontFamily: 'Heading' }}>{p.title}</b>
                  <span className="muted small">{p.pillar || 'no pillar'} · {p.slides.length} slides</span>
                  <span className="muted small">{formatBkk(p.scheduledAt)}</span>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {queue.length ? (
        <section className="card">
          <h2>Queued for a Claude Code run</h2>
          <p className="muted small">Ask Claude Code to "draft the queued carousels" (or set up the scheduled task later). Drafts appear above as <b>draft</b>.</p>
          {queue.map((q) => (
            <div key={q.id} className="row small" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--line)', padding: '6px 0' }}>
              <span>{q.topic} <span className="muted">· {q.pillar}</span></span>
              <span className="badge">{q.status}</span>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
