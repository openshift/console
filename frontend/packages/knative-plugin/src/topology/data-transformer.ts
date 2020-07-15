import { K8sResourceKind } from '@console/internal/module/k8s';
import { Model } from '@patternfly/react-topology';
import {
  TopologyDataResources,
  addToTopologyDataModel,
} from '@console/dev-console/src/components/topology';
import {
  getRevisionsData,
  KnativeUtil,
  NodeType,
  transformKnNodeData,
  getKnativeDynamicResources,
} from './knative-topology-utils';
import {
  getKnativeServingConfigurations,
  getKnativeServingRevisions,
  getKnativeServingRoutes,
  getKnativeServingServices,
} from '../utils/get-knative-resources';
import {
  getDynamicEventSourcesModelRefs,
  getDynamicChannelModelRefs,
} from '../utils/fetch-dynamic-eventsources-utils';

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
  const knEventSources: K8sResourceKind[] = getKnativeDynamicResources(resources, eventSourceProps);
  const knRevResources: K8sResourceKind[] = resources?.revisions?.data ?? [];
  const knChannelResources: K8sResourceKind[] = getKnativeDynamicResources(
    resources,
    channelResourceProps,
  );
  const knBrokerResources: K8sResourceKind[] = resources?.brokers?.data ?? [];

  const addTopologyData = (KnResources: K8sResourceKind[], type?: string) => {
    addKnativeTopologyData(knativeTopologyGraphModel, KnResources, type, resources, utils);
  };

  addTopologyData(knSvcResources, NodeType.KnService);
  addTopologyData(knEventSources, NodeType.EventSource);
  addTopologyData(knChannelResources, NodeType.PubSub);
  addTopologyData(knBrokerResources, NodeType.PubSub);

  const revisionData = getRevisionsData(knRevResources, resources, utils);

  knativeTopologyGraphModel.nodes.forEach((n) => {
    if (n.type === NodeType.KnService) {
      n.data.groupResources =
        n.children?.map((id) => knativeTopologyGraphModel.nodes.find((c) => id === c.id)?.data) ??
        [];
    }
    if (n.type === NodeType.Revision) {
      n.data = revisionData[n.id];
    }
  });

  return Promise.resolve(knativeTopologyGraphModel);
};
