import { K8sResourceKind, K8sResourceCondition } from '@console/internal/module/k8s';

export type ConfigurationKind = K8sResourceKind;

export type RevisionKind = {
  status?: {
    conditions?: RevisionCondition[];
  };
} & K8sResourceKind;

export type ServiceKind = K8sResourceKind & {
  metadata?: {
    generation?: number;
  };
  status?: {
    url?: string;
    traffic?: Traffic[];
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

export type RevisionCondition = {
  type: keyof typeof ConditionTypes;
} & K8sResourceCondition;

export type Traffic = {
  revisionName: string;
  percent: number;
  latestRevision?: boolean;
  tag?: string;
  url?: string;
};

export type RoutesOverviewListItem = {
  uid: string;
  url: string;
  percent: string;
  name: string;
  namespace: string;
};

export type EventSubscriptionKind = {
  metadata?: {
    generation?: number;
  };
  status: {
    physicalSubscription: {
      subscriberURI: string;
    };
  };
} & K8sResourceKind;

export type EventChannelKind = {
  metadata?: {
    generation?: number;
  };
  status: {
    address: {
      url: string;
    };
  };
} & K8sResourceKind;

export type EventBrokerKind = {
  metadata?: {
    generation?: number;
  };
  status: {
    address: {
      url: string;
    };
  };
} & K8sResourceKind;

export type EventTriggerKind = {
  metadata?: {
    generation?: number;
  };
  spec: {
    broker: string;
    filter: {
      attributes?: {
        [key: string]: string;
      };
    };
    subscriber: {
      ref: {
        apiVersion: string;
        kind: string;
        name: string;
      };
    };
  };
} & K8sResourceKind;
