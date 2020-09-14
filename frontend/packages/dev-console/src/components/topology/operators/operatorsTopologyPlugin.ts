import { Plugin } from '@console/plugin-sdk';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
  TopologyDisplayFilters,
  TopologyCreateConnector,
} from '../../../extensions/topology';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src';
import { ALLOW_SERVICE_BINDING } from '../../../const';
import { ServiceBindingRequestModel } from '../../../models';
import { getCreateConnector } from './actions';
import {
  getIsOperatorResource,
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
  | TopologyDisplayFilters;

const getOperatorWatchedResources = (namespace: string): WatchK8sResources<any> => {
  return {
    clusterServiceVersions: {
      isList: true,
      kind: referenceForModel(ClusterServiceVersionModel),
      namespace,
      optional: true,
    },
    serviceBindingRequests: {
      isList: true,
      kind: referenceForModel(ServiceBindingRequestModel),
      namespace,
      optional: true,
    },
  };
};

export const operatorsTopologyPlugin: Plugin<OperatorsTopologyConsumedExtensions> = [
  {
    type: 'Topology/ComponentFactory',
    properties: {
      getFactory: getOperatorsComponentFactory,
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'operator-topology-model-factory',
      priority: 500,
      getDataModel: getOperatorTopologyDataModel,
      resources: getOperatorWatchedResources,
      isResourceDepicted: getIsOperatorResource,
      getDataModelReconciler,
    },
  },
  {
    type: 'Topology/CreateConnector',
    properties: {
      getCreateConnector,
    },
    flags: {
      required: [ALLOW_SERVICE_BINDING],
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
