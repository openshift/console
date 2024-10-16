import * as SemVer from 'semver';

/**
 * A null safe wrapper for String.localeCompare. Sorts strings alphabetically in ascending order.
 */
export const stringComparator = (a: string, b: string): number => (a || '').localeCompare(b || '');
/**
 * Inverse of stringComparator. Sorts strings alphabetically in descending order.
 */
export const rStringComparator = (a: string, b: string): number => -stringComparator(a, b);

/**
 * Determines if two boolean values are equivalent. Sorts true before false.
 */
export const boolComparator = (a: boolean, b: boolean): number => (a ? 0 : 1) - (b ? 0 : 1);
/**
 * Inverse of boolCompare. Sorts false before true.
 */
export const rBoolComparator = (a: boolean, b: boolean): number => -boolComparator(a, b);

/**
 * Wrapper for SemVer.compare function. Sorts semver strings in ascending order. Invalid semver
 * strings will be sorted last.
 */
export const semVerComparator = (a: string, b: string): number => SemVer.compare(a, b);
/**
 * Inverse of semVerComparator. Sorts strings in descending order by semver. Invalid semver strings
 * will be sorted last.
 */
export const rSemVerComparator = (a: string, b: string): number => -semVerComparator(a, b);

/**
 * Same as semVerCompare, but is more forgiving for not-quite-valid semver strings. Sorts strings in
 * ascending order based on the loosely interpreted semver value.
 */
export const looseSemVerComparator = (a: string, b: string): number => SemVer.compare(a, b, true);
/**
 * Inverse of looseSemVerCompare. Sorts strings in descending order based on the loosely
 * interpreted semver value.
 */
export const rLooseSemVerComparator = (a: string, b: string): number => SemVer.compare(a, b, true);
