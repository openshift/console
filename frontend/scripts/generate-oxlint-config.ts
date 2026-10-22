/**
 * Generates `.oxlintrc.json` from the repo's effective ESLint configuration.
 *
 * The ESLint setup is layered (flat config -> FlatCompat -> legacy configs in
 * `eslint-plugin-console` -> airbnb presets), so instead of translating the
 * source configs by hand this script resolves the *effective* configuration
 * per scope via `eslint --print-config` and translates it mechanically.
 *
 * Rules that oxlint does not implement are skipped here and documented in
 * `docs/oxlint-migration-poc.md`. Run this script whenever the ESLint config
 * changes, then review the diff of `.oxlintrc.json`.
 *
 * Usage: yarn ts-node ./scripts/generate-oxlint-config.ts
 */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');

// Representative (virtual) files per ESLint scope. `--print-config` only needs
// a path that matches the scope's file globs; the files do not have to exist.
const SCOPE_FILES = {
  // eslint.config.ts: frontend code (react-typescript-prettier)
  frontend: 'public/components/virtual-probe.tsx',
  // eslint.config.ts: repo tooling (node-typescript-prettier)
  node: 'scripts/virtual-probe.ts',
  // eslint.config.ts: e2e (playwright)
  e2e: 'e2e/tests/virtual-probe.spec.ts',
  // jest overlay inside the frontend scope (jest + testing-library)
  jest: 'public/components/__tests__/virtual-probe.spec.tsx',
} as const;

type Severity = 'error' | 'warn';
type RuleConf = Severity | [Severity, ...unknown[]];

const oxlintSchema = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'node_modules/oxlint/configuration_schema.json'), 'utf8'),
) as { definitions: { DummyRuleMap: { properties: Record<string, unknown> } } };
const oxlintRuleNames = new Set<string>(
  Object.keys(oxlintSchema.definitions.DummyRuleMap.properties),
);

// ESLint rule name -> oxlint rule name for rules that live elsewhere.
const ALIASES: Record<string, string> = {
  'no-barrel-files/no-barrel-files': 'oxc/no-barrel-file',
  'no-return-await': 'typescript/return-await',
  // The deprecated core no-new-require/no-path-concat rules are superseded
  // by eslint-plugin-n's versions (which ESLint also runs in the node scope);
  // route them to the JS plugin so the real rule code executes everywhere —
  // the native oxlint implementation over-reports (see Divergences).
  'no-new-require': 'n/no-new-require',
  'no-path-concat': 'n/no-path-concat',
  'dot-notation': 'typescript/dot-notation',
  'no-buffer-constructor': 'unicorn/no-new-buffer',
};

// oxlint name candidates for an ESLint rule name, most specific first.
const candidates = (name: string): string[] => {
  const list = ALIASES[name] ? [ALIASES[name]] : [];
  if (name.startsWith('@typescript-eslint/')) {
    list.push(`typescript/${name.slice('@typescript-eslint/'.length)}`);
    list.push(name.slice('@typescript-eslint/'.length));
  }
  if (name.startsWith('n/')) list.push(`node/${name.slice(2)}`);
  // React Compiler rules from eslint-plugin-react-hooks v7 live in the react
  // plugin in oxlint (rules-of-hooks, exhaustive-deps, purity, refs, ...)
  if (name.startsWith('react-hooks/')) list.push(`react/${name.slice('react-hooks/'.length)}`);
  list.push(name);
  return list;
};

// ESLint plugins that oxlint does not implement natively but supports
// running verbatim through its JS plugin runtime (see
// docs/oxlint-migration-poc.md and the console-plugin-template repo, which
// uses the same mechanism). Their rules keep their ESLint names and options;
// because the actual plugin code runs, behavior matches ESLint exactly —
// including `eslint-disable` comments, which oxlint honors by rule name.
//
// ONLY plugins whose namespace is NOT reserved by oxlint can be wired this
// way. The namespaces `eslint`, `react`, and `import` are implemented
// natively in Rust and reserved, so those plugins must be loaded under an
// alias (e.g. `react-js/no-typos`). Aliased rule names no longer match the
// existing `// eslint-disable react/jsx-no-bind`-style comments in the tree
// (~150 of them), which would surface as false positives. Those rules are
// therefore left to ESLint and documented as gaps; see
// docs/oxlint-migration-poc.md for the unblock options.
const JS_PLUGIN_RULES: Record<string, string> = {
  'playwright/': 'eslint-plugin-playwright',
  'testing-library/': 'eslint-plugin-testing-library',
  'n/': 'eslint-plugin-n',
};

// Rules whose ESLint options are rejected by oxlint. The rule stays enabled
// with default options; the loss is documented in the migration notes.
const DROP_OPTIONS = new Set(['react/jsx-no-duplicate-props']); // takes no options in oxlint

