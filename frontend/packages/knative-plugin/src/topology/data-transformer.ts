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
  getKnativeEventSources,
  getKnativeChannelResources,
} from './knative-topology-utils';
import {
  getKnativeServingConfigurations,
  getKnativeServingRevisions,
  getKnativeServingRoutes,
  getKnativeServingServices,
} from '../utils/get-knative-resources';

/**
 * Filter out deployments not created via revisions/eventsources
 */
// export const filterNonKnativeDeployments = (
//   resources: DeploymentKind[],
//   eventSources?: K8sResourceKind[],
// ): DeploymentKind[] => {
//   const KNATIVE_CONFIGURATION = 'serving.knative.dev/configuration';
//   const isEventSourceKind = (uid: string): boolean =>
//     uid && !!eventSources?.find((eventSource) => eventSource.metadata?.uid === uid);
//   return _.filter(resources, (d) => {
//     return (
//       !_.get(d, ['metadata', 'labels', KNATIVE_CONFIGURATION], false) &&
//       !isEventSourceKind(d.metadata?.ownerReferences?.[0].uid)
//     );
//   });
// };

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
  const knativeTopologyGraphModel: Model = { nodes: [], edges: [] };
  const knSvcResources: K8sResourceKind[] = resources?.ksservices?.data ?? [];
  const knEventSources: K8sResourceKind[] = getKnativeEventSources(resources);
  const knRevResources: K8sResourceKind[] = resources?.revisions?.data ?? [];
  const knChannelResources: K8sResourceKind[] = getKnativeChannelResources(resources);

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
  addKnativeTopologyData(
    knativeTopologyGraphModel,
    knChannelResources,
    NodeType.PubSub,
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
