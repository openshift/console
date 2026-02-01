---
description: What should I do next? View queue and select tasks
---

You are helping the user figure out what to do next and quickly jump into their next task.

# Arguments
The `/do` command accepts optional arguments to jump directly to specific work:

**Usage patterns:**
- `/do` - Show full work queue and select
- `/do CONSOLE-1234` - Jump directly to specific issue
- `/do OCPBUGS-5678` - Jump directly to specific bug
- `/do my next story` - Auto-select highest priority CONSOLE story
- `/do my next bug` - Auto-select highest priority OCPBUGS bug
- `/do <description keywords>` - Search for issue matching description

**Argument handling:**
1. If argument matches issue key pattern (CONSOLE-XXXX or OCPBUGS-XXXX):
   - Jump directly to that issue (skip queue display)
   - Check out branch or offer to create it
   - Load issue details and start working

2. If argument is "my next story" or "next story":
   - Filter for CONSOLE issues with status TODO or IN_PROGRESS
   - Auto-select highest priority
   - Jump directly to it

3. If argument is "my next bug" or "next bug":
   - Filter for OCPBUGS issues with status NEW or ASSIGNED
   - Auto-select highest priority
   - Jump directly to it

4. If argument contains keywords:
   - Search issue summaries for matching keywords
   - If single match: jump directly to it
   - If multiple matches: show filtered list and ask to choose
   - If no matches: show full queue

5. If no argument:
   - Show full work queue (normal behavior)

**After identifying the target issue, skip to Step 2 or Step 7** depending on whether it's the current branch or needs checkout.

# Step 0: Check CLI Tools Setup
Verify that required CLI tools are available.

## Check Jira CLI
```bash
which jira
```

