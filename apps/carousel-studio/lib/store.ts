// File-based storage. Each post is a folder the Claude Code workflow can also read and write:
//   content-studio/brands/<brand>/carousels/<id>/post.json
//   .../images/   uploaded or generated illustrations (no text in them)
//   .../export/   final 1080x1350 JPEGs + manifest.json
// Swapping this module for Supabase later keeps the rest of the app unchanged.
import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { ConfigSchema, PostSchema, RegistrySchema, contentKey, type Config, type Post, type Registry } from './schema';
import { nowIso } from './time';

export const CONTENT_ROOT = path.resolve(process.env.CONTENT_ROOT ?? path.join(process.cwd(), '../../content-studio'));
export const DEFAULT_BRAND = process.env.DEFAULT_BRAND ?? 'bluewhalelabs';

const SLUG = /^[a-z0-9][a-z0-9-]{0,80}$/;

export function assertSlug(s: string, what = 'id'): string {
  if (!SLUG.test(s)) throw new Error(`Invalid ${what}: ${s}`);
  return s;
}

export const brandDir = (brand: string) => path.join(CONTENT_ROOT, 'brands', assertSlug(brand, 'brand'));
export const postsDir = (brand: string) => path.join(brandDir(brand), 'carousels');
export const postDir = (brand: string, id: string) => path.join(postsDir(brand), assertSlug(id));

/** Resolve a file inside a post folder, refusing anything that escapes it. */
export function postFile(brand: string, id: string, ...parts: string[]): string {
  const base = postDir(brand, id);
  const full = path.resolve(base, ...parts);
  if (!full.startsWith(base + path.sep)) throw new Error('Path outside post folder');
  return full;
}

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function listBrands(): Promise<string[]> {
  const dir = path.join(CONTENT_ROOT, 'brands');
  const names = await fs.readdir(dir).catch(() => []);
  const out: string[] = [];
  for (const n of names) if (await exists(path.join(dir, n, 'carousel.config.json'))) out.push(n);
  return out;
}

export async function getConfig(brand: string): Promise<Config> {
  const raw = await fs.readFile(path.join(brandDir(brand), 'carousel.config.json'), 'utf8');
  return ConfigSchema.parse(JSON.parse(raw));
}

export async function saveConfig(config: Config): Promise<Config> {
  const parsed = ConfigSchema.parse(config);
  await fs.writeFile(path.join(brandDir(parsed.brand), 'carousel.config.json'), JSON.stringify(parsed, null, 2) + '\n');
  return parsed;
}

// ---------- Provider registry + brand assets ----------
export async function getRegistry(brand: string): Promise<Registry> {
  try {
    return RegistrySchema.parse(JSON.parse(await fs.readFile(path.join(brandDir(brand), 'providers.json'), 'utf8')));
  } catch {
    return { note: '', providers: [] };
  }
}

export async function saveRegistry(brand: string, reg: Registry): Promise<Registry> {
  const parsed = RegistrySchema.parse(reg);
  await fs.writeFile(path.join(brandDir(brand), 'providers.json'), JSON.stringify(parsed, null, 2) + '\n');
  return parsed;
}

/** Resolve a brand asset (logo, mascot poses) without escaping the brand folder. */
export function brandAsset(brand: string, rel: string): string {
  const base = brandDir(brand);
  const full = path.resolve(base, rel);
  if (!full.startsWith(base + path.sep) || !/\.(png|svg|webp|jpg|jpeg)$/i.test(full)) throw new Error('Bad asset path');
  return full;
}

export async function listPosts(brand: string): Promise<Post[]> {
  const dir = postsDir(brand);
  const ids = await fs.readdir(dir).catch(() => []);
  const posts: Post[] = [];
  for (const id of ids) {
    if (!SLUG.test(id)) continue;
    try {
      posts.push(await getPost(brand, id));
    } catch {
      /* skip unreadable folders */
    }
  }
  return posts.sort((a, b) => (a.scheduledAt || a.createdAt).localeCompare(b.scheduledAt || b.createdAt));
}

export async function getPost(brand: string, id: string): Promise<Post> {
  const raw = await fs.readFile(postFile(brand, id, 'post.json'), 'utf8');
  return PostSchema.parse(JSON.parse(raw));
}

export async function writePost(post: Post): Promise<Post> {
  const parsed = PostSchema.parse({ ...post, updatedAt: nowIso() });
  await fs.mkdir(postDir(parsed.brand, parsed.id), { recursive: true });
  await fs.writeFile(postFile(parsed.brand, parsed.id, 'post.json'), JSON.stringify(parsed, null, 2) + '\n');
  return parsed;
}

function slugify(title: string): string {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return ascii.length >= 3 ? ascii : 'post-' + crypto.randomBytes(3).toString('hex');
}

export async function createPost(brand: string, data: Partial<Post> & { title: string }): Promise<Post> {
  const date = (data.scheduledAt || nowIso()).slice(0, 10);
  let id = `${date}-${slugify(data.title)}`;
  if (await exists(postDir(brand, id))) id = `${id}-${crypto.randomBytes(2).toString('hex')}`;
  const post = PostSchema.parse({
    ...data,
    id,
    brand,
    createdAt: nowIso(),
    history: [{ at: nowIso(), event: `created (${data.generation?.mode ?? 'manual'})` }],
  });
  return writePost(post);
}

export function hashContent(post: Post): string {
  return crypto.createHash('sha256').update(contentKey(post)).digest('hex').slice(0, 16);
}

// ---------- Export manifest ----------
export type Manifest = { at: string; contentHash: string; files: { name: string; sha256: string }[]; zip?: string; layoutIssues?: { slide: number; message: string }[] };

export async function getManifest(brand: string, id: string): Promise<Manifest | null> {
  try {
    return JSON.parse(await fs.readFile(postFile(brand, id, 'export', 'manifest.json'), 'utf8'));
  } catch {
    return null;
  }
}

/** Export is "fresh" when its content hash matches the post's current content. */
export async function exportIsFresh(post: Post): Promise<boolean> {
  const m = await getManifest(post.brand, post.id);
  return !!m && m.contentHash === hashContent(post) && m.files.length === post.slides.length;
}

// ---------- Queue for Claude Code runs ----------
export type QueueItem = { id: string; topic: string; pillar: string; notes: string; requestedAt: string; status: 'queued' | 'drafted' | 'skipped'; postId?: string };

const queueFile = (brand: string) => path.join(brandDir(brand), 'carousel-queue.json');

export async function getQueue(brand: string): Promise<QueueItem[]> {
  try {
    return JSON.parse(await fs.readFile(queueFile(brand), 'utf8'));
  } catch {
    return [];
  }
}

export async function addToQueue(brand: string, item: Omit<QueueItem, 'id' | 'requestedAt' | 'status'>): Promise<QueueItem> {
  const q = await getQueue(brand);
  const entry: QueueItem = { ...item, id: crypto.randomBytes(4).toString('hex'), requestedAt: nowIso(), status: 'queued' };
  q.push(entry);
  await fs.writeFile(queueFile(brand), JSON.stringify(q, null, 2) + '\n');
  return entry;
}

export async function readText(...parts: string[]): Promise<string> {
  return fs.readFile(path.join(CONTENT_ROOT, ...parts), 'utf8').catch(() => '');
}
