---
name: skill-audit
description: Audit all Claude Code skills for stale references, broken paths, and deprecated tool names
argument-hint: "[skill-name] (optional - audits all skills if omitted)"
---

# /skill-audit

Audit `.claude/skills/` for drift: broken file paths, missing scripts, and deprecated tool names.

## Instructions

### Step 1: Discover Skill Files

Find all markdown files under `.claude/skills/`:
- All `SKILL.md` files
- Companion files: `DOSSIER-TEMPLATE.md`, `REPORT-TEMPLATE.md`, and any other `.md` files

If `$ARGUMENTS` names a specific skill (e.g., `test`), only audit `.claude/skills/$ARGUMENTS/`.

### Step 2: Extract and Verify File Path References

For each skill file, find references to files/directories. Look for:
- Backtick-quoted paths containing `/` or ending in known extensions (`.md`, `.sh`, `.ts`, `.tsx`, `.json`, `.js`, `.yaml`, `.yml`)
- Bare references to known doc files: `AGENTS.md`, `CLAUDE.md`, `STYLEGUIDE.md`, `TESTING.md`, `INTERNATIONALIZATION.md`

For each path found:
1. Resolve relative to the repo root
2. If not found, try resolving relative to `frontend/`
3. Check if the file exists on disk
4. Record any missing paths with the skill name, file, and line number

**Skip**:
- URLs (http/https)
- Glob patterns containing `*`
- Generic placeholder paths (e.g., `path/to/Component.tsx`, `test-file.spec.tsx`, `<file>`, `src/feature.tsx`)
- Paths inside template variables (e.g., `$ARGUMENTS`, `<package>`)

### Step 3: Verify `@console/*` Import Paths

Skills contain example import statements that reference real packages. Extract all `@console/*` import paths from `import` statements.

For each path:
1. `@console/internal` → verify the subpath exists under `frontend/public/` (e.g., `@console/internal/module/k8s` → `frontend/public/module/k8s`)
2. `@console/shared` → verify the subpath exists under `frontend/packages/console-shared/` (e.g., `@console/shared/src/test-utils/unit-test-utils` → `frontend/packages/console-shared/src/test-utils/unit-test-utils`)
3. `@console/dynamic-plugin-sdk` → verify under `frontend/packages/console-dynamic-plugin-sdk/`
4. Other `@console/*` packages → verify a matching package exists in `frontend/packages/`

Report any import paths that don't resolve to real files.

**Note on `@console/internal`**: Some subpaths resolve through bundler import aliases rather than direct filesystem paths. If a path under `@console/internal` does not resolve directly under `frontend/public/`, also check `frontend/public/module/` and `frontend/public/components/` as common alias targets. When a path cannot be verified through either method, report it as a **warning** rather than an error — it may be alias-resolved at build time.

**Skip**: Relative imports (`../`, `./`) — these are example-specific and not verifiable without context.

### Step 3a: Verify PatternFly Import Paths

Skills may reference PatternFly components in example code. Extract all `@patternfly/*` import paths.

For each path:
1. Check whether the import uses a `/deprecated` subpath (e.g., `@patternfly/react-core/deprecated`) — report as a **warning** since these are slated for removal in future PF versions
2. Verify the package exists in `frontend/node_modules/@patternfly/` (or check `frontend/package.json` dependencies)
3. For specific component imports (e.g., `@patternfly/react-core/dist/esm/components/Button`), verify the path resolves

**Skip**: Generic PatternFly references in prose (e.g., "use PatternFly components") — only validate actual import statements.

### Step 3b: Verify `$codeRef` and Exposed Module References

Skills may contain examples of `console-extensions.json` entries with `$codeRef` values, or reference exposed module patterns. For each `$codeRef` found:

1. Parse the format `moduleName.exportName` (e.g., `exampleFlag.handler`)
2. If the skill references a specific plugin, check that plugin's `package.json` for a matching exposed module name under `consolePlugin.exposedModules`
3. If a file path is associated with the exposed module, verify the file exists and exports the referenced name

Report unresolvable `$codeRef` examples as **info** — they may be intentionally generic illustrations rather than references to real code.

### Step 4: Verify yarn/npm Script References

Extract all `yarn <script>` and `npm run <script>` references from each skill file.

Compare each script name against the `scripts` object in `frontend/package.json`. Report any that do not exist.

**Skip**: yarn built-in commands (`install`, `add`, `up`, `npm info`, `why`, `--version`).

### Step 5: Verify Shell Script References

Extract references matching `./something.sh` patterns. Verify each `.sh` file exists at the repo root. Report missing scripts with skill name and line number.

### Step 6: Verify Claude Code Tool Name References

Skills may reference Claude Code tools by name (e.g., in instructions like "use the Read tool" or "call Grep"). Extract all words that appear to be tool references — look for capitalized names matching the pattern of Claude Code tool names, especially when preceded by words like "use", "call", "run", "the … tool", or appearing in backtick-quoted form.

**Canonical tool names — self-maintaining approach:**

