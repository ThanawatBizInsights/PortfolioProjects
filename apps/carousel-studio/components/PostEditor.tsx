'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ScaledSlide } from './SlideView';
import { runQc, type Issue } from '@/lib/qc';
import { SLIDE_TYPES, type Config, type Post, type Slide, type SlideType } from '@/lib/schema';
import { bkkInputToIso, formatBkk, isoToBkkInput } from '@/lib/time';
import type { ModeInfo } from '@/lib/modes';

type Manifest = { at: string; contentHash: string; files: { name: string; sha256: string }[] } | null;
type Props = { initialPost: Post; config: Config; initialExportFresh: boolean; initialManifest: Manifest; publishing: ModeInfo[] };
type Tab = 'slide' | 'captions' | 'plan' | 'publish' | 'qc';

function convert(s: Slide, type: SlideType): Slide {
  const img = { imagePrompt: s.imagePrompt, image: s.image };
  const t = s.title;
  const text = 'body' in s ? s.body : s.type === 'cover' ? s.subtitle : '';
  switch (type) {
    case 'cover': return { type, kicker: '', title: t, subtitle: text, ...img };
    case 'statement': return { type, title: t, body: text, ...img };
    case 'step': return { type, number: undefined, title: t, body: text, ...img };
    case 'prompt': return { type, title: t, prompt: '', note: text, ...img };
    case 'summary': return { type, title: t, bullets: text ? [text] : [''], cta: '', ...img };
  }
}

