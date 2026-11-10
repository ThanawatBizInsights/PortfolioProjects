import { NextResponse } from 'next/server';
import { exportIsFresh, getPost, writePost } from '@/lib/store';
import { appendLog, findDuplicates } from '@/lib/publishLog';
import { brandOf, fail } from '@/lib/http';
import { nowIso } from '@/lib/time';

// Manual posting kit: record what happened on each platform.
// GET  -> duplicate check for both platforms
// POST { platform, outcome: 'posted'|'failed', permalink, postId, note }
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const post = await getPost(brandOf(req), (await params).id);
    return NextResponse.json({
      instagram: await findDuplicates(post, 'instagram'),
      facebook: await findDuplicates(post, 'facebook'),
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const brand = brandOf(req);
    const post = await getPost(brand, (await params).id);
    const { platform, outcome, permalink = '', postId = '', note = '' } = await req.json();
    if (platform !== 'instagram' && platform !== 'facebook') return NextResponse.json({ error: 'platform must be instagram or facebook' }, { status: 400 });
    if (!['approved', 'scheduled', 'published', 'failed'].includes(post.status))
      return NextResponse.json({ error: 'Approve the post before recording a publish result.' }, { status: 409 });
    if (!(await exportIsFresh(post))) return NextResponse.json({ error: 'The exported slides are out of date. Re-export and re-approve first.' }, { status: 409 });
    if (outcome === 'posted' && !/^https?:\/\//.test(permalink))
      return NextResponse.json({ error: 'Paste the post link (permalink) from the platform to confirm it was posted.' }, { status: 400 });

    await appendLog(post, platform, { status: outcome === 'posted' ? 'published' : 'failed', permalink, postId, notes: note });
    const publish = { ...post.publish, [platform]: { status: outcome === 'posted' ? 'posted' : 'failed', postId, permalink, at: nowIso(), note } };
    const both = publish.instagram.status === 'posted' && publish.facebook.status === 'posted';
    const status = outcome === 'failed' ? 'failed' : both ? 'published' : post.status;
    const saved = await writePost({
      ...post,
      publish,
      status,
      history: [...post.history, { at: nowIso(), event: `${platform}: ${outcome}${permalink ? ` ${permalink}` : ''}${note ? ` (${note})` : ''}` }],
    });
    return NextResponse.json(saved);
  } catch (e) {
    return fail(e);
  }
}
