import playwrightPlugin from 'eslint-plugin-playwright';
import type { OxlintConfig } from 'oxlint';

// playwright rules run via the eslint-plugin-playwright JS plugin, so its
// recommended ruleset can be spread directly (it stays in sync with the
// plugin version). The entries below are the console tweaks on top.
export default {
  ...playwrightPlugin.configs['flat/recommended'].rules,

  'no-empty-pattern': 'off',
  'playwright/no-conditional-in-test': 'off',
  'playwright/no-skipped-test': ['error', { allowConditional: true, disallowFixme: false }],

  // no-restricted-syntax guard: Playwright actions auto-wait for
  // actionability; forbid waitFor() before an action on the same locator.
  'eslint-js/no-restricted-syntax': [
    'error',
    {
      selector: 'CallExpression[callee.property.name="waitFor"]',
      message:
        'Playwright actions (click, fill, check, clear) auto-wait for actionability. ' +
        'Do not call waitFor() before an action on the same locator. ' +
        'If this waitFor() is intentional (waiting for state without a subsequent action), ' +
        'add // eslint-disable-next-line eslint-js/no-restricted-syntax',
    },
  ],
} satisfies OxlintConfig['rules'];
