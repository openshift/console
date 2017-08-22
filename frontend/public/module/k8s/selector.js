import * as k8sSelectorRequirement from './selector-requirement';

const isOldFormat = selector => !selector.matchLabels && !selector.matchExpressions;

/**
{Object[]} requirements
{Object} options
{Boolean} options.basic
{Boolean} options.undefinedWhenEmpty
  */
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
    requirements.push(k8sSelectorRequirement.createEquals(k, matchLabels[k]));
  });

  (matchExpressions || []).forEach(function (me) {
    requirements.push(me);
  });

  return requirements;
};

export const fromString = string => {
  const requirements = split(string || '').map(k8sSelectorRequirement.fromString);
  return fromRequirements(requirements);
};

export const toString = selector => {
  const requirements = toRequirements(selector);
  return requirements.map(k8sSelectorRequirement.toString).join(',');
};
