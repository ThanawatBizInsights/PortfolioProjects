# Publishing

## Modes
1. **Review-before-publishing (default).** The publisher shows one approval sheet: media, cover, exact FB caption, exact IG caption, destination accounts, date and time (Asia/Bangkok), and the duplicate-check result. Nothing goes out without explicit approval of that post or batch.
2. **Approved post or batch.** After approval, publish or schedule without asking again. Ask again only if something material changes: the media, a caption, the account, or a time move of more than 1 hour.
3. **Automatic publishing.** Off by default. It is only allowed when `brands/<brand>/automation.md` has `enabled: true` and lists approved accounts, topics, maximum frequency and boundaries (no promo claims, no replies to comments, and so on), signed off by the owner with a date.

## Duplicate prevention
Before publishing, run:
```bash
python3 content-studio/scripts/publish_log.py check --brand <slug> --platform <facebook|instagram> --account <handle> --media <file.mp4> --caption <caption.txt>
```
It blocks if the same media or the same caption has already been scheduled or published to that account.

## Recording results
```bash
python3 content-studio/scripts/publish_log.py record --brand <slug> --platform instagram --account <handle> \
  --package <package-dir> --media <file.mp4> --caption <caption.txt> --status published \
  --scheduled "2026-11-05 19:30" --post-id <id from platform response> --permalink <url> --notes "..."
```
Only use `published` or `scheduled` when the platform's response confirms it. On errors, record `failed` with the exact error text in `--notes`, keep the package ready for manual upload, and tell the owner.

## Credentials
Never ask for, paste or store passwords or access tokens. Connections are made by the owner through official connectors or integrations in their Claude settings.
