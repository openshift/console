/* eslint-env node */
// eslint-disable-next-line import/named
import { TFunction } from 'i18next';

const i18next = require.requireActual('i18next');

const interpolationPattern = /{{([A-Za-z0-9]+)}}/;

export const t = ((key: string, interpolation: Record<string, string>) => {
  let result = key.includes('~') ? key.substring(key.indexOf('~') + 1) : key;
  while (interpolation && result.match(interpolationPattern)) {
    result = result.replace(interpolationPattern, (_, variable) => interpolation[variable] || '');
  }
  return result;
}) as TFunction;

module.exports = {
  ...i18next,
  t,
  default: {
    ...i18next.default,
    use() {
      return this;
    },
    init: () => Promise.resolve(),
    t,
  },
};
