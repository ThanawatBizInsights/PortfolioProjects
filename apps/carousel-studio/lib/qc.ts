// Quality checks that run in the browser (live) and on the server (before status changes).
// "error" blocks review/approval; "warn" is shown but doesn't block.
import type { Config, Post, Slide } from './schema';
import { bkkHour } from './time';

export type Issue = { level: 'error' | 'warn'; slide?: number; message: string };

const STOCK_PHRASES = ['ในยุคดิจิทัล', 'พลิกโฉม', 'ยกระดับ', 'ห้ามพลาด', 'ตัวช่วยชั้นดี', 'ไม่ควรพลาด', 'ที่สุดแห่งปี'];

// Limits sized for 1080x1350 slides at the template's font sizes.
const LIMITS = {
  coverLine: 16,
  coverLines: 3,
  title: 34,
  body: 140,
  prompt: 420,
  bullets: 5,
  bullet: 60,
};

const len = (s: string) => [...s.replace(/\*\*/g, '')].length; // count characters, ignoring highlight markers

function slideText(s: Slide): string {
  switch (s.type) {
    case 'cover':
      return [s.kicker, s.title, s.subtitle].join(' ');
    case 'statement':
    case 'step':
      return [s.title, s.body].join(' ');
    case 'prompt':
      return [s.title, s.prompt, s.note].join(' ');
    case 'summary':
      return [s.title, ...s.bullets, s.cta].join(' ');
    case 'chart':
      return [s.title, s.subtitle, s.note, ...s.data.map((d) => d.label)].join(' ');
  }
}

