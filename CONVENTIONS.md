# CONVENTIONS

## Frontend Code Conventions
- TypeScript + React, follows existing ESLint rules
- Follow PatternFly design system
- Prefer functional programming patterns and immutable data structures

### Frontend Patterns
- **State Management**: React hooks and Context API (migrating away from legacy Redux/Immutable.js)
- **Hooks**: Use existing hooks from `console-shared` when possible (`useK8sWatchResource`, `useUserSettings`, etc.)
- **API calls**: Use k8s resource hooks for data fetching, `consoleFetchJSON` for HTTP requests
- **Routing**: Plugin routes go in plugin-specific route files
- **Extensions**: Use console extension points for plugin integration
- **Types**: Check existing types in `console-shared` before creating new ones
- **Dynamic Plugins**: Use console extension points for plugin integration. The dynamic plugin SDK is a re-export layer - implement new features in source packages (`@console/shared`, `@console/internal`, etc.) first, refine them internally, then consider re-exporting to the SDK after stabilization
- **Plugin SDK Changes**: Any updates to `console-dynamic-plugin-sdk` must maintain backward compatibility as it's a public API
- **Styling**: SCSS modules co-located with components, PatternFly design system components
- **i18n**: Use `useTranslation('namespace')` hook with `key` format for translation keys
- **Error Handling**: Use ErrorBoundary components and graceful degradation patterns
- **File Naming**: PascalCase for components, kebab-case for utilities, `*.spec.ts(x)` for tests

## Backend Code Conventions
- Go with standard formatting
- Use existing component patterns from packages

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

### Code Quality
- **Use modern JavaScript (ES6+):** Prefer const/let, arrow functions, async/await, destructuring, template literals, optional chaining, and array methods
- **Add comments for complex logic**

### Performance
**Optimize re-renders**
```typescript
// GOOD - Memoized callback
const handleClick = useCallback(() => doSomething(), []);

// BAD - Recreates function every render
const handleClick = () => doSomething();
```

**Lazy loading**
```typescript
// GOOD - Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

### Patterns
**TypeScript Type Safety**
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

**Type component props properly**
```typescript
// GOOD - Reuse from existing component
  interface MyComponentProps {
    appendTo?: React.ComponentProps<typeof Popper>['appendTo'];
  }

// BAD - Duplicating type definitions
interface MyComponentProps {
  appendTo: HTMLElement | (() => HTMLElement) | 'inline';
}
```

**Use proper hooks**
```typescript
// GOOD - Use useDynamicPluginInfo for plugin data
const [pluginInfoEntries] = useDynamicPluginInfo();
const pluginInfo = useMemo(
  () => pluginInfoEntries.find(entry => entry.pluginName === name),
  [pluginInfoEntries, name]
);
```

**Avoid deprecated components**

Check for these deprecation signals:
1. **JSDoc `@deprecated` tags** in component source
2. **Import paths containing `/deprecated`**
3. **`DEPRECATED_` file name prefix**

```typescript
// BAD - Deprecated import path
import { Modal } from '@patternfly/react-core/deprecated';

// GOOD - Use non-deprecated path
import { Modal } from '@patternfly/react-core';
```

AI agents should flag use of `any` type
- Suggest proper type definitions
- Check that null/undefined are handled: `string | undefined`
- Verify exported types for reusable components

### Circular Dependencies
**Problem:** Barrel exports (index.ts files that re-export multiple modules) can create circular dependency cycles that cause runtime errors, `undefined` values, and build issues.

```typescript
// GOOD - Direct import to specific file
import { Component } from '@console/shared/src/components/Component';

// BAD - Index.ts barrel export causing cycles
import { Component } from '@console/shared';
```

### Import Management

```typescript
// GOOD - Use import type for types
import type { K8sResourceCommon } from '@console/internal/module/k8s';
import { k8sGet } from '@console/internal/module/k8s';
```
