import * as _ from 'lodash';

/**
 * Recursive equivalent of `_.forOwn` function that traverses plain objects.
 */
export const deepForOwn = <T = any>(
  obj: {},
  predicate: (value: any) => value is T,
  valueCallback: (value: T, key: string, container: {}) => void,
) => {
  _.forOwn<any>(obj, (value, key, container) => {
    if (predicate(value)) {
      valueCallback(value, key, container);
    } else if (_.isPlainObject(value)) {
      deepForOwn(value, predicate, valueCallback);
    }
  });
};
