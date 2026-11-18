#!/bin/bash
# make-flicker-gif.sh — Create a small alternating baseline/candidate GIF for the same
# verification step, so subtle visual diffs (a shifted icon, a color change, a missing
# element) pop via flicker comparison in a way static side-by-side screenshots don't.
# Usage: make-flicker-gif.sh <baseline_img> <candidate_img> <output.gif>
set -euo pipefail

IMG1="${1:-}"
IMG2="${2:-}"
OUTPUT="${3:-}"

if [ -z "$IMG1" ] || [ -z "$IMG2" ] || [ -z "$OUTPUT" ]; then
  echo "Usage: make-flicker-gif.sh <baseline_img> <candidate_img> <output.gif>" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "SKIP: ffmpeg not found, cannot create flicker GIF" >&2
  exit 0
fi

TMPDIR=$(mktemp -d)
cp "$IMG1" "${TMPDIR}/1.png"
cp "$IMG2" "${TMPDIR}/2.png"

# Mixed baseline/candidate sizes are possible (e.g. desktop vs mobile crop) — scale both
# frames to fit within the larger of the two so neither stretches.
MAX_W=0
MAX_H=0
for f in "${TMPDIR}"/*.png; do
  if command -v sips >/dev/null 2>&1; then
    W=$(sips -g pixelWidth "$f" 2>/dev/null | tail -1 | awk '{print $2}')
    H=$(sips -g pixelHeight "$f" 2>/dev/null | tail -1 | awk '{print $2}')
  elif command -v identify >/dev/null 2>&1; then
    W=$(identify -format '%w' "$f" 2>/dev/null)
    H=$(identify -format '%h' "$f" 2>/dev/null)
  else
    W=0; H=0
  fi
  [ "${W:-0}" -gt "$MAX_W" ] && MAX_W="$W"
  [ "${H:-0}" -gt "$MAX_H" ] && MAX_H="$H"
done
MAX_W="${MAX_W:-480}"
MAX_H="${MAX_H:-480}"

# 2fps (0.5s/frame) is fast enough to flicker-compare, slow enough to still register each
# frame consciously. ffmpeg's GIF muxer loops infinitely by default, which GitHub honors.
ffmpeg -y -loglevel error -framerate 2 \
  -pattern_type glob -i "${TMPDIR}/*.png" \
  -filter_complex "[0:v]scale=${MAX_W}:${MAX_H}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${MAX_W}:${MAX_H}:(ow-iw)/2:(oh-ih)/2:color=white,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" \
  "$OUTPUT"

rm -rf "$TMPDIR"
echo "Created flicker GIF: $OUTPUT"
