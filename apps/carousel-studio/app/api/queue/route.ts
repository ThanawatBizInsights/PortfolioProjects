import { NextResponse } from 'next/server';
import { addToQueue, getQueue } from '@/lib/store';
import { brandOf, fail } from '@/lib/http';

export async function GET(req: Request) {
  try {
    return NextResponse.json(await getQueue(brandOf(req)));
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const { topic = '', pillar = '', notes = '' } = await req.json();
    if (!String(topic).trim()) return NextResponse.json({ error: 'Enter a topic first' }, { status: 400 });
    return NextResponse.json(await addToQueue(brandOf(req), { topic, pillar, notes }), { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
