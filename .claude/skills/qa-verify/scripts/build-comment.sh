#!/bin/bash
# build-comment.sh — Build the QA verification PR comment markdown
# Usage: build-comment.sh <evidence_map> <metadata_json> <steps_file> [output_file]
#
# evidence_map:  output from upload-evidence.sh (lines prefixed with MAP: are entries)
# metadata_json: JSON with branch, baseline_sha, candidate_sha, pr_number, jira_key
# steps_file:    TSV file with verification steps (number\troute\taction\tstatus\tdescription)
# output_file:   where to write the comment (default: /tmp/qa-verify-comment.md)
#
# Compatible with macOS bash 3.2 (no associative arrays).
set -euo pipefail

EVIDENCE_MAP="$1"
METADATA="$2"
STEPS_FILE="$3"
OUTPUT="${4:-/tmp/qa-verify-comment.md}"
COMMENT_LIMIT=61440

if [ -z "$EVIDENCE_MAP" ] || [ -z "$METADATA" ] || [ -z "$STEPS_FILE" ]; then
  echo "Usage: build-comment.sh <evidence_map> <metadata_json> <steps_file> [output_file]" >&2
  exit 1
fi

BRANCH=$(python3 -c "import json; print(json.load(open('$METADATA')).get('branch',''))")
BASELINE_SHA=$(python3 -c "import json; print(json.load(open('$METADATA')).get('baseline_sha',''))")
CANDIDATE_SHA=$(python3 -c "import json; print(json.load(open('$METADATA')).get('candidate_sha',''))")
JIRA_KEY=$(python3 -c "import json; print(json.load(open('$METADATA')).get('jira_key',''))")
OS_INFO=$(python3 -c "import json; print(json.load(open('$METADATA')).get('os',''))")
BROWSER_INFO=$(python3 -c "import json; print(json.load(open('$METADATA')).get('browser',''))")
VERIFIED_DATE=$(date +%Y-%m-%d)

# URL lookup — || true prevents pipefail from killing the script when grep finds nothing
url_for() {
  grep "^MAP: $1 " "$EVIDENCE_MAP" 2>/dev/null | head -1 | sed 's/^MAP: [^ ]* //' || true
}

METHOD=$(grep '^METHOD=' "$EVIDENCE_MAP" 2>/dev/null | tail -1 | cut -d= -f2 || echo "unknown")

# --- Header ---
HEADER="<!-- qa-verify-evidence -->
## QA Verification Evidence

