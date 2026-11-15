#!/usr/bin/env python3
"""Secret-pattern gate for documentation that an LLM will read.

build_index.py runs scan() on every chunk before it is embedded, so the gate
checks exactly the text that ends up in the index image. Run standalone it
scans Markdown files:

  secret_gate.py DIR [DIR ...]      exit 1 if any file matches

Findings print the file (or chunk source), line, and rule, never the match.
The pipeline also runs gitleaks over the Royal Road corpus; this gate adds
rules for credentials gitleaks only finds with entropy heuristics (assigned
passwords, bearer tokens, URLs with credentials) and catches what a chunk
boundary could otherwise hide from a file-level scanner.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

# Values that are obviously not secrets: placeholders, variables, redactions.
PLACEHOLDER = re.compile(
    r"""^(?:
        <[^>]*>?            # <password>
      | \$.*                # $VAR, ${VAR}, $(cmd)
      | \.{0,2}/.*          # a file path (--from-file=password=/dev/stdin)
      | \{\{.*              # {{ template }}
      | %.*%                # %VAR%
      | \*+ | x{3,} | X{3,} | \.{3,} | -+
      | (?i:redacted|changeme|change-me|example|placeholder|password|secret|
            your[-_]?\w*|my[-_]?\w*|dummy|test\w*|foo\w*|none|null|true|false|
            secretkeyref|valuefrom|replace[-_]?me)\b.*
      | [A-Z][A-Z0-9_]+     # ALL_CAPS env var names
    )$""",
    re.X,
)

RULES: list[tuple[str, re.Pattern[str], int | None]] = [
    # (rule id, pattern, group holding the value to check against PLACEHOLDER)
    ("private-key", re.compile(r"-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----"), None),
    ("aws-access-key-id", re.compile(r"\b(?:AKIA|ASIA|ABIA|ACCA)[0-9A-Z]{16}\b"), None),
    ("aws-secret-access-key",
     re.compile(r"(?i)aws_?secret_?access_?key\W{0,3}[=:]\s*[\"']?([A-Za-z0-9/+=]{40})\b"), 1),
    ("openai-style-key", re.compile(r"\bsk-(?:proj-|svcacct-|ant-)?[A-Za-z0-9_-]{20,}"), None),
    ("github-token", re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b"), None),
    ("gitlab-token", re.compile(r"\bglpat-[A-Za-z0-9_-]{20,}\b"), None),
    ("slack-token", re.compile(r"\bxox[abposr]-[A-Za-z0-9-]{10,}\b"), None),
    ("slack-webhook", re.compile(r"https://hooks\.slack\.com/services/T[A-Za-z0-9]+/B[A-Za-z0-9]+/[A-Za-z0-9]+"), None),
    ("discord-webhook", re.compile(r"https://(?:\w+\.)?discord(?:app)?\.com/api/webhooks/\d+/[A-Za-z0-9_-]{30,}"), None),
    ("google-api-key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b"), None),
    ("stripe-key", re.compile(r"\b[rs]k_live_[0-9A-Za-z]{20,}\b"), None),
    ("sentry-token", re.compile(r"\bsntr[ysu]_[A-Za-z0-9+/=_-]{30,}"), None),
    ("age-secret-key", re.compile(r"\bAGE-SECRET-KEY-1[0-9A-Z]{50,}\b"), None),
    ("jwt", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"), None),
    ("bearer-token", re.compile(r"(?i)\bbearer\s+([A-Za-z0-9._~+/-]{24,}=*)"), 1),
    ("url-credentials", re.compile(r"\b[a-z][a-z0-9+.-]*://[^\s/:@<>\"'`]+:([^\s/@<>\"'`]{6,})@[\w.-]+"), 1),
    ("kubeconfig-key-data", re.compile(r"\b(?:client-key-data|token)\s*:\s*([A-Za-z0-9+/=._-]{40,})"), 1),
    ("assigned-secret",
     re.compile(r"(?i)\b(?:password|passwd|pwd|passphrase|secret[_-]?key|client[_-]?secret|api[_-]?key|"
                r"access[_-]?token|auth[_-]?token|private[_-]?token)\b[\"']?\s*[=:]\s*[\"']?([^\s\"'`,;)\]}]{8,})"), 1),
]


def scan(text: str) -> list[tuple[int, str]]:
    """Return (line number, rule id) for every match in text."""
    findings = []
    for rule, pattern, group in RULES:
        for m in pattern.finditer(text):
            if group is not None and PLACEHOLDER.match(m.group(group).strip()):
                continue
            findings.append((text.count("\n", 0, m.start()) + 1, rule))
    return sorted(set(findings))


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2
    bad = 0
    for root in argv:
        for path in sorted(Path(root).rglob("*.md")):
            for line, rule in scan(path.read_text(encoding="utf-8", errors="replace")):
                print(f"{path}:{line}: {rule}")
                bad += 1
    print(f"secret gate: {bad} finding(s)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
