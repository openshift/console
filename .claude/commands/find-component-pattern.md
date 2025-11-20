---
description: Find all usage patterns of a specified component across the OpenShift Console codebase and identify inconsistencies
argument-hint: [component-name] [--show-recommendations] [--scope=SCOPE]
---

# Find Component Usage Pattern

Find all usage patterns of a specified component across the OpenShift Console codebase to identify inconsistencies, detect potential bugs, and recommend standardization.

## Usage

```
/find-component-pattern [component-name] [--show-recommendations] [--scope=SCOPE]
```

## Arguments

- `--show-recommendations` - Include recommendations section in the output. By default, recommendations are not shown.
- `--scope=SCOPE` - Limit search to specific directory scope. By default, searches all frontend code.
  - `all` - Search entire frontend (default)
  - `core` - Only core components (`frontend/public/components/`)
  - `package:NAME` - Specific package (e.g., `--scope=package:dev-console`)

## Important: Concise Interactions

- Keep all user-facing prompts concise and direct
- Do not explain argument parsing or defaults unless there's an error
- Only provide explanatory text when the user needs to make a decision or understand an error

## Prompts

**Check `$ARGUMENTS` for component name and scope:**

### Scenario 1: Component name provided in `$ARGUMENTS`

**If the first argument (non-flag) is a component name:**
- Extract the component name from `$ARGUMENTS`
- Skip the component prompt entirely
- Proceed directly to Phase 1 with the provided component name

**Example:** `/find-component-pattern ResourceLink --scope=core`
- Component name: `ResourceLink` (no prompt needed)
- Scope: `core` (from flag)

### Scenario 2: Component name NOT provided, but `--scope` IS provided

**If `$ARGUMENTS` contains `--scope=` but no component name:**
- Display simplified prompt without scope usage instructions:

```
Which component would you like me to analyze?
```

- **Do NOT** show scope options (user already specified scope)
- Wait for user to enter component name
- Then proceed to Phase 1

**Example:** `/find-component-pattern --scope=package:dev-console`
- Prompt: "Which component would you like me to analyze?"
- User enters: "ResourceLink"

### Scenario 3: Neither component name nor scope provided

**If `$ARGUMENTS` is empty or contains only `--show-recommendations`:**
- Display full prompt with scope options:

```
Which component would you like me to analyze?

Use --scope=SCOPE to limit scope (optional):
- all - Search entire frontend (default)
- core - Only core components (frontend/public/components/)
- package:NAME - Specific package (e.g., package:dev-console)
```

- Wait for user to enter component name
- Then proceed to Phase 1

**Example:** `/find-component-pattern`
- Show full prompt with scope options
- User enters: "ResourceLink"

---

**Important:**
- **Do NOT** use AskUserQuestion tool with pre-filled component options
- Ask the user to type the component name as free-form text
- Component name examples: "ResourceLink", "Button", "StatusBox"

**Note:**
- Check if `$ARGUMENTS` contains a component name as the first non-flag argument
- Check if `$ARGUMENTS` contains `--show-recommendations` to determine whether to include the recommendations section in Phase 3
- Check if `$ARGUMENTS` contains `--scope=` to determine the search scope. If not present, default to searching all frontend code

Then proceed with the phased analysis below.

---

## Search Scope

The `--scope` argument determines which directories to search:

### Scope: `all` (default)
**Included Locations:**
- `frontend/public/components/` - Core components
- `frontend/packages/*/src/` - Plugin components and sources
- `frontend/packages/*/components/` - Plugin-specific components
- Both `.tsx` and `.jsx` files

### Scope: `core`
**Included Locations:**
- `frontend/public/components/` - Core components only
- Both `.tsx` and `.jsx` files

### Scope: `package:NAME`
**Included Locations:**
- `frontend/packages/NAME/` - Specific package directory
- Both `.tsx` and `.jsx` files

### All Scopes - Excluded Locations:
- `node_modules/` - External dependencies
- `*.spec.tsx`, `*.spec.jsx`, `*.test.tsx`, `*.test.jsx` - Test files
- `*.d.ts` - Type definition files
- `dist/`, `build/`, `.cache/` - Build artifacts

---

## Phase 1: Discovery & Component Definition

### 1.1 Locate Component Source

