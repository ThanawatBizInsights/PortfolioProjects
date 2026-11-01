# Content Studio

A reusable workflow that helps you plan, write, animate, check and publish Thai short videos for Facebook and Instagram. Each brand keeps its own folder, voice, assets and accounts.

## How it works (in plain words)

1. **Plan** (`content-planner`): picks a useful topic, one takeaway, three hooks plus the best one, and a posting time.
2. **Write** (`thai-writer`): writes the script, on-screen text, and separate Facebook and Instagram captions in natural, casual Thai.
3. **Animate** (`animation-creator`): turns the script into a scene-by-scene storyboard and renders a real 1080×1920 MP4 with Thai fonts.
4. **Check** (`content-editor`): checks facts, Thai, timing, safe zones, fonts, the exported file and the brand. It fixes problems and checks again.
5. **Publish** (`publisher`): shows you everything for approval, then posts or schedules it and logs the result. Default: **nothing goes out without your OK.**

To use it in Claude Code, ask for something like:
> "Use the content-planner for thanawat-bizinsights: plan next week's 2 Reels"
> "Run the full workflow on idea X for brand Y"

## Folder layout

```
content-studio/
  workflow/            rules shared by all brands (Thai style, specs, QC, publishing)
  renderer/            Remotion video renderer (brand-independent)
  scripts/             render-package.sh, publish_log.py
  brands/<brand>/
    brand-brief.md     who we talk to, voice, pillars, visual identity
    theme.json         colours, fonts, mascot used by the renderer
    accounts.md        which FB/IG accounts (names only, never passwords)
    automation.md      auto-publishing rules (off until you approve)
    calendar.md        content calendar
    publishing-log.csv what was posted, where, post IDs and links
    assets/LICENSES.md where every asset came from and its terms
    campaigns/<campaign>/<YYYY-MM-DD>-<slug>/
      package.md       the full reviewable package (plan, script, storyboard, captions, sources, QC, status)
      video-spec.json  scenes and timing, used to (re)render
      captions/        facebook.txt, instagram.txt, alt-text.txt (ready to paste)
      media/           final MP4 and cover
      qc/              safe-zone and playback check images
```

## Adding a new brand
Copy `brands/thanawat-bizinsights/` to `brands/<new-slug>/`, delete its `campaigns/`, clear the calendar and log, and rewrite `brand-brief.md`, `theme.json` and `accounts.md`. The agents and renderer don't need any changes.

## What's set up right now (2026-11-01)

| Thing | State |
|---|---|
| Workflow, 5 subagents, Thai style guide, QC checklist | ✅ ready |
| Video rendering (Remotion + ffmpeg + Thai fonts) | ✅ works here; the sample took about 1 min 45 s |
| Sample package (`2026-11-05-ads-correlation`) | ✅ rendered and checked, **waiting for your review** |
| Brand brief | ⚠️ proposed from your GitHub name and portfolio projects; please confirm |
| Facebook / Instagram publishing | ⛔ not connected. No Meta connector in this session, and the network blocks Meta's API. Packages are ready for manual upload. |
| Voiceover | Script written; not recorded (you'd record it yourself, with no voice cloning) |
| Music | None added; pick from the in-app music library when you upload |

## Connecting publishing later
You'd connect a Facebook Page and an Instagram **professional** (business or creator) account through an official integration in your Claude connector settings, or through a scheduling tool with an official Meta integration. You never paste passwords or tokens into chat. Once connected, the publisher checks which accounts and permissions it can see before doing anything.
