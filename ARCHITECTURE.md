# ARCHITECTURE

## Console Dynamic Plugin SDK

The `console-dynamic-plugin-sdk` is a key part of this repository - it's the public API that enables OpenShift Console's extensibility.

## Key Packages & Areas
- **console-dynamic-plugin-sdk**: Public API for external plugins (⚠️ breaking changes require careful vetting)
- **dev-console**: Developer perspective, topology, add flows
- **pipelines-plugin**: Tekton pipelines integration
- **knative-plugin**: Serverless/Knative support
- **helm-plugin**: Helm chart management
- **topology**: Application topology views
- **console-shared**: Shared utilities and components

- **Extension Points System**: 25+ extension types (NavItem, Page, ResourceListPage, DashboardsCard, etc.)
- **Module Federation**: Runtime plugin loading via Webpack Module Federation
- **Type Safety**: Comprehensive TypeScript definitions for all extension points
- **Code References**: Lazy loading with `$codeRef` for performance
  
### Key Extension Types (reference)

| Category       | Types                                                      | Purpose                          |
|----------------|------------------------------------------------------------|----------------------------------|
| Navigation     | NavItem, HrefNavItem, Separator                            | Sidebar / top nav                |
| Pages          | Page, RoutePage, StandaloneRoutePage                       | Full or nested pages             |
| Resources      | ModelDefinition, ResourceListPage, ResourceDetailsPage     | CRUD views                       |
| Actions        | ActionGroup, ResourceActionProvider                        | Kebab / row menus                |
| Dashboards     | DashboardsCard, DashboardsTab                              | Overview health cards            |
| Catalog        | CatalogItemType, CatalogItemProvider                       | Operator / Helm catalog          |
| Perspectives   | Perspective, PerspectiveContext                            | Top-level views                  |


### Plugin Structure
```typescript
// GOOD – Dynamic extensions (runtime-loaded)
export const plugin: Plugin = [
  {
    type: 'Page',
    properties: {
      exact: true,
      path: '/my-plugin-page',
      component: { $codeRef: 'MyPluginPage' },  // Lazy-load reference
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

// BAD – Static (avoid—breaks extensibility)
export const staticPlugin = { extensions: [...] };
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