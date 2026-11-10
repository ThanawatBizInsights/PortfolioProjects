import { DEFAULT_BRAND, getConfig, getRegistry } from '@/lib/store';
import { generationModes, imageModes, publishingModes } from '@/lib/modes';
import { SettingsForm } from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function Settings({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const brand = (await searchParams).brand ?? DEFAULT_BRAND;
  return <SettingsForm initial={await getConfig(brand)} registry={await getRegistry(brand)} modes={{ generation: generationModes(), images: imageModes(), publishing: publishingModes() }} />;
}
