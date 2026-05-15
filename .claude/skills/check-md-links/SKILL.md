---
name: check-md-links
description: Run the markdown link checker script, parse results, and interactively fix broken or redirected links.
allowed-tools: Bash(./contrib/check-md-links.sh *), Bash(cat *), WebSearch, AskUserQuestion, Read, Edit
argument-hint: "[file.md ...|--all]"
---

# /check-md-links

Run `contrib/check-md-links.sh` on markdown files, parse the CSV report, and
walk the user through each issue interactively — offering to fix what can be
fixed automatically.

## Usage

```
/check-md-links README.md
/check-md-links README.md CONTRIBUTING.md TESTING.md
/check-md-links --all
```

## Input

$ARGUMENTS

## Process

### Step 1: Run the link checker

Build the command from `$ARGUMENTS`:

- If `$ARGUMENTS` is empty, ask the user what to check:

```json
{
  "question": "Which markdown files should I check for broken links?",
  "header": "Scope",
  "multiSelect": false,
  "options": [
    {
      "label": "All (--all)",
      "description": "Find and check every .md file in the repo"
    },
    {
      "label": "Root docs only",
      "description": "README.md, CONTRIBUTING.md, TESTING.md, STYLEGUIDE.md, INTERNATIONALIZATION.md"
    },
    {
      "label": "Specify files",
      "description": "I'll provide specific file paths"
    }
  ]
}
```

- If the user selects "Specify files", ask them to provide the paths.
- If the user selects "Root docs only", use:
  `README.md CONTRIBUTING.md TESTING.md STYLEGUIDE.md INTERNATIONALIZATION.md`

Run the script:

```bash
./contrib/check-md-links.sh [arguments] -o /tmp/md-link-check.csv
```

Use `/tmp/md-link-check.csv` as the output path to avoid polluting the working tree.

### Step 2: Parse the report

Read the CSV output. If no issues were found (0 problems), report success and stop.

Otherwise, group issues by file and present a summary table to the user:

```
Found N issue(s) across M file(s):

| File | Status | Count |
|------|--------|-------|
| README.md | REDIRECT | 3 |
| README.md | NOT_FOUND | 1 |
| CONTRIBUTING.md | TIMEOUT/ERROR | 2 |
```

### Step 3: Walk through each issue

Process issues **one file at a time**, and within each file, **one issue at a
time**. For each issue, read the relevant line from the source file to show
context, then take action based on the status:

#### REDIRECT

The link works but redirects to a different URL. The redirect target is known.

- Show the user: the file, line number, original URL, and redirect target.
- Display the redirect target URL clearly so the user can click and verify it:

```
Line 42: [link text](https://old-url.com)
  ↳ Redirects to: https://new-url.com/updated-path
```

- Use `AskUserQuestion`:

```json
{
  "question": "This link redirects to a new URL. Want to fix it now or check the destination first?",
  "header": "Redirect",
  "multiSelect": false,
  "options": [
    {
      "label": "Fix it now",
      "description": "Replace the old URL with the redirect target"
    },
    {
      "label": "Let me check first",
      "description": "I'll visit the link above and decide after"
    },
    {
      "label": "Skip",
      "description": "Leave the link as-is"
    }
  ]
}
```

- If "Fix it now": use the Edit tool to replace the old URL with the redirect
  URL in the markdown file.
- If "Let me check first": print the redirect URL again on its own line so it
  is easy to copy/click, then pause and ask:

```json
{
  "question": "Did you check the link? What would you like to do?",
  "header": "Verdict",
  "multiSelect": false,
  "options": [
    {
      "label": "Fix it",
      "description": "Replace with the redirect target"
    },
    {
      "label": "Skip",
      "description": "Leave the link as-is"
    }
  ]
}
```

#### NOT_FOUND (404)

The link is broken and returns a 404.

- Show the user: the file, line number, broken URL, and the surrounding
  markdown context (the line from the file) so the purpose of the link is clear.
- **Do not search the web automatically.** Ask the user first:

```json
{
  "question": "This link is broken (404). Want me to search the web for an updated URL based on the context of the markdown?",
  "header": "404",
  "multiSelect": false,
  "options": [
    {
      "label": "Search for it",
      "description": "I'll look for the correct or updated link using the surrounding context"
    },
    {
      "label": "Remove the link",
      "description": "Convert to plain text (keep the link text, remove the URL)"
    },
    {
      "label": "Skip",
      "description": "Leave the link as-is for manual review"
    }
  ]
}
```

- If "Search for it": use `WebSearch` with keywords from the broken URL's
  domain/path and the surrounding markdown context (link text, heading, etc.)
  to find the most relevant replacement.
  - If a likely replacement is found, present it clearly and ask:

  ```json
  {
    "question": "I found a possible replacement. What should I do?",
    "header": "Replace?",
    "multiSelect": false,
    "options": [
      {
        "label": "Use this URL",
        "description": "Replace with: [suggested URL]"
      },
      {
        "label": "Let me check first",
        "description": "I'll visit the suggested link and decide after"
      },
      {
        "label": "Skip",
        "description": "Leave the link as-is"
      }
    ]
  }
  ```

  - If "Let me check first": print the suggested URL on its own line, then
    pause and ask for the user's verdict (same pattern as the REDIRECT flow).
  - If no replacement is found, inform the user and offer to remove the link
    or skip.

- If "Remove the link": use the Edit tool to convert `[text](url)` to just `text`.
- If "Skip": move on to the next issue.

#### TIMEOUT/ERROR (000)

The request timed out or failed to connect. This is often a false positive
(firewalled sites, VPN-only URLs, rate limiting).

- Show the user: the file, line number, and URL.
- Flag it as a likely false positive and ask:

```json
{
  "question": "This link timed out (could be a firewall, VPN-only, or transient issue). What should I do?",
  "header": "Timeout",
  "multiSelect": false,
  "options": [
    {
      "label": "Skip",
      "description": "Likely a false positive — leave it alone"
    },
    {
      "label": "Remove the link",
      "description": "Convert to plain text"
    }
  ]
}
```

#### ERROR_4xx (403, 429, etc.)

The server actively rejected the request. Common with bot detection, rate
limiting, or authentication-required pages.

- Show the user: the file, line number, URL, and HTTP status code.
- Flag it as likely bot detection and ask:

```json
{
  "question": "This link returned HTTP [code] (often bot detection or auth-required). What should I do?",
  "header": "HTTP [code]",
  "multiSelect": false,
  "options": [
    {
      "label": "Skip",
      "description": "Likely a false positive — leave it alone"
    },
    {
      "label": "Search for alternative",
      "description": "Search the web for an updated or public version of this resource"
    },
    {
      "label": "Remove the link",
      "description": "Convert to plain text"
    }
  ]
}
```

- If "Search for alternative": use `WebSearch`, then present the result and
  offer to replace.

### Step 4: Summary

After processing all issues, print a summary:

```
Done. Results:
  - Fixed: N link(s)
  - Skipped: N link(s)
  - Removed: N link(s)

Modified files:
  - README.md
  - CONTRIBUTING.md
```

If any files were modified, remind the user to review the changes with
`git diff` before committing.
