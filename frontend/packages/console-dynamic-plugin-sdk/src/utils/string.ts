/**
 * Remove the first leading and/or trailing quote character.
 */
export const unquote = (s: string) => s.replace(/^["']{1}(.*)["']{1}$/, '$1');
