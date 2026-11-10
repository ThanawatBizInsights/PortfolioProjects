import { NextResponse } from 'next/server';
import { getRegistry, saveRegistry } from '@/lib/store';
import { brandOf, fail } from '@/lib/http';

export async function GET(req: Request) {
  try {
    return NextResponse.json(await getRegistry(brandOf(req)));
  } catch (e) {
    return fail(e);
  }
}

// Only pose approval can change from the UI: { provider, pose, status: 'approved'|'proposed' }.
// Adding or replacing mascot assets is a file change in the brand folder, reviewed like code.
export async function PUT(req: Request) {
  try {
    const brand = brandOf(req);
    const { provider, pose, status } = await req.json();
    if (!['approved', 'proposed'].includes(status)) return NextResponse.json({ error: 'Bad status' }, { status: 400 });
    const reg = await getRegistry(brand);
    const p = reg.providers.find((x) => x.id === provider);
    const ps = p?.mascot?.poses.find((x) => x.id === pose);
    if (!ps) return NextResponse.json({ error: 'Unknown provider or pose' }, { status: 404 });
    if (pose === 'default' && status !== 'approved') return NextResponse.json({ error: 'The canonical default pose stays approved.' }, { status: 400 });
    ps.status = status;
    return NextResponse.json(await saveRegistry(brand, reg));
  } catch (e) {
    return fail(e);
  }
}