1. **Find the component's definition file:**
   - Use `Glob` to search for the component file:
     - Pattern: `**/{ComponentName}.tsx`
     - Pattern: `**/{ComponentName}.jsx`
   - Check common locations first (core components, shared utilities)
   - Apply scope filter based on `--scope` argument in `$ARGUMENTS`:
     - If `--scope=core`, search only `frontend/public/components/`
     - If `--scope=package:NAME`, search only `frontend/packages/NAME/`
     - If `--scope=all` or no scope specified, search all included locations

2. **Read component source:**
   - Identify the component's TypeScript interface or PropTypes
   - Note all props (required vs optional)
   - Document default prop values
   - Identify any deprecated patterns or props
   - Note component export type (default vs named)

### 1.2 Search for All Usages

1. **Find import statements:**
   - Use `Grep` with pattern: `import.*{ComponentName}`
   - Use `Grep` with pattern: `import {ComponentName}` (named import)
   - Output mode: `content` with line numbers (`-n: true`)
   - **Apply scope filter:** Restrict search path based on `--scope` argument in `$ARGUMENTS`

2. **Find JSX usages:**
   - Use `Grep` with pattern: `<{ComponentName}[^>]*>`
   - This catches opening tags with any props/attributes
   - Output mode: `files_with_matches` first (get count)
   - Then use `content` mode with line numbers for detailed analysis
   - **Apply scope filter:** Restrict search path based on `--scope` argument in `$ARGUMENTS`

3. **Document findings:**
   - Total files found
   - File paths and line numbers
   - Note if component is aliased or re-exported anywhere
   - Note the search scope used for this analysis

---

## Phase 2: Pattern Analysis & Categorization

For each file containing component usages:

### 2.1 Extract Usage Context

1. **Read each file** found in Phase 1
2. **For each component usage, extract:**
   - Full JSX element (opening tag through closing tag or self-closing)
   - Props passed (name, value, type)
   - Children content (if any)
   - Wrapper components (immediate parent components)
   - Usage context (what page/feature is this in?)
   - Surrounding code (5-10 lines for context)

### 2.2 Identify Patterns

1. **Group usages by similarity:**
   - Props signature (same props passed in same order)
   - Prop values (literal vs variable, common values)
   - Wrapper patterns (common parent components)
   - Usage context (list views, detail pages, forms, etc.)

2. **For each pattern, document:**
   - Pattern description (what makes this a pattern?)
   - Number of occurrences
   - File locations
   - Example code snippet
   - Common characteristics
   - Context where pattern appears

3. **Analyze against component interface:**
   - Are required props always provided?
   - How consistently are optional props used?
   - Do type mismatches occur?
   - Are deprecated props being used?


### 2.3 Identify Outliers

**An outlier is a usage that:**
- Missing required props (potential bug!)
- Uses props differently than 80%+ of other usages
- Has unusual wrapper patterns
- Uses deprecated props or patterns
- Has type mismatches with component interface

For each outlier, note:
- File path and line number
- What makes it different
- Potential impact (bugs, inconsistent UX, maintenance issues)
- Specific recommendation for fixing

---

## Phase 3: Reporting

Generate a comprehensive analysis report using the following structure:

---

### Component: `{ComponentName}`

**Search Scope:** all | core | package:NAME

**Total Usages Found:** X files

**Component Location:** `path/to/component.tsx:line`

**Export Type:** Named export | Default export

**Props Interface Summary:**
```typescript
interface ComponentProps {
  requiredProp: string;        // Required
  optionalProp?: number;       // Optional
  deprecatedProp?: boolean;    // Deprecated - use X instead
}
```

---

#### 📊 Pattern 1: [Name - e.g., "Standard Resource Link Pattern"]

**Occurrences:** X files (Y% of total usages)

**Commonality:** [What makes this a pattern? e.g., "All pass namespace, kind, and name props"]

**Files:**
- `path/to/file1.tsx:42` - Context: Resource list view
- `path/to/file2.tsx:78` - Context: Detail page header
- `path/to/file3.tsx:156` - Context: Related resources section

**Example:**
```tsx
<ComponentName
  requiredProp="value"
  optionalProp={variable}
  commonPattern="consistent-value"
>
  {children}
</ComponentName>
```

**Props Pattern:**
- `requiredProp` - Always provided ✅
- `optionalProp` - Provided in 85% of cases
- `commonPattern` - Consistently "consistent-value"

