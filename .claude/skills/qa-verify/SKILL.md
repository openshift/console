---
name: qa-verify
description: >-
  Automated QA verification for OpenShift Console PRs. Builds and runs the console on both main
  and the PR branch, captures before/after screenshots and GIFs via Playwright MCP, then posts a
  side-by-side comparison as a GitHub PR comment. Use when the user asks to verify a PR, QA changes,
  capture visual proof, or show before/after evidence.
argument-hint: "[GitHub PR URL or number]"
arguments: [pr]
disable-model-invocation: true
effort: max
allowed-tools:
  - Bash(git *)
  - Bash(gh *)
  - Bash(go test *)
  - Bash(curl *)
  - Bash(mkdir *)
  - Bash(kill *)
  - Bash(bash *)
  - Bash(nohup *)
  - Bash(cp *)
  - Bash(python3 *)
  - Bash(sips *)
  - Bash(oc whoami)
  - Bash(./build-frontend.sh)
  - Bash(./build-backend.sh)
  - Bash(cat *)
  - Bash(sleep *)
  - Bash(date *)
  - Bash(find *)
  - Bash(wc *)
  - AskUserQuestion
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_type
  - mcp__playwright__browser_wait_for
  - mcp__playwright__browser_resize
  - mcp__playwright__browser_close
  - mcp__playwright__browser_console_messages
  - mcp__playwright__browser_evaluate
  - mcp__atlassian__getJiraIssue
---

# /qa-verify

Capture before/after visual evidence of PR changes using Playwright MCP and post a comparison
to the GitHub PR.

## Current State

Branch: !`git rev-parse --abbrev-ref HEAD`

PR:
!`gh pr view $pr --json number,title,body,headRefName,baseRefName 2>/dev/null || echo "No PR found"`

Base branch:
!`gh pr view $pr --json baseRefName -q '.baseRefName' 2>/dev/null || echo "main"`

Commits since base:
!`git log "$(gh pr view $pr --json baseRefName -q '.baseRefName' 2>/dev/null || echo main)..HEAD" --oneline --no-merges 2>/dev/null || echo "No commits ahead of base"`

Changed files:
!`git diff "$(gh pr view $pr --json baseRefName -q '.baseRefName' 2>/dev/null || echo main)...HEAD" --stat 2>/dev/null || echo "Unable to diff"`

## Phase 0: Prerequisites

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/check-prerequisites.sh"
```

If any tools are missing, the script outputs an `INSTALL_COMMANDS` section with platform-specific
install commands (brew, dnf, or apt). Use `AskUserQuestion` to offer to run them. If the user
agrees, run each install command, then re-run the prerequisites check to confirm everything passes.

Verify Playwright MCP is available by calling `browser_snapshot`. If unavailable, the user needs
to configure it **before starting this session** — adding MCP servers requires a session restart.
Configure with `--ignore-https-errors` and `--save-video` for video recording:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--ignore-https-errors", "--save-video=1920x1080"]
    }
  }
}
```

The `--save-video=1920x1080` flag records a video of the entire browser session from page
creation to `browser_close`. Videos are saved as `.webm` files automatically.

## Phase 1: Gather Context

Use the injected state above. Additionally:

Extract the Jira key from the PR title or branch name (`CONSOLE-\d+` or `OCPBUGS-\d+`).
If Atlassian MCP is available, call `getJiraIssue` with `cloudId: "redhat.atlassian.net"`.

From the PR body, parse:
- **Test setup** section (between `**Test setup:**` and the next `**` header)
- **Test cases** section (between `**Test cases:**` and the next `**` header)
- **Solution description** section

## Phase 2: Verification Plan

Derive verification steps and present to the user with `AskUserQuestion`. Wait for confirmation.

