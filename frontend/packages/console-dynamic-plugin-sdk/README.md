# OpenShift Console Dynamic Plugins

Based on the concept of [webpack module federation](https://webpack.js.org/concepts/module-federation/),
dynamic plugins are loaded and interpreted from remote sources at runtime. The standard way to deliver
and expose dynamic plugins to Console is through [OLM operators](https://github.com/operator-framework).

Dynamic plugins are decoupled from the Console application, which means both plugins and Console can be
released, installed and upgraded independently from each other. To ensure compatibility with Console and
other plugins, each plugin must declare its dependencies using [semantic version](https://semver.org/)
ranges.

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

`name` and `version` are used to identify the plugin instance at runtime. Additional plugin metadata is
declared via the `consolePlugin` object.

```jsonc
{
  "name": "@console/dynamic-demo-plugin",
  "version": "0.0.0-fixed",
  "private": true,
  // scripts, dependencies, devDependencies, ...
  "consolePlugin": {
    "displayName": "Dynamic Demo Plugin",
    "description": "Plasma reactors online. Initiating hyper drive.",
    "exposedModules": {
      "barUtils": "./utils/bar"
    },
    "dependencies": {
      "@console/pluginAPI": "~0.0.1"
    }
  }
}
```

Dynamic plugins can expose modules representing additional code to be referenced, loaded and executed
at runtime. A separate [webpack chunk](https://webpack.js.org/guides/code-splitting/) is generated for
each exposed module.

## `console-extensions.json`

Declares all extensions contributed by the plugin. The `$schema` property is optional but recommended.

```jsonc
{
  "$schema": "/path/to/schema/console-extensions.json",
  "data": [
    {
      "type": "console.flag",
      "properties": {
        "handler": {
          "$codeRef": "barUtils.testHandler"
        }
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
}
```

Depending on extension `type`, the `properties` object may contain code references, encoded as object
literals `{ $codeRef: string }`. When loading dynamic plugins, encoded code references are transformed
into functions `CodeRef<T> = () => Promise<T>` which load the referenced objects.

The `$codeRef` value should be formatted as `moduleName.exportName` (referring to a named export) or
`moduleName` (referring to the `default` export). Only the plugin's exposed modules (i.e. the keys of
`consolePlugin.exposedModules` object in `package.json` file) may be used as the `moduleName` value.

## Webpack config

Dynamic plugins _must_ be built with [webpack](https://webpack.js.org/) in order for their modules to
seamlessly integrate with Console at runtime. Use webpack version 5+ which includes native support for
module federation.

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

`plugin-manifest.json`: dynamic plugin manifest. Contains both metadata and extension declarations to be
interpreted by Console at runtime.

`plugin-entry.js`: [webpack container entry chunk](https://webpack.js.org/concepts/module-federation/#low-level-concepts).
Provides asynchronous access to specific modules exposed by the plugin.

`utils_bar_ts-chunk.js`: webpack chunk corresponding to the exposed `barUtils` module.

## Runtime constraints and specifics

- Loading two or more plugins with the same `name` is not allowed.
- Console will [override](https://webpack.js.org/concepts/module-federation/#overriding) certain modules
  to ensure a single version of React etc. is loaded and used by the application.
- Enabling a plugin makes all of its extensions available for consumption. Individual extensions cannot
  be enabled or disabled separately.
- Failure to resolve a code reference (unable to load module or missing export) will disable the plugin.