**Context:** This pattern appears in [list views | detail pages | forms | etc.]

---

#### 📊 Pattern 2: [Name - e.g., "Minimal Usage Pattern"]

**Occurrences:** X files (Y% of total usages)

**Commonality:** [What makes this a pattern?]

[Repeat structure from Pattern 1]

---

[Continue for Pattern 3, 4, etc. - list from most common to least common]

---

### ⚠️ Outliers / Inconsistencies

#### Outlier 1: Missing Required Prop

**Severity:** 🔴 Critical (Potential Bug)

**File:** `path/to/outlier.tsx:123`

**Issue:** Missing required prop `requiredProp`

**Current Code:**
```tsx
<ComponentName optionalProp={value} />
```

**Impact:**
- Component will not render correctly
- May cause runtime errors
- Violates TypeScript contract (if types are enforced)

**Recommendation:**
```tsx
<ComponentName
  requiredProp="appropriate-value"
  optionalProp={value}
/>
```

---

#### Outlier 2: Deprecated Prop Usage

**Severity:** 🟡 Medium (Technical Debt)

**File:** `path/to/outlier2.tsx:89`

**Issue:** Using deprecated prop `oldProp`

**Current Code:**
```tsx
<ComponentName oldProp={value} />
```

**Impact:**
- May break in future versions
- Not following current best practices
- Component may emit warnings

**Recommendation:**
```tsx
<ComponentName newProp={value} />
```

---

[Continue for each outlier, ordered by severity]

---

### 📈 Summary Statistics

- **Total usages:** X files
- **Patterns identified:** Y patterns
- **Outliers found:** Z inconsistencies
  - Critical: A (missing required props)
  - Medium: B (deprecated patterns)
  - Low: C (style inconsistencies)
- **Most common pattern:** Pattern 1 (X% of usages)
- **Least common pattern:** Pattern Y (Z% of usages)

---

**IMPORTANT:** After displaying the Phase 3 report above, proceed to Phase 4.

---

## Phase 4: Recommendations Prompt

After completing Phase 3 and displaying the full report to the user:

**If `$ARGUMENTS` contains `--show-recommendations`:**
- Skip the prompt and automatically display the recommendations section below

**Otherwise:**
- Output the following text prompt to ask the user:

```
---

Would you like to see recommendations for standardizing patterns and fixing inconsistencies? (yes/no)
```

- Wait for the user's response
- If the user responds with "yes" (or similar affirmative), display the recommendations section below
- If the user responds with "no" (or similar negative), end the analysis

---

### 💡 Recommendations

**Note:** This section is only displayed if the user requests it in Phase 4 OR if `--show-recommendations` argument is present in `$ARGUMENTS`.

#### Priority 1: Critical (Fix Immediately) 🔴

1. **Fix missing required props in X files**
   - Files affected: [list files]
   - Action: Add `requiredProp` to all usages
   - Estimated effort: [Small | Medium | Large]

#### Priority 2: Important (Address Soon) 🟡

2. **Standardize on Pattern 1 for resource linking**
   - Current: 3 different patterns in use
   - Recommended: Adopt Pattern 1 (60% already use it)
   - Rationale: Most common, aligns with PatternFly conventions
   - Files to update: [list files using Pattern 2 or 3]

3. **Remove deprecated prop usage**
   - Files affected: [list files]
   - Replace `oldProp` with `newProp`

#### Priority 3: Nice to Have (Refactoring Opportunity) 🟢

4. **Consider creating wrapper component**
   - Pattern 1 and Pattern 2 are similar
   - Could create `StandardComponentName` wrapper
   - Would reduce code duplication
   - Example:
   ```tsx
   export const StandardComponentName = (props) => (
     <ComponentName
       commonProp="always-this-value"
       {...props}
     />
   );
   ```

---

## Success Criteria

The analysis is complete when:

- ✅ All component usages found across the specified search scope
- ✅ Component's TypeScript interface/PropTypes documented
- ✅ Usages grouped into distinct patterns (minimum 1, typically 2-4)
- ✅ Each pattern has clear description, occurrence count, and examples
- ✅ Outliers identified with specific file paths and line numbers
- ✅ All missing required props flagged as critical issues
- ✅ Code examples provided for each pattern and outlier
- ✅ Report is well-formatted and easy to navigate
- ✅ Statistics summary provided at the end
- ✅ User is prompted whether they want to see recommendations (Phase 4)
- ✅ Recommendations prioritized by severity (only if user requests or `--show-recommendations` is passed)

