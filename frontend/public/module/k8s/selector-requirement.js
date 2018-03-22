import * as _ from 'lodash-es';

const toArray = value => Array.isArray(value) ? value : [value];

export const createEquals = (key, value) => ({
  key:      key,
  operator: 'Equals',
  values:   [value]
});

export const requirementFromString = string => {
  string = string.trim();

  // "key"
  if (/^[0-9A-Za-z/\-_.]+$/.test(string)) {
    return {
      key:      string,
      operator: 'Exists',
      values:   []
    };
  }

  // "!key"
  if (/^!\s*[0-9A-Za-z/\-_.]+$/.test(string)) {
    return {
      key:      string.split(/!\s*/)[1],
      operator: 'DoesNotExist',
      values:   []
    };
  }

  // "key=value" OR "key==value"
  if (/^[0-9A-Za-z/\-_.]+\s*==?\s*[0-9A-Za-z/\-_.]+$/.test(string)) {
    let parts = string.split(/\s*==?\s*/);
    let key = parts[0];
    let value = parts[1];
    return createEquals(key, value);
  }

  // "key!=value"
  if (/^[0-9A-Za-z/\-_.]+\s*!=\s*[0-9A-Za-z/\-_.]+$/.test(string)) {
    return {
      key:      string.split(/\s*!=\s*/)[0],
      operator: 'NotEquals',
      values:   [string.split(/\s*!=\s*/)[1]]
    };
  }

  // "key in (value1[,value2,...])"
  if (/^[0-9A-Za-z/\-_.]+\s+in\s+\([0-9A-Za-z/\-_.,\s]+\)$/.test(string)) {
    let parts = string.split(/\s+in\s+/);
    let key = parts[0];
    let values = parts[1].slice(1, -1).split(',').map(_.trim);

    return {
      key:      key,
      operator: 'In',
      values:   values
    };
  }

  // "key notin (value1[,value2,...])"
  if (/^[0-9A-Za-z/\-_.]+\s+notin\s+\([0-9A-Za-z/\-_.,\s]+\)$/.test(string)) {
    let parts = string.split(/\s+notin\s+/);
    let key = parts[0];
    let values = parts[1].slice(1, -1).split(',').map(_.trim);

    return {
      key:      key,
      operator: 'NotIn',
      values:   values
    };
  }

  // "key > value1"
  if (/^[0-9A-Za-z/\-_.]+\s+>\s+[0-9.]+$/.test(string)) {
    let parts = string.split(/\s+>\s+/);
    let key = parts[0];
    let value = parts[1];

    return {
      key:      key,
      operator: 'GreaterThan',
      values:   [value]
    };
  }

  // "key < value1"
  if (/^[0-9A-Za-z/\-_.]+\s+<\s+[0-9.]+$/.test(string)) {
    let parts = string.split(/\s+<\s+/);
    let key = parts[0];
    let value = parts[1];

    return {
      key:      key,
      operator: 'LessThan',
      values:   [value]
    };
  }

  return; // falsy means parsing failure
};

export const requirementToString = requirement => {
  if (requirement.operator === 'Equals') {
    return `${requirement.key}=${requirement.values[0]}`;
  }

  if (requirement.operator === 'NotEquals') {
    return `${requirement.key}!=${requirement.values[0]}`;
  }

  if (requirement.operator === 'Exists') {
    return requirement.key;
  }

  if (requirement.operator === 'DoesNotExist') {
    return `!${requirement.key}`;
  }

  if (requirement.operator === 'In') {
    return `${requirement.key} in (${toArray(requirement.values).join(',')})`;
  }

  if (requirement.operator === 'NotIn') {
    return `${requirement.key} notin (${toArray(requirement.values).join(',')})`;
  }

  if (requirement.operator === 'GreaterThan') {
    return `${requirement.key} > ${requirement.values[0]}`;
  }

  if (requirement.operator === 'LessThan') {
    return `${requirement.key} < ${requirement.values[0]}`;
  }

  return; // falsy means malformed requirement
};
