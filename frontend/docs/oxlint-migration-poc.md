# Oxlint Migration POC

Status: **proof of concept** — oxlint runs alongside ESLint, it does not replace it.

This document records a best-effort migration from ESLint to
[oxlint](https://oxc.rs/docs/guide/usage/linter.html) following the
[official migration guide](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint.html),
and documents every coverage gap found along the way.

## TL;DR

A migration **without losing linting rule coverage is not possible today**.
Oxlint covers **338 of 371 (91.1%)** enabled ESLint rules: 265 natively by
name, plus 73 (`playwright/*`, `testing-library/*`, `n/*`) by running the
actual ESLint plugins through oxlint's JS plugin support. The remaining
**33 rules (8.9%)** have no oxlint equivalent (plus one covered without its
custom option), and several ported rules behave differently in practice
(see [Divergences](#divergences)).

The repo keeps ESLint as the authoritative linter. Oxlint is wired up as a
fast pre-pass (`yarn oxlint`, ~2s vs ~15min for ESLint) with a translated
configuration in [`.oxlintrc.json`](../.oxlintrc.json).

## Method

1. Resolved the *effective* ESLint configuration for each scope via
   `eslint --print-config` (the `eslint-plugin-console` configs are legacy
   eslintrc consumed through `FlatCompat`, so `@oxlint/migrate` cannot
   translate them automatically).
2. Compared every enabled rule against the rule set shipped with oxlint
   1.88.0 (`configuration_schema.json`), mapping names
   (`@typescript-eslint/*` → `typescript/*`, `n/*` → `node/*`,
   `react-hooks/*` compiler rules → `react/*`, `no-barrel-files` →
   `oxc/no-barrel-file`, …).
3. Generated `.oxlintrc.json` with one `overrides` entry per ESLint scope
   (frontend, repo tooling, e2e, jest overlay), preserving severities and
   rule options.
4. Wired `eslint-plugin-playwright` and `eslint-plugin-testing-library`
   into the e2e and jest overrides via oxlint's `jsPlugins` support (the
   same approach as `console-plugin-template`): the real plugin code runs,
   so behavior matches ESLint exactly.
5. Ran both linters on the whole tree and diffed the results per rule.
6. Feasibility-tested JS plugins for every remaining gap (react, import,
   core rules, typescript-eslint, react-hooks, prettier) — see
   [JS plugin feasibility](#js-plugin-feasibility) for why most are wired
   and three plugin families are not.

## Scopes

`.oxlintrc.json` mirrors the four scopes of `eslint.config.ts`:

| Scope                     | Files                                          | Rules translated |
| ------------------------- | ---------------------------------------------- | ---------------- |
| frontend (react+ts)       | `public/**`, `packages/**` (minus tooling)     | 240              |
| repo tooling (node+ts)    | root `*.ts`, `scripts`, SDK codegen/webpack, … | 176 (14 via JS plugin) |
| e2e (playwright)          | `e2e/**`                                       | 34 (JS plugin)   |
| jest/testing-library      | `**/__tests__/**`, `**/*.spec.*`               | 45 (overlay)     |

## Gaps — rules with no oxlint equivalent (33)

### Covered via JS plugins

`eslint-plugin-playwright` (34 rules), `eslint-plugin-testing-library`
(25 rules), and `eslint-plugin-n` (14 rules) have no native oxlint
implementation, but oxlint's JS plugin support runs the actual plugin code,
so these rules — including their options and severities — are enforced by
`yarn oxlint` with ESLint-identical behavior, including `eslint-disable`
comments (oxlint honors them by rule name). The plugins are declared as
root devDependencies (`jsPlugins` resolves them from the workspace root).
The deprecated core rules `no-new-require`/`no-path-concat` (which airbnb
enables everywhere and eslint-plugin-n supersedes) are also routed to the
n plugin, which eliminated the native `node/no-path-concat` divergence.

The e2e scope's only remaining gaps are `no-restricted-syntax` (the custom
`waitFor()` guard) and `prettier/prettier`.

### `eslint-plugin-react` (14)

`react/jsx-no-bind`, `react/jsx-uses-react`, `react/jsx-uses-vars`,
`react/prefer-stateless-function`, `react/forbid-foreign-prop-types`,
`react/no-unused-state`, `react/no-typos`, `react/no-access-state-in-setstate`,
`react/static-property-placement`, `react/prefer-exact-props`,
`react/no-arrow-function-lifecycle`, `react/no-invalid-html-attribute`,
`react/no-unused-class-component-methods`, `react/no-deprecated`
(oxlint's `typescript/no-deprecated` is a different, type-aware rule).

Note: `react/jsx-uses-react` / `react/jsx-uses-vars` exist only to make
`no-unused-vars` JSX-aware in ESLint; oxlint's `no-unused-vars` understands
JSX natively, so these two are effectively covered.

### `eslint-plugin-import` (5)

`import/no-unresolved`, `import/order`, `import/no-useless-path-segments`,
`import/no-import-module-exports`, `import/no-relative-packages`.

`import/order` (with the `@console/**` path groups and alphabetization) is
one of the most-visible losses.

### ESLint core (10)

`no-octal`, `no-octal-escape`, `consistent-this`, `lines-between-class-members`,
`lines-around-directive`, `no-new-object`, `spaced-comment`, `no-undef-init`,
`strict`, and `no-restricted-syntax` (used by the e2e config to forbid
`waitFor()` before Playwright actions).

### Other

- `@typescript-eslint/naming-convention` — requires type information from
  `@typescript-eslint/parser`, which oxlint's runtime cannot provide; would
  need the experimental `oxlint-tsgolint` (see
  [JS plugin feasibility](#js-plugin-feasibility)).
- `react-hooks/config`, `react-hooks/gating` — the only two React Compiler
  rules without an oxlint counterpart (the other 14 compiler rules map to
  `react/*`).
- `prettier/prettier` — runs fine through `eslint-plugin-prettier` as a
  JS plugin (verified) but is intentionally not wired: it would duplicate
  the authoritative ESLint rule and negate oxlint's speed. A separate
  `prettier --check` (or oxfmt) step is the right replacement if ESLint
  is ever dropped.
- `react/jsx-no-duplicate-props` is supported, but its
  `{ ignoreCase: true }` option had to be dropped (oxlint accepts no options).

## JS plugin feasibility

Every remaining gap was feasibility-tested by loading the real ESLint
plugin through `jsPlugins` and probing rule behavior against ESLint on the
same files. Results:

| Candidate | Feasible? | Why |
| --------- | --------- | --- |
| `eslint-plugin-n` | **yes — wired** | `n` is not a reserved namespace; rule names and `eslint-disable n/...` comments match verbatim |
| `eslint-plugin-playwright` | **yes — wired** | same |
| `eslint-plugin-testing-library` | **yes — wired** | same |
| `eslint-plugin-react` | mechanically yes, **not wired** | `react` is a reserved namespace (native Rust plugin), so it must load under an alias (`react-js/*`). Rules then behave identically (verified: `no-string-refs`, `no-unused-class-component-methods` fire at the exact same locations as ESLint), **but** the ~150 existing `// eslint-disable react/...` comments no longer match the aliased names, surfacing suppressed code as false positives (2 today) |
| `eslint-plugin-import` | mechanically yes, **not wired** | `import` is reserved → alias (`import-js/*`). `import/order` and `import/no-unresolved` were verified working with full option forwarding and resolver settings, but the file-level `/* eslint-disable import/order */` in app.tsx alone would resurface 15 false positives |
| ESLint core rules (shim via `eslint/use-at-your-own-risk`) | mechanically yes, **not wired** | a local shim plugin re-exporting core rules works (`no-octal`, `lines-between-class-members` verified with exact location parity), but `eslint` is also reserved → shim rules are `eslint-core/*` → the 34 `// eslint-disable no-restricted-syntax` comments in e2e/ would resurface as 36 false positives |
| `@typescript-eslint/naming-convention` | **no** | the rule requires `@typescript-eslint/parser` type information; oxlint's runtime cannot provide it (verified: the rule throws). Would need the experimental `oxlint-tsgolint` type-aware runtime (which console-plugin-template adopts) |
| `react-hooks/config`, `react-hooks/gating` | **no** | the plugin loads but these compiler-infrastructure rules no-op outside the full React Compiler pipeline; ESLint reports zero findings for them today |
| `eslint-plugin-prettier` | mechanically yes, **not wired by choice** | verified working (correct fixes, config pickup), but running prettier through the JS bridge duplicates the authoritative `prettier/prettier` ESLint rule and negates oxlint's speed; oxfmt / `prettier --check` is the right replacement if ESLint is ever dropped |

The blocking issue for react/import/core rules is **not** the JS plugin
runtime — it is that aliased rule names break `eslint-disable` comment
matching. Unblock options, in rough order of preference:

1. oxlint gains support for mapping disable-comment rule names to aliased
   jsPlugin rules (or loads these plugins under their canonical names once
   the native implementations reach parity).
2. A codemod appends `// oxlint-disable-next-line <alias>/<rule>` lines
   next to the ~150 existing `eslint-disable` comments (oxlint and ESLint
   each honor only their matching directive).
3. The suppressions are removed by fixing the underlying code.

## Divergences — same rule name, different behavior

Oxlint reports findings that ESLint does not (and vice versa). Counts below
are from a full run of both tools with the migrated config on the same tree.

| Rule                                   | ESLint | Oxlint | Notes |
| -------------------------------------- | -----: | -----: | ----- |
| `import/no-named-as-default-member`    |      0 |    247 | oxlint resolves `i18next`'s ESM export map; eslint-plugin-import silently skips these (resolution failure) |
| `oxc/no-barrel-file`                   |      0 |     22 | oxlint uses a loaded-module-count threshold (100); the ESLint plugin detects different patterns |
| `react/globals` (compiler)             |      0 |     18 | React Compiler analysis differs from eslint-plugin-react-hooks v7.1.1 |
| `max-nested-callbacks`                 |      0 |      6 | mostly in files ESLint could not parse before (see below) |
| `import/export`                        |      0 |      4 | |
| `jsx-a11y/role-has-required-aria-props`|      0 |      4 | |
| `jest/no-standalone-expect`            |      0 |      3 | |
| `jest/prefer-todo`                     |      0 |      2 | |
| `prefer-const`                         |      0 |      2 | |
| `no-var` / `no-unused-vars`            |      0 |    1+1 | |
| `react/exhaustive-deps`                |      0 |      1 | |
| `react/no-did-update-set-state`        |      0 |      1 | |
| `react-hooks/set-state-in-effect`      |    154 |    107 | oxlint's compiler analysis reports fewer findings |
| `react-hooks/refs`                     |     82 |     40 | oxlint's compiler analysis reports fewer findings |
| `react-hooks/preserve-manual-memoization` |  15 |      8 | oxlint's compiler analysis reports fewer findings |
| `react-hooks/immutability`             |     13 |      9 | oxlint's compiler analysis reports fewer findings |
| `react-hooks/purity`                   |      2 |      3 | |
| `react-hooks/static-components`        |      1 |      1 | matches |
| parse errors (`null`)                  |     12 |      0 | 12 SDK script files ESLint could not parse at all (pre-existing `ignores` regression, fixed separately); oxlint parses and lints them fine |

Over-reporting rules are downgraded to `warn` in `.oxlintrc.json` (see
`DIVERGENT_DOWNGRADE` in the generator) so that `yarn oxlint` can gate on a
warning budget. Under-reporting (the React Compiler rules) is the more
serious direction: eslint-plugin-react-hooks is the reference implementation
of the React Compiler lints, and oxlint's ports are not yet at parity —
ESLint must stay authoritative for those rules.

## Running

```sh
yarn oxlint        # fast pre-pass (~2s), exact-warning ratchet (MAX_WARNINGS=480)
yarn lint          # oxlint pre-pass + authoritative ESLint run (MAX_WARNINGS=267)
```

`yarn lint` runs `oxlint && eslint` as recommended by the migration guide:
oxlint enforces everything it supports in ~2s, ESLint remains authoritative
for the rules oxlint lacks and for the React Compiler rules where oxlint
under-reports. Both tools use exact-count warning ratchets
(`scripts/oxlint-exact-warnings.cjs`, `scripts/eslint-exact-warnings.cjs`);
when you fix warnings, lower the budgets in `package.json` in the same
change.

## Path to full migration

1. Upstream oxlint to implement the remaining rules listed above (the
   playwright and testing-library plugins no longer block migration thanks
   to JS plugins); track
   <https://github.com/oxc-project/oxc/issues/481>.
2. Resolve the divergences above (file issues upstream or fix the code).
3. Replace `prettier/prettier` with an explicit `prettier --check` CI step.
4. Flip the split the other way: use `eslint-plugin-oxlint` to disable the
   ESLint rules oxlint already runs, so ESLint only covers the leftovers,
   then drop ESLint once the remaining set is empty.