---

## Edge Cases & Error Handling

### Component Not Found

**If no usages are found:**
1. Report: "No usages of `ComponentName` found in the specified scope"
2. **Check the scope:** If `--scope` was specified, the component might exist outside the search scope
   - Suggest trying with `--scope=all` or a different scope
3. Verify component name spelling
4. Check if component might be:
   - Aliased (imported with different name)
   - Re-exported from another module
   - From an external library (only used in node_modules)
5. Suggest checking:
   - Alternative spellings
   - Related component names
   - Whether component has been renamed recently
   - Broadening the search scope if currently limited

### Too Many Results (>50 files)

**If >50 usages found:**
1. Provide summary first:
   ```
   Found 87 usages across 65 files. This is a large analysis.
   ```
2. Ask user: "Proceed with full analysis or narrow the scope?"
3. If proceeding:
   - Focus on identifying patterns rather than documenting every usage
   - Sample 10-15 representative examples per pattern
   - Note total count but don't list every single file

### Component from External Library

**If component is from external library (e.g., PatternFly):**
1. Note: "`ComponentName` is from external library [@patternfly/react-core]"
2. **Do not** analyze the library's internal implementation
3. **Do** analyze local usage patterns and conventions
4. **Do** check if local usages follow PatternFly's documented API
5. **Do** suggest wrapper components if local usage is overly complex

### Multiple Components with Same Name

**If multiple components found with same name:**
1. List all locations:
   ```
   Found multiple components named "ComponentName":
   - frontend/public/components/ComponentName.tsx
   - frontend/packages/dev-console/src/components/ComponentName.tsx
   ```
2. Ask user which one to analyze (or analyze both separately)
3. Note in report which component is being analyzed

---

## Performance Considerations

- For large searches (>100 files), provide progress updates every 20 files
- Use `head_limit` parameter in Grep to preview results before full analysis
- Focus on most impactful outliers rather than documenting every minor variation
- If analysis takes >3 minutes, provide interim summary and ask if user wants to continue
- Consider suggesting scope reduction if search is taking too long

---

## Related Standards

When analyzing patterns and making recommendations, prioritize:

1. **Component's TypeScript Interface**
   - Required props must always be provided
   - Prop types must match interface

2. **PatternFly Component Conventions** (if applicable)
   - Follow PatternFly API documentation
   - Use recommended prop combinations
   - Follow accessibility guidelines (ARIA attributes)

3. **Console Component Patterns**
   - Check similar components for established patterns
   - Follow patterns in `CLAUDE.md` and `STYLEGUIDE.md`
   - Maintain consistency with core components

4. **TypeScript Best Practices**
   - Prefer explicit types over `any`
   - Use optional chaining for optional props
   - Avoid deprecated patterns

5. **Accessibility Requirements**
   - Ensure semantic HTML usage
   - Check for required ARIA attributes
   - Verify keyboard navigation support

---

## Notes

- This command helps maintain consistency across the large OpenShift Console codebase
- Useful for identifying technical debt and refactoring opportunities
- Can identify opportunities for creating shared wrapper components
- Output can inform component API design decisions
- Run periodically as part of code quality audits
- Particularly valuable before making breaking changes to a component's API
- Helps new team members understand how components are typically used
- **Use `--show-recommendations`** when you need actionable guidance on fixing issues and standardizing patterns
- **Skip recommendations** (default) when you only need to understand current usage patterns without prescriptive advice

---

## Example Workflows

### Example 1: Basic Usage - User Declines Recommendations

**User:** `/find-component-pattern`
**Assistant:**
```
Which component would you like me analyze?

Use --scope=SCOPE to limit scope (optional):
- all - Search entire frontend (default)
- core - Only core components (frontend/public/components/)
- package:NAME - Specific package (e.g., package:dev-console)
```
**User:** "ResourceLink"

**Assistant proceeds:**
1. **Phase 1:** Finds ResourceLink component definition, searches all frontend code for 87 usages
2. **Phase 2:** Groups into 3 patterns, identifies 4 outliers
3. **Phase 3:** Generates report with patterns, outliers, and statistics
4. **Phase 4:** Outputs text prompt:
   ```
   Would you like to see recommendations for standardizing patterns and fixing inconsistencies? (yes/no)
   ```

