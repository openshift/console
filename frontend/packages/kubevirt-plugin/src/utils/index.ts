import * as _ from 'lodash';
import { FirehoseResult } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind, OwnerReference } from '@console/internal/module/k8s';
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
