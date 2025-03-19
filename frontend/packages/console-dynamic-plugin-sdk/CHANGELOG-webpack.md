# Changelog for `@openshift-console/dynamic-plugin-sdk-webpack`

Console plugin SDK packages follow a semver scheme where the major and minor version number indicates
the earliest supported OCP Console version, and the patch version number indicates the release of that
particular package.

For released (GA) versions of Console, use `4.x.z` packages.
For current development version of Console, use `4.x.0-prerelease.n` packages.

For 1.x plugin SDK packages, refer to "OpenShift Console Versions vs SDK Versions" compatibility table
in [Console dynamic plugins README](./README.md).

## 4.19.0-prerelease.2 - TBD

- The base `tsconfig` file now sets the `jsx` option to `react-jsx` to use the new JSX transform introduced
  in React 17+. Plugins should update their `tsconfig` files accordingly and run the `update-react-imports`
  [react-codemod](https://github.com/reactjs/react-codemod) if needed. ([OCPBUGS-52589], [#14864])

## 4.19.0-prerelease.1 - 2025-02-17

- Remove Console provided PatternFly 4 shared modules ([CONSOLE-4379], [#14615])
- Change generated JS build target from `es2016` to `es2021` ([CONSOLE-4400], [#14620])

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
[CONSOLE-3853]: https://issues.redhat.com/browse/CONSOLE-3853
[CONSOLE-4379]: https://issues.redhat.com/browse/CONSOLE-4379
[CONSOLE-4400]: https://issues.redhat.com/browse/CONSOLE-4400
[OCPBUGS-30762]: https://issues.redhat.com/browse/OCPBUGS-30762
[OCPBUGS-30824]: https://issues.redhat.com/browse/OCPBUGS-30824
[OCPBUGS-31901]: https://issues.redhat.com/browse/OCPBUGS-31901
[OCPBUGS-33642]: https://issues.redhat.com/browse/OCPBUGS-33642
[OCPBUGS-34683]: https://issues.redhat.com/browse/OCPBUGS-34683
[OCPBUGS-35928]: https://issues.redhat.com/browse/OCPBUGS-35928
[OCPBUGS-38734]: https://issues.redhat.com/browse/OCPBUGS-38734
[OCPBUGS-42985]: https://issues.redhat.com/browse/OCPBUGS-42985
[OCPBUGS-52589]: https://issues.redhat.com/browse/OCPBUGS-52589
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
[#14864]: https://github.com/openshift/console/pull/14864