**User:** "no"

**Output:** Analysis showing Pattern 1 (passing groupVersionKind, name, namespace) is used in 70% of cases, Pattern 2 (passing kind, name, namespace) in 25%, Pattern 3 (minimal props) in 5%, plus 4 outliers missing required props. Analysis ends without recommendations.

---

### Example 2: Basic Usage - User Accepts Recommendations

**User:** `/find-component-pattern`
**Assistant:**
```
Which component would you like me analyze?

Use --scope=SCOPE to limit scope (optional):
- all - Search entire frontend (default)
- core - Only core components (frontend/public/components/)
- package:NAME - Specific package (e.g., package:dev-console)
```
**User:** "ResourceLink"

**Assistant proceeds:**
1. **Phase 1:** Finds ResourceLink component definition, searches all frontend code for 87 usages
2. **Phase 2:** Groups into 3 patterns, identifies 4 outliers
3. **Phase 3:** Generates report with patterns, outliers, and statistics
4. **Phase 4:** Outputs text prompt:
   ```
   Would you like to see recommendations for standardizing patterns and fixing inconsistencies? (yes/no)
   ```

**User:** "yes"

**Output:** Full analysis with patterns, outliers, statistics, AND prioritized recommendations for standardization.

---

### Example 3: With Scope (Core Components Only)

**User:** `/find-component-pattern --scope=core`
**Assistant:**
```
Which component would you like me to analyze?
```
*(Note: Scope options are NOT shown because user already specified --scope=core)*

**User:** "ResourceLink"

**Assistant proceeds:**
1. **Phase 1:** Finds ResourceLink component definition, searches only `frontend/public/components/` for usages
2. **Phase 2:** Groups into patterns from core components only
3. **Phase 3:** Generates report limited to core component usage patterns
4. **Phase 4:** Prompts user about recommendations

**Output:** Analysis focused only on core component usage patterns, with optional recommendations based on user choice.

---

### Example 4: With Package Scope

**User:** `/find-component-pattern --scope=package:dev-console`
**Assistant:**
```
Which component would you like me to analyze?
```
*(Note: Scope options are NOT shown because user already specified --scope=package:dev-console)*

**User:** "EnvironmentPage"

**Assistant proceeds:**
1. **Phase 1:** Finds EnvironmentPage component definition, searches only `frontend/packages/dev-console/` for usages
2. **Phase 2:** Groups into patterns within dev-console package
3. **Phase 3:** Generates report showing usage patterns within the dev-console package
4. **Phase 4:** Prompts user about recommendations

**Output:** Analysis limited to dev-console package usage, with optional recommendations.

---

### Example 5: With --show-recommendations Flag (Skips Phase 4 Prompt)

**User:** `/find-component-pattern --show-recommendations --scope=package:topology`
**Assistant:**
```
Which component would you like me to analyze?
```
*(Note: Scope options are NOT shown because user already specified --scope=package:topology)*

**User:** "TopologyView"

**Assistant proceeds:**
1. **Phase 1:** Finds TopologyView component definition, searches only `frontend/packages/topology/` for usages
2. **Phase 2:** Groups into patterns within topology package, identifies outliers
3. **Phase 3:** Generates comprehensive report
4. **Phase 4:** Skips prompt (since `--show-recommendations` flag was passed) and automatically displays recommendations

**Output:** Full analysis with patterns, outliers, statistics, AND prioritized recommendations for standardization within the topology package.

---

### Example 6: Component Name Provided in Arguments (No Prompts)

**User:** `/find-component-pattern ResourceLink --scope=core --show-recommendations`
**Assistant:** *(No component prompt shown - proceeds directly to analysis)*

**Assistant proceeds:**
1. **Phase 1:** Finds ResourceLink component definition, searches only `frontend/public/components/` for usages
2. **Phase 2:** Groups into patterns from core components only
3. **Phase 3:** Generates comprehensive report
4. **Phase 4:** Skips prompt (since `--show-recommendations` flag was passed) and automatically displays recommendations

**Output:** Full analysis with patterns, outliers, statistics, AND prioritized recommendations for ResourceLink in core components. No user prompts were needed since all arguments were provided upfront.
