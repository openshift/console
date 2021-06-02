import { EdgeModel, Model, NodeModel } from '@patternfly/react-topology';
import { apiVersionForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { OverviewItem } from '@console/shared/src';
import { TYPE_SERVICE_BINDING } from '@console/topology/src/const';
import { getTopologyNodeItem } from '@console/topology/src/data-transforms/transform-utils';
import { edgesFromServiceBinding } from '@console/topology/src/operators/operators-data-transformer';
import { TopologyDataObject, TopologyDataResources } from '@console/topology/src/topology-types';
import { KafkaConnectionModel } from '../models';
import {
  KAFKA_WIDTH,
  KAFKA_HEIGHT,
  KAFKA_PADDING,
  TYPE_MANAGED_KAFKA_CONNECTION,
} from './components/const';

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
      type: TYPE_MANAGED_KAFKA_CONNECTION,
      resource: obj,
      // resources is poorly named, should be overviewItem, eventually going away.
      resources: createOverviewItem(obj),
      data: {
        resource: obj,
      },
    };
    nodes.push(getTopologyNodeItem(obj, TYPE_MANAGED_KAFKA_CONNECTION, data, KAFKA_PROPS));
  }

  return nodes;
};

export const getRhoasServiceBindingEdges = (
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
export const getRhoasTopologyDataModel = () => (
  namespace: string,
  resources: TopologyDataResources,
  workloads: K8sResourceKind[],
): Promise<Model> => {
  const serviceBindingRequests = resources?.serviceBindingRequests?.data;
  const rhoasDataModel: Model = {
    nodes: getTopologyRhoasNodes(resources.kafkaConnections.data),
    edges: [],
  };
  if (rhoasDataModel.nodes?.length) {
    workloads.forEach((dc) => {
      rhoasDataModel.edges.push(
        ...getRhoasServiceBindingEdges(dc, rhoasDataModel.nodes, serviceBindingRequests),
      );
    });
  }
  return Promise.resolve(rhoasDataModel);
};
