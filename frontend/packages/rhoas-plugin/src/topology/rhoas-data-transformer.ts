import { Model, NodeModel } from '@patternfly/react-topology';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { OdcNodeModel, TopologyDataResources } from '@console/topology/src/topology-types';

import { KAFKA_WIDTH, KAFKA_HEIGHT, KAFKA_PADDING } from "./components/const"
import { ManagedKafkaConnectionModel } from '../models'

export const getTopologyRhoasItem = (
  obj: K8sResourceKind
): NodeModel[] => {
  // const { kind, apiVersion } = SecretModel;
  const returnData = [];
  const managedKafka: OdcNodeModel = {
    id: "ManagedKafkaConnection" + new Date().getTime(),
    type: "ManagedKafkaConnection",
    resourceKind: ManagedKafkaConnectionModel.kind,
    group: false,
    label: obj.metadata.name || "ManagedKafkaConnection",
    children: [],
    width: KAFKA_WIDTH,
    height: KAFKA_HEIGHT,
    visible: true,
    style: {
      padding: KAFKA_PADDING,
    },
    data: {
      resources: {
        obj: null,
        buildConfigs: null,
        services: null,
        routes: null,
      },
      data: {
      },
    },
  };

  returnData.push(managedKafka);

  return returnData;
};

export const getRhoasTopologyDataModel = () => {

  return (namespace: string, resources: TopologyDataResources): Promise<Model> => {
    console.log(namespace);
    const items = getTopologyRhoasItem(undefined);
    return Promise.resolve({
      nodes: items
    });
  };
};
