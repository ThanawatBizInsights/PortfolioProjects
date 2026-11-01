#!/usr/bin/env bash
# Render, finalise and QC one content package.
# Usage: scripts/render-package.sh <package-dir> <brand-theme.json> [output-name]
#   <package-dir> must contain video-spec.json. Output goes to <package-dir>/media/ and <package-dir>/qc/.
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
PKG="$(cd "$1" && pwd)"; THEME="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
NAME="${3:-video}"
SPEC="$PKG/video-spec.json"
MEDIA="$PKG/media"; QC="$PKG/qc"; TMP="$HERE/renderer/out/tmp-$$"
mkdir -p "$MEDIA" "$QC" "$TMP"
cd "$HERE/renderer"
[ -d node_modules ] || npm install --no-audit --no-fund

echo "1/5 QC stills with safe-zone overlay"
node render.mjs --spec "$SPEC" --theme "$THEME" --stills "$TMP/safe" --safe | grep -E "^Composition" || true

echo "2/5 Render video"
node render.mjs --spec "$SPEC" --theme "$THEME" --out "$TMP/raw.mp4" | grep -E "^Composition|^wrote" || true

echo "3/5 Finalise: standard yuv420p H.264, silent AAC track, faststart"
OUT="$MEDIA/${NAME}_1080x1920_no-voiceover.mp4"
ffmpeg -v error -y -i "$TMP/raw.mp4" -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 -shortest \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -color_range tv -profile:v high -c:a aac -b:a 128k -movflags +faststart "$OUT"

echo "4/5 Cover image + playback check on the exported file"
COVER_SEC=$(python3 -c "import json;print(json.load(open('$SPEC')).get('coverSec',2))")
ffmpeg -v error -y -ss "$COVER_SEC" -i "$OUT" -frames:v 1 "$MEDIA/${NAME}_cover_1080x1920.png"
ffmpeg -v error -i "$OUT" -f null - && echo "   full decode: OK"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,pix_fmt,r_frame_rate -of compact "$OUT" | tee "$QC/ffprobe.txt"

echo "5/5 Contact sheets"
python3 - "$TMP/safe" "$OUT" "$QC" <<'PY'
import glob, subprocess, sys, os
from PIL import Image
safe, out, qc = sys.argv[1:4]
def sheet(files, path, w=270, h=480, cols=5):
    rows = (len(files) + cols - 1) // cols
    s = Image.new('RGB', (w * cols, h * rows), 'white')
    for i, f in enumerate(files):
        s.paste(Image.open(f).convert('RGB').resize((w, h)), ((i % cols) * w, (i // cols) * h))
    s.save(path)
sheet(sorted(glob.glob(safe + '/*-end.png')), os.path.join(qc, 'safe-zone-sheet.png'), cols=4)
dur = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',out]).decode())
frames = []
for k in range(10):
    t = 0.3 + k * (dur - 0.6) / 9
    p = os.path.join(safe, f'export_{k:02d}.png')
    subprocess.run(['ffmpeg','-v','error','-y','-ss',f'{t:.2f}','-i',out,'-frames:v','1',p], check=True)
    frames.append(p)
sheet(frames, os.path.join(qc, 'export-frames-sheet.png'))
print('   sheets written to', qc)
PY
rm -rf "$TMP"
echo "Done: $OUT"