If not found, provide installation:
- **macOS (Homebrew)**: `brew install ankitpokhrel/jira-cli/jira-cli`
- **Configuration**: `jira init` (use https://issues.redhat.com, browser auth)

## Check GitHub CLI
```bash
which gh
```

If not found, provide installation:
- **macOS (Homebrew)**: `brew install gh`
- **Authentication**: `gh auth login`

# Step 1: Load Work Context
**ALWAYS DO THIS STEP** - Even if arguments were provided, we need to load context.

Read the work context to understand recent history.

## File Locations
Context files are in `~/.claude/` directory (markdown format):
- **Working context**: `~/.claude/work-context.md`
- **Archives**: `~/.claude/work-context/YYYY-MM.md`
- **Pending**: `~/.claude/work-context-pending.md` (from SessionEnd hook)

## Auto-Merge Pending Session Data FIRST
**IMPORTANT**: This happens automatically at startup before showing the work queue.

Check for pending session file:
```bash
cat ~/.claude/work-context-pending.md 2>/dev/null
```

If the pending file exists, **immediately merge it** before proceeding:

### 1. Parse Pending Session Data
The pending file contains data captured by the SessionEnd hook, which receives JSON with:
- **session_id**: Unique session identifier
- **transcript_path**: Path to full conversation JSON
- **cwd**: Working directory when session ended
- **permission_mode**: Permission mode ("default", "plan", "acceptEdits", "bypassPermissions")
- **hook_event_name**: Name of the hook event

**Extract from the pending file:**
- Timestamp and issue key
- Modified files (from git)
- Commits (from git)
- Transcript path (from session metadata JSON)

### 2. Read and Parse Transcript
If transcript_path exists, read the conversation:
```bash
cat <transcript_path>
```

**Parse for contextual information:**
- **Decisions**: "let's use X", "decided to Y", "going with Z"
- **Next steps**: "next we need to", "still need to", "TODO:", "remaining work"
- **Blockers**: "blocked by", "waiting for", "can't proceed until"
- **Issue relationships**: "blocks CONSOLE-X", "related to", "depends on"
- **External links**: Slack URLs, Google Docs, Jira links mentioned in conversation

### 3. Read Current Work Context
```bash
cat ~/.claude/work-context.md 2>/dev/null
```

If doesn't exist, create initial structure (see below).

### 4. Merge into Work Context

**Add to "Recent Work Sessions"** section:
```markdown
### 2025-01-15 16:45:00 - CONSOLE-1234
**[Issue Summary]** (from previous session)

**Files Modified**:
- src/components/Theme.tsx
- src/styles/theme.css

**Commits**:
- feat: add theme toggle
- test: add theme tests

**Decisions** (from transcript):
- Use CSS variables for theming instead of runtime JS switching

**Next Steps** (from transcript):
- Add tests for theme persistence
- Update documentation

**Links** (from transcript):
- [Design discussion](https://redhat.slack.com/archives/C123/p456) (Slack)

---
```

**Update "Current Focus"** section:
- Update "Last Worked" timestamp to the session timestamp
- Update status based on commits/PRs if changed

**Add to "Decisions"** section (if significant):
```markdown
### 2025-01-15 16:30:00 - CONSOLE-1234
**Decision**: Use CSS variables for theming
**Reasoning**: Better performance than runtime JS switching
**Context**: Discussed during implementation

---
```

**Update "Issue Relationships"** (if mentioned):
- Add any blocks/blockedBy relationships found in transcript
- Note any related issues mentioned

**Add to "Notes"** (if important context found):
- Any deadlines, priorities, or reminders mentioned

### 5. De-duplicate Entries
Before saving, check for duplicate entries:
- **Same timestamp + issue**: Keep only the most complete entry
- **Duplicate decisions**: Merge if same decision, keep both if different
- **Duplicate commits**: List each commit only once

### 6. Save and Clean Up
1. Update header fields:
   - **Last Updated**: Current timestamp
   - **Last Captured Session**: Extract `session_id` from pending session metadata (if available)
2. Write updated context to `~/.claude/work-context.md`
3. Delete pending file: `rm ~/.claude/work-context-pending.md`
4. Brief confirmation: "✓ Merged session from your last exit"

**Now proceed to read the merged context** ⬇️

## Read Current Context
```bash
cat ~/.claude/work-context.md 2>/dev/null
```

If file doesn't exist, create initial structure:
```bash
mkdir -p ~/.claude/work-context
```

```markdown
# Work Context

**Last Updated**: YYYY-MM-DD HH:MM:SS
**Last Captured Session**: (none)

## Current Focus

(None)

## Recent Work Sessions

(No recent sessions)

## Decisions

(No decisions recorded)

## Issue Relationships

(No relationships tracked)

## Notes

(No notes)

## Archive Summary

(No archived months)
```

## Use Context
After merging any pending sessions, the context is now up-to-date. Use it to inform the workflow:

- Show "Last worked on: CONSOLE-1234 (2 hours ago)"
- Suggest next tasks based on notes from previous session
- Remind of decisions on related issues
- Highlight blockers mentioned in transcript
- Show external links captured from conversation

**Note**: Context was already merged at startup if pending file existed. Now it's ready to use throughout the session. Continue updating context at key points (see Step 10).

# Step 2: Check Current Work
Check if user is already working on something:

```bash
git branch --show-current
```

## Handle Arguments First (if provided)
If user provided an argument to `/do`:

1. **If specific issue key** (e.g., `CONSOLE-1234`):
   - Check if it matches current branch → Skip to Step 7 (already on it)
   - Otherwise → Skip to Step 8, proceed with that issue

2. **If "my next story" / "next story"**:
   - Fetch all CONSOLE issues (Step 3)
   - Filter for TODO or IN_PROGRESS status
   - Auto-select highest priority
   - Skip to Step 8 with selected issue

3. **If "my next bug" / "next bug"**:
   - Fetch all OCPBUGS issues (Step 3)
   - Filter for NEW or ASSIGNED status
   - Auto-select highest priority
   - Skip to Step 8 with selected issue

4. **If keyword search**:
   - Fetch all issues (Step 3)
   - Search summaries for keyword matches
   - If single match → Skip to Step 8 with that issue
   - If multiple matches → Show filtered list, ask to choose → Skip to Step 8
   - If no matches → Continue to full queue

**After handling arguments, if issue identified, skip to Step 8 or Step 7 as appropriate.**

## If No Arguments: Check Current Branch

### If on a Work Branch (CONSOLE-XXXX or OCPBUGS-XXXX)
1. Extract issue key from branch name
2. Get Jira issue details: `jira issue view <KEY>`
3. Check git status and recent commits
4. **From context**: Show last worked time, next steps, decisions, blockers

Present summary:
- Issue key, summary, status
- Modified files and recent commits
- Last worked timestamp (from context)
- Next steps (from context)
- Decisions made (from context)

Ask: "Continue working on this, or switch to something else?"
- If continue → Skip to Step 7
- If switch → Continue to full queue

### If Not on Standard Work Branch
Try smart detection by comparing branch name to Jira issue summaries.

If potential matches found, ask if working on any of those issues.

If on master/main or no matches → Show full work queue

# Step 3: Get Jira Issues
**Note**: This step is always needed, even with arguments, to filter or verify issue data.

```bash
jira issue list -q"assignee = currentUser() AND project IS NOT EMPTY" --plain --columns KEY,SUMMARY,STATUS,PRIORITY,TYPE --order-by priority
```

If arguments were provided in Step 2, use this data to:
- Filter by project (CONSOLE vs OCPBUGS)
- Filter by status (TODO, IN_PROGRESS, NEW, ASSIGNED)
- Search summaries for keyword matches
- Select highest priority from filtered results

# Step 4: Get Local Branches
```bash
git branch --format="%(refname:short)"
```

Identify branches matching CONSOLE-X or OCPBUGS-X pattern.

# Step 5: Get PR Information
```bash
# PRs you created
gh pr list --author @me --state open --json number,title,url,isDraft,reviewDecision,statusCheckRollup

# PRs assigned to you
gh pr list --search "assignee:@me" --state open --json number,title,url,author,isDraft
```

Match PRs to Jira issues by parsing titles/branches.

# Step 6: Interpret Issue Status

## OCPBUGS Workflow
- **NEW**: If assignee != "jhadvig" → queued work
- **ASSIGNED**: Todo queue, ready to work on
- **POST**: PR open, actively being worked on
- **MODIFIED**: PR merged, waiting for QA (no dev action)
- **ON_QA**: In QA verification (no dev action)
- **VERIFIED**: QA verified, dev work complete
- **RELEASE_PENDING**: In build, dev work complete
- **CLOSED**: Released, completed

## CONSOLE Workflow
- **TODO**: Not started, ready to work on
- **IN_PROGRESS**: Work begun, actively working
- **CODE_REVIEW**: PR under internal review, actively working
- **REVIEW**: Pending docs/PX/QE review (may need attention)
- **CLOSED**: Completed

## Categories
- **Actively Being Worked On**: CONSOLE (IN_PROGRESS, CODE_REVIEW), OCPBUGS (POST)
- **Queued/Ready to Work**: CONSOLE (TODO), OCPBUGS (NEW, ASSIGNED)
- **Waiting on Others**: CONSOLE (REVIEW), OCPBUGS (MODIFIED, ON_QA)
- **Completed**: CONSOLE (CLOSED), OCPBUGS (VERIFIED, RELEASE_PENDING, CLOSED)

# Step 6.5: Check for Blocked/Stalled Issues
For each issue in the "Queued/Ready to Work" or "Actively Being Worked On" categories, check recent comments to identify if they're actually blocked or waiting on others.

## Fetch Recent Comments
For each relevant issue:
```bash
jira issue view <KEY> --comments 5
```

## Analyze Comments for Blocking Indicators
Look for patterns in recent comments (last 2-3 comments):

**Indicators of being blocked/stalled:**
- **Waiting for response**: "waiting for", "need response from", "pending feedback from"
- **Questions unanswered**: Someone asked a question and you haven't responded yet
- **Mentioned others**: Recent comment @mentions someone else and no reply yet
- **Needs information**: "need more info", "waiting for details", "blocked by"
- **External dependencies**: "waiting on team X", "depends on", "blocked by issue Y"

**Check timing:**
- If last comment is FROM you asking someone else → Blocked/waiting
- If last comment is TO you asking a question and >24 hours old → Needs response (still active)
- If last comment is TO you and <24 hours → Still active
- If no recent activity (>7 days) → Possibly stalled

## Mark Issues as Blocked
Track which issues are blocked/waiting:
- **Blocked on response**: Move to lower priority or "Waiting on Others" section
- **Needs your response**: Keep in queue but flag with "⚠️ Needs response"
- **Stale (no activity >7 days)**: Flag with "🕐 Stale - needs attention"

## Update Queue Priority
Use this information when presenting the queue (Step 7):
- Deprioritize issues blocked on others
- Highlight issues needing your response
- Flag stale issues for potential follow-up

# Step 7: Present Work Queue
**Note**: Skip this step if arguments were provided and issue was already selected in Step 2.

Display in priority order, enhanced with context history:

## Currently Working On
Issues actively being worked (IN_PROGRESS, CODE_REVIEW, POST):
- Issue key, priority, status, summary
- Branch and PR status
- **From context**: Last worked, next steps, decisions, blockers
- **From comments**: Flags for blocking/stalled status
  - ⚠️ Needs response (question asked to you)
  - 🕐 Stale (no activity >7 days)
- Indicate if currently checked out

## Blocked/Waiting on Others
Issues that are blocked or waiting for external input (from Step 6.5):
- Show issues waiting on responses from others
- Display what they're waiting for
- Lower priority than active work

## Next Up in Queue
Queued/ready issues (TODO, ASSIGNED) in priority order:
- Issue key, priority, status, summary
- Branch exists? (can resume) or needs creation?
- **From context**: Previously noted as "next" or related to completed work
- **From comments**: Flags if needs response or stale

## PRs Assigned to You
PRs others assigned to you:
- PR number, title, author
- Associated issue key
- Link to view

## Recently Completed
Brief summary:
- Count of completed issues
- Optionally list 1-2 most recent

# Step 8: Help Select Next Task
**If issue already selected via arguments** (from Step 2):
- Skip the selection prompt
- Confirm the auto-selected issue: "Working on [CONSOLE-1234]: [Summary]"
- Proceed to branch checkout/creation

**Otherwise, ask what they'd like to work on:**
- Next item in queue (suggest highest priority)
- Continue current work
- Select specific issue
- View details

Once selected (or auto-selected):
- If branch exists → offer to check it out
- If no branch → offer to create (use just issue key: CONSOLE-1234)

**After selecting/creating branch**:
1. Check it out
2. **Capture session start** (see Step 10)
3. Proceed to helping with the task

# Step 9: Help Complete the Task
Offer to help with the selected task:

## Show Issue Details
```bash
jira issue view <KEY>
```

**Check for external links** in Jira issue:
- Look for Slack threads, Google Docs, design docs
- If found and relevant, ask: "Should I include this in work context? (optional)"
- Store links for capture

## Help with Work
- Find relevant code files
- Understand current implementation
- Plan approach
- Write code/fixes
- Create tests
- Update documentation

**During work**:
- When important decisions are made, note them for capture
- Track blockers or dependencies mentioned
- Note any issue relationships

## When Switching or Ending
When user:
- Switches to different task → Capture current session first
- Says they're done → Capture session
- Conversation is wrapping up → Capture session

# Step 10: Capture Work Context
Automatically capture work session context at key points.

## When to Capture
- **Starting work**: After checking out branch
- **Switching tasks**: Before switching to new issue
- **Ending session**: When conversation is wrapping up
- **On exit**: SessionEnd hook handles automatically

## What to Capture Automatically

### Get Session Metadata
Claude Code provides session metadata that should be captured:
- **session_id**: Available in the current environment/context
- Use this to update "Last Captured Session" in work-context.md
- This prevents SessionEnd hook from creating duplicate pending files

### Gather Observable Data
```bash
# Get current branch and issue key
BRANCH=$(git branch --show-current)

# Get modified files
git status --porcelain

# Get recent commits
git log --oneline -5

# Get commits for this branch
git log master..HEAD --oneline

# Get file stats
git diff master...HEAD --stat
```

### Infer from Conversation
Parse the current conversation for contextual information:
- **Decisions**: "let's use X", "decided to do Y", "going with Z approach"
- **Next steps**: "next we need to...", "still need to...", "remaining work is..."
- **Blockers**: "blocked by...", "waiting for...", "can't proceed until..."
- **Issue relationships**: "this blocks CONSOLE-X", "related to OCPBUGS-Y"
- **Status**: Infer from actions (commits → in-progress, PR created → code-review)

### Auto-Detect External Links
Scan conversation for URLs and context:
- **Slack threads**: `https://redhat.slack.com/archives/...`
- **Google Docs**: `https://docs.google.com/...`
- **Jira links**: `https://issues.redhat.com/browse/...`
- **GitHub discussions**: `https://github.com/.../issues/...`

If found, note what they reference (e.g., "Design discussion", "Meeting notes", "Architecture decision")

### Ask for Links (Sparingly)
Only ask if important decisions were made but no link was shared:
- Ask once: "Any link to the discussion? (Slack, meeting notes, etc.)"
- Don't ask for small tactical decisions
- Don't interrupt flow - links are optional

## Update Work Context File

Read existing context:
```bash
cat ~/.claude/work-context.md 2>/dev/null
```

The context file is markdown-formatted for easy reading. Structure:

```markdown
# Work Context

**Last Updated**: 2025-01-15 16:45:00
**Last Captured Session**: abc123xyz

## Current Focus

**CONSOLE-1234**: Add dark mode toggle
- **Branch**: CONSOLE-1234
- **Started**: 2025-01-15 14:30:00
- **Last Worked**: 2025-01-15 16:45:00
- **Status**: in-progress

## Recent Work Sessions

### 2025-01-15 16:45:00 - CONSOLE-1234
**Add dark mode toggle** (continued)

**Files Modified**:
- src/components/Theme.tsx
- src/styles/theme.css

**Commits**:
- feat: add theme toggle
- test: add theme tests

**Next Steps**: Need to add tests for theme persistence

**Links**:
- [Design discussion](https://redhat.slack.com/archives/C123/p1234567890) (Slack)

---

### 2025-01-14 10:00:00 - CONSOLE-1200
...

## Decisions

### 2025-01-15 16:30:00 - CONSOLE-1234
**Decision**: Use CSS variables for theming
**Reasoning**: Better performance and easier to maintain
**Context**: Discussed during implementation

**Links**:
- [Architecture review notes](https://docs.google.com/document/d/xyz) (Google Doc)

---

## Issue Relationships

### CONSOLE-1234
- **Blocks**: CONSOLE-1250
- **Related To**: CONSOLE-1100
- **Notes**: Should coordinate with catalog team on color scheme

### CONSOLE-1200
...

## Notes

- **2025-01-15**: CONSOLE-1234 is priority this week, aim to complete by Friday
- **2025-01-10**: Focus on catalog redesign this month

## Archive Summary

### 2024-12
**Archived**: 2025-01-15 10:00:00
**Archive File**: `~/.claude/work-context/2024-12.md`

**Issues Worked**: CONSOLE-1100, CONSOLE-1150, OCPBUGS-5000
**Completed**: CONSOLE-1100, CONSOLE-1150
**Total Sessions**: 45

**Key Decisions**:
- Use React Query for data fetching (CONSOLE-1100, 2024-12-15)
```

## Archive Old Entries
If entries are older than 30 days:

1. Archive full entries to `~/.claude/work-context/YYYY-MM.md` (markdown format)
2. Add compressed summary under "Archive Summary" section
3. Remove old entries from detailed sections

## Write Updated Context
Before writing, update the header fields:
1. **Last Updated**: Current timestamp
2. **Last Captured Session**: Update with current `session_id` from Claude session metadata
   - This prevents SessionEnd hook from creating duplicate pending file
   - SessionEnd hook checks this field and skips if already captured

Use Write tool to update `~/.claude/work-context.md` in markdown format.

## Confirm (Brief)
- "✓ Work context updated for CONSOLE-1234"
- Keep it concise, don't interrupt flow

# Important Notes
- **`/do` manages your entire workflow** - queue, tasks, and context
- **Flexible invocation** - `/do` accepts optional arguments for quick task selection:
  - `/do` - Show full work queue
  - `/do CONSOLE-1234` - Jump directly to specific issue
  - `/do my next story` - Auto-select highest priority CONSOLE story
  - `/do my next bug` - Auto-select highest priority OCPBUGS bug
  - `/do <keywords>` - Search issue summaries and select
- **Smart blocking detection** - Checks recent comments on issues to identify blocked/stalled work:
  - Detects issues waiting on responses from others
  - Flags issues needing your response (⚠️)
  - Identifies stale issues with no activity >7 days (🕐)
  - Automatically deprioritizes blocked work in queue
  - Shows separate "Blocked/Waiting on Others" section
- **Auto-merge on startup** - `/do` ALWAYS checks for pending sessions FIRST and merges them automatically (Step 1)
  - Reads pending session file from SessionEnd hook
  - Parses transcript for decisions, next steps, blockers
  - Merges into work-context.md with de-duplication
  - Deletes pending file
  - Brief confirmation: "✓ Merged session from your last exit"
- **Context is always up-to-date** - After auto-merge, context reflects your last session
- `/do` reads merged context to show history AND updates it at key points
- **Smart duplication prevention**:
  - When context is captured during `/do`, the `session_id` is saved in work-context.md
  - SessionEnd hook checks this before creating a pending file
  - If session was already captured, SessionEnd skips creating pending file
  - No redundant data, no unnecessary merges
- **Automatic context capture** happens at:
  - Starting work on an issue (after checkout)
  - Switching between tasks
  - End of session (before exit)
  - On session exit (SessionEnd hook - only if not already captured)
- **SessionEnd hook data** includes:
  - Git changes (modified files, commits)
  - Session metadata (session_id, cwd, permission_mode)
  - **Transcript path** - full conversation JSON for context extraction
- **Transcript parsing** is automatic:
  - Parse for decisions, next steps, blockers from natural conversation
  - Extract external links (Slack, Docs, Jira) mentioned in discussion
  - Identify issue relationships mentioned
  - Don't require user to manually provide - infer from conversation
- **Minimize user burden**: Everything is automatic - git data gathered, transcript parsed, context merged
- **SessionEnd hook** captures on exit (if needed) → `/do` auto-merges on next startup
- The main branch is "master" (not "main")
- Keep presentation concise and scannable
- Default to suggesting highest priority queued item
- Brief confirmations only ("✓ Context updated" / "✓ Merged session"), don't interrupt flow
