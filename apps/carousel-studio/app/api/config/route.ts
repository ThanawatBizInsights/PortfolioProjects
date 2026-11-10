import { NextResponse } from 'next/server';
import { getConfig, saveConfig } from '@/lib/store';
import { ConfigSchema } from '@/lib/schema';
import { generationModes, imageModes, publishingModes } from '@/lib/modes';
import { brandOf, fail } from '@/lib/http';

export async function GET(req: Request) {
  try {
    return NextResponse.json({ config: await getConfig(brandOf(req)), modes: { generation: generationModes(), images: imageModes(), publishing: publishingModes() } });
  } catch (e) {
    return fail(e);
  }
}

export async function PUT(req: Request) {
  try {
    const brand = brandOf(req);
    const incoming = ConfigSchema.parse(await req.json());
    if (incoming.brand !== brand) return NextResponse.json({ error: 'Brand mismatch' }, { status: 400 });
    // Unavailable automated modes can't be switched on from the UI.
    const avail = { generation: generationModes(), images: imageModes(), publishing: publishingModes() };
    for (const k of ['generation', 'images', 'publishing'] as const) {
      const m = avail[k].find((x) => x.id === incoming.modes[k]);
      if (!m?.available) return NextResponse.json({ error: `${k}: "${incoming.modes[k]}" isn't available yet` }, { status: 400 });
    }
    if (incoming.automation.enabled) return NextResponse.json({ error: 'Automatic publishing stays off until it is approved in automation.md (Phase 4).' }, { status: 400 });
    return NextResponse.json(await saveConfig(incoming));
  } catch (e) {
    return fail(e);
  }
}
