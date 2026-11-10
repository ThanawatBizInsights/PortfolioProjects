import { z } from 'zod';

// ---------- Slides ----------
// Text fields support "**word**" to highlight with the brand gradient and "\n" for line breaks.
const imageFields = {
  imagePrompt: z.string().default(''), // what to ask ChatGPT / Grok / an image API for (never text in the image)
  image: z.string().default(''), // file name inside the post's images/ folder
};

export const SlideSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('cover'), kicker: z.string().default(''), title: z.string(), subtitle: z.string().default(''), ...imageFields }),
  z.object({ type: z.literal('statement'), title: z.string(), body: z.string().default(''), ...imageFields }),
  z.object({ type: z.literal('step'), number: z.number().int().optional(), title: z.string(), body: z.string().default(''), ...imageFields }),
  z.object({ type: z.literal('prompt'), title: z.string(), prompt: z.string(), note: z.string().default(''), ...imageFields }),
  z.object({ type: z.literal('summary'), title: z.string(), bullets: z.array(z.string()).default([]), cta: z.string().default(''), ...imageFields }),
]);
export type Slide = z.infer<typeof SlideSchema>;
export type SlideType = Slide['type'];
export const SLIDE_TYPES: SlideType[] = ['cover', 'statement', 'step', 'prompt', 'summary'];

// ---------- Post ----------
export const STATUSES = ['idea', 'draft', 'ready-for-review', 'approved', 'scheduled', 'published', 'failed'] as const;
export type Status = (typeof STATUSES)[number];

const PublishRecord = z
  .object({
    status: z.enum(['none', 'posted', 'failed']).default('none'),
    postId: z.string().default(''),
    permalink: z.string().default(''),
    at: z.string().default(''),
    note: z.string().default(''),
  })
  .default({});

export const PostSchema = z.object({
  id: z.string(),
  brand: z.string(),
  title: z.string(),
  pillar: z.string().default(''),
  audience: z.string().default(''),
  takeaway: z.string().default(''),
  hooks: z.array(z.object({ text: z.string(), mechanism: z.string().default('') })).default([]),
  selectedHook: z.number().int().default(0),
  status: z.enum(STATUSES).default('draft'),
  scheduledAt: z.string().default(''), // ISO 8601 with +07:00 (Asia/Bangkok)
  slides: z.array(SlideSchema).default([]),
  captions: z
    .object({ instagram: z.string().default(''), facebook: z.string().default(''), altText: z.string().default('') })
    .default({}),
  sources: z.array(z.object({ claim: z.string().default(''), url: z.string(), checkedAt: z.string().default('') })).default([]),
  dataAsOf: z.string().default(''), // shown on the last slide: "ข้อมูล ณ ..."
  generation: z
    .object({ mode: z.enum(['manual', 'claude-chat', 'claude-code', 'api']).default('manual'), notes: z.string().default('') })
    .default({}),
  approval: z.object({ at: z.string().default(''), contentHash: z.string().default('') }).default({}),
  publish: z.object({ instagram: PublishRecord, facebook: PublishRecord }).default({}),
  history: z.array(z.object({ at: z.string(), event: z.string() })).default([]),
  createdAt: z.string().default(''),
  updatedAt: z.string().default(''),
});
export type Post = z.infer<typeof PostSchema>;

// What Claude (chat / Claude Code / API) is asked to return. The app fills in id, brand, status, etc.
export const DraftSchema = PostSchema.pick({
  title: true,
  pillar: true,
  audience: true,
  takeaway: true,
  hooks: true,
  selectedHook: true,
  slides: true,
  captions: true,
  sources: true,
  dataAsOf: true,
}).partial({ pillar: true, audience: true, takeaway: true, hooks: true, selectedHook: true, captions: true, sources: true, dataAsOf: true });
export type Draft = z.infer<typeof DraftSchema>;

// ---------- Brand config ----------
export const ConfigSchema = z.object({
  brand: z.string(),
  displayName: z.string(),
  pageName: z.string().default(''),
  instagramHandle: z.string().default(''),
  particles: z.enum(['unset', 'none', 'ครับ', 'ค่ะ']).default('unset'),
  colors: z.object({
    bg: z.string(),
    bg2: z.string(),
    ink: z.string(),
    muted: z.string(),
    accent1: z.string(),
    accent2: z.string(),
    card: z.string(),
    dark: z.string(),
  }),
  slots: z.array(z.object({ day: z.enum(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']), time: z.string(), pillar: z.string().default('') })).default([]),
  pillars: z.array(z.string()).default([]),
  imageStyle: z.string().default(''),
  imageTools: z.array(z.string()).default([]),
  modes: z
    .object({
      generation: z.enum(['claude-chat', 'claude-code', 'api']).default('claude-chat'),
      images: z.enum(['manual', 'api']).default('manual'),
      publishing: z.enum(['manual', 'meta-api']).default('manual'),
    })
    .default({}),
  automation: z.object({ enabled: z.boolean().default(false) }).default({}),
});
export type Config = z.infer<typeof ConfigSchema>;

// Content fingerprint used to detect edits after approval (status + bookkeeping fields excluded).
export function contentKey(p: Post): string {
  return JSON.stringify({ s: p.slides, c: p.captions, t: p.scheduledAt, src: p.sources, d: p.dataAsOf });
}
