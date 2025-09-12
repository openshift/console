# OpenShift Console Project Configuration

## Project Overview
- `frontend/` - React TypeScript frontend using yarn workspaces
- `pkg/` - Go backend code
- `cmd/` - Go CLI commands
- `frontend/packages/` - Plugin packages (dev-console, knative, helm, pipelines, etc.)

---

# Frontend Development

## Key Packages & Areas
- **console-dynamic-plugin-sdk**: Public API for external plugins (⚠️ breaking changes require careful vetting)
- **dev-console**: Developer perspective, topology, add flows
- **pipelines-plugin**: Tekton pipelines integration
- **knative-plugin**: Serverless/Knative support
- **helm-plugin**: Helm chart management
- **topology**: Application topology views
- **console-shared**: Shared utilities and components

## Console Dynamic Plugin SDK

The `console-dynamic-plugin-sdk` is a key part of this repository - it's the public API that enables OpenShift Console's extensibility.

### Architecture
- **Extension Points System**: 25+ extension types (NavItem, Page, ResourceListPage, DashboardsCard, etc.)
- **Module Federation**: Runtime plugin loading via Webpack Module Federation
- **Type Safety**: Comprehensive TypeScript definitions for all extension points
- **Code References**: Lazy loading with `$codeRef` for performance

### Key Extension Types
- **Navigation**: `NavItem`, `Separator`, `HrefNavItem`
- **Pages**: `Page`, `RoutePage`, `StandaloneRoutePage` 
- **Resources**: `ModelDefinition`, `ResourceListPage`, `ResourceDetailsPage`, `ResourceTabPage`
- **Actions**: `ActionGroup`, `ResourceActionProvider`
- **Dashboards**: `DashboardsCard`, `DashboardsTab`, `DashboardsOverviewHealthSubsystem`
- **Catalog**: `CatalogItemType`, `CatalogItemProvider`
- **Perspectives**: `Perspective`, `PerspectiveContext`

### Plugin Structure
```typescript
export const plugin: Plugin = [
  {
    type: 'Page',
    properties: {
      exact: true,
      path: '/my-plugin-page',
      component: { $codeRef: 'MyPluginPage' },
    },
  },
  {
    type: 'NavItem', 
    properties: {
      section: 'home',
      componentProps: { name: 'My Plugin', href: '/my-plugin-page' },
    },
  },
];
```

### Critical Considerations
- **⚠️ BREAKING CHANGES REQUIRE EXTREME CARE**: This is a public API consumed by external plugins
- **Backward Compatibility**: Must maintain compatibility across versions
- **Schema Evolution**: Extension schema changes need migration paths
- **Performance Impact**: Plugin loading affects console startup time
- **Type Safety**: Strong TypeScript support prevents runtime errors

### ⚠️ Public API Sources - Breaking Change Risk
The dynamic plugin SDK re-exports APIs from multiple Console packages. **Changing these source modules could inadvertently break the public API**:

#### APIs Re-exported from `@console/shared`
- **Dashboard Components**: `ActivityItem`, `ActivityBody`, `RecentEventsBody`, `OngoingActivityBody`, `AlertsBody`, `AlertItem`, `HealthItem`, `HealthBody`, `ResourceInventoryItem`, `UtilizationItem`, `UtilizationBody`, `UtilizationDurationDropdown`, `VirtualizedGrid`, `LazyActionMenu`
- **UI Components**: `Overview`, `OverviewGrid`, `InventoryItem`, `InventoryItemTitle`, `InventoryItemBody`, `InventoryItemStatus`, `InventoryItemLoading`, `StatusPopupSection`, `StatusPopupItem`, `DocumentTitle`, `Timestamp`, `ActionServiceProvider`, `ErrorBoundaryFallbackPage`, `QueryBrowser`
- **Hooks**: `useUtilizationDuration`, `useDashboardResources`, `useUserSettings`, `useAnnotationsModal`, `useDeleteModal`, `useLabelsModal`, `useActiveNamespace`, `useQuickStartContext`
- **Other**: `PaneBody` (via `ListPageBody`)

#### APIs Re-exported from `@console/internal`  
- **Core UI**: `HorizontalNav`, `VirtualizedTable`, `TableData`, `ListPageHeader`, `ListPageCreate`, `ListPageCreateLink`, `ListPageCreateButton`, `ListPageCreateDropdown`, `ListPageFilter`, `ResourceLink`, `ResourceIcon`, `ResourceEventStream`, `NamespaceBar`
- **Editors**: `YAMLEditor`, `CodeEditor`, `ResourceYAMLEditor`
- **Hooks**: `useActiveColumns`, `useListPageFilter`, `usePrometheusPoll`, `useURLPoll`
- **K8s Utilities**: Redux store access, HTTP utilities

