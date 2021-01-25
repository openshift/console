import { Model, NodeModel } from '@patternfly/react-topology';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { OdcNodeModel, TopologyDataResources } from '@console/topology/src/topology-types';

import { KAFKA_WIDTH, KAFKA_HEIGHT, KAFKA_PADDING } from "./components/const"
import { ManagedKafkaConnectionModel } from '../models'

export const getTopologyRhoasItem = (
  objArray: K8sResourceKind[]
): NodeModel[] => {
  const returnData = [];
  for (const obj of objArray) {
    const managedKafka: OdcNodeModel = {
      id: "ManagedKafkaConnection" + obj.metadata.creationTimestamp,
      type: ManagedKafkaConnectionModel.kind,
      resourceKind: ManagedKafkaConnectionModel.kind,
      group: false,
      label: obj.metadata.name,
      children: [],
      width: KAFKA_WIDTH,
      height: KAFKA_HEIGHT,
      visible: true,
      style: {
        padding: KAFKA_PADDING,
      },
      data: {
        resource: obj
      }
    };
    returnData.push(managedKafka);
  }

  return returnData;
};

export const getRhoasTopologyDataModel = () => {

  return (namespace: string, resources: TopologyDataResources): Promise<Model> => {
    const items = getTopologyRhoasItem(resources.kafkaConnections.data);

    return Promise.resolve({
      nodes: items
    });
  };
};