Sources (use what's available):
1. PR test cases → each becomes a verification step with route, action, expected result
2. Jira ticket → bug repro steps or acceptance criteria map to pages
3. Diff → changed components map to affected routes
4. Fallback → dashboard and pages related to changed files
5. **Backend-only changes** — if the diff only touches `pkg/`, `cmd/`, or `*.go` files:
   - Check whether the fix depends on cluster resources (CRDs, operators) that may not exist
     in the local dev environment. If so, note this limitation in the plan.
   - Offer the user a choice: (a) run `go test ./pkg/...` on both branches and compare results
     instead of the full build-and-screenshot flow, or (b) proceed with UI verification but
     focus on functional behavior (button states, API responses) rather than pixel comparison.
   - If the user chooses test comparison, run the tests, diff the results, and skip Phases 3-4.

**Route guidelines:**
- Use namespace-scoped routes (`/k8s/ns/default/...`) instead of `/k8s/all-namespaces/...` for
  any page with forms or project selectors. With all-namespaces, no project is selected, so form
  validation independently disables submit buttons — making verification useless.
- Pick a namespace that exists on the cluster (e.g., `default`, `openshift-console`).

Present as a table:

| # | Route | Action | Expected Result |
|---|-------|--------|-----------------|
| 1 | /dashboards | Navigate, wait load | Dashboard renders |
| 2 | /k8s/ns/default/pods | Click a pod | Pod detail page opens |
| 3 | /k8s/ns/openshift-console/deployments/console/environment | View env tab, click Add from ConfigMap | Value-from-pair form opens |

The `$pr` argument (from `/qa-verify <url-or-number>`) is expanded by skill substitution into
the content before you see it. If provided, it is used for `gh pr view` and `gh pr checkout`.
It may be a full GitHub URL or just a number.

**PR suitability:** This skill works best for PRs with visible UI changes (new components, layout
changes, styling) where before/after screenshots show a clear diff. For logic-only PRs (state
management, hooks, refactors), the skill still provides value as a regression check — identical
screenshots confirm the refactor didn't break anything visually. In these cases, also check for
console errors via `browser_console_messages` after each navigation step to catch runtime
regressions that don't produce visible changes.

**Data-loading pages:** Pages like `/k8s/cluster/projects` load data via WebSocket — the page
may render before data arrives. Use `browser_wait_for` with `time: 5` (longer) for data-heavy
pages, or poll for a specific element via `browser_evaluate`. For paginated lists, append
`?perPage=200` to show all items, or use the filter/search input to find specific items instead
of scrolling through pages.

**Verification depth:** Err on the side of comprehensive testing over simplicity. Think about
corner cases the PR might affect — empty states, error states, loading states, boundary
conditions (e.g., very long names, special characters, zero items, maximum items). If the PR
touches a component, verify it in multiple contexts where it appears, not just the most obvious
one. A false negative (missing a regression) is worse than spending extra time on verification.

## Phase 3: Capture Evidence

Run the verification plan twice: baseline (`${BASE_BRANCH}`) first, then candidate (PR branch).

### Setup

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
ORIGINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
# $pr is expanded by skill substitution to the argument value (URL or number)
PR_NUMBER=$(echo "$pr" | grep -oE '[0-9]+' | tail -1)
if [ -z "$PR_NUMBER" ]; then
  PR_NUMBER=$(gh pr view --json number -q '.number' 2>/dev/null || echo "")
fi
PR_BRANCH=$(gh pr view --json headRefName -q '.headRefName' 2>/dev/null || echo "$ORIGINAL_BRANCH")
# Derive baseline branch from PR target — release-4.x for backports, main otherwise
BASE_BRANCH=$(gh pr view ${PR_NUMBER} --json baseRefName -q '.baseRefName' 2>/dev/null || echo "main")
# Track whether the candidate branch already exists locally (for cleanup)
PR_BRANCH_LOCAL=$(gh pr view ${PR_NUMBER} --json headRefName -q '.headRefName' 2>/dev/null || echo "")
CANDIDATE_BRANCH_EXISTED=$(git rev-parse --verify "${PR_BRANCH_LOCAL}" >/dev/null 2>&1 && echo "yes" || echo "no")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARTIFACTS="${REPO_ROOT}/.artifacts/qa-verify/${TIMESTAMP}"
mkdir -p "${ARTIFACTS}/baseline/screenshots" "${ARTIFACTS}/candidate/screenshots"
```

Use `PR_BRANCH` (the PR's actual head ref name) in metadata, not `ORIGINAL_BRANCH` (which is
whatever local branch you happen to be on).

Copy skill scripts to the artifacts directory so they survive branch switches (the scripts
live on the PR branch and disappear when checking out the base branch):

```bash
cp -R "${CLAUDE_SKILL_DIR}/scripts" "${ARTIFACTS}/scripts"
chmod +x "${ARTIFACTS}/scripts/"*.sh
```

All subsequent script calls MUST use `${ARTIFACTS}/scripts/` instead of `${CLAUDE_SKILL_DIR}/scripts/`.

### For each lane (baseline first, then candidate):

#### 3.1 Switch branch

**Baseline:**
```bash
STASH_COUNT_BEFORE=$(git stash list 2>/dev/null | wc -l | tr -d ' ')
git stash --include-untracked -m "qa-verify-stash" 2>/dev/null || true
STASH_COUNT_AFTER=$(git stash list 2>/dev/null | wc -l | tr -d ' ')
QA_STASH_CREATED=$([ "$STASH_COUNT_AFTER" -gt "$STASH_COUNT_BEFORE" ] && echo "yes" || echo "no")
git checkout "${BASE_BRANCH}"
```

**Candidate** (after baseline is complete): use `gh pr checkout` to handle forks correctly.
External contributor PRs come from forks — `git checkout <branch>` will fail because the branch
doesn't exist on origin. `gh pr checkout` fetches the correct ref automatically.

```bash
gh pr checkout "${PR_NUMBER}" 2>/dev/null || git checkout "${ORIGINAL_BRANCH}"
CANDIDATE_CHECKOUT_SHA=$(git rev-parse HEAD)
if [ "${QA_STASH_CREATED}" = "yes" ]; then
  git stash pop 2>/dev/null || true
fi
```

#### 3.2 Build

Clean and rebuild frontend + backend in parallel (use `timeout: 600000`):
```bash
bash "${ARTIFACTS}/scripts/rebuild.sh"
```

#### 3.3 Start server

Replace `<LANE>` with `baseline` or `candidate`:
```bash
bash "${ARTIFACTS}/scripts/backend.sh" --start <LANE>
```

#### 3.4 Navigate and capture

Set viewport: `browser_resize` → width: 1920, height: 1080

For each verification step:
1. `browser_navigate` to `http://localhost:9000{route}` — note that the console may append query
   params (e.g., `?page=1&perPage=50`). This is normal and expected.
2. `browser_wait_for` with `time: 3` to let the page settle (do NOT use text matching — it
   frequently matches hidden elements and times out)
3. `browser_snapshot` for READ-ONLY verification of page state. Do NOT use snapshot refs as
   click targets — refs go stale instantly on pages with live data (CPU/memory counters, pod
   status). Instead, use `browser_evaluate` with `document.querySelector` for all interactions:
   ```
   browser_evaluate: () => document.querySelector('[data-test="create-button"]').click()
   browser_evaluate: () => document.querySelector('input[aria-label="Filter"]').value = 'test'
   ```
4. `browser_take_screenshot` → `${ARTIFACTS}/<LANE>/screenshots/NN-description.png`

Use **identical filenames** for both lanes.

**Checking element states:** To verify a button is enabled/disabled, use `browser_snapshot` with
a `target` selector (e.g., `[data-test-id="submit-button"]`). If the snapshot output includes
`[disabled]`, the element is disabled. Verify enablement by confirming the attribute is absent.

**Avoiding resource conflicts:** Prefer verifying element states (enabled, visible, correct text)
over performing destructive actions (Create, Delete). If you must create a resource, use a unique
name per lane (e.g., `test-baseline-{timestamp}`, `test-candidate-{timestamp}`) and delete it
after capturing evidence.

#### 3.5 Finalize video and stop server

Call `browser_close` to finalize the video recording. Playwright saves the `.webm` file when the
browser context closes. After closing, find and copy the recorded video:

```bash
# Search working dir and common Playwright temp locations for the most recent webm
VIDEO=$(find . /tmp/playwright* /var/folders/*/T/playwright* \
  -path ./.artifacts -prune -o -name "*.webm" -print 2>/dev/null \
  | xargs ls -t 2>/dev/null | head -1)
if [ -n "$VIDEO" ]; then
  cp "$VIDEO" "${ARTIFACTS}/<LANE>/session.webm"
  echo "Video saved: $(du -h "${ARTIFACTS}/<LANE>/session.webm" | cut -f1)"
else
  echo "No video found — ensure Playwright MCP is configured with --save-video=1920x1080"
fi
```

Then stop the server:
```bash
bash "${ARTIFACTS}/scripts/backend.sh" --stop <LANE>
```

## Phase 4: Compile Evidence

### Convert session videos

If session videos were recorded, convert them to GIF when it reduces file size:

```bash
for lane in baseline candidate; do
  if [ -f "${ARTIFACTS}/${lane}/session.webm" ]; then
    bash "${ARTIFACTS}/scripts/convert-video.sh" \
      "${ARTIFACTS}/${lane}/session.webm" "${ARTIFACTS}/${lane}"
  fi
done
```

The script keeps whichever format (webm or GIF) is smaller. GIFs render inline in GitHub
comments; webm files are uploaded as links.

### Create screenshot GIFs (if ffmpeg available)

```bash
bash "${ARTIFACTS}/scripts/screenshots-to-gif.sh" \
  "${ARTIFACTS}/baseline/screenshots" "${ARTIFACTS}/baseline/evidence.gif"
bash "${ARTIFACTS}/scripts/screenshots-to-gif.sh" \
  "${ARTIFACTS}/candidate/screenshots" "${ARTIFACTS}/candidate/evidence.gif"
```

Write metadata and verification steps for the comment builder:

Capture the candidate SHA while still on the candidate branch (before switching back):
```bash
CANDIDATE_SHA=$(git rev-parse --short HEAD)
```

Then write metadata:
```bash
cat > "${ARTIFACTS}/metadata.json" << METAEOF
{
  "branch": "${PR_BRANCH}",
  "baseline_sha": "$(git rev-parse --short ${BASE_BRANCH})",
  "candidate_sha": "${CANDIDATE_SHA}",
  "pr_number": "${PR_NUMBER}",
  "jira_key": "<JIRA_KEY_OR_EMPTY>",
  "os": "$(uname -s) $(uname -r)",
  "browser": "$(python3 -c "
import subprocess
pw = subprocess.run(['npx', 'playwright', '--version'], capture_output=True, text=True).stdout.strip().replace('Version ', '')
dr = subprocess.run(['npx', 'playwright', 'install', '--dry-run'], capture_output=True, text=True).stdout.strip().split('\n')
chrome = next((l.strip() for l in dr if 'Chrome' in l or 'Chromium' in l), 'Chromium')
chrome = chrome.split('Install')[0].strip() if 'Install' in chrome else chrome
print(f'Playwright {pw} / {chrome}')
" 2>/dev/null || echo 'unknown')"
}
METAEOF
```

Write verification steps as TSV to `${ARTIFACTS}/steps.tsv` with columns:
`number\troute\taction\tstatus\tdescription`

The description column provides a human-readable label for each step (e.g., "Dashboard overview",
"Mobile responsive view"). It is used in collapsible `<details>` sections in the PR comment.

## Phase 5: Publish and Comment

### Upload evidence

```bash
bash "${ARTIFACTS}/scripts/upload-evidence.sh" "${ARTIFACTS}" "${ARTIFACTS}/evidence-map.txt"
```

The script tries the `gh-image` extension first (native GitHub CDN URLs, works with SSH remotes
via `--repo` flag). If `gh-image` is not installed, the output includes `MISSING_GH_IMAGE=true` —
use `AskUserQuestion` to offer installing it (`gh extension install drogers0/gh-image`). Mention
that it is a **third-party community extension**. If the user declines or it fails, the script
falls back to base64 data URIs with progressive downsizing to fit the 65KB comment limit.

### Build and post comment

```bash
bash "${ARTIFACTS}/scripts/build-comment.sh" \
  "${ARTIFACTS}/evidence-map.txt" \
  "${ARTIFACTS}/metadata.json" \
  "${ARTIFACTS}/steps.tsv" \
  /tmp/qa-verify-comment.md
```

The script builds the comment markdown from the evidence map, metadata, and steps. If the base64
payload exceeds 65KB, it automatically splits into `/tmp/qa-verify-comment.md` (main comment)
and `.part2`, `.part3` etc. (reply comments with the images).

### Upsert PR comment

```bash
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')

EXISTING_ID=$(gh api "repos/${REPO}/issues/${PR_NUMBER}/comments" --paginate \
  -q '.[] | select(.body | contains("<!-- qa-verify-evidence -->")) | .id' 2>/dev/null | tail -1)

if [ -n "$EXISTING_ID" ]; then
  gh api --method PATCH "repos/${REPO}/issues/comments/${EXISTING_ID}" \
    -F body=@/tmp/qa-verify-comment.md
else
  gh pr comment "${PR_NUMBER}" --body-file /tmp/qa-verify-comment.md
fi

# Post split parts as replies if they exist
for part in /tmp/qa-verify-comment.md.part*; do
  [ -f "$part" ] && gh pr comment "${PR_NUMBER}" --body-file "$part"
done
```

After posting, summarize the results for the user:
1. List artifact paths (`${ARTIFACTS}/baseline/screenshots/`, `${ARTIFACTS}/candidate/screenshots/`)
2. Note whether visual differences were observed or screenshots were identical
3. Show the PR comment URL
4. Use `AskUserQuestion` to offer opening the PR comment in the browser. If the
user agrees, open the PR page:
```bash
# macOS
open "https://github.com/${REPO}/pull/${PR_NUMBER}"
# Linux
xdg-open "https://github.com/${REPO}/pull/${PR_NUMBER}"
```

## Cleanup

**Always** ensure, even on error:
1. Stop server: `bash "${ARTIFACTS}/scripts/backend.sh" --stop <LANE>`
2. Restore branch: `git checkout "${ORIGINAL_BRANCH}"`
3. Restore stash (only if one was created): `[ "${QA_STASH_CREATED}" = "yes" ] && git stash pop 2>/dev/null || true`
4. Clean up unstaged artifacts: `git checkout -- .artifacts/ .playwright-mcp/ 2>/dev/null || true`
5. Delete the candidate branch if it was created by `gh pr checkout` (didn't exist before) AND
   has no additional commits beyond what was checked out:
   ```bash
   if [ "${CANDIDATE_BRANCH_EXISTED}" = "no" ] && [ -n "${PR_BRANCH_LOCAL}" ]; then
     CURRENT_SHA=$(git rev-parse "${PR_BRANCH_LOCAL}" 2>/dev/null || echo "")
     if [ "${CURRENT_SHA}" = "${CANDIDATE_CHECKOUT_SHA}" ]; then
       git branch -D "${PR_BRANCH_LOCAL}" 2>/dev/null || true
     fi
   fi
   ```

## Limitations

This skill runs the console via `contrib/oc-environment.sh` + `./bin/bridge -branding openshift`,
which is a minimal off-cluster dev setup. The following features require additional bridge flags
or infrastructure that this skill does **not** configure:

- **Dynamic plugins** (`--plugins`, `--plugins-order`, `--plugin-proxy`) — plugins are not loaded
- **Telemetry** (`--telemetry`) — no telemetry config is passed
- **OIDC authentication** (`--user-auth=oidc`, `--cookie-*-key-file`) — auth is disabled entirely
- **Custom branding** (`--custom-logo-files`, `--custom-favicon-files`, `--custom-product-name`)
- **Perspectives** (`--perspectives`) — all perspectives enabled by default
- **Capabilities** (`--capabilities`) — all capabilities enabled by default
- **Developer catalog customization** (`--developer-catalog-categories`, `--developer-catalog-types`)
- **QuickStarts customization** (`--quickstarts`)
- **Inactivity timeout** (`--inactivity-timeout`)
- **i18n plugin namespaces** (`--i18n-namespaces`)
- **Control plane topology** (`--control-plane-topology-mode`)

If a PR changes behavior that depends on any of these flags, the verification will not reflect
the actual production behavior. Note this in the verification plan and suggest the user test
manually with the required flags.

**Backport PRs** (targeting `release-4.x` branches) have additional constraints:
- The baseline is the release branch, not `main`. The skill auto-detects this from `baseRefName`.
- Release branches may not have the `.claude/skills/qa-verify` directory or the repo's Playwright
  config. The skill copies scripts to the artifacts dir before switching, so scripts survive.
- Older release branches may use different Node.js versions, Yarn configs, or build tooling.
  If `build-frontend.sh` fails on the release branch, note this in the verification plan and
  consider skipping the baseline build (verify the candidate against manual inspection instead).

## Notes

- Console runs on `http://localhost:9000`
- Auth is disabled via `contrib/oc-environment.sh` — no login needed
- `.artifacts/` and `.playwright-mcp/` are gitignored
- Evidence images are uploaded via `gh-image` (if installed) or embedded as base64 data URIs
- If no PR exists, save evidence locally and skip comment posting
- Fork PRs are handled via `gh pr checkout` which creates a local tracking branch
- **Scope**: This skill captures visual evidence and performs regression verification. It does
  not analyze code or assess test coverage. For logic-only changes and refactors, identical
  screenshots between baseline and candidate is itself evidence that no visual regressions were
  introduced. The skill can also check for console errors via `browser_console_messages` to
  catch runtime regressions that don't produce visible UI changes.
