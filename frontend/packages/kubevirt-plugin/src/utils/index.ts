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
import {
  getAPIVersion as getOwnerReferenceAPIVersion,
  getKind as getOwnerReferenceKind,
  getName as getOwnerReferenceName,
} from '../selectors/owner-reference/selectors';
import { CPU } from '../types';

export const getBasicID = <A extends K8sResourceKind = K8sResourceKind>(entity: A) =>
  `${getNamespace(entity)}-${getName(entity)}`;

export const prefixedID = (idPrefix: string, id: string) =>
  idPrefix && id ? `${idPrefix}-${id}` : null;

export const joinIDs = (...ids: string[]) => ids.join('-');

export const getLoadedData = (
  result: FirehoseResult<K8sResourceKind | K8sResourceKind[]>,
  defaultValue = null,
) => (result && result.loaded && !result.loadError ? result.data : defaultValue);

export const getLoadError = (
  result: FirehoseResult<K8sResourceKind | K8sResourceKind[]>,
  model: K8sKind,
) => {
  if (!result) {
    return `No model registered for ${model.kind}`;
  }

  if (result && result.loadError) {
    const status = _.get(result.loadError, 'response.status');
    const message = _.get(result.loadError, 'message');

    if (status === 404) {
      return `Could not find ${model.kind}: ${message}`;
    }
    if (status === 403) {
      return `Restricted Access: ${message}`;
    }

    return message;
  }

  return null;
};

export const parseNumber = (value, defaultValue = null) =>
  _.isFinite(value) ? Number(value) : defaultValue;

export const buildOwnerReference = (
  owner: K8sResourceKind,
  blockOwnerDeletion = true,
): OwnerReference => ({
  apiVersion: getAPIVersion(owner),
  kind: getKind(owner),
  name: getName(owner),
  uid: getUID(owner),
  blockOwnerDeletion,
});

export const compareOwnerReference = (obj: OwnerReference, otherObj: OwnerReference) =>
  getOwnerReferenceAPIVersion(obj) === getOwnerReferenceAPIVersion(otherObj) &&
  getOwnerReferenceKind(obj) === getOwnerReferenceKind(otherObj) &&
  getOwnerReferenceName(obj) === getOwnerReferenceName(otherObj);

export const isCPUEqual = (a: CPU, b: CPU) =>
  a.sockets === b.sockets && a.cores === b.cores && a.threads === b.threads;

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
