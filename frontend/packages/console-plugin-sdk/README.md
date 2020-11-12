# OpenShift Console Static Plugins

Static plugins become part of the Console application during its webpack build. Their code is maintained
as part of the frontend monorepo, built and released as an integral part of Console.

The `@console/app` package represents the core application. Static plugins to be automatically included
in the build are declared as `dependencies` of this package. This can be overridden via `CONSOLE_PLUGINS`
env. variable whose value is a comma separated list of plugin package names.

For example:

```sh
CONSOLE_PLUGINS=dev-console,operator-lifecycle-manager yarn dev
```

starts webpack dev-server with only DevConsole and OLM plugins included in the build.

Example project structure:

```
packages/foo-plugin/
├── integration-tests/
├── src/
├── console-extensions.json
├── OWNERS
└── package.json
```

## `package.json`

`name` must include the `@console` scope. `version` should be `0.0.0-fixed`. Additional plugin metadata
is declared via the `consolePlugin` object.

```jsonc
{
  "name": "@console/foo-plugin",
  "version": "0.0.0-fixed",
  "private": true,
  // scripts, dependencies, devDependencies, ...
  "consolePlugin": {
    "entry": "src/plugin.ts",
    "exposedModules": {
      "barUtils": "src/utils/bar.ts"
    }
  }
}
```

Static plugins can provide both static and dynamic extensions. All paths in the `consolePlugin` object
are relative to plugin package root directory and expected to reference actual files (including proper
file extension).

## Static extensions

The `consolePlugin.entry` path in `package.json` file points to the plugin entry module which exports
all of the plugin's static extensions.

```ts
import { Plugin, DashboardsTab, DashboardsCard } from '@console/plugin-sdk';

type ConsumedExtensions = DashboardsTab | DashboardsCard;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'foo-tab',
      title: 'Foo',
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'foo-tab',
      loader: () => import('./components/foo-card' /* webpackChunkName: "foo" */).then((m) => m.FooCard),
    },
  },
];

export default plugin;
```

The standard way to reference additional code in static extensions is via ES6 module `import` function,
which generates a separate [webpack chunk](https://webpack.js.org/guides/code-splitting/) to be loaded
on demand at runtime.

## Dynamic extensions

Plugin's dynamic extensions are declared via `console-extensions.json` file; see the relevant section in
[Console Dynamic Plugins README](/frontend/packages/console-dynamic-plugin-sdk/README.md) for details.

When loading static plugins during Console startup, the overall list of plugin's extensions is computed
as `[...staticExtensions, ...dynamicExtensions]`.

## Integration tests

Static plugins can extend the list of core [Protractor](https://www.protractortest.org/) test suites via
the `consolePlugin.integrationTestSuites` object in their `package.json` file.

```jsonc
{
  "name": "@console/foo-plugin",
  "version": "0.0.0-fixed",
  "private": true,
  // scripts, dependencies, devDependencies, ...
  "consolePlugin": {
    "entry": "src/plugin.ts",
    "integrationTestSuites": {
      "foo": [
        "integration-tests/**/*.scenario.ts"
      ]
    }
  }
}
```

Protractor test suite integration uses the same plugin resolution as the webpack build; only the plugins
that would be included in the Console build will have their test suites added to the list.

Plugin developers should consider writing new integration tests using [Cypress](https://www.cypress.io/).
The `integration-tests-cypress` package currently hosts tests to be moved out into appropriate packages.

## `OWNERS`

The main purpose of `OWNERS` file is to list people responsible for reviewing and approving pull requests
related to the given package or project. It also gives us the ability to add labels to pull requests for
easier categorization.

Packages maintained by core Console group (`packages/console-xxx`) usually inherit their reviewer/approver
list from root frontend `OWNERS` file. Packages maintained by other groups (`packages/xxx-plugin`) should
provide their own list.

```yaml
reviewers:
  - christianvogt
  - spadgett
  - vojtechszocs
approvers:
  - christianvogt
  - spadgett
  - vojtechszocs
labels:
  - component/sdk
```

To add new component label in [Prow CI/CD system](https://github.com/kubernetes/test-infra), open a pull
request that modifies
[`core-services/prow/02_config/_labels.yaml`](https://github.com/openshift/release/blob/master/core-services/prow/02_config/_labels.yaml)
in `openshift/release` repository.

## Build time constraints and specifics

- From webpack perspective, the list of plugins to be included in the build is immutable.
- The core application package (`@console/app`) is a static plugin, loaded before any other plugins.
- Plugin entry modules are loaded during Console startup. To avoid breaking the overall Console UX:
  - Additional code should be loaded via the `import` function.
  - Side effects, such as CSS imports, should be avoided if possible.
