import { requirementFromString } from './selector-requirement';
import type { MatchExpression } from './index';

type Options = { undefinedWhenEmpty?: boolean; basic?: boolean };

export const fromRequirements = (requirements: MatchExpression[], options = {} as Options) => {
  const opts = options || {};
  const selector = {
    matchLabels: {},
    matchExpressions: [],
  };

  if (opts.undefinedWhenEmpty && requirements.length === 0) {
    return;
  }

  requirements.forEach((r) => {
    if (r.operator === 'Equals') {
      // eslint-disable-next-line prefer-destructuring
      selector.matchLabels[r.key] = r.values[0];
    } else {
      selector.matchExpressions.push(r);
    }
  });

  // old selector format?
  if (opts.basic) {
    return selector.matchLabels;
  }

  return selector;
};

export const split = (str: string) => (str.trim() ? str.split(/,(?![^(]*\))/) : []); // [''] -> []

export const selectorFromString = (str: string) => {
  const requirements = split(str || '').map(requirementFromString) as MatchExpression[];
  return fromRequirements(requirements);
};
