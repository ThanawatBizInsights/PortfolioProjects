import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/store';
import { buildClaudeBrief } from '@/lib/claudePrompt';
import { brandOf, fail } from '@/lib/http';

export async function POST(req: Request) {
  try {
    const brand = brandOf(req);
    const { topic = '', pillar = '', notes = '', scheduledAt = '' } = await req.json();
    if (!String(topic).trim()) return NextResponse.json({ error: 'Enter a topic first' }, { status: 400 });
    const prompt = await buildClaudeBrief(await getConfig(brand), { topic, pillar, notes, scheduledAt });
    return NextResponse.json({ prompt });
  } catch (e) {
    return fail(e);
  }
}
