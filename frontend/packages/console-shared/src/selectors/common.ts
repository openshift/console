import * as _ from 'lodash';

import { K8sResourceKind } from '@console/internal/module/k8s';

export const getName = <A extends K8sResourceKind = K8sResourceKind>(value: A) =>
  _.get(value, 'metadata.name') as K8sResourceKind['metadata']['name'];
export const getNamespace = <A extends K8sResourceKind = K8sResourceKind>(value: A) =>
  _.get(value, 'metadata.namespace') as K8sResourceKind['metadata']['namespace'];
export const getUID = <A extends K8sResourceKind = K8sResourceKind>(value: A) =>
  _.get(value, 'metadata.uid') as K8sResourceKind['metadata']['uid'];
export const getDeletetionTimestamp = <A extends K8sResourceKind = K8sResourceKind>(value: A) =>
  _.get(value, 'metadata.deletionTimestamp') as K8sResourceKind['metadata']['deletionTimestamp'];
