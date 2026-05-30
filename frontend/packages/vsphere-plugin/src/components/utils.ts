import { Buffer } from 'buffer';
import type { ConsoleTFunction } from '@console/dynamic-plugin-sdk';

export const encodeBase64 = (data: string) => Buffer.from(data).toString('base64');
export const decodeBase64 = (data: string) => Buffer.from(data, 'base64').toString('ascii');

export const getErrorMessage = (t: ConsoleTFunction, error: unknown): string => {
  if (error instanceof Error) {
    return error.message || '';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof String) {
    return error.toString();
  }
  return t('vsphere-plugin~Unexpected error');
};
