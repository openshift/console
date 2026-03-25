---
name: gen-rtl-test
description: Generate React Testing Library tests following OCP Console best practices
argument-hint: "[path/to/Component.tsx] or use @file for autocomplete"
---

# OCP Console React Component Unit Testing Best Practices

**Usage:**
- `/gen-rtl-test` - **Default**: Automatically checks `git diff` for component changes and generates tests
- `/gen-rtl-test path/to/Component.tsx` - Generate tests for a specific component
- `/gen-rtl-test @Component.tsx` - Use `@` for file autocomplete, then select the file

## Smart Component Detection Workflow

When invoked without arguments, the slash command follows this intelligent workflow:

1. **Check git diff**: Automatically run `git diff --name-only` to find modified files
2. **Filter for components**: Identify `.tsx` and `.jsx` component files (exclude test files, type files, utils)
3. **Validate components**: Ensure files contain React components (not just types or utilities)
4. **Present options**: Show user the detected components and ask which to generate tests for
5. **Fallback**: If no valid components found, prompt user for component path

This workflow ensures you automatically generate tests for components you're actively working on.

You are helping generate comprehensive React Testing Library (RTL) test cases following the established OCP Console unit testing standards.

## Introduction & Objectives

This guide establishes a consistent, project-wide standard for all React component tests in the OCP Console.

**Core Philosophy:** Test component behavior from a user's perspective, not internal implementation details.

### Objectives
- Establish consistent project-wide testing standards
- Promote user-centric testing that focuses on behavior over implementation
- Provide practical, rules-based guidance for common scenarios
- Improve test quality, resilience, and maintainability

---

## Section 1: React Testing Library Overview

### The RTL Approach
RTL emphasizes testing components as users interact with them. Users find buttons by visible text (e.g., "Submit"), not by CSS classes, IDs, or test IDs. Therefore, test selectors should prioritize what users see and interact with.

### Core Principles

1. **User-Centric Testing** - Test what users see and interact with. **DO NOT test:**
   - Internal component state
   - Private component methods
   - Props passed to child components
   - CSS class names or styles
   - Component structure (e.g., `expect(container.firstChild).toBe...`)

2. **Accessibility-First** - Queries match how screen readers and users interact with the UI

3. **Semantic Over Generic** - Always prefer role-based queries (e.g., `getByRole`) over generic selectors

4. **DRY Helpers** - Use reusable function in frontend/packages/console-shared/src/test-utils directoty and sub-directory if exists else extract repetitive setup into reusable functions

5. **Async-Aware** - Handle asynchronous updates with `findBy*` and `waitFor`

6. **TypeScript Safety** - Use proper types for props, state, and mock data

7. **Arrange-Act-Assert (AAA) Pattern** - Structure tests logically:
   - **Arrange:** Render component with mocks
   - **Act:** Perform user actions
   - **Assert:** Verify expected state

---

## Section 2: Console RTL Rules

## ⚠️ CRITICAL RULE - READ FIRST

### **ALWAYS Use ES6 Imports - NEVER Use require()**

**This is the #1 most critical rule for test generation.**

## 🚫 ZERO TOLERANCE: NO require() ANYWHERE

**NEVER use `require()` in test files. NO EXCEPTIONS.**

❌ **FORBIDDEN - In test bodies:**
```typescript
it('should work', () => {
  const { k8sCreate } = require('@console/internal/module/k8s'); // ❌ NEVER
});
```

❌ **FORBIDDEN - In mock factories:**
```typescript
jest.mock('../Component', () => {
  const React = require('react'); // ❌ NEVER - even here!
  return () => React.createElement('div', null, 'Mock');
});
```

✅ **REQUIRED - ES6 imports only:**
```typescript
// Import at file top
import { k8sCreate } from '@console/internal/module/k8s';

// Simple mocks - no React.createElement needed
jest.mock('../Component', () => () => null); // ✅ Return null
jest.mock('../LoadingSpinner', () => () => 'Loading...'); // ✅ Return string

// Use in tests
it('should work', () => {
  (k8sCreate as jest.Mock).mockResolvedValue({});
});
```

**Why ZERO tolerance:**
- `require()` breaks Jest's mock hoisting mechanism
- Causes test isolation failures and flaky tests
- Violates OCP Console testing standards
- **NO exceptions - even in mock factories**

---

### Rule 1: Test File Co-location and Naming Convention

**File Structure:**
```
MyComponentDirectory/
├── __tests__/
│   └── MyComponent.spec.tsx
└── MyComponent.tsx
```

- Test file must be in `__tests__/` directory within component directory
- Test file must have same name as implementation file
- Use `.spec.tsx` extension

### Rule 2: Mocking Strategies

#### Check for Global Mocks First
Before manually mocking, check `__mocks__/` directory for existing global mocks (e.g., `react-i18next`, `localStorage`, `k8sResourcesMocks`). These are applied automatically.

#### Keep Component Mocks Simple (No JSX)
Mock functions must NOT return JSX to avoid Jest hoisting errors:

```typescript
// ✅ CORRECT:
jest.mock('../MyComponent', () => () => null);

// ✅ CORRECT:
jest.mock('../LoadingSpinner', () => () => 'Loading...');

// ✅ CORRECT: Return children directly
jest.mock('../utils/firehose', () => ({
  Firehose: (props) => props.children,
}));

// ✅ CORRECT: Use jest.fn for tracking calls
jest.mock('../utils/firehose', () => ({
  Firehose: jest.fn((props) => props.children),
}));

// ❌ INCORRECT (causes hoisting errors):
jest.mock('../MyComponent', () => () => <div>My Mock</div>);
```

#### Mock Custom Hooks with jest.fn()
```typescript
jest.mock('../useCustomHook', () => ({
  useCustomHook: jest.fn(() => [/* mock data */]),
}));
```

#### Use Static Partial Mocking for Module-Wide Control
```typescript
jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  k8sCreate: jest.fn(),
  k8sPatch: jest.fn(),
}));
```

#### Use jest.spyOn for Granular, Test-Level Control (Preferred)
```typescript
import * as k8sModule from '@console/internal/module/k8s';

it('should do something when k8sGet succeeds', () => {
  jest.spyOn(k8sModule, 'k8sGet').mockResolvedValue(data);
  // ... rest of the test ...
});
```

#### Controlling Redux State
**DO NOT** mock the `useReduxStore` hook. Instead, pass `initialState` to `renderWithProviders`:

```typescript
import { renderWithProviders } from '@console/test-utils';

it('should render with mock Redux data', () => {
  const mockK8sState = { /* ... */ };

  renderWithProviders(
    <MyComponent />,
    {
      initialState: {
        k8s: mockK8sState
      }
    }
  );

  expect(screen.getByText('My Mock Data')).toBeVisible();
});
```

#### ⚠️ CRITICAL: Always Use ES6 Import (Never require())
**STRICTLY ENFORCED - ZERO EXCEPTIONS**

## 🚫 NO require() ANYWHERE IN TEST FILES

Always use ES6 `import/export` syntax in test files. **NEVER** use `require()` - not in test bodies, not in mock factories, **NOWHERE**.

