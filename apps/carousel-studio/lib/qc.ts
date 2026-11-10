// Quality checks shared by the browser (live) and the server (status changes).
// "error" blocks review/approval; "warn" is shown but doesn't block.
import type { Config, Post, Registry, Slide } from './schema';
import { findProvider, slideProvider } from './schema';
import { contrast } from './color';
import { bkkHour } from './time';

export type Issue = { level: 'error' | 'warn'; slide?: number; message: string };

const STOCK_PHRASES = ['ในยุคดิจิทัล', 'พลิกโฉม', 'ยกระดับ', 'ห้ามพลาด', 'ตัวช่วยชั้นดี', 'ไม่ควรพลาด', 'ที่สุดแห่งปี'];
// Common misspellings → Royal Institute spelling
const SPELLING: Record<string, string> = {
  'อัพเดท': 'อัปเดต', 'อัพเดต': 'อัปเดต', 'แอพ': 'แอป', 'เว็ป': 'เว็บ', 'คอมเม้นท์': 'คอมเมนต์', 'คอมเม้น': 'คอมเมนต์', 'อีเมล์': 'อีเมล',
  'ล็อคอิน': 'ล็อกอิน', 'คลิ๊ก': 'คลิก', 'ซอฟท์แวร์': 'ซอฟต์แวร์', 'ซอฟแวร์': 'ซอฟต์แวร์', 'กราฟฟิก': 'กราฟิก', 'โปรแกรมเมอ': 'โปรแกรมเมอร์', 'เทคโนโลยี่': 'เทคโนโลยี',
};
const CLAIM_PATTERN = /(\d[\d,.]*\s*(%|เปอร์เซ็นต์|เท่า|บาท|ล้าน|พันล้าน))|[$฿€]\s?\d/;

const len = (s: string) => [...s.replace(/\*\*/g, '')].length;

export function slideTexts(s: Slide): string[] {
  const m = s.mascot?.say ? [s.mascot.say] : [];
  switch (s.type) {
    case 'cover': return [s.kicker, s.title, s.subtitle, s.chat.user, s.chat.reply, ...m];
    case 'concept': return [s.title, s.definition, ...s.points.flatMap((p) => [p.label, p.text]), ...m];
    case 'flow': return [s.title, s.intro, ...s.steps.flatMap((p) => [p.label, p.text]), ...m];
    case 'example': return [s.title, s.prompt, ...s.annotations.flatMap((a) => [a.label, a.text]), ...s.reply, s.replyNote, ...m];
    case 'howto': return [s.title, ...s.items.flatMap((p) => [p.ui, p.label, p.text]), ...m];
    case 'compare': return [s.title, ...s.columns, ...s.rows.flatMap((r) => [r.label, ...r.cells]), ...m];
    case 'recap': return [s.title, ...s.items, s.cta, ...m];
    case 'chart': return [s.title, s.subtitle, s.note, ...s.data.map((d) => d.label), ...m];
    case 'statement': case 'step': return [s.title, s.body, ...m];
    case 'prompt': return [s.title, s.prompt, s.note, ...m];
    case 'summary': return [s.title, ...s.bullets, s.cta, ...m];
  }
}

