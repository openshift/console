import { TFunction } from 'i18next';
import { JSONSchema6 } from 'json-schema';
import * as _ from 'lodash';
import { toPath } from 'lodash';
import { adjectives, animals, uniqueNamesGenerator } from 'unique-names-generator';
import { FirehoseResult } from '@console/internal/components/utils';
import { NamespaceModel, ProjectModel } from '@console/internal/models';
import {
  K8sKind,
  K8sResourceKind,
  MatchExpression,
  OwnerReference,
  TemplateKind,
} from '@console/internal/module/k8s';
import { TEMPLATE_BASE_IMAGE_NAME_PARAMETER, VM_TEMPLATE_NAME_PARAMETER } from '../constants';
import {
  getAPIVersion,
  getKind,
  getName,
  getNamespace,
  getParameterValue,
  getUID,
} from '../selectors';
import { ValidationObject, asValidationObject, ValidationErrorType } from '../selectors/types';
// eslint-disable-next-line import/order
import { getTemplateName } from '../selectors/vm-template/basic';

export type EntityMap<A> = { [propertyName: string]: A };
export type K8sEntityMap<A extends K8sResourceKind> = EntityMap<A>;

type KeyResolver<A> = (entity: A) => string;

const alphanumericRegex = '[a-zA-Z0-9]';
const alphanumericRegexWithDash = '[-a-zA-Z0-9]';
const DNS1123_MAX_LENGTH = 253;
export const DASH = '-';

export const pluralize = (i: number, singular: string, plural: string = `${singular}s`) =>
  i === 1 ? singular : plural;

export const getBasicID = <A extends K8sResourceKind = K8sResourceKind>(entity: A) =>
  `${getNamespace(entity)}-${getName(entity)}`;

export const prefixedID = (idPrefix: string, id: string) =>
  idPrefix && id ? `${idPrefix}-${id}` : null;

export const joinIDs = (...ids: string[]) => ids.join('-');

export const getRandomChars = (len = 6): string => {
  return Math.random()
    .toString(36)
    .replace(/[^a-z0-9]+/g, '')
    .substr(1, len);
};

export const generateDataVolumeName = (vmName: string, volumeName: string): string =>
  joinIDs(vmName, volumeName, getRandomChars(5));

export const resolveDataVolumeName = ({
  diskName,
  vmLikeEntityName,
  isTemplate,
}: {
  diskName: string;
  vmLikeEntityName: string;
  isTemplate: boolean;
}) => {
  return isTemplate
    ? joinIDs(VM_TEMPLATE_NAME_PARAMETER, diskName)
    : generateDataVolumeName(vmLikeEntityName, diskName);
};

export const isLoaded = (result: FirehoseResult<K8sResourceKind | K8sResourceKind[]>) =>
  result && result.loaded;

export const getLoadedData = <T extends K8sResourceKind | K8sResourceKind[] = K8sResourceKind[]>(
  result: FirehoseResult<T>,
  defaultValue = null,
): T => (result && result.loaded && !result.loadError ? result.data : defaultValue);

export const getModelString = (model: K8sKind | any, isList: boolean) =>
  pluralize(isList ? 2 : 1, model && model.kind ? model.kind : model);

export const getLoadError = (
  result: FirehoseResult<K8sResourceKind | K8sResourceKind[]>,
  model: K8sKind | any,
  isList = false,
) => {
  if (!result) {
    return `No model registered for ${getModelString(model, isList)}`;
  }

  if (result && result.loadError) {
    const status = _.get(result.loadError, 'response.status');
    const message = _.get(result.loadError, 'message');

    if (status === 404) {
      return message && !message.toLowerCase().includes('not found')
        ? `Could not find ${getModelString(model, isList)}: ${message}`
        : _.capitalize(message);
    }
    if (status === 403) {
      return `Restricted Access: ${message}`;
    }

    return message;
  }

  return null;
};

export const parseNumber = (value, defaultValue = null) => {
  const result = Number(value);
  return Number.isNaN(result) ? defaultValue : result;
};

export const parsePercentage = (value: string, defaultValue = null) => {
  return parseNumber(value?.replace('%', ''), defaultValue);
};

export const buildOwnerReference = (
  owner: K8sResourceKind,
  opts: { blockOwnerDeletion?: boolean; controller?: boolean } = { blockOwnerDeletion: true },
): OwnerReference => ({
  apiVersion: getAPIVersion(owner),
  kind: getKind(owner),
  name: getName(owner),
  uid: getUID(owner),
  blockOwnerDeletion: opts && opts.blockOwnerDeletion,
  controller: opts && opts.controller,
});

export const buildOwnerReferenceForModel = (
  model: K8sKind,
  name?: string,
  uid?: string,
): OwnerReference => ({
  apiVersion: `${model.apiGroup}/${model.apiVersion}`,
  kind: getKind(model),
  name,
  uid,
});

