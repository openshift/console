import * as _ from 'lodash';
import { OperatingSystemRecord } from '../types';
import { isCustomFlavor } from '../selectors/vm-like/flavor';

const FLAVOR_ORDER = {
  tiny: 0,
  small: 1,
  medium: 2,
  large: 3,
};

export const flavorSort = (array: string[] = []) =>
  array.sort((a, b) => {
    if (isCustomFlavor(a)) {
      return 1;
    }
    if (isCustomFlavor(b)) {
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

const splitVersion = (osID: string): number[] =>
  (osID || '')
    .split(/\D/)
    .filter((x) => x)
    .map((num) => parseInt(num, 10));

/**
 *
 *
 * Compare the numbers between the two versions by the order of their appearance
 * eg in the OS name.
 *
 * For example:
 * version1: [10,2] for OS: 'Windows 10 R2',
 * version2: [10] for OS: 'Windows 10',
 * (return 1)
 *
 * version1: [9,10] for OS: 'ubuntu9.10',
 * version2: [10,4] for OS: 'ubuntu10.04',
 * (return -1)
 *
 * return 0 when equal.
 *
 */
export const compareVersions = (version1: string, version2: string): number => {
  if (!version1 && !version2) {
    return 0;
  }

  // 'devel' version if exist is always the highst version.
  if (version1 === 'devel') {
    return 1;
  }
  if (version2 === 'devel') {
    return -1;
  }

  const finalVersion1 = splitVersion(version1) || [];
  const finalVersion2 = splitVersion(version2) || [];

  const zipped = _.zip(finalVersion1, finalVersion2);
  let idx = 0;
  while (idx < zipped.length) {
    /*
      undefined values are equal to 0, eg:
      14.0 == 14 -> zipped = [[14,14],[0,undefined]]
      1.0.0 == 1 -> zipped = [[1,1],[0,undefined],[0,undefined]]
    */
    const ver1 = !zipped[idx][0] ? 0 : zipped[idx][0];
    const ver2 = !zipped[idx][1] ? 0 : zipped[idx][1];

    if (ver1 > ver2) {
      return 1;
    }

    if (ver2 > ver1) {
      return -1;
    }

    idx++;
  }

  return 0;
};

const descSortOSes = (os1: OperatingSystemRecord, os2: OperatingSystemRecord): number => {
  const nameCMP = (os1.name || '').localeCompare(os2.name || '');
  if (nameCMP !== 0) {
    return nameCMP * -1;
  }

  return compareVersions(os1.id, os2.id) * -1;
};

export const removeOSDups = (osArr: OperatingSystemRecord[]): OperatingSystemRecord[] =>
  _.uniqBy(osArr.filter((x) => x).sort(descSortOSes), 'name');
