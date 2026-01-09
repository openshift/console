# Changelog for `@openshift-console/dynamic-plugin-sdk-webpack`

Console plugin SDK packages follow a semver scheme where the major and minor version number indicates
the earliest supported OCP Console version, and the patch version number indicates the release of that
particular package.

For released (GA) versions of Console, use `4.x.z` packages.
For current development version of Console, use `4.x.0-prerelease.n` packages.

For older 1.x plugin SDK packages, refer to "OpenShift Console Versions vs SDK Versions" compatibility
table in [Console dynamic plugins README](./README.md).

## 4.22.0-prerelease.2 - TBD

- **Deprecated**: `loadPluginEntry` callback is deprecated in favor of `__load_plugin_entry__`. Migrate by
  building your plugin with a 4.22 or later of `ConsoleRemotePlugin`. Runtime support for older plugins
  built for 4.21 or older will be removed in a future version of OCP Console. ([CONSOLE-3769], [#15904])

## 4.22.0-prerelease.1 - 2025-01-21

- **Breaking**: Minimum compatible version of `webpack` increased to `^5.100.0` ([CONSOLE-3769], [#15945])
- **Breaking**: Minimum compatible version of `typescript` increased to `^5.9.3` ([CONSOLE-3769], [#15945])
- `webpack` is now a required peer dependency ([CONSOLE-5050], [#15934])

## 4.21.0-prerelease.1 - 2025-12-04

- Remove usage of direct `webpack` imports in favor of `compiler.webpack` ([OCPBUGS-66345], [#15802])

## 4.20.0 - 2025-11-24

> Initial release for OCP Console 4.20.

## 4.20.0-prerelease.1 - 2025-08-15

- Add support for optional plugin dependencies ([CONSOLE-4623], [#15183])

## 4.19.0 - 2025-06-27

> Initial release for OCP Console 4.19.

## 4.19.0-prerelease.2 - 2025-05-20

> [!IMPORTANT]
> This release includes a change in generated JS code to use new JSX transform `react-jsx` introduced
> in React 17. Plugins should update their TSConfig files accordingly (i.e. set `jsx` to `react-jsx`)
> and run the `update-react-imports` [codemod](https://github.com/reactjs/react-codemod) if needed.

- Add `@patternfly/react-topology` to Console provided shared modules ([OCPBUGS-55323], [#14993])
- Skip processing type-only dynamic module imports ([OCPBUGS-53030], [#14861])
- Update `typescript` peer dependency to match Console TS build version ([#14861])

## 4.19.0-prerelease.1 - 2025-02-17

- Remove Console provided PatternFly 4 shared modules ([CONSOLE-4379], [#14615])
- Change generated JS build target from `es2016` to `es2021` ([CONSOLE-4400], [#14620])

## 4.18.1 - 2025-09-22

- Fix bug when processing Console provided PatternFly shared modules ([OCPBUGS-61569], [#15479])

## 4.18.0 - 2025-09-04

> Initial release for OCP Console 4.18.

- Add `@patternfly/react-topology` to Console provided shared modules ([OCPBUGS-55323], [#14993])

## 1.3.0 - 2024-10-31

- Expose `EncodedExtension` type ([OCPBUGS-38734], [#14167])
- Update webpack dependency to use semver range ([OCPBUGS-42985], [#14300])

## 1.2.0 - 2024-08-02

- Improve control over PatternFly shared modules ([OCPBUGS-35928], [#13992])

## 1.1.1 - 2024-07-02

- Patch dynamic module parser to exclude PatternFly "next" modules ([OCPBUGS-31901], [#13832])
- Ensure `requiredVersion` is set for Console provided shared modules ([OCPBUGS-34683], [#13893])

## 1.1.0 - 2024-04-03

- Remove `react-helmet` from Console provided shared modules ([OCPBUGS-30824], [#13687])

## 1.0.2 - 2024-06-27

- Patch dynamic module parser to exclude PatternFly "next" modules ([OCPBUGS-33642], [#13849])

## 1.0.1 - 2024-03-19

- Fix bugs in `ConsoleRemotePlugin` found in kubevirt-ui/kubevirt-plugin#1804 ([OCPBUGS-30762], [#13657])

## 1.0.0 - 2024-02-09

> Initial v1 release. Changes listed here refer to the latest 0.0.x version (0.0.11) of this package.

- Update build-time infra to use webpack code from OpenShift Dynamic Plugin SDK ([CONSOLE-3705], [#13188])
- Prevent PatternFly styles from being included in plugin builds ([CONSOLE-3853], [#13388])
- Optimize module federation of PatternFly packages via dynamic modules ([CONSOLE-3853], [#13521])

[CONSOLE-3705]: https://issues.redhat.com/browse/CONSOLE-3705
[CONSOLE-3769]: https://issues.redhat.com/browse/CONSOLE-3769
[CONSOLE-3853]: https://issues.redhat.com/browse/CONSOLE-3853
[CONSOLE-4379]: https://issues.redhat.com/browse/CONSOLE-4379
[CONSOLE-4400]: https://issues.redhat.com/browse/CONSOLE-4400
[CONSOLE-4623]: https://issues.redhat.com/browse/CONSOLE-4623
[CONSOLE-5050]: https://issues.redhat.com/browse/CONSOLE-5050
[OCPBUGS-30762]: https://issues.redhat.com/browse/OCPBUGS-30762
[OCPBUGS-30824]: https://issues.redhat.com/browse/OCPBUGS-30824
[OCPBUGS-31901]: https://issues.redhat.com/browse/OCPBUGS-31901
[OCPBUGS-33642]: https://issues.redhat.com/browse/OCPBUGS-33642
[OCPBUGS-34683]: https://issues.redhat.com/browse/OCPBUGS-34683
[OCPBUGS-35928]: https://issues.redhat.com/browse/OCPBUGS-35928
[OCPBUGS-38734]: https://issues.redhat.com/browse/OCPBUGS-38734
[OCPBUGS-42985]: https://issues.redhat.com/browse/OCPBUGS-42985
[OCPBUGS-53030]: https://issues.redhat.com/browse/OCPBUGS-53030
[OCPBUGS-55323]: https://issues.redhat.com/browse/OCPBUGS-55323
[OCPBUGS-61569]: https://issues.redhat.com/browse/OCPBUGS-61569
[OCPBUGS-66345]: https://issues.redhat.com/browse/OCPBUGS-66345
[#13188]: https://github.com/openshift/console/pull/13188
[#13388]: https://github.com/openshift/console/pull/13388
[#13521]: https://github.com/openshift/console/pull/13521
[#13657]: https://github.com/openshift/console/pull/13657
[#13687]: https://github.com/openshift/console/pull/13687
[#13832]: https://github.com/openshift/console/pull/13832
[#13849]: https://github.com/openshift/console/pull/13849
[#13893]: https://github.com/openshift/console/pull/13893
[#13992]: https://github.com/openshift/console/pull/13992
[#14167]: https://github.com/openshift/console/pull/14167
[#14300]: https://github.com/openshift/console/pull/14300
[#14615]: https://github.com/openshift/console/pull/14615
[#14620]: https://github.com/openshift/console/pull/14620
[#14861]: https://github.com/openshift/console/pull/14861
[#14993]: https://github.com/openshift/console/pull/14993
[#15183]: https://github.com/openshift/console/pull/15183
[#15479]: https://github.com/openshift/console/pull/15479
[#15802]: https://github.com/openshift/console/pull/15802
[#15904]: https://github.com/openshift/console/pull/15904
[#15945]: https://github.com/openshift/console/pull/15945
[#15934]: https://github.com/openshift/console/pull/15934
