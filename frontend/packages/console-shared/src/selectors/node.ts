import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';

const NODE_ROLE_PREFIX = 'node-role.kubernetes.io/';

export const getNodeRoles = (node: K8sResourceKind): string[] => {
  const labels = _.get(node, 'metadata.labels');
  return _.reduce(
    labels,
    (acc: string[], v: string, k: string) => {
      if (k.startsWith(NODE_ROLE_PREFIX)) {
        acc.push(k.slice(NODE_ROLE_PREFIX.length));
      }
      return acc;
    },
    [],
  );
};