Do NOT rely on a hardcoded list. Instead, introspect the tools available in the current session (they are listed in the system prompt as function definitions). Build the canonical set from those names at runtime. This ensures the audit stays current as Claude Code adds, renames, or removes tools.

As a fallback for known renames, maintain only the **deprecated names** table:

| Deprecated Name | Current Replacement |
|---|---|
| `TodoWrite` | `TaskCreate` |
| `TodoRead` | `TaskGet` / `TaskList` |
| `TodoUpdate` | `TaskUpdate` |

For each tool name found in a skill file:
1. If it matches a deprecated name, report with the replacement
2. If it looks like a tool reference (capitalized, backtick-quoted, or in a tool-context phrase) but does NOT match any tool available in the current session or any deprecated name, report it as an **unrecognized tool name** — it may be a typo or a tool that was renamed/removed

**Skip**:
- Tool names inside example code blocks that are clearly application code (not Claude Code instructions)
- MCP tool names (prefixed with `mcp__`)

### Step 7: Verify Hook Command Path References

`.claude/settings.json` and `.claude/settings.local.json` may contain hook definitions with shell commands that reference file paths (e.g., `cat .claude/skills/...`, `bash .claude/scripts/...`).

For each hook command:
1. Extract file paths from the command string (look for paths starting with `.claude/`, `frontend/`, `./`, or other repo-relative prefixes)
2. Verify each referenced path exists on disk
3. Report missing paths with the hook name and the full command for context

**Skip**: Commands that don't reference local file paths (e.g., `echo`, `date`, inline scripts with no file references).

### Step 8: Cross-Reference Skill Names in Project Config

Skills are referenced by name in `CLAUDE.md`, `AGENTS.md` (if present), `STYLEGUIDE.md`, `TESTING.md`, and `.claude/settings.json` / `.claude/settings.local.json`. Verify that every skill name mentioned in those files actually exists as a directory under `.claude/skills/`.

**How to find skill references:**
1. Scan each config file for patterns like:
   - Backtick-quoted names followed by "skill" (e.g., `` `gen-rtl-test` skill ``)
   - `/skill-name` slash-command invocations (e.g., `/plugin-api-review`)
   - Skill names in settings.json hook commands or descriptions
2. Build the list of actual skill directories: `ls .claude/skills/`
3. For each referenced skill name, check if a matching directory exists under `.claude/skills/`
4. Report any skill names that are referenced but have no corresponding skill directory

**Also check the reverse direction:**
1. For each skill directory under `.claude/skills/`, check whether it is referenced in any of the config files listed above
2. Report any skills that exist on disk but are never referenced anywhere — these may be orphaned or undiscoverable

**Skip**:
- Skill names that appear only inside their own SKILL.md (self-references)
- Generic words that happen to match skill names (use context to distinguish)

### Step 9: Report Findings

Output a summary grouped by skill, using **severity levels** to help prioritize fixes:

| Severity | Meaning | Examples |
|---|---|---|
| **ERROR** | Broken reference that will cause the skill to malfunction or give wrong guidance | Deprecated tool name in executable instructions, missing file that the skill tells Claude to read, invalid script reference |
| **WARN** | Likely stale but not immediately breaking | `/deprecated` PatternFly import, `@console/internal` path that may be alias-resolved, orphaned skill not referenced in config |
| **INFO** | Worth noting but low priority | Unresolvable `$codeRef` in a generic example, self-referencing skill name |

```markdown
## Skill Audit Report

### skill-name (SKILL.md)
- [PASS] File path references: all 5 verified
- [ERROR] Missing file: `path/to/missing.md` (line 42)
- [PASS] Script references: all 3 verified
- [ERROR] Deprecated tool: `TodoWrite` -> use `TaskCreate` (line 7)
- [WARN] PatternFly deprecated import: `@patternfly/react-core/deprecated` (line 23)
- [PASS] Tool name references: all verified

### another-skill (SKILL.md, DOSSIER-TEMPLATE.md)
- [PASS] All checks passed

### Hook Commands (.claude/settings.json)
- [ERROR] Hook `pre-submit`: path `.claude/scripts/validate.sh` not found
- [PASS] Hook `post-submit`: all paths verified

### Cross-Reference: Config → Skills
- [PASS] `gen-rtl-test` referenced in CLAUDE.md line 11 → exists
- [ERROR] `old-skill` referenced in STYLEGUIDE.md line 85 → missing from .claude/skills/

### Cross-Reference: Skills → Config
- [WARN] `microcopy-review` exists but is not referenced in any config file

---
Summary: N skills audited | N errors, N warnings, N info | N skills clean
```

## Important Notes

- This skill is **read-only** — it never modifies any files
- Focus on verifiable facts (file exists, script exists, tool name matched) — do not review prose quality
- When a path is ambiguous, try both repo root and `frontend/` directory
- Use the severity levels consistently: ERROR for things that will mislead Claude or break skill execution, WARN for staleness that degrades quality, INFO for observations worth noting
