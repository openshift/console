import type { OxlintConfig, OxlintOverride } from 'oxlint';
import base from './lib/config/base.ts';
import jest from './lib/config/jest.ts';
import { mergeRules } from './lib/config/merge-rules.ts';
import node from './lib/config/node.ts';
import playwright from './lib/config/playwright.ts';
import react from './lib/config/react.ts';
import typescript from './lib/config/typescript.ts';

interface OxlintPreset extends OxlintConfig {
  plugins: OxlintConfig['plugins'];
  jsPlugins: OxlintConfig['jsPlugins'];
  env: OxlintConfig['env'];
}

// Merge presets into one flat preset — the oxlint translation of the former
// eslintrc `extends` composition that FlatCompat used to inline for
// eslint.config.ts (oxlint overrides have no `extends` field, so composed
// presets are flattened here and placed into files-scoped overrides by
// oxlint.config.ts).
const mergePresets = (...presets: OxlintConfig[]): OxlintPreset => {
  const jsPlugins: NonNullable<OxlintConfig['jsPlugins']> = [];
  for (const preset of presets) {
    for (const plugin of preset.jsPlugins ?? []) {
      const key = JSON.stringify(plugin);
      if (!jsPlugins.some((p) => JSON.stringify(p) === key)) {
        jsPlugins.push(plugin);
      }
    }
  }
  return {
    plugins: [...new Set(presets.flatMap((p) => p.plugins ?? []))],
    jsPlugins,
    env: Object.assign({}, ...presets.map((p) => p.env ?? {})),
    rules: mergeRules(...presets.map((p) => p.rules ?? {})),
  };
};

// When extending multiple configurations, add to the list following the order outlined below:
export default {
  // Core configs: choose one
  base,
  react,

  // TypeScript support: choose one
  typescript,

  // Augmenting configs: choose one or more
  jest,
  playwright,

  node,

  // ...or use the pre-composed configurations representing common code archetypes (choose one):

  // Common web preset: React, TypeScript (jest applies to test files via its
  // own self-scoped preset)
  reactTypescript: mergePresets(base, react, typescript),

  // Common Node.js preset: TypeScript, node. Tooling code may use require(),
  // so the require-adjacent frontend rules are turned off (mirrors the former
  // eslint-plugin-console node-typescript-prettier preset).
  nodeTypescript: mergePresets(base, typescript, node, {
    rules: {
      'no-restricted-imports': 'off',
      'import/no-dynamic-require': 'off',
      'typescript/no-require-imports': 'off',
    },
  }),
} satisfies Record<string, Partial<OxlintOverride>>;
