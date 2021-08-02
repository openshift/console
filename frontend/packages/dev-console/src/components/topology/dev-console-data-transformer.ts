import { EdgeModel, Model, NodeModel } from '@patternfly/react-topology';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager/src/types';
import {
  getDefaultOperatorIcon,
  getImageForCSVIcon,
  getOperatorBackedServiceKindMap,
  OverviewItem,
} from '@console/shared/src';
import {
  NODE_WIDTH,
  NODE_HEIGHT,
  NODE_PADDING,
  TYPE_SERVICE_BINDING,
} from '@console/topology/src/const';
import { getTopologyNodeItem } from '@console/topology/src/data-transforms/transform-utils';
import { edgesFromServiceBinding } from '@console/topology/src/operators/operators-data-transformer';
import { TopologyDataObject, TopologyDataResources } from '@console/topology/src/topology-types';
import { TYPE_BINDABLE_NODE } from './components/const';

const BINDABLE_PROPS = {
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
  group: false,
  visible: true,
  style: {
    padding: NODE_PADDING,
  },
};

export const createOverviewItem = (obj: K8sResourceKind): OverviewItem<K8sResourceKind> => {
  return {
    isOperatorBackedService: true,
    obj,
  };
};

export const getTopologyBindableNode = (
  bindables: K8sResourceKind[],
  typeNode: string,
  resources: TopologyDataResources,
): NodeModel[] => {
  const nodes = [];
  for (const obj of bindables) {
    const resKindMap = getOperatorBackedServiceKindMap(
      resources?.clusterServiceVersions?.data as ClusterServiceVersionKind[],
    );
    const csvData = resKindMap?.[obj.kind];
    const data: TopologyDataObject = {
      id: obj.metadata.uid,
      name: obj.metadata.name,
      type: typeNode,
      resource: obj,
      // resources is poorly named, should be overviewItem, eventually going away.
      resources: createOverviewItem(obj),
      data: {
        resource: obj,
        icon: getImageForCSVIcon(csvData?.spec?.icon?.[0]) || getDefaultOperatorIcon(),
      },
    };
    nodes.push(getTopologyNodeItem(obj, typeNode, data, BINDABLE_PROPS));
  }

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

const getBindableDevConsoleTopologyDataModel = (
  namespace: string,
  resources: TopologyDataResources,
  workloads: K8sResourceKind[],
): Promise<Model> => {
  if (!resources.bindables?.data) return Promise.resolve({ nodes: [], edges: [] });
  const serviceBindingRequests = resources.serviceBindingRequests?.data;
  const bindableDataModel = {
    nodes: getTopologyBindableNode(resources.bindables.data, TYPE_BINDABLE_NODE, resources),
    edges: [],
  };

  if (bindableDataModel.nodes?.length && serviceBindingRequests?.length) {
    workloads.forEach((dc) => {
      bindableDataModel.edges.push(
        ...getBindableServiceBindingEdges(dc, bindableDataModel.nodes, serviceBindingRequests),
      );
    });
  }

  return Promise.resolve(bindableDataModel);
};

export default getBindableDevConsoleTopologyDataModel;
