# Platform specs (last reviewed 2026-11-01, so re-check before relying on them)

Meta changes these often. Re-check before big campaigns, and update this file with the date.

## Video (Reels on Facebook and Instagram)
- 9:16 vertical, **1080×1920**, MP4 (H.264, yuv420p, AAC audio), 30 fps.
- Default length for this studio: 20–30 s.
- Cover: 1080×1920 frame. Keep the key text inside the centre **1080×1440** so the profile-grid crop (3:4) doesn't cut it.

## Safe zone (text placement)
Meta's interface (username, caption, buttons) covers parts of the frame. Third-party guides attributing figures to Meta's Reels ad guidance list about **14% top, 35% bottom, 6% sides** as the zones to keep clear. Other guides give slightly different pixel values. Our default `safeZone` in `video-spec.json`:

```json
{ "top": 270, "bottom": 560, "left": 60, "right": 120 }
```

All essential text is kept higher still (content is centred and nudged upward), so it also stays above the stricter 35% bottom band. Non-essential decoration (mascot, progress bar, brand tag) may sit near the edges.

Sources used (2026-11-01; the official Meta Business Help Center page couldn't be opened from this environment, so treat these as secondary):
- https://www.socialync.io/tools/safe-zones/instagram-reels
- https://www.trymypost.com/blog/instagram-reels-safe-zones-text-placement-2026
- https://www.hopperhq.com/blog/instagram-reel-size/

## Publishing APIs (for the publisher stage)
- **Instagram:** Content Publishing API supports Reels on **Instagram professional accounts** (business or creator). It needs `instagram_content_publish` plus related permissions. If the linked Page requires Page Publishing Authorization, that must be completed. A per-account publishing rate limit applies (`/<IG_ID>/content_publishing_limit`). Docs: https://developers.facebook.com/docs/instagram-platform/content-publishing
- **Facebook Pages:** Reels are published via the Page `video_reels` edge (start → upload → finish). The reference lists `video_state` (DRAFT / PUBLISHED / SCHEDULED) and `scheduled_publish_time`. Third-party sources disagree on whether Reels scheduling works, so test it on a real account before relying on it. Docs: https://developers.facebook.com/docs/graph-api/reference/page/video_reels
- Personal Instagram accounts can't be published to through the API.
