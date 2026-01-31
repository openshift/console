# Changelog for `@openshift-console/dynamic-plugin-sdk`

Console plugin SDK packages follow a semver scheme where the major and minor version number indicates
the earliest supported OCP Console version, and the patch version number indicates the release of that
particular package.

For released (GA) versions of Console, use `4.x.z` packages.
For current development version of Console, use `4.x.0-prerelease.n` packages.

For older 1.x plugin SDK packages, refer to "OpenShift Console Versions vs SDK Versions" compatibility
table in [Console dynamic plugins README](./README.md).

## 4.22.0-prerelease.2 - TBD

- **Breaking**: Removed `pluginID` from the result in `useResolvedExtensions` hook ([CONSOLE-3769], [#15904])
- The following types are now re-exported from `@openshift/dynamic-plugin-sdk` instead of being defined
  by Console: `CodeRef`, `EncodedCodeRef`, `LoadedExtension`, and `ResolvedExtension` ([CONSOLE-3769], [#15904])

## 4.22.0-prerelease.1 - 2025-01-21

> [!IMPORTANT]
> This release includes breaking changes that impact all existing Console plugins.
> Refer to upgrade-sdk.md for details on how to adapt your plugins for Console 4.22.

- **Breaking**: Removed ability to load plugins that use legacy plugin manifest format ([CONSOLE-3769], [#15778])
- **Breaking**: Removed `setPluginStore` function in `k8s-utils.ts` ([CONSOLE-3769], [#15778])
- **Breaking**: Removed `useSafetyFirst` ([CONSOLE-5039], [#14869])
- **Type breaking**: Removed `ExtensionDeclaration` from `types.ts`. Plugins should use `Extension` type instead ([CONSOLE-3769], [#15778])
- **Type breaking**: Changed the default type parameters of `Extension<any>` to `Extension<string, AnyObject>` ([CONSOLE-3769], [#15778])
- **Type breaking**: Fix inaccurate types in `console.topology/details/resource-link` and
  `console.topology/details/tab-section`. ([CONSOLE-4630], [#15893])
- **Type breaking**: Fix inaccurate types in `console.catalog/item-type`. ([CONSOLE-4402], [#14869])
- Add support for the updated `React.FC` type in `@types/react` version 18 ([CONSOLE-4630], [#15893])
- Make all Console-provided shared modules optional peer dependencies ([CONSOLE-5050], [#15934])

## 4.21.0-prerelease.1 - 2025-12-04

- **Deprecated**: `setPluginStore` function in `k8s-utils.ts`. The function is now a noop and the export
  will be removed in a future release. ([CONSOLE-4840], [#15671])
- **Type breaking**: Fix `popupComponent` prop type in extension `console.dashboards/overview/health/resource` ([CONSOLE-4796], [#15526])
- **Type breaking**: `AlwaysOnExtension` and `ModelDefinition` types are removed from `api/common-types`. ([CONSOLE-3769], [#15509])
- The following types are now re-exported from `@openshift/dynamic-plugin-sdk` instead of being defined
  locally: `ExtensionFlags`, `ExtensionTypeGuard`, `ResolvedCodeRefProperties`, `RemoteEntryModule`, and `Update`. ([CONSOLE-4840], [#15509], [#15671])
- Add optional `fetch` property to extension `console.dashboards/overview/health/url` ([CONSOLE-4796], [#15526])
- Add optional `infrastructure` parameter to `PrometheusHealthHandler` type ([CONSOLE-4796], [#15526])
- Allow `K8sResourceKind` in `TopologyDataObject`, `TopologyResourcesObject`, and `OverviewItem` types ([CONSOLE-4840], [#15699])
- Allow async functions for the `resources` property of `console.topology/data/factory` extension ([CONSOLE-4806], [#15641])
- Add color theme and font size customization to `ResourceYAMLEditor` component ([CONSOLE-4701], [#15735])
- Ensure proper pass-through of `props.editorProps.theme` and `props.options.fontFamily` to `CodeEditor` component ([CONSOLE-4701], [#15735])

## 4.20.0 - 2025-11-24

> Initial release for OCP Console 4.20.

- Add new `console.catalog/categories-provider` extension ([CONSOLE-4576], [#15269])
- Add optional `sortFilterGroups` property to extension `console.catalog/item-type` ([CONSOLE-4576], [#15269])
- Fixed namespaced path generation for non-namespaced resources in `getK8sResourcePath` utility ([OCPBUGS-58118], [#15498])

## 4.20.0-prerelease.1 - 2025-08-15

- Add fullscreen toggle button to `ResourceYAMLEditor` component ([CONSOLE-4656], [#15254])
- Add copy to clipboard button to `ResourceYAMLEditor` when download button is shown ([CONSOLE-4654], [#15254])
- Move `CodeEditor` settings into a modal that can be opened from the editor toolbar ([CONSOLE-4499], [#15254])
- Ensure proper pass-through of `shortcutsPopoverProps` to `CodeEditor` component ([CONSOLE-4499], [#15254])
- Improve `initialResource` prop type in `ResourceYAMLEditor` component ([OCPBUGS-45297], [#15386])
- Improve plugin API documentation ([OCPBUGS-56248], [#15167])

## 4.19.1 - 2025-08-15

- Fix `href` handling bug for extension type `console.tab/horizontalNav` ([OCPBUGS-58258], [#15231])

## 4.19.0 - 2025-06-27

> Initial release for OCP Console 4.19.

- Improve `useModal` hook to support multiple modals and prop pass-through ([OCPBUGS-49709], [#15139])
- Add `noCheckForEmptyGroupAndResource` parameter to `useAccessReview` hook ([OCPBUGS-55368], [#15017])

## 4.19.0-prerelease.2 - 2025-05-20

> [!IMPORTANT]
> This release includes a change in generated JS code to use new JSX transform `react-jsx` introduced
> in React 17. Plugins should update their TSConfig files accordingly (i.e. set `jsx` to `react-jsx`)
> and run the `update-react-imports` [codemod](https://github.com/reactjs/react-codemod) if needed.

- Add `DocumentTitle` component that allows plugins to modify Console page title ([CONSOLE-3960], [#14876])
- Add `hideFavoriteButton` prop to `ListPageHeader` component ([OCPBUGS-52948], [#14863])
- Upgrade `monaco-editor` version used by `CodeEditor`, `YAMLEditor` and `ResourceYAMLEditor` components
  to version `0.51.0`. This affects the `ref` which these components expose. ([CONSOLE-4407], [#14663])
- Generated JS code now uses new JSX transform `react-jsx` ([OCPBUGS-52589], [#14864])

## 4.19.0-prerelease.1 - 2025-02-17

- Add `customData` prop to `HorizontalNav` component ([OCPBUGS-45319], [#14575])
- Allow custom popover description in extension type `console.resource/details-item` ([CONSOLE-4269], [#14487])
- Change generated JS build target from `es2016` to `es2021` ([CONSOLE-4400], [#14620])

## 4.18.0 - 2025-09-04

> Initial release for OCP Console 4.18.

- Fix `href` handling bug for extension type `console.tab/horizontalNav` ([OCPBUGS-58258], [#15231])
- Improve `useModal` hook to support multiple modals and prop pass-through ([OCPBUGS-49709], [#15139])
- Allow custom popover description in extension type `console.resource/details-item` ([CONSOLE-4269], [#14487])

## 1.8.0 - 2024-11-04

- Add `allRowsSelected` and `canSelectAll` props to `VirtualizedTable` component ([OCPBUGS-43998], [#14447])

## 1.7.0 - 2024-10-31

- Add `onRowsRendered` prop to `VirtualizedTable` component ([OCPBUGS-43538], [#14421])
- Document Content Security Policy for Console web application ([CONSOLE-4263], [#14156])
- Document existing Console dynamic plugin projects ([#14096])

## 1.6.0 - 2024-08-12

- Add `csvData` prop to `VirtualizedTable` component ([CONSOLE-4185], [#14050])
- Document how to translate plugin messages using `i18next` and `react-i18next` ([OCPBUGS-37426], [#14081])

## 1.5.0 - 2024-08-02

- Fix active perspective detection code ([OCPBUGS-19048], [#13785])
- Add new extension type `console.create-project-modal` ([CONSOLE-3792], [#13825])
- Add and expose `useQuickStartContext` hook ([OCPBUGS-36678], [#14055])

## 1.4.0 - 2024-07-02

- Expose `useUserSettings` hook ([OCPBUGS-33567], [#13843])
- Add `sortColumnIndex` and `sortDirection` props to `VirtualizedTable` component ([OCPBUGS-33539], [#13916])
- Document Console 4.16 shared module changes ([OCPBUGS-34538], [CONSOLE-3662], [CONSOLE-4097], [#13900])

## 1.3.0 - 2024-04-09

- Add new props to `ResourceYAMLEditor` component ([OCPBUGS-31703], [#13722])

## 1.2.0 - 2024-04-03

- Support returning entire response body in `consoleFetchJSON` and `consoleFetchText` ([CONSOLE-3949], [#13623])
- Add `readOnly` prop in `ResourceYAMLEditor` component ([OCPBUGS-31355], [#13694])

## 1.1.0 - 2024-03-19

- Add search filter functionality to `ListPageFilter` component ([OCPBUGS-30077], [#13233])
- Improve plugin SDK documentation and add PatternFly upgrade notes ([CONSOLE-3883], [#13637])

## 1.0.0 - 2024-02-09

> Initial v1 release. Changes listed here refer to the latest 0.0.x version (0.0.21) of this package.

- Add new extension type `console.resource/details-item` ([CONSOLE-3695], [#13240])
- Allow custom perspective display icon in extension type `dev-console.add/action-group` ([ODC-7425], [#13338])
- Use PatternFly 5 in Console and relax singleton config of PatternFly shared modules ([CONSOLE-3693], [#12983])
- Add new extension type `console.node/status` ([CONSOLE-3899], [#13493])

[CONSOLE-3662]: https://issues.redhat.com/browse/CONSOLE-3662
[CONSOLE-3693]: https://issues.redhat.com/browse/CONSOLE-3693
[CONSOLE-3695]: https://issues.redhat.com/browse/CONSOLE-3695
[CONSOLE-3769]: https://issues.redhat.com/browse/CONSOLE-3769
[CONSOLE-3792]: https://issues.redhat.com/browse/CONSOLE-3792
[CONSOLE-3883]: https://issues.redhat.com/browse/CONSOLE-3883
[CONSOLE-3899]: https://issues.redhat.com/browse/CONSOLE-3899
[CONSOLE-3949]: https://issues.redhat.com/browse/CONSOLE-3949
[CONSOLE-3960]: https://issues.redhat.com/browse/CONSOLE-3960
[CONSOLE-4097]: https://issues.redhat.com/browse/CONSOLE-4097
[CONSOLE-4185]: https://issues.redhat.com/browse/CONSOLE-4185
[CONSOLE-4263]: https://issues.redhat.com/browse/CONSOLE-4263
[CONSOLE-4269]: https://issues.redhat.com/browse/CONSOLE-4269
[CONSOLE-4400]: https://issues.redhat.com/browse/CONSOLE-4400
[CONSOLE-4402]: https://issues.redhat.com/browse/CONSOLE-4402
[CONSOLE-4407]: https://issues.redhat.com/browse/CONSOLE-4407
[CONSOLE-4499]: https://issues.redhat.com/browse/CONSOLE-4499
[CONSOLE-4576]: https://issues.redhat.com/browse/CONSOLE-4576
[CONSOLE-4630]: https://issues.redhat.com/browse/CONSOLE-4630
[CONSOLE-4654]: https://issues.redhat.com/browse/CONSOLE-4654
[CONSOLE-4656]: https://issues.redhat.com/browse/CONSOLE-4656
[CONSOLE-4701]: https://issues.redhat.com/browse/CONSOLE-4701
[CONSOLE-4796]: https://issues.redhat.com/browse/CONSOLE-4796
[CONSOLE-4806]: https://issues.redhat.com/browse/CONSOLE-4806
[CONSOLE-4840]: https://issues.redhat.com/browse/CONSOLE-4840
[CONSOLE-5039]: https://issues.redhat.com/browse/CONSOLE-5039
[CONSOLE-5050]: https://issues.redhat.com/browse/CONSOLE-5050
[OCPBUGS-19048]: https://issues.redhat.com/browse/OCPBUGS-19048
[OCPBUGS-30077]: https://issues.redhat.com/browse/OCPBUGS-30077
[OCPBUGS-31355]: https://issues.redhat.com/browse/OCPBUGS-31355
[OCPBUGS-31703]: https://issues.redhat.com/browse/OCPBUGS-31703
[OCPBUGS-33539]: https://issues.redhat.com/browse/OCPBUGS-33539
[OCPBUGS-33567]: https://issues.redhat.com/browse/OCPBUGS-33567
[OCPBUGS-34538]: https://issues.redhat.com/browse/OCPBUGS-34538
[OCPBUGS-36678]: https://issues.redhat.com/browse/OCPBUGS-36678
[OCPBUGS-37426]: https://issues.redhat.com/browse/OCPBUGS-37426
[OCPBUGS-43538]: https://issues.redhat.com/browse/OCPBUGS-43538
[OCPBUGS-43998]: https://issues.redhat.com/browse/OCPBUGS-43998
[OCPBUGS-45297]: https://issues.redhat.com/browse/OCPBUGS-45297
[OCPBUGS-45319]: https://issues.redhat.com/browse/OCPBUGS-45319
[OCPBUGS-49709]: https://issues.redhat.com/browse/OCPBUGS-49709
[OCPBUGS-52589]: https://issues.redhat.com/browse/OCPBUGS-52589
[OCPBUGS-52948]: https://issues.redhat.com/browse/OCPBUGS-52948
[OCPBUGS-55368]: https://issues.redhat.com/browse/OCPBUGS-55368
[OCPBUGS-56248]: https://issues.redhat.com/browse/OCPBUGS-56248
[OCPBUGS-57755]: https://issues.redhat.com/browse/OCPBUGS-57755
[OCPBUGS-58118]: https://issues.redhat.com/browse/OCPBUGS-58118
[OCPBUGS-58258]: https://issues.redhat.com/browse/OCPBUGS-58258
[OCPBUGS-58375]: https://issues.redhat.com/browse/OCPBUGS-58375
[ODC-7425]: https://issues.redhat.com/browse/ODC-7425
[#12983]: https://github.com/openshift/console/pull/12983
[#13233]: https://github.com/openshift/console/pull/13233
[#13240]: https://github.com/openshift/console/pull/13240
[#13338]: https://github.com/openshift/console/pull/13338
[#13493]: https://github.com/openshift/console/pull/13493
[#13623]: https://github.com/openshift/console/pull/13623
[#13637]: https://github.com/openshift/console/pull/13637
[#13694]: https://github.com/openshift/console/pull/13694
[#13722]: https://github.com/openshift/console/pull/13722
[#13785]: https://github.com/openshift/console/pull/13785
[#13825]: https://github.com/openshift/console/pull/13825
[#13843]: https://github.com/openshift/console/pull/13843
[#13900]: https://github.com/openshift/console/pull/13900
[#13916]: https://github.com/openshift/console/pull/13916
[#14050]: https://github.com/openshift/console/pull/14050
[#14055]: https://github.com/openshift/console/pull/14055
[#14081]: https://github.com/openshift/console/pull/14081
[#14096]: https://github.com/openshift/console/pull/14096
[#14156]: https://github.com/openshift/console/pull/14156
[#14421]: https://github.com/openshift/console/pull/14421
[#14447]: https://github.com/openshift/console/pull/14447
[#14487]: https://github.com/openshift/console/pull/14487
[#14575]: https://github.com/openshift/console/pull/14575
[#14620]: https://github.com/openshift/console/pull/14620
[#14663]: https://github.com/openshift/console/pull/14663
[#14863]: https://github.com/openshift/console/pull/14863
[#14864]: https://github.com/openshift/console/pull/14864
[#14869]: https://github.com/openshift/console/pull/14869
[#14876]: https://github.com/openshift/console/pull/14876
[#15017]: https://github.com/openshift/console/pull/15017
[#15139]: https://github.com/openshift/console/pull/15139
[#15167]: https://github.com/openshift/console/pull/15167
[#15231]: https://github.com/openshift/console/pull/15231
[#15254]: https://github.com/openshift/console/pull/15254
[#15269]: https://github.com/openshift/console/pull/15269
[#15386]: https://github.com/openshift/console/pull/15386
[#15498]: https://github.com/openshift/console/pull/15498
[#15509]: https://github.com/openshift/console/pull/15509
[#15526]: https://github.com/openshift/console/pull/15526
[#15641]: https://github.com/openshift/console/pull/15641
[#15671]: https://github.com/openshift/console/pull/15671
[#15699]: https://github.com/openshift/console/pull/15699
[#15735]: https://github.com/openshift/console/pull/15735
[#15778]: https://github.com/openshift/console/pull/15778
[#15893]: https://github.com/openshift/console/pull/15893
[#15904]: https://github.com/openshift/console/pull/15904
[#15934]: https://github.com/openshift/console/pull/15934