export function runQc(post: Post, config: Config, registry: Registry, opts: { exportFresh?: boolean; layoutIssues?: { slide: number; message: string }[] } = {}): Issue[] {
  const issues: Issue[] = [];
  const add = (level: Issue['level'], message: string, slide?: number) => issues.push({ level, message, slide });
  const n = post.slides.length;
  const allowedProviders = new Set([post.provider, ...post.providers]);

  // ---- structure ----
  if (n < 3) add('error', `Only ${n} slide(s). A carousel needs at least 3.`);
  if (n > 10) add('error', `${n} slides. The Instagram API allows at most 10.`);
  if (n && post.slides[0].type !== 'cover') add('warn', 'The first slide should be a cover.', 1);
  if (post.inputs.slideCount && n !== post.inputs.slideCount) add('warn', `Planned ${post.inputs.slideCount} slides, but there are ${n}.`);
  if (!findProvider(registry, post.provider)) add('error', `Provider "${post.provider}" is not in the provider registry.`);

  // ---- repeated layouts ----
  for (let i = 2; i < n; i++) {
    const t = post.slides[i].type;
    if (t === post.slides[i - 1].type && t === post.slides[i - 2].type) add('warn', `Slides ${i - 1}–${i + 1} all use the "${t}" layout. Vary the visual (diagram, example, table…).`, i + 1);
  }

  post.slides.forEach((s, i) => {
    const no = i + 1;
    const texts = slideTexts(s).filter(Boolean);
    const all = texts.join(' ');

    // ---- copy length ----
    if (!s.title.trim()) add('error', 'The headline is empty.', no);
    if (s.type === 'cover') {
      s.title.split('\n').forEach((l) => len(l) > 16 && add('warn', `The cover line "${l}" is ${len(l)} characters (aim for ≤ 16 per line).`, no));
      if (s.title.split('\n').length > 3) add('warn', 'The cover title has more than 3 lines.', no);
    } else if (s.title.split('\n').some((l) => len(l) > 30)) add('warn', 'The headline has a line over 30 characters; add a line break or shorten it.', no);

    // ---- teaches visually? ----
    if (s.type === 'statement' && !s.image && !s.imagePrompt && len(s.body) < 60) add('warn', 'A sentence above an empty card. Use a diagram, example or comparison layout, or add an illustration.', no);
    if (s.type === 'concept' && s.points.length < 2) add('warn', 'Concept slides teach better with 2–4 supporting points.', no);
    if (s.type === 'flow' && (s.steps.length < 2 || s.steps.length > 5)) add('warn', 'Flows read best with 2–5 steps.', no);
    if (s.type === 'example' && s.annotations.some((a) => a.quote && !s.prompt.includes(a.quote))) add('error', 'An annotation quote isn’t found in the example prompt.', no);
    if (s.type === 'compare' && s.rows.some((r) => r.cells.length !== Math.max(s.columns.length, 2))) add('warn', 'Some table rows don’t have a cell for every column.', no);
    if (s.type === 'recap' && s.items.length > 6) add('warn', 'Recaps read best with 6 items or fewer.', no);

    // ---- chart rules ----
    if (s.type === 'chart') {
      if (s.data.length < 2) add('error', 'A chart needs at least 2 data points.', no);
      if (s.highlight < 0 || s.highlight >= s.data.length) add('error', 'The highlighted point doesn’t exist.', no);
      if (s.illustrative && !/สมมติ|ตัวอย่าง/.test(s.note)) add('error', 'Made-up numbers must say "ตัวเลขสมมติ" in the note.', no);
      const alt = post.captions.altText;
      if (!s.data.every((d) => alt.includes(String(d.value)))) add('warn', 'Put the chart’s numbers in the alt text too.', no);
    }

    // ---- sources / unsupported claims ----
    const st = s.story;
    if (st.basis === 'source' && !st.sourceIds.length) add('error', 'Marked "source" but no source is linked to this slide.', no);
    st.sourceIds.forEach((id) => (id < 1 || id > post.sources.length) && add('error', `Source #${id} doesn’t exist.`, no));
    const claimText = s.type === 'chart' ? [s.title, s.subtitle, s.note].join(' ') : all;
    if (CLAIM_PATTERN.test(claimText) && st.basis !== 'source' && !(s.type === 'chart' && s.illustrative)) add('warn', 'Numbers, prices or multiples appear without a linked source. Link a source or mark them as illustrative.', no);
    if (!st.teachingPoint) add('warn', 'The storyboard has no teaching point for this slide.', no);

    // ---- mascot / provider assets ----
    const sp = slideProvider(post, s);
    if (s.provider && !allowedProviders.has(s.provider)) add('error', `Slide is assigned to "${s.provider}", which isn’t one of this post’s providers.`, no);
    if (s.mascot) {
      const mp = s.mascot.provider || sp;
      const prov = findProvider(registry, mp);
      if (!allowedProviders.has(mp)) add('error', `Wrong mascot: "${mp}" isn’t a provider of this post.`, no);
      if (mp !== sp) add('error', `Wrong mascot: this slide is about "${sp}" but shows the "${mp}" mascot.`, no);
      if (prov && !prov.mascot) add('warn', `No approved mascot for ${prov.name}. A labelled text badge is shown instead; assign an asset in the provider registry.`, no);
      if (prov?.mascot) {
        const pose = prov.mascot.poses.find((p) => p.id === s.mascot!.pose);
        if (!pose) add('error', `Pose "${s.mascot.pose}" doesn’t exist for ${prov.name}.`, no);
        else if (pose.status !== 'approved') add('warn', `Pose "${pose.id}" is still "proposed". Approve it in Settings → Providers before publishing.`, no);
      }
      if (len(s.mascot.say) > 40) add('warn', 'The mascot’s tip is over 40 characters.', no);
    }
    if (s.imagePrompt && !s.image) add('warn', 'An illustration is planned but not uploaded yet (manual bridge).', no);
    if (/mascot|character|claude|robot|crab/i.test(s.imagePrompt) && !s.imageIncludesMascot) add('warn', 'The illustration prompt mentions a character. Mascots are composited by the app, so keep them out of generated images.', no);

    // ---- Thai language ----
    texts.forEach((t) => {
      if (/[^\s]ๆ/.test(t)) add('warn', `Put a space before ๆ (e.g. "นาน ๆ"): "${t.slice(0, 24)}…"`, no);
      if (/ {2,}/.test(t)) add('warn', 'Double space in the text.', no);
      if ((t.match(/\*\*/g) ?? []).length % 2) add('error', 'Unbalanced ** highlight marker.', no);
      Object.entries(SPELLING).forEach(([bad, good]) => t.includes(bad) && add('warn', `Spelling: "${bad}" → "${good}"`, no));
    });
    STOCK_PHRASES.forEach((p) => all.includes(p) && add('warn', `Stock phrase "${p}". Rewrite it more naturally.`, no));
  });

  // ---- particles ----
  const everything = post.slides.flatMap(slideTexts).join(' ') + ' ' + post.captions.instagram + ' ' + post.captions.facebook;
  if (config.particles === 'ครับ' && /ค่ะ|คะ(?![ก-๙])/.test(everything)) add('warn', 'Brand voice is ครับ, but ค่ะ/คะ was found.');
  if (config.particles === 'ค่ะ' && /ครับ/.test(everything)) add('warn', 'Brand voice is ค่ะ, but ครับ was found.');
  if (config.particles === 'none' && /ครับ|ค่ะ/.test(everything)) add('warn', 'Brand voice is "no particles", but ครับ/ค่ะ was found.');

  // ---- contrast (design tokens) ----
  const c = config.colors;
  if (contrast(c.ink, c.bg2) < 7) add('warn', `Text colour contrast on the background is ${contrast(c.ink, c.bg2).toFixed(1)}:1 (aim for 7:1).`);
  if (contrast(c.muted, c.bg2) < 4.5) add('error', `Secondary text contrast is ${contrast(c.muted, c.bg2).toFixed(1)}:1, below 4.5:1.`);
  [...allowedProviders].forEach((id) => {
    const p = findProvider(registry, id);
    if (p && contrast(p.accentText, '#FFFFFF') < 4.5) add('error', `${p.name} accentText contrast is ${contrast(p.accentText, '#FFFFFF').toFixed(1)}:1 on white (needs 4.5:1).`);
  });

  // ---- captions ----
  if (!post.captions.instagram.trim()) add('error', 'The Instagram caption is empty.');
  if (!post.captions.facebook.trim()) add('error', 'The Facebook caption is empty.');
  if (post.captions.instagram.trim() && post.captions.instagram.trim() === post.captions.facebook.trim()) add('warn', 'The Facebook and Instagram captions are identical. Adapt them per platform.');
  if ([...post.captions.instagram].length > 2200) add('error', 'The Instagram caption is over 2,200 characters.');
  if ((post.captions.instagram.match(/#[^\s#]+/g) ?? []).length > 5) add('warn', 'More than 5 hashtags on Instagram.');
  if (!post.captions.altText.trim()) add('warn', 'Alt text is empty.');

  // ---- sources ----
  if (post.sources.length === 0) add('error', 'No sources. Every factual post needs at least one primary source URL.');
  post.sources.forEach((s, i) => {
    if (!/^https?:\/\//.test(s.url)) add('error', `Source ${i + 1} isn’t a valid URL.`);
    if (!s.checkedAt) add('warn', `Source ${i + 1} has no "checked on" date.`);
  });
  if (!post.dataAsOf) add('warn', 'Missing the "ข้อมูล ณ วันที่" date.');

  // ---- schedule ----
  if (!post.scheduledAt) add('warn', 'No posting time yet.');
  else {
    const hr = bkkHour(post.scheduledAt);
    if (hr < 10 || hr >= 21) add('warn', 'The posting time is outside 10:00–21:00 Bangkok time.');
    if (new Date(post.scheduledAt).getTime() < Date.now() && post.status !== 'published') add('warn', 'The posting time is in the past.');
  }

  // ---- rendered output ----
  if (opts.exportFresh === false) add('warn', 'Exported images are missing or older than the last edit. Export again.');
  if (opts.exportFresh) opts.layoutIssues?.forEach((l) => add('error', `Render check: ${l.message}`, l.slide));

  return issues;
}

export const hasErrors = (issues: Issue[]) => issues.some((i) => i.level === 'error');
