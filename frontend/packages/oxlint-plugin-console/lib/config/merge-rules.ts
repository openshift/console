import merge from 'lodash-es/merge.js';
import type { OxlintConfig } from 'oxlint';

// Deep-merge rule dictionaries with eslintrc-style option merging: values
// are normalized to [severity, ...options] and options objects merge
// element-wise (later entries win per-option; options a later entry omits
// are retained). Layering rule files on top of the airbnb presets relies on
// this.
const normalize = (rules: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(rules).map(([name, value]) => [name, Array.isArray(value) ? value : [value]]),
  );

export const mergeRules = (...dicts: Record<string, unknown>[]) =>
  merge({}, ...dicts.map(normalize)) as OxlintConfig['rules'];