// FIXME: Avoid this helper! The implementation is not correct. We should remove this.
// Beware: VM Wizard depends on this custom implementation - mainly the model
export const getResource = (
  model: K8sResourceKind,
  {
    name,
    namespaced = true,
    namespace,
    isList = true,
    matchLabels,
    matchExpressions,
    prop,
    fieldSelector,
    optional,
  }: {
    name?: string;
    namespace?: string;
    namespaced?: boolean;
    isList?: boolean;
    matchLabels?: { [key: string]: string };
    matchExpressions?: MatchExpression[];
    prop?: string;
    fieldSelector?: string;
    optional?: boolean;
  } = {
    namespaced: true,
    isList: true,
  },
) => {
  const m = model.kind === NamespaceModel.kind ? ProjectModel : model;
  const res: any = {
    // non-admin user cannot list namespaces (k8s wont return only namespaces available to user but 403 forbidden, ).
    // Instead we need to use ProjectModel which will return available projects (namespaces)
    //
    // FIXME: This is incorrect! `m.kind` is not unique. These model definitions should have `crd: true`, which will
    // break this utility. We should be using `referenceForModel` and `crd: true` in our model definitions!
    kind: m.kind,
    model: m,
    namespaced,
    namespace,
    isList,
    prop: prop || model.kind,
    optional,
  };

  if (name) {
    res.name = name;
  }
  if (matchLabels) {
    res.selector = { matchLabels };
  }
  if (matchExpressions) {
    res.selector = { matchExpressions };
  }
  if (fieldSelector) {
    res.fieldSelector = fieldSelector;
  }

  return res;
};

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

type DNSValidationMsgs = {
  emptyMsg: string;
  startEndAlphanumbericMsg: string;
  errorMsg: string;
  uppercaseMsg: string;
  longMsg: string;
  shortMsg: string;
};

// DNS-1123 subdomain
export const validateDNS1123SubdomainValue = (
  value: string,
  {
    emptyMsg,
    errorMsg,
    uppercaseMsg,
    startEndAlphanumbericMsg,
    shortMsg,
    longMsg,
  }: DNSValidationMsgs,
  { min, max }: { min?: number; max?: number } = {
    min: undefined,
    max: DNS1123_MAX_LENGTH,
  },
): ValidationObject => {
  const maxLength = max || DNS1123_MAX_LENGTH;

  if (!value) {
    return asValidationObject(emptyMsg, ValidationErrorType.TrivialError);
  }

  if (value.match(/^\$\{[A-Z_]+\}$/)) {
    return asValidationObject('template parameter', ValidationErrorType.Warn);
  }

  if (min && value.length < min) {
    return asValidationObject(shortMsg);
  }
  if (value.length > maxLength) {
    return asValidationObject(longMsg);
  }

  const startsWithAlphaNumeric = value.charAt(0).match(alphanumericRegex);
  const endsWithAlphaNumeric = value.charAt(value.length - 1).match(alphanumericRegex);

  if (!startsWithAlphaNumeric || !endsWithAlphaNumeric) {
    return asValidationObject(startEndAlphanumbericMsg);
  }

  for (const c of value) {
    if (c.toLowerCase() !== c) {
      return asValidationObject(uppercaseMsg);
    }

    if (!c.match(alphanumericRegexWithDash)) {
      return asValidationObject(errorMsg);
    }
  }
  return null;
};

export const compareOwnerReference = (
  obj: OwnerReference,
  otherObj: OwnerReference,
  compareModelOnly?: boolean,
) => {
  if (obj === otherObj) {
    return true;
  }
  if (!obj || !otherObj) {
    return false;
  }
  const isUIDEqual = obj.uid && otherObj.uid ? compareModelOnly || obj.uid === otherObj.uid : true;
  const isNameEqual = compareModelOnly || obj.name === otherObj.name;

  return (
    obj.apiVersion === otherObj.apiVersion &&
    obj.kind === otherObj.kind &&
    isNameEqual &&
    isUIDEqual
  );
};

export const generateVMName = (template: TemplateKind): string =>
  alignWithDNS1123(
    `${getParameterValue(template, TEMPLATE_BASE_IMAGE_NAME_PARAMETER) ||
      getTemplateName(template)}-${uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: '-',
    })}`,
  );

export const getDialogUIError = (hasAllRequiredFilled, t: TFunction) =>
  hasAllRequiredFilled
    ? t('kubevirt-plugin~Please correct the invalid fields.')
    : t('kubevirt-plugin~Please fill in all required fields.');

export const getSimpleDialogUIError = (hasAllRequiredFilled, t: TFunction) =>
  hasAllRequiredFilled
    ? t('kubevirt-plugin~Some fields are not correct')
    : t('kubevirt-plugin~Required fields not completed');

export const getBooleanReadableValue = (value: boolean) => (value ? 'yes' : 'no');

export const getBooleanAsEnabledValue = (value: boolean) => (value ? 'Enabled' : 'Not Enabled');

export const getSequenceName = (name: string, usedSequenceNames?: Set<string>) => {
  if (!usedSequenceNames) {
    return `${name}-${0}`;
  }

  for (let i = 0; i < usedSequenceNames.size + 1; i++) {
    const sequenceName = `${name}-${i}`;
    if (!usedSequenceNames.has(sequenceName)) {
      return sequenceName;
    }
  }
  return null;
};

export const intervalBracket = (isInclusive: boolean, leftValue?: number, rightValue?: number) => {
  if (leftValue) {
    return isInclusive && Number.isFinite(leftValue) ? '[' : '(';
  }

  return isInclusive && Number.isFinite(rightValue) ? ']' : ')';
};

export const createUniqueNameResolver = (data: { name: string }[]) => {
  const nameCounts = (data || [])
    .filter(({ name }) => name)
    .reduce((acc, { name }) => {
      if (acc[name]) {
        acc[name].max++;
      } else {
        acc[name] = { max: 1, next: 1 };
      }
      return acc;
    }, {});

  return (name: string) => {
    if (!name) {
      return name;
    }
    if (nameCounts[name].max === 1) {
      return name;
    }
    nameCounts[name].next++;
    return `${name}-${nameCounts[name].next - 1}`;
  };
};