**✅ CORRECT - ES6 Imports:**
```typescript
// Import at the top of the file
import { k8sCreate } from '@console/internal/module/k8s';
import { history } from '@console/internal/components/utils';
import * as pdbModels from '../pdb-models';

// Simple mocks - return null or strings, NO React.createElement
jest.mock('../Component', () => () => null);
jest.mock('../ButtonBar', () => ({ children }) => children);

// Use in test
it('should create resource', async () => {
  (k8sCreate as jest.Mock).mockResolvedValue({});
  jest.spyOn(history, 'push');
  jest.spyOn(pdbModels, 'patchPDB').mockResolvedValue({});
  // ... rest of test
});
```

**❌ INCORRECT - require() ANYWHERE:**
```typescript
// ❌ NEVER in test bodies
it('should create resource', async () => {
  const { k8sCreate } = require('@console/internal/module/k8s'); // ❌ FORBIDDEN
});

// ❌ NEVER in mock factories
jest.mock('../Component', () => {
  const React = require('react'); // ❌ FORBIDDEN - even here!
  return () => React.createElement('div', null, 'Mock');

});

// ❌ NEVER in beforeEach
beforeEach(() => {
  const utils = require('../utils'); // ❌ FORBIDDEN
});
```

**How to avoid require() in mocks:**
```typescript
// ✅ Return null instead of JSX
jest.mock('../Component', () => () => null);

// ✅ Return string instead of JSX
jest.mock('../LoadingSpinner', () => () => 'Loading...');

// ✅ Return children directly
jest.mock('../Wrapper', () => ({ children }) => children);

// ✅ Use jest.fn for tracking
jest.mock('../ButtonBar', () => jest.fn(({ children }) => children));
```

**Enforcement Checklist:**
- [ ] All module imports use ES6 `import` statements at file top
- [ ] ZERO `require()` calls anywhere in the file
- [ ] Mocked modules imported at top and cast to `jest.Mock` when needed
- [ ] Mock factories return simple values (null, strings, children) - NO React.createElement

### Rule 3: Use a Clear and Focused Test Structure

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

// Top-level describe for the component
describe('MyComponent', () => {
  // Nested describe for specific features
  describe('when loading', () => {
    it('should show the loading spinner', () => {
      jest.spyOn(myHooksModule, 'useCustomHook').mockReturnValue({ isLoading: true });
      render(<MyComponent />);
      expect(screen.getByRole('progressbar')).toBeVisible();
    });

    it('should not show the data grid', () => {
      jest.spyOn(myHooksModule, 'useCustomHook').mockReturnValue({ isLoading: true });
      render(<MyComponent />);
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('when data is loaded', () => {
    it('should show the data grid', () => {
      jest.spyOn(myHooksModule, 'useCustomHook').mockReturnValue({ isLoading: false, data: [...] });
      render(<MyComponent />);
      expect(screen.getByRole('grid')).toBeVisible();
    });
  });
});
```

**Requirements:**
- All tests wrapped in top-level `describe` block named after component
- Use nested `describe` blocks for related tests
- Use `it()` method (not `test()`)
- Each `it` block tests only a single state or interaction

### Rule 4: Use the Correct Render Function

- **`render`** from `'@testing-library/react'` - For simple, standalone components with no provider dependencies
- **`renderWithProviders`** from `'@console/shared/src/test-utils/unit-test-utils'` - For components requiring Redux or React Router

### Rule 5: Always Use screen for Queries

```typescript
import { render, screen } from '@testing-library/react';

// ✅ DO: Use the global 'screen' object
it('should find the heading', () => {
  render(<MyComponent />);
  const heading = screen.getByRole('heading', { name: /welcome/i });
  expect(heading).toBeVisible();
});

// ❌ AVOID: Destructuring queries from 'render'
it('should find the heading', () => {
  const { getByRole } = render(<MyComponent />);
  const heading = getByRole('heading', { name: /welcome/i });
  expect(heading).toBeVisible();
});
```

**Exception:** Use `within()` for scoped queries or when you need `container` for specific assertions.

### Rule 6: Prioritize Accessible Queries

**Query Priority (most to least preferred):**
1. `getByRole`
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByDisplayValue`
6. `getByAltText`
7. `getByTitle`
8. `getByTestId` (last resort only).  This might involve adding a `data-test` attribute to the implementation component element.

**Query Variants:**
- **`getBy*`** - Element expected to be present synchronously (throws if not found)
- **`queryBy*`** - Only for asserting element is NOT present
- **`findBy*`** - Element will appear asynchronously (returns Promise)

**Anti-pattern:** Avoid `container.querySelector` - it tests implementation details.

**Helpful Tip:** For iframe or markdown content, use `screen.getByRole('document')`.

### Rule 7: Text Matching Strategy

- **Exact text match** - Preferred when text is in a single node
- **Regex without `i` flag** - When text spans multiple wrapper nodes (avoid case-insensitive matching)

**Note:** Avoid case-insensitive matching based on Console UX text casing convention.

### Rule 8: Assertion Guidelines

```typescript
// ✅ GOOD: Tests accessible name + existence
expect(screen.getByRole('button', { name: 'Submit' })).toBeVisible();

// ❌ AVOID: Separate queries for same element
const button = screen.getByRole('button');
expect(button).toBeInTheDocument();
expect(screen.getByText('Submit')).toBeInTheDocument();
```

**When to use:**
- **`toBeVisible()`** - For elements users are expected to see or interact with
- **`toBeInTheDocument()`** - For structural elements or conditional rendering verification

**Anti-pattern:** Avoid weak assertions like `.toBeTruthy()` or `.toBeInTheDocument()` for visible elements.

### Rule 9: Use Shared verifyInputField Utility - MANDATORY for Form Fields

**CRITICAL:** When testing form input fields, **ALWAYS** use `verifyInputField` utility. This is strictly enforced.

#### When to Use verifyInputField

Use `verifyInputField` when your test needs to verify:
- ✅ Input field label exists and is associated with the input
- ✅ Input element renders correctly
- ✅ Initial/default value of the input
- ✅ Input can accept user input (onChange behavior)
- ✅ Help text appears below the field
- ✅ Required field indicator (`*`) is shown
- ✅ Field ID and accessibility attributes

**DO NOT** manually write separate assertions for each of these - use the utility instead.

#### Usage Examples

```typescript
import { verifyInputField } from '@console/shared/src/test-utils/unit-test-utils';

// ✅ GOOD: Use verifyInputField for comprehensive field testing
it('should render the Name field with label, input, and help text', async () => {
  render(<MyFormComponent />);

  await verifyInputField({
    inputLabel: 'Name',
    containerId: 'test-name-form',
    initialValue: 'test',
    testValue: 'test',
    helpText: 'Unique name for the resource',
    isRequired: true,
  });
});

// ✅ GOOD: Test multiple fields with verifyInputField
it('should render all form fields correctly', async () => {
  render(<MyFormComponent />);

  await verifyInputField({
    inputLabel: 'Name',
    containerId: 'test-name-form',
    initialValue: '',
    testValue: 'my-resource',
    isRequired: true,
  });

  await verifyInputField({
    inputLabel: 'Description',
    containerId: 'test-description-form',
    initialValue: '',
    testValue: 'A description',
    helpText: 'Optional description for this resource',
    isRequired: false,
  });
});

// ❌ BAD: Manual assertions for form fields
it('should render the Name field', async () => {
  render(<MyFormComponent />);

  // Don't do this - use verifyInputField instead!
  expect(screen.getByLabelText('Name')).toBeInTheDocument();
  expect(screen.getByLabelText('Name')).toHaveValue('');
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'test' } });
  expect(screen.getByLabelText('Name')).toHaveValue('test');
  expect(screen.getByText('Unique name for the resource')).toBeInTheDocument();
});
```

#### When NOT to Use verifyInputField

- ❌ Non-input form controls (Select, Dropdown, Checkbox, Radio)
- ❌ Buttons or action elements
- ❌ Read-only text displays
- ❌ Custom form components that aren't text inputs

For these cases, use standard RTL queries.

#### Enforcement Checklist

When testing form components:
- [ ] Identify all text input fields in the component
- [ ] Use `verifyInputField` for each text input field test
- [ ] Avoid manual label/input/helpText assertions
- [ ] Import `verifyInputField` from `'@console/shared/src/test-utils/unit-test-utils'`

### Rule 10: Test Conditional Rendering by Asserting Both States

```typescript
it('should show content when expanded', () => {
  render(<Collapsible />);

  // 1. Assert initial hidden state
  expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();

  // 2. Simulate user action
  fireEvent.click(screen.getByRole('button', { name: 'Expand' }));

  // 3. Assert final visible state
  expect(screen.getByText('Hidden content')).toBeVisible();
});
```

### Rule 11: Handle Asynchronous Behavior

```typescript
// Use findBy* to wait for an element to appear
const element = await screen.findByText('Loaded content');
expect(element).toBeVisible();

// Use waitFor for complex assertions
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

**Avoid Explicit act():** Rarely needed. `render`, `fireEvent`, `findBy*`, and `waitFor` already wrap operations in `act()`.

### Rule 12: Use Lifecycle Hooks for Setup and Cleanup

```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    jest.spyOn(myHooksModule, 'useCustomHook').mockReturnValue({ isLoading: false });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the default state', () => {
    render(<MyComponent />);
    // ...
  });

  it('should render a different state', () => {
    jest.spyOn(myHooksModule, 'useCustomHook').mockReturnValue({ isLoading: true });
    render(<MyComponent />);
    // ...
  });
});
```

### Rule 13: Scope Queries with within()

```typescript
import { render, screen, within } from '@testing-library/react';

