import { Selector } from '@console/internal/module/k8s';
import { IDEntity } from '../../../../types';

export type MatchExpression =
  | { key: string; operator: 'Exists' | 'DoesNotExist' }
  | {
      key: string;
      operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
      values: string[];
    };

export type MatchLabels = {
  [key: string]: string;
};

export type NodeAffinityTerm = {
  matchExpressions?: MatchExpression[];
  matchFields?: MatchExpression[];
};

export type RequiredNodeAffinityTerm = {
  nodeSelectorTerms: NodeAffinityTerm[];
};

export type PreferredNodeAffinityTerm = {
  preference: NodeAffinityTerm;
  weight: number;
};

export type NodeAffinity = {
  preferredDuringSchedulingIgnoredDuringExecution?: PreferredNodeAffinityTerm[];
  requiredDuringSchedulingIgnoredDuringExecution?: RequiredNodeAffinityTerm;
};

export type PodAffinityTerm = {
  labelSelector?: Selector;
  namespaces?: string[];
  topologyKey: string;
};

export type PreferredPodAffinityTerm = {
  podAffinityTerm: PodAffinityTerm;
  weight?: number;
};

export type PodAffinity = {
  preferredDuringSchedulingIgnoredDuringExecution: PreferredPodAffinityTerm[];
  requiredDuringSchedulingIgnoredDuringExecution: PodAffinityTerm[];
};

export type Affinity = {
  nodeAffinity?: NodeAffinity;
  podAffinity?: PodAffinity;
  podAntiAffinity?: PodAffinity;
};

export type AffinityLabel = IDEntity & {
  key: string;
  values: string[];
  operator: MatchExpression['operator'];
};

export type AffinityRowData = {
  id: string;
  type: 'nodeAffinity' | 'podAffinity' | 'podAntiAffinity';
  condition:
    | 'requiredDuringSchedulingIgnoredDuringExecution'
    | 'preferredDuringSchedulingIgnoredDuringExecution';
  weight?: number;
  topologyKey?: string;
  expressions?: AffinityLabel[];
  fields?: AffinityLabel[];
};
