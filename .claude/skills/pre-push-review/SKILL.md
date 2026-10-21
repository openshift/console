---
name: pre-push-review
description: Comprehensive local code review using both Claude AI and CodeRabbit AI before pushing changes to GitHub. This command analyzes your local changes and provides actionable feedback without posting anything to GitHub.
argument-hint: "[--staged] [--base <branch>]"
---

# /pre-push-review

## Usage
```bash
# Review all commits compared to main branch (default)
/pre-push-review

# Review only staged changes
/pre-push-review --staged

# Review commits compared to a specific base branch
/pre-push-review --base upstream/main

# Review commits compared to develop branch
/pre-push-review --base develop

# Review staged changes (base branch used for context only)
/pre-push-review --staged --base upstream/main
```

## Description
Comprehensive local code review using both Claude AI and CodeRabbit AI before pushing changes to GitHub. This command analyzes your local changes and provides actionable feedback without posting anything to GitHub.

**Two Review Modes**:
1. **Commits Mode** (default): Review all commits that are new compared to the base branch
2. **Staged Mode** (`--staged`): Review only staged changes (what you've `git add`-ed)

## Prerequisites Check

Before starting the review, verify that required tools are installed and authenticated:

1. **Git**:
   - Must be in a git repository
   - Check current branch with `git branch --show-current`
   - Verify there are changes to review

2. **CodeRabbit CLI**:
   - Check: Run `coderabbit auth status`
   - If not installed:
     - Run: `curl -fsSL https://cli.coderabbit.ai/install.sh | sh`
     - Then: `source ~/.zshrc` (or appropriate shell config)
   - Authentication:
     - Ask user to request: "Run: coderabbit auth login"
     - Claude will execute the command and provide authentication URL
     - User opens URL in browser and copies token
     - User pastes token back to Claude
     - Verify with: `coderabbit auth status`

**IMPORTANT**: If CodeRabbit is missing or not authenticated, you will stop and will not proceed.

## Process

### Phase 1: Determine Review Scope

1. **Parse Parameters**:
   - Check for `--staged` flag (review staged changes)
   - Check for `--base <branch>` parameter (default: `main`)
   - If no flags: default to commits mode

2. **Gather Git Information**:
   ```bash
   # Get current branch
   git branch --show-current

   # For commits mode: count new commits vs base
   git rev-list --count <base-branch>..HEAD

   # For staged mode: check if there are staged changes
   git diff --cached --stat

   # Get repository root
   git rev-parse --show-toplevel
   ```

3. **Validate Scope**:
   - **Commits mode**: Ensure there are new commits compared to base branch
     - If no new commits: inform user and exit
   - **Staged mode**: Ensure there are staged changes
     - If no staged changes: inform user to run `git add` first and exit
   - If base branch doesn't exist: inform user and suggest alternatives

### Phase 2: Gather Changes for Review

**For Commits Mode**:
```bash
# Get commit log
git log <base-branch>..HEAD --oneline

# Get full diff of all commits
git diff <base-branch>..HEAD

# Get stats (files changed, additions, deletions)
git diff <base-branch>..HEAD --stat

# Get list of changed files
git diff <base-branch>..HEAD --name-only
```

**For Staged Mode**:
```bash
# Get staged changes diff
git diff --cached

# Get stats of staged changes
git diff --cached --stat

# Get list of staged files
git diff --cached --name-only
```

### Phase 3: Dual AI Review (Parallel Execution)

**IMPORTANT**: This is a LOCAL review only - nothing is posted to GitHub.

Run both reviews concurrently for efficiency:

1. **CodeRabbit Review** (Background - START THIS FIRST):
   - CodeRabbit analyzes git changes and can take 7-30+ minutes
   - **For Commits Mode**: `coderabbit --prompt-only --type committed --base <base-branch>`
   - **For Staged Mode**: `coderabbit --prompt-only --type uncommitted`
   - ⚠️ **Background execution note**: Run in background to allow parallel processing, BUT the background output may only show status messages ("Analyzing", "Reviewing"). If no findings appear, run the command again directly to capture actual results.
   - Flags explained:
     - `--prompt-only`: Token-efficient AI-optimized output (does NOT post to GitHub)
     - `--type committed`: Review committed changes (for commits mode)
     - `--type uncommitted`: Review working directory and staged changes (for staged mode)
     - `--base <branch>`: Specify base branch for comparison
   - Monitor progress: CodeRabbit will output findings as it discovers them
   - Note: CodeRabbit automatically reads `.claude/CLAUDE.md` for project context
   - **Expected output format**: CodeRabbit provides findings in format:
     ```
     File: path/to/file.ts
     Line: X to Y
     Type: potential_issue

     Prompt for AI Agent:
     [Detailed description of the issue and suggested fix approach]
     ```

2. **Claude AI Review** (While CodeRabbit runs):
   - Analyze the diff output from Phase 2
   - Review commit messages (commits mode only)
   - Focus on:
     - Code quality and best practices
     - Potential bugs and edge cases
     - Security vulnerabilities (SQL injection, XSS, command injection, etc.)
     - Performance implications
     - Breaking changes and backwards compatibility
     - API design and consistency
     - Type safety and error handling
     - Test coverage gaps
     - Documentation completeness
     - Project-specific requirements:
       - i18n usage (per project CLAUDE.md)
       - PatternFly v6 usage, avoid inline styles
       - No React namespace imports

### Phase 4: Wait for CodeRabbit Completion

1. **Monitor Background Process**: Check if CodeRabbit is still running
2. **Read Output**: Once complete, read the full CodeRabbit analysis
   - ⚠️ **Common Issue**: If background execution only shows status messages without findings, run the command again directly: `coderabbit --prompt-only --type committed --base <branch>`
   - This ensures you capture the actual AI-generated findings, not just status updates
3. **Handle Timeout**: If CodeRabbit takes longer than expected, you can:
   - Continue waiting (recommended - CodeRabbit is thorough)
   - Proceed with Claude-only review if time-constrained
   - Note in the final report if CodeRabbit was incomplete

### Phase 5: Cross-Check and Synthesize

1. **Compare Findings**:
   - Identify issues found by both Claude and CodeRabbit (high confidence)
   - Identify issues found by only one reviewer (needs validation)
   - Flag conflicting recommendations
   - Note CodeRabbit's unique insights (race conditions, memory leaks, subtle logic errors)

2. **Categorize Issues by Severity**:
   - **Critical**: Security vulnerabilities, data loss risks, breaking changes, memory leaks
   - **Actionable**: Bugs, race conditions, performance issues, incorrect implementations
   - **Minor**: Code style, naming conventions, small optimizations
   - **Informational**: Suggestions, best practices, future improvements

3. **Prioritize by Confidence**:
   - Issues found by both reviewers should be prioritized
   - Single-reviewer findings should be validated before flagging as critical

### Phase 6: Generate Review Summary

Output a comprehensive review following this template:

```markdown
# Pre-Push Review Summary

## Overview
- **Review Mode**: Commits (vs. <base-branch>) | Staged Changes
- **Current Branch**: <branch-name>
- **Base Branch**: <base-branch>
- **Commits**: <count> new commits | N/A (staged mode)
- **Files Changed**: <count>
- **Lines Changed**: +<additions> -<deletions>
- **Review Method**: Claude + CodeRabbit | Claude only (if CodeRabbit unavailable)

## Critical Issues (Action Required Immediately)
<count> critical issues identified

### 1. <Issue Title>
- **Location**: <file>:<line>
- **Severity**: Critical
- **Found by**: Claude + CodeRabbit | Claude only | CodeRabbit only
- **Issue**: <concise description>
- **Why it matters**: <explanation of impact>
- **Consequence if not fixed**: <what will happen>
- **Suggested fix**: <actionable recommendation>

## Actionable Issues (Should Address Before Push)
<count> actionable issues identified

### 1. <Issue Title>
- **Location**: <file>:<line>
- **Severity**: High/Medium
- **Found by**: Claude + CodeRabbit | Claude only | CodeRabbit only
- **Issue**: <concise description>
- **Why it matters**: <explanation of impact>
- **Consequence if not fixed**: <what will happen>
- **Suggested fix**: <actionable recommendation>

## Minor Issues (Optional Improvements)
<count> minor issues identified

- <file>:<line> - <brief description>
- <file>:<line> - <brief description>

## Positive Highlights
- <well-implemented features or good practices observed>
- <test coverage improvements>
- <documentation quality>
- <good commit messages (commits mode only)>

## Cross-Check Summary
- **Issues confirmed by both reviewers**: <count>
- **Claude-only findings**: <count>
- **CodeRabbit-only findings**: <count>
- **Conflicting recommendations**: <count> (if any, explain the conflict)

## Commit Quality Analysis (Commits Mode Only)
- **Commit Messages**: Clear and descriptive | Needs improvement
- **Commit Organization**: Well-structured | Consider squashing/splitting
- **Atomic Commits**: Each commit is self-contained | Some commits too large

## Recommendation
- [ ] Ready to push (no critical issues)
- [ ] Fix critical issues before pushing
- [ ] Consider addressing actionable issues before push
- [ ] Safe to push with minor issues (can address in follow-up)

## Next Steps
<Specific actionable steps for the developer>
1. Fix critical issue X in file Y
2. Consider refactoring Z for better performance
3. Add tests for edge case A
4. Update documentation for feature B

## Additional Context
<Any relevant information about the changes, related issues, or architectural considerations>

## CodeRabbit Insights
<Unique findings from CodeRabbit such as:>
- Race conditions detected
- Memory leak potential
- Subtle logic errors that static analysis wouldn't catch
- Performance hotspots
- Concurrency issues
```

### Phase 7: Optional Fix Implementation

After completing the review, Claude can implement fixes for identified issues:

1. **Offer to implement fixes**: Ask user if they want Claude to implement the actionable issues
2. **Implement fixes systematically**:
   - Start with critical issues first
   - Apply one fix at a time for safety
   - Use proper coding patterns (avoid React hooks violations, maintain type safety)
   - Follow project conventions (i18n, PatternFly usage, etc.)
3. **Handle pre-commit hooks**: Be prepared for pre-commit hooks that may catch issues in the fixes themselves
   - ESLint violations, React hooks issues, formatting problems
   - Fix these immediately and re-stage changes
4. **Commit fixes with descriptive message**: Include details about what was fixed and why

### Phase 8: Verification (Re-run Review)

After implementing fixes, optionally re-run the review to verify:

1. **Re-run pre-push review**: Check that fixes don't introduce new issues
2. **Validate fix quality**: Ensure the implemented solutions are correct
3. **Confirm readiness**: Final confirmation that code is ready to push

## Guidelines

**Review Standards**:
- Focus on objective, actionable feedback
- Provide specific file and line references
- Explain WHY changes are needed, not just WHAT to change
- Prioritize security, correctness, and maintainability over style
- Consider the change context (bug fix, feature, refactor) when reviewing
- Cross-reference with project style guides and contribution guidelines
- Be concise but thorough - avoid over-explaining obvious issues

**Code Review Principles**:
- Assume good intent from the developer
- Focus on teaching moments for complex issues
- Highlight what's done well, not just problems
- Consider if the issue blocks pushing or can be addressed later
- Validate that tests cover the changes
- Check for proper i18n usage (per project CLAUDE.md)
- Verify PatternFly v6 usage and avoid inline styles (per project CLAUDE.md)
- Check for React namespace import issues (per project CLAUDE.md)

**Tool Usage**:
- Use `git diff` and `git log` for gathering local changes
- Run CodeRabbit in background:
  - Commits mode: `coderabbit --prompt-only --type committed --base <branch>`
  - Staged mode: `coderabbit --prompt-only --type uncommitted`
- CodeRabbit takes 7-30+ minutes - monitor progress and wait for completion
- Parse git output to understand scope and context
- Handle errors gracefully if git commands fail

**Output Format**:
- Use clear markdown formatting for terminal display
- Use color/emphasis sparingly for readability
- Group related issues together
- Provide actionable next steps
- Include links to relevant documentation when applicable

## Example Usage

```bash
# Review all commits before pushing to PR
/pre-push-review

# Review commits compared to upstream main
/pre-push-review --base upstream/main

# Review only what you've staged
git add src/component.tsx
/pre-push-review --staged

# Review commits on feature branch vs develop
git checkout feature/new-auth
/pre-push-review --base develop
```

## Success Criteria
- CodeRabbit is installed and authenticated (or Claude-only review)
- Git repository and branch information retrieved successfully
- Changes to review are identified (commits or staged)
- Both AI reviewers complete their analysis (or Claude-only if CodeRabbit unavailable)
- Findings are cross-checked and categorized by severity and confidence
- Comprehensive review summary generated in terminal
- No reviews posted to GitHub (local-only analysis)
- User has clear understanding of:
  - Which issues are critical vs. actionable vs. minor
  - Why each issue matters and consequences of not fixing
  - Specific actionable steps to resolve each issue
  - Whether changes are ready to push or need fixes

## Workflow Tracking
- Use TodoWrite to track the 6-8 phases of the review process (including optional implementation and verification phases)
- Mark each phase as in_progress when starting and completed when done
- This gives the user visibility into review progress, especially during CodeRabbit's long analysis
- If implementing fixes, track individual fix tasks to show progress

## Error Handling

**If CodeRabbit is missing**:
1. Inform user that CodeRabbit is not installed
2. Provide installation command: `curl -fsSL https://cli.coderabbit.ai/install.sh | sh`
3. Offer to proceed with Claude-only review
4. Note in summary that only Claude review was performed

**If CodeRabbit authentication fails**:
1. Run `coderabbit auth status` to check status
2. Guide user through authentication: `coderabbit auth login`
3. Note: Authentication improves quality significantly
4. Proceed with Claude-only review if user prefers not to authenticate

**If no changes to review**:
1. **Commits mode**: No new commits compared to base branch
   - Inform user: "No new commits found compared to <base-branch>"
   - Suggest checking current branch or specifying different base
   - Exit gracefully
2. **Staged mode**: No staged changes
   - Inform user: "No staged changes found"
   - Suggest running `git add <files>` first
   - Show `git status` to help user see what can be staged

**If base branch doesn't exist**:
1. Inform user that base branch was not found
2. Show available branches with `git branch -a`
3. Suggest common alternatives (main, master, develop, upstream/main)
4. Exit and wait for user to specify correct base branch

**If git repository not found**:
1. Check if current directory is a git repository
2. Inform user to run from within a git repository
3. Exit gracefully

**If CodeRabbit fails or times out**:
1. Check `coderabbit auth status` (authentication improves quality)
2. Verify git repository is clean with `git status`
3. Ensure you're analyzing code files (not just docs/configs)
4. If timeout: Note in summary and proceed with Claude-only findings
5. Consider using `--type uncommitted` for faster analysis (staged mode)

**If CodeRabbit background execution shows no findings**:
1. This is common when using background execution - only status messages are captured
2. Run the same command again directly (not in background) to capture actual findings
3. Example: `coderabbit --prompt-only --type committed --base main`
4. The direct execution will show the detailed AI findings with file locations and suggestions

**If fix implementation introduces new issues**:
1. **Pre-commit hooks may catch new violations**: ESLint errors, React hooks violations, etc.
2. **Fix immediately**: Address the violation while preserving the original fix intent
3. **Common issues during fixes**:
   - React hooks violations (early returns before hooks, conditional hook calls)
   - ESLint formatting or rule violations
   - TypeScript type errors
4. **Re-stage changes**: After fixing pre-commit issues, re-stage the files and commit again

**If one reviewer fails**:
1. Proceed with the working reviewer
2. Clearly note in the summary that only one review was completed
3. Explain which reviewer failed and why
4. Provide troubleshooting steps for the failed reviewer
5. Suggest retrying with the specific reviewer once issue is resolved

## Notes

**Review Behavior**:
- This command performs LOCAL review only - nothing is posted to GitHub
- No branches are changed - you stay on your current branch
- No files are modified - this is read-only analysis
- Run this before `git push` to catch issues early
- Re-run after fixing issues to verify changes

**CodeRabbit Integration**:
- CodeRabbit excels at finding race conditions, memory leaks, and subtle logic errors
- The `--prompt-only` flag provides AI-optimized output without posting to GitHub
- CodeRabbit automatically reads `.claude/CLAUDE.md` for project-specific context
- Reviews can take 7-30+ minutes depending on change size - this is normal
- Authenticated CodeRabbit provides significantly better review quality
- Use `--type uncommitted` (staged mode) for faster reviews

**Cross-Check Value**:
- Issues found by both reviewers have highest confidence and should be prioritized
- CodeRabbit may catch concurrency/memory issues that static analysis misses
- Claude provides strong context on architecture, API design, and project conventions
- Conflicting recommendations should be analyzed carefully - both may have valid points

## Performance Tips

**Optimize CodeRabbit Analysis Time**:
- **Staged mode** (`--type uncommitted`) is fastest - only reviews what you've staged
- **Commits mode** (`--type committed`) reviews all commits vs base branch
- Keep commits focused and smaller for quicker reviews
- CodeRabbit is fastest on pure code files vs. configuration/documentation

**Managing Long Review Times**:
- CodeRabbit reviews take 7-30+ minutes - this is expected for thorough analysis
- Always run CodeRabbit in background first, then start Claude review
- Use TodoWrite to show progress - helps user understand what's happening
- Don't interrupt CodeRabbit - let it complete for best results
- If truly time-constrained, proceed with Claude-only review

## Best Practices

**Before Running Review**:
- Ensure CodeRabbit is authenticated for best results (or accept Claude-only)
- Know which base branch you're comparing against (main, upstream/main, develop)
- For staged mode: ensure you've `git add`-ed the files you want reviewed
- For commits mode: ensure you have commits to review

**During Review**:
- Monitor CodeRabbit progress in background
- Claude can analyze while CodeRabbit runs (parallel efficiency)
- Don't skip waiting for CodeRabbit unless absolutely necessary
- Use TodoWrite phases to communicate progress to user

**After Review**:
- Address critical issues before pushing (Claude can implement these fixes)
- Consider fixing actionable issues for code quality
- Minor issues can often be addressed in follow-up commits
- **If implementing fixes**: Let Claude implement them systematically, watching for pre-commit hook issues
- **Re-run review after fixes** to verify no new issues were introduced
- When ready: `git push` with confidence

**Workflow Integration**:
```bash
# Typical workflow
git add src/feature.tsx
git commit -m "Add new feature"
/pre-push-review                    # Review before push

# If issues found, let Claude implement fixes:
# Claude will:
# 1. Apply fixes to identified issues
# 2. Handle any pre-commit hook violations
# 3. Stage changes and commit with descriptive message

/pre-push-review                    # Verify fixes (optional but recommended)
git push origin feature-branch      # Push with confidence
```

**Extended Workflow with Fix Implementation**:
```bash
# 1. Initial development
git add .
git commit -m "feat: implement user authentication"

# 2. Run comprehensive review
/pre-push-review

# 3. Claude finds issues and offers to fix them
# User: "Yes, please fix the actionable issues"
# Claude implements fixes, handles pre-commit hooks, commits changes

# 4. Optional verification
/pre-push-review

# 5. Push with confidence
git push origin feature-branch
```
