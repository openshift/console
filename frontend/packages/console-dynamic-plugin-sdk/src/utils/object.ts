import * as _ from 'lodash';

const isPlainNonReactObject = (obj: any) => _.isPlainObject(obj) && !obj.$$typeof;

export type ValueCallback<T> = (value: T, key: string, container: {}, path: string) => void;
export type PredicateCheck<T> = (value: unknown, path: string) => value is T;

/**
 * Recursive equivalent of `_.forOwn` function that traverses plain objects and arrays.
 */
export const deepForOwn = <T = any>(
  obj: {},
  predicate: PredicateCheck<T>,
  valueCallback: ValueCallback<T>,
  pathParts: string[] = [],
) => {
  const visitValue = (value: any, key: string, container: {}, newPathParts: string[]) => {
    const path = newPathParts.join('.');
    if (predicate(value, path)) {
      valueCallback(value, key, container, path);
    } else if (isPlainNonReactObject(value)) {
      deepForOwn(value, predicate, valueCallback, newPathParts);
    }
  };

  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const newPathParts = [...pathParts, key];
    if (Array.isArray(value)) {
      value.forEach((arrayElement, index) => {
        const indexKey = index.toString();
        visitValue(arrayElement, indexKey, value, [...newPathParts, indexKey]);
      });
    } else {
      visitValue(value, key, obj, newPathParts);
    }
  });
};
