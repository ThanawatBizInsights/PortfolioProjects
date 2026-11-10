import fs from 'node:fs/promises';
import { postFile } from '@/lib/store';
import { fail } from '@/lib/http';

const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', json: 'application/json', zip: 'application/zip', md: 'text/markdown; charset=utf-8', txt: 'text/plain; charset=utf-8' };

// /api/files/<brand>/<postId>/<images|export>/<file>
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const [brand, id, folder, file, ...rest] = (await params).path;
    if (rest.length || !['images', 'export', 'references'].includes(folder) || !file) return new Response('Not found', { status: 404 });
    const buf = await fs.readFile(postFile(brand, id, folder, decodeURIComponent(file)));
    const ext = file.split('.').pop()!.toLowerCase();
    return new Response(new Uint8Array(buf), { headers: { 'content-type': MIME[ext] ?? 'application/octet-stream', 'cache-control': 'no-store' } });
  } catch (e) {
    return fail(e);
  }
}
