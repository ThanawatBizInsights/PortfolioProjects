'use client';
import { useState } from 'react';
import type { Config } from '@/lib/schema';
import type { ModeInfo } from '@/lib/modes';
import { DAYS } from '@/lib/time';

type Modes = { generation: ModeInfo[]; images: ModeInfo[]; publishing: ModeInfo[] };

export function SettingsForm({ initial, modes }: { initial: Config; modes: Modes }) {
  const [c, setC] = useState(initial);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const set = (patch: Partial<Config>) => setC({ ...c, ...patch });

  async function save() {
    setMsg(null);
    const r = await fetch(`/api/config?brand=${c.brand}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(c) });
    const d = await r.json();
    if (!r.ok) setMsg({ kind: 'error', text: d.error });
    else { setC(d); setMsg({ kind: 'ok', text: 'Saved to carousel.config.json' }); }
  }

  const modeGroup = (key: keyof Config['modes'], title: string, list: ModeInfo[]) => (
    <div className="col" style={{ gap: 6 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {list.map((m) => (
        <label key={m.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', fontWeight: 400, color: m.available ? 'var(--ink)' : 'var(--muted)' }}>
          <input type="radio" style={{ width: 'auto', marginTop: 4 }} disabled={!m.available} checked={c.modes[key] === m.id} onChange={() => set({ modes: { ...c.modes, [key]: m.id } as Config['modes'] })} />
          <span><b>{m.label}</b>{!m.available ? ' · later' : ''}<br /><span className="small muted">{m.note}</span></span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="col" style={{ gap: 18, maxWidth: 900 }}>
      <h1>Settings · {c.brand}</h1>

      <div className="card col">
        <h2>Brand</h2>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <label style={{ flex: 1 }}>Name on slides<input value={c.displayName} onChange={(e) => set({ displayName: e.target.value })} /></label>
          <label style={{ flex: 1 }}>Facebook Page name<input value={c.pageName} onChange={(e) => set({ pageName: e.target.value })} /></label>
        </div>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <label style={{ flex: 1 }}>Instagram handle (shown on slides)<input value={c.instagramHandle} placeholder="@yourhandle" onChange={(e) => set({ instagramHandle: e.target.value })} /></label>
          <label style={{ flex: 1 }}>Ending particles
            <select value={c.particles} onChange={(e) => set({ particles: e.target.value as Config['particles'] })}>
              <option value="unset">Not decided (writer uses none)</option>
              <option value="none">None</option>
              <option value="ครับ">ครับ</option>
              <option value="ค่ะ">ค่ะ</option>
            </select>
          </label>
        </div>
        <label>Image style (appended to every image prompt)<textarea rows={3} value={c.imageStyle} onChange={(e) => set({ imageStyle: e.target.value })} /></label>
        <div className="row">
          {(['accent1', 'accent2', 'ink', 'bg2'] as const).map((k) => (
            <label key={k} style={{ width: 120 }}>{k}<input type="color" value={c.colors[k]} onChange={(e) => set({ colors: { ...c.colors, [k]: e.target.value } })} style={{ height: 38, padding: 2 }} /></label>
          ))}
        </div>
      </div>

      <div className="card col">
        <h2>Mascot</h2>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8, fontWeight: 400 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={c.mascot.enabled} onChange={(e) => set({ mascot: { ...c.mascot, enabled: e.target.checked } })} />
          Use the pixel whale mascot on slides and in the app
        </label>
        <div className="row">
          <label style={{ flex: 1 }}>Name<input value={c.mascot.name} onChange={(e) => set({ mascot: { ...c.mascot, name: e.target.value } })} /></label>
          <label style={{ width: 120 }}>Body<input type="color" value={c.mascot.body} onChange={(e) => set({ mascot: { ...c.mascot, body: e.target.value } })} style={{ height: 38, padding: 2 }} /></label>
          <label style={{ width: 120 }}>Belly<input type="color" value={c.mascot.belly} onChange={(e) => set({ mascot: { ...c.mascot, belly: e.target.value } })} style={{ height: 38, padding: 2 }} /></label>
        </div>
      </div>

      <div className="card col">
        <h2>Posting slots (Asia/Bangkok)</h2>
        {c.slots.map((s, i) => (
          <div key={i} className="row">
            <select style={{ width: 90 }} value={s.day} onChange={(e) => set({ slots: c.slots.map((x, j) => (j === i ? { ...x, day: e.target.value as typeof s.day } : x)) })}>
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <input type="time" style={{ width: 120 }} value={s.time} onChange={(e) => set({ slots: c.slots.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)) })} />
            <input style={{ flex: 1, width: 'auto' }} value={s.pillar} placeholder="pillar focus" onChange={(e) => set({ slots: c.slots.map((x, j) => (j === i ? { ...x, pillar: e.target.value } : x)) })} />
            <button className="btn sm danger" onClick={() => set({ slots: c.slots.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => set({ slots: [...c.slots, { day: 'Mon', time: '12:00', pillar: '' }] })}>+ Add slot</button>
      </div>

      <div className="card col" style={{ gap: 16 }}>
        <h2>Workflow modes (manual now, automatic later)</h2>
        {modeGroup('generation', 'Writing', modes.generation)}
        {modeGroup('images', 'Images', modes.images)}
        {modeGroup('publishing', 'Publishing', modes.publishing)}
        <div className="notice">Automatic publishing: <b>off</b>. It can only be turned on once its accounts, topics, frequency and limits are approved in <code>brands/{c.brand}/automation.md</code>.</div>
      </div>

      <div className="row">
        <button className="btn primary" onClick={save}>Save settings</button>
        {msg ? <span className={msg.kind === 'error' ? 'issue error' : 'ok-box'}>{msg.text}</span> : null}
      </div>
    </div>
  );
}
