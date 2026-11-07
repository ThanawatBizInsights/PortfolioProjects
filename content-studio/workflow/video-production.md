# Video production

## Renderer
`content-studio/renderer/` is a brand-independent **Remotion** project (React → MP4).

- **Input 1:** the package's `video-spec.json` (scenes, timing, text, mascot reactions, cover time, safe zone)
- **Input 2:** the brand's `theme.json` (colours, Thai fonts, mascot on/off and colours)
- **Scene types:** `hook`, `chart`, `cause`, `define`, `list`, `question`, `cta` (see `renderer/src/types.ts`)

```bash
content-studio/scripts/render-package.sh <package-dir> <brand>/theme.json <name>
```
This writes:
- `media/<name>_1080x1920_no-voiceover.mp4`: H.264 yuv420p with a silent AAC track and faststart
- `media/<name>_cover_1080x1920.png`
- `qc/safe-zone-sheet.png`: the end of each scene with the unsafe areas tinted red
- `qc/export-frames-sheet.png`: 10 frames pulled from the exported file, to check playback
- `qc/ffprobe.txt`

For a quick preview while tweaking, run `node render.mjs --clip --out=out/video.mp4` inside `renderer/`. It renders the first 6 s of the sample spec in about 15 s; use `--clip=8-13` for a different range, and add `--spec`/`--theme` for a real package. Preview clips are raw renders. Use `render-package.sh` for the final upload file, which gets the yuv420p, audio track and QC steps.

For live preview, run `cd content-studio/renderer && npx remotion studio src/index.ts` (it uses `examples/`).

The browser is the pre-installed Chromium headless shell. Set `REMOTION_BROWSER=/path/to/chrome` to override it. On a machine without it, Remotion downloads its own.

**Remotion licence:** Remotion is free for individuals and companies with up to 3 employees. Larger companies need a company licence. Check https://www.remotion.dev/license before commercial use at scale.

## Motion rules
- Motion must explain something: text reveal, a marker highlight on the key phrase, a chart drawing itself, cause → effect arrows, a strike-through on the wrong idea, or the mascot reacting (idle / think / surprised / happy).
- No random shakes, glitch effects or transitions that compete with the text.
- Let a question sit on screen about 1 s before revealing the answer.

## Thai typography
Fonts live in `renderer/public/fonts` (Prompt for headings, Noto Sans Thai for body text, both under the SIL OFL). Check that upper and lower vowels and tone marks aren't clipped. Line-height is 1.35 or more.

## Versions
- **No-voiceover** (default): the on-screen text carries the whole message.
- **Voiceover:** the owner records the VO script themselves, or uses a consenting voice talent. Mix it with `ffmpeg -i video.mp4 -i vo.wav -map 0:v -map 1:a -c:v copy -c:a aac -shortest out.mp4` and re-time scenes in the spec if needed. Never clone a voice without permission.
- **Music:** none is bundled. Add it from the platform's in-app library at upload, or use a track whose licence is recorded in `assets/LICENSES.md`.

## When generation tools are missing
Write precise prompts (subject, style, composition, 9:16 framing, theme colours, what to avoid) under "Assets needed" in the package, and finish everything else.