// ESLint option objects that need adjusting for oxlint.
const TRANSLATE_OPTIONS: Record<string, (opts: unknown[]) => unknown[]> = {
  'import/no-cycle': (opts) =>
    opts.map((o) => {
      if (!o || typeof o !== 'object') return o;
      const { disableScc, ...rest } = o as Record<string, unknown>; // not supported by oxlint
      return rest.maxDepth === '∞' ? { ...rest, maxDepth: 4294967295 } : rest; // u32::MAX == unlimited
    }),
};

// Rules where oxlint's implementation reports findings that ESLint does not
// (see "Divergences" in docs/oxlint-migration-poc.md). They are downgraded to
// `warn` so that `yarn oxlint` can gate on a warning budget, mirroring the
// ESLint MAX_WARNINGS ratchet. Revisit when the two tools converge.
const DIVERGENT_DOWNGRADE = new Set([
  'import/no-named-as-default-member',
  'import/export',
  'oxc/no-barrel-file',
  'react/globals',
  'react/exhaustive-deps',
  'react/no-did-update-set-state',
  'jsx-a11y/role-has-required-aria-props',
  'jest/no-standalone-expect',
  'jest/prefer-todo',
  'jest/no-disabled-tests',
  'max-nested-callbacks',
  'prefer-const',
  'no-unused-vars',
  'no-var',
]);
interface Gap {
  scope: string;
  rule: string;
  reason: string;
}

const printConfig = (file: string): Record<string, unknown> => {
  const out = execFileSync(path.join(ROOT, 'node_modules/.bin/eslint'), ['--print-config', file], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(out);
};

// Map of ESLint rule -> oxlint rule for every enabled ESLint rule that has an
// oxlint counterpart (computed lazily from the schema).
const ruleMap = new Map<string, string>();
const mapRule = (name: string): string | undefined => {
  if (!ruleMap.has(name)) {
    // Hand-curated aliases are trusted as-is: some target native oxlint
    // rules, others target JS plugin rules (e.g. `n/*`), which are not part
    // of the native schema checked below.
    ruleMap.set(name, ALIASES[name] ?? candidates(name).find((c) => oxlintRuleNames.has(c)));
  }
  return ruleMap.get(name);
};

const enabledRules = (cfg: Record<string, unknown>): Record<string, RuleConf> => {
  const out: Record<string, RuleConf> = {};
  for (const [name, value] of Object.entries(cfg.rules ?? {}) as [string, unknown][]) {
    const [first] = Array.isArray(value) ? value : [value];
    const sev: Severity | undefined =
      first === 2 || first === 'error'
        ? 'error'
        : first === 1 || first === 'warn'
          ? 'warn'
          : undefined;
    if (sev) {
      out[name] = Array.isArray(value) ? [sev, ...value.slice(1)] : sev;
    }
  }
  return out;
};

const translate = (
  eslintRules: Record<string, RuleConf>,
  scope: string,
  gaps: Gap[],
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [name, conf] of Object.entries(eslintRules)) {
    // JS-plugin rules keep their ESLint names; they are provided by the
    // eslint plugins declared in `jsPlugins` on the matching override.
    const jsPlugin = Object.keys(JS_PLUGIN_RULES).find((p) => name.startsWith(p));
    const oxName = jsPlugin ? name : mapRule(name);
    if (!oxName) {
      gaps.push({ scope, rule: name, reason: 'no oxlint equivalent' });
    } else if (typeof conf !== 'string' && DROP_OPTIONS.has(name)) {
      const [sev] = conf;
      out[oxName] = sev;
      gaps.push({ scope, rule: name, reason: 'rule supported, custom options dropped' });
    } else if (typeof conf === 'string') {
      out[oxName] = conf;
    } else {
      const [, ...rawOpts] = conf;
      const opts = TRANSLATE_OPTIONS[name] ? TRANSLATE_OPTIONS[name](rawOpts) : rawOpts;
      const sevIn = typeof conf === 'string' ? conf : conf[0];
      const sev = DIVERGENT_DOWNGRADE.has(oxName) && sevIn === 'error' ? 'warn' : sevIn;
      out[oxName] = opts.length > 0 ? [sev, ...opts] : sev;
    }
  }
  return out;
};

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

const gaps: Gap[] = [];

const eslintConfigs = Object.fromEntries(
  Object.entries(SCOPE_FILES).map(([scope, file]) => [scope, printConfig(file)]),
);

const frontendRules = translate(enabledRules(eslintConfigs.frontend), 'frontend', gaps);
const nodeRules = translate(enabledRules(eslintConfigs.node), 'node', gaps);
const e2eRules = translate(enabledRules(eslintConfigs.e2e), 'e2e', gaps);

// The jest overlay is the delta between test files and regular frontend files.
const jestEnabled = enabledRules(eslintConfigs.jest);
const frontendEnabled = enabledRules(eslintConfigs.frontend);
const jestDelta: Record<string, RuleConf> = {};
for (const [name, conf] of Object.entries(jestEnabled)) {
  const base = frontendEnabled[name];
  if (!base || JSON.stringify(base) !== JSON.stringify(conf)) {
    jestDelta[name] = conf;
  }
}
const jestOverlay = translate(jestDelta, 'jest', gaps);

