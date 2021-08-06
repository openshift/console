import * as _ from 'lodash';

const isPlainNonReactObject = (obj: any) => _.isPlainObject(obj) && !obj.$$typeof;

/**
 * Recursive equivalent of `_.forOwn` function that traverses plain objects and arrays.
 */
export const deepForOwn = <T = any>(
  obj: {},
  predicate: (value: any) => value is T,
  valueCallback: (value: T, key: string, container: {}) => void,
) => {
  const visitValue = (value: any, key: string, container: {}) => {
    if (predicate(value)) {
      valueCallback(value, key, container);
    } else if (isPlainNonReactObject(value)) {
      deepForOwn(value, predicate, valueCallback);
    }
  };

  _.forOwn<any>(obj, (value, key, container) => {
    if (Array.isArray(value)) {
      value.forEach((arrayElement, index) => {
        visitValue(arrayElement, index.toString(), value);
      });
    } else {
      visitValue(value, key, container);
    }
  });
};
