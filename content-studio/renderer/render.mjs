// Usage:
//   node render.mjs --spec <spec.json> --theme <theme.json> --out <file.mp4>
//   node render.mjs --spec <spec.json> --theme <theme.json> --stills <dir> [--safe]   (QC frames: middle of every scene)
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, []),
);
if (!args.spec || !args.theme || (!args.out && !args.stills)) {
  console.error('Need --spec, --theme and --out or --stills');
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(args.spec, 'utf8'));
const theme = JSON.parse(fs.readFileSync(args.theme, 'utf8'));
if (args.safe) spec.showSafeZone = true;
else if (args.out) spec.showSafeZone = false; // never ship the QC overlay

// Prefer an env override, then the pre-installed headless shell, else let Remotion download its own.
const candidates = [
  process.env.REMOTION_BROWSER,
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
].filter(Boolean);
const browserExecutable = candidates.find((p) => fs.existsSync(p)) ?? null;

const serveUrl = await bundle({ entryPoint: path.join(here, 'src/index.ts'), publicDir: path.join(here, 'public') });
const inputProps = { spec, theme };
const composition = await selectComposition({ serveUrl, id: 'ShortVideo', inputProps, browserExecutable });
console.log(`Composition: ${composition.width}x${composition.height} @${composition.fps}fps, ${composition.durationInFrames} frames (${(composition.durationInFrames / composition.fps).toFixed(1)}s)`);

if (args.stills) {
  fs.mkdirSync(args.stills, { recursive: true });
  let cursor = 0;
  for (const s of spec.scenes) {
    const frames = Math.round(s.durationSec * spec.fps);
    for (const [tag, f] of [['mid', cursor + Math.floor(frames * 0.5)], ['end', cursor + frames - 9]]) {
      const output = path.join(args.stills, `${s.id}-${tag}.png`);
      await renderStill({ composition, serveUrl, output, frame: f, inputProps, browserExecutable });
      console.log('still', output);
    }
    cursor += frames;
  }
} else {
  fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
  let lastPct = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: args.out,
    inputProps,
    browserExecutable,
    crf: 18,
    pixelFormat: 'yuv420p',
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== lastPct) console.log(`rendering ${pct}%`);
      lastPct = pct;
    },
  });
  console.log('\nwrote', args.out);
}
