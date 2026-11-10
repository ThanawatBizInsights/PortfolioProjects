import { z } from 'zod';

// ============ Provider registry (per brand: content-studio/brands/<brand>/providers.json) ============
export const PoseSchema = z.object({
  id: z.string(),
  file: z.string(), // path inside the brand folder
  status: z.enum(['approved', 'proposed']).default('proposed'),
  note: z.string().default(''),
  aspect: z.number().default(1.486), // width / height of the pose artwork (for layout)
});
export const ProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  maker: z.string().default(''),
  accent: z.string(), // shapes, mascot area, large headings (≥ 3:1)
  accentText: z.string(), // small text in the topic colour (≥ 4.5:1 on white)
  accentSoft: z.string(), // supporting surface (e.g. warm cream for Claude)
  accentSoft2: z.string(),
  mascot: z
    .object({ name: z.string(), reference: z.string(), sourceNote: z.string().default(''), poses: z.array(PoseSchema).default([]) })
    .nullable()
    .default(null),
  logos: z.array(z.object({ file: z.string(), status: z.enum(['approved', 'proposed']).default('proposed') })).default([]),
  rules: z.array(z.string()).default([]),
  disclaimer: z.string().default(''),
});
export type Provider = z.infer<typeof ProviderSchema>;
export const RegistrySchema = z.object({ note: z.string().default(''), providers: z.array(ProviderSchema) });
export type Registry = z.infer<typeof RegistrySchema>;

// ============ Slides ============
// Text fields support "**phrase**" (topic-colour highlight) and "\n" line breaks.
export const MascotSchema = z.object({
  provider: z.string().default(''), // '' = the slide's / post's provider
  pose: z.string().default('default'),
  placement: z.enum(['right', 'corner']).default('right'),
  say: z.string().default(''), // short tip bubble, ≤ 40 Thai characters
});
export type SlideMascot = z.infer<typeof MascotSchema>;

// The storyboard behind each slide.
export const StorySchema = z.object({
  teachingPoint: z.string().default(''),
  composition: z.string().default(''),
  basis: z.enum(['source', 'advice', 'illustrative']).default('advice'), // what the slide's claims rest on
  sourceIds: z.array(z.number().int()).default([]), // 1-based indexes into post.sources
});

const common = {
  provider: z.string().default(''), // section owner in comparison posts; '' = post provider
  imagePrompt: z.string().default(''), // illustration only; never text, never the mascot (composited by the app)
  imageIncludesMascot: z.boolean().default(false), // true = the owner must attach the mascot reference when generating
  image: z.string().default(''),
  mascot: MascotSchema.optional(),
  story: StorySchema.default({}),
};
const Item = z.object({ icon: z.string().default('spark'), label: z.string().default(''), text: z.string().default('') });

export const SlideSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('cover'), kicker: z.string().default(''), title: z.string(), subtitle: z.string().default(''),
    visual: z.enum(['chat', 'image', 'none']).default('chat'),
    chat: z.object({ user: z.string().default(''), reply: z.string().default('') }).default({}),
    ...common,
  }),
  z.object({ type: z.literal('concept'), title: z.string(), definition: z.string().default(''), points: z.array(Item).default([]), ...common }),
  z.object({ type: z.literal('flow'), title: z.string(), intro: z.string().default(''), steps: z.array(Item).default([]), ...common }),
  z.object({
    type: z.literal('example'), title: z.string(), prompt: z.string().default(''),
    annotations: z.array(z.object({ quote: z.string().default(''), label: z.string().default(''), text: z.string().default('') })).default([]),
    reply: z.array(z.string()).default([]), replyNote: z.string().default(''),
    ...common,
  }),
  z.object({ type: z.literal('howto'), title: z.string(), items: z.array(Item.extend({ ui: z.string().default('') })).default([]), ...common }),
  z.object({
    type: z.literal('compare'), title: z.string(), style: z.enum(['avoid-better', 'table']).default('avoid-better'),
    columns: z.array(z.string()).default([]), rows: z.array(z.object({ label: z.string().default(''), cells: z.array(z.string()).default([]) })).default([]),
    ...common,
  }),
  z.object({ type: z.literal('recap'), title: z.string(), items: z.array(z.string()).default([]), cta: z.string().default(''), ...common }),
  z.object({
    type: z.literal('chart'), title: z.string(), subtitle: z.string().default(''), chartKind: z.enum(['bar', 'line']).default('bar'),
    data: z.array(z.object({ label: z.string(), value: z.number() })).default([]), highlight: z.number().int().default(0),
    valuePrefix: z.string().default(''), valueSuffix: z.string().default(''), note: z.string().default(''), illustrative: z.boolean().default(false),
    ...common,
  }),
  // simpler legacy layouts (still supported)
  z.object({ type: z.literal('statement'), title: z.string(), body: z.string().default(''), ...common }),
  z.object({ type: z.literal('step'), number: z.number().int().optional(), title: z.string(), body: z.string().default(''), ...common }),
  z.object({ type: z.literal('prompt'), title: z.string(), prompt: z.string(), note: z.string().default(''), ...common }),
  z.object({ type: z.literal('summary'), title: z.string(), bullets: z.array(z.string()).default([]), cta: z.string().default(''), ...common }),
]);
export type Slide = z.infer<typeof SlideSchema>;
export type SlideType = Slide['type'];
export const SLIDE_TYPES: SlideType[] = ['cover', 'concept', 'flow', 'example', 'howto', 'compare', 'recap', 'chart', 'statement', 'step', 'prompt', 'summary'];
export const CONTENT_TYPES = ['tutorial', 'concept', 'news', 'pricing', 'comparison', 'tips'] as const;

