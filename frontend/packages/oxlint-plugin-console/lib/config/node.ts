// Node rules. `n/*` run via eslint-plugin-n (JS plugin); `node/*` are native.
import type { OxlintConfig } from 'oxlint';
import node from './rules/node.ts';

const preset: OxlintConfig = {
  env: {
    node: true,
  },

  jsPlugins: ['eslint-plugin-n'],

  rules: node,
};
export default preset;
