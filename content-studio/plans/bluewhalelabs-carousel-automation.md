# Plan: AI carousel autopilot for Bluewhalelabs (Facebook + Instagram)

Status: **proposal for discussion** (2026-11-10). Nothing is built yet.
Brand files: `content-studio/brands/bluewhalelabs/`

---

## 1. The idea in one paragraph

A small web app that, every week, finds useful and **verified** things to say about Claude and practical AI. It turns each one into a 7–9 slide Thai carousel in the balena studio style, writes separate Instagram and Facebook captions, shows you the batch to approve in a few minutes, and then posts on schedule to both accounts. It records every result and learns from the stats which topics and times work.

## 2. Key decisions (and why)

| Decision | Choice | Why |
|---|---|---|
| Who writes the Thai text | Claude, via **Claude Code scheduled tasks on the owner's subscription** (see §9; the API is the fallback) | Best at research, structure and natural Thai. It uses the server-side web search and web fetch tools, limited to official sources. |
| Who makes the pictures | An image model (OpenAI GPT Image or Google Gemini image) **for illustrations only, with no text in the image** | Thai text from image models is still unreliable: tests in Sept 2026 found some models unreadable in Thai, and even the best aren't perfect. A misspelled Thai slide kills trust. |
| Who puts Thai text on slides | **Our own template renderer** (HTML/CSS + real Thai fonts → JPEG) | Every vowel and tone mark is guaranteed correct, the brand stays consistent, and text can be edited in one click without re-generating the image. |
| "MCP with ChatGPT / image AI"? | **Inside the app: call the image APIs directly.** MCP is for when *you and I* work in Claude Code. | A scheduled app runs without Claude Code open, so direct API calls are simpler, cheaper and more reliable. Later we can expose the app *as* an MCP server, so you could tell Claude "make a carousel about X" from chat. |
| Posting | Official Meta Graph API (Instagram Content Publishing + Facebook Pages API) | The only approved way to post automatically. No passwords and no browser bots, which could get accounts restricted. |
| Hosting | Next.js on **Vercel** + **Supabase** (database, file storage, login) | Matches your cover image and skills. Free tiers likely cover the start. Instagram needs public image URLs, and Supabase Storage provides them. |
| Automation level | **Weekly batch approval first**, then automatic posting for evergreen topics once quality is proven | AI news is easy to get wrong. One wrong "Claude can now…" post costs more than 10 minutes of review a week. |

## 3. Content strategy

**Promise to the audience:** "เข้าใจ AI แล้วเอาไปใช้ได้จริง ภายใน 1 นาทีต่อโพสต์"

### Pillars

| Pillar | What | Example topic | Share |
|---|---|---|---|
| 1. Claude ใช้ยังไง | Feature walkthroughs with real steps or screens | "Projects ใน Claude: เก็บไฟล์และคำสั่งไว้ใช้ซ้ำ" | 30% |
| 2. Prompt สูตรพร้อมใช้ | Copyable prompt templates (high saves) | "5 prompt สรุปประชุมให้เป็น action list" | 25% |
| 3. AI ทำงานจริง | Image, video, web and business use cases, across tools (Claude, ChatGPT, Gemini) | "ทำเว็บแรกด้วย Claude + Vercel ใน 4 ขั้น" | 20% |
| 4. อัปเดต AI ที่ควรรู้ | Verified news explained plainly (official sources only) | "Claude อัปเดตอะไรเดือนนี้ เลือกมา 3 อย่างที่ใช้ได้เลย" | 15% |
| 5. ศัพท์ AI / เข้าใจผิดบ่อย | Glossary and myth-busting | "Token คืออะไร ทำไม AI ถึงลืมสิ่งที่คุยกันไปแล้ว" | 10% |

Bonus series that fits the brand: **"สร้างระบบนี้ไปพร้อมกัน"**, behind the scenes of building this autopilot with Claude, Vercel and Supabase. It's real, original and on-brand for "Coding".

### Carousel template (default 8 slides, 1080×1350 portrait 4:5)

