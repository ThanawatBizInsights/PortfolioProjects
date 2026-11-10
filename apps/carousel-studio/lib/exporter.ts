// Renders each slide's /render page in headless Chromium and saves 1080x1350 JPEGs.
import 'server-only';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { hashContent, postFile, type Manifest } from './store';
import type { Post } from './schema';
import { nowIso } from './time';

export async function exportPost(post: Post, baseUrl: string): Promise<Manifest> {
  // Loaded at runtime so the bundler leaves it alone; on a new machine run: npx playwright install chromium
  const { chromium } = createRequire(import.meta.url)('playwright') as typeof import('playwright');
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const files: Manifest['files'] = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    await fs.rm(postFile(post.brand, post.id, 'export'), { recursive: true, force: true });
    await fs.mkdir(postFile(post.brand, post.id, 'export'), { recursive: true });
    for (let i = 0; i < post.slides.length; i++) {
      const url = `${baseUrl}/render/${post.brand}/${post.id}/${i}`;
      const res = await page.goto(url, { waitUntil: 'networkidle' });
      if (!res || !res.ok()) throw new Error(`Render page failed for slide ${i + 1} (${res?.status()})`);
      await page.waitForFunction(() => (window as unknown as { __slideReady?: boolean }).__slideReady === true, null, { timeout: 15000 });
      const name = `slide-${String(i + 1).padStart(2, '0')}.jpg`;
      const buf = await page.screenshot({ type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
      await fs.writeFile(postFile(post.brand, post.id, 'export', name), buf);
      files.push({ name, sha256: crypto.createHash('sha256').update(buf).digest('hex') });
    }
  } finally {
    await browser.close();
  }
  const manifest: Manifest = { at: nowIso(), contentHash: hashContent(post), files };
  await fs.writeFile(postFile(post.brand, post.id, 'export', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
