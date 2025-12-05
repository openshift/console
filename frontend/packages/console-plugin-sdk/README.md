# OpenShift Console Static Plugins

> [!CAUTION]
> New console plugins should use the dynamic plugin system as described in
> the [Console Dynamic Plugins README]. New static plugins will not be accepted.

Static plugins become part of the Console application during its webpack build.
Their code is maintained as part of the frontend monorepo, built and released as
an integral part of Console.

The `@console/app` package represents the core application. Static plugins to be
automatically included in the build are declared as `dependencies` of this package.
This can be overridden via `CONSOLE_PLUGINS` env. variable whose value is a comma
separated list of plugin package names.

For example:

```sh
# start a dev server with only `dev-console` and `topology` plugins enabled
CONSOLE_PLUGINS=dev-console,topology yarn dev
```

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

`name` must include the `@console` scope. `version` should be `0.0.0-fixed`.
Additional plugin metadata is declared via the [`consolePlugin` object].

```jsonc
{
  "name": "@console/foo-plugin",
  "version": "0.0.0-fixed",
  "private": true,
  // scripts, dependencies, devDependencies, ...
  "consolePlugin": {
    "exposedModules": {
      "barUtils": "src/utils/bar.ts"
    }
  }
}
```

Static plugins can provide extensions. All paths in the `consolePlugin` object
are relative to plugin package root directory and expected to reference actual
files (including proper file extension). Barrel files (index files which
re-export other modules) are discouraged and not supported.

## Extensions

Plugin's extensions are declared via `console-extensions.json` file; see the
relevant section in [Console Dynamic Plugins README] for details.

## `OWNERS`

The main purpose of `OWNERS` file is to list people responsible for reviewing
and approving pull requests related to the given package or project. It also
gives us the ability to add labels to pull requests for easier categorization.

Packages maintained by core Console team usually inherit their reviewer/approver
list from root frontend `OWNERS` file. Packages maintained by other teams should
provide their own list.

```yaml
reviewers:
  - spadgett
  - vojtechszocs
approvers:
  - spadgett
  - vojtechszocs
labels:
  - component/sdk
```

To add new component label in [Prow CI/CD system], open a pull request that modifies
[`core-services/prow/02_config/_labels.yaml`] in `openshift/release` repository.

## Build time constraints and specifics

- From webpack perspective, the list of plugins to be included in the build is immutable.
- The core application package (`@console/app`) is a static plugin is always loaded first.

[Console Dynamic Plugins README]: /frontend/packages/console-dynamic-plugin-sdk/README.md
[Prow CI/CD system]: https://github.com/kubernetes/test-infra
[`consolePlugin` object]: /frontend/packages/console-dynamic-plugin-sdk/src/build-types.ts
[`core-services/prow/02_config/_labels.yaml`]: https://github.com/openshift/release/blob/master/core-services/prow/02_config/_labels.yaml
