import * as _ from 'lodash';
import { NodeKind, MatchExpression } from '@console/internal/module/k8s';
import { HostNamesMap } from '../components/auto-detect-volume/types';
import { getName } from '@console/shared';
import { HOSTNAME_LABEL_KEY, LABEL_OPERATOR, ZONE_LABELS } from '../constants';

export const hasNoTaints = (node: NodeKind): boolean => _.isEmpty(node.spec?.taints);

export const getZone = (node: NodeKind) =>
  node.metadata.labels?.[ZONE_LABELS[0]] || node.metadata.labels?.[ZONE_LABELS[1]];

export const getNodes = (
  showNodes: boolean,
  allNodes: string[],
  selectedNodes: string[],
): string[] => (showNodes ? selectedNodes : allNodes);

export const getNodeSelectorTermsIndices = (
  nodeSelectorTerms: { matchExpressions: MatchExpression[]; matchFields: MatchExpression[] }[] = [],
) => {
  let [selectorIndex, expIndex] = [-1, -1];

  nodeSelectorTerms.forEach((selector, index) => {
    expIndex = selector?.matchExpressions?.findIndex(
      (exp: MatchExpression) => exp.key === HOSTNAME_LABEL_KEY && exp.operator === LABEL_OPERATOR,
    );
    if (expIndex !== -1) {
      selectorIndex = index;
    }
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
