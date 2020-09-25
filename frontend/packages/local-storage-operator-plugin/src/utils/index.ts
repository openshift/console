import * as _ from 'lodash';
import { NodeKind, MatchExpression } from '@console/internal/module/k8s';
import { NodeAffinityTerm, HostNamesMap } from '../components/auto-detect-volume/types';
import { getName } from '@console/shared';

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

export const createMapForHostNames = (nodes: NodeKind[]) => {
  return nodes.reduce((acc, node) => {
    acc[getName(node)] = node.metadata.labels?.['kubernetes.io/hostname'] ?? '';
    return acc;
  }, {});
};

export const getHostNames = (nodes: string[], hostNamesMap: HostNamesMap) => {
  return nodes.reduce((acc, node) => {
    return [...acc, hostNamesMap[node]];
  }, []);
};
