import * as _ from 'lodash-es';

const toArray = (value) => (Array.isArray(value) ? value : [value]);

export const createEquals = (key, value) => ({
  key,
  operator: 'Equals',
  values: [value],
});

const validateKey = (key) => /^(([A-Za-z0-9][0-9A-Za-z/\-_.]*)?[A-Za-z0-9])$/.test(key);

export const requirementFromString = (string) => {
  string = string.trim();

  // "key"
  if (/^[0-9A-Za-z/\-_.]+$/.test(string)) {
    if (validateKey(string)) {
      return { key: string, operator: 'Exists', values: [] };
    }
  }

  // "!key"
  if (/^!\s*[0-9A-Za-z/\-_.]+$/.test(string)) {
    const key = string.split(/!\s*/)[1];
    if (validateKey(key)) {
      return { key, operator: 'DoesNotExist', values: [] };
    }
  }

  // "key=value" OR "key==value"
  if (/^[0-9A-Za-z/\-_.]+\s*==?\s*[0-9A-Za-z/\-_.]+$/.test(string)) {
    const [key, value] = string.split(/\s*==?\s*/);
    if (validateKey(key)) {
      return { key, operator: 'Equals', values: [value] };
    }
  }

  // "key!=value"
  if (/^[0-9A-Za-z/\-_.]+\s*!=\s*[0-9A-Za-z/\-_.]+$/.test(string)) {
    const [key, value] = string.split(/\s*!=?\s*/);
    if (validateKey(key)) {
      return { key, operator: 'NotEquals', values: [value] };
    }
  }

  // "key in (value1[,value2,...])"
  if (/^[0-9A-Za-z/\-_.]+\s+in\s+\([0-9A-Za-z/\-_.,\s]+\)$/.test(string)) {
    const parts = string.split(/\s+in\s+/);
    const key = parts[0];
    const values = parts[1]
      .slice(1, -1)
      .split(',')
      .map(_.trim);
    if (validateKey(key)) {
      return { key, operator: 'In', values };
    }
  }

  // "key notin (value1[,value2,...])"
  if (/^[0-9A-Za-z/\-_.]+\s+notin\s+\([0-9A-Za-z/\-_.,\s]+\)$/.test(string)) {
    const parts = string.split(/\s+notin\s+/);
    const key = parts[0];
    const values = parts[1]
      .slice(1, -1)
      .split(',')
      .map(_.trim);
    if (validateKey(key)) {
      return { key, operator: 'NotIn', values };
    }
  }

  // "key > value1"
  if (/^[0-9A-Za-z/\-_.]+\s+>\s+[0-9.]+$/.test(string)) {
    const [key, value] = string.split(/\s+>\s+/);
    if (validateKey(key)) {
      return { key, operator: 'GreaterThan', values: [value] };
    }
  }

  // "key < value1"
  if (/^[0-9A-Za-z/\-_.]+\s+<\s+[0-9.]+$/.test(string)) {
    const [key, value] = string.split(/\s+<\s+/);
    if (validateKey(key)) {
      return { key, operator: 'LessThan', values: [value] };
    }
  }

  return; // falsy means parsing failure
};

export const requirementToString = (requirement) => {
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
