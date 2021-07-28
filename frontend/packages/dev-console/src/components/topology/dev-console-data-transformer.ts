import { Model, NodeModel } from '@patternfly/react-topology';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { OverviewItem } from '@console/shared/src';
import { NODE_WIDTH, NODE_HEIGHT, NODE_PADDING } from '@console/topology/src/const';
import { getTopologyNodeItem } from '@console/topology/src/data-transforms/transform-utils';
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

export const getTopologyBindableNode = (bindables: K8sResourceKind[]): NodeModel[] => {
  const nodes = [];
  for (const obj of bindables) {
    const data: TopologyDataObject = {
      id: obj.metadata.uid,
      name: obj.metadata.name,
      type: TYPE_BINDABLE_NODE,
      resource: obj,
      // resources is poorly named, should be overviewItem, eventually going away.
      resources: createOverviewItem(obj),
      data: {
        resource: obj,
      },
    };
    nodes.push(getTopologyNodeItem(obj, TYPE_BINDABLE_NODE, data, BINDABLE_PROPS));
  }

  return nodes;
};

export const getBindableDevConsoleTopologyDataModel = (
  namespace: string,
  resources: TopologyDataResources,
  workloads: K8sResourceKind[],
): Promise<Model> => {
  if (!resources.bindables?.data) return Promise.resolve({ nodes: [], edges: [] });
  const bindableDataModel = {
    nodes: getTopologyBindableNode(resources.bindables.data),
    edges: [],
  };

  if (bindableDataModel.nodes?.length) {
    workloads.forEach(() => {
      bindableDataModel.edges.push(...[]);
    });
  }

  return Promise.resolve(bindableDataModel);
};
