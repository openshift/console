#!/bin/bash
# upload-evidence.sh — Upload QA evidence images for use in GitHub PR comments
# Usage: upload-evidence.sh <artifacts_dir> [evidence_map_output]
# Outputs: writes evidence map to evidence_map_output (default: <artifacts_dir>/evidence-map.txt)
#
# Strategy:
#   1. Try gh-image extension with --repo flag (works with SSH remotes)
#   2. Fall back to base64 data URIs, aggressively compressed to fit 65KB limit
#
# IMPORTANT: Original files are NEVER modified. Resizing for base64 works on
# copies in a temporary directory.
#
# Evidence map format:
#   METHOD=gh-image|base64           (metadata line)
#   MISSING_GH_IMAGE=true            (metadata line, optional)
#   TOTAL_BYTES=<n>                  (metadata line, base64 only)
#   MAP: flat-name URL_OR_DATA_URI   (entry lines, prefixed with MAP:)
set -euo pipefail

ARTIFACTS_DIR="${1:-}"
EVIDENCE_MAP="${2:-${ARTIFACTS_DIR:+${ARTIFACTS_DIR}/evidence-map.txt}}"
COMMENT_BUDGET=61440

if [ -z "$ARTIFACTS_DIR" ]; then
  echo "Usage: upload-evidence.sh <artifacts_dir> [evidence_map_output]" >&2
  exit 1
fi

# Resolve repo name once (works regardless of SSH vs HTTPS remote)
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || echo "")

# Collect all image files
FILES=()
while IFS= read -r f; do
  FILES+=("$f")
done < <(find "$ARTIFACTS_DIR" -type f \( -name "*.png" -o -name "*.gif" -o -name "*.webm" \) | sort)

if [ ${#FILES[@]} -eq 0 ]; then
  echo "No image files found in $ARTIFACTS_DIR" >&2
  exit 1
fi

# Derive flat name: .../baseline/screenshots/01-foo.png → baseline-screenshots-01-foo.png
flat_name() {
  python3 - "$1" "$ARTIFACTS_DIR" <<'PYEOF'
import sys, os.path
print(os.path.relpath(sys.argv[1], sys.argv[2]).replace('/', '-'))
PYEOF
}

# --- Method 1: gh-image with --repo flag (no resizing — images are CDN-hosted) ---
# Skips individual files that fail and continues. Only returns 1 if ALL uploads fail.
use_gh_image() {
  command -v gh >/dev/null 2>&1 || return 1
  gh image --help >/dev/null 2>&1 || return 1
  [ -n "$REPO" ] || return 1

  local succeeded=0
  for f in "${FILES[@]}"; do
    local name
    name=$(flat_name "$f")
    local gh_err raw_output url
    gh_err=$(mktemp)
    if raw_output=$(gh image --repo "$REPO" "$f" 2>"$gh_err"); then
      rm -f "$gh_err"
      url=$(echo "$raw_output" | sed -n 's/.*(\(http[^)]*\)).*/\1/p')
      [ -z "$url" ] && url="$raw_output"
      echo "MAP: ${name} ${url}"
      succeeded=$((succeeded + 1))
    else
      echo "SKIP: ${name} — $(cat "$gh_err")" >&2
      rm -f "$gh_err"
    fi
  done

  [ "$succeeded" -gt 0 ] && return 0 || return 1
}

# Create resized copies in a temp directory. NEVER modifies originals.
# Returns the temp directory path (caller must clean up).
create_resized_copies() {
  local max_width="$1"
  local tmpdir
  tmpdir=$(mktemp -d)

  for f in "${FILES[@]}"; do
    local name
    name=$(flat_name "$f")
    cp "$f" "${tmpdir}/${name}"

    if [[ "$f" == *.png ]]; then
      local copy="${tmpdir}/${name}"
      if command -v sips >/dev/null 2>&1; then
        local W
        W=$(sips -g pixelWidth "$copy" 2>/dev/null | tail -1 | awk '{print $2}')
        if [ -n "$W" ] && [ "$W" -gt "$max_width" ]; then
          sips --resampleWidth "$max_width" "$copy" >/dev/null 2>&1 || true
        fi
      elif command -v convert >/dev/null 2>&1; then
        convert "$copy" -resize "${max_width}>" "$copy" 2>/dev/null || true
      fi
    fi
  done

  echo "$tmpdir"
}

# --- Method 2: base64 data URIs ---
# Resizes copies to 960px (readable but not full-res). Never goes below 960px —
# if the total payload exceeds 65KB, build-comment.sh handles splitting across
# multiple comments. Shrinking images to 120px made them useless.
use_base64() {
  local tmpdir
  tmpdir=$(create_resized_copies 960)

  local total_bytes=0
  local output=""

  for f in "${FILES[@]}"; do
    # Skip webm in base64 mode — GitHub doesn't render video data URIs
    [[ "$f" == *.webm ]] && continue
    local name mime b64 entry copy
    name=$(flat_name "$f")
    copy="${tmpdir}/${name}"
    case "$f" in
      *.png) mime="image/png" ;;
      *.gif) mime="image/gif" ;;
      *)     mime="application/octet-stream" ;;
    esac
    b64=$(base64 < "$copy" | tr -d '\n')
    entry="data:${mime};base64,${b64}"
    total_bytes=$((total_bytes + ${#entry}))
    output="${output}MAP: ${name} ${entry}\n"
  done

  printf '%b' "$output" | grep -v '^$' || true
  echo "TOTAL_BYTES=${total_bytes}"

  if [ "$total_bytes" -gt "$COMMENT_BUDGET" ]; then
    echo "NOTE: base64 payload is ${total_bytes} bytes (exceeds 65KB). build-comment.sh will split across multiple comments." >&2
  fi

  rm -rf "$tmpdir"
}

# --- Main ---
: > "$EVIDENCE_MAP"

if command -v gh >/dev/null 2>&1 && gh image --help >/dev/null 2>&1; then
  echo "METHOD=gh-image" | tee -a "$EVIDENCE_MAP"
  if use_gh_image >> "$EVIDENCE_MAP"; then
    cat "$EVIDENCE_MAP"
    exit 0
  fi
  echo "gh-image upload failed for all files, falling back to base64" >&2
  : > "$EVIDENCE_MAP"
else
  echo "MISSING_GH_IMAGE=true"
  echo "gh-image extension not installed. Install it for native GitHub CDN image URLs:" >&2
  echo "  gh extension install drogers0/gh-image" >&2
  echo "(Note: gh-image is a third-party community extension)" >&2
fi

echo "METHOD=base64" | tee -a "$EVIDENCE_MAP"
use_base64 >> "$EVIDENCE_MAP"
cat "$EVIDENCE_MAP"
