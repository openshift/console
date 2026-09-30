#!/bin/bash
# build-comment-attach.sh — Build a QA verification comment for gh's native --attach uploads
# Usage: build-comment-attach.sh <baseline_screenshots_dir> <candidate_screenshots_dir> \
#          <metadata_json> <steps_file> <output_comment_file> <output_attach_list_file> \
#          [url_map_file]
#
# Images and video are NOT embedded in the comment body — the body only references files via
# markdown image syntax (`![alt](ref)`), so the comment body stays tiny (a few KB) regardless
# of how many or how large the images are.
#
# For any step matched by exactly one baseline and one candidate screenshot, also generates a
# 2-frame flicker GIF (alternating baseline/candidate) via make-flicker-gif.sh — a flicker
# comparison catches subtle visual diffs (shifted icon, color change) that are easy to miss
# side-by-side. Written to <artifacts>/flicker/step-NN.gif (skipped if ffmpeg is unavailable).
#
# Two modes, selected by whether url_map_file is given:
#
#  - Direct attach (no url_map_file): each `ref` is a local absolute path, and every
#    referenced file is also written to the attach-list file, one per line, in the same order
#    it appears in the body. The caller passes each line as a separate `--attach` flag to
#    `gh pr comment`, which needs write/push access to the repo being commented on:
#
#      ARGS=()
#      while IFS= read -r f; do ARGS+=(--attach "$f"); done < "$ATTACH_LIST"
#      gh pr comment "$PR_NUMBER" --body-file "$OUTPUT" "${ARGS[@]}"
#
#  - Staged (url_map_file given, TSV of local_path\thosted_url from stage-attachments.sh):
#    each `ref` is already a hosted github.com/user-attachments/assets/... URL, so the final
#    post is a plain `gh pr comment --body-file "$OUTPUT"` with NO --attach flags at all — the
#    attach-list file is still written (for reference) but need not be used. Use this when the
#    repo being commented on can't be pushed to directly; see stage-attachments.sh.
#
# steps_file: TSV with columns number\troute\taction\tstatus\tdescription
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BASELINE_DIR="$1"
CANDIDATE_DIR="$2"
METADATA="$3"
STEPS_FILE="$4"
OUTPUT="${5:-/tmp/qa-verify-comment.md}"
ATTACH_LIST="${6:-/tmp/qa-verify-attach-list.txt}"
URL_MAP="${7:-}"
MAX_ATTACHMENTS=50

if [ -z "$BASELINE_DIR" ] || [ -z "$CANDIDATE_DIR" ] || [ -z "$METADATA" ] || [ -z "$STEPS_FILE" ]; then
  echo "Usage: build-comment-attach.sh <baseline_dir> <candidate_dir> <metadata_json> <steps_file> [output_file] [attach_list_file] [url_map_file]" >&2
  exit 1
fi

# Resolves a local path to its hosted URL when staged (url_map_file given), else returns the
# local path unchanged (direct-attach mode).
resolve_ref() {
  local path="$1"
  if [ -n "$URL_MAP" ] && [ -f "$URL_MAP" ]; then
    local url
    url=$(awk -F'\t' -v p="$path" '$1==p{print $2; exit}' "$URL_MAP")
    if [ -n "$url" ]; then
      printf '%s' "$url"
      return
    fi
    echo "WARNING: no staged URL found for $path — falling back to local path (will not render for the viewer)" >&2
  fi
  printf '%s' "$path"
}

BRANCH=$(python3 -c "import json; print(json.load(open('$METADATA')).get('branch',''))")
BASE_BRANCH=$(python3 -c "import json; print(json.load(open('$METADATA')).get('base_branch','main'))")
BASELINE_SHA=$(python3 -c "import json; print(json.load(open('$METADATA')).get('baseline_sha',''))")
CANDIDATE_SHA=$(python3 -c "import json; print(json.load(open('$METADATA')).get('candidate_sha',''))")
JIRA_KEY=$(python3 -c "import json; print(json.load(open('$METADATA')).get('jira_key',''))")
OS_INFO=$(python3 -c "import json; print(json.load(open('$METADATA')).get('os',''))")
BROWSER_INFO=$(python3 -c "import json; print(json.load(open('$METADATA')).get('browser',''))")
VERIFIED_DATE=$(date +%Y-%m-%d)

