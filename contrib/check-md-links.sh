#!/bin/bash
#
# check-md-links.sh — Check markdown files for broken or redirected URLs.
#
# Extracts all http(s) URLs from the given markdown files, tests each one
# with curl, and writes problems (404s, errors, redirects) to a CSV report.
#
# Usage:
#   ./contrib/check-md-links.sh README.md
#   ./contrib/check-md-links.sh CONTRIBUTING.md
#   ./contrib/check-md-links.sh README.md TESTING.md STYLEGUIDE.md
#   ./contrib/check-md-links.sh -o report.csv README.md
#
# Output:
#   link-markdown-check.csv (or custom path via -o) in the current directory.
#   Only problematic links (404, redirects, errors) are written.
#
# Idempotent: overwrites the output CSV on every run.

set -uo pipefail

OUTPUT="link-markdown-check.csv"
FILES=()

usage() {
  cat <<'EOF'
check-md-links.sh — Check markdown files for broken or redirected URLs.

Usage:
  ./contrib/check-md-links.sh README.md
  ./contrib/check-md-links.sh CONTRIBUTING.md
  ./contrib/check-md-links.sh README.md TESTING.md STYLEGUIDE.md
  ./contrib/check-md-links.sh -o report.csv README.md

Output:
  link-markdown-check.csv (or custom path via -o) in the current directory.
  Only problematic links (404, redirects, errors) are written.
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -o|--output)
      OUTPUT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      FILES+=("$1")
      shift
      ;;
  esac
done

# Require at least one markdown file argument
if [ ${#FILES[@]} -eq 0 ]; then
  echo "ERROR: please provide at least one markdown file to check." >&2
  echo "Usage: ./contrib/check-md-links.sh <file.md> [more.md ...]" >&2
	echo ""
	usage
  exit 1
fi

# Validate inputs
for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "ERROR: $f not found" >&2
    exit 1
  fi
done

# Start fresh
echo "file,line,status,http_code,url,redirect_url" > "$OUTPUT"

total=0
problems=0

for file in "${FILES[@]}"; do
  grep -noE 'https?://[^)> "]+' "$file" | sed 's/[).,]*$//' | while IFS=: read -r line url; do
    # Skip localhost / local-only URLs
    case "$url" in
      *localhost*|*127.0.0.1*|*api.crc.testing*) continue ;;
    esac

    total=$((total + 1))

    result=$(curl -sL -o /dev/null -w "%{http_code}|%{url_effective}" --max-time 15 "$url" 2>/dev/null || echo "000|")
    http_code="${result%%|*}"
    effective_url="${result#*|}"

    if [ "$http_code" = "000" ]; then
      status="TIMEOUT/ERROR"
      redirect=""
			echo "$status at line $line - url: $url"
    elif [ "$http_code" = "404" ]; then
      status="NOT_FOUND"
      redirect=""
			echo "Not found at line $line - url: $url"
    elif [ "$http_code" -ge 400 ] 2>/dev/null; then
      status="ERROR_${http_code}"
      redirect=""
			echo "$status at line $line - url: $url"
    elif [ "$effective_url" != "$url" ] && [ "$effective_url" != "${url}/" ] && [ "${url}/" != "$effective_url" ]; then
      status="REDIRECT"
      redirect="$effective_url"
			echo "$status at line $line - url: $url ==> $effective_url"
    else
      # Link is fine, skip
      continue
    fi

    echo "$file,$line,$status,$http_code,$url,$redirect," >> "$OUTPUT"
    problems=$((problems + 1))
  done
done

lines=$(tail -n +2 "$OUTPUT" | wc -l | tr -d ' ')
echo ""
echo "Done. Found $lines problem(s). Results in $OUTPUT"
