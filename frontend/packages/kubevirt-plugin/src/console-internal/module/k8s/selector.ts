/* eslint-disable consistent-return */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
import { MatchExpression, MatchLabels, Selector } from '@console/dynamic-plugin-sdk';
import { createEquals, requirementFromString, requirementToString } from './selector-requirement';

const isOldFormat = (selector: Selector | MatchLabels) =>
  !selector.matchLabels && !selector.matchExpressions;

type Options = { undefinedWhenEmpty?: boolean; basic?: boolean };

export const fromRequirements = (requirements: MatchExpression[], options = {} as Options) => {
  options = options || {};
  const selector = {
    matchLabels: {},
    matchExpressions: [],
  };

  if (options.undefinedWhenEmpty && requirements.length === 0) {
    return;
  }

  requirements.forEach((r) => {
    if (r.operator === 'Equals') {
      selector.matchLabels[r.key] = r.values[0];
    } else {
      selector.matchExpressions.push(r);
    }
  });

  // old selector format?
  if (options.basic) {
    return selector.matchLabels;
  }

  return selector;
};

export const split = (str: string) => (str.trim() ? str.split(/,(?![^(]*\))/) : []); // [''] -> []

export const toRequirements = (selector: Selector = {}) => {
  const requirements = [];
  const matchLabels = isOldFormat(selector) ? selector : selector.matchLabels;
  const matchExpressions = selector.matchExpressions;

  Object.keys(matchLabels || {})
    .sort()
    .forEach(function(k) {
      requirements.push(createEquals(k, matchLabels[k]));
    });

  (matchExpressions || []).forEach(function(me) {
    requirements.push(me);
  });

  return requirements;
};

export const selectorFromString = (str: string) => {
  const requirements = split(str || '').map(requirementFromString) as MatchExpression[];
  return fromRequirements(requirements);
};

export const selectorToString = (selector: Selector) => {
  const requirements = toRequirements(selector);
  return requirements.map(requirementToString).join(',');
};
