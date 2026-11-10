// Same CSV format as content-studio/scripts/publish_log.py, so both tools share one log per brand.
import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { brandDir, postFile } from './store';
import type { Post } from './schema';

const FIELDS = [
  'logged_at_bkk', 'brand', 'platform', 'account', 'package', 'media_file', 'media_sha256',
  'caption_sha256', 'scheduled_for_bkk', 'status', 'platform_post_id', 'permalink', 'notes',
] as const;
type Row = Record<(typeof FIELDS)[number], string>;

const logPath = (brand: string) => path.join(brandDir(brand), 'publishing-log.csv');
const sha = (b: Buffer | string) => crypto.createHash('sha256').update(b).digest('hex');
const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let cur: string[] = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { cur.push(field); field = ''; }
    else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }
  const [head, ...body] = rows;
  if (!head) return [];
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])) as Row);
}

const bkkNow = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');

async function fingerprints(post: Post, platform: 'instagram' | 'facebook') {
  const cover = await fs.readFile(postFile(post.brand, post.id, 'export', 'slide-01.jpg')).catch(() => null);
  return { media: cover ? sha(cover) : '', caption: sha(post.captions[platform].trim()) };
}

/** Same media or same caption already posted/scheduled to this platform for this brand? */
export async function findDuplicates(post: Post, platform: 'instagram' | 'facebook'): Promise<Row[]> {
  const text = await fs.readFile(logPath(post.brand), 'utf8').catch(() => '');
  const f = await fingerprints(post, platform);
  return parseCsv(text).filter(
    (r) =>
      r.platform === platform &&
      ['published', 'scheduled'].includes(r.status) &&
      r.package !== post.id &&
      ((f.media && r.media_sha256 === f.media) || r.caption_sha256 === f.caption),
  );
}

export async function appendLog(
  post: Post,
  platform: 'instagram' | 'facebook',
  entry: { status: 'published' | 'scheduled' | 'failed'; postId?: string; permalink?: string; notes?: string; account?: string },
) {
  const f = await fingerprints(post, platform);
  const row: Row = {
    logged_at_bkk: bkkNow(),
    brand: post.brand,
    platform,
    account: entry.account ?? '',
    package: post.id,
    media_file: 'export/slide-01.jpg',
    media_sha256: f.media,
    caption_sha256: f.caption,
    scheduled_for_bkk: post.scheduledAt,
    status: entry.status,
    platform_post_id: entry.postId ?? '',
    permalink: entry.permalink ?? '',
    notes: entry.notes ?? '',
  };
  const p = logPath(post.brand);
  const existing = await fs.readFile(p, 'utf8').catch(() => '');
  const header = existing ? '' : FIELDS.join(',') + '\n';
  const line = FIELDS.map((k) => esc(row[k])).join(',') + '\n';
  await fs.appendFile(p, header + (existing && !existing.endsWith('\n') ? '\n' : '') + line);
}
