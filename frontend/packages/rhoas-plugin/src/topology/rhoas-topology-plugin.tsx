import { Plugin } from '@console/plugin-sdk';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
} from '@console/topology/src/extensions/topology';
import { getRhoasComponentFactory, getRhoasTopologyDataModel, getIsRhoasResource } from './index';
import { WatchK8sResources } from 'public/components/utils/k8s-watch-hook';

export type TopologyConsumedExtensions =
  | TopologyComponentFactory
  | TopologyDataModelFactory


const getRhoasWatchedResources = (namespace: string): WatchK8sResources<any> => {
  return {
    secrets: {
      isList: true,
      kind: 'Secret',
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
      isResourceDepicted: getIsRhoasResource,
    },
  }
];
