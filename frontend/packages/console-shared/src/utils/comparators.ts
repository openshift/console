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
 * A null safe function that can be passed directly to Array.prototype.sort.
 */
export type Comparator<T extends any = any> = (a: T, b: T) => number;
