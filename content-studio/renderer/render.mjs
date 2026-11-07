// Usage (run from content-studio/renderer):
//   node render.mjs --out=out/video.mp4                      full video from examples/ (sample spec + theme)
//   node render.mjs --clip --out=out/clip.mp4                quick preview: first 6 s
//   node render.mjs --clip=8-13 --out=out/clip.mp4           preview of seconds 8 to 13
//   node render.mjs --spec <spec.json> --theme <theme.json> --out <file.mp4>
//   node render.mjs --spec <spec.json> --theme <theme.json> --stills <dir> [--safe]   (QC frames: middle + end of every scene)
// Flags accept both "--key value" and "--key=value". Without --spec/--theme the examples/ files are used.
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) continue;
  const eq = a.indexOf('=');
  if (eq !== -1) args[a.slice(2, eq)] = a.slice(eq + 1);
  else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) args[a.slice(2)] = argv[++i];
  else args[a.slice(2)] = true;
}
args.spec ??= path.join(here, 'examples/spec.example.json');
args.theme ??= path.join(here, 'examples/theme.example.json');
if (!args.out && !args.stills) {
  console.error('Need --out=<file.mp4> (or --stills=<dir>). See the usage notes at the top of render.mjs.');
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
  // --clip renders a short preview instead of the whole video.
  let frameRange = null;
  if (args.clip) {
    const [a, b] = args.clip === true ? [0, 6] : String(args.clip).split('-').map(Number);
    if (!(a >= 0 && b > a)) {
      console.error('--clip must look like --clip or --clip=8-13 (seconds)');
      process.exit(1);
    }
    const last = composition.durationInFrames - 1;
    frameRange = [Math.min(Math.round(a * composition.fps), last), Math.min(Math.round(b * composition.fps) - 1, last)];
    console.log(`Clip: frames ${frameRange[0]}-${frameRange[1]} (${a}s to ${Math.min(b, composition.durationInFrames / composition.fps)}s)`);
  }
  await renderMedia({
    frameRange,
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
