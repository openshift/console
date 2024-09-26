import * as _ from 'lodash';
import { OwnerReference } from '@console/dynamic-plugin-sdk';
import { FirehoseResult } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getAPIVersion, getKind, getName, getNamespace, getUID } from '../selectors/k8sCommon';
import { asValidationObject, ValidationErrorType, ValidationObject } from '../selectors/types';

const alphanumericRegex = '[a-zA-Z0-9]';
const alphanumericRegexWithDash = '[-a-zA-Z0-9]';
const DNS1123_MAX_LENGTH = 253;
export const DASH = '-';

export const pluralize = (i: number, singular: string, plural: string = `${singular}s`) =>
  i === 1 ? singular : plural;

export type EntityMap<A> = { [propertyName: string]: A };

type KeyResolver<A> = (entity: A) => string;

export const omitEmpty = (obj, justUndefined = false) => {
  const omit = (o) => {
    if (_.isArray(o)) {
      for (let idx = o.length - 1; idx >= 0; idx--) {
        const item = o[idx];
        if (item === undefined || (!justUndefined && item === null)) {
          o.splice(idx, 1);
        } else {
          omit(item);
        }
      }
    } else if (_.isObject(o)) {
      Object.keys(o).forEach((k) => {
        const value = o[k];
        if (value === undefined || (!justUndefined && value === null)) {
          delete o[k];
        } else {
          omit(value);
        }
      });
    }
  };
  omit(obj);
};

export const ensurePath = (data: {}, path: string[] | string, value: any = {}) => {
  let currentFragment: any = data;
  if (data && path) {
    const arrPath = _.isString(path) ? path.split('.') : path;

    arrPath.forEach((pathElement, idx) => {
      const isLast = idx === arrPath.length - 1;

      const nextFragment = currentFragment[pathElement];

      if (isLast ? nextFragment != null : _.isObject(nextFragment)) {
        currentFragment = nextFragment;
      } else {
        const newFragment = isLast ? value : {};
        currentFragment[pathElement] = newFragment;
        currentFragment = newFragment;
      }
    });
  }

  return currentFragment;
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

type StringHashMap = {
  [key: string]: string;
};

const getPrefixedKey = (obj: StringHashMap, keyPrefix: string) =>
  obj ? Object.keys(obj).find((key) => key.startsWith(keyPrefix)) : null;

const getSuffixValue = (key: string) => {
  const index = key ? key.lastIndexOf('/') : -1;
  return index > 0 ? key.substring(index + 1) : null;
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

export const findKeySuffixValue = (obj: StringHashMap, keyPrefix: string) =>
  getSuffixValue(getPrefixedKey(obj, keyPrefix));

export const getSimpleName = (obj): string => obj && obj.name;

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

export const createBasicLookup = <A>(list: A[], getKey: KeyResolver<A>): EntityMap<A> => {
  return (list || []).reduce((lookup, entity) => {
    const key = getKey(entity);
    if (key) {
      lookup[key] = entity;
    }
    return lookup;
  }, {});
};

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

export const assureEndsWith = (sentence: string, appendix: string) => {
  if (!sentence || !appendix || sentence.endsWith(appendix)) {
    return sentence;
  }

  return `${sentence}${appendix}`;
};

export const parseNumber = (value, defaultValue = null) => {
  const result = Number(value);
  return Number.isNaN(result) ? defaultValue : result;
};

export const parsePercentage = (value: string, defaultValue = null) => {
  return parseNumber(value?.replace('%', ''), defaultValue);
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