: > "$ATTACH_LIST"
ATTACH_COUNT=0

# Records a referenced file. In direct-attach mode this enforces gh's 50-file cap and writes
# the attach list the caller will turn into --attach flags. In staged mode the actual upload
# already happened (and was capped) in stage-attachments.sh, so instead this rejects any path
# that has no corresponding URL-map entry — e.g. if staging capped at 50 files but more than
# 50 were discovered here, the extras never got uploaded and must not be referenced, since
# resolve_ref falling back to a local path would produce a permanently broken image link for
# anyone else viewing the comment. Callers already do `add_attachment "$f" || continue`, so
# rejecting here is enough to exclude it everywhere.
add_attachment() {
  local path="$1"
  if [ -n "$URL_MAP" ]; then
    if [ -f "$URL_MAP" ] && awk -F'\t' -v p="$path" '$1==p{found=1} END{exit !found}' "$URL_MAP"; then
      ATTACH_COUNT=$((ATTACH_COUNT + 1))
      return 0
    fi
    echo "WARNING: no staged URL found for $path — excluding from comment" >&2
    return 1
  fi
  if [ "$ATTACH_COUNT" -ge "$MAX_ATTACHMENTS" ]; then
    echo "WARNING: dropping attachment (50-file gh limit reached): $path" >&2
    return 1
  fi
  echo "$path" >> "$ATTACH_LIST"
  ATTACH_COUNT=$((ATTACH_COUNT + 1))
  return 0
}

# --- Header ---
HEADER="<!-- qa-verify-evidence -->
## QA Verification Evidence

