# Changelog for `@openshift-console/dynamic-plugin-sdk`

Refer to [Console dynamic plugins README][README] for OpenShift Console version vs SDK package
version and PatternFly version compatibility.

## 1.3.0 - 2024-04-09

- Add new props to `ResourceYAMLEditor` component ([OCPBUGS-31703], [#13722])

## 1.2.0 - 2024-04-03

- Support returning entire response body in `consoleFetchJSON` and `consoleFetchText` ([CONSOLE-3949], [#13623])
- Add `readOnly` prop in `ResourceYAMLEditor` component ([OCPBUGS-31355], [#13694])

## 1.1.0 - 2024-03-19

- Add search filter functionality to `ListPageFilter` component ([OCPBUGS-30077], [#13233])
- Improve dynamic plugin SDK documentation and add PatternFly upgrade notes ([CONSOLE-3883], [#13637])

## 1.0.0 - 2024-02-09

> Initial v1 release. Changes listed here refer to the latest 0.0.x version (0.0.21) of this package.

- Add new extension type `console.resource/details-item` ([CONSOLE-3695], [#13240])
- Allow custom perspective display icon in extension type `dev-console.add/action-group` ([ODC-7425], [#13338])
- Use PatternFly 5 in Console and relax singleton config of PatternFly shared modules ([CONSOLE-3693], [#12983])
- Add new extension type `console.node/status` ([CONSOLE-3899], [#13493])

[README]: ./README.md
[CONSOLE-3693]: https://issues.redhat.com/browse/CONSOLE-3693
[CONSOLE-3695]: https://issues.redhat.com/browse/CONSOLE-3695
[CONSOLE-3883]: https://issues.redhat.com/browse/CONSOLE-3883
[CONSOLE-3899]: https://issues.redhat.com/browse/CONSOLE-3899
[CONSOLE-3949]: https://issues.redhat.com/browse/CONSOLE-3949
[OCPBUGS-30077]: https://issues.redhat.com/browse/OCPBUGS-30077
[OCPBUGS-31355]: https://issues.redhat.com/browse/OCPBUGS-31355
[OCPBUGS-31703]: https://issues.redhat.com/browse/OCPBUGS-31703
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
