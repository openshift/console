/* eslint-disable no-console */

import { AnyObject, applyCodeRefSymbol } from '@openshift/dynamic-plugin-sdk';
import * as _ from 'lodash';
import type {
  Extension,
  EncodedCodeRef,
  CodeRef,
  ResolvedCodeRefProperties,
  ExtensionProperties,
  UpdateExtensionProperties,
} from '../types';
import { deepForOwn } from '../utils/object';
import { settleAllPromises } from '../utils/promise';

/**
 * Extract the SDK's internal CodeRef symbol by applying it to a dummy function.
 *
 * This ensures we can detect code refs created by the SDK, which uses its own
 * private Symbol instance.
 */
const codeRefSymbol = Object.getOwnPropertySymbols(applyCodeRefSymbol(() => Promise.resolve()))[0];

if (!codeRefSymbol) {
  throw new Error('Failed to extract CodeRef symbol from the SDK');
}

export const isEncodedCodeRef = (obj): obj is EncodedCodeRef =>
  _.isPlainObject(obj) &&
  _.isEqual(Object.getOwnPropertyNames(obj), ['$codeRef']) &&
  typeof (obj as EncodedCodeRef).$codeRef === 'string';

export const isExecutableCodeRef = (obj): obj is CodeRef =>
  _.isFunction(obj) &&
  _.isEqual(Object.getOwnPropertySymbols(obj), [codeRefSymbol]) &&
  obj[codeRefSymbol] === true;

const codeRefErrorSymbol = Symbol('error');
export const isCodeRefError = (ref: CodeRef) => !!ref[codeRefErrorSymbol];
export const getCodeRefError = (ref: CodeRef) => ref[codeRefErrorSymbol];
export const setCodeRefError = (ref: CodeRef, e: any) => {
  ref[codeRefErrorSymbol] = e;
  return ref;
};

/**
 * Parse the `EncodedCodeRef` value into `[moduleName, exportName]` tuple.
 *
 * Returns an empty array if the value doesn't match the expected format.
 */
export const parseEncodedCodeRefValue = (value: string): [string, string] | [] => {
  const match = value.match(/^([^.]+)(?:\.(.+)){0,1}$/);
  return match ? [match[1], match[2] || 'default'] : [];
};

/**
 * Returns an extension with its `CodeRef` properties replaced with referenced objects.
 *
 * The resulting Promise resolves with a new extension instance; its `properties` object
 * is cloned in order to preserve the original extension.
 */
export const resolveExtension = async <
  E extends Extension<string, P>,
  P extends AnyObject = ExtensionProperties<E>,
  R = UpdateExtensionProperties<E, ResolvedCodeRefProperties<P>, P>
>(
  extension: E,
): Promise<R> => {
  const clonedProperties = _.cloneDeep(extension.properties);
  const valueResolutions: Promise<void>[] = [];

  deepForOwn<CodeRef>(clonedProperties, isExecutableCodeRef, (ref, key, obj) => {
    if (isCodeRefError(ref)) {
      throw getCodeRefError(ref);
    }
    valueResolutions.push(
      ref()
        .then((resolvedValue) => {
          obj[key] = resolvedValue;

          if (_.isNil(resolvedValue)) {
            console.warn(`Code reference property '${key}' resolved to null or undefined`);
          }
        })
        .catch((e) => {
          setCodeRefError(ref, e ?? true);
          return e;
        }),
    );
  });

  await settleAllPromises(valueResolutions);

  // Return a new extension object with the resolved properties
  return ({
    ...extension,
    properties: clonedProperties,
  } as unknown) as R;
};
