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

export type EventSourceKind = {
  status: {
    conditions: EventSourceCondition[];
  };
} & K8sResourceKind;

export enum EventSourceConditionTypes {
  Ready = 'Ready',
  Deployed = 'Deployed',
  SinkProvided = 'SinkProvided',
  ValidSchedule = 'ValidSchedule',
}

export type EventSourceCondition = {
  type: keyof typeof EventSourceConditionTypes;
} & K8sResourceCondition;

export type EventSubscriptionKind = {
  metadata?: {
    generation?: number;
  };
  spec: {
    channel: {
      apiVersion: string;
      kind: string;
      name: string;
    };
    subscriber: {
      ref?: {
        apiVersion: string;
        kind: string;
        name: string;
      };
    };
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

export enum ChannelConditionTypes {
  Ready = 'Ready',
}

export type ChannelCondition = {
  type: keyof typeof ChannelConditionTypes;
} & K8sResourceCondition;

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

export enum TriggerConditionTypes {
  Ready = 'Ready',
  BrokerReady = 'BrokerReady',
  DependencyReady = 'DependencyReady',
  SubscriptionReady = 'SubscriptionReady',
  SubscriberResolved = 'SubscriberResolved',
}

export type TriggerCondition = {
  type: keyof typeof TriggerConditionTypes;
} & K8sResourceCondition;

export enum BrokerConditionTypes {
  Ready = 'Ready',
  Addressable = 'Addressable',
  FilterReady = 'FilterReady',
  IngressReady = 'IngressReady',
  TriggerChannelReady = 'TriggerChannelReady',
}

export type BrokerCondition = {
  type: keyof typeof BrokerConditionTypes;
} & K8sResourceCondition;

export enum SubscriptionConditionTypes {
  Ready = 'Ready',
  ChannelReady = 'ChannelReady',
  AddedToChannel = 'AddedToChannel',
  ReferencesResolved = 'ReferencesResolved',
}

export type SubscriptionCondition = {
  type: keyof typeof SubscriptionConditionTypes;
} & K8sResourceCondition;

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
  status?: {
    conditions?: TriggerCondition[];
  };
} & K8sResourceKind;

export type DomainMappingResponse = {
  action: string;
  resource: K8sResourceKind;
};

export enum DomainMappingResponseAction {
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
}
