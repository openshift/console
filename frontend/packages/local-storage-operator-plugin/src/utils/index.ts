import * as _ from 'lodash';
import { NodeKind, MatchExpression } from '@console/internal/module/k8s';
import { HOSTNAME_LABEL_KEY, LABEL_OPERATOR, ZONE_LABELS } from '../constants';

export const hasNoTaints = (node: NodeKind): boolean => _.isEmpty(node.spec?.taints);

export const getZone = (node: NodeKind) =>
  node.metadata.labels?.[ZONE_LABELS[0]] || node.metadata.labels?.[ZONE_LABELS[1]];

export const getNodeSelectorTermsIndices = (
  nodeSelectorTerms: {
    matchExpressions: MatchExpression[];
    matchFields?: MatchExpression[];
  }[] = [],
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

export const getNodesByHostNameLabel = (nodes: NodeKind[]): string[] =>
  nodes.map((node: NodeKind) => node.metadata?.labels?.['kubernetes.io/hostname']);