render(<MyDashboard />);

const userProfileCard = screen.getByTestId('profile-card');

// Scope queries to only that card
const userName = within(userProfileCard).getByText(/john doe/i);
const editButton = within(userProfileCard).getByRole('button', { name: /edit/i });

expect(userName).toBeVisible();
expect(editButton).toBeVisible();
```

### Rule 14: Simulate User Events with fireEvent

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

render(<MyForm />);

const input = screen.getByLabelText(/name/i);
const button = screen.getByRole('button', { name: /submit/i });

// Simulate typing
fireEvent.change(input, { target: { value: 'John Doe' } });

// Simulate clicking
fireEvent.click(button);
```

**Note:** `userEvent` from `@testing-library/user-event` is not supported due to incompatible Jest version (will be updated after Jest upgrade).

### Rule 15: Test "Unhappy Paths" and Error States

```typescript
it('should display an error message when the API call fails', async () => {
  jest.spyOn(k8sModule, 'k8sGet').mockRejectedValue(new Error('API Error'));

  render(<MyComponent />);

  const errorMessage = await screen.findByText(/Could not load data/i);
  expect(errorMessage).toBeVisible();

  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
```

### Rule 16: Use screen.debug() for Help

```typescript
it('should find the element', () => {
  render(<MyComponent />);

  // If a query fails, use debug() to see the DOM
  // screen.debug();

  // You can also debug a specific element
  // const form = screen.getByRole('form');
  // screen.debug(form);

  const button = screen.getByRole('button', { name: /submit/i });
  expect(button).toBeVisible();
});
```

### Rule 17: Write Descriptive Test Titles

**Format:** `it('should [expected result] when [condition]')`

```typescript
// ✅ GOOD
it('should display an error when the API call fails')

// ❌ AVOID
it('works')
it('renders')
```

### Rule 18: Avoid Snapshot Tests

**DO NOT** use `toMatchSnapshot()`. Snapshot tests are brittle, give false security, and test implementation details.

### Rule 19: Render in Each Test by Default

**Default:** Call `render()` inside each `it` block for test isolation.

**May use `beforeEach` only if ALL tests in the block:**
- Are simple, synchronous tests
- Use the exact same props and initial state
- Only test different aspects of a single, unchanged render

### Rule 20: Use Centralized Test Data

Store mock data in centralized files (e.g., `__mocks__/k8sResourcesMocks.ts`). This:
- Mirrors production data structures
- Makes tests more representative
- Easier to maintain
- Catches type-related errors early

### Rule 21: Clean Up Unused Imports, Code, and Redundant Mocks

**MANDATORY:** After generating tests, perform cleanup to ensure code quality and maintainability.

#### Clean Up Unused Imports
Remove any imports that are not used in the test file:

```typescript
// ❌ BAD - Unused imports
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { k8sCreate, k8sPatch, k8sUpdate } from '@console/internal/module/k8s';
// ... but only using render, screen, fireEvent

// ✅ GOOD - Only what's needed
import { render, screen, fireEvent } from '@testing-library/react';
import { k8sCreate } from '@console/internal/module/k8s';
```

#### Remove Redundant Mocks
Only mock what's actually used in tests:

```typescript
// ❌ BAD - Mocking unused components
jest.mock('../ComponentA', () => () => null);
jest.mock('../ComponentB', () => () => null);
jest.mock('../ComponentC', () => () => null);
// ... but ComponentB and ComponentC are never rendered

// ✅ GOOD - Only mock what's used
jest.mock('../ComponentA', () => () => null);
```

#### Remove Duplicate or Redundant Tests
Avoid testing the same behavior multiple times:

```typescript
// ❌ BAD - Redundant tests
it('should render the button', () => {
  render(<MyComponent />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});

it('should display the button', () => {
  render(<MyComponent />);
  expect(screen.getByRole('button')).toBeVisible();
});

// ✅ GOOD - Single comprehensive test
it('should render the button', () => {
  render(<MyComponent />);
  expect(screen.getByRole('button', { name: 'Submit' })).toBeVisible();
});
```

#### Remove Commented Code
Delete commented-out code, debugging statements, and console.logs:

```typescript
// ❌ BAD - Commented code left in
it('should work', () => {
  render(<MyComponent />);
  // screen.debug(); // TODO: remove
  // const oldTest = screen.getByTestId('old-id');
  expect(screen.getByRole('button')).toBeVisible();
});

// ✅ GOOD - Clean, production-ready
it('should work', () => {
  render(<MyComponent />);
  expect(screen.getByRole('button')).toBeVisible();
});
```

