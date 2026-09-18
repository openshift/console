#!/bin/bash
# stage-attachments.sh — Upload files to GitHub's asset host via a repo the user *can* push
# to, so their hosted URLs can be embedded (as plain markdown, no --attach needed) in a
# comment on a repo the user can only comment on.
#
# Why: gh's native --attach (see build-comment-attach.sh) requires write/push access to the
# repo the comment is posted to. Most contributors only have comment access on org repos like
# openshift/console, but do have push access to their own fork of it. GitHub's uploaded-asset
# URLs (github.com/user-attachments/assets/<uuid>) are valid independent of which repo/comment
# uploaded them and survive deletion of that comment, so a fork makes a reusable staging
# ground: upload once there, then reference the resulting URLs anywhere.
#
# gh's --attach only exists on `issue create/edit/comment` and `pr create/edit/comment` — there
# is no commit-comment equivalent, so this needs either an existing PR to comment on, or Issues
# enabled to create a scratch one. This script treats both as a PREREQUISITE it checks and
# fails loudly on — it does not attempt to toggle repo settings itself:
#   1. Prefer commenting on any existing PR (any state — open/closed/merged all work).
#   2. Otherwise, require Issues to be enabled and create a scratch issue (closed after use).
#   3. Otherwise, fail with instructions for what to enable.
#
# Usage: stage-attachments.sh <staging_repo> <url_map_output_file> <file1> [file2] ...
# staging_repo: owner/repo the current user has push access to (e.g. their fork)
# Writes url_map_output_file as TSV: <local_path>\t<hosted_url>, one per input file, in order.
set -uo pipefail

STAGING_REPO="$1"
URL_MAP="$2"
shift 2
FILES=("$@")
MAX_ATTACHMENTS=50

if [ -z "$STAGING_REPO" ] || [ -z "$URL_MAP" ] || [ ${#FILES[@]} -eq 0 ]; then
  echo "Usage: stage-attachments.sh <staging_repo> <url_map_output_file> <file1> [file2] ..." >&2
  exit 1
fi

if [ ${#FILES[@]} -gt $MAX_ATTACHMENTS ]; then
  echo "WARNING: ${#FILES[@]} files exceeds gh's ${MAX_ATTACHMENTS}-file limit; only the first ${MAX_ATTACHMENTS} will be staged." >&2
  FILES=("${FILES[@]:0:$MAX_ATTACHMENTS}")
fi

EXISTING_PR=$(gh pr list --repo "$STAGING_REPO" --state all --limit 1 --json number -q '.[0].number' 2>/dev/null || true)
HAS_ISSUES=$(gh api "repos/${STAGING_REPO}" --jq '.has_issues' 2>/dev/null || echo "false")

if [ -z "$EXISTING_PR" ] && [ "$HAS_ISSUES" != "true" ]; then
  echo "ERROR: ${STAGING_REPO} has no existing pull request to comment on, and Issues are disabled." >&2
  echo "  Fix one of these on ${STAGING_REPO}, then retry:" >&2
  echo "    - Enable Issues: repo Settings > General > Features > Issues, or" >&2
  echo "    - gh api --method PATCH repos/${STAGING_REPO} -f has_issues=true" >&2
  echo "    - Open any pull request on it (even a trivial one)" >&2
  exit 1
fi

BODY_FILE=$(mktemp)
{
  echo "Scratch comment used by qa-verify to host evidence images for a PR comment on a repo"
  echo "this account can't push to. Safe to ignore/close."
  echo
  for f in "${FILES[@]}"; do
    echo "![staged]($f)"
  done
} > "$BODY_FILE"

ATTACH_ARGS=()
for f in "${FILES[@]}"; do
  ATTACH_ARGS+=(--attach "$f")
done

if [ -n "$EXISTING_PR" ]; then
  STAGE_KIND="pr-comment"
  STAGE_URL=$(gh pr comment "$EXISTING_PR" --repo "$STAGING_REPO" --body-file "$BODY_FILE" "${ATTACH_ARGS[@]}" 2>&1)
else
  STAGE_KIND="issue"
  STAGE_URL=$(gh issue create --repo "$STAGING_REPO" \
    --title "qa-verify staging $(date +%Y%m%d-%H%M%S) (safe to close)" \
    --body-file "$BODY_FILE" \
    "${ATTACH_ARGS[@]}" 2>&1)
fi
STAGE_EXIT=$?
rm -f "$BODY_FILE"

if [ $STAGE_EXIT -ne 0 ]; then
  echo "ERROR: failed to stage attachments on ${STAGING_REPO}: ${STAGE_URL}" >&2
  exit 1
fi

echo "Staged via ${STAGE_URL} (${STAGE_KIND})" >&2

# Both a PR-comment URL (.../pull/N#issuecomment-ID) and an issue-create URL (.../issues/N)
# resolve through the issue-comments/issues REST endpoints for fetching the rendered body.
if [ "$STAGE_KIND" = "pr-comment" ]; then
  COMMENT_ID=$(echo "$STAGE_URL" | grep -oE '[0-9]+$')
  STAGE_BODY=$(gh api "repos/${STAGING_REPO}/issues/comments/${COMMENT_ID}" --jq '.body')
else
  ISSUE_NUMBER=$(echo "$STAGE_URL" | grep -oE '[0-9]+$')
  STAGE_BODY=$(gh api "repos/${STAGING_REPO}/issues/${ISSUE_NUMBER}" --jq '.body')
fi

URLS=()
while IFS= read -r url; do
  [ -n "$url" ] && URLS+=("$url")
done < <(echo "$STAGE_BODY" | grep -oE 'https://github\.com/user-attachments/assets/[a-f0-9-]+')

if [ "${#URLS[@]}" -ne "${#FILES[@]}" ]; then
  echo "ERROR: expected ${#FILES[@]} uploaded asset URLs, found ${#URLS[@]}. Aborting — check ${STAGE_URL} manually." >&2
  exit 1
fi

: > "$URL_MAP"
for i in "${!FILES[@]}"; do
  printf '%s\t%s\n' "${FILES[$i]}" "${URLS[$i]}" >> "$URL_MAP"
done

if [ "$STAGE_KIND" = "issue" ]; then
  ISSUE_NUMBER=$(echo "$STAGE_URL" | grep -oE '[0-9]+$')
  gh issue close "$ISSUE_NUMBER" --repo "$STAGING_REPO" >/dev/null 2>&1 || true
fi

echo "Wrote ${#FILES[@]} URL mapping(s) to ${URL_MAP}"
