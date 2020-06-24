import { K8sResourceKind } from '@console/internal/module/k8s';
import { Model } from '@console/topology';
import {
  TopologyDataResources,
  addToTopologyDataModel,
} from '@console/dev-console/src/components/topology';
import { getDynamicEventSourcesModelRefs } from '../utils/fetch-dynamic-eventsources-utils';
import {
  getRevisionsData,
  KnativeUtil,
  NodeType,
  transformKnNodeData,
} from './knative-topology-utils';
import {
  getKnativeServingConfigurations,
  getKnativeServingRevisions,
  getKnativeServingRoutes,
  getKnativeServingServices,
} from '../utils/get-knative-resources';

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

const getKnativeEventSources = (resources: TopologyDataResources): K8sResourceKind[] => {
  const evenSourceProps = getDynamicEventSourcesModelRefs();
  return evenSourceProps.reduce((acc, currProp) => {
    const currPropResource = resources[currProp]?.data ?? [];
    return [...acc, ...currPropResource];
  }, []);
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
  const knativeTopologyGraphModel: Model = { nodes: [], edges: [] };
  const knSvcResources: K8sResourceKind[] = resources?.ksservices?.data ?? [];
  const knEventSources: K8sResourceKind[] = getKnativeEventSources(resources);
  const knRevResources: K8sResourceKind[] = resources?.revisions?.data ?? [];

  addKnativeTopologyData(
    knativeTopologyGraphModel,
    knSvcResources,
    NodeType.KnService,
    resources,
    utils,
  );
  addKnativeTopologyData(
    knativeTopologyGraphModel,
    knEventSources,
    NodeType.EventSource,
    resources,
    utils,
  );
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