#### Remove Unused Variables and Constants
Clean up any variables that are declared but never used:

```typescript
// ❌ BAD - Unused variables
it('should submit form', () => {
  const mockData = { foo: 'bar' };
  const unusedSpy = jest.spyOn(console, 'log');
  const onSubmit = jest.fn();

  render(<Form onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole('button'));

  expect(onSubmit).toHaveBeenCalled();
});

// ✅ GOOD - Only necessary variables
it('should submit form', () => {
  const onSubmit = jest.fn();

  render(<Form onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole('button'));

  expect(onSubmit).toHaveBeenCalled();
});
```

#### Remove Unnecessary Mock Static Methods
Only add static methods to mocks if they're actually called:

```typescript
// ❌ BAD - Mock has methods that are never called
jest.mock('../SelectorInput', () => Object.assign(
  jest.fn(() => null),
  {
    objectify: jest.fn(),
    arrayify: jest.fn(),
    someMethodNeverUsed: jest.fn(), // ← Never called
    anotherUnusedMethod: jest.fn(), // ← Never called
  }
));

// ✅ GOOD - Only methods that are used
jest.mock('../SelectorInput', () => Object.assign(
  jest.fn(() => null),
  {
    objectify: jest.fn(),
    arrayify: jest.fn(),
  }
));
```

**Cleanup Checklist:**
- [ ] All imports are used in the test file
- [ ] All mocked modules are referenced in tests
- [ ] No duplicate test cases
- [ ] No commented-out code (unless needed for documentation)
- [ ] No unused variables, constants, or spies
- [ ] Mock static methods are only those actually called
- [ ] No console.log, console.debug, or screen.debug() in final tests

### Rule 22: Generate Between 5-10 Tests Per Component

**IMPORTANT:** Generate between **5 and 10 focused, high-value tests** per component.

#### Why 5-10 Tests?

- **Minimum 5:** Ensures adequate coverage of critical functionality
- **Maximum 10:** Prevents over-testing and maintains quality focus
- **Quality over Quantity** - Forces focus on most important behaviors
- **Maintainability** - Easier to read, understand, and maintain
- **Faster Test Runs** - Reduced execution time
- **Better Code Reviews** - Reviewers can thoroughly examine each test
- **Reduced Redundancy** - Prevents testing the same thing multiple ways

#### How to Choose 5-10 Tests

**Priority Order:**

1. **Critical User Flows** (2-3 tests)
   - Primary user actions (e.g., form submission, data creation)
   - Most important happy path scenarios

2. **Error States** (2-3 tests)
   - API failures, validation errors
   - Edge cases that break functionality
   - "Unhappy paths" users might encounter

3. **Conditional Rendering** (2-3 tests)
   - Different states/modes of the component
   - Loading states, empty states
   - Permission-based rendering

4. **User Interactions** (1-2 tests)
   - Click handlers, input changes
   - Form validation
   - Navigation/routing

5. **Accessibility** (1 test)
   - Key accessible queries work
   - ARIA attributes present
   - Keyboard navigation (if complex)

**What NOT to Test (when limiting to 5-10):**

❌ Multiple variations of the same behavior
❌ Testing every prop combination
❌ Minor UI variations (button text, colors)
❌ Component existence tests
❌ Trivial rendering checks

#### Examples

**❌ BAD - Too Few Tests (3 tests):**
```typescript
describe('MyForm', () => {
  it('should render the form');
  it('should submit when valid');
  it('should show error when invalid');
});
```

**❌ BAD - Too Many Tests (15 tests):**
```typescript
describe('MyForm', () => {
  it('should render the form');
  it('should render the name input');
  it('should render the email input');
  it('should render the phone input');
  it('should render the submit button');
  it('should render the cancel button');
  it('should enable submit when name is filled');
  it('should enable submit when email is filled');
  it('should enable submit when all fields filled');
  it('should disable submit when name is empty');
  it('should disable submit when email is empty');
  it('should show error for invalid email');
  it('should show error for invalid phone');
  it('should submit when form is valid');
  it('should call onCancel when cancel clicked');
});
```

**✅ GOOD - Focused 8 Tests (within 5-10 range):**
```typescript
describe('MyForm', () => {
  // Critical Flow (2)
  it('should render all form fields and buttons');
  it('should submit form with valid data');

  // Error States (3)
  it('should show validation errors for invalid email');
  it('should display error message when submission fails');
  it('should disable submit button when required fields empty');

  // Conditional Rendering (2)
  it('should show loading state during submission');
  it('should populate form fields when editing existing data');

  // Accessibility (1)
  it('should have accessible form labels and buttons');
});
```

**✅ ALSO GOOD - Minimal 5 Tests (for simple components):**
```typescript
describe('SimpleButton', () => {
  // Critical Flow (2)
  it('should render button with correct label');
  it('should call onClick when clicked');

  // Error States (1)
  it('should be disabled when disabled prop is true');

  // Conditional Rendering (1)
  it('should show loading spinner when loading');

  // Accessibility (1)
  it('should have accessible button role and label');
});
```

#### When a Component Needs More Than 10 Tests

If a component is complex enough to need more than 10 tests, **it's a sign the component should be split**:

```typescript
// Instead of 20 tests for one large component:
describe('ComplexDashboard', () => {
  // 20 tests...
});

// Split into smaller components with focused tests:
describe('DashboardHeader', () => {
  // 5 tests
});

describe('DashboardFilters', () => {
  // 5 tests
});

describe('DashboardDataGrid', () => {
  // 7 tests
});

describe('DashboardActions', () => {
  // 3 tests
});
```

**5-10 Tests Rule Enforcement:**
- [ ] Total test count is between 5-10 per component
- [ ] Minimum 5 tests for adequate coverage
- [ ] Maximum 10 tests to maintain quality focus
- [ ] Each test covers unique, valuable behavior
- [ ] Tests prioritize critical user flows and error states
- [ ] No redundant or trivial tests included

### Rule 23: Zero act() Warnings - Strictly Enforced

**CRITICAL:** All tests **MUST** have **ZERO** act() warnings. This rule is strictly enforced.

#### What is an act() Warning?

```
Warning: An update to ComponentName inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
```

#### How to Fix act() Warnings

**Strategy 1: Wrap async interactions in waitFor**
```typescript
// ❌ BAD: Causes act() warning
fireEvent.click(button);
expect(screen.getByText('Updated')).toBeInTheDocument();

// ✅ GOOD: Use waitFor for async updates
fireEvent.click(button);
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

**Strategy 2: Use findBy* queries (preferred for new elements)**
```typescript
// ❌ BAD: Causes act() warning
fireEvent.click(button);
expect(screen.getByText('Loaded')).toBeInTheDocument();

// ✅ GOOD: Use findBy* which waits automatically
fireEvent.click(button);
expect(await screen.findByText('Loaded')).toBeInTheDocument();
```

**Strategy 3: Wrap test in act() when needed**
```typescript
// Import act from @testing-library/react
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ❌ BAD: Causes act() warning for dropdown/select interactions
const dropdown = screen.getByText('Select Option');
fireEvent.click(dropdown);

