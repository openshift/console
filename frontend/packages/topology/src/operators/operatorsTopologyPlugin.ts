import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { Plugin } from '@console/plugin-sdk';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
  TopologyDisplayFilters,
} from '../extensions/topology';
import { getOperatorWatchedResources } from './operatorResources';
import {
  getOperatorsComponentFactory,
  getOperatorTopologyDataModel,
  getDataModelReconciler,
  getTopologyFilters,
  applyDisplayOptions,
} from './index';

export type OperatorsTopologyConsumedExtensions =
  | TopologyComponentFactory
  | TopologyDataModelFactory
  | TopologyDisplayFilters;

export const operatorsTopologyPlugin: Plugin<OperatorsTopologyConsumedExtensions> = [
  {
    type: 'Topology/ComponentFactory',
    properties: {
      getFactory: applyCodeRefSymbol(getOperatorsComponentFactory),
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'operator-topology-model-factory',
      priority: 500,
      getDataModel: applyCodeRefSymbol(getOperatorTopologyDataModel),
      resources: getOperatorWatchedResources,
      getDataModelReconciler: applyCodeRefSymbol(getDataModelReconciler),
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
