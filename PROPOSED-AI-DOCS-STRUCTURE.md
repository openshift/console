# Proposed Directory Structure for AI Context & Configuration

**Purpose**: Establish modular AI documentation and Claude Code configuration
**Date**: 2025-11-22
**Status**: Awaiting team approval

---

## Summary of Changes

### What's Being Added
- ✅ **AGENTS.md** - Central AI documentation hub
- ✅ **.ai/README.md** - Explains .ai/ directory
- ✅ **.ai/CODING_STANDARDS.md** - P0/P1 review patterns + conventions
- ✅ **.ai/ARCHITECTURE-PATTERNS.md** - Plugin SDK, monorepo structure
- ✅ **.ai/TECHNOLOGY-STACK-AND-USAGE.md** - Tech stack details
- ✅ **.ai/UNIT-TESTING.md** - Testing patterns and strategies
- ✅ **.claude/settings.json** - Team Claude Code configuration

### What's Being Updated
- 🔄 **CLAUDE.md** - Update to reference AGENTS.md
- 🔄 **.gitignore** - Ensure .claude/local/ is gitignored

### What's Being Removed
- ❌ **.ai/context.md** - Content merged into new modular files

---

## Current Structure

```
console/
├── CLAUDE.md                          # Claude Code entry, references .ai/context.md
├── .ai/
│   ├── context.md                     # Single monolithic file (will be deleted)
│   └── README.md
├── .claude/
│   ├── settings.local.json            # Personal config (gitignored)
│   ├── commands/
│   │   ├── init.md
│   │   └── plugin-api-review.md
│   └── local/                         # Personal files (gitignored)
│       ├── preferences.md
│       ├── rules/
│       ├── commands/
│       └── docs/
├── README.md
├── CONTRIBUTING.md
├── STYLEGUIDE.md
└── INTERNATIONALIZATION.md
```

**Issues with Current Structure**:
- ❌ No team `.claude/settings.json` (causes "create settings.json" suggestions)
- ❌ Monolithic `.ai/context.md` (hard to maintain, update specific sections)
- ❌ No central AI documentation hub
- ❌ Mixed concerns in single file

---

## Proposed Structure

```
console/
├── AGENTS.md                           # ✅ NEW - Central AI hub (6-8KB)
├── CLAUDE.md                           # 🔄 UPDATED - Points to AGENTS.md
├── .ai/                                # Team AI context (AI-agnostic)
│   ├── README.md                       # ✅ NEW - Explains .ai/ directory (1-2KB)
│   ├── CODING_STANDARDS.md             # ✅ NEW - P0/P1 patterns + conventions (8-10KB)
│   ├── ARCHITECTURE-PATTERNS.md        # ✅ NEW - Plugin SDK, monorepo (6-8KB)
│   ├── TECHNOLOGY-STACK-AND-USAGE.md  # ✅ NEW - Tech stack (4-5KB)
│   └── UNIT-TESTING.md                # ✅ NEW - Testing patterns (5-6KB)
│       └── [context.md deleted]        # ❌ REMOVED - Content merged above
├── .claude/                            # Claude Code configuration
│   ├── settings.json                  # ✅ NEW - Team config (checked in)
│   ├── settings.local.json            # ✔️ EXISTS - Personal config (gitignored)
│   ├── commands/                      # ✔️ EXISTS - Shared slash commands
│   │   ├── init.md
│   │   └── plugin-api-review.md
│   └── local/                         # ✔️ EXISTS - Personal files (gitignored)
│       ├── preferences.md
│       ├── rules/
│       ├── commands/
│       └── docs/
├── README.md                           # ✔️ UNCHANGED
├── CONTRIBUTING.md                     # ✔️ UNCHANGED
├── STYLEGUIDE.md                       # ✔️ UNCHANGED
├── INTERNATIONALIZATION.md             # ✔️ UNCHANGED
└── .gitignore                          # 🔄 UPDATED - Ensure .claude/local/ excluded

Legend:
  ✅ NEW - File to be created
  🔄 UPDATED - File to be modified
  ❌ REMOVED - File to be deleted
  ✔️ UNCHANGED - File stays as-is
```

---

## File Purposes & Sizes

### Root Level

| File | Purpose | Size | Audience |
|------|---------|------|----------|
| **AGENTS.md** | Central AI documentation hub, quick start | 6-8KB | All AI tools |
| **CLAUDE.md** | Claude Code entry point → AGENTS.md | Updated | Claude Code |

### .ai/ Directory (Team AI Context)

| File | Purpose | Size | Checked In |
|------|---------|------|------------|
| **README.md** | Explains .ai/ organization | 1-2KB | ✅ Yes |
| **CODING_STANDARDS.md** | P0/P1 review patterns, conventions | 8-10KB | ✅ Yes |
| **ARCHITECTURE-PATTERNS.md** | Plugin SDK, monorepo structure | 6-8KB | ✅ Yes |
| **TECHNOLOGY-STACK-AND-USAGE.md** | Tech stack, versions | 4-5KB | ✅ Yes |
| **UNIT-TESTING.md** | Testing patterns | 5-6KB | ✅ Yes |

**Total .ai/ documentation**: ~30-40KB (vs current 5KB context.md)

### .claude/ Directory (Claude Code Configuration)

