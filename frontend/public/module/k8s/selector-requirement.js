import * as _ from 'lodash';
import { createEquals } from '@console/dynamic-plugin-sdk/src/utils/k8s';

export const requirementFromString = (string) => {
  const str = string.trim();

  // "key"
  if (/^[0-9A-Za-z/\-_.]+$/.test(str)) {
    return {
      key: str,
      operator: 'Exists',
      values: [],
    };
  }

  // "!key"
  if (/^!\s*[0-9A-Za-z/\-_.]+$/.test(str)) {
    return {
      key: str.split(/!\s*/)[1],
      operator: 'DoesNotExist',
      values: [],
    };
  }

  // "key=value" OR "key==value"
  if (/^[0-9A-Za-z/\-_.]+\s*==?\s*[0-9A-Za-z/\-_.]+$/.test(str)) {
    const parts = str.split(/\s*==?\s*/);
    const key = parts[0];
    const value = parts[1];
    return createEquals(key, value);
  }

  // "key!=value"
  if (/^[0-9A-Za-z/\-_.]+\s*!=\s*[0-9A-Za-z/\-_.]+$/.test(str)) {
    return {
      key: str.split(/\s*!=\s*/)[0],
      operator: 'NotEquals',
      values: [str.split(/\s*!=\s*/)[1]],
    };
  }

  // "key in (value1[,value2,...])"
  if (/^[0-9A-Za-z/\-_.]+\s+in\s+\([0-9A-Za-z/\-_.,\s]+\)$/.test(str)) {
    const parts = str.split(/\s+in\s+/);
    const key = parts[0];
    const values = parts[1].slice(1, -1).split(',').map(_.trim);

    return {
      key,
      operator: 'In',
      values,
    };
  }

  // "key notin (value1[,value2,...])"
  if (/^[0-9A-Za-z/\-_.]+\s+notin\s+\([0-9A-Za-z/\-_.,\s]+\)$/.test(str)) {
    const parts = str.split(/\s+notin\s+/);
    const key = parts[0];
    const values = parts[1].slice(1, -1).split(',').map(_.trim);

    return {
      key,
      operator: 'NotIn',
      values,
    };
  }

  // "key > value1"
  if (/^[0-9A-Za-z/\-_.]+\s+>\s+[0-9.]+$/.test(str)) {
    const parts = str.split(/\s+>\s+/);
    const key = parts[0];
    const value = parts[1];

    return {
      key,
      operator: 'GreaterThan',
      values: [value],
    };
  }

  // "key < value1"
  if (/^[0-9A-Za-z/\-_.]+\s+<\s+[0-9.]+$/.test(str)) {
    const parts = str.split(/\s+<\s+/);
    const key = parts[0];
    const value = parts[1];

    return {
      key,
      operator: 'LessThan',
      values: [value],
    };
  }

  // falsy means parsing failure
};
