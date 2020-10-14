/**
 * Multi-line equivalent of `String.prototype.trimStart` function.
 */
export const trimStartMultiLine = (s: string) => s.replace(/^\s+/gm, '');
