'use client';
// The live mascot for the app UI: blinks, glides its eyes, talks when the message changes,
// bobs gently and tilts its head when thinking.
import { useEffect, useRef, useState } from 'react';
import { PixelWhale, type Mood } from './PixelWhale';

type Props = {
  mood: Mood;
  say: string;
  look?: { x: number; y: number };
  colors: { body: string; belly: string; ink: string };
  size?: number;
  bubble?: 'right' | 'below';
};

export function MascotBuddy({ mood, say, look = { x: 0, y: 0 }, colors, size = 120, bubble = 'right' }: Props) {
  const [blink, setBlink] = useState(false);
  const [talking, setTalking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [t, setT] = useState(0);
  const lastSay = useRef('');

  // blink at a natural, slightly random rhythm
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      timer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        loop();
      }, 2200 + Math.random() * 2600);
    };
    loop();
    return () => clearTimeout(timer);
  }, []);

  // talk for a moment whenever the message changes
  useEffect(() => {
    if (!say || say === lastSay.current) return;
    lastSay.current = say;
    setTalking(true);
    const flap = setInterval(() => setMouthOpen((o) => !o), 140);
    const stop = setTimeout(() => { setTalking(false); setMouthOpen(false); clearInterval(flap); }, Math.min(400 + say.length * 45, 2600));
    return () => { clearInterval(flap); clearTimeout(stop); };
  }, [say]);

  // gentle bob + think tilt
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => { setT((now - start) / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const shownMood: Mood = talking && mood !== 'surprised' ? 'talk' : mood;
  const bob = Math.sin(t * 2.2) * 3;
  const tilt = mood === 'think' ? -6 + Math.sin(t * 1.3) * 2 : mood === 'happy' ? Math.sin(t * 3) * 2 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: bubble === 'below' ? 'column' : 'row', alignItems: 'center', gap: 14 }}>
      <div style={{ transform: `translateY(${bob}px)`, flex: 'none' }}>
        <PixelWhale mood={shownMood} look={look} size={size} blink={blink} mouthOpen={talking ? mouthOpen : undefined} tilt={tilt} colors={colors} />
      </div>
      {say ? (
        <div
          role="status"
          style={{ position: 'relative', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '10px 14px', fontWeight: 600, fontSize: 14, lineHeight: 1.5, boxShadow: '0 6px 20px rgba(30,30,90,0.08)', maxWidth: bubble === 'below' ? 420 : 260, textAlign: bubble === 'below' ? 'center' : 'left' }}
        >
          {say}
        </div>
      ) : null}
    </div>
  );
}
