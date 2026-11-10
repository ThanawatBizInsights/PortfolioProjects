import { NextResponse } from 'next/server';
import { getPost } from '@/lib/store';
import { applyAction, type Action } from '@/lib/workflow';
import { brandOf, fail } from '@/lib/http';

const ACTIONS: Action[] = ['submit', 'approve', 'schedule', 'back-to-draft', 'mark-failed'];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { action, note } = await req.json();
    if (!ACTIONS.includes(action)) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    const post = await getPost(brandOf(req), (await params).id);
    return NextResponse.json(await applyAction(post, action, String(note ?? '')));
  } catch (e) {
    return fail(e);
  }
}
