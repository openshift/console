import i18next from 'i18next';
import { JSONSchema7 } from 'json-schema';
import { startCase, toPath } from 'lodash';
import { FirehoseResult } from '@console/internal/components/utils/types';
import { K8sKind, K8sResourceKind, modelFor } from '@console/internal/module/k8s';
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

export const isValidUrl = (url: string): boolean => URL.canParse(url);

export const returnIfValidURL = (url: string): string | undefined =>
  isValidUrl(url) ? url : undefined;

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

// Returns true if subject starts with at least one search string
export const startsWithSome = (subject: string, ...searchStrings: string[]): boolean =>
  searchStrings?.some(
    (searchString) => searchString?.length > 0 && subject.startsWith(searchString),
  );

export const alphanumericCompare = (a: string, b: string): number => {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
};

export const translationForResourceKind = {
  // t('console-shared~Helm Release')
  HelmRelease: `console-shared~Helm Release`,
};

export const labelForNodeKind = (kindString: string) => {
  const model: K8sKind | undefined = modelFor(kindString);
  if (model) {
    return model.label;
  }
  return startCase(kindString);
};

export const getTitleForNodeKind = (kindString: string) => {
  const model: K8sKind | undefined = modelFor(kindString);
  if (model) {
    if (model.labelKey) {
      return i18next.t(model.labelKey);
    }
    return model.label;
  }
  if (translationForResourceKind[kindString]) {
    return i18next.t(translationForResourceKind[kindString]);
  }
  return startCase(kindString);
};
