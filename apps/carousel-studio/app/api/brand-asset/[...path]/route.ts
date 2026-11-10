import fs from 'node:fs/promises';
import { brandAsset } from '@/lib/store';
import { fail } from '@/lib/http';

const MIME: Record<string, string> = { png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

// /api/brand-asset/<brand>/<path inside the brand folder>  (logo, mascot poses, references)
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const [brand, ...rest] = (await params).path;
    const file = brandAsset(brand, rest.map(decodeURIComponent).join('/'));
    const ext = file.split('.').pop()!.toLowerCase();
    return new Response(new Uint8Array(await fs.readFile(file)), { headers: { 'content-type': MIME[ext] ?? 'application/octet-stream', 'cache-control': 'no-store' } });
  } catch (e) {
    return fail(e);
  }
}
