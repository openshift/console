import { INCONTEXT_ACTIONS_SERVICE_BINDING } from '@console/dev-console/src/const';
import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { Plugin, PostFormSubmissionAction } from '@console/plugin-sdk';
import { ALLOW_SERVICE_BINDING_FLAG } from '../const';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
  TopologyDisplayFilters,
  TopologyCreateConnector,
} from '../extensions/topology';
import { doContextualBinding } from '../utils/connector-utils';
import { getCreateConnector } from './actions';
import {
  getOperatorWatchedResources,
  getServiceBindingWatchedResources,
} from './operatorResources';
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
  | TopologyCreateConnector
  | TopologyDisplayFilters
  | PostFormSubmissionAction;

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
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'service-binding-topology-model-factory',
      priority: 501,
      resources: getServiceBindingWatchedResources,
    },
    flags: {
      required: [ALLOW_SERVICE_BINDING_FLAG],
    },
  },
  {
    type: 'Topology/CreateConnector',
    properties: {
      getCreateConnector: applyCodeRefSymbol(getCreateConnector),
    },
    flags: {
      required: [ALLOW_SERVICE_BINDING_FLAG],
    },
  },
  {
    type: 'Topology/DisplayFilters',
    properties: {
      getTopologyFilters: applyCodeRefSymbol(getTopologyFilters),
      applyDisplayOptions: applyCodeRefSymbol(applyDisplayOptions),
    },
  },
  {
    type: 'PostFormSubmissionAction',
    properties: {
      type: INCONTEXT_ACTIONS_SERVICE_BINDING,
      callback: doContextualBinding,
    },
    flags: {
      required: [ALLOW_SERVICE_BINDING_FLAG],
    },
  },
];
