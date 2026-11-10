import { NextResponse } from 'next/server';
import { createPost, listPosts } from '@/lib/store';
import { DraftSchema, SlideSchema, type Slide } from '@/lib/schema';
import { brandOf, extractJson, fail } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    return NextResponse.json(await listPosts(brandOf(req)));
  } catch (e) {
    return fail(e);
  }
}

const BLANK: Slide[] = SlideSchema.array().parse([
  { type: 'cover', kicker: 'หัวข้อ', title: 'หัวข้อหลัก\n**คำสำคัญ**', subtitle: '', visual: 'chat', chat: { user: '', reply: '' }, mascot: { pose: 'default', placement: 'corner' }, story: { teachingPoint: 'Hook + promise', composition: 'Title left, chat mock below, mascot in the corner' } },
  { type: 'concept', title: 'คืออะไร / อะไรเปลี่ยน', definition: '', points: [{ icon: 'spark', label: '', text: '' }, { icon: 'target', label: '', text: '' }, { icon: 'bulb', label: '', text: '' }], story: { teachingPoint: 'Definition or what changed' } },
  { type: 'flow', title: 'ทำงานยังไง', intro: '', steps: [{ icon: 'chat', label: '', text: '' }, { icon: 'refresh', label: '', text: '' }, { icon: 'check', label: '', text: '' }], story: { teachingPoint: 'Visual explanation' } },
  { type: 'example', title: 'ตัวอย่างจริง', prompt: '', annotations: [], reply: [], replyNote: 'ตัวอย่างคำตอบ (สมมติ)', story: { teachingPoint: 'Practical example', basis: 'illustrative' } },
  { type: 'howto', title: 'วิธีใช้', items: [{ icon: 'plus', ui: '', label: '', text: '' }], story: { teachingPoint: 'How to use it' } },
  { type: 'compare', title: 'พลาดบ่อย', style: 'avoid-better', columns: ['เลี่ยงแบบนี้', 'ลองแบบนี้แทน'], rows: [{ label: '', cells: ['', ''] }], story: { teachingPoint: 'Limitations or common mistakes' } },
  { type: 'recap', title: 'สรุป', items: [''], cta: 'เซฟไว้ลองทำ', mascot: { pose: 'default', placement: 'right' }, story: { teachingPoint: 'Recap + CTA' } },
]);

// Body: { mode: 'blank', title, pillar, scheduledAt } or { mode: 'import', text, pillar?, scheduledAt?, generation }
export async function POST(req: Request) {
  try {
    const brand = brandOf(req);
    const body = await req.json();
    if (body.mode === 'import') {
      const draft = DraftSchema.parse(extractJson(String(body.text ?? '')));
      const post = await createPost(brand, {
        ...draft,
        provider: draft.provider || body.provider || 'general',
        inputs: { topic: String(body.topic ?? ''), sourceUrl: String(body.sourceUrl ?? ''), slideCount: Number(body.slideCount) || draft.slides.length, references: [] },
        pillar: draft.pillar || body.pillar || '',
        scheduledAt: body.scheduledAt || '',
        status: 'draft',
        generation: { mode: body.generation === 'claude-code' ? 'claude-code' : 'claude-chat', notes: body.topic ?? '' },
      });
      return NextResponse.json(post, { status: 201 });
    }
    const post = await createPost(brand, {
      title: String(body.title || 'Untitled carousel'),
      provider: String(body.provider || 'general'),
      contentType: body.contentType || 'tutorial',
      audience: String(body.audience || ''),
      objective: String(body.objective || ''),
      inputs: { topic: String(body.title || ''), sourceUrl: String(body.sourceUrl || ''), slideCount: Number(body.slideCount) || 7, references: [] },
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
