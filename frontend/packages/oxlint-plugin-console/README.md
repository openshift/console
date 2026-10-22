# oxlint-plugin-console

OpenShift Console's oxlint rules and presets. The repo is linted by
[oxlint](https://oxc.rs/docs/guide/usage/linter.html) — ESLint was removed
after a staged migration — and formatted by standalone oxfmt. This package
and `frontend/oxlint.config.ts` are the source of truth for what is linted
and where; this README documents both.

## Repo lint workflow

Commands run from `frontend/`:

- `yarn lint` — the lint gate: an exact-count warning ratchet
  (`MAX_WARNINGS=556`) over `yarn oxlint`.
- `yarn oxlint [path|--fix …]` — runs oxlint via
  `scripts/oxlint-exact-warnings.cjs`, which forwards all arguments, so
  `yarn oxlint <path>` lints just that path. `MAX_WARNINGS` is only set by
  `yarn lint`, so direct invocations are report-only (they still fail on
  error-level findings).
- `yarn typecheck-oxlint-plugin` — type-checks this package and
  `oxlint.config.ts` (both are excluded from the root tsconfig; see
  [Configuration](#configuration)). Also run as a test-frontend.sh step.

## Usage

When extending multiple configurations, add to the list following the order
outlined below:

| Config     | Description                                                                | Type     |
| ---------- | -------------------------------------------------------------------------- | -------- |
| base       | airbnb-base translation: core, import, promise, oxc, unicorn rules         | core     |
| react      | React, jsx-a11y and React Compiler rules                                   | core     |
| typescript | TypeScript rules (native `typescript` plugin)                               | ts       |
| jest       | Jest + testing-library overlay for test files                              | extra    |
| node       | Node rules (`n/*` via eslint-plugin-n JS plugin)                           | extra    |
| playwright | Playwright rules for e2e tests + the `waitFor()` no-restricted-syntax guard | extra    |

- Choose one `core`.
- Choose one `ts`.
- Choose one or more `extra`.

Alternatively, use one of the pre-composed configurations representing
common code archetypes (choose one):

| Config          | Description                                 |
| --------------- | ------------------------------------------- |
| reactTypescript | Common web preset: React, TypeScript        |
| nodeTypescript  | Common Node.js preset: TypeScript, node     |

## Configuration

`oxlint.config.ts` decides where to lint and extends these presets for what
to lint:

| Scope        | Files                                          | Preset            |
| ------------ | ---------------------------------------------- | ----------------- |
| frontend     | `public/**`, `packages/**`, `__tests__/**` (minus tooling) | `reactTypescript` |
| repo tooling | root `*.ts`, `scripts`, SDK codegen/webpack, … | `nodeTypescript`  |
| e2e          | `e2e/**`                                       | `playwright`      |
| test files   | `**/__tests__/**`, `**/*.spec.*` (not e2e)     | `jest` overlay    |

Because oxlint overrides do not support `extends`, a preset's
`rules`/`jsPlugins` are placed directly in the files-scoped override — the
same inlining FlatCompat performed for the former `eslint.config.ts`
blocks:

```ts
import configs from 'oxlint-plugin-console';
// ...
{
  files: ['public/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}', '__tests__/**/*.{ts,tsx}'],
  ...configs.reactTypescript,
}
```

The composed presets (`reactTypescript`, `nodeTypescript`) are flattened in
the package for this purpose. The one exception is the jest overlay, which
self-scopes to test files via oxlint's root-level `extends`.

The presets live in `lib/config/` with the rule dictionaries in
`lib/config/rules/` — edit those by hand; there is no generator. The rules
files are minimal edits of the former eslint-plugin-console files (comments,
spacing and rule order preserved), so config changes stay reviewable as
semantic diffs only. The airbnb defaults are materialized in
`rules/airbnb-base.ts` and `rules/airbnb-react.ts` (from
eslint-config-airbnb-base@15.0.0 / eslint-config-airbnb@19.0.4); the presets
compose them with the console's tweak files via `lib/config/merge-rules.ts`
(lodash deep-merge with eslintrc-style option merging).

The package is ESM (`"type": "module"`, extension-qualified imports —
loaded by Node's native TypeScript support, no transpiler or CJS shim) and
carries its types in the sources themselves (annotated against
`OxlintConfig`; no separate declaration file). Because those
extension-qualified imports are not allowed by the repo-root tsconfig
(which deliberately does not set `allowImportingTsExtensions`), both the
package and `oxlint.config.ts` are excluded from the root project and
type-checked by the package's own `tsconfig.json` instead — via
`yarn typecheck-oxlint-plugin` (Node's type-stripping loader does not
type-check, so the check is explicit).

## JS plugins

Rules whose plugins have no native oxlint implementation run verbatim
through oxlint's JS plugin runtime, so behavior (options, severities,
`eslint-disable` comments — which must use the names below) matches the
ESLint implementations exactly. The reserved oxlint namespaces force
aliases:

| Rule prefix         | Plugin                        | Why aliased                                             |
| ------------------- | ----------------------------- | ------------------------------------------------------- |
| `playwright/*`      | eslint-plugin-playwright      | not implemented natively                                |
| `testing-library/*` | eslint-plugin-testing-library | not implemented natively                                |
| `n/*`               | eslint-plugin-n               | not implemented natively                                |
| `react-js/*`        | eslint-plugin-react           | `react` namespace is reserved                           |
| `react-hooks-js/*`  | eslint-plugin-react-hooks     | reserved; runs the REFERENCE React Compiler rules       |
| `import-js/*`       | eslint-plugin-import          | `import` namespace is reserved                          |
| `eslint-js/*`       | core-rules shim (`lib/js-plugins/eslint-js-rules.ts`) | `eslint` namespace is reserved |

The React Compiler rules (`react-hooks-js/*`) are the reference
eslint-plugin-react-hooks implementation rather than oxlint's native ports,
because the ports under-report (107 vs 154 `set-state-in-effect` findings,
40 vs 82 `refs`, …). This preserves the exact 267-warning React Compiler
ratchet that ESLint maintained.

The `eslint` package remains a dependency only as the source of the core
rules re-exported by the shim (and as a peer dependency of the other JS
plugins); ESLint is not used as a linter.

## Inline suppressions

`// eslint-disable` comments work, but the rule name must match the oxlint
rule name — for JS-plugin rules that means the ALIASED prefix. When
suppressing anew, use:

- `react-hooks-js/exhaustive-deps`, `react-hooks-js/refs`, … (compiler rules)
- `react-js/jsx-no-bind`, `import-js/order`, `eslint-js/no-restricted-syntax`, …
- native rules keep their names: `react/jsx-key`, `typescript/no-explicit-any`,
  `jest/no-focused-test`, bare `no-var`, …

## Coverage

Of the 370 ESLint rules the old setup enabled for ts/tsx, all but
`@typescript-eslint/naming-convention` are enforced (it requires type
information — adopting it would need the experimental `oxlint-tsgolint`).
`react/jsx-no-duplicate-props` runs without its `ignoreCase` option (oxlint
takes no options for it). ESLint's JSON linting scope (`plugin:json`) has no
replacement — oxlint does not lint JSON files.

## Warning budget

`MAX_WARNINGS=556` = 267 React Compiler findings (matching ESLint's ratchet
exactly) + 289 legacy findings that ESLint did not report, kept as warnings:

- 247 `import/no-named-as-default-member` — oxlint resolves `i18next`'s ESM
  export map; eslint-plugin-import silently skipped these
- 22 `oxc/no-barrel-file`, 18 downgraded misc., … (see the git history for
  the original divergence analysis)

Lower the budget in the same change that fixes warnings; the exact-count
ratchet (`scripts/oxlint-exact-warnings.cjs`) fails on both regressions and
stale budgets.

## Formatting

`yarn prettier-all` runs oxfmt (`**/*.{ts,tsx,js,json}`). Neither oxlint nor
the former ESLint config enforce formatting. `lint-staged` formats staged
files with `oxfmt` and fixes lint findings with `oxlint --fix`.
