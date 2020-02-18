import * as _ from 'lodash';
import { CUSTOM_FLAVOR } from '../constants/vm';

const FLAVOR_ORDER = {
  tiny: 0,
  small: 1,
  medium: 2,
  large: 3,
};

export const flavorSort = (array: string[] = []) =>
  array.sort((a, b) => {
    if (a === CUSTOM_FLAVOR) {
      return 1;
    }
    if (b === CUSTOM_FLAVOR) {
      return -1;
    }
    const resolvedFlavorA = FLAVOR_ORDER[a];
    const resolvedFlavorB = FLAVOR_ORDER[b];
    if (resolvedFlavorA == null && resolvedFlavorB == null) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    }
    if (resolvedFlavorA == null) {
      return 1;
    }
    if (resolvedFlavorB == null) {
      return -1;
    }
    return resolvedFlavorA - resolvedFlavorB;
  });

export const ignoreCaseSort = <T>(
  array: T[] = [],
  byPath: string[] = undefined,
  byValueResolver: (item: T) => string = undefined,
) => {
  const resolve = (v) => {
    const result = _.isFunction(byValueResolver)
      ? byValueResolver(v)
      : byPath
      ? _.get(v, byPath, '')
      : v;

    return result == null ? '' : result.toLowerCase();
  };
  return array.sort((a, b) => resolve(a).localeCompare(resolve(b)));
};
