import { Buffer } from 'buffer';
import { TFunction } from 'react-i18next';

export const parseKeyValue = (config: string, delimiter = '='): { [key: string]: string } => {
  const lines = config.split('\n');

  const result: { [key: string]: string } = {};
  lines.forEach((line) => {
    const idx = line.indexOf(delimiter);
    if (idx > 0) {
      const key = line.substring(0, idx).trim();
      let value = line.substring(idx + 1).trim();

      if (value.charAt(0) === '"') value = value.substring(1);
      if (value.charAt(value.length - 1) === '"') value = value.substring(0, value.length - 1);
      result[key] = value;
    }
  });

  return result;
};

export const encodeBase64 = (data: string) => Buffer.from(data).toString('base64');
export const decodeBase64 = (data: string) => Buffer.from(data, 'base64').toString('ascii');

export const getErrorMessage = (t: TFunction<'vsphere-plugin'>, error: unknown): string => {
  if (error instanceof Error) {
    return error.message || '';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof String) {
    return error.toString();
  }
  return t('Unexpected error');
};
