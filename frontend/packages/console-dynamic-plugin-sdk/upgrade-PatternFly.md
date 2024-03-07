# PatternFly Upgrade Notes

A dynamic plugin targets one or more versions of OpenShift Console. Each version supports
specific version(s) of [PatternFly](https://www.patternfly.org/) in terms of CSS styling.

Check the [OpenShift Console Versions vs PatternFly Versions][console-pf-versions] table for
compatibility before upgrading to a newer version of PatternFly.

## CSS styling

Plugins should only include styles that are specific to their user interfaces to be evaluated on
top of base PatternFly styles. Avoid importing styles such as `@patternfly/react-styles/**/*.css`
or any styles from `@patternfly/patternfly` package in your plugin.

Console application is responsible for loading base styles for all supported PatternFly version(s).

## Console 4.14 & below

Console provides the following PatternFly 4.x [shared modules][console-shared-modules] to plugins:

- `@patternfly/react-core`
- `@patternfly/react-table`
- `@patternfly/quickstarts`

When using code from these packages, make sure to import directly from the package index:

```ts
// Do _not_ do this:
import { Button } from '@patternfly/react-core/dist/esm/components/Button';
// Instead, do this:
import { Button } from '@patternfly/react-core';
```

## Console 4.15

Plugins that only target OpenShift Console 4.15 and newer should upgrade to PatternFly 5.x to take
advantage of [PatternFly dynamic modules][console-pf-dynamic-modules].

Any PatternFly related code should be imported via the corresponding package index:

```ts
// Do _not_ do this:
import { MonitoringIcon } from '@patternfly/react-icons/dist/esm/icons/monitoring-icon';
// Instead, do this:
import { MonitoringIcon } from '@patternfly/react-icons';
```

## PatternFly resources

- [Major release highlights providing an overview of changes][pf-release-highlights]
- [Upgrade guide with information about codemods and other resources][pf-upgrade-guide]
- [Release notes change log that can be searched and filtered][pf-upgrade-release-notes]

[console-shared-modules]: ./README.md#shared-modules
[console-pf-versions]: ./README.md#openshift-console-versions-vs-patternfly-versions
[console-pf-dynamic-modules]: ./README.md#patternfly-dynamic-modules
[pf-release-highlights]: https://www.patternfly.org/get-started/release-highlights/
[pf-upgrade-guide]: https://www.patternfly.org/get-started/upgrade
[pf-upgrade-release-notes]: https://www.patternfly.org/get-started/upgrade/release-notes
