import { NextResponse } from 'next/server';
import { getConfig, getRegistry } from '@/lib/store';
import { buildClaudeBrief } from '@/lib/claudePrompt';
import { brandOf, fail } from '@/lib/http';

export async function POST(req: Request) {
  try {
    const brand = brandOf(req);
    const b = await req.json();
    if (!String(b.topic ?? '').trim() && !String(b.sourceUrl ?? '').trim()) return NextResponse.json({ error: 'Enter a topic or a source URL first' }, { status: 400 });
    const prompt = await buildClaudeBrief(await getConfig(brand), await getRegistry(brand), {
      topic: String(b.topic ?? ''), sourceUrl: String(b.sourceUrl ?? ''), provider: String(b.provider || 'general'), providers: Array.isArray(b.providers) ? b.providers.map(String) : [],
      audience: String(b.audience ?? ''), objective: String(b.objective ?? ''), contentType: String(b.contentType || 'tutorial'), slideCount: Number(b.slideCount) || 7,
      notes: String(b.notes ?? ''), scheduledAt: String(b.scheduledAt ?? ''), references: Number(b.references) || 0,
    });
    return NextResponse.json({ prompt });
  } catch (e) {
    return fail(e);
  }
}
