# OpenShift Console Plugins

Openshift Console Plugins extend the functionality of the console. Plugins are enabled by
adding them as `dependencies` of the [console-app](/frontend/packages/console-app) package.

- Plugins are static. Their code gets bundled ("baked") into the Console build output:
  - Plugins are not loaded dynamically at runtime, which in turn simplifies the architecture (no need to sandbox plugin execution or its interaction with the Console app or Bridge).
  - Console-app dependencies control the set of plugins to include in the Console build. This can be overridden using the CONSOLE_PLUGINS environment variable.
- Plugins have their code represented as Console monorepo packages:
  - This increases the level of trust between the Console app and its plugins.
  - Plugin code close to Console code avoids cross-repo PR maintenance issues.
  - Each plugin has an OWNERS file denoting its ownership (see the OWNERS File section below for details on reviewers and approvers).
- Plugins are declarative, meaning they provide a list of extensions to be interpreted:
  - Each extension has a unique type and properties representing its parameters (data and/or callbacks).
  - Each extension has a flags object to support gating by Console feature flags.
- The Console demo plugin is used to demonstrate specific extensions:
  - It should contain at least one instance of every extension type (sadly, this isn't the case yet).
  - It should be a "synthetic" (foo-bar, not-a-real-world) example acting as a starting point for further exploration.

See the [demo plugin](/frontend/packages/console-demo-plugin) for reference.

## Directory and File Names

Plugin packages should be in the [frontend/packages](/frontend/packages) directory.

The plugin directory name should match the plugin name (core plugins are an exception). As a convention, plugin
directory names should end with the `-plugin` suffix (eg. `my-plugin`) to denote its purpose.

- Every plugin should have `package.json` and `OWNERS` files.
- Every plugin should follow the recommended file structure:
  - `src` directory.
  - `integration-tests` directory (if needed).
  - `src/plugin.ts` file for the Plugin entry module.
  - `src/components` directory for React components.
  - `src/models` directory for k8s model definitions.
  - Unit tests co-located at `</path/to/unit>/__tests__/unit.spec.ts`, see the Unit Tests section below for more details.

``` bash
    .
    ├── ...
    ├── frontend
    │   ├── packages
    |   |   ├── ...
    │   |   ├── my-plugin
    |   |   |   ├── integration-tests
    |   |   |   |   └── ...
    |   |   |   ├── src
    |   |   |   |   ├── plugin.tsx
    |   |   |   |   ├── __tests__
    |   |   |   |   |   ├── some-test.spec.ts
    |   |   |   |   |   └── ...
    |   |   |   |   └── ...
    |   |   |   ├── OWNERS
    |   |   |   ├── package.json
    |   |   |   └── ...
    |   |   └── ...
    │   └── ...
    └── ...
```

Packages whose name starts with `console-` are expected to be maintained by the core Console team, so they shouldn't have an `OWNERS` file.
Every (non-core) plugin package must have an `OWNERS` file.

## Package.json

Plugins are packages. The package definition (package.json) of a plugin should include a `consolePlugin`
map that defines the plugin entry module (value of `entry` key) and the plugin integration tests.

The `consolePlugin.entry` path should point to a module that exports the Plugin object (plugin entry module).

From the plugin author perspective, a Plugin is simply a list of extensions.
The plugin entry module is loaded immediately upon Console startup, so it should lazy-load other code (use the import function) instead of directly referring to it.

``` json
// File: package.json

{
  "name": "@console/demo-plugin",
  "version": "0.0.0-fixed",
  "description": "Demo plugin for Console web application",
  "private": true,
  "dependencies": {
    "@console/plugin-sdk": "0.0.0-fixed",
    "@console/shared": "0.0.0-fixed"
  },
  "consolePlugin": {
    "entry": "src/plugin.tsx",
    "integrationTestSuites": {
      "demo": ["integration-tests/**/*.scenario.ts"]
    }
  }
}
```

## Plugin Entry Module (`.../src/plugin.tsx`)

The plugin entry module path (relative to the plugin root directory) is defined in the `consolePlugin.entry` property of the `package.json` file.

``` json
// File: package.json

{
  ...
  "consolePlugin": {
    "entry": "src/plugin.tsx",
    ...
  }
}
```

The plugin entry module will export a variable of type `Plugin<ConsumedExtensions>` which will contain an array of objects of type `Extension`. Each `Extension` object must contain the following properties:

- `type` - A string that describes the broader category and any specialization(s) into which the extension falls.
- `properties` - An object containing options relevant to the extension.

``` es6
// File: src/plugin.tsx

const plugin: Plugin<ConsumedExtensions> = [
  ...
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'persistent-storage',
      title: 'Persistent Storage',
    },
  },
  ...
];

export default plugin;
```

In addition, every plugin should typically provide (at least) these two extensions:

- `ModelDefinition` - Add new k8s model definitions.
- `FeatureFlag/Model` (in future also FeatureFlag/Action) - Add new feature flag, and use the newly added feature flags (possibly together with core Console flags) to gate its extensions.

See the [demo plugin](/frontend/packages/console-demo-plugin) for available Plugin extension points.

For better type checking and code completion, use a type parameter that represents the union of all the extension types consumed by the plugin.

``` es6
// Bad
const plugin: Plugin<any> = [ /* stuff */ ];

// Good
const plugin: Plugin<FooExtension | BarExtension> = [ /* stuff */ ];

// Better
type ConsumedExtensions = FooExtension | BarExtension;
const plugin: Plugin<ConsumedExtensions> = [ /* stuff */ ];
```

## Monorepo Architecture

Console plugins are first class citizens of the Console monorepo and therefore reuse the same testing (Jest, Protractor, etc.) infrastructure and conventions.
See Tests and OWNERS sections below for details.

## Unit Tests

Unit tests are highly encouraged, but optional. Unit tests should be placed in `__tests__` directories as close as possible to the source code that they test.

The [jest](https://jestjs.io/) framework is used for unit tests. It will automatically run any file located in a directory named `.../__tests__` and whose name ends with a `.spec.(ts|tsx|js|jsx)` suffix.

``` bash
  .
  ├── my-plugin
  |   ├── src
  |   |   ├── __tests__
  |   |   |   ├── some-test.spec.ts
  |   |   |   └── ...
  |   |   └── ...
  |   └── ...
  └── ...
```

## Integration Tests

Integration tests should be placed in an `integration-tests` directory at the root level of the plugin directory.

Integration tests use [protractor](http://www.protractortest.org) and must be defined in the `consolePlugin` map, in the plugin's `package.json`.
The test path is relative to the plugin root directory. It is possible to include common tests defined in `@console/internal-integration-tests`
and use common testing methods defined in the internal package by requiring it in the test.

``` json
// File: package.json

{
  ...
  "consolePlugin": {
    ...
    "integrationTestSuites": {
      "demo": ["integration-tests/**/*.scenario.ts"]
    }
  }
}
```

``` bash
  .
  ├── my-plugin
  |   ├── integration-tests
  |   |   ├── tests
  |   |   |   ├── demo.scenario.ts
  |   |   |   └── ...
  |   |   └── ...
  |   └── ...
  └── ...
```

## OWNERS File

The OWNERS file defines a list of maintainers. Community plugins must define a list of `reviewers` and `approvers` who will
be responsible for reviewing and approving pull requests for the plugin. For more in-depth information, see the [prow](https://github.com/kubernetes/test-infra/tree/master/prow) documentation.

The OWNERS file should also include `labels` metadata, indicating organization ownership, usually of the format `component/<name of plugin>`:

``` yaml
reviewers:
  - christianvogt
  - spadgett
approvers:
  - christianvogt
  - spadgett
  - vojtechszocs
labels:
  - component/sdk
```

To add a new component label, open a PR with the new label added to https://github.com/openshift/release/blob/master/core-services/prow/02_config/_labels.yaml

## Common vs. Community Plugins

Plugins can be owned either by the Console team or community teams. Plugins maintained by the Console team will not have an `OWNERS` file and will use a directory named `console-<some-name>` by convention.
