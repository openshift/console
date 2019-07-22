import { FirehoseResult } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';

export const getBasicID = <A extends K8sResourceKind = K8sResourceKind>(entity: A): string =>
  `${getNamespace(entity)}-${getName(entity)}`;

export const prefixedID = (idPrefix: string, id: string): string =>
  idPrefix && id ? `${idPrefix}-${id}` : null;

export const getLoadedData = (
  result: FirehoseResult<K8sResourceKind | K8sResourceKind[]>,
  defaultValue = null,
) => (result && result.loaded ? result.data : defaultValue);
