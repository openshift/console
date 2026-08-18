import type { TFunction } from 'i18next';

const interpolationPattern = /{{([A-Za-z0-9]+)}}/g;

export const t = ((key: string, interpolation: Record<string, string>) => {
  let result = key.includes('~') ? key.substring(key.indexOf('~') + 1) : key;
  result = result.replace(interpolationPattern, (_, variable) => interpolation?.[variable] ?? '');
  return result;
}) as TFunction;
