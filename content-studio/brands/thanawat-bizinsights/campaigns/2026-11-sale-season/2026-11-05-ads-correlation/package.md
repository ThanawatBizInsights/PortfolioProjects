# ยิงแอดแล้วยอดขายขึ้น = แอดเวิร์ก?

| Field | Value |
|---|---|
| Brand | `thanawat-bizinsights` (brand brief is a **proposal** awaiting owner confirmation) |
| Campaign | `2026-11-sale-season` |
| **Status** | **ready-for-review**. Content and video pass QC. Publishing is blocked: no destination accounts or Meta connection yet (see §8). |
| Format | Reel 1080×1920, 30 fps, 30.2 s, no voiceover (VO script included) |
| Planned publish (Asia/Bangkok) | **Thu 2026-11-05, 19:30** (proposed; six days before 11.11, so sellers see it before they judge their campaign) |
| Destination accounts | Not set yet (`accounts.md`) |

## 1. Plan

- **Audience:** Thai online sellers and small business owners who run their own Facebook/IG ads and are about to read their 11.11 results.
- **Objective:** Saves. This is a reference people come back to when they review campaign results.
- **Main takeaway:** ยอดขายขึ้นพร้อมกับตอนยิงแอด ยังไม่ได้แปลว่าแอดทำให้ยอดขึ้น ก่อนสรุปให้ถามว่า "ช่วงนั้นมีอะไรเปลี่ยนพร้อมกันอีกไหม"
- **Pillar:** Data sense (อ่านตัวเลขไม่หลงทาง). It connects to the owner's real portfolio work, a correlation analysis in `Movie Correlation Project.ipynb`.
- **Why this topic is the strongest right now:** It is timely (11.11 is ten days away), it fits the owner's real skill (correlation analysis), it is useful without any tool or purchase, and it needs no invented numbers or claims.

### Hooks

| # | Hook (first 2–3 s) | Mechanism | Assessment |
|---|---|---|---|
| **A** | ยิงแอดเพิ่ม → ยอดขายขึ้น / แปลว่าแอดเวิร์กจริงเหรอ? (with two lines rising together) | Question that challenges an assumption the audience holds | Instantly relevant to the audience, works with sound off, and the chart shows the claim visually. |
| B | ร่มขายดีวันเดียวกับที่เดลิเวอรี่พุ่ง ร่มทำให้คนหิวเหรอ? | Funny everyday contrast | Very curious, but it takes a beat to connect to the viewer's business, so it risks swipes from non-curious sellers. Used as scene 2–3 instead. |
| C | ก่อนสรุปผล 11.11 เช็กข้อนี้ก่อน | Timely tip promise | Clear, but generic. It sounds like many other "tips" posts and shows nothing in the first frames. |

**Selected: A.** It names the viewer's exact situation in the first second, and the payoff ("one question to ask") is delivered in the video.

## 2. Script

Brand voice: no ครับ/ค่ะ (per the proposed brief). Soft `นะ` is used sparingly.

### On-screen text (no-voiceover version, the one rendered)

| Scene | On-screen text |
|---|---|
| s1 | ยิงแอดเพิ่ม → ยอดขายขึ้น · [chart: ค่าแอด / ยอดขาย, ตัวเลขสมมติ] · **แปลว่าแอดเวิร์ก / จริงเหรอ?** |
| s2 | ลองดูวันฝนตกก่อน · [chart: ร่มขายได้ / เดลิเวอรี่, ตัวเลขสมมติ] · สองเส้นขึ้นลงพร้อมกันเป๊ะ |
| s3 | ~~ร่มทำให้คนหิว?~~ · ไม่ใช่ ตัวการจริงคือ · **ฝนตก** → ร่มขายดี / สั่งข้าวเยอะ |
| s4 | **Correlation**: ขึ้นลงไปด้วยกัน · **Causation**: อันหนึ่งทำให้อีกอันเกิด |
| s5 | กลับมาที่แอด / เดือนที่ยิงหนัก อาจมี… · 11.11 · เงินเดือนเพิ่งออก · ร้านจัดโปรพอดี · ยอดขายเลยขึ้นจากหลายอย่าง / ไม่ใช่แอดอย่างเดียว |
| s6 | ก่อนสรุป ถามข้อเดียว · **ช่วงนั้นมีอะไร / เปลี่ยนพร้อมกัน / อีกไหม?** |
| s7 | [bookmark icon] **เซฟไว้ / ใช้ตอนดูผล 11.11** · จะได้ไม่สรุปผลแคมเปญผิด |

