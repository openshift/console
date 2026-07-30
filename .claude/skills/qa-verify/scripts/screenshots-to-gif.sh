#!/bin/bash
# screenshots-to-gif.sh — Convert numbered PNG screenshots to an animated GIF
# Usage: screenshots-to-gif.sh <input_dir> <output.gif> [framerate]
# Default framerate adapts to frame count: 2 seconds per frame, minimum 0.25fps
set -euo pipefail

INPUT_DIR="${1:-}"
OUTPUT="${2:-}"

if [ -z "$INPUT_DIR" ] || [ -z "$OUTPUT" ]; then
  echo "Usage: screenshots-to-gif.sh <input_dir> <output.gif> [framerate]" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "SKIP: ffmpeg not found, cannot create GIF" >&2
  exit 0
fi

PNG_COUNT=$(find "$INPUT_DIR" -maxdepth 1 -name "*.png" | wc -l | tr -d ' ')
if [ "$PNG_COUNT" -eq 0 ]; then
  echo "SKIP: No PNG files found in $INPUT_DIR" >&2
  exit 0
fi

# Default: 0.5fps (2 seconds per frame). For many frames, slow down further.
if [ -n "${3:-}" ]; then
  FRAMERATE="$3"
elif [ "$PNG_COUNT" -gt 8 ]; then
  FRAMERATE="0.25"
else
  FRAMERATE="0.5"
fi

# Find max width and max height across all frames so the canvas fits every image.
# Mixed sizes (e.g., 1920x1080 desktop + 600x1080 mobile) are common.
MAX_W=0
MAX_H=0
for f in "${INPUT_DIR}"/*.png; do
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
MAX_W="${MAX_W:-960}"
MAX_H="${MAX_H:-1080}"

# Uniform scale (force_original_aspect_ratio=decrease) ensures no stretching —
# each frame is scaled to fit within MAX_WxMAX_H preserving its aspect ratio,
# then padded with white to fill the canvas. No distortion.
ffmpeg -y -framerate "$FRAMERATE" \
  -pattern_type glob -i "${INPUT_DIR}/*.png" \
  -filter_complex "[0:v]scale=${MAX_W}:${MAX_H}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${MAX_W}:${MAX_H}:(ow-iw)/2:(oh-ih)/2:color=white,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" \
  "$OUTPUT"

SECS=$(python3 -c "print(f'{$PNG_COUNT / $FRAMERATE:.0f}')" 2>/dev/null || echo "?")
echo "Created GIF: $OUTPUT (${PNG_COUNT} frames at ${FRAMERATE}fps, ~${SECS}s)"
