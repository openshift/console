---
name: gen-rtl-test
description: Generate React Testing Library tests following best practices from Enzyme to RTL migration
argument-hint: [component-path] (optional - auto-detects from git diff)
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(yarn test *, cd *, chmod *), AskUserQuestion
---

# /gen-rtl-test

## Context
- This skill generates React Testing Library (RTL) tests following OpenShift Console's testing best practices
- Tests are generated for React components (.tsx, .jsx files) using Jest + @testing-library/react
- All tests MUST follow patterns documented in TESTING.md and enforced by **Claude Code hooks** (`.claude/hooks/*.sh`, see `settings.json`)
- Structural enforcement uses **hooks over hopes** (deterministic shell, not prose alone)
- Generated tests should be user-centric, accessibility-first, and avoid implementation details

## Critical Rules (Structurally Enforced)

The following rules are ZERO TOLERANCE and enforced by pre-tool-use hooks. Violations will BLOCK file writes:

### Rule 1: ES6 Imports Only (MANDATORY)
**ALWAYS** use ES6 `import` statements. **NEVER** use `require()` except `jest.requireActual()` for partial mocks.

```typescript
// ✅ CORRECT
import { k8sCreate } from '@console/internal/module/k8s';
import { useCustomHook } from '../hooks';

// ❌ FORBIDDEN - Will be BLOCKED
const { k8sCreate } = require('@console/internal/module/k8s');
const React = require('react');
```

### Rule 2: Test File Location and Naming (MANDATORY)
- Test files MUST be in `__tests__/` directory
- MUST use `.spec.tsx` extension (NOT `.test.tsx`)

```
ComponentDirectory/
├── __tests__/
│   └── MyComponent.spec.tsx  ✅ CORRECT
└── MyComponent.tsx
```

### Rule 3: No expect.anything() (MANDATORY)
**NEVER** use `expect.anything()` - it defeats the purpose of testing.

```typescript
// ❌ FORBIDDEN - Will be BLOCKED
expect(mockFn).toHaveBeenCalledWith(expect.anything());

// ✅ CORRECT - Use specific matchers
expect(mockFn).toHaveBeenCalledWith(expect.any(String));
expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ key: 'value' }));
expect(mockFn).toHaveBeenCalledWith(expect.stringContaining('partial'));
```

## Testing Best Practices

### 1. User-Centric Testing
Test what users see and interact with, NOT implementation details.

**DO NOT test:**
- Internal component state
- Private methods
- Props passed to child components
- CSS class names or styles
- Component structure (e.g., `container.firstChild`)

```typescript
// ✅ GOOD - Testing user-visible behavior
expect(screen.getByRole('heading', { name: 'Resource Details' })).toBeVisible();
await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

// ❌ BAD - Testing implementation
expect(wrapper.state('isOpen')).toBe(true);
expect(wrapper.find(DetailsPage).props()).toEqual({...});
```

### 2. Query Priority (In Order of Preference)

1. **Accessible queries** (best for users and screen readers):
   - `getByRole` (PREFERRED for interactive elements)
   - `getByLabelText` (for form fields)
   - `getByPlaceholderText`
   - `getByText`
   - `getByDisplayValue`

2. **Semantic queries** (good for non-interactive content):
   - `getByAltText`
   - `getByTitle`