// Dirs covered by the node (tooling) scope instead of the frontend scope.
const REPO_TOOLING = [
  'packages/console-plugin-sdk/src/codegen',
  'packages/console-plugin-sdk/src/webpack',
  'packages/console-dynamic-plugin-sdk/scripts',
  'packages/console-dynamic-plugin-sdk/src/webpack',
  'packages/eslint-plugin-console/**',
  'scripts',
  'i18n-scripts',
];

const config = {
  $schema: './node_modules/oxlint/configuration_schema.json',
  // NOTE: generated by scripts/generate-oxlint-config.ts — edit that script,
  // not this file. Gaps are documented in docs/oxlint-migration-poc.md.
  plugins: [
    'react',
    'typescript',
    'unicorn',
    'oxc',
    'import',
    'promise',
    'node',
    'jest',
    'jsx-a11y',
  ],
  // The default `correctness` category is disabled so that oxlint enforces
  // exactly the rules translated from the ESLint config, nothing more.
  categories: { correctness: 'allow' },
  ignorePatterns: [
    '**/dist/**',
    '**/generated/**',
    '**/node_modules/**',
    '.vscode/**',
    '.yarn/**',
    '__coverage__/**',
    'test-results/**',
    'yarn.lock',
  ],
  overrides: [
    {
      // Scope: frontend code (react-typescript-prettier)
      files: ['public/**/*.ts', 'public/**/*.tsx', 'packages/**/*.ts', 'packages/**/*.tsx'],
      excludeFiles: REPO_TOOLING.flatMap((d) => [`${d}/**/*.ts`, `${d}/**/*.tsx`]),
      env: { browser: true },
      // eslint-plugin-n provides the deprecated core no-new-require and
      // no-path-concat rules that airbnb enables for this scope.
      jsPlugins: ['eslint-plugin-n'],
      globals: {
        process: 'readonly',
        React: true,
        JSX: 'readonly',
        NodeJS: 'readonly',
        Subject: 'readonly',
        Diff: 'readonly',
        BlobPropertyBag: 'readonly',
        VoidFunction: 'readonly',
        RequestInit: 'readonly',
      },
      rules: frontendRules,
    },
    {
      // Scope: repo tooling (node-typescript-prettier). `/*.ts` (leading
      // slash) matches root-level files only, mirroring ESLint semantics.
      files: ['/*.ts', '/*.tsx', ...REPO_TOOLING.flatMap((d) => [`${d}/**/*.ts`, `${d}/**/*.tsx`])],
      env: { node: true },
      jsPlugins: ['eslint-plugin-n'],
      rules: nodeRules,
    },
    {
      // Scope: e2e (playwright). The playwright rules run verbatim through
      // eslint-plugin-playwright via oxlint's JS plugin support (same
      // approach as console-plugin-template). Still uncovered here:
      // no-restricted-syntax (custom waitFor() guard) and prettier/prettier.
      files: ['e2e/**/*.ts', 'e2e/**/*.tsx'],
      excludeFiles: ['e2e/**/testData/**'],
      jsPlugins: ['eslint-plugin-playwright'],
      rules: e2eRules,
    },
    {
      // Scope: e2e setup helpers (mirrors eslint.config.ts).
      files: ['e2e/setup/**/*.ts'],
      rules: { 'playwright/expect-expect': 'off' },
    },
    {
      // Scope: jest/testing-library overlay on test files within the
      // frontend and tooling scopes (e2e/ is excluded to match ESLint).
      // testing-library rules run verbatim through eslint-plugin-testing-library
      // via oxlint's JS plugin support (same approach as console-plugin-template).
      files: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      excludeFiles: ['e2e/**'],
      env: { jest: true },
      jsPlugins: ['eslint-plugin-testing-library'],
      rules: jestOverlay,
    },
  ],
};

fs.writeFileSync(path.join(ROOT, '.oxlintrc.json'), `${JSON.stringify(config, null, 2)}\n`);

// Summary + gap report on stdout.
const uniqueGaps = new Map<string, Set<string>>();
for (const g of gaps) {
  if (!uniqueGaps.has(g.rule)) uniqueGaps.set(g.rule, new Set());
  uniqueGaps.get(g.rule).add(g.scope);
}
console.log(`frontend rules: ${Object.keys(frontendRules).length}`);
console.log(`node rules: ${Object.keys(nodeRules).length}`);
console.log(
  `e2e rules: ${Object.keys(e2eRules).length} (playwright rules via eslint-plugin-playwright JS plugin)`,
);
console.log(`jest overlay rules: ${Object.keys(jestOverlay).length}`);
console.log(`\n${uniqueGaps.size} rules without oxlint coverage:`);
for (const [rule, scopes] of [...uniqueGaps].sort()) {
  console.log(`  ${rule}  [${[...scopes].join(', ')}]`);
}
