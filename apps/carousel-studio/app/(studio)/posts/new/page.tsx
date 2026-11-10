import { DEFAULT_BRAND, getConfig, getRegistry } from '@/lib/store';
import { generationModes } from '@/lib/modes';
import { NewPostForm } from '@/components/NewPostForm';

export const dynamic = 'force-dynamic';

export default async function NewPost({ searchParams }: { searchParams: Promise<{ brand?: string; date?: string; time?: string }> }) {
  const sp = await searchParams;
  const brand = sp.brand ?? DEFAULT_BRAND;
  const [config, registry] = await Promise.all([getConfig(brand), getRegistry(brand)]);
  return (
    <NewPostForm brand={brand} pillars={config.pillars} defaultMode={config.modes.generation} modes={generationModes()} initialTime={sp.date && sp.time ? `${sp.date}T${sp.time}` : ''}
      providers={registry.providers.map((p) => ({ id: p.id, name: p.name, hasMascot: !!p.mascot }))} />
  );
}
