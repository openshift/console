import * as _ from 'lodash';

const alphanumericRegex = '[a-zA-Z0-9]';
const alphanumericRegexWithDash = '[-a-zA-Z0-9]';

const DNS1123_MAX_LENGTH = 253;

export const alignWithDNS1123 = (str) => {
  if (!str) {
    return '';
  }

  const chars = str.toLowerCase().replace(/\./g, '-').split('');

  const firstValidCharIndex = chars.findIndex((c) => c.match(alphanumericRegex));
  const lastValidCharIndex = _.findLastIndex(chars, (c: string) => c.match(alphanumericRegex));

  if (firstValidCharIndex < 0) {
    return '';
  }

  let result = chars
    .slice(firstValidCharIndex, lastValidCharIndex + 1)
    .filter((c) => c.match(alphanumericRegexWithDash));

  if (result.length > DNS1123_MAX_LENGTH) {
    result = result.slice(0, DNS1123_MAX_LENGTH);
  }

  return result.join('');
};
