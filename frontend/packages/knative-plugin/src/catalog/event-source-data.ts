import { TFunction } from 'i18next';
import {
  EventSourceApiServerModel,
  EventSourceContainerModel,
  EventSourceKafkaModel,
  EventSourcePingModel,
  EventSourceSinkBindingModel,
  EventSourceCephModel,
} from '../models';

export const getEventSourceCatalogProviderData = (
  ref: string,
  t: TFunction,
): { description?: string; provider?: string } =>
  ({
    [EventSourceApiServerModel.kind]: {
      description: t(
        'knative-plugin~This object can be used to connect an event sink, such as a Service, Channel, or Broker to the Kubernetes API server. ApiServerSource watches for Kubernetes events and forwards them to the sink.',
      ),
      provider: 'Red Hat',
    },
    [EventSourceContainerModel.kind]: {
      description: t(
        'knative-plugin~Starts a user-provided Container which will generate events and send messages to a sink URI. The sink URI is injected into the Container as an environment variable. A ContainerSource is an easy way to implement your own event sources in Knative.',
      ),
      provider: 'Red Hat',
    },
    [EventSourceKafkaModel.kind]: {
      description: t(
        'knative-plugin~A distributed messaging system consisting of servers and clients that communicate via a high-performance TCP network protocol. This source will send Apache Kafka messages from monitored Apache Kafka topics to a configured sink, packaged as CloudEvents.',
      ),
      provider: 'Red Hat',
    },
    [EventSourcePingModel.kind]: {
      description: t(
        'knative-plugin~Used to periodically send ping events with a constant payload to a sink. A PingSource is a timer that emits CloudEvents at a fixed schedule that is configured as a crontab expression.',
      ),
      provider: 'Red Hat',
    },
    [EventSourceSinkBindingModel.kind]: {
      description: t(
        'knative-plugin~Used to connect OpenShift managed applications like Deployments, StatefulSets, or Jobs to an event sink, for example, a Knative Service, Channel, or Broker. SinkBinding is similar to a ContainerSource but works on existing OpenShift Application resources, whereas the ContainerSource Container lifecycle is fully managed by OpenShift Serverless itself.',
      ),
      provider: 'Red Hat',
    },
    [EventSourceCephModel.kind]: {
      description: t(
        'knative-plugin~Used to connect OpenShift managed applications to Ceph notifications.',
      ),
      provider: 'Red Hat',
    },
  }[ref]);