// ✅ GOOD: Wrap in act() for complex interactions
await act(async () => {
  fireEvent.click(dropdown);
});
const option = await screen.findByText('Option 1');
fireEvent.click(option);
```

**Strategy 4: Mock timers or async operations**
```typescript
// ❌ BAD: Causes act() warning from useEffect
render(<ComponentWithEffect />);

// ✅ GOOD: Wait for effects to complete
render(<ComponentWithEffect />);
await waitFor(() => {
  expect(screen.getByText('Effect completed')).toBeInTheDocument();
});
```

#### Common Causes of act() Warnings

1. **Dropdown/Select interactions** - PatternFly Select/Dropdown components
   - Solution: Wrap in `act()` or use `waitFor` after interaction

2. **Async state updates** - useEffect, setTimeout, promises
   - Solution: Use `findBy*` or `waitFor`

3. **Form submissions** - Forms that trigger async actions
   - Solution: Use `waitFor` to check for expected outcome

4. **Component cleanup** - Effects running after test completes
   - Solution: Ensure proper cleanup with `waitFor` or mock timers

#### Validation Commands

**Check for act() warnings:**
```bash
yarn test -- ComponentName.spec.tsx --no-coverage 2>&1 | grep -i "act()"
```

**Expected result:** No output (zero matches)

#### Enforcement Checklist

Before completing test generation:
- [ ] Run tests and capture full output
- [ ] Check for "not wrapped in act" warnings
- [ ] Fix ALL act() warnings using strategies above
- [ ] Re-run tests to verify zero warnings
- [ ] Tests must pass with ZERO act() warnings

**If ANY act() warnings exist → IMMEDIATELY FIX before completing**

### Rule 24: Never Use expect.anything() - Strictly Enforced

**CRITICAL:** Using `expect.anything()` defeats the purpose of testing. Always use specific, meaningful assertions.

#### Why expect.anything() is Forbidden

- ❌ Provides no value - test passes regardless of actual value
- ❌ Masks bugs - incorrect values will pass
- ❌ Reduces confidence - doesn't validate behavior
- ❌ Makes tests meaningless

#### Examples

```typescript
// ❌ BAD: expect.anything() provides no value
expect(StorageClassDropdown).toHaveBeenCalledWith(
  expect.objectContaining({
    id: 'storageclass-dropdown',
    name: 'storageClass',
  }),
  expect.anything(), // ❌ FORBIDDEN
);

// ✅ GOOD: Specific assertion or omit parameter
expect(StorageClassDropdown).toHaveBeenCalledWith(
  expect.objectContaining({
    id: 'storageclass-dropdown',
    name: 'storageClass',
  }),
  {}, // Specific value
);

// ❌ BAD: expect.anything() in object matching
expect(mockFn).toHaveBeenCalledWith({
  foo: 'bar',
  baz: expect.anything(), // ❌ FORBIDDEN
});

// ✅ GOOD: Specific value or use objectContaining without it
expect(mockFn).toHaveBeenCalledWith(
  expect.objectContaining({
    foo: 'bar',
    // Only test what matters
  }),
);

// ❌ BAD: expect.anything() for return values
const result = someFunction();
expect(result).toBe(expect.anything()); // ❌ FORBIDDEN

// ✅ GOOD: Specific assertion
const result = someFunction();
expect(result).toBe('expected-value');
expect(result).toBeDefined();
expect(result).toHaveProperty('key', 'value');
```

#### When You Think You Need expect.anything()

If you're tempted to use `expect.anything()`, consider these alternatives:

1. **Use `expect.objectContaining()` without the field**
   ```typescript
   // Only test fields that matter
   expect(mockFn).toHaveBeenCalledWith(
     expect.objectContaining({
       importantField: 'value',
       // Omit unimportant fields
     }),
   );
   ```

2. **Use specific type matchers**
   ```typescript
   expect(mockFn).toHaveBeenCalledWith(expect.any(String));
   expect(mockFn).toHaveBeenCalledWith(expect.any(Function));
   expect(mockFn).toHaveBeenCalledWith(expect.any(Object));
   ```

3. **Use custom matchers**
   ```typescript
   expect(mockFn).toHaveBeenCalledWith(
     expect.stringContaining('partial'),
   );
   expect(mockFn).toHaveBeenCalledWith(
     expect.arrayContaining(['item']),
   );
   ```

4. **Don't assert on it at all**
   ```typescript
   // If a parameter doesn't matter, don't test it
   expect(mockFn).toHaveBeenCalled();
   // Instead of: expect(mockFn).toHaveBeenCalledWith(expect.anything())
   ```

#### Enforcement

- ✅ All assertions must be specific and meaningful
- ❌ Zero `expect.anything()` in the entire test file
- ✅ Use `expect.any(Type)` when you need type checking
- ✅ Use `expect.objectContaining()` to test partial objects

**Validation Command:**
```bash
grep -n "expect.anything()" test-file.spec.tsx
# Must return nothing
```

### Rule 25: Prefer Specific Types Over `any`

**IMPORTANT:** While TypeScript is not strictly enforced in test files, prefer specific types when available, or leave untyped.

#### Why Specific Types Are Preferred

- ✅ Better IDE autocomplete and IntelliSense
- ✅ Catches bugs at development time
- ✅ Makes refactoring safer
- ✅ Documents expected data shapes
- ✅ Self-documenting code

#### Examples

```typescript
// ✅ PREFERRED: Specific type when available
const input = screen.getByRole('textbox') as HTMLInputElement;

// ✅ ACCEPTABLE: Use any for third-party missing types
const input = screen.getByRole('textbox') as any; // When HTMLInputElement type is not available

// ✅ PREFERRED: Specific type
const mockFn = jest.fn((data: K8sResourceKind) => data);

// ✅ ACCEPTABLE: Use any when specific type is unknown
const mockFn = jest.fn((data: any) => data);

// ✅ PREFERRED: Specific array type
const items: PodDisruptionBudgetKind[] = [];

// ✅ ACCEPTABLE: Use any[] when item types vary or are unknown
const items: any[] = [];

// ✅ PREFERRED: Specific object type
const props: CreatePVCFormProps = {};

