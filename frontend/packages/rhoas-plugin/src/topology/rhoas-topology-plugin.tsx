import { Plugin } from '@console/plugin-sdk';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
} from '@console/topology/src/extensions/topology';
import { getRhoasComponentFactory, getRhoasTopologyDataModel } from './index';
import { WatchK8sResources } from 'public/components/utils/k8s-watch-hook';
import { ManagedKafkaConnectionModel } from '../models';
import { referenceForModel } from '@console/internal/module/k8s';

export type TopologyConsumedExtensions =
  | TopologyComponentFactory
  | TopologyDataModelFactory


export const MANAGED_KAFKA_TOPOLOGY_TYPE = ManagedKafkaConnectionModel.kind

const getRhoasWatchedResources = (namespace: string): WatchK8sResources<any> => {
  return {
    kafkaConnections: {
      isList: true,
      kind: referenceForModel(ManagedKafkaConnectionModel),
      namespace,
      optional: true,
    },
  };
};

export const rhoasTopologyPlugin: Plugin<TopologyConsumedExtensions> = [
  {
    type: 'Topology/ComponentFactory',
    properties: {
      getFactory: getRhoasComponentFactory,
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'rhoas-topology-model-factory',
      priority: 400,
      getDataModel: getRhoasTopologyDataModel,
      resources: getRhoasWatchedResources,
      workloadKeys: ['kafkaConnections']
    },
  }
];
