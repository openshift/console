import type { K8sResourceCommon, K8sResourceCondition } from '@console/internal/module/k8s';

export interface RevisionKind extends K8sResourceCommon {
  status?: {
    conditions?: RevisionCondition[];
  };
}

export interface ServiceKind extends K8sResourceCommon {
  metadata?: {
    generation?: number;
  };
  status?: {
    url?: string;
    traffic?: Traffic[];
  };
}

export interface RouteKind extends K8sResourceCommon {
  status: {
    url: string;
    traffic: Traffic[];
  };
}

export enum ConditionTypes {
  Ready = 'Ready',
  Active = 'Active',
  ContainerHealthy = 'ContainerHealthy',
  ResourcesAvailable = 'ResourcesAvailable',
}

interface RevisionCondition extends K8sResourceCondition {
  type: keyof typeof ConditionTypes;
}

export interface Traffic {
  revisionName: string;
  percent: number;
  latestRevision?: boolean;
  tag?: string;
  url?: string;
}

export interface RoutesOverviewListItem {
  uid: string;
  url: string;
  percent: string;
  name: string;
  namespace: string;
}

export interface EventSourceKind extends K8sResourceCommon {
  status?: {
    conditions?: EventSourceCondition[];
  };
}

export enum EventSourceConditionTypes {
  Ready = 'Ready',
}

interface EventSourceCondition extends K8sResourceCondition {
  type: keyof typeof EventSourceConditionTypes;
}

interface SinkRef {
  apiVersion?: string;
  kind?: string;
  name?: string;
}

interface Sink {
  uri?: string;
  ref?: SinkRef;
}

export interface PingSourceKind extends EventSourceKind {
  spec: {
    data?: string;
    schedule?: string;
    sink?: Sink;
    deadLetterSink?: Sink;
    timeZone?: string;
  };
}

export interface ApiServerSourceKind extends EventSourceKind {
  spec: {
    mode: string;
    serviceAccountName?: string;
    resources?: {
      apiVersion?: string;
      kind?: string;
      namespace?: string;
    }[];
    sink?: Sink;
    deadLetterSink?: Sink;
  };
}

export interface ContainerSourceKind extends EventSourceKind {
  spec: {
    template: {
      metadata?: object;
      spec: {
        containers: {
          image?: string;
          name?: string;
          args?: string[];
          env?: { name?: string; value?: string; valueFrom?: object }[];
        }[];
        imagePullSecrets?: { name?: string }[];
      };
    };
    sink?: Sink;
  };
}

interface KafkaSourceNetSecret {
  enable?: boolean;
  user?: {
    secretKeyRef?: {
      name?: string;
      key?: string;
    };
  };
  password?: {
    secretKeyRef?: {
      name?: string;
      key?: string;
    };
  };
}

interface KafkaSourceNetTls {
  enable?: boolean;
  caCert?: {
    secretKeyRef?: {
      name?: string;
      key?: string;
    };
  };
  cert?: {
    secretKeyRef?: {
      name?: string;
      key?: string;
    };
  };
  key?: {
    secretKeyRef?: {
      name?: string;
      key?: string;
    };
  };
}

export interface KafkaSourceKind extends EventSourceKind {
  spec: {
    bootstrapServers?: string[];
    topics?: string[];
    consumerGroup?: string;
    net?: {
      sasl?: KafkaSourceNetSecret;
      tls?: KafkaSourceNetTls;
    };
    sink?: Sink;
  };
}

export type AnySourceKind =
  PingSourceKind | ApiServerSourceKind | ContainerSourceKind | KafkaSourceKind;

export interface KameletBindingKind extends EventSourceKind {
  spec: {
    source?: {
      ref?: SinkRef;
      properties?: {
        [key: string]: any;
      };
    };
    sink?: {
      ref?: SinkRef;
      properties?: {
        [key: string]: any;
      };
    };
  };
}

export interface EventSubscriptionKind extends K8sResourceCommon {
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
}

export interface EventChannelKind extends K8sResourceCommon {
  metadata?: {
    generation?: number;
  };
  status: {
    address: {
      url: string;
    };
  };
}

export enum ChannelConditionTypes {
  Ready = 'Ready',
}

export interface EventBrokerKind extends K8sResourceCommon {
  metadata?: {
    generation?: number;
  };
  status: {
    address: {
      url: string;
    };
  };
}

export enum TriggerConditionTypes {
  Ready = 'Ready',
}

interface TriggerCondition extends K8sResourceCondition {
  type: keyof typeof TriggerConditionTypes;
}

export enum BrokerConditionTypes {
  Ready = 'Ready',
}

export enum SubscriptionConditionTypes {
  Ready = 'Ready',
}

export interface EventTriggerKind extends K8sResourceCommon {
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
}

export interface DomainMappingResponse {
  action: string;
  resource: K8sResourceCommon;
}

export enum DomainMappingResponseAction {
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
}

export enum ServerlessBuildStrategyType {
  ServerlessFunction = 'ServerlessFunction',
}

export enum ServiceTypeValue {
  Function = 'Function',
  Service = 'Service',
}
