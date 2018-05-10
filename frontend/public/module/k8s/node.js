import * as _ from 'lodash-es';

import { k8sPatch } from './resource';
import { NodeModel } from '../../models';

export const makeNodeUnschedulable = resource => {
  const op = _.has(resource, 'spec.unschedulable') ? 'replace' : 'add';
  return k8sPatch(NodeModel, resource, [{ op, path: '/spec/unschedulable', value: true }]);
};

export const makeNodeSchedulable = resource => {
  const op = _.has(resource, 'spec.unschedulable') ? 'replace' : 'add';
  return k8sPatch(NodeModel, resource, [{ op, path: '/spec/unschedulable', value: false }]);
};

export const isNodeReady = (node) => {
  if (!node || !node.status || !node.status.conditions || !node.status.conditions.length) {
    return false;
  }

  const readyState = _.find(node.status.conditions, { type: 'Ready' });
  if (!readyState) {
    return false;
  }

  return readyState.status === 'True';
};
