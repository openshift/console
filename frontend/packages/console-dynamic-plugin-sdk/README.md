# OpenShift Console Dynamic Plugins

Based on the concept of [webpack module federation](https://webpack.js.org/concepts/module-federation/),
dynamic plugins are loaded and interpreted from remote sources at runtime. The standard way to deliver
and expose dynamic plugins to Console is through [OLM operators](https://github.com/operator-framework).

Dynamic plugins are decoupled from the Console application, which means both plugins and Console can be
released, installed and upgraded independently from each other. To ensure compatibility with Console and
other plugins, each plugin must declare its dependencies using [semantic version](https://semver.org/)
ranges.

## Related Documentation

_[Extension Documentation](./docs/console-extensions.md)_ - Detailed documentation of every available console extension point.

_[API Documentation](./docs/api.md)_ - Detailed documentation of hooks, components, and other APIs provided by this package.

_[OpenShift Console Dynamic Plugins feature page](https://github.com/openshift/enhancements/blob/master/enhancements/console/dynamic-plugins.md)_ - A high level overview of dynamic plugins in relation to OLM operators and cluster administration.

Example project structure:

```
dynamic-demo-plugin/
├── src/
├── console-extensions.json
├── package.json
├── tsconfig.json
└── webpack.config.ts
```

## SDK packages

| Package Name                                     | Description                                                                                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `@openshift-console/dynamic-plugin-sdk`          | Provides core APIs, types and utilities used by dynamic plugins at runtime.                                                              |
| `@openshift-console/dynamic-plugin-sdk-webpack`  | Provides webpack plugin `ConsoleRemotePlugin` used to build all dynamic plugin assets.                                                   |
| `@openshift-console/dynamic-plugin-sdk-internal` | Internal package exposing additional code.                                                                                               |
| `@openshift-console/plugin-shared`               | Provides reusable components and utility functions to build OCP dynamic plugins. Compatible with multiple versions of OpenShift Console. |

## OpenShift Console Versions vs SDK Versions

Not all NPM packages are fully compatible with all versions of the Console. This table will help align compatible versions of the SDK Packages to versions of the OpenShift Console.

| Console Version   | SDK Package                                     | Last Package Version |
| ----------------- | ----------------------------------------------- | -------------------- |
| 4.12.x            | `@openshift-console/dynamic-plugin-sdk`         | Latest               |
|                   | `@openshift-console/dynamic-plugin-sdk-webpack` | Latest               |
| 4.11.x            | `@openshift-console/dynamic-plugin-sdk`         | 0.0.12               |
|                   | `@openshift-console/dynamic-plugin-sdk-webpack` | 0.0.7                |
| 4.10.x **[Tech]** | `@openshift-console/dynamic-plugin-sdk`         | 0.0.3                |
|                   | `@openshift-console/dynamic-plugin-sdk-webpack` | 0.0.6                |
| 4.9.x **[Dev]**   | `@openshift-console/dynamic-plugin-sdk`         | 0.0.0-alpha18        |

Notes

- **[Tech]** - Release 4.10 was Tech Preview for the SDK packages
- **[Dev]** - Release 4.9 was Dev Preview for the SDK packages

## `package.json`

Plugin metadata is declared via the `consolePlugin` object.

```jsonc
{
  "name": "dynamic-demo-plugin",
  "version": "0.0.0",
  "private": true,
  // scripts, dependencies, devDependencies, ...
  "consolePlugin": {
    "name": "console-demo-plugin",
    "version": "0.0.0",
    "displayName": "Console Demo Plugin",
    "description": "Plasma reactors online. Initiating hyper drive.",
    "exposedModules": {
      "barUtils": "./utils/bar"
    },
    "dependencies": {
      "@console/pluginAPI": "*"
    }
  }
}
```

`consolePlugin.name` is the plugin's unique identifier. It should be the same as `metadata.name`
of the corresponding `ConsolePlugin` resource used to represent the plugin on the cluster.
Therefore, it must be a valid
[DNS subdomain name](https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names).

`consolePlugin.version` must be [semver](https://semver.org/) compliant.

Dynamic plugins can expose modules representing additional code to be referenced, loaded and executed
at runtime. A separate [webpack chunk](https://webpack.js.org/guides/code-splitting/) is generated for
each entry in `consolePlugin.exposedModules` object. Exposed modules are resolved relative to plugin's
webpack `context` option.

The `@console/pluginAPI` dependency is mandatory and refers to Console versions this dynamic plugin is
compatible with. The `consolePlugin.dependencies` object may also refer to other dynamic plugins that
are required for this dynamic plugin to work correctly.

See `ConsolePluginMetadata` type for details on the `consolePlugin` object and its schema.

## `console-extensions.json`

Declares all extensions contributed by the plugin.

```jsonc
[
  {
    "type": "console.flag",
    "properties": {
      "handler": { "$codeRef": "barUtils.testHandler" }
    }
  },
  {
    "type": "console.flag/model",
    "properties": {
      "flag": "EXAMPLE",
      "model": {
        "group": "kubevirt.io",
        "version": "v1alpha3",
        "kind": "ExampleModel"
      }
    }
  }
]
```

Depending on extension `type`, the `properties` object may contain code references, encoded as object
literals `{ $codeRef: string }`. When loading dynamic plugins, encoded code references are transformed
into functions `() => Promise<T>` used to load the referenced objects.

The `$codeRef` value should be formatted as either `moduleName.exportName` (referring to a named export)
or `moduleName` (referring to the `default` export). Only the plugin's exposed modules (i.e. the keys of
`consolePlugin.exposedModules` object) may be used in code references.

## Webpack config

Dynamic plugins _must_ be built with [webpack](https://webpack.js.org/) in order for their modules to
seamlessly integrate with Console application at runtime. Use webpack version 5+ which includes native
support for module federation.

All dynamic plugin assets are managed via webpack plugin `ConsoleRemotePlugin`.

```ts
const { ConsoleRemotePlugin } = require('@openshift-console/dynamic-plugin-sdk-webpack');

const config = {
  // 'entry' is optional, but unrelated to plugin assets
  plugins: [new ConsoleRemotePlugin()],
  // ... rest of webpack configuration
};

export default config;
```

`ConsoleRemotePlugin` has no configuration options; it automatically detects your plugin's metadata and
extension declarations and generates the corresponding assets.

## Generated assets

Building the above example plugin produces the following assets:

```
dynamic-demo-plugin/dist/
├── plugin-entry.js
├── plugin-manifest.json
└── utils_bar_ts-chunk.js
```

`plugin-manifest.json`: dynamic plugin manifest. Contains both metadata and extension declarations to
be parsed and interpreted by Console at runtime. This is the first plugin asset loaded by Console.

`plugin-entry.js`: [webpack container entry chunk](https://webpack.js.org/concepts/module-federation/#low-level-concepts).
Provides asynchronous access to specific modules exposed by the plugin. Loaded right after the plugin
manifest.

`utils_bar_ts-chunk.js`: webpack chunk for the exposed `barUtils` module. Loaded via the plugin entry
chunk when needed.

## Plugin development

Run Bridge locally and instruct it to proxy e.g. `/api/plugins/console-demo-plugin` requests directly
to your local plugin asset server (web server hosting the plugin's generated assets):

```sh
./bin/bridge -plugins console-demo-plugin=http://localhost:9001/
```

Your plugin should start loading automatically upon Console application startup. Inspect the value of
`window.SERVER_FLAGS.consolePlugins` to see the list of plugins which Console loads upon its startup.

Note running plugins in this way will likely result in incorrect data in the Cluster Dashboard Dynamic Plugins popover.

## Plugin detection and management

[Console operator](https://github.com/openshift/console-operator) detects available plugins through
`ConsolePlugin` resources on the cluster. It also maintains a cluster-wide list of currently enabled
plugins via `spec.plugins` field in its config (`Console` resource instance named `cluster`).

When the `spec.plugins` value in Console operator config changes, Console operator computes the actual
list of plugins to load in Console as an intersection between all available plugins vs. plugins marked
as enabled. Updating Console operator config triggers a new rollout of the Console (Bridge) deployment.
Bridge reads the computed list of plugins upon its startup and injects this list into Console web page
via `SERVER_FLAGS` object.

## Disabling plugins in the browser

Console users can disable specific or all dynamic plugins that would normally get loaded upon Console
startup via `disable-plugins` query parameter. The value of this parameter is either a comma separated
list of plugin names (disable specific plugins) or an empty string (disable all plugins).

## Runtime constraints and specifics

- Loading multiple plugins with the same `name` (but with a different `version`) is not allowed.
- Console will [override](https://webpack.js.org/concepts/module-federation/#overriding) certain modules
  to ensure a single version of React etc. is loaded and used by the application.
- Enabling a plugin makes all of its extensions available for consumption. Individual extensions cannot
  be enabled or disabled separately.
- Failure to resolve a code reference (unable to load module, missing module export etc.) will disable
  the plugin.

## Publishing SDK packages

To see the latest published version of the given package:

```sh
yarn info <package-name> dist-tags --json | jq .data.latest
```

Before publishing, it's recommended to log into your npm user account:

```sh
npm login
```

Build all distributable [SDK packages](#sdk-packages) into `dist` directory:

```sh
yarn build
```

Finally, publish relevant packages to [npm registry](https://www.npmjs.com/):

```sh
yarn publish dist/<pkg> --no-git-tag-version --new-version <version>
```

If the given package doesn't exist in npm registry, add `--access public` to `yarn publish` command.

## Future Deprecations in Shared Plugin Dependencies

Certain packages are currently in the shared plugin dependencies that will be removed in the future. Plugin authors will need to manually add these items to their configurations or chose other options:

_- react-helmet_