| # | Slide | Rule |
|---|---|---|
| 1 | **Cover hook**: big Thai headline + illustration + balena logo | Readable in 1 second, max ~14 Thai characters per line, 2–3 lines |
| 2 | Why it matters / the problem | One relatable sentence |
| 3–6 | One point or step per slide | Number, short title, 1–2 lines of explanation, optional mini screenshot or icon |
| 7 | Example or copyable prompt | Monospace box, easy to screenshot |
| 8 | Summary + CTA ("เซฟไว้ลองทำ" / "ติดตามไว้ อัปเดตทุกสัปดาห์") + "ข้อมูล ณ <date>" | One CTA only |

The Instagram API allows up to 10 slides per carousel, which caps us there. The cover's key text stays inside the centre so it survives the profile-grid crop.

### Captions
- **Instagram:** the hook in line 1, a 3–5 line summary, CTA, 3–5 hashtags, "ที่มา:" with the source.
- **Facebook:** slightly longer and conversational, ending with a question that invites real comments; 0–3 hashtags; source link in the text.

### Quality bar (inherits `content-studio/workflow/`)
Natural Thai from `thai-style-guide.md`. Every factual claim links to an official source with a check date. No invented features, prices, benchmarks or testimonials. Tool logos are never used to imply partnership.

**Allowed news sources (first version):** anthropic.com (news), claude.com (blog and help), docs.claude.com and platform.claude.com (release notes), status.claude.com. For other tools, only their official blogs and docs.

## 4. Posting plan and schedule (Asia/Bangkok)

Start steady, then let the data move the times.

| Day | Time | Post |
|---|---|---|
| Tue | 12:15 | Carousel: Pillar 1 or 3 (lunch-break scroll) |
| Thu | 19:45 | Carousel: Pillar 2, prompt recipe (evening, save-worthy) |
| Sat | 10:15 | Carousel: Pillar 5 or the behind-the-scenes series (relaxed weekend read) |
| Any day | when it happens | **News carousel** (Pillar 4), only when Anthropic ships something useful. Always human-approved. |

These times are a starting **assumption**, not data. After 4 weeks the app compares reach, saves and shares by slot and suggests new times.

**Weekly rhythm:**
- **Every day 07:00:** news scan of the official sources. If something new and important appears, a news draft is created and you get a notification.
- **Sunday 18:00:** the app drafts next week's 3 carousels and notifies you.
- **Sunday or Monday:** you review the batch (about 10 minutes): approve, edit text inline, or regenerate a slide.
- **On approval:** posts are scheduled. The publisher posts at the set time, checks the platform's response, saves the link, and stops and alerts you on any failure.
- **24 h and 7 days after a post:** the app pulls insights (reach, saves, shares, comments, follows).

**First-month target:** 12–14 carousels on both platforms. At 1 follower, consistency matters more than volume.

## 5. How the app works (pipeline)

```
[Scheduler] ──► 1 Research ──► 2 Plan ──► 3 Write Thai ──► 4 Visuals ──► 5 Render slides ──► 6 QC ──► [You approve] ──► 7 Publish ──► 8 Log + Insights
```

| Stage | Does | Tech |
|---|---|---|
| 1 Research | Finds candidate topics; collects facts **with URLs + dates** | Claude API + `web_search` / `web_fetch` tools limited to the allowed domains |
| 2 Plan | Picks the angle, writes 3 hooks and picks one, makes the slide outline | Claude, structured JSON output |
| 3 Write Thai | Slide text (with character limits per slide type), IG and FB captions, alt text | Claude + brand brief + Thai style guide in the prompt (cached) |
| 4 Visuals | Text-free illustrations in the balena style (cover + 1–3 slides) | Image API (pick after the test in §8) |
| 5 Render | HTML template + Thai fonts → 1080×1350 JPEG per slide | Headless Chromium (we already render Thai cleanly with it in this repo) |
| 6 QC | Automatic checks: text fits, fonts load, every claim has a source, banned phrases, duplicate topic, account and time sanity. Then a second Claude "editor" pass that lists issues. | Code + Claude |
| 7 Publish | **Instagram:** create a container per slide → carousel container → publish at the scheduled time. **Facebook:** upload photos unpublished → multi-photo post (Facebook can also hold the schedule natively, 10 min – 30 days ahead). | Meta Graph API; our cron runs every 5–10 min |
| 8 Log | Post ID, permalink and raw response; later the insights | Supabase |

