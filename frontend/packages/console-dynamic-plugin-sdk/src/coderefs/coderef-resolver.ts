/* eslint-disable no-console */

import * as _ from 'lodash';
import {
  Extension,
  RemoteEntryModule,
  EncodedCodeRef,
  CodeRef,
  ResolvedCodeRefProperties,
  ExtensionProperties,
  UpdateExtensionProperties,
} from '../types';
import { deepForOwn } from '../utils/object';
import { settleAllPromises } from '../utils/promise';
import { mergeExtensionProperties } from '../utils/store';

const codeRefSymbol = Symbol('CodeRef');

export const applyCodeRefSymbol = <T = any>(ref: CodeRef<T>) => {
  ref[codeRefSymbol] = true;
  return ref;
};

export const isEncodedCodeRef = (obj): obj is EncodedCodeRef =>
  _.isPlainObject(obj) &&
  _.isEqual(Object.getOwnPropertyNames(obj), ['$codeRef']) &&
  typeof (obj as EncodedCodeRef).$codeRef === 'string';

export const isExecutableCodeRef = (obj): obj is CodeRef =>
  _.isFunction(obj) &&
  _.isEqual(Object.getOwnPropertySymbols(obj), [codeRefSymbol]) &&
  obj[codeRefSymbol] === true;

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
 * Returns the object referenced by the `EncodedCodeRef`.
 *
 * If an error occurs, calls `errorCallback` and returns `null`.
 *
 * _Does not throw errors by design._
 */
export const loadReferencedObject = async <TExport = any>(
  ref: EncodedCodeRef,
  entryModule: RemoteEntryModule,
  pluginID: string,
  errorCallback: VoidFunction,
): Promise<TExport> => {
  const [moduleName, exportName] = parseEncodedCodeRefValue(ref.$codeRef);
  let requestedModule: {};

  if (!moduleName) {
    console.error(`Malformed code reference '${ref.$codeRef}' of plugin ${pluginID}`);
    errorCallback();
    return null;
  }

  try {
    const moduleFactory = await entryModule.get(moduleName);
    requestedModule = moduleFactory();
  } catch (error) {
    console.error(`Failed to load module '${moduleName}' of plugin ${pluginID}`, error);
    errorCallback();
    return null;
  }

  if (!requestedModule[exportName]) {
    console.error(`Missing module export '${moduleName}.${exportName}' of plugin ${pluginID}`);
    errorCallback();
    return null;
  }

  return requestedModule[exportName];
};

/**
 * Returns new `extensions` array, resolving `EncodedCodeRef` values into `CodeRef` functions.
 *
 * _Does not execute `CodeRef` functions to load the referenced objects._
 */
export const resolveEncodedCodeRefs = (
  extensions: Extension[],
  entryModule: RemoteEntryModule,
  pluginID: string,
  errorCallback: VoidFunction,
): Extension[] =>
  _.cloneDeep(extensions).map((e) => {
    deepForOwn<EncodedCodeRef>(e.properties, isEncodedCodeRef, (ref, key, obj) => {
      obj[key] = applyCodeRefSymbol(async () =>
        loadReferencedObject(ref, entryModule, pluginID, errorCallback),
      );
    });

    return e;
  });

/**
 * Returns an extension with its `CodeRef` properties replaced with referenced objects.
 */
export const resolveExtension = async <
  E extends Extension<P>,
  P = ExtensionProperties<E>,
  R = UpdateExtensionProperties<E, ResolvedCodeRefProperties<P>, P>
>(
  extension: E,
): Promise<R> => {
  const valueResolutions: Promise<void>[] = [];
  const resolvedProperties = { ...extension.properties };

  deepForOwn<CodeRef>(resolvedProperties, isExecutableCodeRef, (ref, key, obj) => {
    valueResolutions.push(
      ref().then((resolvedValue) => {
        obj[key] = resolvedValue;
      }),
    );
  });

  if (valueResolutions.length === 0) {
    return (extension as unknown) as R;
  }

  await settleAllPromises(valueResolutions);

  return (mergeExtensionProperties(extension, resolvedProperties) as unknown) as R;
};
