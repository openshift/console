import * as _ from 'lodash';

import { k8sPatch } from './resource';
import { NodeModel } from '../../models';
import { K8sResourceKind } from './';

export const makeNodeUnschedulable = (resource: K8sResourceKind): Promise<K8sResourceKind> => {
  const op = _.has(resource, 'spec.unschedulable') ? 'replace' : 'add';
  return k8sPatch(NodeModel, resource, [{ op, path: '/spec/unschedulable', value: true }]);
};

export const makeNodeSchedulable = (resource: K8sResourceKind): Promise<K8sResourceKind> => {
  const op = _.has(resource, 'spec.unschedulable') ? 'replace' : 'add';
  return k8sPatch(NodeModel, resource, [{ op, path: '/spec/unschedulable', value: false }]);
};

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

export const nodeStatus = (node: K8sResourceKind) => isNodeReady(node) ? 'Ready' : 'Not Ready';

const NODE_ROLE_PREFIX = 'node-role.kubernetes.io/';
export const getNodeRoles = (node: K8sResourceKind): string[] => {
  const labels = _.get(node, 'metadata.labels');
  return _.reduce(labels, (acc: string[], v: string, k: string) => {
    if (k.startsWith(NODE_ROLE_PREFIX)) {
      acc.push(k.slice(NODE_ROLE_PREFIX.length));
    }
    return acc;
  }, []);
};