**Status flow** (same as the studio): `idea → draft → ready-for-review → approved → scheduled → publishing → published | failed`

**Main database tables:** `sources`, `ideas`, `posts` (pillar, status, scheduled_at, captions), `slides` (order, type, text, image prompt, image URL, rendered JPEG URL), `approvals`, `publish_attempts` (platform, request, response, post ID, permalink, error), `metrics`.

**Screens:**
1. **Calendar:** the week at a glance with a status colour per post.
2. **Review:** swipe through the slides exactly as they'll appear, edit text in place, regenerate one slide, see sources, approve or reject.
3. **Ideas inbox:** topics the scanner found, plus your own ideas.
4. **Results:** which pillars, hooks and times perform best.
5. **Settings:** accounts, posting slots, automation switch (off by default) and the kill switch.

**Notifications:** email to start (LINE Notify was shut down in 2025, so LINE would need the Messaging API, which adds setup).

## 6. Setup you'd need to do (I can't do these for you)

1. **Instagram professional account** (business or creator) linked to the Bluewhalelabs Page. The boost prompt suggests it already is; confirm the handle.
2. **Meta developer app** (free) with you as admin. Permissions to request for your own accounts: Instagram content publishing, Page posting, Page read access, Instagram insights. Apps used only by their own admins usually don't need full App Review, but confirm this during setup.
3. **API keys:** Anthropic (Claude) and the chosen image provider.
4. **Vercel + Supabase projects** (both are connected to this Claude session).

Tokens and keys go **only** into Vercel/Supabase environment settings, never into chat or the repo.

## 7. Automation boundaries (what "automatic" will and won't do)

Proposed, saved in `brands/bluewhalelabs/automation.md` (currently `enabled: false`):
- **Phase A (start):** every post needs your approval; batch approval makes it about 10 minutes a week.
- **Phase B (after about 4 clean weeks):** evergreen pillars (prompt recipes, glossary, behind the scenes) may auto-post if every automatic QC check passes. **News and anything mentioning prices or new features still needs approval.**
- **Always:** max 1 post per platform per day, posting only between 10:00 and 21:00, duplicate check, stop-all on any failure, kill switch, every attempt logged.

## 8. Build roadmap

| Phase | Goal | Done when |
|---|---|---|
| **0. Spikes** (first) | Prove the three risky parts | ① A test carousel posted to IG and FB via the API from a script; ② a Thai slide rendered on Vercel or a worker that looks identical to local; ③ a side-by-side of 2 image models on 5 balena-style prompts (cost + quality) |
| **1. MVP** | Type a topic → get a reviewed carousel → "Publish now" | One real post made fully through the app |
| **2. Scheduling** | Weekly batch, approval screen, cron publisher, logs, email alerts | One full week runs on schedule with no manual posting |
| **3. Learning** | Daily news scan, insights collection, performance page, time suggestions | 4 weeks of data shown per pillar and slot |
| **4. Autopilot** | Phase B auto-posting under the §7 boundaries | You flip the switch in Settings |

While the app is being built, we can still make the first carousels with the current Content Studio workflow, so the Page isn't empty.

## 9. Budget: run it on what the owner already pays for (updated 2026-11-10)

The owner already has: a **Claude** yearly subscription, a **ChatGPT** yearly subscription, and **฿1,000 of Fuzion AI credits** (the Pro pack: 1,050 credits, which never expire).

**Important:** the Claude and ChatGPT app subscriptions **don't include API access**, which is billed separately. So the original "Claude API on Vercel" design would add a new bill. The redesign below avoids that.

### Zero-extra-cost design

