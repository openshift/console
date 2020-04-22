import * as _ from 'lodash';
import { CUSTOM_FLAVOR } from '../constants/vm';
import { OperatingSystemRecord } from '../types';

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

const getOSVersion = (osID: string): number[] =>
  (osID || '')
    .split(/\D/)
    .filter((x) => x)
    .map((num) => parseInt(num, 10));

/**
 *
 *
 * Compare the numbers between the two versions by the order of their appearance
 * in the OS name.
 *
 * For example:
 * osVersion1: [10,2] for OS: 'Windows 10 R2',
 * osVersion2: [10] for OS: 'Windows 10',
 * (return 1)
 *
 * osVersion1: [9,10] for OS: 'ubuntu9.10',
 * osVersion2: [10,4] for OS: 'ubuntu10.04',
 * (return -1)
 *
 * return 0 when equal.
 *
 */
export const compareVersions = (osVersion1: number[], osVersion2: number[]): number => {
  if (!osVersion1 && !osVersion2) {
    return 0;
  }

  const osVer1 = osVersion1 || [];
  const osVer2 = osVersion2 || [];

  const zipped = _.zip(osVer1, osVer2);
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

  return compareVersions(getOSVersion(os1.id), getOSVersion(os2.id)) * -1;
};

export const removeOSDups = (osArr: OperatingSystemRecord[]): OperatingSystemRecord[] =>
  _.uniqBy(osArr.filter((x) => x).sort(descSortOSes), 'name');
