export enum TruncationPoint {
  'middle',
  'end'
}

const ELLIPSIS: string = '\u2026';

// Truncates a string down to `maxLength` characters by replacing the middle portion of the string with an ellipsis
const truncateMiddle = (text: string, maxLength: number): string => {
  const half = Math.floor(maxLength/2);
  const startFragment = text.substr(0, Math.max((half - 2), 0));
  const endFragment = text.substr(text.length - half);
  return `${startFragment}${ELLIPSIS}${endFragment}`;
};

const truncateEnd = (text: string, maxLength: number): string => {
  const fragment = text.substr(0, maxLength-1);
  return `${fragment}${ELLIPSIS}`;
};

export const truncate = (text: string = '', truncationPoint: TruncationPoint = TruncationPoint.end, maxLength: number = 20): string => {
  const length = text.length;
  if (length <= maxLength || maxLength < 3) {
    return text;
  }

  switch (truncationPoint) {
    case TruncationPoint.end:
      return truncateEnd(text, maxLength);
    case TruncationPoint.middle:
      return truncateMiddle(text, maxLength);
    default:
      return truncateEnd(text, maxLength);
  }
};
