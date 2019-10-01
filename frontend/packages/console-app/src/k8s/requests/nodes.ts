import * as _ from 'lodash';
import { NodeModel } from '@console/internal/models';
import { k8sPatch, K8sResourceKind } from '@console/internal/module/k8s';

export const makeNodeUnschedulable = (resource: K8sResourceKind): Promise<K8sResourceKind> => {
  const op = _.has(resource, 'spec.unschedulable') ? 'replace' : 'add';
  return k8sPatch(NodeModel, resource, [{ op, path: '/spec/unschedulable', value: true }]);
};

export const makeNodeSchedulable = (resource: K8sResourceKind): Promise<K8sResourceKind> => {
  const op = _.has(resource, 'spec.unschedulable') ? 'replace' : 'add';
  return k8sPatch(NodeModel, resource, [{ op, path: '/spec/unschedulable', value: false }]);
};
