'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bkkInputToIso } from '@/lib/time';
import type { ModeInfo } from '@/lib/modes';

type Props = { brand: string; pillars: string[]; defaultMode: string; modes: ModeInfo[]; initialTime: string; providers: { id: string; name: string; hasMascot: boolean }[] };
const TYPES = ['tutorial', 'concept', 'news', 'pricing', 'comparison', 'tips'];

export function NewPostForm({ brand, pillars, defaultMode, modes, initialTime, providers }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState(defaultMode);
  const [topic, setTopic] = useState('');
  const [pillar, setPillar] = useState(pillars[0] ?? '');
  const [notes, setNotes] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [provider, setProvider] = useState(providers[0]?.id ?? 'general');
  const [compared, setCompared] = useState<string[]>([]);
  const [audience, setAudience] = useState('');
  const [objective, setObjective] = useState('');
  const [contentType, setContentType] = useState('tutorial');
  const [slideCount, setSlideCount] = useState(7);
  const [when, setWhen] = useState(initialTime);
  const [brief, setBrief] = useState('');
  const [answer, setAnswer] = useState('');
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const q = `?brand=${brand}`;
  const scheduledAt = bkkInputToIso(when);

  async function call(url: string, body: unknown) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(url + q, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Request failed');
      return data;
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
      return null;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="col" style={{ gap: 18, maxWidth: 920 }}>
      <h1>New carousel</h1>

      <div className="card col">
        <label>Topic (what should this carousel teach?)
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. 5 เทคนิคเขียน prompt ให้ Claude เข้าใจ ตามคู่มือของ Anthropic" />
        </label>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <label style={{ flex: 1 }}>Pillar
            <select value={pillar} onChange={(e) => setPillar(e.target.value)}>
              {pillars.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label style={{ flex: 1 }}>Posting time (Asia/Bangkok)
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </label>
        </div>
        <label>…or a source URL (official page to build the post from)
          <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" />
        </label>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <label style={{ flex: 1 }}>AI provider (sets the mascot + topic colours)
            <select value={provider} onChange={(e) => setProvider(e.target.value)}>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}{p.hasMascot ? '' : ' (no mascot yet)'}</option>)}
            </select>
          </label>
          <label style={{ flex: 1 }}>Content type
            <select value={contentType} onChange={(e) => setContentType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
          <label style={{ width: 120 }}>Slides
            <input type="number" min={3} max={10} value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))} />
          </label>
        </div>
        {contentType === 'comparison' ? (
          <label>Also compared
            <select multiple value={compared} onChange={(e) => setCompared(Array.from(e.target.selectedOptions).map((o) => o.value))} style={{ height: 90 }}>
              {providers.filter((p) => p.id !== provider).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        ) : null}
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <label style={{ flex: 1 }}>Audience<input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. คนที่ยังไม่เคยใช้ Claude" /></label>
          <label style={{ flex: 1 }}>Learning objective<input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="What should they be able to do after?" /></label>
        </div>
        <label>Notes for the writer (optional)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Angle, examples to include, things to avoid…" />
        </label>
      </div>

      <div className="card col">
        <h2>How should the first draft be written?</h2>
        <div className="tabs">
          {modes.map((m) => (
            <button key={m.id} className={`tab ${mode === m.id ? 'active' : ''}`} disabled={!m.available} onClick={() => setMode(m.id)} title={m.note}>
              {m.label}{!m.available ? ' (later)' : ''}
            </button>
          ))}
          <button className={`tab ${mode === 'blank' ? 'active' : ''}`} onClick={() => setMode('blank')}>Blank template</button>
        </div>
        <p className="muted small">{modes.find((m) => m.id === mode)?.note ?? 'Start from an empty 7-slide template and write it yourself.'}</p>

        {mode === 'claude-chat' ? (
          <div className="col">
            <div className="row">
              <button className="btn" disabled={busy || (!topic.trim() && !sourceUrl.trim())} onClick={async () => {
                const d = await call('/api/claude-prompt', { topic, sourceUrl, provider, providers: compared, audience, objective, contentType, slideCount, pillar, notes, scheduledAt });
                if (d) setBrief(d.prompt);
              }}>1 · Build the brief</button>
              {brief ? <button className="btn" onClick={() => navigator.clipboard.writeText(brief).then(() => setMsg({ kind: 'ok', text: 'Brief copied. Paste it into Claude with web search on, and attach any reference images there too.' }))}>2 · Copy brief</button> : null}
              <a className="btn" href="https://claude.ai/new" target="_blank" rel="noreferrer">3 · Open Claude ↗</a>
            </div>
            {brief ? <textarea readOnly value={brief} style={{ minHeight: 140, fontSize: 12 }} /> : null}
            <label>4 · Paste Claude’s JSON answer here
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} style={{ minHeight: 160, fontFamily: 'monospace', fontSize: 12 }} placeholder='{"title": "...", "slides": [...], ...}' />
            </label>
            <button className="btn primary" disabled={busy || !answer.trim()} onClick={async () => {
              const p = await call('/api/posts', { mode: 'import', text: answer, pillar, scheduledAt, topic, sourceUrl, provider, slideCount, generation: 'claude-chat' });
              if (p) router.push(`/posts/${p.id}`);
            }}>5 · Import draft → open editor</button>
          </div>
        ) : null}

        {mode === 'claude-code' ? (
          <button className="btn primary" disabled={busy || !topic.trim()} onClick={async () => {
            const d = await call('/api/queue', { topic: topic || sourceUrl, pillar, notes: JSON.stringify({ notes, sourceUrl, provider, providers: compared, audience, objective, contentType, slideCount }) });
            if (d) setMsg({ kind: 'ok', text: 'Queued. Ask Claude Code to "draft the queued carousels"; the draft will show up on the calendar.' });
          }}>Add to Claude Code queue</button>
        ) : null}

        {mode === 'blank' ? (
          <button className="btn primary" disabled={busy || !topic.trim()} onClick={async () => {
            const p = await call('/api/posts', { mode: 'blank', title: topic, pillar, scheduledAt, provider, contentType, audience, objective, sourceUrl, slideCount });
            if (p) router.push(`/posts/${p.id}`);
          }}>Create blank carousel</button>
        ) : null}

        {msg ? <div className={msg.kind === 'error' ? 'issue error' : 'ok-box'}>{msg.text}</div> : null}
      </div>
    </div>
  );
}
