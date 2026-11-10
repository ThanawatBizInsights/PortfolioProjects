import { NextResponse } from 'next/server';
import { exportIsFresh, getConfig, getManifest, getPost, getRegistry } from '@/lib/store';
import { PostSchema } from '@/lib/schema';
import { saveEdits } from '@/lib/workflow';
import { runQc } from '@/lib/qc';
import { brandOf, fail } from '@/lib/http';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

async function state(brand: string, post: Awaited<ReturnType<typeof getPost>>) {
  const [config, registry, manifest, exportFresh] = await Promise.all([getConfig(brand), getRegistry(brand), getManifest(brand, post.id), exportIsFresh(post)]);
  return { post, exportFresh, manifest, issues: runQc(post, config, registry, { exportFresh, layoutIssues: manifest?.layoutIssues }) };
}

export async function GET(req: Request, { params }: Ctx) {
  try {
    const brand = brandOf(req);
    const post = await getPost(brand, (await params).id);
    return NextResponse.json(await state(brand, post));
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
    return NextResponse.json(await state(brand, post));
  } catch (e) {
    return fail(e);
  }
}
