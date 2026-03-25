import type { Model, NodeModel } from '@patternfly/react-topology';
import { NodeShape } from '@patternfly/react-topology';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import type { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import {
  getDefaultOperatorIcon,
  getImageForCSVIcon,
  getOperatorBackedServiceKindMap,
} from '@console/shared';
import { NODE_HEIGHT, NODE_PADDING, NODE_WIDTH } from '@console/topology/src/const';
import { getTopologyNodeItem } from '@console/topology/src/data-transforms/transform-utils';
import type {
  TopologyDataObject,
  TopologyDataResources,
} from '@console/topology/src/topology-types';
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
    return getTopologyNodeItem(
      obj,
      TYPE_BINDABLE_NODE,
      data,
      BINDABLE_PROPS,
      undefined,
      undefined,
      NodeShape.trapezoid,
    );
  });

  return nodes;
};

export const getBindableServicesTopologyDataModel = async (
  _namespace: string,
  resources: TopologyDataResources,
): Promise<Model> => {
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

  return servicesDataModel;
};
