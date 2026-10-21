---
name: plugin-api-review
description: Review changes to the OpenShift Console plugin API for compliance with contribution guidelines, styleguide, and proper documentation in changelogs. Provides a detailed report of findings and compliance score.
allowed-tools: Bash(git diff *), GitHub API, Web search, Read, Grep, Glob
---

# /plugin-api-review

## Context
- Files in git staging and commits that are not present of the `main` branch are
  considered recently edited and should be reviewed for plugin API compliance.
- The current in-development version of OpenShift is determined by finding the
  lowest-number release branch which still tracks `main`, in the [upstream remote].
  That is, if `git diff upstream/main...upstream/release-4.18` shows no differences,
  then `4.18` is the current version of OpenShift.
- The plugin API is defined as the exports within [console-dynamic-plugin-sdk],
  as well as any files which affect consumers of the SDK. This includes SDK
  functions, React components, React hooks, TypeScript types and interfaces (such
  as extension points, utility types, and other SDK exported types), and shared
  modules provided to plugins by the console using webpack module federation.
  The files which affect consumers of the SDK are labelled with `plugin-api-changed`
  in the OWNERS file of that directory.
- Changes to JavaScript files which are not part of the plugin API should be
  ignored.
- CSS classes may be inadvertently used by plugins, so changes to CSS files
  should be reviewed for potential breakages. Perform a search on GitHub for
  the class name to see if it is used in any public plugins. Repos which are
  console dynamic plugins will always consume
  `@openshift-console/dynamic-plugin-sdk` in the `package.json` file of the repo.
- A JIRA issue may be required for proper documentation of a CHANGELOG. Determine
  the JIRA issue by the prefix of the current branch or by unmerged commits. For
  example, a branch named `OCPBUGS-12345-fix-thing` or a commit with the message
  `OCPBUGS-12345: Fix thing` indicates the JIRA issue is `OCPBUGS-12345`. The
  most common prefixes are `OCPBUGS` and `CONSOLE`. You do not need to verify that
  the JIRA issue exists, only that a JIRA issue is associated with the change.

## Rules

You are a senior engineer reviewing changes to the OpenShift Console plugin API.
The OpenShift Console plugin API is used by various first and third-party plugins,
so it is critical that changes to the API are backwards-compatible when possible,
and that all changes are properly documented in the appropriate changelogs.

When reviewing changes to the plugin API, ensure the following rules are followed:

- Breaking changes, such as removal of shared modules, or removal
  of extensions, MUST first be deprecated in a previous release and documented in
  the appropriate changelogs. Major version bumps in shared modules do not require
  notice from previous releases. Deprecations are documented before breaking changes
  in the changelog for the version in which the deprecation occurs.
- New API or extension points MUST be well documented with descriptions that are
  clear enough to allow plugin authors to understand their purpose and usage without
  referring back to the source code. Assume that plugin authors do not have
  knowledge of the internal workings of OpenShift Console. New documentation SHOULD
  contain examples of usage where applicable, edge cases and behavior when parameters
  such as `null`, `undefined`, or invalid values are provided.
- Well documented TSDoc includes: all props are properly documented if documenting a
  React component, all arguments and return types are documented for functions and
  React hooks, and complex types such as interfaces and type aliases have clear
  descriptions of their purpose and usage, and examples. Moreover, proper IntelliSense
  support is required for all public APIs to enhance developer experience.
- Changes to plugin extensions (files under [the extensions folder]) MUST be
  backwards-compatible with the current version of OpenShift. Exceptions can be
  made for changes which fix an extension which does not work in the current version,
  however any and ALL breaking changes MUST be documented in the appropriate changelog.
- Changes to shared modules MUST be documented in the "Changes to shared modules
  and API" section of the [dynamic plugin SDK release notes] for the next version.
- Similarly, changes to the `@openshift-console/dynamic-plugin-sdk` package, such
  as changes to the infrastructure code, changes to extension point types, or other
  exported types, MUST be documented in the appropriate section of the
  [SDK core changelog] for the next version. The changelog requires a JIRA ticket
  and PR number for each change. The changelog is sectioned by each version of
  the dynamic plugin SDK. If the next version is not yet created, add a new section
  for it at the top of the changelog. You can determine the next version by taking
  the current version of OpenShift and appending `.0-prerelease.1`. For example,
  if the current version of OpenShift is `4.17`, the next version of the dynamic
  plugin SDK is `4.17.0-prerelease.1`. The date can be left blank and filled in
  when the release is made.
- Changes to `@openshift-console/dynamic-plugin-sdk-webpack` package MUST also be
  documented in the appropriate section of the [SDK webpack changelog] for the
  next version.
- Major changes to the API may also be documented by an accompanying entry to the
  associated [dynamic plugin SDK release notes] for the next version.
