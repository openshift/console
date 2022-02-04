/* eslint-env node */
const interpolationPattern = /{{([A-Za-z0-9]+)}}/;

export const t = (key: string, interpolation?: Record<string, string>) => {
  let result = key.includes('~') ? key.substring(key.indexOf('~') + 1) : key;
  while (interpolation && result.match(interpolationPattern)) {
    result = result.replace(interpolationPattern, (_, variable) => interpolation[variable] || '');
  }
  return result;
};

const i18next: any = jest.createMockFromModule('i18next');
i18next.t = t;
i18next.language = 'en';

export default i18next;
