import { TFunction } from 'i18next';

const i18next = jest.requireActual('i18next');

const interpolationPattern = /{{([A-Za-z0-9]+)}}/;

export const t = ((key: string, interpolation: Record<string, string>) => {
  let result = key.includes('~') ? key.substring(key.indexOf('~') + 1) : key;
  while (interpolation && result.match(interpolationPattern)) {
    result = result.replace(interpolationPattern, (_, variable) => interpolation[variable] || '');
  }
  return result;
}) as TFunction;

// Spreading the i18next instance drops EventEmitter methods from its prototype, but
// react-i18next's useTranslation subscribes to them (i18n.on / i18n.store.on) on mount.
const on = jest.fn();
const off = jest.fn();
const store = { on, off };

module.exports = {
  ...i18next,
  on,
  off,
  store,
  t,
  default: {
    ...i18next.default,
    on,
    off,
    store,
    use() {
      return this;
    },
    init: () => Promise.resolve(),
    t,
  },
};
