'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ScaledSlide, MascotArt, assetUrl } from './SlideView';
import { ICONS } from './Icon';
import { runQc, type Issue } from '@/lib/qc';
import { CONTENT_TYPES, SLIDE_TYPES, SlideSchema, findProvider, slideProvider, type Config, type Post, type Registry, type Slide, type SlideType } from '@/lib/schema';
import { bkkInputToIso, formatBkk, isoToBkkInput } from '@/lib/time';
import type { ModeInfo } from '@/lib/modes';

type Manifest = { at: string; contentHash: string; files: { name: string; sha256: string }[]; zip?: string; layoutIssues?: { slide: number; message: string }[] } | null;
type Props = { initialPost: Post; config: Config; registry: Registry; initialExportFresh: boolean; initialManifest: Manifest; publishing: ModeInfo[] };
type Tab = 'slide' | 'storyboard' | 'captions' | 'plan' | 'export' | 'publish' | 'qc';

// ---------- generic field editor ----------
type Sub = { key: string; label: string; kind?: 'text' | 'icon' | 'number' };
type Field =
  | { k: 'text' | 'area'; path: string; label: string; rows?: number }
  | { k: 'select'; path: string; label: string; options: string[] }
  | { k: 'number'; path: string; label: string }
  | { k: 'bool'; path: string; label: string }
  | { k: 'lines'; path: string; label: string }
  | { k: 'items'; path: string; label: string; sub: Sub[]; max: number }
  | { k: 'rows'; path: string; label: string };

