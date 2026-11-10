import { NextResponse } from 'next/server';
import { exportIsFresh, getConfig, getPost } from '@/lib/store';
import { PostSchema } from '@/lib/schema';
import { saveEdits } from '@/lib/workflow';
import { runQc } from '@/lib/qc';
import { brandOf, fail } from '@/lib/http';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  try {
    const brand = brandOf(req);
    const post = await getPost(brand, (await params).id);
    const config = await getConfig(brand);
    const exportFresh = await exportIsFresh(post);
    return NextResponse.json({ post, exportFresh, issues: runQc(post, config, { exportFresh }) });
  } catch (e) {
    return fail(e);
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const brand = brandOf(req);
    const prev = await getPost(brand, (await params).id);
    if (prev.status === 'published') return NextResponse.json({ error: 'Published posts are read-only.' }, { status: 409 });
    const incoming = PostSchema.parse(await req.json());
    const post = await saveEdits(prev, incoming);
    const config = await getConfig(brand);
    const exportFresh = await exportIsFresh(post);
    return NextResponse.json({ post, exportFresh, issues: runQc(post, config, { exportFresh }) });
  } catch (e) {
    return fail(e);
  }
}
