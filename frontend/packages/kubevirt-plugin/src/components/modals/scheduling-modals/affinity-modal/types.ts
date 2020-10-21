import { Selector } from '@console/internal/module/k8s';
import { IDEntity } from '../../../../types';

export enum AffinityType {
  node = 'nodeAffinity',
  pod = 'podAffinity',
  podAnti = 'podAntiAffinity',
}

export enum AffinityCondition {
  required = 'requiredDuringSchedulingIgnoredDuringExecution',
  preferred = 'preferredDuringSchedulingIgnoredDuringExecution',
}

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
  [AffinityCondition.preferred]?: PreferredNodeAffinityTerm[];
  [AffinityCondition.required]?: RequiredNodeAffinityTerm;
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
  [AffinityCondition.preferred]: PreferredPodAffinityTerm[];
  [AffinityCondition.required]: PodAffinityTerm[];
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
  type: AffinityType;
  condition: AffinityCondition;
  weight?: number;
  topologyKey?: string;
  expressions?: AffinityLabel[];
  fields?: AffinityLabel[];
};
