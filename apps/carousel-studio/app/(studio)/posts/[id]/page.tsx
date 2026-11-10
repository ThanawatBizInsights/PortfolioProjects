import { notFound } from 'next/navigation';
import { DEFAULT_BRAND, exportIsFresh, getConfig, getManifest, getPost, getRegistry } from '@/lib/store';
import { publishingModes } from '@/lib/modes';
import { PostEditor } from '@/components/PostEditor';

export const dynamic = 'force-dynamic';

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ brand?: string }> }) {
  const { id } = await params;
  const brand = (await searchParams).brand ?? DEFAULT_BRAND;
  const post = await getPost(brand, id).catch(() => null);
  if (!post) notFound();
  const [config, registry, exportFresh, manifest] = await Promise.all([getConfig(brand), getRegistry(brand), exportIsFresh(post), getManifest(brand, id)]);
  return <PostEditor initialPost={post} config={config} registry={registry} initialExportFresh={exportFresh} initialManifest={manifest} publishing={publishingModes()} />;
}
