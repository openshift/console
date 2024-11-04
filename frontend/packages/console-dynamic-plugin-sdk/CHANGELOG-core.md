# Changelog for `@openshift-console/dynamic-plugin-sdk`

Refer to [Console dynamic plugins README](./README.md) for OpenShift Console version vs SDK package
version and PatternFly version compatibility.

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
[CONSOLE-3792]: https://issues.redhat.com/browse/CONSOLE-3792
[CONSOLE-3883]: https://issues.redhat.com/browse/CONSOLE-3883
[CONSOLE-3899]: https://issues.redhat.com/browse/CONSOLE-3899
[CONSOLE-3949]: https://issues.redhat.com/browse/CONSOLE-3949
[CONSOLE-4097]: https://issues.redhat.com/browse/CONSOLE-4097
[CONSOLE-4185]: https://issues.redhat.com/browse/CONSOLE-4185
[CONSOLE-4263]: https://issues.redhat.com/browse/CONSOLE-4263
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
