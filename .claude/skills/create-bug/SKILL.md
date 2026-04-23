---
name: create-bug
description: Create an OCPBUGS Jira issue for OpenShift Console with structured field collection, validation, and submission via Jira MCP.
argument-hint: [brief bug title] (optional - will prompt if not provided)
allowed-tools: mcp__jira__jira_auth_status, mcp__jira__jira_search_issues_summary, mcp__jira__jira_create_issue, mcp__jira__jira_get_create_metadata, mcp__jira__jira_update_issue, mcp__jira__jira_create_issue_link, mcp__google-docs__drive_files_create, Read, Grep, Glob, Bash(git *), Bash(tee *), Bash(cp *), Bash(mkdir *), Bash(rm .claude/local/tmp/*)
---

# /create-bug

## Context

- Creates bug reports in the **OCPBUGS** Jira project with the **Management Console** component
- Uses the Jira MCP server for all Jira interactions (no CLI dependency)
- Follows Red Hat's issue reporting standards and Definition of Ready
- **SAFETY**: This command creates new issues and may update the just-created issue's description to add supporting file links — it NEVER modifies other existing issues or deletes any issues
- Description uses **plain text** formatting (the Jira MCP converts to ADF automatically)

## Prerequisites

- **Jira MCP server** configured and authenticated (see `.claude/local/docs/Jira-MCPsetup.md`)
- Verify auth by calling `mcp__jira__jira_auth_status` before proceeding
- If auth fails, inform the user and stop
- **Google Drive MCP server** (optional) — required for uploading supporting files (stack traces, screenshots, logs) to Google Drive. Without this, supporting files are saved locally to `.claude/local/tmp/` only.
- Required MCP tool permissions are pre-configured in the shared `.claude/settings.json`

## Instructions

### Step 0: Check for Bug Summary

If no bug summary was provided as an argument:
1. Output this question as regular text (do NOT use AskUserQuestion): "What's the bug title? (A short one-line summary, under 120 characters)"
2. Wait for the user's response before proceeding — this summary is used for the duplicate check and becomes the Jira issue title

### Step 1: Duplicate Check

Search Jira before creating to avoid duplicates:

1. Extract keywords from the bug summary (component names, error messages, symptoms)
2. Search using multiple JQL queries:
   ```sql
   text ~ "<keywords>" AND project = OCPBUGS ORDER BY created DESC
   ```
3. Try 2-3 keyword variations to cast a wider net
4. If potential matches are found, present them with key (including the full Jira URL), summary, status, and created date. Format each key as: `OCPBUGS-##### — https://issues.redhat.com/browse/OCPBUGS-#####` so the user can click through to inspect the issue.
5. Ask the user: "Any of these match your issue? (Enter a key to link, or 'none' to create new)"
6. If user picks an existing issue, stop and report that key
7. If no matches or user says 'none', proceed to Step 2

### Step 2: Collect Required Fields

Gather the following from the user. Use any information already provided; prompt only for missing fields.

**IMPORTANT — Input rules:**
- **Do NOT use AskUserQuestion.** It is not available in this skill. Output ALL questions as regular text and wait for the user to type their response in the chat.
- **Selection fields:** For fields with a fixed set of options (Severity, How reproducible, Component), list the options as numbered choices in your text output. The user will type their choice.
- **One at a time:** Ask for each field individually. Wait for the user's response before asking the next question. Do NOT batch multiple questions into a single message.

#### Required

| Field | Description | Input method |
|-------|-------------|--------------|
| **Summary** | One-line title including component and symptom (< 120 chars) | Free text |
| **Description of problem** | What is broken | Free text |
| **How reproducible** | Frequency of occurrence | Selection: Always, Sometimes, Rarely, Unable to reproduce |
| **Steps to Reproduce** | Numbered list of steps (at least 1) | Free text |
| **Actual results** | What actually happens. Prompt the user: "You can also paste screenshots, console error logs, stack traces, or HAR file contents here." | Free text |
| **Expected results** | What should happen instead | Free text |
| **Affects Version** | OCP version(s) where bug is observed (e.g., "4.22") | Free text |
| **Target Version** | OCP release targeted for the fix (e.g., "4.22") | Free text |
| **Severity** | Bug severity | Selection: Critical, Important, Moderate (default), Low, Informational |
| **Component** | Jira component for the bug | Selection: Management Console (default), Networking / Edge, OLM, Storage, Node, Other (free text) |

#### Optional

After collecting required fields, prompt: "Any optional info to add? You can provide any of: console error logs, component stack trace, HAR file, must-gather, screenshots, browser/cluster config, priority, labels, assignee — or 'none' to skip."

Then walk through each one the user wants to provide, one at a time.

| Field | Description | Input method |
|-------|-------------|--------------|
| **Additional info** | Slack thread, Red Hat support case, workarounds, related issues, context | Free text |
| **Console error logs** | Browser console error output | Free text |
| **Component stack trace** | React component stack trace from the error | Free text |
| **HAR file** | HTTP Archive recording of the failing request(s) | Free text (paste or file path) |
| **Must-gather** | Link or path to must-gather output | Free text |
| **Screenshots** | Screenshots or screen recordings of the issue | Free text (file path or description) |
| **Configuration** | Browser/version, cluster type/version, feature gate status | Free text |
| **Priority** | Issue priority | Selection: Critical, Major, Normal (default), Minor, Undefined |
| **Fix Versions** | Planned fix version(s) | Free text |
| **Target Backport Versions** | Versions to backport the fix to | Free text |
| **Labels** | Additional labels | Free text |
| **Assignee** | Person to assign the bug to | Free text |

### Step 2b: Save Supporting Files

Large supporting files (stack traces, console logs, HAR files, must-gather output, screenshots) cannot be attached directly to OCPBUGS issues via the Jira API. If Google Drive MCP is available, they will be uploaded to a Drive folder after issue creation (Step 5b). Otherwise, they are saved locally for the user to share manually.

During field collection (Step 2), if the user provides or pastes file content:
- Create `.claude/local/tmp/` if it doesn't exist using `Bash(mkdir -p .claude/local/tmp)`
- Save each file to `.claude/local/tmp/` (e.g., `.claude/local/tmp/ocpbug-stack-trace.txt`) using `Bash(tee ...)`
- If the user provides a file path to an existing file, note that path directly
- **Before saving any files**, tell the user WHY: "I'm copying supporting files to `.claude/local/tmp/` because the Google Drive MCP can only upload files from within the project directory — files in other locations (e.g., ~/Downloads/) can't be uploaded directly. If Google Drive MCP is available, these will be uploaded to a Drive folder after the issue is created. Otherwise, I'll remind you where they are so you can share them manually."

Track all supporting file paths for use in Step 5b and Step 6.

### Step 3: Build the Description

The Jira MCP tool accepts **plain text** and auto-converts it to ADF (Atlassian Document Format). Do NOT use wiki markup (`h3.`, `{code}`, `*bold*`) or Markdown (`###`, triple backticks) — they will render as literal text.

Assemble the description in **plain text** using this template:

```text
DESCRIPTION OF PROBLEM
======================
<description of problem>

VERSION-RELEASE NUMBER
======================
<OCP version, operator version, console build>

HOW REPRODUCIBLE
================
<Always / Sometimes / Rarely / Unable to reproduce>

STEPS TO REPRODUCE
==================
1. <step 1>
2. <step 2>
3. <step 3>

ACTUAL RESULTS
==============
<what actually happens>

EXPECTED RESULTS
================
<what should happen>

ADDITIONAL INFO
===============
<workarounds, related issues, technical context — or "None">

CONFIGURATION
=============
Browser: <browser and version — or "N/A">
Cluster type: <AWS, GCP, bare-metal, ROSA, etc. — or "N/A">
Cluster version: <full version string — or "N/A">
Feature gate status: <relevant feature gates — or "N/A">

SUPPORTING FILES
================
<list any attached files by name — or "None attached">
```

**Formatting rules:**
- Use ALL CAPS with `===` underlines for section headers
- Use numbered lists (`1.`, `2.`, `3.`) for Steps to Reproduce
- Use plain dashes (`-`) for unordered lists
- Do NOT use wiki markup (`h3.`, `{code}`, `*bold*`, `#` for lists) — it renders as literal text
- Do NOT use Markdown (`###`, triple backticks, `**bold**`) — it also renders as literal text
- Do NOT inline large supporting files (stack traces, logs, HAR content) in the description — attach them as files instead (see Step 2b)

**CRITICAL — Newlines:** The description MUST contain actual newline characters, NOT literal `\n` strings. When passing the description to the Jira MCP tool, ensure each section header is on its own line with a blank line before it.

### Step 4: Validate and Confirm

Before creating, verify:
1. Summary is concise and descriptive
2. Description has all required sections filled (non-empty)
3. Affects Version is specified
4. Target Version is specified
5. Severity is specified

Present the issue preview to the user:

```text
─── OCPBUGS Issue Preview ───
Summary:        <summary>
Component:      <component>
Severity:       <severity>
Affects:        <affects version>
Target:         <target version>
Priority:       <priority or "Not set">
Assignee:       <assignee or "Unassigned">

Description:
<full description>
──────────────────────────────
```

Ask: "Create this issue? (yes/no/edit)"
- If "edit", ask what to change and loop back
- If "no", stop
- If "yes", proceed to Step 5

### Step 5: Create the Issue

Use the following **known field IDs and value formats** for the OCPBUGS project. Do NOT run Bash commands, Python scripts, or other workarounds to discover these — they are hardcoded here.

**Issue Type:** Bug (ID: `10016`)

**Field reference with exact value formats:**

| Jira Field | Field ID | Value Format | Example |
|------------|----------|-------------|---------|
| Summary | `summary` | string | `"CBS details page crashes"` |
| Description | `description` | string (plain text, real newlines) | see Step 3 template |
| Components | `components` | `[{"name": "<name>"}]` | `[{"name": "Management Console"}]` |
| Affects Versions | `versions` | `[{"name": "<version>"}]` | `[{"name": "4.22"}]` |
| Severity | `customfield_10840` | `{"value": "<level>"}` | `{"value": "Moderate"}` |
| Target Version | `customfield_10855` | `[{"name": "<version>"}]` | `[{"name": "4.22"}]` |
| Priority | `priority` | `{"name": "<level>"}` | `{"name": "Normal"}` |
| Fix Versions | `fixVersions` | `[{"name": "<version>"}]` | `[{"name": "4.22.0"}]` |

**Severity allowed values:** Critical, Important, Moderate, Low, Informational
**Priority allowed values:** Critical, Major, Normal, Minor, Undefined

**Optional fields (Labels, Assignee, Target Backport Versions):** Field IDs vary by Jira instance. If the user provides any of these, use `mcp__jira__jira_get_create_metadata` with project `OCPBUGS` and `issueTypeId: "10016"` to discover the correct field IDs before creating the issue.

Create the issue using `mcp__jira__jira_create_issue` with `projectKey: "OCPBUGS"` and `issueType: "Bug"`.

If creation fails, use `mcp__jira__jira_get_create_metadata` with project `OCPBUGS` and `issueTypeId: "10016"` to discover the correct format and retry.

### Step 5b: Upload Supporting Files to Google Drive

**Skip this step if no supporting files were collected in Step 2b.**

The OCPBUGS project does not support file attachments via the Jira API or UI. Instead, supporting files are uploaded to Google Drive and a link is added to the issue description. This step requires the Google Drive MCP server — if it is not available, skip to Step 6 and list the files locally instead.

**Why this step exists:** The issue key (e.g., `OCPBUGS-99999`) is only known after creation in Step 5, so the Drive folder must be created after the issue exists. The issue description is then updated once to add the Drive link to the SUPPORTING FILES section.

1. **Copy files with the issue key prefix** — Supporting files were saved to `.claude/local/tmp/` in Step 2b (already within the project directory, so the Google Drive MCP can access them).
   - Create a copy of each file with the issue key prepended using `Bash(cp ...)` (e.g., `ocpbug-stack-trace.txt` → `OCPBUGS-99999-stack-trace.txt`)

2. **Create a Google Drive folder** — Derive a short, lowercase, dash-separated slug from the bug summary (e.g., "CBS details page crashes" → `cbs-details-page-crashes`). Use `mcp__google-docs__drive_files_create` to create a folder named `OCPBUGS-<number>-<short_title>` (e.g., `OCPBUGS-99999-cbs-details-page-crashes`).

3. **Upload each file** — Use `mcp__google-docs__drive_files_create` to upload each file into the folder.

4. **Update the issue description** — Use `mcp__jira__jira_update_issue` to replace the SUPPORTING FILES section of the description with the file list and the Google Drive folder URL. Example:

   ```text
   SUPPORTING FILES
   ================
   - OCPBUGS-99999-stack-trace.txt
   - OCPBUGS-99999-component-trace.txt
   - OCPBUGS-99999-screenshot.png
   Google Drive folder (OCPBUGS-99999-cbs-details-page-crashes): https://drive.google.com/drive/folders/<folder-id>
   ```

   **Note:** The Drive URL will appear as plain text in Jira (not a clickable hyperlink) due to the Jira MCP's plain text to ADF conversion. Users can copy and paste the URL.

5. **Clean up local copies** — After a successful Drive upload, the files in `.claude/local/tmp/` are redundant (the user's originals are untouched, and the files now live in Google Drive). Remove them using `Bash(rm .claude/local/tmp/ocpbug-* .claude/local/tmp/OCPBUGS-*)` and inform the user: "Cleaned up temporary copies from `.claude/local/tmp/` — your original files and the Google Drive uploads are unaffected."

### Step 6: Post-Creation

After successful creation (and optional Drive upload):

1. Display the issue key and full URL (e.g., `OCPBUGS-99999` — https://issues.redhat.com/browse/OCPBUGS-99999)
2. If supporting files were uploaded to Google Drive, display the folder link.
3. If supporting files were collected but **not** uploaded (no Google Drive MCP), remind the user where the files are saved locally so they can share them manually:
   ```text
   Supporting files were not uploaded (Google Drive MCP not available).
   Files saved locally — please share these with the bug assignee:
   - .claude/local/tmp/ocpbug-stack-trace.txt
   - .claude/local/tmp/ocpbug-component-trace.txt
   ```
   Do NOT add filenames to the Jira description's SUPPORTING FILES section unless there is a link to access them. Leave it as "None attached" if Drive upload was skipped.
4. Ask the user if they want to:
   - **Link** this bug to an existing issue (blocks, is caused by, relates to)
   - **Create a branch** named `OCPBUGS-<number>` off main for the fix

## Important Notes

### Safety
- Creates new issues and may update the just-created issue's description to add supporting file links — NEVER modify other existing issues or delete any issues
- NEVER create branches or push without explicit user confirmation
- If an issue with the same summary exists, reference it instead of creating a duplicate

### Jira MCP Fallbacks
- If auth check fails, suggest the user verify their Jira MCP configuration
- If field validation fails, use `mcp__jira__jira_get_create_metadata` to discover required fields

## Example Interaction

User: `/create-bug ClusterBuildStrategy details page crashes with React error after OCP 4.19 to 4.20 upgrade`

The skill would:
1. Search for existing issues matching "ClusterBuildStrategy" + "React error" + "shipwright"
2. Present any matches or proceed if none found
3. Collect remaining required fields (severity, affects version, steps, etc.)
4. Build the structured Jira description
5. Preview and confirm with the user
6. Create the OCPBUGS issue via MCP
7. Upload any supporting files to a Google Drive folder named `OCPBUGS-<number>-<short_title>` (e.g., `OCPBUGS-84214-cbs-details-page-crashes`)
8. Update the issue description with the Drive folder link
9. Report the issue key, Drive link, and offer branch creation
