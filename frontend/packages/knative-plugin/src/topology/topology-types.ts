import { K8sResourceKind } from '@console/internal/module/k8s';
import { OverviewItem, PodControllerOverviewItem } from '@console/shared/src';
import { TopologyDataObject } from '@console/topology/src/topology-types';
import { KnativeItem } from '../utils/get-knative-resources';

export enum NodeType {
  EventSource = 'event-source',
  KnService = 'knative-service',
  Revision = 'knative-revision',
  PubSub = 'event-pubsub',
  SinkUri = 'sink-uri',
  EventSourceKafka = 'event-source-kafka',
  Kafka = 'knative-kafka',
}

export enum EdgeType {
  Traffic = 'revision-traffic',
  EventSource = 'event-source-link',
  EventPubSubLink = 'event-pubsub-link',
  EventSourceKafkaLink = 'event-source-kafka-link',
}

export type RevK8sResourceKind = K8sResourceKind & {
  resources?: { [key: string]: any };
};

export type Subscriber = {
  kind: string;
  name: string;
  namespace: string;
  data: {
    kind: string;
    name: string;
    namespace: string;
    filters: { key: string; value: string }[];
  }[];
};

export type PubsubNodes = {
  channels: {
    apiVersion: string;
    name: string;
    kind: string;
  }[];
  brokers: string[];
};

export type KnativeServiceOverviewItem = OverviewItem &
  KnativeItem & {
    subscribers?: Subscriber[];
    current?: PodControllerOverviewItem;
    previous?: PodControllerOverviewItem;
    isRollingOut?: boolean;
  };

export type KnativeDeploymentOverviewItem = OverviewItem & {
  associatedDeployment: K8sResourceKind;
};

export interface KnativeTopologyDataObject<O extends OverviewItem, D = {}>
  extends TopologyDataObject<D> {
  resources: O;
}

export type KnativeUtil = (dc: K8sResourceKind, props) => KnativeItem | undefined;
