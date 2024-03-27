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

## Related Documentation

_[Extension Documentation][console-doc-extensions]_ - Detailed documentation of all available Console
extension points.

_[API Documentation][console-doc-api]_ - Detailed documentation of React components, hooks and other APIs
provided by Console to its dynamic plugins.

_[OpenShift Console Dynamic Plugins feature page][console-doc-feature-page]_ - A high-level overview of
dynamic plugins in relation to OLM operators and cluster administration.

## Distributable SDK package overview

| Package Name | Description |
| ------------ | ----------- |
| `@openshift-console/dynamic-plugin-sdk`          | Provides core APIs, types and utilities used by dynamic plugins at runtime. |
| `@openshift-console/dynamic-plugin-sdk-webpack`  | Provides webpack `ConsoleRemotePlugin` used to build all dynamic plugin assets. |
| `@openshift-console/dynamic-plugin-sdk-internal` | Internal package exposing additional code. |
| `@openshift-console/plugin-shared`               | Provides reusable components and utility functions to build OCP dynamic plugins. Compatible with multiple versions of OpenShift Console. |

## OpenShift Console Versions vs SDK Versions

Not all NPM packages are fully compatible with all versions of the Console. This table will help align
compatible versions of distributable SDK packages to versions of the OpenShift Console.

| Console Version   | SDK Package                                     | Last Package Version |
| ----------------- | ----------------------------------------------- | -------------------- |
| 4.16.x            | `@openshift-console/dynamic-plugin-sdk`         | Latest               |
|                   | `@openshift-console/dynamic-plugin-sdk-webpack` | Latest               |
| 4.15.x            | `@openshift-console/dynamic-plugin-sdk`         | 1.0.0                |
|                   | `@openshift-console/dynamic-plugin-sdk-webpack` | 1.0.0                |
| 4.14.x            | `@openshift-console/dynamic-plugin-sdk`         | 0.0.21               |
|                   | `@openshift-console/dynamic-plugin-sdk-webpack` | 0.0.11               |
| 4.13.x            | `@openshift-console/dynamic-plugin-sdk`         | 0.0.19               |
|                   | `@openshift-console/dynamic-plugin-sdk-webpack` | 0.0.9                |
| 4.12.x            | `@openshift-console/dynamic-plugin-sdk`         | 0.0.18               |
|                   | `@openshift-console/dynamic-plugin-sdk-webpack` | 0.0.9                |

