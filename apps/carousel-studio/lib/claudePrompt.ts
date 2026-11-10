// Builds the brief that turns a topic into a carousel draft. Used by:
//  - "Claude chat" mode: the owner copies it into claude.ai and pastes the JSON answer back
//  - "Claude Code" mode: a session reads the queue and follows the same brief
import 'server-only';
import type { Config } from './schema';
import { readText } from './store';

export async function buildClaudeBrief(config: Config, input: { topic: string; pillar: string; notes: string; scheduledAt: string }) {
  const brandBrief = await readText('brands', config.brand, 'brand-brief.md');
  const styleGuide = await readText('workflow', 'thai-style-guide.md');
  const particles =
    config.particles === 'unset' || config.particles === 'none'
      ? 'Do not use ครับ or ค่ะ (neutral casual Thai). Soft particles such as นะ and เลย are fine in moderation.'
      : `End sentences with ${config.particles} where natural, consistently.`;
  const today = new Date().toISOString().slice(0, 10);

  return `You are the content team for the Thai brand "${config.displayName}" (Facebook Page: ${config.pageName}).
Create ONE Instagram/Facebook carousel draft about the topic below. Return ONLY a JSON object (no prose, no code fence).

TOPIC: ${input.topic}
PILLAR: ${input.pillar || '(choose from the brand pillars)'}
NOTES FROM OWNER: ${input.notes || '(none)'}
PLANNED POSTING TIME (Asia/Bangkok): ${input.scheduledAt || '(not set)'}
TODAY: ${today}

## Research and honesty (most important)
- Use web search. For anything about Claude, Anthropic or other AI tools, rely on OFFICIAL sources only (anthropic.com, claude.com, docs.claude.com, platform.claude.com, support.claude.com, or the tool maker's own docs or blog).
- Put every source you relied on in "sources" with the exact URL and checkedAt = ${today}.
- Never invent features, prices, limits, benchmarks, results, testimonials or personal stories. If you can't verify something, leave it out.
- Features change fast. Describe what is true today, set "dataAsOf" to ${today}, and avoid claims that will expire soon.

## Carousel format (1080x1350 portrait, 6–9 slides, max 10)
Slide types (use exactly these fields):
- {"type":"cover","kicker":"short label","title":"2–3 lines separated by \\n, ≤16 Thai characters per line, wrap the key phrase in **double asterisks**","subtitle":"one short line","imagePrompt":"..."}
- {"type":"statement","title":"≤34 chars","body":"≤140 chars","imagePrompt":"" }
- {"type":"step","number":1,"title":"≤34 chars","body":"≤140 chars","imagePrompt":""}
- {"type":"prompt","title":"≤34 chars","prompt":"a copy-ready prompt (Thai or English), ≤420 chars","note":"one short tip"}
- {"type":"summary","title":"≤34 chars","bullets":["≤60 chars", "... max 5"],"cta":"ONE action, e.g. เซฟไว้ลองทำ / ติดตามไว้"}
- {"type":"chart","title":"≤34 chars","subtitle":"what is measured + unit","chartKind":"bar|line","data":[{"label":"≤12 chars","value":0}],"highlight":0,"valuePrefix":"$","valueSuffix":"","note":"short note","illustrative":false}
  Charts: ONE series only, 2–8 points, highlight the one point the story is about. Use REAL numbers from a cited official source; if numbers are made up to explain an idea, set "illustrative": true and the note MUST contain "ตัวเลขสมมติ". Put all chart numbers in altText too.
Mascot (${config.mascot.enabled ? `on; the brand's pixel whale${config.mascot.name ? ` "${config.mascot.name}"` : ''}` : 'off; omit'}): optionally add to 2–4 slides  "mascot":{"mood":"idle|happy|think|talk|surprised","say":"≤40 Thai chars, optional","look":"auto"}. Good spots: cover (happy), a surprising number (surprised), a tricky point (think), the summary (talk). Not on every slide.
Structure: cover hook → why it matters (statement) → one idea per slide (steps) → a copy-ready example (prompt) → summary + one CTA.
Make the cover understandable in 1 second.

## Images
- Only the cover and at most 2 other slides get an image. Leave "imagePrompt" empty ("") elsewhere.
- imagePrompt is in ENGLISH and describes a picture with NO text, letters, numbers, UI text or logos (the app adds the Thai text). Brand style is appended automatically, so describe only the subject and composition.
- Never ask for real company logos or real people.

## Captions
- "instagram": hook in the first line, 3–5 short lines, one CTA, then "ที่มา: <domain>" and 3–5 relevant hashtags.
- "facebook": a little longer and conversational, ends with one genuine question, 0–3 hashtags, include the source link. Must NOT be identical to the Instagram caption.
- "altText": plain Thai description of what the carousel shows.

## Plan fields
"title" (working title), "pillar", "audience" (one specific group), "takeaway" (one Thai sentence), "hooks" (3 different hooks: [{"text":"...","mechanism":"question|contrast|relatable problem|bold-but-true|demo"}]) and "selectedHook" (index of the strongest; the cover uses it).

## Thai voice
${particles}

### Brand brief
${brandBrief || '(missing)'}

### Thai style guide
${styleGuide || '(missing)'}

## Output JSON shape
{"title":"","pillar":"","audience":"","takeaway":"","hooks":[{"text":"","mechanism":""}],"selectedHook":0,
 "slides":[ ...slide objects... ],
 "captions":{"instagram":"","facebook":"","altText":""},
 "sources":[{"claim":"","url":"","checkedAt":"${today}"}],
 "dataAsOf":"${today}"}`;
}
