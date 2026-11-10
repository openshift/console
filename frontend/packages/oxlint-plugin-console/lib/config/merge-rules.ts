import cloneDeep from 'lodash-es/cloneDeep.js';
import merge from 'lodash-es/merge.js';
import type { OxlintConfig } from 'oxlint';

/** Normalizes a rule value to a `[severity, ...options]` array. */
const normalize = (rules: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(rules).map(([name, value]) => [name, Array.isArray(value) ? value : [value]]),
  );

/**
 * Deep-merges rule dictionaries with eslintrc-style option merging.
 *
 * Values merge element-wise: later entries win per-option, options a later
 * entry omits are retained, and severity-only values keep the inherited
 * options. An option-bearing value that re-enables a rule disabled by an
 * earlier `'off'` replaces the stale options instead of merging into them.
 *
 * @param dicts - Rule dictionaries, layered from lowest to highest precedence.
 * @returns The merged rule dictionary.
 */
export const mergeRules = (...dicts: Record<string, unknown>[]) => {
  const merged: Record<string, unknown[]> = {};
  for (const dict of dicts.map(normalize)) {
    for (const [name, value] of Object.entries(dict)) {
      const prev = merged[name];
      // cloneDeep keeps shared source data from being mutated on re-merge
      merged[name] =
        prev === undefined
          ? [...value]
          : prev[0] === 'off' && value.length > 1
            ? [...value]
            : merge(cloneDeep(prev), value);
    }
  }
  return merged as OxlintConfig['rules'];
};
