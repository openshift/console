import { Model } from '@patternfly/react-topology';
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

export const getKnativeTopologyDataModel = (
  namespace: string,
  resources: TopologyDataResources,
): Promise<Model> => {
  const utils = [
    getKnativeServingRevisions,
    getKnativeServingConfigurations,
    getKnativeServingRoutes,
    getKnativeServingServices,
    getKnativeServingDomainMapping,
  ];
  const eventSourceProps = getDynamicEventSourcesModelRefs();
  const channelResourceProps = getDynamicChannelModelRefs();
  const knativeTopologyGraphModel: Model = { nodes: [], edges: [] };
  const knSvcResources: K8sResourceKind[] = resources?.ksservices?.data ?? [];
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
  const knRevResources: K8sResourceKind[] = resources?.revisions?.data ?? [];
  const knChannelResources: K8sResourceKind[] = getKnativeDynamicResources(
    resources,
    channelResourceProps,
  );
  const knBrokerResources: K8sResourceKind[] = resources?.brokers?.data ?? [];
  const { camelSinkKameletBindings, camelSourceKameletBindings } = getKameletSinkAndSourceBindings(
    resources,
  );
  const addTopologyData = (KnResources: K8sResourceKind[], type?: string) => {
    addKnativeTopologyData(knativeTopologyGraphModel, KnResources, type, resources, utils);
  };

  addTopologyData(knSvcResources, NodeType.KnService);
  addTopologyData(knEventSources, NodeType.EventSource);
  addTopologyData(knEventSourcesKafka, NodeType.EventSourceKafka);
  addTopologyData(knChannelResources, NodeType.PubSub);
  addTopologyData(knBrokerResources, NodeType.PubSub);
  addTopologyData(camelSourceKameletBindings, NodeType.EventSource);
  addTopologyData(camelSinkKameletBindings, NodeType.EventSink);

  const revisionData = getRevisionsData(knRevResources, resources, utils);

  knativeTopologyGraphModel.nodes.forEach((n) => {
    if (n.type === NodeType.KnService) {
      n.data.groupResources =
        n.children?.map((id) => knativeTopologyGraphModel.nodes.find((c) => id === c.id)) ?? [];
    }
    if (n.type === NodeType.Revision) {
      n.data = revisionData[n.id];
    }
  });
  // filter out knative services/revision that belong to a integration type created by kamelet sinks
  const knativeGraphNodes = knativeTopologyGraphModel.nodes.filter((n: OdcNodeModel) => {
    if (n.type === NodeType.KnService) {
      if (
        camelSinkKameletBindings.findIndex((binding) =>
          n.resource.metadata?.labels?.[CAMEL_SOURCE_INTEGRATION].startsWith(
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
          n.resource.metadata?.labels?.[CAMEL_SOURCE_INTEGRATION].startsWith(
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

  knativeTopologyGraphModel.nodes = knativeGraphNodes;

  return Promise.resolve(knativeTopologyGraphModel);
};
