import * as _ from 'lodash';
import { NodeKind } from '@console/internal/module/k8s';

export const hasTaints = (node: NodeKind): boolean => {
  return !_.isEmpty(node.spec?.taints);
};
