import {createEquals, requirementFromString, requirementToString} from './selector-requirement';

const isOldFormat = selector => !selector.matchLabels && !selector.matchExpressions;

export const fromRequirements = (requirements, options) => {
  options = options || {};
  const selector = {
    matchLabels:      {},
    matchExpressions: []
  };

  if (options.undefinedWhenEmpty && requirements.length === 0) {
    return;
  }

  requirements.forEach(function (r) {
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

export const split = string => string.trim() ? string.split(/,(?![^(]*\))/) : []; // [''] -> []

export const toRequirements = selector => {
  selector = selector || {};
  const requirements = [];
  const matchLabels = isOldFormat(selector) ? selector : selector.matchLabels;
  const matchExpressions = selector.matchExpressions;

  Object.keys(matchLabels || {}).sort().forEach(function (k) {
    requirements.push(createEquals(k, matchLabels[k]));
  });

  (matchExpressions || []).forEach(function (me) {
    requirements.push(me);
  });

  return requirements;
};

export const selectorFromString = string => {
  const requirements = split(string || '').map(requirementFromString);
  return fromRequirements(requirements);
};

export const selectorToString = selector => {
  const requirements = toRequirements(selector);
  return requirements.map(requirementToString).join(',');
};
