import * as _ from 'lodash-es';

import { K8sResourceKind } from './';

const isNodeReady = (node: K8sResourceKind): boolean => {
  if (!node || !node.status || !node.status.conditions || !node.status.conditions.length) {
    return false;
  }

  const readyState: any = _.find(node.status.conditions, { type: 'Ready' });
  if (!readyState) {
    return false;
  }

  return readyState.status === 'True';
};

export const nodeStatus = (node: K8sResourceKind) => (isNodeReady(node) ? 'Ready' : 'Not Ready');
