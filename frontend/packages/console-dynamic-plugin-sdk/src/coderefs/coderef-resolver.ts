/* eslint-disable no-console */

import * as _ from 'lodash';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import {
  RemoteEntryModule,
  EncodedCodeRef,
  CodeRef,
  ResolvedCodeRefProperties,
  ExtensionProperties,
} from '../types';

// TODO(vojtech): support code refs at any level within the properties object

export const codeRefSymbol = Symbol('CodeRef');

export const isEncodedCodeRef = (obj): obj is EncodedCodeRef =>
  _.isPlainObject(obj) &&
  _.isEqual(Object.getOwnPropertyNames(obj), ['$codeRef']) &&
  typeof (obj as EncodedCodeRef).$codeRef === 'string';

export const isExecutableCodeRef = (obj): obj is CodeRef =>
  _.isFunction(obj) &&
  _.isEqual(Object.getOwnPropertySymbols(obj), [codeRefSymbol]) &&
  obj[codeRefSymbol] === true;

export const filterEncodedCodeRefProperties = (properties) =>
  _.pickBy(properties, isEncodedCodeRef) as { [propName: string]: EncodedCodeRef };

export const filterExecutableCodeRefProperties = (properties) =>
  _.pickBy(properties, isExecutableCodeRef) as { [propName: string]: CodeRef };

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
  let requestedModule: object;

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
    const refs = filterEncodedCodeRefProperties(e.properties);

    Object.entries(refs).forEach(([propName, ref]) => {
      const executableCodeRef: CodeRef = async () =>
        loadReferencedObject(ref, entryModule, pluginID, errorCallback);

      executableCodeRef[codeRefSymbol] = true;
      e.properties[propName] = executableCodeRef;
    });

    return e;
  });

/**
 * Returns an object representing resolved `CodeRef` properties for the given extension.
 */
export const resolveCodeRefProperties = async <E extends Extension<P>, P = ExtensionProperties<E>>(
  extension: E,
): Promise<ResolvedCodeRefProperties<P>> => {
  const refs = filterExecutableCodeRefProperties(extension.properties);
  const resolvedValues = {} as ResolvedCodeRefProperties<P>;

  await Promise.all(
    Object.entries(refs).map(async ([propName, ref]) => {
      resolvedValues[propName] = await ref();
    }),
  );

  return resolvedValues;
};