// ✅ ACCEPTABLE: Use any for dynamic props
const props: { [key: string]: any } = {};
```

#### Prefer These Approaches When Possible

1. **Import actual types from the codebase**
   ```typescript
   import { K8sResourceKind } from '../../module/k8s';
   const resource: K8sResourceKind = { ... };
   ```

2. **Use built-in DOM types**
   ```typescript
   const input = screen.getByRole('textbox') as HTMLInputElement;
   const button = screen.getByRole('button') as HTMLButtonElement;
   ```

3. **Use jest.Mock for type safety**
   ```typescript
   (k8sCreate as jest.Mock).mockResolvedValue(resource);
   ```

4. **Use generics when appropriate**
   ```typescript
   function mockComponent<T extends object>(props: T) {
     return props;
   }
   ```

5. **Use Record for object types**
   ```typescript
   const config: Record<string, boolean> = {};
   ```

#### Guidelines

- ✅ **Prefer** specific types when they're readily available
- ✅ **Use** `any` for third-party missing types rather than leaving untyped
- ✅ **Import** types from codebase when possible
- ✅ **Use** `as jest.Mock` for mocked functions
- ✅ **Document** with comments when using `any` for clarity

#### When to Use `any`

**Acceptable use cases:**
- Third-party library types are missing or broken
- Complex mock objects where specific typing is impractical
- Dynamic data structures in test fixtures
- Temporary workarounds for type issues

**Best practice:** Add a comment explaining why `any` is used:
```typescript
// Using any because PatternFly types don't export this interface
const mockProps: any = { ... };

// Third-party mock with complex generic types
const mockFn = jest.fn() as any;
```

### Rule 26: Add data-test Attributes as Last Resort

**IMPORTANT:** When high-priority queries (getByRole, getByLabelText, etc.) are impossible or unrealistic, add `data-test` attributes to the implementation file and use `getByTestId` in tests.

#### When to Add data-test Attributes

**Use `data-test` only when:**
- ✅ Element has no semantic role
- ✅ Element has no accessible label or text
- ✅ Multiple identical elements exist and cannot be distinguished
- ✅ Element is dynamically generated with no predictable content
- ✅ Using text queries would be too brittle (frequently changing text)

**DO NOT use `data-test` when:**
- ❌ Element has a semantic role (button, textbox, checkbox, etc.)
- ❌ Element has accessible label or placeholder text
- ❌ Element has visible text that can be queried
- ❌ You're just being lazy - try harder to find accessible queries first

#### Implementation Pattern

**Step 1: Try all accessible queries first**
```typescript
// ✅ Try these first
screen.getByRole('button', { name: 'Submit' });
screen.getByLabelText('Email address');
screen.getByPlaceholderText('Enter your email');
screen.getByText('Welcome back');
```

**Step 2: If truly impossible, add data-test to implementation file**
```tsx
// In Component.tsx - add data-test attribute
export const MyComponent = () => (
  <div>
    {/* This element has no role, label, or stable text */}
    <div className="custom-widget" data-test="custom-widget">
      <svg>...</svg>
    </div>
  </div>
);
```

**Step 3: Use getByTestId in test file**
```typescript
// In Component.spec.tsx
it('should render the custom widget', () => {
  render(<MyComponent />);

  const widget = screen.getByTestId('custom-widget');
  expect(widget).toBeVisible();
});
```

#### Naming Convention for data-test

Use kebab-case and be descriptive:
- ✅ `data-test="user-profile-card"`
- ✅ `data-test="deployment-status-icon"`
- ✅ `data-test="pod-list-table"`
- ❌ `data-test="div1"` (not descriptive)
- ❌ `data-test="UserProfileCard"` (not kebab-case)

#### Examples

**❌ BAD - Unnecessary data-test usage:**
```typescript
// Component has a button with text - use getByRole instead
<button data-test="submit-button">Submit</button>

// Test - don't do this
const button = screen.getByTestId('submit-button'); // ❌

// Test - do this instead
const button = screen.getByRole('button', { name: 'Submit' }); // ✅
```

**✅ GOOD - Legitimate data-test usage:**
```typescript
// Component has icon with no accessible attributes
<span className="status-icon" data-test="deployment-status-icon">
  <StatusIcon status={status} />
</span>

// Test - this is acceptable
const icon = screen.getByTestId('deployment-status-icon');
expect(icon).toHaveClass('status-icon');
```

**✅ GOOD - Multiple identical elements:**
```typescript
// Component renders list of similar items
<div data-test="pod-list">
  {pods.map(pod => (
    <div key={pod.id} data-test={`pod-item-${pod.id}`}>
      <PodIcon />
    </div>
  ))}
</div>

// Test - query by specific pod
const podItem = screen.getByTestId('pod-item-abc123');
expect(podItem).toBeVisible();
```

#### Enforcement Checklist

Before adding `data-test`:
- [ ] Attempted `getByRole` with accessible name
- [ ] Attempted `getByLabelText`
- [ ] Attempted `getByPlaceholderText`
- [ ] Attempted `getByText` with partial matching
- [ ] Confirmed element truly has no accessible query option
- [ ] Added descriptive kebab-case `data-test` value
- [ ] Documented in test comments why `getByTestId` is necessary

**Remember:** Every `data-test` attribute is a missed opportunity for accessibility. Only use as a last resort.

---

## Instructions for Test Generation

### Step 0: Detect Component to Test (When No Argument Provided)

**If no component path is provided as an argument**, follow this intelligent detection workflow:

1. **Run git diff to find changed files**:
   ```bash
   git diff --name-only HEAD
   ```

2. **Filter for React components**:
   - Include files matching: `*.tsx`, `*.jsx`
   - Exclude files matching:
     - `*.spec.tsx`, `*.spec.jsx`, `*.test.tsx`, `*.test.jsx` (test files)
     - `*.types.ts`, `*.types.tsx` (type definition files)
     - Files in `__mocks__/`, `__tests__/` directories
     - `*utils*.ts`, `*utils*.tsx`, `*helpers*.ts` (utility files)
     - `*constants*.ts`, `*types*.ts` (non-component files)

3. **Validate components**:
   - Read each filtered file
   - Check if file contains React component exports:
     - `export const ComponentName: React.FC`
     - `export default function ComponentName`
     - `export function ComponentName`
     - `class ComponentName extends React.Component`
   - Exclude files that only export types, interfaces, or constants

4. **Present detected components to user**:
   - If 1 component found: Ask user to confirm
   - If multiple components found: Present numbered list and ask user to select
   - Format: `[1] packages/console-app/src/components/MyComponent.tsx`

5. **Fallback if no components detected**:
   - Inform user: "No React components found in git diff"
   - Ask user to provide component path manually
   - Suggest using `@` for file autocomplete

**Example interaction:**
```
No arguments provided. Checking git diff for component changes...

Found 3 React components modified:
[1] packages/console-app/src/components/forms/CreatePVCForm.tsx
[2] packages/console-shared/src/components/dashboard/UtilizationCard.tsx
[3] public/components/modals/DeleteModal.tsx

