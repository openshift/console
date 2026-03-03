# TESTING

## Frontend Test Types

### Unit tests
Focuses on testing individual React components, hooks, and utilities in isolation.

- Framework: Jest
- Libraries: `@testing-library/react`, `@testing-library/jest-dom`

### Integration tests
- Tool: Cypress
- Specialized test suites for components:
  - Core Console
  - OLM (Operator Lifecycle Manager)
  - Dev Console
  - Shipwright
  - Web Terminal
  - Telemetry
  - Knative
  - Helm
  - Topology
- Supports headless and interactive modes

## Unit Testing with Jest and React Testing Library

When generating unit tests, ALWAYS use the `gen-rtl-test` skill to create tests that follow our best practices and conventions.

### Testing Best Practices

1. **User-Centric Testing** - Test what users see and interact with.
   **DO NOT test:**
   - Internal component state
   - Private component methods
   - Props passed to child components
   - CSS class names or styles
   - Component structure (e.g., `expect(container.firstChild).toBe...`)

2. **Accessibility-First** - Queries match how screen readers and users interact with the UI

3. **Semantic Over Generic** - Always prefer role-based queries (e.g., `getByRole`) over generic selectors

4. **DRY Helpers** - Use reusable function such as `renderWithProviders`, `renderHookWithProviders` in `frontend/packages/console-shared/src/test-utils`. Extract repetitive setup not covered by these helpers into custom functions if needed.

5. **Async-Aware** - Handle asynchronous updates with `findBy*` and `waitFor`

6. **TypeScript Safety** - Use proper types for props, state, and mock data

7. **Arrange-Act-Assert (AAA) Pattern** - Structure tests logically:
   - **Arrange:** Render component with mocks
   - **Act:** Perform user actions
   - **Assert:** Verify expected state

### Test File Co-location and Naming Convention

- Test file must be in `__tests__/` directory within component directory
- Test file must have same name as implementation file
- Use `.spec.tsx` extension

```
MyComponentDirectory/
├── __tests__/
│   └── MyComponent.spec.tsx
└── MyComponent.tsx
```

### Mocking Strategies

When mocking is necessary:

- **ALWAYS** use ESM `import` statements at the top of the file
- **NEVER** use `require('react')` or `React.createElement()` in mocks
- Prefer `jest.mock()` for module mocks and `jest.fn()` for component mocks instead of `jest.spyOn()`
- Keep mocks **simple** - return `null`, strings, or `children` directly
- Use `jest.fn(() => null)` for simple component mocks
- Use `jest.fn(() => 'ComponentName')` for mocks that need to display text
- Use `jest.fn((props) => props.children)` for wrapper components

**Correct Mock Patterns:**

```typescript
// CORRECT - Return null
jest.mock('../MyComponent', () => () => null);

// CORRECT - Return string
jest.mock('../LoadingSpinner', () => () => 'Loading...');

// CORRECT - Return children directly
jest.mock('../Wrapper', () => ({ children }) => children);

// CORRECT - Use jest.fn for tracking calls
jest.mock('../ButtonBar', () => jest.fn(({ children }) => children));

// FORBIDDEN - require()
jest.mock('../Component', () => {
  const React = require('react'); // NEVER
  return () => React.createElement('div');
});

// FORBIDDEN - JSX in mocks
jest.mock('../Component', () => () => <div>Mock</div>);
```

**Mock Custom Hooks with jest.fn()**

```typescript
jest.mock("../useCustomHook", () => ({
  useCustomHook: jest.fn(() => [
    /* mock data */
  ]),
}));
```

**Test user behavior, not implementation**

```typescript
// GOOD - Testing user-visible behavior
expect(screen.getByRole('heading', { name: 'Resource Details' })).toBeVisible();

// BAD - Testing implementation
expect(wrapper.find(DetailsPage).props()).toEqual({...});
```

**Clean up mocks**

```typescript
// GOOD - Proper cleanup
afterEach(() => {
  jest.restoreAllMocks();
});

// BAD - No cleanup
jest.spyOn(module, "function");
```

## End-to-End Testing

Integration/E2E tests validate full user workflows against a real/simulated OpenShift cluster using Cypress + Cucumber (Gherkin BDD).

- **Focus Areas**: Core Console, OLM, Dev Console, Shipwright, Web Terminal, Telemetry, Knative, Helm, Topology.
- **Key Characteristics**: Gherkin scenarios (.feature files) + step definitions; supports headless/interactive modes; integrates axe-core for a11y.

- **Structure**: Use Gherkin for scenarios (Given/When/Then) in .feature files; implement steps in JS/TS.
- **Selectors**: Prefer `data-test` attributes (e.g., `cy.get('[data-test="create-deployment"]')`) over brittle CSS/ARIA.
- **Async Handling**: Use `cy.wait` sparingly; prefer `cy.intercept` for API mocks + assertions.
- **Mocking**: MSW for API responses; mock external services (e.g., K8s API) to avoid cluster dependency.

### Running E2E Tests (Setup & Commands)

For full prerequisites (cluster login, Cypress install), see [README.md#integration-tests](README.md#integration-tests).

See `package.json` scripts for a list of available commands to run E2E tests in different modes.
- `yarn test-cypress-<suite>` to open an interactive window for a specific Cypress test suite (e.g., `yarn test-cypress-olm`, `yarn test-cypress-devconsole`). **AI agents may struggle with interactive mode**.
- `yarn test-cypress-<suite>-headless` to run the same suite in headless mode (e.g., `yarn test-cypress-olm-headless`)
- `yarn test-cypress-<suite>-nightly` runs an extended suite of tests in headless mode, intended for CI/nightly runs (e.g., `yarn test-cypress-olm-nightly`)
