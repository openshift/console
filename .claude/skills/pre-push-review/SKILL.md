---
name: pre-push-review
description: Fast local code review using domain-specialist agents before pushing changes to GitHub. Spawns parallel reviewers for SDK, frontend, and backend changes.
argument-hint: "[--staged] [--base <branch>]"
---

# /pre-push-review

## Usage
```bash
/pre-push-review                       # Review commits vs main
/pre-push-review --staged              # Review only staged changes
/pre-push-review --base upstream/main  # Review commits vs specific base
/pre-push-review --staged --base dev   # Staged changes, custom base
```

## Description
Local code review that spawns domain-specialist agents in parallel to review your changes before pushing. Each agent is an expert in its domain — SDK compliance, frontend patterns, or Go backend — and reviews only the files relevant to it.

Nothing is posted to GitHub. No external tools required.

## Process

### Phase 1: Gather changes

1. **Parse parameters**:
   - `--staged` → review staged changes only
   - `--base <branch>` → compare against this branch (default: `main`)

2. **Validate scope**:
   ```bash
   git branch --show-current
   # Commits mode:
   git rev-list --count <base>..HEAD
   # Staged mode:
   git diff --cached --stat
   ```
   - No changes found → inform user and exit

3. **Collect diff and file list**:
   ```bash
   # Commits mode:
   git diff <base>..HEAD --name-only
   git diff <base>..HEAD
   git diff <base>..HEAD --stat
   git log <base>..HEAD --oneline

   # Staged mode:
   git diff --cached --name-only
   git diff --cached
   git diff --cached --stat
   ```

### Phase 2: Classify and dispatch

Classify changed files into three domains:

| Domain | File pattern | Agent |
|--------|-------------|-------|
| **SDK** | `frontend/packages/console-dynamic-plugin-sdk/**` | `plugin-api-guardian` |
| **Frontend** | `frontend/**` (excluding SDK) | `frontend-reviewer` |
| **Backend** | `pkg/**`, `cmd/**`, `*.go`, `go.mod`, `go.sum` | `go-backend-reviewer` |

Files that don't match any domain (docs, CI config, scripts) are noted but not sent to an agent.

**Spawn only agents for domains that have changes.** Use the `Agent` tool with `subagent_type` set to the agent name. Send all relevant agents in a single message so they run in parallel.

Each agent's prompt MUST include:
- The list of changed files in its domain
- The full diff for those files only (filter the diff to their domain)
- The commit messages (commits mode only)
- Instruction to return structured findings per its output format

### Phase 3: Synthesize

Once all agents return:

1. **Collect findings** from each agent's response
2. **Add cross-domain observations** — issues at the boundary between domains:
   - Backend added an endpoint but frontend doesn't call it
   - SDK type changed but static plugin extensions weren't updated
   - Model changes in frontend don't match Go struct changes
3. **Rank all issues by severity**: CRITICAL > HIGH > MEDIUM > LOW
4. **Check commit quality** (commits mode): messages, atomicity, organization

### Phase 4: Report

Output a unified review:

```markdown
# Pre-Push Review

## Overview
- **Branch**: <branch> → <base>
- **Mode**: Commits (<count>) | Staged
- **Files changed**: <count> (+<add> -<del>)
- **Agents used**: <list of agents spawned>

## Critical Issues
<issues that MUST be fixed before pushing>

### 1. <title>
- **File**: <path>:<line>
- **Agent**: <which agent found it>
- **Issue**: <description>
- **Fix**: <suggestion>

## High Priority
<bugs, correctness issues>

## Medium Priority
<patterns, i18n, a11y, style>

## Low Priority
<minor improvements>

## What looks good
- <positive observations>

## Commit Quality (commits mode only)
- **Messages**: <assessment>
- **Organization**: <assessment>

## Recommendation
Ready to push | Fix critical issues first | Address high-priority items
```

### Phase 5: Fix (optional)

If the user wants fixes implemented:

1. Start with critical issues, then high priority
2. Apply one fix at a time
3. Follow project conventions (the agents already flagged what's wrong)
4. Handle pre-commit hook failures
5. Offer to re-run the review to verify

## Error handling

- **No changes**: Inform user, suggest checking branch or using `--staged`
- **Base branch doesn't exist**: Show available branches, suggest alternatives
- **Not a git repo**: Inform user and exit
- **Agent returns no findings**: Note "no issues found" for that domain — this is fine

## Guidelines

- Only spawn agents for domains with actual changes — don't waste tokens
- Filter the diff so each agent only sees its own files
- Keep the report concise — file:line references, not paragraphs
- Focus on actionable findings, not style nitpicks
- Cross-domain issues are the main agent's responsibility, not the agents'
