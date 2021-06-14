import { Model } from '@patternfly/react-topology';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { addToTopologyDataModel } from '@console/topology/src/data-transforms/transform-utils';
import { TopologyDataResources } from '@console/topology/src/topology-types';
import { EventSourceKafkaModel } from '../models';
import {
  getDynamicEventSourcesModelRefs,
  getDynamicChannelModelRefs,
} from '../utils/fetch-dynamic-eventsources-utils';
import {
  getKnativeServingConfigurations,
  getKnativeServingRevisions,
  getKnativeServingRoutes,
  getKnativeServingServices,
} from '../utils/get-knative-resources';
import {
  getRevisionsData,
  transformKnNodeData,
  getKnativeDynamicResources,
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
    (knEventSource) => knEventSource.kind === EventSourceKafkaModel.kind,
  );
  const knEventSources: K8sResourceKind[] = allKnEventSources.filter(
    (knEventSource) => knEventSource.kind !== EventSourceKafkaModel.kind,
  );
  const knRevResources: K8sResourceKind[] = resources?.revisions?.data ?? [];
  const knChannelResources: K8sResourceKind[] = getKnativeDynamicResources(
    resources,
    channelResourceProps,
  );
  const knBrokerResources: K8sResourceKind[] = resources?.brokers?.data ?? [];
  const camelKameletBindingResources: K8sResourceKind[] = resources?.kameletbindings?.data ?? [];
  const addTopologyData = (KnResources: K8sResourceKind[], type?: string) => {
    addKnativeTopologyData(knativeTopologyGraphModel, KnResources, type, resources, utils);
  };

  addTopologyData(knSvcResources, NodeType.KnService);
  addTopologyData(knEventSources, NodeType.EventSource);
  addTopologyData(knEventSourcesKafka, NodeType.EventSourceKafka);
  addTopologyData(knChannelResources, NodeType.PubSub);
  addTopologyData(knBrokerResources, NodeType.PubSub);
  addTopologyData(camelKameletBindingResources, NodeType.EventSource);

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

  return Promise.resolve(knativeTopologyGraphModel);
};
