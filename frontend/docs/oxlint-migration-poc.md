# Oxlint Migration POC

Status: **proof of concept** — oxlint runs alongside ESLint, it does not replace it.

This document records a best-effort migration from ESLint to
[oxlint](https://oxc.rs/docs/guide/usage/linter.html) following the
[official migration guide](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint.html),
and documents every coverage gap found along the way.

## TL;DR

A migration **without losing linting rule coverage is not possible today**.
Oxlint covers **265 of 371 (71.4%)** enabled ESLint rules by name. The
remaining **106 rules (28.6%)** have no oxlint equivalent, and several ported
rules behave differently in practice (see [Divergences](#divergences)).

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
4. Ran both linters on the whole tree and diffed the results per rule.

## Scopes

`.oxlintrc.json` mirrors the four scopes of `eslint.config.ts`:

| Scope                     | Files                                          | Rules translated |
| ------------------------- | ---------------------------------------------- | ---------------- |
| frontend (react+ts)       | `public/**`, `packages/**` (minus tooling)     | 240              |
| repo tooling (node+ts)    | root `*.ts`, `scripts`, SDK codegen/webpack, … | 162              |
| e2e (playwright)          | `e2e/**`                                       | 0 — see gaps     |
| jest/testing-library      | `**/__tests__/**`, `**/*.spec.*`               | 20 (overlay)     |

## Gaps — rules with no oxlint equivalent (106)

### Whole plugins missing

| Plugin                | Rules | Notes                                                    |
| --------------------- | ----- | -------------------------------------------------------- |
| `playwright`          | 34    | entire e2e scope is uncovered by oxlint                  |
| `testing-library`     | 25    | RTL-specific rules (queries, `await` patterns, `act`, …) |

The e2e scope (`eslint.config.ts`) enables only `playwright/*`,
`no-restricted-syntax` (custom `waitFor()` guard) and `prettier/prettier` —
all unsupported — so **the e2e scope currently gets zero oxlint rules**.

### `eslint-plugin-n` (14)

`n/no-extraneous-require`, `n/no-deprecated-api`, `n/no-unpublished-bin`,
`n/no-unsupported-features/node-builtins`, `n/hashbang`,
`n/prefer-promises/dns`, `n/prefer-promises/fs` and all seven
`n/prefer-global/*` rules.

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

- `@typescript-eslint/naming-convention` — the repo-wide naming rules are
  not portable.
- `react-hooks/config`, `react-hooks/gating` — the only two React Compiler
  rules without an oxlint counterpart (the other 14 compiler rules map to
  `react/*`).
- `prettier/prettier` — formatting is out of scope for a linter; oxlint
  intentionally does not run formatters. Prettier must stay a separate
  `prettier --check` step if ESLint is ever dropped.
- `react/jsx-no-duplicate-props` is supported, but its
  `{ ignoreCase: true }` option had to be dropped (oxlint accepts no options).

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
| `n/no-path-concat`                     |      0 |      4 | |
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
yarn oxlint        # fast pre-pass (~2s), exact-warning ratchet (MAX_WARNINGS=484)
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

1. Upstream oxlint to implement the missing plugins (playwright,
   testing-library) and rules listed above; track
   <https://github.com/oxc-project/oxc/issues/481>.
2. Resolve the divergences above (file issues upstream or fix the code).
3. Replace `prettier/prettier` with an explicit `prettier --check` CI step.
4. Flip the split the other way: use `eslint-plugin-oxlint` to disable the
   ESLint rules oxlint already runs, so ESLint only covers the leftovers,
   then drop ESLint once the remaining set is empty.
