/* eslint-disable no-console */

import { CodeRef } from '../types';

export { applyCodeRefSymbol as getExecutableCodeRef } from './coderef-resolver';

/**
 * Execute function referenced by the `CodeRef` with given arguments.
 *
 * Returns the referenced function's return value or `null` if the execution failed.
 *
 * _Does not throw errors by design._
 */
export const executeReferencedFunction = async <T extends (...args: any[]) => any>(
  ref: CodeRef<T>,
  ...args: Parameters<T>
): Promise<ReturnType<T>> => {
  try {
    const func = await ref();
    return func(...args);
  } catch (error) {
    console.error('Failed to execute referenced function', error);
    return null;
  }
};
