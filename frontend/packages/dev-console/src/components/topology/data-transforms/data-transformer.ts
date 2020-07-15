import { EdgeModel, Model } from '@patternfly/react-topology';
import { createOverviewItemForType } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { getPipelinesAndPipelineRunsForResource } from '../../../utils/pipeline-plugin-utils';
import {
  TopologyDataResources,
  TrafficData,
  KialiNode,
  TopologyDataModelDepicted,
} from '../topology-types';
import { TYPE_APPLICATION_GROUP, TYPE_TRAFFIC_CONNECTOR, TYPE_WORKLOAD } from '../components/const';
import { WORKLOAD_TYPES } from '../topology-utils';
import {
  addToTopologyDataModel,
  createTopologyNodeData,
  getTopologyEdgeItems,
  getTopologyGroupItems,
  getTopologyNodeItem,
  mergeGroup,
  WorkloadModelProps,
} from './transform-utils';

export const getFilteredTrafficWorkload = (nodes: KialiNode[]): KialiNode[] =>
  nodes.filter(({ data }) => data.nodeType === TYPE_WORKLOAD);

export const getTrafficConnectors = (
  trafficData: TrafficData,
  resources: K8sResourceKind[],
): EdgeModel[] => {
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

const getBaseTopologyDataModel = (resources: TopologyDataResources): Model => {
  const baseDataModel: Model = {
    nodes: [],
    edges: [],
  };

  WORKLOAD_TYPES.forEach((key) => {
    if (resources?.[key]?.data?.length) {
      const typedDataModel: Model = {
        nodes: [],
        edges: [],
      };

      resources[key].data.forEach((resource) => {
        const item = createOverviewItemForType(key, resource, resources);
        if (item) {
          const pipelineData = getPipelinesAndPipelineRunsForResource(resource, resources);
          const data = createTopologyNodeData(
            resource,
            { ...item, ...pipelineData },
            TYPE_WORKLOAD,
            getImageForIconClass(`icon-openshift`),
          );
          typedDataModel.nodes.push(
            getTopologyNodeItem(resource, TYPE_WORKLOAD, data, WorkloadModelProps),
          );
          mergeGroup(getTopologyGroupItems(resource), typedDataModel.nodes);
        }
      });
      addToTopologyDataModel(typedDataModel, baseDataModel);
    }
  });

  return baseDataModel;
};

export const baseDataModelGetter = (
  model: Model,
  namespace: string,
  resources: TopologyDataResources,
  workloadResources: K8sResourceKind[],
  dataModelDepicters?: TopologyDataModelDepicted[],
  trafficData?: TrafficData,
): Model => {
  const baseModel = getBaseTopologyDataModel(resources);
  addToTopologyDataModel(baseModel, model, dataModelDepicters);

  model.nodes.forEach((n) => {
    if (n.type === TYPE_APPLICATION_GROUP) {
      // Filter out any children removed by depicters
      n.children = n.children.filter((id) => model.nodes.find((child) => child.id === id));
      n.data.groupResources =
        n.children?.map((id) => model.nodes.find((c) => id === c.id)?.data) ?? [];
    }
  });

  // Create all visual connectors
  workloadResources.forEach((dc) => {
    model.edges.push(...getTopologyEdgeItems(dc, workloadResources));
  });

  // Create traffic connectors
  if (trafficData) {
    model.edges.push(...getTrafficConnectors(trafficData, workloadResources));
  }

  return model;
};