| | Details |
|---|---|
| **Branch** | \`${BRANCH}\` |
| **Baseline** | \`${BASE_BRANCH}\` @ \`${BASELINE_SHA}\` |
| **Candidate** | \`${BRANCH}\` @ \`${CANDIDATE_SHA}\` |
| **Verified** | ${VERIFIED_DATE} |
| **Browser** | ${BROWSER_INFO} |
| **OS** | ${OS_INFO} |"

if [ -n "$JIRA_KEY" ]; then
  HEADER="${HEADER}
| **Jira** | [${JIRA_KEY}](https://redhat.atlassian.net/browse/${JIRA_KEY}) |"
fi

# --- Steps summary table ---
STEPS="
### Verification Steps

| # | Route | Action | Status |
|---|-------|--------|--------|"
while IFS=$'\t' read -r num route action status desc rest; do
  STEPS="${STEPS}
| ${num} | ${route} | ${action} | ${status} |"
done < "$STEPS_FILE"

# --- Per-step evidence sections ---
# Matches screenshots by a strict "NN-" prefix (not a bare substring) so e.g. step 5's
# "05-*.png" never accidentally swallows an unrelated "05b-*.png" bonus screenshot.
GIF_DIR="$(dirname "$(dirname "$BASELINE_DIR")")/flicker"
mkdir -p "$GIF_DIR"

EVIDENCE=""
STEP_NUM=0
MATCHED_FILES=""
while IFS=$'\t' read -r num route action status desc rest; do
  STEP_NUM=$((STEP_NUM + 1))
  padded=$(printf '%02d' "$STEP_NUM")
  step_desc="${desc:-${action}}"

  bl_files=$(find "$BASELINE_DIR" -maxdepth 1 -name "${padded}-*.png" 2>/dev/null | sort || true)
  ca_files=$(find "$CANDIDATE_DIR" -maxdepth 1 -name "${padded}-*.png" 2>/dev/null | sort || true)
  [ -z "$bl_files" ] && [ -z "$ca_files" ] && continue

  section="
<details>
<summary>Step ${STEP_NUM}: ${step_desc} (${status})</summary>
"

  # A flicker GIF (alternating baseline/candidate) only makes sense for a clean 1:1 pair —
  # skip it when a step matched zero or multiple screenshots per lane.
  bl_count=$(echo "$bl_files" | grep -c . || true)
  ca_count=$(echo "$ca_files" | grep -c . || true)
  if [ "$bl_count" -eq 1 ] && [ "$ca_count" -eq 1 ]; then
    gif_path="${GIF_DIR}/step-${padded}.gif"
    if bash "${SCRIPT_DIR}/make-flicker-gif.sh" "$bl_files" "$ca_files" "$gif_path" >&2 && [ -f "$gif_path" ]; then
      if add_attachment "$gif_path"; then
        section="${section}
**Flicker (baseline ↔ candidate)**

![Flicker step ${STEP_NUM}: ${step_desc}]($(resolve_ref "$gif_path"))
"
      fi
    fi
  fi

  if [ -n "$bl_files" ]; then
    section="${section}
**Baseline (\`${BASE_BRANCH}\`)**
"
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      add_attachment "$f" || continue
      MATCHED_FILES="${MATCHED_FILES}${f}
"
      section="${section}
![Baseline step ${STEP_NUM}: ${step_desc}]($(resolve_ref "$f"))"
    done <<< "$bl_files"
  fi
  if [ -n "$ca_files" ]; then
    section="${section}

**Candidate (\`${BRANCH}\`)**
"
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      add_attachment "$f" || continue
      MATCHED_FILES="${MATCHED_FILES}${f}
"
      section="${section}
![Candidate step ${STEP_NUM}: ${step_desc}]($(resolve_ref "$f"))"
    done <<< "$ca_files"
  fi
  section="${section}

</details>"
  EVIDENCE="${EVIDENCE}${section}"
done < "$STEPS_FILE"

# --- Bonus screenshots that didn't match any step's NN- prefix ---
BONUS=""
for lane_dir in "$BASELINE_DIR" "$CANDIDATE_DIR"; do
  lane_label="Baseline (\`${BASE_BRANCH}\`)"
  [ "$lane_dir" = "$CANDIDATE_DIR" ] && lane_label="Candidate (\`${BRANCH}\`)"
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    printf '%s' "$MATCHED_FILES" | grep -qF "$f" && continue
    add_attachment "$f" || continue
    BONUS="${BONUS}
**${lane_label}** — \`$(basename "$f")\`
![$(basename "$f")]($(resolve_ref "$f"))
"
  done < <(find "$lane_dir" -maxdepth 1 -name "*.png" 2>/dev/null | sort || true)
done
if [ -n "$BONUS" ]; then
  BONUS="
<details>
<summary>Additional evidence</summary>
${BONUS}
</details>"
fi

# --- Session recording (attached directly — gh renders video as a native player) ---
ANIMATED=""
for lane_dir in "$BASELINE_DIR" "$CANDIDATE_DIR"; do
  lane_label="Baseline"
  [ "$lane_dir" = "$CANDIDATE_DIR" ] && lane_label="Candidate"
  asset="$(dirname "$lane_dir")/session.webm"
  if [ -f "$asset" ]; then
    if add_attachment "$asset"; then
      ANIMATED="${ANIMATED}
**${lane_label}** — \`$(basename "$asset")\`

![${lane_label} session]($(resolve_ref "$asset"))
"
    fi
  fi
done
if [ -n "$ANIMATED" ]; then
  ANIMATED="
<details>
<summary>Session recording</summary>
${ANIMATED}
</details>"
fi

FOOTER="
---
> [!WARNING]
> This verification was performed by an AI agent. Results may contain false positives or miss
> regressions that require human judgment. Always review the screenshots manually before approving.

*Automated QA verification by [Claude Code](https://claude.ai/code)*"

FULL="${HEADER}
${STEPS}
${EVIDENCE}${BONUS}${ANIMATED}
${FOOTER}"

printf '%s\n' "$FULL" > "$OUTPUT"
BODY_BYTES=$(wc -c < "$OUTPUT" | tr -d ' ')
echo "Written to $OUTPUT (${BODY_BYTES} bytes body, ${ATTACH_COUNT} attachment(s) in $ATTACH_LIST)"
