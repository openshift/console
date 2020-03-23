import * as _ from 'lodash';
import { FirehoseResult } from '@console/internal/components/utils';
import {
  K8sKind,
  K8sResourceKind,
  OwnerReference,
  MatchExpression,
} from '@console/internal/module/k8s';
import { NamespaceModel, ProjectModel } from '@console/internal/models';
import {
  getName,
  getNamespace,
  getAPIVersion,
  getKind,
  getUID,
} from '@console/shared/src/selectors';
import { VM_TEMPLATE_NAME_PARAMETER } from '../constants/vm-templates';
import { pluralize } from './strings';

export const getBasicID = <A extends K8sResourceKind = K8sResourceKind>(entity: A) =>
  `${getNamespace(entity)}-${getName(entity)}`;

export const prefixedID = (idPrefix: string, id: string) =>
  idPrefix && id ? `${idPrefix}-${id}` : null;

export const joinIDs = (...ids: string[]) => ids.join('-');

export const isLoaded = (result: FirehoseResult<K8sResourceKind | K8sResourceKind[]>) =>
  result && result.loaded;

export const getLoadedData = (
  result: FirehoseResult<K8sResourceKind | K8sResourceKind[]>,
  defaultValue = null,
) => (result && result.loaded && !result.loadError ? result.data : defaultValue);

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

export const insertName = (value: string, name) => {
  if (value.indexOf(VM_TEMPLATE_NAME_PARAMETER) > -1) {
    return value.replace(VM_TEMPLATE_NAME_PARAMETER, name);
  }
  return joinIDs(name, value);
};

export const parseNumber = (value, defaultValue = null) => {
  const result = Number(value);
  return Number.isNaN(result) ? defaultValue : result;
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
    isImmutable?: boolean;
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
