# Quality checklist (the editor fills this in per package)

Mark each item: ✅ pass · 🔧 fixed (what was changed) · ⛔ blocked (why) · n/a

## Content
- [ ] One audience, one takeaway, one main idea, one CTA
- [ ] Hook understandable in the first 2–3 s with sound off, and the video pays it off
- [ ] Every factual claim has a source and the source supports it
- [ ] Tool features, prices and policies checked against the official source on this date (if any)
- [ ] No invented experiences, testimonials, results, prices or stats; illustrative numbers labelled

## Thai
- [ ] Spelling, ไม้ยมก spacing, consistent ending particles per the brand brief
- [ ] Read-aloud test passed: no stiff or translated phrasing, no stock phrases, varied sentence openings
- [ ] FB and IG captions are actually adapted, not copied

## Video
- [ ] 1080×1920, H.264, yuv420p, 30 fps, audio track present (ffprobe)
- [ ] Full decode with no errors (`ffmpeg -v error -i file -f null -`)
- [ ] Thai fonts render correctly (no clipped vowels or tone marks, no tofu boxes)
- [ ] Essential text inside the safe zone; cover readable in the 3:4 grid crop
- [ ] Every card on screen long enough to read once at a relaxed pace
- [ ] No QC overlay in the final export; no clipped labels
- [ ] Motion is purposeful; mascot and brand elements are consistent
- [ ] Assets and music licences recorded; no unlicensed audio

## Brand and publishing
- [ ] Colours, fonts, voice and mascot are from this brand's files only
- [ ] Destination accounts belong to this brand and are confirmed in `accounts.md`
- [ ] Bangkok date and time set; no duplicate in `publishing-log.csv`
