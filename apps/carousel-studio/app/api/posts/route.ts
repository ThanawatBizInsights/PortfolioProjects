import { NextResponse } from 'next/server';
import { createPost, listPosts } from '@/lib/store';
import { DraftSchema, type Slide } from '@/lib/schema';
import { brandOf, extractJson, fail } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    return NextResponse.json(await listPosts(brandOf(req)));
  } catch (e) {
    return fail(e);
  }
}

const BLANK: Slide[] = [
  { type: 'cover', kicker: '', title: 'หัวข้อหลัก\n**คำสำคัญ**', subtitle: '', imagePrompt: '', image: '' },
  { type: 'statement', title: 'ทำไมเรื่องนี้สำคัญ', body: '', imagePrompt: '', image: '' },
  { type: 'step', number: 1, title: 'ข้อที่ 1', body: '', imagePrompt: '', image: '' },
  { type: 'step', number: 2, title: 'ข้อที่ 2', body: '', imagePrompt: '', image: '' },
  { type: 'step', number: 3, title: 'ข้อที่ 3', body: '', imagePrompt: '', image: '' },
  { type: 'prompt', title: 'ลองใช้ prompt นี้', prompt: '', note: '', imagePrompt: '', image: '' },
  { type: 'summary', title: 'สรุป', bullets: [''], cta: 'เซฟไว้ลองทำ', imagePrompt: '', image: '' },
];

// Body: { mode: 'blank', title, pillar, scheduledAt } or { mode: 'import', text, pillar?, scheduledAt?, generation }
export async function POST(req: Request) {
  try {
    const brand = brandOf(req);
    const body = await req.json();
    if (body.mode === 'import') {
      const draft = DraftSchema.parse(extractJson(String(body.text ?? '')));
      const post = await createPost(brand, {
        ...draft,
        pillar: draft.pillar || body.pillar || '',
        scheduledAt: body.scheduledAt || '',
        status: 'draft',
        generation: { mode: body.generation === 'claude-code' ? 'claude-code' : 'claude-chat', notes: body.topic ?? '' },
      });
      return NextResponse.json(post, { status: 201 });
    }
    const post = await createPost(brand, {
      title: String(body.title || 'Untitled carousel'),
      pillar: String(body.pillar || ''),
      scheduledAt: String(body.scheduledAt || ''),
      slides: BLANK,
      status: 'draft',
      generation: { mode: 'manual', notes: '' },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