| | Details |
|---|---|
| **Branch** | \`${BRANCH}\` |
| **Baseline** | \`main\` @ \`${BASELINE_SHA}\` |
| **Candidate** | \`${BRANCH}\` @ \`${CANDIDATE_SHA}\` |
| **Verified** | ${VERIFIED_DATE} |
| **Browser** | ${BROWSER_INFO} |
| **OS** | ${OS_INFO} |"

if [ -n "$JIRA_KEY" ]; then
  HEADER="${HEADER}
| **Jira** | [${JIRA_KEY}](https://redhat.atlassian.net/browse/${JIRA_KEY}) |"
fi

# --- Steps table ---
STEPS="
### Verification Steps

| # | Route | Action | Status |
|---|-------|--------|--------|"
while IFS=$'\t' read -r num route action status desc rest; do
  STEPS="${STEPS}
| ${num} | ${route} | ${action} | ${status} |"
done < "$STEPS_FILE"

# --- Screenshot pairs in collapsible sections ---
# Build one <details> block per step, matching screenshots by step number prefix
EVIDENCE_SECTIONS=""
STEP_NUM=0
while IFS=$'\t' read -r num route action status desc rest; do
  STEP_NUM=$((STEP_NUM + 1))
  padded=$(printf '%02d' "$STEP_NUM")
  step_desc="${desc:-${action}}"

  # Find baseline screenshot(s) matching this step number
  bl_keys=$(grep "^MAP: baseline-screenshots-${padded}" "$EVIDENCE_MAP" 2>/dev/null | sed 's/^MAP: //' | cut -d' ' -f1 || true)
  [ -z "$bl_keys" ] && continue

  section="
<details>
<summary>Step ${STEP_NUM}: ${step_desc} (${status})</summary>

| Baseline (\`main\`) | Candidate (\`${BRANCH}\`) |
| :---: | :---: |"

  for bl_key in $bl_keys; do
    suffix="${bl_key#baseline-screenshots-}"
    ca_key="candidate-screenshots-${suffix}"
    bl_url=$(url_for "$bl_key")
    ca_url=$(url_for "$ca_key")
    if [ -n "$bl_url" ] && [ -n "$ca_url" ]; then
      section="${section}
| <img src=\"${bl_url}\" width=\"480\"> | <img src=\"${ca_url}\" width=\"480\"> |"
    fi
  done

  section="${section}

</details>"
  EVIDENCE_SECTIONS="${EVIDENCE_SECTIONS}${section}"
done < "$STEPS_FILE"

# Fallback: if no step-matched pairs found, show all pairs flat
if [ -z "$EVIDENCE_SECTIONS" ]; then
  grep '^MAP: baseline-screenshots-' "$EVIDENCE_MAP" 2>/dev/null | while IFS= read -r line; do
    key=$(echo "$line" | sed 's/^MAP: //' | cut -d' ' -f1)
    suffix="${key#baseline-screenshots-}"
    ca_key="candidate-screenshots-${suffix}"
    bl_url=$(echo "$line" | sed 's/^MAP: [^ ]* //')
    ca_url=$(url_for "$ca_key")
    if [ -n "$ca_url" ]; then
      echo "| <img src=\"${bl_url}\" width=\"480\"> | <img src=\"${ca_url}\" width=\"480\"> |"
    fi
  done > "${OUTPUT}.pairs.tmp" || true

  FLAT_PAIRS=$(cat "${OUTPUT}.pairs.tmp" 2>/dev/null || true)
  rm -f "${OUTPUT}.pairs.tmp"

  if [ -n "$FLAT_PAIRS" ]; then
    EVIDENCE_SECTIONS="
### Before / After

| Baseline (\`main\`) | Candidate (\`${BRANCH}\`) |
| :---: | :---: |
${FLAT_PAIRS}"
  fi
fi

# --- GIF pairs ---
GIFS=""
BL_GIF=$(url_for "baseline-evidence.gif")
CA_GIF=$(url_for "candidate-evidence.gif")
if [ -n "$BL_GIF" ] && [ -n "$CA_GIF" ]; then
  GIFS="
<details>
<summary>Animated overview (click to expand)</summary>

| Baseline | Candidate |
| :---: | :---: |
| <img src=\"${BL_GIF}\" width=\"480\"> | <img src=\"${CA_GIF}\" width=\"480\"> |

</details>"
fi

FOOTER="
---
> [!WARNING]
> This verification was performed by an AI agent. Results may contain false positives or miss
> regressions that require human judgment. Always review the screenshots manually before approving.

*Automated QA verification by [Claude Code](https://claude.ai/code)*"

# --- Assemble ---
FULL="${HEADER}
${STEPS}
${GIFS}
${EVIDENCE_SECTIONS}
${FOOTER}"

FULL_BYTES=$(printf '%s' "$FULL" | wc -c | tr -d ' ')

if [ "$METHOD" != "base64" ] || [ "$FULL_BYTES" -le "$COMMENT_LIMIT" ]; then
  printf '%s\n' "$FULL" > "$OUTPUT"
  echo "Written to $OUTPUT (${FULL_BYTES} bytes, single comment)"
else
  MAIN="${HEADER}
${STEPS}

> Evidence images split across reply comments due to GitHub's 65KB comment limit.
${FOOTER}"
  printf '%s\n' "$MAIN" > "$OUTPUT"
  echo "Written to $OUTPUT (main comment)"

  PART=2
  if [ -n "$EVIDENCE_SECTIONS" ]; then
    printf '<!-- qa-verify-evidence -->%s\n' "$EVIDENCE_SECTIONS" > "${OUTPUT}.part${PART}"
    echo "Written to ${OUTPUT}.part${PART} (screenshots)"
    PART=$((PART + 1))
  fi
  if [ -n "$GIFS" ]; then
    printf '<!-- qa-verify-evidence -->%s\n' "$GIFS" > "${OUTPUT}.part${PART}"
    echo "Written to ${OUTPUT}.part${PART} (GIFs)"
  fi
fi
