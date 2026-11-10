// Status changes and the rules behind them (mirrors content-studio/workflow/publishing.md).
import 'server-only';
import { runQc, hasErrors } from './qc';
import { exportIsFresh, getConfig, hashContent, writePost } from './store';
import { contentKey, type Post, type Status } from './schema';
import { nowIso } from './time';

export type Action = 'submit' | 'approve' | 'schedule' | 'back-to-draft' | 'mark-failed';

export class WorkflowError extends Error {}

const log = (p: Post, event: string): Post => ({ ...p, history: [...p.history, { at: nowIso(), event }] });

export async function applyAction(post: Post, action: Action, note = ''): Promise<Post> {
  const config = await getConfig(post.brand);
  const fresh = await exportIsFresh(post);
  const issues = runQc(post, config, { exportFresh: fresh });
  const need = (allowed: Status[]) => {
    if (!allowed.includes(post.status)) throw new WorkflowError(`Can't ${action} a post that is "${post.status}".`);
  };

  switch (action) {
    case 'submit':
      need(['idea', 'draft', 'failed']);
      if (hasErrors(issues)) throw new WorkflowError('Fix the red QC errors before sending for review.');
      return writePost(log({ ...post, status: 'ready-for-review' }, 'sent for review'));

    case 'approve':
      need(['ready-for-review']);
      if (hasErrors(issues)) throw new WorkflowError('Fix the red QC errors before approving.');
      if (!fresh) throw new WorkflowError('Export the slides first, so you approve the exact images that will be posted.');
      if (!post.scheduledAt) throw new WorkflowError('Set a posting time (Asia/Bangkok) before approving.');
      return writePost(
        log({ ...post, status: 'approved', approval: { at: nowIso(), contentHash: hashContent(post) } }, `approved for ${post.scheduledAt}`),
      );

    case 'schedule':
      need(['approved']);
      if (!post.scheduledAt || new Date(post.scheduledAt).getTime() < Date.now())
        throw new WorkflowError('The posting time must be in the future.');
      return writePost(log({ ...post, status: 'scheduled' }, `scheduled for ${post.scheduledAt}${note ? ` (${note})` : ''}`));

    case 'back-to-draft':
      if (post.status === 'published') throw new WorkflowError('A published post can’t go back to draft.');
      return writePost(log({ ...post, status: 'draft', approval: { at: '', contentHash: '' } }, 'moved back to draft'));

    case 'mark-failed':
      return writePost(log({ ...post, status: 'failed' }, `failed: ${note || 'no details'}`));
  }
}

/** Saving edits: a material change after approval sends the post back to review. */
export async function saveEdits(previous: Post, incoming: Post): Promise<Post> {
  let next: Post = {
    ...incoming,
    id: previous.id,
    brand: previous.brand,
    status: previous.status,
    approval: previous.approval,
    publish: previous.publish,
    history: previous.history,
    createdAt: previous.createdAt,
  };
  const changed = contentKey(previous) !== contentKey(next);
  if (changed && (previous.status === 'approved' || previous.status === 'scheduled')) {
    next = log({ ...next, status: 'ready-for-review', approval: { at: '', contentHash: '' } }, 'edited after approval, needs re-approval');
  }
  return writePost(next);
}
