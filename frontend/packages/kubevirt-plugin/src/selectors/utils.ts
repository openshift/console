import { JSONSchema6 } from 'json-schema';
import * as _ from 'lodash';
import { toPath } from 'lodash';
import { FirehoseResult } from '@console/internal/components/utils/types';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getUID } from './selectors';

export type EntityMap<A> = { [propertyName: string]: A };
export type K8sEntityMap<A extends K8sResourceKind> = EntityMap<A>;

type KeyResolver<A> = (entity: A) => string;

const alphanumericRegex = '[a-zA-Z0-9]';
const alphanumericRegexWithDash = '[-a-zA-Z0-9]';
const DNS1123_MAX_LENGTH = 253;
export const DASH = '-';

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
  schema: JSONSchema6,
  [segment, ...path]: string[] = [],
): JSONSchema6 => {
  if (segment) {
    return /^\d+$/.test(segment)
      ? recursiveGetSchemaAtPath(schema?.items as JSONSchema6, path)
      : recursiveGetSchemaAtPath(schema?.properties?.[segment] as JSONSchema6, path);
  }
  return schema;
};

// Get a schema at the provided path string.
export const getSchemaAtPath = (schema: JSONSchema6, path: string): JSONSchema6 => {
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

type StringHashMap = {
  [key: string]: string;
};

const getPrefixedKey = (obj: StringHashMap, keyPrefix: string) =>
  obj ? Object.keys(obj).find((key) => key.startsWith(keyPrefix)) : null;

const getSuffixValue = (key: string) => {
  const index = key ? key.lastIndexOf('/') : -1;
  return index > 0 ? key.substring(index + 1) : null;
};

export const findKeySuffixValue = (obj: StringHashMap, keyPrefix: string) =>
  getSuffixValue(getPrefixedKey(obj, keyPrefix));

export const findHighestKeyBySuffixValue = (obj: StringHashMap, keyPrefix: string) => {
  const sortedKeys = Object.keys(obj)
    .filter((key) => key.startsWith(keyPrefix))
    .sort();
  return getSuffixValue(sortedKeys[sortedKeys.length - 1]);
};

export const getSimpleName = (obj): string => obj && obj.name;

export const joinGrammaticallyListOfItems = (items: string[], separator = 'and') => {
  const result = items.join(', ');
  const lastCommaIdx = result.lastIndexOf(',');

  return items.length > 1 && lastCommaIdx >= 0
    ? `${result.substr(0, lastCommaIdx)} ${separator}${result.substr(lastCommaIdx + 1)}`
    : result;
};

export const alignWithDNS1123 = (str) => {
  if (!str) {
    return '';
  }

  const chars = str
    .toLowerCase()
    .replace(/\./g, '-')
    .split('');

  const firstValidCharIndex = chars.findIndex((c) => c.match(alphanumericRegex));
  const lastValidCharIndex = _.findLastIndex(chars, (c: string) => c.match(alphanumericRegex));

  if (firstValidCharIndex < 0) {
    return '';
  }

  let result = chars
    .slice(firstValidCharIndex, lastValidCharIndex + 1)
    .filter((c) => c.match(alphanumericRegexWithDash));

  if (result.length > DNS1123_MAX_LENGTH) {
    result = result.slice(0, DNS1123_MAX_LENGTH);
  }

  return result.join('');
};

export const dimensifyHeader = (header: any[], columnClasses: string[]) => {
  if (!header || !columnClasses || header.length !== columnClasses.length) {
    console.warn('wrong dimensions specified for header'); // eslint-disable-line no-console
    return header;
  }

  return header.map((column, idx) => ({
    ...column,
    props: {
      ...column.props,
      className: columnClasses[idx],
    },
  }));
};

type DimensionResolver = (isLast?: boolean) => string;

export const dimensifyRow = (columnClasses: any[]): DimensionResolver => {
  let index = 0;
  return (isLast = false) => {
    if (index >= columnClasses.length) {
      console.warn('wrong dimensions specified for row (too many columns)'); // eslint-disable-line no-console
      return null;
    }

    if (isLast && index !== columnClasses.length - 1) {
      console.warn('wrong dimensions specified for row (not enough columns)'); // eslint-disable-line no-console
    }
    return columnClasses[index++];
  };
};
