'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bkkInputToIso } from '@/lib/time';
import type { ModeInfo } from '@/lib/modes';

type Props = { brand: string; pillars: string[]; defaultMode: string; modes: ModeInfo[]; initialTime: string };

export function NewPostForm({ brand, pillars, defaultMode, modes, initialTime }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState(defaultMode);
  const [topic, setTopic] = useState('');
  const [pillar, setPillar] = useState(pillars[0] ?? '');
  const [notes, setNotes] = useState('');
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
              <button className="btn" disabled={busy || !topic.trim()} onClick={async () => {
                const d = await call('/api/claude-prompt', { topic, pillar, notes, scheduledAt });
                if (d) setBrief(d.prompt);
              }}>1 · Build the brief</button>
              {brief ? <button className="btn" onClick={() => navigator.clipboard.writeText(brief).then(() => setMsg({ kind: 'ok', text: 'Brief copied. Paste it into Claude (turn on web search).' }))}>2 · Copy brief</button> : null}
              <a className="btn" href="https://claude.ai/new" target="_blank" rel="noreferrer">3 · Open Claude ↗</a>
            </div>
            {brief ? <textarea readOnly value={brief} style={{ minHeight: 140, fontSize: 12 }} /> : null}
            <label>4 · Paste Claude’s JSON answer here
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} style={{ minHeight: 160, fontFamily: 'monospace', fontSize: 12 }} placeholder='{"title": "...", "slides": [...], ...}' />
            </label>
            <button className="btn primary" disabled={busy || !answer.trim()} onClick={async () => {
              const p = await call('/api/posts', { mode: 'import', text: answer, pillar, scheduledAt, topic, generation: 'claude-chat' });
              if (p) router.push(`/posts/${p.id}`);
            }}>5 · Import draft → open editor</button>
          </div>
        ) : null}

        {mode === 'claude-code' ? (
          <button className="btn primary" disabled={busy || !topic.trim()} onClick={async () => {
            const d = await call('/api/queue', { topic, pillar, notes });
            if (d) setMsg({ kind: 'ok', text: 'Queued. Ask Claude Code to "draft the queued carousels"; the draft will show up on the calendar.' });
          }}>Add to Claude Code queue</button>
        ) : null}

        {mode === 'blank' ? (
          <button className="btn primary" disabled={busy || !topic.trim()} onClick={async () => {
            const p = await call('/api/posts', { mode: 'blank', title: topic, pillar, scheduledAt });
            if (p) router.push(`/posts/${p.id}`);
          }}>Create blank carousel</button>
        ) : null}

        {msg ? <div className={msg.kind === 'error' ? 'issue error' : 'ok-box'}>{msg.text}</div> : null}
      </div>
    </div>
  );
}
