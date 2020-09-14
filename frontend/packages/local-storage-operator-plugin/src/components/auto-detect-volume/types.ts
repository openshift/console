import { MatchExpression } from '@console/internal/module/k8s';

export type NodeAffinityTerm = {
  matchExpressions?: MatchExpression[];
};

export type HostNamesMap = {
  [key: string]: string;
};
