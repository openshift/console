import { Model } from '@patternfly/react-topology/dist/esm/types';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { addToTopologyDataModel } from '@console/topology/src/data-transforms/transform-utils';
import { OdcNodeModel, TopologyDataResources } from '@console/topology/src/topology-types';
import { CAMEL_SOURCE_INTEGRATION, EVENT_SOURCE_KAFKA_KIND } from '../const';
import {
  getDynamicEventSourcesModelRefs,
  getDynamicChannelModelRefs,
} from '../utils/fetch-dynamic-eventsources-utils';
import {
  getKnativeServingConfigurations,
  getKnativeServingDomainMapping,
  getKnativeServingRevisions,
  getKnativeServingRoutes,
  getKnativeServingServices,
} from '../utils/get-knative-resources';
import {
  getRevisionsData,
  transformKnNodeData,
  getKnativeDynamicResources,
  getKameletSinkAndSourceBindings,
} from './knative-topology-utils';
import { KnativeUtil, NodeType } from './topology-types';

const addKnativeTopologyData = (
  graphModel: Model,
  knativeResources: K8sResourceKind[],
  type: string,
  resources: TopologyDataResources,
  utils?: KnativeUtil[],
) => {
  if (!knativeResources?.length) {
    return;
  }

  const knativeResourceDataModel = transformKnNodeData(knativeResources, type, resources, utils);

  addToTopologyDataModel(knativeResourceDataModel, graphModel);
};

const getKnativeTopologyDataUtils = () => [
  getKnativeServingRevisions,
  getKnativeServingConfigurations,
  getKnativeServingRoutes,
  getKnativeServingServices,
  getKnativeServingDomainMapping,
];

export const getKafkaSinkKnativeTopologyData = (
  namespace: string,
  resources: TopologyDataResources,
): Promise<Model> => {
  const knativeTopologyGraphModel: Model = { nodes: [], edges: [] };
  const kafkaSinks = resources?.kafkasinks?.data ?? [];
  const addTopologyData = (KnResources: K8sResourceKind[], type?: string) => {
    addKnativeTopologyData(
      knativeTopologyGraphModel,
      KnResources,
      type,
      resources,
      getKnativeTopologyDataUtils(),
    );
  };
  addTopologyData(kafkaSinks, NodeType.KafkaSink);
  return Promise.resolve(knativeTopologyGraphModel);
};

export const getKnativeServingTopologyDataModel = (
  namespace: string,
  resources: TopologyDataResources,
): Promise<Model> => {
  const knativeServingTopologyGraphModel: Model = { nodes: [], edges: [] };
  const knSvcResources: K8sResourceKind[] = resources?.ksservices?.data ?? [];
  const knRevResources: K8sResourceKind[] = resources?.revisions?.data ?? [];
  const { camelSinkKameletBindings } = getKameletSinkAndSourceBindings(resources);
  const addTopologyData = (KnResources: K8sResourceKind[], type?: string) => {
    addKnativeTopologyData(
      knativeServingTopologyGraphModel,
      KnResources,
      type,
      resources,
      getKnativeTopologyDataUtils(),
    );
  };

  addTopologyData(knSvcResources, NodeType.KnService);

  const revisionData = getRevisionsData(knRevResources, resources, getKnativeTopologyDataUtils());

  knativeServingTopologyGraphModel.nodes.forEach((n) => {
    if (n.type === NodeType.KnService) {
      n.data.groupResources =
        n.children?.map((id) => knativeServingTopologyGraphModel.nodes.find((c) => id === c.id)) ??
        [];
    }
    if (n.type === NodeType.Revision) {
      n.data = revisionData[n.id];
    }
  });
  // filter out knative services/revision that belong to a integration type created by kamelet sinks
  const knativeGraphNodes = knativeServingTopologyGraphModel.nodes.filter((n: OdcNodeModel) => {
    if (n.type === NodeType.KnService) {
      if (
        camelSinkKameletBindings.findIndex((binding) =>
          n.resource.metadata?.labels?.[CAMEL_SOURCE_INTEGRATION]?.startsWith(
            binding.metadata?.name,
          ),
        ) > -1
      ) {
        return false;
      }
      return true;
    }
    if (n.type === NodeType.Revision) {
      if (
        camelSinkKameletBindings.findIndex((binding) =>
          n.resource.metadata?.labels?.[CAMEL_SOURCE_INTEGRATION]?.startsWith(
            binding.metadata?.name,
          ),
        ) > -1
      ) {
        return false;
      }
      return true;
    }
    return true;
  });

  knativeServingTopologyGraphModel.nodes = knativeGraphNodes;

  return Promise.resolve(knativeServingTopologyGraphModel);
};

export const getKnativeEventingTopologyDataModel = (
  namespace: string,
  resources: TopologyDataResources,
): Promise<Model> => {
  const eventSourceProps = getDynamicEventSourcesModelRefs();
  const channelResourceProps = getDynamicChannelModelRefs();
  const knativeEventingTopologyGraphModel: Model = { nodes: [], edges: [] };
  const allKnEventSources: K8sResourceKind[] = getKnativeDynamicResources(
    resources,
    eventSourceProps,
  );
  const knEventSourcesKafka: K8sResourceKind[] = allKnEventSources.filter(
    (knEventSource) => knEventSource.kind === EVENT_SOURCE_KAFKA_KIND,
  );
  const knEventSources: K8sResourceKind[] = allKnEventSources.filter(
    (knEventSource) => knEventSource.kind !== EVENT_SOURCE_KAFKA_KIND,
  );
  const knChannelResources: K8sResourceKind[] = getKnativeDynamicResources(
    resources,
    channelResourceProps,
  );
  const knBrokerResources: K8sResourceKind[] = resources?.brokers?.data ?? [];
  const addTopologyData = (KnResources: K8sResourceKind[], type?: string) => {
    addKnativeTopologyData(
      knativeEventingTopologyGraphModel,
      KnResources,
      type,
      resources,
      getKnativeTopologyDataUtils(),
    );
  };

  addTopologyData(knEventSources, NodeType.EventSource);
  addTopologyData(knEventSourcesKafka, NodeType.EventSourceKafka);
  addTopologyData(knChannelResources, NodeType.PubSub);
  addTopologyData(knBrokerResources, NodeType.PubSub);
  return Promise.resolve(knativeEventingTopologyGraphModel);
};

export const getKnativeKameletsTopologyDataModel = (
  namespace: string,
  resources: TopologyDataResources,
): Promise<Model> => {
  const knativeKameletsTopologyGraphModel: Model = { nodes: [], edges: [] };
  const { camelSinkKameletBindings, camelSourceKameletBindings } = getKameletSinkAndSourceBindings(
    resources,
  );
  const addTopologyData = (KnResources: K8sResourceKind[], type?: string) => {
    addKnativeTopologyData(knativeKameletsTopologyGraphModel, KnResources, type, resources);
  };

  addTopologyData(camelSourceKameletBindings, NodeType.EventSource);
  addTopologyData(camelSinkKameletBindings, NodeType.EventSink);

  return Promise.resolve(knativeKameletsTopologyGraphModel);
};
