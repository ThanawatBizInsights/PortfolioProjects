import fs from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { getPost, postFile } from '@/lib/store';
import { saveEdits } from '@/lib/workflow';
import { brandOf, fail } from '@/lib/http';

const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const MAX = 15 * 1024 * 1024;

// multipart/form-data: file, slide (index). Saves to images/ and links it to the slide.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const brand = brandOf(req);
    const id = (await params).id;
    const form = await req.formData();
    const file = form.get('file');
    const slide = Number(form.get('slide'));
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
    const ext = TYPES[file.type];
    if (!ext) return NextResponse.json({ error: 'Use PNG, JPEG or WebP' }, { status: 400 });
    if (file.size > MAX) return NextResponse.json({ error: 'Image is over 15 MB' }, { status: 400 });
    const prev = await getPost(brand, id);
    if (!prev.slides[slide]) return NextResponse.json({ error: 'No such slide' }, { status: 400 });
    const name = `slide-${String(slide + 1).padStart(2, '0')}-${Date.now()}.${ext}`;
    await fs.mkdir(postFile(brand, id, 'images'), { recursive: true });
    await fs.writeFile(postFile(brand, id, 'images', name), Buffer.from(await file.arrayBuffer()));
    const slides = prev.slides.map((s, i) => (i === slide ? { ...s, image: name } : s));
    const post = await saveEdits(prev, { ...prev, slides });
    return NextResponse.json(post);
  } catch (e) {
    return fail(e);
  }
}