Note: this table includes Console versions which currently receive technical support, as per
[Red Hat OpenShift Container Platform Life Cycle Policy](https://access.redhat.com/support/policy/updates/openshift).

## OpenShift Console Versions vs PatternFly Versions

Each Console version supports specific version(s) of [PatternFly](https://www.patternfly.org/) in terms
of CSS styling. This table will help align compatible versions of PatternFly to versions of the OpenShift
Console.

| Console Version   | PatternFly Versions | Notes                                 |
| ----------------- | ------------------- | ------------------------------------- |
| 4.16.x            | 5.x + 4.x           | New dynamic plugins should use PF 5.x |
| 4.15.x            | 5.x + 4.x           | New dynamic plugins should use PF 5.x |
| 4.14.x            | 4.x                 |                                       |
| 4.13.x            | 4.x                 |                                       |
| 4.12.x            | 4.x                 |                                       |

Refer to [PatternFly Upgrade Notes](./upgrade-PatternFly.md) containing links to PatternFly documentation.

## Shared modules

Console is [configured](./src/shared-modules.ts) to share specific modules with its dynamic plugins.

The following shared modules are provided by Console, without plugins providing their own fallback:

- `@openshift-console/dynamic-plugin-sdk`
- `@openshift-console/dynamic-plugin-sdk-internal`
- `react`
- `react-i18next`
- `react-redux`
- `react-router`
- `react-router-dom`
- `react-router-dom-v5-compat`
- `redux`
- `redux-thunk`

For backwards compatibility, Console also provides the following PatternFly **4.x** shared modules:

- `@patternfly/react-core`
- `@patternfly/react-table`
- `@patternfly/quickstarts`

Any shared modules provided by Console without plugin provided fallback are listed as `dependencies`
in the `package.json` manifest of `@openshift-console/dynamic-plugin-sdk` package.

### Changes in shared modules

This section documents notable changes in the Console provided shared modules across Console versions.

#### Console 4.14.x

- Added `react-router-dom-v5-compat` to allow plugins to migrate to React Router v6. Check the
  [Official v5 to v6 Migration Guide](https://github.com/remix-run/react-router/discussions/8753)
  (section "Migration Strategy" and beyond) for details.

#### Console 4.15.x

- The Console application now uses React Router v6 code internally. Plugins that only target OpenShift
  Console 4.15 or later should fully upgrade to React Router v6 via `react-router-dom-v5-compat`.

### PatternFly dynamic modules

Newer versions of `@openshift-console/dynamic-plugin-sdk-webpack` package (1.0.0 and higher) include
support for automatic detection and sharing of individual PatternFly 5.x dynamic modules.

Plugins using PatternFly 5.x dependencies should generally avoid non-index imports for any PatternFly
packages, for example:

```ts
// Do _not_ do this:
import { MonitoringIcon } from '@patternfly/react-icons/dist/esm/icons/monitoring-icon';
// Instead, do this:
import { MonitoringIcon } from '@patternfly/react-icons';
```

## Plugin metadata

Older versions of webpack `ConsoleRemotePlugin` assumed that the plugin metadata is specified via
`consolePlugin` object within the `package.json` file, for example:

```jsonc
{
  "name": "dynamic-demo-plugin",
  "version": "0.0.0",
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
      "@console/pluginAPI": "~4.11.0"
    }
  }
}
```

Newer versions of webpack `ConsoleRemotePlugin` allow passing the plugin metadata directly as an
object, for example:

```ts
new ConsoleRemotePlugin({
  pluginMetadata: { /* same metadata like above */ },
})
```

`name` serves as the plugin's unique identifier. Its value should be the same as `metadata.name`
of the corresponding `ConsolePlugin` resource on the cluster. Therefore, it must be a valid
[DNS subdomain name](https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names).

`version` must be [semver](https://semver.org/) compliant version string.

Dynamic plugins can expose modules representing plugin code that can be referenced, loaded and executed
at runtime. A separate [webpack chunk](https://webpack.js.org/guides/code-splitting/) is generated for
each entry in the `exposedModules` object. Exposed modules are resolved relative to the plugin's webpack
`context` option.

The `@console/pluginAPI` dependency is optional and refers to Console versions this dynamic plugin is
compatible with. The `dependencies` object may also refer to other dynamic plugins that are required for
this plugin to work correctly. For dependencies where the version string may include a
[semver pre-release](https://semver.org/#spec-item-9) identifier, adapt your semver range constraint
(dependency value) to include the relevant pre-release prefix, e.g. use `~4.11.0-0.ci` when targeting
pre-release versions like `4.11.0-0.ci-1234`.

## Extensions contributed by the plugin

Older versions of webpack `ConsoleRemotePlugin` assumed that the list of extensions contributed by the
plugin is specified via the `console-extensions.json` file, for example:

```jsonc
// This file is parsed as JSONC (JSON with Comments)
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

Newer versions of webpack `ConsoleRemotePlugin` allow passing the extension list directly as an array
of objects, for example:

```ts
new ConsoleRemotePlugin({
  extensions: [ /* same extensions like above */ ],
})
```

Each extension a single instance of extending the Console application's functionality. Extensions are
declarative and expressed as plain static objects.

Extension `type` determines the kind of extension to perform, while any data and/or code necessary to
interpret such extensions are declared through their `properties`.

Extensions may contain code references pointing to specific modules exposed by the plugin. For example:

- `{ $codeRef: 'barUtils' }` - refers to `default` export of `barUtils` module
- `{ $codeRef: 'barUtils.testHandler' }` - refers to `testHandler` export of `barUtils` module


When loading dynamic plugins, all encoded code references `{ $codeRef: string }` are transformed into
functions `() => Promise<T>` used to load the referenced objects on demand. Only the plugin's exposed
modules (i.e. the keys of `exposedModules` object) may be used in code references.

## Webpack config

Dynamic plugins _must_ be built with [webpack](https://webpack.js.org/) in order for their modules to
seamlessly integrate with Console application at runtime. Use webpack version 5+ which includes native
support for module federation.

All dynamic plugin assets are generated via webpack `ConsoleRemotePlugin`.

```ts
import { ConsoleRemotePlugin } from '@openshift-console/dynamic-plugin-sdk-webpack';
import { Configuration } from 'webpack';

const config: Configuration = {
  entry: {}, // Plugin container entry is generated by DynamicRemotePlugin
  plugins: [new ConsoleRemotePlugin()],
  // ... rest of webpack configuration
};

export default config;
```

Refer to `ConsoleRemotePluginOptions` type for details on supported Console plugin build options.

## Generated assets

Building the above example plugin produces the following assets:

```
dynamic-demo-plugin/dist/
├── exposed-barUtils-chunk.js
├── plugin-entry.js
└── plugin-manifest.json
```

`plugin-manifest.json` is the dynamic plugin manifest. It contains both plugin metadata and extension
declarations to be loaded and interpreted by Console at runtime. This is the first plugin asset loaded
by Console.

`plugin-entry.js` is the
[webpack container entry chunk](https://webpack.js.org/concepts/module-federation/#low-level-concepts).
It provides access to specific modules exposed by the plugin. It's loaded right after the plugin manifest.

`exposed-barUtils-chunk.js` is the generated webpack chunk for `barUtils` exposed module. It's loaded
via the plugin entry chunk (`plugin-entry.js`) when needed.

Plugins may also include other assets, such as JSON localization files that follow the general pattern
`locales/<lang>/plugin__<plugin-name>.json` or static images referenced from the plugin code.

## Serving plugin assets

Dynamic plugins are deployed as workloads on the cluster. Each plugin deployment should include a web
server that hosts the [generated assets](#generated-assets) of the given plugin.

Console Bridge server adds `X-Content-Type-Options: nosniff` HTTP response header to all plugin asset
requests for added security. Web browsers that comply with this security header will block `<script>`
initiated requests when the MIME type of requested asset is not valid.

**Important!** Make sure to provide valid JavaScript MIME type via the `Content-Type` response header
for all assets served by your plugin web server.

## Local plugin development

Clone Console repo and build the Bridge server by running `build-backend.sh` script.

Run the following commands to log in as `kubeadmin` user and start a local Bridge server instance.
The `-plugins` argument tells Bridge to force load your plugin upon Console application startup.
The `-i18n-namespaces` argument registers the corresponding i18n namespace for your plugin in Console.

```sh
oc login https://example.openshift.com:6443 -u kubeadmin -p example-password
source ./contrib/oc-environment.sh
# Note: the plugin web server URL should include a trailing slash
./bin/bridge -plugins foo-plugin=http://localhost:9001/ -i18n-namespaces=plugin__foo-plugin
```

To work with multiple plugins, provide multiple arguments to Bridge server:

```sh
./bin/bridge \
  -plugins foo-plugin=http://localhost:9001/ -i18n-namespaces=plugin__foo-plugin \
  -plugins bar-plugin=http://localhost:9002/ -i18n-namespaces=plugin__bar-plugin
```

Once the Bridge server is running, start your plugin web server(s), and ensure that plugin assets can
be fetched via `/api/plugins/<plugin-name>` Bridge endpoint. For example, the following URLs should
provide the same content:

- http://localhost:9000/api/plugins/foo-plugin/plugin-manifest.json
- http://localhost:9001/plugin-manifest.json

Open the Console in your web browser and inspect the value of `window.SERVER_FLAGS.consolePlugins` to see the
list of dynamic plugins the Console loads at runtime. For local development, this should only
include plugin(s) listed via `-plugins` Bridge argument.

### Using local Console plugin SDK code

If you need to make modifications to Console dynamic plugin SDK code and reflect them in your
plugin builds, follow these steps:

1. Make changes in Console repo. Run `yarn build` in `frontend/packages/console-dynamic-plugin-sdk`
   directory to rebuild plugin SDK files at `frontend/packages/console-dynamic-plugin-sdk/dist`.
2. Make sure your plugin's `package.json` dependencies refer to local plugin SDK files, for example:
```json
"@openshift-console/dynamic-plugin-sdk": "file:../openshift/console/frontend/packages/console-dynamic-plugin-sdk/dist/core",
"@openshift-console/dynamic-plugin-sdk-webpack": "file:../openshift/console/frontend/packages/console-dynamic-plugin-sdk/dist/webpack",
```
3. Refresh your plugin's `node_modules` whenever you change local plugin SDK files:
```sh
rm -rf node_modules/@openshift-console && yarn --check-files
```
4. Build your plugin as usual. The build should now use the current local plugin SDK files.

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

Console provides certain packages as shared modules to all of its dynamic plugins. Some of these shared
modules may be removed in the future. Plugin authors will need to manually add these items to their webpack
configs or choose other options.

The list of shared modules planned for deprecation:

- `react-helmet`

[console-doc-extensions]: ./docs/console-extensions.md
[console-doc-api]: ./docs/api.md
[console-doc-feature-page]: https://github.com/openshift/enhancements/blob/master/enhancements/console/dynamic-plugins.md
