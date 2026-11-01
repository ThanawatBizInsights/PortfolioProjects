#!/usr/bin/env python3
"""Publishing log + duplicate guard for Content Studio.

Each brand has its own log: content-studio/brands/<brand>/publishing-log.csv

  check   exit 0 = safe to publish, exit 2 = duplicate found (same media or same caption
          already scheduled/published to the same platform account).
  record  append one result row (status must reflect the platform response).
"""
import argparse
import csv
import datetime as dt
import hashlib
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
BKK = ZoneInfo("Asia/Bangkok")
FIELDS = [
    "logged_at_bkk", "brand", "platform", "account", "package", "media_file", "media_sha256",
    "caption_sha256", "scheduled_for_bkk", "status", "platform_post_id", "permalink", "notes",
]
LIVE = {"scheduled", "published"}


def sha(path: str | None) -> str:
    if not path:
        return ""
    data = Path(path).read_bytes()
    if path.endswith((".txt", ".md")):
        data = data.decode("utf-8").strip().encode("utf-8")  # ignore trailing whitespace
    return hashlib.sha256(data).hexdigest()


def log_path(brand: str) -> Path:
    p = ROOT / "brands" / brand / "publishing-log.csv"
    if not p.parent.exists():
        sys.exit(f"Unknown brand folder: {p.parent}")
    return p


def rows(brand: str):
    p = log_path(brand)
    if not p.exists():
        return []
    with p.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def check(a) -> int:
    m, c = sha(a.media), sha(a.caption)
    hits = [
        r for r in rows(a.brand)
        if r["platform"] == a.platform and r["account"] == a.account and r["status"] in LIVE
        and ((m and r["media_sha256"] == m) or (c and r["caption_sha256"] == c))
    ]
    if hits:
        print("DUPLICATE: already scheduled/published to this account:")
        for r in hits:
            print(f"  {r['status']} {r['scheduled_for_bkk']} id={r['platform_post_id']} {r['permalink']}")
        return 2
    print(f"OK: no live post with this media/caption on {a.platform}:{a.account}")
    return 0


def record(a) -> int:
    if a.status in LIVE and not a.post_id:
        sys.exit("Refusing to record scheduled/published without --post-id from the platform response.")
    p = log_path(a.brand)
    new = not p.exists()
    with p.open("a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        if new:
            w.writeheader()
        w.writerow({
            "logged_at_bkk": dt.datetime.now(BKK).strftime("%Y-%m-%d %H:%M"),
            "brand": a.brand, "platform": a.platform, "account": a.account,
            "package": a.package or "", "media_file": Path(a.media).name if a.media else "",
            "media_sha256": sha(a.media), "caption_sha256": sha(a.caption),
            "scheduled_for_bkk": a.scheduled or "", "status": a.status,
            "platform_post_id": a.post_id or "", "permalink": a.permalink or "", "notes": a.notes or "",
        })
    print(f"Recorded {a.status} → {p}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("check", "record"):
        s = sub.add_parser(name)
        s.add_argument("--brand", required=True)
        s.add_argument("--platform", required=True, choices=["facebook", "instagram"])
        s.add_argument("--account", required=True)
        s.add_argument("--media")
        s.add_argument("--caption", help="caption .txt file")
        if name == "record":
            s.add_argument("--package")
            s.add_argument("--status", required=True, choices=["scheduled", "published", "failed"])
            s.add_argument("--scheduled", help="YYYY-MM-DD HH:MM in Asia/Bangkok")
            s.add_argument("--post-id")
            s.add_argument("--permalink")
            s.add_argument("--notes")
    a = ap.parse_args()
    return check(a) if a.cmd == "check" else record(a)


if __name__ == "__main__":
    sys.exit(main())
