import * as _ from 'lodash';
import { NodeKind } from '@console/internal/module/k8s';

const NODE_ROLE_PREFIX = 'node-role.kubernetes.io/';

export const getNodeRoles = (node: NodeKind): string[] => {
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

type NodeMachineAndNamespace = {
  name: string;
  namespace: string;
};
export const getNodeMachineNameAndNamespace = (node: NodeKind): NodeMachineAndNamespace => {
  const machine = _.get(node, 'metadata.annotations["machine.openshift.io/machine"]', '/');
  const [namespace, name] = machine.split('/');
  return { namespace, name };
};

export const isNodeUnschedulable = (node: NodeKind): boolean =>
  _.get(node, 'spec.unschedulable', false);

type NodeCondition = {
  lastHeartbeatTime: string;
  lastTransitionTime: string;
  message: string;
  reason: string;
  status: string;
  type: string;
};

export const isNodeReady = (node: NodeKind): boolean => {
  const conditions = _.get(node, 'status.conditions', []);
  const readyState = _.find(conditions, { type: 'Ready' }) as NodeCondition;

  return readyState && readyState.status === 'True';
};