### Voiceover script (for an optional VO version the owner records themselves)

| Scene | VO line | Fits rendered timing? |
|---|---|---|
| s1 | ยิงแอดเพิ่ม แล้วยอดขายขึ้น… แปลว่าแอดเวิร์กจริงเหรอ? | yes (3.6 s) |
| s2 | ลองดูวันฝนตกก่อน ร่มขายดีขึ้น ออเดอร์เดลิเวอรี่ก็พุ่งตาม | yes (4.4 s) |
| s3 | แต่ร่มไม่ได้ทำให้ใครหิวนะ ตัวการจริงคือฝนที่ตก | yes (4.8 s) |
| s4 | ขึ้นลงไปด้วยกัน เรียกว่า correlation แต่ถ้าอันหนึ่งทำให้อีกอันเกิด อันนั้นคือ causation | needs about 6.0 s (set `durationSec` to 6.0) |
| s5 | กลับมาที่แอด เดือนที่ยิงหนัก อาจตรงกับสิบเอ็ดสิบเอ็ด เงินเดือนเพิ่งออก หรือร้านจัดโปรพอดี ยอดขายเลยขึ้นจากหลายอย่าง | needs about 7.0 s |
| s6 | ก่อนสรุป ถามตัวเองข้อเดียว ช่วงนั้นมีอะไรเปลี่ยนพร้อมกันอีกไหม | yes (4.2 s) |
| s7 | เซฟไว้ ใช้ตอนดูผลสิบเอ็ดสิบเอ็ดนะ | yes (3.2 s) |

To make the VO version: record the lines, change the s4/s5 durations in a copy of `video-spec.json` (the total becomes about 33 s), re-render, then mix (see `workflow/video-production.md`).

## 3. Storyboard

| Scene | Time | Visual & animation | On-screen text | Mascot |
|---|---|---|---|---|
| s1 hook | 0.0–3.6 | Kicker fades up. Two lines (amber ค่าแอด, teal ยอดขาย) draw left to right and rise together; end labels appear. The headline slides up line by line and an amber marker sweeps under "จริงเหรอ?" | see §2 | idle (blink, bob) |
| s2 rain | 3.6–8.0 | New chart: umbrellas and delivery lines rise and dip **together** (same rainy days). Caption line follows. | see §2 | surprised (!) |
| s3 cause | 8.0–12.8 | The question shows alone for about 1.2 s, then a coral strike-through. "ไม่ใช่ ตัวการจริงคือ" fades in, the amber **ฝนตก** pill pops, and two arrows grow down to the two effect pills. | see §2 | think (?) |
| s4 define | 12.8–17.2 | Two cards slide in one after the other: teal Correlation, amber Causation. | see §2 | idle |
| s5 ads | 17.2–22.8 | Heading, then three chips stagger in (11.11 → เงินเดือน → โปร), then the footer. | see §2 | think (?) |
| s6 question | 22.8–27.0 | Kicker, then three lines of the key question; the amber marker sweeps under "เปลี่ยนพร้อมกัน". | see §2 | happy (bounce) |
| s7 CTA | 27.0–30.2 | Bookmark icon pops with a slight rotation, action text, then reason line. | see §2 | happy |

Persistent: thin amber progress bar (top), brand tag "Thanawat BizInsights" (top-left, non-essential), slow-drifting grid background.

## 4. Media (rendered and verified)

| File | What |
|---|---|
| `media/ads-correlation_1080x1920_no-voiceover.mp4` | Final video: H.264 High, yuv420p, 1080×1920, 30 fps, 30.2 s, silent stereo AAC track, faststart, about 5.1 MB |
| `media/ads-correlation_cover_1080x1920.png` | Cover (frame at 3.3 s: chart + "แปลว่าแอดเวิร์ก จริงเหรอ?") |
| `qc/safe-zone-sheet.png` | End of each scene with unsafe areas tinted red |
| `qc/export-frames-sheet.png` | 10 frames decoded from the exported MP4 |
| `qc/ffprobe.txt` | Technical report |
| `video-spec.json` | Source for re-rendering (`scripts/render-package.sh`) |

## 5. Captions

