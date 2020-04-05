import { MatchExpression } from '@console/internal/module/k8s';
import { IDEntity } from '../../../../types';

export type AffinityLabel = IDEntity & {
  key: string;
  values: string[];
  operator: MatchExpression['operator'];
};

export type AffinityRowData = IDEntity & {
  type: 'nodeAffinity' | 'podAffinity' | 'podAntiAffinity';
  condition:
    | 'requiredDuringSchedulingIgnoredDuringExecution'
    | 'preferredDuringSchedulingIgnoredDuringExecution';
  weight?: number;
  topologyKey?: string;
  expressions?: AffinityLabel[];
  fields?: AffinityLabel[];
};
