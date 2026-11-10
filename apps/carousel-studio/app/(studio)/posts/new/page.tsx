import { DEFAULT_BRAND, getConfig } from '@/lib/store';
import { generationModes } from '@/lib/modes';
import { NewPostForm } from '@/components/NewPostForm';

export const dynamic = 'force-dynamic';

export default async function NewPost({ searchParams }: { searchParams: Promise<{ brand?: string; date?: string; time?: string }> }) {
  const sp = await searchParams;
  const brand = sp.brand ?? DEFAULT_BRAND;
  const config = await getConfig(brand);
  const initial = sp.date && sp.time ? `${sp.date}T${sp.time}` : '';
  return <NewPostForm brand={brand} pillars={config.pillars} defaultMode={config.modes.generation} modes={generationModes()} initialTime={initial} />;
}
