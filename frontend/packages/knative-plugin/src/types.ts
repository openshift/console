import type {
  K8sResourceCommon,
  K8sResourceCondition,
  ContainerSpec,
} from '@console/internal/module/k8s';

export type RevisionKind = {
  spec?: object;
  status?: {
    conditions?: RevisionCondition[];
    serviceName?: string;
    observedGeneration?: number;
  };
} & K8sResourceCommon;

export type ServiceKind = {
  spec?: {
    template?: {
      metadata?: {
        labels?: { [key: string]: string };
      };
      spec?: {
        containers?: ContainerSpec[];
        imagePullSecrets?: { name?: string }[];
      };
    };
  };
  status?: {
    url?: string;
    traffic?: Traffic[];
    conditions?: ServiceCondition[];
    latestCreatedRevisionName?: string;
    latestReadyRevisionName?: string;
    observedGeneration?: number;
  };
} & K8sResourceCommon;

export type RouteKind = {
  spec?: object;
  status?: {
    url?: string;
    traffic?: Traffic[];
    conditions?: RouteCondition[];
    observedGeneration?: number;
  };
} & K8sResourceCommon;

export enum ConditionTypes {
  Ready = 'Ready',
  Active = 'Active',
  ContainerHealthy = 'ContainerHealthy',
  ResourcesAvailable = 'ResourcesAvailable',
}

interface RevisionCondition extends K8sResourceCondition {}

interface ServiceCondition extends K8sResourceCondition {}

interface RouteCondition extends K8sResourceCondition {}

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

export type EventSourceKind = {
  status?: {
    conditions?: EventSourceCondition[];
    observedGeneration?: number;
  };
} & K8sResourceCommon;

export enum EventSourceConditionTypes {
  Ready = 'Ready',
}

interface EventSourceCondition extends K8sResourceCondition {}

interface SinkRef {
  apiVersion?: string;
  kind?: string;
  name?: string;
}

interface Sink {
  uri?: string;
  ref?: SinkRef;
}

export type PingSourceKind = {
  spec: {
    data?: string;
    schedule?: string;
    sink?: Sink;
    deadLetterSink?: Sink;
    timeZone?: string;
  };
} & EventSourceKind;

export type ApiServerSourceKind = {
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
} & EventSourceKind;

export type ContainerSourceKind = {
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
} & EventSourceKind;

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

export type KafkaSourceKind = {
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
} & EventSourceKind;

export type AnySourceKind =
  PingSourceKind | ApiServerSourceKind | ContainerSourceKind | KafkaSourceKind;

export type KameletBindingKind = {
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
} & EventSourceKind;

export type EventSubscriptionKind = {
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
  status?: {
    physicalSubscription?: {
      subscriberURI: string;
    };
    conditions?: SubscriptionCondition[];
    observedGeneration?: number;
  };
} & K8sResourceCommon;

export type EventChannelKind = {
  spec?: {
    subscriber?: {
      subscriberUri?: string;
      uid?: string;
    }[];
  };
  status?: {
    address?: {
      url: string;
    };
    conditions?: ChannelCondition[];
    observedGeneration?: number;
  };
} & K8sResourceCommon;

export enum ChannelConditionTypes {
  Ready = 'Ready',
}

interface ChannelCondition extends K8sResourceCondition {}

export type EventBrokerKind = {
  status?: {
    address?: {
      url: string;
    };
    conditions?: BrokerCondition[];
    observedGeneration?: number;
  };
} & K8sResourceCommon;

export enum TriggerConditionTypes {
  Ready = 'Ready',
}

interface TriggerCondition extends K8sResourceCondition {}

export enum BrokerConditionTypes {
  Ready = 'Ready',
}

interface BrokerCondition extends K8sResourceCondition {}

export enum SubscriptionConditionTypes {
  Ready = 'Ready',
}

interface SubscriptionCondition extends K8sResourceCondition {}

export type EventTriggerKind = {
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
    observedGeneration?: number;
  };
} & K8sResourceCommon;

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
