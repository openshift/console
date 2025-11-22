# Proposed Directory Structure for AI Context & Configuration

**Purpose**: Establish modular AI documentation and Claude Code configuration
**Date**: 2025-11-25
**Status**: Awaiting team approval

---

## Summary of Changes

### What's Being Added
- ✅ **AGENTS.md** - Central AI documentation hub
- ✅ **.ai/README.md** - Explains .ai/ directory
- ✅ **.ai/ARCHITECTURE.md** - System architecture, Plugin SDK, tech stack
- ✅ **.ai/CONVENTIONS.md** - Coding standards, patterns, file naming
- ✅ **.ai/TESTING.md** - All testing (unit, integration, E2E)
- ✅ **.claude/settings.json** - Team Claude Code configuration

### What's Being Updated
- 🔄 **CLAUDE.md** - Update to reference AGENTS.md
- 🔄 **.cursor/context.md** - Update to reference AGENTS.md

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
│   └── commands/                      # Team commands
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
├── AGENTS.md                           # ✅ NEW - Central AI hub
├── CLAUDE.md                           # 🔄 UPDATED - Points to AGENTS.md
├── .ai/                                # Team AI context (AI-agnostic)
│   ├──[context.md deleted]            # ❌ REMOVED - Content merged above
│   ├── README.md                       # ✅ NEW - Explains .ai/ structure
│   ├── ARCHITECTURE.md                 # ✅ NEW - System arch, Plugin SDK, tech stack
│   ├── CONVENTIONS.md                  # ✅ NEW - Coding standards, patterns, etc.
│   └── TESTING.md                      # ✅ NEW - All testing approaches
├── .claude/                            # Claude Code configuration
│   ├── settings.json                   # ✅ NEW - Team config (checked in)
│   └── commands/                       # Team commands
├── .cursor/                            # ✔️ EXISTS - Cursor-specific configs
│   └── context.md                      # 🔄 UPDATED - Points to AGENTS.md
├── README.md                           # ✔️ UNCHANGED
├── CONTRIBUTING.md                     # ✔️ UNCHANGED
├── STYLEGUIDE.md                       # ✔️ UNCHANGED
├── INTERNATIONALIZATION.md             # ✔️ UNCHANGED
└── coderabbitai.json                   # ✅ NEW - references .ai/ structure
 

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
| **ARCHITECTURE.md** | System architecture, Plugin SDK, tech stack, monorepo | 10-12KB | ✅ Yes |
| **CONVENTIONS.md** | Coding standards, P0/P1 patterns, file naming | 10-12KB | ✅ Yes |
| **TESTING.md** | Unit, integration, E2E testing patterns | 6-8KB | ✅ Yes |

**Total .ai/ documentation**: ~30-35KB (vs current 5KB context.md)

### .claude/ Directory (Claude Code Configuration)

| File | Purpose | Checked In |
|------|---------|------------|
| **settings.json** | Team permissions, hooks | ✅ Yes |
| **commands/** | Shared slash commands | ✅ Yes |

---

## Content Distribution

### .ai/ARCHITECTURE.md
**Contains:**
- Monorepo package structure (frontend/, pkg/, cmd/)
- Technology stack overview:
  - Frontend: React, TypeScript, yarn workspaces, Webpack Module Federation
  - Backend: Go, klog, Kubernetes client libraries
  - Deployment: OpenShift/Kubernetes
  - Build tools: yarn, Go toolchain
- Console Dynamic Plugin SDK architecture
  - Extension points system (25+ types)
  - Module Federation runtime loading
  - Type system and code references
  - Public API surface (re-exports from @console/shared, @console/internal, etc.)
- Plugin structure patterns
- Key architectural decisions
- Package relationships and dependencies

### .ai/CONVENTIONS.md
**Contains:**
- TypeScript/React conventions
  - Functional components and hooks
  - State management patterns (Context API, migrating from Redux)
  - Component structure and file organization
- Framework usage patterns:
  - PatternFly design system usage
  - React hooks best practices (useK8sWatchResource, etc.)
  - i18n with useTranslation hook
- Go best practices
  - Package organization patterns
  - Error handling standards
  - Logging conventions (klog)
  - HTTP handler patterns
- File naming conventions (PascalCase, kebab-case rules)
- API call patterns (consoleFetchJSON, k8s resource hooks)
- Styling conventions (SCSS modules, PatternFly integration)
- Error handling patterns
- P0/P1 review patterns

### .ai/TESTING.md
**Contains:**
- Unit testing patterns (Jest)
- Integration testing approaches
- E2E testing (Cypress)
- Test organization and structure
- Coverage expectations
- Testing best practices

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

**Personal Configuration** (gitignored, individual developers, not checked in):
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

---

## What Gets Checked Into Git

**Checked In** (team files):
```
✅ AGENTS.md
✅ CLAUDE.md (updated)
✅ .cursor/context.md (updated)
✅ .ai/README.md
✅ .ai/ARCHITECTURE.md
✅ .ai/CONVENTIONS.md
✅ .ai/TESTING.md
✅ .claude/settings.json
✅ .claude/commands/**
✅ .gitignore (updated)
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
- Create `.ai/ARCHITECTURE.md` (system arch + tech stack)
- Create `.ai/CONVENTIONS.md` (standards + patterns)
- Create `.ai/TESTING.md` (all testing types)

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
            "comment": "Load all team guidelines (3 .ai/ files)",
            "command": "find .ai -type f -name '*.md' -not -name 'README.md' -exec cat {} +"
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
