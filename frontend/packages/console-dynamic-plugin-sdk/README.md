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

## Plugin project references

If you're new to dynamic plugins, we suggest to clone the [Console plugin template][console-plugin-template]
repo and follow its instructions on setting up a local plugin development environment. We recommend running
the Console application with a container image to avoid having to build Console locally.

The [CronTab plugin](https://github.com/openshift/console-crontab-plugin) is a sample plugin that uses the
`CronTab` Custom Resource Definition (CRD) from
[Kubernetes documentation](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/)
and implements basic CRD operations such as creating, editing and deleting.

The [Console demo plugin][console-demo-plugin] located in the Console repo is primarily meant for testing
the current Console plugin SDK features.

Here is a list of real world dynamic plugins that may serve as a further reference point:

| Plugin Name                                                | Git Repo                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `kubevirt-plugin` (KubeVirt)                               | https://github.com/kubevirt-ui/kubevirt-plugin                         |
| `networking-console-plugin` (OpenShift Networking)         | https://github.com/openshift/networking-console-plugin                 |
| `netobserv-plugin` (Network Observability)                 | https://github.com/netobserv/network-observability-console-plugin      |
| `odf-console` (OpenShift Data Foundation)                  | https://github.com/red-hat-storage/odf-console/tree/master/plugins/odf |
| `odf-multicluster-console` (ODF MultiCluster Orchestrator) | https://github.com/red-hat-storage/odf-console/tree/master/plugins/mco |
| `pipelines-console-plugin` (OpenShift Pipelines)           | https://github.com/openshift-pipelines/console-plugin                  |
| `acm` (Red Hat Advanced Cluster Management)                | https://github.com/stolostron/console/tree/main/frontend/plugins/acm   |
| `mce` (MultiCluster Engine for Kubernetes)                 | https://github.com/stolostron/console/tree/main/frontend/plugins/mce   |
| `ossmconsole` (OpenShift Service Mesh)                     | https://github.com/kiali/openshift-servicemesh-plugin                  |
| `kuadrant-console-plugin` (Red Hat Connectivity Link)      | https://github.com/kuadrant/kuadrant-console-plugin                    |

There's also the [Cat Facts Operator](https://github.com/RyanMillerC/cat-facts-operator) which serves
as a reference point for writing an OLM operator that ships with its own Console dynamic plugin.

## Distributable SDK package overview

| Package Name                                       | Description                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| `@openshift-console/dynamic-plugin-sdk` ★         | Provides core APIs, types and utilities used by dynamic plugins at runtime.      |
| `@openshift-console/dynamic-plugin-sdk-webpack` ★ | Provides webpack `ConsoleRemotePlugin` used to build all dynamic plugin assets.  |
| `@openshift-console/dynamic-plugin-sdk-internal`   | Internal package exposing additional Console code.                               |

Packages marked with ★ provide essential plugin APIs with backwards compatibility. Other packages may be
used with multiple versions of OpenShift Console but don't provide any backwards compatibility guarantees.

## OpenShift Console Versions vs SDK Versions

Console plugin SDK packages follow a semver scheme where the major and minor version number indicates
the earliest supported OCP Console version, and the patch version number indicates the release of that
particular package.

During development, we will publish prerelease versions of plugin SDK packages, e.g. `4.19.0-prerelease.1`.
Once the given Console version is released (GA), we will publish corresponding plugin SDK packages without
the prerelease tag, e.g. `4.19.0`.

For older 1.x plugin SDK packages, refer to the following version compatibility table:

| Console Version | SDK Package                                     | Last Package Version |
| --------------- | ----------------------------------------------- | -------------------- |
| 4.17.x          | `@openshift-console/dynamic-plugin-sdk`         | 1.6.0                |
|                 | `@openshift-console/dynamic-plugin-sdk-webpack` | 1.2.0                |
| 4.16.x          | `@openshift-console/dynamic-plugin-sdk`         | 1.4.0                |
|                 | `@openshift-console/dynamic-plugin-sdk-webpack` | 1.1.1                |
| 4.15.x          | `@openshift-console/dynamic-plugin-sdk`         | 1.0.0                |
|                 | `@openshift-console/dynamic-plugin-sdk-webpack` | 1.0.2                |
| 4.14.x          | `@openshift-console/dynamic-plugin-sdk`         | 0.0.21               |
|                 | `@openshift-console/dynamic-plugin-sdk-webpack` | 0.0.11               |
| 4.13.x          | `@openshift-console/dynamic-plugin-sdk`         | 0.0.19               |
|                 | `@openshift-console/dynamic-plugin-sdk-webpack` | 0.0.9                |
| 4.12.x          | `@openshift-console/dynamic-plugin-sdk`         | 0.0.18               |
|                 | `@openshift-console/dynamic-plugin-sdk-webpack` | 0.0.9                |

Note: this table includes Console versions which currently receive technical support, as per
[Red Hat OpenShift Container Platform Life Cycle Policy](https://access.redhat.com/support/policy/updates/openshift).

## PatternFly

Each Console version supports specific version(s) of [PatternFly](https://www.patternfly.org/) in terms
of CSS styling. This table will help align compatible versions of PatternFly to versions of the OpenShift
Console.

| Console Version | PatternFly Versions | Notes                                 |
| --------------- | ------------------- | ------------------------------------- |
| 4.19.x          | 6.x + 5.x           | New dynamic plugins should use PF 6.x |
| 4.15.x - 4.18.x | 5.x + 4.x           | New dynamic plugins should use PF 5.x |
| 4.12.x - 4.14.x | 4.x                 |                                       |

Console application is responsible for loading base styles for all supported PatternFly version(s).

Plugins should only include styles that are specific to their user interfaces to be evaluated on
top of base PatternFly styles. Avoid importing styles such as `@patternfly/react-styles/**/*.css`
or any styles from `@patternfly/patternfly` package in your plugin.

Plugins should use PatternFly components and styles for a consistent user interface. Refer to the relevant
[release notes](./release-notes) for more details on PatternFly versions supported by each Console version.

## Shared modules

Console is [configured](./src/shared-modules/shared-modules-meta.ts) to share specific modules with its dynamic plugins.

The following shared modules are provided by Console, without plugins providing their own fallback:

- `@openshift/dynamic-plugin-sdk`
- `@openshift-console/dynamic-plugin-sdk`
- `@openshift-console/dynamic-plugin-sdk-internal`
- `@patternfly/react-topology`
- `react`
- `react-i18next`
- `react-redux`
- `react-router`
- `react-router-dom`
- `react-router-dom-v5-compat`
- `redux`
- `redux-thunk`

Any shared modules provided by Console without plugin provided fallback are listed as `dependencies`
in the `package.json` manifest of `@openshift-console/dynamic-plugin-sdk` package.

## How to upgrade your plugins

Refer to the `CHANGELOG.md` in `@openshift-console/dynamic-plugin-sdk` and `@openshift-console/dynamic-plugin-sdk-webpack`
for each release for package-specific changes.

For general changes made to Console's API, such as changes to shared modules, refer to the relevant
[release notes](./release-notes).

## Content Security Policy

Console application uses [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
(CSP) to detect and mitigate certain types of attacks. By default, the list of allowed
[CSP sources](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/Sources)
includes the document origin `'self'` and Console webpack dev server when running off-cluster.

All dynamic plugin assets _should_ be loaded using `/api/plugins/<plugin-name>` Bridge endpoint which
matches the `'self'` CSP source for all Console assets served via Bridge.

Refer to `BuildCSPDirectives` function in
[`pkg/utils/utils.go`](https://github.com/openshift/console/blob/main/pkg/utils/utils.go)
for details on the current Console CSP implementation.

Refer to [Dynamic Plugins feature page][console-doc-feature-page] section on Content Security Policy
for more details.

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
      "@console/pluginAPI": "~4.19.0"
    }
  }
}
```

Newer versions of webpack `ConsoleRemotePlugin` allow passing the plugin metadata directly as an
object, for example:

```ts
new ConsoleRemotePlugin({
  pluginMetadata: {
    /* same metadata like above */
  },
});
```

`name` serves as the plugin's unique identifier. Its value should be the same as `metadata.name`
of the corresponding `ConsolePlugin` resource on the cluster. Therefore, it must be a valid
[DNS subdomain name](https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names).

`version` must be [semver](https://semver.org/) compliant version string.

### Exposed modules

Dynamic plugins can expose modules representing plugin code that can be referenced, loaded and executed
at runtime. A separate [webpack chunk](https://webpack.js.org/guides/code-splitting/) is generated for
each entry in the `exposedModules` object. Exposed modules are resolved relative to the plugin's webpack
`context` option.

### Dependencies

Dynamic plugins might declare dependency on specific Console versions and other plugins. This metadata
field is similar to `dependencies` in the `package.json` file with values represented as semver ranges.

The `@console/pluginAPI` dependency is optional and refers to Console versions this dynamic plugin is
meant to be compatible with. It is matched against the actual Console release version, as provided by
the Console operator.

The `dependencies` object might also refer to other dynamic plugins that are required for this plugin to
work correctly. Such other plugins will be loaded before loading this plugin.

Plugins might also use the `optionalDependencies` object to support use cases, such as plugin A integrating
with plugin B while still allowing plugin A to be loaded when plugin B is not enabled on the cluster.
This object has the same structure as `dependencies` object.

```jsonc
{
  // ...
  "consolePlugin": {
    // ...
    "dependencies": {
      // If foo-plugin is available, load it before loading this plugin.
      // If foo-plugin is NOT available, this plugin will fail to load.
      "foo-plugin": "~1.1.0",
    },
    "optionalDependencies": {
      // If bar-plugin is available, load it before loading this plugin.
      // If bar-plugin is NOT available, load this plugin regardless.
      "bar-plugin": "^2.3.4"
    },
  }
}
```

For dependencies where the version string might include a [semver pre-release](https://semver.org/#spec-item-9)
identifier, adapt your semver range constraint (dependency value) to include the relevant pre-release
prefix, e.g. use `~4.11.0-0.ci` when targeting pre-release versions such as `4.11.0-0.ci-1234`.

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
  extensions: [
    /* same extensions like above */
  ],
});
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

Open the Console in your web browser and inspect the value of `window.SERVER_FLAGS.consolePlugins` to
see the list of dynamic plugins the Console loads at runtime. For local development, this should only
include plugin(s) listed via `-plugins` Bridge argument.

Console development builds allow you to interact with the `PluginStore` object that manages all
plugins and their extensions directly in your web browser with `window.pluginStore`. Please note
that this is _not_ a public API and is meant only for debugging local Console development builds.

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

If the newly published version comes before the latest published version in terms of semver rules
(e.g. hotfix release 1.0.2 for an older minor version stream 1.0.x), ensure the `latest` dist-tag
still applies to the appropriate package version:

```sh
npm dist-tag add <package-name>@<version> latest
```

## i18n translations for messages

The following demonstrates how to translate messages in the console plugin using the [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/) libraries. Also included are the instructions for uploading/downloading strings to/from the Phrase Translation Memory System (TMS).

### Step 1: Mark strings with `t` function for translation

You can use the `useTranslation` hook within the component, or the `i18next` function outside the component, along with the namespace. The i18n namespace must match the name of the `ConsolePlugin` resource with the `plugin__` prefix to avoid naming conflicts. For example, a console plugin named console-crontab-plugin use the `plugin__console-crontab-plugin` namespace. See the following for examples:

```tsx
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';

const helloWorldMessages = {
  Foo: {
    title: i18next.t('plugin__console-crontab-plugin~Foo'),
    message: i18next.t('plugin__console-crontab-plugin~This is foo description...'),
  },
  Bar: {
    title: i18next.t('plugin__console-crontab-plugin~Bar'),
    message: i18next.t('plugin__console-crontab-plugin~This is bar description...'),
  },
};

const Header: React.FC = () => {
  const { t } = useTranslation('plugin__console-crontab-plugin');
  return <h1>{t('Hello, World!')}</h1>;
};
```

For labels in `console-extensions.json`, you can use the format `%plugin__console-crontab-plugin~My Label%`. Console will replace the value with the string for the current language from the `plugin__console-crontab-plugin` namespace. For example:

```json
{
  "type": "console.navigation/section",
  "properties": {
    "id": "admin-demo-section",
    "perspective": "admin",
    "name": "%plugin__console-crontab-plugin~Hello World%"
  }
}
```

Then, run `yarn i18n` to update the JSON files in the `locales` folder of the plugin console after adding or updating strings.

### Step 2: Request a Phrase Translation Memory System (TMS) user account

i. Request an account from the localization team for the console plugin project.
ii. Create a Project Template to include the supported language in the Phrase TMS portal. Refer to the [Phrase Project Templates ](https://support.phrase.com/hc/en-us/articles/5709647439772-Project-Templates-TMS) on how to create/update the Project Template. You must have Phrase project owner permissions to perform this task. The localization team can help with creating the Project Template and setup.

### Step 3: Create utility scripts to automate i18n-related tasks

Create scripts for uploading and downloading the i18n JSON files to/from the Phrase portal. See the [console](https://github.com/openshift/console/tree/main/frontend/i18n-scripts) repository or [Advanced Cluster Management (ACM) console plugin](https://github.com/stolostron/console/tree/main/frontend/i18n-scripts) repository for similar scripts.

### Step 4: Upload to Phrase portal

i. Install the unofficial Memsource CLI client. This client is a command-line tool designed for interacting with the Phrase portal. See the following link for details: [The unofficial Memsource CLI client](https://github.com/unofficial-memsource/memsource-cli-client#pip-install)

ii. Configure the Memsource client using the account credentials. Create a file named ~/.memsourcerc in any location, for example, /Users/.../, and paste the following content into the file:

```
export MEMSOURCE_URL="https://cloud.memsource.com/web"
export MEMSOURCE_USERNAME=username
export MEMSOURCE_PASSWORD=password
export MEMSOURCE_TOKEN=$(memsource auth login --user-name $MEMSOURCE_USERNAME --password "${MEMSOURCE_PASSWORD}" -c token -f value)
```

See the following link for details:[The RHEL instructions for MacOS](https://github.com/unofficial-memsource/memsource-cli-client#configuration-red-hat-enterprise-linux-derivatives)

iii. Change directory to the root of the console plugin, and then run the upload script created earlier in step 3, for example: `yarn memsource-upload -v PLUGIN_VERSION_NUMBER`. Take note of the generated `PROJECT_ID`.

iv. Notify the localization team of the upload and wait for a reply from them on when the translated strings are ready for download.

### Step 5: Download from Phrase portal

i. Use the `PROJECT_ID` generated during the upload task, or visit the [Phrase TMS](https://cloud.memsource.com) portal. Find the URL of the previously uploaded project, then copy the `PROJECT_ID` from the URL path following `../show/<PROJECT_ID>`

ii. Use the download script created earlier in step 3 with `PROJECT_ID` to download the translated strings. Change the directory to the root of the console plugin, and then run the download script.
For example: `yarn memsource-download -v PLUGIN_VERSION_NUMBER`. This should download the updated locale files, which contain the translated strings in the languages that were configured earlier in the Project Template and upload utility script.

iii. Commit, review and merge the changes accordingly.

iv. Reach out to the localization team if you have any questions or concerns regarding the translated strings.

For more information on OpenShift Internationalization, see the console [Internationalization README page](https://github.com/openshift/console/blob/main/INTERNATIONALIZATION.md).

[console-doc-extensions]: ./docs/console-extensions.md
[console-doc-api]: ./docs/api.md
[console-doc-feature-page]: https://github.com/openshift/enhancements/blob/master/enhancements/console/dynamic-plugins.md
[console-plugin-template]: https://github.com/openshift/console-plugin-template
[console-demo-plugin]: ../../../dynamic-demo-plugin/README.md
