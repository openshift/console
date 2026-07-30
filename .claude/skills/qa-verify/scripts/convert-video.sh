#!/bin/bash
# convert-video.sh — Convert Playwright video (webm) to GIF if it reduces file size
# Usage: convert-video.sh <input.webm> [output_dir]
#
# When gh-image is available, keeps the webm as-is (can be uploaded directly as video).
# When using base64 fallback, converts to GIF only if the GIF is smaller.
# Requires ffmpeg for conversion.
set -euo pipefail

INPUT="$1"
OUTPUT_DIR="${2:-$(dirname "$INPUT")}"

if [ -z "$INPUT" ] || [ ! -f "$INPUT" ]; then
  echo "Usage: convert-video.sh <input.webm> [output_dir]" >&2
  exit 1
fi

# If gh-image is available, prefer keeping webm — it uploads as native video
if command -v gh >/dev/null 2>&1 && gh image --help >/dev/null 2>&1; then
  echo "$INPUT"
  echo "Keeping webm (gh-image can upload video directly)" >&2
  exit 0
fi

BASENAME=$(basename "$INPUT" .webm)
GIF_OUT="${OUTPUT_DIR}/${BASENAME}.gif"
WEBM_SIZE=$(wc -c < "$INPUT" | tr -d ' ')

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "$INPUT"
  exit 0
fi

# Convert to GIF with palette optimization, capped at 480px wide
ffmpeg -y -i "$INPUT" \
  -filter_complex "[0:v]fps=5,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" \
  "$GIF_OUT" 2>/dev/null

GIF_SIZE=$(wc -c < "$GIF_OUT" | tr -d ' ')

if [ "$GIF_SIZE" -lt "$WEBM_SIZE" ]; then
  echo "$GIF_OUT"
  echo "Converted: ${BASENAME}.webm (${WEBM_SIZE}B) -> ${BASENAME}.gif (${GIF_SIZE}B, $(( (WEBM_SIZE - GIF_SIZE) * 100 / WEBM_SIZE ))% smaller)" >&2
else
  rm -f "$GIF_OUT"
  echo "$INPUT"
  echo "Kept webm: ${BASENAME}.webm (${WEBM_SIZE}B) is smaller than GIF (${GIF_SIZE}B)" >&2
fi
