import * as _ from 'lodash';
import {
  K8sResourceKind,
  isGroupVersionKind,
  kindForReference,
  apiVersionForReference,
} from '@console/internal/module/k8s';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { getKnativeTopologyDataModel } from '@console/knative-plugin/src/topology/data-transformer';
import {
  getKubevirtTopologyDataModel,
  kubevirtAllowedResources,
} from '@console/kubevirt-plugin/src/topology/kubevirt-data-transformer';
import {
  TopologyDataModel,
  TopologyDataResources,
  Edge,
  TrafficData,
  KialiNode,
} from '../topology-types';
import { TYPE_TRAFFIC_CONNECTOR, TYPE_WORKLOAD } from '../components/const';
import { HelmReleaseResourcesMap } from '../../helm/helm-types';
import { allowedResources } from '../topology-utils';
import {
  addToTopologyDataModel,
  createInstanceForResource,
  createTopologyNodeData,
  getTopologyEdgeItems,
  getTopologyGroupItems,
  getTopologyNodeItem,
  mergeGroup,
} from './transform-utils';
import { getOperatorTopologyDataModel } from '../operators/operators-data-transformer';
import { getHelmTopologyDataModel } from '../helm/helm-data-transformer';

export const getFilteredTrafficWorkload = (nodes: KialiNode[]): KialiNode[] =>
  nodes.filter(({ data }) => data.nodeType === TYPE_WORKLOAD);

export const getTrafficConnectors = (
  trafficData: TrafficData,
  resources: K8sResourceKind[],
): Edge[] => {
  const filteredWorkload = getFilteredTrafficWorkload(trafficData.nodes);
  return trafficData.edges.reduce((acc, { data }) => {
    const { data: sourceTrafficNode } = filteredWorkload.find(
      (wrkld) => wrkld.data.id === data.source,
    );
    const { data: targetTrafficNode } = filteredWorkload.find(
      (wrkld) => wrkld.data.id === data.target,
    );
    const sourceResourceNode = resources.find((res) => {
      return res.metadata.name === sourceTrafficNode[sourceTrafficNode.nodeType];
    });
    const targetResourceNode = resources.find(
      (res) => res.metadata.name === targetTrafficNode[targetTrafficNode.nodeType],
    );
    return sourceResourceNode && targetResourceNode
      ? [
          ...acc,
          {
            id: `${sourceResourceNode.metadata.uid}_${targetResourceNode.metadata.uid}`,
            type: TYPE_TRAFFIC_CONNECTOR,
            source: sourceResourceNode.metadata.uid,
            target: targetResourceNode.metadata.uid,
            data: data.traffic,
          },
        ]
      : acc;
  }, []);
};

const getBaseTopologyDataModel = (
  resources: TopologyDataResources,
  allResources: K8sResourceKind[],
  installedOperators,
  utils: Function[],
  transformBy: string[],
  serviceBindingRequests: K8sResourceKind[],
): TopologyDataModel => {
  const baseDataModel: TopologyDataModel = {
    graph: { nodes: [], edges: [], groups: [] },
    topology: {},
  };
  const transformResourceData = createInstanceForResource(resources, utils, installedOperators);

  _.forEach(transformBy, (key) => {
    if (!_.isEmpty(resources[key].data)) {
      const typedDataModel: TopologyDataModel = {
        graph: { nodes: [], edges: [], groups: [] },
        topology: {},
      };

      transformResourceData[key](resources[key].data).forEach((item) => {
        const { obj: deploymentConfig } = item;
        const uid = _.get(deploymentConfig, ['metadata', 'uid']);
        typedDataModel.topology[uid] = createTopologyNodeData(
          item,
          TYPE_WORKLOAD,
          getImageForIconClass(`icon-openshift`),
        );
        typedDataModel.graph.nodes.push(getTopologyNodeItem(deploymentConfig, TYPE_WORKLOAD));
        typedDataModel.graph.edges.push(
          ...getTopologyEdgeItems(deploymentConfig, allResources, serviceBindingRequests),
        );
        mergeGroup(getTopologyGroupItems(deploymentConfig), typedDataModel.graph.groups);
      });
      addToTopologyDataModel(typedDataModel, baseDataModel);
    }
  });
  return baseDataModel;
};

/**
 * Tranforms the k8s resources objects into topology data
 */
export const transformTopologyData = (
  resources: TopologyDataResources,
  transformBy: string[],
  utils?: Function[],
  trafficData?: TrafficData,
  helmResourcesMap?: HelmReleaseResourcesMap,
): TopologyDataModel => {
  const installedOperators = _.get(resources, 'clusterServiceVersions.data');
  const serviceBindingRequests = _.get(resources, 'serviceBindingRequests.data');
  const topologyGraphAndNodeData: TopologyDataModel = {
    graph: { nodes: [], edges: [], groups: [] },
    topology: {},
  };
  // TODO: plugin
  const allResourceTypes = [...allowedResources, ...kubevirtAllowedResources];
  const allResourcesList = _.flatten(
    allResourceTypes.map((resourceKind) => {
      return resources[resourceKind]
        ? resources[resourceKind].data.map((res) => {
            const resKind = resources[resourceKind].kind;
            let kind = resKind;
            let apiVersion;
            if (resKind && isGroupVersionKind(resKind)) {
              kind = kindForReference(resKind);
              apiVersion = apiVersionForReference(resKind);
            }
            return {
              kind,
              apiVersion,
              ...res,
            };
          })
        : [];
    }),
  );
  if (trafficData) {
    topologyGraphAndNodeData.graph.edges = getTrafficConnectors(trafficData, allResourcesList);
  }

  // TODO: plugins
  const knativeModel = getKnativeTopologyDataModel(
    resources,
    allResourcesList,
    installedOperators,
    utils,
  );
  addToTopologyDataModel(knativeModel, topologyGraphAndNodeData);

  const operatorsModel = getOperatorTopologyDataModel(
    resources,
    allResourcesList,
    installedOperators,
    utils,
    transformBy,
    serviceBindingRequests,
  );
  addToTopologyDataModel(operatorsModel, topologyGraphAndNodeData);

  const helmModel = getHelmTopologyDataModel(
    resources,
    allResourcesList,
    installedOperators,
    utils,
    transformBy,
    serviceBindingRequests,
    helmResourcesMap,
  );
  addToTopologyDataModel(helmModel, topologyGraphAndNodeData);

  const vmsModel = getKubevirtTopologyDataModel(
    resources,
    allResourcesList,
    installedOperators,
    utils,
    transformBy,
    serviceBindingRequests,
  );
  addToTopologyDataModel(vmsModel, topologyGraphAndNodeData);

  const baseModel = getBaseTopologyDataModel(
    resources,
    allResourcesList,
    installedOperators,
    utils,
    transformBy,
    serviceBindingRequests,
  );
  addToTopologyDataModel(baseModel, topologyGraphAndNodeData);

  return topologyGraphAndNodeData;
};
