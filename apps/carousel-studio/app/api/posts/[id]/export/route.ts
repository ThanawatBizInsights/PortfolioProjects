import { NextResponse } from 'next/server';
import { getPost } from '@/lib/store';
import { exportPost } from '@/lib/exporter';
import { brandOf, fail } from '@/lib/http';

export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const post = await getPost(brandOf(req), (await params).id);
    // Render via this same server (works locally and behind a proxy).
    const base = process.env.RENDER_BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3100}`;
    return NextResponse.json(await exportPost(post, base));
  } catch (e) {
    return fail(e);
  }
}
