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
  };
  status?: {
    url?: string;
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
  Active = 'Active',
  ContainerHealthy = 'ContainerHealthy',
  ResourcesAvailable = 'ResourcesAvailable',
}

export type Traffic = {
  revisionName: string;
  percent: number;
};