| Job | Was | Now | Extra cost |
|---|---|---|---|
| Research + Thai writing + QC | Claude API | **Claude Code scheduled tasks** (cloud sessions on the Claude subscription): Sunday 18:00 weekly batch, 07:00 daily news check | ฿0 (uses the plan's usage limits, shared with normal chat) |
| Slide rendering | Server renderer | The same Remotion/Chromium renderer already in this repo, run inside the scheduled session | ฿0 |
| Illustrations | Image API | **Fuzion credits** (Grok Image ≈ 1 credit, Seedream 5.0 Pro ≈ 2 credits per image, from the plan page), or ChatGPT image generation in the app; plus free code-drawn icons and diagrams | from the existing ฿1,000 |
| Review | Web app | An approval page and push notification on the phone: reply "approve" | ฿0 |
| Posting at exact times | Vercel app | A small no-AI publisher script on a free scheduler (Supabase Edge Function + cron, or GitHub Actions), plus Facebook's own scheduling | ฿0 within free tiers |
| Meta Graph API | | | free |

### Fuzion credit math (approximate, from the "~" figures on Fuzion's plan page)
- 14 carousels a month × 2 AI images (cover + 1 hero) = 28 images.
- With one retry each, about 56 generations a month.
- **Grok Image (~1 credit):** about 56 credits a month, so ฿1,000 lasts **about 18 months**.
- **Seedream 5.0 Pro (~2 credits):** about 112 credits a month, so it lasts **about 9 months**.

### Limits to know
1. **No public Fuzion API was found** (search, 2026-11-10). Unless Fuzion offers one, image generation is a **manual 5–10 minute weekly step**: Claude writes the batch of image prompts, the owner generates them in Fuzion or ChatGPT, and drops the files into the post folder. Everything else stays automatic. If Fuzion does have an API key or developer page, this step can be automated.
2. **Subscription usage limits:** scheduled runs share the Claude plan's limits with normal chatting. A weekly batch of 3 carousels plus short daily news checks should be modest on Max. On Pro, heavy chat days could collide, so run the batch at a quiet time.
3. **ChatGPT images** work only manually in the app, because the API is billed separately.
4. **Free tiers:** Vercel Hobby is for non-commercial use. If the Page earns money, use the Supabase or GitHub Actions publisher instead.
5. **Network:** this cloud environment currently blocks Meta's API host. It must be allowed (with the owner's approval) before posting from here.

## 10. Risks and how we handle them

| Risk | Mitigation |
|---|---|
| Wrong or outdated AI facts | Official-source allowlist, a source on every claim, "ข้อมูล ณ วันที่", news always approved |
| Broken Thai on images | No text in AI images; Thai rendered by our template with real fonts |
| Meta API changes, token expiry, rate limits | Check the publishing limit before posting; long-lived tokens refreshed automatically; alert on failure; package stays ready for manual upload |
| Same-looking posts (template fatigue) | 3–4 layout variants, cover illustration varies per post |
| Trademark confusion | No partner-style logo use; disclaimer where needed |
| Posting at 3 a.m. by mistake | Posting window + Asia/Bangkok everywhere + preview of exact time on approval |

## 11. Open questions for the owner

1. **Name on slides:** "Bluewhalelabs" or "balena studio"? The Page uses one and the logo the other.
2. **Voice:** end sentences with ครับ, ค่ะ, or neither?
3. **Image model and budget:** OK to test both GPT Image and Gemini in Phase 0 and pick by quality and cost? Is there a monthly budget cap?

---
Sources checked 2026-11-10: Meta Instagram Content Publishing docs (carousels up to 10 items; check `content_publishing_limit`) https://developers.facebook.com/docs/instagram-platform/content-publishing/ · Meta Page Photos / Pages posts docs (multi-photo via `attached_media`; scheduling 10 min – 30 days) https://developers.facebook.com/docs/graph-api/reference/page/photos · Thai text test of image models (Marketing Oops via Relevant Audience, Sept 2026) https://www.relevantaudience.com/ai/th-ai-passport-aipass-image-models-thai-text-test/ · Claude API pricing and tools: Anthropic Claude API skill reference (cached 2026-11-03).
