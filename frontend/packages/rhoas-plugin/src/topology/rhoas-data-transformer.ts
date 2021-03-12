import { Model, NodeModel } from '@patternfly/react-topology';
import { apiVersionForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { getTopologyNodeItem } from '@console/topology/src/data-transforms/transform-utils';
import { OverviewItem } from '@console/shared/src';
import { TopologyDataObject, TopologyDataResources } from '@console/topology/src/topology-types';
import { KAFKA_WIDTH, KAFKA_HEIGHT, KAFKA_PADDING } from './components/const';
import { MANAGED_KAFKA_TOPOLOGY_TYPE } from './const';
import { KafkaConnectionModel } from '../models';

const KAFKA_PROPS = {
  width: KAFKA_WIDTH,
  height: KAFKA_HEIGHT,
  group: false,
  visible: true,
  style: {
    padding: KAFKA_PADDING,
  },
};

export const createOverviewItem = (obj: K8sResourceKind): OverviewItem<K8sResourceKind> => {
  if (!obj.apiVersion) {
    obj.apiVersion = apiVersionForModel(KafkaConnectionModel);
  }
  if (!obj.kind) {
    obj.kind = KafkaConnectionModel.kind;
  }

  return {
    isOperatorBackedService: true,
    obj,
  };
};

export const getTopologyRhoasNodes = (kafkaConnections: K8sResourceKind[]): NodeModel[] => {
  const nodes = [];
  for (const obj of kafkaConnections) {
    const data: TopologyDataObject = {
      id: obj.metadata.uid,
      name: obj.metadata.name,
      type: MANAGED_KAFKA_TOPOLOGY_TYPE,
      resource: obj,
      // resources is poorly named, should be overviewItem, eventually going away.
      resources: createOverviewItem(obj),
      data: {
        resource: obj,
      },
    };
    nodes.push(getTopologyNodeItem(obj, MANAGED_KAFKA_TOPOLOGY_TYPE, data, KAFKA_PROPS));
  }

  return nodes;
};

export const getRhoasTopologyDataModel = () => (
  namespace: string,
  resources: TopologyDataResources,
): Promise<Model> =>
  Promise.resolve({
    nodes: getTopologyRhoasNodes(resources.kafkaConnections.data),
  });
