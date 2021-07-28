# OpenShift Console Dynamic Plugins

Based on the concept of [webpack module federation](https://webpack.js.org/concepts/module-federation/),
dynamic plugins are loaded and interpreted from remote sources at runtime. The standard way to deliver
and expose dynamic plugins to Console is through [OLM operators](https://github.com/operator-framework).

Dynamic plugins are decoupled from the Console application, which means both plugins and Console can be
released, installed and upgraded independently from each other. To ensure compatibility with Console and
other plugins, each plugin must declare its dependencies using [semantic version](https://semver.org/)
ranges.

See the
[OpenShift Console Dynamic Plugins feature page](https://github.com/openshift/enhancements/blob/master/enhancements/console/dynamic-plugins.md)
for a high level overview of dynamic plugins in relation to OLM operators and cluster administration.

Example project structure:

```
dynamic-demo-plugin/
├── src/
├── console-extensions.json
├── package.json
├── tsconfig.json
└── webpack.config.ts
```

## `package.json`

Plugin metadata is declared via the `consolePlugin` object.

```jsonc
{
  "name": "@console/dynamic-demo-plugin",
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

`consolePlugin.name` should be the same as `metadata.name` of the corresponding `ConsolePlugin` resource
used to represent the plugin on the cluster. Therefore, it must be a valid
[DNS subdomain name](https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names).

`consolePlugin.version` must be [semver](https://semver.org/) compliant.

Dynamic plugins can expose modules representing additional code to be referenced, loaded and executed
at runtime. A separate [webpack chunk](https://webpack.js.org/guides/code-splitting/) is generated for
each exposed module. Exposed modules are resolved relative to plugin's webpack `context` option.

See [`ConsolePluginMetadata` type](/frontend/packages/console-dynamic-plugin-sdk/src/schema/plugin-package.ts)
for details on the `consolePlugin` object and its schema.

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
import * as webpack from 'webpack';
import { ConsoleRemotePlugin } from '@console/dynamic-plugin-sdk/src/webpack/ConsoleRemotePlugin';

const config: webpack.Configuration = {
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
