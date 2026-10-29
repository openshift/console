# oxlint-plugin-console

OpenShift Console's [oxlint] rules and presets.

## Usage

When extending multiple configurations, add to the list following the order outlined below:

| Config     | Description                                                        | Type  |
| ---------- | ------------------------------------------------------------------ | ----- |
| base       | airbnb-base translation: core, import, promise, oxc, unicorn rules | core  |
| react      | React, jsx-a11y and React Compiler rules                           | core  |
| typescript | TypeScript rules (native `typescript` plugin)                      | ts    |
| jest       | Jest + testing-library overlay for test files                      | extra |
| node       | Node rules (`n/*` via eslint-plugin-n JS plugin)                   | extra |
| playwright | Playwright rules for e2e tests                                     | extra |

- Choose one `core`.
- Choose one `ts`.
- Choose one or more `extra`.

Alternatively, use one of the pre-composed configurations representing common code archetypes
(choose one):

| Config          | Description                             |
| --------------- | --------------------------------------- |
| reactTypescript | Common web preset: React, TypeScript    |
| nodeTypescript  | Common Node.js preset: TypeScript, node |

## JS plugins

Rules whose plugins have no native oxlint implementation run verbatim through oxlint's JS plugin
runtime, so behavior matches the ESLint implementations exactly. The reserved oxlint namespaces
force aliases:

| Rule prefix         | Plugin                        | Why aliased                                       |
| ------------------- | ----------------------------- | ------------------------------------------------- |
| `playwright/*`      | eslint-plugin-playwright      | not implemented natively                          |
| `testing-library/*` | eslint-plugin-testing-library | not implemented natively                          |
| `n/*`               | eslint-plugin-n               | not implemented natively                          |
| `react-js/*`        | eslint-plugin-react           | `react` namespace is reserved                     |
| `react-hooks-js/*`  | eslint-plugin-react-hooks     | reserved; runs the REFERENCE React Compiler rules |
| `import-js/*`       | eslint-plugin-import          | `import` namespace is reserved                    |
| `eslint-js/*`       | core-rules shim               | `eslint` namespace is reserved                    |

The `eslint` package remains a dependency only as the source of the core rules re-exported by the
shim (and as a peer dependency of the other JS plugins); ESLint is not used as a linter.

## Warning budget

This repo is currently undergoing a staged migration to enable React compiler. A exact warning count
is defined in `package.json` and enforced in CI. When oxlint warnings are fixed, the warning count
is expected to be lowered in the same PR, while the warning count is never expected to be raised.

[oxlint]: https://oxc.rs/docs/guide/usage/linter.html