3. **Test IDs** (last resort only):
   - `getByTestId` (use only when semantic queries don't work)

```typescript
// ✅ BEST - Role-based queries
screen.getByRole('button', { name: 'Submit' })
screen.getByRole('heading', { name: /details/i })
screen.getByRole('textbox', { name: 'Username' })

// ✅ GOOD - Label-based queries
screen.getByLabelText('Username')
screen.getByPlaceholderText('Enter your name')

// ⚠️ LAST RESORT - Test IDs
screen.getByTestId('custom-widget')
```

### 3. User Interactions - Use userEvent (NOT fireEvent)

**ALWAYS** use `@testing-library/user-event` for simulating user interactions.

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ✅ CORRECT - userEvent provides realistic interactions
await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
await userEvent.type(screen.getByLabelText('Username'), 'john');
await userEvent.clear(screen.getByLabelText('Email'));
await userEvent.selectOptions(screen.getByLabelText('Country'), 'US');

// ❌ FORBIDDEN - fireEvent is too low-level
fireEvent.click(screen.getByRole('button'));
fireEvent.change(input, { target: { value: 'text' } });
```

### 4. Async Testing - Handle Updates Properly

Use `findBy*` or `waitFor` for asynchronous updates to avoid act() warnings.

```typescript
// ✅ CORRECT - findBy queries wait automatically
const heading = await screen.findByRole('heading', { name: 'Loaded' });

// ✅ CORRECT - waitFor for complex async logic
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// ❌ BAD - Missing async handling causes act() warnings
const heading = screen.getByRole('heading', { name: 'Loaded' });
```

### 5. Assertions: explicit `expect`, visibility, and loading UI

**Explicit `expect` on queries:** `getBy*` throws if the node is missing, but you should still wrap the query in `expect(...).toBeVisible()` (or another explicit matcher). That is **not redundant**: it satisfies `testing-library/prefer-explicit-assert`, documents intent, and `toBeVisible()` is stricter than existence alone (catches hidden or zero-size UI).

**Loading and “not yet” UI:** For intermediate states (e.g. data still loading), assert what the user should **not** see yet with `expect(screen.queryBy*…).toBeFalsy()` or `not.toBeInTheDocument()`, and assert the loading affordance with `expect(screen.getByRole('progressbar', …)).toBeVisible()` or `expect(screen.getByTestId('loading-indicator')).toBeVisible()` as appropriate. Do not use `getByText` for headings or forms that must stay hidden until load completes.

### 6. Mocking Patterns

Keep mocks **simple** - return `null`, strings, or `children` directly.

```typescript
// ✅ CORRECT - Simple mock returning null
jest.mock('../MyComponent', () => () => null);

// ✅ CORRECT - Mock returning string
jest.mock('../LoadingSpinner', () => () => 'Loading...');

// ✅ CORRECT - Mock returning children
jest.mock('../Wrapper', () => ({ children }) => children);

// ✅ CORRECT - Use jest.fn for tracking calls
jest.mock('../ButtonBar', () => jest.fn(({ children }) => children));

// ✅ CORRECT - Mock custom hooks
jest.mock('../useCustomHook', () => ({
  useCustomHook: jest.fn(() => ({ data: null, loading: false }))
}));

// ❌ FORBIDDEN - require() in mocks
jest.mock('../Component', () => {
  const React = require('react'); // NEVER
  return () => React.createElement('div');
});

// ❌ FORBIDDEN - JSX in mocks
jest.mock('../Component', () => () => <div>Mock</div>);
```

### 7. Form Field Testing - Use verifyInputField Utility

For form fields, **ALWAYS** use the `verifyInputField` utility from `@console/shared/src/test-utils/unit-test-utils`.

```typescript
import { verifyInputField } from '@console/shared/src/test-utils/unit-test-utils';

// ✅ CORRECT - Comprehensive form field testing
verifyInputField(
  screen.getByLabelText('Username'),
  'john',
  'text',
  undefined,
  false
);

// Parameters:
// 1. field element
// 2. expected value
// 3. expected type
// 4. expected name (optional)
// 5. isDisabled (optional)
```

### 8. Test Structure - Arrange-Act-Assert (AAA)

```typescript
it('should update username when input changes', async () => {
  // ARRANGE - Set up test data and render
  const mockSubmit = jest.fn();
  render(<UserForm onSubmit={mockSubmit} />);

  // ACT - Perform user actions
  const usernameInput = screen.getByLabelText('Username');
  await userEvent.type(usernameInput, 'john');
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

  // ASSERT - Verify expected outcomes
  expect(mockSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ username: 'john' })
  );
});
```

### 9. Render Helpers

Use `renderWithProviders` from `@console/shared/src/test-utils` for components needing context.

```typescript
import { renderWithProviders } from '@console/shared/src/test-utils';