export function PostEditor({ initialPost, config, initialExportFresh, initialManifest, publishing }: Props) {
  const [post, setPost] = useState(initialPost);
  const [dirty, setDirty] = useState(false);
  const [exportFresh, setExportFresh] = useState(initialExportFresh);
  const [manifest, setManifest] = useState<Manifest>(initialManifest);
  const [sel, setSel] = useState(0);
  const [tab, setTab] = useState<Tab>('slide');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const q = `?brand=${post.brand}`;
  const base = `/api/posts/${post.id}`;
  const readOnly = post.status === 'published';

  // Big preview: 50% on desktop, fit the screen width on phones.
  const [previewScale, setPreviewScale] = useState(0.5);
  useEffect(() => {
    const fit = () => setPreviewScale(Math.min(0.5, (window.innerWidth - 56) / 1080));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const issues: Issue[] = useMemo(() => runQc(post, config, { exportFresh: exportFresh && !dirty }), [post, config, exportFresh, dirty]);
  const errors = issues.filter((i) => i.level === 'error').length;

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const edit = (fn: (p: Post) => Post) => { if (readOnly) return; setPost((p) => fn(p)); setDirty(true); };
  const editSlide = (i: number, patch: Partial<Slide>) => edit((p) => ({ ...p, slides: p.slides.map((s, j) => (j === i ? ({ ...s, ...patch } as Slide) : s)) }));

  async function request(label: string, url: string, init: RequestInit) {
    setBusy(label); setMsg(null);
    try {
      const r = await fetch(url + q, init);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `${label} failed`);
      return data;
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
      return null;
    } finally {
      setBusy('');
    }
  }

  async function save(): Promise<boolean> {
    if (!dirty) return true;
    const d = await request('Saving', base, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(post) });
    if (!d) return false;
    setPost(d.post); setExportFresh(d.exportFresh); setDirty(false);
    if (d.post.status !== post.status) setMsg({ kind: 'ok', text: `Saved. Status is now "${d.post.status}".` });
    return true;
  }

  async function refresh() {
    const d = await request('Refreshing', base, { method: 'GET' });
    if (d) { setPost(d.post); setExportFresh(d.exportFresh); setDirty(false); }
  }

  async function doExport() {
    if (!(await save())) return;
    const m = await request('Exporting JPEGs', `${base}/export`, { method: 'POST' });
    if (m) { setManifest(m); await refresh(); setMsg({ kind: 'ok', text: `Exported ${m.files.length} JPEGs (1080×1350).` }); }
  }

  async function action(a: string, note = '') {
    if (!(await save())) return;
    const p = await request('Updating status', `${base}/status`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: a, note }) });
    if (p) { setPost(p); setMsg({ kind: 'ok', text: `Status: ${p.status}` }); }
  }

  async function upload(i: number, file: File) {
    if (!(await save())) return;
    const fd = new FormData();
    fd.append('file', file); fd.append('slide', String(i));
    const p = await request('Uploading image', `${base}/images`, { method: 'POST', body: fd });
    if (p) { setPost(p); setExportFresh(false); setDirty(false); }
  }

  const slide = post.slides[sel];
  const workflowButtons = () => {
    switch (post.status) {
      case 'idea': case 'draft': case 'failed':
        return <button className="btn primary" disabled={!!busy || errors > 0} title={errors ? 'Fix QC errors first' : ''} onClick={() => action('submit')}>Send for review</button>;
      case 'ready-for-review':
        return (
          <>
            <button className="btn" onClick={() => action('back-to-draft')} disabled={!!busy}>Back to draft</button>
            <button className="btn primary" disabled={!!busy || errors > 0 || !exportFresh || dirty} title={!exportFresh ? 'Export first' : ''} onClick={() => action('approve')}>Approve</button>
          </>
        );
      case 'approved':
        return <button className="btn primary" disabled={!!busy} onClick={() => { setTab('publish'); }}>Open posting kit</button>;
      case 'scheduled':
        return <button className="btn" onClick={() => setTab('publish')}>Posting kit</button>;
      default:
        return null;
    }
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      {/* Top bar */}
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="col" style={{ gap: 4 }}>
          <Link href="/" className="small">← Calendar</Link>
          <h1 style={{ margin: 0 }}>{post.title}</h1>
          <div className="row small muted">
            <span className={`badge s-${post.status}`}>{post.status}</span>
            <span>{formatBkk(post.scheduledAt)} (Bangkok)</span>
            <span>· {post.slides.length} slides</span>
            <span>· written via {post.generation.mode}</span>
            {dirty ? <span style={{ color: 'var(--warn)' }}>· unsaved changes</span> : null}
          </div>
        </div>
        <div className="row">
          <button className={`btn ${dirty ? 'primary' : ''}`} disabled={!dirty || !!busy} onClick={save}>Save</button>
          <button className="btn" disabled={!!busy || readOnly} onClick={doExport}>{exportFresh && !dirty ? 'Re-export JPEGs' : 'Export JPEGs'}</button>
          {workflowButtons()}
        </div>
      </div>
      {busy ? <div className="notice">{busy}…</div> : null}
      {msg ? <div className={msg.kind === 'error' ? 'issue error' : 'ok-box'}>{msg.text}</div> : null}
      {readOnly ? <div className="notice">Published posts are read-only.</div> : null}

      <div className="editor">
        {/* Thumbnails */}
        <div className="thumbs">
          {post.slides.map((s, i) => (
            <button key={i} className={`thumb ${i === sel ? 'active' : ''}`} onClick={() => { setSel(i); setTab('slide'); }}>
              <ScaledSlide slide={s} index={i} post={post} config={config} scale={0.125} editing />
            </button>
          ))}
          {!readOnly ? (
            <select value="" onChange={(e) => {
              const t = e.target.value as SlideType;
              if (!t) return;
              const blank = convert({ type: 'statement', title: 'หัวข้อใหม่', body: '', imagePrompt: '', image: '' }, t);
              edit((p) => ({ ...p, slides: [...p.slides.slice(0, sel + 1), blank, ...p.slides.slice(sel + 1)] }));
              setSel(sel + 1);
            }}>
              <option value="">+ add slide…</option>
              {SLIDE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          ) : null}
        </div>

        {/* Big preview */}
        <div className="col" style={{ alignItems: 'center' }}>
          {slide ? <ScaledSlide slide={slide} index={sel} post={post} config={config} scale={previewScale} editing /> : <p className="muted">No slides.</p>}
          <div className="row">
            <button className="btn sm" disabled={sel === 0} onClick={() => setSel(sel - 1)}>← Prev</button>
            <span className="muted small">Slide {sel + 1} / {post.slides.length}</span>
            <button className="btn sm" disabled={sel >= post.slides.length - 1} onClick={() => setSel(sel + 1)}>Next →</button>
          </div>
        </div>

        {/* Side panel */}
        <div className="card">
          <div className="tabs">
            {(['slide', 'captions', 'plan', 'publish', 'qc'] as Tab[]).map((t) => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'qc' ? `QC ${errors ? `· ${errors} ✕` : issues.length ? `· ${issues.length} !` : '✓'}` : t}
              </button>
            ))}
          </div>

          {tab === 'slide' && slide ? (
            <SlidePanel
              slide={slide} index={sel} total={post.slides.length} config={config} readOnly={readOnly}
              onChange={(patch) => editSlide(sel, patch)}
              onType={(t) => edit((p) => ({ ...p, slides: p.slides.map((s, j) => (j === sel ? convert(s, t) : s)) }))}
              onMove={(d) => {
                const j = sel + d;
                if (j < 0 || j >= post.slides.length) return;
                edit((p) => { const s = [...p.slides]; [s[sel], s[j]] = [s[j], s[sel]]; return { ...p, slides: s }; });
                setSel(j);
              }}
              onDelete={() => { if (post.slides.length <= 1) return; edit((p) => ({ ...p, slides: p.slides.filter((_, j) => j !== sel) })); setSel(Math.max(0, sel - 1)); }}
              onUpload={(f) => upload(sel, f)}
              brandPostPath={`/api/files/${post.brand}/${post.id}/images/`}
            />
          ) : null}

          {tab === 'captions' ? (
            <div className="col">
              {(['instagram', 'facebook', 'altText'] as const).map((k) => (
                <label key={k}>
                  <span className="row" style={{ justifyContent: 'space-between' }}>
                    {k === 'altText' ? 'Alt text' : k === 'instagram' ? 'Instagram caption' : 'Facebook caption'}
                    <span className="row">
                      <span className="small muted">{[...post.captions[k]].length} chars</span>
                      <button className="btn sm" onClick={() => navigator.clipboard.writeText(post.captions[k])}>Copy</button>
                    </span>
                  </span>
                  <textarea readOnly={readOnly} style={{ minHeight: k === 'altText' ? 80 : 180 }} value={post.captions[k]} onChange={(e) => edit((p) => ({ ...p, captions: { ...p.captions, [k]: e.target.value } }))} />
                </label>
              ))}
            </div>
          ) : null}

          {tab === 'plan' ? <PlanPanel post={post} config={config} edit={edit} readOnly={readOnly} /> : null}

          {tab === 'publish' ? (
            <PublishPanel post={post} manifest={manifest} exportFresh={exportFresh && !dirty} publishing={publishing} busy={!!busy}
              onSchedule={(note) => action('schedule', note)}
              onRecord={async (body) => {
                const p = await request('Recording result', `${base}/published`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
                if (p) { setPost(p); setMsg({ kind: 'ok', text: `${body.platform}: recorded` }); }
              }}
              checkDuplicates={() => request('Checking duplicates', `${base}/published`, { method: 'GET' })}
            />
          ) : null}

          {tab === 'qc' ? (
            <div className="col">
              {issues.length === 0 ? <div className="ok-box">All checks pass.</div> : null}
              {issues.map((it, i) => (
                <div key={i} className={`issue ${it.level}`} style={{ cursor: it.slide ? 'pointer' : 'default' }} onClick={() => { if (it.slide) { setSel(it.slide - 1); setTab('slide'); } }}>
                  {it.level === 'error' ? '✕' : '!'} {it.slide ? `Slide ${it.slide}: ` : ''}{it.message}
                </div>
              ))}
              <p className="muted small">Red errors block review and approval. Yellow warnings are advice. Facts and Thai tone still need a human read.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ---------- Slide panel ----------
function SlidePanel(props: {
  slide: Slide; index: number; total: number; config: Config; readOnly: boolean; brandPostPath: string;
  onChange: (p: Partial<Slide>) => void; onType: (t: SlideType) => void; onMove: (d: number) => void; onDelete: () => void; onUpload: (f: File) => void;
}) {
  const { slide: s, config, onChange, readOnly } = props;
  const [over, setOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const fullPrompt = s.imagePrompt ? `${s.imagePrompt.trim().replace(/\.$/, '')}. Style: ${config.imageStyle}` : '';
  const ta = (label: string, value: string, key: string, rows = 3, hint = '') => (
    <label>{label}{hint ? <span className="small muted" style={{ fontWeight: 400 }}>{hint}</span> : null}
      <textarea readOnly={readOnly} rows={rows} value={value} onChange={(e) => onChange({ [key]: e.target.value } as Partial<Slide>)} />
    </label>
  );
  const takeFile = (f?: File | null) => { if (f && !readOnly) props.onUpload(f); };

  return (
    <div className="col" onPaste={(e) => takeFile(Array.from(e.clipboardData.files)[0])}>
      <div className="row">
        <select value={s.type} disabled={readOnly} onChange={(e) => props.onType(e.target.value as SlideType)} style={{ width: 'auto' }}>
          {SLIDE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <button className="btn sm" disabled={readOnly || props.index === 0} onClick={() => props.onMove(-1)}>↑</button>
        <button className="btn sm" disabled={readOnly || props.index === props.total - 1} onClick={() => props.onMove(1)}>↓</button>
        <button className="btn sm danger" disabled={readOnly || props.total <= 1} onClick={props.onDelete}>Delete slide</button>
      </div>
      <p className="small muted" style={{ margin: 0 }}>Use <b>**double asterisks**</b> to highlight a phrase and new lines for line breaks.</p>

      {s.type === 'cover' ? <>
        {ta('Kicker (small label)', s.kicker, 'kicker', 1)}
        {ta('Title', s.title, 'title', 3, ' 2–3 lines, ≤16 Thai characters each')}
        {ta('Subtitle', s.subtitle, 'subtitle', 2)}
      </> : null}
      {s.type === 'statement' || s.type === 'step' ? <>
        {s.type === 'step' ? (
          <label>Number<input type="number" disabled={readOnly} value={s.number ?? ''} onChange={(e) => onChange({ number: e.target.value ? Number(e.target.value) : undefined } as Partial<Slide>)} /></label>
        ) : null}
        {ta('Title', s.title, 'title', 2)}
        {ta('Body', s.body, 'body', 4)}
      </> : null}
      {s.type === 'prompt' ? <>
        {ta('Title', s.title, 'title', 2)}
        {ta('Copy-ready prompt', s.prompt, 'prompt', 6)}
        {ta('Note', s.note, 'note', 2)}
      </> : null}
      {s.type === 'summary' ? <>
        {ta('Title', s.title, 'title', 2)}
        <label>Bullets (one per line)
          <textarea readOnly={readOnly} rows={5} value={s.bullets.join('\n')} onChange={(e) => onChange({ bullets: e.target.value.split('\n') } as Partial<Slide>)} />
        </label>
        {ta('Call to action (one)', s.cta, 'cta', 1)}
      </> : null}

      <div className="card col" style={{ background: '#faf9ff' }}>
        <h3 style={{ margin: 0 }}>Image</h3>
        {ta('Image prompt (English, no text in the image)', s.imagePrompt, 'imagePrompt', 3)}
        {fullPrompt ? (
          <div className="row">
            <button className="btn sm" onClick={() => navigator.clipboard.writeText(fullPrompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}>
              {copied ? 'Copied ✓' : 'Copy prompt + brand style'}
            </button>
            <a className="btn sm" href="https://chatgpt.com/" target="_blank" rel="noreferrer">ChatGPT ↗</a>
          </div>
        ) : null}
        <p className="small muted" style={{ margin: 0 }}>Generate it in {config.imageTools.join(' / ') || 'your image tool'} as a 4:5 portrait. Then drop, paste or choose the file:</p>
        <div className={`drop ${over ? 'over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); takeFile(e.dataTransfer.files[0]); }}>
          {s.image ? <>Current: {s.image}<br /></> : null}
          Drop an image here, paste with Ctrl/⌘+V, or{' '}
          <label style={{ display: 'inline', color: 'var(--a1)', cursor: 'pointer' }}>
            choose a file<input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={readOnly} onChange={(e) => takeFile(e.target.files?.[0])} />
          </label>
        </div>
        {s.image ? <button className="btn sm danger" disabled={readOnly} onClick={() => onChange({ image: '' } as Partial<Slide>)}>Remove image from slide</button> : null}
      </div>
    </div>
  );
}

// ---------- Plan & sources ----------
function PlanPanel({ post, config, edit, readOnly }: { post: Post; config: Config; edit: (fn: (p: Post) => Post) => void; readOnly: boolean }) {
  const set = (patch: Partial<Post>) => edit((p) => ({ ...p, ...patch }));
  return (
    <div className="col">
      <label>Working title<input readOnly={readOnly} value={post.title} onChange={(e) => set({ title: e.target.value })} /></label>
      <label>Pillar
        <select disabled={readOnly} value={post.pillar} onChange={(e) => set({ pillar: e.target.value })}>
          {[post.pillar, ...config.pillars.filter((p) => p !== post.pillar)].map((p) => <option key={p}>{p}</option>)}
        </select>
      </label>
      <label>Audience<input readOnly={readOnly} value={post.audience} onChange={(e) => set({ audience: e.target.value })} /></label>
      <label>Main takeaway<textarea readOnly={readOnly} rows={2} value={post.takeaway} onChange={(e) => set({ takeaway: e.target.value })} /></label>
      <label>Posting time (Asia/Bangkok)
        <input type="datetime-local" readOnly={readOnly} value={isoToBkkInput(post.scheduledAt)} onChange={(e) => set({ scheduledAt: bkkInputToIso(e.target.value) })} />
      </label>

      <h3>Hooks</h3>
      {post.hooks.map((h, i) => (
        <label key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, fontWeight: 400 }}>
          <input type="radio" style={{ width: 'auto' }} disabled={readOnly} checked={post.selectedHook === i} onChange={() => set({ selectedHook: i })} />
          <span><b>{h.text}</b> <span className="muted small">({h.mechanism})</span></span>
        </label>
      ))}
      {post.hooks.length === 0 ? <p className="muted small">No hooks recorded.</p> : null}

      <h3>Sources <span className="small muted">(required: official pages)</span></h3>
      {post.sources.map((s, i) => (
        <div key={i} className="card col" style={{ padding: 10 }}>
          <input readOnly={readOnly} placeholder="What this source supports" value={s.claim} onChange={(e) => set({ sources: post.sources.map((x, j) => (j === i ? { ...x, claim: e.target.value } : x)) })} />
          <input readOnly={readOnly} placeholder="https://…" value={s.url} onChange={(e) => set({ sources: post.sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
          <div className="row">
            <input type="date" readOnly={readOnly} value={s.checkedAt} style={{ flex: 1 }} onChange={(e) => set({ sources: post.sources.map((x, j) => (j === i ? { ...x, checkedAt: e.target.value } : x)) })} />
            {s.url ? <a className="btn sm" href={s.url} target="_blank" rel="noreferrer">Open ↗</a> : null}
            <button className="btn sm danger" disabled={readOnly} onClick={() => set({ sources: post.sources.filter((_, j) => j !== i) })}>✕</button>
          </div>
        </div>
      ))}
      <button className="btn sm" disabled={readOnly} onClick={() => set({ sources: [...post.sources, { claim: '', url: '', checkedAt: new Date().toISOString().slice(0, 10) }] })}>+ Add source</button>
      <label>"ข้อมูล ณ" date (last slide)<input type="date" readOnly={readOnly} value={post.dataAsOf} onChange={(e) => set({ dataAsOf: e.target.value })} /></label>

      <h3>History</h3>
      <div className="small muted col" style={{ gap: 2 }}>
        {post.history.slice().reverse().map((h, i) => <span key={i}>{formatBkk(h.at)} · {h.event}</span>)}
      </div>
    </div>
  );
}

// ---------- Publish (manual kit now, Meta API later) ----------
type Dups = { instagram: { permalink: string; scheduled_for_bkk: string }[]; facebook: { permalink: string; scheduled_for_bkk: string }[] };

function PublishPanel(props: {
  post: Post; manifest: Manifest; exportFresh: boolean; publishing: ModeInfo[]; busy: boolean;
  onSchedule: (note: string) => void;
  onRecord: (b: { platform: 'instagram' | 'facebook'; outcome: 'posted' | 'failed'; permalink: string; postId: string; note: string }) => void;
  checkDuplicates: () => Promise<Dups | null>;
}) {
  const { post, manifest, exportFresh } = props;
  const [dups, setDups] = useState<Dups | null>(null);
  const [form, setForm] = useState({ instagram: { permalink: '', postId: '', note: '' }, facebook: { permalink: '', postId: '', note: '' } });
  const approved = ['approved', 'scheduled', 'published', 'failed'].includes(post.status);

  useEffect(() => { if (approved) props.checkDuplicates().then(setDups); }, [approved]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!approved) return <div className="notice">The posting kit unlocks after the post is <b>approved</b>. Export the JPEGs, then Approve.</div>;
  return (
    <div className="col">
      <div className="notice">
        <b>Mode: manual posting kit.</b> {props.publishing.find((m) => m.id === 'meta-api')?.note}
      </div>
      <div><b>Post at:</b> {formatBkk(post.scheduledAt)} (Bangkok)</div>
      {!exportFresh ? <div className="issue error">The exports are out of date. Re-export and re-approve.</div> : null}

      <h3>1 · Download the slides (in order)</h3>
      <div className="row" style={{ gap: 6 }}>
        {manifest?.files.map((f) => (
          <a key={f.name} className="btn sm" href={`/api/files/${post.brand}/${post.id}/export/${f.name}`} download={`${post.id}-${f.name}`}>{f.name}</a>
        ))}
      </div>

      <h3>2 · Copy the captions</h3>
      <div className="row">
        <button className="btn sm" onClick={() => navigator.clipboard.writeText(post.captions.instagram)}>Copy Instagram caption</button>
        <button className="btn sm" onClick={() => navigator.clipboard.writeText(post.captions.facebook)}>Copy Facebook caption</button>
        <button className="btn sm" onClick={() => navigator.clipboard.writeText(post.captions.altText)}>Copy alt text</button>
      </div>

      <h3>3 · Schedule it in Meta Business Suite</h3>
      <p className="small muted" style={{ margin: 0 }}>Create one post for Facebook and Instagram with the same images, using each platform’s own caption.</p>
      {post.status === 'approved' ? <button className="btn" disabled={props.busy} onClick={() => props.onSchedule('in Meta Business Suite')}>I scheduled it in Meta Business Suite</button> : null}

      <h3>4 · After it goes live, record the link</h3>
      {(['instagram', 'facebook'] as const).map((pl) => {
        const rec = post.publish[pl];
        const d = dups?.[pl] ?? [];
        return (
          <div key={pl} className="card col" style={{ padding: 10 }}>
            <b>{pl === 'instagram' ? 'Instagram' : 'Facebook'}</b>
            {d.length ? <div className="issue error">Possible duplicate: the same image or caption was already posted ({d.map((x) => x.permalink || x.scheduled_for_bkk).join(', ')}).</div> : null}
            {rec.status !== 'none' ? (
              <div className={rec.status === 'posted' ? 'ok-box' : 'issue error'}>
                {rec.status} · {rec.permalink ? <a href={rec.permalink} target="_blank" rel="noreferrer">{rec.permalink}</a> : rec.note}
              </div>
            ) : (
              <>
                <input placeholder="Post link (permalink)" value={form[pl].permalink} onChange={(e) => setForm({ ...form, [pl]: { ...form[pl], permalink: e.target.value } })} />
                <input placeholder="Post ID (optional)" value={form[pl].postId} onChange={(e) => setForm({ ...form, [pl]: { ...form[pl], postId: e.target.value } })} />
                <input placeholder="Note (optional, or what went wrong)" value={form[pl].note} onChange={(e) => setForm({ ...form, [pl]: { ...form[pl], note: e.target.value } })} />
                <div className="row">
                  <button className="btn sm primary" disabled={props.busy} onClick={() => props.onRecord({ platform: pl, outcome: 'posted', ...form[pl] })}>Mark posted</button>
                  <button className="btn sm danger" disabled={props.busy} onClick={() => props.onRecord({ platform: pl, outcome: 'failed', ...form[pl] })}>Mark failed</button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

