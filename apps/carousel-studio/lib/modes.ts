// Each pipeline step has a manual mode that works today and an automated mode for later.
// The UI reads this to show what's available and why something is off.
import 'server-only';

export type ModeInfo = { id: string; label: string; available: boolean; note: string };

export function generationModes(): ModeInfo[] {
  return [
    {
      id: 'claude-chat',
      label: 'Claude chat (copy → paste)',
      available: true,
      note: 'Copy the generated brief into Claude (your Pro plan), paste the JSON answer back. No extra cost.',
    },
    {
      id: 'claude-code',
      label: 'Claude Code run (queue)',
      available: true,
      note: 'Adds the topic to carousel-queue.json. A Claude Code session (or a scheduled task, once set up) drafts it into this folder.',
    },
    {
      id: 'api',
      label: 'Claude API (automatic)',
      available: !!process.env.ANTHROPIC_API_KEY,
      note: process.env.ANTHROPIC_API_KEY
        ? 'API key detected. Automatic drafting is not wired up yet (Phase 2).'
        : 'Needs a paid Claude API key (separate from the Pro subscription). Off for now.',
    },
  ];
}

export function imageModes(): ModeInfo[] {
  return [
    {
      id: 'manual',
      label: 'Manual (ChatGPT / Grok / Seedream)',
      available: true,
      note: 'Copy each slide’s image prompt, generate the picture in ChatGPT or Fuzion, then upload it here.',
    },
    {
      id: 'api',
      label: 'Image API (automatic)',
      available: false,
      note: 'Needs an image API key (OpenAI / Gemini / a Fuzion API if one exists). Phase 2.',
    },
  ];
}

export function publishingModes(): ModeInfo[] {
  const metaReady = !!(process.env.META_PAGE_ID && process.env.META_IG_USER_ID && process.env.META_ACCESS_TOKEN);
  return [
    {
      id: 'manual',
      label: 'Manual posting kit',
      available: true,
      note: 'Download the JPEGs, copy the captions, post in the Meta Business Suite or the apps, then paste the post link back here.',
    },
    {
      id: 'meta-api',
      label: 'Meta Graph API (automatic)',
      available: false,
      note: metaReady
        ? 'Meta credentials detected. The API publisher is not wired up yet (Phase 2).'
        : 'Needs a Meta app, Page ID, Instagram user ID and a token in the server environment (never in chat). Phase 2.',
    },
  ];
}
