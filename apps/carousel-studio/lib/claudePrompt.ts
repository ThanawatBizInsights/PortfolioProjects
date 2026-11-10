// The production brief: topic → research → fact check → Thai copy → storyboard (+ asset choices).
// Used in "Claude chat" mode (copy/paste) and by Claude Code when drafting queued topics.
import 'server-only';
import type { Config, Registry } from './schema';
import { readText } from './store';

export type BriefInput = {
  topic: string; sourceUrl: string; provider: string; providers: string[]; audience: string; objective: string;
  contentType: string; slideCount: number; notes: string; scheduledAt: string; references: number;
};

export async function buildClaudeBrief(config: Config, registry: Registry, input: BriefInput) {
  const brandBrief = await readText('brands', config.brand, 'brand-brief.md');
  const styleGuide = await readText('workflow', 'thai-style-guide.md');
  const today = new Date().toISOString().slice(0, 10);
  const provs = [input.provider, ...input.providers].map((id) => registry.providers.find((p) => p.id === id)).filter(Boolean);
  const assetLines = provs
    .map((p) => {
      const poses = p!.mascot ? p!.mascot.poses.map((x) => `${x.id}${x.status === 'approved' ? '' : ' (proposed)'}`).join(', ') : 'NONE ASSIGNED (do not invent one; leave "mascot" out or the app shows a labelled text badge)';
      return `- ${p!.id} (${p!.name}${p!.maker ? `, by ${p!.maker}` : ''}): mascot poses: ${poses}. Rules: ${p!.rules.join(' ')}`;
    })
    .join('\n');
  const particles = config.particles === 'unset' || config.particles === 'none' ? 'Do not use ครับ/ค่ะ.' : `Use ${config.particles} naturally in captions and mascot tips (not on every headline). Never mix ครับ and ค่ะ.`;

  return `You are the production team for "${config.displayName}", a Thai educational channel about AI tools.
Produce ONE complete carousel package as a single JSON object (no prose, no code fence).

## Inputs
- Topic: ${input.topic || '(see source URL)'}
- Source URL: ${input.sourceUrl || '(none)'}
- Main provider: ${input.provider}${input.providers.length ? ` · also compared: ${input.providers.join(', ')}` : ''}
- Audience: ${input.audience || '(choose one specific group)'}
- Learning objective: ${input.objective || '(define one)'}
- Content type: ${input.contentType}
- Slides: ${input.slideCount} (1080×1350 each; may differ only if the topic truly needs it, max 10)
- Planned posting time (Asia/Bangkok): ${input.scheduledAt || '(not set)'}
- Owner notes: ${input.notes || '(none)'}
${input.references ? `- The owner attached ${input.references} reference image(s). Use them for visual ideas only. NEVER copy factual claims from them without verifying them in a primary source.` : ''}
- Today: ${today}

## Step 1: Research and fact-check (most important)
- Use web search. Prefer PRIMARY sources: the provider's own docs, help centre, pricing page or announcement.
- Verify every model name, price, release date, availability, plan or region limit, and the subscription-vs-API distinction.
- List every source in "sources": {"claim":"what it supports","url":"exact URL","checkedAt":"${today}","how":"opened page | search summary"}.
- For each slide set story.basis: "source" (with story.sourceIds, 1-based indexes into sources), "advice" (practical tips), or "illustrative" (made-up example content, labelled on the slide).
- If you can't verify something, leave it out. Never invent features, numbers, testimonials or personal stories.

## Step 2: Narrative (adapt to the content type)
Default for ${input.slideCount} slides: 1 accurate cover → 2 what it is or what changed → 3 a visual explanation → 4 a practical example → 5 how to use it → 6 limitations or common mistakes → 7 recap + one relevant CTA.
Pricing posts lean on chart/compare; news posts on what changed + who it affects; tutorials on flow/howto/example.
One main idea per slide, and every slide must teach VISUALLY. Never use the same layout 3 times in a row.

## Step 3: Layouts (use these exact shapes)
- cover: {"type":"cover","kicker":"short topic label","title":"2–3 lines with \\n, ≤16 Thai chars per line, **highlight**","subtitle":"","visual":"chat|image|none","chat":{"user":"example message","reply":"short example reply"}}
- concept: {"type":"concept","title":"","definition":"1–2 sentences","points":[{"icon":"ICON","label":"≤12 chars","text":"≤40 chars"}]}  (2–4 points)
- flow: {"type":"flow","title":"","intro":"","steps":[{"icon":"ICON","label":"","text":""}]}  (2–5 steps)
- example: {"type":"example","title":"","prompt":"a realistic message","annotations":[{"quote":"exact substring of prompt","label":"","text":""}],"reply":["short lines"],"replyNote":"ตัวอย่างคำตอบ (สมมติ)"}
- howto: {"type":"howto","title":"","items":[{"icon":"ICON","ui":"button label as it appears in the app","label":"","text":""}]}
- compare: {"type":"compare","title":"","style":"avoid-better|table","columns":["",""],"rows":[{"label":"","cells":["",""]}]}
- recap: {"type":"recap","title":"","items":["≤6 short items"],"cta":"ONE action"}
- chart: {"type":"chart","title":"","subtitle":"what + unit","chartKind":"bar|line","data":[{"label":"","value":0}],"highlight":0,"valuePrefix":"","valueSuffix":"","note":"","illustrative":false}
ICON is one of: chat file upload plus pencil globe phone desktop spark check cross warning lock search list user target clock bulb image code refresh book folder shield eye money arrow.

Every slide ALSO gets:
- "story": {"teachingPoint":"","composition":"what the reader sees, in English","basis":"source|advice|illustrative","sourceIds":[]}
- optional "mascot": {"provider":"","pose":"POSE","placement":"right|corner","say":"≤40 Thai chars"}. Only approved assets of the slide's own provider. Use on 3–4 slides (cover = corner), not every slide.
- optional "imagePrompt" (English): an ILLUSTRATION ONLY, no text, letters, logos or characters. Mascots are composited by the app and must not be drawn by image models. Most slides need none: the layouts are already visual.
- In comparison posts set "provider" on each section slide so that slide uses that provider's colours and mascot.

## Provider assets available
${assetLines}

## Captions
- "instagram": hook in line 1, 3–6 short lines, one CTA, "ที่มา:" + domain, 3–5 hashtags.
- "facebook": more conversational, ends with one genuine question, includes the main source link, 0–3 hashtags. Not identical to Instagram.
- "altText": plain Thai description of what the carousel shows, including any chart numbers.

## Thai voice
${particles}

### Brand brief
${brandBrief || '(missing)'}

### Thai style guide
${styleGuide || '(missing)'}

## Output JSON shape
{"title":"","provider":"${input.provider}","providers":${JSON.stringify(input.providers)},"contentType":"${input.contentType}","audience":"","objective":"","takeaway":"",
 "hooks":[{"text":"","mechanism":""}],"selectedHook":0,
 "slides":[ ... ],
 "captions":{"instagram":"","facebook":"","altText":""},
 "sources":[{"claim":"","url":"","checkedAt":"${today}","how":""}],
 "dataAsOf":"${today}"}`;
}
