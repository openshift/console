# Console Assist - JSX to TSX Conversion

Expert conversion assistant for OpenShift Console. Convert legacy JSX files to TypeScript TSX with automated type inference, error fixing, and testing.

## Command
`/console-assist convert <filepath>`

## Mission
Convert the specified JSX file to TypeScript TSX, adding proper type annotations, ensuring builds and tests pass through automated fixing of TypeScript errors.

## Process

### Phase 1: Analysis & Preparation
1. **Validate**: Confirm file exists and is `.jsx`
2. **Read**: Read target JSX file
3. **Analyze**: Identify imports, React patterns (class vs functional, hooks usage), props usage
4. **Context**: Search for related files (tests, types, similar components) to understand patterns
5. **Interactive Gather**: Ask user:
   - "Are there existing type definitions for this component's props?" (optional)
   - "Any specific TypeScript patterns or conventions for this area?" (optional)
   - "Should I also update related test files?" (default: yes)

### Phase 2: Conversion
6. **Rename File**: Rename from `.jsx` to `.tsx`
7. **Add Type Annotations**:
   - Define proper TypeScript types for component props
   - Add types for state (if class component) or useState hooks
   - Type all function parameters and return values
   - Add types for event handlers
   - Type refs and useRef hooks
   - Add types for context and custom hooks
8. **Import Type Updates**:
   - Add necessary type imports (React.FC, ReactNode, etc.)
   - Import types from `@console/shared` or `@console/internal` when available
   - Update relative imports if moving from .jsx to .tsx changes paths
9. **Code Modernization** (where straightforward):
   - Prefer interfaces over type aliases for props
   - Use proper React.FC or function component typing
   - Add proper typing for children props
   - Type custom hooks properly
   - Follow patterns from `.ai/context.md` for React hooks and functional programming

### Phase 3: Build & Fix
10. **Build**: Run `yarn build`; capture all errors with file paths and line numbers
11. **Analyze**: On success → Phase 4. On failure → categorize errors (type inference/null/compatibility) → Auto-Fix
12. **Auto-Fix**:
    - Type inference errors: Add explicit types
    - Null/undefined errors: Add proper null checks or optional chaining
    - Type compatibility: Adjust types to match actual usage
    - Missing properties: Add required properties or make optional
    - Generic type arguments: Add proper type parameters
    - Enum/union types: Use proper string literals or enums
13. **Verify**: Re-run build. If new errors appear, repeat the full fix cycle (Phase 3 → verify). Max 3 complete cycles (then ask user for guidance)

### Phase 4: Test & Validate
14. **Update Tests**: If test file exists, rename to `.spec.tsx`, add types for props/mocks, update imports
15. **Test**: Run `yarn test <test-file-pattern>`; capture failures, stack traces
16. **Analyze**: On success → Phase 5. On failure → identify type issues → Fix Tests
17. **Fix Tests**: Update snapshots if only type changes, fix type-related errors, ensure mocks have proper types

### Phase 5: Lint & Format
18. **Lint**: Run `yarn lint`; capture issues
19. **Fix**: Auto-fix formatting or style issues introduced
20. **Verify**: Final build + test to ensure everything passes

### Phase 6: Complete
21. **Final Check**: Run `yarn build` and `yarn test` - verify both pass
22. **Report**:
    - File: `<filepath>` converted from JSX → TSX
    - Types added: Props, State, Hooks, Event Handlers, etc.
    - Files modified, errors fixed
    - Build ✓ | Tests ✓ | Lint ✓

## Guidelines

**Code Standards**:
- For coding patterns and project structure: Read [`.ai/context.md`](../../.ai/context.md), [`.ai/README.md`](../../.ai/README.md), and [`README.md`](../../README.md)
- For style conventions: Consult [`STYLEGUIDE.md`](../../STYLEGUIDE.md) and [`CONTRIBUTING.md`](../../CONTRIBUTING.md)
- Follow existing TypeScript patterns in the codebase

**TypeScript Conversion Rules**:
- Only convert specified file and its direct dependencies (tests); no unrelated changes
- Use existing types from `@console/shared`, `@console/internal`, or local type files
- Prefer interfaces for props, types for unions/intersections
- Don't use `any` - use `unknown` and type guards if needed
- Use proper React types: `React.FC`, `ReactNode`, `ReactElement`, etc.
- Add proper event handler types: `React.MouseEvent`, `React.ChangeEvent`, etc.
- Type all hooks: `useState<Type>()`, `useRef<Type>()`
- For K8s resources, use existing types from `@console/internal/module/k8s`
- Never skip/suppress errors with `@ts-ignore` unless absolutely necessary (and document why)
- All tests must pass; only change expectations if types legitimately changed
- Use TodoWrite to track phases (TodoWrite is a Claude Code tool for tracking workflow phases with states: pending, in_progress, completed)

**Common Type Patterns**:
```typescript
// Props interface
interface MyComponentProps {
  name: string;
  count?: number;
  onAction: (id: string) => void;
  children?: React.ReactNode;
}

// Functional component
const MyComponent: React.FC<MyComponentProps> = ({ name, count = 0, onAction, children }) => {
  // Component implementation
};

// useState with type
const [items, setItems] = useState<string[]>([]);

// useRef with type
const inputRef = useRef<HTMLInputElement>(null);

// Event handlers
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // Handler implementation
};
```

**Special Cases**:
- **Class Components**: Add proper typing for props, state, and lifecycle methods
- **HOCs**: Type the wrapped component and HOC properly
- **Context**: Define proper context value types
- **Custom Hooks**: Export hook with proper return type
- **K8s Resources**: Use `K8sResourceCommon` and model-specific types
- **Dynamic Plugins**: Ensure types match console-dynamic-plugin-sdk patterns
- **Workspace**: Changes affect `packages/*`; build from frontend directory

## Success Criteria
✓ File renamed `.jsx` → `.tsx`
✓ All props, state, hooks properly typed
✓ No `any` types (except where truly necessary)
✓ `yarn build` passes
✓ `yarn test` passes
✓ `yarn lint` passes
✓ Import references updated
✓ Committed with descriptive message

## Failure After 3 Iterations
1. Document remaining errors with file paths and line numbers
2. Provide manual fix recommendations with specific type suggestions
3. List complex type issues needing review
4. Suggest consulting TypeScript expert or incremental approach

## Example: Interactive Flow
```text
User: /console-assist convert frontend/packages/dev-console/src/components/MyComponent.jsx

Assistant: Analyzing MyComponent.jsx...

Before I proceed:
1. Are there existing type definitions for this component's props? (optional)
2. Any specific TypeScript patterns for this area? (optional)
3. Should I also update related test files? (default: yes)

User: Yes, please update tests

Assistant: Perfect\! I found:
- Functional component using hooks (useState, useEffect)
- Props passed but no type definition
- Test file: MyComponent.spec.jsx exists

Converting MyComponent.jsx → MyComponent.tsx...
[Renames file, adds prop interface, types hooks]

Running yarn build...
[Fixes 5 TypeScript errors: implicit any, missing types, null checks]

Running yarn test MyComponent...
[Updates test file types, fixes 2 test errors]

✓ Conversion complete\!
- File: MyComponent.tsx
- Types added: Props interface (4 props), useState hooks (2), useEffect dependencies
- Build ✓ | Tests ✓ | Lint ✓
- Files modified: MyComponent.tsx, MyComponent.spec.tsx, index.ts (import)
```