#### APIs Re-exported from `@console/plugin-sdk`
- **Extension System**: `useExtensions` (via `useResolvedExtensions`)
- **Plugin Infrastructure**: Plugin loading, subscription services, store management

#### APIs Re-exported from `@console/app`
- **Application Context**: `QuickStartsLoader`, `useLastNamespace`

**Before modifying any of these source packages, verify impact on the dynamic plugin SDK public API.**

### SDK Utilities
- **Resource Hooks**: `useK8sWatchResource`, `useActivePerspective`, `useActiveNamespace`
- **Component Utilities**: Navigation helpers, telemetry, validation
- **Build Integration**: `ConsoleRemotePlugin` for Webpack Module Federation

### Development Guidelines
- Always consider impact on external plugin developers
- Extensive testing required for any API changes
- Clear deprecation paths with version-based removal
- Comprehensive documentation for all public APIs
- Performance monitoring for plugin loading

## Frontend Development Commands
- **Build**: `cd frontend && yarn build`
- **Dev server**: `cd frontend && yarn dev`
- **Run tests**: `cd frontend && yarn test`
- **Lint code**: `cd frontend && yarn lint`
- **Update i18n keys**: `cd frontend && yarn i18n`

## Frontend Code Conventions
- TypeScript + React, follows existing ESLint rules
- Follow PatternFly design system
- Prefer functional programming patterns and immutable data structures

## Frontend Common Patterns
- **State Management**: React hooks and Context API (migrating away from legacy Redux/Immutable.js)
- **Hooks**: Use existing hooks from `console-shared` when possible (`useK8sWatchResource`, `useUserSettings`, etc.)
- **API calls**: Use k8s resource hooks for data fetching, `consoleFetchJSON` for HTTP requests
- **Routing**: Plugin routes go in plugin-specific route files
- **Extensions**: Use console extension points for plugin integration
- **Types**: Check existing types in `console-shared` before creating new ones
- **Dynamic Plugins**: Prefer implementing new features using the console dynamic plugin SDK (`frontend/packages/console-dynamic-plugin-sdk/`) for extensibility
- **Plugin SDK Changes**: Any updates to `console-dynamic-plugin-sdk` must maintain backward compatibility as it's a public API
- **Styling**: SCSS modules co-located with components, PatternFly design system components
- **i18n**: Use `useTranslation()` hook with `%namespace~key%` format for translation keys
- **Error Handling**: Use ErrorBoundary components and graceful degradation patterns
- **File Naming**: PascalCase for components, kebab-case for utilities, `*.spec.ts(x)` for tests

## Frontend Testing
- Jest unit tests via `yarn test`
- E2E: Cypress tests per plugin (`test-cypress-*` scripts)

---

# Backend Development

## Backend Development Commands
- **Build**: `./build-backend.sh`
- **Tests**: `./test-backend.sh`

## Go Best Practices
- **Package organization**: Follow domain-based structure in `/pkg/` (auth, server, proxy, etc.)
- **Error handling**: Use typed errors with `NewInvalidFlagError`, `FatalIfFailed` patterns
- **HTTP handlers**: Use middleware composition, method-based routing, consistent JSON responses via `serverutils.SendResponse`
- **Security**: Apply security headers, CSRF protection, proper token validation
- **Logging**: Use `klog` with appropriate levels (V(4) for debug, Error, Fatal)
- **Configuration**: YAML-based config with comprehensive flag validation
- **Testing**: Table-driven tests, `httptest` for HTTP handlers, proper cleanup functions
- **K8s clients**: Separate config from client creation, use both typed and dynamic clients
- **Interfaces**: Define clear interfaces for testability and dependency injection

## Backend Code Conventions
- Go with standard formatting
- Use existing component patterns from packages

## Backend Testing
- Go tests via `./test-backend.sh`

---

# Global Practices

## Commit Strategy
- **Backend dependency updates**: Separate vendor folder changes into their own commit to isolate core logic changes
- **Frontend i18n updates**: Run `yarn i18n` and commit updated keys alongside any code changes that affect i18n
- **Redux migration**: When possible during story work, migrate away from Redux/Immutable.js to React hooks/Context without increasing scope

## Branch Naming
- Feature work: `CONSOLE-####` (Jira story number)
- Bug fixes: `OCPBUGS-####` (Jira bug number)
- Base branch: `main` (not master)
