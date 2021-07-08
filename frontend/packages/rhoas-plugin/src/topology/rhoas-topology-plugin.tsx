import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { Plugin } from '@console/plugin-sdk';
import { ALLOW_SERVICE_BINDING_FLAG } from '@console/topology/src/const';
import {
  TopologyComponentFactory,
  TopologyCreateConnector,
  TopologyDataModelFactory,
} from '@console/topology/src/extensions/topology';
import { FLAG_RHOAS } from '../const';
import { getRhoasWatchedResources } from './rhoasResources';
import { getRhoasComponentFactory, getRhoasTopologyDataModel } from './index';

export type TopologyConsumedExtensions =
  | TopologyComponentFactory
  | TopologyDataModelFactory
  | TopologyCreateConnector;

export const rhoasTopologyPlugin: Plugin<TopologyConsumedExtensions> = [
  {
    type: 'Topology/ComponentFactory',
    properties: {
      getFactory: applyCodeRefSymbol(getRhoasComponentFactory),
    },
    flags: {
      required: [FLAG_RHOAS],
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'rhoas-topology-model-factory',
      priority: 400,
      getDataModel: applyCodeRefSymbol(getRhoasTopologyDataModel),
      resources: getRhoasWatchedResources,
      workloadKeys: ['kafkaConnections'],
    },
    flags: {
      required: [FLAG_RHOAS],
    },
  },
  {
    type: 'Topology/CreateConnector',
    properties: {
      getCreateConnector: applyCodeRefSymbol(() =>
        import('./createConnector' /* webpackChunkName: "rhoas-create-connector" */).then(
          (m) => m.getCreateConnector,
        ),
      ),
    },
    flags: {
      required: [ALLOW_SERVICE_BINDING_FLAG, FLAG_RHOAS],
    },
  },
];