export function runQc(post: Post, config: Config, opts: { exportFresh?: boolean } = {}): Issue[] {
  const issues: Issue[] = [];
  const add = (level: Issue['level'], message: string, slide?: number) => issues.push({ level, message, slide });

  // Structure
  const n = post.slides.length;
  if (n < 3) add('error', `Only ${n} slide(s). A carousel needs at least 3.`);
  if (n > 10) add('error', `${n} slides. The Instagram API allows at most 10.`);
  if (n && post.slides[0].type !== 'cover') add('warn', 'The first slide should be a cover.', 1);
  if (n && post.slides[n - 1].type !== 'summary') add('warn', 'The last slide should be a summary with one CTA.', n);

  // Per-slide text
  post.slides.forEach((s, i) => {
    const no = i + 1;
    if (s.type === 'cover') {
      const lines = s.title.split('\n');
      if (!s.title.trim()) add('error', 'The cover title is empty.', no);
      if (lines.length > LIMITS.coverLines) add('warn', `The cover title has ${lines.length} lines; ${LIMITS.coverLines} or fewer reads better.`, no);
      lines.forEach((l) => {
        if (len(l) > LIMITS.coverLine) add('warn', `The cover line "${l}" is ${len(l)} characters. Keep each line to ${LIMITS.coverLine} or fewer and break it with a new line.`, no);
      });
    } else {
      if (!s.title.trim()) add('error', 'The slide title is empty.', no);
      if (len(s.title) > LIMITS.title) add('warn', `The title is ${len(s.title)} characters (aim for ${LIMITS.title} or fewer).`, no);
    }
    if ((s.type === 'statement' || s.type === 'step') && len(s.body) > LIMITS.body)
      add('warn', `The body is ${len(s.body)} characters (aim for ${LIMITS.body} or fewer). Split it into two slides?`, no);
    if (s.type === 'prompt' && len(s.prompt) > LIMITS.prompt) add('warn', `The prompt box is ${len(s.prompt)} characters, which may be too small to read.`, no);
    if (s.type === 'summary') {
      if (s.bullets.length > LIMITS.bullets) add('warn', `${s.bullets.length} bullets; keep it to ${LIMITS.bullets} or fewer.`, no);
      s.bullets.forEach((b) => len(b) > LIMITS.bullet && add('warn', `The bullet "${b.slice(0, 20)}…" is long.`, no));
      if (!s.cta.trim()) add('warn', 'The last slide has no CTA.', no);
      if (s.mascot && len(s.cta) > 24) add('warn', `With the mascot beside it, the CTA has room for about 24 characters (now ${len(s.cta)}).`, no);
    }
    if (s.type === 'chart') {
      if (s.data.length < 2) add('error', 'A chart needs at least 2 data points.', no);
      if (s.data.length > 8) add('warn', `${s.data.length} data points; 8 or fewer reads better on a phone.`, no);
      if (s.highlight < 0 || s.highlight >= s.data.length) add('error', 'The highlighted point doesn’t exist.', no);
      if (s.data.some((d) => !isFinite(d.value) || d.value < 0)) add('error', 'Chart values must be numbers of 0 or more.', no);
      s.data.forEach((d) => len(d.label) > 12 && add('warn', `The label "${d.label}" is long; keep it to 12 characters or fewer.`, no));
      if (!s.subtitle.trim()) add('warn', 'Add a subtitle saying what is measured and the unit.', no);
      if (s.illustrative && !/สมมติ|ตัวอย่าง/.test(s.note)) add('error', 'Made-up numbers must say so on the slide: put "ตัวเลขสมมติ" in the note.', no);
      if (!s.illustrative && post.sources.length === 0) add('error', 'Real chart numbers need a source.', no);
      const alt = post.captions.altText;
      if (s.data.length && !s.data.every((d) => alt.includes(String(d.value)) || alt.includes(new Intl.NumberFormat('en-US').format(d.value))))
        add('warn', 'Put the chart’s numbers in the alt text too (people using screen readers can’t see the bars).', no);
    }
    if (s.mascot) {
      if (len(s.mascot.say) > 40) add('warn', `The mascot’s line is ${len(s.mascot.say)} characters; keep speech bubbles to 40 or fewer.`, no);
      if (!config.mascot.enabled) add('warn', 'This slide has a mascot, but the mascot is turned off in Settings.', no);
    }
    if (s.imagePrompt && !s.image) add('warn', 'The image prompt is ready but no image is uploaded yet.', no);
    if (/[ก-๙]/.test(s.imagePrompt)) add('warn', 'Write image prompts in English; image models handle that better.', no);

    const text = slideText(s);
    STOCK_PHRASES.forEach((p) => text.includes(p) && add('warn', `Stock phrase "${p}". Rewrite it more naturally.`, no));
  });

  // Ending particles must match the brand voice
  const all = post.slides.map((s) => slideText(s) + ' ' + (s.mascot?.say ?? '')).join(' ') + ' ' + post.captions.instagram + ' ' + post.captions.facebook;
  if (config.particles === 'none' && /ครับ|ค่ะ/.test(all)) add('warn', 'Brand voice is "no particles", but ครับ/ค่ะ was found.');
  if (config.particles === 'ครับ' && /ค่ะ/.test(all)) add('warn', 'Brand voice is ครับ, but ค่ะ was found.');
  if (config.particles === 'ค่ะ' && /ครับ/.test(all)) add('warn', 'Brand voice is ค่ะ, but ครับ was found.');

  // Captions
  if (!post.captions.instagram.trim()) add('error', 'The Instagram caption is empty.');
  if (!post.captions.facebook.trim()) add('error', 'The Facebook caption is empty.');
  if (post.captions.instagram.trim() && post.captions.instagram.trim() === post.captions.facebook.trim())
    add('warn', 'The Facebook and Instagram captions are identical. Adapt them per platform.');
  if ([...post.captions.instagram].length > 2200) add('error', 'The Instagram caption is over 2,200 characters.');
  const tags = (post.captions.instagram.match(/#[^\s#]+/g) ?? []).length;
  if (tags > 5) add('warn', `${tags} hashtags on Instagram; this brand uses 3–5.`);
  if (!post.captions.altText.trim()) add('warn', 'Alt text is empty.');

  // Honesty: sources
  if (post.sources.length === 0) add('error', 'No sources. Every factual post needs at least one official source URL.');
  post.sources.forEach((s, i) => {
    if (!/^https?:\/\//.test(s.url)) add('error', `Source ${i + 1} isn't a valid URL.`);
    if (!s.checkedAt) add('warn', `Source ${i + 1} has no "checked on" date.`);
  });
  if (!post.dataAsOf) add('warn', 'Missing the "ข้อมูล ณ วันที่" date for the last slide.');

  // Schedule
  if (!post.scheduledAt) add('warn', 'No posting time yet.');
  else {
    const h = bkkHour(post.scheduledAt);
    if (h < 10 || h >= 21) add('warn', 'The posting time is outside 10:00–21:00 Bangkok time.');
    if (new Date(post.scheduledAt).getTime() < Date.now() && post.status !== 'published') add('warn', 'The posting time is in the past.');
  }

  // Media
  if (opts.exportFresh === false) add('warn', 'Exported JPEGs are missing or older than your last edit. Export again.');

  return issues;
}

export const hasErrors = (issues: Issue[]) => issues.some((i) => i.level === 'error');
