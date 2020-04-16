import { Plugin } from '@console/plugin-sdk';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
  TopologyDisplayFilters,
} from '../../../extensions/topology';
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
      getFactory: getHelmComponentFactory,
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'helm-topology-model-factory',
      priority: 400,
      getDataModel: getHelmTopologyDataModel,
      isResourceDepicted: getIsHelmResource,
    },
  },
  {
    type: 'Topology/DisplayFilters',
    properties: {
      getTopologyFilters,
      applyDisplayOptions,
    },
  },
];
