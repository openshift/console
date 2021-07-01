import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { Plugin } from '@console/plugin-sdk';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
  TopologyDisplayFilters,
} from '@console/topology/src/extensions/topology';
import { getHelmWatchedResources } from './helmResources';
import {
  getHelmComponentFactory,
  getHelmTopologyDataModel,
  getIsHelmResource,
  getTopologyFilters,
  applyDisplayOptions,
} from './index';

export type HelmTopologyConsumedExtensions =
  | TopologyComponentFactory
  | TopologyDataModelFactory
  | TopologyDisplayFilters;

export const helmTopologyPlugin: Plugin<HelmTopologyConsumedExtensions> = [
  {
    type: 'Topology/ComponentFactory',
    properties: {
      getFactory: applyCodeRefSymbol(getHelmComponentFactory),
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'helm-topology-model-factory',
      priority: 400,
      getDataModel: applyCodeRefSymbol(getHelmTopologyDataModel),
      resources: getHelmWatchedResources,
      isResourceDepicted: applyCodeRefSymbol(getIsHelmResource),
    },
  },
  {
    type: 'Topology/DisplayFilters',
    properties: {
      getTopologyFilters: applyCodeRefSymbol(getTopologyFilters),
      applyDisplayOptions: applyCodeRefSymbol(applyDisplayOptions),
    },
  },
];
