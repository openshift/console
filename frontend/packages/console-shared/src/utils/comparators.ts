import * as semver from 'semver';

/**
 * A null safe wrapper for String.localeCompare. Sorts strings alphabetically in ascending order,
 * using the current JS runtime locale.
 */
export const localeComparator: Comparator<string> = (a, b) => (a || '').localeCompare(b || '');

/**
 * Determines if two boolean values are equivalent. Sorts true before false.
 */
export const boolComparator: Comparator<boolean> = (a, b) => (a ? 0 : 1) - (b ? 0 : 1);

/**
 * Compares two semantic version strings. Sorts in ascending order.
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 * Falls back to string comparison if semver parsing fails.
 */
export const semVerComparator: Comparator<string> = (a, b) => {
  const aVersion = semver.parse(a);
  const bVersion = semver.parse(b);

  if (!aVersion && !bVersion) {
    return (a || '').localeCompare(b || '');
  }
  if (!aVersion) return 1;
  if (!bVersion) return -1;

  return semver.compare(aVersion, bVersion);
};

/**
 * A null safe function that can be passed directly to Array.prototype.sort.
 */
export type Comparator<T extends any = any> = (a: T, b: T) => number;
