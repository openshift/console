# ARCHITECTURE

## Console Dynamic Plugin SDK

The `console-dynamic-plugin-sdk` is a key part of this repository - it's the public API that enables OpenShift Console's extensibility.

## Key Packages & Areas

**Core Packages:**
- **console-dynamic-plugin-sdk**: Public API for external plugins (⚠️ breaking changes require careful vetting)
- **console-app**: Main application that loads all plugins
- **console-shared**: Shared utilities and components
- **console-internal**: Core UI and Kubernetes integration

**Dynamic Plugins:**
For the complete list of console plugins, see `console-app/package.json` dependencies. Static plugins (built-in) may be deprecated or extracted over time.

- **Extension Points System**: 25+ extension types (NavItem, Page, ResourceListPage, DashboardsCard, etc.)
- **Module Federation**: Runtime plugin loading via Webpack Module Federation
- **Type Safety**: Comprehensive TypeScript definitions for all extension points
- **Code References**: Lazy loading with `$codeRef` for performance
  
### Extension Types

OpenShift Console provides 75+ extension types for plugin integration. See the [complete extension type reference](frontend/packages/console-dynamic-plugin-sdk/docs/console-extensions.md) for:
- Full type definitions and properties
- Naming convention: `console.*` (e.g., `console.page/route`, `console.navigation/href`)
- Usage examples and deprecation notices

Common categories include navigation, pages, resources, actions, dashboards, catalog, and perspectives.


### Plugin Structure

Dynamic plugins define their extensions in a `console-extensions.json` file (JSONC format) located in the plugin package root. Extension types use the naming convention `console.foo/bar`.

**Example `console-extensions.json`:**
```json
[
  {
    "type": "console.page/route",
    "properties": {
      "exact": true,
      "path": "/my-plugin-page",
      "component": { "$codeRef": "MyPluginPage" }
    }
  },
  {
    "type": "console.navigation/href",
    "properties": {
      "id": "my-plugin-nav",
      "name": "My Plugin",
      "href": "/my-plugin-page",
      "section": "home"
    }
  },
  {
    "type": "console.perspective",
    "properties": {
      "id": "my-perspective",
      "name": "%my-plugin~My Perspective%",
      "icon": { "$codeRef": "perspective.icon" },
      "landingPageURL": { "$codeRef": "perspective.getLandingPageURL" }
    }
  }
]
```

**Key Concepts:**
- **File Location**: `console-extensions.json` in package root (e.g., `frontend/packages/my-plugin/console-extensions.json`)
- **Type Naming**: `console.*` convention (e.g., `console.page/route`, `console.navigation/href`, `console.dashboards/card`)
- **Code References**: Use `$codeRef` to lazily load components and functions for performance
- **i18n**: Use `%namespace~key%` format for translatable strings (e.g., `"%my-plugin~My Label%"`)

**Real-world examples:** See `console-extensions.json` files in `frontend/packages/dev-console/`, `frontend/packages/helm-plugin/`, etc.

### Critical Considerations
- **⚠️ BREAKING CHANGES REQUIRE EXTREME CARE**: This is a public API consumed by external plugins
- **Backward Compatibility**: Must maintain compatibility across versions
- **Schema Evolution**: Extension schema changes need migration paths
- **Performance Impact**: Plugin loading affects console startup time
- **Type Safety**: Strong TypeScript support prevents runtime errors

### ⚠️ Public API Sources - Breaking Change Risk

The dynamic plugin SDK re-exports APIs from multiple Console packages:
- **`@console/shared`** - Dashboard components, UI components, hooks
- **`@console/internal`** - Core UI, editors, hooks, K8s utilities
- **`@console/plugin-sdk`** - Extension system, plugin infrastructure
- **`@console/app`** - Application context

**BEFORE MODIFYING ANYTHING IN THESE PACKAGES, YOU MUST VERIFY IMPACT ON THE SDK TO AVOID BREAKING THE PUBLIC API.** See `frontend/packages/console-dynamic-plugin-sdk/src/api/` for specific re-exported modules.

### SDK Utilities
- **Resource Hooks**: `useK8sWatchResource`, `useActivePerspective`, `useActiveNamespace`
- **Component Utilities**: Navigation helpers, telemetry, validation
- **Build Integration**: `ConsoleRemotePlugin` for Webpack Module Federation

### Development Guidelines

**SDK-Specific:**
- Always consider impact on external plugin developers
- Maintain backward compatibility as it's a public API
- Comprehensive documentation for all public APIs

**For detailed plugin API review guidelines and workflow, see [.claude/commands/plugin-api-review.md](.claude/commands/plugin-api-review.md)**