// ✅ CORRECT - Use helper for providers
const { container } = renderWithProviders(
  <MyComponent />,
  {
    redux: { initialState },
    router: { initialEntries: ['/path'] }
  }
);

// ❌ BAD - Manual provider wrapping
const wrapper = mount(
  <Provider store={store}>
    <Router>
      <MyComponent />
    </Router>
  </Provider>
);
```

### 10. TypeScript Safety

Use proper types for props and mock data.

```typescript
import { ComponentProps } from 'react';

type MyComponentProps = ComponentProps<typeof MyComponent>;

const mockProps: MyComponentProps = {
  name: 'test',
  onSubmit: jest.fn()
};

render(<MyComponent {...mockProps} />);
```

### 11. Test Coverage Guidelines

Generate **5-10 focused tests** covering:
1. **Component renders** with required props
2. **User interactions** (clicks, form inputs, selections)
3. **Conditional rendering** (loading states, error states, empty states)
4. **Form validation** (if applicable)
5. **API calls/effects** (if applicable)

Avoid redundant tests - focus on high-value scenarios.

## Instructions

When the user invokes `/gen-rtl-test`, follow these steps:

### Step 1: Identify Components

**If component path provided as argument:**
1. Use the provided path(s) directly
2. Validate they are React component files (.tsx or .jsx)
3. Proceed to Step 2

**If NO component path provided:**
1. The `user-prompt-submit` hook will auto-inject modified React components from git diff
2. Check the `<git-diff-components>` block in the conversation context
3. If components found, use them automatically
4. If no components found, ask the user:
   ```
   question: "Which component would you like to generate tests for?"
   header: "Component"
   options:
     - label: "Browse components in frontend/packages"
       description: "I'll help you find components to test"
     - label: "Provide component path"
       description: "You specify the exact file path"
   ```

### Step 2: Read and Analyze Component

1. **Read the component file** completely
2. **Identify key testing scenarios**:
   - What props does it accept?
   - What user interactions are possible?
   - What conditional rendering logic exists?
   - What side effects occur (API calls, routing, etc.)?
   - Are there form fields?
3. **Check for existing tests**:
   - Look for `__tests__/ComponentName.spec.tsx`
   - If tests exist, ask user if they want to replace or skip
4. **Identify dependencies to mock**:
   - Child components to mock
   - Hooks to mock (except React hooks)
   - Modules to mock (API clients, utilities)

### Step 3: Generate Test File

Create a test file following this structure:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '../ComponentName';

// Mock child components (keep simple - return null, string, or children)
jest.mock('../ChildComponent', () => () => null);

// Mock custom hooks
jest.mock('../hooks/useCustomHook', () => ({
  useCustomHook: jest.fn(() => ({ data: null, loading: false }))
}));

// Mock utilities/modules
jest.mock('@console/internal/module/k8s', () => ({
  k8sCreate: jest.fn()
}));

describe('ComponentName', () => {
  it('should render component with required props', () => {
    render(<ComponentName requiredProp="value" />);
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    render(<ComponentName />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  // 3-8 more focused tests...
});
```

**Critical Requirements:**
- ✅ ES6 imports only (NO require())
- ✅ File location: `__tests__/ComponentName.spec.tsx`
- ✅ Use `userEvent` for interactions
- ✅ Use `findBy*` or `waitFor` for async
- ✅ Use `verifyInputField` for form fields
- ✅ Specific matchers (NO expect.anything())
- ✅ 5-10 focused tests

### Step 4: Validate Test File

After generating the test, the hooks will automatically validate:
1. ✅ No require() calls (except jest.requireActual)
2. ✅ No expect.anything() usage
3. ✅ Correct file location (__tests__/)
4. ✅ Correct file extension (.spec.tsx)

If violations found, the write will be BLOCKED - fix immediately.

