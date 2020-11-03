/* eslint-disable no-console */

import { CodeRef } from '../types';
import { codeRefSymbol } from './coderef-resolver';

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

/**
 * Convert any codeRef to an executable codeRef that can be executed by useResolvedExtension.
 *
 * Adds codeRefSymbol to the codeRef.
 *
 * TODO: Remove this once https://github.com/openshift/console/pull/7163 gets merged that adds support for dynamic extensions in static plugins.
 *
 * @param ref codeRef that needs to be converted to an executable codeRef.
 */
export const getExecutableCodeRef = (ref: CodeRef): CodeRef => {
  ref[codeRefSymbol] = true;
  return ref;
};