Which component would you like to generate tests for? (Enter number or 'all')
```

### Step 1: Analyze the Component

When generating tests for React components:

1. **Analyze the component** to understand its user-facing behavior
2. **Identify test scenarios** covering:
   - Initial render state
   - User interactions (clicks, input, etc.)
   - Conditional rendering
   - Async operations
   - Edge cases and error states
3. **Prioritize test scenarios** - Generate **between 5-10 tests** based on component complexity (Rule 22)
   - **Simple components (5-6 tests):** Basic rendering, interactions, and accessibility
   - **Medium components (7-8 tests):** Add conditional rendering and error states
   - **Complex components (9-10 tests):** Full coverage including async operations

   **Distribution guideline:**
   - 2-3 Critical User Flows
   - 2-3 Error States
   - 1-3 Conditional Rendering
   - 1-2 User Interactions
   - 1 Accessibility
4. **Generate tests** following all 26 rules above
5. **Use appropriate queries** based on the priority hierarchy (Rule 26 for data-test)
6. **Use `verifyInputField` for text input fields** - strictly enforce Rule 9
7. **Write meaningful assertions** that validate user experience
8. **Include proper TypeScript types** for type safety
9. **Avoid testing implementation details** - focus on behavior
10. **Generate 5-10 tests** based on component complexity (Rule 22)
    - Minimum 5 tests for adequate coverage
    - Maximum 10 tests for quality focus
11. **Ensure ZERO act() warnings** - strictly enforce Rule 23

### ⚠️ CRITICAL ENFORCEMENT: ES6 Imports Only - ZERO TOLERANCE

## 🚫 ABSOLUTE RULE: NO require() ANYWHERE

**BEFORE GENERATING ANY TEST:**
1. ✅ Import ALL dependencies at the top using ES6 `import` statements
2. ✅ Import mocked modules (k8s, history, etc.) to use in test bodies
3. 🚫 **ZERO `require()` calls ANYWHERE in the file - NO EXCEPTIONS**
4. ✅ Mock factories return simple values (null, strings, children) - NO React.createElement
5. ✅ Cast mocked imports to `jest.Mock` when calling `.mockResolvedValue()` etc.
6. ✅ **Import `verifyInputField` for form components** - Rule 9 strictly enforced

**Code Generation Pattern:**
```typescript
// ✅ ALWAYS - ES6 imports at file top
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { k8sCreate } from '@console/internal/module/k8s';
import { history } from '@console/internal/components/utils';
import { verifyInputField } from '@console/shared/src/test-utils/unit-test-utils'; // For form components

// ✅ ALWAYS - Simple mocks without require()
jest.mock('../Component', () => () => null);
jest.mock('../ButtonBar', () => ({ children }) => children);

// ✅ ALWAYS - Use imported modules in tests
it('should work', () => {
  (k8sCreate as jest.Mock).mockResolvedValue({});
  jest.spyOn(history, 'push');
});

// ✅ ALWAYS - Use verifyInputField for form fields (Rule 9)
it('should render form field correctly', async () => {
  render(<MyFormComponent />);

  await verifyInputField({
    inputLabel: 'Name',
    containerId: 'name-field',
    initialValue: '',
    testValue: 'my-resource',
    isRequired: true,
  });
});

// ❌ NEVER - require() in test body
it('should work', () => {
  const { k8sCreate } = require('@console/internal/module/k8s'); // ❌ FORBIDDEN
});

// ❌ NEVER - require() in mock factory
jest.mock('../Component', () => {
  const React = require('react'); // ❌ FORBIDDEN ANYWHERE
  return () => React.createElement('div');
});

// ❌ NEVER - Manual assertions for form fields
it('should render Name field', () => {
  render(<MyFormComponent />);
  expect(screen.getByLabelText('Name')).toBeInTheDocument(); // ❌ Use verifyInputField instead
});
```

---

## Automated Test Generation Workflow

**IMPORTANT: Follow this fully automated workflow with mandatory test execution:**

### 1. Auto-detect Test File Name
- **DO NOT** ask the user for the test file name or any permissions
- Automatically determine test file name based on component file name
- Use pattern: `ComponentName.spec.tsx` (or `.spec.ts` for non-JSX files)
- Place test file in `__tests__/` directory within component directory
- Inform the user which test file will be created (e.g., `Creating MyComponent.spec.tsx...`)

### 2. Validate ES6 Import Usage (CRITICAL) - ZERO TOLERANCE

## 🚫 MANDATORY VALIDATION: NO require() ANYWHERE

**BEFORE running tests, verify:**
- ✅ All dependencies imported at file top using ES6 `import`
- 🚫 **ZERO `require()` calls ANYWHERE in the file**
- ✅ Mock factories return simple values (null, strings, children)
- ❌ NO React.createElement or React imports needed in mocks

**Validation Command:**
```bash
# Check for require() - result MUST be empty or ONLY jest.requireActual
grep -n "require(" path/to/test.spec.tsx
```

**Expected result:**
```
# ONLY acceptable pattern (if needed for partial mocks):
12:  ...jest.requireActual('@console/internal/module/k8s'),

# Everything else is FORBIDDEN
```

If **ANY** `require()` found that is NOT `jest.requireActual` → **IMMEDIATELY FIX** before proceeding.

### 3. Mandatory Test Execution and Validation (Fully Autonomous)


**Follow this step-by-step workflow and track progress internally:**

#### Step 1: Run Generated Tests (☐) - MANDATORY FIRST STEP
- After validating ES6 imports, **IMMEDIATELY** run tests using:
  ```bash
  yarn test -- ComponentName.spec.tsx --no-coverage
  ```
- **REQUIRED**: Capture full test output including all failures and warnings
- **DO NOT** proceed until you've run the tests at least once
- This step is **NON-NEGOTIABLE** - you MUST execute tests to validate they work

#### Step 2: Fix Any Test Failures (☐)
- Analyze **ALL** test failures from the output
- Fix issues systematically in priority order:
  1. 🚫 **ANY `require()` found → Replace with ES6 imports or simple mocks**
  2. Syntax errors and import errors
  3. Failed assertions (update test logic or fix queries)
  4. Type errors (add proper types or use `as jest.Mock`)
  5. Missing mocks or incorrect mock implementations
  6. ⚠️ **Missing `verifyInputField` for form fields** - See Rule 9
- Re-run tests after each significant fix
- **DO NOT** proceed to Step 3 until all test failures are resolved

#### Step 3: Verify All Tests Pass (☐)
- Confirm test output shows:
  ```
  Test Suites: 1 passed, 1 total
  Tests:       X passed, X total
  ```
- Ensure **100% pass rate** with no skipped or failing tests
- **DO NOT** proceed to Step 4 until all tests pass

#### Step 4: Fix act() Warnings (☐)
- Scan test output for any "not wrapped in act(...)" warnings
- Fix **EVERY** act() warning using Rule 23 strategies:
  - Wrap async interactions in `waitFor`
  - Use `findBy*` queries for async elements
  - Add `await waitFor()` after dropdown/select interactions
  - Ensure async state updates are properly awaited
- Re-run tests after fixing warnings
- **DO NOT** complete until output has ZERO act() warnings
- Expected: Clean output with no "Warning: An update to" messages

#### Step 5: Run yarn build Validation (☐)
- **CRITICAL**: Run yarn build to catch TypeScript/ESLint errors
  ```bash
  yarn build 2>&1 | grep -A 5 "test-file-name.spec.tsx"
  ```
- Check for:
  - ❌ Unused imports (including React imports)
  - ❌ Unused variables
  - ❌ TypeScript type errors
  - ❌ ESLint violations
- Fix **ALL** build errors and warnings for the test file
- **DO NOT** complete until yarn build passes cleanly for test file
- Expected: No errors or warnings for the test file in build output

#### Iteration Loop
- After each fix, re-run tests and check:
  - ✅ All tests pass (Step 3)
  - ✅ No warnings in output (Step 4)
  - ✅ yarn build passes for test file (Step 5)
  - ✅ No console errors or deprecation warnings
  - ✅ **ZERO act() warnings** (strictly enforced)
  - ✅ **Form fields use `verifyInputField`** (Rule 9 - strictly enforced)
  - 🚫 **ZERO `require()` anywhere (except `jest.requireActual` for partial mocks)**
  - 🚫 **NO unused imports** (React, etc.)
- Continue iterating until **ALL** criteria above are met

### 4. Clean Up Code (MANDATORY)

**After all tests pass, perform cleanup following Rule 21:**

#### A. Remove Unused Imports
```bash
# Check for unused imports (use your IDE or manual review)
# Remove any imports not referenced in the file
```

**Examples:**
- ✅ Remove `within` if not using scoped queries
- ✅ Remove `waitFor` if only using `findBy*`
- ✅ Remove unused mock imports

#### B. Remove Redundant Mocks
```typescript
// Check each jest.mock() - is the mocked module actually used?
// Remove mocks for components that are never rendered
```

#### C. Remove Duplicate Tests
- Scan for tests that verify the same behavior
- Consolidate or remove duplicates
- Keep the most comprehensive test

#### D. Remove Debugging Code
```typescript
// ❌ Remove before finalizing
// screen.debug();
// console.log('test data:', data);
```

#### E. Remove Unused Variables
- Remove variables that are declared but never used
- Remove spy mocks that are never asserted

#### F. Clean Mock Static Methods
- Only keep static methods that are actually called in tests
- Remove unused helper methods from mocks

**Cleanup Commands:**
```bash
# Check for commented code
grep -n "// screen.debug\|// console\|// TODO" test-file.spec.tsx