// ============ Post ============
export const STATUSES = ['idea', 'draft', 'ready-for-review', 'approved', 'scheduled', 'published', 'failed'] as const;
export type Status = (typeof STATUSES)[number];

const PublishRecord = z
  .object({ status: z.enum(['none', 'posted', 'failed']).default('none'), postId: z.string().default(''), permalink: z.string().default(''), at: z.string().default(''), note: z.string().default('') })
  .default({});

export const PostSchema = z.object({
  id: z.string(),
  brand: z.string(),
  title: z.string(),
  provider: z.string().default('general'), // main AI topic → mascot, accents, disclaimer
  providers: z.array(z.string()).default([]), // extra providers for comparison posts
  contentType: z.enum(CONTENT_TYPES).default('tutorial'),
  pillar: z.string().default(''),
  audience: z.string().default(''),
  objective: z.string().default(''), // learning objective
  takeaway: z.string().default(''),
  inputs: z
    .object({ topic: z.string().default(''), sourceUrl: z.string().default(''), slideCount: z.number().int().default(7), references: z.array(z.string()).default([]) })
    .default({}),
  hooks: z.array(z.object({ text: z.string(), mechanism: z.string().default('') })).default([]),
  selectedHook: z.number().int().default(0),
  status: z.enum(STATUSES).default('draft'),
  scheduledAt: z.string().default(''), // ISO 8601 with +07:00 (Asia/Bangkok)
  slides: z.array(SlideSchema).default([]),
  captions: z.object({ instagram: z.string().default(''), facebook: z.string().default(''), altText: z.string().default('') }).default({}),
  sources: z.array(z.object({ claim: z.string().default(''), url: z.string(), checkedAt: z.string().default(''), how: z.string().default('') })).default([]),
  dataAsOf: z.string().default(''),
  generation: z.object({ mode: z.enum(['manual', 'claude-chat', 'claude-code', 'api']).default('manual'), notes: z.string().default('') }).default({}),
  approval: z.object({ at: z.string().default(''), contentHash: z.string().default('') }).default({}),
  publish: z.object({ instagram: PublishRecord, facebook: PublishRecord }).default({}),
  history: z.array(z.object({ at: z.string(), event: z.string() })).default([]),
  createdAt: z.string().default(''),
  updatedAt: z.string().default(''),
});
export type Post = z.infer<typeof PostSchema>;

// What Claude (chat / Claude Code / API) returns; the app fills in id, brand, status, etc.
export const DraftSchema = PostSchema.pick({
  title: true, provider: true, providers: true, contentType: true, pillar: true, audience: true, objective: true, takeaway: true,
  hooks: true, selectedHook: true, slides: true, captions: true, sources: true, dataAsOf: true,
}).partial({ provider: true, providers: true, contentType: true, pillar: true, audience: true, objective: true, takeaway: true, hooks: true, selectedHook: true, captions: true, sources: true, dataAsOf: true });

// ============ Brand config ============
export const ConfigSchema = z.object({
  brand: z.string(),
  displayName: z.string(),
  pageName: z.string().default(''),
  instagramHandle: z.string().default(''),
  particles: z.enum(['unset', 'none', 'ครับ', 'ค่ะ']).default('unset'),
  logo: z.object({ file: z.string(), width: z.number(), height: z.number() }).optional(),
  colors: z.object({
    bg: z.string(), bg2: z.string(), ink: z.string(), muted: z.string(),
    accent1: z.string(), // royal blue
    accent2: z.string(), // violet (shapes only)
    sky: z.string().default('#67C7F2'),
    violetText: z.string().default('#7A4FD6'),
    card: z.string(), line: z.string().default('#E3E6F5'), dark: z.string(),
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

export function contentKey(p: Post): string {
  return JSON.stringify({ s: p.slides, c: p.captions, t: p.scheduledAt, src: p.sources, d: p.dataAsOf, pr: [p.provider, p.providers] });
}

/** Provider for a slide (comparison sections can override the post's provider). */
export function slideProvider(post: Post, slide: Slide): string {
  return slide.provider || post.provider;
}
export function findProvider(reg: Registry, id: string): Provider | undefined {
  return reg.providers.find((p) => p.id === id);
}
