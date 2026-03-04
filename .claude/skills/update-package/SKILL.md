---
name: update-package
description: Expert package update assistant for OpenShift Console. Update packages safely with automated testing, building, and fixing.
argument-hint: "[package-name]"
---

# /update-package

## Mission
Update the specified package to its reasonably latest stable version or to the version specified by the user, ensuring builds and tests pass through automated fixing of breaking changes.

## Process

### Phase 1: Analysis & Update
1. **Identify**: Read `package.json` for current version (dependencies/devDependencies/resolutions)
2. **Research**: Use `yarn npm info <package> --json | jq -r '.["dist-tags"].latest'` to find latest version; compare with current version; determine if update is needed
3. **Interactive Gather**: Ask user:
   - "Do you have a migration guide URL for this update?" (optional)
   - "Do you have a changelog/release notes URL?" (optional)
   - "Any specific breaking changes you're aware of?" (optional)
   - If provided, fetch and analyze these resources using WebFetch
4. **Update**: Modify `package.json` and resolutions; run `yarn install`; report peer dependency warnings

### Phase 2: Build
5. **Build**: Run `yarn build`; capture all errors with file paths and line numbers
6. **Analyze**: On success → Phase 3. On failure → categorize errors (TypeScript/import/API) → Phase 4

### Phase 3: Test
7. **Test**: Run `yarn test`; capture failures, deprecations, stack traces
8. **Analyze**: On success → Phase 5. On failure → identify API changes → Phase 4

### Phase 4: Auto-Fix
9. **Fix Build Errors**:
   - For each error, read file and identify issue (import/type/API change)
   - Use migration guide/changelog (if provided) to inform fixes
   - Apply fixes: update imports, types, method calls
   - If stuck, ask user: "I'm seeing error X in file Y. The migration guide doesn't cover this. Do you know the fix or have additional documentation?"
10. **Fix Tests**: Read test files, update expectations/mocks for API changes
11. **Verify**: Re-run build → tests. If new errors appear, repeat the full fix cycle (Phase 4 → verify). Max 3 complete cycles of fixing all errors → build → test (then ask user for guidance)

### Phase 5: Complete
12. **Final Check**: Run `yarn build` and `yarn test` - verify both pass
13. **Report**:
    - Package: `<package>` `<old>` → `<new>`
    - Files modified, errors fixed, breaking changes
    - Build ✓ | Tests ✓
14. **Commit**:
    ```git
    Update <package> from <old> to <new>

    - Updated package.json and yarn.lock
    - Fixed <N> build errors
    - Fixed <N> test failures
    - Breaking changes: <summary>
    ```
    - 🤖 Generated with [Claude Code](https://claude.com/claude-code)
    - Co-Authored-By: Claude <noreply@anthropic.com>

## Guidelines

**Code Standards**:
- For coding patterns and project structure: Read `STYLEGUIDE.md`, `AGENTS.md`, and other relevant documentation
- Follow existing code patterns found in the codebase

**Package Update Rules**:
- Only update specified package; no unrelated changes
- Don't modify config files (.gitignore, eslintrc, tsconfig) unless required
- Never skip/suppress errors - address or document all
- All tests must pass; only change expectations if package behavior legitimately changed
- **Interactive approach**: Ask user for migration docs, changelogs, or specific fixes when needed
- Use WebFetch to analyze provided documentation URLs
- Provide progress updates during long operations (build: 2-5min, tests: 1-3min)
- Use TodoWrite to track phases (TodoWrite is a Claude Code tool for tracking workflow phases with states: pending, in_progress, completed)

**Special Cases**:
- **PatternFly**: May need coordinated @patternfly/* updates; check peer deps
- **TypeScript**: Update @types/* alongside runtime packages
- **Workspace**: Changes affect `packages/*`; build from frontend directory

## Success Criteria
✓ Package updated in package.json + yarn.lock
✓ `yarn build` passes
✓ `yarn test` passes
✓ Breaking changes fixed
✓ Committed with descriptive message

## Failure After 3 Iterations
1. Document issues with file paths and errors
2. Provide manual fix recommendations
3. List breaking changes needing review
4. Suggest rollback if critical

## Example: Interactive Flow
```text
User: /update-package @patternfly/react-core
Assistant: Current version: 6.2.2, Latest: 6.3.0

Before I proceed, do you have:
1. Migration guide URL? (optional)
2. Changelog/release notes URL? (optional)
3. Known breaking changes? (optional)

User: Yes, https://github.com/patternfly/patternfly-react/releases/tag/v6.3.0

Assistant: [Fetches and analyzes release notes]
Found breaking changes:
- hideTitle prop → isHeaderHidden
- NavList moved to @patternfly/react-core/deprecated

Proceeding with update...
[Updates package, builds, fixes errors using migration info, tests, commits]
```