# Check for unused imports (TypeScript will warn)
# Check IDE/editor warnings
```

**Cleanup Verification:**
- [ ] No unused imports
- [ ] No unused mocks
- [ ] No duplicate tests
- [ ] No commented debugging code
- [ ] No unused variables
- [ ] Only necessary mock methods
- [ ] **Test count is 5-10** (Rule 22 - minimum 5, maximum 10)

### 5. Success Criteria - ZERO TOLERANCE

**ALL of the following must be true (corresponds to Step 1-5 workflow):**

- ✅ Git diff detection for automatic component discovery (when no args provided)
- ✅ Mandatory test execution to validate tests pass
- ✅ Iterative fixing until 100% pass rate achieved

#### Test Quality (Steps 1-5 Complete)
- ✅ **Step 1 Complete:** Tests MUST be executed at least once (MANDATORY)
- ✅ **Step 2 Complete:** All test failures resolved
- ✅ **Step 3 Complete:** Tests must have 100% pass rate (MANDATORY)
- ✅ **Step 4 Complete:** Zero act() warnings (Rule 23 - strictly enforced)
- ✅ **Step 5 Complete:** yarn build passes with no errors for test file
- ✅ Zero warnings in test output
- ✅ Clean console output (no errors, warnings, or deprecation notices)
- ✅ **Test count is 5-10** (Rule 22 - minimum 5 for adequate coverage, maximum 10 for quality focus)

#### Code Quality (ES6 & Mocking)
- 🚫 **ZERO `require()` in the file (except `jest.requireActual` for partial mocks)**
- ✅ All mocks use simple return values (null, strings, children)
- ✅ NO React.createElement in any mock
- ✅ All imports are ES6 `import` statements
- ✅ **Use `verifyInputField` for all text input fields** (Rule 9 - strictly enforced)

#### Code Cleanliness (Rule 21)
- ✅ **No unused imports** - every import is referenced
- ✅ **No unused mocks** - every jest.mock() is for components actually used
- ✅ **No duplicate tests** - each test covers unique behavior
- ✅ **No commented code** - no debugging code, screen.debug(), console.log()
- ✅ **No unused variables** - all declared variables are used
- ✅ **Clean mock methods** - only static methods that are called

**Final Validation Commands:**
```bash
# 1. Verify ZERO require() violations
grep "require(" test-file.spec.tsx | grep -v "jest.requireActual"
# Must return nothing

# 2. Verify ZERO act() warnings (Rule 23)
 test -- test-file.spec.tsx --no-coverage 2>&1 | grep -i "act()"
# Must return nothing (or only the test name that contains "act" if any)

# 3. Verify ZERO expect.anything() usage (Rule 24)
grep -n "expect.anything()" test-file.spec.tsx
# Must return nothing

# 4. Verify verifyInputField usage for form components (Rule 9)
# If component has text input fields, verify the utility is imported and used
grep -q "verifyInputField" test-file.spec.tsx && echo "✅ verifyInputField imported" || echo "⚠️  Check if form fields should use verifyInputField"

# 5. Verify no debugging code
grep -n "screen.debug()\|console.log\|console.debug" test-file.spec.tsx
# Must return nothing

# 6. Verify test count is 5-10 (Rule 22)
grep -c "^\s*it('.*)" test-file.spec.tsx
# Must return between 5 and 10

# 7. Verify yarn build passes for test file (Rule 21 + Step 5)
yarn build 2>&1 | grep -A 5 "test-file.spec.tsx"
# Must return "No errors found in test-file.spec.tsx" OR no output
# Check for unused imports (React, etc.), unused variables, TypeScript errors
```

**If ANY validation fails → FIX IMMEDIATELY before completing**

**Note on Test Count:**
- If test count < 5: Add more tests to cover critical functionality
  - Ensure critical user flows are tested
  - Add error state coverage
  - Include accessibility tests
- If test count > 10: Review and prioritize the most valuable tests
  - Remove redundant or low-value tests
  - Keep only the most important 10 tests
  - Consider splitting large components into smaller ones
- Ideal range: 5-10 tests based on component complexity

---

**Remember:** "The more your tests resemble the way your software is used, the more confidence they can give you."

Generate comprehensive, well-structured test suites that validate the component works correctly from a user's perspective.

**Final Checklist Before Completion:**

- ✅ Git diff detection implemented (when no args provided)
- ✅ Tests EXECUTED and validated to pass (MANDATORY)
- ✅ Iterative fixing applied until 100% pass rate

**Test Quality:**
- ✅ All 26 rules followed (especially Rule 9, Rule 22, Rule 23, Rule 24, Rule 26)
- ✅ **Tests EXECUTED at least once** (MANDATORY - not optional)
- ✅ All tests pass (100% pass rate - MANDATORY)
- ✅ No console warnings or errors
- ✅ ZERO act() warnings (Rule 23)
- ✅ No expect.anything() usage (Rule 24)
- ✅ Prefer specific types over `any` (Rule 25)
- ✅ Use data-test only as last resort (Rule 26)
- ✅ Form fields use `verifyInputField` utility (Rule 9)
- ✅ **Test count is 5-10** (Rule 22 - minimum 5, maximum 10)

**Code Quality:**
- ✅ Clean code (no unused imports/variables)
- ✅ ES6 imports only (zero require() calls)
- ✅ yarn build passes for test file