| File | Purpose | Checked In |
|------|---------|------------|
| **settings.json** | Team permissions, hooks | ✅ Yes |
| **settings.local.json** | Personal overrides | ❌ No (gitignored) |
| **commands/** | Shared slash commands | ✅ Yes |
| **local/** | Personal files | ❌ No (gitignored) |

---

## How It Works

### Session Loading Order

When Claude Code starts a session:

1. **CLAUDE.md** → Points to AGENTS.md
2. **settings.json hook** → Loads AGENTS.md
3. **settings.json hook** → Loads all .ai/ files
4. **settings.local.json hook** → Loads personal workflow (if configured)

### Team vs Personal Separation

**Team Configuration** (checked into git, affects everyone):
- `.claude/settings.json` - Team permissions and hooks
- `.ai/` directory - All team guidelines and rules
- `.claude/commands/` - Shared slash commands
- `AGENTS.md` - Central documentation hub

**Personal Configuration** (gitignored, individual developers):
- `.claude/settings.local.json` - Personal overrides and hooks
- `.claude/local/` - Personal rules, preferences, analysis files

### AI Tool Compatibility

**Works With**:
- ✅ Claude Code (via settings.json hooks)
- ✅ CodeRabbit (via .coderabbit.yaml references)
- ✅ Cursor/Copilot (via .cursorrules or similar)
- ✅ Any AI tool (can read .ai/ files directly)

---

## Benefits

### For Developers
✅ **Clear separation**: Team standards vs personal workflow
✅ **No conflicts**: Personal settings don't affect teammates
✅ **No suggestions**: Claude stops suggesting "create settings.json"
✅ **Better onboarding**: AGENTS.md provides quick start

### For Maintainers
✅ **Modular updates**: Update only relevant files when things change
✅ **Scalable**: Easy to add new guideline files (ACCESSIBILITY.md, etc.)
✅ **Version control**: Track changes to specific guidelines
✅ **AI-agnostic**: Works with all AI tools, not just Claude

### For PR Reviews
✅ **Data-driven**: Based on analysis of 3000 merged PRs
✅ **Actionable**: P0/P1 patterns with code examples
✅ **Fewer review cycles**: AI agents follow established patterns
✅ **Consistent quality**: Standards applied automatically

---

## What Gets Checked Into Git

**Checked In** (team files):
```
✅ AGENTS.md
✅ CLAUDE.md (updated)
✅ .ai/README.md
✅ .ai/CODING_STANDARDS.md
✅ .ai/ARCHITECTURE-PATTERNS.md
✅ .ai/TECHNOLOGY-STACK-AND-USAGE.md
✅ .ai/UNIT-TESTING.md
✅ .claude/settings.json
✅ .claude/commands/**
✅ .gitignore (updated)
```

**Gitignored** (personal files):
```
❌ .claude/settings.local.json
❌ .claude/local/**
```

**Deleted**:
```
❌ .ai/context.md (content merged into new files)
```

---

## Impact Assessment

### Who is affected?
- **All developers**: Will benefit from AI documentation
- **Claude Code users**: Will benefit from settings.json configuration
- **Cursor/Copilot users**: Can reference .ai/ files
- **PR reviewers**: AI agents will follow established patterns

### Breaking Changes?
- ❌ **No breaking changes**
- ✅ All existing files remain (except context.md merged)
- ✅ Personal configurations (.claude/local/) unaffected
- ✅ Backward compatible

### Migration Required?
- ❌ **No migration needed**
- ✅ .ai/context.md content merged into new files
- ✅ Existing workflows continue working
- ✅ Claude Code benefits immediately from settings.json

---

## Implementation Timeline

### Phase 0: Configuration (Day 1)
- Create `.claude/settings.json`
- Update `.gitignore`
- Create `.ai/README.md`
- Update `CLAUDE.md`

### Phases 1-5: Documentation (Days 2-4)
- Create `AGENTS.md`
- Create `.ai/CODING_STANDARDS.md`
- Create `.ai/ARCHITECTURE-PATTERNS.md`
- Create `.ai/TECHNOLOGY-STACK-AND-USAGE.md`
- Create `.ai/UNIT-TESTING.md`

### Phase 6-7: Cleanup & Validation (Day 5)
- Delete `.ai/context.md`
- Validate all cross-references
- Test with Claude Code session restart

**Total**: ~5 days implementation time

---

## Questions for Team Review

1. **Approve directory structure?** ✅ / ❌
2. **Approve checking in `.claude/settings.json`?** ✅ / ❌
3. **Approve deleting `.ai/context.md`?** ✅ / ❌
4. **Any additional files needed?** _____________
5. **Any concerns with gitignore strategy?** _____________
6. **Preferred implementation timeline?** _____________

---

## Sample: .claude/settings.json (Team Configuration)

This is what will be checked into git:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "comment": "Load central AI guide",
            "command": "cat AGENTS.md"
          },
          {
            "type": "command",
            "comment": "Load all team guidelines from .ai/",
            "command": "find .ai -type f -name '*.md' -exec cat {} +"
          }
        ]
      }
    ]
  },
  "permissions": {
    "allow": [
      "Read(//AGENTS.md)",
      "Read(//CLAUDE.md)",
      "Read(//.ai/**)",
      "Read(//STYLEGUIDE.md)",
      "Read(//INTERNATIONALIZATION.md)",
      "Read(//CONTRIBUTING.md)",
      "Read(//.claude/commands/**)",
      "Bash(yarn test:*)",
      "Bash(yarn build)",
      "Bash(yarn lint)",
      "Bash(yarn i18n)",
      "Bash(./build-backend.sh)",
      "Bash(./test-backend.sh)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "SlashCommand(/init)",
      "SlashCommand(/plugin-api-review)"
    ]
  }
}
```

**Why These Permissions?**
- Common Console development operations
- Safe read operations
- Standard build/test commands
- No destructive operations without asking

**Personal Permissions?**
- Developers can add more in `.claude/settings.local.json` (gitignored)
- Personal settings extend (not override) team settings

---

## Next Steps

1. **Team reviews this proposal** 👈 We are here
2. Team provides feedback/approval
3. Address any concerns
4. Implement approved structure
5. Test with Claude Code
6. Announce to team
7. Monitor effectiveness

---

**End of Proposal**