- Facebook: `captions/facebook.txt`. Longer and conversational, with a practical "how to really test it" tip, a CTA to save the post, and 2 hashtags.
- Instagram: `captions/instagram.txt`. The hook is in line 1 before "more", the copy is tighter, the CTA is to save, and there are 5 hashtags.
- **Cover text:** แปลว่าแอดเวิร์ก จริงเหรอ? (burned into the cover frame)
- **Alt text / description:** `captions/alt-text.txt` (use it wherever the platform offers an accessibility or description field).

## 6. Sources and licences

### Factual claims
| Claim in the content | Type | Source / basis |
|---|---|---|
| Two things moving together (correlation) does not by itself show one causes the other; a third factor can drive both. | Established statistics concept | Australian Bureau of Statistics, *Statistical Language: Correlation and causation*, https://www.abs.gov.au/statistics/understanding-statistics/statistical-terms-and-concepts/correlation-and-causation. **Note:** the page's existence and topic were confirmed via search on 2026-11-01, but its text couldn't be opened from this environment (network policy). Open it once manually to confirm. Secondary: Federation University helpsheet, https://www.federation.edu.au/siteassets/files/students/study-skills/correlation_vs_cause-effect_helpsheet-2025.pdf |
| Rain → more umbrella sales and more delivery orders | Illustrative everyday example, **not a statistic** | No numbers are claimed; both charts are labelled `ตัวเลขสมมติ` on screen |
| 11.11, payday and shop promotions can coincide with heavy ad months | Illustrative possibilities ("อาจมี…"), not a claim about any specific shop | n/a |
| A/B testing or comparing to a similar no-ads period (FB caption) | General method, no tool-feature claim | n/a |

No prices, results, testimonials, personal stories or statistics are claimed.

### Assets
All visuals are original and drawn in code (charts, mascot, icons, background). The fonts are Prompt and Noto Sans Thai (SIL OFL 1.1). No music, no voice. Details are in `../../../assets/LICENSES.md`.

## 7. QC (editor stage, 2026-11-01)

| Check | Result |
|---|---|
| One audience / takeaway / idea / CTA | ✅ |
| Hook readable with sound off in 2–3 s | ✅ The kicker and chart appear at 0–1 s, the headline by about 1.2 s |
| Facts sourced | ✅ concept sourced · ⚠️ owner should open the ABS link once (it was blocked here) |
| No invented data; illustrative data labelled | ✅ `ตัวเลขสมมติ` on both charts |
| Thai spelling, ไม้ยมก spacing, particles consistent (none) | ✅ |
| Read-aloud / stock phrases / variety | 🔧 fixed: the CTA originally asked for two actions (save + comment); reduced to one (save) with a reason line |
| FB vs IG captions adapted | ✅ different length, structure, CTA wording and hashtags |
| Format (ffprobe) | 🔧 fixed: the first export was full-range `yuvj420p`; re-encoded to standard `yuv420p`. Now h264 / yuv420p / 1080×1920 / 30 fps / AAC / 30.2 s |
| Full decode of exported file | ✅ no errors |
| Thai font rendering | ✅ no clipped upper or lower vowels or tone marks, no missing glyphs |
| Safe zone | 🔧 fixed: content re-centred and the mascot moved up. All essential text is now inside the safe zone and above the bottom 35% band |
| Clipped labels | 🔧 fixed: the "ออเดอร์เดลิเวอรี่" chart label was cut at the right edge, shortened to "เดลิเวอรี่"; the note size was increased |
| Reading time | 🔧 fixed: the strike-through came too early, so the question now holds about 1.2 s; s3 was extended to 4.8 s |
| Mascot clarity | 🔧 fixed: the dark bar-belly read as "teeth" at small size, so it is now a light panel with amber bars |
| Cover in the 3:4 grid crop | ✅ chart and headline inside |
| Brand consistency | ✅ only this brand's theme, fonts and mascot (all PROPOSED) |
| Licences recorded | ✅ |
| Destination accounts confirmed | ⛔ blocked: no accounts provided, no Meta connector |
| Duplicate check | ✅ the log is empty, so no duplicates (re-run before publishing) |

## 8. Approval and publishing record

| Item | State |
|---|---|
| Owner approval | **Pending.** Needs the owner to review the media, both captions, accounts and time together |
| Facebook Page | not connected |
| Instagram professional account | not connected |
| Scheduled / published | no |

**What's blocking publishing:** no Facebook or Instagram integration is available in this Claude session, and the environment can't reach Meta's API directly. Until the owner connects one, this package is ready for **manual upload**: use the MP4, cover and the two caption files as-is.
