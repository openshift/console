# OpenShift Console Styleguide

## Directory and File Names

- Use lowercase dash-separated names for all files (to avoid git issues with case-insensitive file systems)
- Exceptions are files which have their own naming conventions (eg Dockerfile, Makefile, README)

## Go

- All go code should be formatted by gofmt
- Import statement pkgs should be separated into 3 groups: stdlib, external dependency, current project.
- TESTS: Should follow the "test tables" convention.

### Go Best Practices

- **Package organization**: Follow domain-based structure in `/pkg/` (auth, server, proxy, etc.)
- **Error handling**: Use typed errors with `NewInvalidFlagError`, `FatalIfFailed` patterns
- **HTTP handlers**: Use middleware composition, method-based routing, consistent JSON responses via `serverutils.SendResponse`
- **Security**: Apply security headers, CSRF protection, proper token validation
- **Logging**: Use `klog` with appropriate levels (V(4) for debug, Error, Fatal)
- **Configuration**: YAML-based config with comprehensive flag validation
- **Testing**: Table-driven tests, `httptest` for HTTP handlers, proper cleanup functions
- **K8s clients**: Separate config from client creation, use both typed and dynamic clients
- **Interfaces**: Define clear interfaces for testability and dependency injection

## SCSS/CSS

- When possible, avoid writing any custom SCSS/CSS. Use PatternFly for all styling.
- All SCSS files are imported from the top-level file: `/frontend/public/style.scss`
- No need to import SCSS files as dependencies of others, top-level file handles this.
- All SCSS files should be prefixed with an underscore, (eg `_my-custom-file.scss`).
- When possible, avoid element selectors. Class selectors are preferred.
- Scope all classes with a recognizable prefix to avoid collisions with any imported CSS (this project uses `co-` by convention).
- Class names should be all lowercase and dash-separated.
- All SCSS variables should be scoped within their component.
- We use [BEM](http://getbem.com) naming conventions.

## TypeScript and JavaScript

- New code MUST be written in TypeScript, not JavaScript.
- Prefer functional programming patterns and immutable data structures
- Use React functional components with hooks instead of class components
- Run the linter and follow all rules defined in .eslintrc
- Never use absolute paths in code. The app should be able to run behind a proxy under an arbitrary path
- TESTS: Should follow a similar "test tables" convention as used in Go where applicable.

### Frontend Patterns

- **State Management**: React hooks and Context API (migrating away from legacy Redux/Immutable.js)
- **Hooks**: Use existing hooks from `console-shared` when possible (`useK8sWatchResource`, `useUserSettings`, etc.)
- **API calls**: Use k8s resource hooks for data fetching, `consoleFetchJSON` for HTTP requests
- **Routing**: Plugin routes go in plugin-specific route files
- **Extensions**: Use console extension points for plugin integration
- **Types**: Check existing types in `console-shared` before creating new ones
- **Dynamic Plugins**: Use console extension points for plugin integration.
- **Plugin SDK Changes**: Any updates to `console-dynamic-plugin-sdk` should aim to maintain backward compatibility as it's a public API. Use the `plugin-api-review` skill to vet any changes for public API impact and ensure proper documentation updates.
- **Styling**: SCSS modules co-located with components, PatternFly design system components, avoid any SCSS/CSS if possible
- **Accessibility**: Follow WCAG 2.1 AA standards, use semantic HTML, ARIA labels where needed, ensure keyboard navigation, test with screen readers
- **i18n**: Use `useTranslation('namespace')` hook with `key` format for translation keys
- **Error Handling**: Use ErrorBoundary components and graceful degradation patterns
- **File Naming**: PascalCase for components, kebab-case for utilities, `*.spec.ts(x)` for tests

### Performance

Where available, use the [`vercel-react-best-practices` skill](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/SKILL.md) for more detailed performance optimizations guidelines.

#### Optimize re-renders

```typescript
// GOOD - Memoized callback
const handleClick = useCallback(() => doSomething(), []);

// BAD - Recreates function every render
const handleClick = () => doSomething();
```

```typescript
// GOOD - useMemo for expensive filtering
const filteredResources = useMemo(
  () => resources.filter(r => r.status === 'Running'),
  [resources]
);

// BAD - Filters on every render
const filteredResources = resources.filter(r => r.status === 'Running');
```

#### Lazy loading

```typescript
// GOOD - Lazy load heavy components
const HeavyComponent = React.lazy(() => import("./HeavyComponent"));
```

### Patterns

#### TypeScript type safety

AI agents should flag use of `any` type

- Suggest proper type definitions
- Check that null/undefined are handled: `string | undefined`
- Verify exported types for reusable components

```typescript
// GOOD - Proper typing
interface ResourceData {
  name: string;
  namespace: string;
}
const data: ResourceData = fetchData();

// BAD - Using 'any'
const data: any = fetchData();
```

#### Type component props properly

```typescript
// GOOD - Reuse from existing component
interface MyComponentProps {
  appendTo?: React.ComponentProps<typeof Popper>["appendTo"];
}

// BAD - Duplicating type definitions
interface MyComponentProps {
  appendTo: HTMLElement | (() => HTMLElement) | "inline";
}
```

#### Use proper hooks

```typescript
// GOOD - Use usePluginInfo for plugin data
const pluginInfoEntries = usePluginInfo();
const loadedPlugins = useMemo(
  () => pluginInfoEntries.find((entry) => entry.status === 'loaded'),
  [pluginInfoEntries],
);
```

### Avoid deprecated components

Check for these deprecation signals:

1. **JSDoc `@deprecated` tags** in component source
2. **Import paths containing `/deprecated`**
3. **`DEPRECATED_` file name prefix**

```typescript
// BAD - Deprecated import path
import { Modal } from "@patternfly/react-core/deprecated";

// GOOD - Use non-deprecated path
import { Modal } from "@patternfly/react-core";
```

### Importing from barrel files and circular dependencies

**Problem:** Barrel exports (index.ts files that re-export multiple modules) may create circular dependency cycles.

```typescript
// GOOD - Direct import to specific file
import { Component } from "@console/shared/src/components/Component";

// BAD - index.ts barrel export that may cause circular dependency and slows down build performance
import { Component } from "@console/shared";
```

### Import Management

```typescript
// GOOD - Use import type for types
import type { K8sResourceCommon } from "@console/internal/module/k8s";
import { k8sGet } from "@console/internal/module/k8s";
```
