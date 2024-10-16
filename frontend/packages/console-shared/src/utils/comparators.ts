import * as SemVer from 'semver';

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
 * Wrapper for SemVer.compare function. Sorts semver strings in ascending order. Invalid semver
 * strings will be sorted last.
 */
export const semVerComparator: Comparator<string | SemVer.SemVer> = (a, b) => SemVer.compare(a, b);

/**
 * Same as semVerCompare, but is more forgiving for not-quite-valid semver strings. Sorts strings in
 * ascending order based on the loosely interpreted semver value.
 */
export const looseSemVerComparator: Comparator<string | SemVer.SemVer> = (a, b) =>
  SemVer.compare(a, b, true);

/**
 * A null safe function that can be passed directly to Array.prototype.sort.
 */
export type Comparator<T extends any = any> = (a: T, b: T) => number;
