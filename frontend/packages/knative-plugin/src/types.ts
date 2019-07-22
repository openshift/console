import { K8sResourceKind, K8sResourceCondition } from '@console/internal/module/k8s';

export type ConfigurationKind = K8sResourceKind;

export type RevisionKind = {
  status: {
    conditions: K8sResourceCondition<ConditionTypes>[];
  };
} & K8sResourceKind;

export type ServiceKind = K8sResourceKind & {
  metadata?: {
    generation?: number;
    domain?: string;
  };
};

export type RouteKind = {
  status: {
    url: string;
    traffic: Traffic[];
  };
} & K8sResourceKind;

export enum ConditionTypes {
  Ready = 'Ready',
}

export type Traffic = {
  revisionName: string;
  percent: number;
};
