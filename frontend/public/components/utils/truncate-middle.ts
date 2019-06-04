const ELLIPSIS: string = '\u2026';

// Truncates a string down to `maxLength` characters by replacing the middle portion of the string with an ellipsis
export const truncateMiddle = (text: string, maxLength: number = 20): string => {
  const length = text.length;
  if (length <= maxLength || maxLength < 3) {
    return text;
  }
  const half = Math.floor(maxLength/2);
  const startFragment = text.substr(0, Math.max((half - 2), 0));
  const endFragment = text.substr(text.length - half);
  return `${startFragment}${ELLIPSIS}${endFragment}`;
};
