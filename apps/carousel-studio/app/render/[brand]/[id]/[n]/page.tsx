// Bare 1080x1350 page that the exporter screenshots. No app chrome.
import { notFound } from 'next/navigation';
import { SlideView } from '@/components/SlideView';
import { ReadySignal } from '@/components/ReadySignal';
import { getConfig, getPost } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function RenderSlide({ params }: { params: Promise<{ brand: string; id: string; n: string }> }) {
  const { brand, id, n } = await params;
  const [post, config] = await Promise.all([getPost(brand, id).catch(() => null), getConfig(brand).catch(() => null)]);
  const i = Number(n);
  if (!post || !config || !post.slides[i]) notFound();
  return (
    <div style={{ width: 1080, height: 1350, overflow: 'hidden' }}>
      <SlideView slide={post.slides[i]} index={i} post={post} config={config} />
      <ReadySignal />
    </div>
  );
}
