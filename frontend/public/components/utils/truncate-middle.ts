
const DEFAULT_OPTIONS = {
  length: 20,
  omission: '\u2026', // ellipsis character
};

// Truncates a string down to `maxLength` characters by replacing the middle
// the provided omission option (ellipsis character by default);
export const truncateMiddle = (text, options = {}): string => {
  const { length, omission } = Object.assign({}, DEFAULT_OPTIONS, options);

  if (text.length <= length) {
    return text;
  }

  if (length <= omission.length) {
    return omission;
  }

  const startLength = Math.ceil((length - omission.length) / 2);
  const endLength = length - startLength - omission.length;
  const startFragment = text.substr(0, startLength);
  const endFragment = text.substr(text.length - endLength);
  return `${startFragment}${omission}${endFragment}`;
};
