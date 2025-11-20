# /bug

## Usage
`/bug <short description of observed behavior>`

Example: `/bug The quick search modal doesn't close when clicking outside of it`

## Context
- This command helps create comprehensive bug reports for the OpenShift Console project
- Bug reports should be created in the OCPBUGS JIRA project with the "Management Console" component
- Bug branches should be created from the main branch (named `main` in OpenShift projects)
- The codebase uses both frontend (TypeScript/React) and backend (Go) code
- Bug reports should follow Red Hat's issue reporting standards

## Instructions

You are a senior engineer helping to document and fix bugs in the OpenShift Console. When the user provides a short description of observed behavior, follow these steps:

### Step 1: Investigate the Issue
1. Use the codebase as reference to understand and confirm the observed behavior
2. Search for relevant code that relates to the reported issue
3. Identify the root cause or likely cause of the problem
4. Determine which component(s) are affected (frontend/backend)

### Step 2: Write a Complete Bug Report

Create a detailed bug report with the following sections:

**Title**: A concise, descriptive title (max 100 characters)

**Description of problem**:
- Clear explanation of what the issue is
- Include technical details about what's happening incorrectly
- Reference specific files and line numbers when possible (use format `file_path:line_number`)

**Version-Release number**:
- Ask for the earliest OpenShift version this bug is observed in, if none is provided through the command arguments

**How reproducible**:
- Always
- Sometimes
- Rarely
- Unknown
(Choose based on the nature of the bug)

**Steps to Reproduce**:
1. Numbered list of exact steps to reproduce the issue
2. Be specific about UI interactions, API calls, or system states
3. Include any necessary preconditions

**Actual results**:
- What actually happens when following the steps
- Include error messages, incorrect UI states, console errors, etc.

**Expected results**:
- What should happen instead
- Reference correct behavior from similar features if applicable

**Additional info**:
- Any relevant technical details (stack traces, network requests, etc.)
- Related code references with file:line format
- Potential impact on users
- Any workarounds that exist

### Step 3: Check for Jira CLI

After writing the bug report, check if the `jira` CLI command is available:
1. Run `which jira` to check for the Jira CLI
2. If available, offer to create the bug in JIRA using the command:
   ```
   jira issue create --project OCPBUGS --type Bug --component "Management Console" --summary "<title>" --body "<description>"
   ```
3. If not available, inform the user they'll need to create the issue manually in JIRA

### Step 4: Offer to Create a Branch

If the user wants to proceed with a fix:
1. Offer to create a new git branch from main
2. Suggest a branch name in the format: `OCPBUGS-<issue-number>-<short-description>`
3. If the JIRA issue doesn't exist yet, suggest a descriptive branch name and note that it should be renamed after JIRA issue creation

### Step 5: Propose a Fix

After creating the branch (if requested):
1. Analyze the root cause based on your investigation
2. Propose a specific fix with code changes
3. Explain why this fix addresses the issue
4. **Consider adding a test case when appropriate**:
   - If the bug is in testable logic, suggest writing a test that would have caught this bug
   - The test should include a comment with a link to the JIRA issue
   - For frontend tests: Add a comment like `// Regression test for OCPBUGS-XXXXX: https://issues.redhat.com/browse/OCPBUGS-XXXXX`
   - For backend Go tests: Add a comment like `// Regression test for OCPBUGS-XXXXX: https://issues.redhat.com/browse/OCPBUGS-XXXXX`
   - Explain what edge case or scenario the test covers
   - Ensure the test fails before the fix and passes after the fix
   - If a test is not practical (e.g., pure UI/styling bugs, race conditions, or integration issues), explain why and suggest manual testing steps instead
5. Highlight if the fix requires both frontend and backend changes
6. Remind about running tests and linting before creating a PR

## Output Format

Present the bug report in a clear, formatted markdown block that can be easily copied to JIRA. Use this structure:

```
## [BUG TITLE]

**Description of problem:**
[Description]

**Version-Release number:**
[Version]

**How reproducible:**
[Always/Sometimes/Rarely/Unknown]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Actual results:**
[What happens]

**Expected results:**
[What should happen]

**Additional info:**
[Technical details, code references, etc.]
```

## Important Notes

- Be thorough in your investigation before writing the bug report
- Use the Task tool with subagent_type=Explore if you need to explore the codebase extensively
- Always verify your findings by reading actual code files
- Include specific file paths and line numbers in your references
- Consider both frontend and backend implications
- Follow the Red Hat style guide for all text in the bug report
- Don't create the branch or JIRA issue without explicit user confirmation
- **Consider adding a test case when appropriate** - When the bug involves testable logic, suggest a regression test that:
  - Would have caught the bug if it existed before the bug was introduced
  - Includes a comment linking to the JIRA issue (e.g., `// Regression test for OCPBUGS-12345: https://issues.redhat.com/browse/OCPBUGS-12345`)
  - Documents the specific edge case or scenario being tested
  - For frontend: Use React Testing Library patterns, following existing test conventions in the codebase
  - For backend: Follow Go testing conventions with descriptive test names and table-driven tests where appropriate
  - If automated testing is not practical, explain why and suggest manual testing steps instead
- After proposing a fix, remind the user about the standard development workflow:
  - Run linting: `cd frontend && yarn lint` (for frontend changes)
  - Run tests: `cd frontend && yarn test` (for frontend changes)
  - Run backend tests: `./test-backend.sh` (for backend changes)
  - Update i18n: `cd frontend && yarn i18n` (if user-facing text changed)
  - Create commit with descriptive message
  - Push and create PR

## Example Interaction

User: `/bug The namespace selector dropdown shows duplicates`