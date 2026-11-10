// Renders each slide's /render page in headless Chromium → PNGs, then builds an ordered ZIP
// with the captions, alt text, source notes and storyboard.
import 'server-only';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { zipSync, strToU8 } from 'fflate';
import { hashContent, postFile, type Manifest } from './store';
import type { Post } from './schema';
import { nowIso } from './time';

export function sourceNotes(post: Post): string {
  const lines = [`# Sources: ${post.title}`, '', `Data as of: ${post.dataAsOf || '(not set)'}`, ''];
  post.sources.forEach((s, i) => lines.push(`${i + 1}. ${s.claim || '(claim not described)'}`, `   ${s.url}`, `   checked: ${s.checkedAt || '?'}${s.how ? ` (${s.how})` : ''}`, ''));
  lines.push('## Per slide');
  post.slides.forEach((sl, i) => lines.push(`- Slide ${i + 1} (${sl.type}): ${sl.story.basis}${sl.story.sourceIds.length ? `, sources ${sl.story.sourceIds.join(', ')}` : ''}`));
  return lines.join('\n') + '\n';
}

export function storyboardText(post: Post): string {
  const out = [`# Storyboard: ${post.title}`, `Provider: ${post.provider}${post.providers.length ? ` + ${post.providers.join(', ')}` : ''} · Type: ${post.contentType} · Audience: ${post.audience}`, `Objective: ${post.objective}`, ''];
  post.slides.forEach((s, i) => {
    out.push(`## Slide ${i + 1}: ${s.type}`, `Headline: ${s.title.replace(/\n/g, ' / ')}`, `Teaching point: ${s.story.teachingPoint}`, `Composition: ${s.story.composition}`);
    out.push(`Mascot: ${s.mascot ? `${s.mascot.provider || s.provider || post.provider} / ${s.mascot.pose}${s.mascot.say ? ` says "${s.mascot.say}"` : ''}` : 'none'}`);
    out.push(`Basis: ${s.story.basis}${s.story.sourceIds.length ? ` (sources ${s.story.sourceIds.join(', ')})` : ''}`);
    if (s.imagePrompt) out.push(`Illustration prompt: ${s.imagePrompt}${s.image ? ` (uploaded: ${s.image})` : ' (NOT uploaded yet)'}`);
    out.push('');
  });
  return out.join('\n');
}

export async function exportPost(post: Post, baseUrl: string): Promise<Manifest> {
  // Loaded at runtime so the bundler leaves it alone; on a new machine run: npx playwright install chromium
  const { chromium } = createRequire(import.meta.url)('playwright') as typeof import('playwright');
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const files: Manifest['files'] = [];
  const layoutIssues: NonNullable<Manifest['layoutIssues']> = [];
  const zipEntries: Record<string, Uint8Array> = {};
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    await fs.rm(postFile(post.brand, post.id, 'export'), { recursive: true, force: true });
    await fs.mkdir(postFile(post.brand, post.id, 'export'), { recursive: true });
    for (let i = 0; i < post.slides.length; i++) {
      const res = await page.goto(`${baseUrl}/render/${post.brand}/${post.id}/${i}`, { waitUntil: 'networkidle' });
      if (!res || !res.ok()) throw new Error(`Render page failed for slide ${i + 1} (${res?.status()})`);
      await page.waitForFunction(() => (window as unknown as { __slideReady?: boolean }).__slideReady === true, null, { timeout: 15000 });
      const issues = await page.evaluate(() => (window as unknown as { __slideIssues?: string[] }).__slideIssues ?? []);
      issues.forEach((m) => layoutIssues.push({ slide: i + 1, message: m }));
      const name = `slide-${String(i + 1).padStart(2, '0')}.png`;
      const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1350 } });
      await fs.writeFile(postFile(post.brand, post.id, 'export', name), buf);
      files.push({ name, sha256: crypto.createHash('sha256').update(buf).digest('hex') });
      zipEntries[`${post.id}/${name}`] = new Uint8Array(buf);
    }
  } finally {
    await browser.close();
  }
  zipEntries[`${post.id}/caption-instagram.txt`] = strToU8(post.captions.instagram);
  zipEntries[`${post.id}/caption-facebook.txt`] = strToU8(post.captions.facebook);
  zipEntries[`${post.id}/alt-text.txt`] = strToU8(post.captions.altText);
  zipEntries[`${post.id}/sources.md`] = strToU8(sourceNotes(post));
  zipEntries[`${post.id}/storyboard.md`] = strToU8(storyboardText(post));
  const zipName = `${post.id}.zip`;
  await fs.writeFile(postFile(post.brand, post.id, 'export', zipName), zipSync(zipEntries, { level: 6 }));
  await fs.writeFile(postFile(post.brand, post.id, 'export', 'sources.md'), sourceNotes(post));
  await fs.writeFile(postFile(post.brand, post.id, 'export', 'storyboard.md'), storyboardText(post));
  const manifest: Manifest = { at: nowIso(), contentHash: hashContent(post), files, zip: zipName, layoutIssues };
  await fs.writeFile(postFile(post.brand, post.id, 'export', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
