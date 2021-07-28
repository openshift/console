import { JSONSchema7 } from 'json-schema';
import { toPath } from 'lodash';
import { FirehoseResult } from '@console/internal/components/utils/types';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getUID } from '../selectors/common';

export type EntityMap<A> = { [propertyName: string]: A };
export type K8sEntityMap<A extends K8sResourceKind> = EntityMap<A>;

type KeyResolver<A> = (entity: A) => string;

export const createBasicLookup = <A>(list: A[], getKey: KeyResolver<A>): EntityMap<A> => {
  return (list || []).reduce((lookup, entity) => {
    const key = getKey(entity);
    if (key) {
      lookup[key] = entity;
    }
    return lookup;
  }, {});
};

export const createLookup = <A extends K8sResourceKind>(
  loadingList: FirehoseResult<A[]>,
  getKey?: KeyResolver<A>,
): K8sEntityMap<A> => {
  if (loadingList && loadingList.loaded) {
    return createBasicLookup(loadingList.data, getKey || getUID);
  }
  return {};
};

export const getRandomChars = (len = 6): string => {
  return Math.random()
    .toString(36)
    .replace(/[^a-z0-9]+/g, '')
    .substr(1, len);
};

export const isValidUrl = (url: string): boolean => {
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Recursive helper for getSchemaAtPath
const recursiveGetSchemaAtPath = (
  schema: JSONSchema7,
  [segment, ...path]: string[] = [],
): JSONSchema7 => {
  if (segment) {
    return /^\d+$/.test(segment)
      ? recursiveGetSchemaAtPath(schema?.items as JSONSchema7, path)
      : recursiveGetSchemaAtPath(schema?.properties?.[segment] as JSONSchema7, path);
  }
  return schema;
};

// Get a schema at the provided path string.
export const getSchemaAtPath = (schema: JSONSchema7, path: string): JSONSchema7 => {
  return recursiveGetSchemaAtPath(schema, toPath(path));
};

// Converts a string to title case `some-title` -> `Some Title`
export const toTitleCase = (title: string): string => {
  return title
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.substr(1) : ''))
    .join(' ');
};

// Check for a modified mouse event. For example - Ctrl + Click
export const isModifiedEvent = (event: React.MouseEvent<HTMLElement>) => {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
};
