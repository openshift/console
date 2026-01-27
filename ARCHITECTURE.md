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
  
### Official Extension Types & API Documentation

OpenShift Console provides 75+ extension types for plugin integration. **For comprehensive documentation, see [frontend/packages/console-dynamic-plugin-sdk/README.md](frontend/packages/console-dynamic-plugin-sdk/README.md).**

**Before working with extensions or the plugin API, you MUST read:**
- **[Extension Types Reference](frontend/packages/console-dynamic-plugin-sdk/docs/console-extensions.md)** - Complete extension type definitions, naming conventions (`console.*`), and deprecation notices
- **[Console API Documentation](frontend/packages/console-dynamic-plugin-sdk/docs/api.md)** - React components, hooks, utilities, and TypeScript types exported by the SDK

Common extension categories include navigation, pages, resources, actions, dashboards, catalog, and perspectives.

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
- **`@console/topology`** - Topology components, data transforms, graph views

**BEFORE MODIFYING ANYTHING IN THESE OR OTHER PACKAGES:** Verify SDK re-exports by checking `frontend/packages/console-dynamic-plugin-sdk/src/api/internal-*.ts` files to avoid breaking the public API.

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