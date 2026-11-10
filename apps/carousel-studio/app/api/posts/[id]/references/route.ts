import fs from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { getPost, postFile, writePost } from '@/lib/store';
import { brandOf, fail } from '@/lib/http';
import { nowIso } from '@/lib/time';

const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

// Optional reference images for a post (visual ideas only; facts in them must be verified separately).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const brand = brandOf(req);
    const id = (await params).id;
    const file = (await req.formData()).get('file');
    if (!(file instanceof File) || !TYPES[file.type]) return NextResponse.json({ error: 'Use PNG, JPEG or WebP' }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'Over 15 MB' }, { status: 400 });
    const post = await getPost(brand, id);
    const name = `ref-${Date.now()}.${TYPES[file.type]}`;
    await fs.mkdir(postFile(brand, id, 'references'), { recursive: true });
    await fs.writeFile(postFile(brand, id, 'references', name), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json(await writePost({ ...post, inputs: { ...post.inputs, references: [...post.inputs.references, name] }, history: [...post.history, { at: nowIso(), event: `reference image added: ${name}` }] }));
  } catch (e) {
    return fail(e);
  }
}
