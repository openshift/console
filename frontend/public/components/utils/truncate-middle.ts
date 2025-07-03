export type TruncateOptions = {
  length?: number; // Length to truncate text to
  truncateEnd?: boolean; // Flag to alternatively truncate at the end
  omission?: string; // Truncation text used to denote the truncation (ellipsis)
  minTruncateChars?: number; // Minimum number of characters to truncate
};

const DEFAULT_OPTIONS: TruncateOptions = {
  length: 20,
  truncateEnd: false,
  omission: '\u2026', // ellipsis character
  minTruncateChars: 3,
};

// Truncates a string down to `maxLength` characters when the length
// is greater than the `maxLength` + `minTruncateChars` values.
// By default the middle is truncated, set the options.truncateEnd to true to truncate at the end.
// Truncated text is replaced with the provided omission option (ellipsis character by default);
export const truncateMiddle = (text: string, options: TruncateOptions = {}): string => {
  const { length, truncateEnd, omission, minTruncateChars } = { ...DEFAULT_OPTIONS, ...options };
  if (!text) {
    return text;
  }

  // Do not truncate less than the minimum truncate characters
  if (text.length <= (length || 0) + (minTruncateChars || 0)) {
    return text;
  }

  if (length && length <= (omission?.length || 0)) {
    return omission || '';
  }

  if (truncateEnd) {
    return `${text.substr(0, (length || 0) - 1)}${omission || ''}`;
  }

  const startLength = Math.ceil(((length || 0) - (omission?.length || 0)) / 2);
  const endLength = (length || 0) - startLength - (omission?.length || 0);
  const startFragment = text.substr(0, startLength);
  const endFragment = text.substr(text.length - endLength);
  return `${startFragment}${omission}${endFragment}`;
};

export const shouldTruncate = (text, options: TruncateOptions = {}): boolean => {
  const { length, minTruncateChars } = { ...DEFAULT_OPTIONS, ...options };

  return text.length > (length || 0) + (minTruncateChars || 0);
};
