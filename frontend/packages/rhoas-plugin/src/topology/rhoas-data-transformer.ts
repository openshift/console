import { Model } from '@patternfly/react-topology';
import {
  getBindableServiceBindingEdges,
  getTopologyBindableNode,
} from '@console/dev-console/src/components/topology/dev-console-data-transformer';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { TopologyDataResources } from '@console/topology/src/topology-types';
import { TYPE_MANAGED_KAFKA_CONNECTION } from './components/const';

const getRhoasTopologyDataModel = (
  namespace: string,
  resources: TopologyDataResources,
  workloads: K8sResourceKind[],
): Promise<Model> => {
  const serviceBindingRequests = resources?.serviceBindingRequests?.data;
  const rhoasDataModel: Model = {
    nodes: getTopologyBindableNode(
      resources.kafkaConnections.data,
      TYPE_MANAGED_KAFKA_CONNECTION,
      resources,
    ),
    edges: [],
  };
  if (rhoasDataModel.nodes?.length) {
    workloads.forEach((dc) => {
      rhoasDataModel.edges.push(
        ...getBindableServiceBindingEdges(dc, rhoasDataModel.nodes, serviceBindingRequests),
      );
    });
  }
  return Promise.resolve(rhoasDataModel);
};

export default getRhoasTopologyDataModel;
