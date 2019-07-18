import * as _ from 'lodash';
import { FirehoseResult } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';

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