const T = (path: string, label: string, rows = 2): Field => ({ k: 'area', path, label, rows });
const FIELDS: Record<SlideType, Field[]> = {
  cover: [{ k: 'text', path: 'kicker', label: 'Topic label' }, T('title', 'Title (2–3 lines, ≤16 chars each)', 3), T('subtitle', 'Subtitle'), { k: 'select', path: 'visual', label: 'Visual', options: ['chat', 'image', 'none'] }, T('chat.user', 'Chat mock: our message'), T('chat.reply', 'Chat mock: reply (illustrative)')],
  concept: [T('title', 'Headline'), T('definition', 'Definition card', 3), { k: 'items', path: 'points', label: 'Points (2–4)', max: 4, sub: [{ key: 'icon', label: 'icon', kind: 'icon' }, { key: 'label', label: 'label' }, { key: 'text', label: 'text' }] }],
  flow: [T('title', 'Headline'), T('intro', 'Intro line'), { k: 'items', path: 'steps', label: 'Steps (2–5)', max: 5, sub: [{ key: 'icon', label: 'icon', kind: 'icon' }, { key: 'label', label: 'label' }, { key: 'text', label: 'text' }] }],
  example: [T('title', 'Headline'), T('prompt', 'Example message', 3), { k: 'items', path: 'annotations', label: 'Annotations (quote must appear in the message)', max: 3, sub: [{ key: 'quote', label: 'quote' }, { key: 'label', label: 'label' }, { key: 'text', label: 'text' }] }, { k: 'lines', path: 'reply', label: 'Reply lines (one per line)' }, { k: 'text', path: 'replyNote', label: 'Reply label' }],
  howto: [T('title', 'Headline'), { k: 'items', path: 'items', label: 'Items', max: 4, sub: [{ key: 'icon', label: 'icon', kind: 'icon' }, { key: 'ui', label: 'UI label' }, { key: 'label', label: 'label' }, { key: 'text', label: 'text' }] }],
  compare: [T('title', 'Headline'), { k: 'select', path: 'style', label: 'Style', options: ['avoid-better', 'table'] }, { k: 'lines', path: 'columns', label: 'Column headers (one per line)' }, { k: 'rows', path: 'rows', label: 'Rows' }],
  recap: [T('title', 'Headline'), { k: 'lines', path: 'items', label: 'Checklist items (≤ 6)' }, { k: 'text', path: 'cta', label: 'Call to action (one)' }],
  chart: [T('title', 'Headline'), T('subtitle', 'What is measured + unit'), { k: 'select', path: 'chartKind', label: 'Chart', options: ['bar', 'line'] }, { k: 'text', path: 'valuePrefix', label: 'Value prefix' }, { k: 'text', path: 'valueSuffix', label: 'Value suffix' }, { k: 'items', path: 'data', label: 'Data (one series)', max: 8, sub: [{ key: 'label', label: 'label' }, { key: 'value', label: 'value', kind: 'number' }] }, { k: 'number', path: 'highlight', label: 'Highlighted point (0-based)' }, { k: 'bool', path: 'illustrative', label: 'Made-up numbers (note must say ตัวเลขสมมติ)' }, T('note', 'Note')],
  statement: [T('title', 'Headline'), T('body', 'Body', 4)],
  step: [{ k: 'number', path: 'number', label: 'Number' }, T('title', 'Headline'), T('body', 'Body', 4)],
  prompt: [T('title', 'Headline'), T('prompt', 'Copy-ready prompt', 6), T('note', 'Note')],
  summary: [T('title', 'Headline'), { k: 'lines', path: 'bullets', label: 'Bullets' }, { k: 'text', path: 'cta', label: 'Call to action' }],
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const getAt = (o: any, path: string) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), o);
function setAt<T>(o: T, path: string, value: unknown): T {
  const [k, ...rest] = path.split('.');
  const cur = (o as any)?.[k];
  return { ...(o as any), [k]: rest.length ? setAt(cur ?? {}, rest.join('.'), value) : value };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function blankSlide(type: SlideType): Slide {
  const base: Record<SlideType, object> = {
    cover: { title: 'หัวข้อ' }, concept: { title: 'คืออะไร', points: [{ icon: 'spark' }, { icon: 'bulb' }] }, flow: { title: 'ขั้นตอน', steps: [{ icon: 'chat' }, { icon: 'check' }] },
    example: { title: 'ตัวอย่าง', prompt: '' }, howto: { title: 'วิธีใช้', items: [{ icon: 'plus' }] }, compare: { title: 'เปรียบเทียบ', columns: ['เลี่ยงแบบนี้', 'ลองแบบนี้แทน'], rows: [{ cells: ['', ''] }] },
    recap: { title: 'สรุป', items: [''] }, chart: { title: 'กราฟ', data: [{ label: 'A', value: 1 }, { label: 'B', value: 2 }], note: 'ตัวเลขสมมติ', illustrative: true },
    statement: { title: 'หัวข้อ' }, step: { title: 'ขั้นตอน' }, prompt: { title: 'Prompt', prompt: '' }, summary: { title: 'สรุป' },
  };
  return SlideSchema.parse({ type, ...base[type] });
}

export function PostEditor({ initialPost, config, registry: initialRegistry, initialExportFresh, initialManifest, publishing }: Props) {
  const [post, setPost] = useState(initialPost);
  const [registry] = useState(initialRegistry);
  const [dirty, setDirty] = useState(false);
  const [exportFresh, setExportFresh] = useState(initialExportFresh);
  const [manifest, setManifest] = useState<Manifest>(initialManifest);
  const [sel, setSel] = useState(0);
  const [tab, setTab] = useState<Tab>('slide');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const [previewScale, setPreviewScale] = useState(0.5);
  const q = `?brand=${post.brand}`;
  const base = `/api/posts/${post.id}`;
  const readOnly = post.status === 'published';
  const provIds = [post.provider, ...post.providers];

  useEffect(() => {
    const fit = () => setPreviewScale(Math.min(0.5, (window.innerWidth - 56) / 1080));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const fresh = exportFresh && !dirty;
  const issues: Issue[] = useMemo(() => runQc(post, config, registry, { exportFresh: fresh, layoutIssues: manifest?.layoutIssues }), [post, config, registry, fresh, manifest]);
  const errors = issues.filter((i) => i.level === 'error').length;

  const edit = (fn: (p: Post) => Post) => { if (readOnly) return; setPost((p) => fn(p)); setDirty(true); };
  const editSlide = (i: number, fn: (s: Slide) => Slide) => edit((p) => ({ ...p, slides: p.slides.map((s, j) => (j === i ? fn(s) : s)) }));

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
  const applyState = (d: { post: Post; exportFresh: boolean; manifest: Manifest }) => { setPost(d.post); setExportFresh(d.exportFresh); setManifest(d.manifest); setDirty(false); };
  async function save(): Promise<boolean> {
    if (!dirty) return true;
    const d = await request('Saving', base, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(post) });
    if (d) applyState(d);
    return !!d;
  }
  async function refresh() {
    const d = await request('Refreshing', base, { method: 'GET' });
    if (d) applyState(d);
  }
  async function doExport() {
    if (!(await save())) return;
    const m = await request('Rendering slides', `${base}/export`, { method: 'POST' });
    if (m) { await refresh(); setMsg({ kind: m.layoutIssues?.length ? 'error' : 'ok', text: `Rendered ${m.files.length} PNGs + ZIP.${m.layoutIssues?.length ? ` ${m.layoutIssues.length} layout problem(s); see QC.` : ' No layout problems found.'}` }); }
  }
  async function action(a: string, note = '') {
    if (!(await save())) return;
    const p = await request('Updating status', `${base}/status`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: a, note }) });
    if (p) { setPost(p); setMsg({ kind: 'ok', text: `Status: ${p.status}` }); }
  }
  async function upload(url: string, file: File, slide?: number) {
    if (!(await save())) return;
    const fd = new FormData();
    fd.append('file', file);
    if (slide !== undefined) fd.append('slide', String(slide));
    const p = await request('Uploading', url, { method: 'POST', body: fd });
    if (p) { setPost(p); setExportFresh(false); setDirty(false); }
  }

  const slide = post.slides[sel];
  const workflowButtons = () => {
    switch (post.status) {
      case 'idea': case 'draft': case 'failed':
        return <button className="btn primary" disabled={!!busy || errors > 0} title={errors ? 'Fix QC errors first' : ''} onClick={() => action('submit')}>Send for review</button>;
      case 'ready-for-review':
        return (<><button className="btn" onClick={() => action('back-to-draft')} disabled={!!busy}>Back to draft</button><button className="btn primary" disabled={!!busy || errors > 0 || !fresh} title={!fresh ? 'Render first' : ''} onClick={() => action('approve')}>Approve</button></>);
      case 'approved': case 'scheduled':
        return <button className="btn primary" onClick={() => setTab('publish')}>Posting kit</button>;
      default:
        return null;
    }
  };

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="col" style={{ gap: 4 }}>
          <Link href="/" className="small">← Calendar</Link>
          <h1 style={{ margin: 0 }}>{post.title}</h1>
          <div className="row small muted">
            <span className={`badge s-${post.status}`}>{post.status}</span>
            <span className="badge">{findProvider(registry, post.provider)?.name ?? post.provider}{post.providers.length ? ` + ${post.providers.join(', ')}` : ''}</span>
            <span className="badge">{post.contentType}</span>
            <span>{formatBkk(post.scheduledAt)} (Bangkok)</span>
            <span>· {post.slides.length} slides</span>
            {dirty ? <span style={{ color: 'var(--warn)' }}>· unsaved changes</span> : null}
          </div>
        </div>
        <div className="row">
          <button className={`btn ${dirty ? 'primary' : ''}`} disabled={!dirty || !!busy} onClick={save}>Save</button>
          <button className="btn" disabled={!!busy || readOnly} onClick={doExport}>{fresh ? 'Re-render' : 'Render + export'}</button>
          {workflowButtons()}
        </div>
      </div>

      <Pipeline post={post} issues={issues} fresh={fresh} manifest={manifest} config={config} registry={registry} />
      {busy ? <div className="notice">{busy}…</div> : null}
      {msg ? <div className={msg.kind === 'error' ? 'issue error' : 'ok-box'}>{msg.text}</div> : null}
      {readOnly ? <div className="notice">Published posts are read-only.</div> : null}

      <div className="editor">
        <div className="thumbs">
          {post.slides.map((s, i) => (
            <button key={i} className={`thumb ${i === sel ? 'active' : ''}`} onClick={() => { setSel(i); setTab('slide'); }}>
              <ScaledSlide slide={s} index={i} post={post} config={config} registry={registry} scale={0.125} editing />
            </button>
          ))}
          {!readOnly ? (
            <select value="" onChange={(e) => {
              const t = e.target.value as SlideType;
              if (!t) return;
              edit((p) => ({ ...p, slides: [...p.slides.slice(0, sel + 1), blankSlide(t), ...p.slides.slice(sel + 1)] }));
              setSel(sel + 1);
            }}>
              <option value="">+ add slide…</option>
              {SLIDE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          ) : null}
        </div>

        <div className="col" style={{ alignItems: 'center' }}>
          {slide ? <ScaledSlide slide={slide} index={sel} post={post} config={config} registry={registry} scale={previewScale} editing /> : <p className="muted">No slides.</p>}
          <div className="row">
            <button className="btn sm" disabled={sel === 0} onClick={() => setSel(sel - 1)}>← Prev</button>
            <span className="muted small">Slide {sel + 1} / {post.slides.length}</span>
            <button className="btn sm" disabled={sel >= post.slides.length - 1} onClick={() => setSel(sel + 1)}>Next →</button>
          </div>
        </div>

        <div className="card">
          <div className="tabs">
            {(['slide', 'storyboard', 'captions', 'plan', 'export', 'publish', 'qc'] as Tab[]).map((t) => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'qc' ? `QC ${errors ? `· ${errors} ✕` : issues.length ? `· ${issues.length} !` : '✓'}` : t}
              </button>
            ))}
          </div>

          {tab === 'slide' && slide ? (
            <SlidePanel
              slide={slide} index={sel} total={post.slides.length} post={post} config={config} registry={registry} readOnly={readOnly} provIds={provIds}
              onChange={(fn) => editSlide(sel, fn)}
              onType={(t) => editSlide(sel, (s) => SlideSchema.parse({ ...blankSlide(t), title: s.title, story: s.story, mascot: s.mascot, provider: s.provider, imagePrompt: s.imagePrompt, image: s.image }))}
              onMove={(d) => {
                const j = sel + d;
                if (j < 0 || j >= post.slides.length) return;
                edit((p) => { const s = [...p.slides]; [s[sel], s[j]] = [s[j], s[sel]]; return { ...p, slides: s }; });
                setSel(j);
              }}
              onDelete={() => { if (post.slides.length <= 1) return; edit((p) => ({ ...p, slides: p.slides.filter((_, j) => j !== sel) })); setSel(Math.max(0, sel - 1)); }}
              onUpload={(f) => upload(`${base}/images`, f, sel)}
            />
          ) : null}

          {tab === 'storyboard' ? (
            <div className="col small">
              {post.slides.map((s, i) => (
                <div key={i} className="card col" style={{ padding: 10, gap: 4, cursor: 'pointer', borderColor: i === sel ? 'var(--a2)' : undefined }} onClick={() => { setSel(i); setTab('slide'); }}>
                  <b>{i + 1}. {s.type} · {s.title.replace(/\*\*/g, '').replace(/\n/g, ' ')}</b>
                  <span><b>Teaches:</b> {s.story.teachingPoint || <i className="muted">missing</i>}</span>
                  <span className="muted"><b>Visual:</b> {s.story.composition || '—'}</span>
                  <span className="muted"><b>Mascot:</b> {s.mascot ? `${s.mascot.provider || slideProvider(post, s)} / ${s.mascot.pose}` : 'none'} · <b>Colours:</b> {findProvider(registry, slideProvider(post, s))?.name} · <b>Basis:</b> {s.story.basis}{s.story.sourceIds.length ? ` [${s.story.sourceIds.join(', ')}]` : ''}</span>
                  {s.imagePrompt ? <span className="muted"><b>Illustration:</b> {s.image ? 'uploaded' : 'needed (manual)'}</span> : null}
                </div>
              ))}
            </div>
          ) : null}

          {tab === 'captions' ? (
            <div className="col">
              {(['instagram', 'facebook', 'altText'] as const).map((k) => (
                <label key={k}>
                  <span className="row" style={{ justifyContent: 'space-between' }}>
                    {k === 'altText' ? 'Alt text' : k === 'instagram' ? 'Instagram caption' : 'Facebook caption'}
                    <span className="row"><span className="small muted">{[...post.captions[k]].length} chars</span><button className="btn sm" onClick={() => navigator.clipboard.writeText(post.captions[k])}>Copy</button></span>
                  </span>
                  <textarea readOnly={readOnly} style={{ minHeight: k === 'altText' ? 90 : 190 }} value={post.captions[k]} onChange={(e) => edit((p) => ({ ...p, captions: { ...p.captions, [k]: e.target.value } }))} />
                </label>
              ))}
            </div>
          ) : null}

          {tab === 'plan' ? <PlanPanel post={post} config={config} registry={registry} edit={edit} readOnly={readOnly} onReference={(f) => upload(`${base}/references`, f)} /> : null}

          {tab === 'export' ? (
            <div className="col">
              {!fresh ? <div className="issue warn">Not rendered for the current version. Click “Render + export”.</div> : <div className="ok-box">Rendered {manifest?.at ? formatBkk(manifest.at) : ''}: these files match the current content.</div>}
              {manifest?.zip ? <a className="btn primary" href={`/api/files/${post.brand}/${post.id}/export/${manifest.zip}`} download>Download ordered ZIP (PNGs + captions + sources + storyboard)</a> : null}
              <div className="row" style={{ gap: 6 }}>
                {manifest?.files.map((f) => <a key={f.name} className="btn sm" href={`/api/files/${post.brand}/${post.id}/export/${f.name}`} download={`${post.id}-${f.name}`}>{f.name}</a>)}
              </div>
              <div className="row">
                <a className="btn sm" href={`/api/files/${post.brand}/${post.id}/export/sources.md`} target="_blank" rel="noreferrer">Source notes</a>
                <a className="btn sm" href={`/api/files/${post.brand}/${post.id}/export/storyboard.md`} target="_blank" rel="noreferrer">Storyboard</a>
                <button className="btn sm" onClick={() => navigator.clipboard.writeText(post.captions.instagram)}>Copy IG caption</button>
                <button className="btn sm" onClick={() => navigator.clipboard.writeText(post.captions.facebook)}>Copy FB caption</button>
              </div>
            </div>
          ) : null}

          {tab === 'publish' ? (
            <PublishPanel post={post} manifest={manifest} fresh={fresh} publishing={publishing} busy={!!busy}
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
              <p className="muted small">Automatic checks cover structure, text fit (after rendering), spelling patterns, contrast, layouts, mascots and sources. Facts and Thai tone still need a human read.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ---------- pipeline: what is automated vs manual, and where each step stands ----------
function Pipeline({ post, issues, fresh, manifest, config, registry }: { post: Post; issues: Issue[]; fresh: boolean; manifest: Manifest; config: Config; registry: Registry }) {
  const mascotErr = issues.some((i) => i.level === 'error' && /mascot|provider/i.test(i.message));
  const srcOk = post.sources.length > 0 && post.sources.every((s) => s.checkedAt);
  const factOk = srcOk && post.slides.every((s) => s.story.basis !== 'source' || s.story.sourceIds.length > 0);
  const copyOk = post.slides.every((s) => s.title.trim()) && !!post.captions.instagram && !!post.captions.facebook;
  const boardOk = post.slides.every((s) => s.story.teachingPoint);
  const illusNeeded = post.slides.filter((s) => s.imagePrompt && !s.image).length;
  const gen = config.modes.generation === 'claude-code' ? 'Claude Code' : config.modes.generation === 'api' ? 'Claude API' : 'Claude chat';
  const steps: { name: string; who: string; kind: 'auto' | 'bridge' | 'you'; ok: boolean; note?: string }[] = [
    { name: 'Research', who: gen, kind: 'bridge', ok: srcOk },
    { name: 'Fact check', who: `${gen} + you`, kind: 'bridge', ok: factOk },
    { name: 'Thai copy', who: `${gen} + you`, kind: 'bridge', ok: copyOk },
    { name: 'Storyboard', who: gen, kind: 'bridge', ok: boardOk },
    { name: 'Assets', who: 'app (registry)', kind: 'auto', ok: !mascotErr },
    { name: 'Illustrations', who: illusNeeded ? 'you (ChatGPT/Fuzion)' : 'app layouts', kind: illusNeeded ? 'you' : 'auto', ok: !illusNeeded, note: illusNeeded ? `${illusNeeded} to upload` : undefined },
    { name: 'Render', who: 'app', kind: 'auto', ok: fresh },
    { name: 'QC', who: 'app + you', kind: 'auto', ok: !issues.some((i) => i.level === 'error') && fresh },
    { name: 'Export', who: 'app', kind: 'auto', ok: fresh && !!manifest?.zip },
    { name: 'Publish', who: config.modes.publishing === 'meta-api' ? 'Meta API' : 'you (manual kit)', kind: 'you', ok: post.status === 'published' },
  ];
  void registry;
  return (
    <div className="pipeline">
      {steps.map((s) => (
        <div key={s.name} className={`pstep ${s.ok ? 'ok' : ''}`} title={s.who}>
          <div className="row" style={{ gap: 6, justifyContent: 'space-between' }}>
            <b>{s.ok ? '✓' : '•'} {s.name}</b>
            <span className={`kind ${s.kind}`}>{s.kind === 'auto' ? 'auto' : s.kind === 'bridge' ? 'manual bridge' : 'you'}</span>
          </div>
          <span className="muted">{s.note ?? s.who}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- slide panel ----------
function SlidePanel(props: {
  slide: Slide; index: number; total: number; post: Post; config: Config; registry: Registry; readOnly: boolean; provIds: string[];
  onChange: (fn: (s: Slide) => Slide) => void; onType: (t: SlideType) => void; onMove: (d: number) => void; onDelete: () => void; onUpload: (f: File) => void;
}) {
  const { slide: s, post, config, registry, readOnly, onChange } = props;
  const [over, setOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const sp = slideProvider(post, s);
  const prov = findProvider(registry, sp);
  const mProv = findProvider(registry, s.mascot?.provider || sp);
  const set = (path: string, v: unknown) => onChange((x) => setAt(x, path, v));

  const field = (f: Field) => {
    const v = getAt(s, f.path);
    switch (f.k) {
      case 'text': return <label key={f.path}>{f.label}<input readOnly={readOnly} value={v ?? ''} onChange={(e) => set(f.path, e.target.value)} /></label>;
      case 'area': return <label key={f.path}>{f.label}<textarea readOnly={readOnly} rows={f.rows} value={v ?? ''} onChange={(e) => set(f.path, e.target.value)} /></label>;
      case 'number': return <label key={f.path}>{f.label}<input type="number" readOnly={readOnly} value={v ?? ''} onChange={(e) => set(f.path, e.target.value === '' ? undefined : Number(e.target.value))} /></label>;
      case 'bool': return <label key={f.path} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', fontWeight: 400 }}><input type="checkbox" style={{ width: 'auto' }} disabled={readOnly} checked={!!v} onChange={(e) => set(f.path, e.target.checked)} />{f.label}</label>;
      case 'select': return <label key={f.path}>{f.label}<select disabled={readOnly} value={v} onChange={(e) => set(f.path, e.target.value)}>{f.options.map((o) => <option key={o}>{o}</option>)}</select></label>;
      case 'lines': return <label key={f.path}>{f.label}<textarea readOnly={readOnly} rows={4} value={(v ?? []).join('\n')} onChange={(e) => set(f.path, e.target.value.split('\n'))} /></label>;
      case 'rows': {
        const rows = (v ?? []) as { label: string; cells: string[] }[];
        return (
          <div key={f.path} className="col" style={{ gap: 6 }}>
            <label>{f.label} <span className="small muted" style={{ fontWeight: 400 }}>(row label optional; cells separated by " | ")</span></label>
            {rows.map((r, i) => (
              <div key={i} className="row" style={{ flexWrap: 'nowrap' }}>
                <input readOnly={readOnly} style={{ width: 110 }} placeholder="label" value={r.label} onChange={(e) => set(f.path, rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <input readOnly={readOnly} value={r.cells.join(' | ')} onChange={(e) => set(f.path, rows.map((x, j) => (j === i ? { ...x, cells: e.target.value.split('|').map((c) => c.trim()) } : x)))} />
                <button className="btn sm danger" disabled={readOnly} onClick={() => set(f.path, rows.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button className="btn sm" style={{ alignSelf: 'flex-start' }} disabled={readOnly} onClick={() => set(f.path, [...rows, { label: '', cells: [] }])}>+ row</button>
          </div>
        );
      }
      case 'items': {
        const items = (v ?? []) as Record<string, unknown>[];
        return (
          <div key={f.path} className="col" style={{ gap: 6 }}>
            <label>{f.label}</label>
            {items.map((it, i) => (
              <div key={i} className="card col" style={{ padding: 8, gap: 6 }}>
                {f.sub.map((sb) =>
                  sb.kind === 'icon' ? (
                    <select key={sb.key} disabled={readOnly} value={String(it[sb.key] ?? 'spark')} onChange={(e) => set(f.path, items.map((x, j) => (j === i ? { ...x, [sb.key]: e.target.value } : x)))}>{ICONS.map((ic) => <option key={ic}>{ic}</option>)}</select>
                  ) : (
                    <input key={sb.key} readOnly={readOnly} type={sb.kind === 'number' ? 'number' : 'text'} step="any" placeholder={sb.label} value={String(it[sb.key] ?? '')} onChange={(e) => set(f.path, items.map((x, j) => (j === i ? { ...x, [sb.key]: sb.kind === 'number' ? Number(e.target.value) : e.target.value } : x)))} />
                  ),
                )}
                <button className="btn sm danger" style={{ alignSelf: 'flex-end' }} disabled={readOnly} onClick={() => set(f.path, items.filter((_, j) => j !== i))}>remove</button>
              </div>
            ))}
            {items.length < f.max ? <button className="btn sm" style={{ alignSelf: 'flex-start' }} disabled={readOnly} onClick={() => set(f.path, [...items, Object.fromEntries(f.sub.map((sb) => [sb.key, sb.kind === 'icon' ? 'spark' : sb.kind === 'number' ? 0 : '']))])}>+ add</button> : null}
          </div>
        );
      }
    }
  };

  // Manual bridge: everything an outside image tool needs, in one copy.
  const fullPrompt = s.imagePrompt
    ? [
        `Illustration for slide ${props.index + 1} of a Balena Studio carousel (1080×1350, portrait 4:5).`,
        `Subject: ${s.imagePrompt.trim()}`,
        `Brand style: ${config.imageStyle}`,
        `Topic accent: ${prov?.name ?? sp} ${prov?.accent ?? ''}. Use it sparingly for highlights only.`,
        s.imageIncludesMascot && mProv?.mascot
          ? `Mascot rules (${mProv.mascot.name}): ${mProv.rules.join(' ')} Attach the reference image provided and reproduce the character exactly. Do not restyle, recolour or redesign it.`
          : 'Do NOT draw any mascot, character, robot or logo. Balena Studio composites the approved mascot itself.',
        'No text, letters, numbers, UI text, logos or watermarks.',
      ].join('\n')
    : '';
  const takeFile = (f?: File | null) => { if (f && !readOnly) props.onUpload(f); };

  return (
    <div className="col" onPaste={(e) => takeFile(Array.from(e.clipboardData.files)[0])}>
      <div className="row">
        <select value={s.type} disabled={readOnly} onChange={(e) => props.onType(e.target.value as SlideType)} style={{ width: 'auto' }}>
          {SLIDE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <button className="btn sm" disabled={readOnly || props.index === 0} onClick={() => props.onMove(-1)}>↑</button>
        <button className="btn sm" disabled={readOnly || props.index === props.total - 1} onClick={() => props.onMove(1)}>↓</button>
        <button className="btn sm danger" disabled={readOnly || props.total <= 1} onClick={props.onDelete}>Delete</button>
      </div>
      {props.provIds.length > 1 ? (
        <label>Section provider (colours + mascot)
          <select disabled={readOnly} value={s.provider} onChange={(e) => set('provider', e.target.value)}>
            <option value="">post default ({post.provider})</option>
            {props.provIds.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
      ) : null}
      <p className="small muted" style={{ margin: 0 }}>Use <b>**…**</b> to highlight in the topic colour and new lines for line breaks.</p>
      {FIELDS[s.type].map(field)}

      <div className="card col" style={{ background: '#f8f9ff' }}>
        <h3 style={{ margin: 0 }}>Storyboard</h3>
        <label>Teaching point<input readOnly={readOnly} value={s.story.teachingPoint} onChange={(e) => set('story.teachingPoint', e.target.value)} /></label>
        <label>Visual composition<input readOnly={readOnly} value={s.story.composition} onChange={(e) => set('story.composition', e.target.value)} /></label>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <label style={{ flex: 1 }}>Claims rest on
            <select disabled={readOnly} value={s.story.basis} onChange={(e) => set('story.basis', e.target.value)}><option value="source">source</option><option value="advice">advice</option><option value="illustrative">illustrative</option></select>
          </label>
          <label style={{ flex: 1 }}>Source #s (comma)
            <input readOnly={readOnly} value={s.story.sourceIds.join(', ')} onChange={(e) => set('story.sourceIds', e.target.value.split(',').map((x) => parseInt(x.trim(), 10)).filter((x) => !isNaN(x)))} />
          </label>
        </div>
      </div>

      <div className="card col" style={{ background: '#fff8f4' }}>
        <h3 style={{ margin: 0 }}>Mascot · {mProv?.name ?? sp}</h3>
        {!mProv?.mascot ? <div className="issue warn">No mascot assigned for {mProv?.name ?? sp}. A labelled text badge is used; add an approved asset in the provider registry.</div> : null}
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8, fontWeight: 400 }}>
          <input type="checkbox" style={{ width: 'auto' }} disabled={readOnly} checked={!!s.mascot} onChange={(e) => set('mascot', e.target.checked ? { provider: '', pose: 'default', placement: s.type === 'cover' ? 'corner' : 'right', say: '' } : undefined)} />
          Show on this slide
        </label>
        {s.mascot ? (
          <>
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <label style={{ flex: 1 }}>Pose
                <select disabled={readOnly} value={s.mascot.pose} onChange={(e) => set('mascot.pose', e.target.value)}>
                  {(mProv?.mascot?.poses ?? [{ id: 'default', status: 'approved' }]).map((p) => <option key={p.id} value={p.id}>{p.id}{p.status !== 'approved' ? ' (proposed)' : ''}</option>)}
                </select>
              </label>
              <label style={{ flex: 1 }}>Placement
                <select disabled={readOnly} value={s.mascot.placement} onChange={(e) => set('mascot.placement', e.target.value)}><option value="right">right</option><option value="corner">corner (cover)</option></select>
              </label>
            </div>
            {mProv ? <div style={{ display: 'flex', justifyContent: 'center', padding: 8, background: '#fff', borderRadius: 10 }}><MascotArt brand={post.brand} provider={mProv} pose={s.mascot.pose} height={60} editing /></div> : null}
            <label>Tip bubble (≤ 40 chars)<input readOnly={readOnly} value={s.mascot.say} onChange={(e) => set('mascot.say', e.target.value)} /></label>
          </>
        ) : null}
      </div>

      <div className="card col" style={{ background: '#faf9ff' }}>
        <h3 style={{ margin: 0 }}>Illustration (manual bridge)</h3>
        <p className="small muted" style={{ margin: 0 }}>The app can’t call ChatGPT, Grok or Fuzion image generation (no supported integration). Generate it there, then upload it here. The text and layout stay editable.</p>
        <label>Illustration prompt (English, no text, no characters)<textarea readOnly={readOnly} rows={3} value={s.imagePrompt} onChange={(e) => set('imagePrompt', e.target.value)} /></label>
        <label style={{ flexDirection: 'row', gap: 8, alignItems: 'center', fontWeight: 400 }}>
          <input type="checkbox" style={{ width: 'auto' }} disabled={readOnly} checked={s.imageIncludesMascot} onChange={(e) => set('imageIncludesMascot', e.target.checked)} />
          The illustration itself must contain the mascot (not recommended: the app composites it)
        </label>
        {fullPrompt ? (
          <>
            <button className="btn sm" onClick={() => navigator.clipboard.writeText(fullPrompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}>{copied ? 'Copied ✓' : 'Copy illustration prompt + brand style + mascot rules'}</button>
            <div className="small">
              <b>Reference assets to attach:</b>{' '}
              {s.imageIncludesMascot && mProv?.mascot ? <a href={assetUrl(post.brand, mProv.mascot.reference)} download>{mProv.mascot.name} reference</a> : 'none needed'}
              {post.inputs.references.length ? <> · owner references: {post.inputs.references.map((r) => <a key={r} href={`/api/files/${post.brand}/${post.id}/references/${r}`} target="_blank" rel="noreferrer" style={{ marginRight: 6 }}>{r}</a>)}</> : null}
            </div>
          </>
        ) : null}
        <div className={`drop ${over ? 'over' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); takeFile(e.dataTransfer.files[0]); }}>
          {s.image ? <>Current: {s.image}<br /></> : null}
          Drop, paste (Ctrl/⌘+V) or{' '}
          <label style={{ display: 'inline', color: 'var(--a1)', cursor: 'pointer' }}>choose a file<input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={readOnly} onChange={(e) => takeFile(e.target.files?.[0])} /></label>
          {' '}for slide {props.index + 1}
        </div>
        {s.image ? <button className="btn sm danger" disabled={readOnly} onClick={() => set('image', '')}>Remove image from slide</button> : null}
      </div>
    </div>
  );
}

// ---------- plan, inputs & sources ----------
function PlanPanel({ post, config, registry, edit, readOnly, onReference }: { post: Post; config: Config; registry: Registry; edit: (fn: (p: Post) => Post) => void; readOnly: boolean; onReference: (f: File) => void }) {
  const set = (patch: Partial<Post>) => edit((p) => ({ ...p, ...patch }));
  return (
    <div className="col">
      <label>Working title<input readOnly={readOnly} value={post.title} onChange={(e) => set({ title: e.target.value })} /></label>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <label style={{ flex: 1 }}>Main provider
          <select disabled={readOnly} value={post.provider} onChange={(e) => set({ provider: e.target.value })}>{registry.providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </label>
        <label style={{ flex: 1 }}>Content type
          <select disabled={readOnly} value={post.contentType} onChange={(e) => set({ contentType: e.target.value as Post['contentType'] })}>{CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
      </div>
      <label>Also compared (comparison posts)
        <select multiple disabled={readOnly} value={post.providers} onChange={(e) => set({ providers: Array.from(e.target.selectedOptions).map((o) => o.value) })} style={{ height: 90 }}>
          {registry.providers.filter((p) => p.id !== post.provider).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label>Audience<input readOnly={readOnly} value={post.audience} onChange={(e) => set({ audience: e.target.value })} /></label>
      <label>Learning objective<textarea readOnly={readOnly} rows={2} value={post.objective} onChange={(e) => set({ objective: e.target.value })} /></label>
      <label>Main takeaway<textarea readOnly={readOnly} rows={2} value={post.takeaway} onChange={(e) => set({ takeaway: e.target.value })} /></label>
      <label>Pillar
        <select disabled={readOnly} value={post.pillar} onChange={(e) => set({ pillar: e.target.value })}>{[post.pillar, ...config.pillars.filter((p) => p !== post.pillar)].map((p) => <option key={p}>{p}</option>)}</select>
      </label>
      <label>Posting time (Asia/Bangkok)<input type="datetime-local" readOnly={readOnly} value={isoToBkkInput(post.scheduledAt)} onChange={(e) => set({ scheduledAt: bkkInputToIso(e.target.value) })} /></label>

      <h3>Inputs</h3>
      <div className="small muted">Topic: {post.inputs.topic || '—'} · Source URL: {post.inputs.sourceUrl ? <a href={post.inputs.sourceUrl} target="_blank" rel="noreferrer">{post.inputs.sourceUrl}</a> : '—'} · Planned slides: {post.inputs.slideCount}</div>
      <div className="small">Reference images (visual ideas only, never a fact source):{' '}
        {post.inputs.references.map((r) => <a key={r} href={`/api/files/${post.brand}/${post.id}/references/${r}`} target="_blank" rel="noreferrer" style={{ marginRight: 6 }}>{r}</a>)}
        <label style={{ display: 'inline', color: 'var(--a1)', cursor: 'pointer' }}>+ add<input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={readOnly} onChange={(e) => e.target.files?.[0] && onReference(e.target.files[0])} /></label>
      </div>

      <h3>Sources <span className="small muted">(primary sources; numbered for the storyboard)</span></h3>
      {post.sources.map((s, i) => (
        <div key={i} className="card col" style={{ padding: 10 }}>
          <b className="small">#{i + 1}</b>
          <input readOnly={readOnly} placeholder="What this source supports" value={s.claim} onChange={(e) => set({ sources: post.sources.map((x, j) => (j === i ? { ...x, claim: e.target.value } : x)) })} />
          <input readOnly={readOnly} placeholder="https://…" value={s.url} onChange={(e) => set({ sources: post.sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
          <div className="row">
            <input type="date" readOnly={readOnly} value={s.checkedAt} style={{ flex: 1 }} onChange={(e) => set({ sources: post.sources.map((x, j) => (j === i ? { ...x, checkedAt: e.target.value } : x)) })} />
            <input readOnly={readOnly} placeholder="how checked" value={s.how} style={{ flex: 1 }} onChange={(e) => set({ sources: post.sources.map((x, j) => (j === i ? { ...x, how: e.target.value } : x)) })} />
            {s.url ? <a className="btn sm" href={s.url} target="_blank" rel="noreferrer">Open ↗</a> : null}
            <button className="btn sm danger" disabled={readOnly} onClick={() => set({ sources: post.sources.filter((_, j) => j !== i) })}>✕</button>
          </div>
        </div>
      ))}
      <button className="btn sm" disabled={readOnly} onClick={() => set({ sources: [...post.sources, { claim: '', url: '', checkedAt: new Date().toISOString().slice(0, 10), how: '' }] })}>+ Add source</button>
      <label>"ข้อมูล ณ" date<input type="date" readOnly={readOnly} value={post.dataAsOf} onChange={(e) => set({ dataAsOf: e.target.value })} /></label>

      <h3>History</h3>
      <div className="small muted col" style={{ gap: 2 }}>{post.history.slice().reverse().map((h, i) => <span key={i}>{formatBkk(h.at)} · {h.event}</span>)}</div>
    </div>
  );
}

// ---------- publish (manual kit now; Meta API later) ----------
type Dups = { instagram: { permalink: string; scheduled_for_bkk: string }[]; facebook: { permalink: string; scheduled_for_bkk: string }[] };

function PublishPanel(props: {
  post: Post; manifest: Manifest; fresh: boolean; publishing: ModeInfo[]; busy: boolean;
  onSchedule: (note: string) => void;
  onRecord: (b: { platform: 'instagram' | 'facebook'; outcome: 'posted' | 'failed'; permalink: string; postId: string; note: string }) => void;
  checkDuplicates: () => Promise<Dups | null>;
}) {
  const { post, manifest, fresh } = props;
  const [dups, setDups] = useState<Dups | null>(null);
  const [form, setForm] = useState({ instagram: { permalink: '', postId: '', note: '' }, facebook: { permalink: '', postId: '', note: '' } });
  const approved = ['approved', 'scheduled', 'published', 'failed'].includes(post.status);
  useEffect(() => { if (approved) props.checkDuplicates().then(setDups); }, [approved]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!approved) return <div className="notice">Publishing is a separate step. It unlocks after the post is <b>approved</b> (review before publication is the default).</div>;
  return (
    <div className="col">
      <div className="notice"><b>Mode: manual posting kit.</b> {props.publishing.find((m) => m.id === 'meta-api')?.note}</div>
      <div><b>Post at:</b> {formatBkk(post.scheduledAt)} (Bangkok)</div>
      {!fresh ? <div className="issue error">The rendered files are out of date. Re-render and re-approve.</div> : null}
      <h3>1 · Slides (in order)</h3>
      <div className="row" style={{ gap: 6 }}>
        {manifest?.zip ? <a className="btn sm primary" href={`/api/files/${post.brand}/${post.id}/export/${manifest.zip}`} download>ZIP</a> : null}
        {manifest?.files.map((f) => <a key={f.name} className="btn sm" href={`/api/files/${post.brand}/${post.id}/export/${f.name}`} download={`${post.id}-${f.name}`}>{f.name}</a>)}
      </div>
      <h3>2 · Captions</h3>
      <div className="row">
        <button className="btn sm" onClick={() => navigator.clipboard.writeText(post.captions.instagram)}>Copy Instagram caption</button>
        <button className="btn sm" onClick={() => navigator.clipboard.writeText(post.captions.facebook)}>Copy Facebook caption</button>
        <button className="btn sm" onClick={() => navigator.clipboard.writeText(post.captions.altText)}>Copy alt text</button>
      </div>
      <h3>3 · Schedule it in Meta Business Suite</h3>
      {post.status === 'approved' ? <button className="btn" disabled={props.busy} onClick={() => props.onSchedule('in Meta Business Suite')}>I scheduled it in Meta Business Suite</button> : null}
      <h3>4 · After it goes live, record the link</h3>
      {(['instagram', 'facebook'] as const).map((pl) => {
        const rec = post.publish[pl];
        const d = dups?.[pl] ?? [];
        return (
          <div key={pl} className="card col" style={{ padding: 10 }}>
            <b>{pl === 'instagram' ? 'Instagram' : 'Facebook'}</b>
            {d.length ? <div className="issue error">Possible duplicate: already posted ({d.map((x) => x.permalink || x.scheduled_for_bkk).join(', ')}).</div> : null}
            {rec.status !== 'none' ? (
              <div className={rec.status === 'posted' ? 'ok-box' : 'issue error'}>{rec.status} · {rec.permalink ? <a href={rec.permalink} target="_blank" rel="noreferrer">{rec.permalink}</a> : rec.note}</div>
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
