import { EdgeModel, Model, NodeModel } from '@patternfly/react-topology';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import {
  getDefaultOperatorIcon,
  getImageForCSVIcon,
  getOperatorBackedServiceKindMap,
} from '@console/shared';
import {
  NODE_HEIGHT,
  NODE_PADDING,
  NODE_WIDTH,
  TYPE_SERVICE_BINDING,
} from '@console/topology/src/const';
import { getTopologyNodeItem } from '@console/topology/src/data-transforms/transform-utils';
import { edgesFromServiceBinding } from '@console/topology/src/operators/operators-data-transformer';
import { TopologyDataObject, TopologyDataResources } from '@console/topology/src/topology-types';
import { TYPE_BINDABLE_NODE } from '../const';
import { getBindableServicesList } from './fetch-bindable-services-utils';

export const isServiceBindable = (resource: K8sResourceKind) =>
  resource.metadata.labels?.['app.kubernetes.io/component'] === 'external-service';

const BINDABLE_PROPS = {
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
  group: false,
  visible: true,
  style: {
    padding: NODE_PADDING,
  },
};

const getTopologyBindableServiceNodes = (
  services: K8sResourceKind[],
  resources: TopologyDataResources,
): NodeModel[] => {
  const nodes = services.filter(isServiceBindable).map((obj) => {
    const resKindMap = getOperatorBackedServiceKindMap(
      resources?.clusterServiceVersions?.data as ClusterServiceVersionKind[],
    );
    const csvData = resKindMap?.[obj.kind];
    const data: TopologyDataObject = {
      id: obj.metadata.uid,
      name: obj.metadata.name,
      type: TYPE_BINDABLE_NODE,
      resource: obj,
      resources: { obj },
      data: {
        resource: obj,
        icon: getImageForCSVIcon(csvData?.spec?.icon?.[0]) || getDefaultOperatorIcon(),
      },
    };
    return getTopologyNodeItem(obj, TYPE_BINDABLE_NODE, data, BINDABLE_PROPS);
  });

  return nodes;
};

export const getBindableServiceBindingEdges = (
  dc: K8sResourceKind,
  rhoasNodes: NodeModel[],
  sbrs: K8sResourceKind[],
): EdgeModel[] => {
  const edges = [];
  if (!sbrs?.length || !rhoasNodes?.length) {
    return edges;
  }

  edgesFromServiceBinding(dc, sbrs).forEach((sbr) => {
    sbr.spec.services?.forEach((bss) => {
      if (bss) {
        const targetNode = rhoasNodes.find(
          (node) =>
            node.data.resource.kind === bss.kind && node.data.resource.metadata.name === bss.name,
        );
        if (targetNode) {
          const target = targetNode.data.resource.metadata.uid;
          const source = dc.metadata.uid;
          if (source && target) {
            edges.push({
              id: `${source}_${target}`,
              type: TYPE_SERVICE_BINDING,
              source,
              target,
              resource: sbr,
              data: { sbr },
            });
          }
        }
      }
    });
  });

  return edges;
};

export const getBindableServicesTopologyDataModel = async (
  _namespace: string,
  resources: TopologyDataResources,
  workloads: K8sResourceKind[],
): Promise<Model> => {
  const serviceBindingRequests = resources?.serviceBindingRequests?.data;
  const bindableResourcesList = getBindableServicesList();
  const watchedBindableResources = bindableResourcesList.map(
    ({ kind }) => resources[kind]?.data || [],
  );

  const servicesDataModel: Model = {
    edges: [],
    nodes: [],
  };
  watchedBindableResources.forEach((services) => {
    servicesDataModel.nodes.push(...getTopologyBindableServiceNodes(services, resources));
  });

  if (servicesDataModel.nodes.length && serviceBindingRequests?.length) {
    workloads.forEach((resource) =>
      servicesDataModel.edges.push(
        ...getBindableServiceBindingEdges(
          resource,
          servicesDataModel.nodes,
          serviceBindingRequests,
        ),
      ),
    );
  }

  return servicesDataModel;
};
