import * as _ from 'lodash';
import { NodeKind, MatchExpression } from '@console/internal/module/k8s';
import { NodeAffinityTerm } from '../components/auto-detect-volume/types';

export const hasTaints = (node: NodeKind): boolean => {
  return !_.isEmpty(node.spec?.taints);
};

export const getNodes = (
  showNodes: boolean,
  allNodes: string[],
  selectedNodes: string[],
): string[] => (showNodes ? selectedNodes : allNodes);

export const getLabelIndex = (
  nodeSelector: NodeAffinityTerm[],
  label: string,
  operator: string,
) => {
  let [selectorIndex, expIndex] = [-1, -1];

  _.forEach(nodeSelector, (selector, index) => {
    expIndex = _.findIndex(
      selector?.matchExpressions,
      (exp: MatchExpression) => exp.key === label && exp.operator === operator,
    );
    if (expIndex !== -1) {
      selectorIndex = index;
      return false;
    }
    return true;
  });

  return [selectorIndex, expIndex];
};
