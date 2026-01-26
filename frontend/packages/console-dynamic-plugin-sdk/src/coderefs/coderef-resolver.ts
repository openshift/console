/* eslint-disable no-console */

import { isPlainObject, isEqual } from 'lodash';
import type { EncodedCodeRef } from '../types';

export const isEncodedCodeRef = (obj): obj is EncodedCodeRef =>
  isPlainObject(obj) &&
  isEqual(Object.getOwnPropertyNames(obj), ['$codeRef']) &&
  typeof (obj as EncodedCodeRef).$codeRef === 'string';

/**
 * Parse the `EncodedCodeRef` value into `[moduleName, exportName]` tuple.
 *
 * Returns an empty array if the value doesn't match the expected format.
 */
export const parseEncodedCodeRefValue = (value: string): [string, string] | [] => {
  const match = value.match(/^([^.]+)(?:\.(.+)){0,1}$/);
  return match ? [match[1], match[2] || 'default'] : [];
};
