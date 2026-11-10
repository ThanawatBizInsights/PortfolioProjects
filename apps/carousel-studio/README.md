# Carousel Studio

A small web app for planning, writing, designing, reviewing and posting Thai AI carousels on Facebook and Instagram.
**Manual-first:** every step works by hand today at no extra cost, and each one has a switch to become automatic later.

## Run it

```bash
cd apps/carousel-studio
npm install
npx playwright install chromium   # once per machine; needed for "Export JPEGs"
npm run build && npm start        # http://localhost:3100   (or: npm run dev)
```

Posts are stored as plain files in `content-studio/brands/<brand>/carousels/<id>/` (`post.json`, `images/`, `export/`), so Claude Code can read and write them too. Settings live in `content-studio/brands/<brand>/carousel.config.json`.

## The workflow (what you click)

1. **+ New carousel**: type a topic, pick a pillar and a Bangkok posting time. Choose how the first draft is written:
   - **Claude chat (copy → paste)**: *Build the brief* → *Copy* → paste into Claude (turn on web search) → paste Claude's JSON answer back → *Import*.
   - **Claude Code queue**: adds the topic to `carousel-queue.json`. Ask Claude Code to "draft the queued carousels".
   - **Blank template**: write it yourself.
2. **Editor**:
   - edit any slide's text (use `**…**` to highlight a phrase, new lines for line breaks);
   - reorder, add or delete slides;
   - edit captions, plan and sources.
3. **Images**: on a slide, *Copy prompt + brand style*, generate it in ChatGPT, Grok or Seedream, then drop, paste or choose the file. AI images never contain text; the app draws the Thai text itself.
4. **QC tab**:
   - **Red errors** block review: no sources, empty captions, more than 10 slides.
   - **Yellow warnings** are advice: long lines, stock phrases, particles, missing images, posting outside 10:00–21:00.
5. **Export JPEGs** (1080×1350) → **Send for review** → **Approve**. Approval needs a fresh export and a posting time. Any later edit sends the post back to review.
6. **Publish tab (posting kit)**:
   - download the slides and copy each platform's caption;
   - schedule the post in Meta Business Suite, then click *I scheduled it*;
   - after it goes live, paste each post link and click *Mark posted*.

   The app checks for duplicates and writes the shared `publishing-log.csv`.

## Statuses
`draft → ready-for-review → approved → scheduled → published` (or `failed`).

## What becomes automatic later (Settings → Workflow modes)

| Step | Now | Later | What it needs |
|---|---|---|---|
| Writing | Claude chat / Claude Code queue | Claude Code **scheduled task** (Sunday batch) or the Claude API | a scheduled task (uses your Pro plan), or a paid API key |
| Images | Manual upload | Image API | an API key (OpenAI / Gemini / Fuzion if it offers one) |
| Posting | Manual kit + Meta Business Suite | Meta Graph API publisher | a Meta app, Page ID, IG user ID and token in the server environment, never in chat |

Automated modes show as "later" and can't be switched on from the UI until they're built and their requirements are met. Automatic publishing stays **off** until `content-studio/brands/<brand>/automation.md` is approved.

## Code map
- `lib/schema.ts`: post, slide and brand-config shapes (zod)
- `lib/store.ts`: file storage (swap for Supabase later); `lib/workflow.ts`: status rules
- `lib/qc.ts`: quality checks (shared by the browser and the server)
- `lib/claudePrompt.ts`: the brief Claude follows; `lib/exporter.ts`: JPEG export via headless Chromium
- `lib/publishLog.ts`: duplicate check + publishing log; `lib/modes.ts`: manual and automated mode availability
- `components/SlideView.tsx`: the slide templates (cover, statement, step, prompt, summary)

## Not built yet
- No login. Run it locally or privately; add Supabase Auth before putting it online.
- Claude API drafting, the image API and the Meta API publisher are placeholders (Phase 2).