### Step 5: Run Tests

**MANDATORY** - Tests MUST be executed before completion.

1. Run the test file:
   ```bash
   cd frontend && yarn test -- <test-file-path> --no-coverage
   ```

2. If tests fail or have act() warnings:
   - Read the error output carefully
   - Fix the issues (typically missing async handling)
   - Re-run tests
   - Repeat until all tests pass

3. Validate using the validation script:
   ```bash
   chmod +x ../.claude/skills/gen-rtl-test/scripts/validate-test.sh
   ../.claude/skills/gen-rtl-test/scripts/validate-test.sh <test-file-path>
   ```

### Step 6: Summary

Provide a summary:
```
✅ Generated RTL tests for ComponentName

Test File: path/to/__tests__/ComponentName.spec.tsx
Test Count: 7 tests
Test Results: All passing ✅

Coverage:
- Component renders with props
- User interactions (clicks, form inputs)
- Conditional rendering (loading, error states)
- Form validation
- API calls
```

## Common Pitfalls to Avoid

1. **❌ Using fireEvent** - Use `userEvent` instead
2. **❌ Missing await on userEvent** - All userEvent methods are async
3. **❌ Using getBy* for async content** - Use `findBy*` or `waitFor`
4. **❌ Testing implementation details** - Test user-visible behavior
5. **❌ Complex mocks** - Keep mocks simple (null, strings, children)
6. **❌ Missing async handling** - Causes act() warnings
7. **❌ expect.anything()** - Use specific matchers
8. **❌ require() in imports** - Use ES6 imports
9. **❌ Manual form assertions** - Use `verifyInputField` utility
10. **❌ Unused React import** - Modern JSX doesn't need it

## Claude Code hooks (enforcement + context)

Official Claude Code hooks are **command scripts** that read JSON on **stdin** and return decisions on **stdout** (see [Hooks reference](https://docs.anthropic.com/en/docs/claude-code/hooks)). This repo wires them in **`.claude/settings.json`**:

| Hook event | Script | Role |
|------------|--------|------|
| `PreToolUse` (matcher `Write\|Edit`) | `.claude/hooks/gen-rtl-pre-tool-use.sh` | **Blocks** invalid test writes/edits: `require()` (except `jest.requireActual`), `expect.anything()`, wrong location/extension for `__tests__/**/*.spec.*`. |
| `UserPromptSubmit` | `.claude/hooks/gen-rtl-user-prompt-submit.sh` | When the prompt mentions **gen-rtl-test**, injects `<git-diff-components>` from `git diff` and a pointer to **verifyInputField**. |

That matches the **“hooks over hopes”** pattern ([skill patterns](https://ro14nd.de/cc-skill-patterns/)): structural rules live in deterministic shell + `jq`, not only in prose.

**Legacy reference:** `skills/gen-rtl-test/hooks/*.js` files use a non-Claude `export function …` shape and are **not** loaded by Claude Code until wrapped by a stdin/stdout command. Prefer the `.claude/hooks/*.sh` scripts above.

### Hook-Provided Context (what you see in-session)

When you invoke `/gen-rtl-test`, the **UserPromptSubmit** hook may prepend:

- Modified React components from `git diff --name-only HEAD` (tsx/jsx, excluding tests and `__mocks__`)
- A reminder that **verifyInputField** exists at `@console/shared/src/test-utils/unit-test-utils`

You can still run `detect-components.sh` manually for the same list as JSON.

## Success Criteria

A test is complete when:
1. ✅ Test file created in correct location (__tests__/)
2. ✅ All structural validations pass (no violations)
3. ✅ Tests execute successfully (no failures)
4. ✅ No act() warnings
5. ✅ 5-10 focused tests covering key scenarios
6. ✅ Uses userEvent for interactions
7. ✅ Uses findBy*/waitFor for async
8. ✅ Uses verifyInputField for form fields
9. ✅ Tests user-visible behavior (not implementation)
10. ✅ Proper TypeScript types throughout