- CSS changes are documented in the "CSS styling" section of the
  [dynamic plugin SDK release notes] for the next version if they remove or rename
  existing classes which may be used by plugins.
- Ensure that the [styleguide] is in full compliance for all changed files.
- Ensure that the [contribution guide] is followed for commit messages.

## Example report format 1

```md
API change: Updated extension `console.foo/bar` to support new prop `baz`.
JIRA issue: CONSOLE-1234
Changes to changelog made? Yes

Summary: The extension `console.foo/bar` was updated to support a new prop `baz`
which allows plugins to customize the behavior of the extension. This change is
backwards-compatible as existing plugins which use the extension without the new
prop will continue to work as before.

Findings:
- [x] Reviewed changes to the API for backwards-compatibility and verified no breaking changes.
- [x] Verified that the change is documented in the "Changes to plugin API" section of the
  [dynamic plugin SDK release notes], or that this change is not applicable.
- [x] Verified that the change does not need to be documented in the "Changes to shared modules and API"
  section of the [dynamic plugin SDK release notes], or that this change is not applicable.
- [x] Verified that the change is documented in the [SDK core changelog], or that this change is not applicable.
- [x] Verified that the change is documented in the [SDK webpack changelog], or that this change is not applicable.
- [x] Verified that the [styleguide] is in full compliance for all changed files.
- [x] Verified that any CSS class changes are documented in the "CSS styling" section of the
  [dynamic plugin SDK release notes].
- [x] Verified that a JIRA issue is associated with the change.
- [x] Verified that the JIRA issue is correctly referenced in the changelog(s).
- [ ] Verified that the PR number is correctly referenced in the changelog(s).

Issues found during review:
- A PR was not linked to the changelog. I could not find the PR number, so this must be done manually.

Actions taken:
- I have updated the changelog(s) to include the API change with the correct JIRA issue.

Compliance score: 9/10

Reason for score:
- I was unable to verify that the PR number is correctly referenced in the changelog(s)
  because I could not find the PR number associated with the change.
- All findings were otherwise satisfactorily addressed.
- No breaking changes were found.
- The [styleguide] is in full compliance for all changed files.
```

## Example report format 2

```md
API change: Removed extension `console.foo/old-extension`.
JIRA issue: unknown
Changes to changelog made? Already documented

Summary: The extension `console.foo/old-extension` was removed as it was deprecated
in a previous release and is no longer needed. This is a breaking change for
plugins which still use the extension, and has been documented in the "Changes to
plugin API" section of the [dynamic plugin SDK release notes] for the next version.

Findings:
- [x] Reviewed changes to extension `console.foo/bar` for backwards-compatibility.
- [x] Verified that the change is documented in the "Changes to plugin API" section of the
  [dynamic plugin SDK release notes], or that this change is not applicable.
- [x] Verified that the change does not need to be documented in the "Changes to shared modules and API"
  section of the [dynamic plugin SDK release notes], or that this change is not applicable.
- [x] Verified that the change is documented in the [SDK core changelog], or that this change is not applicable.
- [x] Verified that the change is documented in the [SDK webpack changelog], or that this change is not applicable.
- [x] Verified that the [styleguide] is in full compliance for all changed files.
- [x] Verified that any CSS class changes are documented in the "CSS styling" section of the
  [dynamic plugin SDK release notes].
- [x] Verified that a JIRA issue is associated with the change.
- [x] Verified that the JIRA issue is correctly referenced in the changelog(s).
- [ ] Verified that the PR number is correctly referenced in the changelog(s).

Issues found during review:
- The extension was not deprecated before removal. You must provide at least one
  release cycle of deprecation notice before removing an extension.
- I was unable to find a JIRA issue associated with this change. Please create
  a JIRA issue to document this breaking change.

Actions taken:
None

Compliance score: 2/10

Reason for score:
- The extension was removed without prior deprecation notice.
- A JIRA issue was not found for this change.
- All other findings were satisfactorily addressed.
- The [styleguide] is in full compliance for all changed files.
```

[contribution guide]: ../../../CONTRIBUTING.md
[styleguide]: ../../../STYLEGUIDE.md
[upstream remote]: https://github.com/openshift/console.git
[console-dynamic-plugin-sdk]: ../../../frontend/packages/console-dynamic-plugin-sdk/
[the extensions folder]: ../../../frontend/packages/console-dynamic-plugin-sdk/src/extensions/
[dynamic plugin SDK release notes]: ../../../frontend/packages/console-dynamic-plugin-sdk/release-notes
[SDK core changelog]: ../../../frontend/packages/console-dynamic-plugin-sdk/CHANGELOG-core.md
[SDK webpack changelog]: ../../../frontend/packages/console-dynamic-plugin-sdk/CHANGELOG-webpack.md
