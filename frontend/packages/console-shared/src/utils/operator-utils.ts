import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager/src';
import { getOperatorBackedServiceKindMap } from './resource-utils';

export const isOperatorBackedService = (
  obj: K8sResourceKind,
  installedOperators: ClusterServiceVersionKind[],
): boolean => {
  const kind = _.get(obj, 'metadata.ownerReferences[0].kind', null);
  const ownerUid = _.get(obj, 'metadata.ownerReferences[0].uid');
  const operatorBackedServiceKindMap = getOperatorBackedServiceKindMap(installedOperators);
  const operatorResource: K8sResourceKind = _.find(installedOperators, {
    metadata: { uid: ownerUid },
  }) as K8sResourceKind;
  return !!(
    kind &&
    operatorBackedServiceKindMap &&
    (!_.isEmpty(operatorResource) || kind in operatorBackedServiceKindMap)
  );
};
